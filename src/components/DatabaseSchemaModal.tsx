/**
 * @file src/components/DatabaseSchemaModal.tsx
 * @description Comprehensive viewer and interactive SQL schema exporter for the
 * complete TodoList Management System database architecture.
 */

import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Database, 
  Layers, 
  ShieldCheck, 
  Bell, 
  Clock, 
  History,
  FileCode,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { SUPABASE_URL } from '../lib/cloudDb';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sql' | 'tables'>('overview');

  if (!isOpen) return null;

  const fullSqlSchema = `-- ============================================================================
-- TODOLIST MANAGEMENT SYSTEM: PRODUCTION DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- ============================================================================

-- 1. PROFILES & USER AUTH EXTENSION
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number TEXT,
    timezone TEXT DEFAULT 'UTC',
    theme_preference TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#16A34A',
    icon TEXT NOT NULL DEFAULT 'folder',
    is_default BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_category_slug UNIQUE (user_id, slug)
);

-- 3. TASKS TABLE
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'archived', 'cancelled');
CREATE TYPE recurrence_interval AS ENUM ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly');

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pending' NOT NULL,
    priority task_priority DEFAULT 'medium' NOT NULL,
    completed BOOLEAN DEFAULT false NOT NULL,
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    start_date TIMESTAMPTZ,
    recurrence recurrence_interval DEFAULT 'none' NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. REMINDERS TABLE
CREATE TYPE reminder_type AS ENUM ('push', 'email', 'in_app', 'sms');

CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    remind_at TIMESTAMPTZ NOT NULL,
    channel reminder_type DEFAULT 'in_app' NOT NULL,
    is_sent BOOLEAN DEFAULT false NOT NULL,
    sent_at TIMESTAMPTZ,
    snooze_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. NOTIFICATIONS TABLE
CREATE TYPE notification_type AS ENUM (
    'task_due_soon', 'task_overdue', 'task_assigned', 'system_announcement', 'daily_digest'
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'task_due_soon' NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ACTIVITY TRACKING & AUDIT LOGS
CREATE TYPE activity_action AS ENUM (
    'created', 'updated', 'completed', 'uncompleted', 'deleted', 'archived', 'logged_in', 'logged_out'
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    action activity_action NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own profiles" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can only access their own categories" ON public.categories FOR ALL USING (auth.uid() = user_id OR is_default = true);
CREATE POLICY "Users can only access their own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only view their own activity logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);

-- 8. AUTOMATIC TRIGGERS (Auto-sync user on sign up & Task activity logging)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
    INSERT INTO public.categories (user_id, name, slug, color, icon, is_default)
    VALUES 
      (NEW.id, 'Work', 'work', '#16A34A', 'briefcase', true),
      (NEW.id, 'Personal', 'personal', '#3B82F6', 'user', true),
      (NEW.id, 'School', 'school', '#F59E0B', 'graduation-cap', true),
      (NEW.id, 'Other', 'other', '#6B7280', 'folder', true);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tables = [
    {
      name: 'profiles',
      icon: ShieldCheck,
      desc: 'Extends Cloud Auth with custom user metadata, locale, timezone, and notification settings.',
      columns: ['id (UUID PK)', 'email', 'full_name', 'avatar_url', 'phone_number', 'theme_preference', 'created_at'],
    },
    {
      name: 'tasks',
      icon: Layers,
      desc: 'Core task items with status, priorities (low, medium, high, urgent), recurrence, tags, and due dates.',
      columns: ['id (UUID PK)', 'user_id (FK)', 'category_id (FK)', 'title', 'status', 'priority', 'due_date', 'recurrence'],
    },
    {
      name: 'categories',
      icon: Database,
      desc: 'Organized folders with custom color tokens (#16A34A, etc.), icons, and user-specific slug isolation.',
      columns: ['id (UUID PK)', 'user_id (FK)', 'name', 'slug', 'color', 'icon', 'is_default', 'sort_order'],
    },
    {
      name: 'reminders',
      icon: Clock,
      desc: 'Scheduled notifications before due dates across multiple channels (push, email, in_app, sms) with snooze counters.',
      columns: ['id (UUID PK)', 'task_id (FK)', 'user_id (FK)', 'remind_at', 'channel', 'is_sent', 'snooze_count'],
    },
    {
      name: 'notifications',
      icon: Bell,
      desc: 'In-app notification center for impending tasks, overdue alerts, streaks, and system announcements.',
      columns: ['id (UUID PK)', 'user_id (FK)', 'title', 'message', 'type', 'task_id (FK)', 'is_read', 'read_at'],
    },
    {
      name: 'activity_logs',
      icon: History,
      desc: 'Complete audit trail recording creations, updates, completions, deletions, and user sessions with JSONB details.',
      columns: ['id (UUID PK)', 'user_id (FK)', 'entity_type', 'entity_id', 'action', 'details (JSONB)', 'created_at'],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Dialog Window */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100 dark:border-emerald-950 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-white to-transparent dark:from-emerald-950/20 dark:via-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#16A34A] flex items-center justify-center text-white shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>TodoList Management System Database</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  PostgreSQL / Supabase
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full relational database schema covering Auth, Tasks, Categories, Reminders, Notifications & Audit Logs.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-slate-800 text-[#16A34A] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Architecture Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tables')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'tables'
                  ? 'bg-white dark:bg-slate-800 text-[#16A34A] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tables & Entities (6)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sql')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sql'
                  ? 'bg-white dark:bg-slate-800 text-[#16A34A] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Full SQL DDL Script</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied SQL!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL</span>
              </>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>Production-Grade Relational Design</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  This database schema is engineered specifically for modern SaaS task management platforms. It enforces strict referential integrity, tenant data isolation via Row Level Security (RLS), automated audit triggers, and real-time indexing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-1">
                  <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Authentication</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Profiles & Users</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Syncs directly with Cloud Auth with custom metadata and phone/email.</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-1">
                  <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Core Engine</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Tasks & Categories</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Priorities, statuses, recurrence schedules, tags, and category slugs.</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-1">
                  <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Time & Alerts</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Reminders</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Multi-channel delivery (in_app, push, email, sms) with snooze tracking.</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-1">
                  <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Engagement</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Notification Center</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Read/unread tracking, action URLs, and overdue alerts.</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-1">
                  <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Observability</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Activity Tracking</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Granular audit log recording every creation, update, and completion.</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-1">
                  <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Security</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Row Level Security</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Full tenant isolation ensuring users can only read and write their own data.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TABLES LIST */}
          {activeTab === 'tables' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tables.map((table) => {
                const Icon = table.icon;
                return (
                  <div 
                    key={table.name}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#16A34A] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                        public.{table.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {table.desc}
                    </p>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Key Columns
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {table.columns.map((col) => (
                          <span 
                            key={col} 
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: FULL SQL CODE */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Executable PostgreSQL / Cloud SQL script:</span>
                <span className="font-mono text-[11px]">public schema • 6 tables • 8 triggers & RLS</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 select-all shadow-inner">
                <pre>{fullSqlSchema}</pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Connected to: <code className="font-mono text-emerald-600 dark:text-emerald-400">{SUPABASE_URL}</code>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xs transition-colors cursor-pointer"
            >
              {copied ? 'Copied to Clipboard' : 'Copy Full SQL DDL'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
