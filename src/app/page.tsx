"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ─── Hero Section (Dark) ─── */}
      <section className="section-dark relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
        {/* Subtle radial gradient background */}
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
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
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
            Learn like your best teacher is{" "}
            <span style={{ color: "var(--color-apple-blue)" }}>
              always free.
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
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Link href="/login" className="btn-pill btn-pill-primary">
              Get Started
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 7H13M13 7L7 1M13 7L7 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link href="/features" className="btn-pill btn-pill-ghost">
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
            transition={{
              delay: 1.5,
              duration: 0.8,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{ transformOrigin: "top" }}
          />
        </motion.div>
      </section>

      {/* ─── Features Section (Light) ─── */}
      <section className="section-light px-6 py-[var(--spacing-section)]">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
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
                emoji: "🌐",
                title: "Bilingual Learning",
                desc: "Read concepts in Hindi, toggle to English. Build fluency without losing comprehension.",
              },
              {
                emoji: "🧠",
                title: "Socratic AI Buddy",
                desc: "Never just gives the answer. Guides you step-by-step until the concept clicks.",
              },
              {
                emoji: "📊",
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
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <span className="mb-4 block text-3xl">{feature.emoji}</span>
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

      {/* ─── CTA Section (Dark) ─── */}
      <section className="section-dark flex flex-col items-center px-6 py-[var(--spacing-section)] text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.12] tracking-[-0.022em]">
            Ready to ace your exams?
          </h2>
          <p className="mx-auto mb-10 max-w-md text-lg text-[var(--color-apple-text-secondary)]">
            Join thousands of CBSE and ICSE students learning smarter
            with Prof. Curious.
          </p>
          <Link href="/login" className="btn-pill btn-pill-primary text-lg">
            Start Learning — It&apos;s Free
          </Link>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[var(--color-apple-separator-dark)] bg-[var(--color-apple-black)] px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-[var(--color-apple-text-secondary)] sm:flex-row">
          <p>© {new Date().getFullYear()} Prof. Curious. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/about" className="transition-colors hover:text-[var(--color-foreground)]">
              About
            </Link>
            <Link href="/features" className="transition-colors hover:text-[var(--color-foreground)]">
              Features
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
