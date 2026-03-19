"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface PublicComment {
  id: string;
  slug: string;
  name: string;
  text: string;
  createdAt: string;
}

interface Props {
  slug: string;
}

function timeAgo(dateStr: string, locale: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return locale === "es" ? "Ahora mismo" : "Just now";
  if (diffMin < 60)
    return locale === "es" ? `Hace ${diffMin} min` : `${diffMin}m ago`;
  if (diffH < 24)
    return locale === "es" ? `Hace ${diffH}h` : `${diffH}h ago`;
  if (diffD < 7)
    return locale === "es" ? `Hace ${diffD} días` : `${diffD}d ago`;
  return date.toLocaleDateString(locale === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function CommentsSection({ slug }: Props) {
  const t = useTranslations("comments");

  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Load comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`);
      if (res.ok) {
        setComments(await res.json());
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [slug]);

  // Load CAPTCHA
  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await fetch("/api/captcha");
      if (res.ok) {
        const data = await res.json();
        setCaptchaToken(data.token);
        setCaptchaQuestion(data.question);
        setCaptchaAnswer("");
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchComments();
    fetchCaptcha();
  }, [fetchComments, fetchCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim() || !text.trim()) {
      setError(t("error_required"));
      return;
    }
    if (!captchaAnswer.trim()) {
      setError(t("error_captcha"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name,
          email,
          text,
          captchaToken,
          captchaAnswer,
        }),
      });

      if (res.status === 422) {
        setError(t("error_captcha_wrong"));
        fetchCaptcha(); // refresh CAPTCHA
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        setError(t("error_generic"));
        setSubmitting(false);
        return;
      }

      // Success
      setName("");
      setEmail("");
      setText("");
      setSuccess(true);
      fetchComments();
      fetchCaptcha();
    } catch {
      setError(t("error_generic"));
    }
    setSubmitting(false);
  };

  return (
    <section className="mt-12 pt-8 border-t border-slate-800">
      <h2 className="text-slate-200 font-semibold text-base mb-6">
        {t("title")} ({comments.length})
      </h2>

      {/* Comment list */}
      {loading ? (
        <p className="text-slate-500 text-sm">{t("loading")}</p>
      ) : comments.length === 0 ? (
        <p className="text-slate-500 text-sm mb-8">{t("no_comments")}</p>
      ) : (
        <div className="space-y-4 mb-8">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-lg bg-slate-800/40 border border-slate-700/40 px-4 py-3"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-cyan-400 text-sm font-medium">
                  {c.name}
                </span>
                <span className="text-slate-600 text-xs">
                  {timeAgo(c.createdAt, "es")}
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {c.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-slate-300 text-sm font-medium">{t("add_comment")}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder={t("name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2
              text-sm text-slate-200 placeholder-slate-500
              focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          <input
            type="email"
            placeholder={t("email_placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
            className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2
              text-sm text-slate-200 placeholder-slate-500
              focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        <textarea
          placeholder={t("text_placeholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          rows={3}
          className="w-full rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2
            text-sm text-slate-200 placeholder-slate-500
            focus:outline-none focus:border-cyan-500/50 transition-colors resize-y"
        />

        {/* CAPTCHA */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm shrink-0">
            {captchaQuestion || "..."}
          </span>
          <input
            type="text"
            placeholder={t("captcha_placeholder")}
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
            maxLength={5}
            className="w-24 rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2
              text-sm text-slate-200 placeholder-slate-500
              focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}
        {success && (
          <p className="text-emerald-400 text-xs">{t("success")}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700
            text-white text-sm font-medium px-5 py-2 transition-colors"
        >
          {submitting ? t("sending") : t("send")}
        </button>
      </form>
    </section>
  );
}
