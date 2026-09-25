import React, { useState, useEffect } from 'react';
import { Article, Language } from '../types/blog';
import { translations } from '../i18n/translations';
import { storeService } from '../services/store';
import { SeoHead } from '../components/SeoHead';
import { VideoCard } from '../components/VideoCard';
import { ArticleCard } from '../components/ArticleCard';
import { AdSlot } from '../components/AdSense';
import { Clock, Eye, Share2, Check, ArrowLeft, ArrowRight, UserCheck, BookOpen, Code2, Globe, Sparkles, Database } from 'lucide-react';

interface ArticlePageProps {
  slug: string;
  currentLang: Language;
  onNavigate: (view: string, slug?: string) => void;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({
  slug,
  currentLang,
  onNavigate,
}) => {
  const t = translations[currentLang];
  const isAr = currentLang === 'ar';

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [copied, setCopied] = useState(false);
  const [contentLang, setContentLang] = useState<Language>(currentLang);
  const [showSeoInspector, setShowSeoInspector] = useState(false);

  useEffect(() => {
    setContentLang(currentLang);
  }, [currentLang]);

  useEffect(() => {
    const fetchArticle = async () => {
      const found = await storeService.getArticleBySlug(slug);
      setArticle(found);

      if (found) {
        const all = await storeService.getArticles({ status: 'published' });
        setRelatedArticles(all.filter((a) => a.id !== found.id).slice(0, 2));
      }
    };

    fetchArticle();
  }, [slug]);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-slate-400 text-base">Loading article details...</p>
        <button
          onClick={() => onNavigate('blog')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          Back to Blog
        </button>
      </div>
    );
  }

  const isViewAr = contentLang === 'ar';
  const title = isViewAr ? article.title_ar || article.title : article.title;
  const excerpt = isViewAr ? article.excerpt_ar || article.excerpt : article.excerpt;
  const content = isViewAr ? article.content_ar || article.content : article.content;
  
  const categoryName = isViewAr
    ? article.category?.name_ar || article.category?.name
    : article.category?.name;

  const authorName = isViewAr
    ? article.author?.name_ar || article.author?.name
    : article.author?.name;

  const authorBio = isViewAr
    ? article.author?.bio_ar || article.author?.bio
    : article.author?.bio;

  const authorRole = isViewAr
    ? article.author?.role_title_ar || article.author?.role_title
    : article.author?.role_title;

  const formattedDate = new Date(article.publish_date).toLocaleDateString(
    isViewAr ? 'ar-EG' : 'en-US',
    { month: 'long', day: 'numeric', year: 'numeric' }
  );

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="pb-20">
      <SeoHead article={article} currentLang={currentLang} />

      {/* Hero Banner Header */}
      <div className="bg-slate-950 border-b border-slate-800/80 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          
          <button
            onClick={() => onNavigate('blog')}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{t.blog}</span>
          </button>

