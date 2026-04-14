import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TASKS_PATH = "/Users/sageopenclaw/.openclaw/workspace/mission-control/data/tasks.json";

function readTasks(): unknown[] {
  try {
    const raw = fs.readFileSync(TASKS_PATH, "utf-8");
    return JSON.parse(raw) as unknown[];
  } catch {
    return [];
  }
}

function writeTasks(tasks: unknown[]): void {
  const dir = path.dirname(TASKS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2), "utf-8");
}

export async function GET() {
  const tasks = readTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { task: Record<string, unknown> };
  const tasks = readTasks() as Record<string, unknown>[];
  const newTask = {
    ...body.task,
    id: `t-${Date.now()}`,
  };
  tasks.push(newTask);
  writeTasks(tasks);
  return NextResponse.json({ task: newTask }, { status: 201 });
}
