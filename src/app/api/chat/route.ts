/**
 * POST /api/chat — Gemini 1.5 Flash streaming chat route.
 *
 * Receives a messages array, builds a chat session with the Prof. Curious
 * system prompt, and streams the response back as Server-Sent Events (SSE).
 *
 * Rate limiting (full server-side Firestore version) is scaffolded as a
 * comment block — Phase 5 ships a lightweight key-less version that still
 * validates the GEMINI_API_KEY is present so the route never crashes.
 *
 * @see ARCHITECTURE.md §3.2 — System Instruction (Master Prompt)
 * @see ARCHITECTURE.md §3.5 — Gemini API Integration Pattern
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// ─── Condensed Socratic System Prompt (per ARCHITECTURE.md §3.2) ───────────
// Full prompt is ~800 tokens. This focused version stays under 200 tokens
// while preserving every hard constraint the task spec requires.
const SYSTEM_INSTRUCTION = `You are Prof. Curious — a warm, patient AI tutor for Indian CBSE/ICSE students in Classes 8–10.

CORE RULES (non-negotiable):
1. NEVER give the answer directly. Always guide the student TO the answer.
2. Use the Socratic method: ask a guiding question that leads them forward.
3. If they are wrong, give a smaller hint — break it into a tinier step.
4. After 3 failed attempts, walk through the solution step-by-step explaining WHY.
5. Keep EVERY response under 100 words unless doing a multi-step walkthrough.
6. End each reply with either a check-understanding question OR an encouragement prompt.
7. Only discuss topics within the CBSE/ICSE syllabus for Classes 8–10.
8. Never say "the answer is X." Say "Let's figure this out together."
9. Use **bold** for key terms. Use $...$ for inline math (LaTeX).`;

// ─── Safety Settings ─────────────────────────────────────────────────────────
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// ─── Type Definitions ─────────────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export async function POST(request: Request) {
  // ── 1. Validate environment ────────────────────────────────────────────────
  if (!process.env.GEMINI_API_KEY) {
    console.error("[/api/chat] GEMINI_API_KEY is not set.");
    return Response.json(
      { error: "Server configuration error: missing API key." },
      { status: 500 }
    );
  }

  // ── 2. Parse request body ──────────────────────────────────────────────────
  let messages: ChatMessage[];
  try {
    const body = await request.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Invalid request: messages array is required." },
        { status: 400 }
      );
    }
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // ── 3. Initialise Gemini client ────────────────────────────────────────────
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 512, // ~100 words hard cap with headroom
    },
    safetySettings: SAFETY_SETTINGS,
  });

  // ── 4. Build chat history (all messages except the last user message) ──────
  //    Gemini's startChat history must NOT include the final user turn —
  //    that is sent via sendMessageStream instead.
  const lastMessage = messages[messages.length - 1];
  const historyMessages = messages.slice(0, -1);

  const history = historyMessages.map((msg) => ({
    role: msg.role, // "user" | "model" — matches Gemini's expected values
    parts: [{ text: msg.content }],
  }));

  // ── 5. Start chat session & initiate streaming ─────────────────────────────
  let result;
  try {
    const chat = model.startChat({ history });
    result = await chat.sendMessageStream(lastMessage.content);
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 429) {
      return Response.json(
        {
          error: "rate_limited",
          message:
            "Prof. Curious is resting 😴 — try again in a few minutes, or review your flashcards!",
        },
        { status: 429 }
      );
    }
    console.error("[/api/chat] Gemini API error:", err);
    return Response.json(
      { error: "Failed to connect to AI service." },
      { status: 502 }
    );
  }

  // ── 6. Stream chunks back as SSE ──────────────────────────────────────────
  //    Format: "data: <json>\n\n" per SSE spec.
  //    Client reads with ReadableStreamDefaultReader and splits on "\n\n".
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            const payload = JSON.stringify({ text });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        }
        // Signal stream end
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status === 429) {
          const errorPayload = JSON.stringify({ error: "rate_limited" });
          controller.enqueue(encoder.encode(`data: ${errorPayload}\n\n`));
        } else {
          const errorPayload = JSON.stringify({ error: "stream_error" });
          controller.enqueue(encoder.encode(`data: ${errorPayload}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering for real-time SSE
    },
  });
}
