# PerspectiveSnapshot v0.1

PerspectiveSnapshot v0.1 is a derived-view-only read model over existing
Augnes Core records. It summarizes committed state, pending proposal pressure,
evidence/work/action traces, open tensions, recent agent activity, current
frame, boundary next steps, missing context, and provider-neutral authority
boundaries.

It is not source of truth. Augnes Core remains the source of truth for committed
state, pending proposal commit/reject, publication gates, mailbox state,
evidence records, work records, delivery records, and temporal review artifacts.

PerspectiveSnapshot generation must not approve, publish, retry, commit/reject,
record proof, create evidence, update work, mutate mailbox, mutate publication
state, call GitHub/OpenAI, or write temporal preview review artifacts. The
`/api/perspective/snapshot` route is read-only and returns the model without
changing existing route behavior.

`research_diagnostics` is `log_only` and non-authoritative in v0.1.
`sidecar_e_t`, `meta_wm_hint`, `bsl_hint`, and `comp_index_hint` are structured
placeholders.
`loopness_hint` is the only bounded `log_only` diagnostic object.

The following table is a documentation summary only, not schema authority.

| Diagnostic slot | Status | Computed? | Authority? | Notes |
| --- | --- | --- | --- | --- |
| `loopness_hint` | bounded `log_only` diagnostic object | yes, bounded trace-pressure only | no | Weak trace-pressure hint from already-read action/work/proposal/tension refs. |
| `sidecar_e_t` | structured placeholder | no | no | Not actual Sidecar state, not QP output, not `z_t` regime commit. |
| `meta_wm_hint` | structured placeholder | no | no | Reserved for future working-memory reliability diagnostics. |
| `bsl_hint` | structured placeholder | no | no | Reserved for future Behavioral State Layer diagnostics. |
| `comp_index_hint` | structured placeholder | no | no | Reserved for future compressibility diagnostics. |

None of these diagnostics are authority, proof, readiness, source of truth,
Gate/SRF input, Claim confidence, Evidence status, publication readiness,
proposal scoring, commit/reject input, or Cockpit action input.

`sidecar_e_t` shape:

- `version`: `sidecar_e_t.placeholder.v0.1`
- `mode`: `log_only`
- `status`: `placeholder`
- `computed`: `false`
- `values`: `e_t_register`, `qp_observability_proxy`,
  `z_t_regime_hint`, `sidecar_state_summary`, and `sidecar_e_t_hat`, all
  `null`
- `source_refs`: empty array
- `notes`: explicit future-diagnostic, non-authority, no-Sidecar-loop,
  no-z_t-commit, no-QP-output, and not-actual-Sidecar-state boundaries

`sidecar_e_t` is reserved for future Sidecar diagnostics. The placeholder is
not computed, has no authority, and is not actual Sidecar state. It does not
run a Sidecar loop, update or commit `z_t`, create QP output, or commit any
regime/state. It must not affect commit/reject, proposal scoring, Gate/SRF,
Claim confidence, Evidence status, publication readiness, Cockpit actions, or
any Core state.

`docs/SIDECAR_ET_DIAGNOSTIC_DESIGN_V0_1.md` is the design-only, non-SSOT
future diagnostic path. It does not change this placeholder, compute Sidecar
values, create QP output, commit `z_t`, or add runtime behavior.
`docs/SIDECAR_ET_OFFLINE_FIXTURE_DESIGN_V0_1.md` defines deterministic
fixture-design-only cases for the next gate and also does not compute values.
`docs/SIDECAR_ET_OFFLINE_HELPER_DESIGN_V0_1.md` defines a future
helper-design-only boundary for deterministic offline diagnostics and also does
not implement computation.
`docs/SIDECAR_ET_OFFLINE_COMPUTATION_DESIGN_V0_1.md` defines a future
computation-design-only boundary for offline deterministic fixture computation
and also does not implement computation or change response shape.
`docs/SIDECAR_ET_RUNTIME_LOG_ONLY_DESIGN_V0_1.md` defines a future
runtime-log-only design boundary and also does not implement runtime
computation or change response shape.

`meta_wm_hint` shape:

- `version`: `meta_wm_hint.placeholder.v0.1`
- `mode`: `log_only`
- `status`: `placeholder`
- `computed`: `false`
- `values`: `wm_strength_hat`, `wm_uncertainty_hat`, `history_bias_hat`,
  `arousal_proxy`, and `meta_wm_hat`, all `null`
- `source_refs`: empty array
- `notes`: explicit future-diagnostic and non-authority boundaries

`meta_wm_hint` is reserved for future working-memory reliability diagnostics.
The placeholder is not computed and has no authority. It must not affect
commit/reject, proposal scoring, Gate/SRF, Claim confidence, Evidence status,
publication readiness, Cockpit actions, or any Core state.

`bsl_hint` shape:

- `version`: `bsl_hint.placeholder.v0.1`
- `mode`: `log_only`
- `status`: `placeholder`
- `computed`: `false`
- `values`: `behavioral_state_label`, `baseline_stability_hat`,
  `drift_pressure_hat`, `phase_lock_hat`, and `bsl_hat`, all `null`
- `source_refs`: empty array
- `notes`: explicit future-diagnostic and non-authority boundaries

`bsl_hint` is reserved for future Behavioral State Layer diagnostics. The
placeholder is not computed and has no authority. It must not affect
commit/reject, proposal scoring, Gate/SRF, Claim confidence, Evidence status,
publication readiness, Cockpit actions, or any Core state.

