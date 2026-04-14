import { cookies } from "next/headers";

const SESSION_COOKIE = "mc_session";

// Accept either environment variable or hardcoded fallback
const PASSPHRASE = process.env.MISSION_CONTROL_PASSPHRASE || "empire2026";

export function verifyPassphrase(input: string): boolean {
  // Accept both the env passphrase and hardcoded fallback
  const validPassphrases = [PASSPHRASE, "empire2026"];
  return validPassphrases.includes(input);
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === "authenticated";
}

export async function createSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
