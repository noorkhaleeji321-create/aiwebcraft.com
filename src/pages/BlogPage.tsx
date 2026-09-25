import React, { useState, useEffect } from 'react';
import { Article, ArticleStatus, Category, Language, Tag } from '../types/blog';
import { translations } from '../i18n/translations';
import { storeService } from '../services/store';
import { ArticleCard } from '../components/ArticleCard';
import { Search, Filter, X, Tag as TagIcon, Sparkles } from 'lucide-react';

interface BlogPageProps {
  currentLang: Language;
  onNavigate: (view: string, slug?: string) => void;
  initialQuery?: string;
}

export const BlogPage: React.FC<BlogPageProps> = ({
  currentLang,
  onNavigate,
  initialQuery = '',
}) => {
  const t = translations[currentLang];
  const isAr = currentLang === 'ar';

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<ArticleStatus | 'all'>('all');

  useEffect(() => {
    if (initialQuery.startsWith('search:')) {
      setSearchQuery(decodeURIComponent(initialQuery.replace('search:', '')));
    } else if (initialQuery) {
      setSelectedCategory(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    const fetchData = async () => {
      const cats = await storeService.getCategories();
      setCategories(cats);

      const tgList = await storeService.getTags();
      setTags(tgList);

      const allArts = await storeService.getArticles({ status: 'all' });
      setArticles(allArts);
    };

    fetchData();
  }, []);

  const filteredArticles = articles.filter((a) => {
    if (selectedStatus !== 'all' && a.status !== selectedStatus) return false;
    
    if (selectedCategory !== 'all') {
      const matchCatId = a.category_id === selectedCategory;
      const matchCatSlug = a.category?.slug === selectedCategory;
      if (!matchCatId && !matchCatSlug) return false;
    }

    if (selectedTag !== 'all') {
      const matchTag = a.tags?.some((t) => t.slug === selectedTag || t.id === selectedTag);
      if (!matchTag) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q) || a.title_ar.toLowerCase().includes(q);
      const matchExcerpt = a.excerpt.toLowerCase().includes(q) || a.excerpt_ar.toLowerCase().includes(q);
      if (!matchTitle && !matchExcerpt) return false;
    }

    return true;
  });

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTag('all');
    setSelectedStatus('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {t.blog}
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Deep-dive technical guides, architectural insights, and tutorials covering AI engineering, web development, SaaS, and modern tools.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">{t.allCategories}</option>
              {categories.filter((c) => c && (c.name || c.name_ar)).map((c) => (
                <option key={c.id || c.slug} value={c.slug}>
                  {isAr ? c.name_ar || c.name : c.name || c.name_ar}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="published">{t.published}</option>
              <option value="draft">{t.draft}</option>
              <option value="scheduled">{t.scheduled}</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={clearAllFilters}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.clearFilters}</span>
            </button>
          </div>

        </div>

        {/* Tag Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/60">
          <span className="text-xs text-slate-500 font-mono flex items-center gap-1 shrink-0">
            <TagIcon className="w-3 h-3 text-indigo-400" />
            <span>{t.filterByTag}</span>
          </span>
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
              selectedTag === 'all'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            All
          </button>
          {tags.filter((tg) => tg && (tg.name || tg.name_ar)).map((tg) => (
            <button
              key={tg.id || tg.slug}
              onClick={() => setSelectedTag(tg.slug)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
                selectedTag === tg.slug
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white bg-slate-950'
              }`}
            >
              #{isAr ? tg.name_ar || tg.name : tg.name || tg.name_ar}
            </button>
          ))}
        </div>

      </div>

      {/* Articles Grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art) => (
            <ArticleCard
              key={art.id}
              article={art}
              currentLang={currentLang}
              onSelect={(slug) => onNavigate('article', slug)}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
          <p className="text-slate-400 text-sm font-medium">{t.noArticlesFound}</p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {t.clearFilters}
          </button>
        </div>
      )}

    </div>
  );
};
