import { NextResponse } from "next/server"; // Reject the internal review URL before streamed layouts can send a 200 response.

export function proxy() { // This proxy is scoped exclusively to the development review path below.
  if (process.env.NODE_ENV === "development") return NextResponse.next(); // Keep local component review available during development.
  return new NextResponse("Not Found", { status: 404, headers: { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } }); // Hide review content and return an unambiguous production status.
} // Finish the production preview guard.

export const config = { matcher: "/design-system/:path*" }; // Leave authentication, public pages, assets, and application routes untouched.
