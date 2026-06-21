const PAYPAL_API_BASE = process.env.PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com"

// Глобальный кеш токена с дедупликацией одновременных запросов —
// та же схема, что и в lib/cj.ts, чтобы не дублировать гонку токена
const tokenCache = {
  value: null as string | null,
  expiresAt: 0,
  pending: null as Promise<string> | null,
}

interface Address {
  name: string
  phone: string
  countryCode: string
  country: string
  province: string
  city: string
  address: string
  zipCode: string
}

class PayPalClient {
  private async getToken(): Promise<string> {
    if (tokenCache.value && Date.now() < tokenCache.expiresAt) {
      return tokenCache.value
    }

    if (tokenCache.pending) {
      return tokenCache.pending
    }

    tokenCache.pending = (async () => {
      try {
        const auth = Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString("base64")

        const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "grant_type=client_credentials",
        })

        if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`)

        const data = await res.json()
        tokenCache.value = data.access_token
        tokenCache.expiresAt = Date.now() + (data.expires_in - 60) * 1000 // запас 60с
        return tokenCache.value!
      } finally {
        tokenCache.pending = null
      }
    })()

    return tokenCache.pending
  }

  // Создаёт PayPal Order (intent: CAPTURE) — деньги списываются только после captureOrder
  async createOrder(params: {
    orderId: string
    totalPrice: number
    items: { title: string; quantity: number; price: number }[]
    address: Address
    returnUrl: string
    cancelUrl: string
  }) {
    const token = await this.getToken()

    const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: params.orderId,
          custom_id:    params.orderId, // дублируем — это поле надёжнее доезжает до webhook-события капчура
          amount: {
            currency_code: "USD",
            value: params.totalPrice.toFixed(2),
            breakdown: {
              item_total: { currency_code: "USD", value: params.totalPrice.toFixed(2) },
            },
          },
          items: params.items.map((item) => ({
            name:         item.title.slice(0, 127), // лимит PayPal на длину названия
            quantity:     String(item.quantity),
            unit_amount:  { currency_code: "USD", value: item.price.toFixed(2) },
          })),
          shipping: {
            address: {
              address_line_1: params.address.address,
              admin_area_2:   params.address.city,
              admin_area_1:   params.address.province,
              postal_code:    params.address.zipCode,
              country_code:   params.address.countryCode,
            },
          },
        }],
        application_context: {
          return_url:         params.returnUrl,
          cancel_url:          params.cancelUrl,
          user_action:         "PAY_NOW",
          shipping_preference: "SET_PROVIDED_ADDRESS",
        },
      }),
    })

    if (!res.ok) throw new Error(`PayPal createOrder failed: ${res.status} ${await res.text()}`)
    return res.json()
  }

  // Подтверждает (списывает) оплату по ранее созданному PayPal Order
  async captureOrder(paypalOrderId: string) {
    const token = await this.getToken()

    const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })

    if (!res.ok) throw new Error(`PayPal captureOrder failed: ${res.status} ${await res.text()}`)
    return res.json()
  }

  // Проверяет подпись webhook-события через сам PayPal — безопаснее, чем
  // реализовывать криптографическую проверку самостоятельно
  async verifyWebhookSignature(params: {
    transmissionId: string
    transmissionTime: string
    certUrl: string
    authAlgo: string
    transmissionSig: string
    webhookId: string
    webhookEvent: unknown
  }): Promise<boolean> {
    const token = await this.getToken()

    const res = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_algo:         params.authAlgo,
        cert_url:          params.certUrl,
        transmission_id:   params.transmissionId,
        transmission_sig:  params.transmissionSig,
        transmission_time: params.transmissionTime,
        webhook_id:        params.webhookId,
        webhook_event:     params.webhookEvent,
      }),
    })

    if (!res.ok) return false
    const data = await res.json()
    return data.verification_status === "SUCCESS"
  }
}

export const paypal = new PayPalClient()
