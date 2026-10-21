# Augnes: Evidence & Continuity Console

Starter repo for the first review-safe ChatGPT App shell of Augnes.

## Product stance

This app is intentionally narrow:

- ChatGPT is the surface host only.
- Augnes Core remains the authority holder.
- The public/default tool surface is strictly read-only.
- No canonical memory writes happen from ChatGPT.
- Narrator text is never treated as Evidence.
- Repo search/explore stay view-only; fetch is the only repo path that can later become an evidence candidate.

The original legacy public tool surface remains:

- `search`
- `fetch`
- `open_casefile`
- `get_working_view`
- `explain_strategy`
- `get_boundary_packet`
- `get_continuity_report`
- `navigate_repo`
- `get_governance_audit`

Public/default mode also exposes the two read-only Augnes work tools:

- `augnes_list_work_items`
- `augnes_get_work_brief`

### Read selected work

Use this path when the user needs recorded Augnes project work context:

1. Call `augnes_list_work_items`, optionally with the intended `scope`.
2. Select a returned `work_id`.
3. Call `augnes_get_work_brief` with that identifier as `workId` and the same
   `scope`. No token, database path or manually discovered internal ID is needed
   in these tool arguments.

Omitted scope means the legacy scope `project:augnes`; it does not follow the
active Browser project or resolve a native project identity. The picker
recommendation is a display heuristic over returned order/status, not a current
work selection, priority decision or execution grant. Do not use these tools for
unrelated questions or independent audits that do not need project context.

