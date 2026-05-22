import { useCallback, useEffect, useState } from 'react';
import { getCategoriesWithGames } from '@/services/categories';
import type { Category } from '@/types/games';

export function useCategoriesWithGames() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCategoriesWithGames()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return { categories, loading, error, refresh };
}
