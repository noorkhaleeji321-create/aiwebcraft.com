import React, { useEffect } from 'react';
import { Article, Language } from '../types/blog';

interface SeoHeadProps {
  article?: Article | null;
  currentLang: Language;
  pageTitle?: string;
  pageDescription?: string;
}

const GSC_STORAGE_KEY = 'aiwebcrafter_gsc_verification';

export function getGscVerificationTag(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GSC_STORAGE_KEY) || import.meta.env.VITE_GSC_VERIFICATION || '';
}

export function saveGscVerificationTag(tag: string): void {
  if (typeof window !== 'undefined') {
    if (tag.trim()) localStorage.setItem(GSC_STORAGE_KEY, tag.trim());
    else localStorage.removeItem(GSC_STORAGE_KEY);
  }
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  article,
  currentLang,
  pageTitle,
  pageDescription,
}) => {
  const isAr = currentLang === 'ar';

  useEffect(() => {
    let title = pageTitle || 'AIWebCrafter – AI, Web Dev & SaaS Knowledge Hub';
    let description =
      pageDescription ||
      'SEO-focused educational blog and knowledge hub for AI, web development, SaaS, and AI tools with Arabic and English bilingual support.';
    let canonical = window.location.href;
    let ogImage = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

    if (article) {
      title = isAr ? article.seo?.seo_title_ar || article.title_ar : article.seo?.seo_title || article.title;
      description = isAr ? article.seo?.seo_description_ar || article.excerpt_ar : article.seo?.seo_description || article.excerpt;
      canonical = article.seo?.canonical_url || `https://aiwebcrafter.com/article/${article.slug}`;
      ogImage = article.featured_image;
    }

    // 1. Update Document Title
    document.title = title;

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. OpenGraph Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    // 4. Twitter Cards
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', title);

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', description);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);

    // 6. Google Search Console Verification Meta Tag
    const gscTag = getGscVerificationTag();
    let gscMeta = document.querySelector('meta[name="google-site-verification"]');
    if (gscTag) {
      if (!gscMeta) {
        gscMeta = document.createElement('meta');
        gscMeta.setAttribute('name', 'google-site-verification');
        document.head.appendChild(gscMeta);
      }
      // Extract content string if user provided full <meta name="google-site-verification" content="..." />
      const contentMatch = gscTag.match(/content=["']([^"']+)["']/);
      gscMeta.setAttribute('content', contentMatch ? contentMatch[1] : gscTag);
    } else if (gscMeta) {
      gscMeta.remove();
    }

    // 6.1 AdSense Auto-Ads Script Injector
    const adsensePubId = 'ca-pub-6939607209654934';
    let adsenseScript = document.getElementById('adsense-script') as HTMLScriptElement | null;
    if (!adsenseScript) {
      adsenseScript = document.createElement('script');
      adsenseScript.id = 'adsense-script';
      adsenseScript.async = true;
      adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePubId}`;
      adsenseScript.setAttribute('crossorigin', 'anonymous');
      document.head.appendChild(adsenseScript);
    }

    // 7. Schema.org JSON-LD Injector
    let schemaScript = document.getElementById('json-ld-article-schema');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'json-ld-article-schema';
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }

    if (article) {
      const jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: article.title,
        description: article.excerpt,
        image: [article.featured_image],
        datePublished: article.publish_date,
        dateModified: article.updated_at,
        author: {
          '@type': 'Person',
          name: article.author?.name || 'Tarik Cherak',
          url: article.author?.website || 'https://aiwebcrafter.com',
        },
        publisher: {
          '@type': 'Organization',
          name: 'AIWebCrafter',
          logo: {
            '@type': 'ImageObject',
            url: 'https://aiwebcrafter.com/logo.png',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonical,
        },
        inLanguage: ['en', 'ar'],
      };
      schemaScript.textContent = JSON.stringify(jsonLdData);
    } else {
      const jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'AIWebCrafter',
        url: window.location.origin,
        description: description,
        inLanguage: ['en', 'ar'],
      };
      schemaScript.textContent = JSON.stringify(jsonLdData);
    }
  }, [article, currentLang, pageTitle, pageDescription]);

  return null;
};
