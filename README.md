# Vibe Shield

**Sliding-window rate limits and security headers for vibe.js.**

The package name is `@usevibejs/shield`.

## Install

```bash
pnpm add @usevibejs/shield
```

## Quick start

`createShield` is fetch middleware. It counts requests in a memory sliding window and sets security headers. It does not know who the user is. Pass `key` to choose the bucket. A full window answers 429 with code `SHIELD_RATE_LIMITED`.

```ts
import { createShield } from "@usevibejs/shield";

const shield = createShield({ limit: 100, windowMs: 60_000 });
```

## Error codes

See [docs/errors.md](docs/errors.md).

## Local development

```bash
pnpm install
pnpm check
```

`pnpm check` formats, lints, typechecks, and runs tests at 100% per-file coverage.

## Releases

Releases use changesets. A maintainer runs the Release workflow from main. Do not publish by hand.

## License

MIT. See [LICENSE](LICENSE) and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