The brief contains recorded status, next action, attention flag, recent events,
state-key references and source/proof links. Work IDs and events are operational
trace anchors. Linked action records retain their proof-only versus committed
state marker distinction; links are not verification that proof passed or that
the referenced source is current. `as_of` is the read time. Missing links,
unrecorded next actions and unverified source/proof information remain gaps;
neither a completed work status nor an empty list proves all work is resolved.
WorkBrief is a historical compatibility input, not a native `TaskContextPacket`
or accepted semantic history. See the
[protocol owner](../../docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md#historical-compatibility-inputs).

The native current packet's selected notes have a separate, explicit local
Companion Operator tool, `augnes_read_repository_work_sources`, bound to a
repository Resume snapshot. It is not registered on this public/default App
surface and does not redefine WorkBrief. See the
[local source-read contract](../../docs/CODEX_CURRENT_CONTINUITY_V0_1.md#explicit-current-work-source-read).

### Opt-in connection to one native project

The separate stdio entry point
`plugins/augnes-operator/mcp/connected-project-reader.mjs` exposes only
`augnes_read_connected_project_work`, with no arguments. It is a bounded P2
[#1212](https://github.com/hynk-studio/augnes/issues/1212) delivery adapter over
the existing private Companion readers. It is not registered on the public App
or the default local Operator, and an old public `work_id` never follows native
task preparation.

The local operator configures `AUGNES_CONNECTED_PROJECT_ROOT` once with the
intended registered physical repository root and `AUGNES_CONNECTED_PROJECT_KEY`
with that project's exact opaque `repository_resolution.project_key` from a
normal local Resume. Both are required at launch. They are configuration, not
model arguments or credentials; the user need not discover database paths,
packet IDs or access tokens. A later different project requires a separately
reviewed connection binding, even if it uses the same folder. There is no
automatic project switching or mapping from a public App ID.

The supported private transport candidate is OpenAI's
[Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels),
whose documented stdio mode can launch this entry point with Node 24. The
operator must authorize the exact destination ChatGPT workspace/connection and
the transmission of this project's **current definition and whole selected
notes**, then configure that command and the two environment values in the
approved local transport. Pipe access belongs to that operator-controlled
parent. This adapter creates no HTTP listener, tunnel, credential, service or
account association and does not authenticate an arbitrary remote client itself.
Do not wrap it in an unauthenticated HTTP proxy or point a tunnel at the full
Operator or private Companion HTTP endpoint.

As documented on 2026-09-25, activation requires a tunnel ID, a tunnel-client
runtime API credential, Platform organization Tunnels Read + Use permission
(Read + Manage to create/edit), and the correct ChatGPT workspace association
and developer-mode access. These are separate prerequisites, not source-test
results. No OAuth service or public server is required by the documented tunnel
transport; this does not waive its authentication and audience requirements.
Handle credentials through the approved secure setup flow, never in chat or
repository files. A missing private prerequisite has no public-tunnel/export
fallback. Source changes must be reviewed and merged before production use.

After separately authorized activation, follow the official
[ChatGPT connection flow](https://developers.openai.com/plugins/deploy/connect-chatgpt):
select the approved Tunnel connection, inspect its single-tool catalog, and add
it to a conversation. Refresh connection metadata when it changes. The operator
keeps the approved tunnel-client and existing Companion available; the user
selects the connection and asks for current project work. The model obtains
the definition, packet/snapshot bindings and selected material directly from
the result, with no recurring token/ID/report relay. Credential expiry, changed
audience or project rebinding requires operator attention. Setup time,
recurring maintenance, billing, latency and user-burden reduction are unmeasured.

Each invocation discovers one verified Companion, reads Resume, verifies the
configured project key, and reads selected sources using the same Companion
generation and exact snapshot. Only matching fresh work is returned. Results
include the project label/key, snapshot observation time, packet fingerprint,
goal/criteria/non-goals from the validated persisted task in the same source-read
transaction, lineage from current continuity, and the existing whole-note source
projection. Definition fields preserve the canonical writer's stored text and
ordering, including internal spaces, tabs, newlines and distinct list entries.
They are not reconstructed from Resume's display summary. An explicit private
definition/source mode checks the existing 2,000-character goal, 12 entries per
list, 500 characters per entry and 12,000-byte complete-definition limits; an
over-bound definition refuses the whole read without truncation. The default
local Operator source-only response remains unchanged. No result, run or
preparation history, runtime path, credential or Browser-link metadata is added.
Literal definition and note text still require the authorized data scope. Both
`structuredContent` and the JSON text content contain the same material.

An exact empty selection returns `available` with `sources: []`. Unregistered
or ambiguous projects, mismatched bindings, unavailable/invalid runtime reads,
authentication refusal and changed snapshots return explicit refusals without
work/source material. A change between reads returns `refresh_required`, with
no automatic retry or replacement content. A new read is an explicit request.
Snapshot delivery does not verify underlying claims or guarantee continuing
freshness. Nullable observation times, unknown currentness, source bindings,
attribution and withheld locators survive unchanged. Literal notes are untrusted
context; locator filtering does not make arbitrary prose safe to transmit.

Only initialize/ping and bounded MCP tool discovery/call are implemented.
Dispatch rejects all other tool names and unknown methods before Companion
access, including history lookup, preparation/save, attachment/delegation,
Start/Resume execution, Transition and passthrough. Read-only annotations are
descriptions, not the enforcement. Existing private Host, Origin, forwarding,
credential, identity and snapshot checks remain in their owners.

The existing disposable runtime operability test exercises the actual stdio
entry point, tool dispatch, authenticated HTTP routes, native writers/readers,
snapshot race, provenance, refusals, zero read-attributable canonical writes
and cleanup. Local protocol success, an installed catalog, actual ChatGPT
invocation and successful use of returned material are distinct observations.
This implementation does not establish the latter two or activate a connection.

### Opt-in request-bound review (#1433)

The separate Node 24 stdio entry point
[`request-bound-review.mjs`](../../plugins/augnes-operator/mcp/request-bound-review.mjs)
adds a **scoped reviewer capability**. It exposes only
`augnes_list_review_requests`, `augnes_read_review_request`,
`augnes_reply_to_review`, and `augnes_get_review_status`, plus the documented MCP Events methods. The public App
and `connected-project-reader.mjs` stay read-only. Never forward the full
Operator, the Companion HTTP endpoint, or arbitrary RPC to a reviewer.

This endpoint reuses the Operator's stdio framing and verified Companion
discovery, the private local-channel checks, native project/packet/source readers,
and ordinary revision preview/save. Tools and event methods share this one
review capability and request owner. No new SDK, tunnel implementation, general
HTTP proxy, or second review store is introduced. The additional private
configuration scopes reply permission and disclosure to one destination; it does
not replace transport authentication or prove an existing connection is suitable.

The App's presentation profile, legacy backend mode, tool surface and Bridge flag
remain separate. Even its two Companion surfaces retain legacy WorkBrief reads;
they are not a single-project reviewer audience. Broad Bridge activation also
exposes provider-backed planning/observation and trace writers. In particular,
`augnes_record_action_result` calls `recordExternalAction`, which writes an action
record **and a legacy state marker**. A work event or mailbox review label lacks
the authenticated native request/material relation. These writers are not used
as review replies. Removed handoff/launch tools remain removed.

The originating local agent uses `augnes_review_repository_work`: discover the
configured connection for its repository, inspect material, request a bounded
question, list/read back the answer, then deliberately prepare a retain/revise/
reject note through the existing work revision preview/save tools. Each result
returns the references needed by the next call. Both lists are paginated: pass
`next_cursor` back as `cursor`. No recurring token or answer copying is required
by this explicit source path. Comparative burden reduction remains unverified.

A contributor with a known `request_ref` can call `augnes_get_review_status`
directly, including after the originating work advances or when the request is
beyond the first list page. This exact scoped lookup never enumerates pages.
Its `available` envelope contains precisely the same request/response/current-use
item as the reviewer's list, plus the standard projection version, status,
untrusted-context marker and false authority flags. Both contributor projections
give role-specific guidance: pending/current requests require an exact material
read before reply; pending/historical requests require an already valid original
read and explicit late-receipt admission; answered requests invite inspection,
without resubmission or origin-only revision actions. Origin list/readback retains
its own assessment, reassessment and ordinary revision guidance.

Status reads validate coherent current material, registered and physical project
roots, exact request scope and current connection again before returning. Missing,
corrupt, over-budget or incoherent material retains the existing refusal; there is
no row-only fallback. Status neither returns nor creates `read_binding`, enables a
first reply (including `historical_v1`), marks an answer served to the origin, nor
writes work, selections, requests, responses or delivery state. Origin `readback`
alone owns its served marker. Existing `use.reasoning` is untrusted authored
interpretation, not verified success, approval or demonstrated model judgment.
After response/use-note deselection, `not_observed_in_current_work` describes the
current selection only; it establishes neither no prior use nor permanent
rejection or deleted history. No current definition, source bodies/locators,
unrelated results/assessments, other connection or broader history is disclosed.

The reviewer reads the requested native definition and whole selected notes
from one validated packet and project binding. A relevant work/root/direction
change refuses the old read or first reply; it never replaces the material.
Unrelated project selection/activity does not invalidate the request. Already
saved answers remain labelled historical after material changes. This adapter
does not offer historical material replay or create a historical content store.
An exact duplicate reply returns the saved response reference, including after
a lost acknowledgement; a conflicting reply refuses atomically.

Answers are bounded to 1,000 characters, limitations to 240, and source references
to eight packet/selected-source fingerprints. Attribution identifies possession
of the configured capability and its configured destination/label; it does not
verify a model, person, or subscription tier. Source text and answers remain
untrusted context. Response persistence, readback served to an origin, and an
attributed use note in current work are distinct observations. The existing
writer enforces its source limits and currentness; preparing use does not save
it, accept semantic state, issue execution permission, or request another review.
The selected answer uses the existing `imported_unverified` excerpt path, with
separate `derived_interpretation` reasoning. It does not enter the reviewed-outcome
path or manufacture an expectation, attempt, outcome report or RunReceipt.

#### Scoped setup and disabled-by-default operation

Before activation, separately record approval for the exact ChatGPT account,
workspace and destination; the native project's definition and selected notes;
reviewer configuration; and finite request/usage envelope. Callback egress must
be preconfigured or explicitly decided through the enrollment workflow below.
Existing API credentials or an installed plugin do not supply that approval.
The implementation task itself grants none of these live permissions.

After that approval, the operator can use
[`scripts/configure-review-connection.mjs`](../../scripts/configure-review-connection.mjs)
with two absolute file arguments: a nonsecret setup JSON file and a new private
output file outside the repository. The setup fields are `repository_root`,
`project_key` (from ordinary Resume), `destination`, `reviewer_label`, finite
`expires_at`, and `callback_origins` (exact HTTPS origins). To enroll a host-supplied origin,
set `callback_origins: []` and `callback_enrollment: true` at initial setup. The
flag is optional; existing strict preconfigured-origin configurations are unchanged.
Enrollment and a nonempty preconfigured list cannot be combined. The utility creates
an exclusive owner-only file containing generated capabilities and an encryption
key, prints only its connection reference, and activates nothing. Keep that file
out of prompts, logs, source, and artifacts. It is machine-local credential state,
not a Core grant or a substitute for disclosure approval.

Set `AUGNES_REVIEW_CONNECTIONS_FILE` for the approved supervised UI and bounded
reviewer process; set `AUGNES_REVIEW_CONNECTION_ID` only for the latter. The UI
allowlist forwards the file path explicitly; bridge/recovery roles do not receive
it. This is an optional runtime configuration change requiring its own authority.
Every request/disclosure/write/delivery reopens and validates the private file
and current native project access. Removing/replacing the binding or reaching
its expiry revokes it. Unsubscription stops that callback delivery; neither
action claims to cancel a ChatGPT task already running elsewhere.

#### Local callback enrollment and stop

When the host supplies a callback only during subscription, do not guess its
origin from the login site, API endpoint or tunnel. Use the same private setup
utility and explicitly opt this connection into enrollment. All commands below
run locally in the intended runtime's supported discovery environment. The CLI
uses verified Companion discovery and its authenticated private channel; it does
not start a service or expose an operator capability to the reviewer.

1. Create a **new**, finite connection with the setup fields above, including
   `"callback_origins": []` and `"callback_enrollment": true`:

   ```sh
   node scripts/configure-review-connection.mjs "$SETUP_JSON" "$REVIEW_CONFIG"
   ```

   Both arguments are absolute paths; the output must not already exist. Retain
   the returned `connection_ref` as `CONNECTION_REF`. Configure the supervised
   UI/reviewer as described above, only under the separately authorized activation.
   Keep the same file for the CLI. Never change an existing connection's callback
   list/flag to approve a candidate: the complete configuration is credential-bound.
   Such replacement revokes its old bindings. If preserving an older connection,
   keep that exact entry and its private material through its authorized lifetime.

2. Ask the host to create its normal `review.requested` event task with the
   intended filter. The first authenticated `events/subscribe` records a pending
   **origin and filter only**, then returns `-32015 CallbackEndpointError` with
   `reason: approval_required` and a local-inspection next action. No DNS lookup,
   challenge, application delivery or active subscription occurs. Do not call
   this failed setup a successful subscription or assume automatic host retry.

3. Inspect locally:

   ```sh
   AUGNES_REVIEW_CONNECTIONS_FILE="$REVIEW_CONFIG" node scripts/configure-review-connection.mjs callbacks inspect "$CONNECTION_REF"
   ```

   The JSON result must have `observation: observed`. Unavailable/refused output
   is not zero candidates. Inspect the exact canonical origin **including port**,
   connection/project/principal, event/filter, expiry, candidate revision and
   policy revision. Output is escaped JSON intended for the operator; keep real
   origins out of public reports. It omits callback paths, queries and keys.
   Authenticated submission and a later receiver challenge prove neither corporate
   ownership nor permission for broader disclosure. An independently documented
   origin can inform the decision; informed, explicit approval of this exact
   scoped destination is also supported. No official hostname list is required.

4. Put the exact returned `candidate_ref`, its `revision` as `expected_revision`,
   the inspection's `policy_revision` as `expected_policy_revision`, and its
   `policy_generation` as `expected_policy_generation` into a
   nonsecret local decision JSON file (`DECISION_JSON`). Add `expires_at` as a
   concrete ISO timestamp no later than the approved trial/connection deadline
   and no more than one hour from the decision. Then explicitly approve:

   ```sh
   AUGNES_REVIEW_CONNECTIONS_FILE="$REVIEW_CONFIG" node scripts/configure-review-connection.mjs callbacks approve "$CONNECTION_REF" "$DECISION_JSON"
   ```

   A stale/concurrent decision refuses. Generation is a server-issued identity,
   not a counter to increment locally. Inspect again before deciding; never
   automatically retry approval with new revisions. Approval changes separate
   egress policy, **not** the connection credential/binding or review history.
   A transport interruption may have saved the decision: inspect before retry.

5. Request a **fresh ordinary host subscription** through the host's event-task
   setup/confirmation flow. This may require **another setup model execution**,
   in addition to the first failed enrollment setup and the eventual event review.
   Budget and authorize those executions before a later live trial. Do not send
   the full callback URL or secret through chat, manually manufacture the host's
   callback, or assume it retains the previous URL/key. A fresh path/key on the
   approved origin/filter is allowed, but must be verified. A different origin,
   port or filter requires a new local decision. No deferred success is sent for
   the earlier failed request. Only a signed, successful challenge admits storage
   and delivery. Same permission/URL/key refresh uses the bounded verification
   cache and requires no repeated operator confirmation.

For `reject` or `revoke`, use the same four exact candidate/revision/generation fields in a
new decision JSON file, **omit `expires_at`**, and substitute that operation in
the CLI. Rejected/revoked entries remain refusal tombstones until connection
expiry, unless the operator explicitly makes a fresh exact approval. Revocation
fences that permission before new verification, persistence and every delivery;
it does not cancel a socket already admitted or an external model task.

For connection-wide delivery stop, use a decision JSON containing only
`expected_policy_revision` and `expected_policy_generation` from fresh inspection:

```sh
AUGNES_REVIEW_CONNECTIONS_FILE="$REVIEW_CONFIG" node scripts/configure-review-connection.mjs callbacks stop "$CONNECTION_REF" "$DECISION_JSON"
```

Stop invalidates the policy revision and callback leases. Local inspect/stop
remain available after connection expiry with the exact private configuration,
authenticated runtime and project access. First local inspection establishes a
bounded policy identity if none exists, including before a candidate arrives;
it grants no permission or subscription. Host `events/unsubscribe` remains an
authorized, non-network cleanup operation after destination revocation; it needs
no new egress approval or challenge. Stop/remove the host task through its
non-model controls and remove the trial connection/tunnel separately. Local
expiry/stop does not prove that external work was cancelled.

Pending candidates expire after at most 15 minutes; at most eight per connection
and 64 overall are retained. Authenticated ingress prunes expired entries before
observing a new identity, so expired observations never authorize a later one.
Approvals last at most one hour, capped by the unchanged connection expiry.
Rejected decisions cannot be displaced by callback path/key changes. No poller
or background enrollment job is introduced. Every supported restore mints a new
policy generation and invalidates all approvals and delivery leases, even when
restoring the same backup repeatedly. Snapshot revision numbers can repeat;
generation-bound decision files and verification tokens cannot be reused across
that boundary. This applies equally to approve, reject, revoke and stop. The
explicit lifecycle upgrade from the earlier enrollment schema also invalidates
old permission; ordinary requests never migrate storage. Inspect, explicitly decide again if still authorized,
and obtain a fresh host subscription. Requests and attributed replies survive.
A stopped or restored policy can still observe bounded pending candidates from
authenticated ingress, including after an old candidate expires. Observation
does not resume permission: a fresh local decision with the current generation and revisions
and a newly verified subscription are required. Remove the connection binding
to stop that ingress as well as delivery.

Explicit request/read/reply/readback remains independent of callback approval.
An originating agent can find saved replies through ordinary readback/Resume and
deliberately use them through native revision preview/save. There is no automatic
originating-agent wakeup or claim of autonomous recovery.

#### Events contract and evidence limits

The [current official Events contract](https://developers.openai.com/plugins/build/mcp-events)
documents MCP 2.0 `2026-07-28`, `server/discover`, `events/list`,
`events/subscribe`, and `events/unsubscribe` on the same authenticated endpoint
as tools. The adapter implements `review.requested`, optionally filtered by exact
`work_ref`. Events contain only stable request/material references. Subscription
identity binds the configured principal, callback URL, name, and canonical
arguments. Default TTL is 15 minutes, capped at one hour and connection expiry;
`ttlMs: null` also receives a finite grant. No replay cursor is offered.

The reviewer MCP boundary validates common per-request `params._meta` before
passing method arguments to the authenticated private route. Modern discovery,
tools, and Events require `io.modelcontextprotocol/protocolVersion: "2026-07-28"`
and object-valued `io.modelcontextprotocol/clientCapabilities`. Missing or
malformed metadata returns `-32602`; unsupported versions return `-32022` with
the supported version. Valid optional client information, progress/logging and
extension metadata is accepted as untrusted protocol data and never changes the
configured principal, project, destination, or tool permissions. Modern results
include `resultType: "complete"`. See the [MCP basic contract](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/basic/index.mdx)
and [schema](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2026-07-28/schema.ts).
Existing explicit-tool clients can still initialize the legacy `2025-06-18`
stdio session; Events always require the modern envelope. The private JSON route
remains strict domain-only input and is not a public MCP HTTP endpoint.

The private review HTTP route requires exactly one decoded query key, `scope`,
whose value is `repository:local`. Both the literal colon and `%3A` spelling are
valid; Next normalizes the former to the latter before route admission. Duplicate
keys (even equal values), additional keys, missing/empty/wrong scope and a
double-encoded colon refuse with the same bounded access error. This does not
change Host/Origin/forwarding, marker, runtime credential, generation or reviewer
capability checks.

Signed single-use challenge verification, bounded verification caching, Standard
Webhooks signatures, a two-minute dual-key rotation window, per-connection DNS
validation/pinning, TLS hostname verification, no redirects, and public-address
checks apply before disclosure. Callback URLs and secrets are encrypted in the
adapter tables and excluded from tools and routine errors. Delivery has three
bounded attempts with exponential backoff; `410`/`413` stop that delivery.
An HTTP `2xx` means receipt only. It does not establish host processing or a reply.

Request linkage, subscriptions, pending delivery, and bounded enrollment policy/
candidates live in five small adapter tables prepared only by the existing initialization/migration owner. Ordinary
requests never prepare schema. Request persistence precedes callback delivery;
failed acknowledgement is reported with unknown persistence and readback advice.
Pending delivery is drained on request, adapter startup, or explicit subscription
refresh, without polling or a scheduler. Finite drains may leave pending work for
one of those later triggers. Restart retains unanswered requests and subscriptions;
database restore preserves requests/answers but invalidates callback leases.
Reply persistence creates no new review event. Backup/restore remains owned by
the existing lifecycle; the private machine configuration is not exported with it.

Official documentation lists Work chats on web, desktop Work with Cloud selected,
and dots, subject to workspace controls. The documented
[ChatGPT connection](https://developers.openai.com/plugins/deploy/connect-chatgpt)
and [Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)
remain subject to separately authorized activation. Synthetic live attempt 5
observed tunnel association, ChatGPT connection, and discovery of the three
scoped tools. Its `events/list` reached the adapter but the private Augnes HTTP
route refused it. Local reproduction on the trial source and then-current main
isolated Next's query serialization against the raw scope comparison; the parsed
query correction below is local source evidence. Later attempt 6 observed two actual explicit reviews, exact replies, fresh
originating readback and native revise/retain decisions, including one after
restart. Attempt 9 observed actual host subscription dispatch, refused as
`destination_refused`; its raw callback was not retained and no historical
predicate defect is asserted. Callback enrollment addresses setup completeness.
Successful callback verification and event-triggered processing/replies remain
unverified.
This correction activates no live connection, subscription, provider or install.

The registered `request-bound-review` supporting integration child uses real
native writers, an HTTP fixture invoking the authenticated route handlers,
fresh processes, and disposable HTTPS
protocol fixtures. It covers two explicit cycles and attributed continuation,
version/project races, isolation, atomic replay/conflict, lost acknowledgement,
restart/recovery, filtering, signing, SSRF refusal, expiry and unsubscribe.
Standards-shaped modern requests also pass through actual SDK stdio serialization
and the authenticated route, including required/optional metadata, protocol and
domain refusals, unchanged authenticated attribution, and no effects after
failed admission. One native continuation supplies attributed selected sources
before the steady-state cases; the second continuation and version races run
afterward so unrelated reads need not repeatedly validate their extra history.
The same child then exercises real backup, restore, preparation, and a later
request/reply with all accumulated linkage. It retains its 30-second natural-exit
bound, records completed phases, and reports success only after cleanup. These
are local protocol and deterministic source mechanics.
The existing `runtime-supervisor-lifecycle` operability child additionally runs
the review adapter over actual stdio, verified Companion discovery and the
supervised Next HTTP server. It covers both valid query representations, strict
query/private-channel/runtime/configuration refusals, modern protocol admission,
an explicit request/read/reply/fresh-readback/revision cycle, and unanswered work
after supported stop/start with fresh generation discovery. Rejected operations
preserve all database rows and schema; a UI/client network guard forbids real external callbacks/provider requests.
The same supervised Next/stdio child now starts from an enrollment-enabled empty
allowlist, observes pending state, invokes the supported CLI inspect/approve,
accepts a fresh callback, verifies a signed controlled-receiver challenge and
event, then completes scoped reply/fresh readback/native revision. CLI stop,
post-revocation unsubscribe and restart preserve that boundary. These controlled
network fixtures are not actual ChatGPT enrollment acceptance. This reuses the existing lifecycle owner and
deadline, rather than treating an imported-handler fixture as Next parity.
The existing `recovery-backup` owner also runs a supervised Next/stdio and fresh
CLI regression for consumed and unconsumed decisions, decisions captured between
three restores of the same backup, and all four mutating operator actions. It
requires current runtime discovery, unchanged decision files, no refusal effects
or network activity, intact requests/replies, and a fresh signed subscription
with a later request/reply. It covers the populated predecessor's explicit
migration and retains the recovery owner's total 330-second bound.
Actual ChatGPT **event-triggered** receipt/answer/use, Events recovery and a
matched manual-handoff burden comparison remain **NOT RUN**. Attempt-6 explicit
reply/use/restart success remains separate positive evidence. No new live
execution is authorized by this increment (recorded counts: reviewer 6, origin 5).
Provider cost is unknown; a shorter tool list is not measured burden reduction.
Any authorized comparison must retain the existing usable App/Bridge work reads
and trace facilities, plus the native connected reader where available, with the
same material and tools on both sides. Report initial scoped setup separately
from recurring human relay; do not substitute a copy-everything baseline.
Issue #1433 remains open for those live obligations.

`createMcpAppServer` registers the two existing WorkBrief tools against its separate
`StateRuntimeBridgeAdapter`. The normal `StateRuntimeHttpAdapter` calls
`GET /api/work?scope=...` and `GET /api/work/:work_id/brief?scope=...`.
Those routes read through `lib/work.ts` (`listWorkItems` / `buildWorkBrief`),
using stored work items, events, coordination events and linked action records.
The App validates the responses, preserves the brief in structured output and
metadata, and renders a bounded narrative/widget projection. It does not fetch
linked proof or infer canonical currentness. The existing demo seed writer and
mock bridge adapter supply test fixtures only, not connected-project evidence.

A valid empty scope returns an empty picker. A missing optional work-table
fallback from the runtime is reported as unavailable by this adapter, preserving
the route's explicit fallback distinction. Transport, malformed-response and
missing/wrong-scope brief errors remain errors in MCP, text and the work widget;
they do not trigger fixture fallback or another project's work.

### Exposure controls

`AUGNES_APP_TOOL_SURFACE` defaults to `public`. Both work-read tools are registered
on every existing surface; the following controls determine the additional tools.

| Tool surface | Bridge disabled (default) | Bridge explicitly enabled |
|---|---|---|
| `public` | Nine legacy + two work-read tools | Public tools plus the existing gated bridge |
| `work_loop_readonly` | Two work-read tools | Two work-read tools |
| `companion_repository_readonly` | Two work-read tools | Work reads plus repository continuity read |
| `companion_repository_attachment` | Two work-read tools | Work reads plus existing repository attachment/delegation tools |

Registration does not establish backend availability. `AUGNES_APP_PROFILE`
controls presentation independently; `AUGNES_CORE_MODE` selects only the legacy
adapter. In normal mock, file and HTTP configurations, work reads still require
the state-runtime HTTP backend at `AUGNES_API_BASE_URL`. Injected test adapters
are explicitly mock evidence. A health `mode` label alone does not identify the
backing data of every tool.

Bridge-gated tools may be enabled for local operator workflows with
`AUGNES_ENABLE_AGENT_BRIDGE=true`. They are not part of the public default
surface. Current bridge-gated read-only tools include
`augnes_get_state_brief`, `augnes_get_evidence_pack`,
`augnes_get_session_trace`, `augnes_get_verification_evidence_records`,
`augnes_get_mailbox_summary`, `augnes_get_publication_summary`, and
`augnes_get_publication_decision_card`; none are available in public/default
mode. The cross-session read tools require the corresponding runtime routes and
remain read-only: no session bind/create/update, no evidence creation, no
publish/replay/approval, no GitHub/OpenAI calls, and no Codex execution.

For cross-surface decision/control roles, see
`../../docs/AUGNES_CONTROL_PACKET_AND_SURFACE_ROLES.md`.

## Local run

```bash
npm install
npm run typecheck
node --import tsx scripts/smoke.ts
node --import tsx scripts/invariants.ts
npm run dev
```

Default mock mode uses the built-in `MockAugnesCoreAdapter`:

```bash
npm start
```

Health route:

```bash
curl http://localhost:8787/healthz
```

Expected response:

```json
{
  "ok": true,
  "name": "augnes-console",
  "version": "0.1.0",
  "mode": "mock",
  "readOnly": true,
  "profile": "public"
}
```

## Modes

### Mock mode

Safe default:

```env
AUGNES_USE_MOCK=true
```

Or explicitly:

```env
AUGNES_CORE_MODE=mock
```

This uses `MockAugnesCoreAdapter` for the nine legacy tools without a live legacy
Core backend. The two work-read tools still require the state-runtime backend.

### File mode

File mode adds file-backed read paths for the nine legacy tools: `get_working_view`, `open_casefile`, `search`, `fetch`, `get_continuity_report`, `get_boundary_packet`, `explain_strategy`, `get_governance_audit`, and `navigate_repo`:

```bash
npm run start:file
```

For watch mode with the same file-backed fixtures:

```bash
npm run dev:file
```

`start:file` and `dev:file` load `.env.file` when present, otherwise they use the built-in checked-in fixture defaults. To customize local fixture paths, create an untracked `.env.file`.

In file mode, `FileAugnesCoreAdapter` reads configured JSON files for the nine legacy tools, including the Repo Navigation JSON file on `navigate_repo` calls. Payloads are validated against existing schemas. The adapter never writes to files.

Remaining mock-backed legacy tools in file mode: none. Mock mode itself remains available. Work reads use the separate state-runtime HTTP adapter and do not read these files.

The current `ContinuityReport`, `BoundaryPacket`, and `StrategyRationale` schemas have no evidence-reference fields, so continuity, boundary, and strategy evidence linkage are planned for a later schema pass. File-backed strategy currently returns the configured fixture for any subject; subject-specific resolution is planned for a later adapter pass.

## Presentation profiles

`AUGNES_APP_PROFILE` controls presentation only. It does not change tool authority, adapter behavior, Core sovereignty, read-only annotations, or the public tool list.

Default public file mode:

```bash
npm run start:file
```

Chrono Lab file mode:

```bash
AUGNES_APP_PROFILE=chrono_lab npm run start:file
```

Profiles:

- `public`: directory-safe, concise, user-facing. Governance, boundary, and continuity panels lead with summaries while preserving IDs, pointers, safety warnings, and promotion bans.
- `chrono_lab`: developer/lab-facing. Panels keep detailed governance audit fields, boundary lineage, continuity fail axes, and transition retention visible.

The widget resource URI is versioned as `ui://widget/augnes-console.v2.html` so ChatGPT does not reuse stale profile-rendering HTML across local validation runs.

## Widget security

The widget is a self-contained read-only HTML resource. It does not make direct browser network calls, load external scripts or fonts, use analytics, use `localStorage`/`sessionStorage`, or use `eval`/`new Function`.

Widget state is UI-only: last panel, expanded/collapsed sections, profile badge, and last update display. It is not canonical Augnes state, and ChatGPT thread/session/workspace state is not treated as Augnes memory.

The resource declares a narrow SDK-native CSP plus OpenAI-compatible widget CSP metadata with empty connect and resource domain allowlists. The stable widget domain comes from `AUGNES_RESOURCE_DOMAIN`.

Known issue: `CSP off` may still show in ChatGPT Developer Mode even with CSP metadata present. Do not treat this as production-ready until verified on a stable deployment URL with a refreshed app registration or new draft.

Manual Developer Mode security checklist:

- Create a fresh Developer Mode app after widget URI changes.
- Verify `/healthz` reports the intended `profile`.
- Verify the widget resource URI is `ui://widget/augnes-console.v2.html`.
- Verify the widget uses no external network APIs.
- Verify the Developer Mode CSP badge state.

### HTTP mode

Switch to the real adapter seam:

```env
AUGNES_USE_MOCK=false
AUGNES_API_BASE_URL=http://localhost:3000
```

Or explicitly:

```env
AUGNES_CORE_MODE=http
```

`HttpAugnesCoreAdapter` uses this proposed read-only contract:

- `POST /search` with `{ query, scope, timeRange }`
- `GET /fetch/:id`
- `POST /casefile` with `{ subject }`
- `GET /working-view?scope=...`
- `POST /strategy` with `{ subject }`
- `GET /boundary-packet?boundaryId=...`
- `GET /continuity-report`
- `POST /repo/navigate` with `{ query }`
- `GET /governance-audit`

Startup does not fail if the backend is unavailable. Tool calls fail at runtime with a clear error payload instead.

## Environment variables

Set these in the shell or in an untracked local `.env` file:

- `PORT=8787`
- `AUGNES_USE_MOCK=true`
- `AUGNES_CORE_MODE=mock` (optional; allowed values are `mock`, `file`, `http`)
- `AUGNES_APP_PROFILE=public` (optional; allowed values are `public`, `chrono_lab`)
- `AUGNES_APP_TOOL_SURFACE=public` (optional; see exposure controls above)
- `AUGNES_ENABLE_AGENT_BRIDGE=false` (only the literal `true` enables the existing gated bridge)
- `AUGNES_API_BASE_URL=http://localhost:3000`
- `AUGNES_WORKING_VIEW_FILE=./data/working-view.example.json`
- `AUGNES_CASEFILE_FILE=./data/casefile.example.json`
- `AUGNES_EVIDENCE_INDEX_FILE=./data/evidence-index.example.json`
- `AUGNES_CONTINUITY_REPORT_FILE=./data/continuity-report.example.json`
- `AUGNES_BOUNDARY_PACKET_FILE=./data/boundary-packet.example.json`
- `AUGNES_STRATEGY_RATIONALE_FILE=./data/strategy-rationale.example.json`
- `AUGNES_GOVERNANCE_AUDIT_FILE=./data/governance-audit.example.json`
- `AUGNES_REPO_NAVIGATION_FILE=./data/repo-navigation.example.json`
- `AUGNES_APP_DOMAIN=https://app.augnes.dev`
- `AUGNES_CONNECT_DOMAIN=https://app.augnes.dev`
- `AUGNES_RESOURCE_DOMAIN=https://persistent.oaistatic.com`

`AUGNES_RESOURCE_DOMAIN` is used for the widget resource domain. `AUGNES_APP_DOMAIN` and `AUGNES_CONNECT_DOMAIN` remain available for compatibility with earlier local app metadata, but the widget itself does not require external connect or resource domains. Only safe origins should be configured.

Backward compatibility: without `AUGNES_CORE_MODE`, `AUGNES_USE_MOCK=true` selects mock mode and `AUGNES_USE_MOCK=false` selects HTTP mode. The default remains mock.

## Native-host result boundary

The ChatGPT App is a read-only context surface. It does not export packets for
native-host transfer and does not accept pasted native-host results. Project
Home starts the current persisted `TaskContextPacket`; deterministic and live
native-host adapters return structured results through the shared lifecycle and
canonical `RunReceipt` admission. Project Home, Workbench, and Inspector read
that project-scoped receipt without giving the App write authority.

## Bridge-gated mailbox summaries

When `AUGNES_ENABLE_AGENT_BRIDGE=true` and `AUGNES_API_BASE_URL` points at a
running Augnes runtime, the bridge exposes `augnes_get_mailbox_summary`.

Use it when a user asks what mailbox handoffs, review requests, approval needs,
or blocked/partial notices require attention:

```json
{
  "scope": "project:augnes"
}
```

The tool calls the runtime `GET /api/mailbox/summary` endpoint and returns:

- `structuredContent.mailbox_summary.summary.pending_handoffs`
- `structuredContent.mailbox_summary.summary.needs_review`
- `structuredContent.mailbox_summary.summary.approval_needed`
- `structuredContent.mailbox_summary.summary.blocked_or_partial`
- inactive superseded/expired counts

Answer pattern:

```text
Mailbox summary
- Summarize pending handoffs and needs-review items first.
- Include approval-needed and blocked/partial notices when present.
- Mention superseded/expired counts only as inactive context.

Authority boundary
- This is a derived read-only view.
- It does not acknowledge mailbox messages.
- It does not approve/reject or commit Augnes state.
- It does not execute Codex, publish externally, or record proof.
```

Do not expose this tool in public/default mode, and do not treat mailbox summary
output as canonical Augnes memory. The mailbox storage/API remains the source;
summary buckets are bounded classifications for review.

Active mailbox views exclude terminal `superseded` and `expired` messages. The
runtime list API exposes that read-only view with:

```bash
curl "http://localhost:3000/api/mailbox?scope=project:augnes&active=true"
```

Terminal mailbox states block reactivation to `ready`, `delivered`,
`acknowledged`, or `reviewed` unless a future explicit reopen design is
implemented. Do not create replacement active rows from terminal rows as a
workaround.

Mailbox summary verification should confirm:

- public/default mode does not expose `augnes_get_mailbox_summary`
- bridge mode exposes `augnes_get_mailbox_summary` as read-only
- summary output includes `structuredContent.mailbox_summary` and explicit
  boundaries for derived view only, no mailbox status update, no state
  commit/reject, no Codex execution, no external publication, and no proof
  recording
- repeated summary reads create no `action_records`, `work_events`, pending
  proposals, committed state transitions, or mailbox status changes

## Bridge-gated cross-session read tools

When `AUGNES_ENABLE_AGENT_BRIDGE=true` and `AUGNES_API_BASE_URL` points at a
running Augnes runtime with the cross-session continuity routes, the bridge
also exposes these read-only tools:

- `augnes_get_evidence_pack` -> `GET /api/evidence-pack`
- `augnes_get_session_trace` -> `GET /api/sessions/trace` or `GET /api/sessions/{session_id}/trace`
- `augnes_get_verification_evidence_records` -> `GET /api/evidence/records`

These tools are read-only continuity views. They do not bind, create, or update
sessions; create evidence rows; approve, publish, or replay publications;
commit or reject Augnes state; call GitHub or OpenAI; or execute Codex.

## Bridge-gated publication summaries

When `AUGNES_ENABLE_AGENT_BRIDGE=true` and `AUGNES_API_BASE_URL` points at a
running Augnes runtime, the bridge exposes `augnes_get_publication_summary`.

Use it when a user asks for publication previews or delivery status:

```json
{
  "scope": "project:augnes"
}
```

The tool calls the runtime `GET /api/publications/summary` endpoint and returns
`structuredContent.publication_summary`.

`augnes_get_publication_summary` has been verified in ChatGPT Developer Mode via
PR #66. It is still a bridge-gated read-only summary tool; it does not publish,
approve, retry, or authorize anything.

Answer pattern:

```text
Publication summary
- Summarize publication previews and delivery status.
- Call out failures only as bounded review context.
- Compare with the runtime summary endpoint when verifying Developer Mode.

Authority boundary
- This is a derived read-only view.
- It does not approve, publish, retry, or record proof.
- It does not commit/reject Augnes state or execute Codex.
- It does not mutate GitHub PR reviews, labels, titles, bodies, or merge state.
```

Do not expose this tool in public/default mode. Public/default mode also must
not expose publication approval, publish, retry, proof-recording, state-commit,
or Codex-execution tools. Live GitHub posting requires a separate approved test
slice with a specific target, scoped `GITHUB_TOKEN`, unique `idempotency_key`,
and replay check proving no duplicate comment. PR #67 completed the first live
GitHub adapter test and kept the test comment as evidence; that test does not
authorize automatic posting in future PRs.

## Bridge-gated publication decision cards

When `AUGNES_ENABLE_AGENT_BRIDGE=true` and `AUGNES_API_BASE_URL` points at a
running Augnes runtime with the Control Packet API, the bridge exposes
`augnes_get_publication_decision_card`.

The tool calls `GET /api/control/brief?scope=project:augnes` and returns
`structuredContent.decision_card` with publication items, delivery status,
pending user decisions, active risks, safe next steps, and authority
boundaries. It is a read-only decision surface: it does not approve, publish,
retry, record proof, commit/reject state, execute Codex, mutate GitHub, or post
to Discord.

## Inspector and ChatGPT

Run MCP Inspector against the local server:

```bash
npm run inspect
```

Typical developer-mode flow:

1. Start the app locally with `npm run dev` for mock mode or `npm run dev:file` for file mode.
2. Expose it over HTTPS with Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:8787
```

3. Add the public Developer Mode endpoint in ChatGPT:

```text
https://<tunnel-host>/mcp
```

4. Confirm the widget renders while the plain text output remains useful on its own.

Runbooks:

- [Developer Mode Runbook](docs/07_DEVELOPER_MODE_RUNBOOK.md)
- [Work Tools Live Validation](docs/08_WORK_TOOLS_LIVE_VALIDATION.md)
- [First Run Validation](docs/08_FIRST_RUN_VALIDATION.md)
- [Codex Completion Protocol](docs/09_CODEX_COMPLETION_PROTOCOL.md)
- [Real Read Path Plan](docs/09_REAL_READ_PATH_PLAN.md)
- [Widget Security Review](docs/10_WIDGET_SECURITY_REVIEW.md)
- [Agent Bridge Local Runbook](docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md)

## ChatGPT App state assistant flow

When bridge mode is explicitly enabled with `AUGNES_ENABLE_AGENT_BRIDGE=true`, the ChatGPT App should answer human-facing Augnes state questions by calling `augnes_get_state_brief` first and using its read-only project and work summaries.

Use the brief for plain questions such as:

- Where are we?
- What should I do next?
- What should Codex do?
- What needs my approval?
- What is risky or blocked?

Answer in plain language first: current status, next step, why, and needs-your-decision or blockers. Raw state keys belong only as secondary grounding under a short `Reference` or `Grounding` note. Do not emit packet-copy material or request result paste.

The app must not add direct commit/reject tools, autonomous Codex execution, hosted auth flows, or new runtime lifecycle semantics. Public default behavior remains the nine legacy read-only tools plus the two WorkBrief reads. The explicitly enabled Bridge has its own registration gates; presentation profile never grants authority.

See [Using the ChatGPT App as the human-facing Augnes assistant](docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md#using-the-chatgpt-app-as-the-human-facing-augnes-assistant) for the full answer pattern and example.

## Verification

Local smoke coverage is intentionally small:

- config loads
- profile config defaults to `public`, accepts `chrono_lab`, and rejects invalid values clearly
- `/healthz` includes the active profile without unsafe identifiers
- widget resource declares the expected v2 URI and narrow CSP metadata
- widget avoids storage, eval, and direct browser network APIs
- sanitizer strips review-unsafe keys
- mock adapter returns all public read models
- public tool names remain the intended nine
- HTTP adapter failures return stable sanitized errors
- invariants assert exact tool names, read-only annotations, and sanitizer ID preservation
- file-backed Working View, Casefile, Search, Fetch, Continuity Report, Boundary Packet, Strategy Rationale, and Governance Audit read fixtures and fail clearly for missing or invalid files at method call time
- `start:file` env resolution points to existing fixture files

This is a read-first starter app, not a write-capable automation surface.
