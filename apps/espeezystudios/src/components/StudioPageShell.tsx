import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  children: ReactNode
  wide?: boolean
}

export default function StudioPageShell({ title, description, children, wide }: Props) {
  return (
    <main className={`studio-page${wide ? ' studio-page--wide' : ''}`}>
      <header className="studio-page__header">
        <h1 className="studio-page__title">{title}</h1>
        {description ? <p className="studio-page__desc">{description}</p> : null}
      </header>
      <div className="studio-page__body">{children}</div>
    </main>
  )
}
