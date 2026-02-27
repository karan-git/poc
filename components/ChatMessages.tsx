"use client";

import { useEffect, useRef } from "react";
import { UIMessage } from "ai";
import { MessageBubble } from "./MessageBubble";

interface ChatMessagesProps {
  messages: UIMessage[];
  status: string;
}

export function ChatMessages({ messages, status }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6 md:px-6 space-y-2 scroll-smooth"
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {status === "submitted" && (
          <div className="flex justify-start mb-4">
            <div className="bg-background border border-neutral-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:75ms]" />
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:150ms]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
