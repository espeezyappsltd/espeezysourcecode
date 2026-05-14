import { useEffect, useState } from 'react';
import { getCategoriesPaginated } from '@/services/categories-paginated';
import type { Category } from '@/types/games';

export function useCategoriesPaginated(page: number, pageSize: number) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategoriesPaginated(page, pageSize)
      .then(({ data, count }) => {
        setCategories(data);
        setCount(count || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  return { categories, count, loading, error };
}
