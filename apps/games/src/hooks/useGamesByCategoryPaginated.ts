'use client'

import { useEffect, useState } from 'react';
import { getGamesByCategoryPaginated } from '@/services/categories-paginated';
import type { Game } from '@/types/games';

export function useGamesByCategoryPaginated(categoryId: string, page: number, pageSize: number) {
  const [games, setGames] = useState<Game[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGamesByCategoryPaginated(categoryId, page, pageSize)
      .then(({ data, count }) => {
        setGames(data);
        setCount(count || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [categoryId, page, pageSize]);

  return { games, count, loading, error };
}
