"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (email: string, name: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setUser(data.user ?? null);
      setLoading(false);
    } catch {
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (!cancelled) {
          setUser(data.user ?? null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // P0: Clear ALL local data so next account starts fresh.
// Workspace data lives in localStorage (Zustand persist + vault:* keys for API keys).
// Without this, signing up as a new account in the same browser shows the previous
// account's agents/tasks/integrations — confusing UX where you "log into" someone else.
function clearLocalUserData() {
  if (typeof window === "undefined") return;
  try {
    // 1) Clear Zustand persist (workspace state, integrations, tasks, agents, etc.)
    window.localStorage.removeItem("lovon-store-v1");
    // 2) Clear all vault keys (API keys stored per integration)
    const vaultKeys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith("vault:") || k.startsWith("lovon-"))) {
        vaultKeys.push(k);
      }
    }
    for (const k of vaultKeys) {
      window.localStorage.removeItem(k);
    }
    // 3) Clear sessionStorage too (in case anything uses it)
    window.sessionStorage.clear();
    console.log(`[auth] cleared ${vaultKeys.length + 1} localStorage keys`);
  } catch (err) {
    console.warn("[auth] clearLocalUserData failed:", err);
  }
}

const login = useCallback(async (email: string, password: string) => {
    // Clear any previous user's workspace data before switching accounts
    clearLocalUserData();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Erro ao entrar");
    }
    await refresh();
    return data.user;
  }, [refresh]);

  const signup = useCallback(async (email: string, name: string, password: string) => {
    // CRITICAL: clear previous workspace data so new account starts fresh
    clearLocalUserData();
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Erro ao cadastrar");
    }
    await refresh();
    return data.user;
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // CRITICAL: clear workspace data so next user (or same user on other device)
    // doesn't see the previous session's data
    clearLocalUserData();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
