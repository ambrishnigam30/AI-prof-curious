/**
 * Navbar — Dark translucent glass navigation bar.
 *
 * Implements the Apple-style sticky header defined in ARCHITECTURE.md §1.3:
 * - backdrop-filter: saturate(180%) blur(20px)
 * - Semi-transparent black background (glass-nav utility)
 * - "Sign in with Google" button
 * - No borders — depth via background contrast only
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { signInWithGoogle, signOutUser, onAuthChange } from "@/lib/firebase/auth";
import type { User } from "firebase/auth";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  // Track scroll for enhanced glass effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign-in error:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  return (
    <nav
      id="main-nav"
      className="glass-nav fixed top-0 left-0 right-0"
      style={{
        zIndex: "var(--z-nav)",
        height: "var(--nav-height)",
        transition: "background-color 300ms ease",
        backgroundColor: isScrolled
          ? "rgba(29, 29, 31, 0.82)"
          : "rgba(29, 29, 31, 0.72)",
      }}
    >
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-5">
        {/* ─── Logo ─── */}
        <Link
          href="/"
          className="flex items-center gap-2 text-[0.9375rem] font-medium tracking-[-0.01em] text-[var(--color-foreground)] transition-opacity hover:opacity-80"
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

        {/* ─── Desktop Links ─── */}
        <div className="hidden items-center gap-6 sm:flex">
          <Link
            href="/features"
            className="text-[0.8125rem] font-normal text-[var(--color-apple-text-secondary)] transition-colors hover:text-[var(--color-foreground)]"
            id="nav-features"
          >
            Features
          </Link>
          <Link
            href="/about"
            className="text-[0.8125rem] font-normal text-[var(--color-apple-text-secondary)] transition-colors hover:text-[var(--color-foreground)]"
            id="nav-about"
          >
            About
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-[0.8125rem] font-medium text-[var(--color-apple-blue)] transition-opacity hover:opacity-80"
                id="nav-dashboard"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="flex h-[30px] items-center rounded-[var(--radius-pill)] bg-[rgba(255,255,255,0.08)] px-3 text-[0.75rem] font-medium text-[var(--color-foreground)] transition-colors hover:bg-[rgba(255,255,255,0.14)]"
                id="nav-signout"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="mr-2 h-[18px] w-[18px] rounded-full"
                  />
                ) : null}
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="flex h-[30px] items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-apple-blue)] px-3.5 text-[0.75rem] font-medium text-white transition-all hover:bg-[var(--color-apple-blue-hover)] active:scale-[0.97] disabled:opacity-50"
              id="nav-signin"
            >
              {/* Google "G" icon — inline SVG for zero dep overhead */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#fff"
                  fillOpacity="0.9"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#fff"
                  fillOpacity="0.7"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#fff"
                  fillOpacity="0.5"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#fff"
                  fillOpacity="0.6"
                />
              </svg>
              {isSigningIn ? "Signing in…" : "Sign in with Google"}
            </button>
          )}
        </div>

        {/* ─── Mobile Menu Toggle ─── */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-foreground)] transition-colors hover:bg-[rgba(255,255,255,0.08)] sm:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          id="nav-mobile-toggle"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ─── Mobile Menu Dropdown ─── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="glass-nav absolute left-0 right-0 top-[var(--nav-height)] sm:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ backgroundColor: "rgba(29, 29, 31, 0.92)" }}
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              <Link
                href="/features"
                className="rounded-lg px-3 py-2.5 text-[0.9375rem] text-[var(--color-apple-text-secondary)] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--color-foreground)]"
                onClick={() => setMobileMenuOpen(false)}
                id="nav-mobile-features"
              >
                Features
              </Link>
              <Link
                href="/about"
                className="rounded-lg px-3 py-2.5 text-[0.9375rem] text-[var(--color-apple-text-secondary)] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--color-foreground)]"
                onClick={() => setMobileMenuOpen(false)}
                id="nav-mobile-about"
              >
                About
              </Link>

              <div className="my-2 h-[1px] bg-[var(--color-apple-separator-dark)]" />

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-lg px-3 py-2.5 text-[0.9375rem] font-medium text-[var(--color-apple-blue)]"
                    onClick={() => setMobileMenuOpen(false)}
                    id="nav-mobile-dashboard"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-lg px-3 py-2.5 text-left text-[0.9375rem] text-[var(--color-apple-text-secondary)] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                    id="nav-mobile-signout"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleSignIn();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isSigningIn}
                  className="mt-1 flex h-[44px] items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-apple-blue)] text-[0.9375rem] font-medium text-white transition-colors hover:bg-[var(--color-apple-blue-hover)] disabled:opacity-50"
                  id="nav-mobile-signin"
                >
                  {isSigningIn ? "Signing in…" : "Sign in with Google"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
