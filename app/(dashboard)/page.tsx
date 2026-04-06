"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AnthropicUsageWidget from "@/components/anthropic-usage-widget";

type CronSummary = {
  id: string; name: string;
  nextRunAtMs: number | null;
  lastRunAtMs: number | null;
  lastRunStatus: string | null;
};

type InProgressTask = { id: string; title: string; project: string; priority: string };

type DashData = {
  today: string;
  taskStats: {
    total: number; done: number; inProgress: number; backlog: number;
    inProgressTasks: InProgressTask[];
  };
  cronSummary: CronSummary[];
  memorySnippet: string | null;
  todayLog: string | null;
  lastCommit: string | null;
  secScore: number | null;
  secStatus: string | null;
  secTimestamp: string | null;
};

function fmtMs(ms: number | null): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const now = Date.now();
  const diff = ms - now;
  if (Math.abs(diff) < 60000) return "now";
  if (diff > 0) {
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
  }
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const QUICK_LINKS = [
  { href: "/tasks", label: "Task Board", icon: "📋" },
  { href: "/projects", label: "Projects", icon: "🚀" },
  { href: "/docs", label: "Docs", icon: "📄" },
  { href: "/memories", label: "Memories", icon: "🧠" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/security", label: "Security", icon: "🛡️" },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      fetch("/api/dashboard")
        .then(r => r.json())
        .then((d: DashData) => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const today = data?.today ?? new Date().toISOString().slice(0, 10);
  const dateLabel = new Date(today + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });

  const briefingJob = data?.cronSummary.find(j => j.name.includes("Morning Briefing"));
  const backupJob = data?.cronSummary.find(j => j.name.includes("Backup"));
  const memLogJob = data?.cronSummary.find(j => j.name.includes("Memory Log"));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Mission Control</h2>
          <p className="text-zinc-400 text-sm mt-1">{dateLabel}</p>
        </div>
        <div className="text-right text-xs text-zinc-500">
          {data?.todayLog && <p className={data.todayLog.startsWith("✅") ? "text-emerald-400" : "text-yellow-400"}>{data.todayLog}</p>}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs mb-1">Tasks Active</p>
          <p className="text-2xl font-bold text-yellow-400">{loading ? "—" : data?.taskStats.inProgress}</p>
          <p className="text-zinc-500 text-xs mt-1">{data?.taskStats.backlog ?? "—"} in backlog · {data?.taskStats.done ?? "—"} done</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs mb-1">Total Tasks</p>
          <p className="text-2xl font-bold text-blue-400">{loading ? "—" : data?.taskStats.total}</p>
          <p className="text-zinc-500 text-xs mt-1">{data ? Math.round((data.taskStats.done / Math.max(data.taskStats.total,1))*100) : "—"}% complete</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs mb-1">Security</p>
          <p className={`text-2xl font-bold ${data?.secStatus === "clean" ? "text-emerald-400" : data?.secStatus ? "text-red-400" : "text-zinc-400"}`}>
            {loading ? "—" : data?.secScore != null ? `${data.secScore}/100` : data?.secStatus ?? "—"}
          </p>
          <p className="text-zinc-500 text-xs mt-1">{data?.secTimestamp ? new Date(data.secTimestamp).toLocaleDateString() : "No scan data"}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs mb-1">Revenue Target</p>
          <p className="text-2xl font-bold text-emerald-400">$30k</p>
          <p className="text-zinc-500 text-xs mt-1">Goal: $100k/mo · Gap: $70k</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduled jobs */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3">⏱ Scheduled Jobs</h3>
          {loading ? <p className="text-zinc-500 text-xs">Loading…</p> : (
            <div className="space-y-3">
              {[
                { job: briefingJob, label: "Morning Briefing" },
                { job: memLogJob, label: "Memory Log" },
                { job: backupJob, label: "GitHub Backup" },
              ].map(({ job, label }) => (
                <div key={label} className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-300 text-xs font-medium">{label}</p>
                    <p className="text-zinc-500 text-xs">
                      Last: {fmtDate(job?.lastRunAtMs ?? null)}
                      {job?.lastRunStatus === "error" && <span className="text-red-400 ml-1">✗ error</span>}
                      {job?.lastRunStatus === "ok" && <span className="text-emerald-400 ml-1">✓</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-400 font-mono">{fmtMs(job?.nextRunAtMs ?? null)}</p>
                    <p className="text-zinc-600 text-xs">next run</p>
                  </div>
                </div>
              ))}
              {data?.cronSummary.filter(j =>
                !j.name.includes("Morning Briefing") && !j.name.includes("Backup") && !j.name.includes("Memory Log")
              ).map(j => (
                <div key={j.id} className="flex items-center justify-between">
                  <p className="text-zinc-400 text-xs truncate flex-1">{j.name}</p>
                  <p className="text-xs text-zinc-500 font-mono ml-2">{fmtMs(j.nextRunAtMs)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* In Progress tasks */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3">🔄 In Progress</h3>
          <div className="space-y-2">
            {loading ? <p className="text-zinc-500 text-xs">Loading…</p> : data?.taskStats.inProgressTasks.length === 0
              ? <p className="text-zinc-600 text-xs">No active tasks</p>
              : data?.taskStats.inProgressTasks.map(t => (
                <div key={t.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs truncate">{t.title}</p>
                    <p className="text-zinc-500 text-xs">{t.project}</p>
                  </div>
                  <span className={`text-xs flex-shrink-0 ${t.priority === "high" ? "text-red-400" : t.priority === "medium" ? "text-yellow-400" : "text-zinc-500"}`}>
                    {t.priority}
                  </span>
                </div>
              ))
            }
          </div>
          <Link href="/tasks" className="mt-3 block text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            View all tasks →
          </Link>
        </div>

        {/* Memory snippet */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3">🧠 Today's Log</h3>
          {loading ? <p className="text-zinc-500 text-xs">Loading…</p> : (
            <p className="text-zinc-400 text-xs leading-relaxed">
              {data?.memorySnippet ?? "No memory log entry yet today."}
            </p>
          )}
          {data?.lastCommit && (
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <p className="text-zinc-500 text-xs">Last backup</p>
              <p className="text-zinc-400 text-xs font-mono truncate mt-0.5">{data.lastCommit}</p>
            </div>
          )}
          <Link href="/memories" className="mt-3 block text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            Full memory →
          </Link>
        </div>
      </div>

      {/* API Usage Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnthropicUsageWidget />
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-3">Quick Links</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {QUICK_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-3 flex flex-col items-center gap-1.5 transition-colors group"
            >
              <span className="text-xl">{l.icon}</span>
              <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">{l.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
