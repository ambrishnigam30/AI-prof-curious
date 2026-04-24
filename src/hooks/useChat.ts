/**
 * useChat — Custom React hook for the Prof. Curious streaming chat.
 *
 * Manages message state, loading state, and the input value.
 * sendMessage() optimistically appends the user bubble, then streams
 * the AI response chunk-by-chunk from /api/chat (SSE format).
 *
 * SSE format expected from server: "data: <json>\n\n"
 *   - { text: string }   — partial token
 *   - { error: string }  — stream-level error
 *   - "[DONE]"           — end sentinel
 *
 * @see ARCHITECTURE.md §4.1 — hooks/useChat.ts
 * @see src/app/api/chat/route.ts
 */

"use client";

import { useState, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isRateLimited: boolean;
  input: string;
  setInput: (value: string) => void;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [input, setInput] = useState("");

  // Track the streaming abort controller so we can cancel mid-stream
  const abortControllerRef = useRef<AbortController | null>(null);

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

      // ── 2. Add an empty AI placeholder bubble that we'll fill in ──────────
      const aiPlaceholder: ChatMessage = { role: "model", content: "" };
      setMessages([...updatedMessages, aiPlaceholder]);

      // ── 3. Stream from the API ─────────────────────────────────────────────
      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updatedMessages }),
          signal: abortControllerRef.current.signal,
        });

        // Handle non-streaming error responses (401, 429, 500, etc.)
        if (!res.ok) {
          if (res.status === 429) {
            setIsRateLimited(true);
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "model",
                content:
                  "😴 Prof. Curious is taking a short break — try again in a few minutes, or review your flashcards!",
              };
              return updated;
            });
            return;
          }
          throw new Error(`API responded with ${res.status}`);
        }

        if (!res.body) throw new Error("Response body is null");

        // ── 4. Read the SSE stream chunk by chunk ──────────────────────────
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE lines are delimited by "\n\n"
          const lines = buffer.split("\n\n");
          // Keep the incomplete last segment in the buffer
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            // Each SSE message starts with "data: "
            const dataLine = line.startsWith("data: ") ? line.slice(6) : line;
            if (!dataLine || dataLine === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataLine) as
                | { text: string }
                | { error: string };

              if ("error" in parsed) {
                if (parsed.error === "rate_limited") {
                  setIsRateLimited(true);
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "model",
                      content:
                        "😴 Prof. Curious is resting — try again in a few minutes!",
                    };
                    return updated;
                  });
                }
                break;
              }

              if ("text" in parsed && parsed.text) {
                // ── 5. Append tokens to the last (AI) bubble ────────────────
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
        if ((err as Error).name === "AbortError") return; // User cancelled

        console.error("[useChat] Stream error:", err);
        // Replace the empty AI bubble with a friendly error
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
      }
    },
    [messages, isLoading]
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
    isRateLimited,
    input,
    setInput,
    sendMessage,
    clearMessages,
  };
}
