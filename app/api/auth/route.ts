import { NextRequest, NextResponse } from "next/server";
import { verifyPassphrase } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { passphrase } = await request.json();

  if (verifyPassphrase(passphrase)) {
    const cookieStore = await cookies();
    cookieStore.set("mc_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Invalid passphrase" }, { status: 401 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("mc_session");
  return NextResponse.json({ success: true });
}
