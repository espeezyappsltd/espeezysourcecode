import { redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function LegacyDonationIdPage({ params }: PageProps) {
  await params
  redirect('/upgrade')
}
