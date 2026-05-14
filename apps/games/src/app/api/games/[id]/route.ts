import { NextRequest, NextResponse } from 'next/server';
import { updateGame, deleteGame } from '@/services/categories';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, url } = await req.json();
    if (!name || !url) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const game = await updateGame(params.id, name, url);
    return NextResponse.json(game);
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteGame(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
