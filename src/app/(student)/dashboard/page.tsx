/**
 * Dashboard — Student Home Screen
 *
 * Phase 6 addition: Real-time Firestore listener on users/{uid} powers
 * the stats strip (streak, mastered topics, XP, practice sets).
 * Falls back to zero-state with animate-pulse skeleton while loading.
 *
 * @see ARCHITECTURE.md §1.4 — Dashboard (Step 10)
 * @see ARCHITECTURE.md §2.3 — users schema (streakCount, xp, totalTopicsMastered)
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";

// ─── Subject data (Phase 1 — CBSE Class 9/10 core subjects) ───────────────────
const subjects = [
  { id: "mathematics", name: "Mathematics", icon: "📐", color: "#0071e3" },
  { id: "science", name: "Science", icon: "🔬", color: "#30d158" },
  { id: "english", name: "English", icon: "📖", color: "#ff9f0a" },
  { id: "social-science", name: "Social Science", icon: "🌍", color: "#64d2ff" },
  { id: "hindi", name: "Hindi", icon: "🇮🇳", color: "#ff453a" },
];

// ─── User stats shape (mirrors Firestore users/{uid} schema) ──────────────────
interface UserStats {
  streakCount: number;
  totalTopicsMastered: number;
  xp: number;
  totalPracticeAttempts: number;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  suffix,
  isLoading,
  id,
}: {
  label: string;
  value: number;
  suffix?: string;
  isLoading: boolean;
  id: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5" id={id}>
      <p className="text-sm font-medium text-[#86868b]">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-[#1d1d1f]">
        {isLoading ? (
          // Pulse skeleton while Firestore data is loading
          <span className="inline-block h-9 w-10 animate-pulse rounded-lg bg-[#f5f5f7]" />
        ) : (
          <>
            {value.toLocaleString()}
            {suffix && (
              <span className="ml-1 text-lg text-[#86868b]">{suffix}</span>
            )}
          </>
        )}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Real-time stats from Firestore
  const [stats, setStats] = useState<UserStats>({
    streakCount: 0,
    totalTopicsMastered: 0,
    xp: 0,
    totalPracticeAttempts: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  // ── Real-time Firestore listener on users/{uid} ─────────────────────────────
  useEffect(() => {
    // Don't subscribe until auth is resolved and user is known
    if (authLoading || !user || !db) return;

    const userDocRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setStats({
            streakCount: data.streakCount ?? 0,
            totalTopicsMastered: data.totalTopicsMastered ?? 0,
            xp: data.xp ?? 0,
            totalPracticeAttempts: data.totalPracticeAttempts ?? 0,
          });
        }
        // Either way, we've received a response — stop showing skeletons
        setStatsLoading(false);
      },
      (err) => {
        // Non-fatal: user may not have a Firestore doc yet (onboarding incomplete)
        console.error("[Dashboard] Firestore onSnapshot error:", err);
        setStatsLoading(false);
      }
    );

    // Clean up listener when component unmounts or user changes
    return () => unsubscribe();
  }, [user, authLoading]);

  // ── Auth loading spinner ────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#86868b]/30 border-t-[#0071e3]" />
      </div>
    );
  }

  if (!user) return null;

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

      {/* ─── Stats Strip — real-time from Firestore ─── */}
      <section
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        aria-label="Your learning stats"
      >
        <StatCard
          id="stat-streak"
          label="Current Streak"
          value={stats.streakCount}
          suffix="days"
          isLoading={statsLoading}
        />
        <StatCard
          id="stat-mastered"
          label="Mastered Topics"
          value={stats.totalTopicsMastered}
          isLoading={statsLoading}
        />
        <StatCard
          id="stat-xp"
          label="Total XP"
          value={stats.xp}
          isLoading={statsLoading}
        />
        <StatCard
          id="stat-practice"
          label="Practice Sets"
          value={stats.totalPracticeAttempts}
          isLoading={statsLoading}
        />
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
              href={`/learn/${subject.id}/algebraic-identities`}
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
