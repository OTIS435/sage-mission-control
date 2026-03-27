import MemoriesContent from "./memories-content";

export default function MemoriesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Memories</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Long-term memory + daily logs — searchable across all history
        </p>
      </div>
      <MemoriesContent />
    </div>
  );
}
