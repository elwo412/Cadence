import { Bot, User } from "lucide-react";
import { cn } from "../../lib/utils";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg",
        isUser ? "bg-black/20" : ""
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-blue-600" : "bg-white/10"
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="text-sm text-zinc-200 pt-0.5">{content}</div>
    </div>
  );
}
