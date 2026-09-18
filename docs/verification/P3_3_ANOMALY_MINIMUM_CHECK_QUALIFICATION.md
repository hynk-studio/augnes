# P3.3 anomaly retention and minimum discriminating check

## Outcome and scope

**NO_CHANGE_NEEDED_WITH_EVIDENCE** for product/runtime behavior. Current normal
owners already preserve the bounded anomaly/explanation/check/result
distinctions and deliver an explicitly reviewed check to a native-host request.
This qualification adds no production code, schema or test case.

Owner: [#1290](https://github.com/hynk-studio/augnes/issues/1290).
Parent: [P3 #1213](https://github.com/hynk-studio/augnes/issues/1213).
Coordination: [#1209](https://github.com/hynk-studio/augnes/issues/1209).
Repository lifecycle follows the
[roadmap phase-state rule](../vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md#phase-state-rule):
Current while this issue's linked Draft PR remains open; Completed within the
implemented bounded mechanics/consumer scope if/when that PR merges. Broader P3
remains incomplete. This record grants no later-phase or execution authority.

## Independently checked baseline

On 2026-09-19 (Asia/Seoul), fetch and GitHub readback established:

- Main/base: `c48010acf6e5eb7182cec7399e2adb2f6c150e22`.
- Base tree: `c7f1a2057df9ba32d54ad69e0947b7cfa8a4bc5a`.
- Origin: `https://github.com/hynk-studio/augnes.git`; clean canonical checkout.
- [#1289](https://github.com/hynk-studio/augnes/pull/1289) merged at that main.
- [P3.1 / #1251](https://github.com/hynk-studio/augnes/pull/1251),
  [P3.2 / #1252](https://github.com/hynk-studio/augnes/pull/1252) and
  [P3.3a / #1253](https://github.com/hynk-studio/augnes/pull/1253) are merged.
  Their historical successful and failed receipts remain evidence of their
  own heads, not current-head or independent verification.

Open/closed issue and PR searches for P3.3, discriminating and anomaly found
the parent/coordinating owners and historical P3.3a/P1.5 work, with no equivalent
active bounded slice owner. Hence #1290 is one issue for the complete slice.
The roadmap, #1213, #1209, #1251/#1252/#1253 evidence and the current source
owners below were rechecked; historical descriptions did not determine the
implementation conclusion.

## Requirement → owner → consumer → evidence

All eight required capabilities are **already implemented and consumer-bound**
within the authored, selected-source scope below. This is preservation and
review of recorded meaning, not automatic classification of arbitrary prose.

| Requirement | Existing owner | Actual normal consumer | Current deterministic evidence |
| --- | --- | --- | --- |
| 1. Observation independent of explanation | Selected-source snapshots; immutable proposal observation/attestation/inference lanes | Current selected source notes; protected semantic review and selected-change comparison | Count observation and original receipt/proposal bytes survive the operator revision and all three outcomes |
| 2. Rejected/unsupported explanation without rejected observation | Additive operation-aware proposal revision with exact predecessor and author/session refs | `OperationAwareRevisionForm` → `SelectedChangeRevision` inside `DecisionCenteredProposalDetail` | Empty-input rejection is separately authored; original lanes remain equal; same-revision result leaves the original count discrepancy intact |
| 3. Not selected / not tested / rejected explanation / unknown / observation | Selected-source labels and selection state; source trust/currentness; candidate text; check/skip and criterion statuses | Retained-note lookup/comparison, semantic review, result reader/UI | Unselected full rerun is not disproven; warm export is untested; external currentness and task success remain unknown; repeated summary retains the same locator |
| 4. Unresolved anomaly with source, conditions and revisit trigger | Immutable selected excerpts and revision summary; bounded retained-source recall | Current source-note view and explicit earlier-note lookup; later packet consumer | `export-17`, cold CSV, locator and declared times retained; conditional revisit text delivered; recall regression preserves excluded anomaly/rejection/revisit notes without automatic injection |
| 5. One minimum check through reviewed state | Proposal revision → ReviewDecision → separately confirmed semantic gate/Transition | Existing review/Transition controls | Authored rationale explains why revision identity discriminates; only a validation plan is selected; authoring/decision alone applies no Transition |
| 6. Deliver without accepting hypothesis | Persisted semantic-context compiler and strict packet admission | `runDirectNativeHostRoundTripV01` actual captured native-host request | Exact admitted packet carries the selected plan and original sources; candidates remain unaccepted explanations; stale/missing/mismatched packets refuse |
| 7. Result with uncertainty and next-step semantics | Native result normalization → receipt/proposal → protected result read model | Result API, AI Workplane result view and linked semantic review | Three interpretations, check or skipped-check result, uncertainty and advisory `proposed_next_steps` survive normal result readback |
| 8. No success/acceptance/task promotion | CriterionAssessment and independent decision/Transition owners | Requirement assessment and result/semantic review | All outcomes have `task_success_status=unknown`; follow-up proposal has zero decisions and no applied Transition; review reads are byte-preserving and no additional request follows |

No required row is missing, partial, or implemented solely as internal test
mechanics in this bounded scope. The **deterministic manifest reader and
operator-authored interpretation-table executor** are test mechanics: they
qualify delivery and readback, not a production experiment-design or hypothesis
reasoning engine. Automatic selection, hypothesis ranking/disposition and
automatic future tasks are **explicitly out of scope**.

## Current owner and consumer trace

- [Selected-source comparison](../../lib/intake/selected-work-source-comparison.ts)
  binds project, exact text, declared source time, trust and locator. Labels
  are not accepted meaning; omitted notes are not rejected/refuted/deleted.
  [Retained-source recall](../../lib/intake/retained-work-source-recall.ts)
  deduplicates exact excerpts across the validated pre-execution chain and
  rechecks packet/entry fingerprints before explicit reselection. The normal
  [project-continuity route](../../app/api/vnext/operator/project-continuity/route.ts)
  and [lookup UI](../../components/workbench/semantic-review/retained-work-source-lookup.tsx)
  preserve selection/currentness limits. Broader cross-work/post-execution
  lookup and connector refresh/deletion propagation are not qualified here.
- [Revision writer](../../lib/vnext/runtime/operator-pilot-proposal-revision.ts)
  appends a proposal, copies source lanes and original candidates, and records
  explicit author/rationale. It returns `transition_applied: false`.
  [Protected review reader/writer](../../lib/vnext/runtime/operator-pilot-review-material.ts)
  validates predecessor, candidate, source envelope and immutable relation;
  ReviewDecision remains separate from application.
- [Comparison projection](../../lib/vnext/ai-workplane/selected-change-revision.ts)
  and [existing UI](../../components/workbench/semantic-review/selected-change-revision.tsx)
  show earlier/revised suggestions, recorded reason, result report, source lanes
  and unresolved conditions. Missing/conflicting identities yield unavailable
  or partial material, never an invented baseline. Source genealogy does not
  count independent evidential support. The fixture uses the normal form's
  summary/rationale fields; it supplies no private final-packet shortcut.
- [Transition owner](../../lib/vnext/runtime/operator-pilot-semantic-transition.ts)
  revalidates exact decision/gate/prior-packet relations and calls the
  [persisted compiler](../../lib/vnext/runtime/persisted-semantic-context-compiler.ts).
  [Native-host admission/round trip](../../lib/vnext/runtime/direct-native-host-round-trip.ts)
  refuses stale identity, then delivers the resulting packet through the
  existing request path. Applying the selected validation plan does not verify
  its explanations or provide the separate Start authority.
- [Result normalization](../../lib/vnext/native-host/native-host-result-normalization.ts)
  retains checks, skips, uncertainty and proposed steps.
  [Result read model](../../lib/vnext/runtime/project-run-result-read-model.ts)
  exposes exact bindings and advisory proposed steps through the normal
  [protected result API](../../app/api/vnext/operator/run-results/route.ts).
  [AI Workplane projection](../../lib/vnext/ai-workplane/ai-workplane-view.ts)
  and [result surface](../../components/workbench/result-review/run-result-review-surface.tsx)
  show the outcome, verification, unresolved material and navigation to review.
  The proposal comparison presents the authored revisit condition; the result
  API retains the returned advisory next step. This is not a claim that every
  result field is displayed on the main result card.

Source snapshots establish what was recorded, not external truth/currentness.
The observed/recorded times in fixture prose are declared source material;
normal server-authored revision time and provenance remain separate. No past
reasoning is reconstructed or invented.

## One discriminating case and existing negative coverage

The existing
[`assertMinimumDiscriminatingCheckV01`](../../scripts/test-vnext-project-work-initialization.ts)
fixture, reported as `consumer_bound_minimum_discriminating_check`, starts with
one disposable cold-CSV export of 9 rows and a preview of 10. A derived summary
has the same `counts.json` / `export-17` locator and is explicitly not another
observation. The operator rejects an empty-input explanation while retaining
the discrepancy. Two alternatives remain: input-revision mismatch or omission
within one revision.

The minimum check reads one manifest and compares export/preview revision
identity. Its recorded rationale is discrimination: different revisions make
the two counts incomparable as a same-input omission claim. A generic rerun
would not establish that boundary. The operator authors the interpretation
table before any result, selects only the check plan, and separately confirms
its validation-state Transition. The exporter is not rerun.

| Existing result variant | What it establishes | What remains unresolved / proposed |
| --- | --- | --- |
| Same revision | Revision mismatch is unsupported for this event; contradicts that live explanation while preserving the discrepancy | Same-input omission remains possible, not proved; a separate row audit may be proposed |
| Different revisions | Supports the mismatch alternative over interpreting the counts as a same-input omission | Does not establish the cause of the overall task; an aligned-input comparison may be proposed |
| Missing export revision / not performed | Explicit skipped check; neither alternative is settled | Revisit only with exact event metadata or a separately authorized aligned-input result |

Both performed comparisons have a **passed identity check**. That status means
the comparison was performed, not that either hypothesis or the original task
criterion passed. All three task assessments remain unknown.

Variants run from separate SQLite copies of one pre-check state built by normal
writers. Each uses normal Start/request/result/review owners; no outcome is
edited into another and no final consumer packet is fabricated. They are
alternative outcomes of one case, not independent observations or model runs.

Existing tests also cover:

- stale, missing and mismatched packet admission with no substitute/write;
- one locator for the observation/derived summary and exact excerpt
  deduplication across retained packet copies;
- retained-source foreign packet, changed fingerprint, malformed entry,
  missing/corrupt/foreign historical row and stale comparison refusal;
- missing/changed/foreign/ambiguous predecessor comparisons and unavailable
  result reports, preserving the distinction between partial presentation and
  a protected persisted-lineage refusal;
- immutable original records, unchanged state during review, one plan Decision
  and Transition only, and no automatic next request or semantic application.

No new cases, timeout changes, weakened assertions or alternate semantic
mechanism were needed. No live provider call is used; the fixture denies fetch
and asserts zero calls. Native request delivery here is deterministic adapter
consumption, not direct ChatGPT desktop, connected-client or live scientific
utility evidence.

## Verification record and limits

Current source qualification uses the existing commands, sequentially under
the repository child/environment/resource cleanup owners and their unchanged
30-second bounds:

```text
node --import tsx scripts/test-vnext-project-work-initialization.ts --executed-follow-up-only
node --import tsx scripts/test-vnext-project-work-initialization.ts
```

The first covers the three P3.3 outcomes plus the existing reviewed-follow-up,
P3.1 comparison, result admission and decision/Transition regressions. The
second covers selected-source delivery/recall, provenance negatives and
pre-execution revision integrity. These are focused qualification evidence,
not a Full Canonical run or a new Browser journey. Historical #1251/#1253 Browser
evidence remains tied to those heads.

Both commands passed on the unchanged audited runtime/test source with Node
24.18.0 and npm 11.16.0. The child owners recorded 19,496 ms and 27,898 ms,
respectively, natural exit, closed streams, no timeout and zero remaining owned
processes. All three owned temporary resource roots were removed. The three
P3.3 outcomes each reported pass, task success unknown and zero live provider
calls. These timings describe this execution only and establish no speedup.

The linked Draft PR records observed focused results, exact final base/head and
trees, `git diff --check`, the current planner selection, the single selected
deciding execution, receipt identity/validation and zero-owned-process cleanup.
The documentation-only outcome does not itself require typecheck, a build or
Full Canonical unless the current planner selects them. Generated receipts,
logs, disposable databases and private runtime artifacts are not committed.

Unestablished: improved research quality, fewer human errors, better model
reasoning, predictive calibration, independent utility, cross-task
generalization and reduced operator burden. Arbitrary authored prose is not
automatically semantically validated. General recall/retention policy and
automatic experiment design are outside this slice.

P3.4/P3.5 remain separate later work; P4/P5 are unaffected. P2.4 remains
completed_bounded; P2.5.1 remains Completed within bounded scope; merged #1289
completes P2.5.2 only within its bounded deployed qualification. Discovery and
independent utility remain unestablished. #1273 remains open/stopped; no direct
ChatGPT desktop Site-tool campaign was performed. This qualification changes
no Core/data/execution/compatibility behavior and grants no Ready, merge,
auto-merge, deployment or external-effect authority.
