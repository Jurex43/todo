/**
 * @file src/components/EditProfileModal.tsx
 * @description Modal dialog allowing the user to customize and change their profile:
 * - Full Name / Display Name
 * - Username (e.g. Jurex43)
 * - Email address
 * - Avatar selection / custom URL
 * - Updates local storage session & syncs with Cloud profiles table
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, User, AtSign, Mail, Image as ImageIcon, Check, Upload, Camera } from 'lucide-react';
import { AuthUser } from '../types';
import { isValidUsername, isUsernameTaken } from '../utils/authHelpers';


interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onUpdateProfile: (updatedUser: AuthUser) => Promise<{ success: boolean; error?: string }>;
}



export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [autoSavedNotice, setAutoSavedNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name || '');
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setAvatar(currentUser.avatar || '');
      setCustomAvatarUrl(currentUser.avatar && currentUser.avatar.startsWith('http') ? currentUser.avatar : '');
      setError('');
      setAutoSavedNotice(false);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const currentActiveAvatar = customAvatarUrl.trim() || avatar || undefined;

  // Helper for auto saving profile updates
  const performSave = async (updatedFields?: Partial<AuthUser>) => {
    setError('');
    const cleanName = (updatedFields?.name ?? name).trim();
    const cleanUsername = (updatedFields?.username ?? username).trim();
    const cleanEmail = (updatedFields?.email ?? email).trim();
    const chosenAvatar = updatedFields?.avatar ?? currentActiveAvatar;

    if (!cleanName) {
      setError('Please provide a display name.');
      return false;
    }

    if (cleanUsername) {
      if (!isValidUsername(cleanUsername)) {
        setError('Username must be 3-20 characters long (letters, numbers, underscores).');
        return false;
      }

      if (cleanUsername.toLowerCase() !== (currentUser.username || '').toLowerCase() && isUsernameTaken(cleanUsername)) {
        setError('This username is already in use. Please select another.');
        return false;
      }
    }

    setIsSaving(true);

    const updatedUser: AuthUser = {
      ...currentUser,
      name: cleanName,
      username: cleanUsername || undefined,
      email: cleanEmail || currentUser.email,
      avatar: chosenAvatar,
    };

    const result = await onUpdateProfile(updatedUser);
    setIsSaving(false);

    if (result.success) {
      setAutoSavedNotice(true);
      setTimeout(() => setAutoSavedNotice(false), 2500);
      return true;
    } else {
      setError(result.error || 'Failed to update profile.');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await performSave();
    if (success) {
      onClose();
    }
  };

  // Handle local image file upload with automatic Canvas compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, GIF).');
      return;
    }

    if (file.size > 12 * 1024 * 1024) { // 12MB limit
      setError('Image file size must be less than 12MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (rawDataUrl) {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 320; // 320x320 max profile photo size
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
              setCustomAvatarUrl(compressedDataUrl);
              setAvatar(compressedDataUrl);
              await performSave({ avatar: compressedDataUrl });
            } else {
              setCustomAvatarUrl(rawDataUrl);
              setAvatar(rawDataUrl);
              await performSave({ avatar: rawDataUrl });
            }
          } catch {
            setCustomAvatarUrl(rawDataUrl);
            setAvatar(rawDataUrl);
            await performSave({ avatar: rawDataUrl });
          }
        };
        img.onerror = () => {
          setError('Failed to process image file. Please try another photo.');
        };
        img.src = rawDataUrl;
      }
    };
    reader.readAsDataURL(file);
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">Edit Profile</h3>
                {autoSavedNotice && (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 animate-in fade-in">
                    Auto-saved!
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Upload profile photo and update info</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
              {error}
            </div>
          )}

          {/* Hidden File Input for Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Avatar Preview & Upload Area */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              {/* Clickable Profile Photo Upload Circle */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-blue-500/30 hover:ring-blue-600 shrink-0 cursor-pointer group transition-all"
                title="Click to upload profile photo from computer"
              >
                {currentActiveAvatar && currentActiveAvatar.length > 0 && (
                  <img
                    src={currentActiveAvatar}
                    alt="Avatar preview"
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Upload Button & Preset Choices */}
              <div className="flex-1 space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl border border-blue-200 dark:border-blue-900/60 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo from Device</span>
                </button>


              </div>
            </div>

            {/* Custom Image URL */}
            <div className="pt-1">
              <div className="relative flex items-center">
                <ImageIcon className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                <input
                  type="url"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  onBlur={() => {
                    if (customAvatarUrl.trim()) {
                      performSave({ avatar: customAvatarUrl.trim() });
                    }
                  }}
                  placeholder="Or paste custom image URL"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Display Name
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => performSave({ name })}
                placeholder="e.g. Jurex Badiao"
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Username
            </label>
            <div className="relative flex items-center">
              <AtSign className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                onBlur={() => performSave({ username })}
                placeholder="e.g. Jurex43"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-neutral-400">Used for login and your profile handle (@username)</p>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => performSave({ email })}
                placeholder="e.g. user@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>


        
        {/* Modal Footer Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] text-white shadow-sm shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Done</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
