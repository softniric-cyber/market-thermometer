import { kv } from "./kv";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  slug: string;
  name: string;
  email: string;
  text: string;
  createdAt: string; // ISO 8601
}

export interface CaptchaChallenge {
  token: string;
  question: string; // e.g. "¿Cuánto es 4 + 7?"
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function commentsKey(slug: string) {
  return `comments:${slug}`;
}

function captchaKey(token: string) {
  return `captcha:${token}`;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── CAPTCHA ──────────────────────────────────────────────────────────────────

/** Generate a simple math CAPTCHA. Stores the answer in KV with 5-min TTL. */
export async function createCaptcha(): Promise<CaptchaChallenge> {
  const a = Math.floor(Math.random() * 10) + 1; // 1–10
  const b = Math.floor(Math.random() * 10) + 1;
  const answer = a + b;
  const token = generateId();

  await kv.setex(captchaKey(token), 300, String(answer)); // 5 min TTL

  return {
    token,
    question: `${a} + ${b} = ?`,
  };
}

/** Validate a CAPTCHA answer. Consumes the token (one-time use). */
export async function validateCaptcha(
  token: string,
  answer: string
): Promise<boolean> {
  const expected = await kv.get(captchaKey(token));
  if (!expected) return false; // expired or already used
  await kv.del(captchaKey(token)); // consume
  return expected === answer.trim();
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

/** List comments for a slug, newest first. */
export async function listComments(slug: string): Promise<Comment[]> {
  const raw = await kv.get(commentsKey(slug));
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as Comment[];
    return arr.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

/** Add a comment. Returns the new comment. */
export async function addComment(
  slug: string,
  name: string,
  email: string,
  text: string
): Promise<Comment> {
  const existing = await listComments(slug);
  const comment: Comment = {
    id: generateId(),
    slug,
    name: name.trim().slice(0, 100),
    email: email.trim().slice(0, 200),
    text: text.trim().slice(0, 2000),
    createdAt: new Date().toISOString(),
  };
  existing.unshift(comment);
  await kv.set(commentsKey(slug), JSON.stringify(existing));
  return comment;
}

/** Delete a comment by ID. Returns true if found and deleted. */
export async function deleteComment(
  slug: string,
  commentId: string
): Promise<boolean> {
  const existing = await listComments(slug);
  const filtered = existing.filter((c) => c.id !== commentId);
  if (filtered.length === existing.length) return false;
  await kv.set(commentsKey(slug), JSON.stringify(filtered));
  return true;
}

/** List ALL comments across all posts (for admin CLI). */
export async function listAllComments(): Promise<Comment[]> {
  const keys = await kv.keys("comments:*");
  const all: Comment[] = [];
  for (const key of keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        all.push(...(JSON.parse(raw) as Comment[]));
      } catch { /* skip corrupted */ }
    }
  }
  return all.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
