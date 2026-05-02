import { NextResponse } from 'next/server'
import { DATA_API_DATASETS } from '@/config/dataApiCatalog'

export const dynamic = 'force-dynamic'

const FALLBACK_DATA_API = 'https://othntbcrtmemavfsslrb.db.co/rest/v1'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`
    : FALLBACK_DATA_API

  return NextResponse.json({
    schema: 'api',
    baseUrl,
    generatedAt: new Date().toISOString(),
    endpoints: DATA_API_DATASETS.map((dataset) => ({
      ...dataset,
      method: 'GET',
      url: `${baseUrl}/${dataset.table}?${dataset.filterHint}`,
    })),
    usage: {
      browser: {
        apikey: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        authorization: 'Bearer <user_jwt_or_anon_key>',
      },
      server: {
        apikey: 'SUPABASE_SERVICE_ROLE_KEY',
        authorization: 'Bearer <SUPABASE_SERVICE_ROLE_KEY>',
      },
      note: 'Keep service-role keys server-side only. Do not expose service-role credentials in browser code.',
    },
  })
}
