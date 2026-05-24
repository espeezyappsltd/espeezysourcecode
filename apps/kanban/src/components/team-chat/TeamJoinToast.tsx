'use client'

export function TeamJoinToast({ name, onDismiss }: { name: string; onDismiss?: () => void }) {
  return (
    <div
      className="team-chat-join-toast"
      role="status"
      aria-live="polite"
      onClick={onDismiss}
    >
      <strong>{name}</strong> joined team chat
    </div>
  )
}
