# Canonical Browser verification ownership v1

This document defines the permanent Browser verification architecture. The
machine owner is
[`scripts/browser-verification-owners.v1.json`](../scripts/browser-verification-owners.v1.json).
It binds focused commands, Canonical phase IDs, executable sources, detailed
result fields, semantic markers, and conservative changed-file selection.

## Permanent owners

### Project experience

`npm run test:e2e:project-experience` runs `e2e-project-experience`.

It answers whether a user can connect, identify, recover, and navigate a
project correctly. It owns folder onboarding and naming, Project Home lifecycle
presentation, ProductShell and locked entry, retired-route safety, and the
complete responsive presentation matrix.

Rendered operator or continuity records are immutable presentation inputs. The
child copies them into its own writable database and reads them through the
production application. It does not borrow a live operator or continuity
runtime.

### Operator and execution

`npm run test:e2e:operator-execution` is a focused developer convenience that
runs four independent Canonical children sequentially:

- `e2e-operator-review-control` owns authenticated review, Inspector,
  project-control, refusal/recovery, ReviewDecision, and Transition separation.
- `e2e-operator-native-host-execution` owns first-work activation, direct and
  managed deterministic native-host execution, approval/cancel/resume and
  bounded automation.
- `e2e-operator-work-expectation` owns optional expectation authoring before one
  exact first interactive attempt, its result comparison and attested report
  correction, reload/restart, source navigation, and project selection isolation.
- `e2e-operator-multi-candidate` owns candidate selection, preview freshness,
  mutation locking, candidate-scoped GuideBrief, and exact decision/Transition
  targeting.

Each child has a distinct fixture profile, database, runtime, browser, profile,
operator credentials, signals, transport counters, and cleanup evidence. A
child may create only the exact effects declared by its profile.

### Continuity

`npm run test:e2e:continuity` runs the independent `e2e-continuity` child.

It owns portability and import, restart, recovery and reconciliation, imported
and persistent lineage, Personal Perspective continuity, and long-lived
project isolation. It does not own multi-candidate operator behavior.

The child builds an immutable source fixture, copies it to its own writable
database, starts its own runtime and Browser resources, and proves continuity
without relying on another Browser phase having run first.

### Thin cross-boundary golden path

`npm run test:e2e:golden` runs `e2e-golden` and proves only:

1. project connection;
2. first-work definition;
3. explicit deterministic local native-host start;
4. one admitted result receipt;
5. one proposal visible for review.

It uses production routes and persistence owners with a deterministic local
host seam. It does not repeat onboarding, responsive, approval lifecycle,
Inspector, decision/Transition, multi-candidate, portability, restart, or broad
refusal matrices. It makes no provider or external-network request.

## Aggregate Browser surface

`npm run test:e2e` runs these seven phases and no legacy shadow:

1. `e2e-project-experience`
2. `e2e-operator-review-control`
3. `e2e-operator-native-host-execution`
4. `e2e-operator-work-expectation`
5. `e2e-operator-multi-candidate`
6. `e2e-continuity`
7. `e2e-golden`

The operator parent command is not a nested receipt phase. Local Canonical
records its four children directly so timing, cleanup, and failures remain
attributable. Full Canonical on the supported macOS host has fifteen required
phases: eight non-Browser phases followed by these seven Browser phases. Both
the complete Browser command and the operator aggregate select F1 exactly once.
The focused command is
`node scripts/run-canonical-test-suite.mjs e2e-operator-work-expectation`.

## F1 responsibility amendment

The `work_expectation_recording` family moves intact from native-host execution
to the independent `work_expectation` fixture profile. This follows the user's
optional expectation and result-review responsibility. It adds separately
accounted verification work, including its own setup and cleanup. No elapsed-time
partition or subtraction establishes a measured native baseline or a speedup.
Product behavior, routes, record semantics, persistence and portability are
unchanged by this ownership amendment.

The machine manifest enumerates every individual field and marker. Its exact
inventory is preserved: 238 detailed fields and 102 semantic markers across
Browser responsibilities, plus the five unchanged golden composition steps.
The operator union remains 140 fields and 64 markers. Ownership changes are:

| Family or inventory | Previous owner | Current owner | Fields / markers |
| --- | --- | --- | --- |
| All review/control families | Review/control | Review/control | 70 / 22 |
| `executed_reviewed_follow_up` | Native-host | Native-host | 2 / 1 |
| `first_work_definition_and_start` | Native-host | Native-host | 19 / 0 |
| `direct_native_host_round_trip` | Native-host | Native-host | 6 / 2 |
| `live_native_host_approval_lifecycle` | Native-host | Native-host | 15 / 3 |
| `bounded_automation_execution` | Native-host | Native-host | 6 / 5 |
| `work_expectation_recording` | Native-host | Work expectation | 2 / 0 |
| All multi-candidate families | Multi-candidate | Multi-candidate | 20 / 31 |
| All project-experience families | Project experience | Project experience | 69 / 8 |
| All continuity families | Continuity | Continuity | 29 / 30 |

