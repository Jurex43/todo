/**
 * @file src/types/index.ts
 * @description Core TypeScript interfaces and type definitions for TaskFlow.
 * 
 * Beginner Concept Note:
 * In TypeScript, "types" and "interfaces" define the shape of our data.
 * This prevents bugs like misspelling a property or passing text where a number is expected.
 */

// Priority levels available for any task
export type PriorityLevel = 'low' | 'medium' | 'high';

// Categories supported by TaskFlow
export type TaskCategory = 'personal' | 'school' | 'work' | 'other';

// Main Task data structure
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: PriorityLevel;
  category: TaskCategory;
  dueDate: string; // ISO format string: YYYY-MM-DD
  dueTime?: string; // Time in 24hr format: HH:mm (e.g. "14:30")
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Available navigation views in the application
export type NavigationView = 
  | 'dashboard'
  | 'tasks'
  | 'today'
  | 'upcoming'
  | 'completed'
  | 'category-personal'
  | 'category-school'
  | 'category-work'
  | 'category-other'
  | 'settings';

// Filter status options
export type StatusFilter = 'all' | 'pending' | 'completed' | 'today' | 'upcoming' | 'overdue';

// Sorting options
export type SortOption = 
  | 'newest'
  | 'oldest'
  | 'dueDate'
  | 'priority'
  | 'alphabetical';

// Toast Notification model
export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

// Calculated productivity stats
export interface TaskStatistics {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

// User Profile representation for Authentication
export interface AuthUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  avatar?: string;
  plan?: string;
}

// Active authentication page view
export type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password';
