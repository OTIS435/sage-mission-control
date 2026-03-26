"use client";

import { useState, useEffect } from "react";
import { FileText } from "lucide-react";

export default function DocsPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/docs")
      .then((r) => r.json())
      .then((d) => setFiles(d.files || []));
  }, []);

  const loadFile = async (file: string) => {
    setLoading(true);
    setSelectedFile(file);
    const res = await fetch(`/api/docs/${encodeURIComponent(file)}`);
    const data = await res.json();
    setContent(data.content || "");
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Docs</h2>
        <p className="text-zinc-400 text-sm mt-1">Markdown files from workspace</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        {/* File list */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-y-auto">
          <h3 className="text-white font-semibold text-sm mb-3">Files</h3>
          <div className="space-y-1">
            {files.map((file) => (
              <button
                key={file}
                onClick={() => loadFile(file)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  selectedFile === file
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <FileText size={14} />
                <span className="truncate">{file}</span>
              </button>
            ))}
            {files.length === 0 && (
              <p className="text-zinc-600 text-xs">No markdown files found</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-y-auto">
          {selectedFile ? (
            <>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
                <FileText size={14} className="text-zinc-400" />
                <span className="text-zinc-300 text-sm">{selectedFile}</span>
              </div>
              {loading ? (
                <p className="text-zinc-400 text-sm">Loading...</p>
              ) : (
                <pre className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                  {content}
                </pre>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
              Select a file to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