The two moved fields are
`work_expectation_preparation_result_reload_source` and
`work_expectation_selection_isolated`. Native now owns 48 fields and 11 markers;
F1 owns two fields and no semantic markers. Empty marker ownership is explicit;
foreign, missing and duplicate completion remains rejected. Shared prerequisites
never constitute another child's completion evidence.

The assertions inside those fields retain their normal action paths:

| Assertion | Authoritative child | Normal producer or consumer |
| --- | --- | --- |
| Fresh project; no forecast, session or attempt borrowed | F1 | Own normal fixture registration and scoped reads |
| Optional original expectation precedes outcome | F1 | Authenticated first-work and expectation preparation forms |
| Saved original survives reload | F1 | Preparation history after navigation |
| Explicit first attempt and exact packet/run/receipt binding | F1 | Project Home deterministic action and protected result reader |
| Visible result starts unassessed | F1 | Existing main result review |
| Predicted failure matches an attested failure without task success | F1 | Optional outcome report and unchanged task-assessment presentation |
| Corrected satisfied report mismatches original; predecessor retained | F1 | Append report correction and protected history readback |
| Comparison and report history survive reload and runtime restart | F1 | Same result route and existing session-preserving lifecycle |
| Exact source navigation and return; 390/768/1280 widths | F1 | Packet Inspector link and original comparison view |
| Project activation and restarted target view omit foreign expectation | F1 | Project Home Make active and authenticated target preparation |
| Actual rendered worker input omits authored expectation | Native-host | Existing native Start and fake-host input observation |
| Cancellation remains not observed, with no mismatch or outcome report | Native-host | Existing cancellation and its exact result review |

The F1 fixture begins with no work, expectation, attempt, receipt or report in
its new project. Its other project supplies ordinary prepared work for selection
isolation. All execution and chronology are produced within this child through
the existing authenticated UI and protected writers; read-only assertions do not
create lineage. The native fixture no longer registers the F1 project. The
children share only lifecycle/action code and immutable source-building recipes,
never writable state, sessions, credentials, receipts or completion outputs.

Exact effects are predeclared from those actions in
`scripts/operator-execution-effect-ledger-v1.mjs`; counts are not learned from a
run. The prior combined native profile and resulting profiles are:

| Effect | Prior combined native | Native | F1 |
| --- | ---: | ---: | ---: |
| New Core records | 37 | 30 | 7 |
| Packets / receipts / proposals | 8 / 6 / 7 | 7 / 5 / 6 | 1 / 1 / 1 |
| Expectation-family records | 6 | 2 | 4 |
| Runs / steps / events | 6 / 6 / 62 | 5 / 5 / 57 | 1 / 1 / 5 |
| Operator sessions | 5 | 4 | 2 |
| Active selection updates / revision increment | 1 / 5 | 1 / 4 | 1 / 1 |
| Recent project insertions | 1 | 0 | 1 |

The other ten native Core inserts remain four automation work items and
one each of capability grant, ReviewDecision, semantic gate, semantic state,
Transition receipt and context-use review (ten records total); the table's
packet/receipt/proposal/expectation counts account for the remaining twenty.
Native retains one semantic-state-entry and one semantic-target-head insertion.
F1 creates no accepted semantic state. Its four expectation records are one
original, one attempt binding and two linked outcome reports. Its five events
are exactly `run_created`, `run_started`, `step_started`, `step_completed`, then
`run_completed`, bound to the single new run and exact packet/root. Native
retains every approval, cancellation, continuation and automation event, their
exact counts, scope and ordering.

Native sessions are primary one, first-work profile two (one revoked), and
automation one. F1 sessions are expectation one and primary one; that additional
primary authentication is independent setup. Row identity/hash checks, immutable
Core refusal, exact report predecessors and receipt fingerprints, source/target
selection revisions, credential checks and zero unowned effects remain required.
Historical verification results and timing causes are not revised by this split.

## Resource and lifecycle contract

Every Browser child independently owns:

- an immutable fixture copy and writable database;
- runtime-state and temporary roots;
- the runtime supervisor and complete process tree;
- application, bridge, and debug ports;
- Chrome, CDP, profile, and downloads;
- project roots and child-local credentials;
- any signals and deterministic transport state;
- request, response, console, page-error, and stream ledgers;
- shutdown, cleanup, and residue evidence.

No live writable database, runtime, listener, browser, CDP session, profile,
active-project selection, operator session, credential, signal, transport
counter, or mutable fixture directory is shared between children.

A successful child requires exact keyed field and marker completion, valid
field values, no unowned authority or execution effect, no unexpected external
request or Browser failure, credential/private-material safety, completed
shutdown, settled streams, and zero process/listener/file residue. `ok` remains
false until cleanup evidence is final.

The Canonical outer runner additionally requires exit code 0, natural and
observed exit, closed stdout/stderr, completed cleanup, no descendant cleanup,
and zero owned processes. A timeout or lifecycle defect is a failure.

## Authority and exact effects

Runtime contracts preserve these separations:

