import { describe, it, expect, vi, beforeEach } from "vitest"

describe("CJ client token dedup", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("shares one in-flight auth request across concurrent calls with a cold cache", async () => {
    let authCallCount = 0

    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("getAccessToken")) {
        authCallCount++
        await new Promise((r) => setTimeout(r, 20)) // имитируем задержку сети
        return new Response(JSON.stringify({ data: { accessToken: "tok123" } }), { status: 200 })
      }
      if (url.includes("queryByVid")) {
        return new Response(JSON.stringify({ data: [{ storageNum: 5 }] }), { status: 200 })
      }
      throw new Error(`Unexpected fetch: ${url}`)
    }))

    const { cj } = await import("@/lib/cj")

    const [stockA, stockB] = await Promise.all([
      cj.getVariantStock("vid-a"),
      cj.getVariantStock("vid-b"),
    ])

    expect(stockA).toBe(5)
    expect(stockB).toBe(5)
    expect(authCallCount).toBe(1)
  })
})
