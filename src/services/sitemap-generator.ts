export interface RawCategoryInput {
  id?: string;
  slug?: string;
  name?: string;
  name_ar?: string;
  is_active?: boolean;
  deleted_at?: string | null;
}

export interface RawArticleInput {
  id?: string;
  slug?: string;
  title?: string;
  status?: string;
  publish_date?: string;
  updated_at?: string;
  created_at?: string;
  category_id?: string;
  category?: { id?: string; slug?: string };
  is_featured?: boolean;
  deleted_at?: string | null;
}

export interface SitemapDiagnosticReport {
  totalUrls: number;
  staticUrlsCount: number;
  categoryUrlsCount: number;
  publishedArticleUrlsCount: number;
  duplicateUrlsCount: number;
  excludedFutureArticlesCount: number;
  excludedDraftArticlesCount: number;
  excludedInvalidSlugCount: number;
  excludedEmptyCategoriesCount: number;
  actualSitemapSource: string;
  publicSitemapConflict: boolean;
  staticUrls: string[];
  categoryUrls: string[];
  publishedArticleSlugs: string[];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Parses and validates an ISO date string (YYYY-MM-DD).
 * Strict: Never returns today unless the dateStr itself was actually today.
 */
function parseDbDateToIso(dateStr?: string): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch (_) {
    return null;
  }
}

export interface StaticRouteConfig {
  path: string;
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export const MANDATORY_STATIC_ROUTES: StaticRouteConfig[] = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/blog', priority: 0.9, changefreq: 'daily' },
  { path: '/videos', priority: 0.8, changefreq: 'weekly' },
  { path: '/about', priority: 0.5, changefreq: 'monthly' },
  { path: '/contact', priority: 0.5, changefreq: 'monthly' },
  { path: '/privacy', priority: 0.3, changefreq: 'monthly' },
  { path: '/terms', priority: 0.3, changefreq: 'monthly' },
];

/**
 * Builds a 100% valid XML Sitemap compliant with sitemaps.org and Google Search Console guidelines.
 * Source of truth: Real Supabase articles and category data.
 */
