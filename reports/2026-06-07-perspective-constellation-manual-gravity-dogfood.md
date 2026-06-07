# Perspective Constellation Manual Gravity Dogfood Report

## Date / Environment

- Date: 2026-06-07 KST
- Branch tested: `codex/perspective-constellation-manual-gravity-dogfood-report-v0-1`
- Commit tested: `520b225`
- Local path: `/Users/hynk/Documents/augnes`
- Temp DB path: `/tmp/augnes-perspective-constellation-manual-gravity-dogfood.db`
- Browser/tooling used: Codex in-app Browser with Browser Playwright runtime, plus dev-server logs
- Dev server URL: `http://localhost:3000`
- Dev server command: `env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-perspective-constellation-manual-gravity-dogfood.db npm run dev -- --port 3000`

## Scope

This dogfood pass validates the merged PR #413 through PR #432 Perspective Constellation and Manual Gravity preview-local MVP cycle. The pass covered Perspective as the default Cockpit workspace, Constellation workspace, Lens / Scope controls, Inspector / Handoff, PerspectiveUnitPreview, FormationReceiptV0, summary overlay, Formation / Archive substrate, Event Rail temporal cards, Formation Basis explanation and candidate preview, Snapshot Archive Card v0 preview, Manual Gravity marks, preview overrides, browser-local draft metadata, overwrite and restore states, Apply Gravity Preview, applied legend, active-target and global conflict notices, advisory resolution proposal cards, and local pasted-text recovery.

No product UI, feature behavior, API route, schema, DB write, graph DB behavior, external provider call, Codex execution, proof/evidence/readiness write, plugin/MCP/App behavior, Rulecraft, Auto Proposal execution, snapshot persistence, delta view, FormationReceiptV0 behavior, or PerspectiveUnitPreview behavior was changed in this PR.

## Commands Run

| Command | Result | Notes |
| --- | --- | --- |
| `AUGNES_DB_PATH=/tmp/augnes-perspective-constellation-manual-gravity-dogfood.db npm run db:reset` | Pass | Reset isolated SQLite DB. |
| `AUGNES_DB_PATH=/tmp/augnes-perspective-constellation-manual-gravity-dogfood.db npm run db:migrate` | Pass | Existing schemas current. |
| `AUGNES_DB_PATH=/tmp/augnes-perspective-constellation-manual-gravity-dogfood.db npm run demo:seed` | Pass | Seeded demo temporal state. |
| `npm run typecheck` | Pass | `tsc --noEmit`. |
| `npm run smoke:perspective-ingest-local-pasted-text-preview` | Pass | Static fail-closed and local pasted preview coverage. |
| `npm run smoke:perspective-ingest-constellation-preview` | Pass | Manual Gravity/local draft/static boundary coverage. |
| `npm run smoke:cockpit-perspective-ia` | Pass | Cockpit IA and boundary checks. |
| `npm run smoke:perspective-capsule-contract` | Pass | Contract boundary checks. |
| `npm run smoke:cockpit-perspective-evidence-handoff-snapshot` | Pass | No provider, mutation, or evidence write calls. |
| `npm run smoke:cockpit-operator-handoff-snapshot-dogfood` | Pass | Operator handoff snapshot dogfood checks. |
| `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-copyable-handoff-preview` | Pass | Copyable handoff content-only boundary check. |
| `git diff --check` | Pass | No whitespace errors before report authoring. |

Post-report validation also passed:

- `npm run typecheck`
- `npm run smoke:perspective-ingest-constellation-preview`
- `npm run smoke:perspective-ingest-local-pasted-text-preview`
- `git diff --check`

## Browser Dogfood Matrix

