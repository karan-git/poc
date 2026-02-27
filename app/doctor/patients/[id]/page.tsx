import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  AlertTriangle,
  Clock,
} from "lucide-react";
import SessionSummaryManager from "@/components/SessionSummaryManager";
import SessionAccordion from "@/components/SessionAccordion";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "DOCTOR") {
    redirect("/login");
  }

  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
  });

  const patient = await prisma.patientProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, createdAt: true } },
      sessions: {
        orderBy: { updatedAt: "desc" },
        include: {
          summary: true,
          messages: { orderBy: { createdAt: "asc" } },
          _count: { select: { messages: true } },
        },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-600 bg-background px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link
            href="/doctor"
            className="rounded-lg p-1.5 text-white hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white">
              {patient.user.name}
            </h1>
            <p className="text-sm text-gray-500">{patient.user.email}</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto mt-6">
        {/* Patient Dashboard Grid */}
        <div className="space-y-6">
          {/* Main Content: Interactive Session History */}
          {/* Sidebar: Patient Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[280px] items-stretch">
            <div className="rounded-xl bg-card-background p-6 shadow-sm flex flex-col h-full">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">
                Patient Profile
              </h2>
              <div className="space-y-4 flex-grow">
                <div>
                  <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Full Name
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {patient.user.name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Email Address
                  </p>
                  <p className="text-sm font-medium text-white">
                    {patient.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    First Seen
                  </p>
                  <p className="text-sm font-medium text-white">
                    {new Date(patient.user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Clinical Status
                  </p>
                  <p className="text-xs flex items-center gap-1.5 mt-1">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Active Outreach
                  </p>
                </div>
              </div>

              {patient.illnessInfo && (
                <div className="mt-6 pt-6 border-t border-gray-100 flex-grow-0">
                  <p className="text-[10px] uppercase font-bold text-white tracking-wider mb-2">
                    Primary Diagnosis/Notes
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {patient.illnessInfo}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="rounded-xl bg-card-background p-6 text-white shadow-lg flex flex-col h-full">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
                Activity Overview
              </h3>
              <div className="grid grid-cols-2 gap-4 flex-grow content-start">
                <div className="bg-card-background/5 rounded-lg p-4 border border-white/10 hover:bg-card-background/10 transition-colors">
                  <p className="text-3xl font-bold text-blue-400">
                    {patient.sessions.length}
                  </p>
                  <p className="text-[10px] text-white uppercase font-bold mt-1 tracking-wider">
                    Total Sessions
                  </p>
                </div>
                <div className="bg-card-background/5 rounded-lg p-4 border border-white/10 hover:bg-card-background/10 transition-colors">
                  <p className="text-3xl font-bold text-green-400">
                    {patient.sessions.reduce(
                      (acc, s) => acc + s._count.messages,
                      0,
                    )}
                  </p>
                  <p className="text-[10px] text-white uppercase font-bold mt-1 tracking-wider">
                    Total Messages
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-6 opacity-30">
                <p className="text-[8px] uppercase tracking-[0.2em] font-black text-center">
                  Clinical Data Metrics • Real-time Sync
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl bg-card-background shadow-sm overflow-hidden">
              <div className="bg-card-background px-6 py-5">
                <h2 className="text-lg font-semibold text-neutral-400 flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  Clinical Session History
                </h2>
                <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-bold">
                  Expand sessions to view AI summaries and conversation details
                </p>
              </div>

              {patient.sessions.length === 0 ? (
                <div className="px-6 py-16 text-center text-sm text-gray-500 italic">
                  No sessions recorded for this patient yet.
                </div>
              ) : (
                <div className="divide-y divide-neutral-700">
                  {patient.sessions.map((s) => (
                    <SessionAccordion
                      key={s.id}
                      title={s.title}
                      date={new Date(s.updatedAt).toLocaleDateString()}
                      messageCount={s._count.messages}
                    >
                      {/* Integrated Insights (Summary) */}
                      <SessionSummaryManager
                        sessionId={s.id}
                        initialSummary={s.summary}
                      />

                      {/* RAW Transcript View */}
                      <div className="mt-8 pt-8 border-t border-neutral-700">
                        <div className="flex items-center gap-2 mb-6">
                          <MessageSquare size={16} className="text-white" />
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">
                            Full Conversation Transcript
                          </h4>
                        </div>

                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-neutral-700">
                          {s.messages.map((m) => (
                            <div
                              key={m.id}
                              className={`flex flex-col ${m.role === "assistant" ? "items-start" : "items-end"}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm shadow-sm bg-background ${
                                  m.role === "assistant"
                                    ? "text-neutral-400 rounded-tl-none"
                                    : "text-white rounded-tr-none"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1 opacity-60">
                                  <span className="text-[9px] font-bold uppercase">
                                    {m.role === "assistant"
                                      ? "AI Assistant"
                                      : "Patient"}
                                  </span>
                                  <span className="text-[8px]">
                                    {new Date(m.createdAt).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" },
                                    )}
                                  </span>
                                </div>
                                <p className="whitespace-pre-wrap leading-relaxed">
                                  {m.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SessionAccordion>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// FUTURE: Real diagnosis support integration
// FUTURE: Export clinical records as PDF
// FUTURE: Audit log viewer
