'use client';
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';

interface AuthUser { name: string; email: string; }

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

  useEffect(() => { refetch(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function signOut() {
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
