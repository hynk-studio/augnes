# Blank State Review Entry Absorption v0.1

## Status And Purpose

Status: PR 2 implementation for Legacy Cockpit decomposition.

This implementation moves the seven human-facing high-level Legacy Cockpit
entry capabilities classified as `blank_state` into the native Blank State home
surface at `/`.

Blank State is the human-facing entry layer. Agent Workplane is the
AI/Codex/runner operational layer. `/cockpit` remains temporary retained
compatibility, not a long-term product surface.

This PR adds high-level entry, summary, and navigation only. It does not move
detailed proposal review, preview editing, local-write controls, or Cockpit
shell behavior into Blank State.

PR 3 follow-on: `docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md` implements the
native Workplane State Proposal Review lane that the Blank State review entries
can route toward for proposal, memory, Perspective, draft, stale/fallback, and
authority-boundary review.

## Implemented Entries

The native Blank State review entry grid renders exactly these seven entries:

| capability_id | label | target | behavior |
| --- | --- | --- | --- |
| `continue_current_work_entry` | Continue Current Work | `/workbench#work_queue` | Navigate to Workplane current work / work queue context. |
| `review_pending_proposals_entry` | Review Pending Proposals | `/workbench#review_queue` | Navigate to Workplane review queue and future State Proposal Review. |
| `choose_perspective_lens_entry` | Choose Perspective Lens | `/perspective` | Navigate to Perspective frame/lens review. |
| `prepare_codex_handoff_entry` | Prepare Codex Handoff | `/workbench#handoff_builder_preview` | Navigate to Workplane handoff preview context. |
| `review_runner_deltabatch_entry` | Review Runner DeltaBatch | `/workbench#runner_delta_batch` | Navigate to recovered runner DeltaBatch review context. |
| `automation_mode_entry` | Automation Mode | `/workbench#authority_boundary` | Show boundary state and navigate to Workplane authority context. |
| `user_judgment_summary_entry` | User Judgment Summary | `/workbench#review_queue` | Navigate to Workplane review queue and future user-judgment lane. |

Each entry renders with:

- `data-blank-state-entry-id`
- target label
- high-level source/fallback status
- one summary metric
- explicit authority note

## Data And Fallbacks

The entries are built from existing read-only sources:

- Current Working Perspective read model already used by Human Surface.
- Existing recovered runner DeltaBatch Workplane read helper.

If runtime data is unavailable, Blank State displays the existing fixture or
empty fallback source status instead of fabricating live counts. Runner
DeltaBatch entry displays the existing empty/fallback state from the read
helper when no ledger readback is available.

## Boundaries

This PR adds no:

- apply, approve, commit, reject, or durable state authority
- provider/OpenAI call
- GitHub actuation
- Codex execution
- runner execution, runner tick, runner recovery, or runner scheduling
- product DB write
- proof/evidence write
- durable memory apply
- Perspective apply
- delta auto-apply
- localStorage or sessionStorage write
- server action
- new route
- `/cockpit` deletion
- `components/augnes-cockpit.tsx` deletion

## Validation

`npm run smoke:blank-state-review-entry-absorption-v0-1` checks:

- package script pointer
- Human Surface wiring
- seven required `blank_state` capability IDs
- stable `data-blank-state-entry-id` marker
- Workplane/Perspective targets
- source/fallback and authority notes
- no mutation controls
- no product route, Cockpit route, Cockpit component, provider, GitHub, Codex,
  runner execution, DB, proof/evidence, memory, Perspective apply, or delta
  apply paths changed

The next implementation PR unlocked by this slice is Workplane State Proposal
Review v0.1.
