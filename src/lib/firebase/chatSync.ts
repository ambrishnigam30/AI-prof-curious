/**
 * chatSync.ts — Firestore chat persistence helpers.
 *
 * Persists Prof. Curious conversations under the path:
 *   users/{uid}/chats/{subjectId}_{topicId}/messages/{messageId}
 *
 * This keeps chat history scoped per-topic per-student, paginatable,
 * and safe from the 1 MB document-size limit (each message is its own doc).
 *
 * @see ARCHITECTURE.md §2.3 — users/{uid}/interactions schema
 * @see ARCHITECTURE.md §2.4 — Firestore Security Rules
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { ChatMessage } from "@/hooks/useChat";

// ─── Path helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the Firestore collection reference for a topic's messages.
 * Path: users/{uid}/chats/{subjectId}_{topicId}/messages
 */
function getMessagesRef(
  firestore: Firestore,
  uid: string,
  subjectId: string,
  topicId: string
) {
  // Composite session key — matches ARCHITECTURE.md pattern for subcollection IDs
  const sessionKey = `${subjectId}_${topicId}`;
  return collection(
    firestore,
    "users",
    uid,
    "chats",
    sessionKey,
    "messages"
  );
}

// ─── saveMessage ─────────────────────────────────────────────────────────────

/**
 * Persists a single chat message to Firestore.
 *
 * Fire-and-forget safe — the caller does NOT need to await this unless
 * it needs confirmation. Errors are caught and logged so they never
 * bubble up and break the UI streaming experience.
 *
 * @param uid       Firebase Auth UID of the student
 * @param subjectId e.g. "mathematics"
 * @param topicId   e.g. "algebraic-identities"
 * @param message   { role: "user" | "model", content: string }
 */
export async function saveMessage(
  uid: string,
  subjectId: string,
  topicId: string,
  message: ChatMessage
): Promise<void> {
  if (!db) {
    // Firebase not initialised (missing env vars or SSR) — skip silently
    return;
  }

  try {
    const ref = getMessagesRef(db, uid, subjectId, topicId);
    await addDoc(ref, {
      role: message.role,
      content: message.content,
      createdAt: serverTimestamp(),
      // Schema fields from ARCHITECTURE.md for future compatibility
      wasHint: false,
      questionRef: null,
      tokensUsed: null,
      pendingWrite: false,
    });
  } catch (err) {
    // Non-fatal: the in-memory chat still works perfectly
    console.error("[chatSync] Failed to save message:", err);
  }
}

// ─── getChatHistory ───────────────────────────────────────────────────────────

/**
 * Fetches the last 50 messages for a topic session, ordered chronologically.
 *
 * Returns an empty array if Firebase is uninitialised, the user has no
 * history, or any read error occurs — all of which are safe fallbacks
 * (the hook just starts a fresh in-memory session).
 *
 * @param uid       Firebase Auth UID of the student
 * @param subjectId e.g. "mathematics"
 * @param topicId   e.g. "algebraic-identities"
 * @returns         Ordered array of { role, content } messages
 */
export async function getChatHistory(
  uid: string,
  subjectId: string,
  topicId: string
): Promise<ChatMessage[]> {
  if (!db) return [];

  try {
    const ref = getMessagesRef(db, uid, subjectId, topicId);
    // Order ascending so messages render top-to-bottom correctly
    const q = query(ref, orderBy("createdAt", "asc"));
    const snap = await getDocs(q);

    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        role: data.role as "user" | "model",
        content: data.content as string,
      };
    });
  } catch (err) {
    console.error("[chatSync] Failed to load chat history:", err);
    return [];
  }
}
