import fs from "fs";
import path from "path";

type TeamNode = {
  id: string;
  name: string;
  title: string;
  role: string;
  reports: string[];
};

type TeamData = {
  nodes: TeamNode[];
};

function OrgNode({ node, all, depth = 0 }: { node: TeamNode; all: TeamNode[]; depth?: number }) {
  const reports = all.filter((n) => node.reports.includes(n.id));

  const roleColors: Record<string, string> = {
    founder: "border-emerald-500 bg-emerald-500/10",
    ai: "border-blue-500 bg-blue-500/10",
    pod: "border-zinc-600 bg-zinc-800",
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`border-2 rounded-xl px-4 py-3 text-center min-w-32 ${roleColors[node.role] || "border-zinc-700 bg-zinc-800"}`}>
        <p className="text-white font-semibold text-sm">{node.name}</p>
        <p className="text-zinc-400 text-xs mt-0.5">{node.title}</p>
      </div>
      {reports.length > 0 && (
        <>
          <div className="w-px h-6 bg-zinc-700" />
          <div className="flex gap-4 items-start">
            {reports.map((child, i) => (
              <div key={child.id} className="flex flex-col items-center">
                {reports.length > 1 && (
                  <div className="h-px bg-zinc-700" style={{ width: i === 0 || i === reports.length - 1 ? "50%" : "100%", alignSelf: i === 0 ? "flex-end" : i === reports.length - 1 ? "flex-start" : "center" }} />
                )}
                <OrgNode node={child} all={all} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function TeamPage() {
  let teamData: TeamData = { nodes: [] };
  try {
    const p = path.join(process.cwd(), "data", "team.json");
    teamData = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    teamData = { nodes: [] };
  }

  const root = teamData.nodes.find((n) => n.role === "founder");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Team</h2>
        <p className="text-zinc-400 text-sm mt-1">Organization structure</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 overflow-x-auto">
        {root ? (
          <div className="flex justify-center min-w-max">
            <OrgNode node={root} all={teamData.nodes} />
          </div>
        ) : (
          <p className="text-zinc-400 text-sm">No team data found</p>
        )}
      </div>

      {/* Team list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {teamData.nodes.map((node) => (
          <div key={node.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${node.role === "founder" ? "bg-emerald-500 text-zinc-950" : node.role === "ai" ? "bg-blue-500 text-white" : "bg-zinc-700 text-zinc-300"}`}>
              {node.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{node.name}</p>
              <p className="text-zinc-400 text-xs">{node.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
