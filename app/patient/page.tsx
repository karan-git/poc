"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
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

  const { messages, sendMessage, status, setMessages } = useChat({});

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/sessions");
    if (res.ok) {
      const data = await res.json();
      setSessions(data);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Load session messages when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const loadSession = async () => {
      const res = await fetch(`/api/sessions/${activeSessionId}`);
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
    };

    loadSession();
  }, [activeSessionId, setMessages]);

  const handleNewSession = async () => {
    const res = await fetch("/api/sessions", { method: "POST" });
    if (res.ok) {
      const newSession = await res.json();
      setActiveSessionId(newSession.id);
      setMessages([]);
      await fetchSessions();
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
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
    />
  ) : null;

  return (
    <ChatLayout sidebar={sidebar}>
      <ChatMessages messages={allMessages} status={status} />
      <ChatInput
        input={input}
        setInput={setInput}
        sendMessage={(opts) => {
          if (!activeSessionId) {
            // Auto-create session on first message
            fetch("/api/sessions", { method: "POST" })
              .then((res) => res.json())
              .then((newSession) => {
                setActiveSessionId(newSession.id);
                fetchSessions();
                sendMessage(opts, { body: { sessionId: newSession.id } });
              });
          } else {
            sendMessage(opts, { body: { sessionId: activeSessionId } });
          }
        }}
        status={activeSessionId ? status : status}
      />
    </ChatLayout>
  );
}

// FUTURE: Avatar integration for patient-facing AI
// FUTURE: Mobile app view
