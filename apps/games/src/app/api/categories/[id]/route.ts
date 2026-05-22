import { NextResponse } from 'next/server';

export async function PATCH() {
  return NextResponse.json(
    { error: 'Editing categories is not allowed. You can add games to existing categories only.' },
    { status: 403 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Deleting categories is not allowed. You can add games to existing categories only.' },
    { status: 403 },
  );
}
