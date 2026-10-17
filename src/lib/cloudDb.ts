/**
 * @file src/lib/cloudDb.ts
 * @description Official Cloud Client initialization for TaskFlow.
 * Connected to project: ojflxeuxfsvmvqiljxve.cloudDb.co
 * 
 * Includes:
 * - Browser Cloud Client (using anon public API key) for client-side Auth, Sessions, and Storage
 * - Service Role Client (for administrative operations, schema synchronization, and elevated tasks)
 */

import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch {
    // ignore
  }
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch {
    // ignore
  }
  return undefined;
};

export const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL') || 'https://ojflxeuxfsvmvqiljxve.supabase.co';

export const SUPABASE_ANON_KEY =
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmx4ZXV4ZnN2bXZxaWxqeHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMjIxMzAsImV4cCI6MjEwNTg5ODEzMH0.FKxIhRhQIEe2yesiguQEUrY_MMYELCD0yXpazFjDOnA';

export const SUPABASE_SERVICE_ROLE_KEY =
  getEnvVar('SUPABASE_SERVICE_ROLE_KEY') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmx4ZXV4ZnN2bXZxaWxqeHZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDMyMjEzMCwiZXhwIjoyMTA1ODk4MTMwfQ.YBh_YkaIvN-gqYQ0Qx0ojOnNzdoDo35pMGNbg_9mONc';

/**
 * Standard Cloud client for user authentication, real-time listeners, and table queries
 */
export const cloudDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Service role client for database administration (bypasses RLS)
 */
export const cloudDbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
