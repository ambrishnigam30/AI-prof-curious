/**
 * Navbar — Apple-style dark translucent glass navigation bar.
 *
 * Design constraints (ARCHITECTURE.md §1.3):
 * - Sticky top, h-12 (48px)
 * - Pure black background at 0.8 opacity
 * - backdrop-filter: blur(20px) saturate(180%)
 * - No borders — depth via background contrast only
 *
 * Auth logic:
 * - Logged out → "Sign in with Google" text link (Apple Blue)
 * - Logged in  → "Go to Dashboard" button + "Sign Out" link
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, loading, signIn, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      id="main-nav"
      className="fixed top-0 left-0 right-0 z-[100] h-12"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
      }}
    >
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-5">
        {/* ─── Logo ─── */}
        <Link
          href="/"
          className="flex items-center gap-2 text-[0.9375rem] font-medium tracking-[-0.01em] text-white/90 transition-opacity hover:opacity-80"
          id="nav-logo"
        >
          <span
            className="text-lg"
            role="img"
            aria-label="Prof. Curious mascot"
          >
            🧠
          </span>
          <span>Prof. Curious</span>
        </Link>

        {/* ─── Desktop Auth Controls ─── */}
        <div className="hidden items-center gap-5 sm:flex">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex h-[30px] items-center rounded-[980px] bg-[#0071e3] px-4 text-[0.8125rem] font-medium text-white transition-all hover:bg-[#0077ed] active:scale-[0.97]"
                    id="nav-dashboard"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-[0.8125rem] font-normal text-[#86868b] transition-colors hover:text-white"
                    id="nav-signout"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={signIn}
                  className="text-[0.8125rem] font-normal text-[#0071e3] transition-opacity hover:opacity-80"
                  id="nav-signin"
                >
                  Sign in with Google
                </button>
              )}
            </>
          )}
        </div>

        {/* ─── Mobile Menu Toggle ─── */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/[0.08] sm:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          id="nav-mobile-toggle"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ─── Mobile Menu Dropdown ─── */}
      {mobileMenuOpen && (
        <div
          className="absolute left-0 right-0 top-12 sm:hidden"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.92)",
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
          }}
        >
          <div className="flex flex-col gap-1 px-5 py-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="rounded-lg px-3 py-2.5 text-[0.9375rem] font-medium text-[#0071e3]"
                      onClick={() => setMobileMenuOpen(false)}
                      id="nav-mobile-dashboard"
                    >
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="rounded-lg px-3 py-2.5 text-left text-[0.9375rem] text-[#86868b] transition-colors hover:bg-white/[0.06]"
                      id="nav-mobile-signout"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      signIn();
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-lg px-3 py-2.5 text-left text-[0.9375rem] text-[#0071e3]"
                    id="nav-mobile-signin"
                  >
                    Sign in with Google
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
