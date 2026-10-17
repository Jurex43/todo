/**
 * @file src/components/auth/TodoListLogo.tsx
 * @description Official Lift branding logo with radiant blue/indigo diamond checkmark,
 * matching the user's reference mockup image pixel-for-pixel.
 */

import React from 'react';

interface TodoListLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  taglineText?: string;
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
  textColor?: string;
}

export const TodoListLogo: React.FC<TodoListLogoProps> = ({ 
  size = 'md',
  showTagline = false,
  taglineText = 'Plan • Focus • Achieve',
  className = '',
  textColor,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-xl font-bold',
    md: 'text-2xl font-extrabold',
    lg: 'text-3xl font-extrabold',
    xl: 'text-4xl font-extrabold',
  };

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <div className="flex items-center gap-2.5">
        {/* Diamond gradient checkmark badge */}
        <div className={`${iconSizes[size]} shrink-0 flex items-center justify-center filter drop-shadow-md`}>
          <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id={`liftGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="45%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
            <rect 
              x="8" 
              y="8" 
              width="32" 
              height="32" 
              rx="9" 
              transform="rotate(45 24 24)" 
              fill={`url(#liftGrad-${size})`} 
            />
            <path 
              d="M17 24.5L22 29.5L31 19" 
              stroke="white" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
        </div>

        <span className={`${textSizes[size]} tracking-tight font-sans ${textColor || 'text-slate-900 dark:text-white'}`}>
          Tasks
        </span>
      </div>

      {showTagline && (
        <span className="text-[12px] font-medium tracking-wide text-white/80 dark:text-slate-400 mt-1 pl-1">
          {taglineText}
        </span>
      )}
    </div>
  );
};
