/**
 * Helper to produce default headers for backend API requests,
 * including Basic Auth when DOMAIN_LOCK is enabled.
 */
export function getBackendHeaders(extraHeaders?: HeadersInit): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (
    process.env.DOMAIN_LOCK === "true" &&
    process.env.DOMAIN_LOCK_USER &&
    process.env.DOMAIN_LOCK_PASSWORD
  ) {
    const creds = Buffer.from(
      `${process.env.DOMAIN_LOCK_USER}:${process.env.DOMAIN_LOCK_PASSWORD}`,
    ).toString("base64");
    headers.Authorization = `Basic ${creds}`;
  }

  if (extraHeaders) {
    if (extraHeaders instanceof Headers) {
      extraHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(extraHeaders)) {
      extraHeaders.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, extraHeaders);
    }
  }

  return headers;
}
