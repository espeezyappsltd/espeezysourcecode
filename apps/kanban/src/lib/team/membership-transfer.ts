const JOIN_REQUEST_TAG = '[JOIN REQUEST]'

export function formatJoinRequestChatContent(senderName: string, customMessage?: string | null): string {
  const intro = `👋 ${JOIN_REQUEST_TAG} I'd like to join the team. I'm ${senderName.trim() || 'A student'}.`
  const extra = customMessage?.trim()
  if (!extra) return intro
  return `${intro}\n\n${extra.slice(0, 500)}`
}

export { JOIN_REQUEST_TAG }
