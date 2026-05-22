export function AdminPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="admin-console-page-header">
      <h1 className="admin-console-page-title">{title}</h1>
      {description && <p className="admin-console-page-desc">{description}</p>}
    </header>
  )
}
