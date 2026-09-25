import React, { useState, useEffect } from 'react';
import { Language, User } from './types/blog';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SeoHead } from './components/SeoHead';
import { CookieConsent } from './components/CookieConsent';
import { AuthGate } from './components/AuthGate';
const HomePage = React.lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const BlogPage = React.lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const ArticlePage = React.lazy(() => import('./pages/ArticlePage').then((m) => ({ default: m.ArticlePage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = React.lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const AboutPage = React.lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = React.lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
import { checkSupabaseConnection } from './lib/supabase';
import { authService } from './services/auth';
import { initGA, trackPageView } from './services/analytics';
import { storeService } from './services/store';
import { decryptVaultData } from './lib/cipher';
import { ShieldCheck } from 'lucide-react';

const SuperAdminPage = React.lazy(() => import('./pages/SuperAdminPage').then((m) => ({ default: m.SuperAdminPage })));

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('ar');
  const [currentView, setCurrentView] = useState<'home' | 'blog' | 'article' | 'admin' | 'privacy' | 'terms' | 'about' | 'contact' | 'super-admin'>('home');
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [blogQueryFilter, setBlogQueryFilter] = useState<string>('');
  const [scrollTarget, setScrollTarget] = useState<string>('');
  
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getUser());

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Initialize GA4
  useEffect(() => {
    initGA();
  }, []);

  // Sync RTL / LTR document direction when language toggles
  useEffect(() => {
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  // Check Supabase status on mount & load settings
  useEffect(() => {
    checkSupabaseConnection().then(async (res) => {
      setIsSupabaseConnected(res.success);
      if (res.success) {
        try {
          const settings = await storeService.fetchSiteSettings();
          if (settings) {
            localStorage.setItem('aiwebcrafter_gsc_verification', settings.gsc_verification_tag || '');
            localStorage.setItem('aiwebcrafter_adsense_pub_id', settings.adsense_publisher_id || '');
            localStorage.setItem('aiwebcrafter_ga_id', settings.ga_measurement_id || '');
            localStorage.setItem('aiwebcrafter_gsc_connected', settings.gsc_connected ? 'true' : 'false');
            localStorage.setItem('aiwebcrafter_gsc_report_data', JSON.stringify(settings.gsc_report_data || {}));
            
            // Decrypt and load all system keys into runtime
            if (settings.encrypted_vault) {
              const decryptedVault = decryptVaultData(settings.encrypted_vault);
              if (decryptedVault) {
                localStorage.setItem('aiwebcrafter_super_settings', JSON.stringify(decryptedVault));
              }
            }
            
            // Initialize GA with the synchronized configuration
            initGA();
          }
        } catch (e) {
          console.error('Failed to sync settings from Supabase:', e);
        }
      }
    });
  }, []);

  const handleNavigate = (view: string, slugOrFilter?: string) => {
    setScrollTarget('');
    if (view === 'article' && slugOrFilter) {
      setSelectedSlug(slugOrFilter);
      setCurrentView('article');
      trackPageView(`/article/${slugOrFilter}`, `Article: ${slugOrFilter}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'blog') {
      setBlogQueryFilter(slugOrFilter || '');
      setCurrentView('blog');
      trackPageView('/blog', 'Blog Index');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'admin') {
      setCurrentView('admin');
      trackPageView('/admin', 'Admin Dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'privacy') {
      setCurrentView('privacy');
      trackPageView('/privacy', 'Privacy Policy');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'terms') {
      setCurrentView('terms');
      trackPageView('/terms', 'Terms of Service');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'about') {
      setCurrentView('about');
      trackPageView('/about', 'About Us');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'contact') {
      setCurrentView('contact');
      trackPageView('/contact', 'Contact Us');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'super-admin') {
      setCurrentView('super-admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentView('home');
      trackPageView('/', 'AIWebCrafter Home');
      if (slugOrFilter && (slugOrFilter === 'videos-section' || slugOrFilter === 'categories-section')) {
        setScrollTarget(slugOrFilter);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
  };

  return (
    <div className={`min-h-screen bg-black text-slate-100 flex flex-col font-sans ${currentLang === 'ar' ? 'font-arabic' : 'font-sans'}`}>
      
      {/* Global SEO Meta Head Injector */}
      <SeoHead currentLang={currentLang} />

      {/* Supabase Auth Gate - Only shown when trying to access admin view without login */}
      {currentView === 'admin' && !currentUser && (
        <AuthGate
          currentLang={currentLang}
          onLanguageChange={setCurrentLang}
          onSuccess={() => {
            const user = authService.getUser();
            setCurrentUser(user);
            if (user?.email === 'superadmin@aiwebcrafter.dev') {
              setCurrentView('super-admin');
            }
          }}
        />
      )}

      {/* Main Header Bar */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        currentView={currentView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* View Router */}
      <main className="flex-1">
        <React.Suspense fallback={
          <div className="flex items-center justify-center min-h-[50vh] bg-slate-950">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        }>
          {currentView === 'home' && (
            <HomePage
              currentLang={currentLang}
              onNavigate={handleNavigate}
              scrollTarget={scrollTarget}
            />
          )}

          {currentView === 'blog' && (
            <BlogPage
              currentLang={currentLang}
              onNavigate={handleNavigate}
              initialQuery={blogQueryFilter}
            />
          )}

          {currentView === 'article' && selectedSlug && (
            <ArticlePage
              slug={selectedSlug}
              currentLang={currentLang}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'admin' && currentUser && (
            <AdminPage
              currentLang={currentLang}
              onNavigate={handleNavigate}
              isSupabaseConnected={isSupabaseConnected}
            />
          )}

          {currentView === 'admin' && !currentUser && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
               <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-4">
                 <ShieldCheck className="w-8 h-8 text-indigo-500" />
               </div>
               <h2 className="text-2xl font-bold text-white mb-2">
                 {currentLang === 'ar' ? 'منطقة مقيدة' : 'Restricted Access'}
               </h2>
               <p className="text-slate-400 max-w-md mb-6">
                 {currentLang === 'ar' 
                   ? 'لوحة التحكم متاحة فقط للأعضاء المسجلين. يرجى تسجيل الدخول للوصول إلى أدوات الإدارة.'
                   : 'The dashboard is only available for registered members. Please sign in to access management tools.'}
               </p>
               <button
                 onClick={() => { /* AuthGate is already visible via state logic above */ }}
                 className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
               >
                 {currentLang === 'ar' ? 'تسجيل الدخول الآن' : 'Sign In Now'}
               </button>
            </div>
          )}

          {currentView === 'privacy' && (
            <PrivacyPage
              currentLang={currentLang}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'terms' && (
            <TermsPage
              currentLang={currentLang}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'about' && (
            <AboutPage
              currentLang={currentLang}
            />
          )}

          {currentView === 'contact' && (
            <ContactPage
              currentLang={currentLang}
            />
          )}

          {currentView === 'super-admin' && (
            <SuperAdminPage />
          )}
        </React.Suspense>
      </main>

      {/* Footer */}
      <Footer currentLang={currentLang} onNavigate={handleNavigate} />

      {/* Cookie Consent Banner */}
      <CookieConsent currentLang={currentLang} />

    </div>
  );
}
