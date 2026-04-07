import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SESSIONS_DIR = "/Users/sageopenclaw/.openclaw/agents/main/sessions";

const MODEL_DISPLAY: Record<string, string> = {
  "claude-sonnet-4-6": "Sonnet 4.6",
  "claude-haiku-4-5": "Haiku 4.5",
  "claude-opus-4-6": "Opus 4.6",
  "claude-3-5-sonnet-20241022": "Sonnet 3.5",
  "claude-3-5-haiku-20241022": "Haiku 3.5",
  "claude-3-opus-20240229": "Opus 3",
};

interface UsageEntry {
  cost: number;
  inputTokens: number;
  outputTokens: number;
  cacheRead: number;
  cacheWrite: number;
  model: string;
  date: string; // YYYY-MM-DD
}

function parseSessionFile(filePath: string, sinceMs: number): UsageEntry[] {
  const entries: UsageEntry[] = [];
  try {
    const lines = fs.readFileSync(filePath, "utf-8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.type !== "message") continue;
        const msg = obj.message;
        if (!msg?.usage || msg.role !== "assistant") continue;
        const ts = obj.timestamp ? new Date(obj.timestamp).getTime() : 0;
        if (ts < sinceMs) continue;
        const u = msg.usage;
        entries.push({
          cost: u.cost?.total ?? 0,
          inputTokens: u.input ?? 0,
          outputTokens: u.output ?? 0,
          cacheRead: u.cacheRead ?? 0,
          cacheWrite: u.cacheWrite ?? 0,
          model: msg.model ?? "unknown",
          date: new Date(ts).toISOString().slice(0, 10),
        });
      } catch { /* skip malformed lines */ }
    }
  } catch { /* skip unreadable files */ }
  return entries;
}

function summarize(entries: UsageEntry[]) {
  let totalCost = 0, totalIn = 0, totalOut = 0, totalCache = 0;
  const byModel: Record<string, { cost: number; tokens: number; label: string }> = {};
  for (const e of entries) {
    totalCost += e.cost;
    totalIn += e.inputTokens;
    totalOut += e.outputTokens;
    totalCache += e.cacheRead + e.cacheWrite;
    const key = e.model;
    if (!byModel[key]) byModel[key] = { cost: 0, tokens: 0, label: MODEL_DISPLAY[key] ?? key };
    byModel[key].cost += e.cost;
    byModel[key].tokens += e.inputTokens + e.outputTokens;
  }
  return { totalCost, totalIn, totalOut, totalCache, byModel };
}

export async function GET() {
  try {
    const now = Date.now();
    const todayStart = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z").getTime();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get all session files (exclude locks, deleted, reset)
    const files = fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith(".jsonl") && !f.includes(".lock") && !f.includes(".deleted") && !f.includes(".reset"))
      .map(f => ({
        path: path.join(SESSIONS_DIR, f),
        mtime: fs.statSync(path.join(SESSIONS_DIR, f)).mtimeMs,
      }))
      .filter(f => f.mtime >= thirtyDaysAgo)
      .map(f => f.path);

    const allEntries: UsageEntry[] = [];
    for (const file of files) {
      allEntries.push(...parseSessionFile(file, thirtyDaysAgo));
    }

    const todayEntries = allEntries.filter(e => new Date(e.date + "T00:00:00Z").getTime() >= todayStart);
    const monthEntries = allEntries.filter(e => new Date(e.date + "T00:00:00Z").getTime() >= monthStart);

    // Build 30-day histogram
    const histMap: Record<string, number> = {};
    for (const e of allEntries) {
      histMap[e.date] = (histMap[e.date] ?? 0) + e.cost;
    }
    const hist = Object.entries(histMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, cost]) => ({ date, cost }));

    return NextResponse.json({
      day: summarize(todayEntries),
      month: summarize(monthEntries),
      hist,
      source: "openclaw-session-logs",
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
