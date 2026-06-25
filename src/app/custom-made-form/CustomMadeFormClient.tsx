'use client';

import { useState, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { toast } from 'sonner';
import PrinterModelSelect from '@/components/PrinterModelSelect';
import MaterialModelSelect from '@/components/MaterialModelSelect';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Shape {
  id: string;
  label: string;
  sub: string;
  preview: ReactNode;
}

interface Material {
  id: string;
  label: string;
  sub: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const getShapes = (t: any): Shape[] => [
  {
    id: 'rectangular',
    label: t('shapeRectangular'),
    sub: t('subRectangular'),
    preview: <div className="w-14 h-8 rounded-[2px] border-[1.50px] border-neutral-700" />,
  },
  {
    id: 'round',
    label: t('shapeRound'),
    sub: t('subRound'),
    preview: <div className="size-8 rounded-full border-[1.50px] border-neutral-700" />,
  },
  {
    id: 'oval',
    label: t('shapeOval'),
    sub: t('subOval'),
    preview: <div className="w-14 h-8 rounded-full border-[1.50px] border-neutral-700" />,
  },
  {
    id: 'custom',
    label: t('shapeCustom'),
    sub: t('subCustom'),
    preview: (
      <svg viewBox="0 0 56 32" className="w-14 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M4 28 L10 4 L30 4 Q52 4 52 16 Q52 28 30 28 Z" className="text-neutral-700" />
      </svg>
    ),
  },
];

const getMaterials = (t: any): Material[] => [
  { id: 'gloss-paper', label: t('matGlossPaper'), sub: t('subGlossPaper') },
  { id: 'matte-paper', label: t('matMattePaper'), sub: t('subMattePaper') },
  { id: 'gloss-polyester', label: t('matGlossPoly'), sub: t('subGlossPoly') },
  { id: 'matte-polyester', label: t('matMattePoly'), sub: t('subMattePoly') },
  { id: 'transparent', label: t('matTransparent'), sub: t('subTransparent') },
  { id: 'silver-polyester', label: t('matSilverPoly'), sub: t('subSilverPoly') },
];

const STEPS: string[] = ['Shape', 'Size', 'Printer', 'Material', 'Contact'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomMadeFormClient() {
  const t = useTranslations('customForm');
  const locale = useLocale() === 'nl' ? 'nl' : 'en';

  const SHAPES = getShapes(t);
  const MATERIALS = getMaterials(t);

  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [diameter, setDiameter] = useState<string>('');
  const [printerQuery, setPrinterQuery] = useState<string>('');
  const [unknownPrinter, setUnknownPrinter] = useState<boolean>(false);
  const [materialCode, setMaterialCode] = useState<string>('');
  const [unsureMaterial, setUnsureMaterial] = useState<boolean>(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [company, setCompany] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [comments, setComments] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function resetForm() {
    setSelectedShape(null);
    setDiameter('');
    setPrinterQuery('');
    setUnknownPrinter(false);
    setMaterialCode('');
    setUnsureMaterial(false);
    setSelectedMaterial(null);
    setCompany('');
    setName('');
    setEmail('');
    setPhone('');
    setComments('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const shapeLabel = SHAPES.find((s) => s.id === selectedShape)?.label || 'Not specified';
    const printerValue = unknownPrinter ? 'Unknown' : printerQuery || 'Not specified';
    const materialValue = unsureMaterial
      ? 'Unsure - please advise'
      : materialCode
        ? `Code: ${materialCode}`
        : MATERIALS.find((m) => m.id === selectedMaterial)?.label || 'Not specified';

    try {
      const response = await fetch('/api/custom-made-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shape: shapeLabel,
          dimensions: diameter || 'Not specified',
          printer: printerValue,
          material: materialValue,
          company,
          name,
          email,
          phone,
          comments,
          locale,
        }),
      });

      if (response.ok) {
        resetForm();
        setSubmitStatus('success');
        toast.success(t('successMessage'));
      } else {
        const data = await response.json().catch(() => ({}));
        setSubmitStatus('error');
        
        let errorText = data.message || 'Something went wrong. Please try again.';
        if (data.errors) {
          const firstErrorKey = Object.keys(data.errors)[0];
          if (firstErrorKey && data.errors[firstErrorKey][0]) {
            errorText = data.errors[firstErrorKey][0];
          }
        }
        
        setErrorMessage(errorText);
      }
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasChoices: boolean = !!(selectedShape || diameter || printerQuery || unknownPrinter || selectedMaterial);

  let currentStep = 1;
  if (selectedShape) currentStep = 2;
  if (selectedShape && diameter) currentStep = 3;
  if (selectedShape && diameter && (printerQuery || unknownPrinter)) currentStep = 4;
  if (selectedShape && diameter && (printerQuery || unknownPrinter) && (selectedMaterial || unsureMaterial || materialCode)) currentStep = 5;

  let dimW = '';
  let dimH = '';
  if (diameter) {
    const parts = diameter.toLowerCase().split(/x|\*/).map(s => s.trim());
    if (parts.length >= 2) {
      dimW = parts[0] + (parts[0].includes('mm') ? '' : 'mm');
      dimH = parts[1] + (parts[1].includes('mm') ? '' : 'mm');
    } else if (parts.length === 1 && parts[0]) {
      dimW = parts[0] + (parts[0].includes('mm') ? '' : 'mm');
      dimH = dimW;
    }
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-col gap-4">
        <div className="h-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_1909_10965" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16"><rect width="16" height="16" fill="#D9D9D9" /></mask><g mask="url(#mask0_1909_10965)"><path d="M4 12.6666H6.23083V9.30758C6.23083 9.13691 6.28856 8.9938 6.404 8.87825C6.51956 8.7628 6.66267 8.70508 6.83333 8.70508H9.16667C9.33733 8.70508 9.48044 8.7628 9.596 8.87825C9.71144 8.9938 9.76917 9.13691 9.76917 9.30758V12.6666H12V6.76908C12 6.73497 11.9925 6.70402 11.9775 6.67625C11.9626 6.64847 11.9423 6.62386 11.9167 6.60241L8.12183 3.74991C8.08761 3.72002 8.047 3.70508 8 3.70508C7.953 3.70508 7.91239 3.72002 7.87817 3.74991L4.08333 6.60241C4.05767 6.62386 4.03739 6.64847 4.0225 6.67625C4.0075 6.70402 4 6.73497 4 6.76908V12.6666ZM3 12.6666V6.76908C3 6.5783 3.04267 6.39758 3.128 6.22691C3.21344 6.05613 3.33144 5.91552 3.482 5.80508L7.277 2.94608C7.48756 2.78541 7.72822 2.70508 7.999 2.70508C8.26978 2.70508 8.51111 2.78541 8.723 2.94608L12.518 5.80508C12.6686 5.91552 12.7866 6.05613 12.872 6.22691C12.9573 6.39758 13 6.5783 13 6.76908V12.6666C13 12.9392 12.9015 13.1741 12.7045 13.3711C12.5075 13.5681 12.2727 13.6666 12 13.6666H9.37183C9.20106 13.6666 9.05794 13.6088 8.9425 13.4932C8.82694 13.3778 8.76917 13.2347 8.76917 13.0639V9.70508H7.23083V13.0639C7.23083 13.2347 7.17306 13.3778 7.0575 13.4932C6.94206 13.6088 6.79894 13.6666 6.62817 13.6666H4C3.72733 13.6666 3.4925 13.5681 3.2955 13.3711C3.0985 13.1741 3 12.9392 3 12.6666Z" fill="#888888" /></g></svg>
          <span className="text-zinc-500 text-sm font-sans leading-5">/</span>
          <span className="text-neutral-700 text-sm font-semibold font-sans leading-5">{t('breadcrumb')}</span>
        </div>
        <h1 className="text-neutral-800 text-2xl sm:text-3xl lg:text-4xl font-bold font-sans leading-tight sm:leading-[48px]">{t('title')}</h1>
        <p className="max-w-full lg:max-w-[1003px] text-neutral-700 text-base sm:text-lg font-sans leading-6">
          {t('description')}
        </p>
      </div>

      {/* Main two-column layout */}
      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* ── Form card ── */}
        <div className="flex-1 min-w-0 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] outline outline-1 outline-offset-[-1px] outline-gray-100 flex flex-col overflow-hidden">
          {/* Step indicator */}
          <div className="px-3 sm:px-6 py-4 bg-white shadow-[2px_6px_20px_0px_rgba(17,17,17,0.04)] outline outline-1 outline-offset-[-1px] outline-gray-100">
            <div className="relative flex justify-between items-center">
              {/* track */}
              <div className="absolute h-0.5 bg-gray-200 rounded-full left-4 right-4 sm:left-[48px] sm:right-[48px] top-[15px]" />
              <div
                className="absolute h-0.5 bg-amber-500 rounded-full top-[15px] transition-all duration-500"
                style={{ left: '1rem', right: '1rem', width: `calc((100% - 2rem) * ${(currentStep - 1) / 4})` }}
              />
              {STEPS.map((step, i) => {
                const stepNum = i + 1;
                const isCompleted = stepNum < currentStep;
                const isActive = stepNum === currentStep;

                return (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1.5 z-10">
                    <div className={`size-7 sm:size-8 rounded-full flex justify-center items-center transition-colors ${isCompleted ? 'bg-amber-500' : isActive ? 'bg-white outline outline-2 outline-offset-[-2px] outline-amber-500' : 'bg-gray-100'
                      }`}>
                      {isCompleted ? (
                        <svg className="size-4 sm:size-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className={`text-sm sm:text-lg font-semibold font-sans ${isActive ? 'text-amber-500' : 'text-zinc-500'}`}>
                          {stepNum}
                        </span>
                      )}
                    </div>
                    <span className={`hidden sm:block text-xs sm:text-sm font-semibold font-sans text-center leading-none ${isActive || isCompleted ? 'text-amber-500' : 'text-zinc-500'}`}>
                      {step === 'Contact' ? t('stepContact') : t('step' + step as any)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
            {/* ── Step 1: Shape ── */}
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-amber-500 text-sm font-sans">{t('stepProgress', { current: 1, total: 5 })}</span>
                <h2 className="text-neutral-800 text-2xl font-semibold font-sans leading-7">{t('selectShape')}</h2>
                <p className="text-neutral-700 text-sm font-sans leading-5">{t('selectShapeDesc')}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {SHAPES.map((s) => {
                  const active = selectedShape === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedShape(s.id)}
                      className={`w-full px-2 sm:px-3 py-4 relative rounded-lg outline outline-1 outline-offset-[-1px] flex flex-col items-center gap-3 transition-all ${active ? 'bg-orange-50 outline-amber-500' : 'bg-slate-50 outline-gray-100'
                        }`}
                    >
                      <span className={`absolute right-3 top-3 size-4 rounded-full border flex-shrink-0 ${active ? 'bg-amber-500 border-amber-500' : 'bg-white border-gray-300'}`} />
                      {s.preview}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-neutral-700 text-base font-semibold font-sans">{s.label}</span>
                        <span className="text-zinc-500 text-sm font-medium font-sans leading-4">{s.sub}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="h-px bg-gray-100" />

            {/* ── Step 2: Size ── */}
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-amber-500 text-sm font-sans">{t('stepProgress', { current: 2, total: 5 })}</span>
                <h2 className="text-neutral-800 text-2xl font-semibold font-sans leading-7">{t("enterSize")}</h2>
                <p className="text-neutral-700 text-sm font-sans leading-5">
                  {t("enterSizeDesc")}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="diameter" className="text-neutral-700 text-base font-semibold font-sans">
                  {t("diameter")}
                </label>
                <input
                  id="diameter"
                  type="text"
                  value={diameter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiameter(e.target.value)}
                  placeholder={t("enterSize")}
                  className="h-11 px-5 py-3 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-500/30 text-neutral-700 text-sm font-sans w-full bg-white focus:outline-amber-500 focus:outline-2 transition-all"
                />
                <p className="text-zinc-500 text-sm font-sans leading-5">
                  {t('sizeHint')}
                </p>
              </div>
            </section>

            <div className="h-px bg-gray-100" />

            {/* ── Step 3: Printer ── */}
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-amber-500 text-sm font-sans">{t('stepProgress', { current: 3, total: 5 })}</span>
                <h2 className="text-neutral-800 text-2xl font-semibold font-sans leading-7">{t("selectPrinter")}</h2>
                <p className="text-neutral-700 text-sm font-sans leading-5">{t("selectPrinterDesc")}</p>
              </div>
              <div className="flex flex-col gap-4">
                <PrinterModelSelect
                  value={null}
                  onValueChange={(printer) => {
                    if (printer) {
                      setPrinterQuery(printer.name);
                    }
                  }}
                  onTextChange={setPrinterQuery}
                  placeholder={t("searchPrinter")}
                  className="h-11 outline outline-1 outline-offset-[-1px] outline-zinc-500/30 bg-white"
                  inputId="printer-search"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="unknown-printer"
                    type="checkbox"
                    checked={unknownPrinter}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnknownPrinter(e.target.checked)}
                    className="size-4 accent-amber-500"
                  />
                  <span className="text-neutral-700 text-base font-semibold font-sans">{t('unknownPrinter')}</span>
                </label>
              </div>
            </section>

            <div className="h-px bg-gray-100" />

            {/* ── Step 4: Material ── */}
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-amber-500 text-sm font-sans">{t('stepProgress', { current: 4, total: 5 })}</span>
                <h2 className="text-neutral-800 text-2xl font-semibold font-sans leading-7">{t("selectMaterial")}</h2>
                <p className="text-neutral-700 text-sm font-sans leading-5">{t('materialHint')}</p>
              </div>
              <div className="flex flex-col gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="unsure-material"
                    type="checkbox"
                    checked={unsureMaterial}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnsureMaterial(e.target.checked)}
                    className="size-4 accent-amber-500"
                  />
                  <span className="text-neutral-700 text-base font-semibold font-sans">{t('unsureMaterialCheck')}</span>
                </label>

                <div className="flex flex-col gap-2">
                  <label htmlFor="material-code" className="text-neutral-700 text-base font-semibold font-sans">
                    {t('materialCode')}
                  </label>
                  <MaterialModelSelect
                    value={null}
                    onValueChange={(material) => {
                      if (material) {
                        setMaterialCode(material.code);
                      }
                    }}
                    onTextChange={setMaterialCode}
                    placeholder={t('searchMaterialCode')}
                    className="h-11 outline outline-1 outline-offset-[-1px] outline-zinc-500/30 bg-white"
                    inputId="material-code"
                  />
                  <p className="text-zinc-500 text-sm font-sans leading-5">
                    {t('materialCodeHint')}
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <p>
                    <span className="text-neutral-700 text-base font-semibold font-sans">{t('materialType')} </span>
                    <span className="text-zinc-500 text-sm font-sans">{t('optional')}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {MATERIALS.map((mat) => {
                      const active = selectedMaterial === mat.id;
                      return (
                        <button
                          key={mat.id}
                          type="button"
                          onClick={() => setSelectedMaterial(active ? null : mat.id)}
                          className={`px-2 py-2.5 rounded-lg outline outline-1 outline-offset-[-1px] flex items-center gap-2 transition-colors ${active ? 'bg-orange-50 outline-amber-500' : 'bg-slate-50 outline-gray-100'
                            }`}
                        >
                          <span className={`size-4 rounded-full border shrink-0 ${active ? 'bg-amber-500 border-amber-500' : 'bg-white border-gray-300'}`} />
                          <span className="text-neutral-700 text-sm font-semibold font-sans">{mat.label}</span>
                          <span className="text-zinc-500 text-sm font-medium font-sans leading-4">{mat.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-700 text-base font-sans">{t('forgotMaterialCode')}</span>
                <Link href="/materials">
                  <button type="button" className="text-amber-500 text-base font-semibold font-sans underline hover:text-amber-600 transition-colors">
                    {t('seeMaterialOverview')}
                  </button>
                </Link>
              </div>
            </section>

            <div className="h-px bg-gray-100" />

            {/* ── Step 5: Contact ── */}
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-amber-500 text-sm font-sans">{t('stepProgress', { current: 5, total: 5 })}</span>
                <h2 className="text-neutral-800 text-2xl font-semibold font-sans leading-7">{t('whereSendQuote')}</h2>
                <p className="text-neutral-700 text-sm font-sans leading-5">{t('contactHint')}</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-2">
                    <label htmlFor="company" className="text-neutral-800 text-lg font-semibold font-sans leading-5">{t("company")}</label>
                    <input
                      id="company"
                      type="text"
                      value={company}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany(e.target.value)}
                      placeholder={t('yourCompany')}
                      className="h-11 px-5 py-3 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-700 text-base font-sans w-full bg-white focus:outline-amber-500 focus:outline-2 transition-all"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <label htmlFor="name" className="text-neutral-800 text-lg font-semibold font-sans leading-5">{t("name")}</label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      placeholder={t('yourName')}
                      className="h-11 px-5 py-3 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-700 text-base font-sans w-full bg-white focus:outline-amber-500 focus:outline-2 transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-2">
                    <label htmlFor="email" className="text-neutral-800 text-lg font-semibold font-sans leading-5">{t("email")}</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      placeholder={t('yourEmail')}
                      required
                      className="h-11 px-5 py-3 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-700 text-base font-sans w-full bg-white focus:outline-amber-500 focus:outline-2 transition-all"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <label htmlFor="phone" className="text-neutral-800 text-lg font-semibold font-sans leading-5">{t("phone")}</label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                      placeholder={t('yourPhone')}
                      className="h-11 px-5 py-3 rounded-[38px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-700 text-base font-sans w-full bg-white focus:outline-amber-500 focus:outline-2 transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="comments" className="text-neutral-800 text-lg font-semibold font-sans leading-5">{t('comments')}</label>
                  <textarea
                    id="comments"
                    value={comments}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
                    placeholder={t('commentsPlaceholder')}
                    rows={4}
                    className="px-5 py-4 rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-200 text-neutral-700 text-sm font-sans w-full bg-white resize-none focus:outline-amber-500 focus:outline-2 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || submitStatus === 'success'}
                  className="h-12 px-4 py-2.5 bg-amber-500 rounded-[100px] flex justify-center items-center gap-2 hover:bg-amber-600 disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  <span className="text-white text-base font-semibold font-sans leading-6">
                    {isSubmitting ? t('submitting') : submitStatus === 'success' ? t('requestSent') : t('submitRequest')}
                  </span>
                </button>
                {submitStatus === 'success' && (
                  <div className="p-4 bg-green-50 text-green-700 text-sm rounded-xl outline outline-1 outline-offset-[-1px] outline-green-200">
                    {t('successMessage')}
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl outline outline-1 outline-offset-[-1px] outline-red-200">
                    {errorMessage}
                  </div>
                )}
              </div>
            </section>
          </form>
        </div>

        {/* ── Sidebar ── */}
        <div className="w-full lg:w-96 flex flex-col gap-6 lg:sticky lg:top-24">
          {/* Overview card */}
          <div className="bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-100 outline outline-1 outline-offset-[-1px] outline-gray-200">
              <h3 className="text-center text-neutral-700 text-2xl font-bold font-sans leading-7">{t('overview')}</h3>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {/* Preview */}
              <div className="flex flex-col gap-4">
                <span className="text-neutral-800 text-lg font-bold font-sans leading-5">{t('preview')}</span>
                <div className="h-32 flex items-center justify-center pt-2 pr-6">
                  {selectedShape ? (
                    <div className="relative flex flex-col items-center">
                      <div className="relative flex items-center justify-center">
                        {/* The Sticker Shape */}
                        {(() => {
                          const baseClasses = "bg-white border border-neutral-700 shadow-sm";
                          switch (selectedShape) {
                            case 'rectangular':
                              return <div className={`w-32 h-20 rounded-sm ${baseClasses}`} />;
                            case 'round':
                              return <div className={`w-24 h-24 rounded-full ${baseClasses}`} />;
                            case 'oval':
                              return <div className={`w-32 h-20 rounded-[100%] ${baseClasses}`} />;
                            case 'custom':
                              return (
                                <div className="w-32 h-20">
                                  <svg viewBox="0 0 56 32" className="w-full h-full drop-shadow-sm" fill="white" stroke="#404040" strokeWidth={1}>
                                    <path d="M4 28 L10 4 L30 4 Q52 4 52 16 Q52 28 30 28 Z" />
                                  </svg>
                                </div>
                              );
                            default:
                              return null;
                          }
                        })()}

                        {/* Vertical Dimension (Right) */}
                        {dimH && (
                          <div className="absolute -right-6 top-0 bottom-0 flex flex-col items-center opacity-80">
                            <div className="w-px bg-zinc-200 flex-1" />
                            <span className="text-[11px] text-zinc-400 py-1 font-sans" style={{ writingMode: 'vertical-rl' }}>{dimH}</span>
                            <div className="w-px bg-zinc-200 flex-1" />
                          </div>
                        )}

                        {/* Horizontal Dimension (Bottom) */}
                        {dimW && (
                          <div className="absolute -bottom-6 left-0 right-0 flex items-center opacity-80">
                            <div className="h-px bg-zinc-200 flex-1" />
                            <span className="text-[11px] text-zinc-400 px-2 font-sans">{dimW}</span>
                            <div className="h-px bg-zinc-200 flex-1" />
                          </div>
                        )}
                      </div>
                      <span className="text-zinc-500 text-sm font-medium font-sans mt-8">
                        {SHAPES.find((s) => s.id === selectedShape)?.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-center text-zinc-500 text-sm font-medium font-sans leading-4">
                      {t('selectShapePreview')}
                    </span>
                  )}
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Your Choices */}
              <div className="flex flex-col gap-4">
                <span className="text-neutral-800 text-lg font-bold font-sans leading-5">{t('yourChoices')}</span>
                <div className="min-h-14">
                  {!hasChoices ? (
                    <span className="text-zinc-500 text-sm font-medium font-sans leading-4">{t('noChoicesYet')}</span>
                  ) : (
                    <ul className="text-sm text-neutral-700 font-sans space-y-1">
                      {selectedShape && (
                        <li>
                          <span className="font-semibold">{t('stepShape')}: </span>
                          {SHAPES.find((s) => s.id === selectedShape)?.label}
                        </li>
                      )}
                      {diameter && (
                        <li>
                          <span className="font-semibold">{t('stepSize')}: </span>
                          {diameter} mm
                        </li>
                      )}
                      {(printerQuery || unknownPrinter) && (
                        <li>
                          <span className="font-semibold">{t('printerLbl')} </span>
                          {unknownPrinter ? t('unknown') : printerQuery}
                        </li>
                      )}
                      {selectedMaterial && (
                        <li>
                          <span className="font-semibold">{t('materialLbl')} </span>
                          {MATERIALS.find((m) => m.id === selectedMaterial)?.label}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Help */}
              <div className="flex flex-col gap-4">
                <span className="text-neutral-800 text-lg font-bold font-sans leading-5">{t("helpTitle")}</span>
                <div className="flex gap-4">
                  {(
                    [
                      {
                        label: t('callUs'),
                        href: 'tel:+31318590465',
                        icon: (
                          <svg width="25" height="25" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_1909_11213" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16"><rect width="16" height="16" fill="#D9D9D9" /></mask><g mask="url(#mask0_1909_11213)"><path d="M12.9623 13.6615C11.7059 13.6615 10.4438 13.3693 9.17578 12.7851C7.90789 12.2009 6.74295 11.3768 5.68095 10.3128C4.61906 9.24868 3.79601 8.08368 3.21178 6.81779C2.62756 5.55201 2.33545 4.29096 2.33545 3.03463C2.33545 2.83274 2.40212 2.66451 2.53545 2.52996C2.66878 2.3954 2.83545 2.32812 3.03545 2.32812H5.20978C5.37812 2.32812 5.52662 2.38307 5.65528 2.49296C5.78395 2.60274 5.86578 2.7384 5.90078 2.89996L6.28295 4.86146C6.30939 5.04346 6.30384 5.19985 6.26628 5.33063C6.22862 5.4614 6.16106 5.57124 6.06362 5.66013L4.52395 7.15896C4.77173 7.61274 5.05484 8.04202 5.37328 8.44679C5.69162 8.85146 6.03628 9.23796 6.40728 9.60629C6.77306 9.97218 7.16195 10.312 7.57395 10.6256C7.98595 10.9393 8.43084 11.2312 8.90862 11.5013L10.4046 9.99229C10.509 9.88374 10.6353 9.80763 10.7836 9.76396C10.9318 9.7204 11.0859 9.70974 11.2458 9.73196L13.097 10.109C13.2653 10.1534 13.4027 10.2393 13.5091 10.3666C13.6156 10.494 13.6688 10.6384 13.6688 10.8V12.9615C13.6688 13.1615 13.6015 13.3281 13.467 13.4615C13.3324 13.5948 13.1642 13.6615 12.9623 13.6615ZM4.05078 6.21279L5.24062 5.07429C5.26195 5.05718 5.27584 5.03368 5.28228 5.00379C5.28873 4.9739 5.28767 4.94613 5.27912 4.92046L4.98928 3.43063C4.98073 3.39651 4.96578 3.3709 4.94445 3.35379C4.92312 3.33668 4.89534 3.32813 4.86112 3.32813H3.43545C3.40978 3.32813 3.38839 3.33668 3.37128 3.35379C3.35428 3.3709 3.34578 3.39229 3.34578 3.41796C3.37989 3.87351 3.45445 4.33629 3.56945 4.80629C3.68434 5.2764 3.84478 5.74524 4.05078 6.21279ZM9.85078 11.9743C10.2927 12.1803 10.7536 12.3378 11.2334 12.4468C11.7135 12.5557 12.162 12.6204 12.5789 12.641C12.6046 12.641 12.626 12.6324 12.6431 12.6153C12.6602 12.5982 12.6688 12.5768 12.6688 12.5511V11.1486C12.6688 11.1144 12.6602 11.0866 12.6431 11.0653C12.626 11.044 12.6004 11.029 12.5663 11.0205L11.1663 10.7358C11.1406 10.7272 11.1182 10.7262 11.099 10.7326C11.0797 10.7391 11.0594 10.753 11.038 10.7743L9.85078 11.9743Z" fill="#F18800" /></g></svg>
                        ),
                      },
                      {
                        label: t('emailBtn'),
                        href: 'mailto:verkoop@businesslabels.nl?subject=Custom-made Label Request',
                        icon: (
                          <svg width="25" height="25" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_1909_11220" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16"><rect width="16" height="16" fill="#D9D9D9" /></mask><g mask="url(#mask0_1909_11220)"><path d="M2.87179 13C2.53501 13 2.24996 12.8833 2.01663 12.65C1.78329 12.4167 1.66663 12.1316 1.66663 11.7948V4.20517C1.66663 3.86839 1.78329 3.58333 2.01663 3.35C2.24996 3.11667 2.53501 3 2.87179 3H13.1281C13.4649 3 13.75 3.11667 13.9833 3.35C14.2166 3.58333 14.3333 3.86839 14.3333 4.20517V11.7948C14.3333 12.1316 14.2166 12.4167 13.9833 12.65C13.75 12.8833 13.4649 13 13.1281 13H2.87179ZM13.3333 4.9615L8.32429 8.168C8.27307 8.197 8.22007 8.21983 8.16529 8.2365C8.11063 8.25317 8.05552 8.2615 7.99996 8.2615C7.9444 8.2615 7.88929 8.25317 7.83463 8.2365C7.77985 8.21983 7.72685 8.197 7.67563 8.168L2.66663 4.9615V11.7948C2.66663 11.8547 2.68585 11.9039 2.72429 11.9423C2.76274 11.9808 2.8119 12 2.87179 12H13.1281C13.188 12 13.2372 11.9808 13.2756 11.9423C13.3141 11.9039 13.3333 11.8547 13.3333 11.7948V4.9615ZM7.99996 7.33333L13.2308 4H2.76913L7.99996 7.33333ZM2.66663 5.11533V4.35317V4.373V4.35183V5.11533Z" fill="#F18800" /></g></svg>
                        ),
                      },
                      {
                        label: t('whatsappBtn'),
                        href: 'https://wa.me/31318590212?text=Custom-made%20Label%20Request',
                        icon: (
                          <svg width="25" height="25" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 16L1.12466 11.8913C0.430666 10.6887 0.0659999 9.32533 0.0666665 7.92733C0.0686665 3.55667 3.62533 0 7.99532 0C10.116 0.000666667 12.1066 0.826667 13.604 2.32533C15.1006 3.824 15.9246 5.816 15.924 7.93467C15.922 12.306 12.3653 15.8627 7.99532 15.8627C6.66865 15.862 5.36132 15.5293 4.20332 14.8973L0 16ZM4.39799 13.462C5.51532 14.1253 6.58198 14.5227 7.99265 14.5233C11.6246 14.5233 14.5833 11.5673 14.5853 7.93333C14.5866 4.292 11.642 1.34 7.99798 1.33867C4.36332 1.33867 1.40666 4.29467 1.40533 7.928C1.40466 9.41133 1.83933 10.522 2.56933 11.684L1.90333 14.116L4.39799 13.462ZM11.9893 9.81933C11.94 9.73667 11.808 9.68733 11.6093 9.588C11.4113 9.48867 10.4373 9.00933 10.2553 8.94333C10.074 8.87733 9.94198 8.844 9.80931 9.04267C9.67731 9.24067 9.29731 9.68733 9.18198 9.81933C9.06665 9.95133 8.95065 9.968 8.75265 9.86867C8.55465 9.76933 7.91598 9.56067 7.15932 8.88533C6.57065 8.36 6.17265 7.71133 6.05732 7.51267C5.94199 7.31467 6.04532 7.20733 6.14399 7.10867C6.23332 7.02 6.34199 6.87733 6.44132 6.76133C6.54199 6.64667 6.57465 6.564 6.64132 6.43133C6.70732 6.29933 6.67465 6.18333 6.62465 6.084C6.57465 5.98533 6.17865 5.01 6.01399 4.61333C5.85265 4.22733 5.68932 4.27933 5.56799 4.27333L5.18799 4.26667C5.05599 4.26667 4.84132 4.316 4.65999 4.51467C4.47866 4.71333 3.96666 5.192 3.96666 6.16733C3.96666 7.14267 4.67666 8.08467 4.77532 8.21667C4.87466 8.34867 6.17199 10.35 8.15932 11.208C8.63198 11.412 9.00131 11.534 9.28865 11.6253C9.76331 11.776 10.1953 11.7547 10.5366 11.704C10.9173 11.6473 11.7086 11.2247 11.874 10.762C12.0393 10.2987 12.0393 9.902 11.9893 9.81933Z" fill="#F18800" /></svg>
                        ),
                      },
                    ] as { label: string; href: string; icon: ReactNode }[]
                  ).map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.label === 'WhatsApp' ? '_blank' : undefined}
                      rel={item.label === 'WhatsApp' ? 'noopener noreferrer' : undefined}
                      className="flex-1 p-3 bg-slate-100/30 rounded-xl outline outline-1 outline-offset-[-1px] outline-gray-100 flex flex-col items-center gap-3 hover:bg-orange-50 transition-colors"
                    >
                      <div className="size-16 p-1.5 bg-orange-50 rounded-lg shadow-sm flex justify-center items-center">
                        {item.icon}
                      </div>
                      <span className="text-neutral-800 text-base font-semibold font-sans leading-5">{item.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Benefits card */}
          <div className="bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-gray-100 overflow-hidden">
            <div className="p-4 flex flex-col gap-4">
              {(
                [
                  { title: t('benefit1Title'), sub: t('benefit1Desc') },
                  { title: t('benefit2Title'), sub: t('benefit2Desc') },
                  { title: t('benefit3Title'), sub: t('benefit3Desc') },
                ] as { title: string; sub: string }[]
              ).map((item) => (
                <div key={item.title} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.3519 7.49865C16.6944 9.17962 16.4503 10.9272 15.6603 12.45C14.8703 13.9728 13.5821 15.1787 12.0106 15.8666C10.439 16.5546 8.67914 16.683 7.0244 16.2304C5.36965 15.7779 3.92007 14.7717 2.91738 13.3797C1.91469 11.9877 1.41951 10.2941 1.51442 8.58119C1.60933 6.8683 2.28858 5.23972 3.43891 3.96703C4.58924 2.69434 6.14111 1.85447 7.83572 1.58749C9.53034 1.32051 11.2653 1.64254 12.7512 2.4999" stroke="#00A63E" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.75 8.25L9 10.5L16.5 3" stroke="#00A63E" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span className="text-neutral-800 text-base font-semibold font-['Segoe_UI'] leading-5">{item.title}</span>
                  </div>
                  <span className="text-neutral-700 text-xs font-['Segoe_UI'] leading-5">{item.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
