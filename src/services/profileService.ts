/**
 * @file src/services/profileService.ts
 * @description Profile persistence and sync operations across LocalStorage and Supabase.
 */

import { cloudDb } from '../lib/cloudDb';
import { AuthUser } from '../types';
import { getRegisteredUsers, USERS_DB_KEY, saveAuthSession, setUserSavedAvatar } from '../utils/authHelpers';

export async function updateUserProfile(
  oldUser: AuthUser,
  updatedUser: AuthUser
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Update in LocalStorage registered users database
    const users = getRegisteredUsers();
    const oldUsername = (oldUser.username || '').toLowerCase();
    const newUsername = (updatedUser.username || '').toLowerCase();
    let isFound = false;

    const updatedList = users.map((u) => {
      const match = (u.username && u.username.toLowerCase() === oldUsername) || 
                    (u.email && u.email.toLowerCase() === oldUser.email.toLowerCase()) ||
                    (oldUser.id && u.id && u.id === oldUser.id);
      if (match) {
        isFound = true;
        return {
          ...u,
          id: updatedUser.id || u.id,
          username: updatedUser.username || u.username,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar || u.avatar,
        };
      }
      return u;
    });

    if (!isFound) {
      updatedList.push({
        id: updatedUser.id,
        username: updatedUser.username || updatedUser.email?.split('@')[0] || 'user',
        name: updatedUser.name,
        email: updatedUser.email ? updatedUser.email.replace(/\.local$/, '.app') : `${updatedUser.username || 'user'}@todolist.app`,
        avatar: updatedUser.avatar,
        password: 'saved_user_profile',
        createdAt: new Date().toISOString(),
      });
    }

    try {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('LocalStorage USERS_DB_KEY save note:', e);
    }

    if (updatedUser.avatar) {
      if (updatedUser.username) setUserSavedAvatar(updatedUser.username, updatedUser.avatar);
      if (updatedUser.email) setUserSavedAvatar(updatedUser.email, updatedUser.avatar);
      if (updatedUser.id) setUserSavedAvatar(updatedUser.id, updatedUser.avatar);
      if (oldUser.username) setUserSavedAvatar(oldUser.username, updatedUser.avatar);
      if (oldUser.email) setUserSavedAvatar(oldUser.email, updatedUser.avatar);
      if (oldUser.id) setUserSavedAvatar(oldUser.id, updatedUser.avatar);
    }

    // If username changed, also migrate tasks to the new username storage key
    if (oldUsername && newUsername && oldUsername !== newUsername) {
      try {
        const oldKey = `todolist_tasks_v2_user_${oldUsername.replace(/[^a-z0-9_-]/g, '_')}`;
        const newKey = `todolist_tasks_v2_user_${newUsername.replace(/[^a-z0-9_-]/g, '_')}`;
        const existingTasks = localStorage.getItem(oldKey);
        if (existingTasks) {
          localStorage.setItem(newKey, existingTasks);
        }
      } catch (err) {
        console.warn('Could not migrate user tasks on username change:', err);
      }
    }

    // 2. Update active session
    saveAuthSession(updatedUser);

    // 3. Sync to Cloud in the background (Non-blocking for instant 0ms UI update)
    (async () => {
      try {
        // A. Update Cloud Auth metadata
        const { data: authData } = await cloudDb.auth.getUser();
        if (authData?.user) {
          await cloudDb.auth.updateUser({
            data: {
              full_name: updatedUser.name,
              avatar_url: updatedUser.avatar || null,
              username: updatedUser.username || null,
            },
          }).catch(() => {});
        }

        // B. Upsert into Cloud 'profiles' table
        const targetId = updatedUser.id || authData?.user?.id;
        if (targetId && !targetId.startsWith('user-')) {
          const { error: sbError } = await cloudDb
            .from('profiles')
            .upsert(
              {
                id: targetId,
                full_name: updatedUser.name,
                username: updatedUser.username || null,
                avatar_url: updatedUser.avatar || null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );

          if (sbError) {
            console.warn('Cloud profiles table upsert notice:', sbError.message);
          }
        }
      } catch (e) {
        console.warn('Cloud profile update background sync notice:', e);
      }
    })();

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Could not update profile' };
  }
}
