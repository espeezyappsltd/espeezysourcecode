/**
 * Cloudflare Email Worker — Espeezy Studios
 *
 * CF Email Routing subdomains: admin, newsletter, marketing, panel, promos, news,
 * email, notifications, feedback, orders, billing, support, help, contact, hello, info
 *
 * 1) email() — inbound routing (forward + optional auto-reply)
 * 2) fetch() — POST /send — outbound delivery from espeezystudios (SEND_EMAIL binding)
 */

import type { ExecutionContext, ForwardableEmailMessage } from '@cloudflare/workers-types'
import { AUTO_REPLY_FROM, forwardTargetForRecipient, INBOUND_FORWARD_TO, STUDIO_FROM } from './addresses'

export type AttachmentPayload = {
  filename: string
  content: string
}

export type SendPayload = {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  attachments?: AttachmentPayload[]
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function appendAttachmentsToText(text: string, attachments?: AttachmentPayload[]) {
  if (!attachments?.length) return text
  const blocks = attachments.map(
    (a) => `\n\n──────── ${a.filename} ────────\n${a.content}`,
  )
  return `${text}${blocks.join('')}`
}

function appendAttachmentsToHtml(html: string, attachments?: AttachmentPayload[]) {
  if (!attachments?.length) return html
  const blocks = attachments
    .map(
      (a) =>
        `<details style="margin-top:12px"><summary style="font-weight:700">${a.filename}</summary><pre style="white-space:pre-wrap;font-size:11px;background:#f8fafc;padding:8px;border-radius:6px">${escapeHtml(a.content.slice(0, 8000))}</pre></details>`,
    )
    .join('')
  return `${html}${blocks}`
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default {
  /** Inbound — Email Routing → this worker */
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    const toAddress = message.to ?? ''
    const fallback = env.INBOUND_FORWARD_TO || INBOUND_FORWARD_TO
    const forwardTo = forwardTargetForRecipient(toAddress, fallback)
    const autoReplyFrom = AUTO_REPLY_FROM

    ctx.waitUntil(
      (async () => {
        try {
          await message.forward(forwardTo)
        } catch (err) {
          console.error('forward failed', err)
        }

        try {
          await env.SEND_EMAIL.send({
            from: autoReplyFrom,
            to: message.from,
            replyTo: env.STUDIO_REPLY_TO || 'hello@espeezy.com',
            subject: 'We received your message — Espeezy',
            text: `Thanks for reaching Espeezy (${toAddress}). Your message was forwarded to our team. We typically respond within 1–2 business days.\n\n— Espeezy Studios`,
          })
        } catch {
          /* auto-reply optional */
        }
      })(),
    )
  },

  /** Outbound — called by apps/espeezystudios deliver API */
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ ok: true, service: 'espeezy-studio-email' })
    }

    if (request.method !== 'POST' || url.pathname !== '/send') {
      return new Response('Not found', { status: 404, headers: corsHeaders() })
    }

    const secret = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    if (!env.STUDIO_EMAIL_SECRET || secret !== env.STUDIO_EMAIL_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() })
    }

    let body: SendPayload
    try {
      body = (await request.json()) as SendPayload
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders() })
    }

    const to = Array.isArray(body.to) ? body.to.join(',') : body.to
    if (!to || !body.subject) {
      return Response.json({ error: 'to and subject required' }, { status: 400, headers: corsHeaders() })
    }

    const from = env.STUDIO_FROM_EMAIL || STUDIO_FROM
    const replyTo = body.replyTo || env.STUDIO_REPLY_TO || 'hello@espeezy.com'
    const text = appendAttachmentsToText(body.text ?? '', body.attachments)
    const html = body.html ? appendAttachmentsToHtml(body.html, body.attachments) : undefined

    try {
      await env.SEND_EMAIL.send({
        from,
        to,
        subject: body.subject,
        text: text || undefined,
        html,
        replyTo,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Send failed'
      return Response.json({ error: message }, { status: 503, headers: corsHeaders() })
    }

    return Response.json({ ok: true }, { headers: corsHeaders() })
  },
}
