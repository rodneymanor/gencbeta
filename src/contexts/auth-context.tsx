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

import { getAuthCache, setAuthCache, clearAuthCache, isCacheStale, type AccountLevel } from "@/lib/auth-cache";
import { auth } from "@/lib/firebase";
import { UserManagementService, type UserProfile, type UserRole } from "@/lib/user-management";
import { APP_VERSION, APP_VERSION_STORAGE_KEY } from "@/config/app-version";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initializing: boolean;
  accountLevel: AccountLevel;
  hasValidCache: boolean;
  isBackgroundVerifying: boolean;
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
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [accountLevel, setAccountLevel] = useState<AccountLevel>("free");
  const [hasValidCache, setHasValidCache] = useState(false);
  const [isBackgroundVerifying, setIsBackgroundVerifying] = useState(false);

  // Check for version changes and force logout if needed
  useEffect(() => {
    const checkVersionAndInitialize = async () => {
      const storedVersion = localStorage.getItem(APP_VERSION_STORAGE_KEY);
      
      // If version has changed, force logout
      if (storedVersion && storedVersion !== APP_VERSION) {
        console.log("🔄 [AUTH] App version changed from", storedVersion, "to", APP_VERSION, "- forcing logout");
        
        // Clear all auth-related storage
        clearAuthCache();
        localStorage.clear();
        sessionStorage.clear();
        
        // Sign out if user is currently signed in
        if (auth?.currentUser) {
          try {
            await signOut(auth);
          } catch (error) {
            console.error("Error signing out during version update:", error);
          }
        }
        
        // Update stored version
        localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION);
        
        // Force page reload to ensure clean state
        window.location.reload();
        return;
      }
      
      // If no version stored yet (first visit), just store it
      if (!storedVersion) {
        localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION);
      }
      
      // Normal initialization from cache
      const cachedAuth = getAuthCache();
      if (cachedAuth) {
        console.log("🔍 [AUTH] Loading from cache:", cachedAuth);
        setUserProfile(cachedAuth.userProfile);
        setAccountLevel(cachedAuth.accountLevel);
        setHasValidCache(true);
        // Reduce initializing time when we have valid cache
        setInitializing(false);
        setIsBackgroundVerifying(true);
      }
    };
    
    checkVersionAndInitialize();
  }, []);

  const updateAuthCache = useCallback(
    (user: User | null, userProfile: UserProfile | null, accountLevel: AccountLevel) => {
      setAuthCache(user, userProfile, accountLevel);
    },
    [],
  );

  const refreshUserProfile = useCallback(async () => {
    if (!user) {
      setUserProfile(null);
      setAccountLevel("free");
      clearAuthCache();
      return;
    }

    try {
      const profile = await UserManagementService.getUserProfile(user.uid);
      setUserProfile(profile);

      const newAccountLevel: AccountLevel =
        profile?.role === "super_admin" || profile?.role === "coach" ? "pro" : "free";
      setAccountLevel(newAccountLevel);

      updateAuthCache(user, profile, newAccountLevel);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
      setAccountLevel("free");
      updateAuthCache(user, null, "free");
    }
  }, [user, updateAuthCache]);

  useEffect(() => {
    if (!auth) {
      setInitializing(false);
      setIsBackgroundVerifying(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔍 [AUTH] Auth state changed:", firebaseUser?.uid ?? "logged out");
      setUser(firebaseUser);

      if (firebaseUser) {
        await UserManagementService.updateLastLogin(firebaseUser.uid);

        // Only fetch profile if we don't have valid cache, if profile differs, or if cache is stale
        const cachedAuth = getAuthCache();
        const shouldFetchProfile =
          !hasValidCache || !cachedAuth || cachedAuth.userProfile?.uid !== firebaseUser.uid || isCacheStale();

        if (shouldFetchProfile) {
          try {
            const profile = await UserManagementService.getUserProfile(firebaseUser.uid);
            setUserProfile(profile);

            const newAccountLevel: AccountLevel =
              profile?.role === "super_admin" || profile?.role === "coach" ? "pro" : "free";
            setAccountLevel(newAccountLevel);

            updateAuthCache(firebaseUser, profile, newAccountLevel);
          } catch (error) {
            console.error("Error fetching user profile:", error);
            // Only clear profile if we don't have valid cache fallback
            if (!hasValidCache) {
              setUserProfile(null);
              setAccountLevel("free");
            }
            updateAuthCache(firebaseUser, null, hasValidCache ? accountLevel : "free");
          }
        } else {
          console.log("🚀 [AUTH] Using cached profile data - background verification complete");
        }

        setHasValidCache(true);
      } else {
        setUserProfile(null);
        setAccountLevel("free");
        setHasValidCache(false);
        clearAuthCache();
      }

      setInitializing(false);
      setIsBackgroundVerifying(false);
    });

    return unsubscribe;
  }, [updateAuthCache, hasValidCache, accountLevel]);

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

      try {
        await createUserProfileViaAPI(result.user.uid, result.user.email!, finalDisplayName, role, coachId);
      } catch (profileError) {
        console.error("❌ [AUTH] Failed to create user profile:", profileError);
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
      clearAuthCache();
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
    const newLevel: AccountLevel = accountLevel === "free" ? "pro" : "free";
    setAccountLevel(newLevel);
    updateAuthCache(user, userProfile, newLevel);
  }, [accountLevel, user, userProfile, updateAuthCache]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      userProfile,
      loading,
      initializing,
      accountLevel,
      hasValidCache,
      isBackgroundVerifying,
      signIn,
      signUp,
      signInWithGoogle,
      logout,
      resetPassword,
      upgradeAccount,
      refreshUserProfile,
    }),
    [
      user,
      userProfile,
      loading,
      initializing,
      accountLevel,
      hasValidCache,
      isBackgroundVerifying,
      upgradeAccount,
      refreshUserProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export type { AccountLevel };
