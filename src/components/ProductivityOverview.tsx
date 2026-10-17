/**
 * @file src/components/ProductivityOverview.tsx
 * @description Shows completion ratio (e.g. 15 / 24), progress bar, and completion rate.
 */

import React from 'react';
import { CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

interface ProductivityOverviewProps {
  completed: number;
  total: number;
  rate: number;
}

export const ProductivityOverview: React.FC<ProductivityOverviewProps> = ({
  completed,
  total,
  rate,
}) => {
  // Select a motivational message based on completion percentage
  let statusMessage = "Let's kickstart your progress today.";
  if (total === 0) {
    statusMessage = "Create your first task to start tracking.";
  } else if (rate === 100) {
    statusMessage = "Outstanding! All tasks are completed!";
  } else if (rate >= 75) {
    statusMessage = "Almost there! Excellent momentum today.";
  } else if (rate >= 50) {
    statusMessage = "Halfway through! Keep up the great pace.";
  } else if (rate > 0) {
    statusMessage = "Good start! Keep ticking off items.";
  }

  return (
    <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
            Productivity Overview
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {statusMessage}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
            <span>Completed:</span>
            <span className="font-mono tabular-nums text-neutral-900 dark:text-white font-bold">
              {completed} / {total}
            </span>
          </div>

          <div className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-[#2563EB] dark:text-blue-300 font-mono tabular-nums text-xs font-bold">
            {rate}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#38BDF8] via-[#2563EB] to-[#6366F1] transition-all duration-500 ease-out rounded-full shadow-xs"
            style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
          <span>0%</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Daily Goal
          </span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
