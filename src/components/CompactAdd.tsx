import { Sparkles, Plus } from "lucide-react";
import { ParsedTask, parseLines } from "../lib/parsing";

export function CompactAdd({
  onAdd,
  onOpenComposer,
  value,
  setValue,
  parsed,
}: {
  onAdd: (t: ParsedTask[]) => void;
  onOpenComposer: () => void;
  value: string;
  setValue: (s: string) => void;
  parsed: ParsedTask[];
}) {
  return (
    <div className="h-9 rounded-full bg-black/30 border border-white/10 px-3 flex items-center gap-2 focus-within:border-white/20">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onAdd(parsed.length ? parsed : parseLines(value));
          }
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            onAdd(parsed.length ? parsed : parseLines(value));
          }
          if (e.key === "/" && value.length === 0) {
            requestAnimationFrame(onOpenComposer);
          }
        }}
        placeholder="Add a task…  (#tags, ~25m, !p1)  —  / for AI"
        className="flex-1 bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-500"
      />
      <button
        onClick={onOpenComposer}
        className="rounded-full bg-white/10 border border-white/10 px-2.5 py-1 hover:bg-white/15"
      >
        <Sparkles size={16} />
      </button>
      <button
        onClick={() => onAdd(parsed.length ? parsed : parseLines(value))}
        className="rounded-full bg-white text-black px-3 py-1.5 text-sm flex items-center gap-1"
      >
        <Plus size={16} /> Add
      </button>
    </div>
  );
}
