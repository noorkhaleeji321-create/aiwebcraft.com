import fs from 'fs';
import path from 'path';
import { SEED_PRODUCTS, SEED_CATEGORIES } from '../src/db/seedData';

// 1. Ensure target directories exist
const dataDir = path.resolve(process.cwd(), 'data');
const mediaDir = path.resolve(process.cwd(), 'media', 'products');
const ordersDir = path.resolve(process.cwd(), 'data', 'orders');
const backupsDir = path.resolve(process.cwd(), 'data', 'backups');

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(mediaDir, { recursive: true });
fs.mkdirSync(ordersDir, { recursive: true });
fs.mkdirSync(backupsDir, { recursive: true });

// 2. Export 105 products to data/products.json (exact match, no modification)
const productsPath = path.join(dataDir, 'products.json');
fs.writeFileSync(productsPath, JSON.stringify(SEED_PRODUCTS, null, 2), 'utf-8');
console.log(`[EXPORT] Successfully exported ${SEED_PRODUCTS.length} products to ${productsPath}`);

// 3. Export categories to data/categories.json
const categoriesPath = path.join(dataDir, 'categories.json');
fs.writeFileSync(categoriesPath, JSON.stringify(SEED_CATEGORIES, null, 2), 'utf-8');
console.log(`[EXPORT] Successfully exported ${SEED_CATEGORIES.length} categories to ${categoriesPath}`);

// 4. Copy images from /src/assets/images to /media/products
const srcImagesDir = path.resolve(process.cwd(), 'src', 'assets', 'images');
if (fs.existsSync(srcImagesDir)) {
  const imageFiles = fs.readdirSync(srcImagesDir);
  for (const file of imageFiles) {
    const srcFile = path.join(srcImagesDir, file);
    const destFile = path.join(mediaDir, file);
    fs.copyFileSync(srcFile, destFile);
    console.log(`[MEDIA] Copied image ${file} -> ${destFile}`);

    // Also create clean alias for intuitive naming
    if (file.includes('argan_oil')) {
      fs.copyFileSync(srcFile, path.join(mediaDir, 'moroccan_argan_oil_bottle.jpg'));
    }
    if (file.includes('leather_bag')) {
      fs.copyFileSync(srcFile, path.join(mediaDir, 'moroccan_leather_bag.jpg'));
    }
    if (file.includes('smart_watch')) {
      fs.copyFileSync(srcFile, path.join(mediaDir, 'smart_watch_pro.jpg'));
    }
    if (file.includes('artisan_teapot')) {
      fs.copyFileSync(srcFile, path.join(mediaDir, 'ceramic_artisan_teapot.jpg'));
    }
  }
}

// 5. Create initial safety backup
const initialBackupPath = path.join(backupsDir, `backup_initial_sqlite_sync_${Date.now()}.json`);
fs.writeFileSync(initialBackupPath, JSON.stringify({
  created_at: new Date().toISOString(),
  products_count: SEED_PRODUCTS.length,
  categories_count: SEED_CATEGORIES.length,
  products: SEED_PRODUCTS,
  categories: SEED_CATEGORIES
}, null, 2), 'utf-8');

console.log(`[BACKUP] Initial safety backup created at: ${initialBackupPath}`);
console.log('[DONE] Phase 2 permanent file structure initialized successfully.');
