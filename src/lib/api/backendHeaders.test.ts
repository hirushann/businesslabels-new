import { afterEach, describe, expect, it } from "vitest";
import { getBackendHeaders } from "./backendHeaders";

describe("getBackendHeaders", () => {
  afterEach(() => {
    delete process.env.DOMAIN_LOCK;
    delete process.env.DOMAIN_LOCK_USER;
    delete process.env.DOMAIN_LOCK_PASSWORD;
  });

  it("returns default Accept json header", () => {
    const headers = getBackendHeaders();
    expect(headers.Accept).toBe("application/json");
    expect(headers.Authorization).toBeUndefined();
  });

  it("attaches Basic Auth header when DOMAIN_LOCK is true", () => {
    process.env.DOMAIN_LOCK = "true";
    process.env.DOMAIN_LOCK_USER = "bbnl";
    process.env.DOMAIN_LOCK_PASSWORD = "secret";

    const headers = getBackendHeaders();
    const expected = `Basic ${Buffer.from("bbnl:secret").toString("base64")}`;
    expect(headers.Authorization).toBe(expected);
  });

  it("merges extra headers without losing Basic Auth", () => {
    process.env.DOMAIN_LOCK = "true";
    process.env.DOMAIN_LOCK_USER = "bbnl";
    process.env.DOMAIN_LOCK_PASSWORD = "secret";

    const headers = getBackendHeaders({ "Content-Type": "application/json" });
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers.Accept).toBe("application/json");
    expect(headers.Authorization).toBeDefined();
  });
});
