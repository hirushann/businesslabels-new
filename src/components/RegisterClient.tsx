'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Building2, ChevronDown, KeyRound, Loader2, Mail, MapPin, Phone, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RegisterErrors = {
  username?: string[];
  name?: string[];
  first_name?: string[];
  last_name?: string[];
  email?: string[];
  password?: string[];
  password_confirmation?: string[];
  company?: string[];
  phone?: string[];
  country_id?: string[];
  state_id?: string[];
  province_id?: string[];
  billing_email?: string[];
  country?: string[];
  street_address?: string[];
  postcode?: string[];
  city?: string[];
  state?: string[];
  vat_number?: string[];
  kvk_number?: string[];
};

type RegisterResponse = {
  message?: string;
  user?: unknown;
  data?: unknown;
  customer?: unknown;
  auth?: unknown;
  errors?: RegisterErrors;
};

type RegisterOption = {
  id: string;
  label: string;
};

type RegisterDataResponse = {
  message?: string;
  countries?: unknown;
  provinces?: unknown;
  states?: unknown;
  data?: unknown;
  [key: string]: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readOptionId(value: Record<string, unknown>) {
  const id = value.id ?? value.value ?? value.country_id ?? value.province_id ?? value.state_id ?? value.code;

  if (typeof id === 'number' && Number.isFinite(id)) {
    return String(id);
  }

  return typeof id === 'string' && id.trim() ? id.trim() : '';
}

function readOptionLabel(value: Record<string, unknown>) {
  const label = value.name ?? value.label ?? value.title ?? value.country ?? value.province ?? value.state;

  if (typeof label === 'number' && Number.isFinite(label)) {
    return String(label);
  }

  return typeof label === 'string' && label.trim() ? label.trim() : '';
}

function normalizeOptions(value: unknown): RegisterOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string' && item.trim()) {
        return { id: item.trim(), label: item.trim() };
      }

      if (!isPlainObject(item)) {
        return null;
      }

      const id = readOptionId(item);
      const label = readOptionLabel(item) || id;

      return id && label ? { id, label } : null;
    })
    .filter((item): item is RegisterOption => Boolean(item));
}

