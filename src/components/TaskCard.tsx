/**
 * @file src/components/TaskCard.tsx
 * @description Task item card component with completion toggle, details,
 * priority indicator, category tag, due date formatting, and action triggers.
 */

import React from 'react';
import { 
  Check, 
  Calendar, 
  Clock, 
  Edit3, 
  Trash2, 
  Briefcase, 
  GraduationCap, 
  User, 
  Folder 
} from 'lucide-react';
import { Task, PriorityLevel, TaskCategory } from '../types';
import { formatFriendlyDate, isTaskOverdue } from '../utils/taskHelpers';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const isOverdue = isTaskOverdue(task);
  const friendlyDate = formatFriendlyDate(task.dueDate);

  // Category Icon & Label mapping
  const categoryConfig: Record<TaskCategory, { label: string; icon: React.FC<{ className?: string }> }> = {
    personal: { label: 'Personal', icon: User },
    school: { label: 'School', icon: GraduationCap },
    work: { label: 'Work', icon: Briefcase },
    other: { label: 'Other', icon: Folder },
  };

  const CategoryIcon = categoryConfig[task.category]?.icon || Folder;
  const categoryLabel = categoryConfig[task.category]?.label || 'General';

  // Priority badge styling (accessible, clean, not overwhelming)
  const priorityStyles: Record<PriorityLevel, { text: string; bg: string; border: string; label: string }> = {
    high: {
      text: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-900/40',
      label: 'HIGH',
    },
    medium: {
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-900/40',
      label: 'MEDIUM',
    },
    low: {
      text: 'text-neutral-600 dark:text-neutral-400',
      bg: 'bg-neutral-100 dark:bg-neutral-800',
      border: 'border-neutral-200 dark:border-neutral-700',
      label: 'LOW',
    },
  };

  const currentPriority = priorityStyles[task.priority] || priorityStyles.low;

  return (
    <div
      className={`group relative p-4 rounded-xl border transition-all duration-150 ${
        task.completed
          ? 'bg-neutral-50/70 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800/80 opacity-75'
          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          aria-label={task.completed ? 'Mark task as pending' : 'Mark task as completed'}
          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            task.completed
              ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-xs'
              : 'border-slate-300 dark:border-slate-600 hover:border-[#2563EB] bg-white dark:bg-slate-900'
          }`}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <h3
              onClick={() => onToggleComplete(task.id)}
              className={`text-sm sm:text-base font-semibold cursor-pointer select-none transition-colors ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-white hover:text-[#2563EB] dark:hover:text-blue-400'
              }`}
            >
              {task.title}
            </h3>

            {/* Action buttons (always visible on touch / revealed on hover desktop) */}
            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Edit task"
                aria-label="Edit task"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Delete task"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description if present */}
          {task.description && (
            <p
              className={`mt-1 text-xs sm:text-sm line-clamp-2 leading-relaxed ${
                task.completed
                  ? 'text-neutral-400 dark:text-neutral-600'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Metadata Row: Category · Priority Badge · Due Date */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
            {/* Category */}
            <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
              <CategoryIcon className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
              <span className="capitalize">{categoryLabel}</span>
            </div>

            <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${currentPriority.bg} ${currentPriority.text} ${currentPriority.border}`}
            >
              {currentPriority.label}
            </span>

            {/* Due Date */}
            {task.dueDate && (
              <>
                <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
                <div
                  className={`flex items-center gap-1 font-mono tabular-nums ${
                    task.completed
                      ? 'text-neutral-400 dark:text-neutral-500'
                      : isOverdue
                      ? 'text-rose-600 dark:text-rose-400 font-semibold'
                      : friendlyDate.isUrgent
                      ? 'text-amber-600 dark:text-amber-400 font-medium'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {isOverdue ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {friendlyDate.label}
                    {task.dueTime ? ` • ${task.dueTime}` : ''}
                  </span>
                </div>
              </>
            )}

            {/* Completed badge if done */}
            {task.completed && (
              <>
                <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Completed
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
