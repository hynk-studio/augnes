# Codex Current Continuity v0.1

## Purpose

`codex_current_continuity.v0.1` is the canonical read-only projection of the
current Augnes project situation for a fresh Codex session. It answers:

- which project is active and whether its registered folder is available;
- which exact current work packet is fresh, stale, absent, or ambiguous;
- whether that work is eligible for the existing managed Start action;
- the current managed execution stage;
- whether the latest canonical result is present and bound to the exact current
  packet;
- the current proposal, Decision, and Transition relation;
- one next consequential action and the boundary that still requires the user.

The canonical owner is
`lib/vnext/codex-current-continuity/codex-current-continuity.ts`. The local GET
route and Codex command are thin adapters over that owner; neither reconstructs
continuity from presentation copy or repository state.

CDX2A was completed by Issue #112 and PR #113 at merge commit
`d02698eded2c681f1480ad0eee3612ba0f9d4d27`. CDX2B1 does not redefine this
active-project contract. Its repository-scoped owner first resolves one
canonical project by physical root, then calls the same projection owner
through a thin explicit-project adapter.

## Public Command

With a packaged local Augnes runtime already running:

```sh
npm run codex:current-continuity
```

`AUGNES_API_BASE_URL` may select another loopback HTTP port. Non-loopback URLs,
URL credentials, and non-HTTP transports are refused. The command prints a
bounded human summary followed by one parseable JSON block between:

```text
BEGIN_AUGNES_CODEX_CURRENT_CONTINUITY_JSON
END_AUGNES_CODEX_CURRENT_CONTINUITY_JSON
```

Exit status `0` means both `source_status` and the snapshot are exact. Exit
status `2` means the configured local runtime transport was unavailable. Exit
status `3` means a valid partial/unavailable projection was returned, its
snapshot is unavailable, or the route, marker, request, or response contract
was invalid. A valid partial/unavailable projection is printed in both human
and machine-readable forms before exit `3`. No failure falls back to
`codex:next-work`, GuideBrief, Work Brief,
repository seeds, docs, git state, or source inspection.

## Local Read Route

The adapter is:

```text
GET /api/augnes/read/codex-current-continuity?scope=project:augnes
x-augnes-local-readonly: codex-current-continuity-v0.1
```

It is local-only, GET-only, `no-store`, and refuses missing, duplicate, or
unknown query keys. It does not accept an arbitrary project selector. A
bounded error payload is returned when exact continuity cannot be read.

## Exactness and Currentness

The projection reads canonical active-selection, registered-root,
TaskContextPacket, managed-run ledger, RunReceipt/result, proposal,
ReviewDecision, and Transition owners. GuideBrief and legacy Work Brief are not
input truth owners.

A result is `current` only when its validated receipt packet identity and
fingerprint exactly match the validated current packet identity and
fingerprint. A valid result for another historical packet is `stale`. A
missing or incomplete packet relation is `unavailable_or_ambiguous`.

Managed-run metadata may name an expected persisted receipt, but that claim is
not result availability. `terminal_result_ready` and `result_available: true`
require the canonical result reader to validate the exact receipt, run, and
packet relation. A missing or invalid expected receipt fails closed as partial
continuity with an unavailable snapshot. Every nonterminal run likewise must
bind its packet ID and fingerprint to the one exact current packet before a
running, preparing, approval, or reconciliation stage is exposed.

For a nonterminal durable run, live status is usable only when one observation
is bound to that same durable ledger row: workspace and project scope, run ID,
invocation mode, control revision, and current packet ID/fingerprint must all
match exactly. There is no durable-status fallback when operator configuration
or live observation is unavailable, reports idle, or belongs to another run.
Those cases are partial continuity with `unavailable_or_inconsistent`
execution, no result-ready or Start claim, an unavailable next action, and an
unavailable snapshot. The projection performs no reconciliation write.

