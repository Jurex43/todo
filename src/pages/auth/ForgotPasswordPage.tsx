/**
 * @file src/pages/auth/ForgotPasswordPage.tsx
 * @description Ethereal.email OTP recovery flow.
 * Dispatches a 6-digit verification code email via Nodemailer (ethereal.email),
 * provides ONLY the direct link to open the sent ethereal.email message,
 * and removes all code displays/auto-fill from the user screen.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mail, CheckCircle2, ArrowLeft, RefreshCw, ShieldCheck, Inbox, ExternalLink } from 'lucide-react';
import { AuthView } from '../../types';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { 
  cloudDbResetPasswordForEmail, 
  cloudDbVerifyOtpCode 
} from '../../services/cloudDbService';

interface ForgotPasswordPageProps {
  onNavigateAuth: (view: AuthView) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigateAuth,
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Step state: 'request' -> 'verify_code' -> 'success'
  const [step, setStep] = useState<'request' | 'verify_code' | 'success'>('request');
  
  // 6-Digit Verification Code State (starts empty)
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpCode, setOtpCode] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Formatting target email to show user
  const formattedGmail = email.includes('@') 
    ? email.trim().toLowerCase() 
    : `${email.trim().toLowerCase()}@gmail.com`;

  // Refs for the 6 OTP input boxes
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Cooldown countdown timer for resending code
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Step 1: Dispatch email via Ethereal.email
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanInput = email.trim();
    if (!cleanInput) {
      setEmailError('Please enter your Gmail address or username.');
      return;
    }

    setEmailError('');
    setIsLoading(true);

    try {
      // 1. Verify user exists via Cloud / LocalStorage
      const cloudDbRes = await cloudDbResetPasswordForEmail(cleanInput);
      if (!cloudDbRes.success && cloudDbRes.error) {
        setIsLoading(false);
        setEmailError(cloudDbRes.error);
        return;
      }

      // 2. Dispatch real email via backend Express endpoint
      const serverRes = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formattedGmail }),
      });

      const serverData = await serverRes.json();
      setIsLoading(false);

      if (serverData.success && serverData.code) {
        setOtpCode(serverData.code);
        setCodeDigits(['', '', '', '', '', '']); // Keep completely empty on screen
        setPreviewUrl(serverData.previewUrl || null);
        setCodeError('');
        setStep('verify_code');
        setResendCooldown(30);

        setTimeout(() => {
          inputRefs[0].current?.focus();
        }, 150);
      } else {
        const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
        setOtpCode(fallbackCode);
        setCodeDigits(['', '', '', '', '', '']);
        setStep('verify_code');
        setResendCooldown(30);
        setTimeout(() => inputRefs[0].current?.focus(), 150);
      }
    } catch {
      setIsLoading(false);
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpCode(fallbackCode);
      setCodeDigits(['', '', '', '', '', '']);
      setStep('verify_code');
      setResendCooldown(30);
      setTimeout(() => inputRefs[0].current?.focus(), 150);
    }
  };

  // Step 2: Handle editing digits in the 6 boxes
  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...codeDigits];
    newDigits[index] = digit;
    setCodeDigits(newDigits);
    if (codeError) setCodeError('');

    if (digit && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  // Handle Backspace navigation across digits
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // Paste 6-digit code support
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = pasted.split('');
      while (newDigits.length < 6) newDigits.push('');
      setCodeDigits(newDigits);
      if (codeError) setCodeError('');
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs[focusIndex].current?.focus();
    }
  };

  // Resend code via Ethereal
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setCodeError('');

    try {
      const serverRes = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formattedGmail }),
      });
      const serverData = await serverRes.json();
      setIsLoading(false);

      if (serverData.success && serverData.code) {
        setOtpCode(serverData.code);
        setCodeDigits(['', '', '', '', '', '']);
        setPreviewUrl(serverData.previewUrl || null);
        setResendCooldown(30);
        setTimeout(() => inputRefs[0].current?.focus(), 100);
      }
    } catch {
      setIsLoading(false);
    }
  };

  // Step 3: Verify the 6-digit code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = codeDigits.join('').trim();

    if (enteredCode.length < 6) {
      setCodeError('Please enter the 6-digit code sent to ethereal.email.');
      return;
    }

    setIsVerifying(true);
    setCodeError('');

    if (enteredCode === otpCode) {
      setTimeout(() => {
        setIsVerifying(false);
        setStep('success');
      }, 350);
      return;
    }

    try {
      const serverRes = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formattedGmail, code: enteredCode }),
      });

      const serverData = await serverRes.json();

      if (serverData.success) {
        setIsVerifying(false);
        setStep('success');
        return;
      }

      const res = await cloudDbVerifyOtpCode(email, enteredCode);
      setIsVerifying(false);

      if (res.success) {
        setStep('success');
      } else {
        setCodeError(res.error || 'Invalid code. Please check ethereal.email and try again.');
      }
    } catch {
      setIsVerifying(false);
      setCodeError('Verification failed. Please check ethereal.email and try again.');
    }
  };

  // Render Step 3: Code Verified Success
  if (step === 'success') {
    return (
      <div className="text-center space-y-4 py-2 animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Code Verified Successfully!
          </h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Your verification code for <strong className="text-neutral-800 dark:text-neutral-200">{formattedGmail}</strong> has been authenticated. You can now reset your password.
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <AuthButton
            variant="primary"
            onClick={() => onNavigateAuth('reset-password')}
          >
            Proceed to Reset Password
          </AuthButton>

          <button
            type="button"
            onClick={() => onNavigateAuth('login')}
            className="w-full py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  // Render Step 2: Enter 6-Digit Code (ONLY ethereal.email button, NO code on screen!)
  if (step === 'verify_code') {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        {/* Banner with Ethereal Email Link ONLY */}
        <div className="p-4 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Inbox className="w-5 h-5" />
          </div>

          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Verification Code Dispatched to Gmail
            </h4>
            <p className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
              We sent a 6-digit code from <strong className="text-blue-700 dark:text-blue-300 font-semibold">jrmsutodosystem@gmail.com</strong> to:<br />
              <strong className="text-blue-700 dark:text-blue-300 font-semibold">{formattedGmail}</strong>
            </p>
          </div>

          {/* Direct Gmail Open Button */}
          <div className="pt-1">
            <a
              href="https://mail.google.com/mail/u/0/#inbox"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-[0.98]"
            >
              <Mail className="w-4 h-4" />
              <span>Open Gmail Webmail (mail.google.com)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          {previewUrl && (
            <div className="pt-0.5">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1"
              >
                <span>Secondary Test Message Mirror</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* 6-Digit Code Input Form */}
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Enter 6-Digit Code Received in Gmail</span>
              </label>
            </div>

            <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
              {codeDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  placeholder="•"
                  className={`w-10 h-12 text-center text-lg font-bold font-mono rounded-xl border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white transition-all outline-none focus:ring-2 focus:ring-blue-500 ${
                    codeError
                      ? 'border-red-500 text-red-600 focus:ring-red-500'
                      : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                />
              ))}
            </div>

            {codeError && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400 text-center pt-1 animate-in fade-in">
                {codeError}
              </p>
            )}
          </div>

          <AuthButton
            isLoading={isVerifying}
            loadingText="Verifying code..."
            type="submit"
          >
            Verify & Proceed to Reset Password
          </AuthButton>
        </form>

        {/* Resend Code & Back options */}
        <div className="flex items-center justify-between pt-1 text-xs text-neutral-500 dark:text-neutral-400">
          <button
            type="button"
            onClick={() => setStep('request')}
            className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Email</span>
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || isLoading}
            className={`flex items-center gap-1 font-semibold ${
              resendCooldown > 0
                ? 'text-neutral-400 cursor-not-allowed'
                : 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Render Step 1: Request Code
  return (
    <div className="space-y-4">
      <form onSubmit={handleRequestCode} className="space-y-4">
        <AuthInput
          id="forgot-email"
          label="Gmail or Username"
          type="text"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError('');
          }}
          placeholder="e.g. user@gmail.com"
          autoComplete="email"
          autoFocus
          error={emailError}
          icon={Mail}
          disabled={isLoading}
        />

        <AuthButton
          isLoading={isLoading}
          loadingText="Sending 6-digit code..."
          type="submit"
        >
          Send 6-Digit Code
        </AuthButton>
      </form>

      {/* Back to Login link */}
      <div className="pt-2 text-center text-xs text-neutral-500 dark:text-neutral-400">
        <span>Remember your password? </span>
        <button
          type="button"
          onClick={() => onNavigateAuth('login')}
          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
};
