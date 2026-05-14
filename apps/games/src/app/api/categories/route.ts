import { NextRequest, NextResponse } from 'next/server';
import { addCategory, updateCategory, deleteCategory, getCategoriesWithGames } from '@/services/categories';

export async function GET() {
  try {
    const categories = await getCategoriesWithGames();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const category = await addCategory(name);
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
