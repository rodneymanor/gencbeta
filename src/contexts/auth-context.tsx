"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export type AccountLevel = "free" | "pro";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accountLevel: AccountLevel;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  upgradeAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountLevel, setAccountLevel] = useState<AccountLevel>("free");

  useEffect(() => {
    if (!auth) {
      // Firebase not configured, set loading to false
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);

      if (user?.email) {
        const isProUser =
          user.email.includes("pro") || user.email.includes("admin") || user.email.endsWith("@company.com");
        setAccountLevel(isProUser ? "pro" : "free");
      } else {
        setAccountLevel("free");
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error("Firebase is not configured. Please set up Firebase environment variables.");
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!auth) {
      throw new Error("Firebase is not configured. Please set up Firebase environment variables.");
    }

    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error("Firebase is not configured. Please set up Firebase environment variables.");
    }

    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!auth) {
      throw new Error("Firebase is not configured. Please set up Firebase environment variables.");
    }

    setLoading(true);
    try {
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) {
      throw new Error("Firebase is not configured. Please set up Firebase environment variables.");
    }

    await sendPasswordResetEmail(auth, email);
  };

  const upgradeAccount = useCallback(async () => {
    // In production, this would handle Stripe/payment integration
    // For demo purposes, just toggle the account level
    setAccountLevel((prev) => (prev === "free" ? "pro" : "free"));
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      accountLevel,
      signIn,
      signUp,
      signInWithGoogle,
      logout,
      resetPassword,
      upgradeAccount,
    }),
    [user, loading, accountLevel, upgradeAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
