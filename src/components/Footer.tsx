import React from 'react';
import { Language } from '../types/blog';
import { translations } from '../i18n/translations';
import { Sparkles, Github, Twitter, Database, BookOpen } from 'lucide-react';

interface FooterProps {
  currentLang: Language;
  onNavigate: (view: string, slug?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ currentLang, onNavigate }) => {
  const t = translations[currentLang];
  const isAr = currentLang === 'ar';

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/60">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">AIWebCrafter</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              {t.footerDesc}
            </p>
            <div className="flex items-center gap-3 text-slate-400 pt-2">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 bg-slate-900 border border-slate-800 hover:text-white hover:border-slate-700 rounded-lg transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 bg-slate-900 border border-slate-800 hover:text-white hover:border-slate-700 rounded-lg transition-colors">
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
                <button onClick={() => onNavigate('home')} className="hover:text-indigo-400 transition-colors">
                  {t.home}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="hover:text-indigo-400 transition-colors">
                  {t.blog}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-indigo-400 transition-colors">
                  {isAr ? 'من نحن' : 'About Us'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-indigo-400 transition-colors">
                  {isAr ? 'اتصل بنا' : 'Contact Us'}
                </button>
              </li>
            </ul>
          </div>

          {/* Core Categories */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold mb-4">
              {t.resources}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => onNavigate('blog', 'ai-engineering')} className="hover:text-indigo-400 transition-colors">
                  {currentLang === 'ar' ? 'هندسة الذكاء الاصطناعي' : 'AI Engineering'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog', 'web-development')} className="hover:text-indigo-400 transition-colors">
                  {currentLang === 'ar' ? 'تطوير الويب' : 'Web Development'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog', 'saas-supabase')} className="hover:text-indigo-400 transition-colors">
                  {currentLang === 'ar' ? 'برمجيات SaaS & Supabase' : 'SaaS & Supabase'}
                </button>
              </li>
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
