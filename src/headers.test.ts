import { expect, it } from "vitest";
import { securityHeaders } from "./headers.ts";

it("uses the default security headers", () => {
  const headers = securityHeaders();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["content-security-policy"]).toContain("default-src");
  expect(headers["strict-transport-security"]).toContain("max-age");
  expect(headers["permissions-policy"]).toContain("camera=()");
});

it("replaces or drops a header", () => {
  const headers = securityHeaders({
    frameOptions: false,
    contentSecurityPolicy: "default-src 'none'",
  });
  expect(headers["x-frame-options"]).toBeUndefined();
  expect(headers["content-security-policy"]).toBe("default-src 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
});
