'use client'

import { useCallback } from 'react'
import { useSmartLoading } from '@/components/GlobalLoadingProvider'
import type { TransactionConfirmCopy } from '@/lib/platform/transaction-confirm-copy'

export type TransactionConfirmOptions = TransactionConfirmCopy

/**
 * Promise-based confirmation for credit purchases, withdrawals, hustle trades, etc.
 */
export function useTransactionConfirm() {
  const { showConfirmation } = useSmartLoading()

  const confirmTransaction = useCallback(
    (options: TransactionConfirmOptions): Promise<boolean> =>
      new Promise((resolve) => {
        showConfirmation({
          title: options.title,
          message: options.message,
          type: options.type ?? 'warning',
          confirmLabel: options.confirmLabel ?? 'Confirm',
          cancelLabel: options.cancelLabel ?? 'Cancel',
          destructive: options.destructive,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        })
      }),
    [showConfirmation],
  )

  return { confirmTransaction }
}
