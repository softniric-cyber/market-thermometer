import { NextResponse } from "next/server";
import { createCaptcha } from "@/lib/comments";

export const dynamic = "force-dynamic";

// ── GET /api/captcha ─────────────────────────────────────────────────────────
// Returns { token, question }

export async function GET() {
  const challenge = await createCaptcha();
  return NextResponse.json(challenge);
}
