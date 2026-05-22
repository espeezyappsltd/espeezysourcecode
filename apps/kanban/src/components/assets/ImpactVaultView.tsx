'use client'

import { AssetsPageFrame } from './AssetsPageFrame'
import { AssetsMotionRoot } from './AssetsMotionRoot'
import { AssetsSubNav } from './AssetsSubNav'
import { ImpactLogDashboard } from './ImpactLogDashboard'

export function ImpactVaultView() {
  return (
    <AssetsPageFrame>
      <AssetsMotionRoot className="assets-page page-shell">
        <header className="assets-hero ui-hero-row page-header">
          <div className="ui-hero-row__main page-header__main">
            <h1 className="page-header__title">
              Impact <span className="page-header__title-accent">log</span>
            </h1>
            <p className="page-header__desc">
              Verifiable record of marketplace trades and hustle gig ledger events — your overall Espeezy credit
              impact in one place.
            </p>
          </div>
        </header>

        <AssetsSubNav />

        <ImpactLogDashboard />
      </AssetsMotionRoot>
    </AssetsPageFrame>
  )
}
