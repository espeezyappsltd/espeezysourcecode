'use client'

import { useProfile } from '@/context/ProfileContext'
import TeamChat from '@/components/TeamChat'

/** WhatsApp-style team chat FAB — replaces AI SupportChat on the dashboard shell. */
export default function TeamChatShell() {
  const { profile } = useProfile()

  if (!profile?.group_id) return null

  return <TeamChat groupId={profile.group_id} user={profile} />
}
