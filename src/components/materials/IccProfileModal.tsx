"use client";

import { useState, useRef, useEffect } from "react";

type IccProfileModalProps = {
  materialTitle?: string;
  isNl?: boolean;
};

const PRINTER_MODELS = [
  "Epson ColorWorks C3500",
  "Epson ColorWorks C6000",
  "Epson ColorWorks C6500",
  "Epson ColorWorks C7500",
  "Epson ColorWorks C8000",
  "Epson ColorWorks C8000e",
  "Epson TM-C3400",
  "Epson TM-C3500",
  "Canon PIXMA",
  "Canon imagePROGRAF",
  "HP DesignJet",
  "HP Indigo",
  "Zebra ZT410",
  "Zebra ZT610",
  "Zebra ZT620",
  "Other",
];

export default function IccProfileModal({ materialTitle, isNl = false }: IccProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [form, setForm] = useState({
    printerModel: "",
    email: "",
    companyName: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.close();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!isInside) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSubmitted(false);
    setErrors({});
    setForm({ printerModel: "", email: "", companyName: "", phone: "" });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.printerModel) newErrors.printerModel = isNl ? "Selecteer een printermodel" : "Please select a printer model";
    if (!form.email) newErrors.email = isNl ? "Vul uw e-mailadres in" : "Please enter your email address";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = isNl ? "Ongeldig e-mailadres" : "Invalid email address";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/icc-profile-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerModel: form.printerModel,
          email: form.email,
          companyName: form.companyName,
          phone: form.phone,
          materialTitle,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = (await res.json()) as { message?: string };
        setErrors({ submit: data.message ?? (isNl ? 'Er is iets misgegaan. Probeer het opnieuw.' : 'Something went wrong. Please try again.') });
      }
    } catch {
      setErrors({ submit: isNl ? 'Verbindingsfout. Controleer uw internetverbinding.' : 'Connection error. Please check your internet connection.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-3 inline-block text-sm font-semibold text-[#f08500] underline hover:text-orange-700 transition-colors"
      >
        {isNl ? "ICC-profiel aanvragen" : "Request ICC Profile"}
      </button>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        onClose={handleClose}
        className="m-auto max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm open:animate-in"
        style={{
          border: "none",
        }}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between p-7 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isNl ? "ICC-profiel aanvragen" : "Request ICC Profile"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isNl
                  ? "We sturen u uw profiel binnen 1 werkdag per e-mail."
                  : "We'll email your profile within 1 business day."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-7 pb-7">
            {submitted ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {isNl ? "Aanvraag verstuurd!" : "Request sent!"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {isNl
                      ? `We sturen het ICC-profiel naar ${form.email}.`
                      : `We'll send the ICC profile to ${form.email}.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-2 rounded-full bg-[#f08500] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#d97706]"
                >
                  {isNl ? "Sluiten" : "Close"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                {/* Material context (read-only if provided) */}
                {materialTitle && (
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-800">
                      {isNl ? "Materiaal" : "Material"}
                    </label>
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-600">
                      {materialTitle}
                    </div>
                  </div>
                )}

                {/* Printer model */}
                <div>
                  <label htmlFor="icc-printer-model" className="mb-1.5 block text-sm font-bold text-slate-800">
                    {isNl ? "Printermodel" : "Printer model"}
                  </label>
                  <div className="relative">
                    <select
                      id="icc-printer-model"
                      value={form.printerModel}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, printerModel: e.target.value }));
                        setErrors((er) => ({ ...er, printerModel: "" }));
                      }}
                      className={`w-full appearance-none rounded-full border bg-white px-5 py-3 pr-10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#f08500]/30 ${
                        errors.printerModel
                          ? "border-red-400 text-red-600"
                          : form.printerModel
                          ? "border-slate-300 text-slate-800"
                          : "border-slate-200 text-slate-400"
                      }`}
                    >
                      <option value="" disabled>
                        {isNl ? "Selecteer uw printermodel" : "Select your printer model"}
                      </option>
                      {PRINTER_MODELS.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </div>
                  {errors.printerModel && (
                    <p className="mt-1 pl-4 text-xs text-red-500">{errors.printerModel}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="icc-email" className="mb-1.5 block text-sm font-bold text-slate-800">
                    {isNl ? "Uw e-mailadres" : "Your email address"}
                  </label>
                  <input
                    id="icc-email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, email: e.target.value }));
                      setErrors((er) => ({ ...er, email: "" }));
                    }}
                    className={`w-full rounded-full border px-5 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#f08500]/30 ${
                      errors.email ? "border-red-400" : "border-slate-200"
                    } placeholder:text-slate-400`}
                  />
                  {errors.email && (
                    <p className="mt-1 pl-4 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Company name */}
                <div>
                  <label htmlFor="icc-company" className="mb-1.5 block text-sm font-bold text-slate-800">
                    {isNl ? "Bedrijfsnaam" : "Company name"}
                    <span className="ml-1 font-normal text-slate-400">({isNl ? "optioneel" : "optional"})</span>
                  </label>
                  <input
                    id="icc-company"
                    type="text"
                    placeholder={isNl ? "Uw bedrijfsnaam" : "Your company name"}
                    value={form.companyName}
                    onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                    className="w-full rounded-full border border-slate-200 px-5 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f08500]/30 transition-colors"
                  />
                </div>

                {/* Phone number */}
                <div>
                  <label htmlFor="icc-phone" className="mb-1.5 block text-sm font-bold text-slate-800">
                    {isNl ? "Telefoonnummer" : "Phone number"}
                    <span className="ml-1 font-normal text-slate-400">({isNl ? "optioneel" : "optional"})</span>
                  </label>
                  <input
                    id="icc-phone"
                    type="tel"
                    placeholder={isNl ? "+31 6 00 00 00 00" : "+1 (555) 000-0000"}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-full border border-slate-200 px-5 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f08500]/30 transition-colors"
                  />
                </div>

                {/* Submit-level error (from server) */}
                {errors.submit && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errors.submit}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-full bg-[#f08500] py-4 text-base font-semibold text-white shadow-sm transition-all hover:bg-[#d97706] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                      </svg>
                      {isNl ? "Versturen..." : "Sending..."}
                    </span>
                  ) : isNl ? (
                    "Aanvraag versturen"
                  ) : (
                    "Send Request"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </dialog>

      <style>{`
        dialog[open] {
          animation: dialog-in 0.2s ease-out;
        }
        dialog::backdrop {
          animation: backdrop-in 0.2s ease-out;
        }
        @keyframes dialog-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}
