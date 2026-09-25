import React, { useState } from 'react';
import { Language } from '../types/blog';
import { translations } from '../i18n/translations';
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';

interface ContactPageProps {
  currentLang: Language;
}

export const ContactPage: React.FC<ContactPageProps> = ({ currentLang }) => {
  const isAr = currentLang === 'ar';
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // In a real app, this would send to an API
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
          {isAr ? 'اتصل بنا' : 'Contact Us'}
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {isAr 
            ? 'هل لديك استفسار أو اقتراح؟ نحن هنا لمساعدتك. تواصل معنا وسنرد عليك في أقرب وقت.'
            : 'Have a question or suggestion? We\'re here to help. Get in touch and we\'ll get back to you soon.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">{isAr ? 'البريد الإلكتروني' : 'Email Us'}</p>
              <p className="text-sm font-bold text-white truncate">support@aiwebcrafter.com</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center text-indigo-400 flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">{isAr ? 'الدعم الفني' : 'Technical Support'}</p>
              <p className="text-sm font-bold text-white truncate">24/7 Response Time</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          {submitted ? (
            <div className="bg-emerald-950/20 border border-emerald-800/50 p-12 rounded-3xl text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">{isAr ? 'تم الإرسال بنجاح!' : 'Message Sent!'}</h2>
              <p className="text-slate-400 text-sm">
                {isAr 
                  ? 'شكراً لتواصلك معنا. سنقوم بالرد عليك عبر البريد الإلكتروني في غضون 24 ساعة.'
                  : 'Thank you for reaching out. We will respond to your email within 24 hours.'}
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
              >
                {isAr ? 'إرسال رسالة أخرى' : 'Send another message'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Tarik Cherak"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <input 
                    required 
                    type="email" 
                    placeholder="name@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{isAr ? 'الموضوع' : 'Subject'}</label>
                <input 
                  required 
                  type="text" 
                  placeholder={isAr ? 'كيف يمكننا مساعدتك؟' : 'How can we help?'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{isAr ? 'الرسالة' : 'Message'}</label>
                <textarea 
                  required 
                  rows={4}
                  placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{isAr ? 'إرسال الرسالة' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
