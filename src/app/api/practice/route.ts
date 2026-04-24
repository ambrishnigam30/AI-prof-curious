/**
 * POST /api/practice — AI-generated MCQ quiz route.
 *
 * Accepts { subjectId, topicId } in the request body.
 * Uses Gemini 1.5 Flash with response_mime_type: "application/json" to force
 * a strict JSON array of 3 multiple-choice questions — no markdown fences,
 * no prose, just parseable JSON.
 *
 * Schema per question:
 *   { question: string, options: string[], correctAnswerIndex: number, explanation: string }
 *
 * @see ARCHITECTURE.md §3 — Gemini Prompt Architecture
 * @see ARCHITECTURE.md §1.4 — Step 8: Practice Set
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface PracticeQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // ── 1. Validate environment ────────────────────────────────────────────────
  if (!process.env.GEMINI_API_KEY) {
    console.error("[/api/practice] GEMINI_API_KEY is not set.");
    return Response.json(
      { error: "Server configuration error: missing API key." },
      { status: 500 }
    );
  }

  // ── 2. Parse & validate request body ──────────────────────────────────────
  let subjectId: string;
  let topicId: string;

  try {
    const body = await request.json();
    subjectId = body.subjectId?.trim();
    topicId = body.topicId?.trim();

    if (!subjectId || !topicId) {
      return Response.json(
        { error: "Invalid request: subjectId and topicId are required." },
        { status: 400 }
      );
    }
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // ── 3. Build the Gemini prompt ─────────────────────────────────────────────
  // Human-readable topic label derived from the topicId slug (e.g. "algebraic-identities")
  const topicLabel = topicId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const subjectLabel = subjectId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const prompt = `You are an expert Indian CBSE/ICSE curriculum designer for Classes 8–10.

Generate exactly 3 multiple-choice questions (MCQs) for the following topic:
- Subject: ${subjectLabel}
- Topic: ${topicLabel}

STRICT RULES:
1. Each question MUST have exactly 4 answer options.
2. correctAnswerIndex MUST be a 0-based integer (0, 1, 2, or 3).
3. The explanation MUST be 1–2 sentences maximum.
4. Questions must be appropriate for CBSE/ICSE Class 9–10 level.
5. Vary the difficulty: one easy, one medium, one hard.
6. Do NOT repeat questions or options.
7. Return ONLY a valid JSON array — no markdown, no prose, no code fences.

Return format (JSON array of 3 objects):
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctAnswerIndex": 0,
    "explanation": "..."
  }
]`;

  // ── 4. Initialize Gemini with JSON mode ────────────────────────────────────
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.4,   // Lower temp → more predictable JSON structure
      topP: 0.85,
      topK: 40,
      maxOutputTokens: 1024,
      // ── CRITICAL: Force strict JSON output — no markdown fences ──
      responseMimeType: "application/json",
    },
  });

  // ── 5. Call Gemini & parse the JSON response ───────────────────────────────
  let questions: PracticeQuestion[];

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Parse and validate the JSON array
    const parsed = JSON.parse(rawText);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Gemini returned a non-array or empty response.");
    }

    // Validate each question has the required fields
    questions = parsed.map((q: Record<string, unknown>, idx: number) => {
      if (
        typeof q.question !== "string" ||
        !Array.isArray(q.options) ||
        q.options.length < 2 ||
        typeof q.correctAnswerIndex !== "number" ||
        typeof q.explanation !== "string"
      ) {
        throw new Error(`Question at index ${idx} has an invalid schema.`);
      }
      return {
        question: q.question,
        options: q.options as string[],
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation,
      };
    });
  } catch (err: unknown) {
    // Handle Gemini rate limit (429)
    const status = (err as { status?: number }).status;
    if (status === 429) {
      console.warn("[/api/practice] Gemini rate limit hit.");
      return Response.json(
        {
          error: "rate_limited",
          message:
            "Quiz generation is temporarily unavailable. Try again in a few minutes.",
        },
        { status: 429 }
      );
    }

    console.error("[/api/practice] Failed to generate/parse questions:", err);
    return Response.json(
      { error: "Failed to generate quiz questions. Please try again." },
      { status: 502 }
    );
  }

  // ── 6. Return the validated question array ─────────────────────────────────
  return Response.json({ questions }, { status: 200 });
}
