'use client';

import { useState, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IconProps {
  className?: string;
}

interface FieldProps {
  label: string;
  id: string;
  optional?: boolean;
  children: ReactNode;
}

interface InputProps {
  id: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

interface Step {
  icon: ReactNode;
  title: string;
  desc: string;
}

type ActiveTab = 'box' | 'pickup';

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBox({ className = '' }: IconProps) {
  return (
    <svg className={`size-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v4M10 14h4" />
    </svg>
  );
}

function IconInk({ className = '' }: IconProps) {
  return (
    <svg className={`size-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}

function IconTruck({ className = '' }: IconProps) {
  return (
    <svg className={`size-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17H7a2 2 0 010-4h2a2 2 0 010 4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 17h2a2 2 0 000-4h-2m0 4a2 2 0 01-2-2v-5a2 2 0 012-2h3l2 4v3a2 2 0 01-2 2h-1" />
    </svg>
  );
}

function IconPhone({ className = '' }: IconProps) {
  return (
    <svg className={`size-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function IconMail({ className = '' }: IconProps) {
  return (
    <svg className={`size-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

// ─── Shared form components ───────────────────────────────────────────────────

function Field({ label, id, optional, children }: FieldProps) {
  const t = useTranslations('recycle');
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-neutral-800 text-lg font-semibold font-sans leading-5">
        {label}{' '}
        {optional && <span className="text-zinc-500 text-base font-semibold">({t('optional')})</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ id, type = 'text', placeholder, value, onChange, required = false }: InputProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="h-12 px-5 py-3 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-700 text-base font-sans w-full bg-white focus:outline-blue-400 focus:outline-2 transition-all"
    />
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const COUNTRIES: string[] = ['Netherlands', 'Belgium', 'Luxembourg', 'Germany'];

// ─── Form sections ────────────────────────────────────────────────────────────

function CollectionBoxForm() {
  const t = useTranslations('recycle');
  const locale = useLocale() === 'nl' ? 'nl' : 'en';
  const [company, setCompany] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [postal, setPostal] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [extra, setExtra] = useState<string>('');

  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitState('submitting');
    setErrorMsg(null);

    try {
      const response = await fetch('/api/recycle-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'box',
          company, phone, email, country, street, postal, city, extra, locale
        }),
      });

      if (response.ok) {
        setSubmitState('success');
        toast.success(t('alertBoxSuccess'));
        setCompany(''); setPhone(''); setEmail(''); setCountry('');
        setStreet(''); setPostal(''); setCity(''); setExtra('');
        setTimeout(() => setSubmitState('idle'), 3000);
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
        setSubmitState('error');
      }
    } catch (err) {
      setErrorMsg('A network error occurred. Please try again.');
      setSubmitState('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-10 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-neutral-800 text-2xl font-semibold font-sans leading-7">
          {t('boxFormTitle')}
        </h2>
        <p className="text-neutral-700 text-base font-sans leading-6">
          {t('boxFormDesc')}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Field label={t('formCompany')} id="box-company">
            <Input id="box-company" placeholder={t('formCompanyPlaceholder')} value={company} onChange={(e) => setCompany(e.target.value)} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('formPhone')} id="box-phone">
              <Input id="box-phone" type="tel" placeholder={t('formPhonePlaceholder')} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label={t('formEmail')} id="box-email">
              <Input id="box-email" type="email" placeholder={t('formEmailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('formCountry')} id="box-country">
              <div className="relative">
                <select
                  id="box-country"
                  value={country}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountry(e.target.value)}
                  className="h-12 px-5 py-3 pr-10 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-700 text-base font-sans w-full bg-white appearance-none focus:outline-blue-400 focus:outline-2 transition-all cursor-pointer"
                >
                  <option value="">{t('formCountryPlaceholder')}</option>
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
                </svg>
              </div>
            </Field>
            <Field label={t('formStreet')} id="box-street">
              <Input id="box-street" placeholder={t('formStreetPlaceholder')} value={street} onChange={(e) => setStreet(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('formPostal')} id="box-postal">
              <Input id="box-postal" placeholder={t('formPostalPlaceholder')} value={postal} onChange={(e) => setPostal(e.target.value)} />
            </Field>
            <Field label={t('formCity')} id="box-city">
              <Input id="box-city" placeholder={t('formCityPlaceholder')} value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
          </div>

          <Field label={t('formAddressLine')} id="box-extra" optional>
            <Input id="box-extra" placeholder={t('formAddressLinePlaceholder')} value={extra} onChange={(e) => setExtra(e.target.value)} />
          </Field>
        </div>

          {/* Messages */}
          {submitState === 'success' && (
            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700 font-semibold font-sans">
              {t('alertBoxSuccess')}
            </div>
          )}
          {submitState === 'error' && errorMsg && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 font-semibold font-sans">
              {errorMsg}
            </div>
          )}

        <button
          type="submit"
          disabled={submitState === 'submitting' || submitState === 'success'}
          className="h-12 px-4 py-2.5 bg-amber-500 rounded-[100px] flex justify-center items-center gap-2 hover:bg-amber-600 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <span className="text-white text-base font-semibold font-sans leading-6">
            {submitState === 'submitting' ? t('btnSubmitting') : t('btnRequestBox')}
          </span>
        </button>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 flex-wrap">
          <span className="text-neutral-700 text-base font-sans leading-6">
            {t('questionsText')}
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            <a href="tel:+31318590465" className="flex items-center gap-1.5 text-amber-500 font-semibold font-sans hover:text-amber-600 transition-colors">
              <IconPhone className="text-amber-500" />
              +31 (0)318 590 465
            </a>
            <a href="mailto:verkoop@businesslabels.nl" className="flex items-center gap-1.5 text-amber-500 font-semibold font-sans lowercase hover:text-amber-600 transition-colors">
              <IconMail className="text-amber-500" />
              VERKOOP@BUSINESSLABELS.NL
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}

function PickupForm() {
  const t = useTranslations('recycle');
  const locale = useLocale() === 'nl' ? 'nl' : 'en';
  const [company, setCompany] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [postal, setPostal] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [newBox, setNewBox] = useState<boolean>(false);

  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitState('submitting');
    setErrorMsg(null);

    try {
      const response = await fetch('/api/recycle-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pickup',
          company, phone, email, country, street, postal, city, newBox, locale
        }),
      });

      if (response.ok) {
        setSubmitState('success');
        toast.success(t('alertPickupSuccess'));
        setCompany(''); setPhone(''); setEmail(''); setCountry('');
        setStreet(''); setPostal(''); setCity(''); setNewBox(false);
        setTimeout(() => setSubmitState('idle'), 3000);
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
        setSubmitState('error');
      }
    } catch (err) {
      setErrorMsg('A network error occurred. Please try again.');
      setSubmitState('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-10 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-neutral-800 text-2xl font-semibold font-sans leading-7">
          {t('pickupFormTitle')}
        </h2>
        <p className="text-neutral-700 text-base font-sans leading-6">
          {t('pickupFormDesc')}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Field label={t('formCompany')} id="pickup-company">
            <Input id="pickup-company" placeholder={t('formCompanyPlaceholder')} value={company} onChange={(e) => setCompany(e.target.value)} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('formPhone')} id="pickup-phone">
              <Input id="pickup-phone" type="tel" placeholder={t('formPhonePlaceholder')} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label={t('formEmail')} id="pickup-email">
              <Input id="pickup-email" type="email" placeholder={t('formEmailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('formCountry')} id="pickup-country">
              <div className="relative">
                <select
                  id="pickup-country"
                  value={country}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountry(e.target.value)}
                  className="h-12 px-5 py-3 pr-10 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-700 text-base font-sans w-full bg-white appearance-none focus:outline-blue-400 focus:outline-2 transition-all cursor-pointer"
                >
                  <option value="">{t('formCountryPlaceholder')}</option>
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
                </svg>
              </div>
            </Field>
            <Field label={t('formStreet')} id="pickup-street">
              <Input id="pickup-street" placeholder={t('formStreetPlaceholder')} value={street} onChange={(e) => setStreet(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('formPostal')} id="pickup-postal">
              <Input id="pickup-postal" placeholder={t('formPostalPlaceholder')} value={postal} onChange={(e) => setPostal(e.target.value)} />
            </Field>
            <Field label={t('formCity')} id="pickup-city">
              <Input id="pickup-city" placeholder={t('formCityPlaceholder')} value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              id="pickup-newbox"
              type="checkbox"
              checked={newBox}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBox(e.target.checked)}
              className="size-4 accent-amber-500"
            />
            <span className="text-neutral-700 text-base font-semibold font-sans">
              {t('formNewBoxCheckbox')}
            </span>
          </label>
        </div>

          {/* Messages */}
          {submitState === 'success' && (
            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700 font-semibold font-sans">
              {t('alertPickupSuccess')}
            </div>
          )}
          {submitState === 'error' && errorMsg && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 font-semibold font-sans">
              {errorMsg}
            </div>
          )}

        <button
          type="submit"
          disabled={submitState === 'submitting' || submitState === 'success'}
          className="h-12 px-4 py-2.5 bg-amber-500 rounded-[100px] flex justify-center items-center gap-2 hover:bg-amber-600 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <span className="text-white text-base font-semibold font-sans leading-6">
            {submitState === 'submitting' ? t('btnSubmitting') : t('btnRequestPickup')}
          </span>
        </button>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 flex-wrap">
          <span className="text-neutral-700 text-base font-sans leading-6">
            {t('questionsText')}
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            <a href="tel:+31318590465" className="flex items-center gap-1.5 text-amber-500 font-semibold font-sans hover:text-amber-600 transition-colors">
              <IconPhone className="text-amber-500" />
              +31 (0)318 590 465
            </a>
            <a href="mailto:verkoop@businesslabels.nl" className="flex items-center gap-1.5 text-amber-500 font-semibold font-sans lowercase hover:text-amber-600 transition-colors">
              <IconMail className="text-amber-500" />
              VERKOOP@BUSINESSLABELS.NL
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RecyclePageClient() {
  const t = useTranslations('recycle');
  const [activeTab, setActiveTab] = useState<ActiveTab>('box');

  function scrollToForm(): void {
    document.getElementById('recycle-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  const steps: Step[] = [
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 21.7319C11.304 21.9074 11.6489 21.9998 12 21.9998C12.3511 21.9998 12.696 21.9074 13 21.7319L20 17.7319C20.3037 17.5565 20.556 17.3043 20.7315 17.0007C20.9071 16.697 20.9996 16.3526 21 16.0019V8.00186C20.9996 7.65113 20.9071 7.30667 20.7315 7.00302C20.556 6.69937 20.3037 6.44722 20 6.27186L13 2.27186C12.696 2.09632 12.3511 2.00391 12 2.00391C11.6489 2.00391 11.304 2.09632 11 2.27186L4 6.27186C3.69626 6.44722 3.44398 6.69937 3.26846 7.00302C3.09294 7.30667 3.00036 7.65113 3 8.00186V16.0019C3.00036 16.3526 3.09294 16.697 3.26846 17.0007C3.44398 17.3043 3.69626 17.5565 4 17.7319L11 21.7319Z" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 22V12" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M3.29004 7L12 12L20.71 7" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M7.5 4.26953L16.5 9.41953" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
      title: t('step1Title'),
      desc: t('step1Desc'),
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 20C9.24404 20.0053 7.55023 19.3505 6.2545 18.1654C4.95876 16.9803 4.15575 15.3515 4.00471 13.6021C3.85368 11.8527 4.36567 10.1104 5.43913 8.72074C6.51259 7.33112 8.06911 6.3957 9.79998 6.1C15.5 5 17 4.48 19 2C20 4 21 6.18 21 10C21 15.5 16.22 20 11 20Z" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 21C2 18 3.85 15.64 7.08 15C9.5 14.52 12 13 13 12" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
      title: t('step2Title'),
      desc: t('step2Desc'),
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 18V6C14 5.46957 13.7893 4.96086 13.4142 4.58579C13.0391 4.21071 12.5304 4 12 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V17C2 17.2652 2.10536 17.5196 2.29289 17.7071C2.48043 17.8946 2.73478 18 3 18H5" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 18H9" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 18H21C21.2652 18 21.5196 17.8946 21.7071 17.7071C21.8946 17.5196 22 17.2652 22 17V13.35C21.9996 13.1231 21.922 12.903 21.78 12.726L18.3 8.376C18.2065 8.25888 18.0878 8.16428 17.9528 8.0992C17.8178 8.03412 17.6699 8.00021 17.52 8H14" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M17 20C18.1046 20 19 19.1046 19 18C19 16.8954 18.1046 16 17 16C15.8954 16 15 16.8954 15 18C15 19.1046 15.8954 20 17 20Z" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 20C8.10457 20 9 19.1046 9 18C9 16.8954 8.10457 16 7 16C5.89543 16 5 16.8954 5 18C5 19.1046 5.89543 20 7 20Z" stroke="#F18800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
      title: t('step3Title'),
      desc: t('step3Desc'),
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute size-48 -left-14 top-[600px] bg-amber-500/30 rounded-full blur-[132px]" />
      <div className="pointer-events-none absolute size-48 right-32 top-32 bg-amber-500/30 rounded-full blur-[132px]" />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1440px] mx-auto px-4 pt-16 pb-24">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Left: copy */}
          <div className="flex-1 flex flex-col gap-12">
            <div className="flex flex-col gap-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 h-4">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_1939_6114" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16"><rect width="16" height="16" fill="#D9D9D9" /></mask><g mask="url(#mask0_1939_6114)"><path d="M4 12.6666H6.23083V9.30758C6.23083 9.13691 6.28856 8.9938 6.404 8.87825C6.51956 8.7628 6.66267 8.70508 6.83333 8.70508H9.16667C9.33733 8.70508 9.48044 8.7628 9.596 8.87825C9.71144 8.9938 9.76917 9.13691 9.76917 9.30758V12.6666H12V6.76908C12 6.73497 11.9925 6.70402 11.9775 6.67625C11.9626 6.64847 11.9423 6.62386 11.9167 6.60241L8.12183 3.74991C8.08761 3.72002 8.047 3.70508 8 3.70508C7.953 3.70508 7.91239 3.72002 7.87817 3.74991L4.08333 6.60241C4.05767 6.62386 4.03739 6.64847 4.0225 6.67625C4.0075 6.70402 4 6.73497 4 6.76908V12.6666ZM3 12.6666V6.76908C3 6.5783 3.04267 6.39758 3.128 6.22691C3.21344 6.05613 3.33144 5.91552 3.482 5.80508L7.277 2.94608C7.48756 2.78541 7.72822 2.70508 7.999 2.70508C8.26978 2.70508 8.51111 2.78541 8.723 2.94608L12.518 5.80508C12.6686 5.91552 12.7866 6.05613 12.872 6.22691C12.9573 6.39758 13 6.5783 13 6.76908V12.6666C13 12.9392 12.9015 13.1741 12.7045 13.3711C12.5075 13.5681 12.2727 13.6666 12 13.6666H9.37183C9.20106 13.6666 9.05794 13.6088 8.9425 13.4932C8.82694 13.3778 8.76917 13.2347 8.76917 13.0639V9.70508H7.23083V13.0639C7.23083 13.2347 7.17306 13.3778 7.0575 13.4932C6.94206 13.6088 6.79894 13.6666 6.62817 13.6666H4C3.72733 13.6666 3.4925 13.5681 3.2955 13.3711C3.0985 13.1741 3 12.9392 3 12.6666Z" fill="#888888" /></g></svg>
                <span className="text-zinc-500 text-sm font-sans leading-5">/</span>
                <span className="text-neutral-700 text-sm font-semibold font-sans leading-5">{t('breadcrumb')}</span>
              </div>

              <h1 className="text-neutral-800 text-5xl xl:text-7xl font-bold font-sans leading-tight">
                {t('heroTitle')}
              </h1>
              <p className="text-neutral-700 text-xl font-sans leading-8">
                {t('heroDesc')}
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => { setActiveTab('box'); scrollToForm(); }}
                className="h-12 px-7 py-4 bg-amber-500 rounded-[50px] flex justify-center items-center gap-2.5 hover:bg-amber-600 active:scale-[0.98] transition-all"
              >
                <span className="text-white text-lg font-semibold font-sans leading-6">{t('heroBtnBox')}</span>
              </button>
              <button
                onClick={() => { setActiveTab('pickup'); scrollToForm(); }}
                className="h-12 px-7 py-4 rounded-[50px] outline outline-[1.5px] outline-offset-[-1.5px] outline-amber-500 flex justify-center items-center gap-2.5 hover:bg-amber-50 active:scale-[0.98] transition-all"
              >
                <span className="text-amber-500 text-lg font-semibold font-sans leading-6">{t('heroBtnPickup')}</span>
              </button>
            </div>
          </div>

          {/* Right: hero image */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none self-stretch rounded-xl overflow-hidden shadow-lg outline outline-1 outline-offset-[-1px] outline-black/10 min-h-64">
            <img
              src="/recycle-hero.jpg"
              alt="Epson ColorWorks Recycling Collection Box"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="w-full bg-gray-50 py-24">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-16">
          <h2 className="text-center text-neutral-800 text-4xl font-bold font-sans leading-[48px]">
            {t('howItWorksTitle')}
          </h2>

          {/* Steps row with connecting dashed line */}
          <div className="relative flex flex-col md:flex-row items-start justify-between gap-10 md:gap-0">
            {/* Dashed connector line (desktop only) */}
            <div className="hidden md:block absolute top-[28px] left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px border-t-2 border-dashed border-amber-300 z-0" />

            {steps.map((step) => (
              <div key={step.title} className="flex-1 flex flex-col items-center gap-5 text-center px-6 z-10">
                {/* Icon circle */}
                <div className="size-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                {/* Text */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-neutral-800 text-lg font-bold font-sans leading-6">{step.title}</h3>
                  <p className="text-neutral-500 text-sm font-sans leading-6">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Honesty note */}
          <div className="w-full p-6 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-neutral-100">
            <p className="text-neutral-700 text-base font-sans leading-7">
              <strong className="font-bold">{t('honestyTitle')}</strong>{' '}
              {t('honestyDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* ── Forms (tabbed) ────────────────────────────────────────────────── */}
      <section id="recycle-form" className="w-full max-w-[1200px] mx-auto px-4 py-24">
        <div className="bg-white rounded-xl shadow-lg outline outline-1 outline-offset-[-1px] outline-black/10 overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-gray-200">
            {/* Box tab */}
            <button
              type="button"
              onClick={() => setActiveTab('box')}
              className={`relative flex-1 p-3 sm:p-6 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-3 transition-colors ${activeTab === 'box' ? 'bg-amber-500/5' : 'bg-white hover:bg-gray-50'
                }`}
            >
              <div
                className={`size-10 sm:size-12 shrink-0 rounded-lg shadow-sm outline outline-1 outline-offset-[-1px] outline-gray-100 flex justify-center items-center transition-colors ${activeTab === 'box' ? 'bg-amber-500' : 'bg-white'
                  }`}
              >
                {/* <IconBox className={activeTab === 'box' ? 'text-white' : 'text-zinc-500'} /> */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 21.7319C11.304 21.9074 11.6489 21.9998 12 21.9998C12.3511 21.9998 12.696 21.9074 13 21.7319L20 17.7319C20.3037 17.5565 20.556 17.3043 20.7315 17.0007C20.9071 16.697 20.9996 16.3526 21 16.0019V8.00186C20.9996 7.65113 20.9071 7.30667 20.7315 7.00302C20.556 6.69937 20.3037 6.44722 20 6.27186L13 2.27186C12.696 2.09632 12.3511 2.00391 12 2.00391C11.6489 2.00391 11.304 2.09632 11 2.27186L4 6.27186C3.69626 6.44722 3.44398 6.69937 3.26846 7.00302C3.09294 7.30667 3.00036 7.65113 3 8.00186V16.0019C3.00036 16.3526 3.09294 16.697 3.26846 17.0007C3.44398 17.3043 3.69626 17.5565 4 17.7319L11 21.7319Z" stroke={activeTab === "box" ? "white" : "#888888"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 22V12" stroke={activeTab === "box" ? "white" : "#888888"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M3.29004 7L12 12L20.71 7" stroke={activeTab === "box" ? "white" : "#888888"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M7.5 4.26953L16.5 9.41953" stroke={activeTab === "box" ? "white" : "#888888"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="flex flex-col items-center sm:items-start gap-0.5">
                <span className={`text-sm sm:text-xl font-semibold font-sans leading-tight sm:leading-6 text-center sm:text-left ${activeTab === 'box' ? 'text-neutral-800' : 'text-neutral-600'}`}>
                  {t('tabRequestBoxTitle')}
                </span>
                <span className="hidden sm:block text-sm font-sans leading-5 text-zinc-500">{t('tabRequestBoxDesc')}</span>
              </div>
              {activeTab === 'box' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-500" />
              )}
            </button>

            {/* Pickup tab */}
            <button
              type="button"
              onClick={() => setActiveTab('pickup')}
              className={`relative flex-1 p-3 sm:p-6 border-l border-gray-200 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-3 transition-colors ${activeTab === 'pickup' ? 'bg-amber-500/5' : 'bg-white hover:bg-gray-50'
                }`}
            >
              <div
                className={`size-10 sm:size-12 shrink-0 rounded-lg shadow-sm outline outline-1 outline-offset-[-1px] outline-gray-100 flex justify-center items-center transition-colors ${activeTab === 'pickup' ? 'bg-amber-500' : 'bg-white'
                  }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 18V6C14 5.46957 13.7893 4.96086 13.4142 4.58579C13.0391 4.21071 12.5304 4 12 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V17C2 17.2652 2.10536 17.5196 2.29289 17.7071C2.48043 17.8946 2.73478 18 3 18H5" stroke={activeTab === "pickup" ? "white" : "#888888"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 18H9" stroke={activeTab === "pickup" ? "white" : "#888888"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 18H21C21.2652 18 21.5196 17.8946 21.7071 17.7071C21.8946 17.5196 22 17.2652 22 17V13.35C21.9996 13.1231 21.922 12.903 21.78 12.726L18.3 8.376C18.2065 8.25888 18.0878 8.16428 17.9528 8.0992C17.8178 8.03412 17.6699 8.00021 17.52 8H14" stroke={activeTab === "pickup" ? "white" : "#888888"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M17 20C18.1046 20 19 19.1046 19 18C19 16.8954 18.1046 16 17 16C15.8954 16 15 16.8954 15 18C15 19.1046 15.8954 20 17 20Z" stroke={activeTab === "pickup" ? "white" : "#888888"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 20C8.10457 20 9 19.1046 9 18C9 16.8954 8.10457 16 7 16C5.89543 16 5 16.8954 5 18C5 19.1046 5.89543 20 7 20Z" stroke={activeTab === "pickup" ? "white" : "#888888"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="flex flex-col items-center sm:items-start gap-0.5">
                <span className={`text-sm sm:text-xl font-semibold font-sans leading-tight sm:leading-6 text-center sm:text-left ${activeTab === 'pickup' ? 'text-neutral-800' : 'text-neutral-600'}`}>
                  {t('tabRequestPickupTitle')}
                </span>
                <span className="hidden sm:block text-sm font-sans leading-5 text-zinc-500">{t('tabRequestPickupDesc')}</span>
              </div>
              {activeTab === 'pickup' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-500" />
              )}
            </button>
          </div>

          {/* Active form */}
          {activeTab === 'box' ? <CollectionBoxForm /> : <PickupForm />}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="w-full h-80 relative overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-stone-700/70 to-yellow-950/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-transparent" />
        <div className="relative w-full max-w-[1200px] mx-auto px-4 flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-center text-white text-4xl font-bold font-sans leading-[48px]">
              {t('ctaTitle')}
            </h2>
            <p className="text-center text-gray-100 text-lg font-sans leading-7">
              {t('ctaDesc')}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="h-12 px-7 py-4 bg-amber-500 rounded-[50px] flex justify-center items-center gap-2.5 hover:bg-amber-600 active:scale-[0.98] transition-all">
              <span className="text-white text-lg font-semibold font-sans leading-6">{t('ctaBrowse')}</span>
            </button>
            <button className="h-12 px-7 py-4 bg-white/10 rounded-[50px] outline outline-1 outline-offset-[-1px] outline-white/20 backdrop-blur-sm flex justify-center items-center gap-2.5 hover:bg-white/20 active:scale-[0.98] transition-all">
              <span className="text-white text-lg font-semibold font-sans leading-6">{t('ctaExpert')}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
