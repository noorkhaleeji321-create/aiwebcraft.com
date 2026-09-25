import React from 'react';
import { Language } from '../types/blog';
import { FileText, ArrowLeft, ArrowRight } from 'lucide-react';

interface TermsPageProps {
  currentLang: Language;
  onNavigate: (view: string, slug?: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ currentLang, onNavigate }) => {
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
          <FileText className="w-4 h-4" />
          <span>{isAr ? 'شروط الاستخدام والخدمة' : 'Terms of Service'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          {isAr ? 'شروط استخدام AIWebCrafter' : 'AIWebCrafter Terms of Service'}
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Effective Date: {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-6">
        <section className="space-y-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-white">1. Intellectual Property / الملكية الفكرية</h2>
          <p>
            {isAr
              ? 'جميع المقالات والشروحات والبرمجيات المنشورة على AIWebCrafter هي ملك للمنصة ومحمية بموجب حقوق النشر. يُسمح بمشاركة الروابط مع ذكر المصدر.'
              : 'All technical content, guides, and software code published on AIWebCrafter are protected by copyright. Sharing links with proper attribution is encouraged.'}
          </p>
        </section>

        <section className="space-y-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-white">2. Educational Disclaimer / إخلاء المسؤولية التعليمية</h2>
          <p>
            {isAr
              ? 'المحتوى المقدم على الموقع هو لأغراض تعليمية وإرشادية. لا نتحمل المسؤولية عن أي أضرار ناتجة عن استخدام الأكواد في بيئات الإنتاج دون مراجعة.'
              : 'The code snippets and tutorials are provided for educational purposes. Users are responsible for testing and auditing code prior to production deployment.'}
          </p>
        </section>
      </div>
    </div>
  );
};
