import React from 'react';
import { Language } from '../types/blog';
import { translations } from '../i18n/translations';
import { Users, Target, Rocket, ShieldCheck } from 'lucide-react';

interface AboutPageProps {
  currentLang: Language;
}

export const AboutPage: React.FC<AboutPageProps> = ({ currentLang }) => {
  const isAr = currentLang === 'ar';
  const t = translations[currentLang];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
          {isAr ? 'من نحن' : 'About AIWebCrafter'}
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {isAr 
            ? 'منصة تعليمية رائدة تهدف إلى تمكين المطورين والمبتكرين في مجالات الذكاء الاصطناعي وتطوير الويب الحديث.'
            : 'A leading educational platform dedicated to empowering developers and innovators in AI and modern web development.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-colors">
          <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">{isAr ? 'مهمتنا' : 'Our Mission'}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isAr
              ? 'تبسيط المفاهيم المعقدة في الذكاء الاصطناعي وتوفير دروس عملية تساعدك على بناء مشاريع حقيقية.'
              : 'Simplifying complex AI concepts and providing practical tutorials to help you build real-world projects.'}
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-colors">
          <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
            <Rocket className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">{isAr ? 'رؤيتنا' : 'Our Vision'}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isAr
              ? 'أن نصبح المصدر الأول والموثوق للمحتوى التقني ثنائي اللغة الذي يجمع بين الابتكار والاحترافية.'
              : 'To become the primary trusted source for bilingual technical content that combines innovation with professionalism.'}
          </p>
        </div>
      </div>

      <div className="prose prose-invert max-w-none pt-8 border-t border-slate-800">
        <h2 className="text-2xl font-bold text-white mb-6">{isAr ? 'لماذا تختارنا؟' : 'Why Choose Us?'}</h2>
        <div className="grid grid-cols-1 gap-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">{isAr ? 'محتوى موثوق' : 'Verified Content'}</h3>
              <p className="text-slate-400 text-sm">{isAr ? 'جميع الدروس والمقالات يتم مراجعتها من قِبل خبراء في المجال.' : 'All tutorials and articles are reviewed by industry experts.'}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-1 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">{isAr ? 'دعم ثنائي اللغة' : 'Bilingual Support'}</h3>
              <p className="text-slate-400 text-sm">{isAr ? 'نقدم المحتوى باللغتين العربية والإنجليزية لضمان وصول المعرفة للجميع.' : 'We provide content in both Arabic and English to ensure knowledge reaches everyone.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
