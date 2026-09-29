import React, { useEffect } from 'react';
import { Article, Language, Video } from '../types/blog';
import { formatDurationToISO8601, calculateReadingStats } from '../utils/date';

export interface SeoHeadProps {
  article?: Article | null;
  video?: Video | null;
  videoList?: Video[];
  currentLang: Language;
  currentView?: string;
  pageTitle?: string;
  pageDescription?: string;
  canonicalUrl?: string;
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

// DOM Helper functions to maintain meta tags cleanly
function setMetaTag(selector: string, attrName: string, attrValue: string, content: string): void {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMetaTag(selector: string): void {
  if (typeof document === 'undefined') return;
  const el = document.querySelector(selector);
  if (el) el.remove();
}

function setCanonicalLink(href: string): void {
  if (typeof document === 'undefined') return;
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setHreflangLink(hreflang: string, href: string): void {
  if (typeof document === 'undefined') return;
  let link = document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  article,
  video,
  videoList,
  currentLang,
  currentView,
  pageTitle,
  pageDescription,
  canonicalUrl,
}) => {
  const isAr = currentLang === 'ar';

  useEffect(() => {
    const siteDomain = 'https://aiwebcrafter.com';
    const siteName = 'AIWebCrafter';
    const defaultSiteTitle = isAr
      ? 'AIWebCrafter – التغذية الطبيعية ونحت القوام والوصفات الصحراوية'
      : 'AIWebCrafter – Natural Fitness, Wellness & Sahrawi Recipes';
    const defaultSiteDescription = isAr
      ? 'منصة متخصصة في التغذية الصحية للمرأة، وصفات وخلطات صحراوية أصلية لزيادة الوزن، وتمارين بيوميكانيكية لنحت القوام وإبراز المعالم الأنثوية بأمان تام.'
      : 'Dedicated authority on women’s natural wellness, healthy weight gain, authentic Sahrawi recipes, and biomechanical curve-shaping fitness.';
    const defaultImage = `${siteDomain}/favicon.svg`;

    let title = defaultSiteTitle;
    let description = defaultSiteDescription;
    let canonical = canonicalUrl || siteDomain;
    let ogImage = defaultImage;
    let ogType = 'website';
    let robotsContent = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    let keywordsString = isAr 
      ? 'تغذية صحية, وصفات صحراوية, زيادة الوزن, نحت القوام, اللحسة الصحراوية, حب العزيز, تمارين الأرداف, صحة المرأة'
      : 'female wellness, sahrawi recipes, natural weight gain, curve shaping, glute workouts, nutrition guides';
    let authorName = isAr ? 'فريق تحرير AIWebCrafter' : 'AIWebCrafter Editorial Team';

    // ─────────────────────────────────────────────────────────────
    // 1. INDIVIDUAL BLOG POST SEO CONFIGURATION
    // ─────────────────────────────────────────────────────────────
    if (article) {
      ogType = 'article';
      const rawTitle = isAr
        ? article.seo?.seo_title_ar || article.title_ar || article.title
        : article.seo?.seo_title || article.title;
      
      title = `${rawTitle.trim()} | ${siteName}`;

      const rawDesc = isAr
        ? article.seo?.seo_description_ar || article.excerpt_ar || article.excerpt
        : article.seo?.seo_description || article.excerpt;
      
      // Clean description of markdown symbols & extra spaces
      description = rawDesc.replace(/[#*_`~[\]()]/g, ' ').replace(/\s+/g, ' ').trim();

      canonical = article.seo?.canonical_url || `${siteDomain}/article/${article.slug}`;
      ogImage = article.seo?.og_image_url || article.featured_image || defaultImage;

      if (article.seo?.noindex) {
        robotsContent = 'noindex, nofollow';
      }

      // Collect Keywords
      const tagList = article.tags?.map((t) => (isAr ? t.name_ar || t.name : t.name)) || [];
      const seoKeywords = isAr
        ? article.seo?.keywords_ar || article.seo?.keywords || []
        : article.seo?.keywords || [];
      const mergedKeywords = Array.from(new Set([...seoKeywords, ...tagList])).filter(Boolean);
      if (mergedKeywords.length > 0) {
        keywordsString = mergedKeywords.join(', ');
      }

      if (article.author) {
        authorName = isAr ? article.author.name_ar || article.author.name : article.author.name;
      }
    } 
    // ─────────────────────────────────────────────────────────────
    // 2. INDIVIDUAL VIDEO SEO CONFIGURATION
    // ─────────────────────────────────────────────────────────────
    else if (video) {
      ogType = 'video.other';
      const rawTitle = isAr ? video.title_ar || video.title : video.title;
      title = `${rawTitle.trim()} | ${isAr ? 'فيديوهات وشروحات' : 'Video Tutorial'} ${siteName}`;
      
      const rawDesc = isAr ? video.description_ar || video.description : video.description;
      description = rawDesc.replace(/[#*_`~[\]()]/g, ' ').replace(/\s+/g, ' ').trim();

      canonical = `${siteDomain}/videos?v=${video.youtube_id || video.id}`;
      ogImage = video.thumbnail_url || defaultImage;
      keywordsString = isAr
        ? `${rawTitle}, فيديو تطبيقي, شروحات صحراوية, تمارين نحت الجسم, وصفات طبيعية, ${siteName}`
        : `${rawTitle}, video guide, natural fitness workout, sahrawi recipes, ${siteName}`;
    }
    // ─────────────────────────────────────────────────────────────
    // 3. VIDEOS HUB / COLLECTION PAGE SEO
    // ─────────────────────────────────────────────────────────────
    else if (currentView === 'videos') {
      title = isAr
        ? `الفيديوهات والشروحات التطبيقية المرئية | ${siteName}`
        : `Video Tutorials & Masterclasses | ${siteName}`;
      description = isAr
        ? 'مكتبة مرئية شاملة تضم أحدث الفيديوهات والشروحات العملية للوصفات الصحراوية، برامج التغذية الصحية، وتمارين نحت القوام وإبراز المعالم بأمان تام.'
        : 'Explore our video library featuring practical demonstrations of authentic Sahrawi recipes, evidence-based nutrition guides, and biomechanical workouts.';
      canonical = `${siteDomain}/videos`;
      keywordsString = isAr
        ? 'فيديوهات وصفات, تمارين بالفيديو, شروحات نحت القوام, اللحسة الصحراوية فيديو, تغذية تطبيقية'
        : 'wellness videos, workout tutorials, natural curve shaping videos, healthy nutrition demonstrations';
    }
    // ─────────────────────────────────────────────────────────────
    // 4. OTHER STATIC VIEWS (Blog, About, Contact, Terms, Privacy)
    // ─────────────────────────────────────────────────────────────
    else if (pageTitle || pageDescription) {
      if (pageTitle) title = `${pageTitle} | ${siteName}`;
      if (pageDescription) description = pageDescription;
    } else if (currentView === 'blog') {
      title = isAr ? `المقالات والدلائل الإرشادية الشاملة | ${siteName}` : `Articles & Comprehensive Guides | ${siteName}`;
      description = isAr
        ? 'دليلك المتكامل للمقالات العلمية والتراثية: وصفات زيادة الوزن الصحية، الخلطات الصحراوية الموثوقة، وبرامج تمارين نحت القوام.'
        : 'Comprehensive articles and evidence-based guides on female nutrition, safe weight management, authentic Sahrawi blends, and physical conditioning.';
      canonical = `${siteDomain}/blog`;
    } else if (currentView === 'about') {
      title = isAr ? `من نحن — ريادة التغذية والوصفات الطبيعية | ${siteName}` : `About Us | ${siteName}`;
      description = isAr
        ? 'تعرف على رسالة ورؤية منصة AIWebCrafter، المنصة الرائدة في رعاية رشاقة وجمال المرأة عبر الوصفات الصحراوية التراثية والتمارين البيوميكانيكية.'
        : 'Discover AIWebCrafter: Our mission, scientific principles, and dedication to women’s natural wellness and authentic herbal heritage.';
      canonical = `${siteDomain}/about`;
    } else if (currentView === 'contact') {
      title = isAr ? `اتصل بنا والتواصل الرسمي | ${siteName}` : `Contact Us | ${siteName}`;
      description = isAr
        ? 'تواصل مع فريق الدعم والخبراء في منصة AIWebCrafter لأي استفسارات أو اقتراحات بخصوص المقالات والبرامج.'
        : 'Get in touch with the AIWebCrafter team for inquiries, feedback, and support.';
      canonical = `${siteDomain}/contact`;
    } else if (currentView === 'privacy') {
      title = isAr ? `سياسة الخصوصية وملفات تعريف الارتباط | ${siteName}` : `Privacy Policy | ${siteName}`;
      canonical = `${siteDomain}/privacy`;
    } else if (currentView === 'terms') {
      title = isAr ? `شروط الاستخدام وإخلاء المسؤولية | ${siteName}` : `Terms of Service | ${siteName}`;
      canonical = `${siteDomain}/terms`;
    }

    // ─────────────────────────────────────────────────────────────
    // A. UPDATE DOCUMENT TITLE
    // ─────────────────────────────────────────────────────────────
    document.title = title;

    // ─────────────────────────────────────────────────────────────
    // B. UPDATE STANDARD META TAGS
    // ─────────────────────────────────────────────────────────────
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywordsString);
    setMetaTag('meta[name="robots"]', 'name', 'robots', robotsContent);
    setMetaTag('meta[name="author"]', 'name', 'author', authorName);

    // ─────────────────────────────────────────────────────────────
    // C. UPDATE CANONICAL LINK & HREFLANG
    // ─────────────────────────────────────────────────────────────
    setCanonicalLink(canonical);
    setHreflangLink('ar', `${canonical}?lang=ar`);
    setHreflangLink('en', `${canonical}?lang=en`);
    setHreflangLink('x-default', canonical);

    // ─────────────────────────────────────────────────────────────
    // D. UPDATE OPENGRAPH (OG) META TAGS
    // ─────────────────────────────────────────────────────────────
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    setMetaTag('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', ogImage);
    setMetaTag('meta[property="og:image:alt"]', 'property', 'og:image:alt', title);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', siteName);
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', isAr ? 'ar_AR' : 'en_US');

    // Article-Specific OpenGraph tags
    if (article) {
      setMetaTag('meta[property="article:published_time"]', 'property', 'article:published_time', article.publish_date || article.created_at);
      setMetaTag('meta[property="article:modified_time"]', 'property', 'article:modified_time', article.updated_at || article.publish_date);
      setMetaTag('meta[property="article:author"]', 'property', 'article:author', authorName);
      if (article.category) {
        setMetaTag(
          'meta[property="article:section"]',
          'property',
          'article:section',
          isAr ? article.category.name_ar || article.category.name : article.category.name
        );
      }
    } else {
      removeMetaTag('meta[property="article:published_time"]');
      removeMetaTag('meta[property="article:modified_time"]');
      removeMetaTag('meta[property="article:author"]');
      removeMetaTag('meta[property="article:section"]');
    }

    // Video-Specific OpenGraph tags
    if (video) {
      const embedUrl = `https://www.youtube.com/embed/${video.youtube_id}`;
      setMetaTag('meta[property="og:video"]', 'property', 'og:video', embedUrl);
      setMetaTag('meta[property="og:video:secure_url"]', 'property', 'og:video:secure_url', embedUrl);
      setMetaTag('meta[property="og:video:type"]', 'property', 'og:video:type', 'text/html');
      setMetaTag('meta[property="og:video:width"]', 'property', 'og:video:width', '1280');
      setMetaTag('meta[property="og:video:height"]', 'property', 'og:video:height', '720');
    } else {
      removeMetaTag('meta[property="og:video"]');
      removeMetaTag('meta[property="og:video:secure_url"]');
      removeMetaTag('meta[property="og:video:type"]');
      removeMetaTag('meta[property="og:video:width"]');
      removeMetaTag('meta[property="og:video:height"]');
    }

    // ─────────────────────────────────────────────────────────────
    // E. UPDATE TWITTER CARD META TAGS
    // ─────────────────────────────────────────────────────────────
    if (video) {
      const embedUrl = `https://www.youtube.com/embed/${video.youtube_id}`;
      setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'player');
      setMetaTag('meta[name="twitter:player"]', 'name', 'twitter:player', embedUrl);
      setMetaTag('meta[name="twitter:player:width"]', 'name', 'twitter:player:width', '1280');
      setMetaTag('meta[name="twitter:player:height"]', 'name', 'twitter:player:height', '720');
    } else {
      setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
      removeMetaTag('meta[name="twitter:player"]');
      removeMetaTag('meta[name="twitter:player:width"]');
      removeMetaTag('meta[name="twitter:player:height"]');
    }

    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    if (article) {
      const readingStats = calculateReadingStats(article.content, article.content_ar, article.reading_time_minutes);
      setMetaTag('meta[name="twitter:label1"]', 'name', 'twitter:label1', isAr ? 'الكاتب' : 'Written by');
      setMetaTag('meta[name="twitter:data1"]', 'name', 'twitter:data1', authorName);
      setMetaTag('meta[name="twitter:label2"]', 'name', 'twitter:label2', isAr ? 'مدة القراءة' : 'Reading time');
      setMetaTag('meta[name="twitter:data2"]', 'name', 'twitter:data2', `${readingStats.minutes} min`);
    } else {
      removeMetaTag('meta[name="twitter:label1"]');
      removeMetaTag('meta[name="twitter:data1"]');
      removeMetaTag('meta[name="twitter:label2"]');
      removeMetaTag('meta[name="twitter:data2"]');
    }

    // ─────────────────────────────────────────────────────────────
    // F. GOOGLE SEARCH CONSOLE & ADSENSE SCRIPT
    // ─────────────────────────────────────────────────────────────
    const gscTag = getGscVerificationTag();
    let gscMeta = document.querySelector('meta[name="google-site-verification"]');
    if (gscTag) {
      if (!gscMeta) {
        gscMeta = document.createElement('meta');
        gscMeta.setAttribute('name', 'google-site-verification');
        document.head.appendChild(gscMeta);
      }
      const contentMatch = gscTag.match(/content=["']([^"']+)["']/);
      gscMeta.setAttribute('content', contentMatch ? contentMatch[1] : gscTag);
    } else if (gscMeta) {
      gscMeta.remove();
    }

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

    // ─────────────────────────────────────────────────────────────
    // G. SCHEMA.ORG STRUCTURED DATA (JSON-LD)
    // ─────────────────────────────────────────────────────────────
    let schemaScript = document.getElementById('json-ld-article-schema') as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'json-ld-article-schema';
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }

    const publisherObject = {
      '@type': 'Organization',
      name: siteName,
      url: siteDomain,
      logo: {
        '@type': 'ImageObject',
        url: defaultImage,
      },
    };

    // Case 1: Individual Article Schema
    if (article) {
      const categoryTitle = article.category
        ? (isAr ? article.category.name_ar || article.category.name : article.category.name)
        : (isAr ? 'التغذية ونحت القوام' : 'Wellness & Nutrition');

      const readingStats = calculateReadingStats(article.content, article.content_ar, article.reading_time_minutes);

      const blogPostingSchema: any = {
        '@context': 'https://schema.org',
        '@type': ['BlogPosting', 'Article'],
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonical,
        },
        headline: isAr ? article.title_ar || article.title : article.title,
        description: description,
        image: [ogImage],
        datePublished: article.publish_date || article.created_at,
        dateModified: article.updated_at || article.publish_date,
        author: {
          '@type': 'Person',
          name: authorName,
          url: article.author?.website || siteDomain,
          image: article.author?.avatar_url || defaultImage,
        },
        publisher: publisherObject,
        articleSection: categoryTitle,
        keywords: keywordsString,
        inLanguage: isAr ? 'ar' : 'en',
        wordCount: readingStats.words > 0 ? readingStats.words : 500,
        timeRequired: `PT${readingStats.minutes}M`,
      };

      // BreadcrumbList Schema for Article
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: isAr ? 'الرئيسية' : 'Home',
            item: siteDomain,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isAr ? 'المقالات والدلائل' : 'Blog',
            item: `${siteDomain}/blog`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: categoryTitle,
            item: `${siteDomain}/blog?category=${article.category?.slug || 'wellness'}`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: isAr ? article.title_ar || article.title : article.title,
            item: canonical,
          },
        ],
      };

      // Check for FAQ section to add FAQPage schema
      let faqSchema = null;
      if (article.seo?.faq_section) {
        try {
          const parsedFaqs = JSON.parse(article.seo.faq_section);
          if (Array.isArray(parsedFaqs) && parsedFaqs.length > 0) {
            faqSchema = {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: parsedFaqs.map((faq: any) => ({
                '@type': 'Question',
                name: faq.question || faq.q,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer || faq.a,
                },
              })),
            };
          }
        } catch (_) {
          // ignore parsing error
        }
      }

      const graph = [blogPostingSchema, breadcrumbSchema];
      if (faqSchema) graph.push(faqSchema);

      schemaScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': graph,
      });
    }
    // Case 2: Individual Video Schema
    else if (video) {
      const durationIso = formatDurationToISO8601(video.duration);
      const videoObjectSchema = {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: isAr ? video.title_ar || video.title : video.title,
        description: description,
        thumbnailUrl: [video.thumbnail_url],
        uploadDate: video.created_at,
        duration: durationIso,
        contentUrl: `https://www.youtube.com/watch?v=${video.youtube_id}`,
        embedUrl: `https://www.youtube.com/embed/${video.youtube_id}`,
        publisher: publisherObject,
      };

      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: isAr ? 'الرئيسية' : 'Home',
            item: siteDomain,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isAr ? 'الفيديوهات والشروحات' : 'Videos',
            item: `${siteDomain}/videos`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: isAr ? video.title_ar || video.title : video.title,
            item: canonical,
          },
        ],
      };

      schemaScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [videoObjectSchema, breadcrumbSchema],
      });
    }
    // Case 3: Videos Hub Page (Collection of VideoObjects for Google Video Search indexing)
    else if (currentView === 'videos' && videoList && videoList.length > 0) {
      const videoItems = videoList.slice(0, 20).map((v, idx) => ({
        '@type': 'VideoObject',
        position: idx + 1,
        name: isAr ? v.title_ar || v.title : v.title,
        description: (isAr ? v.description_ar || v.description : v.description).slice(0, 160),
        thumbnailUrl: [v.thumbnail_url],
        uploadDate: v.created_at,
        duration: formatDurationToISO8601(v.duration),
        embedUrl: `https://www.youtube.com/embed/${v.youtube_id}`,
        contentUrl: `https://www.youtube.com/watch?v=${v.youtube_id}`,
        publisher: publisherObject,
      }));

      const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: isAr ? 'شروحات وفيديوهات AIWebCrafter التطبيقية' : 'AIWebCrafter Video Tutorials',
        description: description,
        itemListElement: videoItems,
      };

      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: isAr ? 'الرئيسية' : 'Home',
            item: siteDomain,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isAr ? 'الفيديوهات والشروحات' : 'Videos',
            item: `${siteDomain}/videos`,
          },
        ],
      };

      schemaScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [itemListSchema, breadcrumbSchema],
      });
    }
    // Case 4: Default Website / WebPage Schema
    else {
      const webSiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName,
        url: siteDomain,
        description: description,
        inLanguage: ['ar', 'en'],
        publisher: publisherObject,
      };

      schemaScript.textContent = JSON.stringify(webSiteSchema);
    }
  }, [
    article,
    video,
    videoList,
    currentLang,
    currentView,
    pageTitle,
    pageDescription,
    canonicalUrl,
  ]);

  return null;
};
