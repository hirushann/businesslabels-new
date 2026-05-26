"use client";

import { ArrowRight, MessageCircle, Phone, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useHelp } from "@/components/HelpProvider";

/**
 * The "Still in doubt? — Contact our experts" CTA at the bottom of every
 * FAQ page. The button opens the site-wide contact drawer (HelpDrawer)
 * via the same provider the header uses, so editors don't need to wire
 * anything up — the page just gets the existing contact flow for free.
 */
export function FaqSupportCta({ title, text }: { title: string; text: string }) {
  const { openHelp } = useHelp();
  const t = useTranslations("faqPage");

  return (
    <section className="relative isolate overflow-hidden bg-sky-950 py-24 text-white sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='2' cy='2' r='1.5' fill='white'/></svg>\")",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-400 ring-1 ring-amber-400/30">
              <MessageCircle className="h-3.5 w-3.5" />
              {t("stillNeedHelp")}
            </span>
            <h2 className="mt-6 text-4xl font-black uppercase tracking-tight drop-shadow-sm sm:text-5xl lg:text-6xl">
              {title}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-sky-100/80">
              {text}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={openHelp}
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-amber-500 px-8 py-4 text-base font-bold uppercase tracking-tight text-sky-950 shadow-xl shadow-amber-500/30 ring-1 ring-amber-400 transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-400 hover:shadow-2xl hover:shadow-amber-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sky-950"
              >
                {t("contactExperts")}
                <ArrowRight
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.5}
                />
              </button>
              <span className="text-sm text-white/60">
                {t("avgResponse")}
              </span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <a
                href="tel:0031318590465"
                className="group flex flex-col gap-3 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:ring-amber-400/50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-400/30">
                  <Phone className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                    {t("callUs")}
                  </p>
                  <p className="mt-1 text-base font-bold text-white">
                    +31 318 590 465
                  </p>
                </div>
              </a>

              <a
                href="mailto:verkoop@businesslabels.nl"
                className="group flex flex-col gap-3 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:ring-amber-400/50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-400/30">
                  <Mail className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                    {t("email")}
                  </p>
                  <p className="mt-1 text-base font-bold text-white">
                    verkoop@businesslabels.nl
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
