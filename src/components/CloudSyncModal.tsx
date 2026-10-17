/**
 * @file src/components/CloudSyncModal.tsx
 * @description Cloud Database Inspector and Sync Dialog for Supabase.
 * Allows users to inspect live connection status, table health (tasks, categories, profiles),
 * trigger instant manual syncs, and view raw records stored in Supabase.
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Cloud, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  Check, 
  ShieldCheck, 
  ExternalLink,
  Layers,
  Calendar,
  AlertCircle,
  Bell
} from 'lucide-react';
import { Task, AuthUser } from '../types';
import { getSupabaseSyncStats, syncAllTasksToSupabase, fetchTasksFromSupabase, seedNotificationsForUser, SupabaseSyncStats } from '../services/cloudDbService';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  currentUser: AuthUser | null;
  onSyncComplete?: (cloudTasks: Task[]) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  tasks,
  currentUser,
  onSyncComplete,
  onShowToast,
}) => {
  const [stats, setStats] = useState<SupabaseSyncStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await getSupabaseSyncStats(currentUser?.username || currentUser?.id, currentUser?.email);
      setStats(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAllTasksToSupabase(
        tasks, 
        currentUser?.username || currentUser?.id, 
        currentUser?.email
      );

      if (res.success) {
        onShowToast(`Successfully synced ${res.syncedCount} tasks to Cloud Workspace!`, 'success');
        await loadStats();
      } else {
        onShowToast(res.error || 'Failed to sync with Supabase', 'error');
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Sync error', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsLoading(true);
    try {
      const res = await fetchTasksFromSupabase(
        currentUser?.username || currentUser?.id,
        currentUser?.email
      );
      if (res.tasks && res.tasks.length > 0) {
        if (onSyncComplete) onSyncComplete(res.tasks);
        onShowToast(`Pulled ${res.tasks.length} tasks from Supabase!`, 'success');
      } else {
        onShowToast('No additional tasks found in Cloud for your profile.', 'info');
      }
      await loadStats();
    } catch {
      onShowToast('Could not fetch tasks from cloud.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await seedNotificationsForUser(
        currentUser?.username || currentUser?.id,
        currentUser?.email
      );
      if (res.success) {
        onShowToast(`Successfully seeded ${res.count} notification records to Supabase!`, 'success');
        await loadStats();
      } else {
        onShowToast(res.error || 'Failed to seed notifications', 'error');
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Error seeding notifications', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-4 ring-emerald-500/10">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Cloud Workspace Database</span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Connected</span>
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                PostgreSQL Cloud Instance • Real-time Sync Active
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Connection Overview Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 dark:from-emerald-950/30 dark:via-neutral-900 dark:to-neutral-900 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">Instance URL:</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[280px]">
                {stats?.projectUrl || 'ojflxeuxfsvmvqiljxve.cloudDb.co'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">Connected User Profile:</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {currentUser?.name || currentUser?.username || 'User'} ({currentUser?.email || (currentUser?.username ? `${currentUser.username.toLowerCase()}@tasks.app` : 'user@tasks.app')})
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-100 dark:border-emerald-900/40">
              <span className="text-neutral-500 dark:text-neutral-400">Last Synced Check:</span>
              <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                {stats?.lastSyncedAt || 'Just now'}
              </span>
            </div>
          </div>

          {/* Database Tables Health Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              PostgreSQL Tables in Supabase
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* tasks table */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">public.tasks</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums">
                  {stats ? stats.tasksCount : '...'}
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Tasks stored in Cloud
                </div>
              </div>

              {/* categories table */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">public.categories</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums">
                  {stats ? stats.categoriesCount : '...'}
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Categories configured
                </div>
              </div>

              {/* profiles table */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">public.profiles</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl font-bold text-neutral-900 dark:text-white font-mono">
                  Active
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Profile schema verified
                </div>
              </div>

              {/* notifications table */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 space-y-1 sm:col-span-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    <span>public.notifications</span>
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl font-bold text-neutral-900 dark:text-white font-mono tabular-nums">
                  {stats ? stats.notificationsCount : '...'}
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Notification records stored in Cloud cloud
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Tasks Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Live Cloud Workspace Tasks</span>
              </h4>
              <button
                type="button"
                onClick={loadStats}
                disabled={isLoading}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Status</span>
              </button>
            </div>

            {stats?.recentTasks && stats.recentTasks.length > 0 ? (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 overflow-hidden">
                {stats.recentTasks.map((t) => (
                  <div key={t.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        t.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <span className="font-semibold text-neutral-900 dark:text-white truncate">
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                        t.priority === 'high' 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {t.priority}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-neutral-500 text-xs space-y-1">
                <Cloud className="w-6 h-6 mx-auto text-neutral-400" />
                <p>No tasks uploaded to Cloud cloud yet for this profile.</p>
                <p className="text-[11px] text-neutral-400">Click &ldquo;Sync All Tasks Now&rdquo; below to upload your local tasks!</p>
              </div>
            )}
          </div>

          {/* Explanation Card: Why Reminders & Notifications both exist */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Why both Reminders and Notifications in Supabase?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
              <strong className="text-emerald-950 dark:text-emerald-100">Reminders (`public.reminders`)</strong> store timed alarms and scheduled delivery channels (Push, Email, In-App, SMS) before task deadlines. <strong className="text-emerald-950 dark:text-emerald-100">Notifications (`public.notifications`)</strong> store user-facing feed items and read/unread history for your in-app notification center.
            </p>
          </div>

          {/* Cloud Reminders Records Preview */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Cloud Reminders Records ({stats?.recentReminders?.length || 0})</span>
            </h4>

            {stats?.recentReminders && stats.recentReminders.length > 0 ? (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 overflow-hidden">
                {stats.recentReminders.map((r) => (
                  <div key={r.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 dark:text-white truncate">
                          Reminder for Task ({r.channel.toUpperCase()})
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          Scheduled: {new Date(r.remind_at).toLocaleString()} | Snoozed: {r.snooze_count}x
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        r.is_sent 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {r.is_sent ? 'Sent' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-neutral-500 text-xs">
                No reminder records found in Cloud cloud for this profile.
              </div>
            )}
          </div>

          {/* Cloud Notifications Records Preview */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                <span>Cloud Notification Records ({stats?.recentNotifications?.length || 0})</span>
              </h4>
              <button
                type="button"
                onClick={handleSeedNotifications}
                disabled={isLoading}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Bell className="w-3 h-3" />
                <span>Seed Notifications</span>
              </button>
            </div>

            {stats?.recentNotifications && stats.recentNotifications.length > 0 ? (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 overflow-hidden">
                {stats.recentNotifications.map((n) => (
                  <div key={n.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 dark:text-white truncate">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[280px]">
                          {n.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                        {n.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-neutral-500 text-xs space-y-2">
                <p>No notification records found in Cloud cloud for this profile (0 notifications).</p>
                <p className="text-[11px] text-neutral-400">Click &ldquo;Seed Notifications&rdquo; above to automatically create and sync sample notification records to your Cloud table.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60">
          <button
            type="button"
            onClick={handlePullFromCloud}
            disabled={isLoading || isSyncing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Pull From Cloud</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Syncing to Supabase...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Sync All Tasks to Cloud Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
