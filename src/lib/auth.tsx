"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { checkAuth, signIn as apiSignIn, signOut as apiSignOut } from './api';

type User = { name: string };

type AuthContext = {
  user: User | null;
  loading: boolean;
  signIn: (password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  isLocked: boolean;
  setPassword: (pw: string) => void;
};

const AuthCtx = createContext<AuthContext>({
  user: null,
  loading: true,
  signIn: async () => null,
  signOut: async () => {},
  isLocked: false,
  setPassword: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    checkAuth()
      .then((res) => {
        if (res.loggedIn) {
          setUser({ name: 'Eddie' });
        } else {
          setIsLocked(true);
        }
      })
      .catch(() => {
        setIsLocked(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (password: string): Promise<string | null> => {
    try {
      const res = await apiSignIn(password);
      if (res.success) {
        setUser({ name: res.name || 'Eddie' });
        setIsLocked(false);
        return null;
      }
      return res.error || 'Wrong password';
    } catch (e: any) {
      return e.message || 'Connection error';
    }
  }, []);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setUser(null);
    setIsLocked(true);
  }, []);

  // Kept for backward compat but not used with server-side auth
  const setPassword = useCallback((_pw: string) => {}, []);

  return (
    <AuthCtx.Provider value={{ user, loading, signIn, signOut, isLocked, setPassword }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
