import { createAdminClient } from '../../src/utils/supabase/server'

class FatalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FatalError'
  }
}

export type PaymentWorkflowPayload = {
  eventType: 'checkout.session.completed' | 'invoice.payment_succeeded' | 'invoice.payment_failed'
  sessionId: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  userId: string | null
  plan: string | null
  productLabel: string | null
  amountTotal: number | null
  currency: string | null
  mode: string | null
  status: string | null
  invoiceId?: string | null
  metadata?: Record<string, unknown>
}

export async function paymentWorkflow(payload: PaymentWorkflowPayload) {
  'use workflow'

  if (!payload.eventType) {
    throw new FatalError('Invalid payment event payload.')
  }

  const supabase = await createAdminClient()
  const userId = await resolveUserId(supabase, payload)

  if (!userId) {
    throw new FatalError('Unable to resolve payment owner.')
  }

  if (payload.metadata?.type === 'purchase' && payload.metadata?.listing_id) {
    await handleMarketplacePurchase(supabase, userId, payload)
    return { handled: true }
  }

  if (payload.eventType === 'checkout.session.completed') {
    await handleCheckoutCompleted(supabase, userId, payload)
    return { handled: true }
  }

  if (payload.eventType === 'invoice.payment_succeeded') {
    await handleInvoiceSucceeded(supabase, userId, payload)
    return { handled: true }
  }

  if (payload.eventType === 'invoice.payment_failed') {
    await handleInvoiceFailed(supabase, userId, payload)
    return { handled: true }
  }

  throw new FatalError('Unsupported payment event type.')
}

type SupabaseAdminClient = Awaited<ReturnType<typeof createAdminClient>>

async function resolveUserId(supabase: SupabaseAdminClient, payload: PaymentWorkflowPayload) {
  'use step'

  if (payload.userId) {
    return payload.userId
  }

  const filters = [
    payload.stripeSubscriptionId ? `stripe_subscription_id.eq.${payload.stripeSubscriptionId}` : null,
    payload.sessionId ? `stripe_session_id.eq.${payload.sessionId}` : null,
    payload.stripeCustomerId ? `stripe_customer_id.eq.${payload.stripeCustomerId}` : null,
    payload.invoiceId ? `stripe_invoice_id.eq.${payload.invoiceId}` : null
  ].filter(Boolean) as string[]

  if (filters.length === 0) {
    return null
  }

  const { data, error } = await supabase
    .from('payments')
    .select('user_id')
    .or(filters.join(','))
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (data?.user_id) {
    return data.user_id
  }

  if (payload.stripeCustomerId) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', payload.stripeCustomerId)
      .maybeSingle()

    if (profileError) {
      throw new Error(profileError.message)
    }

    return profileData?.id ?? null
  }

  return null
}

