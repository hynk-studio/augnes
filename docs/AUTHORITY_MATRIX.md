# Authority Matrix

Augnes is useful across ChatGPT, Codex, GitHub, Browser/Chrome, and MCP surfaces only when authority stays explicit. This matrix names who can observe, propose, record proof, and make durable decisions.

## Principles

- The user owns durable approval.
- Augnes Core owns committed state storage and the commit/reject gate implementation.
- Codex owns repo execution and verification.
- Codex helper command names follow
  `docs/CODEX_HELPER_COMMAND_TAXONOMY.md`: check-only helpers are read-only,
  record-proof helpers write proof records, and committed state mutation
  requires explicit naming and gates.
- The Codex proof-only action-record path is `/api/actions/record-proof`; it
  creates action proof without calling `commitStateUpdate` or creating
  `external.*` committed state markers.
- GitHub owns code history and PR review surfaces.
- ChatGPT App owns conversational interpretation and handoff, not execution control.
- Browser/Chrome and MCP Inspector are verification surfaces, not authorities.

## Surface Role Distinctions

- User decision surface: ChatGPT Apps should be the primary human-facing place
  to understand pending choices, approval implications, and external side
  effects. They may collect intent, but they do not own durable state,
  publication, proof, or commit/reject authority.
- Implementation control surface: Codex should show task scope, changed files,
  verification evidence, skipped checks, blockers, assumptions, and PR
  readiness. It can implement and open PRs, but it does not own durable
  approval, publication, proof, or merge authority.
- Observability surface: Cockpit should show event spine, mailbox, handoff,
  publication, delivery, proof, and gate state. It should not become hidden
  authority; any future write controls must be separately scoped and Core-gated.
- Cockpit MVP UI polish originally followed the historical
  `docs/COCKPIT_SIX_TAB_MVP_FUNCTIONAL_MAP.md` layout. The current top-level
  IA follows `docs/COCKPIT_PERSPECTIVE_IA_V0_1.md`: Overview, Work,
  Perspective, Bridge, and Operator. Ledger remains committed runtime state
  under Perspective as Ledger Basis, and Proof remains evidence/verification
  support under Perspective as Evidence. The IA naming change does not create
  new authority, backend behavior, token behavior, external execution, or
  GitHub mutation authority.
- Source-of-truth authority: Augnes Core remains the durable authority runtime
  for committed state, proof records, event spine, mailbox, publication drafts,
  delivery ledger, and gate validation.
- Approve/publish controls must route through Augnes Core and explicit user
  approval. The workflow is documented in
  `docs/AUGNES_CORE_GATED_APPROVE_PUBLISH_WORKFLOW.md`; C1-C5 now implement
  request records, gate-state rendering, approval grant routing, dry-run
  readiness, and the explicit Core-gated GitHub PR comment publish route. Retry
  and surface-control behavior still require future explicit PRs.
- Core approval request records may durably represent that approval is being
  requested for a specific publication target. They are not approval grants and
  do not change publication status, create delivery rows, publish, retry, record
  proof, update mailbox status, or commit/reject state.
- Core approval decision records may durably grant approval for one stored
  approval request target and transition the linked publication from `draft` to
  `approved`. Approval grant is still not publication: it does not dry-run,
  publish, retry, create delivery rows, record proof, update mailbox status,
  commit/reject state, execute Codex, invoke GitHub, use `GITHUB_TOKEN`, post to
  GitHub, or post to Discord.
- Core dry-run readiness records may durably capture readiness evidence for one
  approved decision and stored publication target. Dry-run readiness is still
  not publication: it does not publish, retry, create delivery rows, record
  proof, update mailbox status, commit/reject state, execute Codex, invoke
  GitHub, use `GITHUB_TOKEN`, post to GitHub, or post to Discord.
- Core-gated publish routing may validate one fresh readiness check and, only
  when `dry_run=false` plus explicit target approval fields and token
  availability are present, execute one GitHub PR comment publish path. PR #78
  implemented the C5 route without live posting; only `dry_run=true` preview
  and blocked checks were verified in that implementation PR, and `GITHUB_TOKEN`
  was not used. `dry_run=true` creates no delivery rows and has no external
  side effects. PR #81 separately executed one approved exact-target live C5
  publish to `Aurna-code/augnes#81`, with GitHub comment id `4414928332` and no
  manual GitHub UI posting, PR merge/review/label/title/body mutation, proof
  recording, mailbox update, or state mutation. PR #82 fixed same-key
  sent/acknowledged replay semantics so replay returns HTTP 200 with
  `idempotent_replay=true` and `posted=false`; different-key duplicates and
  pending delivery conflicts remain blocked. PR #67 and PR #81 remain
  target-specific historical evidence, not broad posting permission.
