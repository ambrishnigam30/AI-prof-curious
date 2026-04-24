/**
 * ChatPanel — Apple-inspired slide-over AI chat interface.
 *
 * Desktop: Fixed right-side panel (400px wide), full viewport height.
 * Mobile:  Bottom sheet, 75% viewport height, slides up from bottom.
 *
 * Design tokens (ARCHITECTURE.md §1.3):
 *   - Background: white/90 + backdrop-blur-2xl (glassmorphism)
 *   - Shadow:     shadow-2xl (depth without visible border)
 *   - Corners:    rounded-tl-3xl rounded-bl-3xl (desktop) / rounded-t-3xl (mobile)
 *   - User bubble: Apple Blue  #0071e3 / white text
 *   - AI bubble:   Apple Gray  #f5f5f7 / near-black text
 *
 * Phase 6: Accepts uid/subjectId/topicId and forwards to useChat for
 *           Firestore persistence and history hydration on open.
 *
 * @see ARCHITECTURE.md §1.4 — Step 7: Prof. Curious Chat
 * @see src/hooks/useChat.ts
 * @see src/lib/firebase/chatSync.ts
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { X, Send, Loader2, BrainCircuit } from "lucide-react";
import { useChat } from "@/hooks/useChat";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  /** Called when the user dismisses the panel (X button or backdrop click). */
  onClose: () => void;
  /** Optional topic context shown in the opening greeting. */
  topicName?: string;
  /** Firebase Auth UID — required to persist chat to Firestore. */
  uid?: string;
  /** Subject slug, e.g. "mathematics". */
  subjectId?: string;
  /** Topic slug, e.g. "algebraic-identities". */
  topicId?: string;
}

// ─── Streaming Dots (typing indicator) ───────────────────────────────────────

function StreamingDots() {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label="Prof. Curious is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-[5px] w-[5px] rounded-full bg-[#86868b] animate-bounce"
          style={{ animationDelay: `${i * 120}ms`, animationDuration: "800ms" }}
        />
      ))}
    </span>
  );
}

// ─── Single Message Bubble ────────────────────────────────────────────────────

