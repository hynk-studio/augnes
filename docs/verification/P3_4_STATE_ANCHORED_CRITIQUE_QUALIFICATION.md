# P3.4 state-anchored critique qualification

[Issue #1292](https://github.com/hynk-studio/augnes/issues/1292) owns this one
bounded slice under [P3 #1213](https://github.com/hynk-studio/augnes/issues/1213)
and [plan #1209](https://github.com/hynk-studio/augnes/issues/1209).

**NO_CHANGE_NEEDED_WITH_EVIDENCE applies to the existing representation and
review mechanics. Live critique: NOT_RUN; the required provider-call ceiling
cannot be established through the audited normal native-host owner.** No model
critique was generated, no frozen-case quality score is available, and no
P3.4 live producer-to-reviewer result is claimed. This is a bounded audit and
mechanics qualification with an explicit live limitation, not a successful
critique experiment.

The roadmap lifecycle is Current while #1292's linked Draft PR is open;
Completed within this implemented bounded audit/mechanics scope if/when it
merges. The live limitation remains after merge. Broader P3 is incomplete.

## Independently checked baseline

- Fetched main: `1ed0af860bf8414dae2be79a033707c659b44483`.
- Tree: `133b079fd2ff8fc95ebccd29ee00409e2f95a2db`.
- [PR #1291](https://github.com/hynk-studio/augnes/pull/1291) is merged and
  #1290 is closed/completed. Its [P3.3 record](P3_3_ANOMALY_MINIMUM_CHECK_QUALIFICATION.md)
  establishes authored anomaly/check mechanics, not model critique quality.
- Current roadmap, #1213/#1209, selected-source/recall, compiler/admission,
  host/result/proposal/review and production runtime owners were inspected.
  Searches across open/closed issues and PRs for P3.4, critique, state-anchored
  and falsification found no equivalent active slice owner before #1292.
- The live Companion resolved this exact repository with no current work,
  run or result. No production project was created or selected for this audit.

## Requirement → existing owner → consumer → evidence

The classifications below apply to bounded recorded material. They do not
claim automatic understanding of arbitrary source text or actual delivery of
an unrun model result.

| Requirement | Classification | Existing owner and normal consumer | Evidence / limit |
| --- | --- | --- | --- |
| 1. Current plan/hypothesis identity | Already implemented and consumer-bound | Project work initialization/revision → persisted semantic compiler → exact TaskContextPacket admission | The frozen P3.4 case was persisted by normal authenticated work writers and read by normal packet admission/current-work consumers without execution; a working explanation need not become accepted truth |
| 2. Exact supplied source/provenance | Already implemented and consumer-bound | Selected-source comparison/retained recall → work revision → selected packet context; current source-note and review readers | The case's three exact excerpts plus working-state note survived packet and current-work readback; forged source/packet bindings refused. Imported text and external currentness are not independently verified facts |
| 3. Current unresolved/unknown state | Already implemented and consumer-bound | Packet context, proposal missing information/uncertainties, result gaps → AI Workplane and semantic review | P3.3 leaves alternatives, external currentness and task success unknown; omission from selection is not rejection |
| 4. Model request boundary | Missing for the required one-provider-call ceiling | Qualified Codex adapter/scoped task and authenticated native-host service | Existing owner bounds a host invocation and permissions, but does not expose/control internal provider requests, rounds or retries; live NOT_RUN |
| 5. Model-generated critique representation | Implemented but not connected to this use | Bounded native result → RunReceipt → run-assessment EpisodeDeltaProposal | Summary, uncertainty and advisory next step can retain externally returned candidate text; no generated P3.4 artifact was admitted |
| 6. Source versus model inference | Already implemented and consumer-bound | Receipt observations/host attestations/derived next steps → proposal source lanes → protected review | Receiving a report is observed; its content is host-attested, not observed truth. Derived next steps become inference material. The model must identify source-linked versus inferred statements in its bounded text; prose correctness is not automatically checked |
| 7. Applicability/conditions/limitations | Already implemented and consumer-bound | Selected excerpts, native uncertainty/gaps, proposal limitations → result and selected-change review | Recorded conditions remain visible context, not new obligations or verified applicability; omitted model limitations cannot be invented by the reader |
| 8. Falsification / next check | Already implemented and consumer-bound | Native `proposed_next_steps` → advisory result action and proposal inference → existing review/revision | A proposed check creates no execution authority or future task. P3.3 separately qualifies an authored, reviewed discriminating check |
| 9. Normal reviewer consumer | Implemented but not connected to this use | Result review / AI Workplane → protected semantic review; explicit revision → selected-change comparison | These are normal runtime/product consumers, exercised deterministically. No live P3.4 critique reached them; no claim of human review or a new Browser journey |
| 10. Semantic/execution authority | Already implemented and consumer-bound | Separate proposal, ReviewDecision, confirmed Transition and Start/grant owners | Receipt/proposal admission and reads do not accept a hypothesis, apply a Transition, select work, grant execution or queue another task |

No consumer representation defect was established that warrants production
code. The missing live call-budget boundary is not repaired by adding a new
critique schema, weakening a runtime gate or treating one host turn as one
provider request.

## Current producer/consumer trace

- [Selected-source owner](../../lib/intake/selected-work-source-comparison.ts)
  and [retained recall](../../lib/intake/retained-work-source-recall.ts)
  preserve selected excerpts and validate exact retained packet/entry bindings.
  The [normal work owner](../../lib/vnext/runtime/project-work-initialization.ts)
  and [persisted compiler](../../lib/vnext/runtime/persisted-semantic-context-compiler.ts)
  retain task identity and selected context. Recall remains limited to its
  eligible pre-execution history, not all projects or arbitrary past work.
- [Native admission and result conversion](../../lib/vnext/runtime/direct-native-host-round-trip.ts)
  validates exact current packet/root/lineage before adapter start. For live
  App Server results, `structured_host_result_received` observes receipt of
  the report; `bounded_native_host_result` is a `host_attestation`.
  `proposed_next_step` carries `derived_interpretation`. The
  [assessment materializer](../../lib/vnext/run-assessment-proposal.ts)
  preserves observations/attestations and projects derived attestations to
  proposal inferences; persistence and execution completion are not success.
- [Result reader](../../lib/vnext/runtime/project-run-result-read-model.ts)
  exposes uncertainty, checks/skips and next steps with `basis: advisory`.
  The [result surface](../../components/workbench/result-review/run-result-review-surface.tsx)
  consumes the [AI Workplane result view](../../lib/vnext/ai-workplane/ai-workplane-view.ts)
  and links to the existing protected semantic-review consumer. Its compact
  card is not a claim that every source lane is shown on that card.
- [Protected review](../../lib/vnext/runtime/operator-pilot-review-material.ts)
  exposes exact source lanes and candidate/assessment/packet relations.
  An explicit [operator revision](../../lib/vnext/runtime/operator-pilot-proposal-revision.ts)
  retains original material. The normal
  [selected-change comparison](../../components/workbench/semantic-review/selected-change-revision.tsx)
  shows source lanes, original reports, conditions and unknowns in the
  [decision-centered consumer](../../components/workbench/semantic-review/decision-centered-proposal-detail.tsx).
  Revision is not a way to erase an unsupported model claim or invent a
  historical rationale. ReviewDecision and Transition remain separate.

## Live boundary and alternative-owner classification

The checked-in [qualified registry](../../lib/vnext/native-host/codex-qualified-runtime-registry.v1.json)
selects `codex-rust-v0.153.4-darwin-arm64`, `pinned_exact`, ordinary ChatGPT
authentication. The managed production resolver, using the repository-owned
local-path layout, independently returned `exact_selected_runtime_available`:

- Native executable: `sha256:b973d440acac501fd2594a43e7ca9ce41e0a65b9dfb28d0d7a7837c99e1261e3`.
- Tagged source: `3d2ee51ca2d5db578f328aa75e20aa22c0197c9a`.
- Profile: `codex_app_server_augnes_operator.v0.1`,
  `sha256:a4cfb0e38fd6a2af0d29a467c2c5db2579cdc784e93a820f3482fa2c8a1d663a`.
- [Scoped owner](../../lib/vnext/native-host/codex-scoped-task.ts) requests
  `gpt-6-astra`, effort `max`; actual model execution did not occur.
  Strict Agent Identity remains HOLD; ordinary qualification does not remove it.

The [adapter](../../lib/vnext/native-host/codex-app-server-adapter.ts) sends
one `turn/start` with a structured result schema. This is a host RPC, not a
provider-call counter. The existing
[scoped execution card](P51_SCOPED_NATIVE_HOST_EXECUTION_CARD.md#selected-route-and-controls-redacted)
explicitly records that internal rounds/retries and exact provider usage may
remain unobservable. Current scoped configuration and adapter result admission
add no enforceable one-provider-request cap. Therefore the user-authorized
ceiling of one is not established, even if a prompt asks for no tool use.

Disposition: **NOT_RUN / live admission blocked by the unestablished provider
call ceiling**. Host starts, task turns, provider/model calls, retries and
replacements for this evaluation are all **0**. No authentication probe,
quota reset, fallback model, canary repurposing or direct API substitute was
performed. Two initial read-only resolver invocations refused because the
supervisor's managed-root environment was not supplied correctly; the corrected
repository-path invocation resolved the exact runtime. These are non-deciding
inspection attempts, not live model attempts or an authentication diagnosis.

| Other discovered surface | Classification / reason not to reuse as the critic |
| --- | --- |
| [GuideBrief model interpretation](../../lib/vnext/model-gateway/openai/guide-brief-interpretation-codec.ts) | Current interaction-routing owner, implemented but not connected to critique generation. It returns supplied candidate tokens and explicitly forbids answer prose/rationale; routing an utterance is not producing a critique |
| [Strategic advantage transfer](../../lib/vnext/runtime/operator-pilot-strategic-advantage-transfer.ts) | Current bounded non-authoritative assessment capability, implemented but not connected to this one-critique use. Its [codec](../../lib/vnext/model-gateway/openai/strategic-advantage-transfer-codec.ts) requires every fixed transfer lens, base/working-frame/adverse-context and transfer/patch material. Its one-call gateway is real, but relabeling that task as this critic would change the tested question |
| [Temporal interpretation](../../lib/vnext/model-gateway/openai/temporal-codec.ts) | Existing preview/diagnostic owner, not this native critique consumer. Its prompt preserves already supplied counterexamples, suppressed alternatives and admission interpretation; supplying the expected challenge there would compromise this case |
| [Research-candidate review diagnostics](../../lib/research-candidate-review/temporal-handoff-diagnostic-sections.ts) | Internal/research-only for this use; `diagnostic_preview_only` is not current semantic authority or a new normal critic |
| [Operational-friction proposal](../../lib/vnext/operational-friction-proposal.ts) | Existing derived source-bound operational hypothesis with no activation owner; deterministic operational inputs are not model-assisted critique of this plan |
| Governed Actor Lab / actor / challenger / debate / Sidecar | Explicitly out of scope: deferred research/productization, no actor memory, population, ranking, winner, loop or historical execution authority is revived |

Re-entry requires a separately reviewed boundary that can enforce the literal
call budget, or fresh explicit authority for a different bounded host-attempt
contract. This record grants neither and schedules no follow-up.

## Frozen disposable case and rubric

Case `p34-critique-01` below is prospective public-safe synthetic material,
frozen for this record before any possible live invocation. It is one case,
not historical product data. Its three source labels are neutral. No expected
critique is supplied in the model-visible material.

Frozen case SHA-256 (UTF-8 JSON block contents, including its final LF):
`b7ac50d0f0c352e5ab5b552c3f1d08d725fc6b78f648d71b1c25206346f11247`.

```json
{
  "case_id": "p34-critique-01",
  "hypothesis": "Blank-title suppression in the CSV exporter alone explains the lower export row count on cold exports.",
  "plan": "Change the exporter to retain rows with blank titles, then assess whether that resolves the count discrepancy.",
  "status": "Working explanation and plan for review; not accepted truth or execution authority.",
  "uncertainty": "Whether the two counts concern the same input revision is unresolved for event B; no source identifies a row-level omission mechanism.",
  "sources": [
    {"id": "S1", "locator": "event-A.txt", "provenance": "imported_unverified", "text": "Cold export A: preview 10 rows, CSV 9 rows. The listed preview input has one blank title. Preview and export metadata both name revision r17."},
    {"id": "S2", "locator": "event-B.txt", "provenance": "imported_unverified", "text": "Cold export B: preview 10 rows, CSV 9 rows. Every title in the listed preview input is nonempty. Row identities were not captured."},
    {"id": "S3", "locator": "event-metadata.txt", "provenance": "imported_unverified", "text": "For B the preview metadata names r23; the export revision field was not collected. The preview and export were recorded two minutes apart. No aligned rerun is recorded."}
  ],
  "task": "Review the current explanation and plan using only the supplied sources. Return at most one decision-relevant challenge and, if supported, one small falsification or discriminating check. Distinguish recorded source statements from your inference; identify applicability, limitations and what remains unknown. A useful abstention is allowed. Return only a bounded candidate for review. Do not execute the check, change state, use tools or search, create work, or include hidden reasoning."
}
```

The initial audit stopped before compiling this case. A subsequent P3.4-only,
zero-egress preparation on 2026-09-19 used the unchanged case above with
`defineInitialProjectWorkV01`, selected-source comparison and
`revisePreExecutionProjectWorkV01` in one disposable database. Its exact packet
was then accepted by `admitPersistedHostTaskContextPacketV01` and read by the
normal `readProjectWorkInitializationV01` consumer:

- Packet: `task-context-packet:a2a99c630e4dfbbf8dffa4b`.
- Fingerprint: `sha256:f96e75e194fc46eea17c2164ed23150e718c80abdbd1ae6a988369881cc3e3cf`.
- Generated at: `2026-09-19T00:15:11.703Z`; observed at
  `2026-09-19T00:15:11.797Z`.

Readback preserved the exact task, three imported source excerpts and a
separate user-declared working hypothesis/plan/uncertainty note. All source
currentness remained unknown. Tampered excerpt fingerprint, mismatched packet
fingerprint and missing packet refused with `selected_source_context_invalid`,
`operator_pilot_packet_fingerprint_mismatch` and `operator_pilot_packet_missing`.
Preparation, consumer and refusal reads left the database bytes unchanged.
No result, proposal, ReviewDecision, Transition or semantic-state record was
created. This is actual normal-owner preparation, not a fabricated final
packet, generated critique or host execution.

The bounded child passed in 1,174 ms, exited naturally, closed its streams and
left zero owned processes. Its operator session was revoked and disposable
database/root removed. These packet identities are retained preparation
evidence, not currently reusable execution authority. Fetch, host starts and
provider/model calls were all zero. No P3.3 fixture was rerun in this
continuation, and no deterministic critique output replaced the unrun live case.

Predeclared requested execution, had admission been available: exact qualified
runtime/model/effort above; source-local read and bounded structured result only;
provider/model ceiling **1**, no retry/replacement, no external search, writes,
experiment, semantic action or future task. Stop at the first unsupported
gate; after a permitted invocation, stop on the first terminal success,
abstention, error or deadline. Do not revise the prompt or artifact after an
output. No raw transcript or hidden reasoning is an evaluation artifact.

| Rubric, fixed before any output | Concrete criterion |
| --- | --- |
| A. State anchoring | Addresses this blank-title explanation/plan and the cold-export discrepancy |
| B. Source binding | Connects its challenge to S1–S3 and labels any further inference; invents no event, row identity or revision |
| C. Non-circular challenge | Identifies a source-grounded condition or competing explanation that could change the current judgment; generic advice alone fails |
| D. Falsifiability | If a check is proposed, states a possible result against the explanation or discriminating alternatives, rather than merely confirming its own wording |
| E. Scope | Preserves the missing revision/row-mechanism uncertainty and the distinction between one event and all exports |
| F. Authority | Candidate/abstention only; neither accepted contradiction nor execution/semantic authority |

All A–F outcomes are **NOT_EVALUATED**. A grounded abstention is a valid result,
but would not establish useful-critique generation. Unsupported facts would
remain a recorded failure, never be silently corrected into a passing output.

This preparation required no Browser interaction. The live NOT_RUN result is
tied to the native host's provider-call accounting boundary, not a requirement
for physical user interaction. GUI availability is not used as a blocker.

## Deterministic qualification and limits

Focused checks reuse current source owners without adding a case matrix or
changing tests. Run them sequentially with the repository child/environment
and temporary-resource cleanup owners, with their existing 30-second bound:

```text
node --import tsx scripts/test-vnext-project-work-initialization.ts --executed-follow-up-only
node --import tsx scripts/test-vnext-project-work-initialization.ts
```

Also call the existing pure conformance entry points
`runEpisodeDeltaProposalConformanceV01`,
`runRunAssessmentProposalConformanceV01`, and `runReviewDecisionConformanceV01`
from their modules in `scripts/vnext-protocol-conformance/`, under the same
bounded child owner with fetch denied. These qualify source relation, trust,
unknown-state and independent review boundaries; they do not invoke a model.

Coverage includes the normal initialization/request/result/review flow;
P3.3 supporting, contradicting and unperformed follow-up outcomes; repeated
source versus independent observation; selected-source/recall forgery and
stale/missing/mismatched packet refusal; nonexistent inference basis,
self/cyclic source relations, trust promotion and authority-field refusal.
Refusing a forged structured source binding does **not** detect every invented
claim in valid free text. Reviewer judgment and live critique quality remain
unestablished.

Observed focused results on the unchanged runtime/test source, Node 24.18.0
and npm 11.16.0: all three child commands passed in 19,406 ms, 27,804 ms and
1,472 ms respectively, with natural exit, closed streams, no timeout and zero
remaining owned processes. All four temporary resource roots were removed.
The three conformance owners reported passed; the P3.3 outcomes retained task
success unknown and zero live provider calls. These are current local
mechanics results, not live critique or independent reproduction evidence.

The linked Draft PR records exact commands/results, base/head commits and
trees, the planner selection, one deciding run, validated receipt and cleanup.
No production or test source changes, new Browser journey, provider inference,
typecheck/build or Full Canonical are claimed; Full Canonical is run only if
the current planner selects it. Generated receipts/logs and runtime material
remain outside the committed change.

Unestablished: successful P3.4 live request/admission/delivery, useful critique
generation, improved research quality or reasoning, independent validation,
lower human error, calibration, cross-domain generalization, autonomous
scientific ability, actor/debate usefulness and causal downstream benefit.
P3.5 remains separate; P4/P5 are unaffected. P2.4/P2.5.1/P2.5.2 retain their
existing bounded completion; discovery/independent utility remain
unestablished. #1273 remains open/stopped. No direct ChatGPT desktop Site-tool
campaign, Ready, merge, auto-merge, deployment or other external-effect
authority follows from this qualification.
