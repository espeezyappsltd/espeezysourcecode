import { NextResponse } from 'next/server'
import { DATA_API_DATASETS } from '@/config/dataApiCatalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL ||
    ''

  return NextResponse.json({
    platform: 'Supabase',
    service: 'PostgREST',
    projectUrl: supabaseUrl,
    generatedAt: new Date().toISOString(),
    endpoints: DATA_API_DATASETS.map((dataset) => ({
      ...dataset,
      protocol: 'REST',
      hint: `Query the public.${dataset.table} table via Supabase client or REST.`,
    })),
    usage: {
      client: {
        method: '@supabase/supabase-js',
        auth: 'Supabase Auth (JWT)',
      },
      note: 'Use the Supabase anon key for client reads and the service role key only on trusted servers.',
    },
  })
}
