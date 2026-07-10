"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type RequestPrinterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormState = {
  brand: string;
  model: string;
  email: string;
  comments: string;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

export function RequestPrinterModal({
  open,
  onOpenChange,
}: RequestPrinterModalProps) {
  const t = useTranslations();
  const locale = useLocale() === "nl" ? "nl" : "en";
  const [form, setForm] = useState<FormState>({
    brand: "",
    model: "",
    email: "",
    comments: "",
  });
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState("submitting");
    setErrorMsg(null);

    try {
      const response = await fetch('/api/request-printer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      });

      if (response.ok) {
        setSubmitState("success");
        toast.success(t("requestPrinter.success"));

        // Reset & close after short delay
        setTimeout(() => {
          setSubmitState("idle");
          setForm({ brand: "", model: "", email: "", comments: "" });
          onOpenChange(false);
        }, 1500);
      } else {
        const data = await response.json().catch(() => ({}));
        let errorText = data.message || 'Something went wrong. Please try again.';
        
        if (data.errors) {
          const firstErrorKey = Object.keys(data.errors)[0];
          if (firstErrorKey && data.errors[firstErrorKey][0]) {
            errorText = data.errors[firstErrorKey][0];
          }
        }
        
        setErrorMsg(errorText);
        setSubmitState("error");
      }
    } catch (err) {
      setErrorMsg('A network error occurred. Please try again.');
      setSubmitState("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-6 gap-7 max-w-[520px] rounded-xl border border-black/10 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
        style={{ fontFamily: "Segoe UI, sans-serif" }}
      >
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <DialogTitle
            className="text-ink font-bold leading-[120%]"
            style={{ fontSize: "24px" }}
          >
            {t("requestPrinter.title")}
          </DialogTitle>
          <DialogDescription
            className="text-copy font-normal leading-[150%]"
            style={{ fontSize: "16px" }}
          >
            {t("requestPrinter.subtitle")}
          </DialogDescription>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Brand */}
          <FieldGroup label={t("requestPrinter.brand")}>
            <Input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder={t("requestPrinter.brandPlaceholder")}
              required
              className={inputClass}
            />
          </FieldGroup>

          {/* Model */}
          <FieldGroup label={t("requestPrinter.model")}>
            <Input
              name="model"
              value={form.model}
              onChange={handleChange}
              placeholder={t("requestPrinter.modelPlaceholder")}
              required
              className={inputClass}
            />
          </FieldGroup>

          {/* Email */}
          <FieldGroup label={t("requestPrinter.email")}>
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t("requestPrinter.emailPlaceholder")}
              required
              className={inputClass}
            />
          </FieldGroup>

          {/* Comments */}
          <FieldGroup label={t("requestPrinter.comments")}>
            <Textarea
              name="comments"
              value={form.comments}
              onChange={handleChange}
              placeholder={t("requestPrinter.commentsPlaceholder")}
              rows={4}
              className={cn(
                inputClass,
                "rounded-xl resize-none py-4",
              )}
            />
          </FieldGroup>

          {/* Error Message */}
          {errorMsg && submitState === "error" && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitState === "submitting" || submitState === "success"}
            className="mt-1 w-full flex items-center justify-center gap-2 h-11 rounded-full bg-brand text-white font-semibold text-base leading-6 hover:bg-brand-hover transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitState === "submitting" ? (
              <>
                <svg
                  className="animate-spin size-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    stroke="white"
                    strokeWidth="2"
                    strokeOpacity="0.35"
                  />
                  <path
                    d="M10 2a8 8 0 0 1 8 8"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {t("requestPrinter.sending")}
              </>
            ) : submitState === "success" ? (
              <>
                <svg
                  className="size-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10l4 4 8-8"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {t("requestPrinter.success")}
              </>
            ) : (
              t("requestPrinter.submit")
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Shared field wrapper
function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-ink font-semibold leading-5"
        style={{ fontSize: "18px" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// Shared input style matching Figma: pill border, #DDE1EA, 12px/20px padding
const inputClass =
  "h-auto rounded-full border border-[#DDE1EA] bg-white px-5 py-3 text-base text-ink placeholder:text-subtle focus-visible:border-brand focus-visible:ring-brand/20 shadow-none";
