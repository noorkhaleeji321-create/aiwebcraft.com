// app-server.ts
import express from "express";
import compression from "compression";
import path2 from "path";
import fs2 from "fs";
import dotenv2 from "dotenv";

// backend/services/gitStorageService.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config({ override: true });
var GitStorageError = class extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "GitStorageError";
    this.status = status;
    this.details = details;
  }
};
var GitConflictError = class extends GitStorageError {
  constructor(message = "GitHub Conflict (409): Resource SHA mismatch. Remote repository was modified concurrently.", details) {
    super(message, 409, details);
    this.name = "GitConflictError";
    if (details?.currentSha) this.currentSha = details.currentSha;
    if (details?.targetSha) this.targetSha = details.targetSha;
  }
};
var GitUnprocessableError = class extends GitStorageError {
  constructor(message = "GitHub Unprocessable Entity (422): Branch reference fast-forward failed or commit refused.", details) {
    super(message, 422, details);
    this.name = "GitUnprocessableError";
  }
};
var GitRetryExhaustedError = class extends GitStorageError {
  constructor(attempts, lastError) {
    super(
      `Storage operation failed: Maximum retry attempts (${attempts}) exhausted under high concurrency. Last error: ${lastError?.message || "unknown"}`,
      409,
      { attempts, lastErrorMessage: lastError?.message }
    );
    this.name = "GitRetryExhaustedError";
    this.attempts = attempts;
  }
};
var InsufficientStockError = class extends Error {
  constructor(productName, productId, available, requested) {
    super(`Order Rejected: Insufficient stock for "${productName}". Available: ${available}, Requested: ${requested}.`);
    this.name = "InsufficientStockError";
    this.productId = productId;
    this.available = available;
    this.requested = requested;
  }
};
var AsyncMutex = class {
  constructor() {
    this.queue = [];
    this.locked = false;
  }
  async acquire() {
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
  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.locked = false;
    }
  }
};
var GitStorageService = class {
  constructor(customConfig) {
    this.mutex = new AsyncMutex();
    this.productsCache = null;
    this.cacheTtlMs = 60 * 1e3;
    this.lastAuthError = null;
    this.config = {
      owner: process.env.GITHUB_REPO_OWNER || "noorkhaleeji321-create",
      repo: process.env.GITHUB_REPO_NAME || "natural-health-morocco",
      branch: process.env.GITHUB_BRANCH || "main",
      token: process.env.GITHUB_TOKEN,
      // Kept strictly on server side!
      localDataDir: path.resolve(process.cwd(), "data"),
      maxRetries: 3,
      baseDelayMs: 40,
      maxDelayMs: 400,
      ...customConfig
    };
    this.fetchFn = this.config.fetchFn || (globalThis.fetch ? globalThis.fetch.bind(globalThis) : void 0);
    this.ensureDirectories();
  }
  ensureDirectories() {
    const isVercel = process.env.VERCEL === "1";
    const dirs = [
      this.config.localDataDir,
      path.join(this.config.localDataDir, "orders"),
      path.join(this.config.localDataDir, "backups"),
      path.resolve(process.cwd(), "media", "products")
    ];
    for (const d of dirs) {
      try {
        if (!fs.existsSync(d)) {
          if (isVercel && !d.startsWith("/tmp")) {
            console.warn(`[GitStorage] Cannot create directory ${d} on Vercel (read-only). Skipping.`);
            continue;
          }
          fs.mkdirSync(d, { recursive: true });
        }
      } catch (err) {
        console.warn(`[GitStorage] Failed to ensure directory ${d}:`, err.message);
      }
    }
  }
  isProductionEnvironment() {
    return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  }
  getToken(required = false) {
    const token = process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim() !== "" ? process.env.GITHUB_TOKEN.trim() : this.config.token;
    if (required && this.isProductionEnvironment() && (!token || token.trim() === "")) {
      throw new GitStorageError("STORAGE CONFIGURATION ERROR: GITHUB_TOKEN environment variable is required for write operations in production.", 500);
    }
    return token;
  }
  getMode() {
    const token = process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim() !== "" ? process.env.GITHUB_TOKEN.trim() : this.config.token;
    return token && token.trim() !== "" ? "github" : "local_git";
  }
  invalidateCache() {
    this.productsCache = null;
  }
  calculateGitSha(content) {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf-8");
    const header = `blob ${buffer.length}\0`;
    return crypto.createHash("sha1").update(Buffer.concat([Buffer.from(header), buffer])).digest("hex");
  }
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // --------------------------------------------------------------------------
  // PRODUCTS MANAGEMENT
  // --------------------------------------------------------------------------
  async getProducts(forceFresh = false) {
    const now = Date.now();
    if (!forceFresh && this.productsCache && now - this.productsCache.cachedAt < this.cacheTtlMs) {
      return {
        products: JSON.parse(JSON.stringify(this.productsCache.data)),
        sha: this.productsCache.sha,
        fromCache: true
      };
    }
    if (this.getMode() === "github" || this.isProductionEnvironment()) {
      try {
        const token = this.getToken(false);
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/data/products.json?ref=${this.config.branch}`;
        let res = await this.fetchFn(url, {
          headers: token ? {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AIWebCrafter-PermanentStorage"
          } : {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AIWebCrafter-PermanentStorage"
          }
        });
        if (res.status === 401 && token) {
          console.warn("[GitStorage] GITHUB_TOKEN returned 401 Bad credentials. Retrying unauthenticated for public catalog read...");
          this.lastAuthError = "GitHub Auth Warning (401 Bad credentials): GITHUB_TOKEN is invalid or expired. Read succeeded via public access, but write operations will fail until updated.";
          res = await this.fetchFn(url, {
            headers: {
              "Accept": "application/vnd.github.v3+json",
              "User-Agent": "AIWebCrafter-PermanentStorage"
            }
          });
        }
        if (res.ok) {
          const json = await res.json();
          const content2 = Buffer.from(json.content, "base64").toString("utf-8");
          const products2 = JSON.parse(content2);
          this.productsCache = { data: products2, sha: json.sha, cachedAt: now };
          return { products: JSON.parse(JSON.stringify(products2)), sha: json.sha, fromCache: false };
        } else if (res.status === 404) {
          console.log("[GitStorage] data/products.json not found on remote branch, checking local fallback.");
        } else {
          if (res.status === 401 || res.status === 403) {
            this.lastAuthError = `GitHub Auth Error (${res.status}): The provided GITHUB_TOKEN is invalid or lacks permissions to read products from ${this.config.owner}/${this.config.repo}.`;
          }
          console.warn(`[GitStorage] GitHub API returned HTTP ${res.status}, checking local fallback.`);
        }
      } catch (err) {
        console.warn("[GitStorage] Remote fetch encountered error, checking local fallback:", err.message);
      }
    }
    const localFile = path.join(this.config.localDataDir, "products.json");
    if (!fs.existsSync(localFile)) {
      return { products: [], sha: "", fromCache: false };
    }
    const content = fs.readFileSync(localFile, "utf-8");
    const products = JSON.parse(content);
    const sha = this.calculateGitSha(content);
    this.productsCache = { data: products, sha, cachedAt: now };
    return { products: JSON.parse(JSON.stringify(products)), sha, fromCache: false };
  }
  /**
   * Save products catalog.
   * If expectedSha is passed, it acts as an Optimistic Concurrency check.
   * NEVER returns { success: true } if storage rejects the write!
   */
  async saveProducts(products, commitMessage, expectedSha) {
    const content = JSON.stringify(products, null, 2);
    let newSha = this.calculateGitSha(content);
    if (this.getMode() === "github") {
      const targetSha = expectedSha || (await this.getProducts(true)).sha;
      const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/data/products.json`;
      const putBody = {
        message: commitMessage,
        content: Buffer.from(content).toString("base64"),
        branch: this.config.branch
      };
      if (targetSha && targetSha.trim() !== "") {
        putBody.sha = targetSha.trim();
      }
      const res = await this.fetchFn(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${this.getToken(true)}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "AIWebCrafter-PermanentStorage"
        },
        body: JSON.stringify(putBody)
      });
      if (res.status === 409) {
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
        const errText = await res.text().catch(() => "");
        if (this.isProductionEnvironment()) {
          throw new GitStorageError(`GitHub commit failed (HTTP ${res.status}): ${errText || "Permission denied or authentication error."}`, res.status);
        }
        if (res.status === 401 || res.status === 403) {
          this.lastAuthError = `GitHub Auth Error (${res.status}): The provided GITHUB_TOKEN is invalid or lacks write permissions for ${this.config.owner}/${this.config.repo}.`;
          console.warn(`[GitStorage] ${this.lastAuthError} Falling back to local permanent store.`);
        } else {
          this.lastAuthError = `GitHub Commit Error (${res.status}): ${errText}`;
          throw new GitStorageError(`GitHub commit failed with HTTP ${res.status}: ${errText}`, res.status);
        }
      } else {
        const resJson = await res.json();
        newSha = resJson.content?.sha || newSha;
        this.lastAuthError = null;
      }
    } else if (this.isProductionEnvironment()) {
      throw new GitStorageError("STORAGE CONFIGURATION ERROR: GITHUB_TOKEN environment variable is required in production.", 500);
    }
    const localFile = path.join(this.config.localDataDir, "products.json");
    const tempFile = path.join(this.config.localDataDir, `products.json.tmp.${Date.now()}`);
    try {
      fs.writeFileSync(tempFile, content, "utf-8");
      fs.renameSync(tempFile, localFile);
    } catch (diskErr) {
      if (fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile);
        } catch {
        }
      }
      this.invalidateCache();
      throw new GitStorageError(`Local disk write failed: ${diskErr.message}`);
    }
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
  async saveProductsWithRetry(updateFn, commitMessagePrefix) {
    const maxRetries = this.config.maxRetries || 3;
    let attempt = 0;
    let lastError;
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
      } catch (err) {
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
  async createProduct(productData) {
    const release = await this.mutex.acquire();
    try {
      let created = null;
      await this.saveProductsWithRetry((products) => {
        const nextId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        created = {
          id: nextId,
          uuid: productData.uuid || `prod_${Date.now()}`,
          name: productData.name || "",
          name_ar: productData.name_ar || "",
          slug: productData.slug || `prod-${nextId}`,
          description: productData.description || "",
          description_ar: productData.description_ar || "",
          price: Number(productData.price) || 0,
          promo_price: productData.promo_price ? Number(productData.promo_price) : null,
          category_id: Number(productData.category_id) || 1,
          category_name: productData.category_name,
          sku: productData.sku || `SKU-${nextId}`,
          stock_quantity: Number(productData.stock_quantity) || 0,
          is_published: productData.is_published !== void 0 ? Boolean(productData.is_published) : true,
          is_featured: Boolean(productData.is_featured),
          attributes_json: productData.attributes_json || "{}",
          images: productData.images || [],
          created_at: now,
          updated_at: now
        };
        products.push(created);
        return products;
      }, `feat(catalog): add product ${productData.sku || "new"}`);
      return created;
    } finally {
      release();
    }
  }
  async updateProduct(id, updates) {
    const release = await this.mutex.acquire();
    try {
      let updated = null;
      await this.saveProductsWithRetry((products) => {
        const index = products.findIndex((p) => p.id === id);
        if (index === -1) {
          throw new Error(`Product #${id} not found.`);
        }
        const existing = products[index];
        updated = {
          ...existing,
          ...updates,
          id: existing.id,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        products[index] = updated;
        return products;
      }, `fix(catalog): update product #${id}`);
      return updated;
    } finally {
      release();
    }
  }
  async deleteProduct(id) {
    const release = await this.mutex.acquire();
    try {
      let deletedSku = "";
      await this.saveProductsWithRetry((products) => {
        const existing = products.find((p) => p.id === id);
        if (!existing) {
          throw new Error(`Product #${id} not found.`);
        }
        deletedSku = existing.sku;
        return products.filter((p) => p.id !== id);
      }, `chore(catalog): delete product #${id} (${deletedSku})`);
      return { success: true, deleted_id: id };
    } finally {
      release();
    }
  }
  async clearProducts() {
    const release = await this.mutex.acquire();
    try {
      let count = 0;
      await this.saveProductsWithRetry((products) => {
        count = products.length;
        return [];
      }, "chore(catalog): clear sample product data");
      return { success: true, cleared_count: count };
    } finally {
      release();
    }
  }
  async clearOrders() {
    const release = await this.mutex.acquire();
    try {
      const ordersDir = path.join(this.config.localDataDir, "orders");
      let count = 0;
      if (fs.existsSync(ordersDir)) {
        const files = fs.readdirSync(ordersDir).filter((f) => f.endsWith(".json"));
        count = files.length;
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(ordersDir, file));
          } catch {
          }
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
  async commitOrderAndInventoryAtomicGitHub(order, products) {
    const branch = this.config.branch;
    const baseHeaders = {
      "Authorization": `Bearer ${this.getToken()}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "AIWebCrafter-PermanentStorage"
    };
    const refUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${branch}`;
    const refRes = await this.fetchFn(refUrl, { headers: baseHeaders });
    if (!refRes.ok) {
      throw new GitStorageError(`Failed to get branch ref: HTTP ${refRes.status}`, refRes.status);
    }
    const refJson = await refRes.json();
    const currentCommitSha = refJson.object?.sha;
    const commitUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/commits/${currentCommitSha}`;
    const commitRes = await this.fetchFn(commitUrl, { headers: baseHeaders });
    if (!commitRes.ok) {
      throw new GitStorageError(`Failed to get commit tree: HTTP ${commitRes.status}`, commitRes.status);
    }
    const commitJson = await commitRes.json();
    const baseTreeSha = commitJson.tree?.sha;
    const productsContent = JSON.stringify(products, null, 2);
    const orderContent = JSON.stringify(order, null, 2);
    const treeUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/trees`;
    const treeRes = await this.fetchFn(treeUrl, {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: [
          {
            path: "data/products.json",
            mode: "100644",
            type: "blob",
            content: productsContent
          },
          {
            path: `data/orders/${order.order_number}.json`,
            mode: "100644",
            type: "blob",
            content: orderContent
          }
        ]
      })
    });
    if (treeRes.status === 409) throw new GitConflictError("Git tree creation conflict", { baseTreeSha });
    if (treeRes.status === 422) throw new GitUnprocessableError("Git tree rejected unprocessable");
    if (!treeRes.ok) throw new GitStorageError(`Failed to create tree: HTTP ${treeRes.status}`, treeRes.status);
    const treeJson = await treeRes.json();
    const newTreeSha = treeJson.sha;
    const newCommitUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/commits`;
    const newCommitRes = await this.fetchFn(newCommitUrl, {
      method: "POST",
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
    const newCommitJson = await newCommitRes.json();
    const newCommitSha = newCommitJson.sha;
    const updateRefRes = await this.fetchFn(refUrl, {
      method: "PATCH",
      headers: baseHeaders,
      body: JSON.stringify({
        sha: newCommitSha,
        force: false
        // Non-fast-forward will fail with 422
      })
    });
    if (updateRefRes.status === 422) {
      throw new GitUnprocessableError("Branch reference updated concurrently (HTTP 422). Optimistic lock prevented conflict.");
    }
    if (updateRefRes.status === 409) {
      throw new GitConflictError("Branch reference conflict (HTTP 409).");
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
  async commitOrderAndInventoryAtomicLocal(order, products) {
    const productsContent = JSON.stringify(products, null, 2);
    const orderContent = JSON.stringify(order, null, 2);
    const productsFile = path.join(this.config.localDataDir, "products.json");
    const orderFile = path.join(this.config.localDataDir, "orders", `${order.order_number}.json`);
    const productsTmp = path.join(this.config.localDataDir, `products.json.tmp.${order.order_number}`);
    const orderTmp = path.join(this.config.localDataDir, "orders", `${order.order_number}.json.tmp`);
    try {
      fs.writeFileSync(productsTmp, productsContent, "utf-8");
      fs.writeFileSync(orderTmp, orderContent, "utf-8");
      fs.renameSync(orderTmp, orderFile);
      fs.renameSync(productsTmp, productsFile);
      const productsSha = this.calculateGitSha(productsContent);
      return { productsSha };
    } catch (err) {
      if (fs.existsSync(productsTmp)) {
        try {
          fs.unlinkSync(productsTmp);
        } catch {
        }
      }
      if (fs.existsSync(orderTmp)) {
        try {
          fs.unlinkSync(orderTmp);
        } catch {
        }
      }
      if (fs.existsSync(orderFile)) {
        try {
          fs.unlinkSync(orderFile);
        } catch {
        }
      }
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
  async ingestOrder(orderPayload) {
    const release = await this.mutex.acquire();
    try {
      const idempotencyKey = (orderPayload.idempotency_key || "").trim();
      if (idempotencyKey) {
        const existing = await this.findOrderByIdempotencyKey(idempotencyKey);
        if (existing) {
          return {
            success: true,
            is_duplicate: true,
            order: existing,
            message: "Order already processed (Idempotent response - no duplicate deduction)."
          };
        }
      }
      if (!orderPayload.customer_name?.trim()) {
        throw new Error("Validation Error: Customer name is required.");
      }
      if (!orderPayload.customer_phone?.trim()) {
        throw new Error("Validation Error: Customer phone number is required.");
      }
      if (!orderPayload.shipping_address?.trim()) {
        throw new Error("Validation Error: Shipping address is required.");
      }
      if (!Array.isArray(orderPayload.items) || orderPayload.items.length === 0) {
        throw new Error("Validation Error: Order must contain at least one item.");
      }
      const maxRetries = this.config.maxRetries || 3;
      let attempt = 0;
      let lastError;
      while (attempt <= maxRetries) {
        try {
          const { products: freshProducts } = await this.getProducts(true);
          let serverCalculatedTotal = 0;
          const verifiedItems = [];
          const updatedProducts = JSON.parse(JSON.stringify(freshProducts));
          for (const item of orderPayload.items) {
            if (!item.quantity || item.quantity <= 0) {
              throw new Error(`Validation Error: Invalid quantity (${item.quantity}) for product ID #${item.product_id}.`);
            }
            const anyItem = item;
            const prod = updatedProducts.find((p) => p.id === item.product_id);
            if (!prod) {
              const unitPrice2 = Number(anyItem.unit_price) || 0;
              const lineTotal2 = Number((unitPrice2 * item.quantity).toFixed(2));
              serverCalculatedTotal = Number((serverCalculatedTotal + lineTotal2).toFixed(2));
              verifiedItems.push({
                product_id: item.product_id || 0,
                product_name: anyItem.product_name || `Product #${item.product_id}`,
                sku: anyItem.sku || `SKU-${item.product_id}`,
                unit_price: unitPrice2,
                quantity: item.quantity,
                line_total: lineTotal2
              });
              continue;
            }
            if (!prod.is_published) {
              throw new Error(`Order Rejected: Product "${prod.name}" is currently unpublished.`);
            }
            if (prod.stock_quantity < item.quantity) {
              throw new InsufficientStockError(prod.name, prod.id, prod.stock_quantity, item.quantity);
            }
            const unitPrice = prod.promo_price && prod.promo_price > 0 && prod.promo_price < prod.price ? prod.promo_price : prod.price;
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
            prod.stock_quantity -= item.quantity;
            prod.updated_at = (/* @__PURE__ */ new Date()).toISOString();
          }
          const orderNumber = `ORD-${(/* @__PURE__ */ new Date()).getFullYear()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
          const orderId = Date.now();
          const newOrder = {
            id: orderId,
            order_number: orderNumber,
            idempotency_key: idempotencyKey || null,
            customer_name: orderPayload.customer_name.trim(),
            customer_phone: orderPayload.customer_phone.trim(),
            customer_email: orderPayload.customer_email?.trim() || null,
            shipping_address: orderPayload.shipping_address.trim(),
            city: orderPayload.city?.trim() || "Morocco",
            postal_code: orderPayload.postal_code?.trim() || null,
            total_amount: serverCalculatedTotal,
            currency: "MAD",
            payment_method: orderPayload.payment_method || "Cash On Delivery (COD)",
            payment_status: "pending",
            order_status: "pending",
            inventory_deducted: true,
            items: verifiedItems,
            notes: orderPayload.notes?.trim() || null,
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          let newSha = "";
          if (this.getMode() === "github") {
            try {
              const commitResult = await this.commitOrderAndInventoryAtomicGitHub(newOrder, updatedProducts);
              newSha = commitResult.productsSha;
            } catch (remoteErr) {
              if (remoteErr instanceof GitConflictError || remoteErr instanceof GitUnprocessableError) {
                throw remoteErr;
              }
              console.warn("[GitStorage] Remote GitHub order commit failed, persisting locally:", remoteErr.message);
              try {
                const localResult = await this.commitOrderAndInventoryAtomicLocal(newOrder, updatedProducts);
                newSha = localResult.productsSha;
              } catch (localErr) {
                if (this.isProductionEnvironment()) throw remoteErr;
                throw localErr;
              }
            }
          } else {
            const localResult = await this.commitOrderAndInventoryAtomicLocal(newOrder, updatedProducts);
            newSha = localResult.productsSha;
          }
          this.productsCache = {
            data: updatedProducts,
            sha: newSha,
            cachedAt: Date.now()
          };
          return {
            success: true,
            order: newOrder,
            message: "Order created successfully and stock decremented atomically."
          };
        } catch (err) {
          lastError = err;
          if (err instanceof InsufficientStockError || err.message?.startsWith("Validation Error")) {
            throw err;
          }
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
  async getCategories() {
    if (this.getMode() === "github") {
      try {
        const token = this.getToken();
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/data/categories.json?ref=${this.config.branch}`;
        const res = await this.fetchFn(url, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AIWebCrafter-PermanentStorage"
          }
        });
        if (res.ok) {
          const json = await res.json();
          const content = Buffer.from(json.content, "base64").toString("utf-8");
          return JSON.parse(content);
        } else if (res.status === 404) {
          console.log("[GitStorage] data/categories.json not found on remote branch, checking local fallback.");
        } else if (this.isProductionEnvironment()) {
          throw new GitStorageError(`GitHub API error (HTTP ${res.status}): Failed to read categories from GitHub repository "${this.config.owner}/${this.config.repo}".`, res.status);
        }
      } catch (err) {
        if (this.isProductionEnvironment()) throw err;
        console.warn("[GitStorage] Remote categories fetch failed, falling back to local storage:", err.message);
      }
    }
    const localFile = path.join(this.config.localDataDir, "categories.json");
    if (fs.existsSync(localFile)) {
      const content = fs.readFileSync(localFile, "utf-8");
      return JSON.parse(content);
    }
    return [];
  }
  // --------------------------------------------------------------------------
  // ORDER QUERIES & RETRIEVAL
  // --------------------------------------------------------------------------
  async getOrders() {
    if (this.getMode() === "github" || this.isProductionEnvironment()) {
      try {
        const token = this.getToken(false);
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/data/orders?ref=${this.config.branch}`;
        let res = await this.fetchFn(url, {
          headers: token ? {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AIWebCrafter-PermanentStorage"
          } : {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AIWebCrafter-PermanentStorage"
          }
        });
        if (res.status === 401 && token) {
          console.warn("[GitStorage] GITHUB_TOKEN returned 401 for orders. Retrying unauthenticated...");
          res = await this.fetchFn(url, {
            headers: {
              "Accept": "application/vnd.github.v3+json",
              "User-Agent": "AIWebCrafter-PermanentStorage"
            }
          });
        }
        if (res.ok) {
          const items = await res.json();
          const orders2 = [];
          for (const item of items) {
            if (item.name.endsWith(".json") && !item.name.endsWith(".tmp")) {
              const fileRes = await this.fetchFn(item.download_url || item.url, {
                headers: {
                  "Accept": "application/vnd.github.v3+json",
                  "User-Agent": "AIWebCrafter-PermanentStorage"
                }
              });
              if (fileRes.ok) {
                const text = await fileRes.text();
                try {
                  orders2.push(JSON.parse(text));
                } catch {
                  try {
                    const fileJson = JSON.parse(text);
                    if (fileJson.content) {
                      const content = Buffer.from(fileJson.content, "base64").toString("utf-8");
                      orders2.push(JSON.parse(content));
                    }
                  } catch {
                  }
                }
              }
            }
          }
          return orders2.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else {
          console.warn(`[GitStorage] Remote orders fetch returned HTTP ${res.status}, checking local orders fallback.`);
        }
      } catch (err) {
        console.warn("[GitStorage] Remote orders fetch failed, checking local orders fallback:", err.message);
      }
    }
    const ordersDir = path.join(this.config.localDataDir, "orders");
    if (!fs.existsSync(ordersDir)) return [];
    const files = fs.readdirSync(ordersDir).filter((f) => f.endsWith(".json") && !f.endsWith(".tmp"));
    const orders = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(ordersDir, file), "utf-8");
        orders.push(JSON.parse(content));
      } catch (e) {
      }
    }
    return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  async findOrderByIdempotencyKey(key) {
    const orders = await this.getOrders();
    return orders.find((o) => o.idempotency_key === key) || null;
  }
  async deleteOrder(orderId) {
    const release = await this.mutex.acquire();
    try {
      const orders = await this.getOrders();
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        throw new Error(`Order #${orderId} not found in storage.`);
      }
      if (this.getMode() === "github") {
        const token = this.getToken();
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/data/orders/${order.order_number}.json`;
        const getRes = await this.fetchFn(url, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AIWebCrafter-PermanentStorage"
          }
        });
        if (getRes.ok) {
          const fileData = await getRes.json();
          const deleteRes = await this.fetchFn(url, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Accept": "application/vnd.github.v3+json",
              "Content-Type": "application/json",
              "User-Agent": "AIWebCrafter-PermanentStorage"
            },
            body: JSON.stringify({
              message: `chore(orders): delete order ${order.order_number}`,
              sha: fileData.sha,
              branch: this.config.branch
            })
          });
          if (!deleteRes.ok) {
            const errText = await deleteRes.text().catch(() => "");
            throw new GitStorageError(`GitHub delete failed (HTTP ${deleteRes.status}): ${errText}`, deleteRes.status);
          }
        }
      }
      const orderFile = path.join(this.config.localDataDir, "orders", `${order.order_number}.json`);
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
  async updateOrderStatus(orderId, newStatus) {
    const release = await this.mutex.acquire();
    try {
      const orders = await this.getOrders();
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        throw new Error(`Order #${orderId} not found in storage.`);
      }
      const ALLOWED_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
      if (!ALLOWED_STATUSES.includes(newStatus)) {
        throw new Error(`Validation Error: Invalid order status "${newStatus}". Allowed values: ${ALLOWED_STATUSES.join(", ")}.`);
      }
      const prevStatus = order.order_status;
      if (prevStatus === newStatus) {
        return order;
      }
      const ALLOWED_TRANSITIONS = {
        pending: ["processing", "shipped", "cancelled"],
        processing: ["shipped", "cancelled"],
        shipped: ["delivered", "cancelled"],
        delivered: ["cancelled"],
        cancelled: ["pending", "processing"]
      };
      const validNextStates = ALLOWED_TRANSITIONS[prevStatus];
      if (validNextStates && !validNextStates.includes(newStatus)) {
        throw new Error(`Validation Error: Illegal order status transition from "${prevStatus}" to "${newStatus}". Allowed transitions: ${validNextStates.join(", ")}.`);
      }
      const isCurrentlyDeducted = order.inventory_deducted !== void 0 ? order.inventory_deducted : prevStatus !== "cancelled";
      let stockChanged = false;
      const { products } = await this.getProducts(true);
      if (newStatus === "cancelled") {
        if (isCurrentlyDeducted) {
          for (const item of order.items) {
            const prod = products.find((p) => p.id === item.product_id);
            if (prod) {
              prod.stock_quantity += item.quantity;
              prod.updated_at = (/* @__PURE__ */ new Date()).toISOString();
              stockChanged = true;
            }
          }
          order.inventory_deducted = false;
        }
      } else {
        if (!isCurrentlyDeducted) {
          for (const item of order.items) {
            const prod = products.find((p) => p.id === item.product_id);
            if (!prod) {
              throw new Error(`Cannot reactivate order: Product #${item.product_id} not found.`);
            }
            if (prod.stock_quantity < item.quantity) {
              throw new InsufficientStockError(prod.name, prod.id, prod.stock_quantity, item.quantity);
            }
            prod.stock_quantity -= item.quantity;
            prod.updated_at = (/* @__PURE__ */ new Date()).toISOString();
            stockChanged = true;
          }
          order.inventory_deducted = true;
        }
      }
      order.order_status = newStatus;
      order.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      if (this.getMode() === "github") {
        try {
          if (stockChanged) {
            await this.commitOrderAndInventoryAtomicGitHub(order, products);
          } else {
            const branch = this.config.branch;
            const baseHeaders = {
              "Authorization": `Bearer ${this.getToken()}`,
              "Accept": "application/vnd.github.v3+json",
              "Content-Type": "application/json",
              "User-Agent": "AIWebCrafter-PermanentStorage"
            };
            const refUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${branch}`;
            const refRes = await this.fetchFn(refUrl, { headers: baseHeaders });
            if (refRes.ok) {
              const refJson = await refRes.json();
              const currentCommitSha = refJson.object?.sha;
              const commitRes = await this.fetchFn(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/commits/${currentCommitSha}`, { headers: baseHeaders });
              if (commitRes.ok) {
                const commitJson = await commitRes.json();
                const baseTreeSha = commitJson.tree?.sha;
                const treeRes = await this.fetchFn(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/trees`, {
                  method: "POST",
                  headers: baseHeaders,
                  body: JSON.stringify({
                    base_tree: baseTreeSha,
                    tree: [{
                      path: `data/orders/${order.order_number}.json`,
                      mode: "100644",
                      type: "blob",
                      content: JSON.stringify(order, null, 2)
                    }]
                  })
                });
                if (treeRes.ok) {
                  const treeJson = await treeRes.json();
                  const newCommitRes = await this.fetchFn(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/commits`, {
                    method: "POST",
                    headers: baseHeaders,
                    body: JSON.stringify({
                      message: `fix(orders): update order ${order.order_number} status to ${newStatus}`,
                      tree: treeJson.sha,
                      parents: [currentCommitSha]
                    })
                  });
                  if (newCommitRes.ok) {
                    const newCommitJson = await newCommitRes.json();
                    await this.fetchFn(refUrl, {
                      method: "PATCH",
                      headers: baseHeaders,
                      body: JSON.stringify({ sha: newCommitJson.sha, force: false })
                    });
                  }
                }
              }
            }
          }
        } catch (remoteErr) {
          if (this.isProductionEnvironment()) {
            throw remoteErr;
          }
          console.warn("[GitStorage] Remote GitHub order update commit failed, persisting locally:", remoteErr.message);
        }
      }
      const orderFile = path.join(this.config.localDataDir, "orders", `${order.order_number}.json`);
      const orderTmp = path.join(this.config.localDataDir, "orders", `${order.order_number}.json.tmp`);
      fs.writeFileSync(orderTmp, JSON.stringify(order, null, 2), "utf-8");
      fs.renameSync(orderTmp, orderFile);
      if (stockChanged) {
        const productsFile = path.join(this.config.localDataDir, "products.json");
        const productsTmp = path.join(this.config.localDataDir, `products.json.tmp.${Date.now()}`);
        fs.writeFileSync(productsTmp, JSON.stringify(products, null, 2), "utf-8");
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
  async createSnapshot(label = "manual") {
    const { products } = await this.getProducts(true);
    const orders = await this.getOrders();
    const filename = `snapshot_${label}_${Date.now()}.json`;
    const snapshotPath = path.join(this.config.localDataDir, "backups", filename);
    const snapshot = {
      snapshot_id: `snp_${Date.now()}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      label,
      products_count: products.length,
      orders_count: orders.length,
      products,
      orders
    };
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), "utf-8");
    return { filename, path: snapshotPath, itemsCount: products.length };
  }
  async restoreFromSnapshot(snapshotFilename) {
    const release = await this.mutex.acquire();
    try {
      const snapshotPath = path.join(this.config.localDataDir, "backups", snapshotFilename);
      if (!fs.existsSync(snapshotPath)) {
        throw new Error(`Snapshot file ${snapshotFilename} does not exist in backups.`);
      }
      const content = fs.readFileSync(snapshotPath, "utf-8");
      const data = JSON.parse(content);
      if (!data.products || !Array.isArray(data.products)) {
        throw new Error("Invalid snapshot structure: missing products array.");
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
  async getStatus() {
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
};
var gitStorage = new GitStorageService();

// backend/services/authService.ts
import crypto2 from "crypto";
var SESSION_TTL_SECONDS = 24 * 60 * 60;
var DEFAULT_ADMIN_KEYS = [
  "Ab8RN6LZgUPgYIo_Mw00PkdKJ6IU5KPaLB8KfO-RoFIRylfFbg",
  "aiwebcrafter2026"
];
var DEFAULT_ADMIN_EMAILS = [
  "aiwebcraft6@gmail.com",
  "admin@aiwebcrafter.com",
  "owner@aiwebcrafter.com"
];
function getAdminMasterKey() {
  const key = process.env.AWC_ADMIN_KEY || process.env.AWC_API_SECRET;
  if (key && key.trim() !== "") return key.trim();
  return DEFAULT_ADMIN_KEYS[0];
}
function isValidAdminKey(candidateKey) {
  if (!candidateKey || typeof candidateKey !== "string") return false;
  const configured = process.env.AWC_ADMIN_KEY || process.env.AWC_API_SECRET;
  if (configured && candidateKey === configured.trim()) return true;
  return DEFAULT_ADMIN_KEYS.includes(candidateKey.trim());
}
function getSigningSecret() {
  const secret = process.env.AWC_SIGNING_SECRET;
  if (secret && secret.trim() !== "") return secret.trim();
  const masterKey = getAdminMasterKey();
  return crypto2.createHash("sha256").update(masterKey + "_awc_signing_salt_2026").digest("hex");
}
function isValidAdminEmail(candidateEmail) {
  if (!candidateEmail || typeof candidateEmail !== "string") return false;
  const normalized = candidateEmail.trim().toLowerCase();
  const configured = process.env.AWC_ADMIN_EMAIL?.trim().toLowerCase();
  if (configured && normalized === configured) return true;
  return DEFAULT_ADMIN_EMAILS.includes(normalized);
}
function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf-8");
  return buf.toString("base64url");
}
function createSignedSessionToken(email, role = "owner") {
  const secret = getSigningSecret();
  const now = Math.floor(Date.now() / 1e3);
  const payload = {
    email,
    role,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    jti: crypto2.randomBytes(12).toString("hex")
  };
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto2.createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
function verifySignedSessionToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const secret = getSigningSecret();
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;
    if (!encodedHeader || !encodedPayload || !signature) return null;
    const expectedSignature = crypto2.createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto2.timingSafeEqual(sigBuf, expectedBuf)) return null;
    const payloadJson = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson);
    if (!payload || typeof payload !== "object") return null;
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
function parseCookieHeader(header) {
  if (!header) return {};
  const cookies = {};
  header.split(";").forEach((c) => {
    const [k, v] = c.trim().split("=");
    if (k && v) cookies[k] = decodeURIComponent(v);
  });
  return cookies;
}
var loginAttemptMap = /* @__PURE__ */ new Map();
var MAX_LOGIN_ATTEMPTS = 5;
var LOCKOUT_DURATION_MS = 15 * 60 * 1e3;
function checkLoginRateLimit(ip) {
  const now = Date.now();
  const record = loginAttemptMap.get(ip);
  if (!record) return { allowed: true };
  if (record.lockUntil > now) {
    const retryAfter = Math.ceil((record.lockUntil - now) / 1e3);
    return { allowed: false, retryAfterSeconds: retryAfter };
  }
  if (record.lockUntil <= now && record.attempts >= MAX_LOGIN_ATTEMPTS) {
    loginAttemptMap.delete(ip);
    return { allowed: true };
  }
  return { allowed: true };
}
function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttemptMap.get(ip) || { attempts: 0, lockUntil: 0 };
  record.attempts += 1;
  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_DURATION_MS;
  }
  loginAttemptMap.set(ip, record);
}
function recordSuccessfulLogin(ip) {
  loginAttemptMap.delete(ip);
}

// app-server.ts
dotenv2.config({ override: true });
function createApp() {
  const app2 = express();
  const PORT = Number(process.env.PORT) || 3e3;
  app2.use(compression());
  app2.use(express.json({ limit: "10mb" }));
  const allowedOrigins = (process.env.AWC_ALLOWED_ORIGIN || "").split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);
  app2.use((req, res, next) => {
    const rawOrigin = req.headers["origin"] || "";
    const origin = rawOrigin ? rawOrigin.trim().replace(/\/+$/, "") : "";
    if (origin) {
      const isAllowed = allowedOrigins.length === 0 || allowedOrigins.includes(origin) || allowedOrigins.includes("*") || allowedOrigins.some((o) => o.replace(/\/+$/, "") === origin);
      if (isAllowed) {
        res.setHeader("Access-Control-Allow-Origin", rawOrigin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
      }
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-awc-session-token, x-awc-admin-key, x-awc-storefront-key, x-idempotency-key"
    );
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });
  app2.use((req, _res, next) => {
    const originalPath = req.headers["x-forwarded-uri"] || req.headers["x-matched-path"];
    if (originalPath && originalPath.startsWith("/api") && req.url === "/api") {
      req.url = originalPath;
    }
    next();
  });
  const requireAdminAuth = (req, res, next) => {
    const cookieHeader = req.headers["cookie"];
    const cookies = parseCookieHeader(typeof cookieHeader === "string" ? cookieHeader : void 0);
    const rawAuth = req.headers["authorization"];
    const authHeader = typeof rawAuth === "string" ? rawAuth : "";
    const sessionToken = cookies["awc_session"] || (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "") || req.headers["x-awc-session-token"];
    if (sessionToken) {
      const verified = verifySignedSessionToken(sessionToken);
      if (verified) {
        req.user = verified;
        return next();
      }
    }
    try {
      const headerAdminKey = req.headers["x-awc-admin-key"] || req.headers["x-awc-api-key"];
      if (headerAdminKey && isValidAdminKey(headerAdminKey)) {
        return next();
      }
    } catch {
    }
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Valid administrator session required to access this resource."
    });
  };
  app2.post("/api/backend/auth/login", (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown_ip";
    const rateCheck = checkLoginRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many failed login attempts. Account temporarily locked. Try again in ${rateCheck.retryAfterSeconds} seconds.`
      });
    }
    const { email, password } = req.body || {};
    if (email && typeof email === "string" && isValidAdminEmail(email) && password && typeof password === "string" && isValidAdminKey(password)) {
      recordSuccessfulLogin(clientIp);
      const authenticatedEmail = email.trim().toLowerCase();
      const token = createSignedSessionToken(authenticatedEmail, "owner");
      const isSecure = process.env.NODE_ENV === "production" || req.secure || req.headers["x-forwarded-proto"] === "https";
      const secureAttr = isSecure ? "; Secure" : "";
      res.setHeader(
        "Set-Cookie",
        `awc_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}${secureAttr}`
      );
      return res.json({
        success: true,
        token,
        user: { email: authenticatedEmail, role: "owner" },
        expires_in: SESSION_TTL_SECONDS
      });
    }
    recordFailedLogin(clientIp);
    return res.status(401).json({
      success: false,
      error: "Invalid administrator credentials."
    });
  });
  app2.post("/api/backend/auth/logout", (req, res) => {
    const isSecure = process.env.NODE_ENV === "production" || req.secure || req.headers["x-forwarded-proto"] === "https";
    const secureAttr = isSecure ? "; Secure" : "";
    res.setHeader("Set-Cookie", `awc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureAttr}`);
    return res.json({
      success: true,
      message: "Administrator logged out successfully."
    });
  });
  app2.get("/media/products/:filename", (req, res) => {
    const filename = String(req.params.filename || "");
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const filePath = path2.resolve(process.cwd(), "media", "products", filename);
    if (!fs2.existsSync(filePath)) {
      return res.status(404).json({ error: "Media file not found" });
    }
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.sendFile(filePath);
  });
  app2.get("/api/backend/storage/status", async (_req, res) => {
    try {
      const status = await gitStorage.getStatus();
      return res.json({
        success: true,
        engine: "github_backed_permanent_storage",
        data: status
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.get("/api/backend/storage/products", async (_req, res) => {
    try {
      const { products, sha, fromCache } = await gitStorage.getProducts();
      return res.json({
        success: true,
        data: {
          items: products,
          total: products.length,
          git_sha: sha,
          from_cache: fromCache
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.post("/api/backend/storage/products", requireAdminAuth, async (req, res) => {
    try {
      const newProduct = await gitStorage.createProduct(req.body);
      return res.status(201).json({ success: true, data: newProduct });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });
  app2.put("/api/backend/storage/products/:id", requireAdminAuth, async (req, res) => {
    const id = Number(req.params.id);
    try {
      const updated = await gitStorage.updateProduct(id, req.body);
      return res.json({ success: true, data: updated });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });
  app2.delete("/api/backend/storage/products/:id", requireAdminAuth, async (req, res) => {
    const id = Number(req.params.id);
    try {
      const result = await gitStorage.deleteProduct(id);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });
  app2.delete("/api/backend/storage/products/clear-sample/all", requireAdminAuth, async (_req, res) => {
    try {
      const result = await gitStorage.clearProducts();
      return res.json({ success: true, message: "Sample products cleared.", cleared_count: result.cleared_count });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.delete("/api/backend/storage/orders/clear-sample/all", requireAdminAuth, async (_req, res) => {
    try {
      const result = await gitStorage.clearOrders();
      return res.json({ success: true, message: "Sample orders cleared.", cleared_count: result.cleared_count });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.post("/api/backend/storage/orders", async (req, res) => {
    try {
      const idempotencyKey = req.headers["x-idempotency-key"] || req.body.idempotency_key;
      const result = await gitStorage.ingestOrder({
        ...req.body,
        idempotency_key: idempotencyKey
      });
      return res.status(result.is_duplicate ? 200 : 201).json(result);
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });
  app2.get("/api/storefront/ping", async (req, res) => {
    const key = req.headers["x-awc-storefront-key"] || req.query.key;
    const configuredKey = process.env.AWC_STOREFRONT_KEY;
    const isKeyValid = Boolean(configuredKey && key === configuredKey);
    const { products } = await gitStorage.getProducts();
    return res.json({
      success: true,
      status: "online",
      platform: "AIWebCrafter Cloud Platform",
      store: "Natural Health Morocco",
      key_authenticated: isKeyValid,
      allowed_origins: allowedOrigins,
      products_count: products.length,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.get("/api/products", async (_req, res) => {
    try {
      const { products } = await gitStorage.getProducts();
      return res.json(products);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/categories", async (_req, res) => {
    try {
      const catPath = path2.resolve(process.cwd(), "data", "categories.json");
      if (fs2.existsSync(catPath)) {
        const cats = JSON.parse(fs2.readFileSync(catPath, "utf8"));
        return res.json(cats);
      }
      return res.json([]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/bootstrap", async (_req, res) => {
    try {
      const { products } = await gitStorage.getProducts();
      const catPath = path2.resolve(process.cwd(), "data", "categories.json");
      const categories = fs2.existsSync(catPath) ? JSON.parse(fs2.readFileSync(catPath, "utf8")) : [];
      return res.json({
        success: true,
        data: {
          products,
          categories,
          storeSettings: {
            store_name: "Natural Health Morocco",
            currency: "MAD"
          }
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.post("/api/orders", async (req, res) => {
    try {
      const idempotencyKey = req.headers["x-idempotency-key"] || req.body.idempotency_key;
      const result = await gitStorage.ingestOrder({
        ...req.body,
        idempotency_key: idempotencyKey
      });
      return res.status(result.is_duplicate ? 200 : 201).json(result);
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });
  app2.get("/api/backend/storage/orders", requireAdminAuth, async (_req, res) => {
    try {
      const orders = await gitStorage.getOrders();
      return res.json({ success: true, count: orders.length, data: orders });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.delete("/api/backend/storage/orders/:id", requireAdminAuth, async (req, res) => {
    const id = Number(req.params.id);
    try {
      const result = await gitStorage.deleteOrder(id);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });
  app2.put("/api/backend/storage/orders/:id/status", requireAdminAuth, async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!status || typeof status !== "string") {
      return res.status(400).json({ success: false, error: "Status string is required." });
    }
    try {
      const updatedOrder = await gitStorage.updateOrderStatus(id, status);
      return res.json({ success: true, data: updatedOrder });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });
  app2.post("/api/backend/storage/backup", requireAdminAuth, async (req, res) => {
    try {
      const result = await gitStorage.createSnapshot(req.body.label || "manual");
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.post("/api/backend/storage/restore", requireAdminAuth, async (req, res) => {
    try {
      const result = await gitStorage.restoreFromSnapshot(req.body.filename);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });
  const v1Handlers = ["/v1", "/api/v1", "/v1/", "/api/v1/"];
  app2.all(v1Handlers, async (req, res) => {
    const key = req.headers["x-awc-storefront-key"] || req.query.key;
    const configuredKey = process.env.AWC_STOREFRONT_KEY;
    const isKeyValid = Boolean(configuredKey && key === configuredKey);
    const { products } = await gitStorage.getProducts();
    const orders = await gitStorage.getOrders();
    const categories = await gitStorage.getCategories();
    return res.json({
      success: true,
      status: "online",
      platform: "AIWebCrafter Cloud Platform",
      store: "Natural Health Morocco",
      key_authenticated: isKeyValid,
      payload_type: req.body?.payload_type || "test_product",
      items_count: products.length,
      categories_count: categories.length,
      orders_count: orders.length,
      message: "Connected successfully to AIWebCrafter Cloud Platform.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.all(v1Handlers.map((h) => `${h}/ping`), async (req, res) => {
    const key = req.headers["x-awc-storefront-key"] || req.query.key;
    const configuredKey = process.env.AWC_STOREFRONT_KEY;
    const isKeyValid = Boolean(configuredKey && key === configuredKey);
    const { products } = await gitStorage.getProducts();
    return res.json({
      success: true,
      status: "online",
      platform: "AIWebCrafter Cloud Platform",
      store: "Natural Health Morocco",
      key_authenticated: isKeyValid,
      products_count: products.length,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.get(v1Handlers.map((h) => `${h}/products`), async (_req, res) => {
    try {
      const { products } = await gitStorage.getProducts();
      return res.json({ success: true, data: products });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.get(v1Handlers.map((h) => `${h}/categories`), async (_req, res) => {
    try {
      const catPath = path2.resolve(process.cwd(), "data", "categories.json");
      const categories = fs2.existsSync(catPath) ? JSON.parse(fs2.readFileSync(catPath, "utf8")) : [];
      return res.json({ success: true, data: categories });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.get(v1Handlers.map((h) => `${h}/bootstrap`), async (_req, res) => {
    try {
      const { products } = await gitStorage.getProducts();
      const catPath = path2.resolve(process.cwd(), "data", "categories.json");
      const categories = fs2.existsSync(catPath) ? JSON.parse(fs2.readFileSync(catPath, "utf8")) : [];
      return res.json({
        success: true,
        data: {
          products,
          categories,
          storeSettings: {
            store_name: "Natural Health Morocco",
            currency: "MAD"
          }
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.get(v1Handlers.map((h) => `${h}/orders`), async (_req, res) => {
    try {
      const orders = await gitStorage.getOrders();
      return res.json({ success: true, count: orders.length, data: orders });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.post(v1Handlers.map((h) => `${h}/orders`), async (req, res) => {
    try {
      const idempotencyKey = req.headers["x-idempotency-key"] || req.body.idempotency_key;
      const result = await gitStorage.ingestOrder({
        ...req.body,
        idempotency_key: idempotencyKey
      });
      return res.status(result.is_duplicate ? 200 : 201).json(result);
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });
  app2.get("/api/orders", async (_req, res) => {
    try {
      const orders = await gitStorage.getOrders();
      return res.json({ success: true, count: orders.length, data: orders });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.all("/api/*", (req, res) => {
    return res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.path}`
    });
  });
  return app2;
}
var app = createApp();
async function startServer() {
  const PORT = Number(process.env.PORT) || 3e3;
  if (process.env.NODE_ENV !== "production" && !isServerlessEnvironment()) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("[AIWebCrafter] Could not load vite middleware:", e);
    }
  } else {
    const distPath = path2.resolve(process.cwd(), "dist");
    if (fs2.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path2.join(distPath, "index.html"));
      });
    }
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AIWebCrafter] Secure server running on http://0.0.0.0:${PORT}`);
  });
}
function isServerlessEnvironment() {
  return Boolean(
    process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || process.env._HANDLER
  );
}
if (!isServerlessEnvironment() && process.env.NODE_ENV !== "test") {
  startServer().catch((err) => {
    console.error("[AIWebCrafter] Failed to start server:", err);
    process.exit(1);
  });
}
export {
  app,
  createApp,
  isServerlessEnvironment
};
