'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';

export default function PrintSamplePage() {
  const locale = useLocale();

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
              desc: p.brand || p.model || 'Printer'
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
              desc: m.subtitle || m.brand || 'Material'
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
      setError('Please fill in your first name, last name, and email address.');
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
        setError(data.message || 'Something went wrong. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="relative bg-white min-h-screen flex items-center justify-center">
        <div className="size-48 right-0 top-20 absolute bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />
        <div className="size-48 left-0 top-60 absolute bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="2"/>
            </svg>
          </div>
          <h2 className="text-neutral-800 text-3xl font-bold font-['Segoe_UI'] mb-4">Request Submitted!</h2>
          <p className="text-neutral-600 text-lg font-['Segoe_UI'] leading-7 mb-8">
            Thank you! We have received your print sample request and sent a confirmation to your email. Our team will review your design and get in touch with you shortly.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ first_name: '', last_name: '', email: '', phone: '', company: '', country: '', street: '', postcode: '', place: '', state: '', application: '', special_material: '', comments: '' }); setSelectedPrinter(''); setSelectedMaterial(''); setPrinterQuery(''); setMaterialQuery(''); setFile(null); setFileName(''); }}
            className="h-12 px-8 bg-amber-500 rounded-[100px] text-white text-base font-semibold font-['Segoe_UI'] hover:bg-amber-600 transition-all"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white overflow-hidden min-h-screen">
      <div className="size-48 right-0 top-[780px] absolute bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />
      <div className="size-48 left-0 top-[454px] absolute bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto py-10 flex flex-col gap-4">

        {/* Breadcrumb */}
        <div className="h-4 inline-flex justify-start items-center gap-2">
          <div className="size-4 bg-zinc-300 rounded-sm" />
          <div className="size-2.5 bg-zinc-500 rounded-sm" />
          <span className="text-zinc-500 text-sm font-normal font-['Segoe_UI'] leading-5">/</span>
          <span className="text-zinc-500 text-sm font-normal font-['Segoe_UI'] leading-5">Support</span>
          <span className="text-zinc-500 text-sm font-normal font-['Segoe_UI'] leading-5">/</span>
          <span className="text-neutral-700 text-sm font-semibold font-['Segoe_UI'] leading-5">Print Sample</span>
        </div>

        {/* Page header */}
        <div className="flex flex-col gap-4">
          <h1 className="text-neutral-800 text-4xl font-bold font-['Segoe_UI'] leading-[48px]">Print Sample Request</h1>
          <p className="w-full max-w-[939px] text-neutral-700 text-lg font-normal font-['Segoe_UI'] leading-6">
            Request a printed sample of your own label design on an Epson ColorWorks printer. Fill in the form below and
            we will print and ship your sample free of charge. We will contact you if we need to discuss any specific requirements.
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
                  <h2 className="text-neutral-800 text-2xl font-semibold font-['Segoe_UI'] leading-7">Design file</h2>
                  <p className="text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5">Upload your label artwork as PDF or image</p>
                </div>
                <label htmlFor="file-upload" className="self-stretch h-48 min-h-36 bg-white rounded-md outline-dashed outline-2 outline-offset-[-2px] outline-black/10 flex flex-col justify-center items-center cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-gray-100 inline-flex justify-center items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M3.5 12.5V14C3.5 14.8284 4.17157 15.5 5 15.5H15C15.8284 15.5 16.5 14.8284 16.5 14V12.5" stroke="#71717a" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 2.5L10 11.5M10 2.5L7 5.5M10 2.5L13 5.5" stroke="#71717a" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="w-56 flex flex-col items-start gap-1">
                      {fileName ? (
                        <p className="text-amber-600 text-base font-semibold font-['Segoe_UI']">{fileName}</p>
                      ) : (
                        <>
                          <p className="text-neutral-700 text-base font-semibold font-['Segoe_UI']">Drop your file here, or <span className="text-amber-500 underline">browse</span></p>
                          <p className="text-zinc-500 text-sm font-normal font-['Segoe_UI'] leading-5">PDF, JPG, PNG or TIFF &mdash; max 50 MB</p>
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
                  <h2 className="text-neutral-800 text-2xl font-semibold font-['Segoe_UI'] leading-7">Printer</h2>
                  <p className="text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5">Choose the ColorWorks model you want your design printed on</p>
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search for a printer..." 
                    value={printerQuery}
                    onChange={(e) => setPrinterQuery(e.target.value)}
                    className="w-full h-12 px-10 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 font-['Segoe_UI'] leading-6 focus:outline-amber-400 focus:outline-2 transition-all"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20.9999 20.9999L16.6499 16.6499" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {isSearchingPrinters && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#71717a" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
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
                     <p className="text-zinc-500 text-sm font-['Segoe_UI'] italic">No printers found for &quot;{printerQuery}&quot;.</p>
                  ) : printerQuery.trim().length === 0 ? (
                     <p className="text-zinc-500 text-sm font-['Segoe_UI']">Please search for a printer model above.</p>
                  ) : null}
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Material */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-neutral-800 text-2xl font-semibold font-['Segoe_UI'] leading-7">Material</h2>
                  <p className="text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5">Select the label stock that best matches your application</p>
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search for a material..." 
                    value={materialQuery}
                    onChange={(e) => setMaterialQuery(e.target.value)}
                    className="w-full h-12 px-10 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 font-['Segoe_UI'] leading-6 focus:outline-amber-400 focus:outline-2 transition-all"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20.9999 20.9999L16.6499 16.6499" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {isSearchingMaterials && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#71717a" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
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
                     <p className="text-zinc-500 text-sm font-['Segoe_UI'] italic">No materials found for &quot;{materialQuery}&quot;.</p>
                  ) : materialQuery.trim().length === 0 ? (
                     <p className="text-zinc-500 text-sm font-['Segoe_UI']">Please search for a material above.</p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <p className="text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">Special material needs</p>
                  <textarea name="special_material" value={form.special_material} onChange={handleChange} rows={4} placeholder="e.g. freezer-grade adhesive, clear polyester, scratch-resistant laminate..." className="self-stretch px-5 py-4 rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 font-['Segoe_UI'] leading-6 resize-none focus:outline-amber-400 focus:outline-2 transition-all" />
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Request Details */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-neutral-800 text-2xl font-semibold font-['Segoe_UI'] leading-7">Request details</h2>
                  <p className="text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5">Tell us about the application and where to send the sample</p>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">Application</label>
                    <textarea name="application" value={form.application} onChange={handleChange} rows={4} placeholder="Describe the intended use - e.g. food packaging labels, logistics shipping labels, chemical drum labels..." className="self-stretch px-5 py-4 rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 font-['Segoe_UI'] leading-6 resize-none focus:outline-amber-400 focus:outline-2 transition-all" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="First name *" name="first_name" value={form.first_name} onChange={handleChange} placeholder="First name" required />
                    <FormField label="Last name *" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last name" required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Email *" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" type="email" required />
                    <FormField label="Phone number" name="phone" value={form.phone} onChange={handleChange} placeholder="+555-113324" type="tel" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Company" name="company" value={form.company} onChange={handleChange} placeholder="ABCD" />
                    <div className="flex flex-col gap-2">
                      <label className="text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">Country / Region</label>
                      <input name="country" value={form.country} onChange={handleChange} placeholder="Select Country" className="self-stretch h-12 px-5 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 font-['Segoe_UI'] leading-6 focus:outline-amber-400 focus:outline-2 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Street and house number" name="street" value={form.street} onChange={handleChange} placeholder="Street and house number" />
                    <FormField label="Postcode" name="postcode" value={form.postcode} onChange={handleChange} placeholder="Postcode" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Place" name="place" value={form.place} onChange={handleChange} placeholder="Place" />
                    <FormField label="State (optional)" name="state" value={form.state} onChange={handleChange} placeholder="State" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">Additional comments</label>
                    <textarea name="comments" value={form.comments} onChange={handleChange} rows={4} placeholder="Any other information that may be helpful for our team..." className="self-stretch px-5 py-4 rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 font-['Segoe_UI'] leading-6 resize-none focus:outline-amber-400 focus:outline-2 transition-all" />
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex flex-col gap-4">
                <p className="text-sm font-['Segoe_UI'] leading-5 text-neutral-700">
                  <span className="font-semibold text-neutral-800">Disclaimer: </span>
                  By submitting this request you acknowledge that Epson reserves the right to modify or adapt the submitted artwork where necessary for print compatibility. Label dimensions are provided as a best-effort service - exact size reproduction cannot be guaranteed. This service is offered free of charge under a fair-use policy; commercial or high-volume requests may be declined or referred to a local reseller. We will contact you or are available for any questions you may have throughout the process.
                </p>
                <p className="text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5">Your request will be sent to our team and confirmed by email.</p>
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-['Segoe_UI']">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="self-stretch h-12 px-4 py-2.5 bg-amber-500 rounded-[100px] flex justify-center items-center gap-2 hover:bg-amber-600 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
                    </svg>
                    <span className="text-white text-base font-semibold font-['Segoe_UI'] leading-6">Sending...</span>
                  </>
                ) : (
                  <span className="text-white text-base font-semibold font-['Segoe_UI'] leading-6">Submit Request</span>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-6">
            <div className="p-4 bg-gray-50 rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col gap-4 overflow-hidden">
              <div className="flex flex-col gap-2">
                <h3 className="text-neutral-800 text-xl font-semibold font-['Segoe_UI'] leading-7">How to prepare your PDF</h3>
                <p className="text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-5">Follow these guidelines to ensure the best possible print result</p>
              </div>
              <div className="h-px bg-slate-100" />
              {[
                { title: 'Text as outlines', desc: 'Convert all fonts to outlines/curves to ensure correct rendering regardless of font availability.' },
                { title: 'RGB color space', desc: 'Use RGB mode. ColorWorks printers optimize RGB for accurate colors.' },
                { title: 'Exact label dimensions + 3 mm bleed', desc: 'Set document size to label dimensions with 3 mm bleed beyond die-cut line.' },
                { title: '2 mm safe margin', desc: 'Keep all critical content (text, barcodes, logos) at least 2 mm inside the label edge to avoid trimming.' },
                { title: 'Minimum font size 4 pt', desc: 'Fonts smaller than 4 pt may not reproduce cleanly on label stock. Minimum 4 pt recommended for all text.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-neutral-800 text-base font-semibold font-['Segoe_UI'] leading-5">{item.title}</p>
                    <p className="text-neutral-700 text-sm font-normal font-['Segoe_UI'] leading-5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl outline outline-1 outline-offset-[-1px] outline-orange-100 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5Z" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 5.33V8.67" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8" cy="10.67" r="0.67" fill="#ca8a04"/>
                </svg>
              </div>
              <p className="text-yellow-600 text-base font-['DM_Sans'] leading-5">
                <span className="font-bold">Note: </span>
                We may adjust your document to fit printer and material limits. Exact label size cannot be guaranteed, but we will try to match your specs closely.
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
            <div className="size-4 absolute inset-0 bg-amber-500 rounded-full flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.19 5L3.81 6.62L7.81 2.62" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          ) : (
            <div className="size-4 absolute inset-0 bg-white rounded-full border border-gray-300" />
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-1 text-left">
        <p className="text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{option.name}</p>
        <p className="text-zinc-500 text-sm font-normal font-['Segoe_UI'] leading-5">{option.desc}</p>
      </div>
    </button>
  );
}

function RadioChip({ label, selected, onChange }) {
  return (
    <button type="button" onClick={onChange} className={"w-60 px-2 py-2.5 rounded-lg flex justify-start items-center gap-2 transition-all " + (selected ? 'bg-transparent outline outline-[1.5px] outline-offset-[-1.5px] outline-amber-500' : 'bg-slate-50 outline outline-1 outline-offset-[-1px] outline-gray-100 hover:outline-amber-300')}>
      <div className="size-4 relative flex-shrink-0">
        {selected ? (
          <div className="size-4 absolute inset-0 bg-amber-500 rounded-full flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.19 5L3.81 6.62L7.81 2.62" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        ) : (
          <div className="size-4 absolute inset-0 bg-white rounded-full border border-gray-300" />
        )}
      </div>
      <span className="text-neutral-700 text-sm font-semibold font-['Segoe_UI']">{label}</span>
    </button>
  );
}

function FormField({ label, name, value, onChange, placeholder, type, required }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-neutral-800 text-lg font-semibold font-['Segoe_UI'] leading-5">{label}</label>
      <input type={type || 'text'} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} className="self-stretch h-12 px-5 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-zinc-200 text-base text-neutral-800 placeholder:text-zinc-500 font-['Segoe_UI'] leading-6 focus:outline-amber-400 focus:outline-2 transition-all" />
    </div>
  );
}
