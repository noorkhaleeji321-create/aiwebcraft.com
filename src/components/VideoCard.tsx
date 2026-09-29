import React, { useState, useEffect, useRef } from 'react';
import { Video, Language } from '../types/blog';
import { Play, Clock, X, Calendar, Sparkles, Volume2 } from 'lucide-react';
import { formatTimeAgo, formatExactDate } from '../utils/date';
import { VideoAdPreRoll, AdSlot } from './AdSense';

interface VideoCardProps {
  video: Video;
  currentLang: Language;
  onPlay?: (video: Video) => void;
  onClose?: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, currentLang, onPlay, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [adState, setAdState] = useState<'preroll' | 'playing' | 'midroll'>('preroll');
  const [watchSeconds, setWatchSeconds] = useState(0);
  const isAr = currentLang === 'ar';

  const title = isAr ? video.title_ar || video.title : video.title;
  const description = isAr ? video.description_ar || video.description : video.description;

  const timeAgo = formatTimeAgo(video.created_at, currentLang);
  const formattedDate = formatExactDate(video.created_at, currentLang);
  const exactWithTime = formatExactDate(video.created_at, currentLang, true);

  // Mid-roll timer: triggers an ad every 90 seconds (1.5 minutes) of watching
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && adState === 'playing') {
      interval = setInterval(() => {
        setWatchSeconds((prev) => {
          const next = prev + 1;
          if (next >= 90) {
            // Trigger 1.5 min Mid-roll Ad break
            setAdState('midroll');
            return 0; // Reset timer for next 90s interval
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, adState]);

  const handleOpen = () => {
    setIsOpen(true);
    setAdState('preroll');
    setWatchSeconds(0);
    onPlay?.(video);
  };

  const handleClose = () => {
    setIsOpen(false);
    setAdState('preroll');
    setWatchSeconds(0);
    onClose?.();
  };

  return (
    <>
      <div
        onClick={handleOpen}
        className="group cursor-pointer flex flex-col w-full transition-all duration-300"
      >
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-3">
          <img
            src={video.thumbnail_url}
            alt={title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
          <div className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 bg-slate-950/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm border border-slate-800 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-rose-400" />
            <span>{video.duration}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-rose-400 group-hover:border-rose-500/40 transition-colors">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
          
          <div className="flex-1 space-y-1">
            <h3 className="text-sm sm:text-[15px] font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight line-clamp-2">
              {title}
            </h3>
            
            <div className="flex flex-col text-[12px] text-slate-400">
              <span className="hover:text-white transition-colors">{isAr ? 'شروحات ووصفات تطبيقية' : 'AIWebCrafter Tutorials'}</span>
              <div className="flex items-center gap-1.5 flex-wrap" title={exactWithTime}>
                <span>14.8K {isAr ? 'مشاهدة' : 'views'}</span>
                <span aria-hidden="true">•</span>
                <span className="text-slate-300 font-medium">{timeAgo}</span>
                <span className="text-slate-500 text-[10px] hidden sm:inline font-mono">({formattedDate})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monetized In-Platform Video Modal Player */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0 my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900/80 border-b border-slate-800">
              <div className="space-y-0.5 pr-4 rtl:pr-0 rtl:pl-4">
                <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                  {title}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="text-rose-400 font-semibold">{video.duration}</span>
                  <span>•</span>
                  <span>{timeAgo}</span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport / Ad Overlays */}
            <div className="relative aspect-video w-full bg-black">
              {adState === 'preroll' ? (
                /* Pre-Roll Ad before video starts (5s timer) */
                <VideoAdPreRoll 
                  type="preroll"
                  isAr={isAr}
                  durationSeconds={5}
                  onComplete={() => setAdState('playing')} 
                />
              ) : adState === 'midroll' ? (
                /* Mid-Roll Ad every 1.5 minutes (90s) while playing */
                <VideoAdPreRoll 
                  type="midroll"
                  isAr={isAr}
                  durationSeconds={5}
                  onComplete={() => setAdState('playing')} 
                />
              ) : (
                /* Active Video Player */
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.youtube_id || 'dQw4w9WgXcQ'}?autoplay=1&rel=0&modestbranding=1`}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              )}
            </div>

            {/* Video Details & In-Stream AdSense Banner */}
            <div className="p-4 sm:p-6 bg-slate-950 space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {title}
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>

              {/* In-Modal AdSense Banner Unit for Maximum Revenue */}
              <div className="pt-2 border-t border-slate-800/80">
                <AdSlot type="in-article" className="my-1 border-slate-800/80" />
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
