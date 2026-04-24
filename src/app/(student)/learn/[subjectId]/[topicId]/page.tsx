/**
 * Topic Lesson View — src/app/(student)/learn/[subjectId]/[topicId]/page.tsx
 *
 * Displays the bilingual lesson content for a given topic.
 * Features:
 *   - हिंदी ↔ English toggle (200ms crossfade, no page reload)
 *   - Rich lesson content (summary, key points, formulas, examples)
 *   - "Ask Prof. Curious" CTA that opens the ChatPanel slide-over
 *   - Auth guard — redirects unauthenticated users to landing
 *
 * Phase 5 addition: isChatOpen state + ChatPanel mounting.
 *
 * @see ARCHITECTURE.md §1.4 — Steps 6 & 7: Concept Lesson + Chat
 * @see ARCHITECTURE.md §2.3 — curriculum_topics schema
 */

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageCircle, BookOpen, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ChatPanel from "@/components/chat/ChatPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

type Language = "en" | "hi";

interface BilingualText {
  en: string;
  hi: string;
}

interface TopicContent {
  name: BilingualText;
  subjectName: string;
  chapterName: BilingualText;
  difficulty: "foundational" | "intermediate" | "advanced";
  estimatedMinutes: number;
  summary: BilingualText;
  keyPoints: BilingualText[];
  formulas: string[]; // LaTeX is language-agnostic
  examples: Array<{
    problem: BilingualText;
    solution: BilingualText;
  }>;
}

