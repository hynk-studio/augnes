# Perspective Constellation Manual Gravity Closeout v0.1

## 1. Date and Context

Date: 2026-06-07 KST

Scope: PR #413 through PR #431

Repo: `hynk-studio/augnes`

Cycle: Perspective Constellation + Manual Gravity preview-local MVP

This closeout summarizes the first major Perspective Constellation UI/UX cycle
and the Manual Gravity preview-local loop that landed across PR #413 through
PR #431. It is documentation/report-only. It does not add product UI, change
runtime behavior, add API routes, add persistence, or grant new authority.

## 2. Purpose

This cycle moved Cockpit from a document-heavy surface toward a Perspective
Constellation observatory/workspace:

- a central constellation workspace became the first Perspective surface
- selected graph material became a `PerspectiveUnitPreview`
- `FormationReceiptV0` made formation identity and authority readable
- Time Axis / Event Rail cards made past, present, and future surfaces legible
- Manual Gravity preview marks gave the user local salience controls
- Manual Gravity local draft metadata made save, restore, and overwrite states
  explicit without server persistence

The goal was not to automate execution. The goal was to make the current
Perspective readable, selectable, locally markable, and handoff-friendly while
preserving strict preview-only authority.

## 3. Completed PR Sequence

### PR #413: Add first Perspective Constellation workspace interaction flow

- Perspective became the first workspace surface.
- Added node, cluster, and manual selection with scoped Inspector/Handoff.

### PR #414: Add local Perspective Unit preview builder with formation receipt

- Added `PerspectiveUnitPreview` and `FormationReceiptV0` builder.
- Kept Lens and Formation Basis separate.

### PR #415: Add persistent Perspective Constellation summary overlay

- Surfaced formation identity, source, status, and authority.
- Made the current formation readable without opening a drawer first.

### PR #416: Add Formation Substrate details panel

- Filled the Formation / Archive drawer with receipt, source refs, authority
  flags, node/edge attributions, evidence, tensions, and next candidates.

### PR #417: Add Event Rail archive entry cards

- Added Past / Present / Future temporal entry cards.
- Kept archive and future material readable as context rather than action.

### PR #418: Add Formation Basis explanation overlay

- Explained Current, Manual Selection, Historical Snapshot, Auto Proposal, and
  Experimental.
- Kept Compare as a future view mode rather than an applied basis behavior.

### PR #419: Add Formation Basis switch preview flow

- Added selected basis candidate preview.
- Did not add actual basis switching.

### PR #420: Add Snapshot Archive Card v0 preview

- Strengthened the Past / Archive side of the workspace.
- Did not add snapshot persistence or delta view.

### PR #421: Add Manual Gravity preview marks

- Added Pin Preview, Watch Preview, Defer Preview, and Boost Preview marks.
- Marks applied to selected node, cluster, or manual selection context.

### PR #422: Reflect Manual Gravity marks in preview receipt

- Reflected marks as UI-only preview override information in the Formation /
  Archive drawer.
- Did not write marks into stored `FormationReceiptV0` authority.

### PR #423: Add Manual Gravity local draft persistence

- Added safe browser-local metadata-only draft persistence.
- Used exact key:
  `augnes:perspective-constellation:manual-gravity-draft:v0.1`

### PR #424: Add Manual Gravity local draft receipt badge

- Made saved, restored, no-match, and unavailable local draft states legible.

### PR #425: Add Manual Gravity apply preview flow

- Added explicit Apply Gravity Preview / Reset Gravity Preview.
- Added graph-node visual emphasis for applied local marks.

### PR #426: Add Manual Gravity applied preview legend

- Added P/W/D/B legend.
- Added active-target mixed-mark conflict notices.

### PR #427: Add Manual Gravity local draft restore notice

- Explained no-match, mismatch, malformed, unavailable, and missing-target
  restore states.

### PR #428: Add Manual Gravity draft overwrite confirmation

- Added explicit Replace Local Draft / Cancel confirmation before overwriting
  existing browser-local draft metadata.

### PR #429: Add Manual Gravity global conflict summary

- Added graph-wide applied targets, applied nodes, marks, and conflict summary.

### PR #430: Add Manual Gravity resolution proposal cards

- Added advisory-only proposal cards for Boost + Defer, Pin + Defer,
  Pin + Boost, and Watch + Defer.

### PR #431: Extract Manual Gravity preview helpers

- Moved Manual Gravity types, helpers, storage, conflict, proposal, and restore
  logic into `lib/perspective-ingest/manual-gravity-preview.ts`.
- Reduced `components/augnes-cockpit.tsx` component weight.

## 4. Current User-Facing Behavior

The completed preview-local flow is:

