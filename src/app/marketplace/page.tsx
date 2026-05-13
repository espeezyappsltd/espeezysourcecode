import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const MarketplaceGallery = dynamic(() => import('@/src/components/MarketplaceGallery'), { ssr: false })
const MarketplaceAssetUploader = dynamic(() => import('@/src/components/MarketplaceAssetUploader'), { ssr: false })

export default function MarketplacePage() {
  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh', paddingBottom: 80 }}>
      <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', marginTop: 80 }}>Loading Marketplace...</div>}>
        <MarketplaceGallery />
      </Suspense>
      <section style={{ margin: '48px auto 0', maxWidth: 600 }}>
        <MarketplaceAssetUploader />
      </section>
    </main>
  export const dynamic = 'force-dynamic'
  )
}
