"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";

type Subtask = { id: string; text: string; done: boolean };

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  project: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  subtasks: Subtask[];
  notes: string;
  linkedFiles: string[];
};

const COLUMNS = [
  { id: "backlog", label: "Backlog" },
  { id: "in-progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

function priorityColor(p: string): string {
  if (p === "high") return "text-red-400";
  if (p === "medium") return "text-yellow-400";
  return "text-zinc-400";
}

function basename(filePath: string): string {
  return filePath.split("/").pop() ?? filePath;
}

async function patchTask(
  id: string,
  data: Partial<Task>
): Promise<Task | null> {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { task: Task };
    return json.task;
  } catch {
    return null;
  }
}

// ── Linked File Viewer ─────────────────────────────────────────────────────────

function LinkedFile({ filePath }: { filePath: string }) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = filePath.split("/").pop() ?? filePath;
  // Convert workspace-relative path to /api/docs/[...path] segments
  const docHref = `/docs?file=${encodeURIComponent(filePath)}`;
  const apiPath = `/api/docs/${filePath.split("/").join("/")}`;

  async function toggle() {
    if (expanded) { setExpanded(false); return; }
    if (content !== null) { setExpanded(true); return; }
    setLoading(true);
    try {
      const res = await fetch(apiPath);
      const json = await res.json() as { content?: string; error?: string };
      if (json.error) { setError(json.error); }
      else { setContent(json.content ?? ""); setExpanded(true); }
    } catch {
      setError("Failed to load file");
    } finally { setLoading(false); }
  }

  // Render markdown-ish: headings bold, ** bold, strip # symbols
  function renderContent(raw: string) {
    return raw.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <p key={i} className="font-bold text-white mt-3 mb-1">{line.slice(3)}</p>;
      if (line.startsWith("# ")) return <p key={i} className="font-bold text-emerald-400 text-sm mt-2 mb-1">{line.slice(2)}</p>;
      if (line.startsWith("- ")) return <p key={i} className="text-zinc-300 pl-3 before:content-['•'] before:mr-2 before:text-zinc-500">{line.slice(2)}</p>;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-zinc-300">{line}</p>;
    });
  }

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800">
        <button
          onClick={toggle}
          className="flex-1 text-left flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors"
          title={filePath}
        >
          <span className="text-zinc-500">{expanded ? "▾" : "▸"}</span>
          <span className="font-mono">{name}</span>
          {loading && <span className="text-zinc-500 italic">loading…</span>}
          {error && <span className="text-red-400 italic">{error}</span>}
        </button>
        <a
          href={docHref}
          className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-800 hover:border-emerald-600 px-2 py-0.5 rounded transition-colors whitespace-nowrap"
          title="Open in Docs section"
        >
          Open in Docs →
        </a>
      </div>
      {expanded && content !== null && (
        <div className="px-4 py-3 bg-zinc-900 text-xs leading-relaxed max-h-72 overflow-y-auto space-y-0.5">
          {renderContent(content)}
        </div>
      )}
    </div>
  );
}

// ── Task Detail Modal ──────────────────────────────────────────────────────────

