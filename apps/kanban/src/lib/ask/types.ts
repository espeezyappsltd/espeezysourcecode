export type AskResourceKind = 'tutorial' | 'doc' | 'tool' | 'link' | 'video'

export type AskCategoryId =
  | 'getting-started'
  | 'tutorials'
  | 'espeezy-docs'
  | 'tools-apis'
  | 'campus'
  | 'external'

export type AskCategoryFilter = AskCategoryId | 'all'

export interface AskResource {
  id: string
  title: string
  description: string
  url: string
  category: AskCategoryId
  kind: AskResourceKind
  tags: string[]
  /** Opens in a new tab when true */
  external?: boolean
}

export const ASK_CATEGORY_LABELS: Record<AskCategoryId, string> = {
  'getting-started': 'Getting started',
  tutorials: 'Tutorials',
  'espeezy-docs': 'Espeezy docs',
  'tools-apis': 'Tools & APIs',
  campus: 'Campus & credits',
  external: 'Web links',
}

export const ASK_CATEGORY_ORDER: AskCategoryId[] = [
  'getting-started',
  'tutorials',
  'espeezy-docs',
  'tools-apis',
  'campus',
  'external',
]
