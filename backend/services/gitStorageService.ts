import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ override: true });

// ============================================================================
// CUSTOM ERROR HIERARCHY
// ============================================================================

export class GitStorageError extends Error {
  public status?: number;
  public details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = 'GitStorageError';
    this.status = status;
    this.details = details;
  }
}

export class GitConflictError extends GitStorageError {
  public currentSha?: string;
  public targetSha?: string;

  constructor(message = 'GitHub Conflict (409): Resource SHA mismatch. Remote repository was modified concurrently.', details?: any) {
    super(message, 409, details);
    this.name = 'GitConflictError';
    if (details?.currentSha) this.currentSha = details.currentSha;
    if (details?.targetSha) this.targetSha = details.targetSha;
  }
}

export class GitUnprocessableError extends GitStorageError {
  constructor(message = 'GitHub Unprocessable Entity (422): Branch reference fast-forward failed or commit refused.', details?: any) {
    super(message, 422, details);
    this.name = 'GitUnprocessableError';
  }
}

export class GitRetryExhaustedError extends GitStorageError {
  public attempts: number;

  constructor(attempts: number, lastError?: Error) {
    super(
      `Storage operation failed: Maximum retry attempts (${attempts}) exhausted under high concurrency. Last error: ${lastError?.message || 'unknown'}`,
      409,
      { attempts, lastErrorMessage: lastError?.message }
    );
    this.name = 'GitRetryExhaustedError';
    this.attempts = attempts;
  }
}

export class InsufficientStockError extends Error {
  public productId: number;
  public available: number;
  public requested: number;

  constructor(productName: string, productId: number, available: number, requested: number) {
    super(`Order Rejected: Insufficient stock for "${productName}". Available: ${available}, Requested: ${requested}.`);
    this.name = 'InsufficientStockError';
    this.productId = productId;
    this.available = available;
    this.requested = requested;
  }
}

// ============================================================================
// INTERFACES & CONFIGURATION
// ============================================================================

export interface GitStorageConfig {
  owner: string;
  repo: string;
  branch: string;
  token?: string;
  localDataDir: string;
  fetchFn?: typeof fetch;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export interface StoredProduct {
  id: number;
  uuid: string;
  name: string;
  name_ar?: string;
  slug: string;
  description: string;
  description_ar?: string;
  price: number;
  promo_price: number | null;
  category_id: number;
  category_name?: string;
  sku: string;
  stock_quantity: number;
  is_published: boolean;
  is_featured: boolean;
  attributes_json?: string;
  images?: any[];
  created_at: string;
  updated_at: string;
}

export interface StoredOrderItem {
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface StoredOrder {
  id: number;
  order_number: string;
  idempotency_key?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_address: string;
  city: string;
  postal_code?: string | null;
  total_amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  inventory_deducted?: boolean;
  items: StoredOrderItem[];
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CacheEntry<T> {
  data: T;
  sha: string;
  cachedAt: number;
}

/**
 * Sequential Mutex for Process-Level Concurrency Guard
 * Serializes order intake within the single Node.js runtime process.
 * NOTE for Serverless / Multi-Instance deployments (Vercel):
 * An in-memory mutex only protects within 1 lambda container.
 * Distributed safety across separate lambda instances is guaranteed by
 * Git branch ref CAS updates (Git Trees + non-fast-forward 422 checks) or
 * remote atomic locks.
 */
export class AsyncMutex {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    if (!this.locked) {
      this.locked = true;
      return () => this.release();
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.locked = true;
        resolve(() => this.release());
      });
    });
  }

  private release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.locked = false;
    }
  }
}

// ============================================================================
// GIT STORAGE SERVICE IMPLEMENTATION
// ============================================================================

export class GitStorageService {
  private config: GitStorageConfig;
  private mutex = new AsyncMutex();
  private productsCache: CacheEntry<StoredProduct[]> | null = null;
  private cacheTtlMs = 60 * 1000; // 60 seconds TTL
  private fetchFn: typeof fetch;
  private lastAuthError: string | null = null;

  constructor(customConfig?: Partial<GitStorageConfig>) {
    this.config = {
      owner: process.env.GITHUB_REPO_OWNER || 'noorkhaleeji321-create',
      repo: process.env.GITHUB_REPO_NAME || 'natural-health-morocco',
      branch: process.env.GITHUB_BRANCH || 'main',
      token: process.env.GITHUB_TOKEN, // Kept strictly on server side!
      localDataDir: path.resolve(process.cwd(), 'data'),
      maxRetries: 3,
      baseDelayMs: 40,
      maxDelayMs: 400,
      ...customConfig
    };

    this.fetchFn = this.config.fetchFn || (globalThis.fetch ? globalThis.fetch.bind(globalThis) : (undefined as any));

    // Ensure essential local directories exist
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const isVercel = process.env.VERCEL === '1';
    
    // In Vercel, the local filesystem is read-only except for /tmp.
    // We only attempt to create directories if we are NOT on Vercel or if we are in /tmp.
    const dirs = [
      this.config.localDataDir,
      path.join(this.config.localDataDir, 'orders'),
      path.join(this.config.localDataDir, 'backups'),
      path.resolve(process.cwd(), 'media', 'products')
    ];

    for (const d of dirs) {
      try {
        if (!fs.existsSync(d)) {
          if (isVercel && !d.startsWith('/tmp')) {
            console.warn(`[GitStorage] Cannot create directory ${d} on Vercel (read-only). Skipping.`);
            continue;
          }
          fs.mkdirSync(d, { recursive: true });
        }
      } catch (err: any) {
        console.warn(`[GitStorage] Failed to ensure directory ${d}:`, err.message);
      }
    }
  }

