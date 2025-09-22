import { useState } from "react";
import { parseLines } from "../../lib/parsing";
import { ParsedTask } from "../../types/composer";
import { CompactAdd } from "../CompactAdd";

type QuickAddTabProps = {
  onAccept: (tasks: ParsedTask[]) => void;
};

export default function QuickAddTab({ onAccept }: QuickAddTabProps) {
  const [input, setInput] = useState("");
  const parsed = parseLines(input);

  return (
    <div>
      <p className="text-sm text-zinc-400 mb-2 px-1">
        Enter tasks one per line. Use tokens like{" "}
        <code className="text-zinc-300">#tag</code>,{" "}
        <code className="text-zinc-300">~25m</code>, and{" "}
        <code className="text-zinc-300">!p1</code>.
      </p>
      <CompactAdd
        value={input}
        setValue={setInput}
        onAdd={onAccept}
        parsed={parsed}
        multiline
      />
    </div>
  );
}
