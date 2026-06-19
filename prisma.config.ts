import "dotenv/config"
import path from "path"
import { defineConfig } from "prisma/config"

// Загружаем .env явно с правильным путём
import { config } from "dotenv"
config({ path: path.resolve(__dirname, ".env") })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
  },
})
