import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAuthoritativeSitemapXml, RawArticleInput, RawCategoryInput } from '../src/services/sitemap-generator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  console.log('----------------------------------------------------');
  console.log('[Sitemap Generator] Starting authoritative sitemap generation...');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const baseUrl = process.env.APP_URL || 'https://aiwebcrafter.com';

  let articles: RawArticleInput[] = [];
  let categories: RawCategoryInput[] = [];

  if (supabaseUrl && supabaseKey) {
    try {
      const client = createClient(supabaseUrl, supabaseKey);
      const [artRes, catRes] = await Promise.all([
        client
          .from('articles')
          .select('id, slug, title, status, publish_date, updated_at, created_at, category_id, is_featured')
          .eq('status', 'published'),
        client
          .from('categories')
          .select('*')
      ]);

      if (!artRes.error && artRes.data) {
        articles = artRes.data as RawArticleInput[];
        console.log(`[Sitemap Generator] Retrieved ${articles.length} published articles from Supabase.`);
      } else {
        console.warn(`[Sitemap Generator] Supabase articles query warning: ${artRes.error?.message || 'No data'}`);
      }

      if (!catRes.error && catRes.data) {
        categories = catRes.data as RawCategoryInput[];
        console.log(`[Sitemap Generator] Retrieved ${categories.length} categories from Supabase.`);
      }
    } catch (e: any) {
      console.warn(`[Sitemap Generator] Supabase connection failed: ${e?.message || e}`);
    }
  } else {
    console.warn('[Sitemap Generator] Supabase credentials not found in env, using empty set for static base.');
  }

  const { xml, report } = generateAuthoritativeSitemapXml(articles, categories, baseUrl);

  // Write to public/sitemap.xml
  const publicDir = path.resolve(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicSitemapPath = path.resolve(publicDir, 'sitemap.xml');
  fs.writeFileSync(publicSitemapPath, xml, 'utf-8');
  console.log(`[Sitemap Generator] Wrote ${xml.length} bytes to ${publicSitemapPath}`);

  // Write to dist/sitemap.xml if dist exists
  const distDir = path.resolve(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    const distSitemapPath = path.resolve(distDir, 'sitemap.xml');
    fs.writeFileSync(distSitemapPath, xml, 'utf-8');
    console.log(`[Sitemap Generator] Wrote ${xml.length} bytes to ${distSitemapPath}`);
  }

  console.log('[Sitemap Generator] Diagnostic Summary:');
  console.log(`- Total URLs: ${report.totalUrls}`);
  console.log(`- Static URLs Count: ${report.staticUrlsCount} (${report.staticUrls.join(', ')})`);
  console.log(`- Category URLs Count: ${report.categoryUrlsCount}`);
  console.log(`- Published Article URLs Count: ${report.publishedArticleUrlsCount}`);
  console.log(`- Duplicate URLs Count: ${report.duplicateUrlsCount}`);
  console.log(`- Excluded Future Articles Count: ${report.excludedFutureArticlesCount}`);
  console.log(`- Excluded Draft Articles Count: ${report.excludedDraftArticlesCount}`);
  console.log(`- Actual Sitemap Source: ${report.actualSitemapSource}`);
  console.log(`- Public Sitemap Conflict: ${report.publicSitemapConflict}`);
  console.log('----------------------------------------------------');
}

main().catch((err) => {
  console.error('[Sitemap Generator Error]:', err);
  process.exit(1);
});
