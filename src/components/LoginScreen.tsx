import React, { useState } from 'react';
import { Lock, Shield, Database, Key, Eye, EyeOff, Globe, Server, CheckCircle2 } from 'lucide-react';
import { Language, TRANSLATIONS } from '../locales/translations';
import { adminLogin } from '../services/gitStorageClient';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  lang: Language;
  onToggleLang: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  lang,
  onToggleLang
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const t = TRANSLATIONS[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(lang === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' : 'Please enter email and password.');
      return;
    }
    setError(null);
    setIsAuthenticating(true);

    try {
      const result = await adminLogin(email.trim(), password);
      if (result.success) {
        setIsAuthenticating(false);
        onLoginSuccess();
      } else {
        setIsAuthenticating(false);
        setError(
          result.error ||
            (lang === 'ar'
              ? 'خطأ في المصادقة: البريد الإلكتروني أو مفتاح الأمان غير صحيح.'
              : 'Authentication failed: Invalid administrator email or master key.')
        );
      }
    } catch (err: any) {
      setIsAuthenticating(false);
      setError(err.message || 'Authentication error');
    }
  };

  const handleQuickFill = () => {
    // Quick fill functionality disabled for security
  };

  return (
    <div className="min-h-screen bg-[#080B12] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-purple-900/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar on Login Page */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-purple-900/30">
            <Database className="w-4 h-4 text-purple-100" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            AIWebCrafter<span className="text-purple-400">.com</span>
          </span>
        </div>

        <button
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-900/70 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-purple-400" />
          <span>{t.languageToggle}</span>
        </button>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-md">
          {/* Private Notice Banner */}
          <div className="mb-6 p-4 rounded-xl bg-slate-900/80 border border-purple-500/30 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-1">
              <Shield className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{t.login.badge}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.login.description}
            </p>
          </div>

          {/* Login Form Box */}
          <div className="bg-[#0B0F19] rounded-2xl border border-slate-800 shadow-2xl p-7">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                {t.login.title}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {t.login.subtitle}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.login.emailLabel}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="owner@aiwebcrafter.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.login.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 font-mono"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 text-purple-600 focus:ring-0 bg-slate-900"
                  />
                  <span>{t.login.rememberMe}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs rounded-lg transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <span>Authenticating Web Crypto Token...</span>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>{t.login.submitButton}</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Fill for evaluation */}
            <div className="mt-5 pt-4 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 mb-2 font-mono">
                {t.login.demoCredentialsNotice}
              </p>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium underline underline-offset-4 cursor-pointer"
              >
                {t.login.quickFill}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Security Footer Notice */}
      <footer className="py-4 px-6 border-t border-slate-800/60 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-purple-400" />
          <span>Private Dedicated Node · Permanent Zero-Cost Storage Architecture</span>
        </div>
        <div>
          {t.login.securityBadge}
        </div>
      </footer>
    </div>
  );
};
