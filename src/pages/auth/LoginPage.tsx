/**
 * @file src/pages/auth/LoginPage.tsx
 * @description Production login page for TodoList:
 * - "Username or Email" input with user icon
 * - "Password" input with lock icon and eye show/hide toggle
 * - Remember me checkbox & "Forgot password?" right link
 * - Dual-layer instant authentication (local storage + persistent server DB)
 * - Quick-select registered accounts preview
 * - Primary button: "Log In ->"
 * - Bottom link: "Don't have an account? Create an account"
 */

import React, { useState, useEffect } from 'react';
import { User, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { AuthUser, AuthView } from '../../types';
import { AuthInput } from '../../components/auth/AuthInput';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { FormError } from '../../components/auth/FormError';
import { 
  getRegisteredUsers, 
  getUserSavedAvatar, 
  syncUsersWithServer, 
  saveNewUser,
  RegisteredUser 
} from '../../utils/authHelpers';
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
  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredUser[]>(() => getRegisteredUsers());

  // Field validation error states
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  // Loading state during sign-in
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Check remembered identifier
    const remembered = localStorage.getItem('todolist_remembered_identifier');
    if (remembered) {
      setIdentifier(remembered);
      setRememberMe(true);
    }

    // 2. Fetch latest registered users from server and merge
    syncUsersWithServer().then((users) => {
      if (users && users.length > 0) {
        setRegisteredAccounts(users);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    let hasErrors = false;

    // 1. Username/Email validation
    if (!identifier.trim()) {
      setIdentifierError('Please enter your username or email.');
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
      const rawInput = identifier.trim();
      const cleanInput = rawInput.toLowerCase().replace(/^@+/, '');
      const rawPassword = password;

      // Handle Remember Me preference
      if (rememberMe) {
        localStorage.setItem('todolist_remembered_identifier', rawInput);
      } else {
        localStorage.removeItem('todolist_remembered_identifier');
      }

      // Matching helper for any registered user record
      const isUserMatch = (u: RegisteredUser) => {
        if (!u) return false;
        const uUser = (u.username || '').trim().toLowerCase();
        const uEmail = (u.email || '').trim().toLowerCase();
        const uEmailPrefix = uEmail.split('@')[0];
        const uName = (u.name || '').trim().toLowerCase();
        const uId = (u.id || '').trim().toLowerCase();

        const idMatched = (
          uUser === cleanInput ||
          uEmail === cleanInput ||
          uEmailPrefix === cleanInput ||
          uName === cleanInput ||
          uId === cleanInput
        );

        const passMatched = (
          u.password === rawPassword ||
          (typeof u.password === 'string' && u.password.trim() === rawPassword.trim())
        );

        return idMatched && passMatched;
      };

      // 1. Fast local storage check (0ms instant login)
      const localUsers = getRegisteredUsers();
      let matched = localUsers.find(isUserMatch);

      if (matched) {
        setIsLoading(false);
        const savedAvatar = matched.avatar || getUserSavedAvatar(matched.username) || (matched.email ? getUserSavedAvatar(matched.email) : null) || undefined;
        onLoginSuccess({
          id: matched.id || toValidUuid(matched.username),
          username: matched.username,
          name: matched.name || matched.username,
          email: matched.email ? matched.email.replace(/\.local$/, '.app') : `${matched.username}@todolist.app`,
          avatar: savedAvatar,
          plan: 'Tasks Pro',
        });
        return;
      }

      // 2. Persistent Server Backend Authentication Check (/api/login)
      try {
        const serverRes = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: cleanInput, password: rawPassword }),
        });

        if (serverRes.ok) {
          const serverData = await serverRes.json();
          if (serverData.success && serverData.user) {
            // Cache user in client LocalStorage for instant subsequent logins
            saveNewUser({
              id: serverData.user.id,
              username: serverData.user.username,
              name: serverData.user.name,
              email: serverData.user.email,
              avatar: serverData.user.avatar,
              password: rawPassword,
            });

            setIsLoading(false);
            onLoginSuccess(serverData.user);
            return;
          }
        }
      } catch (serverErr) {
        console.warn('Server auth fallback notice:', serverErr);
      }

      // 3. Fallback: refresh all users from server in case user was registered in another session
      try {
        const freshUsers = await syncUsersWithServer();
        setRegisteredAccounts(freshUsers);
        const secondMatch = freshUsers.find(isUserMatch);
        if (secondMatch) {
          setIsLoading(false);
          const savedAvatar = secondMatch.avatar || getUserSavedAvatar(secondMatch.username) || (secondMatch.email ? getUserSavedAvatar(secondMatch.email) : null) || undefined;
          onLoginSuccess({
            id: secondMatch.id || toValidUuid(secondMatch.username),
            username: secondMatch.username,
            name: secondMatch.name || secondMatch.username,
            email: secondMatch.email ? secondMatch.email.replace(/\.local$/, '.app') : `${secondMatch.username}@todolist.app`,
            avatar: savedAvatar,
            plan: 'Tasks Pro',
          });
          return;
        }
      } catch {}

      // 4. Fallback: Cloud Workspace Authentication if input is an email
      if (cleanInput.includes('@')) {
        try {
          const { user: cloudDbUser } = await cloudDbSignIn(cleanInput, rawPassword);
          if (cloudDbUser) {
            setIsLoading(false);
            onLoginSuccess(cloudDbUser);
            return;
          }
        } catch {}
      }

      // If all checks fail
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
        {/* Username or Email Input */}
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
          placeholder="e.g. Jurex43 or user@gmail.com"
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

      {/* Quick Select Registered Accounts Preview */}
      {registeredAccounts.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400">
              Registered Accounts ({registeredAccounts.length})
            </span>
            <span className="text-[10px] text-slate-400">Click to autofill username</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
            {registeredAccounts.map((account) => {
              const isCurrentSelection = identifier.trim().toLowerCase() === account.username.toLowerCase();
              return (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => {
                    setIdentifier(account.username);
                    if (identifierError) setIdentifierError('');
                    if (formError) setFormError('');
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all text-left cursor-pointer group ${
                    isCurrentSelection
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
                      : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 border-slate-200 dark:border-slate-800 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[11px] overflow-hidden shrink-0">
                      {account.avatar ? (
                        <img src={account.avatar} alt={account.name} className="w-full h-full object-cover" />
                      ) : (
                        (account.name || account.username).slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {account.name || account.username}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        @{account.username} {account.email ? `• ${account.email}` : ''}
                      </p>
                    </div>
                  </div>
                  {isCurrentSelection ? (
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Selected</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      Select →
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Switch to Register */}
      <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
        <span>Don&apos;t have an account? </span>
        <button
          type="button"
          onClick={() => onNavigateAuth('register')}
          className="font-bold text-[#2563EB] dark:text-blue-400 hover:underline cursor-pointer"
        >
          Create an account
        </button>
      </div>
    </div>
  );
};
