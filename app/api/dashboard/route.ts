import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE = "/Users/sageopenclaw/.openclaw/workspace";
const CRON_FILE = "/Users/sageopenclaw/.openclaw/cron/jobs.json";

function readJSON<T>(filePath: string): T | null {
  try { return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T; }
  catch { return null; }
}

type Task = { id: string; title: string; status: string; project: string; priority: string };
type CronJob = {
  id: string; name: string;
  state?: { nextRunAtMs?: number; lastRunAtMs?: number; lastRunStatus?: string };
  schedule?: { kind: string; expr?: string };
};
type CronStore = { jobs?: CronJob[] };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getLatestMemoryLog(): string | null {
  const memDir = path.join(WORKSPACE, "memory");
  try {
    const files = fs.readdirSync(memDir)
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
      .sort().reverse();
    if (!files.length) return null;
    const content = fs.readFileSync(path.join(memDir, files[0]), "utf-8");
    // Return first non-empty, non-heading lines (up to 300 chars)
    const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("#"));
    return lines.slice(0, 4).join(" ").slice(0, 300);
  } catch { return null; }
}

function getLastGitCommit(): string | null {
  try {
    const { execSync } = require("child_process") as typeof import("child_process");
    const out = execSync('git -C ' + WORKSPACE + ' log -1 --format="%ci %s"', { encoding: "utf-8", timeout: 3000 });
    return out.trim();
  } catch { return null; }
}

export async function GET() {
  // Tasks
  const tasks: Task[] = readJSON<Task[]>(path.join(WORKSPACE, "projects/tasks.json")) ?? [];
  const taskStats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === "done").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    backlog: tasks.filter(t => t.status === "backlog").length,
    inProgressTasks: tasks.filter(t => t.status === "in-progress"),
  };

  // Cron jobs
  const cronStore = readJSON<CronStore>(CRON_FILE);
  const jobs: CronJob[] = cronStore?.jobs ?? [];
  const cronSummary = jobs.map(j => ({
    id: j.id,
    name: j.name,
    nextRunAtMs: j.state?.nextRunAtMs ?? null,
    lastRunAtMs: j.state?.lastRunAtMs ?? null,
    lastRunStatus: j.state?.lastRunStatus ?? null,
  }));

  // Memory log snippet
  const memorySnippet = getLatestMemoryLog();
  const todayLog = (() => {
    const today = todayStr();
    try {
      const p = path.join(WORKSPACE, "memory", `${today}.md`);
      return fs.existsSync(p) ? "✅ Today's log exists" : "⚠️ No log yet today";
    } catch { return null; }
  })();

  // Last git backup
  const lastCommit = getLastGitCommit();

  // Security cache
  const secCache = readJSON<{ score?: number; status?: string; timestamp?: string }>(
    path.join(WORKSPACE, ".security-cache.json")
  );

  return NextResponse.json({
    today: todayStr(),
    taskStats,
    cronSummary,
    memorySnippet,
    todayLog,
    lastCommit,
    secScore: secCache?.score ?? null,
    secStatus: secCache?.status ?? null,
    secTimestamp: secCache?.timestamp ?? null,
  });
}
