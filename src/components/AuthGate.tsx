import React, { useState } from 'react';
import { Language } from '../types/blog';
import { authService } from '../services/auth';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Database,
  Globe,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  UserCheck
} from 'lucide-react';

interface AuthGateProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onSuccess: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  currentLang,
  onLanguageChange,
  onSuccess,
}) => {
  const isAr = currentLang === 'ar';

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'author' | 'admin'>('admin');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await authService.signInWithPassword(email, password);
        if (res.success) {
          setSuccessMessage(isAr ? 'تم تسجيل الدخول بنجاح! جاري التوجيه...' : 'Logged in successfully! Redirecting...');
          setTimeout(() => {
            onSuccess();
          }, 600);
        } else {
          setErrorMessage(res.error || (isAr ? 'فشل تسجيل الدخول. يرجى التأكد من البريد وكلمة المرور.' : 'Login failed. Please check your credentials.'));
        }
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMessage(isAr ? 'يرجى كتابة الاسم الكامل' : 'Please enter your full name');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const res = await authService.signUp(email, password, fullName, role);
        if (res.success) {
          setSuccessMessage(
            res.message || (isAr ? 'تم إنشاء الحساب بنجاح! جاري الدخول للمنصة...' : 'Account registered successfully! Entering platform...')
          );
          setTimeout(() => {
            onSuccess();
          }, 800);
        } else {
          setErrorMessage(res.error || (isAr ? 'تعذر إنشاء الحساب' : 'Registration failed'));
        }
      } else if (mode === 'forgot') {
        const res = await authService.resetPassword(email);
        if (res.success) {
          setSuccessMessage(isAr ? 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.' : 'Password reset link sent to your email.');
        } else {
          setErrorMessage(res.error || (isAr ? 'فشل إرسال رابط الاستعادة' : 'Failed to send reset link'));
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || (isAr ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 flex items-center justify-center p-4">
      {/* Background Decorative Lighting Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
        <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Auth Card Container */}
      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
        
        {/* Top Header: Brand + Language Toggle */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>AIWebCrafter</span>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950 border border-indigo-800 px-1.5 py-0.5 rounded">
                  Auth
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {isAr ? 'منصة هندسة الذكاء الاصطناعي وتطوير الويب' : 'AI & Web Engineering Hub'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onLanguageChange(currentLang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>
        </div>

        {/* Title & Mode Description */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-white">
            {mode === 'signin' && (isAr ? 'تسجيل الدخول إلى المنصة' : 'Sign in to your account')}
            {mode === 'signup' && (isAr ? 'إنشاء حساب جديد' : 'Create your account')}
            {mode === 'forgot' && (isAr ? 'استعادة كلمة المرور' : 'Reset your password')}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'signin' && (isAr ? 'قم بتسجيل الدخول للوصول إلى لوحة التحكم وإدارة المحتوى' : 'Please sign in to access the dashboard and manage content')}
            {mode === 'signup' && (isAr ? 'أنشئ حسابك للبدء في كتابة وتوليد المقالات الاحترافية' : 'Register to start writing and generating professional articles')}
            {mode === 'forgot' && (isAr ? 'أدخل بريدك الإلكتروني لاستلام رابط الاستعادة' : 'Enter your email to receive a recovery link')}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs space-y-2 animate-shake">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {isAr ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <div className="relative">
                <User className={`w-4 h-4 text-slate-500 absolute top-2.5 ${isAr ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: طارق شراك' : 'e.g. Tarik Cherak'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-lg py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors ${
                    isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              {isAr ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className={`w-4 h-4 text-slate-500 absolute top-2.5 ${isAr ? 'right-3' : 'left-3'}`} />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-slate-950 border border-slate-800 rounded-lg py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono ${
                  isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className={`w-4 h-4 text-slate-500 absolute top-2.5 ${isAr ? 'right-3' : 'left-3'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-lg py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono ${
                    isAr ? 'pr-9 pl-9' : 'pl-9 pr-9'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-2.5 text-slate-500 hover:text-slate-300 ${isAr ? 'left-3' : 'right-3'}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {isAr ? 'نوع الحساب والصلاحية' : 'Account Role'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('author')}
                  className={`p-2 rounded-lg border text-center font-medium transition-all ${
                    role === 'author'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'كاتب ومحرر' : 'Author / Member'}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-2 rounded-lg border text-center font-medium transition-all ${
                    role === 'admin'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'مدير كامل الصلاحيات' : 'Full Administrator'}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'signin' && (isAr ? 'تسجيل الدخول والبدء' : 'Sign In to AIWebCrafter')}
                  {mode === 'signup' && (isAr ? 'إنشاء الحساب والدخول' : 'Create Account & Enter')}
                  {mode === 'forgot' && (isAr ? 'إرسال رابط الاستعادة' : 'Send Reset Link')}
                </span>
                <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="pt-2 text-center text-xs text-slate-400">
          {mode === 'signin' ? (
            <p>
              {isAr ? 'ليس لديك حساب بعد؟' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-indigo-400 hover:text-indigo-300 font-bold ml-1 hover:underline"
              >
                {isAr ? 'إنشاء حساب جديد' : 'Sign Up now'}
              </button>
            </p>
          ) : (
            <p>
              {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-indigo-400 hover:text-indigo-300 font-bold ml-1 hover:underline"
              >
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
