import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cbu01.alicdn.com" },
      { protocol: "https", hostname: "**.cjdropshipping.com" },
    ],
  },
}

export default nextConfig
