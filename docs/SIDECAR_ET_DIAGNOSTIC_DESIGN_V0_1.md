# Sidecar e_t Diagnostic Design v0.1

## Status

- Status: design-only.
- Authority: non-SSOT design note.
- Runtime behavior: none.
- Schema authority: none.
- Implementation authority: none.

This document describes a possible future path for a real
`research_diagnostics.sidecar_e_t` diagnostic. It does not implement Sidecar,
e_t, QP, or z_t computation. It does not change `PerspectiveSnapshot`, API
response shape, database schema, routes, Cockpit behavior, OpenAI behavior,
commit/reject behavior, GitHub publish behavior, or evidence/proof behavior.

## Current Baseline

`docs/PERSPECTIVE_SNAPSHOT_V0_1.md` defines the implemented baseline:

- `PerspectiveSnapshot` is derived-view-only.
- `research_diagnostics` remains `log_only` and non-authoritative.
- `loopness_hint` is the only bounded `log_only` diagnostic object.
- `sidecar_e_t` is a structured placeholder object.
- `sidecar_e_t` is not actual Sidecar state, not QP output, and not `z_t`
  regime commit.

The current placeholder keeps all Sidecar/e_t/QP/z_t values `null`,
`computed=false`, and `source_refs=[]`. It exists to reserve a diagnostic
view slot, not to report actual internal Sidecar state.

## Terminology Boundary

`docs/MODULE_SIDECAR_QP_ZT_SUMMARY.md` is the module-local Sidecar/QP/z_t
reference. This design note borrows those names only as future diagnostic
labels:

- `Sidecar e_t`: future diagnostic view over a possible e_t register summary,
  not the actual register.
- `QP`: future diagnostic view over a possible observability proxy, not
  evidence and not proof.
- `z_t`: future diagnostic view over a possible regime hint, not a regime
  commit.

Every future field in this document is Control/View only unless a later
governance document explicitly says otherwise.

## Non-Goals

This design does not allow:

- durable state mutation
- commit/reject influence
- proposal scoring influence
- Gate input
- SRF input
- Claim confidence influence
- Evidence status influence
- publication readiness influence
- Cockpit action input
- `z_t` regime commit
- QP output treated as evidence
- source-of-truth claims
- OpenAI, GitHub, or other external calls
- route additions
- action buttons
- database schema changes
- secrets, local DBs, screenshots, generated artifacts, or `.env` files

## Candidate Future Diagnostic Shape

No code changes are authorized by this section. A final shape must be
implemented in a separate PR and guarded by smoke tests.

A future computed `sidecar_e_t` diagnostic might use a shape like this:

```json
{
  "version": "sidecar_e_t.v0.1",
  "mode": "log_only",
  "status": "computed",
  "computed": true,
  "values": {
    "e_t_register_candidate_summary": {
      "available": true,
      "summary": "future bounded diagnostic text",
      "quality_caveat": "non-authoritative diagnostic view only"
    },
    "qp_observability_proxy_candidate_summary": {
      "available": true,
      "summary": "future bounded diagnostic text",
      "quality_caveat": "not evidence or proof"
    },
    "z_t_regime_hint_candidate_summary": {
      "available": true,
      "summary": "future bounded diagnostic text",
      "quality_caveat": "not a z_t regime commit"
    }
  },
  "source_refs": {
    "action_record_ids": [],
    "work_event_ids": [],
    "evidence_ids": [],
    "state_entry_ids": []
  },
  "confidence_caveat": "Diagnostic quality only; not authority, proof, readiness, proposal scoring, Gate/SRF input, Claim confidence, Evidence status, publication readiness, commit/reject input, or Cockpit action input.",
  "notes": []
}
```

The candidate summaries are intentionally text-oriented and bounded. They must
not expose hidden chain-of-thought, raw model internals, secrets, private keys,
raw tokens, or unreviewed local artifacts. Source refs must be already-read
refs from the existing derived read path; a future implementation must not add
external calls or new persistence just to populate this diagnostic.

## Promotion Gates

Progression must be explicit and separate:

1. Placeholder to fixture-only design:
   Write deterministic fixture definitions and review expected diagnostic
   boundaries without adding computation. The fixture-only gate is defined in
   `docs/SIDECAR_ET_OFFLINE_FIXTURE_DESIGN_V0_1.md`.
