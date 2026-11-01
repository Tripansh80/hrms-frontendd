import { NextResponse, type NextRequest } from "next/server";

const BASE = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost";

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const url = req.nextUrl.clone();

  // Block direct access to internal route trees
  if (url.pathname.startsWith("/site") || url.pathname.startsWith("/tenant")) {
    return new NextResponse(null, { status: 404 });
  }

  const isRoot =
    host === BASE ||
    host === `www.${BASE}` ||
    host === "localhost" ||
    host === "127.0.0.1";

  if (isRoot) {
    url.pathname = `/site${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Subdomain (e.g. bovato.localhost)
  const slug = host.endsWith(`.${BASE}`)
    ? host.slice(0, -(BASE.length + 1))
    : null;

  if (!slug || slug.includes(".")) {
    return new NextResponse(null, { status: 404 });
  }

  url.pathname = `/tenant${url.pathname}`;
  const res = NextResponse.rewrite(url);
  res.headers.set("x-tenant-slug", slug);
  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
