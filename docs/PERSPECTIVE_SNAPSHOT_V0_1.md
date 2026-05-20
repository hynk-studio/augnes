# PerspectiveSnapshot v0.1

PerspectiveSnapshot v0.1 is a derived read model over existing Augnes Core
records. It summarizes committed state, pending proposal pressure,
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

`research_diagnostics` is log-only in v0.1. `sidecar_e_t`, `bsl_hint`, and
`comp_index_hint` remain `null` placeholders. `meta_wm_hint` is a structured
null-state placeholder object:

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

`loopness_hint` is the first bounded diagnostic object:

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
readiness, commit/reject input, Cockpit action input, or source of truth.
Snapshot generation does not query external services or write Core records.

## Quality smoke

`npm run smoke:perspective-quality` statically checks the v0.1 read model,
route, Cockpit rendering, and authority docs for bounded, derived-view-only,
source-ref-oriented behavior. It verifies `loopness_hint` remains log-only and
unchanged, verifies `meta_wm_hint` remains a non-computed placeholder, and does
not compute Sidecar, Meta-WM, BSL, or CompIndex values.

`npm run smoke:research-diagnostics-boundaries` uses temp DB fixtures to verify
`loopness_hint` and `meta_wm_hint` boundaries at runtime. It does not compute
Sidecar/BSL/CompIndex or real Meta-WM values, grant authority, or mutate Core
records.

Cockpit may collapse dense PerspectiveSnapshot basis, authority lane, and
diagnostic source-ref details by default to reduce visual density. The collapsed
UI remains a derived read model and does not change snapshot generation, route
behavior, diagnostic computation, or authority boundaries.

Provider names such as ChatGPT, Codex, GitHub, Browser, MCP, and OpenAI are
examples of lane occupants only. The canonical semantics come from the
provider-neutral execution lane registry.
