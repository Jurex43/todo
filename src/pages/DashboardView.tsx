/**
 * @file src/pages/DashboardView.tsx
 * @description Main dashboard overview with dynamic greeting, statistics cards,
 * productivity progress bar, and focused quick-action tasks for the day.
 */

import React from 'react';
import { 
  CheckSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Task, TaskStatistics, NavigationView } from '../types';
import { StatsCard } from '../components/StatsCard';
import { ProductivityOverview } from '../components/ProductivityOverview';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';

interface DashboardViewProps {
  tasks: Task[];
  stats: TaskStatistics;
  onOpenCreateTask: () => void;
  onToggleComplete: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onNavigate: (view: NavigationView) => void;
  onOpenSupabaseModal?: () => void;
  onTriggerSync?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  stats,
  onOpenCreateTask,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onNavigate,
  onOpenSupabaseModal,
  onTriggerSync,
}) => {
  // Compute dynamic time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Focused tasks: Pending tasks, prioritized by High > Medium > Low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const focusedTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-br from-blue-50/70 via-white to-[#F8FAFC] dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 rounded-3xl border border-blue-100 dark:border-blue-950 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{getGreeting()}</span>
            <span className="text-2xl animate-pulse">✨</span>
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Welcome to <span className="font-bold text-[#2563EB] dark:text-blue-400">Tasks</span>. You have{' '}
            <span className="font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {stats.pending}
            </span>{' '}
            tasks remaining on your agenda today.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateTask}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] rounded-2xl shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Task</span>
        </button>
      </div>

      {/* 2. Statistics Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Tasks"
          value={stats.total}
          icon={CheckSquare}
          colorScheme="emerald"
          trendText="All recorded items"
          onClick={() => onNavigate('tasks')}
        />
        <StatsCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          colorScheme="emerald"
          trendText={`${stats.completionRate}% completion`}
          onClick={() => onNavigate('completed')}
        />
        <StatsCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          colorScheme="amber"
          trendText="Requires action"
          onClick={() => onNavigate('tasks')}
        />
        <StatsCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          colorScheme="rose"
          trendText={stats.overdue > 0 ? 'Urgent attention' : 'Up to date'}
          onClick={() => onNavigate('tasks')}
        />
      </div>

      {/* 3. Productivity Overview Progress Bar */}
      <ProductivityOverview
        completed={stats.completed}
        total={stats.total}
        rate={stats.completionRate}
      />

      {/* 4. Priority Focus Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Priority Focus
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('tasks')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <span>View all ({tasks.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {focusedTasks.length > 0 ? (
          <div className="space-y-3">
            {focusedTasks.map((task) => (
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
            title="All tasks completed!"
            description="You don't have any pending tasks right now. Great job!"
            actionText="Create New Task"
            onAction={onOpenCreateTask}
          />
        )}
      </div>
    </div>
  );
};
