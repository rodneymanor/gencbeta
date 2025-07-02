"use client";

import { useState, useCallback } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Script, CreateScriptRequest, UpdateScriptRequest, ScriptsResponse, ScriptResponse } from "@/types/script";

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  // Import auth here to avoid SSR issues
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

// API Functions
async function fetchScripts(): Promise<Script[]> {
  const headers = await getAuthHeaders();

  const response = await fetch("/api/scripts", {
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch scripts");
  }

  const data: ScriptsResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error ?? "Failed to fetch scripts");
  }

  return data.scripts;
}

async function createScript(scriptData: CreateScriptRequest): Promise<Script> {
  const headers = await getAuthHeaders();

  const response = await fetch("/api/scripts", {
    method: "POST",
    headers,
    body: JSON.stringify(scriptData),
  });

  if (!response.ok) {
    throw new Error("Failed to create script");
  }

  const data: ScriptResponse = await response.json();

  if (!data.success || !data.script) {
    throw new Error(data.error ?? "Failed to create script");
  }

  return data.script;
}

async function updateScript(scriptId: string, updates: UpdateScriptRequest): Promise<Script> {
  const headers = await getAuthHeaders();

  const response = await fetch(`/api/scripts/${scriptId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("Failed to update script");
  }

  const data: ScriptResponse = await response.json();

  if (!data.success || !data.script) {
    throw new Error(data.error ?? "Failed to update script");
  }

  return data.script;
}

async function deleteScript(scriptId: string): Promise<void> {
  const headers = await getAuthHeaders();

  const response = await fetch(`/api/scripts/${scriptId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to delete script");
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error ?? "Failed to delete script");
  }
}

async function fetchScript(scriptId: string): Promise<Script> {
  const headers = await getAuthHeaders();

  const response = await fetch(`/api/scripts/${scriptId}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch script");
  }

  const data: ScriptResponse = await response.json();

  if (!data.success || !data.script) {
    throw new Error(data.error ?? "Failed to fetch script");
  }

  return data.script;
}

// Custom Hook
export function useScripts() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all scripts
  const {
    data: scripts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["scripts"],
    queryFn: fetchScripts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create script mutation
  const createScriptMutation = useMutation({
    mutationFn: createScript,
    onSuccess: (newScript) => {
      // Add the new script to the cache
      queryClient.setQueryData(["scripts"], (oldScripts: Script[] = []) => [newScript, ...oldScripts]);
    },
    onError: (error) => {
      console.error("Failed to create script:", error);
    },
  });

  // Update script mutation
  const updateScriptMutation = useMutation({
    mutationFn: ({ scriptId, updates }: { scriptId: string; updates: UpdateScriptRequest }) =>
      updateScript(scriptId, updates),
    onSuccess: (updatedScript) => {
      // Update the script in the cache
      queryClient.setQueryData(["scripts"], (oldScripts: Script[] = []) =>
        oldScripts.map((script) => (script.id === updatedScript.id ? updatedScript : script)),
      );
    },
    onError: (error) => {
      console.error("Failed to update script:", error);
    },
  });

  // Delete script mutation
  const deleteScriptMutation = useMutation({
    mutationFn: deleteScript,
    onSuccess: (_, scriptId) => {
      // Remove the script from the cache
      queryClient.setQueryData(["scripts"], (oldScripts: Script[] = []) =>
        oldScripts.filter((script) => script.id !== scriptId),
      );
    },
    onError: (error) => {
      console.error("Failed to delete script:", error);
    },
  });

  // Wrapper functions with loading states
  const handleCreateScript = useCallback(
    async (scriptData: CreateScriptRequest): Promise<Script | null> => {
      setIsCreating(true);
      try {
        const result = await createScriptMutation.mutateAsync(scriptData);
        return result;
      } catch (error) {
        console.error("Create script error:", error);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [createScriptMutation],
  );

  const handleUpdateScript = useCallback(
    async (scriptId: string, updates: UpdateScriptRequest): Promise<Script | null> => {
      setIsUpdating(true);
      try {
        const result = await updateScriptMutation.mutateAsync({ scriptId, updates });
        return result;
      } catch (error) {
        console.error("Update script error:", error);
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [updateScriptMutation],
  );

  const handleDeleteScript = useCallback(
    async (scriptId: string): Promise<boolean> => {
      setIsDeleting(true);
      try {
        await deleteScriptMutation.mutateAsync(scriptId);
        return true;
      } catch (error) {
        console.error("Delete script error:", error);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteScriptMutation],
  );

  return {
    // Data
    scripts,
    isLoading,
    error,

    // Actions
    createScript: handleCreateScript,
    updateScript: handleUpdateScript,
    deleteScript: handleDeleteScript,
    refetch,

    // Loading states
    isCreating,
    isUpdating,
    isDeleting,
  };
}

// Hook for fetching a single script
export function useScript(scriptId: string | null) {
  return useQuery({
    queryKey: ["script", scriptId],
    queryFn: () => fetchScript(scriptId!),
    enabled: !!scriptId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
