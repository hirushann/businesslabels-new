import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { proxy } from "./proxy";

function makeRequest(path: string, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("proxy locale routing", () => {
  it("keeps clean URLs in the user's persisted English locale", () => {
    const response = proxy(makeRequest("/product?focus=true", `${LOCALE_COOKIE}=en`));

    expect(response.status).not.toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("keeps checkout return URLs in the user's persisted English locale", () => {
    const response = proxy(makeRequest("/thank-you?order_number=BL-123", `${LOCALE_COOKIE}=en`));

    expect(response.status).not.toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("defaults clean URLs to Dutch when no locale has been selected", () => {
    const response = proxy(makeRequest("/product?focus=true"));

    expect(response.status).not.toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("nl");
  });

  it("keeps prefixed English URLs English", () => {
    const response = proxy(makeRequest("/en/product?focus=true", `${LOCALE_COOKIE}=nl`));

    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("keeps auth redirects locale-aware", () => {
    const response = proxy(makeRequest("/en/my-account"));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBe("http://localhost/en/login?redirect=%2Fen%2Fmy-account");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("keeps auth redirects locale-aware from clean URLs with an English cookie", () => {
    const response = proxy(makeRequest("/my-account", `${LOCALE_COOKIE}=en`));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBe("http://localhost/en/login?redirect=%2Fen%2Fmy-account");
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });
});
