import { openai } from "@ai-sdk/openai";
import { prisma } from "@/lib/db";

/**
 * Generate an embedding vector for a given text using OpenAI's embedding model.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Store an embedding for a given message in the database.
 */
export async function storeEmbedding(messageId: string, embedding: number[]) {
  const vectorStr = `[${embedding.join(",")}]`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO "MessageEmbedding" (id, "messageId", embedding, "createdAt")
     VALUES (gen_random_uuid(), $1, $2::vector, NOW())`,
    messageId,
    vectorStr,
  );
}

/**
 * Retrieve relevant past messages via cosine similarity search.
 * Returns the most relevant messages for context injection.
 */
export async function retrieveRelevantContext(
  query: string,
  patientId: string,
  limit: number = 5,
): Promise<{ content: string; role: string }[]> {
  try {
    const queryEmbedding = await createEmbedding(query);
    const vectorStr = `[${queryEmbedding.join(",")}]`;

    const results = await prisma.$queryRawUnsafe<
      { content: string; role: string }[]
    >(
      `SELECT m.content, m.role
       FROM "MessageEmbedding" me
       JOIN "Message" m ON m.id = me."messageId"
       JOIN "Session" s ON s.id = m."sessionId"
       WHERE s."patientId" = $1
       ORDER BY me.embedding <=> $2::vector
       LIMIT $3`,
      patientId,
      vectorStr,
      limit,
    );

    return results;
  } catch (error) {
    console.error("Vector search error:", error);
    return [];
  }
}

// FUTURE: Advanced analytics on embedding clusters
// FUTURE: Temporal weighting for more recent context
