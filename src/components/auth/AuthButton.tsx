/**
 * @file src/components/auth/AuthButton.tsx
 * @description Primary action button for authentication with rich green palette (#16A34A) and rounded styling.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
  className?: string;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  isLoading = false,
  loadingText,
  disabled = false,
  type = 'submit',
  variant = 'primary',
  onClick,
  className = '',
}) => {
  const baseStyles = 'w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]';

  const variants = {
    primary: 'bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#6366F1] hover:from-[#1D4ED8] hover:to-[#4F46E5] active:opacity-95 text-white shadow-[0_10px_25px_-5px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_28px_-4px_rgba(99,102,241,0.4)] disabled:opacity-60 disabled:cursor-not-allowed',
    secondary: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-[#2563EB] dark:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed',
    outline: 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {isLoading ? (
        <span>{loadingText || 'Please wait...'}</span>
      ) : (
        children
      )}
    </button>
  );
};
