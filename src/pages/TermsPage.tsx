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
          <h2 className="text-lg font-bold text-white">1. Intellectual Property / حقوق الملكية الفكرية</h2>
          <p>
            {isAr
              ? 'جميع المقالات والدلائل الإرشادية والوصفات المنشورة على منصة AIWebCrafter هي ملكية فكرية للمنصة ومحمية بموجب قوانين النشر. يُمنح الزائر حق القراءة والاستفادة الشخصية، ويُحظر النسخ الإجمالي أو إعادة النشر التجاري بدون إذن رسمي مسبق ورابط صريح للمصدر.'
              : 'All health guides, traditional recipes, and educational articles published on AIWebCrafter are protected by copyright laws. Personal use is permitted, while automated scraping or commercial reproduction without attribution is prohibited.'}
          </p>
        </section>

        <section className="space-y-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-white">2. Health & Educational Disclaimer / إخلاء المسؤولية الصحية والغذائية</h2>
          <p>
            {isAr
              ? 'المحتوى المقدم عبر هذه المنصة (بما في ذلك الوصفات الطبيعية، المشروبات، والبرامج الرياضية) هو لأغراض تثقيفية وتوعوية وتراثية فقط. لا يُعتبر هذا المحتوى بديلاً عن الاستشارة الطبية المتخصصة، ولا يُغني عن مراجعة الطبيب أو أخصائي التغذية المعتمد، خاصة للمرضى أو الحوامل والمرضعات.'
              : 'Content provided on AIWebCrafter (including nutritional recipes, wellness advice, and fitness routines) is for informational and educational purposes only. It should not replace professional medical consultation, diagnosis, or treatment. Always consult a certified healthcare professional.'}
          </p>
        </section>

        <section className="space-y-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-white">3. Third-Party Links & Advertising / الإعلانات والروابط الخارجية</h2>
          <p>
            {isAr
              ? 'قد يحتوي موقعنا على روابط لمواقع خارجية أو إعلانات مدعومة من شركاء موثوقين مثل Google AdSense. لا نتحمل المسؤولية عن سياسات الخصوصية أو محتوى أي طرف ثالث، وننصح دائماً بمراجعة شروط وسياسات المواقع الخارجية.'
              : 'Our website may display third-party advertisements served by partners such as Google AdSense. We do not endorse or assume liability for third-party privacy practices or external site content.'}
          </p>
        </section>

        <section className="space-y-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-white">4. User Conduct / التزامات المستخدم</h2>
          <p>
            {isAr
              ? 'يلتزم المستخدم بعدم استخدام الموقع بأي طريقة قد تضر بالبنية التقنية أو تنتهك حقوق الآخرين، كما يلتزم بالتفاعل المحترم والامتناع عن نشر أي محتوى مسيء أو ضار في نماذج التواصل والتعليقات.'
              : 'Users agree to use the platform lawfully without attempting to disrupt site infrastructure, spam forms, or transmit harmful content.'}
          </p>
        </section>
      </div>
    </div>
  );
};
