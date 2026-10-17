/**
 * @file src/components/CompleteConfirmModal.tsx
 * @description Simple, clean confirmation dialog before marking a task as completed.
 */

import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Task } from '../types';

interface CompleteConfirmModalProps {
  isOpen: boolean;
  task: Task | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CompleteConfirmModal: React.FC<CompleteConfirmModalProps> = ({
  isOpen,
  task,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Simple Confirmation Box */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="complete-dialog-title"
        className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 p-5 sm:p-6"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          {/* Simple Green Check Circle */}
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>

          <div className="flex-1 pr-4">
            <h2 id="complete-dialog-title" className="text-base font-bold text-neutral-900 dark:text-white">
              Complete Task?
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Are you sure you want to mark this task as completed?
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Yes, Complete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
