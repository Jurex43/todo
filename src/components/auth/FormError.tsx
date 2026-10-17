/**
 * @file src/components/auth/FormError.tsx
 * @description Accessible, clear error presentation for form inputs or global form alerts.
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  message?: string;
  variant?: 'banner' | 'inline';
}

export const FormError: React.FC<FormErrorProps> = ({ 
  message, 
  variant = 'inline' 
}) => {
  if (!message) return null;

  if (variant === 'banner') {
    return (
      <div 
        role="alert" 
        className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs sm:text-sm animate-in fade-in duration-150"
      >
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
        <span className="leading-snug">{message}</span>
      </div>
    );
  }

  return (
    <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium animate-in fade-in duration-150">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
};
