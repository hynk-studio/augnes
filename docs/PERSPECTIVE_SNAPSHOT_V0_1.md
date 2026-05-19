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

`research_diagnostics` is log-only in v0.1. `sidecar_e_t`, `meta_wm_hint`,
`bsl_hint`, and `comp_index_hint` are `null` placeholders. `loopness_hint` is
the first bounded diagnostic object:

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
does not compute Sidecar, Meta-WM, BSL, or CompIndex values.

Cockpit may collapse dense PerspectiveSnapshot basis, authority lane, and
diagnostic source-ref details by default to reduce visual density. The collapsed
UI remains a derived read model and does not change snapshot generation, route
behavior, diagnostic computation, or authority boundaries.

Provider names such as ChatGPT, Codex, GitHub, Browser, MCP, and OpenAI are
examples of lane occupants only. The canonical semantics come from the
provider-neutral execution lane registry.
