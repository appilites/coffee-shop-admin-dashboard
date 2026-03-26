import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

// Exclude ALL /api/* (NextAuth lives at /api/auth/*), static assets, and /login.
// Using the top-level `api` segment prevents the middleware from ever touching
// /api/auth/session — which would cause CLIENT_FETCH_ERROR (HTML returned instead of JSON).
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
