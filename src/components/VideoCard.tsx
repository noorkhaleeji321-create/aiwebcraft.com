import React, { useState } from 'react';
import { Video, Language } from '../types/blog';
import { Play, Clock, X } from 'lucide-react';
import { VideoAdPreRoll } from './AdSense';

interface VideoCardProps {
  video: Video;
  currentLang: Language;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, currentLang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [adFinished, setAdFinished] = useState(false);
  const isAr = currentLang === 'ar';

  const title = isAr ? video.title_ar || video.title : video.title;
  const description = isAr ? video.description_ar || video.description : video.description;

  const handleClose = () => {
    setIsOpen(false);
    setAdFinished(false);
  };

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="group cursor-pointer flex flex-col w-full transition-all duration-300"
      >
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-3">
          <img
            src={video.thumbnail_url}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
          <div className="absolute bottom-2 right-2 bg-slate-950/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
            {video.duration}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <Play className="w-4 h-4 fill-current" />
            </div>
          </div>
          
          <div className="flex-1 space-y-1">
            <h3 className="text-sm sm:text-[15px] font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight line-clamp-2">
              {title}
            </h3>
            
            <div className="flex flex-col text-[12px] text-slate-400">
              <span className="hover:text-white transition-colors">AIWebCrafter Tutorials</span>
              <div className="flex items-center gap-1">
                <span>{Math.floor(Math.random() * 100) + 1}K views</span>
                <span aria-hidden="true">•</span>
                <span>2 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal Player */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-white truncate pr-4">
                {title}
              </h3>
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              {!adFinished ? (
                <VideoAdPreRoll onComplete={() => setAdFinished(true)} durationSeconds={5} />
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1`}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
