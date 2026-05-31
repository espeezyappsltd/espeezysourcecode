import EspeezyAppLogo from '@shared/EspeezyAppLogo'
import FooterCopyrightNotice from '@shared/FooterCopyrightNotice'
import { FOOTER_BRAND_BLURB } from '@shared/platform-brand'
import { FOOTER_LEGAL_LINKS } from '@shared/platform-legal'
import { ESPEEZY_PUBLIC_APP_LINKS } from '@shared/espeezy-apps-catalog'
import { ESPEEZY_APP_ORIGINS } from '@shared/app-url'

const PLATFORM_LINKS = [
  { href: ESPEEZY_APP_ORIGINS.prereg, label: 'Home' },
  { href: `${ESPEEZY_APP_ORIGINS.prereg}/#use-cases`, label: 'Use cases' },
  { href: `${ESPEEZY_APP_ORIGINS.prereg}/pricing`, label: 'Pricing' },
  { href: `${ESPEEZY_APP_ORIGINS.prereg}/contact`, label: 'Contact' },
] as const

export default function ArticlesSiteFooter() {
  return (
    <footer className="articles-footer" aria-label="Site footer">
      <div className="articles-footer__grid">
        <div className="articles-footer__brand">
          <EspeezyAppLogo app="articles" variant="nav" />
          <p>
            Published articles and essays from the Espeezy community. {FOOTER_BRAND_BLURB.split('.')[0]}.
          </p>
        </div>

        <div>
          <h2 className="articles-footer__heading">Platform</h2>
          <ul className="articles-footer__list">
            {PLATFORM_LINKS.map(({ href, label }) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="articles-footer__heading">Apps</h2>
          <ul className="articles-footer__list">
            {ESPEEZY_PUBLIC_APP_LINKS.filter((link) => !link.label.startsWith('Articles')).map(({ href, label }) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="articles-footer__heading">Legal</h2>
          <ul className="articles-footer__list">
            {FOOTER_LEGAL_LINKS.map(({ href, label }) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="articles-footer__bar">
        <FooterCopyrightNotice style={{ color: '#64748b' }} />
      </div>
    </footer>
  )
}
