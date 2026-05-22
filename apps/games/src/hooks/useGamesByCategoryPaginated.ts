'use client';

import { useCallback, useEffect, useState } from 'react';
import { getGamesByCategoryPaginated } from '@/services/categories-paginated';
import type { Game } from '@/types/games';

export function useGamesByCategoryPaginated(categoryId: string, page: number, pageSize: number) {
  const [games, setGames] = useState<Game[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getGamesByCategoryPaginated(categoryId, page, pageSize)
      .then(({ data, count }) => {
        if (!cancelled) {
          setGames(data);
          setCount(count || 0);
        }
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
  }, [categoryId, page, pageSize, refreshKey]);

  return { games, count, loading, error, reload };
}
