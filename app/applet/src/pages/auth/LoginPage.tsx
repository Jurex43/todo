/**
 * @file src/pages/auth/LoginPage.tsx
 * @description Production login page for TodoList:
 * - "Username or Email" input with user icon
 * - "Password" input with lock icon and eye show/hide toggle
 * - Registered Account Users list preview for quick selection
 * - Remember me checkbox & "Forgot password?" right link
 * - Primary button: "Log In ->"
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
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);

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
    try {
      const users = getRegisteredUsers();
      setRegisteredUsers(users);
    } catch {}
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
    <div className="space-y-4">
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

      {/* Registered Account Users Preview List */}
      {registeredUsers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Registered Account Users ({registeredUsers.length})
            </span>
            <span className="text-[10px] text-slate-400">Click to select</span>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {registeredUsers.map((u) => (
              <button
                key={u.username}
                type="button"
                onClick={() => {
                  setIdentifier(u.username);
                  setFormError('');
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[11px] overflow-hidden shrink-0">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      (u.name || u.username).slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {u.name || u.username}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      @{u.username}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Use →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subtle Divider: "or" */}
      <div className="relative flex items-center justify-center py-1">
        <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        <span className="absolute px-3 bg-white dark:bg-[#0B1120] text-xs text-slate-400 font-normal">
          or
        </span>
      </div>
    </div>
  );
};
