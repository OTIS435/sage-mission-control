import fs from "fs";
import path from "path";

function readJSON(file: string) {
  try {
    const p = path.join(process.cwd(), "data", file);
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const tasks = readJSON("tasks.json") || [];
  const projects = readJSON("projects.json") || [];
  const events = readJSON("events.json") || [];
  const securityLog = readJSON("security-log.json") || [];

  const inProgress = tasks.filter((t: { status: string }) => t.status === "in-progress").length;
  const backlog = tasks.filter((t: { status: string }) => t.status === "backlog").length;
  const totalMRR = projects.reduce((sum: number, p: { mrr: number }) => sum + (p.mrr || 0), 0);
  const lastScan = securityLog[0];
  const upcomingEvents = events.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Overview</h2>
        <p className="text-zinc-400 text-sm mt-1">Good morning, Dr. Chase.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total MRR", value: `$${totalMRR.toLocaleString()}`, sub: "across all projects", color: "emerald" },
          { label: "Active Projects", value: projects.filter((p: { status: string }) => p.status === "active").length, sub: "in progress", color: "blue" },
          { label: "Tasks In Progress", value: inProgress, sub: `${backlog} in backlog`, color: "yellow" },
          { label: "Security Status", value: lastScan?.status === "clean" ? "Clean" : "Alert", sub: lastScan ? new Date(lastScan.timestamp).toLocaleDateString() : "No scans", color: lastScan?.status === "clean" ? "emerald" : "red" },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-xs mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color === "emerald" ? "text-emerald-400" : stat.color === "blue" ? "text-blue-400" : stat.color === "yellow" ? "text-yellow-400" : stat.color === "red" ? "text-red-400" : "text-white"}`}>
              {stat.value}
            </p>
            <p className="text-zinc-500 text-xs mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3">Upcoming Events</h3>
          <div className="space-y-2">
            {upcomingEvents.map((event: { id: string; title: string; date: string; time: string; type: string }) => (
              <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{event.title}</p>
                  <p className="text-zinc-500 text-xs">{event.date} at {event.time}</p>
                </div>
                <span className="text-xs text-zinc-500 capitalize">{event.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3">In Progress</h3>
          <div className="space-y-2">
            {tasks.filter((t: { status: string }) => t.status === "in-progress").map((task: { id: string; title: string; project: string; priority: string }) => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{task.title}</p>
                  <p className="text-zinc-500 text-xs">{task.project}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${task.priority === "high" ? "bg-red-500/10 text-red-400" : task.priority === "medium" ? "bg-yellow-500/10 text-yellow-400" : "bg-zinc-700 text-zinc-400"}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects MRR */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3">Project Revenue</h3>
        <div className="space-y-3">
          {projects.filter((p: { target: number }) => p.target > 0).map((project: { id: string; name: string; mrr: number; target: number; category: string }) => (
            <div key={project.id} className="flex items-center gap-4">
              <div className="w-32 text-sm text-zinc-300 truncate">{project.name}</div>
              <div className="flex-1">
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min((project.mrr / project.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-right w-32">
                <span className="text-emerald-400 text-sm font-medium">${project.mrr}</span>
                <span className="text-zinc-500 text-xs"> / ${project.target.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
