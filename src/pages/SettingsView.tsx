import React, { useState } from 'react';
import { 
  Settings
} from 'lucide-react';
import defaultAvatar from '../assets/images/user_default_avatar.png';
import { Task, AuthUser } from '../types';
import { EditProfileModal } from '../components/EditProfileModal';


interface SettingsViewProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  tasks?: Task[];
  onClearAllTasks?: () => void;
  onImportTasks?: (importedTasks: Task[]) => void;
  currentUser: AuthUser | null;
  onUpdateProfile: (user: AuthUser) => Promise<{ success: boolean; error?: string }>;
  onOpenSupabaseModal?: () => void;
  onTriggerSync?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDarkMode,
  onToggleTheme,
  tasks = [],
  currentUser,
  onUpdateProfile,
  onOpenSupabaseModal,
  onTriggerSync,
}) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  return (
    <div className="max-w-2xl space-y-10 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#2563EB] dark:text-blue-400" />
          <span>Settings</span>
        </h2>
      </div>

      {/* 1. Account Profile Card */}
      <div className="flex items-center justify-between gap-6 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-neutral-100 dark:ring-neutral-800 flex items-center justify-center shrink-0">
            {currentUser?.avatar && currentUser.avatar.length > 0 ? (
              <img
                src={currentUser.avatar}
                alt={currentUser?.name || 'User'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <img src={defaultAvatar} alt="Default Avatar" className="w-10 h-10" />
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              {currentUser?.name || 'User'}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {currentUser?.email || 'No email provided'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditProfileOpen(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer shrink-0"
        >
          Edit Profile
        </button>
      </div>

      {/* 2. About Tasks */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">About Tasks</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Tasks helps you plan, focus, and achieve your goals with smart organization.
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Stay on track with priorities, categories, and deadlines in a clean, focused environment.
        </p>
      </div>

      {/* Edit User Profile Dialog Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={onUpdateProfile}
      />
    </div>
  );
};
