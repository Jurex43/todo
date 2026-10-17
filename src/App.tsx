/**
 * @file src/App.tsx
 * @description Main application component for TaskFlow.
 * Manages global task state, view navigation, local storage persistence,
 * dark mode toggling, dialog modals, and toast notifications.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Task, 
  NavigationView, 
  ToastNotification, 
  TaskCategory,
  AuthUser,
  AuthView
} from './types';
import { INITIAL_TASKS } from './data/initialTasks';
import { 
  loadTasksFromStorage, 
  saveTasksToStorage, 
  calculateTaskStats, 
  getTodayDateString, 
  isTaskOverdue, 
  THEME_STORAGE_KEY,
  generateUuid
} from './utils/taskHelpers';
import { 
  getStoredAuthSession, 
  saveAuthSession, 
  clearAuthSession,
  getUserSavedAvatar
} from './utils/authHelpers';
import { cloudDbSignOut, 
  saveTaskToSupabase, 
  deleteTaskFromSupabase,
  fetchTasksFromSupabase,
  syncAllTasksToSupabase,
  syncCategoriesToSupabase,
  toValidUuid
} from './services/cloudDbService';
import { updateUserProfile } from './services/profileService';
import { cloudDb } from './lib/cloudDb';

// Layout & UI Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TaskModal } from './components/TaskModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CompleteConfirmModal } from './components/CompleteConfirmModal';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import { EditProfileModal } from './components/EditProfileModal';
import { Toast } from './components/Toast';
import { CloudSyncModal } from './components/CloudSyncModal';

// Auth Pages & Layout
import { AuthLayout } from './components/auth/AuthLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Main App Views
import { DashboardView } from './pages/DashboardView';
import { TasksView } from './pages/TasksView';
import { TodayView } from './pages/TodayView';
import { UpcomingView } from './pages/UpcomingView';
import { CompletedView } from './pages/CompletedView';
import { CategoryView } from './pages/CategoryView';
import { SettingsView } from './pages/SettingsView';

export default function App() {
  // 1. Authentication State
  const [authSession, setAuthSession] = useState<{ isAuthenticated: boolean; user: AuthUser | null }>(() => 
    getStoredAuthSession()
  );
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // 2. Task State initialized from LocalStorage per active user or clean slate (0 tasks)
  const userKey = authSession.user?.username?.trim().toLowerCase() || authSession.user?.id?.trim().toLowerCase() || 'guest_user';
  const [tasks, setTasks] = useState<Task[]>(() => {
    const initialSession = getStoredAuthSession();
    if (!initialSession.isAuthenticated || !initialSession.user) {
      return []; // Not logged in: 0 tasks clean slate
    }
    const initialKey = initialSession.user.username?.trim().toLowerCase() || initialSession.user.id?.trim().toLowerCase() || 'guest_user';
    const saved = loadTasksFromStorage(initialKey);
    return saved && Array.isArray(saved) ? saved : [];
  });

  // 3. Navigation State
  const [currentView, setCurrentView] = useState<NavigationView>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 4. Search query state (shared between header and task views)
  const [searchQuery, setSearchQuery] = useState('');

  // 5. Modals State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Active User Identifier for Cloud synchronization (strictly isolated per account)
  const activeUserId = authSession.user?.username || authSession.user?.id || null;
  const activeUserEmail = authSession.user?.email || (authSession.user?.username ? `${authSession.user.username.toLowerCase()}@todolist.app` : undefined);

  // Manual Trigger for Full Cloud Synchronization
  const handleTriggerCloudSync = async () => {
    if (!authSession.isAuthenticated || !activeUserId) {
      showToast('Please log in to sync tasks to the cloud.', 'info');
      return;
    }
    showToast('Syncing your tasks...', 'info');
    const res = await syncAllTasksToSupabase(tasks, activeUserId, activeUserEmail);
    if (res.success) {
      showToast('All tasks synced successfully.', 'success');
    } else {
      showToast(res.error || 'Sync failed', 'error');
    }
  };

  // Helper function to update user profile
  const handleUpdateProfile = async (updatedUser: AuthUser): Promise<{ success: boolean; error?: string }> => {
    // 1. Instant optimistic update to React state & local session (0ms delay)
    setAuthSession({ isAuthenticated: true, user: updatedUser });
    saveAuthSession(updatedUser);

    const current = authSession.user || {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      plan: 'Cloud Pro Plan',
    };
    const res = await updateUserProfile(current, updatedUser);
    showToast('Profile updated successfully!', 'success');
    return res;
  };

  // 6. Toast Notification State
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Helper function to trigger a toast
  const showToast = (message: string, type: ToastNotification['type'] = 'success') => {
    setToast({
      id: String(Date.now()),
      message,
      type,
    });
  };

  // 7. Theme State (Dark / Light)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      let initialDark = false;
      if (stored !== null) {
        initialDark = stored === 'true';
      } else {
        initialDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      if (initialDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return initialDark;
    } catch {
      return false;
    }
  });

  // Synchronize dark mode class on document element whenever theme toggles
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem(THEME_STORAGE_KEY, 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(THEME_STORAGE_KEY, 'false');
      }
    } catch {
      // Ignore theme storage errors
    }
  }, [isDarkMode]);

  // Track previous active user key to prevent leaking tasks between accounts
  const lastActiveUserRef = useRef<string | null>(authSession.isAuthenticated ? userKey : 'guest_user');

  // Synchronize tasks when active user changes or tasks are modified
  useEffect(() => {
    const targetKey = authSession.isAuthenticated ? userKey : 'guest_user';

    // If active user just changed (e.g. login, logout, register):
    if (lastActiveUserRef.current !== targetKey) {
      lastActiveUserRef.current = targetKey;
      if (authSession.isAuthenticated) {
        const stored = loadTasksFromStorage(targetKey);
        // Start with stored tasks or 0 tasks for new accounts
        setTasks(stored && Array.isArray(stored) && stored.length > 0 ? stored : []);
      } else {
        setTasks([]);
      }
      return; // Do NOT save old tasks to new user's storage!
    }

    // Only save when userKey matches current active user and tasks updated
    saveTasksToStorage(tasks, targetKey);
  }, [tasks, authSession.isAuthenticated, userKey]);

  // Synchronize with active Cloud session on mount
  useEffect(() => {
    // 1. Parse URL hash fragments and query params (e.g. #access_token=...&type=recovery or ?code=...)
    const hash = window.location.hash;
    const search = window.location.search;
    if (
      (hash && (hash.includes('access_token=') || hash.includes('type=recovery') || hash.includes('type=magiclink'))) ||
      (search && (search.includes('code=') || search.includes('type=recovery') || search.includes('token_hash=')))
    ) {
      window.history.replaceState(null, '', window.location.pathname);
      setAuthView('reset-password');
    }

    // 2. Check active Cloud session (only adopt if matching or explicit OAuth login)
    cloudDb.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const stored = getStoredAuthSession();
        const u = data.session.user;
        const isOAuthRedirect = window.location.hash.includes('access_token') || window.location.search.includes('code=');
        const matchesStored = Boolean(
          stored.user && (
            stored.user.id === u.id || 
            (stored.user.email && u.email && stored.user.email.toLowerCase() === u.email.toLowerCase())
          )
        );

        // Only adopt Cloud session if explicit OAuth redirect or matching stored authenticated session
        if (isOAuthRedirect || (stored.isAuthenticated && matchesStored)) {
          const avatar = stored.user?.avatar || (u.email ? getUserSavedAvatar(u.email) : null) || u.user_metadata?.avatar_url || undefined;
          const authUser: AuthUser = {
            id: u.id,
            username: stored.user?.username || u.user_metadata?.username || u.email?.split('@')[0],
            name: stored.user?.name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
            email: u.email || 'user@cloudDb.co',
            avatar,
            plan: 'Cloud Pro Plan',
          };
          setAuthSession({ isAuthenticated: true, user: authUser });
          saveAuthSession(authUser);
        }
      }
    });

    // 3. Listen to Cloud auth state changes
    const { data: authListener } = cloudDb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthView('reset-password');
        return;
      }

      if (event === 'SIGNED_OUT') {
        // Only log out if current active session was purely a Cloud session without local credentials
        const stored = getStoredAuthSession();
        if (stored.user && !stored.user.username && stored.user.plan === 'Cloud Pro Plan') {
          clearAuthSession();
          setAuthSession({ isAuthenticated: false, user: null });
        }
        return;
      }

      if (session?.user && event === 'SIGNED_IN') {
        const stored = getStoredAuthSession();
        const u = session.user;
        const isOAuthRedirect = window.location.hash.includes('access_token') || window.location.search.includes('code=');
        const matchesStored = Boolean(
          stored.user && (
            stored.user.id === u.id || 
            (stored.user.email && u.email && stored.user.email.toLowerCase() === u.email.toLowerCase())
          )
        );

        if (isOAuthRedirect || (stored.isAuthenticated && matchesStored)) {
          const avatar = stored.user?.avatar || (u.email ? getUserSavedAvatar(u.email) : null) || u.user_metadata?.avatar_url || undefined;
          const authUser: AuthUser = {
            id: u.id,
            username: stored.user?.username || u.user_metadata?.username || u.email?.split('@')[0],
            name: stored.user?.name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
            email: u.email || 'user@cloudDb.co',
            avatar,
            plan: 'Cloud Pro Plan',
          };
          setAuthSession({ isAuthenticated: true, user: authUser });
          saveAuthSession(authUser);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch Cloud cloud tasks (strictly isolated to the active user)
  useEffect(() => {
    if (!authSession.isAuthenticated || !activeUserId) return;

    let isCancelled = false;
    const currentTargetKey = userKey;

    syncCategoriesToSupabase(activeUserId);
    fetchTasksFromSupabase(activeUserId, activeUserEmail).then(({ tasks: cloudTasks }) => {
      if (isCancelled) return;

      setTasks((currentTasks) => {
        if (isCancelled) return currentTasks;

        if (cloudTasks && Array.isArray(cloudTasks)) {
          if (cloudTasks.length > 0) {
            // Strictly check local storage for THIS account to avoid cross-polluting from another user
            const accountLocalTasks = loadTasksFromStorage(currentTargetKey) || [];
            const cloudIds = new Set(cloudTasks.map((t) => t.id));
            const unsyncedLocal = accountLocalTasks.filter((t) => !cloudIds.has(t.id));
            if (unsyncedLocal.length > 0) {
              syncAllTasksToSupabase(unsyncedLocal, activeUserId, activeUserEmail);
              return [...cloudTasks, ...unsyncedLocal];
            }
            return cloudTasks;
          } else {
            // Cloud has 0 tasks for this account
            const localStored = loadTasksFromStorage(currentTargetKey);
            if (!localStored || localStored.length === 0) {
              return []; // 0 tasks for new or empty account
            }
            if (localStored.length > 0) {
              syncAllTasksToSupabase(localStored, activeUserId, activeUserEmail);
            }
            return localStored;
          }
        }
        return currentTasks;
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [authSession.isAuthenticated, activeUserId, activeUserEmail, userKey]);

  // Derived Task Statistics
  const stats = useMemo(() => calculateTaskStats(tasks), [tasks]);

  // Compute navigation badge counts
  const taskCounts = useMemo(() => {
    const todayStr = getTodayDateString();
    const categories: Record<TaskCategory, number> = {
      personal: 0,
      school: 0,
      work: 0,
      other: 0,
    };

    let todayCount = 0;
    let upcomingCount = 0;

    for (const t of tasks) {
      if (!t.completed) {
        if (t.category in categories) {
          categories[t.category]++;
        }
        if (t.dueDate === todayStr) {
          todayCount++;
        } else if (t.dueDate > todayStr) {
          upcomingCount++;
        }
      }
    }

    return {
      total: stats.total,
      pending: stats.pending,
      today: todayCount,
      upcoming: upcomingCount,
      completed: stats.completed,
      categories,
    };
  }, [tasks, stats]);

  // Page title mapping based on active navigation view
  const pageTitle = useMemo(() => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard';
      case 'tasks':
        return 'My Tasks';
      case 'today':
        return "Today's Tasks";
      case 'upcoming':
        return 'Upcoming Tasks';
      case 'completed':
        return 'Completed Tasks';
      case 'category-personal':
        return 'Personal Tasks';
      case 'category-school':
        return 'School & Learning';
      case 'category-work':
        return 'Work & Projects';
      case 'category-other':
        return 'Other Tasks';
      case 'settings':
        return 'Settings';
      default:
        return 'TodoList';
    }
  }, [currentView]);

  // --- Handlers for Authentication Operations ---

  const handleLoginSuccess = (user: AuthUser) => {
    const key = (user.username || user.id).trim().toLowerCase();
    lastActiveUserRef.current = key;
    const stored = loadTasksFromStorage(key);
    setTasks(stored && Array.isArray(stored) && stored.length > 0 ? stored : []);
    saveAuthSession(user);
    setAuthSession({ isAuthenticated: true, user });
  };

  const handleRegisterSuccess = (user: AuthUser) => {
    const key = (user.username || user.id).trim().toLowerCase();
    // Guaranteed 0 tasks for newly registered account!
    lastActiveUserRef.current = key;
    saveTasksToStorage([], key);
    saveTasksToStorage([], user.id);
    saveTasksToStorage([], 'guest_user');
    setTasks([]);
    saveAuthSession(user);
    setAuthSession({ isAuthenticated: true, user });
    showToast('Account created successfully! Welcome to your clean workspace.', 'success');
  };

  const handleLogout = () => {
    // 1. Instant save of current user's tasks
    if (authSession.isAuthenticated && userKey && userKey !== 'guest_user') {
      saveTasksToStorage(tasks, userKey);
    }

    // 2. Remember username for easy re-login, clear auth session and reset view
    if (authSession.user?.username) {
      try {
        localStorage.setItem('todolist_remembered_identifier', authSession.user.username);
      } catch {}
    }
    clearAuthSession();
    setAuthSession({ isAuthenticated: false, user: null });
    setIsLogoutConfirmOpen(false);
    setAuthView('login');

    // 3. Clear memory and guest storage so next user or new account starts with 0 tasks
    lastActiveUserRef.current = 'guest_user';
    setTasks([]);
    saveTasksToStorage([], 'guest_user');

    // 4. Background cloud sync & Cloud sign out
    if (authSession.isAuthenticated && tasks && tasks.length > 0 && activeUserId) {
      syncAllTasksToSupabase(tasks, activeUserId, activeUserEmail).catch(() => {});
    }
    cloudDb.auth.signOut().catch(() => {});
    cloudDbSignOut().catch(() => {});

    // 5. Clean up any Cloud browser auth tokens to avoid cross-account leakage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  };

  // --- Handlers for Task Operations ---

  // Open Create Task modal (optionally pre-selected category)
  const handleOpenCreateTask = (defaultCategory?: TaskCategory) => {
    if (defaultCategory) {
      setTaskToEdit({
        id: '',
        title: '',
        description: '',
        category: defaultCategory,
        priority: 'medium',
        dueDate: getTodayDateString(),
        completed: false,
        createdAt: '',
        updatedAt: '',
      });
    } else {
      setTaskToEdit(null);
    }
    setIsTaskModalOpen(true);
  };

  // Open Edit Task modal
  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  // Save new or edited task
  const handleSaveTask = (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    const nowISO = new Date().toISOString();

    if (taskData.id) {
      // Editing existing task
      let updatedTaskObj: Task | null = null;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskData.id) {
            updatedTaskObj = {
              ...t,
              title: taskData.title,
              description: taskData.description,
              category: taskData.category,
              priority: taskData.priority,
              dueDate: taskData.dueDate,
              dueTime: taskData.dueTime,
              completed: taskData.completed,
              updatedAt: nowISO,
            };
            return updatedTaskObj;
          }
          return t;
        })
      );
      const targetUser = activeUserId || authSession.user?.username || 'guest_user';
      if (updatedTaskObj) {
        saveTaskToSupabase(updatedTaskObj, targetUser, activeUserEmail);
      }
      showToast('Task updated successfully.');
    } else {
      // Creating new task
      const newTask: Task = {
        id: generateUuid(),
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime,
        completed: false,
        createdAt: nowISO,
        updatedAt: nowISO,
      };
      setTasks((prev) => [newTask, ...prev]);
      if (authSession.isAuthenticated && activeUserId) {
        saveTaskToSupabase(newTask, activeUserId, activeUserEmail);
      }
      showToast('Task created successfully.', 'success');
    }
  };

  // Toggle task completion (prompts confirmation when marking as completed)
  const handleToggleComplete = (id: string) => {
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;

    if (!targetTask.completed) {
      // Show great celebratory confirmation modal
      setTaskToComplete(targetTask);
    } else {
      // Revert from completed back to pending directly
      const targetUser = activeUserId || authSession.user?.username || 'guest_user';
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            const updatedTask = {
              ...t,
              completed: false,
              updatedAt: new Date().toISOString(),
            };
            if (authSession.isAuthenticated && activeUserId) {
              saveTaskToSupabase(updatedTask, activeUserId, activeUserEmail);
            }
            return updatedTask;
          }
          return t;
        })
      );
      showToast('Task restored to pending.', 'info');
    }
  };

  // Confirm task completion from CompleteConfirmModal
  const handleConfirmComplete = () => {
    if (!taskToComplete) return;
    const id = taskToComplete.id;
    const targetUser = activeUserId || authSession.user?.username || 'guest_user';
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updatedTask = {
            ...t,
            completed: true,
            updatedAt: new Date().toISOString(),
          };
          if (authSession.isAuthenticated && activeUserId) {
            saveTaskToSupabase(updatedTask, activeUserId, activeUserEmail);
          }
          return updatedTask;
        }
        return t;
      })
    );
    showToast('🎉 Awesome! Task marked as completed.', 'success');
    setTaskToComplete(null);
  };

  // Trigger Delete confirmation modal
  const handlePromptDeleteTask = (task: Task) => {
    setTaskToDelete(task);
  };

  // Confirm delete task
  const handleConfirmDelete = () => {
    if (!taskToDelete) return;
    const idToDelete = taskToDelete.id;
    setTasks((prev) => prev.filter((t) => t.id !== idToDelete));
    if (authSession.isAuthenticated && activeUserId) {
      deleteTaskFromSupabase(idToDelete, activeUserId, activeUserEmail);
    }
    showToast('Task deleted successfully.', 'warning');
    setTaskToDelete(null);
  };

  // Clear all completed tasks
  const handleClearAllCompleted = () => {
    const completedTasks = tasks.filter((t) => t.completed);
    const count = completedTasks.length;
    setTasks((prev) => prev.filter((t) => !t.completed));
    if (authSession.isAuthenticated && activeUserId && completedTasks.length > 0) {
      completedTasks.forEach((t) => deleteTaskFromSupabase(t.id, activeUserId, activeUserEmail));
    }
    showToast(`Cleared ${count} completed task${count === 1 ? '' : 's'}.`);
  };

  // Clear all tasks
  const handleClearAllTasks = () => {
    const allIds = tasks.map((t) => t.id);
    setTasks([]);
    if (authSession.isAuthenticated && activeUserId && allIds.length > 0) {
      allIds.forEach((id) => deleteTaskFromSupabase(id, activeUserId, activeUserEmail));
    }
    showToast('All tasks cleared.', 'warning');
  };

  // Import tasks
  const handleImportTasks = (importedTasks: Task[]) => {
    setTasks(importedTasks);
    if (activeUserId && importedTasks.length > 0) {
      syncAllTasksToSupabase(importedTasks, activeUserId, activeUserEmail);
    }
    showToast(`Imported ${importedTasks.length} tasks successfully.`);
  };

  // 8. If user is NOT authenticated, display the Authentication flow
  if (!authSession.isAuthenticated) {
    const authHeaders: Record<AuthView, { heading: string; subtitle: string }> = {
      login: {
        heading: 'Welcome Back!',
        subtitle: 'Log in to your account and continue your journey.',
      },
      register: {
        heading: 'Create an Account',
        subtitle: 'Start your journey and achieve more with Lift.',
      },
      'forgot-password': {
        heading: 'Reset Password',
        subtitle: "Enter your email and we'll help you reset your password.",
      },
      'reset-password': {
        heading: 'Create New Password',
        subtitle: 'Choose a secure password for your Lift account.',
      },
    };

    const currentHeader = authHeaders[authView];

    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120]">
        <AuthLayout
          heading={currentHeader.heading}
          subtitle={currentHeader.subtitle}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          currentView={authView}
          onNavigateAuth={setAuthView}
        >
          {authView === 'login' && (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigateAuth={setAuthView}
            />
          )}

          {authView === 'register' && (
            <RegisterPage
              onRegisterSuccess={handleRegisterSuccess}
              onNavigateAuth={setAuthView}
            />
          )}

          {authView === 'forgot-password' && (
            <ForgotPasswordPage
              onNavigateAuth={setAuthView}
            />
          )}

          {authView === 'reset-password' && (
            <ResetPasswordPage
              onNavigateAuth={setAuthView}
            />
          )}
        </AuthLayout>

        {/* Floating Toast Notification during authentication */}
        <Toast
          toast={toast}
          onDismiss={() => setToast(null)}
        />
      </div>
    );
  }

  // 9. When user IS authenticated, display the main TodoList Dashboard & Workspace
  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#0B1310] text-[#0F172A] dark:text-[#F1F5F9] flex flex-col md:flex-row transition-colors">
      {/* 1. Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        currentUser={authSession.user}
        onLogoutClick={() => setIsLogoutConfirmOpen(true)}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        taskCounts={taskCounts}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Top Header */}
        <Header
          pageTitle={pageTitle}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q && currentView !== 'tasks') {
              setCurrentView('tasks');
            }
          }}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenCreateTask={() => handleOpenCreateTask()}
          currentUser={authSession.user}
          onLogoutClick={handleLogout}
          onNavigateSettings={() => setCurrentView('settings')}
          onOpenEditProfile={() => setIsEditProfileOpen(true)}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          pendingCount={stats.pending}
          overdueCount={stats.overdue}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              stats={stats}
              onOpenCreateTask={() => handleOpenCreateTask()}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              onDeleteTask={handlePromptDeleteTask}
              onNavigate={(v) => setCurrentView(v)}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              onTriggerSync={handleTriggerCloudSync}
            />
          )}

          {currentView === 'tasks' && (
            <TasksView
              tasks={tasks}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenCreateTask={() => handleOpenCreateTask()}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              onDeleteTask={handlePromptDeleteTask}
            />
          )}

          {currentView === 'today' && (
            <TodayView
              tasks={tasks}
              onOpenCreateTask={() => handleOpenCreateTask()}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              onDeleteTask={handlePromptDeleteTask}
            />
          )}

          {currentView === 'upcoming' && (
            <UpcomingView
              tasks={tasks}
              onOpenCreateTask={() => handleOpenCreateTask()}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              onDeleteTask={handlePromptDeleteTask}
            />
          )}

          {currentView === 'completed' && (
            <CompletedView
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              onDeleteTask={handlePromptDeleteTask}
              onClearAllCompleted={handleClearAllCompleted}
            />
          )}

          {currentView === 'category-personal' && (
            <CategoryView
              category="personal"
              tasks={tasks}
              onOpenCreateTask={(cat) => handleOpenCreateTask(cat)}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              onDeleteTask={handlePromptDeleteTask}
            />
          )}

          {currentView === 'category-school' && (
            <CategoryView
              category="school"
              tasks={tasks}
              onOpenCreateTask={(cat) => handleOpenCreateTask(cat)}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              onDeleteTask={handlePromptDeleteTask}
            />
          )}

          {currentView === 'category-work' && (
            <CategoryView
              category="work"
              tasks={tasks}
              onOpenCreateTask={(cat) => handleOpenCreateTask(cat)}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              onDeleteTask={handlePromptDeleteTask}
            />
          )}

          {currentView === 'category-other' && (
            <CategoryView
              category="other"
              tasks={tasks}
              onOpenCreateTask={(cat) => handleOpenCreateTask(cat)}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              onDeleteTask={handlePromptDeleteTask}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode(!isDarkMode)}
              tasks={tasks}
              onClearAllTasks={handleClearAllTasks}
              onImportTasks={handleImportTasks}
              currentUser={authSession.user}
              onUpdateProfile={handleUpdateProfile}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              onTriggerSync={handleTriggerCloudSync}
            />
          )}
        </main>
      </div>

      {/* 3. Task Creation & Editing Modal Dialog */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
      />

      {/* 4. Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={Boolean(taskToDelete)}
        task={taskToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />

      {/* 4.5 Complete Task Confirmation Dialog */}
      <CompleteConfirmModal
        isOpen={Boolean(taskToComplete)}
        task={taskToComplete}
        onConfirm={handleConfirmComplete}
        onCancel={() => setTaskToComplete(null)}
      />

      {/* 5. Logout Confirmation Dialog */}
      <LogoutConfirmModal
        isOpen={isLogoutConfirmOpen}
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />

      {/* 6. Edit Profile Modal Dialog */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={authSession.user}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* 7. Cloud Workspace Sync Inspector Modal */}
      <CloudSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        tasks={tasks}
        currentUser={authSession.user}
        onShowToast={showToast}
        onSyncComplete={(cloudTasks) => setTasks(cloudTasks)}
      />

      {/* 8. Toast Feedback Notifications */}
      <Toast
        toast={toast}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