- assessment is not decision;
- decision is not Transition;
- result review is not semantic authority;
- a run receipt is not task success;
- automation configuration is not execution authorization;
- fixture state is not approval;
- a local session is not provider authority.

Operator children take public-safe exact state snapshots before and after
execution. Stable row identity and canonical row hashes keep insertions,
updates, and deletions distinct. Profile-local predicates bind permitted effects
to the exact project, root, packet, run, result, proposal, candidate, decision,
gate, Transition, and event ordering.

Delete-and-replace, in-place payload changes, wrong-project/root/lineage
changes, event substitution, memory or Perspective mutation, external effects,
and any extra session or control mutation fail even when aggregate counts are
unchanged. Successful results expose only the contract version, before/after
and exact-diff fingerprints, bounded operation counts, and zero-unowned-effect
evidence. Bounded public-safe row material is emitted only on failure.

## Permanent completion manifest

The owner manifest retains exact detailed field and marker sets because runtime
completion contracts consume them. It intentionally omits historical source
locations, source hashes, legacy anchors, shadow status, migration sequencing,
and legacy/new equivalence mappings.

At runtime each owner rejects missing, duplicate, or foreign fields and
markers. The manifest contract rejects duplicate ownership, missing command or
suite bindings, missing resource/lifecycle declarations, and incomplete
operator child unions. Source-code parsing is not part of permanent ownership.

## Changed-file selection

The Browser manifest remains the semantic owner map; the Local Canonical change
owner manifest decides whether that Browser ownership is narrow enough for an
`owner-targeted` plan. The planner applies both manifests conservatively:

- project entry, lifecycle, ProductShell, responsive, and presentation changes
  select project experience;
- operator session, review, native-host, automation, semantic decision, and
  candidate changes select the relevant operator children;
- portability, recovery, reconciliation, persistent lineage, and Perspective
  continuity changes select continuity;
- a known single detailed Browser owner may join typecheck and unit in an
  `owner-targeted` deciding plan after the fixed clean root and nested
  dependency preparation;
- the exact project-experience verification family also retains the authority
  suite, whose static policy contract consumes the Browser executable; its
  seven admitted paths are enumerated in the Local Canonical change owner
  manifest, with no prefix-based extension to new helpers;
- first-work-to-result composition changes select golden plus affected detailed
  owners and therefore require `full-canonical` in the current planner;
- shared runtime, fixture, lifecycle, planner, executor, receipt, or ambiguous
  cross-owner changes select all seven phases through `full-canonical`;
- multiple detailed Browser owners require `full-canonical`; a targeted plan
  cannot omit their cross-boundary proof;
- unknown or ambiguous verification ownership selects all seven phases through
  `full-canonical`;
- full-canonical selects all seven phases.

Documentation-only changes remain eligible for the existing bounded
documentation selection when their paths and links validate. Browser/product
deletion is not targeted in this version. Renames, executable-mode changes,
unknown paths, or invalid planner inputs fail closed.

## Deciding Local Canonical receipt

The planner writes the selected Browser phase IDs into its plan. Every selected
phase is bound to the exact receipt base and head and must appear exactly once.
For each required Browser phase, deciding evidence requires:

- pass status and exit code 0;
- exact base/head binding;
- natural and observed exit;
- closed streams and completed cleanup;
- zero owned-process and listener residue;
- no timeout, omission, skip, or stale result.

An absent, unrun, failed, timed-out, stale, or cleanup-incomplete selected phase
makes the aggregate receipt non-deciding. A focused owner result is deciding
only when the exact planner selected it inside an owner-complete exact-head
receipt; an arbitrary standalone focused run is diagnostic evidence, not a
substitute for that receipt.

## Timing policy

Responsibility boundaries determine the phases; duration does not. Timing
reports distinguish fixture construction, runtime and Browser startup,
semantic phases, navigation and bounded waits, request quiet, host barriers,
runtime and Browser shutdown, global cleanup, stream settlement, and total
duration.

Timeout is failure containment, not expected successful termination. The
architecture forbids pass-chasing retries, arbitrary sleeps, automatic timeout
widening, assertion removal, and equal-duration partitioning. Each owner must
retain meaningful normal-operation headroom and natural cleanup.

The new F1 child uses the existing operator-child contract unchanged: measured
whole-child total strictly less than 300,000 ms and at least 180,000 ms headroom
against the 480,000 ms reference. The 360,000 ms acceptance bound and process
containment remain distinct from that final pass contract. Each operator child
keeps its 360,000 ms suite timeout and 420,000 ms Local Canonical outer bound;
setup, restart, shutdown and cleanup are included in the measured total. Existing
internal waits, including the 45-second native continuation watchdog, are
unchanged. Timing subcategories can overlap and must not be summed or subtracted
to manufacture a baseline. A historical timing failure remains a failure.

## Non-goals

This architecture does not change product, API, Core, protocol, schema,
authority, native-host, provider, or UI behavior. It does not create hosted
evidence, publish Local Canonical artifacts, dispatch workflows, or grant merge
authority.
