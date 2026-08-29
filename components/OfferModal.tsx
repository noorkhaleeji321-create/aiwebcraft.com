import React, { useState } from 'react';
import { X, DollarSign, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Listing } from '../types.js';

interface OfferModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
}

const OfferModal: React.FC<OfferModalProps> = ({ listing, isOpen, onClose }) => {
  const [offerPrice, setOfferPrice] = useState(listing.askingPrice);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submitted) return;
    setIsSubmitting(true);
    setSubmitted(true);
    setTimeout(() => setIsSubmitting(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2DDD3] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8C8275] hover:text-[#2C2A26] p-1.5 rounded-full hover:bg-[#F5F2EB]"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="font-serif font-bold text-2xl text-[#2C2A26]">
                Make an Offer
              </h3>
              <p className="text-xs text-[#5D5A53]">
                Project: <span className="font-bold">{listing.title}</span> (Asking:{' '}
                {formatCurrency(listing.askingPrice)})
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2C2A26] uppercase tracking-wider block">
                Your Offer Price ($ USD)
              </label>
              <div className="relative flex items-center">
                <DollarSign className="w-5 h-5 text-[#8C8275] absolute left-3 pointer-events-none" />
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(Number(e.target.value))}
                  required
                  className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-lg font-serif font-bold rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#2C2A26]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2C2A26] uppercase tracking-wider block">
                Offer Terms or Comments (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Include details such as financing preference, onboarding duration required, or inspection timeframe..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-sm rounded-xl p-3 focus:outline-none focus:border-[#2C2A26] resize-none"
              />
            </div>

            <div className="p-3 bg-[#F5F2EB] rounded-xl text-xs text-[#5D5A53] space-y-1">
              <span className="font-bold text-[#2C2A26] block">Non-Binding Proposal</span>
              <p>
                Submitting an offer starts confidential negotiations. No funds are charged until both parties sign escrow terms.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-[#5D5A53] hover:text-[#2C2A26]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition-all flex items-center gap-1.5 shadow"
              >
                <DollarSign className="w-4 h-4" />
                <span>Submit Offer ({formatCurrency(offerPrice)})</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-2xl text-[#2C2A26]">
              Offer Submitted!
            </h3>
            <p className="text-xs text-[#5D5A53] max-w-sm mx-auto leading-relaxed">
              Your offer of <strong>{formatCurrency(offerPrice)}</strong> has been sent to <strong>{listing?.seller?.name || 'Seller'}</strong>. They have 48 hours to respond, accept, or counter.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="px-6 py-2.5 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-xs font-semibold hover:bg-[#423E38]"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferModal;
