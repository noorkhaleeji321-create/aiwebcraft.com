import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

interface HeroProps {
  onExploreClick?: () => void;
}

const Hero: React.FC<HeroProps> = () => {
  return (
    <section className="relative min-h-[260px] sm:min-h-[320px] lg:min-h-[380px] flex flex-col justify-end pt-12 pb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4 overflow-hidden rounded-3xl mt-6 mb-1 shadow-xl border border-[#E2DDD3]" id="marketplace-hero">
      {/* Crystal clear unobstructed background image */}
      <div className="absolute inset-0 -z-25 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1600" 
          alt="AIWebCrafter Platform Creator & Founder" 
          className="w-full h-full object-cover object-center filter brightness-95 contrast-105 transform scale-105 hover:scale-110 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        {/* Light subtle tint for readability without fading the image */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Subtle Background Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-300/10 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Trust & Guarantee Metrics Strip - Compact & Lowered */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-[#E2DDD3]/60 text-center relative z-10">
        <div className="p-2.5 bg-white/70 backdrop-blur-xs border border-[#E2DDD3]/80 rounded-xl space-y-0.2 shadow-2xs">
          <div className="text-base font-serif font-bold text-[#2C2A26]">$1.8M+</div>
          <div className="text-[10px] font-semibold text-[#8C8275] uppercase tracking-wider">
            Transacted Volume
          </div>
        </div>

        <div className="p-2.5 bg-white/70 backdrop-blur-xs border border-[#E2DDD3]/80 rounded-xl space-y-0.2 shadow-2xs">
          <div className="text-base font-serif font-bold text-emerald-700 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100%</span>
          </div>
          <div className="text-[10px] font-semibold text-[#8C8275] uppercase tracking-wider">
            Verified Financials
          </div>
        </div>

        <div className="p-2.5 bg-white/70 backdrop-blur-xs border border-[#E2DDD3]/80 rounded-xl space-y-0.2 shadow-2xs">
          <div className="text-base font-serif font-bold text-[#2C2A26]">3,200+</div>
          <div className="text-[10px] font-semibold text-[#8C8275] uppercase tracking-wider">
            Active Buyers
          </div>
        </div>

        <div className="p-2.5 bg-white/70 backdrop-blur-xs border border-[#E2DDD3]/80 rounded-xl space-y-0.2 shadow-2xs">
          <div className="text-base font-serif font-bold text-[#2C2A26] flex items-center justify-center gap-1">
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>Escrow</span>
          </div>
          <div className="text-[10px] font-semibold text-[#8C8275] uppercase tracking-wider">
            Zero-Fee Transfer
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
