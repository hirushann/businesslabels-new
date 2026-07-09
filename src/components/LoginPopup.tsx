'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Mail, LockKeyhole } from 'lucide-react';
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

export default function LoginPopup({
  open,
  onOpenChange,
  onSwitchToRegister,
  onLoginSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToRegister?: () => void;
  onLoginSuccess?: () => void;
}) {
  const t = useTranslations();
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
  const [formMessageTone, setFormMessageTone] = useState<'success' | 'error' | null>(null);
  const [resetMessage, setResetMessage] = useState('');
  const [resetMessageTone, setResetMessageTone] = useState<'success' | 'error' | null>(null);
  const closeAfterSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeAfterSuccessTimer.current) {
        clearTimeout(closeAfterSuccessTimer.current);
      }
    };
  }, []);

  const resetFormState = () => {
    setEmail('');
    setPassword('');
    setResetEmail('');
    setRemember(true);
    setShowPassword(false);
    setIsResetMode(false);
    setErrors({});
    setResetErrors({});
    setFormMessage('');
    setFormMessageTone(null);
    setResetMessage('');
    setResetMessageTone(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (closeAfterSuccessTimer.current) {
      clearTimeout(closeAfterSuccessTimer.current);
      closeAfterSuccessTimer.current = null;
    }

    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetFormState();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFormMessage('');
    setFormMessageTone(null);

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
        setFormMessageTone('error');
        return;
      }

      const user = extractUser(data, email);
      localStorage.setItem('auth_user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-user-updated'));
      onLoginSuccess?.();

      toast.success(t('login.loginSuccess'));
      setFormMessage(data.message || t('login.loginSuccess'));
      setFormMessageTone('success');
      closeAfterSuccessTimer.current = setTimeout(() => {
        closeAfterSuccessTimer.current = null;
        handleOpenChange(false);
      }, 1500);
    } catch {
      setFormMessage(t('login.loginError'));
      setFormMessageTone('error');
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
    setFormMessageTone(null);
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

  const handleGoogleClick = () => {
    toast.info(t('login.googleComingSoon'));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="rounded-[28px] border-slate-100 bg-white p-8 shadow-2xl sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader className="items-center gap-2 text-center">
          <DialogTitle className="text-3xl font-black tracking-tight text-neutral-800">
            {isResetMode ? t('login.resetPassword') : t('login.popupTitle')}
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-neutral-500">
            {isResetMode ? t('login.resetPasswordDesc') : t('login.popupSubtitle')}
          </DialogDescription>
        </DialogHeader>

        {isResetMode ? (
          <form onSubmit={handleResetSubmit} className="mt-2 flex flex-col gap-5" noValidate>
            {resetMessage ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  resetMessageTone === 'error'
                    ? 'border-red-100 bg-red-50 text-red-700'
                    : 'border-green-100 bg-green-50 text-green-700'
                }`}
              >
                {resetMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="popup-reset-email" className="font-bold text-neutral-700">
                {t('login.resetEmailLabel')}
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
                <Input
                  id="popup-reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  autoComplete="email"
                  aria-invalid={Boolean(resetErrors.email)}
                  className="h-13 rounded-full border-slate-200 bg-slate-50 pl-12 pr-4 text-base font-semibold text-neutral-800 placeholder:font-medium focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                  placeholder={t('login.resetEmailPlaceholder')}
                  disabled={isResetSubmitting}
                />
              </div>
              {resetErrors.email?.[0] ? <p className="text-sm font-semibold text-red-600">{resetErrors.email[0]}</p> : null}
            </div>

            <Button
              type="submit"
              disabled={isResetSubmitting}
              className="mt-2 h-13 rounded-full bg-amber-500 px-6 text-base font-black text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600"
            >
              {isResetSubmitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  {t('login.sending')}
                </>
              ) : (
                t('login.sendResetLink')
              )}
            </Button>

            <button
              type="button"
              onClick={closeResetMode}
              className="text-center text-sm font-black text-amber-600 transition-colors hover:text-amber-700"
              disabled={isResetSubmitting}
            >
              {t('login.backToLogin')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-5" noValidate>
            {formMessage ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  formMessageTone === 'success'
                    ? 'border-green-100 bg-green-50 text-green-700'
                    : 'border-red-100 bg-red-50 text-red-700'
                }`}
                role="status"
                aria-live="polite"
              >
                {formMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="popup-email" className="font-bold text-neutral-700">
                {t('login.emailLabel')}
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
                <Input
                  id="popup-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  className="h-13 rounded-full border-slate-200 bg-slate-50 pl-12 pr-4 text-base font-semibold text-neutral-800 placeholder:font-medium focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                  placeholder={t('login.emailPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email?.[0] ? <p className="text-sm font-semibold text-red-600">{errors.email[0]}</p> : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="popup-password" className="font-bold text-neutral-700">
                {t('login.passwordLabel')}
              </Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
                <Input
                  id="popup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  className="h-13 rounded-full border-slate-200 bg-slate-50 pl-12 pr-13 text-base font-semibold text-neutral-800 placeholder:font-medium focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
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

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-neutral-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="size-4 rounded border-slate-300 accent-amber-500"
                  disabled={isSubmitting}
                />
                {t('login.rememberFor30Days')}
              </label>
              <button
                type="button"
                onClick={openResetMode}
                className="text-sm font-black text-amber-600 transition-colors hover:text-amber-700"
                disabled={isSubmitting}
              >
                {t('login.forgotPassword')}
              </button>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-13 rounded-full bg-amber-500 px-6 text-base font-black text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  {t('login.loggingIn')}
                </>
              ) : (
                t('login.signInButton')
              )}
            </Button>

            {/* <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-sm font-semibold text-neutral-400">{t('login.orDivider')}</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleClick}
              className="flex h-13 items-center justify-center gap-3 rounded-full border border-slate-200 bg-white text-base font-bold text-neutral-800 transition-colors hover:bg-slate-50"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path fill="#4285F4" d="M19.6 10.23c0-.68-.06-1.36-.18-2.02H10v3.83h5.4a4.62 4.62 0 0 1-2 3.03v2.5h3.24c1.9-1.75 2.96-4.34 2.96-7.34Z" />
                <path fill="#34A853" d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.75-5.59-4.11H1.06v2.58A10 10 0 0 0 10 20Z" />
                <path fill="#FBBC05" d="M4.41 11.93a5.99 5.99 0 0 1 0-3.86V5.49H1.06a10 10 0 0 0 0 9.02l3.35-2.58Z" />
                <path fill="#EA4335" d="M10 3.96c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.55 9.55 0 0 0 10 0 10 10 0 0 0 1.06 5.49l3.35 2.58C5.2 5.71 7.4 3.96 10 3.96Z" />
              </svg>
              {t('login.signInWithGoogle')}
            </button> */}

            <p className="text-center text-sm font-semibold text-neutral-500">
              {t('login.dontHaveAccount')}{' '}
              {onSwitchToRegister ? (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenChange(false);
                    onSwitchToRegister();
                  }}
                  className="font-black text-amber-600 transition-colors hover:text-amber-700"
                >
                  {t('login.signUp')}
                </button>
              ) : (
                <Link
                  href="/register"
                  onClick={() => handleOpenChange(false)}
                  className="font-black text-amber-600 transition-colors hover:text-amber-700"
                >
                  {t('login.signUp')}
                </Link>
              )}
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
