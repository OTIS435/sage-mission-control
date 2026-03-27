"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Search, X } from "lucide-react";

interface SearchResult {
  file: string;
  matchCount: number;
  snippets: string[];
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function DocsPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load file list on mount
  useEffect(() => {
    fetch("/api/docs")
      .then((r) => r.json())
      .then((d: { files?: string[] }) => setFiles(d.files || []));
  }, []);

  // Handle URL param ?file= (from linked files "Open in Docs")
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const file = params.get("file");
    if (file) loadFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFile = useCallback(async (file: string) => {
    setLoadingFile(true);
    setSelectedFile(file);
    setQuery(""); // clear search when opening a file directly
    setSearchResults([]);
    const segments = file.split("/").map(encodeURIComponent).join("/");
    const res = await fetch(`/api/docs/${segments}`);
    const data = (await res.json()) as { content?: string };
    setContent(data.content || "");
    setLoadingFile(false);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setTotalMatches(0);
      setTotalFiles(0);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/docs/search?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as {
          results: SearchResult[];
          totalMatches: number;
          totalFiles: number;
        };
        setSearchResults(data.results || []);
        setTotalMatches(data.totalMatches || 0);
        setTotalFiles(data.totalFiles || 0);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    setSearchResults([]);
    setTotalMatches(0);
    setTotalFiles(0);
  };

  const isSearching = query.trim().length >= 2;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Docs</h2>
        <p className="text-zinc-400 text-sm mt-1">Markdown files from workspace</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all docs… (MEMORY.md, guides, daily logs, projects)"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search results summary */}
      {isSearching && (
        <div className="text-xs text-zinc-500">
          {searching
            ? "Searching…"
            : totalFiles === 0
            ? `No matches for "${query}"`
            : `${totalMatches} match${totalMatches !== 1 ? "es" : ""} in ${totalFiles} file${totalFiles !== 1 ? "s" : ""}`}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-16rem)]">
        {/* Left panel: search results OR file list */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-y-auto">
          {isSearching ? (
            <>
              <h3 className="text-white font-semibold text-sm mb-3">
                Results
                {!searching && totalFiles > 0 && (
                  <span className="ml-2 text-zinc-500 font-normal">{totalFiles} file{totalFiles !== 1 ? "s" : ""}</span>
                )}
              </h3>
              {searchResults.length === 0 && !searching && (
                <p className="text-zinc-600 text-xs py-4 text-center">No matches found</p>
              )}
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={result.file}
                    onClick={() => loadFile(result.file)}
                    className={`w-full text-left rounded-lg p-3 border transition-colors ${
                      selectedFile === result.file
                        ? "bg-emerald-500/10 border-emerald-800 text-emerald-400"
                        : "bg-zinc-800 border-zinc-700 hover:border-zinc-600 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-mono truncate flex-1">
                        {result.file.split("/").pop()}
                      </span>
                      <span className="text-xs text-zinc-500 flex-shrink-0">
                        {result.matchCount} hit{result.matchCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mb-2">{result.file}</p>
                    {result.snippets.map((snippet, i) => (
                      <p key={i} className="text-xs text-zinc-400 bg-zinc-900 rounded px-2 py-1 mb-1 line-clamp-2">
                        {highlight(snippet, query)}
                      </p>
                    ))}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Right panel: file content */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-y-auto">
          {selectedFile ? (
            <>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
                <FileText size={14} className="text-zinc-400 flex-shrink-0" />
                <span className="text-zinc-300 text-sm truncate">{selectedFile}</span>
                {isSearching && (
                  <span className="ml-auto text-xs text-zinc-500 flex-shrink-0">
                    {searchResults.find(r => r.file === selectedFile)?.matchCount ?? 0} hit(s) in this file
                  </span>
                )}
              </div>
              {loadingFile ? (
                <p className="text-zinc-400 text-sm">Loading…</p>
              ) : (
                <pre className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                  {isSearching
                    ? highlight(content, query)
                    : content}
                </pre>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-600 text-sm">
              <Search size={24} className="opacity-30" />
              <span>{isSearching ? "Click a result to open it" : "Select a file to preview"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