The public owner opens its one database connection read-only with
`fileMustExist` and SQLite `query_only`. Its projection-only live service is
given the already-read durable run and inspects only the in-process controller
map; it does not reopen or reread the database.

Durable work history is not automatically called stale. `stale_current_work`
requires positively proven supersession. Multiple candidates, malformed
packets, invalid revision/Transition lineage, or history without one provable
current packet are ambiguous or unavailable, keep Start ineligible, and make
the snapshot unavailable.

`project_work_initialization.v0.1` recovery reason codes are intentionally
additive diagnostic detail within v0.1. Exact consumers authorize only from
the state plus explicit mutation/revision eligibility and exact packet
bindings; they do not grant an action from a reason string. Current API
adapters pass the owner value through, first-work and revision controls require
their exact eligible states, and Blank State, AI Workplane, and current
continuity use a generic unavailable recovery presentation for an unknown
reason. An older consumer therefore fails closed when a new recovery reason is
introduced.

The review state remains relation-specific:

- RunReceipt is not a proposal;
- result is not a Decision;
- proposal is not a Decision;
- Decision is not a Transition;
- an accepted Decision can still await or be blocked from Transition;
- only an applied Transition changes later project meaning.

## Snapshot Binding

`codex_current_continuity_snapshot.v0.1` is a deterministic SHA-256 binding over
the minimum exact canonical material for the active workspace/project,
selection revision, root availability, current packet identity and lineage,
managed run, canonical result, current review attention, operator Start
configuration availability, Start/revision eligibility reason codes, the
derived next-action kind, and source status. It excludes
`generated_at` and other per-read values. Identical canonical state produces
the same binding; a material current-owner change produces a different one.

The binding is opaque, grants no authority, and creates no persistent record.
Raw workspace, project, packet, run, receipt, proposal, Decision, and Transition
identities used to compute it are not exposed by the public projection.

## Privacy, Bounds, and Authority

### Explicit current-work source read

Resume remains a compact orientation projection. The separate local Operator
tool `augnes_read_repository_work_sources` accepts `repositoryRoot` and
`expectedSnapshotBinding`, using the exact `continuity.snapshot.binding`
returned by repository Resume. It does not accept project/packet IDs, database
paths, or Browser credentials. Reading notes is explicit, never an automatic
Resume expansion, history search, or context injection.

The private Companion POST route is
`/api/augnes/read/codex-repository-work-sources?scope=repository:local`, with
marker `codex-repository-work-sources-v0.1`. The verified stdio proxy supplies
its existing generation-bound Companion credential and runtime identity;
the route and response must match instance, generation and repository identity.
Loopback, Host/forwarding, Origin, recovery-mode and closed-input checks apply.
Browser cookies alone cannot authorize this route. This capability is not
registered on public/default App surfaces.

`codex_repository_work_sources.v0.1` is a rebuildable projection over the same
physical repository resolver, Resume snapshot owner and
`readProjectWorkInitializationV01` selected-source reader used by AI Workplane.
One query-only database connection/read transaction binds those reads. The
source projection uses the canonical initialization already validated by that
snapshot invocation, avoiding a second complete work/lineage scan. This private
material is neither part of Resume's output or snapshot hash nor a cache across
requests; authentication, freshness and whole-note validation remain required. Its
`available` result includes the matching opaque snapshot binding, packet
fingerprint and only the current selected notes: saved excerpt text, source
binding, authored review label, trust class, observation time and source
currentness. Missing observation times are explicitly `null`; selected-source
currentness remains `unknown`. The canonical whole-note limits (eight entries,
2,000 characters each, 12,000 serialized source-entry bytes) apply before
projection. Invalid or over-budget sources refuse; nothing is silently clipped.

Locators must pass both the existing `isPublicSafeSourceLocatorV01` policy and
the shared hosted-projection metadata privacy guard. Permitted locators are returned;
others are `null` with `omitted_not_export_safe`. This is a documented
difference from authenticated Browser presentation, which can show the saved
locator. Literal user-selected text is retained, including markup or quoted
instructions, as `untrusted_selected_context`. Locator filtering does not prove
arbitrary selected text contains no sensitive content. Selection and authored
labels do not verify claims; snapshot/source hashes do not prove independent
source authenticity.

