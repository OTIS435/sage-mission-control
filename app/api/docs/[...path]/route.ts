import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const filePath = path.join("/Users/sageopenclaw/.openclaw/workspace", ...pathSegments);

  // Security: ensure path stays within workspace
  const workspace = "/Users/sageopenclaw/.openclaw/workspace";
  if (!filePath.startsWith(workspace)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