| Area | Scenario | Result | Notes |
| --- | --- | --- | --- |
| First-load workspace | Fresh open of Cockpit at `/` | Pass | Perspective tab was active by default; Constellation workspace, summary overlay, Formation/Archive material, Event Rail, and Inspector/Handoff were visible. |
| Base source | Default source and scope | Pass | Source loaded as `sample:chatgpt`, lens and scope were Whole Constellation, Formation Basis was `current`, and Manual Gravity had zero marks. |
| Node selection | Select central graph node | Pass | Scoped central graph click moved selection to Connected Node; Inspector, target, summary, and scoped packets updated without navigation or mutation. |
| Cluster flow | Preview Perspective Unit | Pass | Scope moved to Cluster; Manual Gravity target became the cluster; packet previews remained scoped. |
| Manual selection | Mark as Next Candidate Preview | Pass | Scope moved to Manual Selection; no persistence, graph source mutation, navigation, or external call was observed. |
| Basic marks | Pin, Watch, Defer, Boost on a connected node | Pass | Chips appeared, preview overrides count updated, and authority copy stayed unchanged. |
| Apply/reset | Apply, reset, re-apply | Pass | Applied legend appeared with P/W/D/B copy; applied nodes count was plausible; reset removed applied styling while preserving marks; re-apply worked. |
| Active-target conflicts | Boost+Defer, Pin+Defer, Pin+Boost, Watch+Defer | Pass | Each combination showed a relevant conflict notice on apply; marks stayed pressed; no automatic removal or resolution occurred. |
| Global conflict summary | Node plus cluster marks | Pass | Applied targets 2, applied nodes 7, total marks 6, mixed conflicts 2; rows included target, scope, marks, and notices. |
| Resolution proposals | Mixed marks applied | Pass | Advisory proposal cards appeared for Boost+Defer, Pin+Defer, Pin+Boost, and Watch+Defer. No Apply/Accept/Resolve/Commit/Save resolution buttons were present. |
| Local draft save/restore | Save, reload, reselect cluster, explicit apply | Pass | Draft saved for formation; reload did not auto-apply; matching cluster restored marks from browser metadata; Apply Gravity Preview still required explicit click. |
| Overwrite | Save changed marks, Cancel, Replace | Pass | Overwrite confirmation showed existing/new safe metadata. Cancel preserved old draft; Replace saved the changed draft, which restored after reload. |
| Source switch | ChatGPT draft, switch to Codex, switch back | Pass | Proper radio plus `Load preview` switch cleared marks and showed no matching draft for Codex; switching back to ChatGPT restored only after matching cluster selection. |
| Empty pasted text | Clear pasted text and preview | Pass | Fail-closed `missing_input_text`; 0 nodes / 0 edges; no stale graph, marks, applied state, global summary, or proposal cards. |
| Valid pasted text | Submit small safe local sample | Pass | `manual:pasted_text` loaded, graph returned, Manual Gravity was clean/no matching, and no stale sample-source state carried over. |
| Event Rail | Session, Decision, Closeout, Current View, Next Perspective | Pass | Archive cards stayed read-only; Snapshot Archive Card v0 stayed preview-only; Current View and Future Candidate cards worked; no snapshot persistence or delta view. |
| Formation Basis | Current, Manual Selection, Historical Snapshot, Auto Proposal, Experimental | Pass | Candidate preview changed explanatory copy only; active receipt basis stayed `current`; Compare remained future view mode; no Auto Proposal execution; Rulecraft stayed unexposed. |
| Handoff packets | Switch ChatGPT/Codex target and copy | Pass | Packets stayed selection-scoped; clipboard copy worked locally; URL did not change; boundary copy preserved no Codex/GitHub/state mutation. |
| Keyboard/focus | Tab traversal, Enter/Space activation | Partial | Enter and Space activated packet target buttons without navigation or external mutation. Tab traversal via Browser CUA did not advance reliably, so tab-order is inconclusive. |
| Responsive/overflow | 1280px, 768px, 390px | Pass | No page-level horizontal overflow. Summary overlay, Manual Gravity panel, Formation/Archive grid, Event Rail, and graph stayed contained at 390px. |
| Network/console | Browser console and server log audit | Pass | Browser console had no warnings/errors. Server log showed expected local GETs and one expected local pasted-text POST; no PATCH/PUT/DELETE or provider/GitHub/OpenAI calls. |
| Repeated stress | Fast select/toggle/apply/reset/source/basis/event loop | Pass | No crash, stuck pending state, stale applied preview, or console warning; final state returned to Whole Constellation with zero marks. |

## Findings

### Pass

