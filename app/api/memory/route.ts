import { NextResponse } from "next/server";
import fs from "fs";

export async function GET() {
  try {
    const content = fs.readFileSync("/Users/sageopenclaw/.openclaw/workspace/MEMORY.md", "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ content: "MEMORY.md not found." });
  }
}
