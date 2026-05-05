'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-5 gap-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <Image
          src="/propacity-logo.png"
          alt="Propacity"
          width={28}
          height={28}
          className="rounded-lg"
        />
        <Image
          src="/propacity-text.png"
          alt="propacity"
          width={88}
          height={22}
          className="dark:invert"
        />
      </Link>

      <span className="text-slate-300 dark:text-slate-600 font-light text-sm select-none">|</span>
      <span className="text-slate-400 dark:text-slate-500 text-sm font-medium">Brand Audit</span>

      <div className="flex-1" />

      <ThemeToggle />

      <Link
        href="/audit/new"
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-4 py-1.5 text-white text-sm font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
      >
        <Plus className="h-3.5 w-3.5" />
        New Audit
      </Link>
    </header>
  );
}
