# Canonical Browser verification ownership v1

Status: VFY1-B project-experience extraction with legacy-core shadow retained.
The governing roadmap is
[Issue #103](https://github.com/hynk-studio/augnes-perspective-lab/issues/103).
VFY1-C and VFY1-D remain unimplemented.

The machine-readable authority for the exact counts, field/marker membership,
owner assignments, dependency edges, and future resource requirements is
[`scripts/browser-verification-ownership-inventory.v1.json`](../scripts/browser-verification-ownership-inventory.v1.json).
The focused static contract is
[`scripts/test-browser-verification-ownership-inventory.mjs`](../scripts/test-browser-verification-ownership-inventory.mjs).

## Purpose and boundary

The legacy Browser verifier is one long-lived harness. It builds one fixture,
opens one writable database, starts and restarts one supervised runtime, drives
one Chrome process and CDP session, accumulates one browser/session history,
and cleans one shared resource graph. Its current behavior is valuable and is
not reduced in VFY1-B. VFY1-A made that behavior and coupling reviewable;
VFY1-B adds the first independently runnable detailed owner without changing
the legacy execution path.

The new `project_experience` child is an independent executable, fixture,
writable database, runtime, browser, CDP session, profile, port set, and cleanup
graph. It is focused evidence only and is not selected by the Local Canonical
planner or aggregated into a deciding receipt yet.

## Explicit non-goals

VFY1-B does not:

- remove, skip, weaken, or reorder any legacy Browser assertion;
- change the legacy Browser source, scopes, result shape, markers, phases,
  timing identifiers, or `480000ms` core bound;
- delete or shorten `e2e-core`;
- implement the operator/execution shard, thin golden path, or aggregate
  planner/receipt integration;
- change Local Canonical planner selection or receipt deciding semantics;
- change product, UI, API, schema, Core, protocol, runtime, native-host, or
  authority behavior.

## Triggering evidence

[PR #102](https://github.com/hynk-studio/augnes-perspective-lab/pull/102)
recorded the motivating exact-head evidence without reclassifying it as a
pass:

- a standalone `e2e-core` diagnostic exited naturally in `478668ms`, with
  closed streams, complete cleanup, and zero owned-process residue;
- exact-head Local Canonical core executions completed every reported
  functional phase but reached the unchanged `480000ms` child bound while
  cleanup and stream settlement were still completing;
- focused CUX6B and continuity Browser lanes passed naturally with zero
  residue;
- no assertion failure, product defect, orphan process, cleanup leak, or
  generated `.next` residue was established;
- the sequential executor correctly left later continuity evidence unrun after
  the core child failed.

The conclusion is architectural: the core child contains too many independent
responsibilities and too much shared mutable state for one bounded owner. It is
not permission to widen timeouts, retry until lucky, or remove coverage.

## Machine-checked current counts

At the authorized VFY1-A baseline, the contract records:

| Inventory | Count |
| --- | ---: |
| Browser validation scopes | 4 |
| Stable `runPhase(...)` identifiers | 11 |
| Coherent responsibility groups | 16 |
| Static `assert...(...)` calls | 1,070 |
| Result fields declared in the initializer | 204 |
| Result fields added later by direct assignment | 17 |
| Complete top-level output field surface | 221 |
| Significant `record(...)` markers | 101 |
| Timing kinds | 14 |
| Timing milestones | 17 |
| Coverage-equivalence families | 22 |
| Encoded cross-phase dependency edges | 12 |

The distinction between 204 declared and 221 actual output fields matters. The
prior harness contract fingerprinted only the initializer. VFY1-A adds a shared
dependency-free extractor so both the existing harness contract and the new
ownership contract cover the complete static output surface.

The reviewed extractor reported 99 markers because its one-line regular
expression omitted two existing multiline calls:
`contextual_inspector_route_errors_preserve_missing_conflict_and_unavailable`
and
`contextual_inspector_exact_status_remains_primary_for_inactive_projects`.
The corrected count is 101. Both values and their executable call sites already
existed in the reviewed harness; this correction changes no Browser behavior.

## Fail-closed source grammar

The shared extractor is a bounded lexical scanner, not a general JavaScript
parser. It removes comments and string/template contents from the source token
stream, balances call arguments, and accepts only these declared forms:

- exactly one `const result = { ... }` initializer with unquoted identifier
  keys and explicit colons;
- line-leading `result.identifier = value` assignments, plus the established
  `+=` update for already-declared counters; only `=` may introduce one of the
  17 dynamic output fields;
- line-leading mutation of an already-declared result collection by the
  existing bracket assignment or `.push(...)` form;
- no other `result` assignment target: whole-result, computed top-level,
  parenthesized, destructured, `delete`, prefix/postfix update, `for...of`,
  `for...in`, alias, spread, helper, and indirect targets all fail;
- direct `record(...)`, `runPhase(...)`, `timing.start(...)`,
  `timing.duration(...)`, `timing.milestone(...)`, and
  `recordLongWait(...)` calls with an unescaped double-quoted literal in every
  extraction-bearing argument position;
- the single exact `timing.duration(kind, ...)` forwarder inside the declared
  `recordLongWait(kind, label, startedAt)` helper;
- exact canonical declarations for `record`, `runPhase`, `recordLongWait`, and
  the `timing` recorder; every reference to those extraction-sensitive owners
  must be a declaration, a directly extracted call, or an explicitly declared
  non-extraction reference;
- the only non-extraction references are the six lexically scoped uses of the
  established local process-record variable inside `terminateProcess(...)`
  and the one exact `timing.summary()` result projection;
- exactly one inline double-quoted validation-scope array followed by
  `.includes(VALIDATION_SCOPE)`.

The initializer and dynamic field sets remain separate and their union is the
221-field output surface. Ordinary declared `result.field` reads do not add
fields. Bracket/computed top-level assignment, `Object.assign`,
`defineProperty`, object spread, aliases, destructuring, helper mutation,
unknown collection mutation, computed call identifiers, alternate quote
forms, and alternate validation-scope declarations fail as unsupported
syntax. Raw relevant-call counts must equal the successfully extracted call
counts; no call may silently disappear.

The callee-reference audit is direct-call-only. Aliasing or extracting an
owner or tracked timing method, passing or returning it as a value,
reassigning it, destructuring it, optional or bracket access, computed
invocation, and `.call`, `.apply`, or `.bind` all fail. The audit permits the
current `timing.summary()` path without treating unrelated `timing` methods as
extraction calls. Template-expression references are audited separately so
they cannot disappear behind the scanner's template-content exclusion.

The current raw call-site inventory is 101 `record` calls, 12 `runPhase`
calls over 11 stable identifiers, 4 `timing.start` calls, 6
`timing.duration` calls including one declared forwarder, 17
`timing.milestone` calls, 6 `recordLongWait` calls, and one validation-scope
declaration.

The current sensitive-reference classification is: `record` has one
canonical declaration, 101 canonical direct calls, and six explicitly scoped
local process-record references; `runPhase` has one declaration and 12 direct
calls; `recordLongWait` has one declaration and six direct calls; `timing` has
one declaration, 27 direct tracked-method calls, and one supported
`timing.summary()` reference.

The dependency-free contract contains 57 synthetic negative fixtures covering
the refusal matrix below:

| Unsupported form | Contract result |
| --- | --- |
| Bracket/computed result assignment | fail |
| `Object.assign` or `Object.defineProperty` result mutation | fail |
| Aliased, helper, destructured, or spread result mutation | fail |
| `delete`, prefix/postfix update, or parenthesized result target | fail |
| Direct, bracket, or destructured `for...of` / `for...in` result target | fail |
| Computed `record` marker | fail |
| Single-quoted or template-literal marker | fail |
| Aliased, passed, returned, reassigned, optional, or computed `record` reference | fail |
| `record.call(...)`, `record.apply(...)`, or equivalent indirect invocation | fail |
| Computed `runPhase` identifier | fail |
| Aliased or indirect `runPhase` / `recordLongWait` invocation | fail |
| Computed timing kind or milestone | fail |
| Aliased timing object, extracted/bound method, optional call, or bracket/computed method | fail |
| Noncanonical validation-scope declaration | fail |
| Computed, alternate-quote, aliased, or duplicate detailed-field completion | fail |

The harness SHA-256 remains a broad whole-source change tripwire. A SHA change
is not coverage classification, and updating the stored SHA alone can never
restore completeness. Every newly supported output field, marker, phase,
scope, timing kind, and milestone must first be extracted and assigned in the
inventory; unsupported syntax fails instead of disappearing from metadata.

## Current scopes

| Scope | Current entry | Current membership |
| --- | --- | --- |
| `core` | `npm run test:e2e:core` | Core branch, excluding continuity-only phases and continuing beyond the focused CUX6B return. |
| `cux6b` | `npm run test:e2e:cux6b` | Fixture/setup plus `folder_onboarding` through first-work definition and explicit start, then focused quiet/integrity checks. |
| `continuity` | `npm run test:e2e:continuity` | Activates the transferred fixture project, skips core-only work, and runs shared multi-candidate plus continuity-only phases. |
| `complete` | Direct harness invocation without a scope variable | Core and continuity branches in one mutable lifecycle. It is not a package-registered Canonical lane. |
| `project-experience` | `npm run test:e2e:project-experience` | Independent VFY1-B detailed owner for the five project-experience families. It does not run through the monolithic lifecycle. |

`npm run test:e2e` currently launches separate `core` and `continuity`
children. Local Canonical full execution likewise selects `e2e-core` followed
by `e2e-continuity`. The planner, executor, and receipt are unchanged in
VFY1-B and do not select `e2e-project-experience`.

## VFY1-B implemented project-experience owner

`scripts/browser-validate-project-experience-v1.mjs` is registered as the
bounded `e2e-project-experience` Canonical child with a `360000ms` limit. The
package command reports natural exit, exit code, stream closure, cleanup,
owned-process residue, termination reason, and duration through the existing
Canonical child runner.

The implementation derives its detailed ownership from the VFY1-A inventory,
not a second hand-maintained list. It covers exactly five families, 40 detailed
fields, and five semantic markers:

| Detailed family | Fields | Markers |
| --- | ---: | ---: |
| `project_onboarding_and_naming` | 11 | 1 |
| `project_home_lifecycle_presentation` | 11 | 1 |
| `project_shell_and_locked_entry` | 4 | 1 |
| `retired_route_safety` | 2 | 1 |
| `responsive_product_shell` | 12 | 1 |

The fail-closed static profile extracts one validation scope, 87 classified
top-level output fields, five literal markers, seven phase calls over seven
phase identifiers, 12 timing kinds, and two milestones from the new source.
The contract rejects foreign operator/execution or continuity detailed fields,
requires all 40 owned fields and all five markers, requires every output field
to have one classification, verifies the command/suite/source binding and
resource declarations, and records the old core coverage as temporary shadow
rather than a second primary owner.

### Field-keyed completion and semantic equivalence

Detailed completion is no longer an integer counter. The child loads the exact
40-field owner set from the inventory, records each successful assertion as
`completeDetailedField("literal_field_id")`, refuses duplicate or foreign
fields, and requires exact final set equality. The bounded static extractor
allows only that canonical double-quoted direct-call grammar and its one exact
function declaration. Computed IDs, aliases, alternate quotes, indirect calls,
duplicate call sites, missing fields, and foreign-owner fields fail the
contract. The successful result exposes the sorted completed IDs and their
SHA-256 set fingerprint.

The inventory's `detailed_field_equivalence` array is the exact 40-row
legacy/new map. Every row binds its coverage family, legacy phase and source
anchor, new-shard phase and source anchor, externally observable invariant,
fixture difference, exact-or-stronger status, mechanism justification, and
runtime value contract. Thirty-eight rows are exact; the management keyboard
and inspectable viewport collection rows are deliberately stronger without
weakening the legacy shadow.

In particular, `guide_brief_cross_surface_consistency` once again requires the
complete legacy invariant: ChatGPT and Codex agree on goal, constraints, and
judgment; AI Workplane and both host projections agree on human attention; and
the Blank State and AI Workplane GuideBrief project, focus, authority, and
projection identities agree. Locked-shell shape or private-material absence
alone cannot complete that field.

The final-value gate is also field-aware. Boolean details must be exactly
`true`; the onboarding destination must be a canonical project route; unknown
Project Home status must meet the exact accepted status contract; retired
routes must equal the complete nine-route matrix; ProductShell route and
responsive results must equal their four-route/eight-entry matrices; viewport
results must equal the exact 26-entry surface/viewport matrix; and viewport
warnings must be empty.

### Staged success, cleanup, and outer child acceptance

The child keeps `ok: false` throughout functional execution and cleanup. It
then finalizes result, timing, resource, and cleanup evidence and evaluates one
success gate. Only that gate may set `ok: true`. It requires the exact 40-field
completion set, all five markers, exact value predicates, zero unexpected
external requests or console/page/request failures, credential and
private-material safety, no execution or authority-bearing effects, complete
runtime and Chrome/CDP shutdown, closed owned streams, zero owned process and
listener residue, removal of every temporary/profile/database/fixture/picker
root, and total duration below `360000ms`. Failure remains public-safe, exits
nonzero, and preserves all cleanup evidence that could be finalized.

The Canonical suite marks only `e2e-project-experience` as requiring exact
natural exit. Its outer acceptance rejects timeout, nonzero exit, absent exit
observation, open streams, incomplete cleanup, remaining owned processes, and
both descendant-cleanup termination modes. Synthetic runner tests cover every
refusal. Unrelated legacy suites retain their established acceptance behavior.

The result contract identifies the validation owner and fixture version and
fingerprints; preserves the exact 40 legacy field names and meanings; emits
route, viewport, ProductShell, request/response/console, timing, cleanup, and
failure material; and separates product behavior from infrastructure
invariants. The raw console ledger permits at most one narrowly identified,
phase-and-signature-bounded React diagnostic if Chrome restores the
deliberately opened `data-management-safety` disclosure during the keyboard
fragment proof. Any such diagnostic remains visible as
`known_harness_console_warning_count`; every other console error remains
unexpected and fails the child. The finalized correction run observed zero
such warnings.

The legacy `e2e-core` path remains byte-for-byte unchanged and continues to
own its complete 221-field, 101-marker output surface during the migration.
This shadow is removed only in VFY1-D after VFY1-C, the thin golden path,
planner selection, per-owner receipt material, and exact aggregate equivalence
exist.

## Owner taxonomy

Every user-visible or behavioral assertion family has exactly one primary
detailed owner:

- `project_experience` — project connection, identity, lifecycle
  presentation, ProductShell, navigation, responsive behavior, and relevant
  surface safety;
- `operator_execution` — local authentication, explicit operation,
  native-host execution, results, proposal review, ReviewDecision, Transition,
  and exact packet/lineage/authority binding;
- `continuity` — portability, import, restart, recovery, reconciliation,
  persistent lineage, and long-lived project continuity;
- `cross_boundary_golden` — one thin composition path only.

Two non-product classifications are also explicit:

- `per_shard_invariant` — isolation, no-network, no-secret, request quiet,
  natural exit, stream closure, listener/process cleanup, and zero residue;
- `shared_fixture_infrastructure` — immutable fixture construction and static
  metadata. Infrastructure is never used as a substitute for a behavioral
  owner.

## Current responsibility map

One source `runPhase` may contain multiple coherent semantic owners. The
inventory therefore subdivides source phases by behavior rather than assigning
ownership from source order or elapsed time.

| Coherent current group | Source phase(s) | Scope(s) | Proposed primary owner | Key mutable dependency |
| --- | --- | --- | --- | --- |
| Fixture construction | setup | all | shared fixture infrastructure | transferred DB/manifest becomes writable |
| Runtime/browser bootstrap | setup | all | per-shard invariant | shared runtime, ports, Chrome, CDP, profile |
| Project onboarding and naming | `folder_onboarding` | complete/core/cux6b | project experience | active-project selection and project roots |
| First-work definition and start | `folder_onboarding` | complete/core/cux6b | operator/execution | onboarding project, bootstrap/session, packet/run |
| Project controls and automation | `folder_onboarding` | complete/core | operator/execution | control revisions and retained restart |
| Project shell and locked entry | locked Workbench/exact details | complete/core | project experience | active project and locked session |
| Operator session bootstrap | `synthetic_session_bootstrap` | complete/core/continuity | operator/execution | cookie/action credential reused later |
| Strategic analysis/proposal review | `strategic_proposal_review` | complete/core | operator/execution | active project, session, transport fixture/counter |
| Retired-route safety | `retired_routes` | complete/core | project experience | shared authenticated browser and DB snapshot |
| Native-host execution/result review | `direct_host_round_trip` | complete/core | operator/execution | packet, run/result/proposal/decision/Transition chain |
| Long-term lineage/isolation | subsection of direct host | complete/core | continuity | applied Transition, later packet, restarts, project switching |
| Multi-candidate semantic scope | `multi_candidate_transition_scope` | complete/core/continuity | operator/execution | current packet and mixed return target |
| Personal Perspective continuity | onboarding plus Inspector phase | complete/core/continuity | continuity | include/exclude state and exact packet inclusion |
| Responsive ProductShell | viewport helpers plus responsive phase | all | project experience | whatever semantic state the shared browser reached |
| Portability/restart/recovery | retained restart plus final R8 phase | complete/core/continuity | continuity | source/imported DBs, downloads, restarted runtime/session |
| Global quiet/isolation/cleanup | final audit/finally | all | per-shard invariant | accumulated observers and the whole process/resource graph |

Each machine-readable group also records source anchors, assertion families,
semantic markers, fixture inputs, prior mutable state, produced state, routes
and surfaces, session needs, DB/Core/run/Transition needs, runtime/CDP needs,
owned resources, cleanup obligations, golden-path relevance, and assignment
rationale.

## Coverage equivalence

No current result field or semantic marker is dropped. Each of the 221 output
fields and 101 markers appears in exactly one family. Potential redundancy is
documented but is not removed.

| Assertion family | Owner | Result fields | Markers | Future disposition |
| --- | --- | ---: | ---: | --- |
| Fixture identity | shared fixture infrastructure | 10 | 1 | Immutable fixture manifest/fingerprints |
| Cleanup and failure material | per-shard invariant | 13 | 0 | Repeat and attribute per shard |
| Project onboarding and naming | project experience | 11 | 1 | Detailed project shard |
| First-work definition and start | operator/execution | 8 | 0 | Detailed operator shard; one reduced golden case |
| Project Home lifecycle presentation | project experience | 11 | 1 | Detailed project shard |
| Project controls and automation | operator/execution | 11 | 1 | Detailed operator shard |
| Project shell and locked entry | project experience | 4 | 1 | Detailed project shard |
| Operator session bootstrap | operator/execution | 2 | 1 | Shard-local session per authenticated child |
| Strategic analysis/proposal review | operator/execution | 8 | 4 | Detailed operator shard |
| Retired-route safety | project experience | 2 | 1 | Detailed project shard |
| Direct native-host round trip | operator/execution | 6 | 2 | Detailed operator shard; one reduced golden result |
| Live approval lifecycle | operator/execution | 15 | 3 | Detailed operator shard only |
| Result review and Inspector | operator/execution | 34 | 6 | Detailed operator shard; golden stops at proposal visibility |
| ReviewDecision and Transition | operator/execution | 9 | 7 | Detailed operator shard only |
| Long-term lineage/isolation | continuity | 11 | 20 | Detailed continuity shard |
| Bounded automation execution | operator/execution | 6 | 5 | Detailed operator shard |
| Multi-candidate/GuideBrief scope | operator/execution | 20 | 31 | Detailed operator shard |
| Personal Perspective continuity | continuity | 4 | 2 | Detailed continuity shard |
| Responsive ProductShell | project experience | 12 | 1 | Detailed project shard using stable rendered-state inputs |
| Portability/restart/recovery | continuity | 14 | 8 | Detailed continuity shard |
| Session refusal/recovery | operator/execution | 6 | 3 | Detailed operator shard |
| Global isolation and quiet | per-shard invariant | 4 | 2 | Repeat independently in every child |

Result-field classifications are also exhaustive:

| Classification | Count |
| --- | ---: |
| Behavioral assertion | 162 |
| Identity | 11 |
| Counter | 27 |
| Timing/diagnostic | 3 |
| Cleanup invariant | 8 |
| Failure material | 2 |
| Collection/result array | 8 |

The exact keys and markers are intentionally kept in the machine-readable
inventory rather than duplicated into this prose table.

## Hidden dependency graph

The current phases are not independent. Twelve dependency classes are encoded:

| Dependency | Current producer → consumers | Future transfer |
| --- | --- | --- |
| Immutable fixture bundle | fixture builder → most detailed phases | Versioned manifest and fingerprints; copy-on-write DB/source bundle |
| Writable DB accumulation | every mutating phase → every later phase | Forbidden; each shard owns a writable DB |
| Active-project selection | onboarding → first work, controls, shell, strategic, execution | Explicit project/root/revision fixture input per shard |
| Operator session | bootstrap → all authenticated later phases | Forbidden; each shard issues its own bootstrap/session |
| Current packet/lineage | fixture/first work/Transition → execution, continuity, multi-candidate | Immutable exact identity bundle or shard-local production |
| Run/result/proposal chain | execution → review, decision, continuity | Deterministic fixture bundle for detailed review; golden produces one real chain |
| ReviewDecision/Transition chain | decision/apply → continuity and portability | Immutable distinct identities/fingerprints, never collapsed |
| Imported/restarted state | continuity phase → later continuity checks | Remains wholly inside continuity shard |
| Browser navigation/session | bootstrap/navigation → all later phases | No transfer; fresh browser/profile/CDP per shard |
| Server/runtime ownership | startup/restarts → all behavior | No transfer; fresh supervisor and ports per shard |
| Approval/file signals | live execution → approval lifecycle | Operator shard owns signals and trace end to end |
| Temp paths/ports/profile | bootstrap → all phases/cleanup | Unique declaration and cleanup evidence per shard |

The contract prevents a future shard from declaring independence while it
still shares a live database, runtime, browser, CDP session, profile, operator
session, or active-project selection.

## Target detailed shards

Only the project-experience command is implemented in VFY1-B. The remaining
names are specifications for later separately authorized work.

### Project experience

Implemented focused command: `npm run test:e2e:project-experience`

Owns onboarding, project identity/naming/lifecycle presentation,
active/viewed/recovery presentation, project settings entry, ProductShell,
primary navigation, responsive/mobile behavior, and relevant retired-route
safety.

Primary question: Can the user connect, identify, recover, and navigate a
project correctly?

The legacy-core copy is explicit temporary shadow coverage, not another
primary owner and not proof that aggregate migration is complete.

### Operator and execution

Proposed command: `npm run test:e2e:operator-execution`

Owns local authentication/session, first-work operational activation,
strategic/proposal review, direct/live native-host execution,
approval/cancel/resume/reconciliation, result/proposal admission,
ReviewDecision and Transition separation, multi-candidate scope, bounded
automation, and exact packet/lineage/root/authority bindings.

Primary question: Does an authenticated explicit operation follow the exact
packet and lineage through execution, result, and semantic review without
authority collapse?

### Continuity

Proposed command: `npm run test:e2e:continuity`

Owns long-term packet/result/feedback lineage, cross-project isolation,
Personal Perspective continuity, portability, import, restart, recovery,
reconciliation, and persistent project meaning.

### Thin cross-boundary golden path

Proposed command: `npm run test:e2e:golden`

The one permitted path is:

```text
project connection
→ first-work definition
→ explicit Codex start
→ one result receipt
→ proposal visible for review
```

It proves composition only. It excludes the full onboarding matrix, the full
approval/cancel/resume matrix, the full proposal/decision/Transition matrix,
the full portability/restart matrix, all responsive viewports, and all
failure-state combinations. The golden child owns its own runtime, DB,
browser, CDP session, profile, ports, credentials, temporary root, file
signals, streams, and cleanup.

## Fixture boundary

A shared builder may produce immutable material:

- canonical project identity;
- canonical Core record bundles;
- deterministic packet/proposal/Transition fixtures;
- portable immutable source bundles;
- a public-safe versioned manifest and declared fingerprints.

VFY1-B implements this boundary in
`scripts/project-experience-browser-fixture-v1.ts`. It constructs a versioned
immutable source database and manifest, copies the source database into the
child's writable root, and admits presentation-only packet, result, proposal,
Inspector, delegated-work, and recovery context through existing production
builders, persistence owners, admission functions, and validators. The
Browser reads those states through real application routes and production
readers. It does not mock HTML, intercept route JSON, reuse another child's
database/session, or run an operator workflow merely to reach a rendered
state. The fixture is source-bound, fingerprinted, contains no credential or
provider material, grants no semantic or execution authority, and cannot
start execution.

Every shard copies what it needs into its own writable resource root. No two
shards may share a live mutable database, runtime, listener, browser, CDP
session, profile, operator session, active selection, or approval barrier.

Each shard independently owns:

- writable DB and runtime-state directory;
- runtime supervisor and complete process tree;
- application, bridge, and debug ports;
- Chrome process, CDP session, and browser profile;
- temporary root and downloads;
- local bootstrap/session/action credentials;
- file-signal barriers;
- natural exit, stream settlement, cleanup, and residue evidence.

The implemented project-experience child declares and cleans its own writable
database, runtime-state directory, supervisor process tree, application,
bridge, and debug ports, Chrome process, CDP session, profile, temporary and
project roots, download directory, shard-local presentation session,
folder-picker signal, observer ledgers, and streams. Sharing any live writable
database, runtime, listener, browser, CDP session, profile, active-project
selection, operator session, approval signal, or mutable fixture directory
remains forbidden.

## Future planner selection

VFY1-D must map changed files to repository-owned detailed owners. Ambiguous
ownership fails closed to all Browser shards. The thin golden path is mandatory
when a change can affect composition across two or more detailed owners or the
shared fixture/harness boundary. Full mode, and changes to shared fixture,
runtime, process lifecycle, Browser harness, authority, planner, executor, or
receipt owners, require all Browser shards.

An unrun required shard is not a pass. A focused shard result is attributable
diagnostic evidence for one owner; it is not automatically an aggregated
deciding receipt.

## Future deciding receipt aggregation

For every planner-selected owner, the receipt must bind the exact base and
head and contain exactly one selected result. Every selected child must show:

- natural child exit and exit code `0`;
- closed stdout/stderr streams;
- complete cleanup;
- zero owned-process residue;
- zero listener, DB, profile, and temporary-root residue;
- no retry and no automatic timeout widening.

All required detailed shards and any mandatory golden child must pass before
the aggregate receipt is deciding. Missing, skipped, failed, timed-out, stale,
or cleanup-incomplete material makes it non-deciding. Phase execution, cleanup,
stream-settlement, and total timing stay attributable per owner before
aggregation.

This design does not change the current planner or receipt implementation.
The VFY1-B focused result is therefore independently attributable evidence,
not part of the current aggregated deciding receipt.

## Timing and headroom policy

Responsibility is defined before timeout. Future measurement separates normal
phase execution, cleanup, and stream settlement per owner. A bounded timeout is
failure containment, not the expected end of a successful run. Each shard must
retain meaningful normal-operation headroom rather than settle near its child
limit.

The policy forbids equal-duration-half sharding, pass-chasing retries,
arbitrary sleeps, assertion weakening, and automatic timeout widening. VFY1-B
changes no legacy timeout. The finalized correction run completed its inner
child in `101030ms` and exited naturally through the Canonical child runner in
`111490ms`. The inner child therefore retained `378970ms` against the
unchanged `480000ms` reference bound and `258970ms` against its `360000ms`
acceptance bound. Its result separately attributes fixture construction,
runtime startup, Chrome/CDP startup, seven semantic phases, navigation,
request quiet, runtime shutdown, Chrome/CDP shutdown, global cleanup, stream
settlement, and total child time.

## Sequencing

- VFY1-A: complete inventory, ownership, dependency graph, fixture boundary,
  golden specification, and static completeness contracts.
- VFY1-B: implemented independent project-experience owner; legacy-core
  shadow retained and planner/receipt integration deferred.
- VFY1-C: separately authorized operator/execution extraction.
- VFY1-D: separately authorized planner selection, thin golden path,
  per-shard receipt material, aggregate deciding semantics, and removal of the
  old monolithic owner only after exact equivalence is proven.

Issue #103 remains the governing roadmap and must remain open through the
deferred phases.
