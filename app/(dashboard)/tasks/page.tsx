import fs from "fs";
import path from "path";

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  project: string;
  priority: string;
  createdAt: string;
};

const columns = [
  { id: "backlog", label: "Backlog", color: "zinc" },
  { id: "in-progress", label: "In Progress", color: "yellow" },
  { id: "done", label: "Done", color: "emerald" },
];

export default function TasksPage() {
  let tasks: Task[] = [];
  try {
    const p = path.join(process.cwd(), "data", "tasks.json");
    tasks = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    tasks = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Task Board</h2>
        <p className="text-zinc-400 text-sm mt-1">{tasks.length} total tasks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm">{col.label}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${col.color === "yellow" ? "bg-yellow-500/10 text-yellow-400" : col.color === "emerald" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-700 text-zinc-400"}`}>
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <div key={task.id} className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 space-y-2 hover:border-zinc-600 transition-colors">
                    <p className="text-white text-sm font-medium">{task.title}</p>
                    <p className="text-zinc-400 text-xs">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded-full">{task.project}</span>
                      <span className={`text-xs ${task.priority === "high" ? "text-red-400" : task.priority === "medium" ? "text-yellow-400" : "text-zinc-500"}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <p className="text-zinc-600 text-xs text-center py-4">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
