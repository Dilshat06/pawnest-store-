import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  outputFileTracingRoot: "C:/Users/lenovo/Documents/my-store",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cbu01.alicdn.com" },
      { protocol: "https", hostname: "**.cjdropshipping.com" },
    ],
  },
}

export default nextConfig
