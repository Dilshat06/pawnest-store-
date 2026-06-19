import { NextRequest, NextResponse } from "next/server"

// Защищаем /admin и /api/admin/* паролем (Basic Auth)
export function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization")

  if (auth) {
    const [, encoded] = auth.split(" ")
    const decoded = Buffer.from(encoded, "base64").toString("utf-8")
    const [, password] = decoded.split(":")

    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.next()
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin Area"' },
  })
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
}
