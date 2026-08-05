import nodemailer from 'nodemailer'

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string
  subject: string
  text: string
}) {
  if (!to || !process.env.SMTP_USER || !process.env.SMTP_PASS) return
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    await transporter.sendMail({
      from: `AmeriCloud Site Tracker <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    })
  } catch (err) {
    console.error('[sendEmail] Failed to send to', to, err)
  }
}
