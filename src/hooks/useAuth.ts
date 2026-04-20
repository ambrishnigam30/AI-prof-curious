/**
 * useAuth — Custom React hook for Firebase Authentication.
 *
 * Wraps onAuthStateChanged for reactive user state, and exposes
 * signInWithGoogle / signOut actions. Calls syncUserToFirestore
 * immediately after a successful Google Sign-In.
 *
 * @see ARCHITECTURE.md §4.4 — Firebase Client Auth
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "firebase/auth";
import { signInWithGoogle, signOutUser, onAuthChange } from "@/lib/firebase/auth";
import { syncUserToFirestore } from "@/lib/firebase/userSync";

interface AuthState {
  /** The currently authenticated Firebase user, or null. */
  user: User | null;
  /** True while the initial auth state is being resolved. */
  loading: boolean;
  /** Trigger Google Sign-In popup + Firestore sync. */
  signIn: () => Promise<void>;
  /** Sign out the current user. */
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to Firebase auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    try {
      const firebaseUser = await signInWithGoogle();
      // Sync user profile to Firestore immediately after sign-in
      await syncUserToFirestore(firebaseUser);
    } catch (error) {
      console.error("[useAuth] Sign-in failed:", error);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("[useAuth] Sign-out failed:", error);
    }
  }, []);

  return { user, loading, signIn, signOut };
}
