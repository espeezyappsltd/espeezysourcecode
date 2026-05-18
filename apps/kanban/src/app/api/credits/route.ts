import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { getUserCredits } from '@/lib/marketplace/checkout-service'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = await getRequestUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const credits = await getUserCredits(user.id)
    return NextResponse.json({ credits })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not load credits'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
