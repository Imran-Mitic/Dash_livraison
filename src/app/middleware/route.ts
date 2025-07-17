import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAdmin = token?.isAdmin
  const { pathname } = req.nextUrl

  // Protéger les routes admin
  if (pathname.startsWith("/dashboard/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Rediriger l'admin déjà connecté depuis /login
  if (pathname === "/login" && isAdmin) {
    return NextResponse.redirect(new URL("/dashboard/admin", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/admin/:path*", "/dashboard/admin", "/login"],
}
