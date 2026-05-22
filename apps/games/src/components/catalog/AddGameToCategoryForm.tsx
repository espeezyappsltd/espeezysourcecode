'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'
import Link from 'next/link'

type AddGameToCategoryFormProps = {
  categoryId: string
  categoryName: string
  onAdded: () => void
}

export function AddGameToCategoryForm({ categoryId, categoryName, onAdded }: AddGameToCategoryFormProps) {
  const user = useSupabaseUser()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!user) {
    return (
      <p className="games-add-game games-add-game--signin">
        <Link href={`/login?next=/categories/${categoryId}`}>Sign in</Link> to add a game to {categoryName}.
      </p>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedName = name.trim()
    const trimmedUrl = url.trim()
    if (!trimmedName || !trimmedUrl) {
      setError('Name and play URL are required.')
      return
    }
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setError('Play URL must start with http:// or https://')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ categoryId, name: trimmedName, url: trimmedUrl }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Could not add game.')
        return
      }
      setName('')
      setUrl('')
      setSuccess(`Added "${trimmedName}" to the list.`)
      onAdded()
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="games-add-game ui-panel" aria-labelledby="add-game-heading">
      <h2 id="add-game-heading" className="games-add-game__title">
        <Plus size={18} aria-hidden />
        Add a game to this category
      </h2>
      <p className="games-add-game__hint">
        Anyone signed in can suggest a new title for <strong>{categoryName}</strong>. You cannot edit or remove
        existing entries.
      </p>
      <form className="games-add-game__form" onSubmit={(e) => void handleSubmit(e)}>
        <label className="games-add-game__field">
          <span>Game name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Logic Sprint"
            maxLength={120}
            required
            disabled={submitting}
          />
        </label>
        <label className="games-add-game__field">
          <span>Play URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            required
            disabled={submitting}
          />
        </label>
        {error ? (
          <p className="games-add-game__message games-add-game__message--error" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="games-add-game__message games-add-game__message--ok" role="status">
            {success}
          </p>
        ) : null}
        <button type="submit" className="games-add-game__submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add to category'}
        </button>
      </form>
    </section>
  )
}
