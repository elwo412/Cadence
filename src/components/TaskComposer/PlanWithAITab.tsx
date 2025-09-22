import { useState } from "react";
import { llmPlanWithAI } from "../../lib/llm";
import { ParsedTask } from "../../types/composer";
import ChatMessage from "./ChatMessage";
import TextareaAutosize from "react-textarea-autosize";
import { Send } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type PlanWithAITabProps = {
  setDrafts: (tasks: ParsedTask[]) => void;
};

export default function PlanWithAITab({ setDrafts }: PlanWithAITabProps) {
  const [thread, setThread] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || pending) return;
    const newThread: Message[] = [...thread, { role: "user", content: input }];
    setThread(newThread);
    setInput("");
    setPending(true);

    try {
      // TODO: Pass real constraints
      const response = await llmPlanWithAI(newThread, {});
      setThread([
        ...newThread,
        { role: "assistant", content: response.assistant_text },
      ]);
      setDrafts(response.proposed_tasks);
    } catch (e) {
      console.error("Planning failed:", e);
      // TODO: Show error in UI
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col h-[350px]">
      <div className="flex-1 space-y-3 overflow-auto pr-2">
        {thread.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <TextareaAutosize
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSend();
            }
          }}
          placeholder="Describe your goal..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-white/20 resize-none"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={pending}
          className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