// ─── Mock Data (Phase 1 — Firestore data will replace this) ──────────────────
// Seeded with CBSE Class 9 Algebraic Identities as the canonical example
// from ARCHITECTURE.md §1.4 (Step 6).
const MOCK_TOPIC_DATA: Record<string, TopicContent> = {
  "algebraic-identities": {
    name: { en: "Algebraic Identities", hi: "बीजगणितीय सर्वसमिकाएँ" },
    subjectName: "Mathematics",
    chapterName: { en: "Polynomials", hi: "बहुपद" },
    difficulty: "intermediate",
    estimatedMinutes: 25,
    summary: {
      en: "An algebraic identity is an equation that holds true for all values of the variables involved. Unlike a regular equation (which is true only for specific values), an identity is universally true. Algebraic identities are powerful shortcuts for expanding and factorising expressions quickly.",
      hi: "बीजगणितीय सर्वसमिका एक ऐसा समीकरण है जो चरों के सभी मानों के लिए सत्य होता है। एक साधारण समीकरण के विपरीत (जो केवल विशिष्ट मानों के लिए सत्य होता है), एक सर्वसमिका सार्वभौमिक रूप से सत्य होती है। बीजगणितीय सर्वसमिकाएँ व्यंजकों को शीघ्रता से विस्तारित और गुणनखंडित करने के लिए शक्तिशाली शॉर्टकट हैं।",
    },
    keyPoints: [
      {
        en: "An identity is true for ALL values of variables, unlike an equation which is true for specific values.",
        hi: "एक सर्वसमिका चरों के सभी मानों के लिए सत्य होती है, जबकि एक समीकरण केवल विशिष्ट मानों के लिए सत्य होता है।",
      },
      {
        en: "The four standard identities are derived from the distributive property of multiplication.",
        hi: "चार मानक सर्वसमिकाएँ गुणन के वितरण गुण से व्युत्पन्न होती हैं।",
      },
      {
        en: "These identities help factorise complex polynomials and evaluate expressions without full expansion.",
        hi: "ये सर्वसमिकाएँ जटिल बहुपदों को गुणनखंडित करने और पूर्ण विस्तार के बिना व्यंजकों का मूल्यांकन करने में सहायता करती हैं।",
      },
      {
        en: "Identity IV — (x+a)(x+b) = x² + (a+b)x + ab — is especially useful for quick mental multiplication.",
        hi: "सर्वसमिका IV — (x+a)(x+b) = x² + (a+b)x + ab — विशेष रूप से शीघ्र मानसिक गुणन के लिए उपयोगी है।",
      },
    ],
    formulas: [
      "(a + b)^2 = a^2 + 2ab + b^2",
      "(a - b)^2 = a^2 - 2ab + b^2",
      "(a + b)(a - b) = a^2 - b^2",
      "(x + a)(x + b) = x^2 + (a + b)x + ab",
    ],
    examples: [
      {
        problem: {
          en: "Expand (x + 3)² using the identity.",
          hi: "सर्वसमिका का उपयोग करके (x + 3)² का विस्तार करें।",
        },
        solution: {
          en: "Using (a + b)² = a² + 2ab + b² where a = x, b = 3:\n(x + 3)² = x² + 2(x)(3) + 3² = x² + 6x + 9",
          hi: "(a + b)² = a² + 2ab + b² का उपयोग करते हुए, जहाँ a = x, b = 3:\n(x + 3)² = x² + 2(x)(3) + 3² = x² + 6x + 9",
        },
      },
      {
        problem: {
          en: "Evaluate 99² without a calculator.",
          hi: "बिना कैलकुलेटर के 99² का मान ज्ञात करें।",
        },
        solution: {
          en: "Write 99 = (100 - 1). Then using (a - b)² = a² - 2ab + b²:\n99² = (100 - 1)² = 10000 - 200 + 1 = 9801",
          hi: "99 = (100 - 1) लिखें। फिर (a - b)² = a² - 2ab + b² का उपयोग करें:\n99² = (100 - 1)² = 10000 - 200 + 1 = 9801",
        },
      },
    ],
  },
  default: {
    name: { en: "Introduction to Polynomials", hi: "बहुपद का परिचय" },
    subjectName: "Mathematics",
    chapterName: { en: "Polynomials", hi: "बहुपद" },
    difficulty: "foundational",
    estimatedMinutes: 20,
    summary: {
      en: "A polynomial is an algebraic expression consisting of variables and coefficients, combined using addition, subtraction, and multiplication. Polynomials are the building blocks of algebra and appear throughout mathematics and science.",
      hi: "बहुपद एक बीजगणितीय व्यंजक है जिसमें चर और गुणांक होते हैं, जिन्हें जोड़, घटाव और गुणा का उपयोग करके मिलाया जाता है। बहुपद बीजगणित के आधारभूत तत्व हैं और गणित और विज्ञान में सर्वत्र प्रकट होते हैं।",
    },
    keyPoints: [
      {
        en: "A polynomial has terms, each consisting of a coefficient and a variable raised to a non-negative integer power.",
        hi: "एक बहुपद में पद होते हैं, प्रत्येक में एक गुणांक और एक चर होता है जिसे गैर-ऋणात्मक पूर्णांक घात तक उठाया जाता है।",
      },
      {
        en: "The degree of a polynomial is the highest power of the variable in any term.",
        hi: "बहुपद की घात किसी भी पद में चर की उच्चतम शक्ति होती है।",
      },
    ],
    formulas: ["p(x) = a_n x^n + a_{n-1} x^{n-1} + \\ldots + a_1 x + a_0"],
    examples: [
      {
        problem: {
          en: "Identify the degree of 3x³ - 5x² + 2x - 7.",
          hi: "3x³ - 5x² + 2x - 7 की घात पहचानें।",
        },
        solution: {
          en: "The highest power of x is 3 (in the term 3x³), so the degree is 3.",
          hi: "x की उच्चतम घात 3 है (पद 3x³ में), इसलिए घात 3 है।",
        },
      },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDifficultyLabel(
  diff: TopicContent["difficulty"],
  lang: Language
): string {
  const labels: Record<TopicContent["difficulty"], Record<Language, string>> = {
    foundational: { en: "Foundational", hi: "आधारभूत" },
    intermediate: { en: "Intermediate", hi: "मध्यवर्ती" },
    advanced: { en: "Advanced", hi: "उन्नत" },
  };
  return labels[diff][lang];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TopicLessonPage({
  params,
}: {
  params: Promise<{ subjectId: string; topicId: string }>;
}) {
  const { subjectId, topicId } = use(params);

  const { user, loading } = useAuth();
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [lang, setLang] = useState<Language>("en");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [langTransitioning, setLangTransitioning] = useState(false);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#86868b]/30 border-t-[#0071e3]" />
      </div>
    );
  }
  if (!user) return null;

  // ── Resolve topic data (Phase 1: mock; Phase 2: Firestore) ────────────────
  const topic = MOCK_TOPIC_DATA[topicId] ?? MOCK_TOPIC_DATA.default;
  const t = (text: BilingualText) => text[lang];

  // ── Language toggle with crossfade ────────────────────────────────────────
  const toggleLang = () => {
    setLangTransitioning(true);
    setTimeout(() => {
      setLang((prev) => (prev === "en" ? "hi" : "en"));
      setLangTransitioning(false);
    }, 100); // half of the 200ms crossfade
  };

  return (
    <div className="space-y-8 pb-32">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-[#86868b]">
        <Link
          href="/dashboard"
          className="transition-colors hover:text-[#1d1d1f]"
        >
          Dashboard
        </Link>
        <span>/</span>
        <Link
          href={`/learn`}
          className="transition-colors hover:text-[#1d1d1f]"
        >
          {topic.subjectName}
        </Link>
        <span>/</span>
        <span className="text-[#1d1d1f]">{t(topic.name)}</span>
      </nav>

      {/* ── Topic Header ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          {/* Chapter label */}
          <p className="text-sm font-medium text-[#0071e3]">
            {t(topic.chapterName)}
          </p>

          {/* Topic name — transitions with lang change */}
          <h1
            className="text-3xl font-semibold tracking-tight text-[#1d1d1f] transition-opacity duration-200"
            style={{ opacity: langTransitioning ? 0 : 1 }}
          >
            {t(topic.name)}
          </h1>

          {/* Meta pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-medium text-[#1d1d1f]">
              {getDifficultyLabel(topic.difficulty, lang)}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-medium text-[#1d1d1f]">
              <BookOpen size={11} />
              {topic.estimatedMinutes} {lang === "en" ? "min" : "मिनट"}
            </span>
          </div>
        </div>

        {/* ── Bilingual Toggle ── */}
        <button
          id="bilingual-toggle"
          onClick={toggleLang}
          aria-label={`Switch to ${lang === "en" ? "Hindi" : "English"}`}
          className="flex items-center gap-2 self-start rounded-full border border-[#0071e3]/25 bg-white px-4 py-2 text-sm font-medium text-[#0071e3] transition-all duration-150 hover:bg-[#0071e3]/[0.06] active:scale-[0.97] sm:self-auto"
        >
          <span
            className={`transition-opacity duration-100 ${
              lang === "hi" ? "font-semibold opacity-100" : "opacity-50"
            }`}
          >
            हिंदी
          </span>
          <span className="text-[#0071e3]/40">↔</span>
          <span
            className={`transition-opacity duration-100 ${
              lang === "en" ? "font-semibold opacity-100" : "opacity-50"
            }`}
          >
            English
          </span>
        </button>
      </section>

      {/* ── Lesson Content ── (200ms crossfade on lang change) ── */}
      <div
        className="space-y-6 transition-opacity duration-200"
        style={{ opacity: langTransitioning ? 0 : 1 }}
      >
        {/* Summary */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-[1.0625rem] font-semibold text-[#1d1d1f]">
            {lang === "en" ? "Overview" : "अवलोकन"}
          </h2>
          <p className="text-[0.9375rem] leading-relaxed text-[#1d1d1f]">
            {t(topic.summary)}
          </p>
        </section>

        {/* Key Points */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-[1.0625rem] font-semibold text-[#1d1d1f]">
            {lang === "en" ? "Key Points" : "मुख्य बिंदु"}
          </h2>
          <ul className="space-y-3">
            {topic.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-xs font-semibold text-[#0071e3]">
                  {idx + 1}
                </span>
                <span className="text-[0.9375rem] leading-relaxed text-[#1d1d1f]">
                  {t(point)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Formulas */}
        {topic.formulas.length > 0 && (
          <section className="rounded-2xl bg-[#1d1d1f] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-[1.0625rem] font-semibold text-white">
              <Zap size={16} className="text-[#0071e3]" />
              {lang === "en" ? "Formulas" : "सूत्र"}
            </h2>
            <div className="space-y-3">
              {topic.formulas.map((formula, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-white/[0.06] px-4 py-3 font-mono text-[1.0625rem] text-white"
                >
                  {formula}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-white/40">
              {lang === "en"
                ? "LaTeX notation — universal across languages"
                : "LaTeX संकेतन — भाषाओं में सार्वभौमिक"}
            </p>
          </section>
        )}

        {/* Examples */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-[1.0625rem] font-semibold text-[#1d1d1f]">
            {lang === "en" ? "Worked Examples" : "हल किए गए उदाहरण"}
          </h2>
          <div className="space-y-5">
            {topic.examples.map((example, idx) => (
              <div key={idx} className="rounded-xl border border-black/[0.06] p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#86868b]">
                  {lang === "en" ? `Example ${idx + 1}` : `उदाहरण ${idx + 1}`}
                </p>
                <p className="mb-3 text-[0.9375rem] font-medium text-[#1d1d1f]">
                  {t(example.problem)}
                </p>
                <div className="rounded-lg bg-[#f5f5f7] px-4 py-3">
                  <p className="mb-1 text-xs font-semibold text-[#0071e3]">
                    {lang === "en" ? "Solution" : "हल"}
                  </p>
                  <p
                    className="whitespace-pre-line text-[0.9375rem] text-[#1d1d1f]"
                  >
                    {t(example.solution)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Floating "Ask Prof. Curious" CTA ── */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-[130]">
        <button
          id="ask-prof-curious-btn"
          onClick={() => setIsChatOpen(true)}
          className={`
            flex items-center gap-2.5 rounded-full px-6 py-3.5
            bg-[#0071e3] text-white text-[0.9375rem] font-medium
            shadow-[0_8px_32px_rgba(0,113,227,0.4)]
            transition-all duration-200
            hover:bg-[#0077ed] hover:shadow-[0_12px_40px_rgba(0,113,227,0.5)] hover:-translate-y-0.5
            active:scale-[0.97]
            ${isChatOpen ? "opacity-0 pointer-events-none" : "opacity-100"}
          `}
          aria-label="Open Prof. Curious AI chat"
        >
          <MessageCircle size={18} />
          {lang === "en" ? "Ask Prof. Curious" : "Prof. Curious से पूछें"}
        </button>
      </div>

      {/* ── Chat Panel (Phase 5) ── */}
      {isChatOpen && (
        <ChatPanel
          onClose={() => setIsChatOpen(false)}
          topicName={t(topic.name)}
        />
      )}
    </div>
  );
}
