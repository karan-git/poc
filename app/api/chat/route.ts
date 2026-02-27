import {
  convertToModelMessages,
  streamText,
  UIMessage,
  generateText,
} from "ai";
import { model } from "@/lib/ai";
import { PSYCHIATRIC_SYSTEM_PROMPT } from "@/lib/psychiatricPrompt";
import { checkCrisis, SAFETY_MESSAGE } from "@/lib/safety";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createEmbedding,
  storeEmbedding,
  retrieveRelevantContext,
} from "@/lib/vector";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { messages, sessionId }: { messages: UIMessage[]; sessionId?: string } =
    body;
  const latestMessage = messages[messages.length - 1];

  console.log("Incoming chat request:", {
    sessionId,
    messagesCount: messages.length,
  });

  // Extract text from parts
  const userText =
    latestMessage.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" ") ?? "";

  // Safety Override: check for crisis keywords BEFORE calling the model
  if (latestMessage.role === "user" && checkCrisis(userText)) {
    // Store safety flag in DB if we have a session
    if (sessionId) {
      await prisma.message.create({
        data: { sessionId, role: "user", content: userText },
      });
      await prisma.message.create({
        data: { sessionId, role: "assistant", content: SAFETY_MESSAGE },
      });
    }
    return new Response(SAFETY_MESSAGE, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Get patient profile for vector context
  let contextMessages: { content: string; role: string }[] = [];
  let patientProfileId: string | null = null;

  if (session.user.role === "PATIENT") {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
    });
    patientProfileId = patientProfile?.id || null;

    // Retrieve relevant past context via vector search
    if (patientProfileId && userText) {
      try {
        contextMessages = await retrieveRelevantContext(
          userText,
          patientProfileId,
        );
      } catch {
        // Vector search may fail if pgvector not ready — gracefully degrade
      }
    }
  }

  // Save user message to DB
  let savedUserMsg: { id: string } | null = null;
  if (sessionId) {
    try {
      savedUserMsg = await prisma.message.create({
        data: { sessionId, role: "user", content: userText },
      });
      console.log("Saved user message:", savedUserMsg.id);

      // Generate and store embedding (async, don't block response)
      if (savedUserMsg) {
        createEmbedding(userText)
          .then((emb) => storeEmbedding(savedUserMsg!.id, emb))
          .catch((err) => console.error("Embedding error:", err));
      }

      // Update session title from first message
      const msgCount = await prisma.message.count({ where: { sessionId } });
      if (msgCount === 1) {
        const title =
          userText.substring(0, 60) + (userText.length > 60 ? "..." : "");
        await prisma.session.update({
          where: { id: sessionId },
          data: { title },
        });
      }
    } catch (dbError) {
      console.error("Failed to save user message:", dbError);
    }
  }

  // Build context injection for memory
  let contextPrompt = "";
  if (contextMessages.length > 0) {
    contextPrompt = `\n\nRELEVANT PAST CONTEXT FROM PREVIOUS SESSIONS:\n${contextMessages
      .map((c) => `[${c.role}]: ${c.content}`)
      .join(
        "\n",
      )}\n\nUse this context to inform your responses, but do not reference it directly unless the patient brings it up.`;
  }

  const result = streamText({
    model,
    system: PSYCHIATRIC_SYSTEM_PROMPT + contextPrompt,
    messages: await convertToModelMessages(messages),
    async onFinish({ text }) {
      // Save assistant response to DB
      if (sessionId && text) {
        try {
          const savedAssistantMsg = await prisma.message.create({
            data: { sessionId, role: "assistant", content: text },
          });
          console.log("Saved assistant message:", savedAssistantMsg.id);

          // Generate and store embedding for assistant message
          createEmbedding(text)
            .then((emb) => storeEmbedding(savedAssistantMsg.id, emb))
            .catch((err) => console.error("Embedding error:", err));

          // Update session timestamp
          await prisma.session.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
          });
        } catch (dbError) {
          console.error("Failed to save assistant message:", dbError);
        }

        // Check for "end session" to auto-generate summary
        if (
          userText.toLowerCase().includes("end session") ||
          text.toLowerCase().includes("intake summary:")
        ) {
          try {
            const allMessages = await prisma.message.findMany({
              where: { sessionId },
              orderBy: { createdAt: "asc" },
            });
            const transcript = allMessages
              .map((m) => `${m.role}: ${m.content}`)
              .join("\n");

            // Generate summary using the AI model
            const { text: summaryText } = await generateText({
              model,
              prompt: `You are a clinical documentation specialist. Analyze the following psychiatric intake conversation and produce a structured summary.

CONVERSATION:
${transcript}

Produce the following sections:
1. **Intake Summary**: A high-level overview.
2. **Key Observed Themes**: Main themes.
3. **Symptom Patterns**: Specific patterns (e.g., "depressive cluster").
4. **Clinical Observations**: Professional observations.
5. **Safety Flags**: Any concerns (SI/HI, crisis mentions). Write "None identified" if none.

Format as markdown.`,
            });

            // Check for safety flags in content
            const hasSafetyFlags = allMessages.some(
              (m) => m.role === "assistant" && m.content.includes("988"),
            );

            await prisma.sessionSummary.upsert({
              where: { sessionId },
              create: {
                sessionId,
                summary: summaryText,
                observations: "AI-generated clinical summary",
                safetyFlags: hasSafetyFlags
                  ? "Crisis indicators detected"
                  : null,
              },
              update: {
                summary: summaryText,
                safetyFlags: hasSafetyFlags
                  ? "Crisis indicators detected"
                  : null,
              },
            });
            console.log("Session summary generated for:", sessionId);
          } catch (err) {
            console.error("Session end processing error:", err);
          }
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}

// FUTURE: Support for real diagnosis integration
// FUTURE: Multi-doctor access and routing
// FUTURE: Audit logging for all message operations
