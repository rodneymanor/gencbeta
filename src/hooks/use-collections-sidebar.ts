"use client";

import { useState, useEffect, useCallback } from "react";

import { Folder, FolderOpen } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Collection } from "@/lib/collections";
import { type NavGroup, type NavMainItem } from "@/navigation/sidebar/sidebar-items";

export function useCollectionsSidebar(baseItems: readonly NavGroup[]) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const loadCollections = useCallback(async () => {
    if (!user) {
      setCollections([]);
      return;
    }

    setIsLoading(true);
    try {
      const userCollections = await CollectionsService.getUserCollections(user.uid);
      setCollections(userCollections);
    } catch (error) {
      console.error("Error loading collections:", error);
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Build dynamic sidebar items with collections
  const sidebarItems = baseItems.map((group) => {
    if (group.label === "Collections") {
      const collectionsItems: NavMainItem[] = [
        {
          title: "All Videos",
          url: "/research/collections",
          icon: FolderOpen,
        },
      ];

      // Add user collections
      collections.forEach((collection) => {
        collectionsItems.push({
          title: collection.title,
          url: `/research/collections?collection=${collection.id}`,
          icon: Folder,
        });
      });

      return {
        ...group,
        items: collectionsItems,
      };
    }
    return group;
  });

  return {
    sidebarItems,
    collections,
    isLoading,
    loadCollections,
    refreshCollections: loadCollections,
  };
}
