import Link from 'next/link';
import type { ReactNode } from 'react';

interface ProtectedLinkProps {
  href:       string;
  children:   ReactNode;
  className?: string;
}

// Auth has been removed from Brand Audit — ASM is the sole auth gate.
// All links navigate directly without any auth check.
export function ProtectedLink({ href, children, className }: ProtectedLinkProps) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
