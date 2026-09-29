import React, { useState, useEffect } from 'react';
import { Language, User } from '../types/blog';
import { translations } from '../i18n/translations';
import { BrandLogo } from './BrandLogo';
import { 
  LayoutDashboard, 
  Globe, 
  Sparkles, 
  LogOut, 
  ShieldCheck, 
  UserCircle,
  Menu,
  X,
  Home,
  BookOpen,
  Video,
  Layers,
  ChevronRight,
  Compass
} from 'lucide-react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on view change or escape
  const handleMobileNavigate = (view: string, slug?: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(view, slug);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-slate-800/80 transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 h-16 flex items-center justify-between">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleMobileNavigate('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1"
            >
              <BrandLogo className="w-9 h-9" size={36} />
              <div className="flex flex-col text-left rtl:text-right">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white group-hover:text-indigo-300 transition-colors leading-none">
                  AIWebCrafter
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block mt-0.5">
                  {isAr ? 'منصة التغذية ونحت القوام والوصفات الطبيعية' : 'Natural Fitness & Wellness Platform'}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Desktop Navigation Links (md:flex) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium text-slate-300 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
            <button
              onClick={() => onNavigate('home')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'home'
                  ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                  : 'hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{t.home}</span>
            </button>
            
            <button
              onClick={() => onNavigate('blog')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'blog' || currentView === 'article'
                  ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                  : 'hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t.blog}</span>
            </button>

            <button
              onClick={() => onNavigate('videos')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'videos'
                  ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                  : 'hover:text-white hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <Video className="w-4 h-4 text-rose-500" />
              <span>{t.videos}</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions (Language, Auth, Mobile Hamburger) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => onLanguageChange(currentLang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors whitespace-nowrap"
              title={isAr ? 'تغيير اللغة إلى الإنجليزية' : 'Switch to Arabic'}
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

            {/* Mobile Hamburger Menu Button (Visible on mobile screens) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all active:scale-95"
              aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-indigo-400" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-950/95 border-b border-slate-800/90 backdrop-blur-xl px-4 py-5 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              {isAr ? 'القائمة الرئيسية والتنقل' : 'Main Menu & Navigation'}
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {/* Home Link */}
              <button
                onClick={() => handleMobileNavigate('home')}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  currentView === 'home'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Home className="w-4 h-4" />
                  </div>
                  <div className="text-left rtl:text-right">
                    <div className="text-sm">{t.home}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {isAr ? 'الصفحة الرئيسية واستكشاف المنصة' : 'Homepage & Featured Guides'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 rtl:rotate-180" />
              </button>

              {/* Blog / Articles Link */}
              <button
                onClick={() => handleMobileNavigate('blog')}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  currentView === 'blog' || currentView === 'article'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-left rtl:text-right">
                    <div className="text-sm">{t.blog}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {isAr ? 'تصفح جميع المقالات والدلائل الحصرية' : 'Explore All Guides & Articles'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 rtl:rotate-180" />
              </button>

              {/* Videos Link */}
              <button
                onClick={() => handleMobileNavigate('videos')}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  currentView === 'videos'
                    ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="text-left rtl:text-right">
                    <div className="text-sm">{t.videos}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {isAr ? 'شروحات وفيديوهات عملية' : 'Video Tutorials & Guides'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 rtl:rotate-180" />
              </button>
            </div>

            {/* If Logged in on mobile */}
            {currentUser && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <button
                  onClick={() => handleMobileNavigate('admin')}
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-900/30"
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t.adminDashboard}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-black/30 rounded">
                    {currentUser.role}
                  </span>
                </button>

                {onSignOut && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onSignOut();
                    }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t.signOut}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </header>

    </>
  );
};
