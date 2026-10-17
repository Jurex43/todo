/**
 * @file src/components/Sidebar.tsx
 * @description Application sidebar containing the TodoList brand (#16A34A emerald theme),
 * primary navigation, category filters, settings link, and user profile card.
 */

import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  CalendarClock, 
  CheckCircle2, 
  User, 
  GraduationCap, 
  Briefcase, 
  Folder, 
  Settings, 
  Check, 
  X,
  LogOut
} from 'lucide-react';
import defaultAvatar from '../assets/images/user_default_avatar.png';
import { NavigationView, TaskCategory, AuthUser } from '../types';


interface SidebarProps {
  currentView: NavigationView;
  onSelectView: (view: NavigationView) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentUser: AuthUser | null;
  onLogoutClick: () => void;
  onOpenEditProfile?: () => void;
  taskCounts: {
    total: number;
    pending: number;
    today: number;
    upcoming: number;
    completed: number;
    categories: Record<TaskCategory, number>;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
  currentUser,
  onLogoutClick,
  onOpenEditProfile,
  taskCounts,
}) => {
  const mainNavItems = [
    {
      id: 'dashboard' as NavigationView,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'tasks' as NavigationView,
      label: 'My Tasks',
      icon: CheckSquare,
      badge: taskCounts.pending > 0 ? taskCounts.pending : null,
    },
    {
      id: 'today' as NavigationView,
      label: 'Today',
      icon: Calendar,
      badge: taskCounts.today > 0 ? taskCounts.today : null,
    },
    {
      id: 'upcoming' as NavigationView,
      label: 'Upcoming',
      icon: CalendarClock,
      badge: taskCounts.upcoming > 0 ? taskCounts.upcoming : null,
    },
    {
      id: 'completed' as NavigationView,
      label: 'Completed',
      icon: CheckCircle2,
      badge: taskCounts.completed > 0 ? taskCounts.completed : null,
    },
  ];

  const categoryItems = [
    {
      id: 'category-personal' as NavigationView,
      label: 'Personal',
      icon: User,
      count: taskCounts.categories.personal,
    },
    {
      id: 'category-school' as NavigationView,
      label: 'School',
      icon: GraduationCap,
      count: taskCounts.categories.school,
    },
    {
      id: 'category-work' as NavigationView,
      label: 'Work',
      icon: Briefcase,
      count: taskCounts.categories.work,
    },
    {
      id: 'category-other' as NavigationView,
      label: 'Other',
      icon: Folder,
      count: taskCounts.categories.other,
    },
  ];

  const handleItemClick = (view: NavigationView) => {
    onSelectView(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center filter drop-shadow-xs">
              <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sidebarLiftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="45%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
                <rect 
                  x="8" 
                  y="8" 
                  width="32" 
                  height="32" 
                  rx="9" 
                  transform="rotate(45 24 24)" 
                  fill="url(#sidebarLiftGrad)" 
                />
                <path 
                  d="M17 24.5L22 29.5L31 19" 
                  stroke="white" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Tasks
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg md:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Views */}
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`text-xs font-mono tabular-nums px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-900/60 text-[#2563EB] dark:text-blue-300 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Categories Section */}
          <div>
            <div className="px-3 mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Categories
              </h2>
            </div>
            <div className="space-y-1">
              {categoryItems.map((cat) => {
                const Icon = cat.icon;
                const isActive = currentView === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleItemClick(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-400'}`} />
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-400 dark:text-slate-500">
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferences & Logout */}
          <div className="space-y-1">
            <button
              onClick={() => handleItemClick('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                currentView === 'settings'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>

            {/* Sidebar -> Logout Option */}
            <button
              onClick={() => {
                onCloseMobile();
                onLogoutClick();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* User Profile Card at Bottom of Sidebar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              if (onOpenEditProfile) onOpenEditProfile();
            }}
            className="w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
            title="Click to edit profile & avatar"
          >
            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-blue-500/30 group-hover:ring-[#2563EB] flex items-center justify-center shrink-0 transition-all">
              {currentUser?.avatar && currentUser.avatar.length > 0 ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser?.name || 'User'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <img src={defaultAvatar} alt="Default Avatar" className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors">
                {currentUser?.name || 'My Account'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentUser?.username ? `@${currentUser.username}` : (currentUser?.email || 'Logged In')}
              </p>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
