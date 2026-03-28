import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE = "/Users/sageopenclaw/.openclaw/workspace";

type Task = { id: string; title: string; status: string; project: string; priority: string };

function readJSON<T>(p: string): T | null {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")) as T; }
  catch { return null; }
}

// Hard-coded project definitions wired to real data
const PROJECT_DEFS = [
  {
    id: "snotdoc-social",
    name: "SnotDoc Social Media",
    status: "active",
    description: "TikTok/Reels/Shorts content pipeline. 15 video ideas, scripts ready to film.",
    platforms: ["TikTok (@1SnotDoc)", "Instagram Reels", "YouTube Shorts", "X (@1SnotDoc)"],
    revenuePotential: "$5k–$15k/post at 100k+ followers; drives traffic to guides + affiliate",
    revenueNow: 0,
    linkedDocs: [
      "knowledge/projects/snotdoc-content/video-ideas.md",
      "knowledge/projects/snotdoc-content/content-calendar.md",
      "knowledge/projects/snotdoc-content/scripts/video-001-allergy-meds-ranked.md",
    ],
    stats: [
      "15 video ideas prioritized by search volume + timing",
      "Video 001 script: Allergy Meds Ranked ✅ ready to film",
      "5-week content calendar: Mar 24 – Apr 27",
      "2 videos/week target cadence",
      "Spring allergy season = peak timing right now",
    ],
    color: "blue",
    taskProject: "SnotDoc",
  },
  {
    id: "snotdoc",
    name: "SnotDoc",
    status: "active",
    description: "ENT content brand. Dr. Steve Chase is the face.",
    platforms: ["TikTok", "YouTube", "X (@1SnotDoc)", "Instagram"],
    revenuePotential: "$5k–$15k/post at 100k+ followers; affiliate + Gumroad guides + AdSense",
    revenueNow: 0,
    linkedDocs: ["knowledge/projects/snotdoc-guides/chronic-tonsillitis.md","knowledge/projects/snotdoc-guides/chronic-otitis-media.md","knowledge/projects/snotdoc-guides/chronic-nasal-congestion.md"],
    stats: ["4 TikTok videos", "20 TikTok followers", "Top video: 713 views", "X: 75 following / 6 followers"],
    color: "blue",
    taskProject: "SnotDoc",
  },
  {
    id: "daily-standard",
    name: "The Daily Standard",
    status: "active",
    description: "Stoic/Robbins journal/book. Author: Chase Gerber (pen name).",
    platforms: ["Amazon KDP", "IngramSpark"],
    revenuePotential: "$10–$25/book; recurring passive income at scale",
    revenueNow: 0,
    linkedDocs: [
      "knowledge/projects/daily-standard/manifesto.md",
      "knowledge/projects/daily-standard/product-structure.md",
    ],
    stats: ["Manifesto written ✅", "Product structure drafted ✅", "60/40 Stoic/Robbins tone", "365 quotes list — next step", "Format decision pending: journal / book / both"],
    color: "purple",
    taskProject: "The Daily Standard",
  },
  {
    id: "ent-guides",
    name: "ENT Patient Guides",
    status: "active",
    description: "3 guides written for Gumroad digital sales ($7–15 each).",
    platforms: ["Gumroad"],
    revenuePotential: "$7–$15 each; B2B: hospitals, ASCs, pediatric offices",
    revenueNow: 0,
    linkedDocs: ["knowledge/projects/snotdoc-guides/chronic-tonsillitis.md","knowledge/projects/snotdoc-guides/chronic-otitis-media.md","knowledge/projects/snotdoc-guides/chronic-nasal-congestion.md"],
    stats: ["3 guides complete", "Awaiting Steve review", "Gumroad account not created"],
    color: "emerald",
    taskProject: "ENT Patient Guides",
  },
  {
    id: "ai-attending",
    name: "The AI Attending",
    status: "planning",
    description: "AI in medicine from a surgeon's perspective. Cautious optimist angle.",
    platforms: ["X", "LinkedIn", "TikTok", "YouTube"],
    revenuePotential: "Sponsorships, consulting, courses — long-term high upside",
    revenueNow: 0,
    linkedDocs: [],
    stats: ["Handle @TheAIAttending target", "LinkedIn profile update pending", "Soft launch ~2 weeks out"],
    color: "yellow",
    taskProject: "The AI Attending",
  },
  {
    id: "snotdoc-kids",
    name: "SnotDoc Kids Books",
    status: "planning",
    description: "Tag Tony tonsil picture book + coloring book. B2B: hospitals, ASCs, pediatric offices, AAO-HNS.",
    platforms: ["Amazon KDP", "IngramSpark", "B2B direct"],
    revenuePotential: "Coloring book $35–50 premium gift; B2B bulk sales high upside",
    revenueNow: 0,
    linkedDocs: [],
    stats: ["Coloring book: 10-page design phase", "Tag Tony: concept stage", "Strong AAO-HNS conference angle"],
    color: "red",
    taskProject: "SnotDoc Kids Coloring Book",
  },
];

export async function GET() {
  const tasks: Task[] = readJSON<Task[]>(path.join(WORKSPACE, "projects/tasks.json")) ?? [];
  const statusMd = (() => {
    try { return fs.readFileSync(path.join(WORKSPACE, "projects/status.md"), "utf-8"); }
    catch { return null; }
  })();

  const projects = PROJECT_DEFS.map(def => {
    const related = tasks.filter(t => t.project === def.taskProject || t.project.includes(def.id));
    return {
      ...def,
      taskCounts: {
        total: related.length,
        done: related.filter(t => t.status === "done").length,
        inProgress: related.filter(t => t.status === "in-progress").length,
        backlog: related.filter(t => t.status === "backlog").length,
      },
      tasks: related,
    };
  });

  return NextResponse.json({ projects, statusMdLength: statusMd?.length ?? 0 });
}
