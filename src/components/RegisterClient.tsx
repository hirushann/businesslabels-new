'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Building2, Eye, EyeOff, Loader2, LockKeyhole, Mail, Phone, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RegisterErrors = {
  name?: string[];
  email?: string[];
  password?: string[];
  password_confirmation?: string[];
  company?: string[];
  phone?: string[];
};

type RegisterResponse = {
  message?: string;
  user?: unknown;
  data?: unknown;
  customer?: unknown;
  auth?: unknown;
  errors?: RegisterErrors;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function extractUser(data: RegisterResponse, email: string, name: string) {
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

  return { email, name };
}

export default function RegisterClient() {
  return (
    <Suspense fallback={<div className="min-h-[760px] bg-slate-50" />}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formMessage, setFormMessage] = useState('');

  const redirectTo = searchParams.get('redirect') || '/my-account';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFormMessage('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          company,
          phone,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = (await response.json()) as RegisterResponse;

      if (!response.ok) {
        setErrors(data.errors ?? {});
        setFormMessage(data.message || 'Please check your registration details.');
        return;
      }

      const user = extractUser(data, email, name);
      localStorage.setItem('auth_user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-user-updated'));

      toast.success('Account created successfully');
      router.push(redirectTo);
      router.refresh();
    } catch {
      setFormMessage('Unable to register right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-slate-50 px-6 py-10 sm:py-14 lg:py-16">
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[2px_12px_44px_0px_rgba(109,109,120,0.08)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative hidden min-h-[760px] bg-sky-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Image
              src="/logo.png"
              alt="BusinessLabels"
              width={205}
              height={40}
              priority
              className="h-auto w-52 brightness-0 invert"
            />
          </div>

          <div className="relative z-10 flex max-w-md flex-col gap-6">
            <span className="w-fit rounded-full bg-amber-500 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-sky-950">
              Create account
            </span>
            <h1 className="text-5xl font-black leading-[1.02] tracking-tight">
              Set up faster label ordering for your team.
            </h1>
            <p className="text-lg leading-8 text-sky-100/75">
              Save billing details, track orders, and keep printer supplies ready from one BusinessLabels account.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            {[
              ['Track', 'every order'],
              ['Reuse', 'addresses'],
              ['Manage', 'supplies'],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-black text-amber-400">{title}</div>
                <div className="mt-1 text-sky-100/70">{copy}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-[760px] items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col gap-3">
              <Link href="/" className="mb-5 inline-flex lg:hidden">
                <Image src="/logo.png" alt="BusinessLabels" width={205} height={40} priority className="h-auto w-52" />
              </Link>
              <div>
                <h2 className="text-4xl font-black tracking-tight text-neutral-800">Register</h2>
                <p className="mt-2 text-base font-medium leading-7 text-neutral-500">
                  Create your BusinessLabels account.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {formMessage ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {formMessage}
                </div>
              ) : null}

              <TextInput
                id="name"
                label="Full name"
                value={name}
                onChange={setName}
                autoComplete="name"
                placeholder="Jane Doe"
                disabled={isSubmitting}
                error={errors.name?.[0]}
                icon={<User className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />}
              />

              <TextInput
                id="company"
                label="Company"
                value={company}
                onChange={setCompany}
                autoComplete="organization"
                placeholder="Company name"
                disabled={isSubmitting}
                error={errors.company?.[0]}
                icon={<Building2 className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />}
              />

              <TextInput
                id="phone"
                label="Phone"
                value={phone}
                onChange={setPhone}
                type="tel"
                autoComplete="tel"
                placeholder="+31 123 456 789"
                disabled={isSubmitting}
                error={errors.phone?.[0]}
                icon={<Phone className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />}
              />

              <TextInput
                id="email"
                label="Email address"
                value={email}
                onChange={setEmail}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={isSubmitting}
                error={errors.email?.[0]}
                icon={<Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />}
              />

              <PasswordInput
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                showValue={showPassword}
                onToggleShow={() => setShowPassword((value) => !value)}
                autoComplete="new-password"
                disabled={isSubmitting}
                error={errors.password?.[0]}
              />

              <PasswordInput
                id="password-confirmation"
                label="Confirm password"
                value={passwordConfirmation}
                onChange={setPasswordConfirmation}
                showValue={showPasswordConfirmation}
                onToggleShow={() => setShowPasswordConfirmation((value) => !value)}
                autoComplete="new-password"
                disabled={isSubmitting}
                error={errors.password_confirmation?.[0]}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-13 rounded-2xl bg-amber-500 px-6 text-base font-black text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Creating account
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="size-5" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm font-semibold text-neutral-500">
              Already have an account?{' '}
              <Link href="/login" className="font-black text-amber-600 transition-colors hover:text-amber-700">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TextInput({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  placeholder,
  disabled,
  error,
  icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete: string;
  placeholder: string;
  disabled: boolean;
  error?: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="font-bold text-neutral-700">
        {label}
      </Label>
      <div className="relative">
        {icon}
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className="h-13 rounded-2xl border-slate-200 bg-slate-50 pl-12 pr-4 text-base font-semibold text-neutral-800 placeholder:font-medium focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  showValue,
  onToggleShow,
  autoComplete,
  disabled,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  showValue: boolean;
  onToggleShow: () => void;
  autoComplete: string;
  disabled: boolean;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="font-bold text-neutral-700">
        {label}
      </Label>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
        <Input
          id={id}
          type={showValue ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className="h-13 rounded-2xl border-slate-200 bg-slate-50 pl-12 pr-13 text-base font-semibold text-neutral-800 placeholder:font-medium focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
          placeholder="Enter password"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white hover:text-neutral-700"
          aria-label={showValue ? 'Hide password' : 'Show password'}
          disabled={disabled}
        >
          {showValue ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
