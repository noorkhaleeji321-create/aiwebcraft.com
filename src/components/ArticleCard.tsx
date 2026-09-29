import React from 'react';
import { Article, Language } from '../types/blog';
import { translations } from '../i18n/translations';
import { formatTimeAgo, formatExactDate, formatReadingTime, calculateReadingStats } from '../utils/date';
import { Clock, Eye, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  currentLang: Language;
  onSelect: (slug: string) => void;
  featured?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  currentLang,
  onSelect,
  featured = false,
}) => {
  const t = translations[currentLang];
  const isAr = currentLang === 'ar';

  const title = isAr ? article.title_ar || article.title : article.title;
  const excerpt = isAr ? article.excerpt_ar || article.excerpt : article.excerpt;
  const categoryName = isAr
    ? article.category?.name_ar || article.category?.name || 'عام'
    : article.category?.name || 'General';
  const authorName = isAr
    ? article.author?.name_ar || article.author?.name || 'فريق AIWebCrafter'
    : article.author?.name || 'AIWebCrafter Team';

  const readingStats = calculateReadingStats(
    article.content,
    article.content_ar,
    article.reading_time_minutes
  );
  const readingTimeText = formatReadingTime(readingStats.minutes, currentLang);
  const readingTimeBadge = readingStats.durationYouTubeStyle; // Dynamic YouTube style MM:SS (e.g. "03:24", "02:48")

  const timeAgo = formatTimeAgo(article.publish_date, currentLang);
  const formattedDate = formatExactDate(article.publish_date, currentLang);
  const exactWithTime = formatExactDate(article.publish_date, currentLang, true);

  if (featured) {
    return (
      <article
        onClick={() => onSelect(article.slug)}
        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 shadow-xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-7 relative aspect-[16/9] lg:aspect-auto overflow-hidden bg-slate-950">
            <img
              src={article.featured_image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=75'}
              alt={title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('unsplash')) {
                  target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=75';
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent lg:hidden" />
          </div>

          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Unboxed Metadata (Zero-Pill Discipline) */}
              <div className="flex items-center flex-wrap gap-2 text-xs font-medium text-indigo-400">
                <span className="text-indigo-300 font-semibold uppercase tracking-wider">{categoryName}</span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="text-slate-400">{t.featured}</span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{readingTimeText}</span>
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight">
                {title}
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3">
                {excerpt}
              </p>
            </div>

            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 mt-6">
              <div className="flex items-center gap-2 flex-wrap" title={exactWithTime}>
                {article.author?.avatar_url && (
                  <img
                    src={article.author.avatar_url}
                    alt={authorName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <span>{authorName}</span>
                <span aria-hidden="true">·</span>
                <span className="text-indigo-300 font-semibold">{timeAgo}</span>
                <span className="text-slate-500 text-[11px] hidden sm:inline">({formattedDate})</span>
              </div>

              <div className="flex items-center gap-1 font-medium text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>{isAr ? 'قراءة المقال' : 'Read Full Article'}</span>
                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onSelect(article.slug)}
      className="group cursor-pointer flex flex-col w-full transition-all duration-300"
    >
      <div className="relative aspect-[16/9] bg-black rounded-xl overflow-hidden mb-3">
        <img
          src={article.featured_image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=75'}
          alt={title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('unsplash')) {
              target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=75';
            }
          }}
        />
        <div className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 bg-slate-950/90 text-white text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm border border-slate-800/80 flex items-center gap-1 shadow-md">
          <Clock className="w-3 h-3 text-indigo-400" />
          <span>{readingTimeBadge}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {article.author?.avatar_url ? (
            <img
              src={article.author.avatar_url}
              alt={authorName}
              className="w-9 h-9 rounded-full object-cover border border-slate-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
              }}
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Eye className="w-4 h-4" />
            </div>
          )}
        </div>
        
        <div className="flex-1 space-y-1">
          <h3 className="text-sm sm:text-[15px] font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight line-clamp-2">
            {title}
          </h3>
          
          <div className="flex flex-col text-[12px] text-slate-400">
            <span className="hover:text-white transition-colors">{authorName}</span>
            <div className="flex items-center gap-1.5 flex-wrap" title={exactWithTime}>
              <span>{article.views_count} {isAr ? 'مشاهدة' : 'views'}</span>
              <span aria-hidden="true">•</span>
              <span className="text-slate-300 font-medium">{timeAgo}</span>
              <span className="text-slate-500 text-[10px] hidden sm:inline font-mono">({formattedDate})</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
