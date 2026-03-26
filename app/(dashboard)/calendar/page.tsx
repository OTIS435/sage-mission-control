import fs from "fs";
import path from "path";

type CalEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  description: string;
};

const typeColors: Record<string, string> = {
  clinical: "bg-red-500/20 text-red-400 border-red-500/30",
  content: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  writing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  business: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default function CalendarPage() {
  let events: CalEvent[] = [];
  try {
    const p = path.join(process.cwd(), "data", "events.json");
    events = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    events = [];
  }

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Calendar</h2>
        <p className="text-zinc-400 text-sm mt-1">{events.length} upcoming events</p>
      </div>

      <div className="space-y-3">
        {sortedEvents.map((event) => {
          const colorClass = typeColors[event.type] || "bg-zinc-700 text-zinc-300 border-zinc-600";
          const dateObj = new Date(event.date + "T00:00:00");
          const formattedDate = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

          return (
            <div key={event.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4">
              <div className="flex-shrink-0 w-16 text-center">
                <div className="text-2xl font-bold text-white">{dateObj.getDate()}</div>
                <div className="text-zinc-500 text-xs">{dateObj.toLocaleDateString("en-US", { month: "short" })}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-white font-semibold text-sm">{event.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${colorClass}`}>
                    {event.type}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mt-1">{event.description}</p>
                <p className="text-zinc-500 text-xs mt-2">{formattedDate} at {event.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
