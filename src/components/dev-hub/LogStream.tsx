'use client'

import { useEffect, useRef } from 'react'
import { stripAnsi } from './stripAnsi'

type Props = {
  lines: string[]
  emptyMessage?: string
  autoScroll?: boolean
}

export function LogStream({ lines, emptyMessage, autoScroll = true }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autoScroll) return
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [lines, autoScroll])

  return (
    <div className="dev-hub-log-view" role="log" aria-live="polite">
      {lines.length === 0 && emptyMessage && (
        <p className="dev-hub-log-line dev-hub-log-line--muted">{emptyMessage}</p>
      )}
      {lines.map((line, i) => (
        <div key={`${i}-${line.slice(0, 32)}`} className="dev-hub-log-line">
          {stripAnsi(line)}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}
