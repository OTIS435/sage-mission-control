import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TASKS_PATH = "/Users/sageopenclaw/.openclaw/workspace/mission-control/data/tasks.json";

function readTasks(): Record<string, unknown>[] {
  try {
    const raw = fs.readFileSync(TASKS_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>[];
  } catch {
    return [];
  }
}

function writeTasks(tasks: Record<string, unknown>[]): void {
  const dir = path.dirname(TASKS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2), "utf-8");
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const updated = { ...tasks[idx], ...body };
  tasks[idx] = updated;
  writeTasks(tasks);
  return NextResponse.json({ task: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tasks = readTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  writeTasks(filtered);
  return NextResponse.json({ ok: true });
}
