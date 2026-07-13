'use client';

import type { FormEvent } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { ReCAPTCHA, ReCAPTCHARef } from './ui/ReCAPTCHA';
import LocaleLink from './LocaleLink';

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

type AvailabilityResponse = {
  data?: unknown;
};

type AvailabilitySlot = {
  date: string;
  is_fully_unavailable: boolean;
  unavailable_start_time: string | null;
  unavailable_end_time: string | null;
};

type TeamMember = {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string | null;
  profile_pic_url: string | null;
  sort_order: number;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(source: unknown, keys: string[]) {
  if (!isPlainObject(source)) return '';

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function extractAuthUser(value: unknown): Record<string, unknown> | null {
  if (!isPlainObject(value)) return null;

  if (isPlainObject(value.user)) return value.user;
  if (isPlainObject(value.data)) {
    if (isPlainObject(value.data.user)) return value.data.user;
    return value.data;
  }
  if (isPlainObject(value.customer)) return value.customer;
  if (isPlainObject(value.auth) && isPlainObject(value.auth.user)) return value.auth.user;

  return value;
}

function getStoredAuthUser() {
  if (typeof window === 'undefined') return null;

  const storedUser = window.localStorage.getItem('auth_user');
  if (!storedUser) return null;

  try {
    return extractAuthUser(JSON.parse(storedUser));
  } catch (error) {
    console.error('Failed to parse auth_user for help drawer autofill:', error);
    return null;
  }
}

function getAuthUserString(keys: string[]) {
  return readString(getStoredAuthUser(), keys);
}

const WORKING_HOURS = '08:00 - 17:30';
const UNAVAILABLE_LABEL = 'Unavailable';
const BUSINESS_START_TIME = '08:00';
const BUSINESS_END_TIME = '17:30';
function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatScheduleDate(dateKey: string) {
  const [, month, day] = dateKey.split('-').map(Number);

  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`;
}

function formatTimeSlot(time: string | null) {
  return time ? time.slice(0, 5) : null;
}

function isAvailabilitySlot(value: unknown): value is AvailabilitySlot {
  if (!value || typeof value !== 'object') return false;

  const slot = value as Partial<AvailabilitySlot>;

  return (
    typeof slot.date === 'string' &&
    typeof slot.is_fully_unavailable === 'boolean' &&
    (typeof slot.unavailable_start_time === 'string' || slot.unavailable_start_time === null) &&
    (typeof slot.unavailable_end_time === 'string' || slot.unavailable_end_time === null)
  );
}

function getAvailabilityHours(slot: AvailabilitySlot | undefined) {
  if (!slot || slot.is_fully_unavailable) {
    return UNAVAILABLE_LABEL;
  }

  const unavailableStart = formatTimeSlot(slot.unavailable_start_time);
  const unavailableEnd = formatTimeSlot(slot.unavailable_end_time);

  if (!unavailableStart || !unavailableEnd) {
    return WORKING_HOURS;
  }

  const availableSlots = [
    `${BUSINESS_START_TIME} - ${unavailableStart}`,
    `${unavailableEnd} - ${BUSINESS_END_TIME}`,
  ];

  return availableSlots.join(', ');
}

function getCurrentWeekSchedule(availabilityByDate: Map<string, AvailabilitySlot>, locale: string) {
  const today = new Date();
  const monday = new Date(today);
  const dayOfWeek = today.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - daysSinceMonday);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(today.getDate() + index);

    const dateKey = toLocalDateKey(date);
    const hours = getAvailabilityHours(availabilityByDate.get(dateKey));
    const active = hours !== UNAVAILABLE_LABEL;

    const dayName = date.toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'long' });
    const formattedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    return {
      date: dateKey,
      day: formattedDay,
      hours,
      active,
    };
  });
}

function CollapseIcon({ open }: { open: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
      {open
        ? <path d="M5 12h14" stroke="#F18800" strokeWidth="1.33" strokeLinecap="round" />
        : <path d="M12 5v14M5 12h14" stroke="#444444" strokeWidth="1.33" strokeLinecap="round" />}
    </svg>
  );
}

export default function HelpDrawer({ onClose }: HelpDrawerProps) {
  const t = useTranslations();
  const locale = useLocale();
  const formLocale = locale === 'nl' ? 'nl' : 'en';
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const toggleSection = (id: string) => setActiveSection(prev => prev === id ? null : id);
  const callbackOpen = activeSection === 'callback';
  const moreWaysOpen = activeSection === 'moreWays';
  const scheduleOpen = activeSection === 'schedule';
  const messageOpen = activeSection === 'message';
  const [selectedCountryCode, setSelectedCountryCode] = useState('NL');
  const [phoneNumber, setPhoneNumber] = useState(() =>
    getAuthUserString(['phone', 'telephone', 'mobile', 'mobile_number', 'mobileNumber'])
  );
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [bookingMessage, setBookingMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(() =>
    getAuthUserString(['email', 'billing_email'])
  );
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [contactStatusMessage, setContactStatusMessage] = useState('');
  const [availabilityByDate, setAvailabilityByDate] = useState<Map<string, AvailabilitySlot>>(() => new Map());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const bookingRecaptchaRef = useRef<ReCAPTCHARef>(null);
  const contactRecaptchaRef = useRef<ReCAPTCHARef>(null);
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
  const shouldBypassRecaptcha = process.env.NODE_ENV === 'development' && !recaptchaSiteKey;

  const selectedCountry = europeanCountries.find((country) => country.code === selectedCountryCode) ?? europeanCountries[0];
  const schedule = getCurrentWeekSchedule(availabilityByDate, locale);
  const displayMembers = teamMembers.length > 0 ? teamMembers.slice(0, 6) : [
    { id: 1, name: t('helpDrawer.fallbackAgent', { num: 1 }), profile_pic_url: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 2, name: t('helpDrawer.fallbackAgent', { num: 2 }), profile_pic_url: 'https://randomuser.me/api/portraits/men/44.jpg' },
    { id: 3, name: t('helpDrawer.fallbackAgent', { num: 3 }), profile_pic_url: 'https://randomuser.me/api/portraits/men/68.jpg' },
    { id: 4, name: t('helpDrawer.fallbackAgent', { num: 4 }), profile_pic_url: 'https://randomuser.me/api/portraits/women/12.jpg' },
    { id: 5, name: t('helpDrawer.fallbackAgent', { num: 5 }), profile_pic_url: 'https://randomuser.me/api/portraits/women/24.jpg' },
    { id: 6, name: t('helpDrawer.fallbackAgent', { num: 6 }), profile_pic_url: 'https://randomuser.me/api/portraits/women/45.jpg' },
  ];

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

  useEffect(() => {
    let ignore = false;

    async function loadAvailability() {
      try {
        const response = await fetch('/api/availabilities', {
          headers: {
            'Accept': 'application/json',
          },
        });
        const data = (await response.json().catch(() => ({}))) as AvailabilityResponse & { message?: unknown };

        if (!response.ok) {
          throw new Error(typeof data === 'object' && data && 'message' in data && typeof data.message === 'string'
            ? data.message
            : t('helpDrawer.callback.errorBookingFailed')
          );
        }

        const availabilitySlots = Array.isArray(data.data)
          ? data.data.filter(isAvailabilitySlot)
          : [];

        if (!ignore) {
          setAvailabilityByDate(new Map(availabilitySlots.map((slot) => [slot.date, slot])));
        }
      } catch (error) {
        console.error('Error loading availability schedule:', error);

        if (!ignore) {
          setAvailabilityByDate(new Map());
        }
      }
    }

    loadAvailability();

    return () => {
      ignore = true;
    };
  }, [t]);

  // Load team members
  useEffect(() => {
    let ignore = false;

    async function loadTeamMembers() {
      try {
        const response = await fetch('/api/team-members', {
          headers: {
            'Accept': 'application/json',
          },
        });
        const data = await response.json();
        const members = Array.isArray(data.data) ? data.data : [];

        if (!ignore) {
          setTeamMembers(members);
        }
      } catch (error) {
        console.error('Error loading team members:', error);
      }
    }

    loadTeamMembers();

    return () => {
      ignore = true;
    };
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
      setBookingMessage(t('help.errorPhone'));
      return;
    }

    setBookingStatus('submitting');
    setBookingMessage('');

    let recaptchaToken = shouldBypassRecaptcha ? 'development-recaptcha-bypass' : null;
    if (!recaptchaToken) {
      try {
        recaptchaToken = await bookingRecaptchaRef.current?.execute('booking') || null;
      } catch (e) {
        console.error(e);
      }
    }

    if (!recaptchaToken) {
      setBookingStatus('error');
      setBookingMessage(t('help.errorRecaptcha'));
      return;
    }

    try {
      const response = await fetch('/api/drawer-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          phone_number: normalizedPhoneNumber,
          full_phone_number: normalizedPhoneNumber,
          locale: formLocale,
          recaptcha_token: recaptchaToken,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof data.message === 'string'
            ? data.message
            : t('help.errorCallback');

        throw new Error(message);
      }

      setBookingStatus('success');
      setBookingMessage(
        typeof data.message === 'string'
          ? data.message
          : t('help.successCallback')
      );
      toast.success(typeof data.message === 'string' ? data.message : t('help.successCallback'));
      setPhoneNumber('');
    } catch (error) {
      setBookingStatus('error');
      setBookingMessage(error instanceof Error ? error.message : t('help.errorCallback'));
    }
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = contactEmail.trim();
    const normalizedMessage = contactMessage.trim();

    if (!normalizedEmail || !normalizedMessage) {
      setContactStatus('error');
      setContactStatusMessage(t('help.errorEmail'));
      return;
    }

    setContactStatus('submitting');
    setContactStatusMessage('');

    let recaptchaToken = shouldBypassRecaptcha ? 'development-recaptcha-bypass' : null;
    if (!recaptchaToken) {
      try {
        recaptchaToken = await contactRecaptchaRef.current?.execute('contact') || null;
      } catch (e) {
        console.error(e);
      }
    }

    if (!recaptchaToken) {
      setContactStatus('error');
      setContactStatusMessage(t('help.errorRecaptcha'));
      return;
    }

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
          locale: formLocale,
          recaptcha_token: recaptchaToken,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof data.message === 'string'
            ? data.message
            : t('help.errorMessage');

        throw new Error(message);
      }

      setContactStatus('success');
      setContactStatusMessage(
        typeof data.message === 'string'
          ? data.message
          : t('help.successMessage')
      );
      toast.success(typeof data.message === 'string' ? data.message : t('help.successMessage'));
      setContactEmail('');
      setContactMessage('');
    } catch (error) {
      setContactStatus('error');
      setContactStatusMessage(error instanceof Error ? error.message : t('help.errorMessage'));
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
        aria-label={t('help.needHelp')}
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] max-w-full bg-white z-[1000] shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.28s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* ── Header ─────────────────────────── */}
        <div className="shrink-0 p-6 bg-slate-100 flex flex-col gap-8">
          {/* Title + close */}
          <div className="flex justify-between items-start">
            <h2 className="text-neutral-800 text-2xl font-bold leading-7">
              {t('header.needHelp')}
            </h2>
            <button
              onClick={onClose}
              aria-label={t('common.close')}
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
            <div className="flex items-center justify-center -space-x-4 isolate">
              {displayMembers.map((member) => (
                <div key={member.id} className="group relative flex justify-center z-0 hover:z-30 transition-all duration-200">
                  <img
                    src={member.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f59e0b&color=fff`}
                    alt={member.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow hover:scale-105 transition-transform duration-200"
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-neutral-900/90 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md border border-neutral-700/50 z-50">
                    {member.name}
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900/90" />
                  </div>
                </div>
              ))}
            </div>

            {/* Call + Email cards */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Call */}
              <a
                href="tel:+31318590465"
                className="flex-1 h-16 p-2.5 bg-white rounded-xl border border-slate-100 flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-8 h-8 bg-[#F18800] rounded-lg flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <mask id="mask0_663_1044" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                      <rect width="16" height="16" fill="#D9D9D9"/>
                    </mask>
                    <g mask="url(#mask0_663_1044)">
                      <path d="M12.9591 13.6624C11.7028 13.6624 10.4406 13.3703 9.17261 12.786C7.90472 12.2018 6.73978 11.3777 5.67778 10.3137C4.61589 9.2496 3.79283 8.0846 3.20861 6.81871C2.62439 5.55293 2.33228 4.29187 2.33228 3.03554C2.33228 2.83365 2.39894 2.66543 2.53228 2.53087C2.66561 2.39632 2.83228 2.32904 3.03228 2.32904H5.20661C5.37494 2.32904 5.52344 2.38399 5.65211 2.49387C5.78078 2.60365 5.86261 2.73932 5.89761 2.90087L6.27978 4.86237C6.30622 5.04437 6.30066 5.20076 6.26311 5.33154C6.22544 5.46232 6.15789 5.57215 6.06044 5.66104L4.52078 7.15987C4.76855 7.61365 5.05166 8.04293 5.37011 8.44771C5.68844 8.85238 6.03311 9.23887 6.40411 9.60721C6.76989 9.9731 7.15878 10.3129 7.57078 10.6265C7.98278 10.9402 8.42767 11.2321 8.90544 11.5022L10.4014 9.99321C10.5058 9.88465 10.6321 9.80854 10.7804 9.76487C10.9287 9.72132 11.0827 9.71065 11.2426 9.73287L13.0938 10.1099C13.2621 10.1543 13.3995 10.2402 13.5059 10.3675C13.6124 10.4949 13.6656 10.6393 13.6656 10.8009V12.9624C13.6656 13.1624 13.5983 13.329 13.4638 13.4624C13.3292 13.5957 13.161 13.6624 12.9591 13.6624ZM4.04761 6.21371L5.23744 5.07521C5.25878 5.0581 5.27266 5.0346 5.27911 5.00471C5.28555 4.97482 5.2845 4.94704 5.27594 4.92137L4.98611 3.43154C4.97755 3.39743 4.96261 3.37182 4.94128 3.35471C4.91994 3.3376 4.89216 3.32904 4.85794 3.32904H3.43228C3.40661 3.32904 3.38522 3.3376 3.36811 3.35471C3.35111 3.37182 3.34261 3.39321 3.34261 3.41887C3.37672 3.87443 3.45128 4.33721 3.56628 4.80721C3.68116 5.27732 3.84161 5.74615 4.04761 6.21371ZM9.84761 11.9752C10.2895 12.1812 10.7504 12.3387 11.2303 12.4477C11.7103 12.5566 12.1588 12.6213 12.5758 12.6419C12.6014 12.6419 12.6228 12.6333 12.6399 12.6162C12.6571 12.5991 12.6656 12.5777 12.6656 12.552V11.1495C12.6656 11.1153 12.6571 11.0875 12.6399 11.0662C12.6228 11.0449 12.5972 11.0299 12.5631 11.0214L11.1631 10.7367C11.1374 10.7282 11.115 10.7271 11.0958 10.7335C11.0766 10.74 11.0562 10.7539 11.0348 10.7752L9.84761 11.9752Z" fill="white"/>
                    </g>
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="text-neutral-800 text-base font-bold leading-5">{t('supportPanel.callUs')}</span>
                  <span className="text-neutral-700 text-sm font-normal leading-5 whitespace-nowrap">
                    +31 318 590 465
                  </span>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:verkoop@businesslabels.nl"
                className="flex-1 h-16 p-2.5 bg-white rounded-xl border border-slate-100 flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-8 h-8 bg-[#F18800] rounded-lg flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <mask id="mask0_663_1053" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                      <rect width="16" height="16" fill="#D9D9D9"/>
                    </mask>
                    <g mask="url(#mask0_663_1053)">
                      <path d="M2.87289 13C2.53611 13 2.25106 12.8833 2.01772 12.65C1.78439 12.4167 1.66772 12.1316 1.66772 11.7948V4.20517C1.66772 3.86839 1.78439 3.58333 2.01772 3.35C2.25106 3.11667 2.53611 3 2.87289 3H13.1292C13.466 3 13.7511 3.11667 13.9844 3.35C14.2177 3.58333 14.3344 3.86839 14.3344 4.20517V11.7948C14.3344 12.1316 14.2177 12.4167 13.9844 12.65C13.7511 12.8833 13.466 13 13.1292 13H2.87289ZM13.3344 4.9615L8.32539 8.168C8.27417 8.197 8.22117 8.21983 8.16639 8.2365C8.11172 8.25317 8.05661 8.2615 8.00106 8.2615C7.9455 8.2615 7.89039 8.25317 7.83572 8.2365C7.78095 8.21983 7.72795 8.197 7.67672 8.168L2.66772 4.9615V11.7948C2.66772 11.8547 2.68695 11.9039 2.72539 11.9423C2.76384 11.9808 2.813 12 2.87289 12H13.1292C13.1891 12 13.2383 11.9808 13.2767 11.9423C13.3152 11.9039 13.3344 11.8547 13.3344 11.7948V4.9615ZM8.00106 7.33333L13.2319 4H2.77022L8.00106 7.33333ZM2.66772 5.11533V4.35317V4.373V4.35183V5.11533Z" fill="white"/>
                    </g>
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="text-neutral-800 text-base font-bold leading-5">{t('supportPanel.email')}</span>
                  <span className="text-neutral-700 text-sm font-normal leading-5 truncate">verkoop@businesslabels.nl</span>
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
            onClick={() => toggleSection('callback')}
            >
              <span className="text-neutral-800 text-lg font-bold leading-6">
                {t('help.requestCallbackTeam')}
              </span>
              <CollapseIcon open={callbackOpen} />
            </button>

            {callbackOpen && (
              <div className="flex flex-col gap-4">
                <form className="flex flex-col gap-4" onSubmit={handleBookingSubmit}>
                  {/* Phone country */}


                  {/* Mobile number */}
                  <label className="flex flex-col gap-2">
                    <span className="sr-only">{t('help.mobileNumber')}</span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(event) => {
                        setPhoneNumber(event.target.value);
                        setBookingStatus('idle');
                        setBookingMessage('');
                      }}
                      placeholder={t('help.mobileNumber')}
                      autoComplete="tel"
                      className="h-11 px-5 py-2 rounded-xl border border-zinc-200 outline-none text-neutral-700 text-base font-normal placeholder-neutral-400 focus:border-brand transition-colors w-full"
                    />
                  </label>
                  {recaptchaSiteKey && (
                    <ReCAPTCHA
                      ref={bookingRecaptchaRef}
                      siteKey={recaptchaSiteKey}
                    />
                  )}
                  <p className="text-[11px] text-zinc-500 text-center">
                    This site is protected by reCAPTCHA and the Google{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Privacy Policy</a> and{' '}
                    <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Terms of Service</a> apply.
                  </p>

                  {bookingMessage && (
                    <p
                      role={bookingStatus === 'error' ? 'alert' : 'status'}
                      className={`text-sm font-normal text-center ${
                        bookingStatus === 'error' ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {bookingMessage}
                    </p>
                  )}

                  {/* Buttons */}
                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={bookingStatus === 'submitting'}
                      className="h-12 px-4 py-2.5 bg-brand rounded-full text-white text-base font-medium leading-6 hover:bg-brand-hover transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {bookingStatus === 'submitting' ? t('help.submitting') : t('help.requestBtn')}
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
              onClick={() => toggleSection('moreWays')}
            >
              <span className="text-neutral-800 text-lg font-bold leading-6">
                {t('help.moreWaysTeam')}
              </span>
              <CollapseIcon open={moreWaysOpen} />
            </button>

            {moreWaysOpen && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-800 text-base font-bold">{t('help.address')}</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-700 text-sm font-normal">Lenderinkweg 8,</span>
                    <span className="text-neutral-700 text-sm font-normal">6733 AX Wekerom</span>
                    <span className="text-neutral-700 text-sm font-normal">{t('countries.netherlands')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-100" />

          {/* ── Team Availability Schedule ── */}
          <div className="flex flex-col gap-4">
            <button
              className="flex justify-between items-center w-full text-left"
              onClick={() => toggleSection('schedule')}
            >
              <span className="text-neutral-800 text-lg font-bold leading-6">
                {t('help.checkAvailability')}
              </span>
              <CollapseIcon open={scheduleOpen} />
            </button>

            {scheduleOpen && (
              <div className="flex flex-col gap-4">
                <div className="w-full max-w-sm flex flex-col gap-2">
                  {schedule.map(({ date, day, hours, active }) => (
                    <div key={date} className="flex justify-between items-center gap-4">
                      <span className={`text-sm font-normal ${active ? 'text-neutral-800' : 'text-zinc-500'}`}>
                        {day} <span className="text-xs">({formatScheduleDate(date)})</span>
                      </span>
                      <span className={`text-sm font-normal text-right ${active ? 'text-neutral-800' : 'text-zinc-500'}`}>
                        {hours === UNAVAILABLE_LABEL ? t('help.unavailable') : hours}
                      </span>
                    </div>
                  ))}
                </div>
                {/* <p className="text-neutral-700 text-sm font-normal">
                  {t('help.workingHoursOnly')}
                </p> */}
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-100" />

          {/* ── Drop Us a Message ── */}
          <div className="flex flex-col gap-4">
            <button
              className="flex justify-between items-center w-full text-left"
              onClick={() => toggleSection('message')}
            >
              <span className="text-neutral-800 text-lg font-bold leading-6">
                {t('help.dropMessage')}
              </span>
              <CollapseIcon open={messageOpen} />
            </button>

            {messageOpen && (
              <form className="flex flex-col gap-3" onSubmit={handleContactSubmit}>
                <p className="text-neutral-700 text-sm font-normal">
                  {t('help.leaveMessage')}
                </p>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => {
                    setContactEmail(event.target.value);
                    setContactStatus('idle');
                    setContactStatusMessage('');
                  }}
                  placeholder={t('help.emailAddress')}
                  autoComplete="email"
                  required
                  className="h-11 px-5 py-2 rounded-xl border border-zinc-200 outline-none text-neutral-700 text-base font-normal placeholder-neutral-400 focus:border-brand transition-colors w-full"
                />
                <textarea
                  value={contactMessage}
                  onChange={(event) => {
                    setContactMessage(event.target.value);
                    setContactStatus('idle');
                    setContactStatusMessage('');
                  }}
                  placeholder={t('help.messagePlaceholder')}
                  rows={4}
                  className="px-3 py-2 rounded-xl border border-zinc-200 outline-none text-neutral-700 text-sm font-normal placeholder-neutral-400 focus:border-brand transition-colors w-full resize-none"
                />
                {recaptchaSiteKey && (
                  <ReCAPTCHA
                    ref={contactRecaptchaRef}
                    siteKey={recaptchaSiteKey}
                  />
                )}
                <p className="text-[11px] text-zinc-500 text-center">
                  This site is protected by reCAPTCHA and the Google{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Privacy Policy</a> and{' '}
                  <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Terms of Service</a> apply.
                </p>

                {contactStatusMessage && (
                  <p
                    role={contactStatus === 'error' ? 'alert' : 'status'}
                    className={`text-sm font-normal ${
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
                    className="w-auto h-12 px-4 py-2.5 bg-brand rounded-full text-white text-base font-medium leading-6 hover:bg-brand-hover transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {contactStatus === 'submitting' ? t('help.sending') : t('help.sendMessage')}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="h-px bg-zinc-100" />

          {/* ── Contact Support ── */}
          <div className="flex flex-col gap-4">
            <LocaleLink href="/contact" className="w-full" onClick={onClose}>
              <div style={{ width: '100%', height: '100%', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex' }}>
                <div style={{ color: '#F18800', fontSize: '18px', fontFamily: 'Segoe UI', fontWeight: 700, lineHeight: '27px', wordWrap: 'break-word' }}>Contact Support</div>
                <svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.3051 1.00002L18.5363 8.2312L11.401 15.3666M1.00007 7.66552L18.3351 8.22971" stroke="#F18800" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </LocaleLink>
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
