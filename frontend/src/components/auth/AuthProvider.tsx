"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { clearToken, getToken, setToken } from "@/lib/api";

export interface AuthUser {
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  /**
   * Persist the signed-in user. When a JWT `token` is provided it is stored so
   * subsequent API calls are authenticated.
   */
  signIn: (user: AuthUser, token?: string) => void;
  signOut: () => void;
}

const STORAGE_KEY = "decozy.auth.user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Hydrate from localStorage on mount. A user is only considered signed in
  // when both the stored profile and the JWT token are present.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && getToken()) {
        setUser(JSON.parse(stored) as AuthUser);
      }
    } catch {
      // Ignore malformed storage.
    }
    setIsReady(true);
  }, []);

  const signIn = useCallback((nextUser: AuthUser, token?: string) => {
    if (token) setToken(token);
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    clearToken();
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isReady,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
