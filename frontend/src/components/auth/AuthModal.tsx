'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';

interface AuthModalProps {
  open:          boolean;
  defaultTab?:   'signin' | 'signup';
  redirectTo?:   string;
  onClose:       () => void;
}

export function AuthModal({ open, defaultTab = 'signin', redirectTo, onClose }: AuthModalProps) {
  const [tab,      setTab]      = useState<'signin' | 'signup'>(defaultTab);
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { refetch }             = useAuth();
  const router                  = useRouter();
  const pathname                = usePathname();
  const firstInput              = useRef<HTMLInputElement>(null);

  // reset form when tab or open changes
  useEffect(() => {
    setName(''); setEmail(''); setPassword(''); setError(''); setShowPw(false);
  }, [tab, open]);

  useEffect(() => {
    if (open) setTimeout(() => firstInput.current?.focus(), 120);
  }, [open]);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = tab === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
      const body     = tab === 'signup' ? { name, email, password } : { email, password };
      const res      = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      await refetch();
      onClose();
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        // Clean any auth-related query params from the current URL
        router.replace(pathname);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95, y: 16  }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative flex items-center justify-center pt-6 pb-4 px-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-indigo-600 p-1.5 shadow-sm">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">Propacity</span>
                  <span className="text-slate-400 font-light text-sm">Brand Audit</span>
                </div>
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex mx-6 mt-5 mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                {(['signin', 'signup'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      tab === t
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {t === 'signin' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                {tab === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      ref={tab === 'signup' ? firstInput : undefined}
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Smith"
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    ref={tab === 'signin' ? firstInput : undefined}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={tab === 'signup' ? 'Min. 8 characters' : '••••••••'}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> {tab === 'signup' ? 'Creating account…' : 'Signing in…'}</>
                    : tab === 'signup' ? 'Create Account' : 'Sign In'
                  }
                </button>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                  {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    {tab === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
