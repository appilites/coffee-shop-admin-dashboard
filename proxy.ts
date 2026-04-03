import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

/**
 * Auth boundary for dashboard UI routes only.
 *
 * IMPORTANT: `withAuth` must never redirect `/api/auth/*` (or other `/api/*`) to `/login`,
 * or the browser receives HTML instead of JSON from `/api/auth/session` → CLIENT_FETCH_ERROR.
 *
 * We use `callbacks.authorized` so API routes always pass through; individual route handlers
 * should validate the session if needed.
 */
export default withAuth(
  function proxy() {
    return NextResponse.next()
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const p = req.nextUrl.pathname
        // NextAuth client calls — must return JSON, never a login redirect
        if (p.startsWith("/api/auth")) return true
        // All other APIs — let middleware pass; routes use getServerSession / checks as needed
        if (p.startsWith("/api")) return true
        // Logged-in pages
        return !!token
      },
    },
  }
)

// Exclude static assets and /login so the proxy does not run unnecessarily.
// `/api` is still listed here to reduce work; `authorized` above is the real safety net.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
