import { getAdminDb, getAdminAuth } from '../lib/firebase-admin'

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

  const db = getAdminDb();
  const auth = getAdminAuth();
  if (!db || !auth) throw new Error('Firebase Services Unavailable');

  const userId = await resolveUserId(db, payload)

  if (!userId) {
    throw new FatalError('Unable to resolve payment owner.')
  }

  if (payload.metadata?.type === 'purchase' && payload.metadata?.listing_id) {
    await handleMarketplacePurchase(db, userId, payload)
    return { handled: true }
  }

  if (payload.eventType === 'checkout.session.completed') {
    await handleCheckoutCompleted(db, userId, payload)
    return { handled: true }
  }

  if (payload.eventType === 'invoice.payment_succeeded') {
    await handleInvoiceSucceeded(db, userId, payload)
    return { handled: true }
  }

  if (payload.eventType === 'invoice.payment_failed') {
    await handleInvoiceFailed(db, userId, payload)
    return { handled: true }
  }

  throw new FatalError('Unsupported payment event type.')
}

async function resolveUserId(db: any, payload: PaymentWorkflowPayload) {
  'use step'

  if (payload.userId) {
    return payload.userId
  }

  const paymentsRef = db.collection('payments')
  let userId = null

  if (payload.stripeSubscriptionId) {
    const q = await paymentsRef.where('stripe_subscription_id', '==', payload.stripeSubscriptionId).limit(1).get()
    if (!q.empty) userId = q.docs[0].data().user_id
  }
  if (!userId && payload.sessionId) {
    const q = await paymentsRef.where('stripe_session_id', '==', payload.sessionId).limit(1).get()
    if (!q.empty) userId = q.docs[0].data().user_id
  }
  if (!userId && payload.stripeCustomerId) {
    const q = await paymentsRef.where('stripe_customer_id', '==', payload.stripeCustomerId).limit(1).get()
    if (!q.empty) userId = q.docs[0].data().user_id
  }

  if (userId) return userId

  if (payload.stripeCustomerId) {
    const profileQ = await db.collection('profiles').where('stripe_customer_id', '==', payload.stripeCustomerId).limit(1).get()
    if (!profileQ.empty) return profileQ.docs[0].id
  }

  return null
}

async function handleCheckoutCompleted(db: any, userId: string, payload: PaymentWorkflowPayload) {
  'use step'

  const planLabel = payload.productLabel || (payload.plan === 'premium' ? 'Institutional Partner Authorization' : 'Pro Scholar Clearance')
  const normalizedPlan = payload.plan || 'pro'
  const status = payload.status === 'paid' || payload.status === 'complete' ? 'paid' : payload.status || 'pending'
  
  const invoiceNumber = `GF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

  const paymentId = payload.sessionId || `PAY-${Date.now()}`
  await db.collection('payments').doc(paymentId).set({
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
      updated_at: new Date().toISOString(),
      metadata: {
        raw_status: payload.status,
        stripe_event: payload.eventType
      }
  }, { merge: true })

  await db.collection('profiles').doc(userId).update({
    subscription_plan: normalizedPlan,
    subscription_status: 'active',
    subscription_started_at: new Date().toISOString()
  })

  await db.collection('activity_log').add({
    user_id: userId,
    group_id: null,
    action_type: 'payment_completed',
    description: `Payment completed for ${planLabel}`,
    metadata: { stripe_session_id: payload.sessionId, amount_total: payload.amountTotal, currency: payload.currency },
    created_at: new Date().toISOString()
  })

  await db.collection('notifications').add({
    user_id: userId,
    type: 'payment_completed',
    title: 'Protocol Authorization Secured',
    message: `Thank you, Scholar. Your institutional clearance for ${planLabel} is now active.`,
    link: `/dashboard/invoice/${paymentId}`,
    created_at: new Date().toISOString()
  })
}

async function handleInvoiceSucceeded(db: any, userId: string, payload: PaymentWorkflowPayload) {
  'use step'
  if (!payload.stripeSubscriptionId) return

  const invoiceId = payload.invoiceId || `INV-${Date.now()}`
  await db.collection('payments').doc(invoiceId).set({
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
      updated_at: new Date().toISOString(),
      metadata: { stripe_event: payload.eventType }
  }, { merge: true })

  await db.collection('profiles').doc(userId).update({ subscription_status: 'active' })

  await db.collection('activity_log').add({
    user_id: userId,
    action_type: 'payment_completed',
    description: `Subscription payment succeeded`,
    metadata: { stripe_subscription_id: payload.stripeSubscriptionId },
    created_at: new Date().toISOString()
  })
}

async function handleInvoiceFailed(db: any, userId: string, payload: PaymentWorkflowPayload) {
  'use step'
  if (!payload.stripeSubscriptionId) return

  const invoiceId = payload.invoiceId || `INV-${Date.now()}`
  await db.collection('payments').doc(invoiceId).set({
      user_id: userId,
      status: 'failed',
      stripe_invoice_id: payload.invoiceId,
      updated_at: new Date().toISOString()
  }, { merge: true })

  await db.collection('profiles').doc(userId).update({ subscription_status: 'past_due' })
}

async function handleMarketplacePurchase(db: any, buyerId: string, payload: PaymentWorkflowPayload) {
  'use step'
  const listingId = payload.metadata?.listing_id as string
  const sellerId = payload.metadata?.seller_id as string
  const productName = (payload.metadata?.product_name as string) || 'Marketplace Item'

  await db.collection('marketplace_listings').doc(listingId).update({ status: 'SOLD' })

  const internalRef = `GF-MP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
  await db.collection('payments').add({
    user_id: buyerId,
    amount_total: payload.amountTotal,
    currency: payload.currency,
    status: 'paid',
    price_type: 'marketplace',
    plan_label: `Purchase: ${productName}`,
    invoice_number: internalRef,
    stripe_session_id: payload.sessionId,
    created_at: new Date().toISOString(),
    metadata: { ...payload.metadata, item_name: productName, seller_id: sellerId }
  })

  // Notifications
  const batch = db.batch()
  const sellerNotify = db.collection('notifications').doc()
  const buyerNotify = db.collection('notifications').doc()

  batch.set(sellerNotify, {
    user_id: sellerId,
    type: 'payment_completed',
    title: 'Item Sold',
    message: `Payment received for "${productName}".`,
    created_at: new Date().toISOString()
  })
  batch.set(buyerNotify, {
    user_id: buyerId,
    type: 'payment_completed',
    title: 'Transaction Authorized',
    message: `Your payment for "${productName}" is confirmed.`,
    created_at: new Date().toISOString()
  })
  await batch.commit()
}