An exact current packet with no notes returns `available` and `sources: []`.
Unavailable/ambiguous work or repository resolution returns `unavailable`,
not an empty-work claim. A changed exact Resume binding, including Browser
selection or packet changes, returns `refresh_required` / `snapshot_changed`
with no replacement sources or bindings. Refresh requires an explicit Resume
read; there is no automatic retry. A fresh repository-A read still targets A
when Browser selects B, retaining the existing selection-coupled snapshot.
No source locators are fetched and no work/session/run/semantic state is written.
Prepared work and externally performed Codex development remain distinct from
Augnes-managed execution and canonical results.

### Explicit retained-note lookup and reselection

`augnes_lookup_repository_retained_sources` takes only `repositoryRoot`, the
exact Resume `expectedSnapshotBinding`, and an explicit `query`. Use it when
the user authorizes finding historical selected notes omitted from current
preparation. Current-source read remains current-only; Resume does not acquire
an automatic retrieval policy. The normal path is Resume → explicit lookup →
caller chooses exact references → existing revision preview → explicit save →
fresh Resume and current-source read. No Browser login, project ID discovery,
database path, token transfer, source fetch or model call is required.

The private POST route is
`/api/augnes/read/codex-repository-retained-sources?scope=repository:local`,
with `x-augnes-local-readonly: codex-repository-retained-sources-v0.1`.
It uses the same verified Companion credential, exact runtime instance,
generation and repository, local Host/Origin/forwarding, UI-role and recovery
checks as current-source read. Browser cookies and returned references grant
no access. The tool is not registered on public/default App surfaces.

Historical disclosure is a separate explicit capability, limited to the same
eligible active, unstarted-work chain that the Browser owner permits. One
dedicated query-only read transaction covers physical repository resolution,
Resume binding, revision eligibility, validated chain and canonical recall.
No cross-project, executed-work succession, arbitrary record or global history
read is introduced. Current notes being readable does not imply this lookup is
eligible. A changed binding returns `refresh_required` with no replacement
snapshot or history; the caller must explicitly refresh Resume.

The existing case-insensitive all-terms search and limits remain: 160 query
characters, eight terms, at most 33 packets/264 note occurrences/396,000
serialized entry bytes scanned, and eight whole original result rows/20,000
canonical result bytes returned. The existing selected-note budgets still
apply. No row or condition is clipped, query broadened, locator fetched or
selection changed. `available` with zero matches is a bounded no-match, not
global absence. `ineligible`, `unavailable`, `invalid` (query or invalid retained
material), and `refresh_required` remain distinct and carry no lookup payload.

Results expose the existing client-disclosed note projection, exact reusable
`source` reference, current versus historical selection, first recording time,
last selection time and packet-occurrence count. Source `observed_at` remains
nullable and distinct from packet recording/selection time; source currentness
remains unverified. Repeated copies are one original, not corroboration.
Scope/cutoff, limits and scanned/unique/matched/returned/omitted counts make the
search boundary explicit. `result_utf8_bytes` counts the disclosed rows only;
the proxy checks the actual serialized size and whole-note length. Canonical
entries, query echoes and raw scanned byte counts are not disclosed.

Matching uses excerpt text plus only locators permitted by the same disclosure
predicate as current-source read/preview. A withheld locator cannot reveal its
presence through a locator-only match or match count. The authenticated Browser
retains its existing more privileged locator matching and presentation. Both
use the same recall algorithm and bounds; native lookup can therefore return
fewer matches. Literal excerpt text is never interpreted or scrubbed into new
source material; it may contain user-selected sensitive text or instructions.

