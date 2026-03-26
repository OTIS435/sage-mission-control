import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function findMarkdownFiles(dir: string, base: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(base, fullPath);
      if (entry.isDirectory()) {
        results.push(...findMarkdownFiles(fullPath, base));
      } else if (entry.name.endsWith(".md")) {
        results.push(relPath);
      }
    }
  } catch {
    // ignore
  }
  return results;
}

export async function GET() {
  const workspacePath = "/Users/sageopenclaw/.openclaw/workspace";
  const files = findMarkdownFiles(workspacePath, workspacePath);
  return NextResponse.json({ files: files.slice(0, 50) });
}
