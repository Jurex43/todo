-- ============================================================================
-- TODOLIST MANAGEMENT SYSTEM: PRODUCTION DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- ============================================================================
-- Modules included:
-- 1. User Profiles & Authentication Synchronization (auth.users extension)
-- 2. Categories Management (custom colors, icons, user-specific & defaults)
-- 3. Tasks Management (rich attributes, priorities, recurring, status)
-- 4. Reminders & Scheduling (due date triggers, snooze, channels)
-- 5. Notifications System (read/unread, action links, priority)
-- 6. Audit & Activity Tracking Logs (task history, status transitions, IP/metadata)
-- 7. Row Level Security (RLS) Policies (multi-tenant isolation)
-- 8. Stored Procedures, Automation Triggers & Views
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USERS & PROFILES TABLE
-- ============================================================================
-- Extends Cloud native auth.users with app-specific profile attributes
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number TEXT,
    timezone TEXT DEFAULT 'UTC',
    locale TEXT DEFAULT 'en-US',
    theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    email_notifications_enabled BOOLEAN DEFAULT true,
    push_notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================================================
-- 2. CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#16A34A', -- Emerald green default
    icon TEXT NOT NULL DEFAULT 'folder',
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_category_slug UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- ============================================================================
-- 3. TASKS TABLE
-- ============================================================================
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
    estimated_minutes INT,
    recurrence recurrence_interval DEFAULT 'none' NOT NULL,
    sort_order INT DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Performance indices for fast task filtering and dashboard analytics
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON public.tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

-- ============================================================================
-- 4. REMINDERS TABLE
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON public.reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_unprocessed ON public.reminders(remind_at) WHERE is_sent = false;

-- ============================================================================
-- 5. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TYPE notification_type AS ENUM (
    'task_due_soon',
    'task_overdue',
    'task_assigned',
    'system_announcement',
    'daily_digest',
    'streak_milestone'
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

-- ============================================================================
-- 6. ACTIVITY TRACKING & AUDIT LOGS TABLE
-- ============================================================================
CREATE TYPE activity_action AS ENUM (
    'created',
    'updated',
    'completed',
    'uncompleted',
    'deleted',
    'archived',
    'priority_changed',
    'due_date_changed',
    'logged_in',
    'logged_out'
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'task', 'category', 'reminder', 'user'
    entity_id UUID,
    action activity_action NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_recent ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 7.1 Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 7.2 Categories policies
CREATE POLICY "Users can view their own categories"
    ON public.categories FOR SELECT
    USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can insert their own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id AND is_default = false);

-- 7.3 Tasks policies
CREATE POLICY "Users can view their own tasks"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);

-- 7.4 Reminders policies
CREATE POLICY "Users can manage their own reminders"
    ON public.reminders FOR ALL
    USING (auth.uid() = user_id);

-- 7.5 Notifications policies
CREATE POLICY "Users can view and update their own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id);

-- 7.6 Activity logs policies
CREATE POLICY "Users can view their own activity history"
    ON public.activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can record activities"
    ON public.activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 8. AUTOMATED TRIGGERS & PROCEDURES
-- ============================================================================

-- 8.1 Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8.2 Auto-create public.profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );

    -- Seed standard default categories for the new user
    INSERT INTO public.categories (user_id, name, slug, color, icon, is_default, sort_order)
    VALUES
        (NEW.id, 'Work', 'work', '#16A34A', 'briefcase', true, 1),
        (NEW.id, 'Personal', 'personal', '#3B82F6', 'user', true, 2),
        (NEW.id, 'School', 'school', '#F59E0B', 'graduation-cap', true, 3),
        (NEW.id, 'Other', 'other', '#6B7280', 'folder', true, 4);

    -- Log account creation activity
    INSERT INTO public.activity_logs (user_id, entity_type, entity_id, action, details)
    VALUES (
        NEW.id,
        'user',
        NEW.id,
        'created',
        jsonb_build_object('event', 'user_registered', 'email', NEW.email)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8.3 Auto-log Task lifecycle activities & update completion timestamps
CREATE OR REPLACE FUNCTION public.handle_task_activity_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.activity_logs (user_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.user_id,
            'task',
            NEW.id,
            'created',
            jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'due_date', NEW.due_date)
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Handle completion status toggle
        IF (OLD.completed IS DISTINCT FROM NEW.completed) THEN
            IF NEW.completed = true THEN
                NEW.completed_at = timezone('utc'::text, now());
                NEW.status = 'completed';
                INSERT INTO public.activity_logs (user_id, entity_type, entity_id, action, details)
                VALUES (NEW.user_id, 'task', NEW.id, 'completed', jsonb_build_object('title', NEW.title));
            ELSE
                NEW.completed_at = NULL;
                NEW.status = 'pending';
                INSERT INTO public.activity_logs (user_id, entity_type, entity_id, action, details)
                VALUES (NEW.user_id, 'task', NEW.id, 'uncompleted', jsonb_build_object('title', NEW.title));
            END IF;
        ELSE
            INSERT INTO public.activity_logs (user_id, entity_type, entity_id, action, details)
            VALUES (
                NEW.user_id,
                'task',
                NEW.id,
                'updated',
                jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'due_date', NEW.due_date)
            );
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.activity_logs (user_id, entity_type, entity_id, action, details)
        VALUES (
            OLD.user_id,
            'task',
            OLD.id,
            'deleted',
            jsonb_build_object('title', OLD.title)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_task_change_activity
    BEFORE INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_task_activity_log();

-- ============================================================================
-- 9. PRODUCTIVITY ANALYTICS VIEW
-- ============================================================================
CREATE OR REPLACE VIEW public.user_task_statistics AS
SELECT 
    p.id AS user_id,
    COUNT(t.id) AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.completed = true) AS completed_tasks,
    COUNT(t.id) FILTER (WHERE t.completed = false) AS pending_tasks,
    COUNT(t.id) FILTER (WHERE t.completed = false AND t.due_date < timezone('utc'::text, now())) AS overdue_tasks,
    CASE 
        WHEN COUNT(t.id) = 0 THEN 0 
        ELSE ROUND((COUNT(t.id) FILTER (WHERE t.completed = true)::decimal / COUNT(t.id)) * 100, 1) 
    END AS completion_rate_percentage
FROM public.profiles p
LEFT JOIN public.tasks t ON t.user_id = p.id
GROUP BY p.id;
