'use client';
import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b bg-white px-4 gap-4">
      <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
        <Building2 className="h-5 w-5" />
        Propacity Brand Audit
      </Link>
      <div className="flex-1" />
      <Button asChild size="sm">
        <Link href="/audit/new">
          <Plus className="mr-1 h-4 w-4" /> New Audit
        </Link>
      </Button>
    </header>
  );
}
