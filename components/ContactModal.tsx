import React, { useState } from 'react';
import { X, Send, ShieldCheck, CheckCircle2, MessageSquare } from 'lucide-react';
import { Listing } from '../types.js';
import { createOrGetDirectChat } from '../services/directChatStore.js';
import { getCurrentLoggedInEmail } from '../services/sellerStore.js';

interface ContactModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMessages?: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ listing, isOpen, onClose, onNavigateToMessages }) => {
  const sellerName = listing?.seller?.name || listing?.ownerEmail || 'Seller';
  const sellerAvatar = listing?.seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';

  const [buyerEmailInput, setBuyerEmailInput] = useState('');
  const [message, setMessage] = useState(
    `Hi ${sellerName}, I am interested in ${listing?.title || 'your project'}. I'd like to ask a few questions regarding the tech stack and revenue consistency before making an offer.`
  );
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const loggedInEmail = getCurrentLoggedInEmail();
    const finalBuyerEmail = buyerEmailInput.trim() || loggedInEmail || 'buyer@aiwebcrafter.local';
    const finalSellerEmail = listing.ownerEmail || listing.seller?.id || 'seller@aiwebcrafter.local';

    createOrGetDirectChat({
      listingId: listing.id,
      projectName: listing.title,
      sellerName,
      sellerEmail: finalSellerEmail,
      sellerAvatar,
      initialMessage: message,
      buyerEmail: finalBuyerEmail
    });
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2DDD3] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8C8275] hover:text-[#2C2A26] p-1.5 rounded-full hover:bg-[#F5F2EB] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={sellerAvatar}
                alt={sellerName}
                className="w-12 h-12 rounded-xl object-cover border"
              />
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
                  Contact {sellerName}
                </h3>
                <p className="text-xs text-[#5D5A53]">
                  Inquiring about: <span className="font-bold">{listing.title}</span>
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2C2A26] uppercase tracking-wider block">
                Your Email Address
              </label>
              <input
                type="email"
                required
                value={buyerEmailInput}
                onChange={(e) => setBuyerEmailInput(e.target.value)}
                placeholder="buyer@example.com"
                className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-sm rounded-xl p-3 focus:outline-none focus:border-[#2C2A26]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2C2A26] uppercase tracking-wider block">
                Message to Seller
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-sm rounded-xl p-3 focus:outline-none focus:border-[#2C2A26] resize-none"
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Escrow Guarantee: Your details are encrypted. Sellers usually respond in &lt; 1 hour.
              </span>
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
                className="px-6 py-2.5 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-xs font-semibold hover:bg-[#423E38] transition-all flex items-center gap-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-2xl text-[#2C2A26]">
              Inquiry Sent!
            </h3>
            <p className="text-xs text-[#5D5A53] max-w-sm mx-auto leading-relaxed">
              Your message has been sent to <strong>{sellerName}</strong> and saved in your <strong>Direct Messages & Chats</strong> tab.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              {onNavigateToMessages && (
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    onClose();
                    onNavigateToMessages();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Go to Direct Messages & Chats</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-xs font-semibold hover:bg-[#423E38] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactModal;
