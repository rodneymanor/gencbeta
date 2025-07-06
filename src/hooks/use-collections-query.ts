import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsRBACService } from "@/lib/collections-rbac";

// Query keys for React Query
export const collectionsKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionsKeys.all, 'list'] as const,
  list: (userId: string) => [...collectionsKeys.lists(), userId] as const,
  videos: () => [...collectionsKeys.all, 'videos'] as const,
  videosByCollection: (userId: string, collectionId?: string) => 
    [...collectionsKeys.videos(), userId, collectionId] as const,
};

// Hook to fetch user collections
export function useCollectionsQuery() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: collectionsKeys.list(user?.uid ?? ''),
    queryFn: async () => {
      if (!user?.uid) throw new Error('User not authenticated');
      return await CollectionsRBACService.getUserCollections(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to fetch videos for a collection
export function useCollectionVideosQuery(collectionId?: string | null) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: collectionsKeys.videosByCollection(user?.uid ?? '', collectionId ?? undefined),
    queryFn: async () => {
      if (!user?.uid) throw new Error('User not authenticated');
      return await CollectionsRBACService.getCollectionVideos(user.uid, collectionId ?? undefined);
    },
    enabled: !!user?.uid,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to prefetch collections data
export function usePrefetchCollections() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetchCollections = async () => {
    if (!user?.uid) return;
    
    await queryClient.prefetchQuery({
      queryKey: collectionsKeys.list(user.uid),
      queryFn: () => CollectionsRBACService.getUserCollections(user.uid),
      staleTime: 2 * 60 * 1000,
    });
  };

  const prefetchVideos = async (collectionId?: string | null) => {
    if (!user?.uid) return;
    
    await queryClient.prefetchQuery({
      queryKey: collectionsKeys.videosByCollection(user.uid, collectionId ?? undefined),
      queryFn: () => CollectionsRBACService.getCollectionVideos(user.uid, collectionId ?? undefined),
      staleTime: 30 * 1000,
    });
  };

  return { prefetchCollections, prefetchVideos };
}

// Hook to invalidate collections cache
export function useInvalidateCollections() {
  const queryClient = useQueryClient();
  
  const invalidateCollections = () => {
    queryClient.invalidateQueries({ queryKey: collectionsKeys.lists() });
  };

  const invalidateVideos = (userId: string, collectionId?: string) => {
    queryClient.invalidateQueries({ 
      queryKey: collectionsKeys.videosByCollection(userId, collectionId) 
    });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: collectionsKeys.all });
  };

  return { invalidateCollections, invalidateVideos, invalidateAll };
} 