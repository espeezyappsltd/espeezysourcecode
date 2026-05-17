import { z } from 'zod'
import { MAX_ASSET_CREDIT_VALUE } from '@/lib/credits'

/** Marketplace listing price in Espeezy Credits (not GBP/USD). */
export const marketplaceCreditPriceSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_ASSET_CREDIT_VALUE)
  .optional()

export const personalAssetCreditValueSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_ASSET_CREDIT_VALUE)
  .optional()
