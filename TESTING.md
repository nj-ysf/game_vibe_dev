# Verification — 21 October 2026

## Passed

- **41 backend tests**, including the required four-round competition sequence through the API, server replay scoring, normalization, data privacy, corrupted-file rejection, atomic persistence, separate-process/thread concurrency, and duplicate-session protection.
- **8 gameplay-engine tests** covering combo thresholds, penalties, missed clouds, stale/duplicate hits, exact 45-second expiration, difficulty boundaries and cleanup.
- **React server-render checks** for welcome, ready/gameplay, registration/results and leaderboard. The primary screens render successfully using the installed React/Motion/Lucide libraries.
- **Production JavaScript and Tailwind CSS build**, using `scripts/build-local.ps1`'s direct esbuild/PostCSS workflow. JavaScript bundle approximately 387 KiB uncompressed.
- **Live HTTP smoke checks**: home, official logo, JS, CSS, health, leaderboard and stats all returned HTTP 200. Potential public CSV paths returned HTTP 404.
- **Logo preservation**: `image.png` and `frontend/public/logo.png` have identical SHA-256 hashes.
- **Browser test discovery**: both desktop and mobile Playwright cases load successfully.

## Environment limits

- Registry installation was blocked by network restrictions; escalation was rejected by the environment's approval policy. The exact installed package versions from existing local projects were reused. Run `npm install` on a fresh checkout.
- Standard Vite execution hit `spawn EPERM` when Node attempted to open esbuild's process pipe. The direct installed esbuild binary and PostCSS compiled successfully.
- The browser tool reported no available browser surfaces. **No visual browser inspection or Playwright execution was completed.** Server-render checks do not verify layout, animation, audio, or real touch interaction. The executable desktop/mobile suite is in `frontend/tests/game.spec.js`; run it against a dedicated test CSV, then play a smoke round on the stand device.
- FastAPI's installed Starlette version emitted a deprecation warning about its HTTPX test adapter; all backend tests passed.

All synthetic participant records used during verification are under ignored `test-results/`, not the default event CSV. The temporary verification server was stopped after checks.
