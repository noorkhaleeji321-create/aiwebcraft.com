import React from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  DollarSign, 
  Star, 
  Award 
} from 'lucide-react';
import { SellerInfo } from '../types.js';

interface SellerCardProps {
  seller: SellerInfo;
  onOpenContactModal: () => void;
  onOpenOfferModal: () => void;
}

const SellerCard: React.FC<SellerCardProps> = ({
  seller,
  onOpenContactModal,
  onOpenOfferModal
}) => {
  const safeSeller = seller || {
    id: 'sel-default',
    name: 'Verified Seller',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    rating: 5.0,
    completedDeals: 12,
    verified: true,
    memberSince: '2024',
    location: 'Global',
    responseRate: '< 1 hour',
    bio: 'Verified digital asset creator and SaaS builder.'
  };

  const avatarUrl = safeSeller.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
  const sellerName = safeSeller.name || 'Verified Seller';

  return (
    <div className="bg-white border border-[#E2DDD3] rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[#E2DDD3]">
        <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
          Seller Profile
        </h3>
        {safeSeller.verified && (
          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ID Verified</span>
          </span>
        )}
      </div>

      {/* Profile Header */}
      <div className="flex items-start gap-4">
        <img
          src={avatarUrl}
          alt={sellerName}
          className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E2DDD3] shadow-sm shrink-0"
        />
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-lg text-[#2C2A26]">{sellerName}</h4>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#5D5A53]">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#8C8275]" />
              <span>{safeSeller.location || 'Global'}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#8C8275]" />
              <span>Member since {safeSeller.memberSince || '2024'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-900 pt-0.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{safeSeller.rating ?? 5.0} / 5.0</span>
            <span className="text-[#8C8275] font-normal">
              ({safeSeller.completedDeals ?? 12} completed deals)
            </span>
          </div>
        </div>
      </div>

      {/* Seller Bio */}
      <p className="text-xs text-[#5D5A53] leading-relaxed bg-[#FDFCF9] p-3 rounded-xl border border-[#E2DDD3]">
        "{safeSeller.bio || 'Verified digital builder and SaaS seller on AIWebCrafter.'}"
      </p>

      {/* Response Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 bg-[#F5F2EB] rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-[#8C8275] block">
            Response Rate
          </span>
          <span className="font-bold text-[#2C2A26] text-sm">{safeSeller.responseRate || '< 1 hour'}</span>
        </div>
        <div className="p-2.5 bg-[#F5F2EB] rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-[#8C8275] block">
            Success Rate
          </span>
          <span className="font-bold text-emerald-700 text-sm">100% On-Time Transfer</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onOpenContactModal}
          className="w-full py-3 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-sm font-semibold hover:bg-[#423E38] transition-all flex items-center justify-center gap-2 shadow"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Contact Seller</span>
        </button>

        <button
          onClick={onOpenOfferModal}
          className="w-full py-2.5 bg-white text-[#2C2A26] border border-[#E2DDD3] hover:border-[#2C2A26] rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Make an Offer</span>
        </button>
      </div>
    </div>
  );
};

export default SellerCard;
