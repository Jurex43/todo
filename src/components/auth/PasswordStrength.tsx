/**
 * @file src/components/auth/PasswordStrength.tsx
 * @description Subtle live password strength indicator showing criteria checkmarks.
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import { checkPasswordStrength } from '../../utils/authHelpers';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  if (!password) return null;

  const strength = checkPasswordStrength(password);

  const criteria = [
    { label: 'At least 8 characters', met: strength.hasMinLength },
    { label: 'One uppercase letter', met: strength.hasUpper },
    { label: 'One lowercase letter', met: strength.hasLower },
    { label: 'One number', met: strength.hasNumber },
  ];

  return (
    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60 text-xs space-y-1.5 animate-in fade-in duration-150">
      <p className="font-semibold text-neutral-600 dark:text-neutral-400">
        Password requirements:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
        {criteria.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 transition-colors ${
              item.met
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {item.met ? (
              <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            ) : (
              <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              </div>
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
