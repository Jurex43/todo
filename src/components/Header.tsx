/**
 * @file src/components/Header.tsx
 * @description Top header bar showing active page title, quick search input,
 * theme toggle, notifications indicator, and user profile avatar.
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Sun, 
  Moon, 
  Bell, 
  Menu, 
  Plus, 
  X,
  CheckCircle2,
  Clock,
  LogOut,
  Settings,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import defaultAvatar from '../assets/images/user_default_avatar.png';
import { AuthUser } from '../types';


interface HeaderProps {
  pageTitle: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenMobileMenu: () => void;
  onOpenCreateTask: () => void;
  currentUser: AuthUser | null;
  onLogoutClick: () => void;
  onNavigateSettings: () => void;
  onOpenEditProfile?: () => void;
  onOpenSupabaseModal?: () => void;
  pendingCount: number;
  overdueCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  searchQuery,
  onSearchChange,
  isDarkMode,
  onToggleTheme,
  onOpenMobileMenu,
  onOpenCreateTask,
  currentUser,
  onLogoutClick,
  onNavigateSettings,
  onOpenEditProfile,
  onOpenSupabaseModal,
  pendingCount,
  overdueCount,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'JD';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      {/* Left zone: Mobile toggle + Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 md:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {pageTitle}
        </h1>
      </div>

      {/* Right zone: Search bar, Add Task, Notification, Theme Toggle, Avatar */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Search Bar */}
        <div className="relative hidden sm:block w-48 md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-8 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-transparent focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Add Task button */}
        <button
          type="button"
          onClick={onOpenCreateTask}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all whitespace-nowrap cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Task</span>
        </button>

        {/* Notifications Popover Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className={`w-4 h-4 md:w-5 md:h-5 ${overdueCount > 0 ? 'animate-bell-ring text-amber-500 dark:text-amber-400' : ''}`} />
            {(overdueCount > 0 || pendingCount > 0) && (
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white dark:ring-neutral-900"></span>
              </span>
            )}
          </button>

          {/* Animated Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 p-3.5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 text-sm animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900 dark:text-white">Activity Status</span>
                  {(overdueCount > 0 || pendingCount > 0) && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      {overdueCount + pendingCount} active
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {overdueCount > 0 && (
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-rose-800 dark:text-rose-200 transition-transform hover:scale-[1.01]">
                    <Clock className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
                    <div>
                      <p className="font-bold">{overdueCount} task{overdueCount > 1 ? 's' : ''} overdue</p>
                      <p className="text-[11px] text-rose-600 dark:text-rose-300 mt-0.5">Please check your schedule to stay on track.</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-blue-800 dark:text-blue-200 transition-transform hover:scale-[1.01]">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                  <div>
                    <p className="font-bold">{pendingCount} pending task{pendingCount > 1 ? 's' : ''}</p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-300 mt-0.5">Ready to conquer your daily checklist!</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5 text-amber-400" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
        </button>

        {/* User Profile Menu Trigger & Popover */}
        <div className="relative pl-1 border-l border-neutral-200 dark:border-neutral-800" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="User account menu"
            aria-expanded={showProfileMenu}
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-1 ring-neutral-300 dark:ring-neutral-700 flex items-center justify-center shrink-0">
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
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white leading-tight">
                {currentUser?.name || 'John Doe'}
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {currentUser?.plan || 'Free Plan'}
              </span>
            </div>
            <ChevronDown className="hidden xl:block w-3.5 h-3.5 text-neutral-400" />
          </button>

          {/* Profile Popover Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header with Avatar, Name, Email */}
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-700 flex items-center justify-center shrink-0">
                  {currentUser?.avatar && currentUser.avatar.length > 0 ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser?.name || 'User'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <img src={defaultAvatar} alt="Default Avatar" className="w-7 h-7" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                    {currentUser?.name || 'My Account'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {currentUser?.username ? `@${currentUser.username}` : (currentUser?.email || 'Logged In')}
                  </p>
                </div>
              </div>

              {/* Menu items: Edit Profile, Settings, Logout */}
              <div className="p-2 space-y-1 text-xs">
                {onOpenEditProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenEditProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium">Edit Profile & Avatar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigateSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-neutral-400" />
                  <span>Account & Settings</span>
                </button>

                <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogoutClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