function MessageBubble({
  role,
  content,
  isStreaming,
}: {
  role: "user" | "model";
  content: string;
  isStreaming?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-2`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="mr-2 mt-1 flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#0071e3]">
          <BrainCircuit size={14} className="text-white" />
        </div>
      )}

      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-[1.4]
          ${
            isUser
              ? "rounded-tr-sm bg-[#0071e3] text-white"
              : "rounded-tl-sm bg-[#f5f5f7] text-[#1d1d1f]"
          }
        `}
        style={{
          // Subtle shadow only on AI bubbles
          boxShadow: !isUser ? "0 1px 4px rgba(0,0,0,0.06)" : undefined,
        }}
      >
        {/* Show streaming dots when content is empty and AI is typing */}
        {!isUser && isStreaming && content === "" ? (
          <StreamingDots />
        ) : (
          <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {content}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function ChatPanel({
  onClose,
  topicName,
  uid,
  subjectId,
  topicId,
}: ChatPanelProps) {
  const { messages, isLoading, isHistoryLoading, isRateLimited, input, setInput, sendMessage } =
    useChat({ uid, subjectId, topicId });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus the input when the panel opens
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Handle form submit
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isLoading || isRateLimited) return;
      sendMessage(input);
    },
    [input, isLoading, isRateLimited, sendMessage]
  );

  // Allow Shift+Enter for newline, plain Enter to send
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const greeting = topicName
    ? `Hi! I'm Prof. Curious 🧠\n\nI see you're studying **${topicName}**. What would you like to explore? Ask me anything — I won't just give you the answer, but I'll guide you there!`
    : "Hi! I'm Prof. Curious 🧠\n\nAsk me anything about your lesson. I won't just give you the answer — I'll guide you there step by step!";

  return (
    <>
      {/* ── Backdrop (mobile only) ── */}
      <div
        className="fixed inset-0 z-[140] bg-black/20 backdrop-blur-sm sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <aside
        id="chat-panel"
        role="complementary"
        aria-label="Prof. Curious AI Chat"
        className={`
          fixed z-[150] flex flex-col
          /* Mobile: bottom sheet */
          bottom-0 left-0 right-0 h-[78vh] rounded-t-3xl
          /* Desktop: right slide-over */
          sm:bottom-0 sm:top-0 sm:left-auto sm:right-0 sm:h-screen sm:w-[400px] sm:rounded-none sm:rounded-tl-3xl sm:rounded-bl-3xl
          animate-chat-in
        `}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "saturate(180%) blur(24px)",
          WebkitBackdropFilter: "saturate(180%) blur(24px)",
          boxShadow:
            "-8px 0 40px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)",
        }}
      >
        {/* ── Header ── */}
        <header className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0071e3]">
              <BrainCircuit size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-[0.9375rem] font-semibold leading-tight text-[#1d1d1f]">
                Prof. Curious
              </h2>
              <p className="text-[0.75rem] text-[#86868b]">
                {isRateLimited
                  ? "Taking a short break..."
                  : isHistoryLoading
                  ? "Loading history..."
                  : isLoading
                  ? "Thinking..."
                  : "AI Socratic Tutor"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="chat-panel-close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#86868b] transition-colors hover:bg-black/[0.06] hover:text-[#1d1d1f] active:scale-95"
            aria-label="Close chat panel"
          >
            <X size={16} />
          </button>
        </header>

        {/* ── Messages Area ── */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.12) transparent" }}
          id="chat-messages"
        >
          {/* Rate-limit banner */}
          {isRateLimited && (
            <div className="mb-4 rounded-2xl border border-[#ff9f0a]/30 bg-[#ff9f0a]/10 px-4 py-3 text-[0.875rem] text-[#b06000]">
              😴 <strong>Prof. Curious is resting</strong> — daily chat limit reached. Try again tomorrow, or review your flashcards in the meantime!
            </div>
          )}

          {/* History loading skeleton */}
          {isHistoryLoading && (
            <div className="flex flex-col gap-2 mb-4" aria-label="Loading chat history">
              {["60%", "45%", "70%"].map((w, i) => (
                <div
                  key={i}
                  className={`h-8 animate-pulse rounded-2xl bg-[#f5f5f7] ${
                    i % 2 === 0 ? "self-end" : "self-start"
                  }`}
                  style={{ width: w }}
                />
              ))}
            </div>
          )}

          {/* Welcome greeting (shown when no messages yet and history isn't loading) */}
          {!isHistoryLoading && messages.length === 0 && (
            <div className="mb-3">
              <MessageBubble role="model" content={greeting} />
            </div>
          )}

          {/* Render conversation */}
          {messages.map((msg, idx) => {
            // The last message is "model" and we're loading → it's streaming
            const isStreamingBubble =
              isLoading &&
              idx === messages.length - 1 &&
              msg.role === "model";

            return (
              <MessageBubble
                key={idx}
                role={msg.role}
                content={msg.content}
                isStreaming={isStreamingBubble}
              />
            );
          })}

          {/* Invisible scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ── */}
        <form
          onSubmit={handleSubmit}
          className="flex-shrink-0 border-t border-black/[0.06] px-4 py-3"
          aria-label="Chat input form"
        >
          <div className="flex items-end gap-2">
            {/* Pill-shaped textarea */}
            <textarea
              ref={inputRef}
              id="chat-input"
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-grow: reset height then set to scrollHeight (max ~3 rows)
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isRateLimited
                  ? "Daily limit reached..."
                  : "Ask Prof. Curious..."
              }
              disabled={isRateLimited}
              className={`
                flex-1 resize-none rounded-[20px] border-0 bg-[#f5f5f7] px-4 py-2.5
                text-[0.9375rem] leading-[1.4] text-[#1d1d1f]
                placeholder:text-[#86868b]
                focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-150
              `}
              style={{ minHeight: "40px", maxHeight: "80px" }}
              aria-label="Type your message"
            />

            {/* Send button */}
            <button
              type="submit"
              id="chat-send-btn"
              disabled={!input.trim() || isLoading || isRateLimited}
              className={`
                flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full
                bg-[#0071e3] text-white
                transition-all duration-150 active:scale-95
                hover:bg-[#0077ed]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#0071e3]
              `}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={15} className="translate-x-px" />
              )}
            </button>
          </div>

          <p className="mt-2 text-center text-[0.6875rem] text-[#86868b]">
            Prof. Curious never gives the answer — only guides you there.
          </p>
        </form>
      </aside>

      {/* ── Slide-in animation (injected via style tag for portability) ── */}
      <style>{`
        @keyframes chat-slide-in-mobile {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes chat-slide-in-desktop {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-chat-in {
          animation: chat-slide-in-mobile 320ms cubic-bezier(0.25, 0.1, 0.25, 1) both;
        }
        @media (min-width: 640px) {
          .animate-chat-in {
            animation: chat-slide-in-desktop 320ms cubic-bezier(0.25, 0.1, 0.25, 1) both;
          }
        }
      `}</style>
    </>
  );
}
