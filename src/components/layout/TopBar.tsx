'use client';
import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 gap-4">
      <Link
        href="/"
        className="flex items-center gap-2 font-black text-base text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity"
      >
        <div className="rounded-lg bg-indigo-600 p-1 shadow-sm">
          <Building2 className="h-3.5 w-3.5 text-white" />
        </div>
        <span>Propacity</span>
        <span className="text-slate-400 dark:text-slate-500 font-light">Brand Audit</span>
      </Link>

      <div className="flex-1" />

      <ThemeToggle />

      <Link
        href="/audit/new"
        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5"
      >
        <Plus className="h-3.5 w-3.5" />
        New Audit
      </Link>
    </header>
  );
}
