"use client";

import { useEffect, useState } from "react";

interface MemoryFile {
  name: string;
  date: string | null;
  content: string;
}

export default function MemoriesContent() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/memory")
      .then(r => r.json())
      .then(data => {
        setFiles(data.files || []);
        if (data.files?.length > 0) setSelected(data.files[0].name);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = query.trim()
    ? files.filter(f =>
        f.content.toLowerCase().includes(query.toLowerCase()) ||
        f.name.toLowerCase().includes(query.toLowerCase())
      )
    : files;

  const activeFile = files.find(f => f.name === selected);

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.replace(regex, "~~MARK~~$1~~ENDMARK~~");
  };

  const renderContent = (content: string, q: string) => {
    if (!q.trim()) return <span>{content}</span>;
    const marked = highlight(content, q);
    const parts = marked.split(/(~~MARK~~.*?~~ENDMARK~~)/g);
    return (
      <>
        {parts.map((part, i) =>
          part.startsWith("~~MARK~~") ? (
            <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">
              {part.replace(/~~MARK~~|~~ENDMARK~~/g, "")}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  if (loading) return <div className="text-zinc-400 text-sm">Loading memory files…</div>;

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 flex flex-col gap-2">
        <input
          type="text"
          placeholder="Search all memories…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
        />
        <div className="flex-1 overflow-y-auto space-y-1">
          {filtered.length === 0 && (
            <div className="text-zinc-500 text-xs px-2 py-4">No matches</div>
          )}
          {filtered.map(f => (
            <button
              key={f.name}
              onClick={() => setSelected(f.name)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                selected === f.name
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {f.date ? (
                <>
                  <div className="font-mono text-zinc-300">{f.date}</div>
                  <div className="text-zinc-500">Daily log</div>
                </>
              ) : (
                <div className="font-semibold text-emerald-400">📋 Long-term memory</div>
              )}
            </button>
          ))}
        </div>
        <div className="text-zinc-600 text-xs px-1">
          {files.length} file{files.length !== 1 ? "s" : ""}
          {query && ` · ${filtered.length} match${filtered.length !== 1 ? "es" : ""}`}
        </div>
      </div>

      {/* Content pane */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5 overflow-y-auto">
        {activeFile ? (
          <>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-white">{activeFile.name}</h3>
              <span className="text-xs text-zinc-500">
                {activeFile.content.length.toLocaleString()} chars
              </span>
              {query && (
                <span className="text-xs text-yellow-400">
                  {(activeFile.content.match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) || []).length} hit(s)
                </span>
              )}
            </div>
            <pre className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-mono">
              {renderContent(activeFile.content, query)}
            </pre>
          </>
        ) : (
          <div className="text-zinc-500 text-sm">Select a file to view</div>
        )}
      </div>
    </div>
  );
}