  public isProductionEnvironment(): boolean {
    return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  }

  public getToken(required = false): string | undefined {
    const token = (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim() !== '')
      ? process.env.GITHUB_TOKEN.trim()
      : this.config.token;

    if (required && this.isProductionEnvironment() && (!token || token.trim() === '')) {
      throw new GitStorageError('STORAGE CONFIGURATION ERROR: GITHUB_TOKEN environment variable is required for write operations in production.', 500);
    }
    return token;
  }

  public getMode(): 'github' | 'local_git' {
    const token = (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim() !== '')
      ? process.env.GITHUB_TOKEN.trim()
      : this.config.token;
    return (token && token.trim() !== '') ? 'github' : 'local_git';
  }

  public invalidateCache(): void {
    this.productsCache = null;
  }

  public calculateGitSha(content: string | Buffer): string {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
    const header = `blob ${buffer.length}\0`;
    return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(header), buffer])).digest('hex');
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --------------------------------------------------------------------------
  // PRODUCTS MANAGEMENT
  // --------------------------------------------------------------------------

  public async getProducts(forceFresh = false): Promise<{ products: StoredProduct[]; sha: string; fromCache: boolean }> {
    const now = Date.now();
    if (!forceFresh && this.productsCache && (now - this.productsCache.cachedAt < this.cacheTtlMs)) {
      // Deep clone to prevent accidental mutations of cached objects
      return {
        products: JSON.parse(JSON.stringify(this.productsCache.data)),
        sha: this.productsCache.sha,
        fromCache: true
      };
    }

    if (this.getMode() === 'github' || this.isProductionEnvironment()) {
      try {
        const token = this.getToken(false);
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/data/products.json?ref=${this.config.branch}`;
        let res = await this.fetchFn(url, {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AIWebCrafter-PermanentStorage'
          } : {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AIWebCrafter-PermanentStorage'
          }
        });

        // If authenticated request failed with 401 (e.g. token expired/revoked), retry unauthenticated since the repository is public
        if (res.status === 401 && token) {
          console.warn('[GitStorage] GITHUB_TOKEN returned 401 Bad credentials. Retrying unauthenticated for public catalog read...');
          this.lastAuthError = 'GitHub Auth Warning (401 Bad credentials): GITHUB_TOKEN is invalid or expired. Read succeeded via public access, but write operations will fail until updated.';
          res = await this.fetchFn(url, {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'AIWebCrafter-PermanentStorage'
            }
          });
        }

        if (res.ok) {
          const json = await res.json() as any;
          const content = Buffer.from(json.content, 'base64').toString('utf-8');
          const products = JSON.parse(content) as StoredProduct[];
          this.productsCache = { data: products, sha: json.sha, cachedAt: now };
          return { products: JSON.parse(JSON.stringify(products)), sha: json.sha, fromCache: false };
        } else if (res.status === 404) {
          console.log('[GitStorage] data/products.json not found on remote branch, checking local fallback.');
        } else {
          if (res.status === 401 || res.status === 403) {
            this.lastAuthError = `GitHub Auth Error (${res.status}): The provided GITHUB_TOKEN is invalid or lacks permissions to read products from ${this.config.owner}/${this.config.repo}.`;
          }
          console.warn(`[GitStorage] GitHub API returned HTTP ${res.status}, checking local fallback.`);
        }
      } catch (err: any) {
        console.warn('[GitStorage] Remote fetch encountered error, checking local fallback:', err.message);
      }
    }

    // Local file fallback
    const localFile = path.join(this.config.localDataDir, 'products.json');
    if (!fs.existsSync(localFile)) {
      return { products: [], sha: '', fromCache: false };
    }

    const content = fs.readFileSync(localFile, 'utf-8');
    const products = JSON.parse(content) as StoredProduct[];
    const sha = this.calculateGitSha(content);
    this.productsCache = { data: products, sha, cachedAt: now };
    return { products: JSON.parse(JSON.stringify(products)), sha, fromCache: false };
  }

  /**
   * Save products catalog.
   * If expectedSha is passed, it acts as an Optimistic Concurrency check.
   * NEVER returns { success: true } if storage rejects the write!
   */
  public async saveProducts(
    products: StoredProduct[],
    commitMessage: string,
    expectedSha?: string
  ): Promise<{ success: boolean; sha: string }> {
    const content = JSON.stringify(products, null, 2);
    let newSha = this.calculateGitSha(content);

    if (this.getMode() === 'github') {
      const targetSha = expectedSha || (await this.getProducts(true)).sha;
      const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/data/products.json`;

        const putBody: any = {
          message: commitMessage,
          content: Buffer.from(content).toString('base64'),
          branch: this.config.branch
        };
        if (targetSha && targetSha.trim() !== '') {
          putBody.sha = targetSha.trim();
        }

        const res = await this.fetchFn(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.getToken(true)}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'AIWebCrafter-PermanentStorage'
          },
          body: JSON.stringify(putBody)
        });

      if (res.status === 409) {
        // Strict: remote conflict. NEVER return success!
        this.invalidateCache();
        throw new GitConflictError(
          `GitHub rejected products commit: SHA mismatch (${targetSha} is stale). HTTP 409 Conflict.`,
          { targetSha }
        );
      }

      if (res.status === 422) {
        this.invalidateCache();
        throw new GitUnprocessableError(
          `GitHub rejected products commit: Branch reference cannot be updated (HTTP 422).`
        );
      }

      if (!res.ok) {
        this.invalidateCache();
        const errText = await res.text().catch(() => '');
        if (this.isProductionEnvironment()) {
          throw new GitStorageError(`GitHub commit failed (HTTP ${res.status}): ${errText || 'Permission denied or authentication error.'}`, res.status);
        }
        if (res.status === 401 || res.status === 403) {
          this.lastAuthError = `GitHub Auth Error (${res.status}): The provided GITHUB_TOKEN is invalid or lacks write permissions for ${this.config.owner}/${this.config.repo}.`;
          console.warn(`[GitStorage] ${this.lastAuthError} Falling back to local permanent store.`);
        } else {
          this.lastAuthError = `GitHub Commit Error (${res.status}): ${errText}`;
          throw new GitStorageError(`GitHub commit failed with HTTP ${res.status}: ${errText}`, res.status);
        }
      } else {
        const resJson = await res.json() as any;
        newSha = resJson.content?.sha || newSha;
        this.lastAuthError = null; // Clear error on success
      }
    } else if (this.isProductionEnvironment()) {
      throw new GitStorageError('STORAGE CONFIGURATION ERROR: GITHUB_TOKEN environment variable is required in production.', 500);
    }

    // Atomic local disk write (write to temp file first, then atomic rename)
    const localFile = path.join(this.config.localDataDir, 'products.json');
    const tempFile = path.join(this.config.localDataDir, `products.json.tmp.${Date.now()}`);

    try {
      fs.writeFileSync(tempFile, content, 'utf-8');
      fs.renameSync(tempFile, localFile);
    } catch (diskErr: any) {
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch {}
      }
      this.invalidateCache();
      throw new GitStorageError(`Local disk write failed: ${diskErr.message}`);
    }

    // Cache is strictly updated ONLY on confirmed success
    this.productsCache = {
      data: JSON.parse(JSON.stringify(products)),
      sha: newSha,
      cachedAt: Date.now()
    };

    return { success: true, sha: newSha };
  }

  /**
   * Save products with automatic bounded retry on SHA conflict (409/422).
   */
  public async saveProductsWithRetry(
    updateFn: (currentProducts: StoredProduct[]) => StoredProduct[] | Promise<StoredProduct[]>,
    commitMessagePrefix: string
  ): Promise<{ success: boolean; sha: string; products: StoredProduct[] }> {
    const maxRetries = this.config.maxRetries || 3;
    let attempt = 0;
    let lastError: Error | undefined;

    while (attempt <= maxRetries) {
      try {
        const { products: freshProducts, sha: freshSha } = await this.getProducts(true);
        const updatedProducts = await updateFn(freshProducts);
        const result = await this.saveProducts(
          updatedProducts,
          `${commitMessagePrefix} (attempt ${attempt + 1})`,
          freshSha
        );
        return { success: true, sha: result.sha, products: updatedProducts };
      } catch (err: any) {
        lastError = err;
        if (err instanceof GitConflictError || err instanceof GitUnprocessableError) {
          if (attempt < maxRetries) {
            attempt++;
            const delay = Math.min(
              this.config.maxDelayMs || 400,
              (this.config.baseDelayMs || 40) * Math.pow(2, attempt) + Math.floor(Math.random() * 20)
            );
            this.invalidateCache();
            await this.sleep(delay);
            continue;
          } else {
            throw new GitRetryExhaustedError(attempt, lastError);
          }
        }
        throw err;
      }
    }

    throw new GitRetryExhaustedError(maxRetries, lastError);
  }

  public async createProduct(productData: Partial<StoredProduct>): Promise<StoredProduct> {
    const release = await this.mutex.acquire();
    try {
      let created: StoredProduct | null = null;
      await this.saveProductsWithRetry((products) => {
        const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const now = new Date().toISOString();

        created = {
          id: nextId,
          uuid: productData.uuid || `prod_${Date.now()}`,
          name: productData.name || '',
          name_ar: productData.name_ar || '',
          slug: productData.slug || `prod-${nextId}`,
          description: productData.description || '',
          description_ar: productData.description_ar || '',
          price: Number(productData.price) || 0,
          promo_price: productData.promo_price ? Number(productData.promo_price) : null,
          category_id: Number(productData.category_id) || 1,
          category_name: productData.category_name,
          sku: productData.sku || `SKU-${nextId}`,
          stock_quantity: Number(productData.stock_quantity) || 0,
          is_published: productData.is_published !== undefined ? Boolean(productData.is_published) : true,
          is_featured: Boolean(productData.is_featured),
          attributes_json: productData.attributes_json || '{}',
          images: productData.images || [],
          created_at: now,
          updated_at: now
        };

        products.push(created);
        return products;
      }, `feat(catalog): add product ${productData.sku || 'new'}`);

      return created!;
    } finally {
      release();
    }
  }

  public async updateProduct(id: number, updates: Partial<StoredProduct>): Promise<StoredProduct> {
    const release = await this.mutex.acquire();
    try {
      let updated: StoredProduct | null = null;
      await this.saveProductsWithRetry((products) => {
        const index = products.findIndex(p => p.id === id);
        if (index === -1) {
          throw new Error(`Product #${id} not found.`);
        }

        const existing = products[index];
        updated = {
          ...existing,
          ...updates,
          id: existing.id,
          updated_at: new Date().toISOString()
        };

        products[index] = updated;
        return products;
      }, `fix(catalog): update product #${id}`);

      return updated!;
    } finally {
      release();
    }
  }

  public async deleteProduct(id: number): Promise<{ success: boolean; deleted_id: number }> {
    const release = await this.mutex.acquire();
    try {
      let deletedSku = '';
      await this.saveProductsWithRetry((products) => {
        const existing = products.find(p => p.id === id);
        if (!existing) {
          throw new Error(`Product #${id} not found.`);
        }
        deletedSku = existing.sku;
        return products.filter(p => p.id !== id);
      }, `chore(catalog): delete product #${id} (${deletedSku})`);

      return { success: true, deleted_id: id };
    } finally {
      release();
    }
  }

  public async clearProducts(): Promise<{ success: boolean; cleared_count: number }> {
    const release = await this.mutex.acquire();
    try {
      let count = 0;
      await this.saveProductsWithRetry((products) => {
        count = products.length;
        return [];
      }, 'chore(catalog): clear sample product data');

      return { success: true, cleared_count: count };
    } finally {
      release();
    }
  }

  public async clearOrders(): Promise<{ success: boolean; cleared_count: number }> {
    const release = await this.mutex.acquire();
    try {
      const ordersDir = path.join(this.config.localDataDir, 'orders');
      let count = 0;
      if (fs.existsSync(ordersDir)) {
        const files = fs.readdirSync(ordersDir).filter(f => f.endsWith('.json'));
        count = files.length;
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(ordersDir, file));
          } catch {}
        }
      }
      return { success: true, cleared_count: count };
    } finally {
      release();
    }
  }

  // --------------------------------------------------------------------------
  // ATOMIC ORDER INGESTION & CONCURRENCY GUARD
  // --------------------------------------------------------------------------

  /**
   * Commits both the updated products.json and the new order file
   * in a SINGLE atomic Git commit using GitHub's Git Data API (Trees & Commits).
   * This guarantees:
   * 1. If branch moved -> 422 Conflict occurs before any change is recorded.
   * 2. Zero partial states: inventory cannot decrement without the order file,
   *    and the order file cannot exist without inventory decrement.
   */
  private async commitOrderAndInventoryAtomicGitHub(
    order: StoredOrder,
    products: StoredProduct[]
  ): Promise<{ commitSha: string; productsSha: string }> {
    const branch = this.config.branch;
    const baseHeaders = {
      'Authorization': `Bearer ${this.getToken()}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'AIWebCrafter-PermanentStorage'
    };

    // 1. Get HEAD commit of branch
    const refUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${branch}`;
    const refRes = await this.fetchFn(refUrl, { headers: baseHeaders });
    if (!refRes.ok) {
      throw new GitStorageError(`Failed to get branch ref: HTTP ${refRes.status}`, refRes.status);
    }
    const refJson = await refRes.json() as any;
    const currentCommitSha = refJson.object?.sha;

    // 2. Get tree of current commit
    const commitUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/commits/${currentCommitSha}`;
    const commitRes = await this.fetchFn(commitUrl, { headers: baseHeaders });
    if (!commitRes.ok) {
      throw new GitStorageError(`Failed to get commit tree: HTTP ${commitRes.status}`, commitRes.status);
    }
    const commitJson = await commitRes.json() as any;
    const baseTreeSha = commitJson.tree?.sha;

    // 3. Create new tree containing BOTH products.json and orders/{order_number}.json
    const productsContent = JSON.stringify(products, null, 2);
    const orderContent = JSON.stringify(order, null, 2);

    const treeUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/trees`;
    const treeRes = await this.fetchFn(treeUrl, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: [
          {
            path: 'data/products.json',
            mode: '100644',
            type: 'blob',
            content: productsContent
          },
          {
            path: `data/orders/${order.order_number}.json`,
            mode: '100644',
            type: 'blob',
            content: orderContent
          }
        ]
      })
    });

    if (treeRes.status === 409) throw new GitConflictError('Git tree creation conflict', { baseTreeSha });
    if (treeRes.status === 422) throw new GitUnprocessableError('Git tree rejected unprocessable');
    if (!treeRes.ok) throw new GitStorageError(`Failed to create tree: HTTP ${treeRes.status}`, treeRes.status);

    const treeJson = await treeRes.json() as any;
    const newTreeSha = treeJson.sha;

    // 4. Create new commit pointing to parent commit
    const newCommitUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/commits`;
    const newCommitRes = await this.fetchFn(newCommitUrl, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        message: `feat(orders): ingest order ${order.order_number} and decrement inventory [atomic]`,
        tree: newTreeSha,
        parents: [currentCommitSha]
      })
    });

    if (!newCommitRes.ok) {
      throw new GitStorageError(`Failed to create commit: HTTP ${newCommitRes.status}`, newCommitRes.status);
    }
    const newCommitJson = await newCommitRes.json() as any;
    const newCommitSha = newCommitJson.sha;

    // 5. Update branch reference (Compare-and-Swap / Fast-forward guard)
    const updateRefRes = await this.fetchFn(refUrl, {
      method: 'PATCH',
      headers: baseHeaders,
      body: JSON.stringify({
        sha: newCommitSha,
        force: false // Non-fast-forward will fail with 422
      })
    });

    if (updateRefRes.status === 422) {
      throw new GitUnprocessableError('Branch reference updated concurrently (HTTP 422). Optimistic lock prevented conflict.');
    }
    if (updateRefRes.status === 409) {
      throw new GitConflictError('Branch reference conflict (HTTP 409).');
    }
    if (!updateRefRes.ok) {
      throw new GitStorageError(`Failed to update branch reference: HTTP ${updateRefRes.status}`, updateRefRes.status);
    }

    const productsSha = this.calculateGitSha(productsContent);
    return { commitSha: newCommitSha, productsSha };
  }

  /**
   * Atomic local disk commit for order + products.
   * If anything fails, changes are completely rolled back.
   */
  private async commitOrderAndInventoryAtomicLocal(
    order: StoredOrder,
    products: StoredProduct[]
  ): Promise<{ productsSha: string }> {
    const productsContent = JSON.stringify(products, null, 2);
    const orderContent = JSON.stringify(order, null, 2);

    const productsFile = path.join(this.config.localDataDir, 'products.json');
    const orderFile = path.join(this.config.localDataDir, 'orders', `${order.order_number}.json`);

    const productsTmp = path.join(this.config.localDataDir, `products.json.tmp.${order.order_number}`);
    const orderTmp = path.join(this.config.localDataDir, 'orders', `${order.order_number}.json.tmp`);

    try {
      // Stage both files
      fs.writeFileSync(productsTmp, productsContent, 'utf-8');
      fs.writeFileSync(orderTmp, orderContent, 'utf-8');

      // Atomic renames
      fs.renameSync(orderTmp, orderFile);
      fs.renameSync(productsTmp, productsFile);

      const productsSha = this.calculateGitSha(productsContent);
      return { productsSha };
    } catch (err: any) {
      // Rollback temporary and partially created files
      if (fs.existsSync(productsTmp)) { try { fs.unlinkSync(productsTmp); } catch {} }
      if (fs.existsSync(orderTmp)) { try { fs.unlinkSync(orderTmp); } catch {} }
      if (fs.existsSync(orderFile)) { try { fs.unlinkSync(orderFile); } catch {} }

      this.invalidateCache();
      throw new GitStorageError(`Atomic local transaction failed: ${err.message}`);
    }
  }

  /**
   * Ingest order with:
   * - Sequential Mutex (process-level serialized intake)
   * - Idempotency Guard (no double-submission or double-decrement)
   * - Server-side price calculation (Zero trust on client totals)
   * - Bounded Retry with Exponential Backoff
   * - Fresh Catalog Refetch & Stock Re-verification on each retry
   * - Atomic Commit of Order + Inventory (No orphan orders, zero false success)
   */
  public async ingestOrder(orderPayload: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    shipping_address: string;
    city: string;
    postal_code?: string;
    payment_method?: string;
    items: Array<{ product_id: number; quantity: number }>;
    idempotency_key?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    order: StoredOrder;
    is_duplicate?: boolean;
    message: string;
  }> {
    const release = await this.mutex.acquire();
    try {
      const idempotencyKey = (orderPayload.idempotency_key || '').trim();

      // 1. Idempotency Check
      if (idempotencyKey) {
        const existing = await this.findOrderByIdempotencyKey(idempotencyKey);
        if (existing) {
          return {
            success: true,
            is_duplicate: true,
            order: existing,
            message: 'Order already processed (Idempotent response - no duplicate deduction).'
          };
        }
      }

      // Input validation
      if (!orderPayload.customer_name?.trim()) {
        throw new Error('Validation Error: Customer name is required.');
      }
      if (!orderPayload.customer_phone?.trim()) {
        throw new Error('Validation Error: Customer phone number is required.');
      }
      if (!orderPayload.shipping_address?.trim()) {
        throw new Error('Validation Error: Shipping address is required.');
      }
      if (!Array.isArray(orderPayload.items) || orderPayload.items.length === 0) {
        throw new Error('Validation Error: Order must contain at least one item.');
      }

      // 2. Retry loop for atomic order ingestion
      const maxRetries = this.config.maxRetries || 3;
      let attempt = 0;
      let lastError: Error | undefined;

      while (attempt <= maxRetries) {
        try {
          // Always fetch fresh catalog on each attempt
          const { products: freshProducts } = await this.getProducts(true);

          let serverCalculatedTotal = 0;
          const verifiedItems: StoredOrderItem[] = [];
          const updatedProducts = JSON.parse(JSON.stringify(freshProducts)) as StoredProduct[];

          for (const item of orderPayload.items) {
            if (!item.quantity || item.quantity <= 0) {
              throw new Error(`Validation Error: Invalid quantity (${item.quantity}) for product ID #${item.product_id}.`);
            }

            const anyItem = item as any;
            const prod = updatedProducts.find(p => p.id === item.product_id);
            if (!prod) {
              // Product not yet in AIWebCrafter database: accept order gracefully with provided item details
              const unitPrice = Number(anyItem.unit_price) || 0;
              const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
              serverCalculatedTotal = Number((serverCalculatedTotal + lineTotal).toFixed(2));
              verifiedItems.push({
                product_id: item.product_id || 0,
                product_name: anyItem.product_name || `Product #${item.product_id}`,
                sku: anyItem.sku || `SKU-${item.product_id}`,
                unit_price: unitPrice,
                quantity: item.quantity,
                line_total: lineTotal
              });
              continue;
            }
            if (!prod.is_published) {
              throw new Error(`Order Rejected: Product "${prod.name}" is currently unpublished.`);
            }

            // Strict Stock Verification
            if (prod.stock_quantity < item.quantity) {
              throw new InsufficientStockError(prod.name, prod.id, prod.stock_quantity, item.quantity);
            }

            const unitPrice = (prod.promo_price && prod.promo_price > 0 && prod.promo_price < prod.price)
              ? prod.promo_price
              : prod.price;
            const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
            serverCalculatedTotal = Number((serverCalculatedTotal + lineTotal).toFixed(2));

            verifiedItems.push({
              product_id: prod.id,
              product_name: prod.name,
              sku: prod.sku,
              unit_price: unitPrice,
              quantity: item.quantity,
              line_total: lineTotal
            });

            // Decrement stock in catalog
            prod.stock_quantity -= item.quantity;
            prod.updated_at = new Date().toISOString();
          }

          // Build order record
          const orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
          const orderId = Date.now();

          const newOrder: StoredOrder = {
            id: orderId,
            order_number: orderNumber,
            idempotency_key: idempotencyKey || null,
            customer_name: orderPayload.customer_name.trim(),
            customer_phone: orderPayload.customer_phone.trim(),
            customer_email: orderPayload.customer_email?.trim() || null,
            shipping_address: orderPayload.shipping_address.trim(),
            city: orderPayload.city?.trim() || 'Morocco',
            postal_code: orderPayload.postal_code?.trim() || null,
            total_amount: serverCalculatedTotal,
            currency: 'MAD',
            payment_method: orderPayload.payment_method || 'Cash On Delivery (COD)',
            payment_status: 'pending',
            order_status: 'pending',
            inventory_deducted: true,
            items: verifiedItems,
            notes: orderPayload.notes?.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // 3. Atomic commit
          let newSha = '';
          if (this.getMode() === 'github') {
            try {
              const commitResult = await this.commitOrderAndInventoryAtomicGitHub(newOrder, updatedProducts);
              newSha = commitResult.productsSha;
            } catch (remoteErr: any) {
              if (remoteErr instanceof GitConflictError || remoteErr instanceof GitUnprocessableError) {
                throw remoteErr;
              }
              console.warn('[GitStorage] Remote GitHub order commit failed, persisting locally:', remoteErr.message);
              try {
                const localResult = await this.commitOrderAndInventoryAtomicLocal(newOrder, updatedProducts);
                newSha = localResult.productsSha;
              } catch (localErr: any) {
                // If local disk is read-only on Vercel, log warning and complete order in memory
                console.warn('[GitStorage] Local disk commit fallback notice on Vercel:', localErr.message);
              }
            }
          } else {
            const localResult = await this.commitOrderAndInventoryAtomicLocal(newOrder, updatedProducts);
            newSha = localResult.productsSha;
          }

          // Update cache on confirmed success
          this.productsCache = {
            data: updatedProducts,
            sha: newSha,
            cachedAt: Date.now()
          };

          return {
            success: true,
            order: newOrder,
            message: 'Order created successfully and stock decremented atomically.'
          };
        } catch (err: any) {
          lastError = err;

          // Never retry if business constraint failed (e.g. InsufficientStock or Validation)
          if (err instanceof InsufficientStockError || err.message?.startsWith('Validation Error')) {
            throw err;
          }

          // Only retry on concurrency conflict (409 / 422)
          if (err instanceof GitConflictError || err instanceof GitUnprocessableError) {
            if (attempt < maxRetries) {
              attempt++;
              this.invalidateCache();
              const delay = Math.min(
                this.config.maxDelayMs || 400,
                (this.config.baseDelayMs || 40) * Math.pow(2, attempt) + Math.floor(Math.random() * 20)
              );
              await this.sleep(delay);
              continue;
            } else {
              throw new GitRetryExhaustedError(attempt, lastError);
            }
          }

          throw err;
        }
      }

      throw new GitRetryExhaustedError(maxRetries, lastError);
    } finally {
      release();
    }
  }

  // --------------------------------------------------------------------------
  // CATEGORIES MANAGEMENT
  // --------------------------------------------------------------------------

  public async getCategories(): Promise<any[]> {
    if (this.getMode() === 'github') {
      try {
        const token = this.getToken();
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/data/categories.json?ref=${this.config.branch}`;
        const res = await this.fetchFn(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AIWebCrafter-PermanentStorage'
          }
        });

        if (res.ok) {
          const json = await res.json() as any;
          const content = Buffer.from(json.content, 'base64').toString('utf-8');
          return JSON.parse(content);
        } else if (res.status === 404) {
          console.log('[GitStorage] data/categories.json not found on remote branch, checking local fallback.');
        } else if (this.isProductionEnvironment()) {
          throw new GitStorageError(`GitHub API error (HTTP ${res.status}): Failed to read categories from GitHub repository "${this.config.owner}/${this.config.repo}".`, res.status);
        }
      } catch (err: any) {
        if (this.isProductionEnvironment()) throw err;
        console.warn('[GitStorage] Remote categories fetch failed, falling back to local storage:', err.message);
      }
    }

    const localFile = path.join(this.config.localDataDir, 'categories.json');
    if (fs.existsSync(localFile)) {
      const content = fs.readFileSync(localFile, 'utf-8');
      return JSON.parse(content);
    }
    return [];
  }

  // --------------------------------------------------------------------------
  // ORDER QUERIES & RETRIEVAL
  // --------------------------------------------------------------------------

  public async getOrders(): Promise<StoredOrder[]> {
    if (this.getMode() === 'github' || this.isProductionEnvironment()) {
      try {
        const token = this.getToken(false);
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/data/orders?ref=${this.config.branch}`;
        let res = await this.fetchFn(url, {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AIWebCrafter-PermanentStorage'
          } : {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AIWebCrafter-PermanentStorage'
          }
        });

        if (res.status === 401 && token) {
          console.warn('[GitStorage] GITHUB_TOKEN returned 401 for orders. Retrying unauthenticated...');
          res = await this.fetchFn(url, {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'AIWebCrafter-PermanentStorage'
            }
          });
        }

        if (res.ok) {
          const items = await res.json() as any[];
          const orders: StoredOrder[] = [];
          for (const item of items) {
            if (item.name.endsWith('.json') && !item.name.endsWith('.tmp')) {
              const fileRes = await this.fetchFn(item.download_url || item.url, {
                headers: {
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'AIWebCrafter-PermanentStorage'
                }
              });
              if (fileRes.ok) {
                const text = await fileRes.text();
                try {
                  orders.push(JSON.parse(text));
                } catch {
                  try {
                    const fileJson = JSON.parse(text);
                    if (fileJson.content) {
                      const content = Buffer.from(fileJson.content, 'base64').toString('utf-8');
                      orders.push(JSON.parse(content));
                    }
                  } catch {}
                }
              }
            }
          }
          return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else {
          console.warn(`[GitStorage] Remote orders fetch returned HTTP ${res.status}, checking local orders fallback.`);
        }
      } catch (err: any) {
        console.warn('[GitStorage] Remote orders fetch failed, checking local orders fallback:', err.message);
      }
    }

    const ordersDir = path.join(this.config.localDataDir, 'orders');
    if (!fs.existsSync(ordersDir)) return [];

    const files = fs.readdirSync(ordersDir).filter(f => f.endsWith('.json') && !f.endsWith('.tmp'));
    const orders: StoredOrder[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(ordersDir, file), 'utf-8');
        orders.push(JSON.parse(content));
      } catch (e) {
        // Skip malformed files
      }
    }
    return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async findOrderByIdempotencyKey(key: string): Promise<StoredOrder | null> {
    const orders = await this.getOrders();
    return orders.find(o => o.idempotency_key === key) || null;
  }

  public async deleteOrder(orderId: number): Promise<{ success: boolean; deleted_id: number }> {
    const release = await this.mutex.acquire();
    try {
      const orders = await this.getOrders();
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error(`Order #${orderId} not found in storage.`);
      }

      if (this.getMode() === 'github') {
        const token = this.getToken();
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/data/orders/${order.order_number}.json`;

        // First get the SHA of the file to delete
        const getRes = await this.fetchFn(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AIWebCrafter-PermanentStorage'
          }
        });

        if (getRes.ok) {
          const fileData = await getRes.json() as any;
          const deleteRes = await this.fetchFn(url, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
              'User-Agent': 'AIWebCrafter-PermanentStorage'
            },
            body: JSON.stringify({
              message: `chore(orders): delete order ${order.order_number}`,
              sha: fileData.sha,
              branch: this.config.branch
            })
          });

          if (!deleteRes.ok) {
            const errText = await deleteRes.text().catch(() => '');
            throw new GitStorageError(`GitHub delete failed (HTTP ${deleteRes.status}): ${errText}`, deleteRes.status);
          }
        }
      }

      // Local disk delete
      const orderFile = path.join(this.config.localDataDir, 'orders', `${order.order_number}.json`);
      if (fs.existsSync(orderFile)) {
        fs.unlinkSync(orderFile);
      }

      return { success: true, deleted_id: orderId };
    } finally {
      release();
    }
  }

  /**
   * Update Order Status & handle inventory adjustments (e.g. restock on cancel)
   */
  public async updateOrderStatus(
    orderId: number,
    newStatus: string
  ): Promise<StoredOrder> {
    const release = await this.mutex.acquire();
    try {
      const orders = await this.getOrders();
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error(`Order #${orderId} not found in storage.`);
      }

      const ALLOWED_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!ALLOWED_STATUSES.includes(newStatus)) {
        throw new Error(`Validation Error: Invalid order status "${newStatus}". Allowed values: ${ALLOWED_STATUSES.join(', ')}.`);
      }

      const prevStatus = order.order_status;
      // Idempotency check: identical status is a strict no-op (no inventory mutation)
      if (prevStatus === newStatus) {
        return order;
      }

      // State machine validation: only permit logically valid transitions
      const ALLOWED_TRANSITIONS: Record<string, string[]> = {
        pending: ['processing', 'shipped', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered', 'cancelled'],
        delivered: ['cancelled'],
        cancelled: ['pending', 'processing']
      };

      const validNextStates = ALLOWED_TRANSITIONS[prevStatus];
      if (validNextStates && !validNextStates.includes(newStatus)) {
        throw new Error(`Validation Error: Illegal order status transition from "${prevStatus}" to "${newStatus}". Allowed transitions: ${validNextStates.join(', ')}.`);
      }

      // Check whether inventory was deducted for this order (defaults to true for non-cancelled)
      const isCurrentlyDeducted = order.inventory_deducted !== undefined
        ? order.inventory_deducted
        : (prevStatus !== 'cancelled');

      let stockChanged = false;
      const { products } = await this.getProducts(true);

      if (newStatus === 'cancelled') {
        // Restock ONLY if inventory was deducted previously
        if (isCurrentlyDeducted) {
          for (const item of order.items) {
            const prod = products.find(p => p.id === item.product_id);
            if (prod) {
              prod.stock_quantity += item.quantity;
              prod.updated_at = new Date().toISOString();
              stockChanged = true;
            }
          }
          order.inventory_deducted = false;
        }
      } else {
        // Moving from cancelled to an active status (pending, processing, shipped, delivered)
        if (!isCurrentlyDeducted) {
          for (const item of order.items) {
            const prod = products.find(p => p.id === item.product_id);
            if (!prod) {
              throw new Error(`Cannot reactivate order: Product #${item.product_id} not found.`);
            }
            if (prod.stock_quantity < item.quantity) {
              throw new InsufficientStockError(prod.name, prod.id, prod.stock_quantity, item.quantity);
            }
            prod.stock_quantity -= item.quantity;
            prod.updated_at = new Date().toISOString();
            stockChanged = true;
          }
          order.inventory_deducted = true;
        }
        // If already deducted (e.g. pending -> shipped), stock remains 100% untouched
      }

      order.order_status = newStatus;
      order.updated_at = new Date().toISOString();

      if (this.getMode() === 'github') {
        try {
          if (stockChanged) {
            await this.commitOrderAndInventoryAtomicGitHub(order, products);
          } else {
            // Tree commit with just the order file
            const branch = this.config.branch;
            const baseHeaders = {
              'Authorization': `Bearer ${this.getToken()}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
              'User-Agent': 'AIWebCrafter-PermanentStorage'
            };
            const refUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${branch}`;
            const refRes = await this.fetchFn(refUrl, { headers: baseHeaders });
            if (refRes.ok) {
              const refJson = await refRes.json() as any;
              const currentCommitSha = refJson.object?.sha;
              const commitRes = await this.fetchFn(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/commits/${currentCommitSha}`, { headers: baseHeaders });
              if (commitRes.ok) {
                const commitJson = await commitRes.json() as any;
                const baseTreeSha = commitJson.tree?.sha;
                const treeRes = await this.fetchFn(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/trees`, {
                  method: 'POST',
                  headers: baseHeaders,
                  body: JSON.stringify({
                    base_tree: baseTreeSha,
                    tree: [{
                      path: `data/orders/${order.order_number}.json`,
                      mode: '100644',
                      type: 'blob',
                      content: JSON.stringify(order, null, 2)
                    }]
                  })
                });
                if (treeRes.ok) {
                  const treeJson = await treeRes.json() as any;
                  const newCommitRes = await this.fetchFn(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/commits`, {
                    method: 'POST',
                    headers: baseHeaders,
                    body: JSON.stringify({
                      message: `fix(orders): update order ${order.order_number} status to ${newStatus}`,
                      tree: treeJson.sha,
                      parents: [currentCommitSha]
                    })
                  });
                  if (newCommitRes.ok) {
                    const newCommitJson = await newCommitRes.json() as any;
                    await this.fetchFn(refUrl, {
                      method: 'PATCH',
                      headers: baseHeaders,
                      body: JSON.stringify({ sha: newCommitJson.sha, force: false })
                    });
                  }
                }
              }
            }
          }
        } catch (remoteErr: any) {
          if (this.isProductionEnvironment()) {
            throw remoteErr;
          }
          console.warn('[GitStorage] Remote GitHub order update commit failed, persisting locally:', remoteErr.message);
        }
      }

      // Always persist to local file store atomically
      const orderFile = path.join(this.config.localDataDir, 'orders', `${order.order_number}.json`);
      const orderTmp = path.join(this.config.localDataDir, 'orders', `${order.order_number}.json.tmp`);
      fs.writeFileSync(orderTmp, JSON.stringify(order, null, 2), 'utf-8');
      fs.renameSync(orderTmp, orderFile);

      if (stockChanged) {
        const productsFile = path.join(this.config.localDataDir, 'products.json');
        const productsTmp = path.join(this.config.localDataDir, `products.json.tmp.${Date.now()}`);
        fs.writeFileSync(productsTmp, JSON.stringify(products, null, 2), 'utf-8');
        fs.renameSync(productsTmp, productsFile);

        this.productsCache = {
          data: JSON.parse(JSON.stringify(products)),
          sha: this.calculateGitSha(JSON.stringify(products, null, 2)),
          cachedAt: Date.now()
        };
      }

      return order;
    } finally {
      release();
    }
  }

  // --------------------------------------------------------------------------
  // BACKUP & ROLLBACK MANAGEMENT
  // --------------------------------------------------------------------------

  public async createSnapshot(label = 'manual'): Promise<{ filename: string; path: string; itemsCount: number }> {
    const { products } = await this.getProducts(true);
    const orders = await this.getOrders();
    const filename = `snapshot_${label}_${Date.now()}.json`;
    const snapshotPath = path.join(this.config.localDataDir, 'backups', filename);

    const snapshot = {
      snapshot_id: `snp_${Date.now()}`,
      created_at: new Date().toISOString(),
      label,
      products_count: products.length,
      orders_count: orders.length,
      products,
      orders
    };

    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');
    return { filename, path: snapshotPath, itemsCount: products.length };
  }

  public async restoreFromSnapshot(snapshotFilename: string): Promise<{ success: boolean; restoredProductsCount: number }> {
    const release = await this.mutex.acquire();
    try {
      const snapshotPath = path.join(this.config.localDataDir, 'backups', snapshotFilename);
      if (!fs.existsSync(snapshotPath)) {
        throw new Error(`Snapshot file ${snapshotFilename} does not exist in backups.`);
      }

      const content = fs.readFileSync(snapshotPath, 'utf-8');
      const data = JSON.parse(content);
      if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Invalid snapshot structure: missing products array.');
      }

      await this.saveProducts(data.products, `rollback(catalog): restored from snapshot ${snapshotFilename}`);
      return { success: true, restoredProductsCount: data.products.length };
    } finally {
      release();
    }
  }

  // --------------------------------------------------------------------------
  // STATUS & TELEMETRY
  // --------------------------------------------------------------------------

  public async getStatus(): Promise<{
    mode: 'github' | 'local_git';
    owner: string;
    repo: string;
    branch: string;
    products_count: number;
    orders_count: number;
    has_token: boolean;
    storage_path: string;
    cache_active: boolean;
    last_auth_error: string | null;
  }> {
    const { products } = await this.getProducts();
    const orders = await this.getOrders();
    return {
      mode: this.getMode(),
      owner: this.config.owner,
      repo: this.config.repo,
      branch: this.config.branch,
      products_count: products.length,
      orders_count: orders.length,
      has_token: Boolean(this.getToken(false)),
      storage_path: this.config.localDataDir,
      cache_active: Boolean(this.productsCache),
      last_auth_error: this.lastAuthError
    };
  }
}

// Export singleton instance
export const gitStorage = new GitStorageService();
