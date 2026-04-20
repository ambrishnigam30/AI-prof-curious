/**
 * Dashboard — Student Home Screen
 *
 * Shows personalized greeting, stats strip, and subject grid.
 * Protected: redirects to / if not authenticated.
 *
 * @see ARCHITECTURE.md §1.4 — Dashboard (Step 10)
 * @see ARCHITECTURE.md §1.3 — Design System Constraints
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

// ─── Subject data (Phase 1 — CBSE Class 9/10 core subjects) ───
const subjects = [
  { id: "mathematics", name: "Mathematics", icon: "📐", color: "#0071e3" },
  { id: "science", name: "Science", icon: "🔬", color: "#30d158" },
  { id: "english", name: "English", icon: "📖", color: "#ff9f0a" },
  { id: "social-science", name: "Social Science", icon: "🌍", color: "#64d2ff" },
  { id: "hindi", name: "Hindi", icon: "🇮🇳", color: "#ff453a" },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // ─── Auth guard: redirect to landing if not authenticated ───
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#86868b]/30 border-t-[#0071e3]" />
      </div>
    );
  }

  // ─── Not authenticated (brief flash before redirect) ───
  if (!user) {
    return null;
  }

  const firstName = user.displayName?.split(" ")[0] ?? "Student";

  return (
    <div className="space-y-10">
      {/* ─── Welcome Section ─── */}
      <section>
        <h1 className="text-4xl font-semibold tracking-tight text-[#1d1d1f]">
          Welcome back, {firstName}.
        </h1>
        <p className="mt-2 text-[1.0625rem] text-[#86868b]">
          Pick up where you left off, or explore something new.
        </p>
      </section>

      {/* ─── Stats Strip ─── */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5">
          <p className="text-sm font-medium text-[#86868b]">Current Streak</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-[#1d1d1f]">
            0
            <span className="ml-1 text-lg text-[#86868b]">days</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5">
          <p className="text-sm font-medium text-[#86868b]">Mastered Topics</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-[#1d1d1f]">
            0
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5">
          <p className="text-sm font-medium text-[#86868b]">Total XP</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-[#1d1d1f]">
            0
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5">
          <p className="text-sm font-medium text-[#86868b]">Practice Sets</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-[#1d1d1f]">
            0
          </p>
        </div>
      </section>

      {/* ─── Subject Grid ─── */}
      <section>
        <h2 className="mb-5 text-2xl font-semibold tracking-tight text-[#1d1d1f]">
          Your Subjects
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/learn/${subject.id}`}
              className="group rounded-2xl bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
              id={`subject-card-${subject.id}`}
            >
              <span className="text-3xl" role="img" aria-label={subject.name}>
                {subject.icon}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-[#1d1d1f] transition-colors group-hover:text-[#0071e3]">
                {subject.name}
              </h3>
              <p className="mt-1 text-sm text-[#86868b]">
                Continue learning →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
