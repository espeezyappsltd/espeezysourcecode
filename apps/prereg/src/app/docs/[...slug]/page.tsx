import DocsSlugContent from './DocsSlugContent'

export function generateStaticParams() {
  return [
    { slug: ['getting-started'] },
    { slug: ['installation'] },
    { slug: ['features', 'kanban'] },
    { slug: ['features', 'roadmap'] },
    { slug: ['features', 'network'] },
    { slug: ['features', 'marketplace'] },
    { slug: ['features', 'skirmish'] },
    { slug: ['features', 'search'] },
    { slug: ['infra', 'payments'] },
    { slug: ['infra', 'sync'] },
    { slug: ['infra', 'presence'] },
    { slug: ['refund-policy'] },
    { slug: ['vision'] },
    { slug: ['impact'] },
  ]
}

export default function DocsDynamicPage() {
  return <DocsSlugContent />
}