- Cockpit opens on Perspective.
- The user sees the Constellation workspace first.
- The user can select a node, cluster, or manual selection.
- Inspector/Handoff updates through `PerspectiveUnitPreview`.
- Summary overlay shows formation identity.
- Formation / Archive drawer shows substrate details.
- Event Rail shows temporal entry cards.
- The user can apply Manual Gravity marks:
  - Pin Preview
  - Watch Preview
  - Defer Preview
  - Boost Preview
- The user can save browser-local draft metadata.
- The user can see local draft badge, restore notice, and overwrite
  confirmation.
- The user can explicitly apply Gravity Preview.
- The graph shows local visual emphasis for applied marks.
- Legend, conflict notice, global summary, and resolution proposal cards
  explain the applied state.

This is enough for local preview, inspection, and dogfood. It is not a durable
state system and not an execution surface.

## 5. Boundaries and Non-Authoritative Rules

Manual Gravity marks are local preview marks.

Browser-local draft data is metadata only.

The localStorage key is exactly:

```text
augnes:perspective-constellation:manual-gravity-draft:v0.1
```

Stored metadata is limited to safe formation, source, target, mark, version,
and saved-at metadata. It does not store:

- pasted text
- source text
- graph data
- packet text
- prompts
- model outputs
- evidence content
- private history

Manual Gravity does not write:

- DB
- graph DB
- `FormationReceiptV0`
- `FormationReceiptV0.preview_overrides`
- source graph data
- proof/evidence/readiness

Manual Gravity does not call:

- external providers
- OpenAI
- GitHub
- Codex

Still not implemented:

- Rulecraft
- Auto Proposal execution
- snapshot persistence
- delta view
- basis switching apply flow

Manual Gravity resolution proposals are advisory only. They do not apply,
accept, resolve, mutate, persist, or create authority.

## 6. Validation and Dogfood Summary

The cycle was repeatedly validated with these commands:

```text
npm run typecheck
npm run smoke:perspective-ingest-local-pasted-text-preview
npm run smoke:perspective-ingest-constellation-preview
npm run smoke:cockpit-perspective-ia
npm run smoke:perspective-capsule-contract
npm run smoke:cockpit-perspective-evidence-handoff-snapshot
npm run smoke:cockpit-operator-handoff-snapshot-dogfood
AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-copyable-handoff-preview
git diff --check
```

Recurring browser sanity checks included:

- Perspective opens first.
- Manual Gravity mark, save, restore, overwrite, and apply flows work.
- Source switch clears stale state.
- `missing_input_text` fail-closed clears stale graph, marks, applied state, and
  proposal state.
- Valid pasted text recovers.
- 390px viewport has no page-level horizontal overflow.
- Browser console errors are absent.
- Unexpected external calls are absent; traffic stays on local app and local
  read-preview endpoints.

This closeout summarizes those repeated validation patterns. It does not claim
that every command was run after every PR in the chain.

## 7. Known Limitations

The following are intentionally still open:

- no server-side persistence
- no shared or cross-browser Manual Gravity state
- no actual Formation Basis switching
- no OK-skip acknowledgement flow for basis switching
- no historical frozen snapshot persistence
- no delta view
- no Auto Proposal execution
- no Rulecraft UI
- no real Codex or GitHub execution from constellation actions
- Manual Gravity resolution proposals are advisory only
- Applied Gravity Preview is temporary and local
- browser-local draft is one local key, not project-wide durable state

These are product and authority boundaries, not omissions to patch casually.

## 8. Next Major Cycle Candidates

Possible next major cycles, without choosing one here:

- Actual Formation Basis Switching Preview
- Snapshot persistence / Historical Snapshot / Delta View
- Event Spine feedback ingestion
- Auto Proposal preview-only contract
- Server-side Manual Gravity / shared perspective persistence
- Codex/GitHub execution handoff authority surfaces
- Manual Gravity resolution apply preview flow
- Applied gravity mini-map / graph styling polish

Each candidate should start with its own scope, authority boundary, validation
bundle, and explicit non-goals. The next cycle should not smuggle persistence,
execution, proof, or provider authority through UI affordances.

## 9. Closeout Conclusion

The first Perspective Constellation + Manual Gravity preview-local MVP is
complete enough to pause feature accretion.

The current product surface can be dogfooded and stress-tested as a local
observatory/workspace:

- readable formation identity
- scoped selected material
- local salience marks
- metadata-only local draft loop
- explicit apply/reset preview
- applied legend, conflict summary, and advisory proposals
- preserved no-write/no-execution authority boundary

The next responsible move is dogfood/stress reporting or deliberate next-cycle
planning, not more unbounded feature accretion in the same surface.
