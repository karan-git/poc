"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Plus,
  LogOut,
  Stethoscope,
  MessageSquare,
  Edit,
  Loader2,
} from "lucide-react";

interface SessionEntry {
  id: string;
  title: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface SidebarProps {
  sessions: SessionEntry[];
  activeSessionId?: string;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  userName: string;
  userRole: string;
  isCreatingSession?: boolean;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onNewSession,
  onSelectSession,
  userName,
  userRole,
  isCreatingSession,
}: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex h-full w-64 flex-col bg-card-background text-white">
      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewSession}
          disabled={isCreatingSession}
          className="flex w-full items-center cursor-pointer gap-2 rounded-lg px-2 py-3 text-sm hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreatingSession ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Edit size={16} />
          )}
          {isCreatingSession ? "Creating..." : "New Chat"}
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin scrollbar-track-rounded-full scrollbar-track-border-1 scrollbar-thumb-rounded-full scrollbar-thumb-neutral-600 scrollbar-track-neutral-600">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelectSession(s.id)}
            className={cn(
              "flex w-full items-center gap-2 cursor-pointer rounded-lg px-3 py-2.5 text-sm text-left transition-colors",
              s.id === activeSessionId ? "bg-white/10" : "hover:bg-white/5",
            )}
          >
            <MessageSquare size={14} className="shrink-0 opacity-60" />
            <span className="truncate">{s.title || "New Session"}</span>
          </button>
        ))}
      </div>

      {/* Doctor link for patients or dashboard for doctors */}
      {userRole === "DOCTOR" && (
        <div className="px-3 pb-1">
          <button
            onClick={() => router.push("/doctor")}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
          >
            <Stethoscope size={14} />
            Dashboard
          </button>
        </div>
      )}

      {/* User Info + Logout */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="text-[10px] text-gray-400 uppercase">{userRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 rounded p-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
