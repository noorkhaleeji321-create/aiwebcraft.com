import React, { useState, useEffect } from 'react';
import { Language, Video } from '../types/blog';
import { translations } from '../i18n/translations';
import { storeService } from '../services/store';
import { VideoCard } from '../components/VideoCard';
import { AdSlot } from '../components/AdSense';
import { SeoHead } from '../components/SeoHead';
import { Video as VideoIcon, Search, X, Sparkles, Filter } from 'lucide-react';

interface VideosPageProps {
  currentLang: Language;
  onNavigate: (view: string, slug?: string) => void;
}

export const VideosPage: React.FC<VideosPageProps> = ({ currentLang, onNavigate }) => {
  const t = translations[currentLang];
  const isAr = currentLang === 'ar';

  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const loadVideos = async () => {
      setLoading(true);
      try {
        const data = await storeService.getVideos();
        setVideos(data || []);
      } catch (err) {
        console.error('Failed to load videos:', err);
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

  const filteredVideos = videos.filter((v) => {
    const title = (isAr ? v.title_ar || v.title : v.title).toLowerCase();
    const desc = (isAr ? v.description_ar || v.description : v.description).toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return !query || title.includes(query) || desc.includes(query);
  });

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-20 space-y-8">
      {/* Dynamic SEO Head for Videos Hub and Selected Video */}
      <SeoHead
        video={activeVideo}
        videoList={videos}
        currentLang={currentLang}
        currentView="videos"
      />
      
      {/* Slim Clean Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <VideoIcon className="w-4 h-4" />
              </div>
              <span>{isAr ? 'الفيديوهات والشروحات' : 'Videos & Tutorials'}</span>
            </h1>
            <p className="text-xs text-slate-400">
              {isAr ? 'شاهد جميع الشروحات الحصرية مباشرة داخل الموقع' : 'Watch exclusive video tutorials directly on our platform'}
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث في الفيديوهات...' : 'Search videos...'}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AdSense Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdSlot type="banner" className="my-0" />
      </div>

      {/* Videos Grid (YouTube Feed Layout) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
            {filteredVideos.map((vid) => (
              <VideoCard
                key={vid.id}
                video={vid}
                currentLang={currentLang}
                onPlay={(selectedVid) => setActiveVideo(selectedVid)}
                onClose={() => setActiveVideo(null)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3">
            <VideoIcon className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-slate-300 text-sm font-semibold">
              {isAr ? 'لم يتم العثور على أية فيديوهات تطابق بحثك.' : 'No videos found matching your query.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
              >
                {isAr ? 'إعادة ضبط البحث' : 'Clear Search'}
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
