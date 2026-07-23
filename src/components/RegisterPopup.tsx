'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AddressAutocomplete from '@/components/AddressAutocomplete';

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
  provinces?: RegisterOption[];
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
  const id =
    value.id ??
    value.value ??
    value.country_id ??
    value.province_id ??
    value.state_id ??
    value.code ??
    value.country_code ??
    value.iso_code ??
    value.iso2;

  if (typeof id === 'number' && Number.isFinite(id)) {
    return String(id);
  }

  return typeof id === 'string' && id.trim() ? id.trim() : '';
}

function readOptionLabel(value: Record<string, unknown>) {
  const label =
    value.name ??
    value.label ??
    value.title ??
    value.country ??
    value.country_name ??
    value.province ??
    value.province_name ??
    value.state ??
    value.state_name;

  if (typeof label === 'number' && Number.isFinite(label)) {
    return String(label);
  }

  return typeof label === 'string' && label.trim() ? label.trim() : '';
}

function normalizeOptions(value: unknown): RegisterOption[] {
  if (isPlainObject(value)) {
    if (Array.isArray(value.data)) {
      return normalizeOptions(value.data);
    }

    if (Array.isArray(value.items)) {
      return normalizeOptions(value.items);
    }

    return Object.entries(value)
      .map(([key, item]) => {
        if (typeof item === 'string' && item.trim()) {
          return { id: key, label: item.trim() };
        }

        if (!isPlainObject(item)) {
          return null;
        }

        const id = readOptionId(item) || key;
        const label = readOptionLabel(item) || id;
        const provinces = normalizeOptions(item.provinces ?? item.states ?? item.regions);

        return id && label ? { id, label, ...(provinces.length > 0 ? { provinces } : {}) } : null;
      })
      .filter((item): item is RegisterOption => Boolean(item));
  }

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
      const provinces = normalizeOptions(item.provinces ?? item.states ?? item.regions);

      return id && label ? { id, label, ...(provinces.length > 0 ? { provinces } : {}) } : null;
    })
    .filter((item): item is RegisterOption => Boolean(item));
}

function readRegisterDataOptions(data: RegisterDataResponse) {
  const nestedData = isPlainObject(data.data) ? data.data : {};

  return {
    countries: normalizeOptions(data.countries ?? nestedData.countries ?? data.country ?? nestedData.country ?? data.data),
  };
}