function readRegisterDataOptions(data: RegisterDataResponse) {
  const nestedData = isPlainObject(data.data) ? data.data : {};

  return {
    countries: normalizeOptions(data.countries ?? nestedData.countries ?? data.country ?? nestedData.country),
    provinces: normalizeOptions(
      data.provinces ??
        nestedData.provinces ??
        data.states ??
        nestedData.states ??
        data.regions ??
        nestedData.regions
    ),
  };
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
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [countries, setCountries] = useState<RegisterOption[]>([]);
  const [provinces, setProvinces] = useState<RegisterOption[]>([]);
  const [countryId, setCountryId] = useState('');
  const [stateId, setStateId] = useState('');
  const [isLoadingRegisterData, setIsLoadingRegisterData] = useState(true);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [streetAddress, setStreetAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [kvkNumber, setKvkNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formMessage, setFormMessage] = useState('');

  const redirectTo = searchParams.get('redirect') || '/my-account';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const selectedCountry = countries.find((country) => country.id === countryId);
  const selectedProvince = provinces.find((province) => province.id === stateId);

  const handleCountryChange = (nextCountryId: string) => {
    setCountryId(nextCountryId);
    setStateId('');

    if (!nextCountryId) {
      setProvinces([]);
    }
  };

  useEffect(() => {
    let isActive = true;

    async function loadRegisterData() {
      setIsLoadingRegisterData(true);

      try {
        const response = await fetch('/api/register/data', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        const data = (await response.json()) as RegisterDataResponse;

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load registration data.');
        }

        const nextOptions = readRegisterDataOptions(data);

        if (isActive) {
          setCountries(nextOptions.countries);
          setProvinces(nextOptions.provinces);
        }
      } catch {
        if (isActive) {
          setFormMessage('Unable to load registration data. Please try again.');
        }
      } finally {
        if (isActive) {
          setIsLoadingRegisterData(false);
        }
      }
    }

    loadRegisterData();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!countryId) {
      return;
    }

    let isActive = true;

    async function loadProvinces() {
      setIsLoadingProvinces(true);
      setStateId('');

      try {
        const response = await fetch('/api/register/data', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ country_id: countryId }),
        });
        const data = (await response.json()) as RegisterDataResponse;

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load provinces.');
        }

        const nextOptions = readRegisterDataOptions(data);

        if (isActive) {
          if (nextOptions.countries.length) {
            setCountries(nextOptions.countries);
          }

          setProvinces(nextOptions.provinces);
        }
      } catch {
        if (isActive) {
          setProvinces([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingProvinces(false);
        }
      }
    }

    loadProvinces();

    return () => {
      isActive = false;
    };
  }, [countryId]);

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
          username,
          name: fullName || username,
          first_name: firstName,
          last_name: lastName,
          company,
          phone,
          email,
          billing_email: billingEmail,
          country_id: countryId,
          country: selectedCountry?.label ?? '',
          street_address: streetAddress,
          postcode,
          city,
          state_id: stateId,
          province_id: stateId,
          state: selectedProvince?.label ?? '',
          vat_number: vatNumber,
          kvk_number: kvkNumber,
          password,
          password_confirmation: password,
        }),
      });

      const data = (await response.json()) as RegisterResponse;

      if (!response.ok) {
        setErrors(data.errors ?? {});
        setFormMessage(data.message || 'Please check your registration details.');
        return;
      }

      const user = extractUser(data, email, fullName || username);
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
    <section className="bg-slate-50 px-5 py-10 sm:px-8 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-350">
        <Link href="/" className="mb-10 inline-flex">
          <Image src="/logo.png" alt="BusinessLabels" width={205} height={40} priority className="h-auto w-52" />
        </Link>

        <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-9 shadow-[2px_12px_44px_0px_rgba(109,109,120,0.08)] sm:px-8 lg:px-12">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black uppercase tracking-tight text-neutral-800 sm:text-5xl">Registreren</h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
              {formMessage ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {formMessage}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <TextInput
                  id="username"
                  label="Gebruikersnaam"
                  value={username}
                  onChange={setUsername}
                  autoComplete="username"
                  placeholder="Gebruikersnaam"
                  disabled={isSubmitting}
                  error={errors.username?.[0]}
                  icon={<User className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-neutral-500" />}
                />

                <TextInput
                  id="email"
                  label="E-mail"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  autoComplete="email"
                  placeholder="E-mail"
                  disabled={isSubmitting}
                  error={errors.email?.[0]}
                  icon={<Mail className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-neutral-500" />}
                />

                <TextInput
                  id="first-name"
                  label="Voornaam"
                  value={firstName}
                  onChange={setFirstName}
                  autoComplete="given-name"
                  placeholder="Voornaam"
                  disabled={isSubmitting}
                  error={errors.first_name?.[0] ?? errors.name?.[0]}
                />

                <TextInput
                  id="last-name"
                  label="Achternaam"
                  value={lastName}
                  onChange={setLastName}
                  autoComplete="family-name"
                  placeholder="Achternaam"
                  disabled={isSubmitting}
                  error={errors.last_name?.[0]}
                />

                <TextInput
                  id="password"
                  label="Wachtwoord"
                  value={password}
                  onChange={setPassword}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Wachtwoord"
                  disabled={isSubmitting}
                  error={errors.password?.[0] ?? errors.password_confirmation?.[0]}
                  icon={<KeyRound className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-neutral-500" />}
                  className="md:col-span-1"
                />
              </div>

              <div className="flex flex-col gap-5">
                <h2 className="text-xl font-black uppercase tracking-tight text-neutral-800">Factuuradres</h2>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <TextInput
                    id="company"
                    label="Bedrijfsnaam"
                    value={company}
                    onChange={setCompany}
                    autoComplete="organization"
                    placeholder="Bedrijfsnaam"
                    disabled={isSubmitting}
                    error={errors.company?.[0]}
                    icon={<Building2 className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-neutral-500" />}
                  />

                  <TextInput
                    id="phone"
                    label="Telefoon"
                    value={phone}
                    onChange={setPhone}
                    type="tel"
                    autoComplete="tel"
                    placeholder="Telefoon"
                    disabled={isSubmitting}
                    error={errors.phone?.[0]}
                    icon={<Phone className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-neutral-500" />}
                  />

                  <TextInput
                    id="billing-email"
                    label="Mailadres voor facturen"
                    value={billingEmail}
                    onChange={setBillingEmail}
                    type="email"
                    autoComplete="email"
                    placeholder="Mailadres voor facturen"
                    disabled={isSubmitting}
                    error={errors.billing_email?.[0]}
                    icon={<Mail className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-neutral-500" />}
                  />

                  <SelectInput
                    id="country"
                    label="Land"
                    value={countryId}
                    onChange={handleCountryChange}
                    disabled={isSubmitting || isLoadingRegisterData}
                    error={errors.country_id?.[0] ?? errors.country?.[0]}
                    options={countries}
                    placeholder={isLoadingRegisterData ? 'Landen laden...' : 'Land'}
                  />

                  <TextInput
                    id="street-address"
                    label="Straat en huisnummer"
                    value={streetAddress}
                    onChange={setStreetAddress}
                    autoComplete="street-address"
                    placeholder="Straat en huisnummer"
                    disabled={isSubmitting}
                    error={errors.street_address?.[0]}
                    icon={<MapPin className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-neutral-500" />}
                  />

                  <TextInput
                    id="postcode"
                    label="Postcode"
                    value={postcode}
                    onChange={setPostcode}
                    autoComplete="postal-code"
                    placeholder="Postcode"
                    disabled={isSubmitting}
                    error={errors.postcode?.[0]}
                  />

                  <TextInput
                    id="city"
                    label="Plaats"
                    value={city}
                    onChange={setCity}
                    autoComplete="address-level2"
                    placeholder="Plaats"
                    disabled={isSubmitting}
                    error={errors.city?.[0]}
                  />

                  <SelectInput
                    id="state"
                    label="State (optioneel)"
                    value={stateId}
                    onChange={setStateId}
                    disabled={isSubmitting || !countryId || isLoadingProvinces || !provinces.length}
                    error={errors.state_id?.[0] ?? errors.province_id?.[0] ?? errors.state?.[0]}
                    options={provinces}
                    placeholder={
                      !countryId
                        ? 'Selecteer eerst een land'
                        : isLoadingProvinces
                          ? 'Provincies laden...'
                          : provinces.length
                            ? 'State (optioneel)'
                            : 'Geen provincies beschikbaar'
                    }
                  />

                  <TextInput
                    id="vat-number"
                    label="BTW-nummer"
                    value={vatNumber}
                    onChange={setVatNumber}
                    autoComplete="off"
                    placeholder="BTW-nummer"
                    disabled={isSubmitting}
                    error={errors.vat_number?.[0]}
                  />

                  <TextInput
                    id="kvk-number"
                    label="KVK nummer (optioneel)"
                    value={kvkNumber}
                    onChange={setKvkNumber}
                    autoComplete="off"
                    placeholder="KVK nummer (optioneel)"
                    disabled={isSubmitting}
                    error={errors.kvk_number?.[0]}
                  />
                </div>
              </div>

              <p className="text-base font-medium leading-8 text-neutral-700 sm:text-lg">
                Je persoonlijke gegevens worden gebruikt om je ervaring op deze site te ondersteunen, om toegang tot je
                account te beheren en voor andere doeleinden zoals omschreven in onze{' '}
                <Link href="/privacy-policy" className="font-semibold text-sky-500 transition-colors hover:text-sky-600">
                  privacybeleid
                </Link>
                .
              </p>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-14 rounded-full bg-sky-400 px-6 text-base font-black text-white shadow-lg shadow-sky-400/20 hover:bg-sky-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Account aanmaken
                  </>
                ) : (
                  <>
                    Account aanmaken
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
  className,
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
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="sr-only">
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
          className={`h-14 rounded-full border-0 bg-slate-50 pr-5 text-base font-semibold text-neutral-800 placeholder:text-neutral-400 placeholder:font-medium focus-visible:border-sky-400 focus-visible:ring-sky-400/20 sm:text-lg ${icon ? 'pl-14' : 'pl-8'}`}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}

function SelectInput({
  id,
  label,
  value,
  onChange,
  disabled,
  error,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  error?: string;
  options: RegisterOption[];
  placeholder: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          className="h-14 w-full appearance-none rounded-full border-0 bg-slate-50 px-8 pr-14 text-base font-semibold text-neutral-800 outline-none transition-colors focus-visible:border-sky-400 focus-visible:ring-3 focus-visible:ring-sky-400/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-lg"
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-6 top-1/2 size-5 -translate-y-1/2 text-neutral-700" />
      </div>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
