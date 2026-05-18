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

`research_diagnostics` is placeholder-only in v0.1. Its mode is `log_only`, and
`sidecar_e_t`, `meta_wm_hint`, `bsl_hint`, `loopness_hint`, and
`comp_index_hint` are `null`. These fields reserve future diagnostic slots; they
are not authority, proof, readiness, or source of truth until separately scoped
and gated by later PRs.

Provider names such as ChatGPT, Codex, GitHub, Browser, MCP, and OpenAI are
examples of lane occupants only. The canonical semantics come from the
provider-neutral execution lane registry.
