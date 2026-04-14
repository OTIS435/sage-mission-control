import { NextRequest, NextResponse } from "next/server";
import { verifyPassphrase } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { passphrase } = await request.json();
  
  // Log for debugging
  console.log("[AUTH] Passphrase attempt:", passphrase === "empire2026" ? "MATCH" : "NO MATCH");

  if (verifyPassphrase(passphrase)) {
    const cookieStore = await cookies();
    cookieStore.set("mc_session", "authenticated", {
      httpOnly: false, // Allow client-side access for debugging
      secure: false,   // Not secure for local testing
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    console.log("[AUTH] Login successful");
    return NextResponse.json({ success: true });
  }

  console.log("[AUTH] Login failed");
  return NextResponse.json({ success: false, error: "Invalid passphrase" }, { status: 401 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("mc_session");
  return NextResponse.json({ success: true });
}
