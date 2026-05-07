import nodemailer from 'nodemailer'

function getTransport() {
  const host = process.env.SMTP_HOST
  const port = Number.parseInt(process.env.SMTP_PORT ?? '465', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('SMTP config missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendPreregistrationConfirmationEmail({
  to,
  referralCode,
}: {
  to: string
  referralCode: string
}) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://espeezy.com').replace(/\/$/, '')
  const shareUrl = `${appUrl}/preregister?ref=${encodeURIComponent(referralCode)}`

  const transport = getTransport()
  await transport.sendMail({
    from: `"Espeezy" <${process.env.SMTP_USER}>`,
    to,
    subject: "You're on the Espeezy early-access list",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <h2>You are on the list.</h2>
        <p>Thanks for pre-registering for Espeezy.</p>
        <p>Share your referral link:</p>
        <code>${shareUrl}</code>
      </div>
    `,
    text: `Thanks for pre-registering for Espeezy. Share your link: ${shareUrl}`,
  })
}
