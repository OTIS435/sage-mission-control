import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE = "/Users/sageopenclaw/.openclaw/workspace";

export async function GET() {
  try {
    const files: { name: string; date: string | null; content: string }[] = [];

    // Load MEMORY.md (long-term)
    try {
      const content = fs.readFileSync(path.join(WORKSPACE, "MEMORY.md"), "utf-8");
      files.push({ name: "MEMORY.md", date: null, content });
    } catch {}

    // Load all memory/YYYY-MM-DD.md daily files
    const memDir = path.join(WORKSPACE, "memory");
    if (fs.existsSync(memDir)) {
      const entries = fs.readdirSync(memDir)
        .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
        .sort()
        .reverse(); // newest first

      for (const entry of entries) {
        try {
          const content = fs.readFileSync(path.join(memDir, entry), "utf-8");
          const date = entry.replace(".md", "");
          files.push({ name: entry, date, content });
        } catch {}
      }
    }

    return NextResponse.json({ files });
  } catch (e) {
    return NextResponse.json({ files: [], error: String(e) });
  }
}