          {/* Unboxed Zero-Pill Category and Language Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-400">
              <span className="text-indigo-400 font-semibold">{categoryName}</span>
              <span aria-hidden="true">·</span>
              <span>{article.reading_time_minutes} {t.readTime}</span>
              <span aria-hidden="true">·</span>
              <span>{formattedDate}</span>
            </div>

            {/* Language view switcher for article prose */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setContentLang('en')}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  contentLang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                English Prose
              </button>
              <button
                onClick={() => setContentLang('ar')}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  contentLang === 'ar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                العربية
              </button>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.2]">
            {title}
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed border-l-2 border-indigo-500 pl-4 py-1 italic">
            {excerpt}
          </p>

          {/* Author Header Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-3">
              {article.author?.avatar_url && (
                <img
                  src={article.author.avatar_url}
                  alt={authorName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
              )}
              <div>
                <p className="font-bold text-white text-sm">{authorName}</p>
                <p className="text-slate-400">{authorRole}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{copied ? t.copiedLink : t.shareArticle}</span>
              </button>

              <button
                onClick={() => setShowSeoInspector(!showSeoInspector)}
                className="px-3 py-1.5 bg-slate-900 border border-indigo-900/60 text-indigo-300 text-xs font-mono rounded-lg hover:bg-slate-800 transition-colors"
              >
                {showSeoInspector ? 'Hide SEO Inspector' : 'SEO Inspector'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* SEO Inspector Debug Drawer */}
      {showSeoInspector && (
        <div className="bg-indigo-950/40 border-b border-indigo-800/60 py-4">
          <div className="max-w-4xl mx-auto px-4 font-mono text-xs text-indigo-200 space-y-2">
            <div className="font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Code2 className="w-4 h-4" />
              <span>SEO Metadata Inspector & JSON-LD</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-3 rounded-lg border border-indigo-900">
              <div><strong className="text-indigo-400">SEO Title:</strong> {article.seo?.seo_title || title}</div>
              <div><strong className="text-indigo-400">Canonical URL:</strong> {article.seo?.canonical_url || 'https://aiwebcrafter.dev/blog/' + article.slug}</div>
              <div className="sm:col-span-2"><strong className="text-indigo-400">Meta Description:</strong> {article.seo?.seo_description || excerpt}</div>
              <div className="sm:col-span-2"><strong className="text-indigo-400">Keywords:</strong> {(article.seo?.keywords || ['AI', 'Web Dev']).join(', ')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Featured Media */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 my-8">
        <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
          <img
            src={article.featured_image}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Prose Article Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Google AdSense Top Banner Ad */}
        <AdSlot type="banner" slotId="1122334455" className="mb-4" />

        <div
          dir={isViewAr ? 'rtl' : 'ltr'}
          className={`prose prose-invert max-w-none text-slate-300 text-base sm:text-lg leading-relaxed whitespace-pre-line ${
            isViewAr ? 'font-arabic' : 'font-sans'
          }`}
        >
          {content}
        </div>

        {/* Project Download Section */}
        {article.project_url && (
          <div className="p-6 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl space-y-4 my-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'ملفات المشروع المصدرية' : 'Project Source Code'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'قم بتحميل الملفات الكاملة لهذا المشروع (ZIP/RAR)' : 'Download the complete source files for this project (ZIP/RAR)'}
                </p>
              </div>
            </div>
            <a
              href={article.project_url}
              download
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group"
            >
              <Database className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>{isAr ? 'تحميل المشروع الآن' : 'Download Project Now'}</span>
            </a>
          </div>
        )}

        {/* Google AdSense In-Article Ad Placement */}
        <AdSlot type="in-article" slotId="3344556677" />

        {/* Tags Row (Unboxed) */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-6 border-t border-slate-800 flex items-center flex-wrap gap-2 text-xs text-slate-400">
            <span className="font-mono uppercase text-slate-500 font-semibold">{t.tags}:</span>
            {article.tags.filter(Boolean).map((tag, idx) => {
              const isStr = typeof tag === 'string';
              const tagId = isStr ? `tag-${idx}` : tag?.id || `tag-${idx}`;
              const tagLabel = isStr ? tag : (isViewAr ? tag?.name_ar || tag?.name : tag?.name || tag?.name_ar);
              if (!tagLabel) return null;
              return (
                <span key={tagId} className="text-indigo-400 font-mono">
                  #{tagLabel}
                </span>
              );
            })}
          </div>
        )}

        {/* Embedded Videos */}
        {article.videos && article.videos.length > 0 && (
          <div className="pt-8 border-t border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>{t.relatedVideos}</span>
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {article.videos.map((vid) => (
                <VideoCard key={vid.id} video={vid} currentLang={currentLang} />
              ))}
            </div>
          </div>
        )}

        {/* Google AdSense Bottom Banner Ad */}
        <AdSlot type="banner" slotId="5566778899" className="mt-8" />

        {/* Author Bio Footer Card */}
        {article.author && (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-12">
            <img
              src={article.author.avatar_url}
              alt={authorName}
              className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/30 shrink-0"
            />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <span>{authorName}</span>
                <span className="text-xs text-indigo-400 font-mono bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                  {authorRole}
                </span>
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">{authorBio}</p>
            </div>
          </div>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="pt-12 border-t border-slate-800 space-y-6">
            <h3 className="text-xl font-bold text-white">{t.relatedArticles}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {relatedArticles.map((rel) => (
                <ArticleCard
                  key={rel.id}
                  article={rel}
                  currentLang={currentLang}
                  onSelect={(s) => onNavigate('article', s)}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </article>
  );
};
