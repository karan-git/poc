import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { model } from "@/lib/ai";
import { generateText } from "ai";

// POST: Generate session summary
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatSession = await prisma.session.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!chatSession || chatSession.messages.length === 0) {
    return NextResponse.json(
      { error: "No messages to summarize" },
      { status: 400 },
    );
  }

  // Build conversation transcript
  const transcript = chatSession.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const { text: summaryText } = await generateText({
    model,
    prompt: `You are a clinical documentation specialist. Analyze the following psychiatric intake conversation and produce a structured summary.

CONVERSATION:
${transcript}

Produce the following sections:
1. **Intake Summary**: A high-level overview of the session.
2. **Key Observed Themes**: Main psychological/behavioral themes discussed.
3. **Symptom Patterns**: Specific symptom patterns noticed (e.g., "depressive cluster", "anxiety features").
4. **Clinical Observations**: Professional-style observations.
5. **Safety Flags**: Any safety concerns noted (SI/HI indicators, crisis mentions). Write "None identified" if none.

Format as markdown.`,
  });

  // Check for safety flags
  const hasSafetyFlags = chatSession.messages.some(
    (m) => m.role === "assistant" && m.content.includes("988"),
  );

  const summary = await prisma.sessionSummary.upsert({
    where: { sessionId: id },
    create: {
      sessionId: id,
      summary: summaryText,
      observations: "AI-generated clinical summary",
      safetyFlags: hasSafetyFlags
        ? "Crisis indicators detected during session"
        : null,
    },
    update: {
      summary: summaryText,
      safetyFlags: hasSafetyFlags
        ? "Crisis indicators detected during session"
        : null,
    },
  });

  return NextResponse.json(summary);
}

// GET: Get session summary
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await prisma.sessionSummary.findUnique({
    where: { sessionId: id },
  });

  if (!summary) {
    return NextResponse.json({ error: "No summary found" }, { status: 404 });
  }

  return NextResponse.json(summary);
}
