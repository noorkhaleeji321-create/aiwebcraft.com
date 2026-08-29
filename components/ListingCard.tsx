import React from 'react';
import { 
  Heart, 
  TrendingUp, 
  ArrowUpRight, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  ExternalLink,
  Trash2
} from 'lucide-react';
import { Listing } from '../types.js';

interface ListingCardProps {
  listing: Listing;
  isSaved: boolean;
  onToggleSave: (listingId: string) => void;
  onViewDetails: (listing: Listing) => void;
  onDeleteListing?: (listingId: string) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  isSaved,
  onToggleSave,
  onViewDetails,
  onDeleteListing
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div
      className="bg-white border border-[#E2DDD3] rounded-2xl overflow-hidden hover:shadow-xl hover:border-[#2C2A26]/40 transition-all duration-300 flex flex-col justify-between group"
      id={`listing-card-${listing.id}`}
    >
      <div>
        {/* Top Image Preview Banner */}
        <div className="relative h-48 w-full bg-[#EAE5D9] overflow-hidden">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Top Floating Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="px-2.5 py-1 bg-[#2C2A26]/90 backdrop-blur-md text-[#F5F2EB] text-xs font-semibold rounded-lg shadow-sm border border-white/20">
              {listing.category}
            </span>

            {/* Action buttons (Favorite & Delete) */}
            <div className="flex items-center gap-1.5">
              {onDeleteListing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${listing.title}" from the marketplace?`)) {
                      onDeleteListing(listing.id);
                    }
                  }}
                  className="p-2 rounded-full bg-red-500/90 hover:bg-red-600 text-white transition-all shadow-sm"
                  title="Delete SaaS listing"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Favorite / Heart button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(listing.id);
                }}
                className="p-2 rounded-full bg-white/90 backdrop-blur-md text-[#2C2A26] hover:bg-white transition-all shadow-sm"
                title={isSaved ? 'Remove from favorites' : 'Save project'}
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isSaved ? 'fill-red-500 text-red-500' : 'text-[#2C2A26]'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Bottom Floating Platform Tag */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="text-[11px] font-medium text-white/90 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10">
              {listing.platform}
            </span>
            {listing.verification?.revenueVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified MRR</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Title & Tagline */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3
                onClick={() => onViewDetails(listing)}
                className="font-serif font-bold text-[#2C2A26] text-lg leading-snug group-hover:text-amber-800 transition-colors cursor-pointer line-clamp-1"
              >
                {listing.title}
              </h3>
            </div>
            <p className="text-xs text-[#5D5A53] mt-1 line-clamp-2 leading-relaxed">
              {listing.tagline}
            </p>
          </div>

          {/* Stage & Asset Type badges */}
          <div className="flex items-center gap-2 flex-wrap text-[10px]">
            {listing.business_stage && (
              <span className={`px-2.5 py-0.5 rounded-md font-bold ${
                listing.business_stage === 'PRE_LAUNCH' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                listing.business_stage === 'BETA' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                listing.business_stage === 'LIVE_NO_REVENUE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                listing.business_stage === 'LIVE_REVENUE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {
                  listing.business_stage === 'PRE_LAUNCH' ? '🚀 Pre-Launch' :
                  listing.business_stage === 'BETA' ? '🧪 Beta' :
                  listing.business_stage === 'LIVE_NO_REVENUE' ? '🌐 Live / No Rev' :
                  listing.business_stage === 'LIVE_REVENUE' ? '💰 Live / Rev' :
                  '🏢 Established'
                }
              </span>
            )}

            {listing.asset_type && (
              <span className="px-2 py-0.5 bg-[#F5F2EB] text-[#2C2A26] border border-[#E2DDD3] rounded-md font-semibold">
                📂 {listing.asset_type}
              </span>
            )}

            {/* Revenue Verification status */}
            {(listing.business_stage === 'LIVE_REVENUE' || listing.business_stage === 'ESTABLISHED') && (
              <span className={`px-2 py-0.5 rounded-md font-bold ${
                listing.revenueVerificationStatus === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {listing.revenueVerificationStatus === 'VERIFIED' ? '✓ Revenue Verified' : 'Revenue Claimed'}
              </span>
            )}
          </div>

          {/* Financial Metrics Strip */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8275] block">
                Monthly Revenue
              </span>
              <div className="flex items-center gap-1 font-semibold text-[#2C2A26] text-sm">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {listing.monthlyRevenue > 0
                    ? `${formatCurrency(listing.monthlyRevenue)}/mo`
                    : 'Pre-Revenue'}
                </span>
              </div>
            </div>

            <div className="border-l border-[#E2DDD3] pl-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8275] block">
                Net Profit
              </span>
              <div className="flex items-center gap-1 font-semibold text-emerald-700 text-sm">
                <span>
                  {listing.monthlyProfit > 0
                    ? `${formatCurrency(listing.monthlyProfit)}/mo`
                    : '$0/mo'}
                </span>
              </div>
            </div>
          </div>

          {/* Tech Stack Pills */}
          <div className="flex flex-wrap gap-1">
            {listing.techStack?.frontend?.slice(0, 3).map((tech, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium px-2 py-0.5 bg-[#EAE5D9] text-[#2C2A26] rounded-md"
              >
                {tech}
              </span>
            ))}
            {(listing.techStack?.frontend?.length || 0) > 3 && (
              <span className="text-[10px] text-[#8C8275] font-medium px-1">
                +{(listing.techStack?.frontend?.length || 0) - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Seller & Action */}
      <div className="px-5 py-4 bg-[#FDFCF9] border-t border-[#E2DDD3] flex items-center justify-between mt-2">
        {/* Seller Info */}
        <div className="flex items-center gap-2.5">
          <img
            src={listing.seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
            alt={listing.seller?.name || 'Seller'}
            className="w-8 h-8 rounded-full object-cover border border-[#E2DDD3]"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-[#2C2A26] line-clamp-1">
                {listing.seller?.name || 'Verified Seller'}
              </span>
              {listing.seller?.verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Verified Seller" />
              )}
            </div>
            <span className="text-[10px] text-[#8C8275]">
              ⭐ {listing.seller?.rating ?? 5.0} ({listing.seller?.completedDeals ?? 12} deals)
            </span>
          </div>
        </div>

        {/* Price & CTA Button */}
        <div className="text-right">
          <span className="text-[10px] text-[#8C8275] uppercase font-bold tracking-wider block">
            Asking Price
          </span>
          <div className="flex items-center gap-2">
            <span className="text-base font-serif font-bold text-[#2C2A26]">
              {formatCurrency(listing.askingPrice)}
            </span>
            <button
              onClick={() => onViewDetails(listing)}
              className="px-3 py-1.5 bg-[#2C2A26] text-[#F5F2EB] rounded-lg text-xs font-semibold hover:bg-[#423E38] transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
