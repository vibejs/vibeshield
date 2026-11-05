import { SHIELD_INVALID_CONFIG, ShieldError } from "./errors.ts";

export interface WindowDecision {
  readonly allowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly retryAfterMs: number;
}

/**
 * An in-memory sliding window. A hit ages out `windowMs` after it was recorded.
 * The store is process-local and does not call the network.
 */
export function createMemoryWindow(options: {
  readonly limit: number;
  readonly windowMs: number;
}): {
  hit(key: string, now: number): WindowDecision;
} {
  if (!Number.isInteger(options.limit) || options.limit < 1) {
    throw new ShieldError(SHIELD_INVALID_CONFIG, "limit must be a positive integer.");
  }
  if (!Number.isInteger(options.windowMs) || options.windowMs < 1) {
    throw new ShieldError(SHIELD_INVALID_CONFIG, "windowMs must be a positive integer.");
  }
  const hits = new Map<string, number[]>();
  return {
    hit(key, now) {
      const from = now - options.windowMs;
      const recent = (hits.get(key) ?? []).filter((at) => at > from);
      if (recent.length >= options.limit) {
        hits.set(key, recent);
        return {
          allowed: false,
          limit: options.limit,
          remaining: 0,
          retryAfterMs: recent[0] + options.windowMs - now,
        };
      }
      recent.push(now);
      hits.set(key, recent);
      return {
        allowed: true,
        limit: options.limit,
        remaining: options.limit - recent.length,
        retryAfterMs: 0,
      };
    },
  };
}
