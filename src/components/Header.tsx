import React from 'react';
import { Language, User } from '../types/blog';
import { translations } from '../i18n/translations';
import { LayoutDashboard, Globe, Sparkles, LogOut, ShieldCheck, UserCircle } from 'lucide-react';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  currentView: string;
  onNavigate: (view: string, slug?: string) => void;
  currentUser?: User | null;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  currentView,
  onNavigate,
  currentUser,
  onSignOut,
}) => {
  const t = translations[currentLang];
  const isAr = currentLang === 'ar';

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:border-indigo-400 transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                AIWebCrafter
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-mono text-indigo-400/80 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded">
                v1.0
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('home')}
            className={`hover:text-indigo-400 transition-colors whitespace-nowrap ${
              currentView === 'home' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            {t.home}
          </button>
          
          <button
            onClick={() => onNavigate('blog')}
            className={`hover:text-indigo-400 transition-colors whitespace-nowrap ${
              currentView === 'blog' || currentView === 'article' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            {t.blog}
          </button>

          <button
            onClick={() => onNavigate('home', 'videos-section')}
            className="hover:text-indigo-400 transition-colors whitespace-nowrap"
          >
            {t.videos}
          </button>
        </nav>

        {/* Zone 3: Primary Actions (No login button for visitors) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => onLanguageChange(currentLang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.switchLang}</span>
          </button>

          {/* Admin Dashboard button - Only shown when logged in */}
          {currentUser && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-indigo-900/30 ${
                currentView === 'admin' ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950' : ''
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.adminDashboard}</span>
            </button>
          )}

          {/* User Profile & Sign Out button - Only shown when logged in */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div
                className="hidden lg:flex items-center gap-2 text-left bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg"
                title={`Logged in as ${currentUser.email}`}
              >
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name}
                    className="w-6 h-6 rounded-full object-cover border border-indigo-500/40"
                  />
                ) : (
                  <UserCircle className="w-6 h-6 text-indigo-400" />
                )}
                <div className="text-[11px] leading-tight">
                  <p className="font-semibold text-white truncate max-w-[100px]">
                    {currentUser.full_name || currentUser.email.split('@')[0]}
                  </p>
                  <span className="text-[9px] font-mono text-indigo-400 uppercase">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  title={t.signOut}
                  className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
