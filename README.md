# Cloud Whack: Chaos Edition

**45 seconds. 9 holes. One champion.** Organized by **Cloud Clubs — ENSET Mohammedia**.

A local arcade application with React, Vite, Tailwind CSS, Motion, Lucide icons, original SVG cloud characters, generated Web Audio effects, and a FastAPI backend. The supplied official logo is preserved unchanged in `frontend/public/logo.png`.

## Quick launch on this computer

A production build is included in the local `frontend/dist` directory. From `C:\Users\dell\Documents\ClubGame`:

```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Open **http://127.0.0.1:8000**. Keep that terminal open. This starts one backend process and serves the built frontend from the same origin. The build is ignored by Git; a fresh checkout needs the installation/build steps below.

## Installation and development

Use Python **3.11+**, Node.js **22.17+**, and npm. Internet access is needed once to install dependencies; gameplay and all assets then run locally.

From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
```

Terminal 1 — backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Terminal 2 — frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. Vite proxies `/api` to port 8000. The equivalent backend-directory command is `python -m uvicorn main:app --host 127.0.0.1 --port 8000`. On Linux/macOS use `.venv/bin/python` instead of `.venv\Scripts\python.exe`.

`--reload` is useful during development, but **do not use reload or multiple workers during the event**. A reload destroys pending in-memory round sessions. CSV records survive restarts.

## Production build

```powershell
cd frontend
npm run build
cd ..
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Start or restart the backend **after** the build exists. It automatically serves `frontend/dist` at `/`; it never serves the backend data directory.

This workspace's restricted execution environment blocks Node's esbuild child-process pipe. A Windows build fallback runs the installed esbuild binary directly and compiles Tailwind with PostCSS:

```powershell
.\scripts\build-local.ps1
```

The fallback uses the same React source and dependencies. Normal development and builds still use Vite. Dependencies available locally were copied from installed packages for this session; a fresh machine should run `npm install`.

## Playing and running the stand

1. Click **PLAY NOW**. A backend session is created before the 3–2–1 countdown.
2. Tap white Happy Clouds (+10) and crowned Royal Clouds (+30). Avoid angry Storm Clouds (−20) and swirling Chaos Clouds (−10).
3. Each round lasts exactly 45,000 milliseconds using `performance.now()`. Difficulty changes at 10, 20, and 30 seconds. Background tabs do not pause the round.
4. Friendly streaks earn ×1.5 on hit 3, ×2 on hit 5, and ×3 on hit 10. A missed friendly cloud or hit on trouble resets the streak. Penalties are never multiplied, and scores stay nonnegative.
5. Enter Full Name, Filière, and Phone Number **after** the round. Consent is required to save.
6. Save to reveal rank and personal best, then view the leaderboard. The next challenger presses **PLAY AGAIN**.

Unsaved results block in-app navigation/new rounds. Refresh and browser-close actions show the browser's standard leave warning when supported. The back button is guarded. Form details and hit history stay in React memory during a network failure so the player can retry. No personal data is written to localStorage, sessionStorage, or cookies. Reloading, closing the tab, or restarting the backend can lose an unsaved round; keep the page/server open until saving succeeds. Pending sessions expire after two hours.

The mute button works throughout the game; sound begins only after a user gesture. Reduced-motion preferences are respected. Keyboard users can focus cloud buttons and activate with Enter/Space. Touch uses pointer events to prevent duplicate click/touch scores.

Only one round can run in a given UI instance. For the stand, use one browser tab and one operator-controlled device. The server does not impose an event-wide lock across separate browsers.

## Configuration

The defaults require no configuration. `.env.example` documents the supported **process environment variables**; an `.env` file is not automatically loaded.

```powershell
$env:PLAYER_CSV = 'C:\private-event-data\players.csv'
$env:CORS_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173'
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

For phone testing over a trusted local network, build the frontend, bind the backend to `0.0.0.0`, and visit `http://<computer-LAN-IP>:8000` from the phone. Keep private participant files outside the served directory. Do not expose the development server or API to the public internet. A public deployment would require HTTPS, operator access controls, stronger anti-abuse protections, and persistent private storage.

## CSV persistence and backup

The authoritative database is **`backend/data/players.csv`** by default, created automatically with:

```csv
phone_number,name,filiere,best_score,attempts,updated_at
```

Moroccan mobile numbers such as `0612345678`, `+212612345678`, and `00212612345678` normalize to the same local identifier. `07` mobile numbers are also supported. Leading zeros remain in the CSV text; if inspecting it in a spreadsheet, import the phone column as **text**.

Returning players retain their original name/filière, keep the greater of their old/new scores, and increment attempts. Standings sort by score descending, then earlier `updated_at`, then the internal phone identifier. Phone identifiers are never exposed by leaderboard/stats/save responses. Because timestamps update on every attempt, tied players' order can change after another attempt.

Storage uses a thread lock and OS-level inter-process lock (`msvcrt` on Windows, `flock` on Unix), proper UTF-8 CSV quoting, formula-prefix escaping, flushed/fsynced temporary writes, and atomic replacement. `players.csv.bak` contains the previous verified snapshot. Invalid headers, malformed rows, duplicate phones, invalid numeric fields, or timestamps cause a clear error instead of overwriting data. If corruption exists at startup, the backend refuses to start. Make a separate organizer backup periodically; the one-generation `.bak` is not an archive.

