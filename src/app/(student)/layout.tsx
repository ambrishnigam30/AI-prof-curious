/**
 * Student App Layout — Authenticated shell for all student routes.
 *
 * Design (ARCHITECTURE.md §1.3):
 * - Light gray background (#f5f5f7)
 * - Near-black text (#1d1d1f)
 * - Navbar at top (inherited from root layout)
 * - Content in max-width container with padding
 */

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      {/* Spacer for the fixed navbar (48px) */}
      <div className="h-12" />

      {/* Content container */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
