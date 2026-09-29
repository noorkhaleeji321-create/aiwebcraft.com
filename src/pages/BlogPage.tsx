import React, { useState, useEffect } from 'react';
import { Article, Category, Language } from '../types/blog';
import { translations } from '../i18n/translations';
import { storeService } from '../services/store';
import { ArticleCard } from '../components/ArticleCard';
import { Sparkles } from 'lucide-react';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialQuery.startsWith('search:')) {
      setSearchQuery(decodeURIComponent(initialQuery.replace('search:', '')));
      setSelectedCategory('all');
    } else if (initialQuery) {
      setSelectedCategory(initialQuery);
    } else {
      setSelectedCategory('all');
      setSearchQuery('');
    }
  }, [initialQuery]);

  useEffect(() => {
    const fetchData = async () => {
      const allArts = await storeService.getArticles({ status: 'all' });
      if (allArts && allArts.length > 0) {
        setArticles(allArts);
      } else {
        const fallbackArts = await storeService.getArticles();
        setArticles(fallbackArts);
      }
    };

    fetchData();
  }, []);

  const filteredArticles = articles.filter((a) => {
    if (selectedCategory !== 'all') {
      const matchCatId = a.category_id === selectedCategory;
      const matchCatSlug = a.category?.slug === selectedCategory;
      if (!matchCatId && !matchCatSlug) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (a.title || '').toLowerCase().includes(q) || (a.title_ar || '').toLowerCase().includes(q);
      const matchExcerpt = (a.excerpt || '').toLowerCase().includes(q) || (a.excerpt_ar || '').toLowerCase().includes(q);
      if (!matchTitle && !matchExcerpt) return false;
    }

    return true;
  });

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {t.blog}
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          {isAr
            ? 'دليل شامل ومقالات علمية متخصصة في التغذية الرياضية، نحت القوام، والتمارين البيوميكانيكية لتكبير الأرداف والمؤخرة بأمان تام.'
            : 'Evidence-based guides and scientific articles on sports nutrition, curve sculpting, and biomechanical training for natural hypertrophy.'}
        </p>
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
