'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Building2, Plus, LogOut, User, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useAuth } from '@/components/providers/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { useRouter } from 'next/navigation';

export function TopBar() {
  const { user, loading, signOut } = useAuth();
  const [modalOpen, setModalOpen]  = useState(false);
  const [modalTab,  setModalTab]   = useState<'signin' | 'signup'>('signin');
  const [menuOpen,  setMenuOpen]   = useState(false);
  const router = useRouter();

  function openSignIn()  { setModalTab('signin');  setModalOpen(true); }
  function openSignUp()  { setModalTab('signup');  setModalOpen(true); }

  async function handleSignOut() {
    await signOut();
    setMenuOpen(false);
    router.push('/');
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-black text-base text-primary hover:opacity-80 transition-opacity"
        >
          <div className="rounded-lg bg-primary p-1 shadow-sm">
            <Building2 className="h-3.5 w-3.5 text-white" />
          </div>
          <span>Propacity</span>
          <span className="text-slate-400 dark:text-slate-500 font-light">Brand Audit</span>
        </Link>

        <div className="flex-1" />
        <ThemeToggle />

        {!loading && !user && (
          <>
            <button
              onClick={openSignIn}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={openSignUp}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-4 py-1.5 text-white text-sm font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Sign Up
            </button>
          </>
        )}

        {!loading && user && (
          <>
            <Link
              href="/audit/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-4 py-1.5 text-white text-sm font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              <Plus className="h-3.5 w-3.5" />
              New Audit
            </Link>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="max-w-[120px] truncate">{user.name}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </header>

      <AuthModal
        open={modalOpen}
        defaultTab={modalTab}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
