/**
 * @file src/components/EmptyState.tsx
 * @description Clean visual empty state display when no tasks match current view/filters.
 */

import React from 'react';
import { CheckCircle, Plus, Search, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  variant?: 'tasks' | 'search' | 'today' | 'completed';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText = 'Create Task',
  onAction,
  icon: CustomIcon,
  variant = 'tasks',
}) => {
  // Defaults based on variant
  let Icon = CustomIcon || CheckCircle;
  let defaultTitle = 'No tasks yet';
  let defaultDesc = "You're all caught up! Create a task to get started.";

  if (variant === 'search') {
    Icon = Search;
    defaultTitle = 'No matching tasks found';
    defaultDesc = 'Try adjusting your search terms or clearing current filter criteria.';
  } else if (variant === 'today') {
    defaultTitle = 'No tasks scheduled for today';
    defaultDesc = 'Enjoy your free day or schedule upcoming tasks to stay ahead.';
  } else if (variant === 'completed') {
    defaultTitle = 'No completed tasks yet';
    defaultDesc = 'Check off tasks as you finish them to see your progress here.';
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
      <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-neutral-900 dark:text-white">
        {title || defaultTitle}
      </h3>

      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
        {description || defaultDesc}
      </p>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534] rounded-xl shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
