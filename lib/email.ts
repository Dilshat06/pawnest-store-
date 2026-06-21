import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.EMAIL_FROM ?? "PawNest <no-reply@pawnest.com>"

function orderStatusUrl(orderId: string, accessToken: string) {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/orders/${orderId}?token=${accessToken}`
}

export async function sendOrderConfirmationEmail(params: {
  to: string
  orderId: string
  accessToken: string
  customerName: string
  items: { title: string; quantity: number; price: number }[]
  total: number
}) {
  const itemsHtml = params.items
    .map((i) => `<tr><td style="padding:6px 0">${i.title} × ${i.quantity}</td><td style="text-align:right">$${(i.price * i.quantity).toFixed(2)}</td></tr>`)
    .join("")
  const statusUrl = orderStatusUrl(params.orderId, params.accessToken)

  await transporter.sendMail({
    from:    FROM,
    to:      params.to,
    subject: `Your PawNest order #${params.orderId.slice(-8)} is confirmed 🐾`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;color:#4E342E">
        <h2 style="color:#FF7043">Thank you, ${params.customerName}!</h2>
        <p>Your order has been confirmed and is being prepared for shipment.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">${itemsHtml}</table>
        <p style="font-weight:bold">Total: $${params.total.toFixed(2)}</p>
        <p style="color:#999;font-size:13px">Order ID: ${params.orderId}</p>
        <p style="margin-top:20px"><a href="${statusUrl}" style="background:#FF7043;color:#FFF8F0;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Track your order</a></p>
      </div>
    `,
  })
}

export async function sendShippingNotificationEmail(params: {
  to: string
  orderId: string
  accessToken: string
  customerName: string
  trackingNumber: string
}) {
  const statusUrl = orderStatusUrl(params.orderId, params.accessToken)

  await transporter.sendMail({
    from:    FROM,
    to:      params.to,
    subject: `Your PawNest order is on its way! 📦`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;color:#4E342E">
        <h2 style="color:#FF7043">Great news, ${params.customerName}!</h2>
        <p>Your order has shipped and is on its way to you.</p>
        <p style="font-weight:bold">Tracking number: ${params.trackingNumber}</p>
        <p style="color:#999;font-size:13px">Order ID: ${params.orderId}</p>
        <p style="margin-top:20px"><a href="${statusUrl}" style="background:#FF7043;color:#FFF8F0;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Track your order</a></p>
      </div>
    `,
  })
}

// Письмо себе же на SMTP_USER — сигнал, что оплаченный заказ не ушёл в CJ
// и требует ручного внимания (например баланс CJ пуст)
export async function sendAdminAlertEmail(params: { subject: string; message: string }) {
  const adminEmail = process.env.SMTP_USER
  if (!adminEmail) return

  await transporter.sendMail({
    from:    FROM,
    to:      adminEmail,
    subject: `[PawNest Alert] ${params.subject}`,
    html: `<div style="font-family:Inter,Arial,sans-serif;color:#4E342E"><p>${params.message}</p></div>`,
  })
}
