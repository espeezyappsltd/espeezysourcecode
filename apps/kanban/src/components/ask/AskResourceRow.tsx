'use client'

import Link from 'next/link'
import { ExternalLink, FileText, Link2, PlayCircle, Wrench, type LucideIcon } from 'lucide-react'
import type { AskResource } from '@/lib/ask/types'
import { ASK_CATEGORY_LABELS } from '@/lib/ask/types'
import { askCategoryUrl } from '@/lib/nav/category-url'

const KIND_ICON: Record<AskResource['kind'], LucideIcon> = {
  tutorial: PlayCircle,
  doc: FileText,
  tool: Wrench,
  link: Link2,
  video: PlayCircle,
}

type Props = {
  resource: AskResource
  searchQuery?: string | null
}

export function AskResourceRow({ resource, searchQuery }: Props) {
  const Icon = KIND_ICON[resource.kind]
  const external = resource.external ?? resource.url.startsWith('http')
  const categoryHref = askCategoryUrl(resource.category, { q: searchQuery ?? undefined })

  return (
    <article className="ask-row">
      <div className="ask-row__icon" aria-hidden>
        <Icon size={16} strokeWidth={2.25} />
      </div>
      <div className="ask-row__body">
        <div className="ask-row__top">
          <h3 className="ask-row__title">
            {external ? (
              <a
                href={resource.url}
                className="ask-row__title-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {resource.title}
                <ExternalLink size={13} className="ask-row__ext" aria-hidden />
              </a>
            ) : (
              <Link href={resource.url} className="ask-row__title-link">
                {resource.title}
              </Link>
            )}
          </h3>
          <Link href={categoryHref} className="ask-row__cat">
            {ASK_CATEGORY_LABELS[resource.category]}
          </Link>
        </div>
        <p className="ask-row__desc">{resource.description}</p>
        {resource.tags.length > 0 ? (
          <ul className="ask-row__tags" aria-label="Tags">
            {resource.tags.slice(0, 5).map((tag) => (
              <li key={tag} className="ask-row__tag">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="ask-row__kind" title={resource.kind}>
        <Icon size={12} aria-hidden />
        <span>{resource.kind}</span>
      </div>
    </article>
  )
}
