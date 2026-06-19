const CJ_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1"

// Глобальный кеш — переживает несколько запросов в одном процессе
const tokenCache = {
  value: null as string | null,
  expiresAt: 0,
}

class CJClient {
  private async getToken(): Promise<string> {
    if (tokenCache.value && Date.now() < tokenCache.expiresAt) {
      return tokenCache.value
    }

    const res = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.CJ_EMAIL,
        password: process.env.CJ_PASSWORD,
      }),
    })

    if (!res.ok) throw new Error(`CJ auth failed: ${res.status}`)

    const data = await res.json()
    if (!data.data?.accessToken) {
      throw new Error(`CJ auth error: ${data.message ?? "no token"}`)
    }

    tokenCache.value = data.data.accessToken
    tokenCache.expiresAt = Date.now() + 23 * 60 * 60 * 1000 // 23 часа
    return tokenCache.value!
  }

  async getProducts(page = 1, limit = 20) {
    const token = await this.getToken()
    const res = await fetch(
      `${CJ_BASE_URL}/product/list?pageNum=${page}&pageSize=${limit}`,
      { headers: { "CJ-Access-Token": token } }
    )
    if (!res.ok) throw new Error(`CJ getProducts failed: ${res.status}`)
    return res.json()
  }

  // Поиск товаров по ключевым словам (например "dog bed", "pet leash")
  async searchProducts(keyword: string, page = 1, limit = 20) {
    const token = await this.getToken()
    const params = new URLSearchParams({
      productNameEn: keyword,
      pageNum:       String(page),
      pageSize:      String(limit),
    })
    const res = await fetch(`${CJ_BASE_URL}/product/list?${params}`, {
      headers: { "CJ-Access-Token": token },
    })
    if (!res.ok) throw new Error(`CJ searchProducts failed: ${res.status}`)
    return res.json()
  }

  async getProductDetail(cjProductId: string) {
    const token = await this.getToken()
    const res = await fetch(`${CJ_BASE_URL}/product/query?pid=${cjProductId}`, {
      headers: { "CJ-Access-Token": token },
    })
    if (!res.ok) throw new Error(`CJ getProductDetail failed: ${res.status}`)
    return res.json()
  }

  // Остаток на складе для конкретного варианта (vid)
  async getVariantStock(vid: string) {
    const token = await this.getToken()
    const res = await fetch(`${CJ_BASE_URL}/product/stock/queryByVid?vid=${vid}`, {
      headers: { "CJ-Access-Token": token },
    })
    if (!res.ok) return 0
    const json = await res.json()
    const list = json.data
    if (!Array.isArray(list) || list.length === 0) return 0
    return list.reduce((sum: number, w: Record<string, unknown>) => sum + Number(w.storageNum ?? 0), 0)
  }

  async createOrder(orderData: {
    orderId: string
    products: { vid: string; quantity: number }[]
    address: {
      name: string
      phone: string
      country: string
      city: string
      address: string
      zipCode: string
    }
  }) {
    const token = await this.getToken()
    const res = await fetch(`${CJ_BASE_URL}/shopping/order/createOrder`, {
      method: "POST",
      headers: {
        "CJ-Access-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    })
    if (!res.ok) throw new Error(`CJ createOrder failed: ${res.status}`)
    return res.json()
  }

  async getOrderStatus(cjOrderId: string) {
    const token = await this.getToken()
    const res = await fetch(
      `${CJ_BASE_URL}/shopping/order/getOrderDetail?orderId=${cjOrderId}`,
      { headers: { "CJ-Access-Token": token } }
    )
    if (!res.ok) throw new Error(`CJ getOrderStatus failed: ${res.status}`)
    return res.json()
  }
}

export const cj = new CJClient()
