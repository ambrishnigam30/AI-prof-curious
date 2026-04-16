/**
 * Landing Page — Prof. Curious
 *
 * Full-viewport Pure Black hero with the Apple-inspired reductive design:
 * - No borders, no shadows — depth via background alternation
 * - Pill-shaped CTA in Apple Blue
 * - Tight tracking, SF Pro–style fallback fonts via Inter
 *
 * @see ARCHITECTURE.md §1.3 — Design System Constraints
 * @see ARCHITECTURE.md §1.4 — Landing Page: "Dark hero section"
 */

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BookOpen, Brain, BarChart3 } from "lucide-react";

// Apple-style easing
const appleEase = [0.25, 0.1, 0.25, 1] as const;

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ─────────────────────────────────
          HERO SECTION (Dark — Pure Black)
          ───────────────────────────────── */}
      <section
        className="section-dark relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
        id="hero"
      >
        {/* Subtle radial gradient — Apple-style blue glow below center */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0, 113, 227, 0.08) 0%, transparent 70%)",
          }}
        />

        <motion.div
          className="relative z-10 flex max-w-3xl flex-col items-center text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: appleEase }}
        >
          {/* Eyebrow */}
          <motion.p
            className="mb-4 text-sm font-medium tracking-wide uppercase"
            style={{ color: "var(--color-apple-blue)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            AI-Powered Learning for CBSE & ICSE
          </motion.p>

          {/* Headline */}
          <h1 className="mb-6 text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[1.06] tracking-[-0.015em]">
            Master every concept.{" "}
            <span style={{ color: "var(--color-apple-blue)" }}>
              Pass every exam.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-xl text-lg leading-[1.4] text-[var(--color-apple-text-secondary)]">
            Prof. Curious is your AI tutor that never gives the answer —
            it leads you to it. Step-by-step guidance in English and Hindi
            for Classes 8, 9 & 10.
          </p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: appleEase }}
          >
            <Link
              href="/login"
              className="btn-pill btn-pill-primary"
              id="hero-cta-primary"
            >
              Start Learning
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
            <Link
              href="/features"
              className="btn-pill btn-pill-ghost"
              id="hero-cta-secondary"
            >
              See How It Works
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <span className="text-xs tracking-widest uppercase text-[var(--color-apple-text-secondary)]">
            Scroll
          </span>
          <motion.div
            className="h-8 w-[1px] bg-[var(--color-apple-text-secondary)]"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 1.5, duration: 0.8, ease: appleEase }}
            style={{ transformOrigin: "top" }}
          />
        </motion.div>
      </section>

      {/* ─────────────────────────────────
          FEATURES SECTION (Light — #f5f5f7)
          ───────────────────────────────── */}
      <section
        className="section-light px-6 py-[var(--spacing-section)]"
        id="features"
      >
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: appleEase }}
          >
            <h2 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.12] tracking-[-0.022em] text-[var(--color-apple-near-black)]">
              The teacher that adapts to you.
            </h2>
            <p className="mx-auto max-w-xl text-lg leading-relaxed">
              Every student learns differently. Prof. Curious understands
              your style, speaks your language, and meets you where you are.
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <BookOpen size={28} strokeWidth={1.5} />,
                title: "Bilingual Learning",
                desc: "Read concepts in Hindi, toggle to English. Build fluency without losing comprehension.",
              },
              {
                icon: <Brain size={28} strokeWidth={1.5} />,
                title: "Socratic AI Buddy",
                desc: "Never just gives the answer. Guides you step-by-step until the concept clicks.",
              },
              {
                icon: <BarChart3 size={28} strokeWidth={1.5} />,
                title: "Adaptive Difficulty",
                desc: "Gets harder when you're ready, easier when you need it. Powered by real-time analytics.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                className="rounded-[var(--radius-card)] bg-white p-8"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  delay: i * 0.12,
                  duration: 0.6,
                  ease: appleEase,
                }}
              >
                <span
                  className="mb-4 block text-[var(--color-apple-blue)]"
                  aria-hidden="true"
                >
                  {feature.icon}
                </span>
                <h3 className="mb-2 text-xl font-semibold text-[var(--color-apple-near-black)]">
                  {feature.title}
                </h3>
                <p className="text-[0.9375rem] leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────
          BOTTOM CTA SECTION (Dark)
          ───────────────────────────────── */}
      <section
        className="section-dark flex flex-col items-center px-6 py-[var(--spacing-section)] text-center"
        id="cta"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: appleEase }}
        >
          <h2 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.12] tracking-[-0.022em]">
            Ready to ace your exams?
          </h2>
          <p className="mx-auto mb-10 max-w-md text-lg text-[var(--color-apple-text-secondary)]">
            Join thousands of CBSE and ICSE students learning smarter
            with Prof. Curious.
          </p>
          <Link
            href="/login"
            className="btn-pill btn-pill-primary text-lg"
            id="cta-start"
          >
            Start Learning — It&apos;s Free
          </Link>
        </motion.div>
      </section>

      {/* ─────────────────────────────────
          FOOTER
          ───────────────────────────────── */}
      <footer className="bg-[var(--color-apple-black)] px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-[var(--color-apple-text-secondary)] sm:flex-row">
          <p>© {new Date().getFullYear()} Prof. Curious. All rights reserved.</p>
          <div className="flex gap-6">
            <Link
              href="/about"
              className="transition-colors hover:text-[var(--color-foreground)]"
            >
              About
            </Link>
            <Link
              href="/features"
              className="transition-colors hover:text-[var(--color-foreground)]"
            >
              Features
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
