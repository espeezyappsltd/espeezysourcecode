import { NextResponse } from 'next/server'
import { DATA_API_DATASETS } from '@/config/dataApiCatalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'espeezylearning'
  
  return NextResponse.json({
    platform: 'Firebase',
    service: 'Data Connect',
    generatedAt: new Date().toISOString(),
    endpoints: DATA_API_DATASETS.map((dataset) => ({
      ...dataset,
      protocol: 'GraphQL',
      hint: `Use Firebase Data Connect SDK to query the ${dataset.table} collection.`
    })),
    usage: {
      client: {
        method: 'Firebase SDK',
        auth: 'Firebase Auth (Identity Platform)',
      },
      note: 'The legacy Supabase REST API has been decommissioned. Please migrate to the Firebase Data Connect GraphQL interface.',
    },
  })
}
