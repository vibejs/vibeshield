/** Stable codes owned by `@usevibejs/shield`. They are not vibe.js `VIBE` codes. */
export const SHIELD_INVALID_CONFIG = "SHIELD_INVALID_CONFIG";
export const SHIELD_RATE_LIMITED = "SHIELD_RATE_LIMITED";

/** A shield configuration error. `code` is stable. */
export class ShieldError extends Error {
  override readonly name = "ShieldError";
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
