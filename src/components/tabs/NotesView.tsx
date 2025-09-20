import { Clipboard, Clock } from "lucide-react";
import React from "react";

export default function NotesView({
  notes,
  setNotes,
}: {
  notes: string;
  setNotes: (s: string) => void;
}) {
  const addTimestamp = () => {
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setNotes(notes ? `${notes}\n${now} — ` : `${now} — `);
  };
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-[0_0_110px_rgba(110,168,255,0.08)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="text-zinc-200 font-medium">Scratchpad</div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10 flex items-center gap-2"
            onClick={addTimestamp}
          >
            <Clock size={16} /> Timestamp
          </button>
          <button
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10 flex items-center gap-2"
            onClick={() => navigator.clipboard.writeText(notes)}
          >
            <Clipboard size={16} /> Copy
          </button>
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Jot down anything…"
        className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none w-full resize-none"
      />
    </div>
  );
}
