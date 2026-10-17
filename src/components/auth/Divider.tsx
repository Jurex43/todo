/**
 * @file src/components/auth/Divider.tsx
 * @description Clean divider matching the mockup with "or continue with" text.
 */

import React from 'react';

interface DividerProps {
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({ label = 'or continue with' }) => {
  return (
    <div className="relative my-6 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200 dark:border-slate-800" />
      </div>
      <div className="relative px-3.5 bg-white dark:bg-slate-900 text-xs font-medium text-slate-400">
        {label}
      </div>
    </div>
  );
};
