/**
 * Google SSO authentication helpers.
 *
 * v2: Phone OTP has been removed entirely. Google Sign-In is unlimited
 * on the Firebase Spark (free) plan — no per-auth cost.
 *
 * Note: Firestore user sync is handled separately by `userSync.ts`
 * and called from the `useAuth` hook after sign-in.
 *
 * @see ARCHITECTURE.md §4.4 — src/lib/firebase/auth.ts
 */

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "./config";

/**
 * Sign in with Google via popup.
 * Returns the authenticated Firebase User.
 */
export async function signInWithGoogle(): Promise<User> {
  if (!auth || !googleProvider) {
    throw new Error("Firebase not initialized. Check your .env.local configuration.");
  }

  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out the current user.
 */
export async function signOutUser(): Promise<void> {
  if (!auth) {
    throw new Error("Firebase not initialized. Check your .env.local configuration.");
  }
  await signOut(auth);
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    // During SSR / build, return a no-op unsubscribe
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
