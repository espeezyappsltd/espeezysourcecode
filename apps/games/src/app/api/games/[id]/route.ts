import { NextResponse } from 'next/server';

export async function PATCH() {
  return NextResponse.json(
    { error: 'Editing games is not allowed. You can add new games to a category only.' },
    { status: 403 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Deleting games is not allowed. You can add new games to a category only.' },
    { status: 403 },
  );
}
