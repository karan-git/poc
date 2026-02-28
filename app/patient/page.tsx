"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { ChatLayout } from "@/components/ChatLayout";
import { ChatMessages } from "@/components/ChatMessages";
import { ChatInput } from "@/components/ChatInput";
import { Sidebar } from "@/components/Sidebar";

interface SessionEntry {
  id: string;
  title: string;
  updatedAt: string;
  _count?: { messages: number };
}

const GREETING_MESSAGE = {
  id: "greeting",
  role: "assistant" as const,
  parts: [
    {
      type: "text" as const,
      text: "Hello. I am your AI clinical intake assistant. I'll be guiding you through a preliminary psychiatric intake session today.\n\nThis is a safe space for you to share what's been on your mind. Everything discussed here stays within this session.\n\nHow are you feeling today, and what brings you in?",
    },
  ],
  createdAt: new Date(),
};

export default function PatientPage() {
  const { data: authSession } = useSession();
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  const { messages, sendMessage, status, setMessages } = useChat({});

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/sessions", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setSessions(data);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const loadSessionMessages = useCallback(
    async (sessionId: string) => {
      setIsLoadingSession(true);
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          // Convert DB messages to UIMessage format
          const uiMessages = data.messages.map(
            (m: {
              id: string;
              role: string;
              content: string;
              createdAt: string;
            }) => ({
              id: m.id,
              role: m.role,
              parts: [{ type: "text" as const, text: m.content }],
              createdAt: new Date(m.createdAt),
            }),
          );
          setMessages(uiMessages);
        }
      } finally {
        setIsLoadingSession(false);
      }
    },
    [setMessages],
  );

  const handleNewSession = async () => {
    setIsCreatingSession(true);
    try {
      const res = await fetch("/api/sessions", { method: "POST" });
      if (res.ok) {
        const newSession = await res.json();
        setActiveSessionId(newSession.id);
        setMessages([]);
        setSessions((prev) => [newSession, ...prev]);
        await fetchSessions();
      }
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    loadSessionMessages(id);
  };

  // Refresh sessions after message is sent (to update titles)
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      fetchSessions();
    }
  }, [status, messages.length, fetchSessions]);

  const allMessages = activeSessionId
    ? messages.length > 0
      ? messages
      : [GREETING_MESSAGE]
    : [GREETING_MESSAGE];

  const sidebar = authSession?.user ? (
    <Sidebar
      sessions={sessions}
      activeSessionId={activeSessionId || undefined}
      onNewSession={handleNewSession}
      onSelectSession={handleSelectSession}
      userName={authSession.user.name || "Patient"}
      userRole="PATIENT"
      isCreatingSession={isCreatingSession}
    />
  ) : null;

  return (
    <ChatLayout sidebar={sidebar}>
      {isLoadingSession ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">
            Loading session history...
          </p>
        </div>
      ) : (
        <>
          <ChatMessages messages={allMessages} status={status} />
          <ChatInput
            input={input}
            setInput={setInput}
            sendMessage={(opts) => {
              if (!activeSessionId) {
                // Auto-create session on first message
                setIsCreatingSession(true);
                fetch("/api/sessions", { method: "POST" })
                  .then((res) => res.json())
                  .then((newSession) => {
                    setActiveSessionId(newSession.id);
                    setSessions((prev) => [newSession, ...prev]);
                    fetchSessions();
                    sendMessage(opts, {
                      body: { sessionId: newSession.id },
                    });
                  })
                  .finally(() => {
                    setIsCreatingSession(false);
                  });
              } else {
                sendMessage(opts, {
                  body: { sessionId: activeSessionId },
                });
              }
            }}
            status={isCreatingSession ? "submitting" : status}
          />
        </>
      )}
    </ChatLayout>
  );
}

// FUTURE: Avatar integration for patient-facing AI
// FUTURE: Mobile app view
