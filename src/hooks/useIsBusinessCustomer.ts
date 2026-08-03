"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function customerFrom(value: unknown): Record<string, unknown> | null {
  const record = objectValue(value);
  if (!record) return null;
  const data = objectValue(record.data);
  const auth = objectValue(record.auth);

  return objectValue(record.user)
    || objectValue(record.customer)
    || objectValue(data?.user)
    || data
    || objectValue(auth?.user)
    || record;
}

export function isBusinessCustomerProfile(value: unknown): boolean {
  const customer = customerFrom(value);
  if (!customer) return false;

  const companyFlag = customer.is_company ?? customer.isCompany;
  if (typeof companyFlag === "boolean") return companyFlag;
  if (companyFlag === 1 || companyFlag === "1" || companyFlag === "true") return true;
  if (companyFlag === 0 || companyFlag === "0" || companyFlag === "false") return false;

  const customerType = customer.customer_type ?? customer.customerType ?? customer.type;
  if (typeof customerType === "string") {
    if (["business", "company", "b2b"].includes(customerType.toLowerCase())) return true;
    if (["consumer", "individual", "b2c"].includes(customerType.toLowerCase())) return false;
  }

  return ["company_name", "companyName", "company", "business_name"].some((key) => {
    const value = customer[key];
    return typeof value === "string" && value.trim() !== "";
  });
}

function storedCustomer() {
  return typeof window === "undefined" ? "" : window.localStorage.getItem("auth_user") ?? "";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("auth-user-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("auth-user-updated", callback);
  };
}

export function useIsBusinessCustomer(): boolean {
  const stored = useSyncExternalStore(subscribe, storedCustomer, () => "");
  const [profileState, setProfileState] = useState<{ cacheKey: string; value: unknown }>({
    cacheKey: "",
    value: undefined,
  });

  useEffect(() => {
    let active = true;

    fetch("/api/account/profile", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((value) => {
        if (active) setProfileState({ cacheKey: stored, value });
      })
      .catch(() => {
        if (active) setProfileState({ cacheKey: stored, value: null });
      });

    return () => {
      active = false;
    };
  }, [stored]);

  const profile = profileState.cacheKey === stored ? profileState.value : undefined;
  if (profile !== undefined) return isBusinessCustomerProfile(profile);
  if (!stored) return false;

  try {
    return isBusinessCustomerProfile(JSON.parse(stored));
  } catch {
    return false;
  }
}
