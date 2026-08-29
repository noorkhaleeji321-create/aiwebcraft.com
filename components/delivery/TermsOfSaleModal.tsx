import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Lock, FileText, ArrowRight, X } from 'lucide-react';
import { Listing } from '../../types';

interface TermsOfSaleModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onAcceptAndProceed: (buyerName: string, buyerEmail: string) => void;
}

export const TermsOfSaleModal: React.FC<TermsOfSaleModalProps> = ({
  listing,
  isOpen,
  onClose,
  onAcceptAndProceed
}) => {
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [term1, setTerm1] = useState(false);
  const [term2, setTerm2] = useState(false);
  const [term3, setTerm3] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const allAccepted = term1 && term2 && term3 && buyerName.trim() && buyerEmail.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (allAccepted && !isSubmitting) {
      setIsSubmitting(true);
      onAcceptAndProceed(buyerName.trim(), buyerEmail.trim());
      setTimeout(() => setIsSubmitting(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-5 space-y-3.5 relative animate-fade-in-up overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8C8275] hover:text-[#2C2A26] p-1.5 rounded-full hover:bg-[#F5F2EB]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-emerald-700 font-bold text-[10px] uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>AIWebCrafter Escrow Acquisition Agreement</span>
        </div>

        <div>
          <h2 className="font-serif font-bold text-xl text-[#2C2A26]">
            Terms of Sale, Delivery & Dispute Policy
          </h2>
          <p className="text-[11px] text-[#5D5A53] mt-0.5">
            Digital Asset Acquisition for <strong className="text-[#2C2A26]">{listing.title}</strong> (${(listing.askingPrice || 0).toLocaleString()} USD)
          </p>
        </div>

        {/* Buyer Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FDFCF9] border border-[#E2DDD3] p-3 rounded-2xl">
          <div>
            <label className="text-[10px] font-bold text-[#2C2A26] block mb-0.5">Buyer Full Name / Entity *</label>
            <input
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="e.g. Alex Mercer / TechFund LLC"
              className="w-full bg-white border border-[#E2DDD3] rounded-xl p-2 text-xs text-[#2C2A26] focus:outline-none focus:border-[#2C2A26]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#2C2A26] block mb-0.5">Buyer Email Address *</label>
            <input
              type="email"
              required
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full bg-white border border-[#E2DDD3] rounded-xl p-2 text-xs text-[#2C2A26] focus:outline-none focus:border-[#2C2A26]"
            />
          </div>
        </div>

        {/* TERMS ARTICLES BOX */}
        <div className="p-3 bg-white border border-[#E2DDD3] rounded-2xl space-y-3 text-xs text-[#5D5A53] max-h-36 overflow-y-auto leading-relaxed">
          <div>
            <h4 className="font-bold text-[#2C2A26] uppercase text-[10px] mb-0.5">1. Escrow Holding & Payment Protection</h4>
            <p className="text-[11px]">
              Purchase funds are deposited directly into a secure Escrow account. Funds remain locked until the buyer inspects delivered assets and issues explicit acceptance or a resolution is reached via admin arbitration.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#2C2A26] uppercase text-[10px] mb-0.5">2. 48-Hour Download Timer & Inspection Window</h4>
            <p className="text-[11px]">
              Upon downloading the project files (Source Code, Database, Vault Credentials), a 48-hour countdown timer begins. Seller payout is automatically released in 48 hours unless a dispute is officially raised. Any reported defect, technical mismatch, or dissatisfaction triggers platform administration intervention.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#2C2A26] uppercase text-[10px] mb-0.5">3. Seller Legal Title Warranty</h4>
            <p className="text-[11px]">
              Seller guarantees 100% sole ownership and intellectual property rights over all transferred software, brand assets, and databases. Seller assumes full liability for accurate financial disclosures and clean title.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#2C2A26] uppercase text-[10px] mb-0.5">4. Dispute & Evidence Arbitration Policy</h4>
            <p className="text-[11px]">
              If delivered assets fail to meet advertised listing specifications or contain critical defects, the buyer may open a dispute prior to deal completion. Escrow funds remain frozen while AIWebCrafter administrators arbitrate based on audit logs and evidence.
            </p>
          </div>
        </div>

        {/* CHECKBOXES */}
        <form onSubmit={handleSubmit} className="space-y-2 text-xs">
          <label className="flex items-start gap-2 p-2.5 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl cursor-pointer hover:border-[#2C2A26] transition-colors">
            <input
              type="checkbox"
              checked={term1}
              onChange={(e) => setTerm1(e.target.checked)}
              className="mt-0.5 accent-[#2C2A26] w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-[#2C2A26] text-[11px]">
              I agree to the <strong>Terms of Sale</strong> and confirm that funds will be held in Escrow pending asset verification.
            </span>
          </label>

          <label className="flex items-start gap-2 p-2.5 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl cursor-pointer hover:border-[#2C2A26] transition-colors">
            <input
              type="checkbox"
              checked={term2}
              onChange={(e) => setTerm2(e.target.checked)}
              className="mt-0.5 accent-[#2C2A26] w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-[#2C2A26] text-[11px]">
              I understand the <strong>48-Hour Download Timer</strong> and agree that seller payout is released 48 hours post-download unless a dispute is submitted to admin.
            </span>
          </label>

          <label className="flex items-start gap-2 p-2.5 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl cursor-pointer hover:border-[#2C2A26] transition-colors">
            <input
              type="checkbox"
              checked={term3}
              onChange={(e) => setTerm3(e.target.checked)}
              className="mt-0.5 accent-[#2C2A26] w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-[#2C2A26] text-[11px]">
              I accept the <strong>Dispute Arbitration Policy</strong> and acknowledge that escrow releases require explicit buyer confirmation or admin dispute resolution.
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5D5A53]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!allAccepted || isSubmitting}
              className="px-5 py-2.5 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-xs font-bold hover:bg-[#423E38] transition-all flex items-center gap-2 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? 'Processing...' : 'Accept Terms & Initiate Transaction'}</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TermsOfSaleModal;
