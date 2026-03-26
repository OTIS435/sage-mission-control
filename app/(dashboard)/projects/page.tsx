import fs from "fs";
import path from "path";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  mrr: number;
  target: number;
  sparkline: number[];
  category: string;
  color: string;
  startDate: string;
};

function MRRSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const height = 32;
  const width = 80;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="#10b981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400",
  planning: "bg-yellow-500/10 text-yellow-400",
  paused: "bg-zinc-700 text-zinc-400",
};

export default function ProjectsPage() {
  let projects: Project[] = [];
  try {
    const p = path.join(process.cwd(), "data", "projects.json");
    projects = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    projects = [];
  }

  const totalMRR = projects.reduce((sum, p) => sum + p.mrr, 0);
  const totalTarget = projects.reduce((sum, p) => sum + p.target, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Projects</h2>
          <p className="text-zinc-400 text-sm mt-1">{projects.length} projects · ${totalMRR}/mo MRR · ${totalTarget.toLocaleString()}/mo target</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between">
              <h3 className="text-white font-semibold">{project.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[project.status] || "bg-zinc-700 text-zinc-400"}`}>
                {project.status}
              </span>
            </div>
            <p className="text-zinc-400 text-xs">{project.description}</p>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-zinc-500 text-xs">MRR</p>
                <p className="text-emerald-400 font-bold text-lg">${project.mrr.toLocaleString()}</p>
                {project.target > 0 && (
                  <p className="text-zinc-500 text-xs">target: ${project.target.toLocaleString()}/mo</p>
                )}
              </div>
              <MRRSparkline data={project.sparkline.length > 1 ? project.sparkline : [0, 0, 0, 0, 0, 0]} />
            </div>

            {project.target > 0 && (
              <div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min((project.mrr / project.target) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-zinc-600 text-xs mt-1">{Math.round((project.mrr / project.target) * 100)}% to target</p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{project.category}</span>
              <span>Started {new Date(project.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
