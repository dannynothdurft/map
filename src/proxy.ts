import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";

const PUBLIC_PAGES = ["/login", "/signup"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // /api/invites/[token] is the public lookup an invitee (no session yet) hits
  // from the signup page to resolve their invite before an account exists.
  const isPublicApiRoute =
    pathname.startsWith("/api/auth/") || pathname.startsWith("/api/invites/");
  const isPublicPage = PUBLIC_PAGES.includes(pathname);

  if (isPublicApiRoute) return NextResponse.next();

  const user = await getSession();

  if (!user) {
    if (isPublicPage) return NextResponse.next();

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.*|apple-icon.*|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)",
  ],
};
