import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

// Exclude ALL /api/* (NextAuth lives at /api/auth/*), static assets, and /login.
// Using `api` as a single segment avoids matcher/Rx bugs with `api/auth` and fixes
// CLIENT_FETCH_ERROR where /api/auth/session returns HTML instead of JSON.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
