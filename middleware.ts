import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    "/((?!login|api/auth|api/cleanup-descriptions|api/products|api/categories|api/variations|_next/static|_next/image|favicon\\.ico|public).*)",
  ],
}
