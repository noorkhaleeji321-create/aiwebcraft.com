import React, { useState, useEffect } from 'react';
import { Language } from '../types/blog';
import { Shield, X } from 'lucide-react';

interface CookieConsentProps {
  currentLang: Language;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ currentLang }) => {
  const [isVisible, setIsVisible] = useState(false);
  const isAr = currentLang === 'ar';

  useEffect(() => {
    const consent = localStorage.getItem('aiwebcrafter_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('aiwebcrafter_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-8 duration-500">
      <div className="max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0 w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400">
          <Shield className="w-6 h-6" />
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-1">
          <h3 className="text-sm font-bold text-white">
            {isAr ? 'نحن نحترم خصوصيتك' : 'We respect your privacy'}
          </h3>
          <p className="text-[12px] text-slate-400 leading-relaxed">
            {isAr 
              ? 'نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربتك وتقديم إعلانات مخصصة. من خلال الاستمرار في استخدام موقعنا، فإنك توافق على سياسة ملفات تعريف الارتباط الخاصة بنا.'
              : 'We use cookies to improve your experience and provide personalized ads. By continuing to use our site, you agree to our cookie policy.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap"
          >
            {isAr ? 'أوافق' : 'I Accept'}
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="p-2.5 text-slate-500 hover:text-white transition-colors"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
