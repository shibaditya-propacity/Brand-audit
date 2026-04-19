'use client';
import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 gap-4">
      <Link href="/" className="flex items-center gap-2 font-bold text-lg text-indigo-600 dark:text-indigo-400">
        <Building2 className="h-5 w-5" />
        Propacity Brand Audit
      </Link>
      <div className="flex-1" />
      <ThemeToggle />
      <Button asChild size="sm">
        <Link href="/audit/new">
          <Plus className="mr-1 h-4 w-4" /> New Audit
        </Link>
      </Button>
    </header>
  );
}
