import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE = "/Users/sageopenclaw/.openclaw/workspace";

// Directories/files to index for search
const SEARCH_TARGETS = [
  // Root-level md files
  "MEMORY.md",
  "SOUL.md",
  "USER.md",
  "AGENTS.md",
  "TOOLS.md",
  "IDENTITY.md",
  "HEARTBEAT.md",
  "BOOTSTRAP.md",
];

const SEARCH_DIRS = [
  "knowledge",
  "memory",
  "projects",
];

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectFiles(fullPath));
      } else if (entry.name.endsWith(".md")) {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

function getSnippets(content: string, query: string, maxSnippets = 3): string[] {
  const lines = content.split("\n");
  const lq = query.toLowerCase();
  const snippets: string[] = [];
  for (let i = 0; i < lines.length && snippets.length < maxSnippets; i++) {
    if (lines[i].toLowerCase().includes(lq)) {
      // grab a little context: trim and cap at 200 chars
      const snippet = lines[i].trim().slice(0, 200);
      if (snippet) snippets.push(snippet);
    }
  }
  return snippets;
}

export interface SearchResult {
  file: string;       // workspace-relative path
  matchCount: number;
  snippets: string[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], totalMatches: 0, totalFiles: 0 });
  }

  const lq = query.toLowerCase();

  // Build absolute file list
  const absolutePaths: string[] = [];

  for (const name of SEARCH_TARGETS) {
    const p = path.join(WORKSPACE, name);
    if (fs.existsSync(p)) absolutePaths.push(p);
  }

  for (const dir of SEARCH_DIRS) {
    absolutePaths.push(...collectFiles(path.join(WORKSPACE, dir)));
  }

  const results: SearchResult[] = [];
  let totalMatches = 0;

  for (const absPath of absolutePaths) {
    // Safety check
    if (!absPath.startsWith(WORKSPACE)) continue;
    let content: string;
    try {
      content = fs.readFileSync(absPath, "utf-8");
    } catch { continue; }

    const lc = content.toLowerCase();
    // Count occurrences
    let count = 0;
    let pos = 0;
    while ((pos = lc.indexOf(lq, pos)) !== -1) { count++; pos += lq.length; }
    if (count === 0) continue;

    totalMatches += count;
    const relPath = path.relative(WORKSPACE, absPath);
    results.push({
      file: relPath,
      matchCount: count,
      snippets: getSnippets(content, query),
    });
  }

  // Sort by match count descending
  results.sort((a, b) => b.matchCount - a.matchCount);

  return NextResponse.json({ results, totalMatches, totalFiles: results.length });
}
