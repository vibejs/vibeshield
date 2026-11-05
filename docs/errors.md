# Error codes

These codes belong to `@usevibejs/shield`. The `VIBE` series belongs to the vibe.js monorepo and is not used here.

| Code                    | Meaning                                                  |
| ----------------------- | -------------------------------------------------------- |
| `SHIELD_INVALID_CONFIG` | Thrown when limit or windowMs is not a positive integer. |
| `SHIELD_RATE_LIMITED`   | HTTP 429 problem+json when the sliding window is full.   |
