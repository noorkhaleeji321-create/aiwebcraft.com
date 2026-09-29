import { storeService } from './store';
import { generateAuthoritativeSitemapXml, RawArticleInput, RawCategoryInput } from './sitemap-generator';

export const seoService = {
  // Generate XML Sitemap string from real Supabase published data
  async generateSitemapXml(baseUrl: string = 'https://aiwebcrafter.com'): Promise<string> {
    const [articles, categories] = await Promise.all([
      storeService.getArticles({ status: 'published' }),
      storeService.getCategories()
    ]);
    const { xml } = generateAuthoritativeSitemapXml(
      articles as RawArticleInput[],
      categories as RawCategoryInput[],
      baseUrl
    );
    return xml;
  },

  // Get full diagnostic report of current sitemap
  async getSitemapDiagnostic(baseUrl: string = 'https://aiwebcrafter.com') {
    const [articles, categories] = await Promise.all([
      storeService.getArticles({ status: 'published' }),
      storeService.getCategories()
    ]);
    const { xml, report } = generateAuthoritativeSitemapXml(
      articles as RawArticleInput[],
      categories as RawCategoryInput[],
      baseUrl
    );
    return { xml, report };
  },

  // Generate robots.txt
  generateRobotsTxt(baseUrl: string = 'https://aiwebcrafter.com'): string {
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    return `# AIWebCrafter Robots.txt
User-agent: *
Allow: /
Allow: /blog
Allow: /videos
Allow: /article/
Allow: /about
Allow: /contact
Allow: /privacy
Allow: /terms
Disallow: /admin
Disallow: /api/

Sitemap: ${cleanBaseUrl}/sitemap.xml
`;
  },

  // Genuine search engine sitemap status & guidance (No fake pings)
  async pingSearchEngines(sitemapUrl: string): Promise<{ google: boolean; bing: boolean; message: string }> {
    console.log(`[SEO Service] Sitemap ready at: ${sitemapUrl}`);
    
    return {
      google: true,
      bing: true,
      message: `خريطة الموقع مفعلة ومربوطة في robots.txt (${sitemapUrl}). وفقاً لمعايير Google الرسمية الحديثة، يتم الزحف التلقائي عبر robots.txt أو من خلال التقديم المباشر في Google Search Console.`,
    };
  },
};
