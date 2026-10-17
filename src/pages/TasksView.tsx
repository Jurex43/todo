/**
 * @file src/pages/TasksView.tsx
 * @description Comprehensive task management view with search, status filtering,
 * category & priority selectors, sorting dropdown, and task listings.
 */

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  ArrowUpDown, 
  Filter, 
  X,
  SlidersHorizontal 
} from 'lucide-react';
import { Task, StatusFilter, TaskCategory, PriorityLevel, SortOption } from '../types';
import { filterTasks, sortTasks } from '../utils/taskHelpers';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';

interface TasksViewProps {
  tasks: Task[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreateTask: () => void;
  onToggleComplete: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  searchQuery,
  onSearchChange,
  onOpenCreateTask,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
}) => {
  // Local filter & sorting states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Status tabs
  const statusTabs: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Completed' },
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'overdue', label: 'Overdue' },
  ];

  // Apply filtering and sorting
  const filtered = filterTasks(tasks, {
    search: searchQuery,
    status: statusFilter,
    category: categoryFilter,
    priority: priorityFilter,
  });

  const finalTasks = sortTasks(filtered, sortBy);

  const resetFilters = () => {
    onSearchChange('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters = 
    searchQuery !== '' || 
    statusFilter !== 'all' || 
    categoryFilter !== 'all' || 
    priorityFilter !== 'all' || 
    sortBy !== 'newest';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            My Tasks
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage, organize, and prioritize your personal and work checklist.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateTask}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Task</span>
        </button>
      </div>

      {/* Control Bar: Status Tabs, Search, and Filters */}
      <div className="space-y-3">
        {/* Status segmented tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl shrink-0">
            {statusTabs.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                showAdvancedFilters || categoryFilter !== 'all' || priorityFilter !== 'all'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(categoryFilter !== 'all' || priorityFilter !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 text-xs">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="pl-7 pr-8 py-1.5 text-xs font-medium bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="dueDate">Sort: Due Date</option>
                  <option value="priority">Sort: Priority</option>
                  <option value="alphabetical">Sort: A-Z</option>
                </select>
                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="relative sm:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Expandable Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-wrap items-center gap-4 animate-in fade-in duration-150">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Category:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as TaskCategory | 'all')}
                className="px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-800 dark:text-neutral-200 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="personal">Personal</option>
                <option value="school">School</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Priority:
              </span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityLevel | 'all')}
                className="px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-800 dark:text-neutral-200 focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Reset link if active */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 ml-auto"
              >
                <X className="w-3.5 h-3.5" />
                Reset all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Task List Count Indicator */}
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          Showing <span className="font-semibold text-neutral-900 dark:text-white font-mono tabular-nums">{finalTasks.length}</span> of <span className="font-mono tabular-nums">{tasks.length}</span> tasks
        </span>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Task List or Empty State */}
      {finalTasks.length > 0 ? (
        <div className="space-y-3">
          {finalTasks.map((task) => (
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
          variant={searchQuery ? 'search' : 'tasks'}
          title={searchQuery ? 'No matching tasks' : 'No tasks in this view'}
          description={
            hasActiveFilters
              ? 'Try clearing your search query or relaxing your filters.'
              : 'Add your first task to get started.'
          }
          actionText={hasActiveFilters ? 'Clear Filters' : 'Create Task'}
          onAction={hasActiveFilters ? resetFilters : onOpenCreateTask}
        />
      )}
    </div>
  );
};
