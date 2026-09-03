import { Resend } from 'resend'

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text: string
  html?: string
}) {
  if (!to || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: `AmeriCloud Site Tracker <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    })
  } catch (err) {
    console.error('[sendEmail] Failed to send to', to, err)
  }
}

export function buildEmailHtml({
  heading,
  body,
  details,
  linkHref,
  linkLabel,
}: {
  heading: string
  body: string
  details: { label: string; value: string }[]
  linkHref: string
  linkLabel: string
}): string {
  const rows = details
    .map(
      (d, i) =>
        `<tr><td style="padding:8px 12px;font-weight:600;color:#555;background:${i % 2 === 0 ? '#f5f7fa' : '#fff'};width:160px;white-space:nowrap;">${d.label}</td><td style="padding:8px 12px;color:#222;background:${i % 2 === 0 ? '#f5f7fa' : '#fff'};">${d.value}</td></tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:100%;">
      <tr><td style="background:#0B1929;padding:24px 32px;">
        <span style="color:#fff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">AmeriCloud Site Tracker</span>
      </td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 12px;color:#0B1929;font-size:18px;">${heading}</h2>
        <p style="margin:0 0 24px;color:#444;font-size:14px;line-height:1.6;">${body}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e6ef;border-radius:6px;overflow:hidden;margin-bottom:28px;">
          ${rows}
        </table>
        <a href="${linkHref}" style="display:inline-block;background:#C8102E;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">${linkLabel}</a>
      </td></tr>
      <tr><td style="padding:16px 32px;background:#f5f7fa;color:#888;font-size:12px;text-align:center;">
        This is an automated notification from AmeriCloud Site Tracker. Do not reply to this email.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}
