import React, { useState, useEffect } from 'react';
import { Article, Category, Language, Video } from '../types/blog';
import { translations } from '../i18n/translations';
import { storeService } from '../services/store';
import { ArticleCard } from '../components/ArticleCard';
import { VideoCard } from '../components/VideoCard';
import { Video as VideoIcon, BookOpen } from 'lucide-react';

interface HomePageProps {
  currentLang: Language;
  onNavigate: (view: string, slug?: string) => void;
  scrollTarget?: string;
}

export const HomePage: React.FC<HomePageProps> = ({ currentLang, onNavigate, scrollTarget }) => {
  const t = translations[currentLang];
  const isAr = currentLang === 'ar';

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (scrollTarget) {
      const timer = setTimeout(() => {
        const el = document.getElementById(scrollTarget);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [scrollTarget]);

  useEffect(() => {
    const fetchData = async () => {
      const fetchedArticles = await storeService.getArticles({ status: 'published' });
      setArticles(fetchedArticles);

      const cats = await storeService.getCategories();
      setCategories(cats);

      const vids = await storeService.getVideos();
      setVideos(vids);
    };

    fetchData();
  }, []);

  const displayedArticles = selectedCategory === 'all'
    ? articles
    : articles.filter((a) => a.category_id === selectedCategory || a.category?.slug === selectedCategory);

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Full-Width Slim Header with Video */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-black">
        <div className="w-full h-[240px] sm:h-[300px] relative overflow-hidden">
          <video 
            src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Main Articles Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/50 pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>{isAr ? 'المقالات والدروس' : 'Articles & Tutorials'}</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {displayedArticles.length} {isAr ? 'مقال' : 'articles'}
            </span>
          </div>

          {displayedArticles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
              {displayedArticles.map((art) => (
                <ArticleCard
                  key={art.id}
                  article={art}
                  currentLang={currentLang}
                  onSelect={(slug) => onNavigate('article', slug)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 space-y-3">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-xs">
                {isAr ? 'لا توجد مقالات حالياً في هذا القسم.' : 'No articles currently in this section.'}
              </p>
            </div>
          )}
        </section>

        {/* Video Section if videos exist */}
        {videos.length > 0 && (
          <section id="videos-section" className="space-y-6 pt-6 border-t border-slate-800/50">
            <div className="flex items-center justify-between border-b border-slate-800/50 pb-4">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <VideoIcon className="w-5 h-5 text-rose-500" />
                <span>{isAr ? 'الدروس المصورة' : 'Video Tutorials'}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
              {videos.map((vid) => (
                <VideoCard key={vid.id} video={vid} currentLang={currentLang} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
