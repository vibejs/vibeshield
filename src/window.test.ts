import { describe, expect, it } from "vitest";
import { SHIELD_INVALID_CONFIG } from "./errors.ts";
import { createMemoryWindow } from "./window.ts";

describe("createMemoryWindow", () => {
  it("allows hits inside the window and drops the ones that age out", () => {
    const window = createMemoryWindow({ limit: 2, windowMs: 100 });
    expect(window.hit("a", 0)).toMatchObject({ allowed: true, remaining: 1 });
    expect(window.hit("a", 10)).toMatchObject({ allowed: true, remaining: 0 });
    expect(window.hit("a", 50)).toMatchObject({ allowed: false, remaining: 0, retryAfterMs: 50 });
    expect(window.hit("b", 50)).toMatchObject({ allowed: true, remaining: 1 });
    expect(window.hit("a", 101)).toMatchObject({ allowed: true, remaining: 0 });
  });

  it("rejects a limit or window that is not a positive integer", () => {
    expect(() => createMemoryWindow({ limit: 0, windowMs: 10 })).toThrow(
      expect.objectContaining({ code: SHIELD_INVALID_CONFIG }),
    );
    expect(() => createMemoryWindow({ limit: 1.5, windowMs: 10 })).toThrow(
      expect.objectContaining({ code: SHIELD_INVALID_CONFIG }),
    );
    expect(() => createMemoryWindow({ limit: 1, windowMs: 0 })).toThrow(
      expect.objectContaining({ code: SHIELD_INVALID_CONFIG }),
    );
    expect(() => createMemoryWindow({ limit: 1, windowMs: 1.5 })).toThrow(
      expect.objectContaining({ code: SHIELD_INVALID_CONFIG }),
    );
  });
});
