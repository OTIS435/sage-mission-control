import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const session = request.cookies.get("mc_session");
  const isAuthenticated = session?.value === "authenticated";
  const pathname = request.nextUrl.pathname;

  // Allow auth API and lock page
  if (pathname === "/lock" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // TEMPORARY: Allow all requests for debugging
  // TODO: Re-enable auth protection after fixing
  return NextResponse.next();
  
  // Original code below:
  // // Protect everything else
  // if (!isAuthenticated) {
  //   return NextResponse.redirect(new URL("/lock", request.url));
  // }
  // return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
