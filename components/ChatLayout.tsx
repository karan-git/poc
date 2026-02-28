"use client";

import React from "react";

interface ChatLayoutProps {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

export function ChatLayout({ sidebar, children }: ChatLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background text-white font-sans ">
      {/* Sidebar */}
      {sidebar && <aside className="hidden md:flex">{sidebar}</aside>}

      {/* Main Chat Panel */}
      <main className="relative flex flex-1 flex-col overflow-hidden scrollbar-thin scrollbar-track-rounded-full scrollbar-track-border-1 scrollbar-thumb-rounded-full scrollbar-thumb-neutral-600 scrollbar-track-neutral-600">
        {children}
      </main>
    </div>
  );
}
