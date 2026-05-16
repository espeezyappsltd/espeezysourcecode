import { NextRequest, NextResponse } from 'next/server';
import { addCategory, getCategoriesWithGames } from '@/services/categories';
import { getErrorMessage } from '@/utils/errors';

export async function GET() {
  try {
    const categories = await getCategoriesWithGames();
    return NextResponse.json(categories);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const category = await addCategory(name);
    return NextResponse.json(category);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
