import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { getItem, setItem, removeItem } from '../utils/storage';
import { v4 as uuid } from 'uuid';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hashed_' + Math.abs(hash).toString(36);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getItem<User>('current_user');
    if (stored) setUser(stored);
    setIsLoading(false);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const users = getItem<Record<string, { name: string; email: string; password: string }>>('users') || {};
    const found = Object.values(users).find(u => u.email === email);
    if (!found) return { success: false, error: 'No account found with this email.' };
    if (found.password !== hashPassword(password)) return { success: false, error: 'Incorrect password.' };

    const u: User = { id: findUserId(email, users), name: found.name, email: found.email, createdAt: new Date().toISOString() };
    setUser(u);
    setItem('current_user', u);
    return { success: true };
  }, []);

  const signup = useCallback((name: string, email: string, password: string) => {
    const users = getItem<Record<string, { name: string; email: string; password: string }>>('users') || {};
    if (Object.values(users).find(u => u.email === email)) return { success: false, error: 'An account with this email already exists.' };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };

    const id = uuid();
    users[id] = { name, email, password: hashPassword(password) };
    setItem('users', users);

    const u: User = { id, name, email, createdAt: new Date().toISOString() };
    setUser(u);
    setItem('current_user', u);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    removeItem('current_user');
  }, []);

  const updateProfile = useCallback((data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    setItem('current_user', updated);

    const users = getItem<Record<string, { name: string; email: string; password: string }>>('users') || {};
    if (users[user.id]) {
      if (data.name) users[user.id].name = data.name;
      if (data.email) users[user.id].email = data.email;
      setItem('users', users);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

function findUserId(email: string, users: Record<string, { name: string; email: string }>): string {
  return Object.entries(users).find(([, u]) => u.email === email)?.[0] || '';
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}