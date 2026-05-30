import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const data = await req.json();
  // TODO: Validate and securely store deposit data
  // For now, just echo back
  return NextResponse.json({ status: 'ok', received: data });
}
