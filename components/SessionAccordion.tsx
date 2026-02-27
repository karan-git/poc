"use client";

import { useState } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface SessionAccordionProps {
  children: React.ReactNode;
  title: string;
  date: string;
  messageCount: number;
}

export default function SessionAccordion({
  children,
  title,
  date,
  messageCount,
}: SessionAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`border-b border-neutral-700 last:border-0 transition-colors ${isOpen ? "bg-card-background" : ""}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#373737] cursor-pointer transition-all outline-none"
      >
        <div className="flex items-center gap-4">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
              isOpen
                ? "bg-blue-600 text-white shadow-md"
                : "bg-neutral-700 text-neutral-400"
            }`}
          >
            <MessageSquare size={18} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white leading-tight">
              {title}
            </h3>
            <p className="text-[11px] font-medium text-neutral-400 mt-0.5">
              {date} • {messageCount} messages
            </p>
          </div>
        </div>
        <div
          className={`p-1.5 rounded-full transition-all ${
            isOpen
              ? "bg-neutral-700 text-white rotate-180"
              : "text-neutral-400 group-hover:text-neutral-600"
          }`}
        >
          <ChevronDown size={18} />
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6 pt-2">{children}</div>
      </div>
    </div>
  );
}
