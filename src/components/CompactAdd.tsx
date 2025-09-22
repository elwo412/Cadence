import { Sparkles, Plus } from "lucide-react";
import { ParsedTask, parseLines } from "../lib/parsing";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "../lib/utils";

export function CompactAdd({
  onAdd,
  onOpenComposer,
  value,
  setValue,
  parsed,
  multiline = false,
}: {
  onAdd: (t: ParsedTask[]) => void;
  onOpenComposer?: () => void;
  value: string;
  setValue: (s: string) => void;
  parsed: ParsedTask[];
  multiline?: boolean;
}) {
  const commonProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValue(e.target.value),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onAdd(parsed.length ? parsed : parseLines(value));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onAdd(parsed.length ? parsed : parseLines(value));
      }
      if (onOpenComposer && e.key === "/" && value.length === 0) {
        requestAnimationFrame(onOpenComposer);
      }
    },
    placeholder: "Add a task…  (#tags, ~25m, !p1)  —  / for AI",
    className:
      "flex-1 bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-500",
  };

  return (
    <div
      className={cn(
        "bg-black/30 border border-white/10 px-3 flex items-start gap-2 focus-within:border-white/20",
        multiline ? "rounded-xl py-2" : "h-9 rounded-full py-0 items-center"
      )}
    >
      {multiline ? (
        <TextareaAutosize {...commonProps} rows={1} />
      ) : (
        <input {...commonProps} />
      )}
      {onOpenComposer && (
        <button
          onClick={onOpenComposer}
          className="rounded-full bg-white/10 border border-white/10 px-2.5 py-1 hover:bg-white/15"
        >
          <Sparkles size={16} />
        </button>
      )}
      <button
        onClick={() => onAdd(parsed.length ? parsed : parseLines(value))}
        className="rounded-full bg-white text-black px-3 py-1.5 text-sm flex items-center gap-1"
      >
        <Plus size={16} /> Add
      </button>
    </div>
  );
}
