'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ResetPasswordErrors = {
  token?: string[];
  email?: string[];
  password?: string[];
};

type ResetPasswordResponse = {
  message?: string;
  errors?: ResetPasswordErrors;
};

type ResetPasswordClientProps = {
  initialEmail: string;
  initialToken: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ResetPasswordClient({ initialEmail, initialToken }: ResetPasswordClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [token] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [formMessage, setFormMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFormMessage('');

    const normalizedEmail = email.trim();

    if (!token) {
      setErrors({ token: [t('login.resetTokenMissing')] });
      setFormMessage(t('login.resetTokenMissing'));
      setIsSubmitting(false);
      return;
    }

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setErrors({ email: [t('login.invalidEmail')] });
      setFormMessage(t('login.invalidEmail'));
      setIsSubmitting(false);
      return;
    }

    if (!password || !passwordConfirmation) {
      setErrors({ password: [t('login.passwordRequired')] });
      setFormMessage(t('login.passwordRequired'));
      setIsSubmitting(false);
      return;
    }

    if (password !== passwordConfirmation) {
      setErrors({ password: [t('login.passwordConfirmationMismatch')] });
      setFormMessage(t('login.passwordConfirmationMismatch'));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/reset-password/confirm', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email: normalizedEmail,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = (await response.json()) as ResetPasswordResponse;

      if (!response.ok) {
        setErrors(data.errors ?? {});
        setFormMessage(data.message || t('login.resetTokenInvalid'));
        return;
      }

      toast.success(t('login.passwordResetComplete'));
      router.replace('/login?reset=success');
      router.refresh();
    } catch {
      setFormMessage(t('login.resetError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-slate-50 px-6 py-10 sm:py-14 lg:py-16">
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[2px_12px_44px_0px_rgba(109,109,120,0.08)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative hidden min-h-[640px] bg-sky-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Businesslabels"
              width={205}
              height={40}
              priority
              className="h-auto w-52 brightness-0 invert"
            />
          </Link>

          <div className="relative z-10 flex max-w-md flex-col gap-6">
            <span className="w-fit rounded-full bg-brand px-4 py-1.5 text-xs font-black uppercase tracking-widest text-sky-950">
              {t('login.accountAccess')}
            </span>
            <h1 className="text-5xl font-black leading-[1.02] tracking-tight">
              {t('login.resetPageHeroTitle')}
            </h1>
            <p className="text-lg leading-8 text-sky-100/75">
              {t('login.resetPageHeroSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex min-h-[640px] items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-9 flex flex-col gap-3">
              <Link href="/" className="mb-5 inline-flex lg:hidden">
                <Image src="/logo.png" alt="Businesslabels" width={205} height={40} priority className="h-auto w-52" />
              </Link>
              <div>
                <h2 className="text-4xl font-black tracking-tight text-neutral-800">
                  {t('login.resetPageTitle')}
                </h2>
                <p className="mt-2 text-base font-medium leading-7 text-neutral-500">
                  {t('login.resetPageSubtitle')}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              {formMessage ? (
                <div
                  className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                  role="status"
                  aria-live="polite"
                >
                  {formMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="reset-email" className="font-bold text-neutral-700">
                  {t('login.emailLabel')}
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="reset-email"
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
                <Label htmlFor="new-password" className="font-bold text-neutral-700">
                  {t('login.newPasswordLabel')}
                </Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.password)}
                    className="h-13 rounded-2xl border-slate-200 bg-slate-50 pl-12 pr-13 text-base font-semibold text-neutral-800 placeholder:font-medium focus-visible:border-brand focus-visible:ring-brand/20"
                    placeholder={t('login.newPasswordPlaceholder')}
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="password-confirmation" className="font-bold text-neutral-700">
                  {t('login.confirmPasswordLabel')}
                </Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="password-confirmation"
                    type={showPasswordConfirmation ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    autoComplete="new-password"
                    className="h-13 rounded-2xl border-slate-200 bg-slate-50 pl-12 pr-13 text-base font-semibold text-neutral-800 placeholder:font-medium focus-visible:border-brand focus-visible:ring-brand/20"
                    placeholder={t('login.confirmPasswordPlaceholder')}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirmation((value) => !value)}
                    className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white hover:text-neutral-700"
                    aria-label={showPasswordConfirmation ? t('login.hidePassword') : t('login.showPassword')}
                    disabled={isSubmitting}
                  >
                    {showPasswordConfirmation ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-13 rounded-2xl bg-brand px-6 text-base font-black text-white shadow-lg shadow-brand/20 hover:bg-brand-hover"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    {t('login.resettingPassword')}
                  </>
                ) : (
                  <>
                    {t('login.resetPasswordButton')}
                    <ArrowRight className="size-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
