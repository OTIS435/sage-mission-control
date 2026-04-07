"use client";

import { useState, useEffect, useCallback } from "react";

type ModelStats = { tokens: number; cost: number; label: string };
type Summary = {
  totalIn: number; totalOut: number; totalCache: number; totalCost: number;
  byModel: Record<string, ModelStats>;
};
type HistEntry = { date: string; cost: number };
type UsageData = { month: Summary; day: Summary; hist: HistEntry[]; source: string };

function fmtNum(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

function getModelColor(modelId: string): string {
  if (modelId.includes("opus"))   return "#8b5cf6";
  if (modelId.includes("sonnet")) return "#10b981";
  if (modelId.includes("haiku"))  return "#f59e0b";
  return "#6b7280";
}

function MiniSparkline({ data }: { data: HistEntry[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.cost), 0.001);
  const W = 200, H = 32;
  const pts = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * W;
    const y = H - (d.cost / max) * H;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={W} height={H} className="w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function AnthropicUsageWidget() {
  const [data, setData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"month" | "day">("month");
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/api-usage");
      if (!res.ok) {
        const e = await res.json();
        setError(e.error ?? "Failed to load");
        return;
      }
      const d: UsageData = await res.json();
      setData(d);
      setError(null);
      setLastRefresh(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    } catch {
      setError("Network error");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  const summary = data ? (tab === "month" ? data.month : data.day) : null;
  const sorted = summary ? Object.entries(summary.byModel).sort((a, b) => b[1].cost - a[1].cost) : [];
  const maxCost = sorted[0]?.[1].cost ?? 1;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">💰 API Usage</h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-zinc-700 text-xs">
            <button onClick={() => setTab("month")} className={`px-2 py-0.5 transition-colors ${tab === "month" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
              Month
            </button>
            <button onClick={() => setTab("day")} className={`px-2 py-0.5 transition-colors ${tab === "day" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
              Today
            </button>
          </div>
          <button onClick={load} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">↻</button>
        </div>
      </div>

      {error ? (
        <p className="text-red-400 text-xs">{error}</p>
      ) : !data ? (
        <p className="text-zinc-500 text-xs">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <p className="text-zinc-500 text-xs">Total cost</p>
              <p className="text-emerald-400 text-lg font-bold">${summary!.totalCost.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs">Output tokens</p>
              <p className="text-blue-400 text-lg font-bold">{fmtNum(summary!.totalOut)}</p>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            {sorted.length === 0 ? (
              <p className="text-zinc-600 text-xs">No usage this period</p>
            ) : sorted.map(([mid, d]) => {
              const pct = Math.round((d.cost / maxCost) * 100);
              return (
                <div key={mid}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-zinc-400 text-xs truncate flex-1">{d.label}</span>
                    <span className="text-zinc-300 text-xs font-mono ml-2">${d.cost.toFixed(4)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: getModelColor(mid) }} />
                  </div>
                </div>
              );
            })}
          </div>

          {tab === "month" && data.hist.length > 1 && (
            <div className="border-t border-zinc-800 pt-2">
              <p className="text-zinc-600 text-xs mb-1">30-day spend</p>
              <MiniSparkline data={data.hist} />
            </div>
          )}

          <p className="text-zinc-600 text-xs mt-2">
            {lastRefresh ? `Updated ${lastRefresh} · ` : ""}from session logs · auto-refreshes every 15m
          </p>
        </>
      )}
    </div>
  );
}
