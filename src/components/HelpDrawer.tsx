'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

interface HelpDrawerProps {
  onClose: () => void;
}

const europeanCountries = [
  { name: 'Albania', code: 'AL', dialCode: '+355' },
  { name: 'Andorra', code: 'AD', dialCode: '+376' },
  { name: 'Austria', code: 'AT', dialCode: '+43' },
  { name: 'Belarus', code: 'BY', dialCode: '+375' },
  { name: 'Belgium', code: 'BE', dialCode: '+32' },
  { name: 'Bosnia and Herzegovina', code: 'BA', dialCode: '+387' },
  { name: 'Bulgaria', code: 'BG', dialCode: '+359' },
  { name: 'Croatia', code: 'HR', dialCode: '+385' },
  { name: 'Cyprus', code: 'CY', dialCode: '+357' },
  { name: 'Czech Republic', code: 'CZ', dialCode: '+420' },
  { name: 'Denmark', code: 'DK', dialCode: '+45' },
  { name: 'Estonia', code: 'EE', dialCode: '+372' },
  { name: 'Finland', code: 'FI', dialCode: '+358' },
  { name: 'France', code: 'FR', dialCode: '+33' },
  { name: 'Germany', code: 'DE', dialCode: '+49' },
  { name: 'Greece', code: 'GR', dialCode: '+30' },
  { name: 'Hungary', code: 'HU', dialCode: '+36' },
  { name: 'Iceland', code: 'IS', dialCode: '+354' },
  { name: 'Ireland', code: 'IE', dialCode: '+353' },
  { name: 'Italy', code: 'IT', dialCode: '+39' },
  { name: 'Latvia', code: 'LV', dialCode: '+371' },
  { name: 'Liechtenstein', code: 'LI', dialCode: '+423' },
  { name: 'Lithuania', code: 'LT', dialCode: '+370' },
  { name: 'Luxembourg', code: 'LU', dialCode: '+352' },
  { name: 'Malta', code: 'MT', dialCode: '+356' },
  { name: 'Moldova', code: 'MD', dialCode: '+373' },
  { name: 'Monaco', code: 'MC', dialCode: '+377' },
  { name: 'Montenegro', code: 'ME', dialCode: '+382' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31' },
  { name: 'North Macedonia', code: 'MK', dialCode: '+389' },
  { name: 'Norway', code: 'NO', dialCode: '+47' },
  { name: 'Poland', code: 'PL', dialCode: '+48' },
  { name: 'Portugal', code: 'PT', dialCode: '+351' },
  { name: 'Romania', code: 'RO', dialCode: '+40' },
  { name: 'San Marino', code: 'SM', dialCode: '+378' },
  { name: 'Serbia', code: 'RS', dialCode: '+381' },
  { name: 'Slovakia', code: 'SK', dialCode: '+421' },
  { name: 'Slovenia', code: 'SI', dialCode: '+386' },
  { name: 'Spain', code: 'ES', dialCode: '+34' },
  { name: 'Sweden', code: 'SE', dialCode: '+46' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41' },
  { name: 'Ukraine', code: 'UA', dialCode: '+380' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
  { name: 'Vatican City', code: 'VA', dialCode: '+379' },
];

const schedule = [
  { day: 'Monday', hours: '08:00 - 17:30', active: false },
  { day: 'Tuesday', hours: '08:00 - 17:30', active: true },
  { day: 'Wednesday', hours: '08:00 - 17:30', active: true },
  { day: 'Thursday', hours: '08:00 - 17:30', active: true },
  { day: 'Friday', hours: '08:00 - 17:30', active: false },
  { day: 'Saturday', hours: '08:00 - 17:30', active: true }
];

function CollapseIcon({ open }: { open: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
      {open
        ? <path d="M5 12h14" stroke="#f59e0b" strokeWidth="1.33" strokeLinecap="round" />
        : <path d="M12 5v14M5 12h14" stroke="#f59e0b" strokeWidth="1.33" strokeLinecap="round" />}
    </svg>
  );
}

export default function HelpDrawer({ onClose }: HelpDrawerProps) {
  const [callbackOpen, setCallbackOpen] = useState(true);
  const [moreWaysOpen, setMoreWaysOpen] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [messageOpen, setMessageOpen] = useState(true);
  const [selectedCountryCode, setSelectedCountryCode] = useState('NL');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [bookingMessage, setBookingMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [contactStatusMessage, setContactStatusMessage] = useState('');

  const selectedCountry = europeanCountries.find((country) => country.code === selectedCountryCode) ?? europeanCountries[0];

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const resetBookingForm = () => {
    setPhoneNumber('');
    setBookingStatus('idle');
    setBookingMessage('');
  };

  const handleBookingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPhoneNumber = phoneNumber.trim();

    if (!normalizedPhoneNumber) {
      setBookingStatus('error');
      setBookingMessage('Please enter your phone number.');
      return;
    }

    setBookingStatus('submitting');
    setBookingMessage('');

    try {
      const response = await fetch('/api/drawer-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          country: selectedCountry.name,
          country_code: selectedCountry.code,
          dial_code: selectedCountry.dialCode,
          phone_number: normalizedPhoneNumber,
          full_phone_number: `${selectedCountry.dialCode}${normalizedPhoneNumber.replace(/^0+/, '')}`,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof data.message === 'string'
            ? data.message
            : 'We could not book your callback. Please try again.';

        throw new Error(message);
      }

      setBookingStatus('success');
      setBookingMessage(
        typeof data.message === 'string'
          ? data.message
          : 'Your callback request has been sent.'
      );
      setPhoneNumber('');
    } catch (error) {
      setBookingStatus('error');
      setBookingMessage(error instanceof Error ? error.message : 'We could not book your callback. Please try again.');
    }
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = contactEmail.trim();
    const normalizedMessage = contactMessage.trim();

    if (!normalizedEmail || !normalizedMessage) {
      setContactStatus('error');
      setContactStatusMessage('Please enter your email address and message.');
      return;
    }

    setContactStatus('submitting');
    setContactStatusMessage('');

    try {
      const response = await fetch('/api/drawer-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          message: normalizedMessage,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof data.message === 'string'
            ? data.message
            : 'We could not send your message. Please try again.';

        throw new Error(message);
      }

      setContactStatus('success');
      setContactStatusMessage(
        typeof data.message === 'string'
          ? data.message
          : 'Your message has been sent.'
      );
      setContactEmail('');
      setContactMessage('');
    } catch (error) {
      setContactStatus('error');
      setContactStatusMessage(error instanceof Error ? error.message : 'We could not send your message. Please try again.');
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-[999]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Need Help"
        className="fixed top-0 right-0 h-full w-[480px] bg-white z-[1000] shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.28s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* ── Header ─────────────────────────── */}
        <div className="shrink-0 p-6 bg-slate-100 flex flex-col gap-8">
          {/* Title + close */}
          <div className="flex justify-between items-start">
            <h2 className="text-neutral-800 text-2xl font-semibold font-['Segoe_UI'] leading-7">
              Need help?
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Avatars + contact cards */}
          <div className="flex flex-col gap-4">
            {/* Avatars */}
            <div className="flex items-center gap-4 justify-center">
              {[
                'https://randomuser.me/api/portraits/men/32.jpg',
                'https://randomuser.me/api/portraits/men/44.jpg',
                'https://randomuser.me/api/portraits/men/68.jpg',
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Support agent"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                />
              ))}
            </div>

            {/* Call + Email cards */}
            <div className="flex gap-3">
              {/* Call */}
              <a
                href="tel:+310318590465"
                className="flex-1 h-16 p-2.5 bg-white rounded-xl border border-slate-100 flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15.46l-5.27-.61-2.52 2.52a15.05 15.05 0 01-6.59-6.59l2.53-2.53L8.54 3H3.03C2.45 13.18 10.82 21.55 21 20.97l.0-5.51z" fill="white" />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-neutral-800 text-base font-semibold font-['Segoe_UI'] leading-5">Call</span>
                  <span className="text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5">+31 (0)318 590 465</span>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:verkoop@businesslabels.nl"
                className="flex-1 h-16 p-2.5 bg-white rounded-xl border border-slate-100 flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="20" height="16" rx="2" fill="white" />
                    <path d="M2 7l10 7 10-7" stroke="#f59e0b" strokeWidth="1.5" />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-neutral-800 text-base font-semibold font-['Segoe_UI'] leading-5">Email</span>
                  <span className="text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5">verkoop@businesslabels.nl</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ─────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-5 py-5">

          {/* ── Request a Call Back ── */}
          <div className="flex flex-col gap-4">
            <button
              className="flex justify-between items-center w-full text-left"
              onClick={() => setCallbackOpen(v => !v)}
            >
              <span className="text-neutral-800 text-lg font-normal font-['Segoe_UI'] leading-6">
                Request a Call Back from Our Team
              </span>
              <CollapseIcon open={callbackOpen} />
            </button>

            {callbackOpen && (
              <div className="flex flex-col gap-4">
                {/* Time slot */}
                {/* <div className="p-6 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] border border-slate-100 flex flex-col items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-800 text-xl font-semibold font-['Segoe_UI'] leading-7">
                      Tuesday, 10:15 - 10:30
                    </span>
                    <span className="px-4 py-0.5 bg-slate-100 rounded-full text-neutral-800 text-xs font-semibold font-['Segoe_UI']">
                      Central European Time
                    </span>
                  </div>
                  <span className="text-amber-500 text-base font-semibold font-['Segoe_UI'] underline cursor-pointer hover:text-amber-600 transition-colors">
                    Choose a different time slot
                  </span>
                </div> */}

                <form className="flex flex-col gap-4" onSubmit={handleBookingSubmit}>
                  {/* Phone country */}
                  <label className="flex flex-col gap-2">
                    <span className="sr-only">Country</span>
                    <select
                      value={selectedCountryCode}
                      onChange={(event) => {
                        setSelectedCountryCode(event.target.value);
                        setBookingStatus('idle');
                        setBookingMessage('');
                      }}
                      className="h-11 px-5 py-2 rounded-xl border border-zinc-200 outline-none text-neutral-700 text-base font-normal font-['Segoe_UI'] bg-white focus:border-amber-400 transition-colors w-full"
                    >
                      {europeanCountries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name} ({country.dialCode})
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Mobile number */}
                  <label className="flex flex-col gap-2">
                    <span className="sr-only">Your mobile number</span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(event) => {
                        setPhoneNumber(event.target.value);
                        setBookingStatus('idle');
                        setBookingMessage('');
                      }}
                      placeholder="Your mobile number"
                      autoComplete="tel"
                      className="h-11 px-5 py-2 rounded-xl border border-zinc-200 outline-none text-neutral-700 text-base font-normal font-['Segoe_UI'] placeholder-neutral-400 focus:border-amber-400 transition-colors w-full"
                    />
                  </label>

                  {bookingMessage && (
                    <p
                      role={bookingStatus === 'error' ? 'alert' : 'status'}
                      className={`text-sm font-normal font-['Segoe_UI'] text-center ${
                        bookingStatus === 'error' ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {bookingMessage}
                    </p>
                  )}

                  {/* Customer number */}
                  {/* <div className="h-11 px-5 py-2 rounded-xl border border-zinc-200 flex justify-between items-center">
                    <span className="text-neutral-400 text-base font-normal font-['Segoe_UI']">Your customer number</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-neutral-700 text-[10px] font-normal font-['Segoe_UI']">
                      Optional
                    </span>
                  </div> */}

                  {/* Info note */}
                  {/* <div className="flex items-start gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
                      <circle cx="8" cy="8" r="7" stroke="#a1a1aa" strokeWidth="1.2" />
                      <path d="M8 7v4M8 5.5v.5" stroke="#a1a1aa" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <span className="text-neutral-700 text-sm font-normal font-['Segoe_UI']">
                      Please have your customer or order number at hand, if available
                    </span>
                  </div> */}

                  {/* Buttons */}
                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={bookingStatus === 'submitting'}
                      className="w-24 h-12 px-4 py-2.5 bg-amber-500 rounded-full text-white text-base font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {bookingStatus === 'submitting' ? 'Booking' : 'Book'}
                    </button>
                    <button
                      type="button"
                      onClick={resetBookingForm}
                      className="w-24 h-12 px-4 py-2.5 bg-zinc-500/10 rounded-full text-zinc-500 text-base font-semibold font-['Segoe_UI'] leading-6 hover:bg-zinc-500/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-100" />

          {/* ── More Ways to Reach Our Team ── */}
          <div className="flex flex-col gap-4">
            <button
              className="flex justify-between items-center w-full text-left"
              onClick={() => setMoreWaysOpen(v => !v)}
            >
              <span className="text-neutral-800 text-lg font-normal font-['Segoe_UI'] leading-6">
                More Ways to Reach Our Team
              </span>
              <CollapseIcon open={moreWaysOpen} />
            </button>

            {moreWaysOpen && (
              <div className="flex flex-col gap-4">
                {/* <div className="flex flex-col gap-1">
                  <span className="text-neutral-800 text-base font-semibold font-['Segoe_UI']">FAX</span>
                  <span className="text-neutral-700 text-sm font-normal font-['Segoe_UI']">+31-1111-1111-11</span>
                </div> */}
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-800 text-base font-semibold font-['Segoe_UI']">ADDRESS</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-700 text-sm font-normal font-['Segoe_UI']">Lenderinkweg 8,</span>
                    <span className="text-neutral-700 text-sm font-normal font-['Segoe_UI']">6733 AX Wekerom</span>
                    <span className="text-neutral-700 text-sm font-normal font-['Segoe_UI']">Netherlands</span>
                  </div>
                </div>
                {/* <span className="text-amber-500 text-base font-semibold font-['Segoe_UI'] underline cursor-pointer hover:text-amber-600 transition-colors">
                  All Contacts
                </span> */}
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-100" />

          {/* ── Team Availability Schedule ── */}
          <div className="flex flex-col gap-4">
            <button
              className="flex justify-between items-center w-full text-left"
              onClick={() => setScheduleOpen(v => !v)}
            >
              <span className="text-neutral-800 text-lg font-normal font-['Segoe_UI'] leading-6">
                Check When Our Team Is Available (+2)
              </span>
              <CollapseIcon open={scheduleOpen} />
            </button>

            {scheduleOpen && (
              <div className="flex flex-col gap-4">
                <div className="w-56 flex flex-col gap-2">
                  {schedule.map(({ day, hours, active }) => (
                    <div key={day} className="flex justify-between items-center">
                      <span className={`text-sm font-normal font-['Segoe_UI'] ${active ? 'text-neutral-800' : 'text-zinc-500'}`}>
                        {day}
                      </span>
                      <span className={`text-sm font-normal font-['Segoe_UI'] ${active ? 'text-neutral-800' : 'text-zinc-500'}`}>
                        {hours}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-neutral-700 text-sm font-normal font-['Segoe_UI']">
                  Thank you for your understanding. We respond to inquiries during our working hours only.
                </p>
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-100" />

          {/* ── Drop Us a Message ── */}
          <div className="flex flex-col gap-4 pb-6">
            <button
              className="flex justify-between items-center w-full text-left"
              onClick={() => setMessageOpen(v => !v)}
            >
              <span className="text-neutral-800 text-lg font-normal font-['Segoe_UI'] leading-6">
                Drop Us a Message
              </span>
              <CollapseIcon open={messageOpen} />
            </button>

            {messageOpen && (
              <form className="flex flex-col gap-3" onSubmit={handleContactSubmit}>
                <p className="text-neutral-700 text-sm font-normal font-['Segoe_UI']">
                  Please leave a message and we will contact you as soon as possible.
                </p>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => {
                    setContactEmail(event.target.value);
                    setContactStatus('idle');
                    setContactStatusMessage('');
                  }}
                  placeholder="Your Email Address"
                  autoComplete="email"
                  className="h-11 px-5 py-2 rounded-xl border border-zinc-200 outline-none text-neutral-700 text-base font-normal font-['Segoe_UI'] placeholder-neutral-400 focus:border-amber-400 transition-colors w-full"
                />
                <textarea
                  value={contactMessage}
                  onChange={(event) => {
                    setContactMessage(event.target.value);
                    setContactStatus('idle');
                    setContactStatusMessage('');
                  }}
                  placeholder="Write your message here..."
                  rows={4}
                  className="px-3 py-2 rounded-xl border border-zinc-200 outline-none text-neutral-700 text-sm font-normal font-['Segoe_UI'] placeholder-neutral-400 focus:border-amber-400 transition-colors w-full resize-none"
                />
                {contactStatusMessage && (
                  <p
                    role={contactStatus === 'error' ? 'alert' : 'status'}
                    className={`text-sm font-normal font-['Segoe_UI'] ${
                      contactStatus === 'error' ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {contactStatusMessage}
                  </p>
                )}
                <div>
                  <button
                    type="submit"
                    disabled={contactStatus === 'submitting'}
                    className="w-36 h-12 px-4 py-2.5 bg-amber-500 rounded-full text-white text-base font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {contactStatus === 'submitting' ? 'Sending' : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="h-px bg-slate-100" />
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
