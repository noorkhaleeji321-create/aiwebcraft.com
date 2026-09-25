import React from 'react';
import { Language } from '../types/blog';
import { translations } from '../i18n/translations';
import { ShieldCheck, ArrowLeft, ArrowRight, Lock } from 'lucide-react';

interface PrivacyPageProps {
  currentLang: Language;
  onNavigate: (view: string, slug?: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ currentLang, onNavigate }) => {
  const isAr = currentLang === 'ar';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <button
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
      >
        {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
        <span>{isAr ? 'الرئيسية' : 'Back to Home'}</span>
      </button>

      <div className="border-b border-slate-800 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>{isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy & Data Protection Policy'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          {isAr ? 'سياسة الخصوصية لـ AIWebCrafter' : 'AIWebCrafter Privacy Policy'}
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Last Updated: {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-6">
        <section className="space-y-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-white">1. Introduction / مقدمة</h2>
          <p>
            {isAr
              ? 'تلتزم منصة AIWebCrafter بحماية خصوصيتك وبياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات عند زيارة موقعنا.'
              : 'At AIWebCrafter, we are committed to protecting your privacy. This policy details how we collect, use, and safeguard your personal information when visiting our platform.'}
          </p>
        </section>

        <section className="space-y-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-white">2. Cookies & Google AdSense / ملفات تعريف الارتباط والإعلانات</h2>
          <div className="space-y-4">
            <p>
              {isAr
                ? 'يستخدم موقعنا ملفات تعريف الارتباط (Cookies) لتحسين تجربة المستخدم وعرض الإعلانات المخصصة عبر Google AdSense.'
                : 'Our website uses cookies to enhance user experience and display personalized ads via Google AdSense.'}
            </p>
            <p>
              {isAr
                ? 'تستخدم Google بصفتها مورّدًا خارجيًا ملفات تعريف الارتباط لعرض الإعلانات على موقعنا. ويسمح استخدام Google لملف تعريف الارتباط DART بعرض الإعلانات للمستخدمين استنادًا إلى زيارتهم لموقعنا ومواقع أخرى على الإنترنت.'
                : 'Google, as a third-party vendor, uses cookies to serve ads on our site. Google\'s use of the DART cookie enables it to serve ads to users based on their visit to our site and other sites on the Internet.'}
            </p>
            <p>
              {isAr
                ? 'يمكن للمستخدمين اختيار عدم استخدام ملف تعريف الارتباط DART من خلال زيارة سياسة الخصوصية الخاصة بشبكة Google الإعلانية للمحتوى.'
                : 'Users may opt out of the use of the DART cookie by visiting the Google ad and content network privacy policy.'}
            </p>
          </div>
        </section>

        <section className="space-y-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-white">3. Google Analytics / التحليلات</h2>
          <p>
            {isAr
              ? 'نستخدم Google Analytics لتحليل حركة المرور وسلوك المستخدمين دون جمع معلومات تعريف شخصية حساسة.'
              : 'We utilize Google Analytics to understand website traffic patterns and improve our technical content without capturing sensitive personal identifiers.'}
          </p>
        </section>

        <section className="space-y-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-white">4. User Rights & Contact / حقوق المستخدم والتواصل</h2>
          <p>
            {isAr
              ? 'يحق لك طلب حذف تفضيلاتك أو الاستفسار عن بياناتك عبر التواصل معنا على contact@aiwebcrafter.dev.'
              : 'You retain the right to request deletion of saved preferences or inquire about stored data by contacting us at contact@aiwebcrafter.dev.'}
          </p>
        </section>
      </div>
    </div>
  );
};
