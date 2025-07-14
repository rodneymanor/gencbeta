"use client";

import { useState, useCallback } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { UserNegativeKeywords, NegativeKeywordSettings } from "@/data/negative-keywords";

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const { auth } = await import("@/lib/firebase");

  if (!auth?.currentUser) {
    throw new Error("User not authenticated");
  }

  const token = await auth.currentUser.getIdToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// API functions
async function fetchNegativeKeywords(): Promise<UserNegativeKeywords> {
  const headers = await getAuthHeaders();

  const response = await fetch("/api/negative-keywords", {
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch negative keywords");
  }

  const data = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error ?? "Failed to fetch negative keywords");
  }

  return data.data;
}

async function updateNegativeKeywords(settings: NegativeKeywordSettings): Promise<UserNegativeKeywords> {
  const headers = await getAuthHeaders();

  const response = await fetch("/api/negative-keywords", {
    method: "PUT",
    headers,
    body: JSON.stringify({ settings }),
  });

  if (!response.ok) {
    throw new Error("Failed to update negative keywords");
  }

  const data = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error ?? "Failed to update negative keywords");
  }

  return data.data;
}

async function performKeywordAction(action: string, keyword?: string): Promise<UserNegativeKeywords> {
  const headers = await getAuthHeaders();

  const response = await fetch("/api/negative-keywords", {
    method: "POST",
    headers,
    body: JSON.stringify({ action, keyword }),
  });

  if (!response.ok) {
    throw new Error("Failed to perform keyword action");
  }

  const data = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error ?? "Failed to perform keyword action");
  }

  return data.data;
}

export function useNegativeKeywords() {
  const queryClient = useQueryClient();

  // Loading states
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [isRemovingKeyword, setIsRemovingKeyword] = useState(false);
  const [isTogglingDefault, setIsTogglingDefault] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Fetch negative keywords
  const {
    data: negativeKeywords,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["negative-keywords"],
    queryFn: fetchNegativeKeywords,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: updateNegativeKeywords,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negative-keywords"] });
    },
  });

  // Keyword action mutations
  const keywordActionMutation = useMutation({
    mutationFn: ({ action, keyword }: { action: string; keyword?: string }) => performKeywordAction(action, keyword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negative-keywords"] });
    },
  });

  // Wrapper functions with loading states
  const handleUpdateSettings = useCallback(
    async (settings: NegativeKeywordSettings): Promise<UserNegativeKeywords | null> => {
      setIsUpdating(true);
      try {
        const result = await updateSettingsMutation.mutateAsync(settings);
        return result;
      } catch (error) {
        console.error("Update settings error:", error);
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [updateSettingsMutation],
  );

  const handleAddCustomKeyword = useCallback(
    async (keyword: string): Promise<UserNegativeKeywords | null> => {
      setIsAddingKeyword(true);
      try {
        const result = await keywordActionMutation.mutateAsync({
          action: "add_custom",
          keyword,
        });
        return result;
      } catch (error) {
        console.error("Add custom keyword error:", error);
        throw error;
      } finally {
        setIsAddingKeyword(false);
      }
    },
    [keywordActionMutation],
  );

  const handleRemoveCustomKeyword = useCallback(
    async (keyword: string): Promise<UserNegativeKeywords | null> => {
      setIsRemovingKeyword(true);
      try {
        const result = await keywordActionMutation.mutateAsync({
          action: "remove_custom",
          keyword,
        });
        return result;
      } catch (error) {
        console.error("Remove custom keyword error:", error);
        return null;
      } finally {
        setIsRemovingKeyword(false);
      }
    },
    [keywordActionMutation],
  );

  const handleToggleDefaultKeyword = useCallback(
    async (keyword: string): Promise<UserNegativeKeywords | null> => {
      setIsTogglingDefault(true);
      try {
        const result = await keywordActionMutation.mutateAsync({
          action: "toggle_default",
          keyword,
        });
        return result;
      } catch (error) {
        console.error("Toggle default keyword error:", error);
        return null;
      } finally {
        setIsTogglingDefault(false);
      }
    },
    [keywordActionMutation],
  );

  const handleResetToDefault = useCallback(async (): Promise<UserNegativeKeywords | null> => {
    setIsResetting(true);
    try {
      const result = await keywordActionMutation.mutateAsync({
        action: "reset_to_default",
      });
      return result;
    } catch (error) {
      console.error("Reset to default error:", error);
      return null;
    } finally {
      setIsResetting(false);
    }
  }, [keywordActionMutation]);

  return {
    // Data
    negativeKeywords,
    isLoading,
    error,

    // Actions
    updateSettings: handleUpdateSettings,
    addCustomKeyword: handleAddCustomKeyword,
    removeCustomKeyword: handleRemoveCustomKeyword,
    toggleDefaultKeyword: handleToggleDefaultKeyword,
    resetToDefault: handleResetToDefault,
    refetch,

    // Loading states
    isUpdating,
    isAddingKeyword,
    isRemovingKeyword,
    isTogglingDefault,
    isResetting,
  };
}
