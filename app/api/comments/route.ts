import { NextRequest, NextResponse } from "next/server";
import {
  listComments,
  addComment,
  deleteComment,
  validateCaptcha,
} from "@/lib/comments";

// ── GET /api/comments?slug=xxx ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }
  const comments = await listComments(slug);
  // Strip emails from public response
  const safe = comments.map(({ email: _email, ...rest }) => rest);
  return NextResponse.json(safe);
}

// ── POST /api/comments ───────────────────────────────────────────────────────
// Body: { slug, name, email, text, captchaToken, captchaAnswer }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, name, email, text, captchaToken, captchaAnswer } = body;

    if (!slug || !name?.trim() || !text?.trim()) {
      return NextResponse.json(
        { error: "slug, name, and text are required" },
        { status: 400 }
      );
    }
    if (!captchaToken || !captchaAnswer) {
      return NextResponse.json(
        { error: "CAPTCHA is required" },
        { status: 400 }
      );
    }

    // Validate CAPTCHA
    const valid = await validateCaptcha(captchaToken, String(captchaAnswer));
    if (!valid) {
      return NextResponse.json(
        { error: "captcha_failed" },
        { status: 422 }
      );
    }

    const comment = await addComment(slug, name, email || "", text);
    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// ── DELETE /api/comments?slug=xxx&id=yyy ─────────────────────────────────────
// Protected by ADMIN_SECRET env var (for CLI usage)

export async function DELETE(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  const id = req.nextUrl.searchParams.get("id");
  if (!slug || !id) {
    return NextResponse.json(
      { error: "slug and id required" },
      { status: 400 }
    );
  }

  const deleted = await deleteComment(slug, id);
  if (!deleted) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
