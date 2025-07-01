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
import { UserManagementService, type UserProfile, type UserRole } from "@/lib/user-management";

export type AccountLevel = "free" | "pro";

// Auth cache keys for localStorage
const AUTH_CACHE_KEY = "gen_c_auth_cache";
const AUTH_CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

interface AuthCache {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
  } | null;
  userProfile: UserProfile | null;
  accountLevel: AccountLevel;
  timestamp: number;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initializing: boolean; // New: separate state for initial auth check
  accountLevel: AccountLevel;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string, role?: UserRole, coachId?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  upgradeAccount: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper functions for auth cache
function getAuthCache(): AuthCache | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (!cached) return null;
    
    const parsed: AuthCache = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() - parsed.timestamp > AUTH_CACHE_EXPIRY) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.warn("Error reading auth cache:", error);
    localStorage.removeItem(AUTH_CACHE_KEY);
    return null;
  }
}

function setAuthCache(user: User | null, userProfile: UserProfile | null, accountLevel: AccountLevel) {
  if (typeof window === "undefined") return;
  
  try {
    const cache: AuthCache = {
      user: user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      } : null,
      userProfile,
      accountLevel,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("Error setting auth cache:", error);
  }
}

function clearAuthCache() {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch (error) {
    console.warn("Error clearing auth cache:", error);
  }
}

// Helper function to create user profile via API
async function createUserProfileViaAPI(
  uid: string,
  email: string,
  displayName: string,
  role: UserRole,
  coachId?: string,
) {
  console.log("🔍 [AUTH] Creating user profile in Firestore using Admin SDK...");

  const response = await fetch("/api/debug-env", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "create-user-profile",
      userData: {
        uid,
        email,
        displayName,
        role,
        coachId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create user profile via API");
  }

  const profileResult = await response.json();
  console.log("✅ [AUTH] User profile created with result:", profileResult);
  return profileResult;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [accountLevel, setAccountLevel] = useState<AccountLevel>("free");

  const refreshUserProfile = useCallback(async () => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    try {
      const profile = await UserManagementService.getUserProfile(user.uid);
      setUserProfile(profile);

      // Set account level based on role
      if (profile?.role === "super_admin" || profile?.role === "coach") {
        setAccountLevel("pro");
      } else {
        setAccountLevel("free");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
    }
  }, [user]);

  useEffect(() => {
    if (!auth) {
      // Firebase not configured, set loading to false
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        // Update last login
        await UserManagementService.updateLastLogin(user.uid);

        // Load user profile
        try {
          const profile = await UserManagementService.getUserProfile(user.uid);
          setUserProfile(profile);

          // Set account level based on role
          if (profile?.role === "super_admin" || profile?.role === "coach") {
            setAccountLevel("pro");
          } else {
            setAccountLevel("free");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
          setAccountLevel("free");
        }
      } else {
        setUserProfile(null);
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

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
    role: UserRole = "creator",
    coachId?: string,
  ) => {
    if (!auth) {
      throw new Error("Firebase is not configured. Please set up Firebase environment variables.");
    }

    setLoading(true);
    try {
      console.log("🔍 [AUTH] Starting user registration for:", { email, displayName, role });

      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("✅ [AUTH] Firebase Auth user created:", result.user.uid);

      const finalDisplayName = displayName ?? result.user.email?.split("@")[0] ?? "User";

      if (displayName) {
        console.log("🔍 [AUTH] Updating user profile display name...");
        await updateProfile(result.user, { displayName: finalDisplayName });
        console.log("✅ [AUTH] Display name updated");
      }

      // Create user profile using Admin service for server-side operation
      try {
        await createUserProfileViaAPI(result.user.uid, result.user.email!, finalDisplayName, role, coachId);
      } catch (profileError) {
        console.error("❌ [AUTH] Failed to create user profile:", profileError);
        // Still throw the error so the UI can handle it
        throw new Error("User account created but profile creation failed. Please contact support.");
      }

      console.log("✅ [AUTH] User registration completed successfully");
    } catch (err) {
      console.error("❌ [AUTH] Error during user registration:", err);
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
      userProfile,
      loading,
      initializing,
      accountLevel,
      signIn,
      signUp,
      signInWithGoogle,
      logout,
      resetPassword,
      upgradeAccount,
      refreshUserProfile,
    }),
    [user, userProfile, loading, initializing, accountLevel, upgradeAccount, refreshUserProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