- GitHub token management v0.1 separates credential resolution from Core gate
  authority. Runtime env `GITHUB_TOKEN` is the only implemented provider.
  Token availability is not approval, readiness, or publication; GitHub App
  installation-token support is documented as future/design-only work in
  `docs/GITHUB_APP_TOKEN_MANAGEMENT_V0_1.md`. Token resolution happens after
  Core gates and before adapter execution for actual publish, while
  `dry_run=true` and same-key sent/acknowledged replay remain token-free.
  Resolved raw tokens must not be logged, persisted, returned through API JSON,
  written to evidence records, included in PR bodies, screenshots, or docs.
- GitHub App installation-token config boundary v0.1 reserves future config
  names and documents private key/JWT/exchange/repository/permission/evidence
  rules in `docs/GITHUB_APP_INSTALLATION_TOKEN_CONFIG_BOUNDARY_V0_1.md`. The
  read-only config reader/validator may inspect those config names for
  shape/presence validation and public-safe metadata only. It does not sign
  JWTs, parse private keys, create installation tokens, call GitHub, publish,
  or change C5 gates.
- The offline GitHub App RS256 JWT fixture may sign explicit fake/test PEM
  input with Node built-in crypto for local verification only. JWT creation is
  not approval, readiness, publication, token resolution, proof, or permission
  to publish. The helper does not read runtime env, read private key files,
  create installation tokens, call GitHub, integrate with C5, or change the env
  `GITHUB_TOKEN` provider.
- The GitHub App target/allowlist policy helper may evaluate a parsed
  `github_pr_comment` target against validated future GitHub App config before
  any installation-token exchange. Target policy is not approval, readiness,
  publication, proof, token resolution, or permission to publish. It does not
  sign JWTs, create installation tokens, call GitHub, integrate with C5, or
  change the env `GITHUB_TOKEN` provider.
- The GitHub App installation-token exchange boundary helper may build a
  redacted request and validate an injected fake-fetch response for future
  provider work. Exchange boundary code is not approval, readiness,
  publication, proof, C5 integration, or permission to publish. It is
  network-disabled by default, must not use global fetch directly, and does not
  call real GitHub, create delivery rows, persist tokens, integrate with C5, or
  change the env `GITHUB_TOKEN` provider.
- `docs/GITHUB_APP_TOKEN_MANAGEMENT_V0_1_CLOSEOUT.md` closes GitHub App/token
  management v0.1 as a bounded foundation line. It does not grant live
  exchange, live publish, Cockpit write controls, ChatGPT App write tools, or
  provider integration authority.
- A decision document or PR body can describe a future C5 live-test approval
  packet, but it is not approval by itself. Future live posts still require
  explicit user/PM approval for the exact target, exact body, exact
  `idempotency_key`, token use, and retain/delete decision.
- Approval gate-state summaries and Cockpit renderers are derived read-only
  views. They may show request readiness, target matching, delivery status, gate
  reasons, approval decision state, readiness check state, and safe next steps,
  but they are not sources of truth and do not add approve, publish, retry,
  proof, mailbox, state, GitHub, Discord, or Codex execution authority.

## Provider-Neutral Execution Lanes

`lib/execution-lanes.ts` records the current provider-neutral lane registry.
Vendor and product names below are examples of lane occupants, not canonical
semantics. Provider, session, workspace, thread, and run ids remain local/raw
trace context; they are not committed Augnes state and must not be promoted to
canonical state keys.

`scripts/smoke-authority-invariants.mjs` is the first route/helper regression
layer over this registry. It uses temp DB fixtures, direct helper calls, and
selected direct route-handler calls to verify that observe, plan, temporal
preview, bridge/action recording, Codex trace recording, Core-gated publish
validation, state briefs, and control packets do not grant non-core lanes
commit/reject authority. Full HTTP route-level enforcement remains future
integration-test work.

`docs/PERSPECTIVE_SNAPSHOT_V0_1.md` defines the first Perspective-specific read
model over these same boundaries. PerspectiveSnapshot is derived-view-only and
`research_diagnostics` remains log_only and non-authoritative.
`loopness_hint` is a bounded log_only diagnostic object; it is the only bounded
log_only diagnostic object in `research_diagnostics`.
`sidecar_e_t` is a structured placeholder object.
`meta_wm_hint` is a structured placeholder object.
`bsl_hint` is a structured placeholder object.
`comp_index_hint` is a structured placeholder object.
`sidecar_e_t` is not actual Sidecar state, not QP output, and not a z_t regime
commit.
`docs/SIDECAR_ET_DIAGNOSTIC_DESIGN_V0_1.md` is design-only and does not grant
runtime, schema, computation, or authority.
None of these are authority, proof, readiness, source of truth, Gate/SRF input,
Claim confidence, Evidence status, publication readiness, proposal scoring,
commit/reject input, or Cockpit action input.

