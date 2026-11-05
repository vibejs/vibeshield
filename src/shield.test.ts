import { Controller, Handle, JsonLogger, Module } from "@usevibejs/server";
import { VibeFactory } from "@usevibejs/server";
import { defineContract, get } from "@usevibejs/contract";
import * as v from "valibot";
import { expect, it, vi } from "vitest";
import { SHIELD_RATE_LIMITED } from "./errors.ts";
import { createShield } from "./shield.ts";
import { SHIELD_INVALID_CONFIG, ShieldError } from "./index.ts";

const ping = defineContract("/ping", {
  get: get("/", { response: v.object({ ok: v.literal(true) }) }),
});

@Controller(ping)
class PingController {
  @Handle(ping.get)
  get(): { ok: true } {
    return { ok: true };
  }
}

@Module({ controllers: [PingController] })
class AppModule {}

function request(headers?: RequestInit["headers"]): Request {
  return new Request("http://localhost/ping", { headers });
}

it("limits one key and leaves another key alone", async () => {
  let now = 0;
  const shield = createShield({
    limit: 1,
    windowMs: 1000,
    now: () => now,
    key: (req) => req.headers.get("x-user") ?? "anonymous",
    headers: { frameOptions: "SAMEORIGIN" },
  });
  const next = vi.fn<() => Promise<Response>>(
    async () => new Response("ok", { headers: { "x-frame-options": "ALLOW" } }),
  );
  const first = await shield(request({ "x-user": "a" }), next);
  expect(await first.text()).toBe("ok");
  expect(first.headers.get("x-frame-options")).toBe("ALLOW");
  expect(first.headers.get("x-content-type-options")).toBe("nosniff");
  expect(first.headers.get("ratelimit-remaining")).toBe("0");
  const blocked = await shield(request({ "x-user": "a" }), next);
  expect(blocked.status).toBe(429);
  expect(blocked.headers.get("content-type")).toBe("application/problem+json");
  expect(blocked.headers.get("retry-after")).toBe("1");
  expect(blocked.headers.get("x-frame-options")).toBe("SAMEORIGIN");
  expect(await blocked.json()).toMatchObject({ code: SHIELD_RATE_LIMITED, status: 429 });
  const other = await shield(request({ "x-user": "b" }), next);
  expect(other.status).toBe(200);
  expect(next).toHaveBeenCalledTimes(2);
  now = 1000;
  const again = await shield(request({ "x-user": "a" }), next);
  expect(again.status).toBe(200);
});

it("keys anonymous requests and can skip security headers", async () => {
  const shield = createShield({ limit: 1, windowMs: 60_000, headers: false });
  const next = async () => new Response("ok");
  const open = await shield(request(), next);
  expect(open.headers.get("x-content-type-options")).toBeNull();
  expect(open.headers.get("ratelimit-limit")).toBe("1");
  const blank = await shield(request({ "x-forwarded-for": "   " }), next);
  expect(blank.status).toBe(429);
  const named = createShield({ limit: 1, windowMs: 60_000, headers: false });
  const forwarded = await named(request({ "x-forwarded-for": " 10.0.0.1, 10.0.0.2" }), next);
  expect(forwarded.status).toBe(200);
  const again = await named(request({ "x-forwarded-for": "10.0.0.1" }), next);
  expect(again.status).toBe(429);
  expect(again.headers.get("content-security-policy")).toBeNull();
});

it("answers 429 through a vibe.js server", async () => {
  const app = await VibeFactory.create(AppModule, {
    logger: new JsonLogger({ level: "silent" }),
    middleware: [createShield({ limit: 1, windowMs: 60_000 })],
  });
  expect((await app.request("/ping")).status).toBe(200);
  const blocked = await app.request("/ping");
  expect(blocked.status).toBe(429);
  expect(blocked.headers.get("content-type")).toContain("application/problem+json");
  expect(await blocked.json()).toMatchObject({ code: SHIELD_RATE_LIMITED });
  await app.close();
});

it("re-exports the configuration error", () => {
  expect(new ShieldError(SHIELD_INVALID_CONFIG, "bad").name).toBe("ShieldError");
});
