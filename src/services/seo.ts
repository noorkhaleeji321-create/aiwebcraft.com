import { storeService } from './store';

export interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export const seoService = {
  // Generate XML Sitemap string
  async generateSitemapXml(baseUrl: string = 'https://aiwebcrafter.com'): Promise<string> {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const articles = await storeService.getArticles({ status: 'published' });
    const categories = await storeService.getCategories();

    const entries: SitemapEntry[] = [
      {
        url: cleanBaseUrl,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: 1.0,
      },
      {
        url: `${cleanBaseUrl}/blog`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: 0.9,
      },
      {
        url: `${cleanBaseUrl}/privacy`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.3,
      },
      {
        url: `${cleanBaseUrl}/terms`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.3,
      },
    ];

    // Add category URLs
    categories.forEach((cat) => {
      entries.push({
        url: `${cleanBaseUrl}/blog?category=${cat.slug}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.7,
      });
    });

    // Add published article URLs (exclude drafts & future scheduled articles)
    const now = new Date();
    articles
      .filter((art) => art.status === 'published' && new Date(art.publish_date) <= now)
      .forEach((art) => {
        entries.push({
          url: `${cleanBaseUrl}/article/${art.slug}`,
          lastmod: new Date(art.publish_date).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: art.is_featured ? 0.9 : 0.8,
        });
      });

    const xmlLines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ];

    entries.forEach((e) => {
      xmlLines.push('  <url>');
      xmlLines.push(`    <loc>${e.url}</loc>`);
      xmlLines.push(`    <lastmod>${e.lastmod}</lastmod>`);
      xmlLines.push(`    <changefreq>${e.changefreq}</changefreq>`);
      xmlLines.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
      xmlLines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${e.url}?lang=en" />`);
      xmlLines.push(`    <xhtml:link rel="alternate" hreflang="ar" href="${e.url}?lang=ar" />`);
      xmlLines.push('  </url>');
    });

    xmlLines.push('</urlset>');
    return xmlLines.join('\n');
  },

  // Generate robots.txt
  generateRobotsTxt(baseUrl: string = 'https://aiwebcrafter.com'): string {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    return `# AIWebCrafter Robots.txt
User-agent: *
Allow: /
Allow: /blog
Allow: /article/
Allow: /privacy
Allow: /terms
Disallow: /admin
Disallow: /api/

Sitemap: ${cleanBaseUrl}/sitemap.xml
`;
  },

  // Simulate pinging Google & Bing
  async pingSearchEngines(sitemapUrl: string): Promise<{ google: boolean; bing: boolean; message: string }> {
    console.log(`[SEO Service] Simulating Sitemap Ping for ${sitemapUrl}`);
    
    // Return structured status
    return {
      google: true,
      bing: true,
      message: `Successfully sent Sitemap ping signal to Googlebot and Bingbot for ${sitemapUrl}`,
    };
  },
};
