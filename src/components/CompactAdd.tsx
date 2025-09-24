import { Plus } from "lucide-react";
import React, { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

export function CompactAdd({
  onAdd,
  placeholder,
  multiline,
}: {
  onAdd: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  const [value, setValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onAdd(value.trim());
        setValue("");
      }
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 focus-within:border-white/20">
      <Plus size={16} className="text-zinc-400" />
      {multiline ? (
        <TextareaAutosize
          className="bg-transparent w-full focus:outline-none placeholder:text-zinc-400"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
      ) : (
        <input
          className="bg-transparent w-full focus:outline-none placeholder:text-zinc-400"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      )}
    </div>
  );
}
