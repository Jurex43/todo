/**
 * @file src/utils/authHelpers.ts
 * @description Production authentication utilities, client-side validation logic, and
 * session management for the TodoList platform. All demo user credentials removed.
 */

import { AuthUser } from '../types';

export const AUTH_STORAGE_KEY = 'todolist_is_authenticated';
export const USER_STORAGE_KEY = 'todolist_auth_user';
export const USERS_DB_KEY = 'todolist_registered_users';

/**
 * Validates email format using standard regex
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Evaluates password strength criteria:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one numerical digit
 */
export function checkPasswordStrength(password: string) {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const isValid = hasMinLength && hasUpper && hasLower && hasNumber;

  return {
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    isValid,
  };
}

/**
 * Retrieves the currently logged in user session from LocalStorage
 */
export function getStoredAuthSession(): { isAuthenticated: boolean; user: AuthUser | null } {
  try {
    const isAuth = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (isAuth && userJson) {
      const user = JSON.parse(userJson) as AuthUser;
      return { isAuthenticated: true, user };
    }
  } catch (err) {
    console.warn('Failed to read auth state from LocalStorage:', err);
  }
  return { isAuthenticated: false, user: null };
}

/**
 * Stores authentication credentials in LocalStorage
 */
export function saveAuthSession(user: AuthUser): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save auth state to LocalStorage:', err);
  }
}

/**
 * Clears current session from LocalStorage on Logout
 */
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear auth state from LocalStorage:', err);
  }
}

export interface RegisteredUser {
  id?: string;
  username: string;
  name: string;
  email?: string;
  avatar?: string;
  password: string;
  createdAt: string;
}

/**
  * Helper to get user's saved avatar by username, email, ID, or global fallback
  */
export function getUserSavedAvatar(identifier?: string | null): string | null {
  try {
    if (identifier) {
      const clean = identifier.trim().toLowerCase();
      const stored = localStorage.getItem(`todolist_avatar_${clean}`);
      if (stored) return stored;

      const users = getRegisteredUsers();
      const match = users.find(
        (u) => 
          (u.username && u.username.toLowerCase() === clean) || 
          (u.email && u.email.toLowerCase() === clean) ||
          (u.id && u.id === clean)
      );
      if (match?.avatar) return match.avatar;
    }

    const globalLast = localStorage.getItem('todolist_global_last_saved_avatar');
    if (globalLast) return globalLast;
  } catch {
    return null;
  }
  return null;
}

/**
  * Helper to set user's saved avatar persistently
  */
export function setUserSavedAvatar(identifier: string, avatarUrl: string): void {
  try {
    if (avatarUrl) {
      localStorage.setItem('todolist_global_last_saved_avatar', avatarUrl);
      const clean = identifier ? identifier.trim().toLowerCase() : '';
      if (clean) {
        localStorage.setItem(`todolist_avatar_${clean}`, avatarUrl);
      }
    }
  } catch (err) {
    console.error('Failed to save avatar image:', err);
  }
}

/**
 * Validates username: 3-20 chars, letters, numbers, underscores, dashes, dots
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_.-]{3,20}$/;
  return usernameRegex.test(username.trim());
}

/**
 * Retrieves registered users list so newly created accounts can sign in
 */
export function getRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse users database:', err);
  }
  return [];
}

/**
 * Saves a newly registered user to LocalStorage
 */
export function saveNewUser(newUser: { id?: string; username: string; name?: string; email?: string; avatar?: string; password: string }): void {
  const users = getRegisteredUsers();
  const rawUsername = newUser.username.trim();
  const normalized = rawUsername.toLowerCase();
  
  // Filter out any existing with same username (case-insensitive)
  const filtered = users.filter((u) => u.username.toLowerCase() !== normalized);
  filtered.push({
    id: newUser.id,
    username: rawUsername,
    name: newUser.name?.trim() || rawUsername,
    email: newUser.email?.trim() || `${normalized}@todolist.app`,
    avatar: newUser.avatar,
    password: newUser.password,
    createdAt: new Date().toISOString(),
  });
  
  if (newUser.avatar) {
    setUserSavedAvatar(rawUsername, newUser.avatar);
    if (newUser.email) {
      setUserSavedAvatar(newUser.email, newUser.avatar);
    }
  }

  try {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(filtered));
    // Ensure new account starts with 0 tasks (empty array)
    const cleanId = rawUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    localStorage.setItem(`todolist_tasks_v2_user_${cleanId}`, JSON.stringify([]));
    if (newUser.id) {
      const cleanIdUuid = String(newUser.id).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      localStorage.setItem(`todolist_tasks_v2_user_${cleanIdUuid}`, JSON.stringify([]));
    }
  } catch (err) {
    console.error('Failed to save user in LocalStorage:', err);
  }
}

/**
 * Checks if a username is already taken
 */
export function isUsernameTaken(username: string): boolean {
  const users = getRegisteredUsers();
  const cleanUsername = username.trim().toLowerCase();
  return users.some((u) => u.username.toLowerCase() === cleanUsername);
}

/**
 * Updates an existing user's password in LocalStorage
 */
export function updateUserPassword(identifier: string, newPassword: string): boolean {
  try {
    const users = getRegisteredUsers();
    const clean = identifier.trim().toLowerCase();
    let updated = false;

    const mapped = users.map((u) => {
      if (
        u.username.toLowerCase() === clean ||
        (u.email && u.email.toLowerCase() === clean) ||
        (u.id && u.id === clean)
      ) {
        updated = true;
        return { ...u, password: newPassword };
      }
      return u;
    });

    if (updated) {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(mapped));
      return true;
    }
  } catch (err) {
    console.error('Failed to update user password in LocalStorage:', err);
  }
  return false;
}

