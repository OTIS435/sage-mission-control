import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE = "/Users/sageopenclaw/.openclaw/workspace";
const CRON_FILE = "/Users/sageopenclaw/.openclaw/cron/jobs.json";
const CAL_FILE = path.join(WORKSPACE, "projects/calendar.json");

type CronJob = {
  id: string; name: string; enabled: boolean;
  schedule?: { kind: string; expr?: string; everyMs?: number };
  state?: { nextRunAtMs?: number };
};
type CronStore = { jobs?: CronJob[] };
type CalEvent = { id: string; date: string; title: string; note: string; type: string };

function readJSON<T>(p: string): T | null {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")) as T; }
  catch { return null; }
}

// Derive next N occurrences from a cron expression (simplified: daily/hourly only)
function cronLabel(expr?: string): string {
  if (!expr) return "scheduled";
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return expr;
  const [min, hour, , , dow] = parts;
  if (dow !== "*") return `weekly`;
  if (hour === "*") return `every hour`;
  if (hour.includes("*/")) {
    const interval = parseInt(hour.replace("*/", ""));
    return `every ${interval}h`;
  }
  const h = parseInt(hour);
  const m = parseInt(min);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `daily ${h12}:${String(m).padStart(2,"0")} ${ampm}`;
}

// Generate dates for the current month for a recurring cron job
function cronDatesForMonth(expr: string | undefined, everyMs: number | undefined, year: number, month: number): string[] {
  const dates: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  if (everyMs) {
    // e.g. every 4h — show each day
    for (let d = 1; d <= daysInMonth; d++) {
      dates.push(`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
    }
    return dates;
  }

  if (!expr) return dates;
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return dates;
  const [, , dayOfMonth, , dayOfWeek] = parts;

  if (dayOfWeek !== "*") {
    const dow = parseInt(dayOfWeek);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (date.getDay() === dow) {
        dates.push(`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
      }
    }
  } else if (dayOfMonth === "*") {
    // daily
    for (let d = 1; d <= daysInMonth; d++) {
      dates.push(`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
    }
  }
  return dates;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth())); // 0-indexed

  // Cron jobs → recurring events
  const cronStore = readJSON<CronStore>(CRON_FILE);
  const jobs = (cronStore?.jobs ?? []).filter(j => j.enabled);

  const cronEvents: { id: string; date: string; title: string; type: string; recurring: boolean; label: string }[] = [];
  for (const job of jobs) {
    const label = cronLabel(job.schedule?.expr);
    const dates = cronDatesForMonth(job.schedule?.expr, job.schedule?.everyMs, year, month);
    for (const date of dates) {
      cronEvents.push({ id: `cron-${job.id}-${date}`, date, title: job.name, type: "cron", recurring: true, label });
    }
  }

  // User calendar events
  const userEvents: CalEvent[] = readJSON<CalEvent[]>(CAL_FILE) ?? [];

  return NextResponse.json({ cronEvents, userEvents });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<CalEvent>;
  const events: CalEvent[] = readJSON<CalEvent[]>(CAL_FILE) ?? [];
  const newEvent: CalEvent = {
    id: `evt-${Date.now()}`,
    date: body.date ?? new Date().toISOString().slice(0, 10),
    title: body.title ?? "Note",
    note: body.note ?? "",
    type: body.type ?? "note",
  };
  events.push(newEvent);
  fs.writeFileSync(CAL_FILE, JSON.stringify(events, null, 2));
  return NextResponse.json({ event: newEvent });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  let events: CalEvent[] = readJSON<CalEvent[]>(CAL_FILE) ?? [];
  events = events.filter(e => e.id !== id);
  fs.writeFileSync(CAL_FILE, JSON.stringify(events, null, 2));
  return NextResponse.json({ ok: true });
}