- The core Constellation loop works end to end across whole-graph, node, cluster, manual selection, sample-source switch, and valid manual pasted-text source.
- Manual Gravity remains local, advisory, and non-authoritative. Apply/reset/proposal states repeatedly preserved no source graph change, no FormationReceiptV0 authority change, no persistence, and no graph DB write copy.
- Browser-local draft UX works through save, restore, overwrite cancel, overwrite replace, source mismatch, and explicit re-apply requirements.
- Empty pasted text fails closed with `missing_input_text` and does not leave stale graph or Manual Gravity state visible.
- Event Rail, Snapshot Archive Card v0, Formation Basis explanation, and packet handoff surfaces stayed read-only and preview/copy-only.

### Non-blocking Observations

- Raw localStorage inspection was not available through the Codex in-app Browser read-only page-evaluation sandbox: `window.localStorage` and resource timing were exposed as unavailable there. UI-level local draft behavior and static smoke/code inspection were used instead.
- A stale browser-local draft from prior browser use was present at the start of exploration and restored when the matching cluster was selected. It was cleared through the UI before the official clean pass. This reinforces the known single-key localStorage limitation.
- Tab traversal automation was unreliable in the Browser runtime and kept focus on the same copy button. Enter/Space activation on packet target controls was verified; broader tab-order should be checked manually if accessibility focus order becomes a release gate.

### Blockers

No blockers found.

## LocalStorage Inspection

Raw localStorage payload inspection was not possible with the available browser tooling because the in-app Browser read-only page-evaluation sandbox exposed `window.localStorage` as unavailable. The UI did display the exact key and safe metadata receipt, and static code/smoke inspection confirms the allowed key and shape.

Exact key:

```text
augnes:perspective-constellation:manual-gravity-draft:v0.1
```

Allowed stored payload shape, from `lib/perspective-ingest/manual-gravity-preview.ts` and smoke coverage:

- `version`
- `formation_id`
- `constellation_id`
- `source_query`
- `generated_at`
- `as_of`
- `marks_by_target`
- `saved_at`

The UI safe metadata showed `source_query`, `saved_at`, mark count, and target count. The UI boundary copy says no pasted text, source text, graph data, packet text, prompts, model outputs, evidence content, or private history are stored.

## Network / Console Audit

- Browser console warnings/errors: none observed.
- Browser Performance resource timing: unavailable in the Browser sandbox.
- Dev server log observed local expected requests only:
  - `GET /`
  - `GET /api/augnes/read/constellation-preview?scope=project:augnes`
  - `GET /api/augnes/read/perspective-ingest-constellation-preview?scope=project:augnes&source=sample%3Achatgpt`
  - `GET /api/augnes/read/perspective-ingest-constellation-preview?scope=project:augnes&source=sample%3Acodex`
  - expected local Cockpit read GETs for perspective snapshot, state, work, events, mailbox/publication summaries, approval gate, proposals, and work brief
  - one expected `POST /api/augnes/read/perspective-ingest-local-preview?scope=project:augnes` for valid manual pasted text
- No unexpected PATCH, PUT, DELETE, external URL, OpenAI, GitHub, provider, Codex execution, proof/evidence write, or graph DB write was observed.
- Empty pasted text failed closed client-side in the observed log window; only the later valid pasted-text preview produced the expected local POST.

## Responsive / Overflow

- Desktop 1280px: no page-level horizontal overflow.
- Tablet-ish 768px: no page-level horizontal overflow.
- Mobile 390px: `document.documentElement.scrollWidth` equaled `clientWidth`; no page-level horizontal overflow.
- At 390px, the summary overlay, Manual Gravity panel, Formation/Archive grid, Event Rail, and central graph stayed within viewport bounds and wrapped/stacked rather than overflowing.

## Risk Notes

- Cockpit complexity remains high despite Manual Gravity helper extraction.
- Local draft persistence uses a single browser-local key, so stale local browser state can affect repeat dogfood unless cleared.
- Manual Gravity remains browser-local and non-authoritative by design.
- Actual server persistence is not implemented.
- Actual basis switching is not implemented.
- Snapshot/delta behavior is not implemented.

## Recommendation

Merge with non-blocking notes. The cycle dogfood passed with no blockers, no product behavior changes, and clear limitations documented for raw localStorage inspection and automated tab traversal.

## Next Step

Proceed to next major-cycle planning. If accessibility focus order becomes a release criterion, run a dedicated manual or Chrome-based keyboard pass as a targeted follow-up.
