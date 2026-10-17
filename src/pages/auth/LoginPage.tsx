/**
 * @file src/pages/auth/LoginPage.tsx
 * @description Production login page for TodoList:
 * - "Username or Email" input with user icon
 * - "Password" input with lock icon and eye show/hide toggle
 * - Remember me checkbox with green tint & "Forgot password?" right link
 * - Primary button: "Log In ->"
 * - Divider: "or continue with"
 * - Social button: "Continue with Google"
 * - Bottom link: "Don't have an account? Register"
 */

import React, { useState, useEffect } from 'react';
import { User, ArrowRight } from 'lucide-react';
import { AuthUser, AuthView } from '../../types';
import { AuthInput } from '../../components/auth/AuthInput';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { FormError } from '../../components/auth/FormError';
import { getRegisteredUsers, getUserSavedAvatar } from '../../utils/authHelpers';
import { cloudDbSignIn, toValidUuid } from '../../services/cloudDbService';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onNavigateAuth: (view: AuthView) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateAuth,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Field validation error states
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  // Loading state during sign-in
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem('todolist_remembered_identifier');
    if (remembered) {
      setIdentifier(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    let hasErrors = false;

    // 1. Username validation
    if (!identifier.trim()) {
      setIdentifierError('Please enter your username.');
      hasErrors = true;
    } else {
      setIdentifierError('');
    }

    // 2. Password validation
    if (!password) {
      setPasswordError('Please enter your password.');
      hasErrors = true;
    } else {
      setPasswordError('');
    }

    if (hasErrors) return;

    setIsLoading(true);

    try {
      const cleanInput = identifier.trim().toLowerCase();

      // Handle Remember Me preference
      if (rememberMe) {
        localStorage.setItem('todolist_remembered_identifier', identifier.trim());
      } else {
        localStorage.removeItem('todolist_remembered_identifier');
      }

      // 1. Check registered users database (fast username login)
      const users = getRegisteredUsers();
      const matched = users.find(
        (u) => 
          (u.username?.toLowerCase() === cleanInput || 
           u.email?.toLowerCase() === cleanInput || 
           u.name?.toLowerCase() === cleanInput) && 
          u.password === password
      );

      if (matched) {
        // Instant login for local users, no spinner needed
        const savedAvatar = matched.avatar || getUserSavedAvatar(matched.username) || (matched.email ? getUserSavedAvatar(matched.email) : null) || undefined;
        onLoginSuccess({
          id: matched.id || toValidUuid(matched.username),
          username: matched.username,
          name: matched.name || matched.username,
          email: matched.email ? matched.email.replace(/\.local$/, '.app') : `${matched.username}@todolist.app`,
          avatar: savedAvatar,
          plan: 'TodoList Pro',
        });
        return;
      }

      // 2. Attempt Cloud Workspace Authentication (if input is an email)
      if (cleanInput.includes('@')) {
        const { user: cloudDbUser } = await cloudDbSignIn(cleanInput, password);

        if (cloudDbUser) {
          setIsLoading(false);
          onLoginSuccess(cloudDbUser);
          return;
        }
      }

      // If neither succeeds
      setIsLoading(false);
      setFormError('Invalid username or password. Please check and try again.');
    } catch (err: any) {
      setIsLoading(false);
      setFormError(err?.message || 'Authentication error. Please try again.');
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Global Form Error Banner */}
      <FormError message={formError} variant="banner" />

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Username Input */}
        <AuthInput
          id="login-identifier"
          label="Username or Email"
          type="text"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (identifierError) setIdentifierError('');
            if (formError) setFormError('');
          }}
          placeholder="Username or Email"
          autoComplete="username"
          autoFocus
          error={identifierError}
          icon={User}
          disabled={isLoading}
        />

        {/* Password Input */}
        <PasswordInput
          id="login-password"
          label="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError('');
            if (formError) setFormError('');
          }}
          placeholder="Password"
          autoComplete="current-password"
          error={passwordError}
          disabled={isLoading}
        />

        {/* Remember Me Checkbox & Forgot Password Link */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400 font-medium">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#2563EB] focus:ring-[#2563EB] accent-[#2563EB] cursor-pointer"
            />
            <span>Remember me</span>
          </label>

          <button
            type="button"
            onClick={() => onNavigateAuth('forgot-password')}
            className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {/* Primary Action Button: "Log In ->" */}
        <div className="pt-1">
          <AuthButton
            isLoading={isLoading}
            loadingText="Logging in..."
            type="submit"
          >
            <span className="flex items-center justify-center gap-2 text-base font-bold">
              <span>Log In</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </span>
          </AuthButton>
        </div>
      </form>

      {/* Subtle Divider: "or" */}
      <div className="relative flex items-center justify-center py-2">
        <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        <span className="absolute px-3 bg-white dark:bg-[#0B1120] text-xs text-slate-400 font-normal">
          or
        </span>
      </div>
    </div>
  );
};