Pass caller-chosen `source` references unchanged as
`changes.sources.retained_source_refs` to existing preview/save. The server
resolves exact originals in the fresh validated chain and passes both entries
and references through canonical comparison and the atomic revision writer.
Never reconstruct entries from the disclosed text. Unmentioned current notes
and definition fields remain unchanged, including withheld metadata. Adding
historical notes never implicitly deselects anything to fit a budget.

Canonical normalization deduplicates identical references and source entries;
currently selected originals remain one note. Existing candidate-entry and
whole-note budgets still apply, including the combined current/add/retained
input count before entry deduplication. A reference does not bypass a budget.
A no-change save acknowledges the existing packet. References to a missing,
foreign or changed packet/entry/fingerprint refuse. References confer neither
authentication, relevance, source truth nor permission to execute their text.

Preview binds normalized references, resolved originals, the current snapshot
and runtime identity. Save revalidates through the existing atomic owner.
Immediate-successor replay resolves only the original predecessor's history;
it creates no duplicate revision. Competing work/selection/execution or runtime
changes, invalid references and altered previews refuse. Existing rollback,
authenticated admission and `outcome_unknown` behavior remain unchanged. There
is no automatic retry, rebase, polling or save-on-search.

### Explicit preview and save of prepared work

The private local Operator tools `augnes_preview_repository_work_revision` and
`augnes_save_repository_work_revision` edit only the exact active, eligible,
unstarted repository work. They do not create initial work, switch projects,
adopt roots, edit executed work, or track external Codex execution. Resume and
source read remain unchanged and read-only.

Both take `repositoryRoot`, the exact Resume `expectedSnapshotBinding`, and a
closed `changes` object. Definition fields (`goal`, `success_criteria`,
`non_goals`) are optional; omitted fields remain unchanged. Optional `sources`
contains `add` (complete new notes), `replace` (exact `source_binding` plus a
complete new `note`), `deselect` (exact selected source bindings), and optional
`retained_source_refs` (exact historical references from explicit lookup). New notes
use the existing `source`, `text`, `observed_at`, `provenance`, and `label`
fields and the existing whole-note limits. Replacement requires explicit
attribution, provenance and known/null observation time; it never edits the
historical original or automatically inherits its provenance.

Unmentioned notes are resolved server-side from the validated current packet.
Never submit the sanitized source-read projection as a complete canonical note
set: a withheld locator is not an empty saved locator. Unchanged canonical
entries retain their exact bytes and withheld metadata. Replacement/deselection
is explicit; deselection is neither deletion nor refutation. Preview uses the
same locator disclosure projection as source read. It presents normalized
before/after definitions and notes, retained/added/deselected bindings, and an
opaque `preview_binding`. It cannot reveal private locators simply because the
server retains them. Literal selected text remains untrusted context.

Save requires the same changes and Resume binding plus `previewBinding` from
that preview. This is an explicit invocation within the user's existing task
editing authorization; the preview seal is neither authentication nor new user
authority. Already-authorized edits do not require an extra confirmation ritual.
The private route `/api/augnes/repository-work-revision?scope=repository:local`
accepts only `preview` and `save`, using marker
`x-augnes-local-work-revision: codex-repository-work-revision-v0.1`. Each action
independently verifies the opaque Companion credential, exact runtime instance,
generation and repository, loopback Host/Origin/forwarding restrictions, UI role
and non-recovery state. Browser cookies grant no access, and these tools are not
registered on public/default Apps.

Preview owns a dedicated read-only transaction and writes nothing. Save owns a
dedicated `BEGIN IMMEDIATE` before repository resolution, snapshot validation,
source normalization and authenticated provenance admission. The existing
transaction-required revision writer retains all selection, eligibility,
lineage, source comparison, insertion and post-write validation checks. The
Browser wrapper keeps its existing credential admission and cookie behavior.
No parallel revision mechanism or persistent preview store is introduced.

