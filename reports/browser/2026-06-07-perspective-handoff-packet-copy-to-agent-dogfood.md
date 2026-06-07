# Perspective Handoff Packet Copy-to-Agent Dogfood Browser Validation

Date: 2026-06-07

Branch: `codex/perspective-handoff-packet-copy-to-agent-dogfood-v0-1`

URL: `http://127.0.0.1:3000`

Temp DB: `/tmp/augnes-handoff-packet-copy-to-agent-dogfood.db`

Server command:

- `env -u OPENAI_API_KEY -u GITHUB_TOKEN AUGNES_DB_PATH=/tmp/augnes-handoff-packet-copy-to-agent-dogfood.db npm run dev -- --hostname 127.0.0.1 --port 3000`

## Setup Commands

- `AUGNES_DB_PATH=/tmp/augnes-handoff-packet-copy-to-agent-dogfood.db npm run db:reset`
- `AUGNES_DB_PATH=/tmp/augnes-handoff-packet-copy-to-agent-dogfood.db npm run db:migrate`
- `AUGNES_DB_PATH=/tmp/augnes-handoff-packet-copy-to-agent-dogfood.db npm run demo:seed`

## Observed Flows

PASS:

- Perspective opens as the default Cockpit tab.
- Perspective Observatory and Current Perspective Starmap are visible.
- Current formation loads as `Whole Constellation · basis current · source sample:chatgpt`.
- `Preview Handoff Packet` remains details-gated before opening.
- `Open Handoff Packet` opens the details disclosure.
- ChatGPT/Codex target toggle works.
- Textarea contains stable packet text and remains local/read-only.
- Copy buttons copied packet text to the local clipboard. The first Whole Constellation / ChatGPT copy read was rechecked and then matched the textarea.

Inspected flows:

- Whole Constellation / ChatGPT Review
- Whole Constellation / Codex Handoff
- Manual Selection / ChatGPT Review
- Manual Selection / Codex Handoff
- Cluster / ChatGPT Review
- Cluster / Codex Handoff

## Packet Detail Visibility

PASS:

- Handoff packet textarea exists while closed but is not visible until the details disclosure opens.
- After opening, textarea is visible and contains the selected target packet.
- No new always-visible packet panel appeared.
- No new boundary wall appeared.

## Packet Behavior

PASS:

- Stable section order is present.
- Evidence / Tensions / Next Actions remain separate.
- Compact Authority appears once.
- ChatGPT Review Purpose and Suggested Use are review/critique/next-prompt oriented.
- Codex Handoff Purpose and Suggested Use are user-reviewed PR-task-context oriented.
- Manual Selection packet showed `Scope: Manual Selection` and `Selected title: User intent`.
- Cluster packet showed `Scope: Cluster` and `Selected title: Fixture ingest preview`.

## Console Warnings/Errors

PASS:

- Desktop: no browser warnings or errors.
- Mobile: no browser warnings or errors.

## Mobile 390px Check

Viewport observed: 375px CSS viewport under a 390px browser override.

PASS:

- Perspective remains default.
- Current Perspective Starmap remains visible.
- Preview Handoff Packet remains details-gated before opening.
- Open Handoff Packet remains enabled.
- Packet textarea is visible after opening.
- Stable section headers remain present.
- Compact Authority appears once.
- No horizontal page overflow.

## Traffic Summary

Server logs showed local app/read GETs only, including:

- `GET /`
- `GET /api/augnes/read/constellation-preview?scope=project:augnes`
- `GET /api/augnes/read/perspective-ingest-constellation-preview?scope=project:augnes&source=sample%3Achatgpt`
- local Augnes read/state summary routes such as `/api/perspective/snapshot`, `/api/state/brief`, `/api/work`, `/api/events`, and `/api/work/AG-001/brief`

No external provider, GitHub, Codex, OpenAI, or API-billing traffic was observed.

## Skipped Browser Checks

None.
