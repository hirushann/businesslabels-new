'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({ subsets: ['latin'] });

export default function PrintSamplePage() {
  const locale = useLocale();
  const t = useTranslations('printSample');

  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [printerQuery, setPrinterQuery] = useState('');
  const [printerResults, setPrinterResults] = useState([]);
  const [isSearchingPrinters, setIsSearchingPrinters] = useState(false);

  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [materialQuery, setMaterialQuery] = useState('');
  const [materialResults, setMaterialResults] = useState([]);
  const [isSearchingMaterials, setIsSearchingMaterials] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    company: '', country: '', street: '', postcode: '',
    place: '', state: '', application: '', special_material: '', comments: '',
  });

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (printerQuery.trim().length >= 3) {
        setIsSearchingPrinters(true);
        try {
          const res = await fetch(`/api/printers/search?query=${encodeURIComponent(printerQuery)}`);
          const json = await res.json();
          if (json.data) {
            setPrinterResults(json.data.map(p => ({
              id: p.id,
              name: p.name,
              desc: p.brand || p.model || t('printerDesc')
            })));
          }
        } catch (err) {
          console.error("Error fetching printers", err);
        } finally {
          setIsSearchingPrinters(false);
        }
      } else {
        setPrinterResults([]);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [printerQuery]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (materialQuery.trim().length >= 3) {
        setIsSearchingMaterials(true);
        try {
          const res = await fetch(`/api/materials?search=${encodeURIComponent(materialQuery)}&perPage=9`);
          const json = await res.json();
          if (json.materials) {
            setMaterialResults(json.materials.map(m => ({
              id: m.id,
              name: m.title,
              desc: m.subtitle || m.brand || t('materialDesc')
            })));
          }
        } catch (err) {
          console.error("Error fetching materials", err);
        } finally {
          setIsSearchingMaterials(false);
        }
      } else {
        setMaterialResults([]);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [materialQuery]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.first_name || !form.last_name || !form.email) {
      setError(t('errorIncomplete'));
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (selectedPrinter) formData.append('printer', selectedPrinter);
      if (selectedMaterial) formData.append('substrate', selectedMaterial);
      formData.append('finish', '');
      formData.append('locale', locale);
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch('/api/print-sample', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || t('errorGeneric'));
      } else {
        setSubmitted(true);
      }
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="relative bg-white min-h-screen flex items-center justify-center">
        <div className="size-48 right-0 top-20 absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none" />
        <div className="size-48 left-0 top-60 absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none" />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="2"/>
            </svg>
          </div>
          <h2 className="text-neutral-800 text-3xl font-bold mb-4">{t('successTitle')}</h2>
          <p className="text-neutral-600 text-lg leading-7 mb-8">
            {t('successDesc')}
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ first_name: '', last_name: '', email: '', phone: '', company: '', country: '', street: '', postcode: '', place: '', state: '', application: '', special_material: '', comments: '' }); setSelectedPrinter(''); setSelectedMaterial(''); setPrinterQuery(''); setMaterialQuery(''); setFile(null); setFileName(''); }}
            className="h-12 px-8 bg-brand rounded-[100px] text-white text-base font-semibold hover:bg-brand-hover transition-all"
          >
            {t('submitAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white overflow-hidden min-h-screen w-full px-4 sm:px-6 lg:px-10">
      <div className="size-48 right-0 top-[780px] absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none" />
      <div className="size-48 left-0 top-[454px] absolute bg-brand/30 rounded-full blur-[132px] pointer-events-none" />

      <div className="max-w-360 mx-auto py-10 flex flex-col gap-4">

        {/* Breadcrumb */}
        <div className="h-4 inline-flex justify-start items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 10 11" fill="none"><path d="M1 9.9615H3.23083V6.6025C3.23083 6.43183 3.28856 6.28872 3.404 6.17317C3.51956 6.05772 3.66267 6 3.83333 6H6.16667C6.33733 6 6.48044 6.05772 6.596 6.17317C6.71144 6.28872 6.76917 6.43183 6.76917 6.6025V9.9615H9V4.064C9 4.02989 8.9925 3.99895 8.9775 3.97117C8.96261 3.94339 8.94233 3.91878 8.91667 3.89733L5.12183 1.04483C5.08761 1.01494 5.047 1 5 1C4.953 1 4.91239 1.01494 4.87817 1.04483L1.08333 3.89733C1.05767 3.91878 1.03739 3.94339 1.0225 3.97117C1.0075 3.99895 1 4.02989 1 4.064V9.9615ZM0 9.9615V4.064C0 3.87322 0.0426665 3.6925 0.128 3.52183C0.213444 3.35106 0.331444 3.21044 0.482 3.1L4.277 0.241C4.48756 0.0803337 4.72822 0 4.999 0C5.26978 0 5.51111 0.0803337 5.723 0.241L9.518 3.1C9.66856 3.21044 9.78656 3.35106 9.872 3.52183C9.95733 3.6925 10 3.87322 10 4.064V9.9615C10 10.2342 9.9015 10.469 9.7045 10.666C9.5075 10.863 9.27267 10.9615 9 10.9615H6.37183C6.20106 10.9615 6.05794 10.9037 5.9425 10.7882C5.82694 10.6727 5.76917 10.5296 5.76917 10.3588V7H4.23083V10.3588C4.23083 10.5296 4.17306 10.6727 4.0575 10.7882C3.94206 10.9037 3.79894 10.9615 3.62817 10.9615H1C0.727333 10.9615 0.4925 10.863 0.2955 10.666C0.0984999 10.469 0 10.2342 0 9.9615Z" fill="var(--subtle)"/></svg>
          <span className="text-zinc-500 text-sm font-normal leading-5">/</span>
          <span className="text-zinc-500 text-sm font-normal leading-5">{t('breadcrumbSupport')}</span>
          <span className="text-zinc-500 text-sm font-normal leading-5">/</span>
          <span className="text-neutral-700 text-sm font-bold leading-5">{t('breadcrumbSample')}</span>
        </div>

        {/* Page header */}
        <div className="flex flex-col gap-4">
          <h1 className="text-ink text-[40px] font-bold leading-[48px]">{t('title')}</h1>
          <p className="w-full max-w-[939px] text-neutral-700 text-lg font-normal leading-6">
            {t('description')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row justify-start items-start gap-6 mt-2">

          {/* Form Card */}
          <div className="flex-1 min-w-0 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col overflow-hidden">
            <div className="h-px bg-slate-100" />
            <div className="p-6 flex flex-col gap-6">

              {/* Design file */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-neutral-800 text-2xl font-bold leading-7">{t('designFile')}</h2>
                  <p className="text-neutral-700 text-sm font-normal leading-5">{t('uploadDesc')}</p>
                </div>
                <label htmlFor="file-upload" className="self-stretch h-48 min-h-36 bg-white rounded-md outline-dashed outline-2 outline-offset-[-2px] outline-black/10 flex flex-col justify-center items-center cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-gray-100 inline-flex justify-center items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M3.5 12.5V14C3.5 14.8284 4.17157 15.5 5 15.5H15C15.8284 15.5 16.5 14.8284 16.5 14V12.5" stroke="var(--subtle)" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 2.5L10 11.5M10 2.5L7 5.5M10 2.5L13 5.5" stroke="var(--subtle)" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="w-56 flex flex-col items-center justify-center gap-1 text-center">
                      {fileName ? (
                        <p className="text-brand text-base font-semibold">{fileName}</p>
                      ) : (
                        <>
                          <p className="text-neutral-700 text-base font-bold">{t('dropFile')} <span className="text-brand underline">{t('browse')}</span></p>
                          <p className="text-zinc-500 text-sm font-normal leading-5">{t('fileTypes')}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <input id="file-upload" type="file" accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff" className="sr-only" onChange={handleFileChange} />
                </label>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Printer */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-neutral-800 text-2xl font-bold leading-7">{t('printerTitle')}</h2>
                  <p className="text-neutral-700 text-sm font-normal leading-5">{t('printerSubtitle')}</p>
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={t('searchPrinterPlaceholder')} 
                    value={printerQuery}
                    onChange={(e) => setPrinterQuery(e.target.value)}
                    className="w-full h-12 px-10 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 leading-6 focus:outline-amber-400 focus:outline-2 transition-all"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="var(--subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20.9999 20.9999L16.6499 16.6499" stroke="var(--subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {isSearchingPrinters && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="var(--subtle)" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {printerResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {printerResults.map((p) => (
                        <SelectOption key={p.id} option={p} selected={selectedPrinter === p.name} onChange={() => setSelectedPrinter(p.name)} />
                      ))}
                    </div>
                  ) : printerQuery.trim().length >= 3 && !isSearchingPrinters ? (
                     <p className="text-zinc-500 text-sm italic">{t('noPrintersFound', { query: printerQuery })}</p>
                  ) : printerQuery.trim().length === 0 ? (
                     <p className="text-zinc-500 text-sm">{t('searchPrinterAbove')}</p>
                  ) : null}
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Material */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-neutral-800 text-2xl font-bold leading-7">{t('materialTitle')}</h2>
                  <p className="text-neutral-700 text-sm font-normal leading-5">{t('materialSubtitle')}</p>
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={t('searchMaterialPlaceholder')} 
                    value={materialQuery}
                    onChange={(e) => setMaterialQuery(e.target.value)}
                    className="w-full h-12 px-10 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 leading-6 focus:outline-amber-400 focus:outline-2 transition-all"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="var(--subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20.9999 20.9999L16.6499 16.6499" stroke="var(--subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {isSearchingMaterials && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="var(--subtle)" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {materialResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {materialResults.map((m) => (
                        <SelectOption key={m.id} option={m} selected={selectedMaterial === m.name} onChange={() => setSelectedMaterial(m.name)} />
                      ))}
                    </div>
                  ) : materialQuery.trim().length >= 3 && !isSearchingMaterials ? (
                     <p className="text-zinc-500 text-sm italic">{t('noMaterialsFound', { query: materialQuery })}</p>
                  ) : materialQuery.trim().length === 0 ? (
                     <p className="text-zinc-500 text-sm">{t('searchMaterialAbove')}</p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <p className="text-neutral-800 text-lg font-bold leading-5">{t('specialMaterialNeeds')}</p>
                  <textarea name="special_material" value={form.special_material} onChange={handleChange} rows={4} placeholder={t('specialMaterialPlaceholder')} className="self-stretch px-5 py-4 rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 leading-6 resize-none focus:outline-amber-400 focus:outline-2 transition-all" />
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Request Details */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-neutral-800 text-2xl font-bold leading-7">{t('requestDetails')}</h2>
                  <p className="text-neutral-700 text-sm font-normal leading-5">{t('requestDetailsDesc')}</p>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-neutral-800 text-lg font-bold leading-5">{t('application')}</label>
                    <textarea name="application" value={form.application} onChange={handleChange} rows={4} placeholder={t('applicationPlaceholder')} className="self-stretch px-5 py-4 rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 leading-6 resize-none focus:outline-amber-400 focus:outline-2 transition-all" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label={t('firstName') + ' *'} name="first_name" value={form.first_name} onChange={handleChange} placeholder={t('firstName')} required />
                    <FormField label={t('lastName') + ' *'} name="last_name" value={form.last_name} onChange={handleChange} placeholder={t('lastName')} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label={t('email') + ' *'} name="email" value={form.email} onChange={handleChange} placeholder={t('emailPlaceholder')} type="email" required />
                    <FormField label={t('phone')} name="phone" value={form.phone} onChange={handleChange} placeholder="+555-113324" type="tel" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label={t('company')} name="company" value={form.company} onChange={handleChange} placeholder="ABCD" />
                    <div className="flex flex-col gap-2">
                      <label className="text-neutral-800 text-lg font-bold leading-5">{t('country')}</label>
                      <input name="country" value={form.country} onChange={handleChange} placeholder={t('countryPlaceholder')} className="self-stretch h-12 px-5 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 leading-6 focus:outline-amber-400 focus:outline-2 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label={t('street')} name="street" value={form.street} onChange={handleChange} placeholder={t('street')} />
                    <FormField label={t('postcode')} name="postcode" value={form.postcode} onChange={handleChange} placeholder={t('postcode')} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label={t('place')} name="place" value={form.place} onChange={handleChange} placeholder={t('place')} />
                    <FormField label={t('stateOptional')} name="state" value={form.state} onChange={handleChange} placeholder={t('state')} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-neutral-800 text-lg font-bold leading-5">{t('comments')}</label>
                    <textarea name="comments" value={form.comments} onChange={handleChange} rows={4} placeholder={t('commentsPlaceholder')} className="self-stretch px-5 py-4 rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 leading-6 resize-none focus:outline-amber-400 focus:outline-2 transition-all" />
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex flex-col gap-4">
                <p className="text-sm leading-5 text-neutral-700">
                  <span className="font-semibold text-neutral-800">{t('disclaimerTitle')} </span>
                  {t('disclaimerText')}
                </p>
                <p className="text-neutral-700 text-sm font-normal leading-5">{t('emailConfirm')}</p>
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="self-stretch h-12 px-4 py-2.5 bg-brand rounded-[100px] flex justify-center items-center gap-2 hover:bg-brand-hover active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
                    </svg>
                    <span className="text-white text-base font-medium leading-6">{t('sending')}</span>
                  </>
                ) : (
                  <span className="text-white text-base font-medium leading-6">{t('submitRequest')}</span>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-6">
            <div className="p-4 bg-gray-50 rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col gap-4 overflow-hidden">
              <div className="flex flex-col gap-2">
                <h3 className="text-ink text-[24px] font-semibold leading-[28px]">{t('preparePdfTitle')}</h3>
                <p className="text-neutral-700 text-base font-normal leading-5">{t('preparePdfDesc')}</p>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex flex-col gap-5">
                {[
                  { title: t('textAsOutlines'), desc: t('textAsOutlinesDesc') },
                  { title: t('rgbColorSpace'), desc: t('rgbColorSpaceDesc') },
                  { title: t('exactDimensions'), desc: t('exactDimensionsDesc') },
                  { title: t('safeMargin'), desc: t('safeMarginDesc') },
                  { title: t('minFontSize'), desc: t('minFontSizeDesc') },
                ].map((item, index) => (
                  <div key={item.title} className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 text-zinc-400 text-lg font-semibold leading-5">
                      {index + 1}.
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-ink text-base font-semibold leading-5">{item.title}</p>
                      <p className="text-neutral-700 text-sm font-normal leading-5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl outline outline-1 outline-offset-[-1px] outline-orange-100 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5Z" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 5.33V8.67" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8" cy="10.67" r="0.67" fill="#ca8a04"/>
                </svg>
              </div>
              <p className={`text-yellow-600 text-base leading-[26px] ${dmSans.className}`}>
                <span className="font-bold">{t('noteTitle')} </span>
                {t('noteDesc')}
              </p>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

function SelectOption({ option, selected, onChange }) {
  return (
    <button type="button" onClick={onChange} className={"flex-1 px-2 py-2.5 rounded-xl flex justify-start items-start gap-2.5 transition-all " + (selected ? 'bg-transparent outline outline-[1.5px] outline-offset-[-1.5px] outline-amber-500' : 'bg-slate-50 outline outline-1 outline-offset-[-1px] outline-gray-100 hover:outline-amber-300')}>
      <div className="h-6 flex justify-start items-center gap-2.5">
        <div className="size-4 relative flex-shrink-0">
          {selected ? (
            <div className="size-4 absolute inset-0 bg-brand rounded-full flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.19 5L3.81 6.62L7.81 2.62" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          ) : (
            <div className="size-4 absolute inset-0 bg-white rounded-full border border-gray-300" />
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-1 text-left">
        <p className="text-neutral-800 text-lg font-bold leading-5">{option.name}</p>
        <p className="text-zinc-500 text-sm font-normal leading-5">{option.desc}</p>
      </div>
    </button>
  );
}

function RadioChip({ label, selected, onChange }) {
  return (
    <button type="button" onClick={onChange} className={"w-60 px-2 py-2.5 rounded-lg flex justify-start items-center gap-2 transition-all " + (selected ? 'bg-transparent outline outline-[1.5px] outline-offset-[-1.5px] outline-amber-500' : 'bg-slate-50 outline outline-1 outline-offset-[-1px] outline-gray-100 hover:outline-amber-300')}>
      <div className="size-4 relative flex-shrink-0">
        {selected ? (
          <div className="size-4 absolute inset-0 bg-brand rounded-full flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.19 5L3.81 6.62L7.81 2.62" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        ) : (
          <div className="size-4 absolute inset-0 bg-white rounded-full border border-gray-300" />
        )}
      </div>
      <span className="text-neutral-700 text-sm font-semibold">{label}</span>
    </button>
  );
}

function FormField({ label, name, value, onChange, placeholder, type, required }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-neutral-800 text-lg font-bold leading-5">{label}</label>
      <input type={type || 'text'} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} className="self-stretch h-12 px-5 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 leading-6 focus:outline-amber-400 focus:outline-2 transition-all" />
    </div>
  );
}
