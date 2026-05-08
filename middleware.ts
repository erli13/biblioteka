import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const sep = decoded.indexOf(":");
      const user = sep === -1 ? decoded : decoded.slice(0, sep);
      const pass = sep === -1 ? "" : decoded.slice(sep + 1);
      if (
        user === process.env.ADMIN_USER &&
        pass === process.env.ADMIN_PASSWORD
      ) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