To recover: stop the backend, preserve the damaged file for investigation, inspect the `.bak`, copy a verified backup to `players.csv`, and restart. Never edit the CSV while the backend is running. Use one backend worker even though the CSV lock is inter-process: sessions/rate limits/duplicate receipts belong to one process.

Use a private organizer account and restrict the data folder's Windows Security permissions to organizers. Unix-created CSV files use mode `0600`. Avoid shared/cloud-synced folders, network filesystems, and ephemeral hosting disks. `.gitignore` excludes participant CSVs, backups, lock files and test data.

## Privacy and deletion after the event

The consent notice explains that phone numbers identify repeat players, while names, filières, and best scores are displayed publicly. Phone entry does **not** verify ownership and is not authentication. A person knowing someone else's number can submit another attempt under that identifier.

To delete a participant, stop the backend and remove their normalized-phone row using a CSV-aware editor, keeping the exact headers. Also remove them from retained backups/exports. To clear the competition, stop the backend and delete the event CSV **and its `.bak` and organizer copies**; the next startup creates a header-only file. Follow the event's announced retention period. Do not share test fixtures as real participant records.

## Logo and artwork

`image.png` is the supplied reference. `frontend/public/logo.png` is its byte-for-byte copy, reused in the shared header on every screen. To replace it, put the official image at that public path and rebuild. Do not replace it with a generated logo. `CloudCharacter.jsx` contains the separate original SVG arcade characters. No external image, font, or audio URL is used. The reference standings screenshot was not provided; the leaderboard follows the prompt's purple palette and top-three/champion styling.

## API and score validation

| Endpoint | Behavior |
| --- | --- |
| `POST /api/game/start` | Returns a random session token, 3500 ms countdown, 45000 ms duration, and server-generated appearance schedule. |
| `POST /api/scores` | Validates player data, elapsed server time, session lifetime, unique/window-valid hit events, and recalculates the score before CSV storage. |
| `GET /api/leaderboard` | Public rank, name, filière and best score only. |
| `GET /api/stats` | Unique player count, total games, highest score. |
| `GET /api/health` | Checks that storage is readable and valid. |

Scores include `session_id`, `name`, `filiere`, `phone_number`, integer `score`, and `hits: [{"id": 0, "at": 400}]`. Hit times are integer milliseconds since gameplay started. The server verifies each ID is unique and each hit occurs within its scheduled window, reproduces missed-friendly combo resets, and rejects a score inconsistent with the replay. Pending sessions are capped; starts and score requests have per-IP rate limits.

A duplicate save returns HTTP 409 with the previous nonprivate receipt. The UI recognizes this as an already-successful save, recovering from a lost network response without adding an attempt. Successful receipts are retained for the session lifetime.

**Anti-cheat limits:** this is schedule-validated replay, not real-time authoritative input. The client receives the schedule and reports hit timestamps; a modified client or bot can fabricate valid hits. Timing validation cannot prove human input. This is suitable for an organizer-supervised local stand, not an unsupervised online contest. Sessions and receipts are in memory; a process crash after a CSV commit can leave the player unsure whether the save succeeded, so organizers should inspect the CSV before granting another attempt. No secrets are sent to the client. Phone numbers are never unnecessarily logged, and validation errors omit input values.

## Tests

From the project root:

```powershell
python -m pytest backend/tests -q
cd frontend
npm test
```

Backend tests cover phone normalization/validation, storage creation and quoting, best-score preservation, deterministic ties, corruption rejection, formula escaping, persistence after re-opening, thread/process concurrency, score replay, session timing/replay/expiry, request validation, privacy, and rate limits. The requested 650 → 800 → 950 → 400 competition scenario is tested through both storage and the full API; Youssef ends at 950, three attempts, and exactly two unique players remain.

Gameplay tests cover combo thresholds, penalties, misses, repeated/stale hits, the exact timer boundary, difficulty changes, and disposal. `frontend/scripts/render-check.jsx` provides server-render checks for every primary screen without a browser.

### Browser tests (use a separate test database)

First build the frontend. In a separate terminal from the project root:

```powershell
$env:PLAYER_CSV = "$PWD\test-results\browser\players.csv"
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Then:

```powershell
cd frontend
npx playwright install chromium
npm run test:e2e
```

These tests run real 45-second rounds on desktop and mobile layouts, check countdown/input gating and board fit, simulate one failed save, verify retained form values and successful retry, check rank/privacy/no browser persistence, and start a second round. They write synthetic test participants only to the dedicated test CSV. Set `GAME_URL` to test another local URL.

### Verification in this workspace

- Backend and deterministic gameplay tests executed successfully; see `TESTING.md` for the final counts.
- The direct production build and local HTTP health/static routes were checked.
- Standard Vite build execution was blocked by the sandbox's child-process restriction; the fallback build succeeded.
- No connected browser was available, so visual inspection and the Playwright desktop/mobile suite could not be run here. Run those tests and a supervised smoke round on the actual stand hardware before the event.

Setup follows the official [Vite guide](https://vite.dev/guide/), [Tailwind PostCSS integration](https://tailwindcss.com/docs/installation/using-postcss), and [FastAPI testing guide](https://fastapi.tiangolo.com/tutorial/testing/).
