import { useEffect, useState } from 'react';
import { getCategoriesWithGames } from '@/services/categories';
import type { Category } from '@/types/games';

export function useCategoriesWithGames() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategoriesWithGames()
      .then((data) => setCategories(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading, error };
}
