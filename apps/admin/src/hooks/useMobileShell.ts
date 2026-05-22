'use client'

import { useSyncExternalStore } from 'react'

const MOBILE_SHELL_MQ = '(max-width: 768px)'

function subscribeMobileShell(onStoreChange: () => void) {
  const mq = window.matchMedia(MOBILE_SHELL_MQ)
  mq.addEventListener('change', onStoreChange)
  return () => mq.removeEventListener('change', onStoreChange)
}

function getMobileShellSnapshot() {
  return window.matchMedia(MOBILE_SHELL_MQ).matches
}

/** True when admin shell should use drawer nav + mobile top bar. */
export function useIsMobileShell() {
  return useSyncExternalStore(subscribeMobileShell, getMobileShellSnapshot, () => false)
}
