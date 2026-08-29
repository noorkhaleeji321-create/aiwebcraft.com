import React from 'react';
import { SearchX, Filter, RotateCcw, Sparkles } from 'lucide-react';
import { Listing } from '../types.js';
import ListingCard from './ListingCard.js';

interface ListingGridProps {
  listings: Listing[];
  isLoading: boolean;
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onViewDetails: (listing: Listing) => void;
  onResetFilters: () => void;
  activeFilterSummary?: string;
  onDeleteListing?: (id: string) => void;
}

const ListingGrid: React.FC<ListingGridProps> = ({
  listings,
  isLoading,
  savedIds,
  onToggleSave,
  onViewDetails,
  onResetFilters,
  activeFilterSummary,
  onDeleteListing
}) => {
  // Skeleton Loader Cards
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white border border-[#E2DDD3] rounded-2xl overflow-hidden p-4 space-y-4 animate-pulse"
          >
            <div className="h-44 bg-[#EAE5D9] rounded-xl w-full" />
            <div className="h-6 bg-[#EAE5D9] rounded w-3/4" />
            <div className="h-4 bg-[#EAE5D9] rounded w-1/2" />
            <div className="h-16 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3]" />
            <div className="flex justify-between items-center pt-2">
              <div className="h-8 w-24 bg-[#EAE5D9] rounded-full" />
              <div className="h-8 w-20 bg-[#2C2A26]/20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty State
  if (listings.length === 0) {
    return (
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-12 text-center max-w-2xl mx-auto my-8 space-y-4 shadow-sm animate-fade-in">
        <div className="w-16 h-16 bg-[#F5F2EB] rounded-2xl text-[#8C8275] flex items-center justify-center mx-auto">
          <SearchX className="w-8 h-8 text-[#2C2A26]" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-[#2C2A26]">
          No Projects Listed Yet
        </h3>
        <p className="text-sm text-[#5D5A53] max-w-md mx-auto leading-relaxed">
          The marketplace is clean and ready. Once sellers submit their projects and receive admin approval, active listings will appear here.
        </p>
        <div className="pt-2">
          <button
            onClick={onResetFilters}
            className="px-6 py-3 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-sm font-semibold hover:bg-[#423E38] transition-all inline-flex items-center gap-2 shadow"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Search & Filters</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Header Summary */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E2DDD3]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#2C2A26]">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>
            Showing {listings.length} {listings.length === 1 ? 'Verified Asset' : 'Verified Assets'}
          </span>
          {activeFilterSummary && (
            <span className="text-xs text-[#8C8275] font-normal hidden sm:inline">
              ({activeFilterSummary})
            </span>
          )}
        </div>
      </div>

      {/* Grid of Listing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isSaved={savedIds.includes(listing.id)}
            onToggleSave={onToggleSave}
            onViewDetails={onViewDetails}
            onDeleteListing={onDeleteListing}
          />
        ))}
      </div>
    </div>
  );
};

export default ListingGrid;
