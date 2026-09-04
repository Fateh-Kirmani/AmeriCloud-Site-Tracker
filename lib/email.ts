async function getAppAccessToken(): Promise<string | null> {
  const tenantId = process.env.MICROSOFT_TENANT_ID
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  if (!tenantId || !clientId || !clientSecret) return null

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
      }),
    }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

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
  const from = process.env.SMTP_FROM_EMAIL
  if (!to || !from) return

  try {
    const token = await getAppAccessToken()
    if (!token) {
      console.error('[sendEmail] Could not obtain app access token')
      return
    }

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(from)}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject,
            body: {
              contentType: html ? 'HTML' : 'Text',
              content: html ?? text,
            },
            toRecipients: [{ emailAddress: { address: to } }],
          },
          saveToSentItems: false,
        }),
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[sendEmail] Graph API error:', err)
    }
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
