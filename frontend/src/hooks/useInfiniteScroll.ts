import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  threshold?: number;
  rootMargin?: string;
}

// NOTE: Hook for infinite scroll using IntersectionObserver
export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  loading,
  threshold = 0.1,
  rootMargin = '100px',
}: UseInfiniteScrollOptions) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    // NOTE: Create IntersectionObserver
    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin,
      threshold,
    });

    // NOTE: Observe target element if it exists
    const currentTarget = targetRef.current;
    if (currentTarget) {
      observerRef.current.observe(currentTarget);
    }

    // NOTE: Cleanup observer on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersect, rootMargin, threshold]);

  return targetRef;
};
