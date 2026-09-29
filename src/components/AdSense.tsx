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
  isAr?: boolean;
  type?: 'preroll' | 'midroll';
}

export const VideoAdPreRoll: React.FC<VideoAdPreRollProps> = ({ 
  onComplete, 
  durationSeconds = 5,
  isAr = true,
  type = 'preroll'
}) => {
  const [timeLeft, setTimeLeft] = React.useState(durationSeconds);
  const pubId = getAdSensePublisherId();

  useEffect(() => {
    setTimeLeft(durationSeconds);
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
  }, [durationSeconds]);

  return (
    <div className="relative aspect-video w-full bg-slate-950 flex flex-col items-center justify-center p-4 select-none z-30">
      {/* Ad Indicator Badge */}
      <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 z-10 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/30 flex items-center gap-2">
        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
        <span className="text-white text-xs font-bold uppercase tracking-wider">
          {type === 'midroll' 
            ? (isAr ? 'إعلان أثناء المشاهدة (AdSense Mid-Roll)' : 'Mid-Roll Advertisement')
            : (isAr ? 'إعلان Google AdSense' : 'Google AdSense Ad')}
        </span>
      </div>

      {/* Ad Banner Unit Container */}
      <div className="w-full max-w-lg min-h-[140px] bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden p-3 shadow-2xl">
        {pubId && pubId.startsWith('ca-pub-') ? (
          <AdSlot type="banner" className="my-0 border-0 bg-transparent w-full" />
        ) : (
          <div className="text-slate-400 text-xs text-center p-6 space-y-2">
            <div className="inline-block px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md font-mono text-[10px] font-bold">
              Google AdSense Video Ad Unit
            </div>
            <p className="font-bold text-white text-sm">
              {isAr ? 'مساحة إعلانات Google AdSense التلقائية للربح' : 'Google AdSense Monetized Video Slot'}
            </p>
            <p className="text-[11px] text-slate-500">
              {isAr ? 'سيظهر إعلانك المربح هنا تلقائياً لجميع الزوار' : 'Your video ads will monetize automatically here.'}
            </p>
          </div>
        )}
      </div>

      {/* Skip Ad Button */}
      <button
        onClick={onComplete}
        disabled={timeLeft > 0}
        className={`absolute bottom-6 right-6 rtl:right-auto rtl:left-6 px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-2xl ${
          timeLeft > 0 
            ? 'bg-slate-900/90 text-slate-400 cursor-not-allowed border border-slate-800' 
            : 'bg-white text-black hover:bg-amber-400 hover:text-black shadow-amber-500/20 scale-105 active:scale-95'
        }`}
      >
        <span>
          {timeLeft > 0 
            ? (isAr ? `تخطي الإعلان بعد ${timeLeft} ثوانٍ` : `Skip Ad in ${timeLeft}s`) 
            : (isAr ? 'تخطي الإعلان الآن ←' : 'Skip Ad →')}
        </span>
      </button>
    </div>
  );
};
