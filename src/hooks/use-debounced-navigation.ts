import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// Simple debounce function
function debounce<T extends (...args: unknown[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function useDebouncedNavigation(delay = 200) {
  const router = useRouter();

  const debouncedNavigate = useRef(
    debounce((path: string, options?: { scroll?: boolean }) => {
      router.push(path, options);
    }, delay),
  ).current;

  const navigateToCollection = useCallback(
    (collectionId: string | null) => {
      const path = collectionId ? `/research/collections?collection=${collectionId}` : "/research/collections";
      debouncedNavigate(path, { scroll: false });
    },
    [debouncedNavigate],
  );

  return { navigateToCollection, debouncedNavigate };
}
