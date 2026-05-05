'use client';
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';

export interface AuthUser { name: string; email: string; }

interface AuthContextValue {
  user:    AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, loading: true,
  signOut: async () => {}, refetch: async () => {},
});

function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('embedded') === '1';
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const fetching              = useRef(false);

  async function refetch() {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      setUser(res.ok ? (await res.json()).user ?? null : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
      fetching.current = false;
    }
  }

  useEffect(() => {
    if (isEmbedded()) {
      // In embedded mode, wait for ASM parent to send user data via postMessage.
      // Fall back to cookie auth after 2s if no message arrives (e.g. standalone open in tab).
      const timer = setTimeout(() => { refetch(); }, 2000);

      function onMessage(e: MessageEvent) {
        if (e.data?.type === 'ASM_AUTH') {
          clearTimeout(timer);
          if (e.data.user) {
            setUser({ name: e.data.user.name ?? '', email: e.data.user.email ?? '' });
          } else {
            setUser(null);
          }
          setLoading(false);
        }
        if (e.data?.type === 'ASM_LOGOUT') {
          clearTimeout(timer);
          setUser(null);
          setLoading(false);
        }
      }

      window.addEventListener('message', onMessage);
      return () => {
        window.removeEventListener('message', onMessage);
        clearTimeout(timer);
      };
    } else {
      refetch();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function signOut() {
    // In embedded mode, ASM owns auth — do nothing locally
    if (isEmbedded()) return;
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
