import { authMiddleware } from "@clerk/nextjs";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware

const authenticate = authMiddleware({
  publicRoutes: ["/", "/sign-in(.*)"],
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }
  return authenticate(request, event);
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
