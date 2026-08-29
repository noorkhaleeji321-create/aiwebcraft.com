import { PremiumLogo } from "./PremiumLogo";
import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Mail, ArrowRight, Store, Check, ArrowUpRight } from 'lucide-react';
import FooterInfoModals, { FooterModalType } from './FooterInfoModals.js';
import { getPlatformCommissionPercentage, fetchPlatformCommissionPercentage, useCommissionPercentage } from '../services/supabaseService.js';

interface FooterProps {
  onCategoryClick: (category: any) => void;
  onSellClick: () => void;
  onAdminClick?: () => void;
  onContactAdmin?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onCategoryClick, onSellClick, onAdminClick, onContactAdmin }) => {
  const [activeModal, setActiveModal] = useState<FooterModalType>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const commissionPct = useCommissionPercentage();

  const handleOpenContactAdmin = () => {
    if (onContactAdmin) {
      onContactAdmin();
    } else {
      window.dispatchEvent(new CustomEvent('open-contact-admin'));
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmailInput('');
    }
  };

  return (
    <>
      <footer className="bg-[#2C2A26] text-[#F5F2EB] py-4 sm:py-5 border-t border-[#423E38]" id="marketplace-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3.5">
          {/* Main Footer Grid - 5 equal columns on LG screens so everything fits on 1 row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
            {/* Brand Col */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <PremiumLogo className="w-7 h-7" chipColor="#F5F2EB" />
                <span className="text-lg font-serif font-bold text-white tracking-tight">
                  AIWeb<span className="text-[#D97706]">Crafter</span>
                </span>
              </div>
              <p className="text-[11px] text-[#D6D1C7] leading-tight">
                Buy & sell verified SaaS, AI web tools, and Shopify stores safely via escrow.
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Revenue Verified & Escrow Protected</span>
              </div>
            </div>

            {/* Asset Categories Link Column */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Browse Assets
              </h4>
              <ul className="space-y-0.5 text-[11px] text-[#D6D1C7]">
                <li><button onClick={() => onCategoryClick('SaaS')} className="hover:text-white transition-colors cursor-pointer">SaaS Platforms</button></li>
                <li><button onClick={() => onCategoryClick('AI Tools')} className="hover:text-white transition-colors cursor-pointer">AI Tools & Models</button></li>
                <li><button onClick={() => onCategoryClick('Shopify')} className="hover:text-white transition-colors cursor-pointer">Shopify Stores</button></li>
                <li><button onClick={() => onCategoryClick('E-commerce')} className="hover:text-white transition-colors cursor-pointer">E-commerce Brands</button></li>
                <li><button onClick={() => onCategoryClick('Mobile Apps')} className="hover:text-white transition-colors cursor-pointer">Mobile Apps</button></li>
              </ul>
            </div>

            {/* Seller & Platform Links */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Sellers & Support
              </h4>
              <ul className="space-y-0.5 text-[11px] text-[#D6D1C7]">
                <li><button onClick={onSellClick} className="hover:text-white transition-colors font-bold text-amber-200 cursor-pointer">List Project ({commissionPct}% Fee)</button></li>
                <li><button onClick={handleOpenContactAdmin} className="hover:text-white transition-colors font-bold text-amber-300 cursor-pointer flex items-center gap-1"><span>🎧 Contact Admin (Direct Desk)</span></button></li>
                <li><button onClick={() => setActiveModal('valuation')} className="hover:text-white transition-colors cursor-pointer">Valuation Calculator</button></li>
                <li><button onClick={() => setActiveModal('escrow')} className="hover:text-white transition-colors cursor-pointer">Escrow Guarantee</button></li>
                <li><button onClick={() => setActiveModal('buyer-guide')} className="hover:text-white transition-colors cursor-pointer">Buyer Due Diligence</button></li>
                <li><button onClick={() => setActiveModal('terms')} className="hover:text-white transition-colors cursor-pointer">Terms of Service</button></li>
              </ul>
            </div>

            {/* Seller Hub Card */}
            <div className="space-y-2 bg-gradient-to-b from-[#3A3630] to-[#25231F] p-3 rounded-xl border border-amber-400/60 relative overflow-hidden group">
              <div className="flex items-center justify-between relative z-10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 font-serif">
                  <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Seller Hub</span>
                </h4>
                <span className="text-[9px] bg-amber-400 text-[#2C2A26] px-1.5 py-0.2 rounded font-extrabold">
                  {commissionPct}% FEE
                </span>
              </div>
              <p className="text-[11px] text-white/90 leading-tight font-medium">
                List your business to 10k+ buyers with full <strong>Escrow</strong> protection.
              </p>
              <button
                onClick={onSellClick}
                className="w-full py-1.5 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-black hover:from-amber-200 hover:to-amber-300 font-extrabold rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Start Selling a Business"
              >
                <span>🚀 List Project for Sale</span>
                <ArrowRight className="w-3.5 h-3.5 text-black shrink-0" />
              </button>
            </div>

            {/* Deal Newsletter Box */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Deal Alerts
              </h4>
              <p className="text-[11px] text-[#D6D1C7] leading-tight">
                Get new verified listings before public release.
              </p>
              <form onSubmit={handleSubscribe} className="space-y-1">
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="buyer@example.com"
                  className="w-full bg-[#3B3833] border border-[#524D46] text-white text-[11px] rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-300 placeholder-[#8C8275]"
                />
                <button
                  type="submit"
                  className="w-full py-1 bg-amber-300 text-[#2C2A26] hover:bg-amber-400 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                >
                  {subscribed ? '✓ Subscribed' : 'Subscribe'}
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-2.5 border-t border-[#423E38] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8C8275]">
            <div>
              © {new Date().getFullYear()} AIWebCrafter Marketplace. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveModal('privacy')} className="hover:text-[#D6D1C7] transition-colors cursor-pointer">Privacy Policy</button>
              <button onClick={() => setActiveModal('terms')} className="hover:text-[#D6D1C7] transition-colors cursor-pointer">Terms of Service</button>
              <button onClick={() => setActiveModal('escrow')} className="hover:text-[#D6D1C7] transition-colors cursor-pointer">Escrow Protection</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Policy & Tool Modals */}
      <FooterInfoModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onSellClick={onSellClick}
      />
    </>
  );
};

export default Footer;
