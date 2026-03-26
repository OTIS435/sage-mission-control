import fs from "fs";

export default function MemoriesContent() {
  let content = "";
  try {
    const p = "/Users/sageopenclaw/.openclaw/workspace/MEMORY.md";
    content = fs.readFileSync(p, "utf-8");
  } catch {
    content = "_MEMORY.md not found._";
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="prose prose-invert prose-sm max-w-none">
        <pre className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-auto">
          {content}
        </pre>
      </div>
    </div>
  );
}