`GET /api/augnes/read/constellation-preview` is a read-only local route for the
first Project Constellation route validation slice. It is scoped to
`project:augnes`, explicitly local-authorized, fail-closed, and static fixture
backed in its first implementation. Boundary class:
`read_only_local_static_preview`. The default local route requires only GET,
local host, `scope=project:augnes`, and the local read-only marker header.
Candidate D local declaration headers are optional strict debug validation, not
the default Cockpit path. This class has no commit/reject authority, no
proof/evidence write authority, no publish authority, no merge authority, no
retry/replay/deploy authority, no branch/PR creation authority, no Codex
execution authority, no DB schema/migration authority, no graph DB authority,
no persistence authority, and no consumer authority.

The ChatGPT App/MCP v0.1 contact surface
`augnes_get_project_constellation_preview` is a separate read-only consumer of
that existing local route. It adds no route write authority, no new route
behavior, no production auth, no DB query, no proof/evidence/readiness writes,
no Codex execution, no GitHub/OpenAI/provider calls, no branch/PR controls, no
merge/publish/approval/retry/replay/deploy controls, no graph DB, and no
persistence.

Read-only response sections use compact capability classes as the normal
product-facing boundary model. Current response-shape classes are
`read_only_local_static_preview`, `whole_perspective_summary`,
`perspective_capsule_preview`, `copyable_handoff_draft`, and
`boundary_next_review`. Detailed `authority_boundary` and
`forbidden_fields_removed` lists belong in optional diagnostics/debug paths and
Authority Matrix references, not in default preview, capsule, handoff, or
boundary-next-review payload sections. This normalization does not remove GET,
local-host, `scope=project:augnes`, local read-only marker, static fixture, or
fail-closed access controls.

`lib/readonly-api/access-guard.ts` is the shared read-only local access guard
for route-only local validation. It is local-only, fail-closed, and not
production auth. It grants no consumer authority, no write authority, no
proof/evidence/readiness authority, no publish authority, no merge authority,
no approval authority, no retry/replay/deploy authority, no Codex execution
authority, no DB query authority, no graph DB authority, and no persistence
authority.

`docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md` is a
docs/smoke/package-pointer plan for future real authenticated workspace/project
scope integration. It adds no authority and does not implement production auth,
hosted auth, session identity, workspace membership, consumer authority, write
authority, proof/evidence authority, Codex execution, DB query, graph DB,
persistence, publish, merge, retry, replay, deploy, or approval authority.

`docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md` is a docs/smoke-only
auth source selection packet for the read-only constellation preview route. It
adds no authority and does not implement production auth, hosted auth, session
identity, workspace membership, consumer authority, write authority,
proof/evidence authority, Codex execution, DB query, graph DB, persistence,
publish, merge, retry, replay, deploy, or approval authority.

`docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md` and
`types/readonly-api-auth-scope.ts` are a type-only auth/scope adapter boundary
for the read-only constellation preview route. They add no authority and do not
implement production auth, hosted auth, OAuth, session identity, workspace
membership, consumer authority, write authority, proof/evidence authority,
Codex execution, DB query, graph DB, persistence, publish, merge, retry,
replay, deploy, or approval authority.

`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md` is a
docs/smoke-only Candidate D local development auth adapter plan. It adds no
authority and does not implement an adapter, production auth, hosted auth,
OAuth, session identity, workspace membership, consumer authority, write
authority, proof/evidence authority, Codex execution, DB query, graph DB,
persistence, publish, merge, retry, replay, deploy, or approval authority.

`lib/readonly-api/local-dev-auth-adapter.ts` and
`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md` implement Candidate D
as an optional strict debug adapter for the read-only constellation preview
route. It is not required for default local Cockpit preview. The adapter grants
no production auth, hosted auth, OAuth, session identity, workspace membership,
consumer authority, write authority, proof/evidence authority, DB query
authority, graph DB authority, persistence authority, publish authority, merge
authority, retry/replay/deploy authority, approval authority, branch/PR
authority, or Codex execution authority.

`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md` is a docs/smoke-only real
auth gate plan for the read-only constellation preview route. It adds no real
auth implementation, production auth, hosted auth, OAuth, session identity,
workspace membership, route behavior change, consumer authority, write
authority, proof/evidence authority, DB query, graph DB, persistence, publish,
merge, retry, replay, deploy, approval, branch/PR, or Codex execution
authority.

`docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md` is a
docs/smoke-only local-only consumer scope decision packet for the read-only
constellation preview route. It grants no consumer authority and adds no
consumer implementation, route behavior change, real auth implementation,
production auth, hosted auth, workspace membership, DB query, UI, MCP/App tool,
proof/evidence write, Codex execution, graph DB, persistence, publish, merge,
retry, replay, deploy, approval, branch/PR, or runtime authority.