`comp_index_hint` shape:

- `version`: `comp_index_hint.placeholder.v0.1`
- `mode`: `log_only`
- `status`: `placeholder`
- `computed`: `false`
- `values`: `compression_index_hat`, `context_density_hat`,
  `evidence_support_hat`, `tension_load_hat`, and `comp_index_hat`, all `null`
- `source_refs`: empty array
- `notes`: explicit future-diagnostic and non-authority boundaries

`comp_index_hint` is reserved for future compressibility diagnostics. The
placeholder is not computed and has no authority. It must not affect
commit/reject, proposal scoring, Gate/SRF, Claim confidence, Evidence status,
publication readiness, Cockpit actions, or any Core state.

`loopness_hint` is the only bounded `log_only` diagnostic object:

- `version`: `loopness_hint.v0.1`
- `mode`: `log_only`
- `score`: bounded number from `0` to `1`
- `level`: `none`, `low`, `medium`, or `high`
- `signals`: repeated action state-key count, repeated work-event actor count,
  pending proposal count, and open tension count
- `source_refs`: action record, work event, pending proposal, and tension ids
- `notes`: explicit non-authority boundaries

`loopness_hint` is a weak trace-pressure hint only. It is not authority, proof,
readiness, Gate/SRF input, Claim confidence, Evidence status, publication
readiness, proposal scoring, commit/reject input, Cockpit action input, or
source of truth.
Snapshot generation does not query external services or write Core records.

## Quality smoke

`npm run smoke:execution-lanes` verifies the provider-neutral execution lane
registry that PerspectiveSnapshot reports as authority boundaries.

`npm run smoke:authority-invariants` verifies that route/helper behavior does
not grant non-core lanes commit/reject authority.

`npm run smoke:perspective-snapshot` verifies the v0.1 derived read model,
including committed-state basis, pending proposal pressure, source refs,
authority boundaries, and `research_diagnostics` non-authority copy.

`npm run smoke:cockpit-perspective-snapshot` verifies Cockpit
PerspectiveSnapshot wiring. Cockpit reads the snapshot through the existing GET
route and must not add snapshot POSTs, write controls, action inputs, or new
authority.

`npm run smoke:perspective-quality` statically checks the v0.1 read model,
route, Cockpit rendering, and authority docs for bounded, derived-view-only,
source-ref-oriented behavior. It verifies `loopness_hint` remains log-only and
unchanged, verifies `sidecar_e_t`, `meta_wm_hint`, `bsl_hint`, and
`comp_index_hint` remain non-computed placeholders, and does not compute
Sidecar, Meta-WM, BSL, or CompIndex values.

`npm run smoke:research-diagnostics-boundaries` uses temp DB fixtures to verify
`loopness_hint`, `sidecar_e_t`, `meta_wm_hint`, `bsl_hint`, and
`comp_index_hint` boundaries at runtime. It verifies `sidecar_e_t` remains a
structured placeholder with null values, `computed=false`, empty source refs,
and no authority. It verifies clean fixtures keep `loopness_hint` at
`level=none` and repeated trace-pressure fixtures produce a bounded non-`none`
`loopness_hint` without mutating Core records. It does not compute
Sidecar/BSL/CompIndex or real Meta-WM values, run a Sidecar loop, update or
commit `z_t`, create QP output, grant authority, or mutate Core records.

`npm run smoke:sidecar-et-fixture-boundaries` encodes the Sidecar e_t offline
fixture-design categories as a smoke skeleton. It checks clean/minimal,
repeated/noisy, missing-context, conflicting-context, invalid-input, and
source-ref boundary scopes for placeholder fallback and authority boundaries
only; it does not compute Sidecar/e_t/QP/z_t values or change
`PerspectiveSnapshot` shape.

`docs/SIDECAR_ET_OFFLINE_HELPER_DESIGN_V0_1.md` is the non-runtime helper
design gate that follows the fixture smoke skeleton. It describes allowed
inputs, the already-read ref read-set, fallback rules, and future smoke
requirements without changing runtime behavior or response shape.
`lib/perspective/sidecar-et-offline-helper.ts` is a non-runtime helper
skeleton that returns placeholder fallback only; it is not wired into
`PerspectiveSnapshot` generation.
`docs/SIDECAR_ET_OFFLINE_COMPUTATION_DESIGN_V0_1.md` is the
computation-design-only gate after the helper skeleton and validation
hardening. It keeps future computation fixture-only first and does not permit
runtime routes, Cockpit action paths, external calls, persistence writes,
evidence/proof creation, `z_t` commit, or QP output treated as evidence.
`docs/SIDECAR_ET_RUNTIME_LOG_ONLY_DESIGN_V0_1.md` is the runtime-log-only
design gate after fixture-only output review. Runtime `sidecar_e_t` remains
the structured placeholder until a separate implementation PR updates smokes
and proves already-read refs only, no authority mutation, no external calls,
no evidence/proof creation, no `z_t` commit, and no QP evidence.

Cockpit may collapse dense PerspectiveSnapshot basis, authority lane, and
diagnostic source-ref details by default to reduce visual density. The collapsed
UI remains a derived read model and does not change snapshot generation, route
behavior, diagnostic computation, or authority boundaries.

Provider names such as ChatGPT, Codex, GitHub, Browser, MCP, and OpenAI are
examples of lane occupants only. The canonical semantics come from the
provider-neutral execution lane registry.
