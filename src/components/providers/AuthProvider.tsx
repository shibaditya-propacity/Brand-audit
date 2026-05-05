'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface AuthUser { name: string; email: string; }

interface AuthContextValue {
  user:    AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: false });

function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('embedded') === '1';
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!isEmbedded()) return;
    // In embedded mode, receive identity from ASM parent via postMessage
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'ASM_AUTH' && e.data.user) {
        setUser({ name: e.data.user.name ?? '', email: e.data.user.email ?? '' });
      }
      if (e.data?.type === 'ASM_LOGOUT') {
        setUser(null);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