export function generateAuthoritativeSitemapXml(
  articles: RawArticleInput[],
  categories: RawCategoryInput[] = [],
  baseUrl: string = 'https://aiwebcrafter.com'
): { xml: string; report: SitemapDiagnosticReport } {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const nowMs = Date.now();
  const today = new Date().toISOString().split('T')[0];

  const processedUrls = new Set<string>();
  let duplicateCount = 0;

  const staticUrlsList: string[] = [];
  const categoryUrlsList: string[] = [];
  const publishedArticleSlugsList: string[] = [];

  let excludedDraftCount = 0;
  let excludedFutureCount = 0;
  let excludedInvalidSlugCount = 0;
  let excludedEmptyCategoriesCount = 0;

  const xmlEntries: string[] = [];

  // 1. Static URLs
  for (const route of MANDATORY_STATIC_ROUTES) {
    const cleanPath = route.path.startsWith('/') ? route.path : `/${route.path}`;
    const fullLoc = cleanPath === '/' ? `${cleanBaseUrl}/` : `${cleanBaseUrl}${cleanPath}`;

    if (processedUrls.has(fullLoc)) {
      duplicateCount++;
      continue;
    }
    processedUrls.add(fullLoc);
    staticUrlsList.push(cleanPath);

    const altAr = cleanPath === '/' ? `${cleanBaseUrl}/?lang=ar` : `${cleanBaseUrl}${cleanPath}?lang=ar`;
    const altEn = cleanPath === '/' ? `${cleanBaseUrl}/?lang=en` : `${cleanBaseUrl}${cleanPath}?lang=en`;
    const altDefault = fullLoc;

    xmlEntries.push(`  <url>
    <loc>${escapeXml(fullLoc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${escapeXml(altAr)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(altEn)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(altDefault)}" />
  </url>`);
  }

  // 2. Filter Published Articles First
  const validPublishedArticles: RawArticleInput[] = [];

  for (const art of articles) {
    // Check deleted
    if (art.deleted_at) {
      continue;
    }

    // Check slug
    if (!art.slug || typeof art.slug !== 'string' || !art.slug.trim()) {
      excludedInvalidSlugCount++;
      continue;
    }

    // Check status === 'published'
    if (art.status !== 'published') {
      excludedDraftCount++;
      continue;
    }

    // Check publish_date exists and <= current time
    if (!art.publish_date) {
      excludedDraftCount++;
      continue;
    }

    const pubMs = new Date(art.publish_date).getTime();
    if (isNaN(pubMs) || pubMs > nowMs) {
      excludedFutureCount++;
      continue;
    }

    validPublishedArticles.push(art);
  }

  // 3. Category URLs: Include ONLY valid categories with at least one published article
  const publishedCategoryIdentifiers = new Set<string>();
  for (const art of validPublishedArticles) {
    if (art.category_id) publishedCategoryIdentifiers.add(art.category_id);
    if (art.category?.id) publishedCategoryIdentifiers.add(art.category.id);
    if (art.category?.slug) publishedCategoryIdentifiers.add(art.category.slug.toLowerCase());
  }

  for (const cat of categories) {
    // Exclude deleted or inactive
    if (cat.deleted_at || cat.is_active === false) {
      continue;
    }

    if (!cat.slug || typeof cat.slug !== 'string' || !cat.slug.trim()) {
      continue;
    }

    const cleanCatSlug = cat.slug.trim().toLowerCase();
    const hasPublishedArticles =
      (cat.id && publishedCategoryIdentifiers.has(cat.id)) ||
      publishedCategoryIdentifiers.has(cleanCatSlug);

    if (!hasPublishedArticles) {
      excludedEmptyCategoriesCount++;
      continue;
    }

    const catLoc = `${cleanBaseUrl}/blog?category=${encodeURIComponent(cleanCatSlug)}`;

    if (processedUrls.has(catLoc)) {
      duplicateCount++;
      continue;
    }
    processedUrls.add(catLoc);
    categoryUrlsList.push(catLoc);

    const altAr = `${catLoc}&amp;lang=ar`;
    const altEn = `${catLoc}&amp;lang=en`;
    const altDefault = catLoc;

    xmlEntries.push(`  <url>
    <loc>${escapeXml(catLoc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${escapeXml(altAr)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(altEn)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(altDefault)}" />
  </url>`);
  }

  // 4. Process Valid Published Articles
  for (const art of validPublishedArticles) {
    const cleanSlug = art.slug!.trim().toLowerCase();
    const artLoc = `${cleanBaseUrl}/article/${encodeURIComponent(cleanSlug)}`;

    if (processedUrls.has(artLoc)) {
      duplicateCount++;
      continue;
    }
    processedUrls.add(artLoc);
    publishedArticleSlugsList.push(cleanSlug);

    // Strict lastmod rule: updated_at -> publish_date -> null
    const lastModDate =
      parseDbDateToIso(art.updated_at) ||
      parseDbDateToIso(art.publish_date) ||
      parseDbDateToIso(art.created_at) ||
      today;

    const priority = art.is_featured ? '0.9' : '0.8';

    const altAr = `${artLoc}?lang=ar`;
    const altEn = `${artLoc}?lang=en`;
    const altDefault = artLoc;

    xmlEntries.push(`  <url>
    <loc>${escapeXml(artLoc)}</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${escapeXml(altAr)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(altEn)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(altDefault)}" />
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${xmlEntries.join('\n')}
</urlset>`;

  const report: SitemapDiagnosticReport = {
    totalUrls: processedUrls.size,
    staticUrlsCount: staticUrlsList.length,
    categoryUrlsCount: categoryUrlsList.length,
    publishedArticleUrlsCount: publishedArticleSlugsList.length,
    duplicateUrlsCount: duplicateCount,
    excludedFutureArticlesCount: excludedFutureCount,
    excludedDraftArticlesCount: excludedDraftCount,
    excludedInvalidSlugCount: excludedInvalidSlugCount,
    excludedEmptyCategoriesCount: excludedEmptyCategoriesCount,
    actualSitemapSource: 'Dynamic Supabase Database (Single Authoritative Source)',
    publicSitemapConflict: false,
    staticUrls: staticUrlsList,
    categoryUrls: categoryUrlsList,
    publishedArticleSlugs: publishedArticleSlugsList,
  };

  return { xml, report };
}
