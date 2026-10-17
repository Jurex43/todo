/**
 * @file src/pages/CategoryView.tsx
 * @description View focusing on tasks for a specific category (Personal, School, Work, Other).
 */

import React from 'react';
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  Folder, 
  Plus, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { Task, TaskCategory } from '../types';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';

interface CategoryViewProps {
  category: TaskCategory;
  tasks: Task[];
  onOpenCreateTask: (defaultCategory?: TaskCategory) => void;
  onToggleComplete: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  category,
  tasks,
  onOpenCreateTask,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
}) => {
  const categoryConfig: Record<
    TaskCategory,
    { title: string; subtitle: string; icon: React.FC<{ className?: string }> }
  > = {
    personal: {
      title: 'Personal Tasks',
      subtitle: 'Health, wellness, personal errands, and daily routines.',
      icon: User,
    },
    school: {
      title: 'School & Learning',
      subtitle: 'Assignments, coursework, research documentation, and study plans.',
      icon: GraduationCap,
    },
    work: {
      title: 'Work & Projects',
      subtitle: 'Professional responsibilities, sprint tasks, and client deliveries.',
      icon: Briefcase,
    },
    other: {
      title: 'Other & Miscellaneous',
      subtitle: 'General reminders, hobbies, and uncategorized items.',
      icon: Folder,
    },
  };

  const currentConfig = categoryConfig[category] || categoryConfig.other;
  const Icon = currentConfig.icon;

  const categoryTasks = tasks.filter((t) => t.category === category);
  const completedCount = categoryTasks.filter((t) => t.completed).length;
  const pendingCount = categoryTasks.length - completedCount;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Icon className="w-5 h-5" />
            </div>
            <span>{currentConfig.title}</span>
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {currentConfig.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenCreateTask(category)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add in {category}</span>
        </button>
      </div>

      {/* Mini Stats Bar */}
      <div className="flex items-center gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-400">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <strong className="text-neutral-900 dark:text-white font-mono tabular-nums">{pendingCount}</strong> Pending
        </span>
        <span className="text-neutral-300 dark:text-neutral-700">·</span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <strong className="text-neutral-900 dark:text-white font-mono tabular-nums">{completedCount}</strong> Completed
        </span>
      </div>

      {/* Task List */}
      {categoryTasks.length > 0 ? (
        <div className="space-y-3">
          {categoryTasks.map((task) => (
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
          title={`No ${category} tasks found`}
          description={`Start tracking your ${category} items by creating your first task.`}
          actionText={`Add ${category} Task`}
          onAction={() => onOpenCreateTask(category)}
        />
      )}
    </div>
  );
};
