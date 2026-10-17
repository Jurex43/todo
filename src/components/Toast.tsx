/**
 * @file src/components/Toast.tsx
 * @description Highly polished, animated toast notification with progress countdown,
 * glassmorphic styling, icon badges, and smooth entrance animation.
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Sparkles } from 'lucide-react';
import { ToastNotification } from '../types';

interface ToastProps {
  toast: ToastNotification | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!toast) return;

    if (isHovered) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast, isHovered, onDismiss]);

  if (!toast) return null;

  // Visual configuration per toast type
  const config = {
    success: {
      border: 'border-emerald-500/30 dark:border-emerald-500/40',
      bgGlow: 'from-emerald-500/10 to-transparent',
      progress: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      title: 'Success',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    error: {
      border: 'border-rose-500/30 dark:border-rose-500/40',
      bgGlow: 'from-rose-500/10 to-transparent',
      progress: 'bg-gradient-to-r from-rose-500 to-red-400',
      badgeBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
      title: 'Attention',
      icon: <AlertCircle className="w-5 h-5" />,
    },
    warning: {
      border: 'border-amber-500/30 dark:border-amber-500/40',
      bgGlow: 'from-amber-500/10 to-transparent',
      progress: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      title: 'Warning',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    info: {
      border: 'border-blue-500/30 dark:border-blue-500/40',
      bgGlow: 'from-blue-500/10 to-transparent',
      progress: 'bg-gradient-to-r from-blue-500 to-indigo-400',
      badgeBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      title: 'Notification',
      icon: <Info className="w-5 h-5" />,
    },
  }[toast.type] || {
    border: 'border-blue-500/30',
    bgGlow: 'from-blue-500/10 to-transparent',
    progress: 'bg-blue-500',
    badgeBg: 'bg-blue-500/15 text-blue-500',
    title: 'Notification',
    icon: <Sparkles className="w-5 h-5" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed top-5 right-5 sm:right-6 z-[9999] max-w-sm w-full animate-toast-enter transition-all select-none"
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border ${config.border} shadow-[0_10px_35px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)] p-4`}
      >
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 left-0 right-0 h-14 bg-gradient-to-b ${config.bgGlow} pointer-events-none`} />

        <div className="relative flex items-start gap-3">
          {/* Animated Glowing Icon Badge */}
          <div className={`w-10 h-10 rounded-xl ${config.badgeBg} flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white/50 dark:ring-neutral-800`}>
            {config.icon}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {config.title}
              </span>
              <button
                type="button"
                onClick={onDismiss}
                className="p-1 -mr-1 -mt-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-0.5 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white leading-snug">
              {toast.message}
            </p>
          </div>
        </div>

        {/* Animated Progress Countdown Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-100 dark:bg-neutral-800/80 overflow-hidden">
          <div className={`h-full ${config.progress} animate-toast-progress`} />
        </div>
      </div>
    </div>
  );
};
