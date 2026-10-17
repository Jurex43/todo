/**
 * @file src/components/StatsCard.tsx
 * @description Single statistic metric card displaying total, completed, pending, or overdue tasks.
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorScheme: 'indigo' | 'emerald' | 'amber' | 'rose';
  trendText?: string;
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon: Icon,
  colorScheme,
  trendText,
  onClick,
}) => {
  const colorStyles = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      iconText: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-900/30',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      iconText: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/30',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      iconText: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/30',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      iconText: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-100 dark:border-rose-900/30',
    },
  };

  const currentStyle = colorStyles[colorScheme];

  return (
    <div
      onClick={onClick}
      className={`p-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all ${
        onClick ? 'cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xs' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-lg ${currentStyle.bg} flex items-center justify-center ${currentStyle.iconText}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono tabular-nums">
          {value}
        </span>
        {trendText && (
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {trendText}
          </span>
        )}
      </div>
    </div>
  );
};
