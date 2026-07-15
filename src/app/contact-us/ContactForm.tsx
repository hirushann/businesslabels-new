'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

export default function ContactForm() {
  const locale = useLocale();
  const t = useTranslations("contactPage.form");
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, locale }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t('errorFailed'));
      }

      setStatus('success');
      setFormData({ name: '', company: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      console.error('Contact form error:', err);
      setStatus('error');
      setErrorMessage(err.message || t('errorUnexpected'));
    }
  };

  return (
    <div className="flex-1 bg-white rounded-xl shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.10)] shadow-lg outline outline-1 outline-offset-[-1px] outline-black/10 inline-flex flex-col justify-start items-start overflow-hidden w-full">
      <div className="self-stretch p-5 md:p-10 flex flex-col justify-center items-center gap-8">
        {status === 'success' ? (
          <div className="self-stretch flex flex-col items-center justify-center py-10 gap-4 text-center">
             <div className="size-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <polyline points="20 6 9 17 4 12" />
                </svg>
             </div>
             <h3 className="text-xl font-semibold text-neutral-800">{t("successTitle")}</h3>
             <p className="text-neutral-600">{t("successDesc")}</p>
             <button
               onClick={() => setStatus('idle')}
               className="mt-6 px-6 py-2 bg-brand text-white rounded-[100px] font-semibold hover:bg-brand-hover transition-colors"
             >
               Send another message
             </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="self-stretch flex flex-col justify-start items-start gap-6 w-full">
            {status === 'error' && (
              <div className="self-stretch p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                {errorMessage}
              </div>
            )}

            <div className="self-stretch flex flex-col justify-start items-start gap-4">
              <div className="self-stretch inline-flex justify-start items-start gap-4 w-full sm:flex-row flex-col">
                <div className="flex-1 inline-flex flex-col justify-start items-start gap-2 w-full">
                  <label htmlFor="name" className="justify-start text-neutral-800 text-lg font-bold leading-5">{t("nameLabel")}</label>
                  <input
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("namePlaceholder")}
                    className="self-stretch h-12 w-full px-5 py-3 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-800 text-base font-normal focus:outline-brand focus:outline-2"
                  />
                </div>
                <div className="flex-1 inline-flex flex-col justify-start items-start gap-2 w-full">
                  <label htmlFor="company" className="justify-start text-neutral-800 text-lg font-bold leading-5">{t("companyLabel")}</label>
                  <input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder={t("companyPlaceholder")}
                    className="self-stretch h-12 w-full px-5 py-3 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-800 text-base font-normal focus:outline-brand focus:outline-2"
                  />
                </div>
              </div>
              <div className="self-stretch inline-flex justify-start items-start gap-4 w-full sm:flex-row flex-col">
                <div className="flex-1 inline-flex flex-col justify-start items-start gap-2 w-full">
                  <label htmlFor="email" className="justify-start text-neutral-800 text-lg font-bold leading-5">{t("emailLabel")}</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("emailPlaceholder")}
                    className="self-stretch h-12 w-full px-5 py-3 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-800 text-base font-normal focus:outline-brand focus:outline-2"
                  />
                </div>
                <div className="flex-1 inline-flex flex-col justify-start items-start gap-2 w-full">
                  <label htmlFor="phone" className="justify-start text-neutral-800 text-lg font-bold leading-5">{t("phoneLabel")}</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("phonePlaceholder")}
                    className="self-stretch h-12 w-full px-5 py-3 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-800 text-base font-normal focus:outline-brand focus:outline-2"
                  />
                </div>
              </div>
              <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full">
                <div className="justify-start">
                  <label htmlFor="subject" className="text-neutral-800 text-lg font-semibold leading-5 cursor-pointer">{t("subjectLabel")} </label>
                  <span className="text-zinc-500 text-base font-semibold leading-5">{t("optional")}</span>
                </div>
                <input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={t("subjectPlaceholder")}
                  className="self-stretch h-12 w-full px-5 py-3 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-800 text-base font-normal focus:outline-brand focus:outline-2"
                />
              </div>
              <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full">
                <label htmlFor="message" className="justify-start text-neutral-800 text-lg font-bold leading-5">{t("messageLabel")}</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t("messagePlaceholder")}
                  className="self-stretch px-5 py-3 rounded-xl w-full outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-800 text-base font-normal resize-y focus:outline-brand focus:outline-2"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="self-stretch h-12 px-4 py-2.5 bg-brand hover:bg-brand-hover disabled:bg-amber-300 disabled:cursor-not-allowed rounded-[100px] inline-flex justify-center items-center gap-2 transition-colors w-full sm:w-auto"
            >
              <span className="text-center justify-start text-white text-base font-medium leading-6">
                {status === 'loading' ? t('sending') : t('send')}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
