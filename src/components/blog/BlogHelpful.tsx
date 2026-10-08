"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

type Counts = { yes: number; no: number; total: number; yes_percent: number; no_percent: number };
type Step = "idle" | "voted" | "feedback" | "sent";

interface BlogHelpfulProps {
  postId: number;
  postTitle: string;
  postUrl: string;
}

const storageKey = (postId: number) => `blog_helpful_${postId}`;

function toCounts(data: unknown): Counts | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const yes = Number(d.yes);
  const no = Number(d.no);
  if (!Number.isFinite(yes) || !Number.isFinite(no)) return null;
  const total = yes + no;
  const yesPercent = total > 0 ? Math.round((yes / total) * 100) : 0;
  return { yes, no, total, yes_percent: yesPercent, no_percent: total > 0 ? 100 - yesPercent : 0 };
}

export default function BlogHelpful({ postId, postTitle, postUrl }: BlogHelpfulProps) {
  const t = useTranslations("blogDetail");
  const locale = useLocale();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [counts, setCounts] = useState<Counts | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [vote, setVote] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    try {
      const saved = window.localStorage.getItem(storageKey(postId));
      if (saved === "yes" || saved === "no") {
        setVote(saved === "yes");
        setStep("voted");
      }
    } catch {
      // storage unavailable
    }

    fetch(`/api/blog-feedback/${postId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const parsed = toCounts(data);
        if (!cancelled && parsed) setCounts(parsed);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleVote = async (helpful: boolean) => {
    if (submitting || step !== "idle") return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/blog-feedback/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helpful }),
      });
      if (!res.ok) throw new Error("vote failed");

      const parsed = toCounts(await res.json().catch(() => null));
      if (parsed) setCounts(parsed);

      setVote(helpful);
      setStep(helpful ? "voted" : "feedback");
      try {
        window.localStorage.setItem(storageKey(postId), helpful ? "yes" : "no");
      } catch {
        // storage unavailable
      }
    } catch {
      setError(t("feedbackError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !message.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      if (!executeRecaptcha) throw new Error("reCAPTCHA is not ready");
      const recaptcha_token = await executeRecaptcha("blog_feedback");

      const res = await fetch(`/api/blog-feedback/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          email,
          post_title: postTitle,
          post_url: postUrl,
          locale,
          recaptcha_token,
        }),
      });
      if (!res.ok) throw new Error("comment failed");

      setStep("sent");
      setMessage("");
      setEmail("");
    } catch {
      setError(t("feedbackError"));
    } finally {
      setSubmitting(false);
    }
  };

  const hasVotes = counts !== null && counts.total > 0;
  const alreadyVoted = step !== "idle";

  return (
    <div className="w-full px-6 py-4 bg-white shadow-[2px_4px_20px_rgba(109,109,120,0.06)] rounded-xl border border-[#EDF2F7] flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="text-neutral-800 text-lg font-bold leading-normal">{t("wasThisHelpful")}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleVote(true)}
            disabled={submitting || alreadyVoted}
            aria-pressed={vote === true}
            className={`px-3 py-1.5 rounded flex items-center gap-2 transition-colors disabled:cursor-default ${
              vote === true || !alreadyVoted
                ? "bg-brand hover:bg-brand-hover disabled:hover:bg-brand"
                : "bg-white border border-[#D7DDE5] opacity-60"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M4.375 6.25V13.75" stroke={vote === true || !alreadyVoted ? "white" : "#F18800"} strokeWidth="1.08333" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.375 3.675L8.75 6.25H12.3937C12.5878 6.25 12.7792 6.29518 12.9528 6.38197C13.1263 6.46875 13.2773 6.59476 13.3938 6.75C13.5102 6.90525 13.5889 7.08547 13.6236 7.27639C13.6583 7.46732 13.6481 7.66371 13.5938 7.85L12.1375 12.85C12.0618 13.1096 11.9039 13.3377 11.6875 13.5C11.4711 13.6623 11.208 13.75 10.9375 13.75H2.5C2.16848 13.75 1.85054 13.6183 1.61612 13.3839C1.3817 13.1495 1.25 12.8315 1.25 12.5V7.5C1.25 7.16848 1.3817 6.85054 1.61612 6.61612C1.85054 6.3817 2.16848 6.25 2.5 6.25H4.225C4.45755 6.24988 4.68546 6.18488 4.8831 6.06233C5.08073 5.93977 5.24026 5.76451 5.34375 5.55625L7.5 1.25C7.79474 1.25365 8.08484 1.32386 8.34863 1.45537C8.61242 1.58689 8.84308 1.77632 9.02338 2.0095C9.20368 2.24269 9.32895 2.5136 9.38984 2.802C9.45072 3.0904 9.44565 3.38883 9.375 3.675Z" stroke={vote === true || !alreadyVoted ? "white" : "#F18800"} strokeWidth="1.08333" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={`text-base font-bold leading-6 ${vote === true || !alreadyVoted ? "text-white" : "text-brand"}`}>{t("yes")}</span>
          </button>
          <button
            type="button"
            onClick={() => handleVote(false)}
            disabled={submitting || alreadyVoted}
            aria-pressed={vote === false}
            className={`h-9 px-3 py-1.5 rounded flex items-center gap-2 transition-colors disabled:cursor-default border ${
              vote === false ? "bg-brand border-brand" : "bg-white border-[#D7DDE5] hover:bg-slate-50 disabled:hover:bg-white"
            } ${alreadyVoted && vote !== false ? "opacity-60" : ""}`}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M10.625 8.75V1.25" stroke={vote === false ? "white" : "#F18800"} strokeWidth="1.08333" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.6252 11.325L6.2502 8.75H2.60645C2.41239 8.75 2.221 8.70482 2.04743 8.61803C1.87386 8.53125 1.72288 8.40525 1.60645 8.25C1.49001 8.09476 1.41132 7.91453 1.37661 7.72361C1.34189 7.53268 1.35211 7.33629 1.40645 7.15L2.8627 2.15C2.93842 1.89036 3.09633 1.66228 3.3127 1.5C3.52907 1.33772 3.79223 1.25 4.0627 1.25H12.5002C12.8317 1.25 13.1497 1.3817 13.3841 1.61612C13.6185 1.85054 13.7502 2.16848 13.7502 2.5V7.5C13.7502 7.83152 13.6185 8.14946 13.3841 8.38388C13.1497 8.6183 12.8317 8.75 12.5002 8.75H10.7752C10.5426 8.75012 10.3147 8.81512 10.1171 8.93768C9.91946 9.06023 9.75993 9.23549 9.65645 9.44375L7.5002 13.75C7.20546 13.7464 6.91536 13.6761 6.65157 13.5446C6.38778 13.4131 6.15712 13.2237 5.97682 12.9905C5.79652 12.7573 5.67125 12.4864 5.61036 12.198C5.54947 11.9096 5.55454 11.6112 5.6252 11.325Z" stroke={vote === false ? "white" : "#F18800"} strokeWidth="1.08333" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={`text-base font-bold leading-6 ${vote === false ? "text-white" : "text-brand"}`}>{t("no")}</span>
          </button>
        </div>

        {hasVotes && (
          <div className="text-neutral-600 text-base font-medium leading-6" aria-live="polite">
            {t("helpfulStats", { yes: counts.yes_percent, no: counts.no_percent, total: counts.total })}
          </div>
        )}
      </div>

      {step === "voted" && vote === true && (
        <p className="text-neutral-700 text-base font-medium">{t("thanksYes")}</p>
      )}

      {step === "feedback" && (
        <form onSubmit={handleSubmitFeedback} className="flex flex-col gap-3">
          <label htmlFor="blog-feedback-message" className="text-neutral-800 text-base font-bold">
            {t("feedbackPrompt")}
          </label>
          <textarea
            id="blog-feedback-message"
            required
            rows={4}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("feedbackPlaceholder")}
            className="w-full px-4 py-3 rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-800 text-base resize-y focus:outline-brand focus:outline-2"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("feedbackEmailPlaceholder")}
            aria-label={t("feedbackEmailPlaceholder")}
            className="w-full h-11 px-4 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-800 text-base focus:outline-brand focus:outline-2"
          />
          <div>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="h-10 px-5 bg-brand hover:bg-brand-hover disabled:bg-amber-300 disabled:cursor-not-allowed rounded-[100px] text-white text-base font-medium transition-colors"
            >
              {submitting ? t("feedbackSending") : t("feedbackSubmit")}
            </button>
          </div>
        </form>
      )}

      {step === "sent" && <p className="text-neutral-700 text-base font-medium">{t("feedbackThanks")}</p>}

      {step === "voted" && vote === false && (
        <p className="text-neutral-700 text-base font-medium">{t("thanksNo")}</p>
      )}

      {error && <p className="text-sm font-medium text-red-600" role="alert">{error}</p>}
    </div>
  );
}
