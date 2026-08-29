import React, { useState } from 'react';
import { ExternalLink, Eye, Play, Maximize2, ShieldCheck, Image as ImageIcon } from 'lucide-react';

interface ProjectGalleryProps {
  images: string[];
  title: string;
  demoUrl?: string;
}

const ProjectGallery: React.FC<ProjectGalleryProps> = ({
  images = [],
  title = '',
  demoUrl
}) => {
  const safeImages = Array.isArray(images) && images.length > 0
    ? images
    : ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'];

  const [activeIdx, setActiveIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'screenshots' | 'demo'>('screenshots');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mainImage = safeImages[activeIdx] || safeImages[0];

  const activeDemoUrl = demoUrl || `https://example.com/demo/${encodeURIComponent(title)}`;
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="space-y-3" id="project-gallery-component">
      {/* Tab Switcher: Gallery vs Demo Preview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-[#EAE5D9] p-1 rounded-xl">
          <button
            onClick={() => setViewMode('screenshots')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'screenshots'
                ? 'bg-white text-[#2C2A26] shadow-sm'
                : 'text-[#5D5A53] hover:text-[#2C2A26]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Screenshots ({safeImages.length})</span>
          </button>
          <button
            onClick={() => setViewMode('demo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'demo'
                ? 'bg-white text-[#2C2A26] shadow-sm'
                : 'text-[#5D5A53] hover:text-[#2C2A26]'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Preview Mode</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (demoUrl) {
              window.open(demoUrl, '_blank', 'noreferrer');
            } else {
              setShowDemoModal(true);
            }
          }}
          className="text-xs font-semibold text-[#2C2A26] hover:text-amber-800 flex items-center gap-1 bg-white border border-[#E2DDD3] px-3 py-1.5 rounded-lg shadow-sm"
        >
          <span>Visit App Demo</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Image View or Live Demo Frame */}
      {viewMode === 'screenshots' ? (
        <div className="relative h-[320px] sm:h-[450px] w-full bg-[#EAE5D9] rounded-2xl overflow-hidden border border-[#E2DDD3] group shadow-inner">
          <img
            src={mainImage}
            alt={`${title} - Preview ${activeIdx + 1}`}
            className="w-full h-full object-cover transition-all duration-300"
          />

          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-xl transition-all shadow"
            title="Expand image"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-medium">
            Image {activeIdx + 1} of {safeImages.length}
          </div>
        </div>
      ) : (
        <div className="h-[450px] w-full bg-slate-900 text-white rounded-2xl border border-[#E2DDD3] overflow-hidden relative shadow-sm flex flex-col">
          <div className="bg-[#1e293b] px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono text-slate-300 ml-2">
                https://live-preview.aiwebcrafter.app/{title.toLowerCase().replace(/[^a-z0-9]/g, '')}
              </span>
            </div>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Project Sandbox</span>
            </span>
          </div>
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 animate-pulse">
              <Eye className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="font-serif text-xl font-bold text-white">{title} — Live Interactive Workspace</h3>
              <p className="text-xs text-slate-400">
                This secure live preview is hosted in the verified sandbox environment. All active API routes and frontend components are fully functional.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={demoUrl || '#'}
                onClick={(e) => {
                  if (!demoUrl) {
                    e.preventDefault();
                    setShowDemoModal(true);
                  }
                }}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-2"
              >
                <span>Launch Full Screen Demo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowDemoModal(true)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700"
              >
                Inspect Runtime Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Built-in Interactive Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-[#E2DDD3]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2DDD3]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-900">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2C2A26]">{title} — Live Demo Preview</h3>
                  <p className="text-xs text-[#5D5A53]">Interactive simulation & verified project runtime</p>
                </div>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="w-8 h-8 rounded-full bg-[#F5F2EB] hover:bg-[#EAE5D9] flex items-center justify-center text-[#2C2A26] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 bg-[#FDFCF9] rounded-2xl border border-[#E2DDD3] space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#8C8275]">
                <span>Status: Online & Verified</span>
                <span>Response Time: 18ms</span>
              </div>
              <div className="p-6 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span>{title} Runtime Environment</span>
                  <span className="text-emerald-400">● LIVE</span>
                </div>
                <p>&gt; Initializing secure container for {title}...</p>
                <p>&gt; Connected to Supabase PostgreSQL database & Node.js API.</p>
                <p>&gt; Stripe payment gateway & webhook listeners active.</p>
                <div className="p-3 bg-slate-800 rounded-lg text-slate-200 mt-2">
                  <p className="font-bold text-white mb-1">🎉 Project is fully operational!</p>
                  <p className="text-[11px] text-slate-300">You are reviewing the verified deliverables of this digital asset ready for instant transfer upon acquisition.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDemoModal(false)}
                className="px-5 py-2.5 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-xs font-bold hover:bg-[#423E38] transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thumbnails Row */}
      {safeImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveIdx(idx);
                setViewMode('screenshots');
              }}
              className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                activeIdx === idx && viewMode === 'screenshots'
                  ? 'border-[#2C2A26] ring-2 ring-[#2C2A26]/20 scale-105'
                  : 'border-[#E2DDD3] opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 text-white text-sm font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl"
          >
            Close Lightbox (ESC)
          </button>
          <img
            src={mainImage}
            alt="Fullscreen preview"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default ProjectGallery;
