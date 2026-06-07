# Perspective Handoff Packet Structure Review Browser Validation

Date: 2026-06-07

Branch: `codex/perspective-handoff-packet-structure-review-v0-1`

URL: `http://127.0.0.1:3000`

Temp DB: `/tmp/augnes-handoff-packet-structure-review.db`

Server command:

- `env -u OPENAI_API_KEY -u GITHUB_TOKEN AUGNES_DB_PATH=/tmp/augnes-handoff-packet-structure-review.db npm run dev -- --hostname 127.0.0.1 --port 3000`

## Setup

- Reset, migrated, and seeded the temp SQLite DB.
- Started Next dev bound to `127.0.0.1`.
- No provider or GitHub token was present in the dev server environment.

## Desktop Checks

PASS:

- Perspective opens as the default Cockpit tab.
- Perspective Observatory and Current Perspective Starmap are visible on first load.
- Current formation loads as `Whole Constellation · basis current · source sample:chatgpt`.
- Handoff packet textarea exists but remains behind the `Preview Handoff Packet` details disclosure before opening.
- `Open Handoff Packet` is enabled and opens the details disclosure.
- Packet textarea is visible after opening.
- Generated packet includes stable section order:
  - `1. Purpose`
  - `2. Selected Perspective Material`
  - `3. Evidence`
  - `4. Unresolved Tensions`
  - `5. Next Action Candidates`
  - `6. Suggested Use`
  - `7. Compact Authority`
  - `8. Base Packet Text`
- Evidence, tensions, and next action sections remain separate.
- `Compact Authority` appears once and the `Authority:` statement appears once.
- Opening the handoff packet selects the Codex handoff packet; the ChatGPT target toggle switches to ChatGPT-specific suggested use.
- No always-visible packet panel or visible authority wall appeared.
- No Rulecraft text appeared in the product-facing UI.
- No horizontal page overflow at the desktop viewport.

Console: PASS, no browser warnings or errors.

## Mobile 390px Checks

Viewport observed: 375px CSS viewport under a 390px browser override.

PASS:

- Perspective remains the default tab.
- Current Perspective Starmap remains visible.
- `Preview Handoff Packet` remains details-gated before opening.
- `Open Handoff Packet` remains enabled.
- Page width stayed within viewport; no horizontal overflow.
- Packet textarea is visible after opening.
- Stable section headers remain present.
- `Compact Authority` appears once and the `Authority:` statement appears once.
- No always-visible authority wall appeared.

Console: PASS, no browser warnings or errors.

## Traffic Summary

Server logs showed only local app/read GETs, including:

- `GET /`
- `GET /api/augnes/read/constellation-preview?scope=project:augnes`
- `GET /api/augnes/read/perspective-ingest-constellation-preview?scope=project:augnes&source=sample%3Achatgpt`
- local Augnes read/state summary routes such as `/api/perspective/snapshot`, `/api/state/brief`, `/api/work`, `/api/events`, and `/api/work/AG-001/brief`

No external provider, GitHub, Codex, OpenAI, or API-billing traffic was observed.

## Notes

- A preliminary browser attempt used `127.0.0.1` while the dev server advertised `localhost`, which produced a Next dev-origin HMR warning and did not hydrate the Perspective ingest preview. The server was restarted with `--hostname 127.0.0.1`, after which the exact requested URL validated cleanly.
- No browser checks were skipped.
