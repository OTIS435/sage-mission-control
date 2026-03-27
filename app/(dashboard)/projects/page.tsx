"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, FileText } from "lucide-react";

type TaskCount = { total: number; done: number; inProgress: number; backlog: number };
type Task = { id: string; title: string; status: string; project: string; priority: string };

type Project = {
  id: string; name: string; status: string; description: string;
  platforms: string[]; revenuePotential: string; revenueNow: number;
  linkedDocs: string[]; stats: string[]; color: string;
  taskCounts: TaskCount; tasks: Task[];
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  planning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  blocked: "bg-red-500/10 text-red-400 border-red-500/30",
};

const COLOR_ACCENT: Record<string, string> = {
  blue: "border-blue-500/30 bg-blue-500/5",
  purple: "border-purple-500/30 bg-purple-500/5",
  emerald: "border-emerald-500/30 bg-emerald-500/5",
  yellow: "border-yellow-500/30 bg-yellow-500/5",
  red: "border-red-500/30 bg-red-500/5",
};

const COLOR_BAR: Record<string, string> = {
  blue: "bg-blue-500", purple: "bg-purple-500", emerald: "bg-emerald-500",
  yellow: "bg-yellow-500", red: "bg-red-500",
};

function basename(p: string) { return p.split("/").pop() ?? p; }

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const done = project.taskCounts.done;
  const total = project.taskCounts.total;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">{project.name}</h2>
            <p className="text-zinc-400 text-sm mt-1">{project.description}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[project.status] ?? "bg-zinc-700 text-zinc-400 border-zinc-600"}`}>
              {project.status}
            </span>
            <button onClick={onClose} className="text-zinc-500 hover:text-white p-1"><X size={16} /></button>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Revenue Potential</p>
          <p className="text-emerald-400 text-sm">{project.revenuePotential}</p>
          <p className="text-zinc-500 text-xs mt-1">Current MRR: ${project.revenueNow.toLocaleString()}/mo</p>
        </div>

        {/* Platforms */}
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Platforms</p>
          <div className="flex flex-wrap gap-2">
            {project.platforms.map(p => (
              <span key={p} className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-1 rounded-md">{p}</span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Status Details</p>
          <ul className="space-y-1">
            {project.stats.map((s, i) => (
              <li key={i} className="text-zinc-300 text-xs flex gap-2">
                <span className="text-zinc-600 flex-shrink-0">•</span>{s}
              </li>
            ))}
          </ul>
        </div>

        {/* Tasks */}
        {project.taskCounts.total > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Tasks</p>
              <span className="text-xs text-zinc-500">{done}/{total} done · {pct}%</span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full mb-3">
              <div className={`h-full rounded-full ${COLOR_BAR[project.color] ?? "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="space-y-1">
              {project.tasks.map(t => (
                <div key={t.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.status === "done" ? "bg-emerald-500" : t.status === "in-progress" ? "bg-yellow-400" : "bg-zinc-600"}`} />
                  <span className={t.status === "done" ? "text-zinc-500 line-through" : "text-zinc-300"}>{t.title}</span>
                  <span className={`ml-auto flex-shrink-0 ${t.priority === "high" ? "text-red-400" : t.priority === "medium" ? "text-yellow-400" : "text-zinc-600"}`}>{t.priority}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked docs */}
        {project.linkedDocs.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Linked Documents</p>
            <div className="space-y-1">
              {project.linkedDocs.map(doc => (
                <Link
                  key={doc}
                  href={`/docs?file=${encodeURIComponent(doc)}`}
                  className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <FileText size={12} />
                  {basename(doc)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then((d: { projects: Project[] }) => { setProjects(d.projects); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const active = projects.filter(p => p.status === "active");
  const planning = projects.filter(p => p.status === "planning");

  return (
    <div className="space-y-6">
      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Projects</h2>
          <p className="text-zinc-400 text-sm mt-1">
            {loading ? "Loading…" : `${active.length} active · ${planning.length} planning · $30k → $100k/mo target`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm py-12 text-center">Loading projects…</div>
      ) : (
        <>
          {/* Active */}
          <div>
            <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Active</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {active.map(p => <ProjectCard key={p.id} project={p} onClick={() => setSelected(p)} />)}
            </div>
          </div>

          {/* Planning */}
          {planning.length > 0 && (
            <div>
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Planning</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {planning.map(p => <ProjectCard key={p.id} project={p} onClick={() => setSelected(p)} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const { taskCounts: tc, color } = project;
  const pct = tc.total > 0 ? Math.round((tc.done / tc.total) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-zinc-900 border rounded-xl p-4 space-y-3 hover:border-zinc-600 transition-colors ${COLOR_ACCENT[color] ?? "border-zinc-800"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-white font-semibold text-sm">{project.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_STYLES[project.status] ?? "bg-zinc-700 text-zinc-400 border-zinc-600"}`}>
          {project.status}
        </span>
      </div>

      <p className="text-zinc-400 text-xs leading-relaxed">{project.description}</p>

      {/* Platform tags */}
      <div className="flex flex-wrap gap-1">
        {project.platforms.slice(0,3).map(pl => (
          <span key={pl} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{pl}</span>
        ))}
        {project.platforms.length > 3 && <span className="text-[10px] text-zinc-600">+{project.platforms.length-3}</span>}
      </div>

      {/* Task progress */}
      {tc.total > 0 && (
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>{tc.inProgress} in progress · {tc.backlog} backlog</span>
            <span>{tc.done}/{tc.total} done</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full">
            <div className={`h-full rounded-full ${COLOR_BAR[color] ?? "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Revenue potential */}
      <p className="text-xs text-zinc-500 truncate">💰 {project.revenuePotential.split(";")[0]}</p>

      <p className="text-xs text-emerald-400">Click for details →</p>
    </button>
  );
}
