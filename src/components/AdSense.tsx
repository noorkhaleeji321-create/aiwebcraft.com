import React, { useEffect } from 'react';

const ADSENSE_PUB_KEY = 'aiwebcrafter_adsense_pub_id';

export function getAdSensePublisherId(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(ADSENSE_PUB_KEY);
  if (stored) return stored.startsWith('ca-') ? stored : `ca-${stored}`;
  
  const envId = import.meta.env.VITE_ADSENSE_PUB_ID || 'pub-6939607209654934';
  return envId.startsWith('ca-') ? envId : `ca-${envId}`;
}

export function saveAdSensePublisherId(id: string): void {
  if (typeof window !== 'undefined') {
    if (id.trim()) localStorage.setItem(ADSENSE_PUB_KEY, id.trim());
    else localStorage.removeItem(ADSENSE_PUB_KEY);
  }
}

interface AdSlotProps {
  type: 'banner' | 'in-article' | 'sidebar';
  slotId?: string;
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ type, slotId = '1234567890', className = '' }) => {
  const pubId = getAdSensePublisherId();

  useEffect(() => {
    if (pubId && pubId.startsWith('ca-pub-') && typeof window !== 'undefined') {
      try {
        // Ensure script is loaded before pushing
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      } catch (e) {
        console.warn('AdSense slot initialization failed:', e);
      }
    }
  }, [pubId, slotId]);

  if (!pubId || !pubId.startsWith('ca-pub-')) {
    // In dev or unconfigured, show a placeholder if we're in the admin/preview context
    const isDev = import.meta.env.DEV;
    if (isDev) {
      return (
        <div className={`my-6 overflow-hidden rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center ${className}`}>
          <div className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-1">AdSense Placeholder</div>
          <p className="text-slate-600 text-xs italic">Ads will appear here once you configure your Publisher ID in the Admin Panel.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`my-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-client={pubId}
        data-ad-slot={slotId}
        data-ad-format={type === 'in-article' ? 'fluid' : 'auto'}
        data-full-width-responsive="true"
      />
    </div>
  );
};

interface VideoAdPreRollProps {
  onComplete: () => void;
  durationSeconds?: number;
}

export const VideoAdPreRoll: React.FC<VideoAdPreRollProps> = ({ onComplete, durationSeconds = 5 }) => {
  const [timeLeft, setTimeLeft] = React.useState(durationSeconds);
  const pubId = getAdSensePublisherId();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative aspect-video w-full bg-black flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        <span className="text-white text-xs font-bold uppercase tracking-wider">Advertisement</span>
      </div>

      <div className="w-full max-w-lg aspect-[16/5] bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden group">
        {pubId && pubId.startsWith('ca-pub-') ? (
          <AdSlot type="banner" className="my-0 border-0 bg-transparent w-full" />
        ) : (
          <div className="text-slate-500 text-xs text-center p-8">
            <p className="font-bold mb-1">Your AdSense Ad Unit Here</p>
            <p className="opacity-60 italic">Configure AdSense in Admin Panel to monetize your videos.</p>
          </div>
        )}
      </div>

      <button
        onClick={onComplete}
        disabled={timeLeft > 0}
        className={`absolute bottom-6 right-6 px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
          timeLeft > 0 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
            : 'bg-white text-black hover:bg-indigo-500 hover:text-white shadow-xl shadow-indigo-500/20'
        }`}
      >
        <span>{timeLeft > 0 ? `Skip Ad in ${timeLeft}s` : 'Skip Ad'}</span>
        {timeLeft === 0 && (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M5 4l15 8-15 8V4z" />
          </svg>
        )}
      </button>
    </div>
  );
};
