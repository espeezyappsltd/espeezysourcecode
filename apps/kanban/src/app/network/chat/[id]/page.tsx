import { redirect } from 'next/navigation'

type PageProps = { params: Promise<{ id: string }> }

/** Legacy route — peer chat lives at /network/messages/[id] */
export default async function LegacyChatRedirect({ params }: PageProps) {
  const { id } = await params
  redirect(`/network/messages/${id}`)
}