`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md` is a
docs/smoke-only Cockpit local-only route preview plan for the read-only
constellation preview route. It grants no consumer authority and adds no
Cockpit implementation, UI, route behavior change, real auth implementation,
DB query, MCP/App tool, proof/evidence write, Codex execution, graph DB,
persistence, publish, merge, retry, replay, deploy, approval, branch/PR, or
runtime authority.

`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md` documents that
the Cockpit local-only route preview is local-only/read-only. It grants no
App/MCP, write, proof/evidence, Codex, branch/PR, merge/publish/approval/
retry/replay/deploy, DB, graph DB, persistence, hosted auth, production auth,
session identity, or workspace membership authority.

`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md` is a
docs/smoke/package-pointer closeout for the read-only constellation local-only
route and Cockpit consumer loop. The closeout adds no authority and marks the
local-only milestone closed. It adds no route, UI, auth, DB, App/MCP,
proof/evidence, Codex, graph, persistence, merge, publish, approval, retry,
replay, or deploy authority.

| Lane id | Role | Examples | Authority summary |
| --- | --- | --- | --- |
| `augnes_core` | `core_runtime` | local runtime | Reads state, stores durable Core records, validates gates, and is the only commit/reject authority. |
| `chatgpt_mcp_bridge` | `surface_host` | ChatGPT App, MCP bridge | May read state, request pending proposals, and record bridge-gated trace/proof; it cannot commit/reject, publish, edit worktree files, open PRs, merge, or mutate repo history. |
| `openai_responses_api` | `reasoning_backend` | OpenAI Responses API | Receives explicitly supplied observe/plan/preview context only; it cannot read state directly, record durable Core records, commit/reject, publish, edit worktree files, open PRs, merge, or mutate repo history. |
| `codex_worker` | `specialist_worker` | Codex | May read state, edit repo/workspace files, open PRs, and record verification trace/proof through Core-gated helpers; it cannot commit/reject Augnes state, publish externally, merge PRs, or mutate repo history outside the PR workflow. |
| `github_code_history` | `code_history_surface` | GitHub repository and PRs | Stores repo and PR history that can be referenced as evidence; it is not Augnes state authority and is not active mutation authority. |
| `github_publication_actuator` | `actuator` | GitHub PR comment adapter | Can perform approved external PR-comment side effects only after existing Core-gated publish semantics pass; it cannot approve, commit/reject, record proof, edit worktree files, open PRs, merge, or mutate repo history. |
| `cockpit` | `observability_surface` | Augnes Cockpit | Derived read-only view over Core records; it does not gain hidden authority. |
| `browser_or_mcp_inspector` | `observability_surface` | Browser, Chrome, MCP Inspector | Derived verification surface only; it does not approve, publish, commit/reject, record durable state, edit worktree files, open PRs, merge, or mutate repo history. |

## Capability Matrix

| Actor or surface | Read Augnes state | Propose pending state | Record proof or trace | Commit/reject Augnes state | Edit repo | Use Browser/Chrome | Open PR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| User | Yes | Yes, through conversation or UI | Yes, by instructing tools or entering notes | Yes | Yes | Yes | Yes |
| Augnes Core runtime | Yes | Validates and stores pending proposals | Yes, action records and work events | Executes commit/reject only when explicit user action invokes the routes | No | No | No |
| ChatGPT App, public profile | Read-only app data | No | No | No | No | No | No |
| ChatGPT App, bridge enabled | Yes, through bridge tools | May request pending proposals through `augnes_observe`; commit/reject remains user-gated | Yes, bridge-gated action results and work events | No | No | No | No |
| Codex | Yes, through state/work briefs or handoff | No direct proposal authority; may relay user-approved context to Augnes observe routes only when explicitly instructed | Yes, through completion protocol or bridge-gated proof tools | No | Yes | Yes, for verification | Yes, through GitHub workflow |
| GitHub | Stores repo and PR history | No Augnes state proposals | PR history can be referenced as proof | No | Yes, via commits | No | Yes |
| Browser/Chrome | Reads rendered local or hosted surfaces | No | Evidence can be summarized by Codex or user | No | No | Yes | No |
| MCP Inspector | Reads MCP tool outputs | Only if bridge tool is intentionally called | Can validate and record bridge-gated proof | No | No | No | No |

## Non-Goals

This matrix intentionally does not grant:

- direct Codex orchestration from the ChatGPT App
- autonomous Codex execution
- ChatGPT App commit/reject authority
- GitHub auto-merge
- hosted auth or deployment semantics
- secret handling changes

## Review Rule

When adding a tool, route, script, or runbook, identify the actor and surface it empowers. If the change moves durable approval away from the user or committed state away from Augnes Core, it is out of scope unless the user explicitly approves a new architecture.