2. Fixture-only design to offline deterministic computation:
   Add a non-runtime helper that computes only against local deterministic
   fixtures. No routes, no Cockpit action inputs, no persistence writes. The
   helper-design gate is defined in
   `docs/SIDECAR_ET_OFFLINE_HELPER_DESIGN_V0_1.md`.
   The computation-design gate is defined in
   `docs/SIDECAR_ET_OFFLINE_COMPUTATION_DESIGN_V0_1.md`; it is design-only and
   does not implement computation.
3. Offline deterministic computation to `log_only` runtime computation:
   Add read-only runtime computation only after smoke tests prove no authority
   table mutation, no external calls, no proposal status changes, and no route
   or Cockpit action expansion.
4. `log_only` runtime computation to prior-only use:
   Only if separately approved by user/PM governance. Prior-only use still
   cannot become proof, readiness, Gate/SRF input, proposal scoring authority,
   commit/reject input, or publication readiness.
5. Authority:
   There is no path from this diagnostic to commit/reject or authority without
   explicit future governance, new docs, and new tests.

## Required Future Tests

Any future implementation PR must run and update, as needed:

- `npm run smoke:perspective-snapshot`
- `npm run smoke:perspective-quality`
- `npm run smoke:research-diagnostics-boundaries`

It must also add or extend fixture smoke coverage proving:

- no authority table mutation
- `fetch_calls=0`
- no OpenAI calls
- no GitHub calls
- no proposal status changes
- no state transition writes
- no Cockpit action buttons
- no `z_t` commit
- no QP output treated as evidence
- `source_refs` are already-read refs only
- invalid or missing input returns the structured placeholder or equivalent
  log-only fallback
- clean fixtures do not fabricate diagnostic pressure
- repeated or noisy fixtures remain bounded and non-authoritative

## Failure And Rollback Rules

- If output is missing, invalid, ambiguous, or unsupported, return the
  structured placeholder or an equivalent null-state design fallback.
- If any authority boundary fails, force the diagnostic off and return the
  `log_only` placeholder.
- If computation creates ambiguous meaning, do not promote it.
- If source refs cannot be proven already-read, do not emit computed values.
- If docs and smokes disagree, reconcile docs and smoke expectations before
  merge.
- If future runtime computation regresses route, Cockpit, commit/reject,
  proposal, evidence, publication, delivery, mailbox, temporal review artifact,
  OpenAI, or GitHub behavior, revert the computation and keep the placeholder.

## Relationship To Existing Docs

- `docs/MODULE_SIDECAR_QP_ZT_SUMMARY.md`: module-local Sidecar/QP/z_t reference.
  This design note does not override it and does not promote module-local
  concepts into runtime authority.
- `docs/PERSPECTIVE_SNAPSHOT_V0_1.md`: implemented `PerspectiveSnapshot` and
  `research_diagnostics` placeholder baseline.
- `docs/SIDECAR_ET_OFFLINE_FIXTURE_DESIGN_V0_1.md`: deterministic offline
  fixture categories and expected boundaries for the next promotion gate.
- `docs/SIDECAR_ET_OFFLINE_HELPER_DESIGN_V0_1.md`: future non-runtime helper
  boundary, allowed inputs, allowed read-set, fallback rules, and smoke
  requirements before helper implementation.
- `docs/SIDECAR_ET_OFFLINE_COMPUTATION_DESIGN_V0_1.md`: future offline
  deterministic computation boundary, candidate input/output limits,
  deterministic signal constraints, required implementation gates, and
  rollback rules. It does not implement computation or grant authority.
- `docs/AUTHORITY_MATRIX.md`: authority boundaries for provider-neutral lanes
  and Perspective diagnostics.
- `docs/VERIFICATION_EVIDENCE_PACK.md`: verification evidence and smoke
  reporting boundaries.

## Merge Criteria For A Future Implementation

A future implementation is not ready until it can show:

- deterministic fixtures reviewed before runtime computation
- exact source refs listed and already read by the existing snapshot path
- no new write authority
- no schema authority hidden in docs
- no route or Cockpit action expansion
- no external calls
- explicit rollback behavior
- passing smoke coverage for placeholder fallback and computed `log_only`
  diagnostics

Until those criteria are met, `sidecar_e_t` must remain a structured
placeholder in `PerspectiveSnapshot`.
