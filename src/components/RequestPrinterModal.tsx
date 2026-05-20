"use client";

import { useState } from "react";
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
  const [form, setForm] = useState<FormState>({
    brand: "",
    model: "",
    email: "",
    comments: "",
  });
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState("submitting");

    // Simulate submission — replace with real API call
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitState("success");

    // Reset & close after short delay
    setTimeout(() => {
      setSubmitState("idle");
      setForm({ brand: "", model: "", email: "", comments: "" });
      onOpenChange(false);
    }, 1500);
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
            className="text-[#222222] font-bold leading-[120%]"
            style={{ fontSize: "24px" }}
          >
            Request ICC Profile
          </DialogTitle>
          <DialogDescription
            className="text-[#444444] font-normal leading-[150%]"
            style={{ fontSize: "16px" }}
          >
            As soon as we receive the request, we will add your printer to the
            &ldquo;product finder&rdquo;.
          </DialogDescription>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Brand */}
          <FieldGroup label="Brand">
            <Input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder="Brand name"
              required
              className={inputClass}
            />
          </FieldGroup>

          {/* Model */}
          <FieldGroup label="Model">
            <Input
              name="model"
              value={form.model}
              onChange={handleChange}
              placeholder="Model name"
              required
              className={inputClass}
            />
          </FieldGroup>

          {/* Email */}
          <FieldGroup label="Email">
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Your email address"
              required
              className={inputClass}
            />
          </FieldGroup>

          {/* Comments */}
          <FieldGroup label="Comments">
            <Textarea
              name="comments"
              value={form.comments}
              onChange={handleChange}
              placeholder="Write your message here..."
              rows={4}
              className={cn(
                inputClass,
                "rounded-xl resize-none py-4",
              )}
            />
          </FieldGroup>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitState === "submitting" || submitState === "success"}
            className="mt-1 w-full flex items-center justify-center gap-2 h-11 rounded-full bg-[#F18800] text-white font-semibold text-base leading-6 hover:bg-[#d97a00] transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
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
                Sending...
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
                Request sent!
              </>
            ) : (
              "Submit Request"
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
        className="text-[#222222] font-semibold leading-5"
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
  "h-auto rounded-full border border-[#DDE1EA] bg-white px-5 py-3 text-base text-[#222222] placeholder:text-[#888888] focus-visible:border-[#F18800] focus-visible:ring-[#F18800]/20 shadow-none";
