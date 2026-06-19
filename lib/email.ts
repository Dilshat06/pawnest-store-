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

export async function sendOrderConfirmationEmail(params: {
  to: string
  orderId: string
  customerName: string
  items: { title: string; quantity: number; price: number }[]
  total: number
}) {
  const itemsHtml = params.items
    .map((i) => `<tr><td style="padding:6px 0">${i.title} × ${i.quantity}</td><td style="text-align:right">$${(i.price * i.quantity).toFixed(2)}</td></tr>`)
    .join("")

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
      </div>
    `,
  })
}

export async function sendShippingNotificationEmail(params: {
  to: string
  orderId: string
  customerName: string
  trackingNumber: string
}) {
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
      </div>
    `,
  })
}
