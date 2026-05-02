'use client'

import dynamic from 'next/dynamic'

// Dynamic imports with ssr:false are only valid in Client Components
const CookieBanner = dynamic(() => import('./CookieBanner'), { ssr: false })
const PromoBanner = dynamic(() => import('./PromoBanner'), { ssr: false })
// const GlobalAnnouncement = dynamic(() => import('./GlobalAnnouncement'), { ssr: false })

export default function ClientShell() {
  return (
    <>
      <PromoBanner />
      <CookieBanner />
      {/* <GlobalAnnouncement /> */}
    </>
  )
}