function TaskModal({
  task,
  onClose,
  onUpdate,
}: {
  task: Task;
  onClose: () => void;
  onUpdate: (task: Task) => void;
}) {
  const [local, setLocal] = useState<Task>(task);
  const [newSub, setNewSub] = useState("");

  // Reset local state when a different task is opened
  useEffect(() => {
    setLocal(task);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  function save(patch: Partial<Task>) {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onUpdate(updated);
    void patchTask(task.id, patch);
  }

  function addSubtask() {
    if (!newSub.trim()) return;
    const subtask: Subtask = {
      id: `st-${Date.now()}`,
      text: newSub.trim(),
      done: false,
    };
    setNewSub("");
    save({ subtasks: [...local.subtasks, subtask] });
  }

  function toggleSubtask(id: string) {
    save({
      subtasks: local.subtasks.map((s) =>
        s.id === id ? { ...s, done: !s.done } : s
      ),
    });
  }

  function deleteSubtask(id: string) {
    save({ subtasks: local.subtasks.filter((s) => s.id !== id) });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 mx-4 relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="mb-4 pr-8">
          <input
            className="w-full bg-transparent text-white font-bold text-lg focus:outline-none border-b border-transparent hover:border-zinc-600 focus:border-zinc-500 pb-1 transition-colors"
            value={local.title}
            onChange={(e) =>
              setLocal((prev) => ({ ...prev, title: e.target.value }))
            }
            onBlur={(e) => save({ title: e.target.value })}
          />
        </div>

        {/* Project + Priority */}
        <div className="flex items-center gap-3 mb-5">
          {local.project && (
            <span className="text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-full">
              {local.project}
            </span>
          )}
          <select
            className="text-xs bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-white focus:outline-none focus:border-zinc-500"
            value={local.priority}
            onChange={(e) =>
              save({ priority: e.target.value as Task["priority"] })
            }
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
            Description
          </label>
          <textarea
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none min-h-[80px]"
            value={local.description}
            placeholder="Add a description..."
            onChange={(e) =>
              setLocal((prev) => ({ ...prev, description: e.target.value }))
            }
            onBlur={(e) => save({ description: e.target.value })}
          />
        </div>

        {/* Subtasks */}
        <div className="mb-5">
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
            Subtasks{" "}
            {local.subtasks.length > 0 && (
              <span className="text-zinc-600 normal-case tracking-normal">
                ({local.subtasks.filter((s) => s.done).length}/
                {local.subtasks.length})
              </span>
            )}
          </label>
          <div className="space-y-1.5 mb-2">
            {local.subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={() => toggleSubtask(s.id)}
                  className="accent-blue-500 cursor-pointer"
                />
                <span
                  className={`text-sm flex-1 ${
                    s.done ? "line-through text-zinc-500" : "text-zinc-200"
                  }`}
                >
                  {s.text}
                </span>
                <button
                  onClick={() => deleteSubtask(s.id)}
                  className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              placeholder="Add subtask..."
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSubtask();
                }
              }}
            />
            <button
              onClick={addSubtask}
              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-md transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
            Notes
          </label>
          <textarea
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none min-h-[80px]"
            placeholder="Add notes..."
            value={local.notes}
            onChange={(e) =>
              setLocal((prev) => ({ ...prev, notes: e.target.value }))
            }
            onBlur={(e) => save({ notes: e.target.value })}
          />
        </div>

        {/* Linked Files */}
        {local.linkedFiles.length > 0 && (
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
              Linked Files
            </label>
            <div className="space-y-2">
              {local.linkedFiles.map((file, i) => (
                <LinkedFile key={i} filePath={file} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task Card ──────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onDragStart,
  onClick,
  onUpdate,
}: {
  task: Task;
  onDragStart: (id: string) => void;
  onClick: () => void;
  onUpdate: (task: Task) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle) inputRef.current?.focus();
  }, [editingTitle]);

  // Keep draft in sync if task updates from elsewhere
  useEffect(() => {
    if (!editingTitle) setDraft(task.title);
  }, [task.title, editingTitle]);

  function saveTitle() {
    setEditingTitle(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== task.title) {
      const updated = { ...task, title: trimmed };
      onUpdate(updated);
      void patchTask(task.id, { title: trimmed });
    }
  }

  const doneSubs = task.subtasks.filter((s) => s.done).length;
  const totalSubs = task.subtasks.length;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(task.id);
      }}
      onClick={() => {
        if (!editingTitle) onClick();
      }}
      className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 space-y-2 hover:border-zinc-500 cursor-pointer transition-colors select-none"
    >
      {editingTitle ? (
        <input
          ref={inputRef}
          className="w-full bg-transparent text-white text-sm font-medium focus:outline-none border-b border-zinc-500 pb-0.5"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              saveTitle();
            }
            if (e.key === "Escape") {
              setEditingTitle(false);
              setDraft(task.title);
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <p
          className="text-white text-sm font-medium"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingTitle(true);
          }}
        >
          {task.title}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded-full truncate max-w-[60%]">
          {task.project || "—"}
        </span>
        <div className="flex items-center gap-2">
          {totalSubs > 0 && (
            <span className="text-xs text-zinc-500">
              {doneSubs}/{totalSubs} ✓
            </span>
          )}
          <span className={`text-xs font-medium ${priorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Add Task Form ──────────────────────────────────────────────────────────────

function AddTaskForm({
  columnId,
  onAdd,
  onCancel,
}: {
  columnId: string;
  onAdd: (task: Task) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit() {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      description: "",
      status: columnId,
      project: "",
      priority,
      createdAt: new Date().toISOString().split("T")[0],
      subtasks: [],
      notes: "",
      linkedFiles: [],
    };
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: payload }),
      });
      if (res.ok) {
        const data = (await res.json()) as { task: Task };
        onAdd(data.task);
      }
    } catch {
      // silent — optimistic add already happened via onAdd in parent
    }
  }

  return (
    <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 space-y-2">
      <input
        ref={inputRef}
        className="w-full bg-transparent text-white text-sm focus:outline-none border-b border-zinc-600 pb-1 placeholder-zinc-600"
        placeholder="Task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void submit();
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="flex items-center gap-2">
        <select
          className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-xs text-white focus:outline-none"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Task["priority"])}
        >
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <button
          onClick={() => void submit()}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [addingToCol, setAddingToCol] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data: { tasks: Task[] }) => setTasks(data.tasks ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleDragOver(e: React.DragEvent, colId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  }

  function handleDrop(e: React.DragEvent, colId: string) {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedId) return;
    const task = tasks.find((t) => t.id === draggedId);
    if (!task || task.status === colId) {
      setDraggedId(null);
      return;
    }
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === draggedId ? { ...t, status: colId } : t))
    );
    if (modalTask?.id === draggedId) {
      setModalTask((prev) => (prev ? { ...prev, status: colId } : prev));
    }
    setDraggedId(null);
    void patchTask(draggedId, { status: colId });
  }

  function handleTaskUpdate(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (modalTask?.id === updated.id) setModalTask(updated);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Task Board</h2>
        <p className="text-zinc-400 text-sm mt-1">{tasks.length} total tasks</p>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            const isDragOver = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-xl p-4 transition-all ${
                  isDragOver
                    ? "border-2 border-dashed border-blue-500/50 bg-blue-500/5"
                    : "border border-zinc-800 bg-zinc-900"
                }`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-sm">
                    {col.label}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        col.id === "in-progress"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : col.id === "done"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-zinc-700 text-zinc-400"
                      }`}
                    >
                      {colTasks.length}
                    </span>
                    <button
                      onClick={() => setAddingToCol(col.id)}
                      className="text-zinc-400 hover:text-white transition-colors"
                      title={`Add task to ${col.label}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Inline add form */}
                {addingToCol === col.id && (
                  <div className="mb-2">
                    <AddTaskForm
                      columnId={col.id}
                      onAdd={(task) => {
                        setTasks((prev) => [task, ...prev]);
                        setAddingToCol(null);
                      }}
                      onCancel={() => setAddingToCol(null)}
                    />
                  </div>
                )}

                {/* Cards */}
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDragStart={setDraggedId}
                      onClick={() => setModalTask(task)}
                      onUpdate={handleTaskUpdate}
                    />
                  ))}
                  {colTasks.length === 0 && addingToCol !== col.id && (
                    <p className="text-zinc-600 text-xs text-center py-4">
                      No tasks
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalTask !== null && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalTask(null)}
          onUpdate={(updated) => {
            handleTaskUpdate(updated);
            setModalTask(updated);
          }}
        />
      )}
    </div>
  );
}
