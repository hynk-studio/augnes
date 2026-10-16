# P5.5 Personal Perspective lifecycle review v0.1

Supporting investigation for [#1472](https://github.com/hynk-studio/augnes/issues/1472),
under [#1215](https://github.com/hynk-studio/augnes/issues/1215) and coordinated by
[#1426](https://github.com/hynk-studio/augnes/issues/1426). Observed 2026-10-16 UTC.
This is a review proposal and bounded development exercise, not an approved
personal persistence contract, product activation, or completion of P5.5.

## Result and source boundary

Retain the existing project controls and context builder. Change one demonstrated
loss: `selectPersonalPerspectiveContextV01` replaced a caller's task-specific
`why_included` with a generic sharing-permission sentence. Preserve the supplied
reason, including its contextual exception; the separate scope lineage still
identifies project permission. A regression failed before this correction and
passed afterward, including persistence through the existing tested compiler path.

The two-project exercise demonstrates fresh preparation and scripted consumption.
It does not establish an authoritative personal item lifecycle. Revision,
review, currentness and relevance are explicit fixture inputs. No personal store,
principal, profile, inference, new schema, global project, or automatic injection
was added. No model, evaluator, remote provider or real personal material was used.

The admitted task worktree started at authenticated current `main`
`073c6516e4f1694c1236950fa63659031a0e0d08`, tree
`9bbeb23f0b6a63e8ffea71db07403db31719aa3a`, on
`codex/1472-personal-lifecycle`. These are investigation bindings, not reset targets.
Final commit, tree, planner result, deciding execution and receipt validation
belong to the exact candidate's PR and private consolidated closeout; the
development results below do not substitute for them.

## Current implementation and evidence map

| Surface | Current owner and observed capability | Limit |
|---|---|---|
| Meaning and future lifecycle | [Architecture §§12.2–12.5](../02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md#122-perspective-scope-distinctions), [R&D program](AUGNES_PERSONAL_PERSPECTIVE_RND_PROGRAM_V0_1.md) | Workspace personal continuity is a candidate; persistence needs a separate architecture decision. |
| Implementation/maturity | [03](../03_AUGNES_VNEXT_TRANSITION_ROADMAP.md), [04](../04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md#development-verification-and-usefulness) | Project controls are implemented; broader Vault/identity/cross-project substrate remains research. Delivery, use and usefulness differ. |
| Casebook and review replay | R&D Track A and its maturity requirements | The requested Personal Perspective semantic casebook and review replay are research directions. Current-source searches found no dedicated executable personal casebook/replay owner. Governed Actor Lab casebooks are different surfaces. This exercise does not promote their maturity. |
| Shadow navigation | [context-shadow-navigation.ts](../../../lib/vnext/context-shadow-navigation.ts), [test](../../../scripts/test-context-shadow-navigation.ts) | Pure baseline/shadow diagnostics with budgets, provenance and hard exclusions; no personal review store, production mutation or proof of downstream usefulness. |
| Project permission | [project-control-store.ts](../../../lib/vnext/persistence/project-control-store.ts), [types](../../../types/vnext/project-controls.ts), [route](../../../app/api/vnext/project-controls/route.ts) | Per-project include/exclude, default exclusion, active-project binding and revision conflict checks. The stored scope row has no personal body or personal principal. |
| Selection | [project-controls.ts](../../../lib/vnext/project-controls/project-controls.ts) | Exact canonical project scope, reviewed/fresh/trust-eligible `memory_ref`, deterministic selection and scope lineage. No task relevance evaluator or latest personal revision resolver. |
| Preparation and persistence | [packet builder](../../../lib/vnext/task-context-packet.ts), [core writer/reader](../../../lib/vnext/persistence/durable-semantic-store.ts), [compiler](../../../lib/vnext/runtime/persisted-semantic-context-compiler.ts) | Explicit bounded working context can be built, validated, persisted and read by exact project/id/fingerprint. It is not accepted personal truth. The compiler receives caller-supplied candidates; no production personal-source provider was found. |
| Presentation/consumer | [Project Home](../../../lib/vnext/project-home/project-home-projection.ts), [shared inspector](../../../lib/vnext/runtime/shared-project-inspector.ts), [project controls test](../../../scripts/test-vnext-project-controls.ts) | Existing source/reason and historical task-basis presentation. The actual downstream consumer in this exercise is explicitly scripted, not a product user or model. |
| Removal and recovery | [project lifecycle](../../../lib/vnext/persistence/project-lifecycle-registry.ts), [recovery backup](../../../scripts/recovery-backup.mjs), [recovery inspector](../../../scripts/runtime-database-bootstrap.mjs) | Recent-project removal only removes navigation. Validated backup/staging preserves snapshot contents. No item deletion or cross-project erasure owner. |
| Export | [portable-project.ts](../../../lib/vnext/portability/portable-project.ts) | Personal packet material and dependent lineage have an explicit export boundary. Project sharing alone is not remote-egress permission. Export/provider delivery was not exercised. |

The compiler boundary matters: attempting to add personal material absent from
the prior packet during a semantic-transition continuation was refused with
`semantic_transition_full_chain_invalid:unrelated_selected_context_changed`.
The existing positive project-controls test starts with that material already
selected. Its success does not prove arbitrary personal revision/reselection
across a transition. The full-chain invariant remains unchanged. The successful
walkthrough uses explicit fresh task preparations through the existing selector,
packet builder and core writer, without claiming automatic refresh of an old
transition-bound preparation. A future composition change must separately retain
exact prior/transition lineage and ordinary recovery-reader compatibility.

## One-item lifecycle decision proposal — not adopted

The invented declaration is: “I want to reduce long-term maintenance burden,
while permitting short, reversible experiments during exploration.” It expresses
an aspiration and decision principle with an exception, not a fixed personality.

| Decision | Proposed minimum boundary | Current implementation gap |
|---|---|---|
| Personal subject versus workspace | The person is the subject and controls endorsement, amendment, withdrawal and deletion. A workspace is a storage/collaboration boundary, not a person's identity. Workspace administration alone must not imply personal edit rights. | No principal or ownership contract exists for these items. Do not reuse project identity as one. |
| Declaration, observation, interpretation | Preserve explicit user declaration separately from a source-bound behavioral observation and a model interpretation. Record absent observations as absent. Interpretation stays a proposal until the subject reviews it; even endorsement must not relabel its origin. | The candidate interface supplies review/currentness/trust labels, not proof of a personal declaration or review event. |
| Review, edit, narrowing and exceptions | Show the exact text, source, scope, known counterexamples and exception. An authorized subject may narrow a revision; a project-local exception changes only that project's/task's choice. Preserve unresolved tensions rather than forcing consistency. | No durable personal review/edit endpoint. In this exercise a developer authors the synthetic r1/r2 inputs. |
| Defer and expiry | Deferral means no endorsement and no inclusion. Expiry requires a visible fresh review before reuse, with an explicit clock and stale-state refusal. An active task must revalidate when preparing again. | Candidate currentness is supplied; packet expiry exists, but neither is an item expiry scheduler or durable lifecycle. |
| Sharing, relevance and egress | Decide per-item/per-project sharing separately from selection for a task. Selection needs a concrete relevance reason, scope, source/revision, exception, freshness and classification. Provider/destination egress needs its own exact authorization. | Current permission is project-wide. A caller must choose relevant candidates; an irrelevant eligible supplied candidate passes this selector. No item-level grant or automatic relevance decision is established. |
| Revision | Create a new source-bound version with explicit predecessor and scope. New preparation resolves the authorized current version; superseded bodies are not silently reselected. A local fiction choice never revises the person's declaration. | r2 and stale-r1 flags are fixture inputs, not a committed personal revision transaction. |
| Retraction | Withdraw endorsement/use while preserving a clearly withdrawn history only where retention is authorized. Future selection must refuse withdrawn material. Retraction does not assert deletion. | `retracted` candidates are excluded; there is no authoritative cross-project propagation owner or consumer revocation feed. |
| Deletion and minimal history | Delete the personal body and body-bearing derived copies within the approved boundary. Any retained history must be purpose-limited and non-reconstructive: an opaque deletion identifier, action, scope and coarse time, with no quote, embedding or guessable content fingerprint. Decide retention and reidentification risk before adopting such a marker. | No item deletion contract. Immutable project task history can contain the body; changing that needs a separate decision, not an ad hoc SQL deletion. |
| Derived views and delivered bytes | Inventory selections, summaries, indexes, caches, exports and outputs. Invalidate future views and label historical output as historical. Already delivered copies require separate recipient action and may be outside control. | Project exclusion affects future selection, not existing packets/output files or all external copies. |
| Backups and restore | Define retained backup policy and how an approved deletion/retraction decision is reconciled before restored material becomes eligible. Preserve recovery integrity and make the limitation visible. | Existing recovery faithfully restores old snapshots. It cannot infer a later personal withdrawal absent a separately authorized reconciliation source. |
| Multi-user isolation | Separate subject ownership, workspace membership, project sharing and recipient authorization. Bind each read/write and each derived view to that subject and scope. | Canonical workspace/project checks are implemented, but they do not prove per-person isolation inside a shared workspace. |

The smallest next semantic decision is whether this subject-owned item boundary
and its revision/retraction/deletion responsibilities should receive a separately
scoped architecture decision. Do not implement a new store to resolve that
question. No future proposal in this table overrides the active architecture.

## Runnable exercise and actual task artifacts

The private local review package is retained in the task worktree at
`.augnes-local-verification/1472/`. It contains `run-owned.mjs`, `walkthrough.ts`,
`fixture-support.ts`, `consumer.ts`, failed attempt logs and the successful
`exercise-06/` artifacts. Raw logs, database state, backup bytes and host receipts
are not committed or posted. An independent local reviewer can run the retained
package from the same checkout, with the exact Canonical Node directory on PATH:

```sh
env -u OPENAI_API_KEY node .augnes-local-verification/1472/run-owned.mjs \
  independent-walkthrough node --import tsx \
  .augnes-local-verification/1472/walkthrough.ts \
  .augnes-local-verification/1472/independent-exercise
```

The output directory must not exist. The wrapper uses existing capacity,
checkout, child-process and temporary-resource owners; it refuses unavailable
admission and releases only its own resources. This command is development
feedback, not a deciding Canonical invocation. No replay has been scheduled.

The runner creates one disposable workspace and two actual canonical projects,
Maintenance and Fiction. It uses existing include/exclude controls, selection,
packet validation/persistence, scoped core reads and recovery APIs. Source bodies
remain fixture inputs; only permitted selected task context is persisted. No
research-candidate storage or hidden personal store is used. Fixture dates are
explicit July 2026 protocol times, distinct from the October execution time.

Each consumer starts a new process, reads the exact prepared packet through the
ordinary scoped core reader, verifies its fingerprint, and writes an artifact
plus output binding. It does not read the source fixture or parent memory. This
is process separation, not cold model isolation. The toy interpreter deliberately
reads developer-authored structured fields inside the synthetic bounded summary;
it does not infer the meaning of natural-language aspirations.

For maintenance, the declared alternatives have synthetic monthly-upkeep/setup
costs: incremental script 1/4 hours, two-day reversible spike 0/2, managed platform
8/1. With personal guidance the script minimizes upkeep subject to the selected
exception; without it, the project default minimizes setup effort. These invented
estimates test mechanism discrimination, not actual economic benefit.

| Case | Selection and actual output | Bound |
|---|---|---|
| A, r1 relevant use | One source-bound personal entry. Fresh consumer writes `a-r1-used.md`: choose `two-day-spike`. | Preserves aspiration, principle, reversible-exploration exception and task-specific reason. Scripted use goes beyond a preview. |
| B, no sharing | Zero personal entries; no personal body/locator leaks through the scope gate. `b-unshared-used.md` writes the fiction outline. | Default project exclusion. |
| B, sharing but unrelated | Sharing is included; explicit synthetic relevance review supplies no candidate. `b-shared-but-unselected-used.md` retains the same fiction outline and narrator ambiguity. | Caller-chosen non-use. A separate pure probe shows the selector would accept the same item if wrongly supplied as an eligible fiction candidate. It is not automatic relevance protection. |
| C, narrow to r2 | The exception now permits only offline, reversible experiments with no new runtime dependency. Stale r1 is excluded, r2 selected; `a-r2-used.md` chooses `incremental-script`. | Review/revision/currentness are caller-supplied. No personal source of truth was created. |
| C, contested/retracted | Contested and retracted candidates select zero. Fresh `a-retracted-used.md` chooses the project default `managed-platform`. | No withdrawn material is applied from this newly prepared packet. Historical packets remain unchanged. |
| C, project sharing withdrawn | Scope revision 2 is excluded; fresh preparation and consumer have no personal entry. | Project-wide future-selection control, not item deletion or global withdrawal. |
| D, navigation removal | `removeRecentProjectV01` succeeds; the old r1 packet still exists. | No item-level deletion or erasure was performed. |
| D, old/new backups | Existing backup validation/staging and fresh reads succeed. Pre-withdrawal snapshot has scope included and old r1; post-withdrawal snapshot has scope excluded and still contains historical r1. | Snapshot fidelity, not production restore activation or anti-resurrection. |

Fiction artifact: **The Lighthouse That Answered**. Its three beats concern a
keeper hearing an old signal's reply, a missing logbook page, and a second light
inland. Both preparations produce the same outline. Its choice to retain narrator
ambiguity does not change the source item. Wrong-project and wrong-workspace
candidates are refused; a different project's scoped reader cannot read the
maintenance packet. Per-person multi-user behavior remains untested/unsupported.

### Source, preparation and output bindings

Source hashes below use SHA-256 of the fixture object's compact JSON. They bind
synthetic source/revision, not a personal principal, user approval or erasure proof.
The prepared entry also carries `external_id=synthetic:maintenance-aspiration`,
revision `r1`/`r2`, `imported_unverified` source trust, the supplied currentness,
`why_included` and canonical project scope-revision lineage.

| Binding | SHA-256, without the optional `sha256:` prefix |
|---|---|
| r1 source | `e376a5ccc99a746ba54f0cbaff47096516328707068777a728cc81870a903de6` |
| r2 source | `02bd0fa086d0916f0d189180de74f37e0396f7ef0ff1e7845737e6a64781865b` |
| r1 packet `task-context-packet:0512360bac85d57f0cbf20d` | `2b84199a488b85410c5be1667b1e9d0d619db07a0610ceb5daf0300343f46505` |
| r2 packet `task-context-packet:855c92274cc9a418aa5072b` | `a80ded6887d6b7ca7b01c9334dc341338531de471087203f2673e9f4c0f59c9d` |
| r1 action artifact | `1416a2647eb67bf8367c842335e5107375c9e158cfb4983de424847e3bf3749c` |
| r2 action artifact | `4be105fd83d343a413fa0b9416b6a8237689b6c24d52f8c6b18ecd41d648f072` |
| Retraction action artifact | `7f3c373fd7c1ad5a3eba7c1b0c2deb49327a0db92ef0a961125f661849d352d3` |
| Fiction artifact, both cases | `910b68cc941096b92e0a83fa3b1a8f011a8397d9bf870d74b087979d9c75dc80` |

The package's `summary.json`, per-case preparation and consumer JSON files retain
all seven packet IDs/fingerprints, selection outcomes, exact source/revision/scope
bindings, artifact hashes and eight child lifecycle results. Original r1 output
is retained alongside the later r2 and retraction outputs.

## Verification, failures, cost and preservation

The tracked behavioral change is limited to
`lib/vnext/project-controls/project-controls.ts`; its focused regression is in
`scripts/test-vnext-project-controls.ts`. This supporting report is the only
documentation addition. No active owner section, historical research artifact,
schema, migration, provider adapter or production lifecycle was changed.

Development commands use the owned wrapper described above:

| Command/case | Observed result |
|---|---|
| `npm ci --no-audit --no-fund` | PASS, 6.136 s child duration. Task-owned dependencies only. |
| `node --import tsx scripts/test-vnext-project-controls.ts`, regression before fix | FAIL as expected, 1.867 s: task-specific reason was replaced. |
| Same project-controls test after fix | PASS, 2.174 s; also checks persisted reason/exception. |
| `node --import tsx scripts/test-context-shadow-navigation.ts` | PASS, 0.838 s; pure diagnostic behavior retained. |
| Two-project walkthrough, attempt 06 | PASS, 4.658 s outer child, 3.522 s measured exercise. Seven preparations; six task artifact consumers and two historical backup readers. |
| `npm run typecheck` | Initial FAIL, 29.839 s: the fresh checkout lacked Apps `zod` dependencies. After `npm ci --prefix apps/augnes_apps --no-audit --no-fund` (PASS, 1.760 s), typecheck PASS, 6.326 s. No source correction or assertion change was needed. |
| Artifact consistency and documentation checks | PASS: source/revision hashes, packet/output bindings, actual artifact bytes, fiction non-leak/equality, discriminating actions, eight settled children; `git diff --check` and 20 local documentation link targets. |

All recorded development children settled naturally with closed streams, complete
cleanup and zero remaining owned processes. Capacity and checkout ownership were
released after each completed run. Exact-source qualification is separately
required for the executable change; the unchanged planner must decide its scope.

Failed attempts are retained, not overwritten or presented as qualification:

1. Worktree creation initially lacked the requested base object locally. An exact
   object fetch allowed task-owned creation without moving the installed checkout.
2. Walkthrough 01 used the root-normalizer helper without its required options;
   corrected the fixture call and argument name.
3. Walkthrough 02 exposed the transition compiler's unchanged-context guard;
   preserved it and switched the exercise to explicit fresh preparation.
4. Walkthrough 03's all-network guard also blocked the existing recovery owner's
   loopback process-ownership probe. The parent adopted the repository test's
   loopback-only allowance; external network remained blocked.
5. Walkthroughs 04/05 were rejected by recovery with
   `recovery_backup_verification_failed` / `database_reader_incompatible` when
   mixed with a partial semantic-transition test fixture. Adding referenced source
   records did not establish complete product-reader compatibility. A separate
   loader diagnosis passed. The final exercise removed the unnecessary transition
   fixture and used fresh task preparations only; unchanged recovery checks passed.
   The earlier fixture failure is not evidence of a product recovery defect or a
   repaired transition-composition path.

There were zero authorized/observed model or provider calls and no API credential
was needed. The toy cost table is an input, not measured savings. Human curation,
review burden, repeated explanation, comprehension, model quality, long-term
retention cost and comparative usefulness were not measured. Development cases
were exposed while iterating; no independent evaluation or outcome improvement
claim follows from these passes.

Installed Companion inspection is read-only. Its before observation was
`installed_stopped`, coherent, preservation-valid and exact to its installed
checkout. Final preservation and lease disposition are recorded with the final
candidate closeout. No service installation/adoption/start/restart, maintenance,
authentication/configuration change or production write is part of this task.
Disposable databases, backup copies, private homes and owned processes were
cleaned; synthetic review artifacts and original private logs remain for review.

## Conclusion and stop

**Retain** existing zero-model controls, scope checks and packet/recovery owners.
**Change** only the demonstrated loss of task-specific inclusion reason.
**Simplify** the experiment to explicit fresh preparations and an inspectable
scripted consumer. **Stop** before personal persistence or automatic lifecycle
propagation. A reviewer can separately assess the small fix and the proposed
subject/lifecycle boundary.

Future selection, historical outputs, derived material, backups and previously
delivered bytes have different owners. Exclusion/retraction inputs affected the
tested future preparations; they did not erase historical bodies, backups or
external copies. Item deletion, personal-principal isolation, cross-project
propagation and universal anti-resurrection remain unsupported.

Preserve the independent sequence: #1469 qualification → independent review →
user merge → explicit #1471 integration/qualification. This investigation is not
a new prerequisite and does not consume their unmerged work. #1465's research,
artifacts, failed history and tie/SIMPLIFY conclusion are untouched. Keep the PR
Draft, auto-merge disabled, and stop for independent review. No follow-on work or
monitoring is started.
