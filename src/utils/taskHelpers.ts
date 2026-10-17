/**
 * @file src/utils/taskHelpers.ts
 * @description Helper functions for task manipulation, date handling, sorting,
 * filtering, and browser LocalStorage synchronization.
 */

import { Task, TaskStatistics, StatusFilter, TaskCategory, PriorityLevel, SortOption } from '../types';

export const LOCAL_STORAGE_KEY = 'todolist_tasks_v2';
export const THEME_STORAGE_KEY = 'todolist_theme';

/**
 * Generates a standard RFC4122 v4 UUID string for seamless database & client key compatibility.
 */
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 * Using local date components prevents time-zone shifts.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns tomorrow's date formatted as YYYY-MM-DD
 */
export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns date offset by N days from today as YYYY-MM-DD
 */
export function getDateOffsetString(offsetDays: number): string {
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a YYYY-MM-DD date is today
 */
export function isDateToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

/**
 * Checks if a task is overdue (due date before today and not yet completed)
 */
export function isTaskOverdue(task: Task): boolean {
  if (task.completed || !task.dueDate) return false;
  return task.dueDate < getTodayDateString();
}

/**
 * Checks if a date is in the future (after today)
 */
export function isDateUpcoming(dateStr: string): boolean {
  if (!dateStr) return false;
  return dateStr > getTodayDateString();
}

/**
 * Human-friendly date representation (e.g., "Today", "Tomorrow", "Overdue (Yesterday)", "Sep 28")
 */
export function formatFriendlyDate(dateStr: string): { label: string; isUrgent: boolean; isOverdue: boolean } {
  if (!dateStr) {
    return { label: 'No due date', isUrgent: false, isOverdue: false };
  }

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  if (dateStr === todayStr) {
    return { label: 'Due Today', isUrgent: true, isOverdue: false };
  }

  if (dateStr === tomorrowStr) {
    return { label: 'Due Tomorrow', isUrgent: false, isOverdue: false };
  }

  if (dateStr < todayStr) {
    return { label: `Overdue (${dateStr})`, isUrgent: true, isOverdue: true };
  }

  // Format as readable date (e.g., "Oct 15")
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, monthIndex, day);
      const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { label: formatted, isUrgent: false, isOverdue: false };
    }
  } catch {
    // fallback
  }

  return { label: dateStr, isUrgent: false, isOverdue: false };
}

/**
 * Computes live statistical metrics across all user tasks
 */
export function calculateTaskStats(tasks: Task[]): TaskStatistics {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    pending,
    overdue,
    completionRate,
  };
}

/**
 * Filter tasks based on search query, status, category, and priority
 */
export function filterTasks(
  tasks: Task[],
  filters: {
    search?: string;
    status?: StatusFilter;
    category?: TaskCategory | 'all';
    priority?: PriorityLevel | 'all';
  }
): Task[] {
  const { search = '', status = 'all', category = 'all', priority = 'all' } = filters;
  const query = search.trim().toLowerCase();
  const todayStr = getTodayDateString();

  return tasks.filter((task) => {
    // 1. Text Search matching title, description, or category
    if (query) {
      const matchTitle = task.title.toLowerCase().includes(query);
      const matchDesc = task.description ? task.description.toLowerCase().includes(query) : false;
      const matchCat = task.category.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc && !matchCat) {
        return false;
      }
    }

    // 2. Status filtering
    if (status === 'completed' && !task.completed) return false;
    if (status === 'pending' && task.completed) return false;
    if (status === 'today') {
      if (task.dueDate !== todayStr) return false;
    }
    if (status === 'upcoming') {
      if (!task.dueDate || task.dueDate <= todayStr) return false;
    }
    if (status === 'overdue') {
      if (!isTaskOverdue(task)) return false;
    }

    // 3. Category filtering
    if (category !== 'all' && task.category !== category) {
      return false;
    }

    // 4. Priority filtering
    if (priority !== 'all' && task.priority !== priority) {
      return false;
    }

    return true;
  });
}

/**
 * Sorts tasks according to the chosen sort strategy
 */
export function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  const sorted = [...tasks];

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'dueDate':
      return sorted.sort((a, b) => {
        // If one has no dueDate, put it at the end
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    case 'priority': {
      const priorityWeight: Record<PriorityLevel, number> = {
        high: 3,
        medium: 2,
        low: 1,
      };
      return sorted.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    }
    case 'alphabetical':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
}

/**
 * Generates an isolated LocalStorage key for a given user or user ID.
 * This guarantees different accounts have completely separate tasks.
 */
export function getUserTaskStorageKey(userIdOrUsername?: string | null): string {
  if (!userIdOrUsername || !userIdOrUsername.trim()) {
    return `${LOCAL_STORAGE_KEY}_guest`;
  }
  const cleanId = userIdOrUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `${LOCAL_STORAGE_KEY}_user_${cleanId}`;
}

/**
 * Loads tasks safely from browser LocalStorage for a specific user.
 */
export function loadTasksFromStorage(userIdOrUsername?: string | null): Task[] | null {
  try {
    const key = getUserTaskStorageKey(userIdOrUsername);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    // New accounts or uninitialized accounts always start with 0 tasks (empty array)
    return [];
  } catch (error) {
    console.warn('Could not load tasks from LocalStorage:', error);
    return [];
  }
}

/**
 * Saves tasks to browser LocalStorage isolated per user account.
 */
export function saveTasksToStorage(tasks: Task[], userIdOrUsername?: string | null): void {
  try {
    const key = getUserTaskStorageKey(userIdOrUsername);
    localStorage.setItem(key, JSON.stringify(tasks));
  } catch (error) {
    console.error('Could not save tasks to LocalStorage:', error);
  }
}