async function handleCheckoutCompleted(supabase: SupabaseAdminClient, userId: string, payload: PaymentWorkflowPayload) {
  'use step'

  const planLabel = payload.productLabel || (payload.plan === 'premium' ? 'Institutional Partner Authorization' : 'Pro Scholar Clearance')
  const normalizedPlan = payload.plan || 'pro'
  const status = payload.status === 'paid' || payload.status === 'complete' ? 'paid' : payload.status || 'pending'
  
  // Generate a professional invoice number for the "High End" experience
  const invoiceNumber = `GF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

  const { data: payData, error: paymentError } = await supabase.from('payments').upsert([
    {
      user_id: userId,
      stripe_customer_id: payload.stripeCustomerId,
      stripe_subscription_id: payload.stripeSubscriptionId,
      stripe_session_id: payload.sessionId,
      price_type: normalizedPlan,
      plan_label: planLabel,
      mode: payload.mode || 'payment',
      amount_total: payload.amountTotal,
      currency: payload.currency,
      status,
      invoice_number: invoiceNumber,
      metadata: {
        raw_status: payload.status,
        stripe_event: payload.eventType
      }
    }
  ], { onConflict: 'stripe_session_id' }).select('id').single()

  if (paymentError) {
    throw new Error(paymentError.message)
  }

  await supabase.from('profiles').update({
    subscription_plan: normalizedPlan,
    subscription_status: 'active',
    subscription_started_at: new Date().toISOString()
  }).eq('id', userId)

  await supabase.from('activity_log').insert([{
    user_id: userId,
    group_id: null,
    action_type: 'payment_completed',
    description: `Payment completed for ${planLabel}`,
    metadata: { stripe_session_id: payload.sessionId, amount_total: payload.amountTotal, currency: payload.currency }
  }])

  await supabase.from('notifications').insert([{
    user_id: userId,
    type: 'payment_completed',
    title: 'Protocol Authorization Secured',
    message: `Thank you, Scholar. Your institutional clearance for ${planLabel} is now active. You have been authenticated as a Protocol Architect.`,
    link: payData ? `/dashboard/invoice/${payData.id}` : '/dashboard'
  }])
}

async function handleInvoiceSucceeded(supabase: SupabaseAdminClient, userId: string, payload: PaymentWorkflowPayload) {
  'use step'
  if (!payload.stripeSubscriptionId) {
    throw new FatalError('Missing subscription id for invoice payment success.')
  }

  const { error: updateError } = await supabase.from('payments').upsert([
    {
      user_id: userId,
      stripe_customer_id: payload.stripeCustomerId,
      stripe_subscription_id: payload.stripeSubscriptionId,
      price_type: payload.plan || 'subscription',
      plan_label: payload.productLabel || 'Subscription billing',
      mode: payload.mode || 'subscription',
      amount_total: payload.amountTotal,
      currency: payload.currency,
      status: 'paid',
      stripe_invoice_id: payload.invoiceId,
      metadata: { stripe_event: payload.eventType }
    }
  ], { onConflict: 'stripe_invoice_id' })

  if (updateError) {
    throw new Error(updateError.message)
  }

  await supabase.from('profiles').update({ subscription_status: 'active' }).eq('id', userId)

  await supabase.from('activity_log').insert([{
    user_id: userId,
    group_id: null,
    action_type: 'payment_completed',
    description: `Subscription payment succeeded for ${payload.productLabel || 'your plan'}`,
    metadata: { stripe_subscription_id: payload.stripeSubscriptionId, amount_total: payload.amountTotal }
  }])

  await supabase.from('notifications').insert([{
    user_id: userId,
    type: 'payment_completed',
    title: 'Subscription payment received',
    message: `Your plan payment was processed successfully. Access remains active.`,
    link: '/dashboard'
  }])
}

async function handleInvoiceFailed(supabase: SupabaseAdminClient, userId: string, payload: PaymentWorkflowPayload) {
  'use step'

  if (!payload.stripeSubscriptionId) {
    throw new FatalError('Missing subscription id for failed invoice event.')
  }

  await supabase.from('payments').upsert([
    {
      user_id: userId,
      stripe_customer_id: payload.stripeCustomerId,
      stripe_subscription_id: payload.stripeSubscriptionId,
      price_type: payload.plan || 'subscription',
      plan_label: payload.productLabel || 'Subscription billing',
      mode: payload.mode || 'subscription',
      amount_total: payload.amountTotal,
      currency: payload.currency,
      status: 'failed',
      stripe_invoice_id: payload.invoiceId,
      metadata: { stripe_event: payload.eventType }
    }
  ], { onConflict: 'stripe_invoice_id' })

  await supabase.from('profiles').update({ subscription_status: 'past_due' }).eq('id', userId)

  await supabase.from('activity_log').insert([{
    user_id: userId,
    group_id: null,
    action_type: 'payment_failed',
    description: `Subscription payment failed for ${payload.productLabel || 'your plan'}`,
    metadata: { stripe_subscription_id: payload.stripeSubscriptionId, amount_total: payload.amountTotal }
  }])

  await supabase.from('notifications').insert([{
    user_id: userId,
    type: 'payment_failed',
    title: 'Payment issue',
    message: `We were unable to process your plan payment. Please update your payment details in Stripe.`,
    link: '/dashboard'
  }])
}

async function handleMarketplacePurchase(supabase: SupabaseAdminClient, buyerId: string, payload: PaymentWorkflowPayload) {
  'use step'
  const listingId = payload.metadata?.listing_id
  const sellerId = payload.metadata?.seller_id
  const productName = payload.metadata?.product_name || 'Marketplace Item'

  // Update listing
  await supabase
    .from('marketplace_listings')
    .update({ status: 'SOLD' })
    .eq('id', listingId)

  // Record Payment for Auditing
  const internalRef = `GF-MP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
  await supabase.from('payments').insert([{
    user_id: buyerId,
    amount_total: payload.amountTotal,
    currency: payload.currency,
    status: 'paid',
    price_type: 'marketplace',
    plan_label: `Purchase: ${productName}`,
    invoice_number: internalRef,
    stripe_session_id: payload.sessionId,
    metadata: { ...payload.metadata, item_name: productName, seller_id: sellerId }
  }])

  // Notify Seller
  await supabase.from('notifications').insert([{
    user_id: sellerId,
    type: 'payment_completed',
    title: 'Item Sold / Funds Secured',
    message: `Payment received for "${productName}". Please coordinate hand-off at your specified safe-zone.`,
    link: `/dashboard/marketplace`
  }])

  // Notify Buyer
  await supabase.from('notifications').insert([{
    user_id: buyerId,
    type: 'payment_completed',
    title: 'Transaction Authorized',
    message: `Your payment for "${productName}" is confirmed. Meet the seller at their designated academic safe-zone to complete the transfer.`,
    link: `/dashboard/marketplace`
  }])

  // Activity Log
  await supabase.from('activity_log').insert([{
    user_id: buyerId,
    action_type: 'marketplace_purchase',
    description: `Purchased "${productName}" from the marketplace`,
    metadata: { listing_id: listingId, seller_id: sellerId, price: payload.amountTotal }
  }])
}
