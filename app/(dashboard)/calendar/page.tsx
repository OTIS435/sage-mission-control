"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type CronEvent = { id: string; date: string; title: string; type: "cron"; recurring: boolean; label: string };
type UserEvent = { id: string; date: string; title: string; note: string; type: string };
type CalData = { cronEvents: CronEvent[]; userEvents: UserEvent[] };

const CRON_COLORS: Record<string, string> = {
  "Morning Briefing": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Memory Log": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Backup": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Security": "bg-red-500/20 text-red-300 border-red-500/30",
};

function cronColor(name: string): string {
  for (const [k, v] of Object.entries(CRON_COLORS)) {
    if (name.includes(k)) return v;
  }
  return "bg-zinc-700/50 text-zinc-300 border-zinc-600";
}

function daysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function firstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [data, setData] = useState<CalData>({ cronEvents: [], userEvents: [] });
  const [loading, setLoading] = useState(true);

  // Selected day modal
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [addTitle, setAddTitle] = useState("");
  const [addNote, setAddNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/calendar?year=${year}&month=${month}`);
    const d = await res.json() as CalData;
    setData(d);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  function prevMonth() { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); }

  async function addEvent() {
    if (!addTitle.trim() || !selectedDay) return;
    setSaving(true);
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDay, title: addTitle, note: addNote, type: "note" }),
    });
    setAddTitle(""); setAddNote("");
    await fetchData();
    setSaving(false);
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
    await fetchData();
  }

  const totalDays = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const today = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  // Group events by date
  const eventsByDate: Record<string, { cron: CronEvent[]; user: UserEvent[] }> = {};
  const initDay = (d: string) => { if (!eventsByDate[d]) eventsByDate[d] = { cron: [], user: [] }; };

  // Deduplicate cron events per day (only show unique job names per day)
  const seenCron: Record<string, Set<string>> = {};
  for (const e of data.cronEvents) {
    if (!seenCron[e.date]) seenCron[e.date] = new Set();
    if (seenCron[e.date].has(e.title)) continue;
    seenCron[e.date].add(e.title);
    initDay(e.date);
    eventsByDate[e.date].cron.push(e);
  }
  for (const e of data.userEvents) {
    initDay(e.date);
    eventsByDate[e.date].user.push(e);
  }

  const selectedDayEvents = selectedDay ? (eventsByDate[selectedDay] ?? { cron: [], user: [] }) : null;

  // Calendar grid: weeks × 7
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Calendar</h2>
          <p className="text-zinc-400 text-sm mt-1">Cron schedule + notes</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-white font-semibold min-w-[160px] text-center">{MONTH_NAMES[month]} {year}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(CRON_COLORS).map(([k, v]) => (
          <span key={k} className={`text-xs px-2 py-0.5 rounded border ${v}`}>{k}</span>
        ))}
        <span className="text-xs px-2 py-0.5 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Note</span>
      </div>

      {/* Grid */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-zinc-500">{d}</div>
          ))}
        </div>

        {/* Weeks */}
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-sm">Loading…</div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const dateStr = day ? toDateStr(year, month, day) : null;
              const evts = dateStr ? (eventsByDate[dateStr] ?? { cron: [], user: [] }) : null;
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDay;
              const hasCron = (evts?.cron.length ?? 0) > 0;
              const hasUser = (evts?.user.length ?? 0) > 0;

              return (
                <div
                  key={idx}
                  onClick={() => day && setSelectedDay(isSelected ? null : dateStr!)}
                  className={`min-h-[80px] p-1.5 border-b border-r border-zinc-800 transition-colors ${
                    day ? "cursor-pointer hover:bg-zinc-800/60" : "bg-zinc-950/30"
                  } ${isSelected ? "bg-zinc-800 ring-1 ring-inset ring-emerald-500/50" : ""}`}
                >
                  {day && (
                    <>
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${
                        isToday ? "bg-emerald-500 text-white" : "text-zinc-400"
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {evts?.cron.slice(0, 2).map(e => (
                          <div key={e.id} className={`text-xs px-1 py-0.5 rounded truncate border text-[10px] ${cronColor(e.title)}`}>
                            {e.title.replace("4:30 AM ","").replace(" Workspace","").replace(" Memory","Mem")}
                          </div>
                        ))}
                        {(evts?.cron.length ?? 0) > 2 && (
                          <div className="text-[10px] text-zinc-500">+{(evts?.cron.length ?? 0) - 2} more</div>
                        )}
                        {evts?.user.map(e => (
                          <div key={e.id} className="text-[10px] px-1 py-0.5 rounded truncate bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {e.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day detail panel */}
      {selectedDay && selectedDayEvents && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">
              {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
            </h3>
            <button onClick={() => setSelectedDay(null)} className="text-zinc-500 hover:text-white"><X size={14} /></button>
          </div>

          {/* Cron events */}
          {selectedDayEvents.cron.length > 0 && (
            <div className="mb-4">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Scheduled</p>
              <div className="space-y-1">
                {selectedDayEvents.cron.map(e => (
                  <div key={e.id} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${cronColor(e.title)}`}>
                    <span className="flex-1">{e.title}</span>
                    <span className="opacity-60">{e.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User notes */}
          {selectedDayEvents.user.length > 0 && (
            <div className="mb-4">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Notes</p>
              <div className="space-y-1">
                {selectedDayEvents.user.map(e => (
                  <div key={e.id} className="flex items-start gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                    <div className="flex-1">
                      <p className="text-white text-xs font-medium">{e.title}</p>
                      {e.note && <p className="text-zinc-400 text-xs mt-0.5">{e.note}</p>}
                    </div>
                    <button onClick={() => deleteEvent(e.id)} className="text-zinc-600 hover:text-red-400 flex-shrink-0 mt-0.5">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add note */}
          <div className="border-t border-zinc-800 pt-3">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Add Note</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Title…"
                value={addTitle}
                onChange={e => setAddTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && void addEvent()}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
              <input
                type="text"
                placeholder="Note (optional)…"
                value={addNote}
                onChange={e => setAddNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && void addEvent()}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
              <button
                onClick={() => void addEvent()}
                disabled={!addTitle.trim() || saving}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs rounded-lg transition-colors"
              >
                {saving ? "…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
