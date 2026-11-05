import { SHIELD_RATE_LIMITED } from "./errors.ts";
import { securityHeaders, type SecurityHeaderOptions } from "./headers.ts";
import { createMemoryWindow } from "./window.ts";

/** Fetch middleware. Structurally the same as a vibe.js server middleware. */
export type ShieldMiddleware = (
  req: Request,
  next: (req?: Request) => Promise<Response>,
) => Promise<Response>;

export interface ShieldOptions {
  /** Requests allowed inside the sliding window. */
  readonly limit: number;
  /** Window length in milliseconds. */
  readonly windowMs: number;
  /** Bucket key. The default is the first `x-forwarded-for` address, or `anonymous`. */
  readonly key?: (req: Request) => string;
  /** Security headers added to every response. `false` adds none. */
  readonly headers?: SecurityHeaderOptions | false;
  /** Clock for tests. Defaults to `Date.now`. */
  readonly now?: () => number;
}

function defaultKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded === null) return "anonymous";
  const key = forwarded.split(",")[0].trim();
  if (key === "") return "anonymous";
  return key;
}

function applyHeaders(
  target: Headers,
  headers: Readonly<Record<string, string>>,
  skipExisting: boolean,
): void {
  for (const [name, value] of Object.entries(headers)) {
    if (skipExisting && target.has(name)) continue;
    target.set(name, value);
  }
}

function limited(decision: { retryAfterMs: number; limit: number }): Response {
  const retryAfter = Math.max(1, Math.ceil(decision.retryAfterMs / 1000));
  const body = {
    type: "about:blank",
    title: "Too Many Requests",
    status: 429,
    code: SHIELD_RATE_LIMITED,
    detail: "Rate limit exceeded.",
  };
  return new Response(JSON.stringify(body), {
    status: 429,
    headers: {
      "content-type": "application/problem+json",
      "retry-after": String(retryAfter),
      "ratelimit-limit": String(decision.limit),
      "ratelimit-remaining": "0",
    },
  });
}

/**
 * Sliding-window rate limit and security headers. The limiter is memory-only and
 * does not know about authentication.
 */
export function createShield(options: ShieldOptions): ShieldMiddleware {
  const window = createMemoryWindow({ limit: options.limit, windowMs: options.windowMs });
  const keyFn = options.key ?? defaultKey;
  const now = options.now ?? Date.now;
  const headers = options.headers === false ? {} : securityHeaders(options.headers);
  return async (req, next) => {
    const decision = window.hit(keyFn(req), now());
    if (!decision.allowed) {
      const response = limited(decision);
      applyHeaders(response.headers, headers, false);
      return response;
    }
    const response = await next();
    const copy = new Response(response.body, response);
    applyHeaders(copy.headers, headers, true);
    copy.headers.set("ratelimit-limit", String(decision.limit));
    copy.headers.set("ratelimit-remaining", String(decision.remaining));
    return copy;
  };
}
