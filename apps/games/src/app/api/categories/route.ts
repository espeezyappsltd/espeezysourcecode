import { NextRequest, NextResponse } from 'next/server';
import { getCategoriesWithGames } from '@/services/categories';
import { getErrorMessage } from '@/utils/errors';

export async function GET() {
  try {
    const categories = await getCategoriesWithGames();
    return NextResponse.json(categories);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

/** Categories are managed by admins/seed only — users add games, not categories. */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'Adding categories is not allowed. You can add games to existing categories only.' },
    { status: 403 },
  );
}
