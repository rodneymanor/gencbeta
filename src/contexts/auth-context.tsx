"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

import { onAuthStateChanged, User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { FullUserProfile } from "@/types/user";

type AccountLevel = "free" | "pro" | "team";

interface AuthContextType {
  user: User | null;
  userProfile: FullUserProfile | null;
  accountLevel: AccountLevel;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchUserProfile = async (uid: string): Promise<FullUserProfile | null> => {
  try {
    console.log("🔍 [AUTH] Fetching user profile for:", uid);
    const response = await fetch("/api/user/profile");
    if (!response.ok) {
      console.error("❌ [AUTH] Failed to fetch user profile:", response.statusText);
      return null;
    }
    const profile = await response.json();
    console.log("✅ [AUTH] Fetched user profile:", profile);
    return profile;
  } catch (error) {
    console.error("❌ [AUTH] Error fetching user profile:", error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<FullUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserFromCache = useCallback(() => {
    const cachedData = localStorage.getItem("authCache");
    if (cachedData) {
      const { user: cachedUser, userProfile: cachedProfile, timestamp } = JSON.parse(cachedData);
      const isCacheValid = (new Date().getTime() - timestamp) / (1000 * 60) < 15; // 15 min cache

      if (isCacheValid) {
        console.log("🔍 [AUTH] Loading from cache:", { user: cachedUser, userProfile: cachedProfile });
        setUser(cachedUser);
        setUserProfile(cachedProfile);
        setLoading(false);
        return true;
      }
    }
    return false;
  }, []);

  const cacheUser = (user: User, profile: FullUserProfile) => {
    const cacheData = {
      user,
      userProfile: profile,
      timestamp: new Date().getTime(),
    };
    localStorage.setItem("authCache", JSON.stringify(cacheData));
  };

  useEffect(() => {
    if (loadUserFromCache()) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔍 [AUTH] Auth state changed:", firebaseUser?.uid);
      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await fetchUserProfile(firebaseUser.uid);
        if (profile) {
          setUserProfile(profile);
          cacheUser(firebaseUser, profile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem("authCache");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserFromCache]);

  const accountLevel = useMemo((): AccountLevel => {
    if (!userProfile) return "free";
    if (userProfile.role === "super_admin" || userProfile.role === "coach") return "team";
    // Add more logic for different tiers if necessary
    return "pro";
  }, [userProfile]);

  const logout = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem("authCache");
    console.log("✅ [AUTH] User logged out");
  }, []);

  const value = useMemo(
    () => ({
      user,
      userProfile,
      accountLevel,
      loading,
      logout,
    }),
    [user, userProfile, accountLevel, loading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
