import { processTaskCommitWebhook } from '@/lib/supabase/commit-task-sync'
export const dynamic = 'force-dynamic'


export async function POST(req: Request) {
  return processTaskCommitWebhook(await req.text(), req.headers.get('x-hub-signature-256'))
}
