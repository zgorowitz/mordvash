import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const hasClerkKeys =
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
  Boolean(process.env.CLERK_SECRET_KEY);

const isPublicRoute = createRouteMatcher(["/"]);
const invitedEmails = new Set(
  (process.env.NEXT_PUBLIC_INVITED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

const protectedProxy = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const session = await auth.protect();
    const email = emailFromClaims(session.sessionClaims);

    if (invitedEmails.size > 0 && email && !invitedEmails.has(email)) {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
  }
});

function emailFromClaims(claims: Record<string, unknown>) {
  const candidate =
    claims.email ??
    claims.email_address ??
    claims.primary_email_address ??
    claims.user_email;

  return typeof candidate === "string" ? candidate.trim().toLowerCase() : "";
}

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!hasClerkKeys) {
    return NextResponse.next();
  }

  return protectedProxy(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
