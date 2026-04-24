/**
 * Practice Quiz Page — src/app/(student)/learn/[subjectId]/[topicId]/practice/page.tsx
 *
 * Distraction-free, Apple-inspired quiz interface.
 *
 * Flow:
 *   1. On mount → POST /api/practice to fetch 3 AI-generated MCQs (shows spinner).
 *   2. Display questions one at a time with large pill-shaped option buttons.
 *   3. After answering each question, reveal correctness + explanation before advancing.
 *   4. On finishing: show Results screen.
 *   5. If score is 3/3 → call awardXP(uid, 50) and show Apple Blue CTA.
 *
 * @see ARCHITECTURE.md §1.4 — Step 8: Practice Set
 * @see ARCHITECTURE.md §1.3 — Design System Constraints
 */

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { awardXP } from "@/lib/firebase/progressSync";
import type { PracticeQuestion } from "@/app/api/practice/route";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PracticePage({
  params,
}: {
  params: Promise<{ subjectId: string; topicId: string }>;
}) {
  const { subjectId, topicId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [fetchState, setFetchState] = useState<"loading" | "error" | "done">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [xpAwarded, setXpAwarded] = useState(false);
  const [xpError, setXpError] = useState(false);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  // ── Fetch questions on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!subjectId || !topicId) return;

    async function fetchQuestions() {
      setFetchState("loading");
      try {
        const res = await fetch("/api/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectId, topicId }),
        });

        if (res.status === 429) {
          setErrorMsg(
            "Quiz generation is temporarily unavailable. Please try again in a few minutes."
          );
          setFetchState("error");
          return;
        }

        if (!res.ok) {
          const data = await res.json();
          setErrorMsg(data.error ?? "Failed to load quiz. Please try again.");
          setFetchState("error");
          return;
        }

        const data = await res.json();
        if (!data.questions || data.questions.length === 0) {
          setErrorMsg("No questions were returned. Please try again.");
          setFetchState("error");
          return;
        }

        setQuestions(data.questions);
        setFetchState("done");
      } catch {
        setErrorMsg("Network error — please check your connection and retry.");
        setFetchState("error");
      }
    }

    fetchQuestions();
  }, [subjectId, topicId]);

  // ── Award XP when finished with perfect score ──────────────────────────────
  useEffect(() => {
    if (!isFinished || !user || score !== questions.length || questions.length === 0) return;
    if (xpAwarded) return;

    async function giveXP() {
      try {
        await awardXP(user!.uid, 50);
        setXpAwarded(true);
      } catch (err) {
        console.error("[practice] awardXP failed:", err);
        setXpError(true);
      }
    }

    giveXP();
  }, [isFinished, user, score, questions.length, xpAwarded]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentQuestion = questions[currentIndex];
  const isPerfect = score === questions.length && questions.length > 0;

  // ── Topic label (humanized from slug) ─────────────────────────────────────
  const topicLabel = topicId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSelectAnswer(idx: number) {
    if (isAnswered) return;
    setSelectedAnswer(idx);
    setIsAnswered(true);
    if (idx === currentQuestion.correctAnswerIndex) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  }

  function handleRetry() {
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    setXpAwarded(false);
    setXpError(false);
    setFetchState("loading");

    // Re-trigger the effect by changing a dependency — simplest approach is
    // to re-fetch via a counter; here we just force a full re-fetch inline.
    async function refetch() {
      try {
        const res = await fetch("/api/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectId, topicId }),
        });
        if (!res.ok) {
          const data = await res.json();
          setErrorMsg(data.error ?? "Failed to load quiz. Please try again.");
          setFetchState("error");
          return;
        }
        const data = await res.json();
        setQuestions(data.questions);
        setFetchState("done");
      } catch {
        setErrorMsg("Network error — please check your connection and retry.");
        setFetchState("error");
      }
    }
    refetch();
  }

  // ── Option button style ────────────────────────────────────────────────────
  function getOptionStyle(idx: number): string {
    const base =
      "w-full text-left rounded-2xl px-5 py-4 text-[0.9375rem] font-medium transition-all duration-150 border";

    if (!isAnswered) {
      return `${base} bg-[#f5f5f7] border-transparent text-[#1d1d1f] hover:bg-[#e8e8ed] active:scale-[0.98]`;
    }

    if (idx === currentQuestion.correctAnswerIndex) {
      return `${base} bg-[#d1fae5] border-emerald-300 text-[#065f46]`;
    }
    if (idx === selectedAnswer) {
      return `${base} bg-[#fee2e2] border-red-300 text-[#991b1b]`;
    }
    return `${base} bg-[#f5f5f7] border-transparent text-[#86868b] opacity-60`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Auth loading
  // ─────────────────────────────────────────────────────────────────────────
  if (authLoading) {
    return <LoadingSpinner label="Authenticating…" />;
  }
  if (!user) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Loading questions
  // ─────────────────────────────────────────────────────────────────────────
  if (fetchState === "loading") {
    return <LoadingSpinner label="Prof. Curious is preparing your quiz…" />;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Error state
  // ─────────────────────────────────────────────────────────────────────────
  if (fetchState === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#1d1d1f]">
            Couldn&apos;t load the quiz
          </h2>
          <p className="max-w-sm text-[0.9375rem] text-[#86868b]">{errorMsg}</p>
        </div>
        <button
          id="practice-retry-btn"
          onClick={handleRetry}
          className="flex items-center gap-2 rounded-full bg-[#0071e3] px-6 py-3 text-[0.9375rem] font-medium text-white transition-all hover:bg-[#0077ed] active:scale-[0.97]"
        >
          <RotateCcw size={16} />
          Try Again
        </button>
        <Link
          href={`/learn/${subjectId}/${topicId}`}
          className="text-sm text-[#86868b] underline-offset-2 hover:underline"
        >
          Back to Lesson
        </Link>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Results screen
  // ─────────────────────────────────────────────────────────────────────────
  if (isFinished) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Score badge */}
          <div className="flex flex-col items-center gap-4">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full ${
                isPerfect
                  ? "bg-gradient-to-br from-amber-300 to-amber-500"
                  : "bg-[#f5f5f7]"
              }`}
            >
              {isPerfect ? (
                <Trophy size={42} className="text-white drop-shadow" />
              ) : (
                <span className="text-4xl font-bold text-[#1d1d1f]">
                  {score}/{questions.length}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
                {isPerfect ? "Perfect Score! 🎉" : `You scored ${score} of ${questions.length}`}
              </h1>
              <p className="text-[0.9375rem] text-[#86868b]">
                {isPerfect
                  ? "Outstanding — you've mastered this topic!"
                  : score >= questions.length / 2
                  ? "Good effort. Review the lesson and try again."
                  : "Keep practicing — you'll get there!"}
              </p>
            </div>
          </div>

          {/* XP reward card (perfect score only) */}
          {isPerfect && (
            <div className="rounded-2xl bg-gradient-to-r from-[#0071e3] to-[#0077ed] p-5 text-white shadow-[0_8px_32px_rgba(0,113,227,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
                XP Awarded
              </p>
              <p className="mt-1 text-4xl font-bold">+50 XP</p>
              <p className="mt-1 text-sm opacity-80">
                {xpError
                  ? "⚠️ XP sync failed — will update on next login."
                  : xpAwarded
                  ? "Added to your profile ✓"
                  : "Saving…"}
              </p>
            </div>
          )}

          {/* Question-by-question recap */}
          <div className="space-y-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#86868b]">
              Summary
            </p>
            {questions.map((q, idx) => {
              // We don't track per-question answers in state, so approximate:
              // We only have total score — show score indicator generically
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-2xl bg-[#f5f5f7] px-4 py-3"
                >
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#1d1d1f] shadow-sm">
                    {idx + 1}
                  </span>
                  <p className="text-[0.875rem] leading-snug text-[#1d1d1f]">
                    {q.question}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            {isPerfect ? (
              <Link
                id="practice-return-dashboard-btn"
                href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-full bg-[#0071e3] px-6 py-3.5 text-[0.9375rem] font-medium text-white transition-all hover:bg-[#0077ed] hover:-translate-y-0.5 active:scale-[0.97]"
              >
                Return to Dashboard
                <ChevronRight size={16} />
              </Link>
            ) : (
              <>
                <button
                  id="practice-retry-btn"
                  onClick={handleRetry}
                  className="flex items-center justify-center gap-2 rounded-full bg-[#0071e3] px-6 py-3.5 text-[0.9375rem] font-medium text-white transition-all hover:bg-[#0077ed] active:scale-[0.97]"
                >
                  <RotateCcw size={16} />
                  Try Again
                </button>
                <Link
                  href={`/learn/${subjectId}/${topicId}`}
                  className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3.5 text-[0.9375rem] font-medium text-[#1d1d1f] transition-all hover:bg-[#f5f5f7] active:scale-[0.97]"
                >
                  Review the Lesson
                </Link>
              </>
            )}
            <Link
              href="/dashboard"
              className="text-sm text-[#86868b] underline-offset-2 hover:underline"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Active quiz question
  // ─────────────────────────────────────────────────────────────────────────
  const isCorrect =
    isAnswered && selectedAnswer === currentQuestion.correctAnswerIndex;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-xl space-y-6">
        {/* ── Header: topic + progress ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Link
              href={`/learn/${subjectId}/${topicId}`}
              className="text-sm text-[#86868b] transition-colors hover:text-[#1d1d1f]"
            >
              ← {topicLabel}
            </Link>
            <span className="text-sm font-medium text-[#86868b]">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#e8e8ed]">
            <div
              className="h-full rounded-full bg-[#0071e3] transition-all duration-500"
              style={{
                width: `${((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* ── Question card ── */}
        <div className="rounded-3xl bg-white p-7 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#86868b]">
            Question {currentIndex + 1}
          </p>
          <h2 className="text-[1.1875rem] font-semibold leading-snug text-[#1d1d1f]">
            {currentQuestion.question}
          </h2>
        </div>

        {/* ── Answer options ── */}
        <div className="space-y-3" role="radiogroup" aria-label="Answer options">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              id={`practice-option-${idx}`}
              role="radio"
              aria-checked={selectedAnswer === idx}
              onClick={() => handleSelectAnswer(idx)}
              disabled={isAnswered}
              className={getOptionStyle(idx)}
            >
              <div className="flex items-center gap-3">
                {/* Option letter */}
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#1d1d1f] shadow-sm">
                  {["A", "B", "C", "D"][idx]}
                </span>
                <span>{option}</span>
                {/* Result icon */}
                {isAnswered && idx === currentQuestion.correctAnswerIndex && (
                  <CheckCircle2 size={18} className="ml-auto text-emerald-500 flex-shrink-0" />
                )}
                {isAnswered && idx === selectedAnswer && idx !== currentQuestion.correctAnswerIndex && (
                  <XCircle size={18} className="ml-auto text-red-500 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* ── Explanation (revealed after answering) ── */}
        {isAnswered && (
          <div
            className={`rounded-2xl p-4 transition-all duration-200 ${
              isCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {isCorrect ? (
                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-emerald-500" />
              ) : (
                <XCircle size={18} className="mt-0.5 flex-shrink-0 text-red-500" />
              )}
              <div className="space-y-0.5">
                <p className={`text-sm font-semibold ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>
                  {isCorrect ? "Correct!" : "Not quite."}
                </p>
                <p className="text-[0.875rem] leading-relaxed text-[#1d1d1f]">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Next / Finish button ── */}
        {isAnswered && (
          <button
            id="practice-next-btn"
            onClick={handleNext}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] px-6 py-3.5 text-[0.9375rem] font-medium text-white transition-all hover:bg-[#0077ed] hover:-translate-y-0.5 active:scale-[0.97]"
          >
            {currentIndex < questions.length - 1 ? (
              <>
                Next Question
                <ChevronRight size={16} />
              </>
            ) : (
              "See Results"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Loading Spinner ───────────────────────────────────────────────────────────

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#86868b]/30 border-t-[#0071e3]" />
      <p className="text-[0.9375rem] text-[#86868b]">{label}</p>
    </div>
  );
}
