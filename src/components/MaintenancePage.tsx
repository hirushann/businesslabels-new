import React from 'react';

export default function MaintenancePage() {
  return (
    <>
      <style>{`
        :root {
          --maintenance-accent:        #1B5FA8;
          --maintenance-accent-dark:   #14497f;
          --maintenance-ink:           #10233D;
          --maintenance-muted:         #5A6B80;
          --maintenance-liner:         #EBEFF4;
          --maintenance-liner-2:       #DFE5EC;
          --maintenance-label:         #FFFFFF;
          --maintenance-hairline:      #D7DEE7;
          --maintenance-measure:       46ch;
          --maintenance-radius:        14px;
        }

        .maintenance-wrapper {
          min-height: 100vh;
          margin: 0;
          padding: 40px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(120% 80% at 50% 0%, #F6F8FB 0%, var(--maintenance-liner) 55%, var(--maintenance-liner-2) 100%);
          font-family: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          color: var(--maintenance-ink);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          box-sizing: border-box;
        }

        .maintenance-stage {
          width: 100%;
          max-width: 600px;
          text-align: center;
        }

        .maintenance-brand {
          margin-bottom: 34px;
        }

        .maintenance-brand img {
          height: 44px;
          width: auto;
          max-width: 260px;
          object-fit: contain;
        }

        .maintenance-slot {
          height: 7px;
          margin: 0 auto -3px;
          width: min(100%, 560px);
          border-radius: 99px;
          background: linear-gradient(180deg, var(--maintenance-liner-2), #C7D0DB);
          box-shadow: inset 0 1px 2px rgba(16,35,61,.18);
        }

        .maintenance-label {
          position: relative;
          background: var(--maintenance-label);
          border-radius: var(--maintenance-radius);
          padding: 44px 38px 40px;
          box-shadow:
            0 1px 0 rgba(16,35,61,.04),
            0 18px 40px -18px rgba(16,35,61,.28);
          animation: print .9s cubic-bezier(.22,.61,.36,1) both;
        }

        .maintenance-label::before,
        .maintenance-label::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--maintenance-liner);
          transform: translateY(-50%);
        }
        .maintenance-label::before { left: -9px; }
        .maintenance-label::after { right: -9px; }

        @keyframes print {
          from { clip-path: inset(100% 0 0 0); }
          to {   clip-path: inset(0 0 0 0); }
        }

        .maintenance-registration {
          display: flex;
          gap: 3px;
          justify-content: center;
          margin-bottom: 26px;
        }
        .maintenance-registration span {
          width: 22px;
          height: 5px;
          border-radius: 2px;
        }
        .maintenance-registration span:nth-child(1) { background: #00A6D6; }
        .maintenance-registration span:nth-child(2) { background: #D6006E; }
        .maintenance-registration span:nth-child(3) { background: #F5C400; }
        .maintenance-registration span:nth-child(4) { background: var(--maintenance-ink); }

        .maintenance-h1 {
          margin: 0 0 14px;
          font-size: clamp(1.6rem, 4.4vw, 2.125rem);
          font-weight: 600;
          letter-spacing: -0.025em;
          line-height: 1.2;
          color: var(--maintenance-ink);
        }

        .maintenance-lead {
          margin: 0 auto 10px;
          max-width: var(--maintenance-measure);
          font-size: 1.0625rem;
          line-height: 1.65;
          color: var(--maintenance-muted);
        }

        .maintenance-lead-en {
          margin: 0 auto;
          max-width: var(--maintenance-measure);
          font-size: .9375rem;
          line-height: 1.6;
          color: #8494A6;
        }

        .maintenance-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
          margin-top: 30px;
          padding-top: 28px;
          border-top: 1px dashed var(--maintenance-hairline);
        }

        .maintenance-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          padding: 0 22px;
          border-radius: 9px;
          font-size: .9375rem;
          font-weight: 500;
          text-decoration: none;
          transition: background-color .18s ease, border-color .18s ease, color .18s ease;
        }

        .maintenance-btn-primary {
          background: var(--maintenance-accent);
          color: #fff;
        }
        .maintenance-btn-primary:hover {
          background: var(--maintenance-accent-dark);
        }

        .maintenance-btn-secondary {
          border: 1px solid var(--maintenance-hairline);
          color: var(--maintenance-ink);
        }
        .maintenance-btn-secondary:hover {
          border-color: var(--maintenance-accent);
          color: var(--maintenance-accent);
        }

        .maintenance-btn:focus-visible {
          outline: 2px solid var(--maintenance-accent);
          outline-offset: 3px;
        }

        .maintenance-hours {
          margin: 22px 0 0;
          font-size: .875rem;
          color: #8494A6;
        }

        .maintenance-footer {
          margin-top: 30px;
          font-size: .8125rem;
          line-height: 1.7;
          color: #8494A6;
        }
        .maintenance-footer a {
          color: var(--maintenance-muted);
          text-decoration: none;
        }
        .maintenance-footer a:hover {
          text-decoration: underline;
        }
        .maintenance-footer a:focus-visible {
          outline: 2px solid var(--maintenance-accent);
          outline-offset: 2px;
        }

        @media (max-width: 480px) {
          .maintenance-label { padding: 36px 24px 32px; }
          .maintenance-btn { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .maintenance-label { animation: none; }
        }
      `}</style>

      <div className="maintenance-wrapper">
        <main className="maintenance-stage">
          <div className="maintenance-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Businesslabels" />
          </div>

          <div className="maintenance-slot" aria-hidden="true" />

          <section className="maintenance-label">
            <div className="maintenance-registration" aria-hidden="true">
              <span /><span /><span /><span />
            </div>

            <h1 className="maintenance-h1">De webshop is even offline</h1>

            <p className="maintenance-lead">
              We voeren onderhoud uit aan Businesslabels. Bestellen kan binnenkort weer.
              Heb je labels, inkt of advies nodig? Bel of mail ons — we helpen je gewoon verder.
            </p>

            <p className="maintenance-lead-en">
              We&apos;re carrying out maintenance. Call or email us and we&apos;ll help you right away.
            </p>

            <div className="maintenance-actions">
              <a className="maintenance-btn maintenance-btn-primary" href="tel:+31318590465">
                Bel +31 318 590 465
              </a>
              <a className="maintenance-btn maintenance-btn-secondary" href="mailto:verkoop@businesslabels.nl">
                Mail verkoop@businesslabels.nl
              </a>
            </div>

            <p className="maintenance-hours">Bereikbaar op werkdagen van 08:30 tot 17:00</p>
          </section>

          <footer className="maintenance-footer">
            Businesslabels is onderdeel van <a href="https://www.smart2b.nl" target="_blank" rel="noopener noreferrer">Smart2B BV</a><br />
            © 2026 Businesslabels. Alle rechten voorbehouden.
          </footer>
        </main>
      </div>
    </>
  );
}
