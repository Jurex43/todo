/**
 * @file src/pages/UpcomingView.tsx
 * @description View showing future scheduled tasks, chronologically grouped by due date.
 */

import React from 'react';
import { CalendarClock, Plus, Calendar } from 'lucide-react';
import { Task } from '../types';
import { getTodayDateString, getTomorrowDateString } from '../utils/taskHelpers';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';

interface UpcomingViewProps {
  tasks: Task[];
  onOpenCreateTask: () => void;
  onToggleComplete: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export const UpcomingView: React.FC<UpcomingViewProps> = ({
  tasks,
  onOpenCreateTask,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
}) => {
  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  // Filter tasks with future due dates
  const upcomingTasks = tasks
    .filter((t) => t.dueDate && t.dueDate > todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Group tasks by dueDate
  const groupedTasks: Record<string, Task[]> = {};
  for (const task of upcomingTasks) {
    if (!groupedTasks[task.dueDate]) {
      groupedTasks[task.dueDate] = [];
    }
    groupedTasks[task.dueDate].push(task);
  }

  // Format date header label
  const formatGroupHeader = (dateStr: string) => {
    if (dateStr === tomorrowStr) return 'Tomorrow';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const dateObj = new Date(year, monthIndex, day);
        return dateObj.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const groupKeys = Object.keys(groupedTasks);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Upcoming Tasks</span>
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            <span className="font-semibold text-neutral-900 dark:text-white font-mono tabular-nums">
              {upcomingTasks.length}
            </span>{' '}
            task{upcomingTasks.length === 1 ? '' : 's'} scheduled for future dates
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateTask}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Schedule Task</span>
        </button>
      </div>

      {/* Date-Grouped Task Lists */}
      {groupKeys.length > 0 ? (
        <div className="space-y-8">
          {groupKeys.map((dateKey) => (
            <div key={dateKey} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
                  {formatGroupHeader(dateKey)}
                </h3>
                <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">
                  ({groupedTasks[dateKey].length})
                </span>
              </div>

              <div className="space-y-3">
                {groupedTasks[dateKey].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No upcoming tasks scheduled"
          description="Plan ahead by scheduling tasks for the days and weeks ahead."
          actionText="Schedule New Task"
          onAction={onOpenCreateTask}
        />
      )}
    </div>
  );
};
