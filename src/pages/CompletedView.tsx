/**
 * @file src/pages/CompletedView.tsx
 * @description View archiving all completed tasks, with options to uncomplete,
 * delete individually, or clear all completed items.
 */

import React, { useState } from 'react';
import { CheckCircle2, Trash2, RotateCcw } from 'lucide-react';
import { Task } from '../types';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';

interface CompletedViewProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onClearAllCompleted: () => void;
}

export const CompletedView: React.FC<CompletedViewProps> = ({
  tasks,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onClearAllCompleted,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Completed Tasks</span>
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Review your accomplished checklist items.
          </p>
        </div>

        {completedTasks.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 font-medium">Are you sure?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAllCompleted();
                    setShowClearConfirm(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                >
                  Yes, Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Completed ({completedTasks.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Completed Tasks List */}
      {completedTasks.length > 0 ? (
        <div className="space-y-3">
          {completedTasks.map((task) => (
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
          variant="completed"
          title="No completed tasks yet"
          description="Check off tasks on your dashboard or tasks page to see your completed accomplishments here."
        />
      )}
    </div>
  );
};
