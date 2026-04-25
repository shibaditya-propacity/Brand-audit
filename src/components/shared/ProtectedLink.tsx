'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode, type MouseEvent } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';

interface ProtectedLinkProps {
  href:       string;
  children:   ReactNode;
  className?: string;
}

export function ProtectedLink({ href, children, className }: ProtectedLinkProps) {
  const { user, loading } = useAuth();
  const router            = useRouter();
  const [open, setOpen]   = useState(false);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (loading) return;
    if (user) {
      router.push(href);
    } else {
      setOpen(true);
    }
  }

  return (
    <>
      <a href={href} className={className} onClick={handleClick}>
        {children}
      </a>
      <AuthModal
        open={open}
        defaultTab="signin"
        redirectTo={href}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
