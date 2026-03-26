import { Suspense } from "react";
import MemoriesContent from "./memories-content";

export default function MemoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Memories</h2>
        <p className="text-zinc-400 text-sm mt-1">AI memory index from MEMORY.md</p>
      </div>
      <Suspense fallback={<div className="text-zinc-400">Loading...</div>}>
        <MemoriesContent />
      </Suspense>
    </div>
  );
}