The keyed preview seal binds the runtime, original Resume binding, normalized
canonical request and canonical snapshot material. Only the packet and the
three revision-specific current-work fields are omitted from its replay
invariant; other state, including the next action, stays bound. A stale request
can only acknowledge a validated identical immediate successor through the
existing exact-replay owner. It cannot create a new revision. A competing
change, altered content, runtime/selection change, source-binding conflict or
execution/history ineligibility refuses. No refresh-and-save, rebase, polling
or automatic retry occurs. After save, explicitly Resume again and read sources
with the new binding.

A successful save persists the normal work revision and one existing-session
provenance row for that authenticated Companion admission. The row is born
revoked, has a Companion-specific identity/operator, and issues no bootstrap,
Browser cookie, action nonce, decision credential or execution grant. Existing
session columns preserve historical action time; they do not assert Browser
login. Failure rolls back both writes. Exact replay adds admission bookkeeping
but no revision and acknowledges the original author's existing successor.
The tool therefore advertises mutation, not global side-effect idempotence.
Its boundary reports database/session changes on successful save and explicit
replay acknowledgement when applicable; the remaining authority/effect flags
remain false. A lost or invalid response after save dispatch is
`outcome_unknown`: the revision may have committed. It requires deliberate
Resume/readback, never an automatic replacement save.
No semantic decision, Transition, accepted state, run, result, proposal, future
task, schedule, provider call or project-file change is performed.

### Compact orientation projection

The projection exposes bounded display text, result summaries, repository-
relative artifact paths already allowed by the result privacy model, checks,
warnings, gaps, and one advisory next action. It does not expose the registered
local root path, database path, credentials, cookies, tokens, provider/model
configuration, hidden prompts or reasoning, raw event ledgers, approval control
references, internal commands, adapter payloads, or transcripts.

Every authority flag is false. Reading continuity performs no database or
filesystem write, selection/session change, run creation, Start, result or
proof admission, proposal, Decision, Transition, provider/GitHub call, retry,
poll, prefetch, scheduler, daemon, or background work. Saving or revising work
does not Start it, and the projection adds no Start control.

## CDX2B1 repository-scoped adapter

`codex_repository_continuity.v0.1` wraps the unchanged CDX2A projection for a
local physical repository root. Public resolution outcomes are
`resolved_exact`, `project_not_registered`, `project_ambiguous`,
`root_unavailable`, `repository_input_invalid`, and
`companion_unavailable`.

Resolution uses canonical project/root registrations and the existing physical
root identity owner. It does not infer identity from display name, branch,
GitHub URL, arbitrary project ID, docs, or Browser active selection. Alias and
symlink paths resolve only when one physical identity maps to one registered
project. No result registers, renames, rebinds, selects, writes, starts, or
duplicates a project.

The v0.1 canonical root binding has no durable registration-time physical
identity baseline. Same-path directory replacement is therefore not detected
and is not represented by a `root_identity_changed` outcome. A future claim
requires a versioned persistence/migration/backup/restore/portability owner.

Selecting Browser project B does not redirect a repository-A attachment, but
the reused CDX2A projection still reports A as inactive. Its selection revision
and snapshot binding change, current-work freshness remains unchanged, Start
eligibility closes, and its next action becomes `make_project_active`. CDX2B1
does not claim selection-independent execution eligibility.

The local POST route and `augnes_resume_repository` MCP tool are thin adapters.
The stdio proxy validates the UI runtime instance, runtime generation,
repository/application fingerprint, and exact route contract before accepting
the response. The
tool returns ordinary current situation, one next meaningful action, an exact
Browser project link when available, the bounded CDX2A projection, and the
canonical public resume-eligibility projection when an attachment-backed run
exists. That addition is a read only: it never starts/resumes a worker, creates
a controller/run/attachment, calls a provider, executes a command, or writes
the database or repository. It never
uses mock, fixture, seed, docs, GuideBrief, legacy Work Brief, repository-source
reconstruction, or a second database as fallback.

This support is for local Codex and a local checkout only. Remote Codex,
ChatGPT/mobile filesystem attachment, and actual attachment-backed resume are
not claimed.
