"use client";

import React, { useRef, useEffect } from "react";
import { SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  sendMessage: (options: { text: string }) => void;
  status: string;
}

export function ChatInput({
  input,
  setInput,
  sendMessage,
  status,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDisabled = status !== "ready";

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
      textareaRef.current.style.overflowY =
        scrollHeight > 200 ? "auto" : "hidden";
    }
  }, [input]);

  useEffect(() => {
    if (status === "ready") {
      textareaRef.current?.focus();
    }
  }, [status]);

  const handleSend = () => {
    if (input.trim() && !isDisabled) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-neutral-700 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative max-w-3xl mx-auto"
        >
          <div
            className={cn(
              "relative flex flex-col rounded-xl bg-btn-background transition-all duration-200",
              isDisabled && "opacity-50",
              textareaRef.current?.style.overflowY === "auto"
                ? "pr-1 py-1"
                : "",
            )}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your message..."
              disabled={isDisabled}
              className={cn(
                "w-full resize-none bg-transparent px-4 py-3 pr-12 focus:outline-none min-h-[50px]",
                "scrollbar-thin scrollbar-track-rounded-full scrollbar-track-border-1 scrollbar-thumb-rounded-full scrollbar-thumb-neutral-600 scrollbar-track-neutral-600",
              )}
            />
            <button
              type="submit"
              disabled={isDisabled || !input.trim()}
              className={cn(
                "absolute bottom-2 p-2 rounded-lg bg-white text-white hover:bg-neutral-200 disabled:cursor-not-allowed transition-all duration-200",
                textareaRef.current?.style.overflowY === "auto"
                  ? "right-6"
                  : "right-2",
              )}
            >
              <SendHorizontal size={20} className="text-black/80" />
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          This is an AI clinical POC. In case of emergency, call 988.
        </p>
      </div>
    </div>
  );
}
