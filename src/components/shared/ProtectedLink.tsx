'use client';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import type { ReactNode, MouseEvent } from 'react';

interface ProtectedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Acts like a <Link> but intercepts clicks for unauthenticated users —
 * opens the Clerk sign-in modal with the target URL as the post-auth redirect.
 */
export function ProtectedLink({ href, children, className, onClick }: ProtectedLinkProps) {
  const { isLoaded, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (!isLoaded) return;

    if (isSignedIn) {
      onClick?.();
      router.push(href);
    } else {
      openSignIn({
        fallbackRedirectUrl: href,
        signUpFallbackRedirectUrl: href,
      });
    }
  }

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
