import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    env: {
      NEXT_PUBLIC_SITE_URL: "https://test.example.com",
    },
  },
})
