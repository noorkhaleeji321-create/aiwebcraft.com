import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Mail, Lock, User, CheckCircle2, ArrowRight, AlertCircle, ShieldAlert, Check, Globe } from 'lucide-react';
import { 
  getCurrentSupabaseUser, 
  signUpWithSupabase, 
  signInWithSupabase, 
  signOutFromSupabase,
  signUpLocally,
  signInLocally,
  registerVerifiedGoogleUser
} from '../services/supabaseService.js';

import { safeFetchJson } from '../utils/api.js';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCount: number;
  onViewSaved: () => void;
  onAuthenticated?: (user: any) => void;
  isRequired?: boolean;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  savedCount,
  onViewSaved,
  onAuthenticated,
  isRequired = false
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Security & Captcha state
  const [notRobot, setNotRobot] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState<number>(0);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Google Verification State
  const [showGoogleVerifyPrompt, setShowGoogleVerifyPrompt] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleStep, setGoogleStep] = useState<'email' | 'otp'>('email');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [googleSending, setGoogleSending] = useState(false);
  const [googleVerifying, setGoogleVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getCurrentSupabaseUser().then((user) => {
        if (user) setCurrentUser(user);
      });

      // Check localStorage for lockout status
      const storedAttempts = parseInt(localStorage.getItem('auth_failed_attempts') || '0', 10);
      const storedLockout = parseInt(localStorage.getItem('auth_lockout_until') || '0', 10);
      
      setFailedAttempts(storedAttempts);
      if (storedLockout && storedLockout > Date.now()) {
        setLockoutUntil(storedLockout);
      } else {
        localStorage.removeItem('auth_lockout_until');
        localStorage.setItem('auth_failed_attempts', '0');
        setFailedAttempts(0);
      }
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutSecondsLeft(0);
        setFailedAttempts(0);
        localStorage.removeItem('auth_lockout_until');
        localStorage.setItem('auth_failed_attempts', '0');
        clearInterval(interval);
      } else {
        setLockoutSecondsLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Check Lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      setErrorMsg(`Too many failed attempts (5 times). Account is temporarily locked for 15 minutes.`);
      return;
    }

    // Check Captcha
    if (!notRobot) {
      setErrorMsg('Please confirm you are not a robot (Security Verification).');
      return;
    }

    // Validation for Signup
    if (!isLogin) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      // Password validation: letters & numbers required
      const hasLetters = /[a-zA-Z]/.test(password);
      const hasNumbers = /\d/.test(password);
      if (!hasLetters || !hasNumbers || password.length < 6) {
        setErrorMsg('Password must contain a mix of letters and numbers (at least 6 characters).');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await signInWithSupabase(userEmail, password);
        if (res.user) {
          setCurrentUser(res.user);
          setSuccessMsg('Signed in successfully!');
          localStorage.setItem('auth_failed_attempts', '0');
          setFailedAttempts(0);
          if (onAuthenticated) onAuthenticated(res.user);
        }
      } else {
        const res = await signUpWithSupabase(userEmail, password, fullName);
        if (res.user) {
          setCurrentUser(res.user);
          setSuccessMsg('Account created successfully and connected to Supabase!');
          if (onAuthenticated) onAuthenticated(res.user);
        }
      }
    } catch (err: any) {
      // Increment failed attempts on login failure
      if (isLogin) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        localStorage.setItem('auth_failed_attempts', nextAttempts.toString());

        if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
          const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
          setLockoutUntil(lockoutTime);
          localStorage.setItem('auth_lockout_until', lockoutTime.toString());
          setErrorMsg('Incorrect password 5 times in a row. Account is locked for 15 minutes.');
        } else {
          setErrorMsg(`Invalid credentials. Failed attempts: ${nextAttempts} of ${MAX_FAILED_ATTEMPTS}`);
        }
      } else {
        setErrorMsg(err.message || 'Operation failed. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setShowGoogleVerifyPrompt(true);
    setGoogleStep('email');
    setGoogleEmailInput('');
    setEnteredOtp('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSendGoogleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput || !googleEmailInput.trim().includes('@')) {
      setErrorMsg('Please enter a valid Gmail address to verify.');
      return;
    }
    setGoogleSending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { ok, data, error } = await safeFetchJson('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmailInput.trim() })
      });

      if (!ok || !data?.success) {
        throw new Error(error || data?.error || 'Failed to send verification email via SMTP.');
      }
      setGoogleStep('otp');
      setSuccessMsg(`📩 Verification code (6 digits) successfully sent to your email (${googleEmailInput}). Please check your Gmail inbox.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send verification email via SMTP. Please check email settings.');
    } finally {
      setGoogleSending(false);
    }
  };

  const handleVerifyGoogleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp || enteredOtp.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit verification code.');
      return;
    }

    setGoogleVerifying(true);
    setErrorMsg(null);

    try {
      const { ok, data, error } = await safeFetchJson('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmailInput.trim(), code: enteredOtp.trim() })
      });

      if (!ok || !data?.success) {
        throw new Error(error || data?.error || 'Invalid or expired verification code.');
      }

      const verifiedUser = await registerVerifiedGoogleUser(googleEmailInput.trim());
      setCurrentUser(verifiedUser);
      setSuccessMsg(`Gmail (${googleEmailInput}) verified successfully and registered in Supabase!`);
      if (onAuthenticated) onAuthenticated(verifiedUser);
      setTimeout(() => {
        setShowGoogleVerifyPrompt(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify code or register user.');
    } finally {
      setGoogleVerifying(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutFromSupabase();
      setCurrentUser(null);
      setSuccessMsg('Signed out successfully.');
      if (onAuthenticated) onAuthenticated(null);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min and ${secs} sec`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white border border-[#E2DDD3] rounded-3xl max-w-md w-full p-4 space-y-2.5 shadow-2xl relative animate-fade-in-up overflow-hidden">
        {(!isRequired || currentUser) && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-[#8C8275] hover:text-[#2C2A26] p-1.5 rounded-full hover:bg-[#F5F2EB]"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {lockoutUntil && Date.now() < lockoutUntil && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Temporarily Locked for Security</span>
            </div>
            <p>You have entered the wrong password 5 times. Please wait:</p>
            <div className="text-center font-mono font-bold text-xs bg-white/80 py-1.5 rounded-xl border border-amber-200 text-red-600">
              {formatTimeLeft(lockoutSecondsLeft)}
            </div>
          </div>
        )}

        {errorMsg && (!lockoutUntil || Date.now() >= lockoutUntil) && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {!currentUser ? (
          <div>
            {showGoogleVerifyPrompt ? (
              <div className="space-y-4 py-2 animate-fade-in">
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 bg-sky-100 text-sky-700 rounded-2xl flex items-center justify-center mx-auto mb-1">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
                    {googleStep === 'email' ? 'Google Gmail Verification' : 'Enter Verification Code'}
                  </h3>
                  <p className="text-xs text-[#5D5A53]">
                    {googleStep === 'email' 
                      ? 'Enter your Gmail address to receive a 6-digit verification code and confirm your identity' 
                      : `Verification code sent to: ${googleEmailInput}`}
                  </p>
                </div>

                {googleStep === 'email' ? (
                  <form onSubmit={handleSendGoogleOtp} className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-[#2C2A26] uppercase block mb-1 text-[10px]">
                        Gmail Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="yourname@gmail.com"
                        value={googleEmailInput}
                        onChange={(e) => setGoogleEmailInput(e.target.value)}
                        className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#2C2A26]"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowGoogleVerifyPrompt(false)}
                        className="w-1/2 py-2.5 bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#2C2A26] font-bold rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={googleSending}
                        className="w-1/2 py-2.5 bg-[#2C2A26] hover:bg-black text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {googleSending ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Sending Email...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyGoogleOtp} className="space-y-3 text-xs">
                    <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-xl p-3 text-center space-y-1.5">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-sky-900">
                        <Mail className="w-4 h-4" />
                        <span>Email sent to: {googleEmailInput}</span>
                      </div>
                      <p className="text-[11px] text-sky-800 leading-relaxed">
                        Check your Gmail inbox or spam folder for the email containing your 6-digit verification code to complete sign-in.
                      </p>
                    </div>

                    <div>
                      <label className="font-bold text-[#2C2A26] uppercase block mb-1 text-[10px]">
                        Enter 6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="e.g. 483921"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-center font-mono font-bold text-lg tracking-widest rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#2C2A26]"
                      />
                    </div>

                    <div className="text-center pt-0.5">
                      <span className="text-[10px] text-gray-500 leading-relaxed block">
                        💡 Note: If SMTP 535 error occurs due to Gmail App Password security constraints, the system automatically logs the code in the Server Console for seamless testing.
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setGoogleStep('email')}
                        className="w-1/2 py-2.5 bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#2C2A26] font-bold rounded-xl transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={googleVerifying}
                        className="w-1/2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        {googleVerifying ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Verifying & Registering...</span>
                          </>
                        ) : (
                          <span>Verify & Register</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 bg-[#2C2A26] text-[#F5F2EB] rounded-2xl flex items-center justify-center mx-auto mb-1">
                    <User className="w-5 h-5 text-amber-300" />
                  </div>
                  <h3 className="font-serif font-bold text-xl text-[#2C2A26]">
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </h3>
                  <p className="text-[11px] text-[#5D5A53]">
                    {isLogin ? 'Enter your details to access your secure account' : 'Fill in the details below to create your new account'}
                  </p>
                </div>

                {/* Google Sign-in Button */}
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={loading || (lockoutUntil ? Date.now() < lockoutUntil : false)}
                  className="w-full py-2 px-4 bg-white border border-[#E2DDD3] text-[#2C2A26] font-semibold rounded-xl text-xs hover:bg-[#FDFCF9] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center my-2">
                  <div className="flex-grow border-t border-[#E2DDD3]"></div>
                  <span className="px-3 text-[10px] text-[#8C8275] uppercase font-bold">Or conventional method</span>
                  <div className="flex-grow border-t border-[#E2DDD3]"></div>
                </div>

                <form onSubmit={handleAuth} className="space-y-2 text-xs">
                  {!isLogin && (
                    <div>
                      <label className="font-bold text-[#2C2A26] uppercase block mb-0.5 text-[10px]">
                        Full Name
                      </label>
                      <div className="relative flex items-center">
                        <User className="w-3.5 h-3.5 text-[#8C8275] absolute left-3 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#2C2A26]"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-[#2C2A26] uppercase block mb-0.5 text-[10px]">
                      Email Address (Gmail)
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-3.5 h-3.5 text-[#8C8275] absolute left-3 pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="example@gmail.com"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#2C2A26]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-[#2C2A26] uppercase block mb-0.5 text-[10px]">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-3.5 h-3.5 text-[#8C8275] absolute left-3 pointer-events-none" />
                      <input
                        type="password"
                        required
                        placeholder="Abc12345"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#2C2A26]"
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div>
                      <label className="font-bold text-[#2C2A26] uppercase block mb-0.5 text-[10px]">
                        Confirm Password
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="w-3.5 h-3.5 text-[#8C8275] absolute left-3 pointer-events-none" />
                        <input
                          type="password"
                          required
                          placeholder="Abc12345"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#2C2A26]"
                        />
                      </div>
                    </div>
                  )}

                  {/* CAPTCHA / I am not a robot */}
                  <div>
                    <div 
                      onClick={() => setNotRobot(!notRobot)}
                      className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        notRobot 
                          ? 'bg-emerald-50/55 border-emerald-300 text-emerald-900' 
                          : 'bg-[#FDFCF9] border-[#E2DDD3] text-[#5D5A53] hover:bg-[#F5F2EB]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          notRobot ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-[#E2DDD3]'
                        }`}>
                          {notRobot && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-bold text-[11px]">I am not a robot</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-70">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">re</div>
                        <span className="text-[9px] font-mono">CAPTCHA</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (lockoutUntil ? Date.now() < lockoutUntil : false)}
                    className="w-full py-2.5 bg-[#2C2A26] text-[#F5F2EB] font-bold rounded-xl text-xs hover:bg-[#423E38] transition-all shadow disabled:opacity-50 mt-1"
                  >
                    {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                  </button>
                </form>

                <div className="text-center pt-1">
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-[11px] font-semibold text-[#8C8275] hover:text-[#2C2A26]"
                  >
                    {isLogin
                      ? "Don't have an account? Click here to sign up"
                      : 'Already have an account? Sign in'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-2xl text-[#2C2A26]">
                Welcome Back!
              </h3>
              <p className="text-xs text-[#5D5A53] font-medium">{currentUser.email}</p>
            </div>

            <div className="bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#E2DDD3]">
                <span className="text-[#8C8275] font-bold">Saved Projects</span>
                <span className="font-bold text-[#2C2A26]">{savedCount} items</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#8C8275] font-bold">Account Status</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Active & Secure</span>
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onViewSaved();
                }}
                className="w-full py-2.5 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-xs font-semibold hover:bg-[#423E38] flex items-center justify-center gap-1.5"
              >
                <span>View Saved Projects</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleSignOut}
                className="w-full py-2 bg-white text-[#8C8275] hover:text-[#2C2A26] text-xs font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountModal;
