export interface SecurityHeaderOptions {
  readonly contentSecurityPolicy?: string | false;
  readonly strictTransportSecurity?: string | false;
  readonly frameOptions?: string | false;
  readonly contentTypeOptions?: string | false;
  readonly referrerPolicy?: string | false;
  readonly permissionsPolicy?: string | false;
}

const DEFAULTS: Readonly<Record<string, string>> = {
  "content-security-policy": "default-src 'self'; frame-ancestors 'none'; base-uri 'self'",
  "strict-transport-security": "max-age=15552000; includeSubDomains",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

/** The response headers shield adds. `false` drops a header. A string replaces the default. */
export function securityHeaders(
  options: SecurityHeaderOptions = {},
): Readonly<Record<string, string>> {
  const overrides: Readonly<Record<string, string | false | undefined>> = {
    "content-security-policy": options.contentSecurityPolicy,
    "strict-transport-security": options.strictTransportSecurity,
    "x-frame-options": options.frameOptions,
    "x-content-type-options": options.contentTypeOptions,
    "referrer-policy": options.referrerPolicy,
    "permissions-policy": options.permissionsPolicy,
  };
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(DEFAULTS)) {
    const override = overrides[name];
    if (override === false) continue;
    headers[name] = override ?? value;
  }
  return headers;
}
