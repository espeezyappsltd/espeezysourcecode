import Link from 'next/link'
import AppCopyrightStrip from '@shared/AppCopyrightStrip'
import { FOOTER_LEGAL_LINKS } from '@shared/platform-legal'

export default function ArticlesPageFooter() {
  return (
    <footer
      style={{
        marginTop: '3rem',
        paddingTop: '2rem',
        borderTop: '1px solid rgba(15, 23, 42, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'center',
        textAlign: 'center',
      }}
      aria-label="Site footer"
    >
      <nav aria-label="Footer links" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem', justifyContent: 'center' }}>
        {FOOTER_LEGAL_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
            {label}
          </Link>
        ))}
        <Link href="https://espeezy.com" style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
          Espeezy home
        </Link>
      </nav>
      <AppCopyrightStrip style={{ color: '#64748b' }} showTagline />
    </footer>
  )
}
