import type { ReactNode } from 'react'

type Props = {
  title?: ReactNode
  description?: string
  children: ReactNode
  wide?: boolean
  /** Center page title and align dashboard blocks on one axis */
  centered?: boolean
}

export default function StudioPageShell({ title, description, children, wide, centered }: Props) {
  const pageClass = [
    'studio-page',
    wide ? 'studio-page--wide' : '',
    centered ? 'studio-page--centered' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <main id="main-content" className={pageClass}>
      {(title || description) ? (
        <header className="studio-page__header">
          {title ? <h1 className="studio-page__title">{title}</h1> : null}
          {description ? <p className="studio-page__desc">{description}</p> : null}
        </header>
      ) : null}
      <div className="studio-page__body">{children}</div>
    </main>
  )
}
