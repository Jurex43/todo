/**
 * @file src/pages/TodayView.tsx
 * @description View dedicated to tasks scheduled for the current calendar day.
 */

import React from 'react';
import { Calendar, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Task } from '../types';
import { getTodayDateString, isTaskOverdue } from '../utils/taskHelpers';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';

interface TodayViewProps {
  tasks: Task[];
  onOpenCreateTask: () => void;
  onToggleComplete: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  onOpenCreateTask,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
}) => {
  const todayStr = getTodayDateString();

  // Tasks due today or overdue pending tasks that need immediate attention today
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t));

  const completedToday = todayTasks.filter((t) => t.completed).length;
  const pendingToday = todayTasks.filter((t) => !t.completed).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Today&apos;s Tasks</span>
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            <span className="font-semibold text-neutral-900 dark:text-white font-mono tabular-nums">
              {todayTasks.length}
            </span>{' '}
            task{todayTasks.length === 1 ? '' : 's'} scheduled for today
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateTask}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Task for Today</span>
        </button>
      </div>

      {/* Mini Status Breakdown */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-center">
        <div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending</span>
          </div>
          <p className="mt-1 text-xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums">
            {pendingToday}
          </p>
        </div>

        <div className="border-x border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Completed</span>
          </div>
          <p className="mt-1 text-xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums">
            {completedToday}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Overdue</span>
          </div>
          <p className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
            {overdueTasks.length}
          </p>
        </div>
      </div>

      {/* Overdue Warning Callout (if any) */}
      {overdueTasks.length > 0 && (
        <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Overdue Tasks Requiring Attention ({overdueTasks.length})</span>
          </div>
          <div className="space-y-2.5">
            {overdueTasks.map((task) => (
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
      )}

      {/* Today's Tasks List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Scheduled for Today
        </h3>

        {todayTasks.length > 0 ? (
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            variant="today"
            title="No tasks scheduled for today"
            description="Your schedule is completely clear for today. Plan ahead or take a break!"
            actionText="Schedule a Task for Today"
            onAction={onOpenCreateTask}
          />
        )}
      </div>
    </div>
  );
};
