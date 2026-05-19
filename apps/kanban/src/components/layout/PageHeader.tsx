import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type PageHeaderVariant = 'default' | 'compact' | 'center' | 'bar'

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  icon?: LucideIcon
  titleAccent?: ReactNode
  actions?: ReactNode
  aside?: ReactNode
  meta?: ReactNode
  variant?: PageHeaderVariant
  className?: string
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  titleAccent,
  actions,
  aside,
  meta,
  variant = 'default',
  className = '',
}: PageHeaderProps) {
  const variantClass = variant === 'default' ? '' : `page-header--${variant}`
  const classes = ['page-header', variantClass, className].filter(Boolean).join(' ')

  return (
    <header className={classes}>
      <div className="page-header__main">
        <div className="page-header__lead">
          {Icon ? (
            <span className="page-header__icon" aria-hidden>
              <Icon size={variant === 'compact' ? 20 : 24} strokeWidth={2.25} />
            </span>
          ) : null}
          <div className="page-header__copy">
            <h1 className="page-header__title">
              {title}
              {titleAccent != null && titleAccent !== '' ? (
                <>
                  {' '}
                  <span className="page-header__title-accent">{titleAccent}</span>
                </>
              ) : null}
            </h1>
            {description ? <p className="page-header__desc">{description}</p> : null}
          </div>
        </div>
        {meta}
      </div>
      {aside ? <div className="page-header__aside">{aside}</div> : null}
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  )
}
