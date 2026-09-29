import React from 'react';
import { Language } from '../types/blog';
import { Sparkles, Apple, Dumbbell, ShieldCheck, HeartHandshake, Leaf } from 'lucide-react';

interface AboutPageProps {
  currentLang: Language;
}

export const AboutPage: React.FC<AboutPageProps> = ({ currentLang }) => {
  const isAr = currentLang === 'ar';

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-14">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAr ? 'المرجع الأول لصحة ورشاقة المرأة ونحت القوام' : "Women's Wellness & Natural Curve Shaping"}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {isAr ? 'من نحن — ريادة العناية والتغذية الطبيعية' : 'About AIWebCrafter Wellness'}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
          {isAr 
            ? 'منصة متخصصة وموثوقة تُعنى برعاية صحة وجمال ورشاقة المرأة، من خلال تقديم برامج غذائية مدروسة لزيادة الوزن بطرق صحية، الوصفات والخلطات الصحراوية التراثية الأصيلة، والتمارين البيوميكانيكية لنحت القوام وإبراز المعالم الأنثوية بأمان تام وبدون أي مواد كيميائية.'
            : 'A specialized, trusted authority dedicated to female wellness, healthy weight gain, authentic Sahrawi natural recipes, and biomechanical exercise programs designed for natural curve shaping and lasting confidence.'}
        </p>
      </div>

      {/* Mission & Vision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-4">
        <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl space-y-4 hover:border-rose-500/40 transition-colors shadow-xl">
          <div className="w-12 h-12 bg-rose-600/20 rounded-xl flex items-center justify-center text-rose-400">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isAr ? 'مهمتنا ورسالتنا' : 'Our Core Mission'}
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            {isAr
              ? 'مساعدة كل امرأة على تحقيق هدفها في القوام المتناسق والوزن المثالي عبر حلول طبيعية مستدامة؛ تجمع بين غنى الموروث الصحراوي التقليدي وأحدث معايير التغذية الرياضية والعلاجية، بعيداً عن المنتجات التجارية المغشوشة أو المواد الضارة.'
              : 'Empowering women to achieve natural curves, healthy fullness, and proportional body recomposition through proven herbal heritage and evidence-based sports nutrition, completely free of harmful pharmaceuticals.'}
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl space-y-4 hover:border-emerald-500/40 transition-colors shadow-xl">
          <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center text-emerald-400">
            <Leaf className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isAr ? 'رؤيتنا' : 'Our Vision'}
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            {isAr
              ? 'أن نكون الوجهة الرقمية الأكثر أماناً وموثوقية في الوطن العربي للمرأة الباحثة عن الجمال الطبيعي، زيادة الوزن الصحية، والتناسق البيوميكانيكي للقوام مع التثقيف الغذائي الواعي.'
              : 'To be the most trusted authority for women seeking natural beauty, safe weight management, authentic Sahrawi blends, and healthy curve development.'}
          </p>
        </div>
      </div>

      {/* Pillars / Why Choose Us */}
      <div className="pt-8 border-t border-slate-800 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {isAr ? 'ركائز المنصة ومميزاتنا' : 'Our Guiding Principles'}
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            {isAr ? 'نلتزم بأعلى معايير الصدق والأمان العلمي والتغذوي في كل ما نقدمه' : 'Committed to scientific honesty, natural ingredients, and real results.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">
              {isAr ? 'وصفات صحراوية أصيلة' : 'Authentic Sahrawi Heritage'}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              {isAr
                ? 'خلطات طبيعية موروثة (اللحسة، حب العزيز، السمسم، الصويا، والمكسرات المركزة) معدة بنسب دقيقة لامتلاء متناسق وطبيعي.'
                : 'Traditional proven blends with tiger nuts, sesame, natural seeds, and healthy calorie density for natural female curves.'}
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">
              {isAr ? 'تمارين بيوميكانيكية لنحت القوام' : 'Targeted Biomechanics'}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              {isAr
                ? 'تمارين منزلية ونادٍ مصممة لاستهداف وتكبير عضلات الأرداف والفخذين ونحت الخصر بدون مضاعفة دهون البطن.'
                : 'Targeted hypertrophy exercises focusing on glutes and hips, keeping the waistline defined and toned.'}
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">
              {isAr ? 'أمان تام وخالٍ من الأدوية' : '100% Safe & Natural'}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              {isAr
                ? 'محاربة الحبوب الكيميائية والمواد الضارة والتحذير من مغشوشات الأسواق لضمان صحتك وسلامتك أولاً وقبل كل شيء.'
                : 'Strict zero-tolerance policy against dangerous pharmaceuticals, emphasizing clean health and sustainable progress.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
