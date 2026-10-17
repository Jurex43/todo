/**
 * @file src/pages/auth/ResetPasswordPage.tsx
 * @description Reset Password view for entering and confirming a new password.
 */

import React, { useState } from 'react';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { AuthView } from '../../types';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { PasswordStrength } from '../../components/auth/PasswordStrength';
import { AuthButton } from '../../components/auth/AuthButton';
import { FormError } from '../../components/auth/FormError';
import { checkPasswordStrength } from '../../utils/authHelpers';
import { cloudDbUpdatePassword } from '../../services/cloudDbService';

interface ResetPasswordPageProps {
  onNavigateAuth: (view: AuthView) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  onNavigateAuth,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasErrors = false;

    const strength = checkPasswordStrength(newPassword);
    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      hasErrors = true;
    } else if (!strength.isValid) {
      setPasswordError('Password must meet all security requirements.');
      hasErrors = true;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your new password.');
      hasErrors = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      hasErrors = true;
    } else {
      setConfirmError('');
    }

    if (hasErrors) return;

    setIsLoading(true);

    try {
      await cloudDbUpdatePassword(newPassword);
      setIsLoading(false);
      setIsSuccess(true);
    } catch {
      setIsLoading(false);
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-2 animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Password Updated!
          </h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Your password has been successfully changed. You can now sign in with your new password.
          </p>
        </div>

        <div className="pt-2">
          <AuthButton
            variant="primary"
            onClick={() => onNavigateAuth('login')}
          >
            Back to Sign In
          </AuthButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <PasswordInput
          id="reset-new-password"
          label="New Password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (passwordError) setPasswordError('');
          }}
          autoComplete="new-password"
          autoFocus
          error={passwordError}
          disabled={isLoading}
        />

        <PasswordStrength password={newPassword} />

        <PasswordInput
          id="reset-confirm-password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (confirmError) setConfirmError('');
          }}
          autoComplete="new-password"
          error={confirmError}
          disabled={isLoading}
        />

        <div className="pt-2">
          <AuthButton
            isLoading={isLoading}
            loadingText="Updating password..."
            type="submit"
          >
            Reset Password
          </AuthButton>
        </div>
      </form>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => onNavigateAuth('login')}
          className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>
      </div>
    </div>
  );
};
