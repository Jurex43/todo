/**
 * @file src/components/auth/AuthLayout.tsx
 * @description Pixel-perfect replication of the Lift SaaS split-screen landing & auth page:
 * - Left Side: High-res scenic sunrise mountain illustration with backpacker hero,
 *   Lift logo with "Plan • Focus • Achieve", "Small Tasks Big Progress" headline,
 *   3 vertical feature badges (Organize, Stay Focused, Achieve More), and "Better Habits Brighter Tomorrow" brush signature.
 * - Right Side: Clean aesthetic auth card with top right "Don't have an account? Sign Up" navigation,
 *   centered Lift logo, "Welcome Back!" heading, and smooth terms footer.
 */

import React from 'react';
import { 
  Check, 
  Calendar, 
  BarChart2, 
  Sun, 
  Moon
} from 'lucide-react';
import { TodoListLogo } from './TodoListLogo';
import heroBgImage from '../../assets/images/lift_hero_mountain_sunrise_1790335846748.jpg';
import { AuthView } from '../../types';

interface AuthLayoutProps {
  children: React.ReactNode;
  heading?: string;
  subtitle?: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  currentView?: AuthView;
  onNavigateAuth?: (view: AuthView) => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  heading = 'Welcome Back!',
  subtitle = 'Log in to your account and continue your journey.',
  isDarkMode,
  onToggleTheme,
  currentView = 'login',
  onNavigateAuth,
}) => {
  const isRegister = currentView === 'register';

  // ===========================================================================
  // ⚡ INSTANT SWITCH FOR FINALS:
  // - Set to `true`  --> Shows the original scenic branding hero page (Lift SaaS)
  // - Set to `false` --> Shows the minimal centered card (no branding hero)
  // ===========================================================================
  const showBrandingHero = false;

  // ---------------------------------------------------------------------------
  // OPTION B: MINIMAL CENTERED VIEW (Active when showBrandingHero is false)
  // ---------------------------------------------------------------------------
  if (!showBrandingHero) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-8 bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
        {/* Top Header */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between gap-4 pt-2">
          <TodoListLogo size="sm" />
          <div className="flex items-center gap-3">
            {onNavigateAuth && (
              <div className="text-sm font-normal text-slate-600 dark:text-slate-300">
                <span>{isRegister ? 'Have an account? ' : "No account? "}</span>
                <button
                  type="button"
                  onClick={() => onNavigateAuth(isRegister ? 'login' : 'register')}
                  className="font-bold text-[#2563EB] hover:text-[#1D4ED8] dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {isRegister ? 'Log In' : 'Sign Up'}
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Centered Form Box */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <TodoListLogo size="xl" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {heading}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {subtitle}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-2 text-xs text-slate-400">
          <p>
            By continuing, you agree to our{' '}
            <a href="#terms" className="text-[#2563EB] dark:text-blue-400 hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="#privacy" className="text-[#2563EB] dark:text-blue-400 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // OPTION A: ORIGINAL SCENIC MOUNTAIN BRANDING HERO PAGE (Active when true)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* ========================================================================= */}
      {/* 🏔️ LEFT SIDE: SCENIC MOUNTAIN SUNRISE BRANDING & VALUE PROPOSITION HERO  */}
      {/* ========================================================================= */}
      <div className="relative w-full lg:w-1/2 min-h-[540px] lg:min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-hidden select-none bg-[#11264E]">
        
        {/* Background Scenic Landscape Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
          style={{ backgroundImage: `url(${heroBgImage})` }}
        />

        {/* Cinematic Gradient Overlays for optimal contrast & typography clarity */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#11285A]/85 via-[#1E3A8A]/50 to-[#0B152B]/90" />
        <div className="absolute inset-0 bg-radial-[circle_at_20%_20%] from-sky-400/20 via-transparent to-transparent pointer-events-none" />

        {/* Top: Lift Logo with Tagline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center filter drop-shadow-md">
              <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="heroLiftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="45%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
                <rect 
                  x="8" 
                  y="8" 
                  width="32" 
                  height="32" 
                  rx="9" 
                  transform="rotate(45 24 24)" 
                  fill="url(#heroLiftGrad)" 
                />
                <path 
                  d="M17 24.5L22 29.5L31 19" 
                  stroke="white" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </div>
            <div>
              <span className="text-3xl font-extrabold tracking-tight text-white font-sans">
                Tasks
              </span>
              <p className="text-[12px] font-medium tracking-wide text-white/80 -mt-0.5">
                Plan • Focus • Achieve
              </p>
            </div>
          </div>
        </div>

        {/* Center: Main Headline, Pitch & 3 Feature Items */}
        <div className="relative z-10 my-auto py-8 sm:py-10 max-w-lg">
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl lg:text-[46px] xl:text-[54px] font-extrabold tracking-tight text-white leading-[1.08]">
              Small Tasks
            </h1>
            <h2 className="text-4xl sm:text-5xl lg:text-[46px] xl:text-[54px] font-extrabold tracking-tight bg-gradient-to-r from-[#60A5FA] via-[#38BDF8] to-[#C084FC] bg-clip-text text-transparent leading-[1.08]">
              Big Progress
            </h2>
          </div>

          <p className="mt-4 text-sm sm:text-base text-white/90 font-normal leading-relaxed max-w-md">
            Tasks helps you organize your day, stay focused, and turn your goals into real progress. A simpler way to do more.
          </p>

          <div className="mt-8 space-y-4">
            {/* Feature 1: Organize */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-blue-500/30 shrink-0">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-[15px] font-bold text-white leading-tight">
                  Organize
                </h3>
                <p className="text-xs text-white/80 leading-snug">
                  Keep your tasks in one place.
                </p>
              </div>
            </div>

            {/* Feature 2: Stay Focused */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center text-white shadow-md shadow-emerald-500/30 shrink-0">
                <Calendar className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-[15px] font-bold text-white leading-tight">
                  Stay Focused
                </h3>
                <p className="text-xs text-white/80 leading-snug">
                  Manage your time effectively.
                </p>
              </div>
            </div>

            {/* Feature 3: Achieve More */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-md shadow-purple-500/30 shrink-0">
                <BarChart2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-[15px] font-bold text-white leading-tight">
                  Achieve More
                </h3>
                <p className="text-xs text-white/80 leading-snug">
                  Small steps lead to big results.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left: Signature Quote */}
        <div className="relative z-10 pt-4">
          <div className="inline-block transform -rotate-3 select-none">
            <p className="text-white font-serif italic text-lg sm:text-xl font-medium tracking-wide drop-shadow-sm">
              Better Habits
            </p>
            <div className="relative inline-block mt-0.5">
              <p className="text-white font-serif italic text-lg sm:text-xl font-medium tracking-wide drop-shadow-sm">
                Brighter Tomorrow
              </p>
              <svg 
                className="w-full h-3.5 text-indigo-400 absolute -bottom-2 left-0 pointer-events-none drop-shadow-md" 
                viewBox="0 0 160 14" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M2 9C45 2 115 3 158 9" 
                  stroke="currentColor" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                />
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 📝 RIGHT SIDE: AUTHENTICATION FORM (Login / Register / Recover)           */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 relative bg-white dark:bg-[#0B1120] transition-colors">
        <div className="w-full flex items-center justify-between lg:justify-end gap-4 shrink-0">
          <div className="lg:hidden">
            <TodoListLogo size="sm" />
          </div>

          <div className="flex items-center gap-4">
            {onNavigateAuth && (
              <div className="text-sm sm:text-base font-normal text-slate-600 dark:text-slate-300">
                <span>{isRegister ? 'Already have an account? ' : "Don't have an account? "}</span>
                <button
                  type="button"
                  onClick={() => onNavigateAuth(isRegister ? 'login' : 'register')}
                  className="font-bold text-[#2563EB] hover:text-[#1D4ED8] dark:text-blue-400 hover:underline cursor-pointer transition-colors ml-1"
                >
                  {isRegister ? 'Log In' : 'Sign Up'}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
          </div>
        </div>

        <div className="w-full max-w-[460px] mx-auto my-auto py-6 sm:py-10">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3.5 sm:mb-4">
              <TodoListLogo size="xl" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {heading}
            </h2>
            
            <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              {subtitle}
            </p>
          </div>

          <div className="space-y-4">
            {children}
          </div>
        </div>

        <div className="text-center pt-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <p>
            By continuing, you agree to our{' '}
            <a href="#terms" className="text-[#2563EB] dark:text-blue-400 hover:underline font-medium">Terms of Service</a>{' '}
            and{' '}
            <a href="#privacy" className="text-[#2563EB] dark:text-blue-400 hover:underline font-medium">Privacy Policy</a>.
          </p>
        </div>
      </div>

    </div>
  );
};
