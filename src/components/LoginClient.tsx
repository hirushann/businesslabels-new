'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState, useRef } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, CheckCircle2, Home, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type LoginErrors = {
  email?: string[];
  password?: string[];
};

type ResetPasswordErrors = {
  email?: string[];
};

type LoginResponse = {
  message?: string;
  user?: unknown;
  data?: unknown;
  customer?: unknown;
  auth?: unknown;
  errors?: LoginErrors;
};

type ResetPasswordResponse = {
  message?: string;
  status?: string;
  errors?: ResetPasswordErrors;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function extractUser(data: LoginResponse, email: string) {
  if (isPlainObject(data.user)) {
    return data.user;
  }

  if (isPlainObject(data.data)) {
    if (isPlainObject(data.data.user)) {
      return data.data.user;
    }

    if (typeof data.data.email === 'string' || typeof data.data.name === 'string') {
      return data.data;
    }
  }

  if (isPlainObject(data.customer)) {
    return data.customer;
  }

  if (isPlainObject(data.auth) && isPlainObject(data.auth.user)) {
    return data.auth.user;
  }

  return { email };
}

export default function LoginClient() {
  return (
    <Suspense fallback={<div className="min-h-[640px] bg-slate-50" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [resetErrors, setResetErrors] = useState<ResetPasswordErrors>({});
  const [formMessage, setFormMessage] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetMessageTone, setResetMessageTone] = useState<'success' | 'error' | null>(null);

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const isActionTaken = useRef(false);

  const redirectTo = searchParams.get('redirect') || '/my-account';

  const handleGoToHome = () => {
    isActionTaken.current = true;
    setShowSuccessPopup(false);
    router.push('/');
    router.refresh();
  };

  const handleGoToShop = () => {
    isActionTaken.current = true;
    setShowSuccessPopup(false);
    router.push('/category/labels-en-tickets');
    router.refresh();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowSuccessPopup(false);
      if (!isActionTaken.current) {
        router.push('/');
        router.refresh();
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFormMessage('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, remember }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setErrors(data.errors ?? {});
        setFormMessage(data.message || t('login.loginError'));
        return;
      }

      const user = extractUser(data, email);
      localStorage.setItem('auth_user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-user-updated'));

      toast.success(t('login.loginSuccess'));
      setShowSuccessPopup(true);
      router.refresh();
    } catch {
      setFormMessage(t('login.loginError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openResetMode = () => {
    setIsResetMode(true);
    setResetEmail(email);
    setResetErrors({});
    setResetMessage('');
    setResetMessageTone(null);
    setFormMessage('');
  };

  const closeResetMode = () => {
    setIsResetMode(false);
    setResetErrors({});
    setResetMessage('');
    setResetMessageTone(null);
  };

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsResetSubmitting(true);
    setResetErrors({});
    setResetMessage('');
    setResetMessageTone(null);

    const normalizedResetEmail = resetEmail.trim();

    if (!normalizedResetEmail) {
      setResetErrors({ email: [t('login.emailRequired')] });
      setResetMessage(t('login.emailRequired'));
      setResetMessageTone('error');
      setIsResetSubmitting(false);
      return;
    }

    if (!isValidEmail(normalizedResetEmail)) {
      setResetErrors({ email: [t('login.invalidEmail')] });
      setResetMessage(t('login.invalidEmail'));
      setResetMessageTone('error');
      setIsResetSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalizedResetEmail }),
      });

      const data = (await response.json()) as ResetPasswordResponse;

      if (!response.ok) {
        setResetErrors(data.errors ?? {});
        setResetMessage(data.message || t('login.invalidEmail'));
        setResetMessageTone('error');
        return;
      }

      setResetMessage(data.message || data.status || t('login.resetEmailSent'));
      setResetMessageTone('success');
      toast.success(t('login.resetSuccess'));
    } catch {
      setResetMessage(t('login.resetError'));
      setResetMessageTone('error');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <section className="bg-slate-50 px-6 py-10 sm:py-14 lg:py-16">
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[2px_12px_44px_0px_rgba(109,109,120,0.08)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative hidden min-h-[640px] bg-sky-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Image
              src="/logo.png"
              alt="Businesslabels"
              width={205}
              height={40}
              priority
              className="h-auto w-52 brightness-0 invert"
            />
          </div>

          <div className="relative z-10 flex max-w-md flex-col gap-6">
            <span className="w-fit rounded-full bg-brand px-4 py-1.5 text-xs font-black uppercase tracking-widest text-sky-950">
              {t('login.accountAccess')}
            </span>
            <h1 className="text-5xl font-black leading-[1.02] tracking-tight">
              {t('login.heroTitle')}
            </h1>
            <p className="text-lg leading-8 text-sky-100/75">
              {t('login.heroSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            {[
              [t('login.fastOrders'), t('login.fastOrdersDesc')],
              [t('login.savedProfiles'), t('login.savedProfilesDesc')],
              [t('login.freeSupport'), t('login.freeSupportDesc')],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-black text-amber-400">{title}</div>
                <div className="mt-1 text-sky-100/70">{copy}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-[640px] items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-9 flex flex-col gap-3">
              <Link href="/" className="mb-5 inline-flex lg:hidden">
                <Image src="/logo.png" alt="Businesslabels" width={205} height={40} priority className="h-auto w-52" />
              </Link>
              <div>
                <h2 className="text-4xl font-black tracking-tight text-neutral-800">
                  {isResetMode ? t('login.resetPassword') : t('login.title')}
                </h2>
                <p className="mt-2 text-base font-medium leading-7 text-neutral-500">
                  {isResetMode
                    ? t('login.resetPasswordDesc')
                    : t('login.subtitle')}
                </p>
              </div>
            </div>

            {isResetMode ? (
              <form onSubmit={handleResetSubmit} className="flex flex-col gap-5" noValidate>
                {resetMessage ? (
                  <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    resetMessageTone === 'error'
                      ? 'border-red-100 bg-red-50 text-red-700'
                      : 'border-green-100 bg-green-50 text-green-700'
                  }`}>
                    {resetMessage}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="reset-email" className="font-bold text-neutral-700">
                    {t('login.resetEmailLabel')}
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      autoComplete="email"
                      aria-invalid={Boolean(resetErrors.email)}
                      className="h-13 rounded-2xl border-slate-200 bg-slate-50 pl-12 pr-4 text-base font-semibold text-neutral-800 placeholder:font-medium focus-visible:border-brand focus-visible:ring-brand/20"
                      placeholder={t('login.resetEmailPlaceholder')}
                      disabled={isResetSubmitting}
                    />
                  </div>
                  {resetErrors.email?.[0] ? <p className="text-sm font-semibold text-red-600">{resetErrors.email[0]}</p> : null}
                </div>

                <Button
                  type="submit"
                  disabled={isResetSubmitting}
                  className="mt-2 h-13 rounded-2xl bg-brand px-6 text-base font-black text-white shadow-lg shadow-brand/20 hover:bg-brand-hover"
                >
                  {isResetSubmitting ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      {t('login.sending')}
                    </>
                  ) : (
                    <>
                      {t('login.sendResetLink')}
                      <ArrowRight className="size-5" />
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={closeResetMode}
                  className="text-center text-sm font-black text-brand transition-colors hover:text-amber-700"
                  disabled={isResetSubmitting}
                >
                  {t('login.backToLogin')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              {formMessage ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {formMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="font-bold text-neutral-700">
                  {t('login.emailLabel')}
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    className="h-13 rounded-2xl border-slate-200 bg-slate-50 pl-12 pr-4 text-base font-semibold text-neutral-800 placeholder:font-medium focus-visible:border-brand focus-visible:ring-brand/20"
                    placeholder={t('login.emailPlaceholder')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email?.[0] ? <p className="text-sm font-semibold text-red-600">{errors.email[0]}</p> : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="font-bold text-neutral-700">
                  {t('login.passwordLabel')}
                </Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    className="h-13 rounded-2xl border-slate-200 bg-slate-50 pl-12 pr-13 text-base font-semibold text-neutral-800 placeholder:font-medium focus-visible:border-brand focus-visible:ring-brand/20"
                    placeholder={t('login.passwordPlaceholder')}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white hover:text-neutral-700"
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {errors.password?.[0] ? <p className="text-sm font-semibold text-red-600">{errors.password[0]}</p> : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 py-1">
                <label className="flex items-center gap-3 text-sm font-semibold text-neutral-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="size-4 rounded border-slate-300 accent-amber-500"
                    disabled={isSubmitting}
                  />
                  {t('login.rememberMe')}
                </label>
                <button
                  type="button"
                  onClick={openResetMode}
                  className="text-sm font-black text-brand transition-colors hover:text-amber-700"
                  disabled={isSubmitting}
                >
                  {t('login.forgotPassword')}
                </button>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-13 rounded-2xl bg-brand px-6 text-base font-black text-white shadow-lg shadow-brand/20 hover:bg-brand-hover"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    {t('login.loggingIn')}
                  </>
                ) : (
                  <>
                    {t('login.loginButton')}
                    <ArrowRight className="size-5" />
                  </>
                )}
              </Button>
              </form>
            )}

            <p className="mt-7 text-center text-sm font-semibold text-neutral-500">
              {t('login.noAccount')}{' '}
              <Link href="/register" className="font-black text-brand transition-colors hover:text-amber-700">
                {t('login.register')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Dialog open={showSuccessPopup} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 border-slate-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200" showCloseButton={true}>
          <div className="flex flex-col items-center text-center py-4">
            <div className="rounded-full bg-emerald-50 p-4 mb-4 text-emerald-500 animate-bounce">
              <CheckCircle2 className="size-12 stroke-[2.5]" />
            </div>
            
            <DialogHeader className="gap-2">
              <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
                {t('login.loginSuccessTitle')}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 font-medium px-2 leading-relaxed">
                {t('login.loginSuccessSubtitle')}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={handleGoToHome}
                className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-800 font-black hover:bg-slate-200 border-none flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Home className="size-4" />
                {t('login.goToHome')}
              </Button>
              <Button
                onClick={handleGoToShop}
                className="flex-1 h-12 rounded-xl bg-brand hover:bg-brand-hover text-white font-black shadow-lg shadow-brand/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShoppingBag className="size-4" />
                {t('login.goToShop')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
