/**
 * @file src/components/auth/AuthInput.tsx
 * @description Standardized, accessible form input field for TodoList auth.
 * Features:
 * - Rounded corners (14-16px)
 * - Green focus states and soft border (#16A34A / #22C55E)
 * - Left icon support (User, Mail, Phone, etc.)
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { FormError } from './FormError';

interface AuthInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  helperText?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  autoComplete,
  autoFocus = false,
  disabled = false,
  icon: Icon,
  helperText,
}) => {
  return (
    <div className="w-full text-left">
      <div className="flex items-center justify-between mb-1.5">
        <label 
          htmlFor={id} 
          className="block text-xs font-semibold text-[#0F172A] dark:text-slate-200"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {helperText && (
          <span className="text-xs text-slate-400">
            {helperText}
          </span>
        )}
      </div>

      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          className={`w-full py-3.5 sm:py-4 text-sm sm:text-base rounded-xl sm:rounded-2xl transition-all outline-none ${
            Icon ? 'pl-12 pr-4' : 'px-4'
          } ${
            error
              ? 'border border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/10 text-slate-900 dark:text-white'
              : 'border border-slate-200 dark:border-slate-700/80 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
        />
      </div>

      <FormError message={error} />
    </div>
  );
};
