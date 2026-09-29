import React, { useState, useEffect } from 'react';
import { Category, Language } from '../types/blog';
import { translations } from '../i18n/translations';
import { Sparkles, Github, Twitter, Database, BookOpen, Layers } from 'lucide-react';
import { storeService } from '../services/store';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  currentLang: Language;
  onNavigate: (view: string, slug?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ currentLang, onNavigate }) => {
  const t = translations[currentLang];
  const isAr = currentLang === 'ar';
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const cats = await storeService.getCategories();
        if (isMounted && cats && cats.length > 0) {
          setCategories(cats);
        }
      } catch (_) {}
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 text-slate-400 text-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/60">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <BrandLogo className="w-8 h-8" size={32} />
              <span className="text-lg font-extrabold text-white tracking-tight">AIWebCrafter</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              {t.footerDesc}
            </p>
            <div className="flex items-center gap-3 text-slate-400 pt-2">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 bg-slate-900 border border-slate-800 hover:text-white hover:border-slate-700 rounded-lg transition-colors" title="GitHub">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 bg-slate-900 border border-slate-800 hover:text-white hover:border-slate-700 rounded-lg transition-colors" title="Twitter / X">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold mb-4">
              {t.quickLinks}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-indigo-400 transition-colors cursor-pointer text-left rtl:text-right">
                  {t.home}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="hover:text-indigo-400 transition-colors cursor-pointer text-left rtl:text-right">
                  {t.blog}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-indigo-400 transition-colors cursor-pointer text-left rtl:text-right">
                  {isAr ? 'من نحن' : 'About Us'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-indigo-400 transition-colors cursor-pointer text-left rtl:text-right">
                  {isAr ? 'اتصل بنا' : 'Contact Us'}
                </button>
              </li>
            </ul>
          </div>

          {/* Core Categories & Topics (AdSense-Compliant & Dynamic) */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold mb-4 flex items-center gap-1.5">
              <span>{isAr ? 'أقسام وتصنيفات الموقع' : 'Categories & Topics'}</span>
            </h4>
            <ul className="space-y-2.5">
              {categories && categories.length > 0 ? (
                <>
                  {categories.map((cat) => (
                    <li key={cat.id || cat.slug}>
                      <button 
                        onClick={() => onNavigate('blog', cat.slug)} 
                        className="hover:text-indigo-400 transition-colors cursor-pointer text-left rtl:text-right block w-full truncate"
                        title={isAr ? (cat.name_ar || cat.name) : cat.name}
                      >
                        {isAr ? (cat.name_ar || cat.name) : cat.name}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button 
                      onClick={() => onNavigate('blog')} 
                      className="hover:text-indigo-400 text-indigo-400/90 text-xs font-medium transition-colors cursor-pointer text-left rtl:text-right pt-1 flex items-center gap-1"
                    >
                      <span>{isAr ? '← استكشاف جميع المقالات' : 'Explore All Articles →'}</span>
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button 
                      onClick={() => onNavigate('blog', 'sahrawi-recipes')} 
                      className="hover:text-indigo-400 transition-colors cursor-pointer text-left rtl:text-right"
                    >
                      {isAr ? 'الخلطات والوصفات الصحراوية' : 'Authentic Sahrawi Recipes'}
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => onNavigate('blog', 'natural-curves-nutrition')} 
                      className="hover:text-indigo-400 transition-colors cursor-pointer text-left rtl:text-right"
                    >
                      {isAr ? 'التغذية وزيادة الوزن الطبيعية' : 'Natural Curves & Nutrition'}
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => onNavigate('blog')} 
                      className="hover:text-indigo-400 transition-colors cursor-pointer text-left rtl:text-right"
                    >
                      {isAr ? 'جميع المقالات والدلائل' : 'All Guides & Articles'}
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

        </div>

        {/* Copyright, Legal and Discreet Secret Entry */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 border-t border-slate-900 select-none">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                onNavigate('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-slate-500 hover:text-indigo-400/80 transition-colors cursor-pointer focus:outline-none font-semibold p-0.5"
              aria-label="Admin Access"
            >
              ©
            </button>
            <span>{isAr ? '2026 AIWebCrafter. جميع الحقوق محفوظة.' : '2026 AIWebCrafter. All rights reserved.'}</span>
          </div>
          
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <button onClick={() => onNavigate('privacy')} className="hover:text-indigo-400 transition-colors">
              {currentLang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </button>
            <span>·</span>
            <button onClick={() => onNavigate('terms')} className="hover:text-indigo-400 transition-colors">
              {currentLang === 'ar' ? 'شروط الاستخدام' : 'Terms of Service'}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
