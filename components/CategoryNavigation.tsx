import React from 'react';
import { 
  Grid, 
  Cpu, 
  Sparkles, 
  ShoppingBag, 
  Store, 
  Smartphone, 
  Globe, 
  Folder 
} from 'lucide-react';
import { CategoryType } from '../types.js';

interface CategoryNavigationProps {
  categories: { id: CategoryType; label: string; count: number }[];
  selectedCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
}

const getCategoryIcon = (id: CategoryType) => {
  switch (id) {
    case 'All':
      return Grid;
    case 'SaaS':
      return Cpu;
    case 'AI Tools':
      return Sparkles;
    case 'Shopify':
    case 'E-commerce':
    case 'E-commerce & Stores':
      return ShoppingBag;
    case 'Mobile Apps':
      return Smartphone;
    case 'Digital Content':
      return Folder;
    case 'Browser Extensions':
    case 'Websites':
      return Globe;
    default:
      return Folder;
  }
};

const getShortCategoryLabel = (id: CategoryType, label: string): string => {
  const normId = (id || '').toLowerCase().trim();
  if (normId === 'all') return 'All';
  if (normId === 'ai tools' || normId.includes('ai')) return 'AI';
  if (normId === 'saas') return 'SaaS';
  if (normId.includes('commerce') || normId.includes('shopify') || normId.includes('store')) return 'E-Com';
  if (normId.includes('mobile')) return 'Mobile';
  if (normId.includes('content') || normId.includes('newsletter')) return 'Content';
  if (normId.includes('extension')) return 'Ext';
  if (normId.includes('website')) return 'Web';

  // Fallback: if label is long, pick clean abbreviation or first 2 letters
  if (label && label.length > 8) {
    const words = label.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return words.map(w => w[0].toUpperCase()).join('.');
    }
    return label.slice(0, 6);
  }
  return label || id;
};

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <section className="w-full py-2" id="categories-section">
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-serif font-bold text-[#2C2A26] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block"></span>
            Categories
          </h2>
        </div>
      </div>

      {/* Sleek, Compact Horizontal Pills */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-1">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.id);
          const isSelected = selectedCategory === cat.id;
          const shortTitle = getShortCategoryLabel(cat.id, cat.label || (cat as any).name || '');
          const fullTitle = cat.label || (cat as any).name || cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              title={fullTitle}
              className={`group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-[#2C2A26] text-[#F5F2EB] border-[#2C2A26] shadow-sm scale-[1.02]'
                  : 'bg-white text-[#4A463F] border-[#E5E0D8] hover:border-[#2C2A26] hover:text-[#2C2A26] hover:bg-[#FAF8F5]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 transition-colors ${
                  isSelected ? 'text-amber-300' : 'text-[#8C8275] group-hover:text-[#2C2A26]'
                }`}
              />
              <span className="tracking-tight">{shortTitle}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold leading-none ${
                  isSelected
                    ? 'bg-amber-400/20 text-amber-200'
                    : 'bg-[#ECE7DE] text-[#6B655B]'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryNavigation;
