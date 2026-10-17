/**
 * @file src/components/auth/PasswordInput.tsx
 * @description Accessible password input matching the user's reference mockup with lock icon and eye toggle.
 */

import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { FormError } from './FormError';

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  rightLabelAction?: React.ReactNode;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'Enter your password',
  required = false,
  error,
  autoComplete = 'current-password',
  autoFocus = false,
  disabled = false,
  rightLabelAction,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full text-left">
      <div className="flex items-center justify-between mb-1.5">
        <label 
          htmlFor={id} 
          className="block text-xs font-semibold text-[#0F172A] dark:text-slate-200"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {rightLabelAction}
      </div>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Lock className="w-4 h-4" />
        </div>

        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          className={`w-full py-3.5 sm:py-4 pl-12 pr-12 text-sm sm:text-base rounded-xl sm:rounded-2xl transition-all outline-none ${
            error
              ? 'border border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/10 text-slate-900 dark:text-white'
              : 'border border-slate-200 dark:border-slate-700/80 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      <FormError message={error} />
    </div>
  );
};
