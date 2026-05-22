import { NextRequest, NextResponse } from 'next/server';
import { requireGamesUser } from '@/lib/require-games-user';
import { getCategoriesWithGames } from '@/services/categories';
import type { Category } from '@/types/games';
import type { GameWithCategory } from '@/types/api';
import { getErrorMessage } from '@/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireGamesUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { categoryId, name, url } = await req.json();
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedUrl = typeof url === 'string' ? url.trim() : '';

    if (!categoryId || !trimmedName || !trimmedUrl) {
      return NextResponse.json({ error: 'Category, name, and URL are required.' }, { status: 400 });
    }
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      return NextResponse.json({ error: 'URL must start with http:// or https://' }, { status: 400 });
    }

    const { data: category, error: catErr } = await auth.supabase!
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .maybeSingle();

    if (catErr) throw catErr;
    if (!category) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    const { data: game, error: insErr } = await auth.supabase!
      .from('games')
      .insert([{ category_id: categoryId, name: trimmedName, url: trimmedUrl }])
      .select()
      .single();

    if (insErr) throw insErr;
    return NextResponse.json(game);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const categories = await getCategoriesWithGames();
    const games = categories.flatMap((cat: Category) =>
      (cat.games ?? []).map((g) => ({
        ...g,
        category: cat.name,
        categoryId: cat.id,
      } satisfies GameWithCategory)),
    );
    return NextResponse.json(games);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