function findOptionById(options: RegisterOption[], id: string) {
  const normalizedId = id.trim().toLowerCase();

  return options.find((option) => option.id.toLowerCase() === normalizedId);
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

export default function RegisterPopup({
  open,
  onOpenChange,
  onSwitchToLogin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [countries, setCountries] = useState<RegisterOption[]>([]);
  const [countryId, setCountryId] = useState('');
  const [stateId, setStateId] = useState('');
  const [isLoadingRegisterData, setIsLoadingRegisterData] = useState(true);
  const [streetAddress, setStreetAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [kvkNumber, setKvkNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formMessage, setFormMessage] = useState('');

  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  const selectedCountry = findOptionById(countries, countryId);
  const provinces = selectedCountry?.provinces || [];
  const selectedProvince = findOptionById(provinces, stateId);

  const handleCountryChange = (nextCountryId: string) => {
    setCountryId(nextCountryId);
    setStateId('');
  };

  useEffect(() => {
    if (!open) return;

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
          throw new Error(data.message || t('register.loadDataError'));
        }

        const nextOptions = readRegisterDataOptions(data);

        if (isActive) {
          setCountries(nextOptions.countries);
        }
      } catch {
        if (isActive) {
          setFormMessage(t('register.loadDataError'));
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
  }, [open, t]);

  const resetFormState = () => {
    setFirstName('');
    setLastName('');
    setCompany('');
    setPhone('');
    setEmail('');
    setBillingEmail('');
    setCountryId('');
    setStateId('');
    setStreetAddress('');
    setPostcode('');
    setCity('');
    setVatNumber('');
    setKvkNumber('');
    setPassword('');
    setErrors({});
    setFormMessage('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetFormState();
    }
  };

  const onAddressSelect = (address: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  }) => {
    if (address.street) setStreetAddress(address.street);
    if (address.city) setCity(address.city);
    if (address.postcode) setPostcode(address.postcode);

    const countryMap: Record<string, string> = {
      Netherlands: 'NL',
      Belgium: 'BE',
      Germany: 'DE',
      Nederland: 'NL',
      België: 'BE',
      Belgique: 'BE',
      Duitsland: 'DE',
      Deutschland: 'DE',
    };

    const mappedCountryId = countryMap[address.country];
    if (mappedCountryId) {
      setCountryId(findOptionById(countries, mappedCountryId)?.id ?? mappedCountryId);
      setStateId('');
    }
  };

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
          name: fullName || email,
          first_name: firstName,
          last_name: lastName,
          company,
          phone,
          email,
          billing_email: billingEmail,
          country_id: selectedCountry?.id ?? countryId,
          country: selectedCountry?.label ?? '',
          street_address: streetAddress,
          postcode,
          city,
          ...(selectedProvince || stateId
            ? {
                state_id: selectedProvince?.id ?? stateId,
                province_id: selectedProvince?.id ?? stateId,
                state: selectedProvince?.label ?? '',
              }
            : {}),
          vat_number: vatNumber,
          kvk_number: kvkNumber,
          password,
          password_confirmation: password,
        }),
      });

      const data = (await response.json()) as RegisterResponse;

      if (!response.ok) {
        setErrors(data.errors ?? {});
        setFormMessage(data.message || t('register.formError'));
        setIsSubmitting(false);
        return;
      }

      const user = extractUser(data, email, fullName || email);
      localStorage.setItem('auth_user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-user-updated'));

      toast.success(t('register.accountCreated'));
      handleOpenChange(false);
      router.push('/my-account');
      router.refresh();
    } catch {
      setFormMessage(t('register.registerError'));
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Script
        id="google-maps-api"
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        strategy="afterInteractive"
      />
      <DialogContent
        className="max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[28px] border-none bg-white shadow-2xl sm:max-w-2xl w-full"
        showCloseButton
      >
        <div className="px-8 pt-8 pb-4 border-b border-slate-100 shrink-0 bg-white">
          <DialogHeader className="items-center gap-2 text-center">
            <DialogTitle className="text-3xl font-black tracking-tight text-neutral-800">
              {t('register.popupTitle')}
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-neutral-500">
              {t('register.popupSubtitle')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {formMessage ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {formMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextInput
              id="popup-first-name"
              label={t('register.firstName')}
              required
              value={firstName}
              onChange={setFirstName}
              autoComplete="given-name"
              placeholder={t('register.firstNamePlaceholder')}
              disabled={isSubmitting}
              error={errors.first_name?.[0] ?? errors.name?.[0]}
            />

            <TextInput
              id="popup-last-name"
              label={t('register.lastName')}
              required
              value={lastName}
              onChange={setLastName}
              autoComplete="family-name"
              placeholder={t('register.lastNamePlaceholder')}
              disabled={isSubmitting}
              error={errors.last_name?.[0]}
            />
          </div>

          <TextInput
            id="popup-company"
            label={t('register.company')}
            value={company}
            onChange={setCompany}
            autoComplete="organization"
            placeholder={t('register.companyPlaceholder')}
            disabled={isSubmitting}
            error={errors.company?.[0]}
          />

          <TextInput
            id="popup-vat-number"
            label={t('register.vatNumber')}
            required
            value={vatNumber}
            onChange={setVatNumber}
            autoComplete="off"
            placeholder={t('register.vatNumberPlaceholder')}
            disabled={isSubmitting}
            error={errors.vat_number?.[0]}
          />

          <TextInput
            id="popup-email"
            label={t('register.email')}
            required
            value={email}
            onChange={setEmail}
            type="email"
            autoComplete="email"
            placeholder={t('register.emailPlaceholder')}
            disabled={isSubmitting}
            error={errors.email?.[0]}
          />

          <TextInput
            id="popup-password"
            label={t('register.password')}
            required
            value={password}
            onChange={setPassword}
            type="password"
            autoComplete="new-password"
            placeholder={t('register.passwordPlaceholder')}
            disabled={isSubmitting}
            error={errors.password?.[0] ?? errors.password_confirmation?.[0]}
            hint={t('register.passwordHint')}
          />

          <div className="h-px bg-slate-100" />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextInput
              id="popup-phone"
              label={t('register.phone')}
              required
              value={phone}
              onChange={setPhone}
              type="tel"
              autoComplete="tel"
              placeholder={t('register.phonePlaceholder')}
              disabled={isSubmitting}
              error={errors.phone?.[0]}
            />

            <TextInput
              id="popup-billing-email"
              label={t('register.billingEmail')}
              required
              value={billingEmail}
              onChange={setBillingEmail}
              type="email"
              autoComplete="email"
              placeholder={t('register.billingEmailPlaceholder')}
              disabled={isSubmitting}
              error={errors.billing_email?.[0]}
            />

            <SelectInput
              id="popup-country"
              label={t('register.country')}
              required
              value={selectedCountry?.id ?? countryId}
              onChange={handleCountryChange}
              disabled={isSubmitting || isLoadingRegisterData}
              error={errors.country_id?.[0] ?? errors.country?.[0]}
              options={countries}
              placeholder={isLoadingRegisterData ? t('register.loadingCountries') : t('register.countryPlaceholder')}
            />

            <div>
              <Label className="mb-2 block font-bold text-neutral-700">
                {t('register.streetAddress')} <span className="text-red-500">*</span>
              </Label>
              <AddressAutocomplete
                value={streetAddress}
                onChange={setStreetAddress}
                onAddressSelect={onAddressSelect}
                className="h-13 rounded-full border border-slate-200 bg-slate-50 pr-4 text-base font-semibold text-neutral-800 placeholder:font-medium placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                hasError={Boolean(errors.street_address)}
                placeholder={t('register.addressAutocompletePlaceholder')}
              />
              {errors.street_address?.[0] ? (
                <p className="mt-1 text-sm font-semibold text-red-600">{errors.street_address[0]}</p>
              ) : null}
            </div>

            <TextInput
              id="popup-postcode"
              label={t('register.postcode')}
              required
              value={postcode}
              onChange={setPostcode}
              autoComplete="postal-code"
              placeholder={t('register.postcodePlaceholder')}
              disabled={isSubmitting}
              error={errors.postcode?.[0]}
            />

            <TextInput
              id="popup-city"
              label={t('register.city')}
              required
              value={city}
              onChange={setCity}
              autoComplete="address-level2"
              placeholder={t('register.cityPlaceholder')}
              disabled={isSubmitting}
              error={errors.city?.[0]}
            />

            <SelectInput
              id="popup-state"
              label={t('register.state')}
              value={stateId}
              onChange={setStateId}
              disabled={isSubmitting || !countryId || !provinces.length}
              error={errors.state_id?.[0] ?? errors.province_id?.[0] ?? errors.state?.[0]}
              options={provinces}
              placeholder={
                !countryId
                  ? t('register.selectCountryFirst')
                  : provinces.length
                    ? t('register.statePlaceholder')
                    : t('register.noProvincesAvailable')
              }
            />

            <TextInput
              id="popup-kvk-number"
              label={t('register.kvkOptional')}
              value={kvkNumber}
              onChange={setKvkNumber}
              autoComplete="off"
              placeholder={t('register.kvkOptionalPlaceholder')}
              disabled={isSubmitting}
              error={errors.kvk_number?.[0]}
            />
          </div>

          <p className="text-xs font-medium leading-5 text-neutral-500">
            {t('register.privacyText')}{' '}
            <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand transition-colors hover:text-amber-700">
              {t('register.privacyPolicy')}
            </Link>
            .
          </p>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 h-13 rounded-full bg-brand px-6 text-base font-black text-white shadow-lg shadow-brand/20 hover:bg-brand-hover"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                {t('register.registeringText')}
              </>
            ) : (
              t('register.getStartedButton')
            )}
          </Button>

          <p className="text-center text-sm font-semibold text-neutral-500">
            {t('register.alreadyHaveAccount')}{' '}
            {onSwitchToLogin ? (
              <button
                type="button"
                onClick={() => {
                  handleOpenChange(false);
                  onSwitchToLogin();
                }}
                className="font-black text-brand transition-colors hover:text-amber-700"
              >
                {t('register.popupLoginLink')}
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => handleOpenChange(false)}
                className="font-black text-brand transition-colors hover:text-amber-700"
              >
                {t('register.popupLoginLink')}
              </Link>
            )}
          </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TextInput({
  id,
  label,
  required,
  value,
  onChange,
  type = 'text',
  autoComplete,
  placeholder,
  disabled,
  error,
  hint,
  icon,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete: string;
  placeholder: string;
  disabled: boolean;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="font-bold text-neutral-700">
        {label} {required && <span className="text-red-500">*</span>}
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
          className={`h-13 rounded-full border-slate-200 bg-slate-50 pr-4 text-base font-semibold text-neutral-800 placeholder:font-medium placeholder:text-neutral-400 focus-visible:border-brand focus-visible:ring-brand/20 ${icon ? 'pl-12' : 'pl-5'}`}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      {!error && hint ? <p className="text-sm font-medium text-neutral-400">{hint}</p> : null}
    </div>
  );
}

function SelectInput({
  id,
  label,
  required,
  value,
  onChange,
  disabled,
  error,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  error?: string;
  options: RegisterOption[];
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="font-bold text-neutral-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          className="h-13 w-full appearance-none rounded-full border border-slate-200 bg-slate-50 px-5 pr-12 text-base font-semibold text-neutral-800 outline-none transition-colors focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-destructive/20"
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-neutral-500" />
      </div>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
