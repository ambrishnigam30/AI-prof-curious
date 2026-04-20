/**
 * Landing Page — Prof. Curious
 *
 * Distraction-free hero section. Pure black, centered text,
 * pill-shaped CTA that triggers Google SSO if unauthenticated.
 *
 * @see ARCHITECTURE.md §1.3 — Design System Constraints
 * @see ARCHITECTURE.md §1.4 — Landing Page
 */

"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();

  const handleStartLearning = async () => {
    if (user) {
      // Already authenticated — go to dashboard
      router.push("/dashboard");
    } else {
      // Not logged in — trigger Google Sign-In
      await signIn();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <div className="flex max-w-3xl flex-col items-center text-center">
        {/* ─── Headline ─── */}
        <h1 className="mb-6 text-5xl font-semibold leading-[1.06] tracking-tighter text-white md:text-7xl">
          Learn smarter,{" "}
          <span className="text-[#0071e3]">not harder.</span>
        </h1>

        {/* ─── Subheadline ─── */}
        <p className="mx-auto mb-10 max-w-xl text-lg leading-[1.4] text-[#f5f5f7]/60">
          Prof. Curious is your AI tutor that never gives the answer —
          it leads you to it. Step-by-step guidance in English and Hindi
          for Classes 8, 9 &amp; 10.
        </p>

        {/* ─── CTA Button ─── */}
        <button
          onClick={handleStartLearning}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-[980px] bg-[#0071e3] px-8 py-3 text-[1.0625rem] font-medium text-white transition-all hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-50"
          id="hero-cta-primary"
        >
          {loading ? "Loading…" : "Start Learning"}
        </button>
      </div>
    </main>
  );
}
