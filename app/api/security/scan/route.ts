import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const p = path.join(process.cwd(), "data", "security-log.json");
    const scans = JSON.parse(fs.readFileSync(p, "utf-8"));
    return NextResponse.json({ scan: scans[0] || null });
  } catch {
    return NextResponse.json({ scan: null });
  }
}
