import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const PUBLIK = ["/", "/login"]

export default async function proxy(request: NextRequest) {
  if (PUBLIK.includes(request.nextUrl.pathname)) return NextResponse.next()

  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: [
    "/((?!login|api/auth|api/setup-status|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)",
  ],
}
