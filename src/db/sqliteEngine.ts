import initSqlJs, { Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
// @ts-ignore
import initSqlJsInline from 'sql.js/dist/sql-wasm-inline.js';
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_CUSTOMERS, SEED_ORDERS, SEED_STORE_SETTINGS, INITIAL_ACTIVITY_LOGS } from './seedData';
import { Product, Category, Customer, Order, OrderItem, StoreSetting, ActivityLog } from '../types';

let dbInstance: Database | null = null;
let isInitializing = false;
let initPromise: Promise<Database> | null = null;

const DB_STORAGE_KEY = 'aiwebcrafter_sqlite_v2';

export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      let SQL: any;
      try {
        SQL = await initSqlJs({
          locateFile: () => wasmUrl
        });
      } catch (e1) {
        console.warn("locateFile with wasmUrl failed, attempting inline wasm:", e1);
        try {
          SQL = await initSqlJsInline();
        } catch (e2) {
          console.warn("initSqlJsInline failed, trying /sql-wasm.wasm:", e2);
          SQL = await initSqlJs({
            locateFile: () => '/sql-wasm.wasm'
          });
        }
      }

      // Attempt to load from IndexedDB or localStorage
      const savedDb = localStorage.getItem(DB_STORAGE_KEY);
      if (savedDb) {
        try {
          const binary = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
          const restoredInstance: Database = new SQL.Database(binary);
          // verify database has required tables
          const check = restoredInstance.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='products'");
          if (check.length > 0 && check[0].values.length > 0) {
            dbInstance = restoredInstance;
            return restoredInstance;
          }
        } catch (e) {
          console.warn("Could not restore saved SQLite DB, initializing fresh schema:", e);
        }
      }

      // Fresh initialization
      const freshInstance: Database = new SQL.Database();
      initSchema(freshInstance);
      seedInitialData(freshInstance);
      persistDatabase(freshInstance);
      dbInstance = freshInstance;
      return freshInstance;
    } catch (err) {
      console.error("Failed to load SQL.js SQLite engine:", err);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

function initSchema(db: Database) {
  db.run("PRAGMA foreign_keys = ON;");

  const schema = `
    -- Categories Table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_ar TEXT,
      slug TEXT UNIQUE NOT NULL,
      parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      description TEXT,
      icon TEXT DEFAULT 'Folder',
      sort_order INTEGER DEFAULT 0
    );

    -- Products Table
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      name_ar TEXT,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      description_ar TEXT,
      price REAL NOT NULL,
      promo_price REAL,
      category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
      sku TEXT UNIQUE NOT NULL,
      stock_quantity INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      attributes_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Product Images (Linked to Permanent Media Storage)
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      alt_text TEXT,
      display_order INTEGER DEFAULT 0,
      is_primary INTEGER DEFAULT 0,
      file_size_bytes INTEGER,
      width INTEGER,
      height INTEGER,
      format TEXT,
      sha256_hash TEXT
    );

    -- Product Variants Table
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      price REAL,
      stock_quantity INTEGER DEFAULT 0,
      option_values_json TEXT
    );

    -- Inventory Records Table
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
      location TEXT DEFAULT 'Main Warehouse - Casablanca',
      quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 5,
      updated_at TEXT NOT NULL
    );

    -- Customers Table
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      address_line1 TEXT NOT NULL,
      address_line2 TEXT,
      city TEXT NOT NULL,
      state_region TEXT,
      postal_code TEXT,
      country TEXT DEFAULT 'Morocco',
      notes TEXT,
      created_at TEXT NOT NULL
    );

    -- Orders Table
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      shipping_address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT,
      total_amount REAL NOT NULL,
      currency TEXT DEFAULT 'MAD',
      payment_method TEXT DEFAULT 'Cash On Delivery (COD)',
      payment_status TEXT DEFAULT 'pending',
      order_status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Order Items Table
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
      product_name TEXT NOT NULL,
      sku TEXT,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      line_total REAL NOT NULL
    );

    -- Store Settings Table
    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      category TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Admin Users Table
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'owner',
      two_factor_enabled INTEGER DEFAULT 0,
      last_login TEXT
    );

    -- Activity Audit Logs Table
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      action_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      actor TEXT NOT NULL,
      details TEXT,
      ip_address TEXT
    );

    -- Relational Indexes for Optimal Query Performance
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_logs(timestamp);
  `;

  db.exec(schema);
}

function seedInitialData(db: Database) {
  // Insert Categories
  for (const c of SEED_CATEGORIES) {
    db.run(
      `INSERT OR IGNORE INTO categories (id, name, name_ar, slug, parent_id, description, icon, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.name_ar, c.slug, c.parent_id, c.description, c.icon, c.sort_order]
    );
  }

  // Insert Products & Images & Inventory
  for (const p of SEED_PRODUCTS) {
    db.run(
      `INSERT OR IGNORE INTO products (id, uuid, name, name_ar, slug, description, description_ar, price, promo_price, category_id, sku, stock_quantity, is_published, is_featured, attributes_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.uuid,
        p.name,
        p.name_ar,
        p.slug,
        p.description,
        p.description_ar,
        p.price,
        p.promo_price,
        p.category_id,
        p.sku,
        p.stock_quantity,
        p.is_published ? 1 : 0,
        p.is_featured ? 1 : 0,
        p.attributes_json,
        p.created_at,
        p.updated_at
      ]
    );

    // Images
    if (p.images && p.images.length > 0) {
      for (const img of p.images) {
        db.run(
          `INSERT OR IGNORE INTO product_images (product_id, image_url, alt_text, display_order, is_primary, file_size_bytes, width, height, format, sha256_hash)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, img.image_url, img.alt_text, img.display_order, img.is_primary ? 1 : 0, img.file_size_bytes, img.width, img.height, img.format, img.sha256_hash]
        );
      }
    }

    // Inventory
    db.run(
      `INSERT OR IGNORE INTO inventory (product_id, variant_id, location, quantity, low_stock_threshold, updated_at)
       VALUES (?, NULL, 'Main Warehouse - Casablanca', ?, 5, datetime('now'))`,
      [p.id, p.stock_quantity]
    );
  }

  // Customers
  for (const cust of SEED_CUSTOMERS) {
    db.run(
      `INSERT OR IGNORE INTO customers (id, uuid, first_name, last_name, email, phone, address_line1, city, state_region, postal_code, country, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cust.id, cust.uuid, cust.first_name, cust.last_name, cust.email, cust.phone, cust.address_line1, cust.city, cust.state_region ?? null, cust.postal_code ?? null, cust.country, cust.notes ?? null, cust.created_at]
    );
  }

  // Orders & Items
  for (const ord of SEED_ORDERS) {
    db.run(
      `INSERT OR IGNORE INTO orders (id, order_number, customer_id, customer_name, customer_phone, customer_email, shipping_address, city, postal_code, total_amount, currency, payment_method, payment_status, order_status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ord.id,
        ord.order_number,
        ord.customer_id,
        ord.customer_name,
        ord.customer_phone,
        ord.customer_email,
        ord.shipping_address,
        ord.city,
        ord.postal_code,
        ord.total_amount,
        ord.currency,
        ord.payment_method,
        ord.payment_status,
        ord.order_status,
        ord.notes,
        ord.created_at,
        ord.updated_at
      ]
    );

    if (ord.items) {
      for (const it of ord.items) {
        db.run(
          `INSERT OR IGNORE INTO order_items (id, order_id, product_id, product_name, sku, unit_price, quantity, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [it.id, ord.id, it.product_id, it.product_name, it.sku, it.unit_price, it.quantity, it.line_total]
        );
      }
    }
  }

  // Store Settings
  for (const s of SEED_STORE_SETTINGS) {
    db.run(
      `INSERT OR REPLACE INTO store_settings (key, value, category, updated_at) VALUES (?, ?, ?, ?)`,
      [s.key, s.value, s.category, s.updated_at]
    );
  }

  // Admin User
  db.run(
    `INSERT OR IGNORE INTO admin_users (id, username, email, password_hash, role, two_factor_enabled, last_login)
     VALUES (1, 'owner', 'owner@aiwebcrafter.com', 'argon2id$pbkdf2_sha256$100000$aiwebcrafter_owner_secured', 'owner', 0, datetime('now'))`
  );

  // Activity Logs
  for (const log of INITIAL_ACTIVITY_LOGS) {
    db.run(
      `INSERT OR IGNORE INTO activity_logs (id, timestamp, action_type, entity_type, entity_id, actor, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [log.id, log.timestamp, log.action_type, log.entity_type, log.entity_id, log.actor, log.details, log.ip_address]
    );
  }
}

export function persistDatabase(db?: Database) {
  const target = db || dbInstance;
  if (!target) return;
  try {
    const data = target.export();
    // Convert to base64
    let binary = '';
    const bytes = new Uint8Array(data);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i += 32768) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + 32768, len))));
    }
    const b64 = btoa(binary);
    localStorage.setItem(DB_STORAGE_KEY, b64);
  } catch (err) {
    console.error("Failed to persist SQLite DB:", err);
  }
}

// SQL Query Runner
export interface SqlQueryResult {
  columns: string[];
  values: any[][];
  rowsAffected?: number;
  executionTimeMs: number;
}

export async function executeSqlQuery(sql: string): Promise<SqlQueryResult> {
  const db = await getDatabase();
  const startTime = performance.now();
  
  try {
    const results = db.exec(sql);
    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
    persistDatabase(db);

    if (results.length === 0) {
      return {
        columns: [],
        values: [],
        rowsAffected: 0,
        executionTimeMs
      };
    }

    return {
      columns: results[0].columns,
      values: results[0].values,
      rowsAffected: results[0].values.length,
      executionTimeMs
    };
  } catch (err: any) {
    throw new Error(err.message || String(err));
  }
}

// Entity Accessors
export async function getAllProducts(): Promise<Product[]> {
  const db = await getDatabase();
  const res = db.exec(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.id ASC
  `);

  if (res.length === 0) return [];
  const cols = res[0].columns;
  const products: Product[] = [];

  for (const row of res[0].values) {
    const item: any = {};
    cols.forEach((col, idx) => {
      item[col] = row[idx];
    });

    // Fetch images for this product
    const imgRes = db.exec(`SELECT * FROM product_images WHERE product_id = ${item.id} ORDER BY display_order ASC`);
    const images = imgRes.length > 0 ? imgRes[0].values.map(r => {
      const img: any = {};
      imgRes[0].columns.forEach((c, i) => img[c] = r[i]);
      img.is_primary = Boolean(img.is_primary);
      return img;
    }) : [];

    products.push({
      ...item,
      is_published: Boolean(item.is_published),
      is_featured: Boolean(item.is_featured),
      images
    });
  }

  return products;
}

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const res = db.exec(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.sort_order ASC
  `);

  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => obj[col] = row[idx]);
    return obj;
  });
}

export async function getAllOrders(): Promise<Order[]> {
  const db = await getDatabase();
  const res = db.exec(`SELECT * FROM orders ORDER BY id DESC`);
  if (res.length === 0) return [];
  
  const cols = res[0].columns;
  const orders: Order[] = [];

  for (const row of res[0].values) {
    const ord: any = {};
    cols.forEach((col, idx) => ord[col] = row[idx]);

    // get items
    const itRes = db.exec(`SELECT * FROM order_items WHERE order_id = ${ord.id}`);
    const items: OrderItem[] = itRes.length > 0 ? itRes[0].values.map(r => {
      const it: any = {};
      itRes[0].columns.forEach((c, i) => it[c] = r[i]);
      return it;
    }) : [];

    orders.push({ ...ord, items });
  }

  return orders;
}

export async function getAllCustomers(): Promise<Customer[]> {
  const db = await getDatabase();
  const res = db.exec(`
    SELECT c.*, COUNT(o.id) as total_orders, COALESCE(SUM(o.total_amount), 0) as total_spent
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id
    ORDER BY c.id DESC
  `);

  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => obj[col] = row[idx]);
    return obj;
  });
}

export async function getAllSettings(): Promise<StoreSetting[]> {
  const db = await getDatabase();
  const res = db.exec(`SELECT * FROM store_settings ORDER BY category, key`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => obj[col] = row[idx]);
    return obj;
  });
}

export async function getAllLogs(): Promise<ActivityLog[]> {
  const db = await getDatabase();
  const res = db.exec(`SELECT * FROM activity_logs ORDER BY id DESC LIMIT 200`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => obj[col] = row[idx]);
    return obj;
  });
}

export async function addActivityLog(
  action_type: ActivityLog['action_type'],
  entity_type: string,
  entity_id: string,
  details: string,
  actor = 'owner@aiwebcrafter.com'
) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO activity_logs (timestamp, action_type, entity_type, entity_id, actor, details, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, '127.0.0.1')`,
    [now, action_type, entity_type, entity_id, actor, details]
  );
  persistDatabase(db);
}

export async function getDatabaseStats() {
  const db = await getDatabase();
  const countTable = (tbl: string) => {
    try {
      const res = db.exec(`SELECT COUNT(*) FROM ${tbl}`);
      return res.length > 0 ? Number(res[0].values[0][0]) : 0;
    } catch {
      return 0;
    }
  };

  const productsCount = countTable('products');
  const categoriesCount = countTable('categories');
  const ordersCount = countTable('orders');
  const customersCount = countTable('customers');
  const imagesCount = countTable('product_images');
  const logsCount = countTable('activity_logs');

  // Compute database size in bytes
  const exported = db.export();
  const sizeBytes = exported.byteLength;

  return {
    productsCount,
    categoriesCount,
    ordersCount,
    customersCount,
    imagesCount,
    logsCount,
    sizeBytes,
    tablesCount: 11
  };
}

export async function exportFullDatabaseJson(): Promise<string> {
  const db = await getDatabase();
  const tables = [
    'categories',
    'products',
    'product_images',
    'product_variants',
    'inventory',
    'customers',
    'orders',
    'order_items',
    'store_settings',
    'admin_users',
    'activity_logs'
  ];

  const dump: Record<string, any> = {
    schema_version: "1.0.0",
    engine: "SQLite3 Relational Database Engine (0 MAD)",
    created_at: new Date().toISOString(),
    store_platform: "AIWebCrafter.com Private Infrastructure",
    tables: {}
  };

  for (const tbl of tables) {
    const res = db.exec(`SELECT * FROM ${tbl}`);
    if (res.length > 0) {
      const cols = res[0].columns;
      dump.tables[tbl] = res[0].values.map(row => {
        const item: any = {};
        cols.forEach((col, idx) => item[col] = row[idx]);
        return item;
      });
    } else {
      dump.tables[tbl] = [];
    }
  }

  return JSON.stringify(dump, null, 2);
}

export async function exportRawSqliteBinary(): Promise<Uint8Array> {
  const db = await getDatabase();
  return db.export();
}
