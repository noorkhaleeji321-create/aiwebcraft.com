import React from 'react';
import { Filter, RotateCcw, DollarSign, TrendingUp, ShieldCheck, Check } from 'lucide-react';
import { FilterOptions, CategoryType } from '../types.js';
import { POPULAR_TECH_TAGS } from '../data/mockListings.js';

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (updated: Partial<FilterOptions>) => void;
  onResetFilters: () => void;
  categories: CategoryType[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  categories
}) => {
  const handleTechToggle = (tech: string) => {
    const current = filters.selectedTech || [];
    if (current.includes(tech)) {
      onFilterChange({ selectedTech: current.filter((t) => t !== tech) });
    } else {
      onFilterChange({ selectedTech: [...current, tech] });
    }
  };

  const revenuePresets = [
    { label: 'Any Revenue', value: null },
    { label: '$1,000+/mo', value: 1000 },
    { label: '$3,000+/mo', value: 3000 },
    { label: '$5,000+/mo', value: 5000 }
  ];

  return (
    <aside className="w-full bg-white border border-[#E2DDD3] rounded-2xl p-5 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E2DDD3]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#2C2A26]" />
          <h3 className="font-serif font-bold text-[#2C2A26] text-lg">Filters</h3>
        </div>
        <button
          onClick={onResetFilters}
          className="text-xs font-semibold text-[#8C8275] hover:text-[#2C2A26] flex items-center gap-1 transition-colors"
          title="Reset all filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort By Dropdown */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#8C8275] block">
          Sort Marketplace By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
          className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-sm rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#2C2A26]"
          id="sort-by-select"
        >
          <option value="newest">Newest Listings First</option>
          <option value="revenue-high">Monthly Revenue: High to Low</option>
          <option value="profit-high">Monthly Profit: High to Low</option>
          <option value="price-low">Asking Price: Low to High</option>
          <option value="price-high">Asking Price: High to Low</option>
        </select>
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#8C8275] block">
          Category
        </label>
        <select
          value={filters.category}
          onChange={(e) => onFilterChange({ category: e.target.value as CategoryType })}
          className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-sm rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#2C2A26]"
        >
          <option value="All">All Categories</option>
          {categories
            .filter((c) => c !== 'All')
            .map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
        </select>
      </div>

      {/* Business Stage Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#8C8275] block">
          Business Stage
        </label>
        <select
          value={filters.businessStageFilter || 'All'}
          onChange={(e) => onFilterChange({ businessStageFilter: e.target.value as any })}
          className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-sm rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#2C2A26]"
        >
          <option value="All">All Stages</option>
          <option value="PRE_LAUNCH">🚀 Pre-Launch</option>
          <option value="BETA">🧪 Beta / Early Access</option>
          <option value="LIVE_NO_REVENUE">🌐 Live / No Revenue</option>
          <option value="LIVE_REVENUE">💰 Live / Generating Revenue</option>
          <option value="ESTABLISHED">🏢 Established Business</option>
        </select>
      </div>

      {/* Asset Type Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#8C8275] block">
          Asset Type
        </label>
        <select
          value={filters.assetTypeFilter || 'All'}
          onChange={(e) => onFilterChange({ assetTypeFilter: e.target.value as any })}
          className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-sm rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#2C2A26]"
        >
          <option value="All">All Asset Types</option>
          <option value="SaaS">SaaS Platform</option>
          <option value="Mobile App">Mobile Application</option>
          <option value="Website">Content Website / Blog</option>
          <option value="E-commerce Store">E-commerce Store</option>
          <option value="AI Product">AI-powered Agent / Tool</option>
          <option value="Marketplace">Two-sided Marketplace</option>
          <option value="API">Developer API Service</option>
          <option value="Chrome Extension">Chrome Extension</option>
          <option value="Domain">Premium Domain Name</option>
          <option value="Digital Tool">Digital Utility / Tool</option>
          <option value="Source Code">Source Code License</option>
          <option value="Other">Other Digital Assets</option>
        </select>
      </div>

      {/* Monthly Revenue Threshold */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#8C8275] flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>Min. Monthly Revenue</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {revenuePresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onFilterChange({ minRevenue: preset.value })}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border text-left transition-all ${
                filters.minRevenue === preset.value
                  ? 'bg-[#2C2A26] text-[#F5F2EB] border-[#2C2A26]'
                  : 'bg-[#FDFCF9] text-[#2C2A26] border-[#E2DDD3] hover:border-[#2C2A26]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#8C8275] flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-[#2C2A26]" />
          <span>Asking Price Range ($)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min $"
            value={filters.minPrice !== null ? filters.minPrice : ''}
            onChange={(e) =>
              onFilterChange({
                minPrice: e.target.value ? Number(e.target.value) : null
              })
            }
            className="w-1/2 bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-xs rounded-xl p-2 focus:outline-none focus:border-[#2C2A26]"
          />
          <span className="text-xs text-[#8C8275]">-</span>
          <input
            type="number"
            placeholder="Max $"
            value={filters.maxPrice !== null ? filters.maxPrice : ''}
            onChange={(e) =>
              onFilterChange({
                maxPrice: e.target.value ? Number(e.target.value) : null
              })
            }
            className="w-1/2 bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-xs rounded-xl p-2 focus:outline-none focus:border-[#2C2A26]"
          />
        </div>
      </div>

      {/* Verified Only Checkbox Toggle */}
      <div className="pt-2 border-t border-[#E2DDD3]">
        <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-[#FDFCF9] border border-[#E2DDD3] hover:border-[#2C2A26] transition-all">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-[#2C2A26]">Verified Sellers Only</span>
          </div>
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => onFilterChange({ verifiedOnly: e.target.checked })}
            className="w-4 h-4 rounded text-[#2C2A26] focus:ring-0 cursor-pointer accent-[#2C2A26]"
          />
        </label>
      </div>

      {/* Tech Stack Filter Tags */}
      <div className="space-y-2 pt-2 border-t border-[#E2DDD3]">
        <label className="text-xs font-bold uppercase tracking-wider text-[#8C8275] block">
          Filter by Tech Stack
        </label>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TECH_TAGS.map((tech) => {
            const isSelected = filters.selectedTech?.includes(tech);
            return (
              <button
                key={tech}
                onClick={() => handleTechToggle(tech)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#2C2A26] text-[#F5F2EB] border-[#2C2A26]'
                    : 'bg-[#FDFCF9] text-[#5D5A53] border-[#E2DDD3] hover:text-[#2C2A26]'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-amber-300" />}
                <span>{tech}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default FilterPanel;
