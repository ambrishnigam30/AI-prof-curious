/**
 * useChat — Custom React hook for the Prof. Curious streaming chat.
 *
 * Phase 6 additions:
 *   - Accepts `uid`, `subjectId`, `topicId` to scope persistence.
 *   - On mount, calls getChatHistory() to hydrate state with past messages.
 *   - On each send, persists the user message immediately, then persists
 *     the completed AI response once the stream finishes.
 *
 * SSE format expected from /api/chat: "data: <json>\n\n"
 *   { text: string }   — partial token
 *   { error: string }  — stream-level error
 *   "[DONE]"           — end sentinel
 *
 * @see ARCHITECTURE.md §4.1 — hooks/useChat.ts
 * @see src/lib/firebase/chatSync.ts
 * @see src/app/api/chat/route.ts
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { saveMessage, getChatHistory } from "@/lib/firebase/chatSync";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface UseChatOptions {
  /** Firebase Auth UID — required for Firestore persistence. Pass null/undefined to run in memory-only mode. */
  uid?: string | null;
  /** Subject slug, e.g. "mathematics". Required together with topicId for persistence. */
  subjectId?: string;
  /** Topic slug, e.g. "algebraic-identities". */
  topicId?: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isHistoryLoading: boolean;
  isRateLimited: boolean;
  input: string;
  setInput: (value: string) => void;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { uid, subjectId, topicId } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [input, setInput] = useState("");

  // Track whether persistence is active (all three keys must be present)
  const canPersist = !!(uid && subjectId && topicId);

  // Streaming abort controller ref — lets us cancel mid-stream cleanly
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Load history on mount (or when the topic changes) ──────────────────────
  useEffect(() => {
    if (!canPersist) return;

    let cancelled = false;

    async function loadHistory() {
      setIsHistoryLoading(true);
      try {
        const history = await getChatHistory(uid!, subjectId!, topicId!);
        if (!cancelled) {
          setMessages(history);
        }
      } finally {
        if (!cancelled) setIsHistoryLoading(false);
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, subjectId, topicId]);

  // ── sendMessage ─────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      // ── 1. Optimistically add the user message bubble ──────────────────────
      const userMessage: ChatMessage = { role: "user", content: trimmed };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);
      setIsRateLimited(false);

      // ── 2. Persist user message immediately (fire-and-forget) ─────────────
      if (canPersist) {
        saveMessage(uid!, subjectId!, topicId!, userMessage);
      }

      // ── 3. Add an empty AI placeholder bubble that we'll fill in ──────────
      const aiPlaceholder: ChatMessage = { role: "model", content: "" };
      setMessages([...updatedMessages, aiPlaceholder]);

      // ── 4. Stream from the API ─────────────────────────────────────────────
      abortControllerRef.current = new AbortController();
      let finalAiContent = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updatedMessages }),
          signal: abortControllerRef.current.signal,
        });

        // Handle non-streaming error responses (429, 500, etc.)
        if (!res.ok) {
          if (res.status === 429) {
            setIsRateLimited(true);
            const rateLimitMsg =
              "😴 Prof. Curious is taking a short break — try again in a few minutes, or review your flashcards!";
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "model",
                content: rateLimitMsg,
              };
              return updated;
            });
            return;
          }
          throw new Error(`API responded with ${res.status}`);
        }

        if (!res.body) throw new Error("Response body is null");

        // ── 5. Read the SSE stream chunk by chunk ──────────────────────────
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE lines are delimited by "\n\n"
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const dataLine = line.startsWith("data: ")
              ? line.slice(6)
              : line;
            if (!dataLine || dataLine === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataLine) as
                | { text: string }
                | { error: string };

              if ("error" in parsed) {
                if (parsed.error === "rate_limited") {
                  setIsRateLimited(true);
                  const rateLimitMsg =
                    "😴 Prof. Curious is resting — try again in a few minutes!";
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "model",
                      content: rateLimitMsg,
                    };
                    return updated;
                  });
                }
                break;
              }

              if ("text" in parsed && parsed.text) {
                // ── 6. Append tokens to the last (AI) bubble ────────────────
                finalAiContent += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.text,
                  };
                  return updated;
                });
              }
            } catch {
              // Malformed JSON chunk — skip silently
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;

        console.error("[useChat] Stream error:", err);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "model",
            content:
              "Hmm, something went wrong on my end. Give it another try! 🙏",
          };
          return updated;
        });
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;

        // ── 7. Persist the completed AI response (fire-and-forget) ───────────
        // Only save if the stream produced actual content (not an error bubble)
        if (canPersist && finalAiContent) {
          saveMessage(uid!, subjectId!, topicId!, {
            role: "model",
            content: finalAiContent,
          });
        }
      }
    },
    [messages, isLoading, canPersist, uid, subjectId, topicId]
  );

  const clearMessages = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setInput("");
    setIsLoading(false);
    setIsRateLimited(false);
  }, []);

  return {
    messages,
    isLoading,
    isHistoryLoading,
    isRateLimited,
    input,
    setInput,
    sendMessage,
    clearMessages,
  };
}
