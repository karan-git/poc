import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: UIMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";

  // Extract text from parts
  const textContent =
    message.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n") ?? "";

  if (!textContent) return null;

  return (
    <div
      className={cn(
        "flex w-full gap-4 py-4",
        isAssistant ? "justify-start" : "justify-start flex-row-reverse",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isAssistant ? "bg-[#19c37d] text-white" : "bg-blue-600 text-white",
        )}
      >
        {isAssistant ? <Bot size={16} /> : <User size={16} />}
      </div>

      {/* Message */}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed whitespace-pre-wrap text-white",
          isAssistant ? "pt-0" : "bg-[#303030]",
        )}
      >
        {textContent}
      </div>
    </div>
  );
}
