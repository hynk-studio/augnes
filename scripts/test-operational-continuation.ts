import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { buildOperationalFrictionDisposableReviewFixtureV01 } from "@/fixtures/vnext/research/operational-friction-proposal-v0-1";
import {
  materializeSourceLinkedOperationalContinuationV01,
  validateOperationalContextSelectionV01,
  type MaterializeSourceLinkedOperationalContinuationInputV01,
  type OperationalContinuationDecisionHistoryItemV01,
} from "@/lib/vnext/operational-context-selection";
import { materializeOperationalFrictionProposalV01 } from "@/lib/vnext/operational-friction-proposal";
import {
  countVNextCoreRecordsV01,
  ensureVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordEnvelopeV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  admitEpisodeDeltaProposalV01,
  readOperationalFrictionProposalFromExactSourcesV01,
} from "@/lib/vnext/persistence/episode-delta-proposal-admission";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
} from "@/lib/vnext/review-decision";
import {
  readOperationalContinuationV01,
} from "@/lib/vnext/runtime/operational-continuation-read-model";
import {
  VNEXT_LOCAL_OPERATOR_SESSION_SCHEMA_SQL_V01,
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import {
  readVNextOperatorPilotSemanticReviewV01,
  recordVNextOperatorPilotReviewDecisionV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import {
  runOperationalContinuationReportV01,
} from "@/scripts/operational-continuation-report";

const originalFetch = globalThis.fetch;
let fetchCalls = 0;
globalThis.fetch = (async () => {
  fetchCalls += 1;
  throw new Error("ACGC5A must not call fetch");
}) as typeof fetch;

class DeterministicSecretSourceV01
  implements VNextLocalOperatorSecretSourceV01
{
  private cursor = 17;

  bytes(size: number): Uint8Array {
    const value = new Uint8Array(size);
    for (let index = 0; index < size; index += 1) {
      value[index] = (this.cursor + index) % 256;
    }
    this.cursor += size;
    return value;
  }
}

class MutableClockV01 implements VNextLocalRuntimeClockV01 {
  value = "2026-07-19T00:00:00.000Z";

  now(): string {
    return this.value;
  }
}

interface TestFixtureV01 {
  db: Database.Database;
  database_path: string;
  source_fixture: ReturnType<
    typeof buildOperationalFrictionDisposableReviewFixtureV01
  >;
  config: VNextLocalOperatorPilotConfigV01;
  input: MaterializeSourceLinkedOperationalContinuationInputV01;
}

function main(): void {
  const temporaryRoot = mkdtempSync(
    path.join(os.tmpdir(), "augnes-acgc5a-"),
  );
  const databasePath = path.join(temporaryRoot, "operational-continuation.sqlite");
  const fixture = createFixtureV01(databasePath);
  try {
    assertPureMaterializationV01(fixture.input);
    assertDecisionAndSourceRefusalsV01(fixture.input);
    assertQueryOnlyAdapterAndReportV01(fixture, temporaryRoot);
    assert.equal(fetchCalls, 0);
    console.log(
      JSON.stringify(
        {
          suite: "operational-context-selection-v0.1",
          status: "passed",
          exact_source_revalidation: true,
          proposal_only_decision_eligibility: true,
          deterministic_selection_and_replay: true,
          candidate_packet_b_non_durable: true,
          current_lineage_unchanged: true,
          attachment_start_resume_firewall: true,
          query_only_consumer: true,
          table_counts_unchanged: true,
          project_file_writes: 0,
          project_commands: 0,
          real_provider_calls: 0,
          network_calls: 0,
          github_calls: 0,
        },
        null,
        2,
      ),
    );
  } finally {
    fixture.db.close();
    rmSync(temporaryRoot, { recursive: true, force: true });
    globalThis.fetch = originalFetch;
  }
}

function assertPureMaterializationV01(
  input: MaterializeSourceLinkedOperationalContinuationInputV01,
): void {
  const before = canonicalizeProtocolValueV01(input);
  const frozen = deepFreezeV01(cloneV01(input));
  const result = materializeSourceLinkedOperationalContinuationV01(frozen);
  const replay = materializeSourceLinkedOperationalContinuationV01(
    cloneV01(input),
  );
  assert.deepEqual(replay, result);
  assert.equal(canonicalizeProtocolValueV01(input), before);
  assert.equal(canonicalizeProtocolValueV01(frozen), before);
  assert.deepEqual(validateOperationalContextSelectionV01(result.selection), {
    status: "valid",
    errors: [],
  });
  assert.equal(result.selection.selected_rows.length, 1);
  assert.equal(result.selection.stop_reason, "budget_reached");
  assert.equal(
    result.selection.excluded_rows.length,
    result.selection.candidate_snapshot.candidate_count - 1,
  );
  assert.deepEqual(
    new Set(
      result.selection.excluded_rows.map((row) => row.exclusion_reason),
    ),
    new Set([
      "effective_review_rejected",
      "effective_review_deferred_revisit_capable",
      "budget_reached",
    ]),
  );
  assert.equal(
    result.selection.selected_rows[0]?.review_decision?.disposition,
    "accept",
  );
  assert.equal(
    result.selection.excluded_rows.find(
      (row) =>
        row.exclusion_reason === "effective_review_deferred_revisit_capable",
    )?.review_decision?.disposition,
    "defer",
  );
  assert.equal(
    result.selection.selected_rows.every(
      (row) =>
        row.proposal_only &&
        row.activation_owner === null &&
        !row.semantic_transition_eligible &&
        !row.causal_contribution &&
        !row.item_level_credit_or_blame &&
        !row.exact_intervention_evidence_present &&
        !row.exact_item_evidence_present &&
        row.uncertainties.length > 0 &&
        row.limitations.length > 0,
    ),
    true,
  );
  assertAllBooleanAuthorityFalseV01(result.selection.authority_summary);
  assertAllBooleanAuthorityFalseV01(result.authority_summary);
  assertNoRankingFieldsV01(result.selection);

  const packetA = input.packet_a;
  const packetB = result.candidate_task_context_packet_b;
  assert.equal(
    validateTaskContextPacketV01(packetB, {
      evaluated_at: packetB.generated_at,
    }).status,
    "valid",
  );
  assert.equal(packetB.task.goal, packetA.task.goal);
  assert.deepEqual(packetB.task.success_criteria, packetA.task.success_criteria);
  assert.deepEqual(packetB.task.non_goals, packetA.task.non_goals);
  assert.deepEqual(
    packetB.constraints.required_checks,
    packetA.constraints.required_checks,
  );
  assert.deepEqual(
    packetB.constraints.forbidden_actions,
    packetA.constraints.forbidden_actions,
  );
  assert.equal(
    packetB.constraints.data_classification,
    packetA.constraints.data_classification,
  );
  assert.equal(packetB.capability_grant, null);
  assert.deepEqual(packetB.work_ref, packetA.work_ref);
  assert.deepEqual(
    pickBudgetLimitsV01(packetB),
    pickBudgetLimitsV01(packetA),
  );
  const added = packetB.selected_context.filter((entry) =>
    entry.entry_id.startsWith("operational-continuation:"),
  );
  assert.equal(added.length, result.selection.selected_rows.length);
  assert.equal(
    added.every(
      (entry) =>
        entry.entry_kind === "source_ref" &&
        entry.trust_class === "derived_interpretation" &&
        entry.external_ref?.ref_type === "operational_friction_candidate",
    ),
    true,
  );
  assert.equal(
    added.some((entry) =>
      [
        "accepted_state_ref",
        "evidence_ref",
        "memory_ref",
        "action_ref",
      ].includes(entry.entry_kind),
    ),
    false,
  );
  assert.deepEqual(
    {
      persisted: result.persisted,
      current_packet: result.current_packet,
      execution_eligible: result.execution_eligible,
      attachment_prepared: result.attachment_prepared,
      grant_issued: result.grant_issued,
      run_created: result.run_created,
      semantic_transition_created: result.semantic_transition_created,
    },
    {
      persisted: false,
      current_packet: false,
      execution_eligible: false,
      attachment_prepared: false,
      grant_issued: false,
      run_created: false,
      semantic_transition_created: false,
    },
  );
  assert.deepEqual(result.persistence, {
    reads: 0,
    writes: 0,
    database_calls: 0,
  });
  assert.deepEqual(result.external_effects, {
    provider_calls: 0,
    model_calls: 0,
    network_calls: 0,
    github_calls: 0,
    browser_calls: 0,
    companion_calls: 0,
    filesystem_calls: 0,
  });

  const reordered = cloneV01(input);
  reordered.decision_history = [...reordered.decision_history].reverse();
  assert.deepEqual(
    materializeSourceLinkedOperationalContinuationV01(reordered),
    result,
  );
  const largerBudget = cloneV01(input);
  largerBudget.max_selected_candidates = 2;
  const twoSelected = materializeSourceLinkedOperationalContinuationV01(
    largerBudget,
  );
  assert.equal(twoSelected.selection.selected_rows.length, 2);
  assert.equal(
    twoSelected.selection.stop_reason,
    "eligible_candidates_exhausted",
  );
  assert.notEqual(
    twoSelected.materialization_identity.materialization_fingerprint,
    result.materialization_identity.materialization_fingerprint,
  );
  const unresolvedInput = cloneV01(input);
  unresolvedInput.decision_history = unresolvedInput.decision_history.slice(
    0,
    -1,
  );
  const unresolvedResult =
    materializeSourceLinkedOperationalContinuationV01(unresolvedInput);
  assert.equal(
    unresolvedResult.selection.excluded_rows.some(
      (row) => row.exclusion_reason === "effective_review_unresolved",
    ),
    true,
  );
  const noEligibleInput = cloneV01(input);
  noEligibleInput.decision_history = noEligibleInput.decision_history.filter(
    (entry) => entry.decision.decision !== "accept",
  );
  const noEligible = materializeSourceLinkedOperationalContinuationV01(
    noEligibleInput,
  );
  assert.equal(noEligible.selection.selected_rows.length, 0);
  assert.equal(noEligible.selection.stop_reason, "no_eligible_candidates");
  const zeroBudget = cloneV01(input);
  zeroBudget.max_selected_candidates = 0;
  const budgetStopped = materializeSourceLinkedOperationalContinuationV01(
    zeroBudget,
  );
  assert.equal(budgetStopped.selection.selected_rows.length, 0);
  assert.equal(budgetStopped.selection.stop_reason, "budget_reached");
  assert.equal(
    budgetStopped.selection.excluded_rows.length,
    budgetStopped.selection.candidate_snapshot.candidate_count,
  );
  const laterCutoff = cloneV01(input);
  laterCutoff.decision_time_cutoff = "2026-07-19T02:00:00.000Z";
  assert.notEqual(
    materializeSourceLinkedOperationalContinuationV01(laterCutoff)
      .materialization_identity.materialization_fingerprint,
    result.materialization_identity.materialization_fingerprint,
  );
}

function assertDecisionAndSourceRefusalsV01(
  input: MaterializeSourceLinkedOperationalContinuationInputV01,
): void {
  const postCutoff = cloneV01(input);
  postCutoff.decision_time_cutoff = "2026-07-19T00:00:02.500Z";
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(postCutoff),
    /operational_continuation_post_cutoff_decision_refused/u,
  );

  const duplicate = cloneV01(input);
  duplicate.decision_history = [
    ...duplicate.decision_history,
    cloneV01(duplicate.decision_history[0]!),
  ];
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(duplicate),
    /operational_continuation_duplicate_decision_refused/u,
  );

  const wrongCandidate = cloneV01(input);
  wrongCandidate.decision_history[0]!.decision = rebuildDecisionV01(
    wrongCandidate.decision_history[0]!.decision,
    {
      candidate: {
        ...wrongCandidate.decision_history[0]!.decision.candidate,
        candidate_fingerprint: `sha256:${"f".repeat(64)}`,
      },
    },
  );
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(wrongCandidate),
    /operational_continuation_decision_provenance_invalid/u,
  );

  const transitionIntent = cloneV01(input);
  const applying = transitionIntent.decision_history.find(
    (entry) => entry.decision.decision === "accept",
  )!;
  applying.decision = rebuildDecisionV01(applying.decision, {
    requested_transition_intent: {
      intent_id: "intent:acgc5a-refused",
      transition_kind: "other",
      bounded_summary: "Refused semantic Transition intent.",
      target_refs: cloneV01(
        input.operational_friction_materialization.proposal.proposed_deltas[0]!
          .target_refs,
      ),
      intent_only: true,
      applied: false,
      state_transition_receipt_ref: null,
    },
  });
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(transitionIntent),
    /operational_continuation_transition_intent_decision_refused/u,
  );

  const unresolvedCandidate =
    input.operational_friction_materialization.proposal.proposed_deltas[0]!;
  const referenceDecision = input.decision_history[0]!.decision;
  const sameTimestampA = syntheticDeferDecisionV01(
    referenceDecision,
    unresolvedCandidate,
    "ambiguous-a",
  );
  const sameTimestampB = syntheticDeferDecisionV01(
    referenceDecision,
    unresolvedCandidate,
    "ambiguous-b",
  );
  const ambiguous = cloneV01(input);
  ambiguous.decision_history = [
    ...ambiguous.decision_history.filter(
      (entry) =>
        entry.decision.candidate.candidate_id !==
        unresolvedCandidate.candidate_id,
    ),
    syntheticHistoryItemV01(sameTimestampA),
    syntheticHistoryItemV01(sameTimestampB),
  ];
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(ambiguous),
    /operational_continuation_effective_decision_ambiguous/u,
  );

  const crossProject = cloneV01(input);
  crossProject.project_id = "project:foreign";
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(crossProject),
    /operational_continuation_cross_scope_refused/u,
  );

  const crossWorkspace = cloneV01(input);
  crossWorkspace.workspace_id = "workspace:foreign";
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(crossWorkspace),
    /operational_continuation_cross_scope_refused/u,
  );

  const crossWork = cloneV01(input);
  crossWork.packet_a.work_ref = "work:foreign";
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(crossWork),
    /operational_continuation_packet_run_review_relation_invalid|operational_continuation_work_binding_mismatch/u,
  );

  const admissionMismatch = cloneV01(input);
  admissionMismatch.canonical_admission.admission_identity.proposal_id =
    "episode-delta-proposal:mismatch";
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(admissionMismatch),
    /operational_continuation_canonical_admission_conflict/u,
  );

  const sourceMismatch = cloneV01(input);
  sourceMismatch.operational_friction_source.paired_evaluation.evaluation_id =
    "personal-perspective-paired-evaluation:resealed";
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(sourceMismatch),
    /operational_continuation_acgc2_source_mismatch|operational_friction_paired_evaluation/u,
  );

  const genericUnknown = cloneV01(input);
  delete genericUnknown.operational_friction_materialization.proposal
    .operational_friction_proposal;
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(genericUnknown),
    /operational_continuation_acgc4_materialization_mismatch/u,
  );

  const semanticCandidate = cloneV01(input);
  semanticCandidate.operational_friction_materialization.proposal.proposed_deltas[0]!.operation =
    "add";
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(semanticCandidate),
    /operational_continuation_acgc4_materialization_mismatch/u,
  );

  const transitionReceiptConflict = cloneV01(input);
  transitionReceiptConflict.state_transition_receipts = [
    ...transitionReceiptConflict.state_transition_receipts,
    cloneV01(input.source_transition_receipt_a),
  ];
  assert.throws(
    () =>
      materializeSourceLinkedOperationalContinuationV01(
        transitionReceiptConflict,
      ),
    /operational_continuation_unexpected_transition_receipt_refused/u,
  );

  const linkedTransitionReceiptConflict = cloneV01(input);
  const linkedReceipt = cloneV01(input.source_transition_receipt_a);
  linkedReceipt.source_proposal = {
    proposal_version:
      input.operational_friction_materialization.proposal.proposal_version,
    proposal_id:
      input.operational_friction_materialization.proposal.proposal_id,
    proposal_fingerprint:
      input.operational_friction_materialization.proposal.integrity.fingerprint,
  };
  linkedTransitionReceiptConflict.state_transition_receipts = [linkedReceipt];
  assert.throws(
    () =>
      materializeSourceLinkedOperationalContinuationV01(
        linkedTransitionReceiptConflict,
      ),
    /operational_continuation_proposal_only_transition_conflict/u,
  );

  const secret = cloneV01(input);
  secret.packet_a.task.goal = `sk-proj-${"x".repeat(48)}`;
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(secret),
    /secret_shaped_material|packet_run_review_relation_invalid/u,
  );

  const privatePath = cloneV01(input);
  privatePath.packet_a.task.goal = "/Users/example/private/raw-output.txt";
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(privatePath),
    /operational_continuation_absolute_path_refused/u,
  );

  const rawField = cloneV01(input) as MaterializeSourceLinkedOperationalContinuationInputV01 & {
    raw_provider_output?: string;
  };
  rawField.raw_provider_output = "forbidden";
  assert.throws(
    () => materializeSourceLinkedOperationalContinuationV01(rawField),
    /operational_continuation_caller_material_refused/u,
  );
}

function assertQueryOnlyAdapterAndReportV01(
  fixture: TestFixtureV01,
  temporaryRoot: string,
): void {
  const { db, input, source_fixture: sourceFixture } = fixture;
  const requests = sourceFixture.exact_source_records.map((source) => ({
    review_id: source.context_use_review.review_id,
    review_fingerprint: source.context_use_review.integrity.fingerprint,
    context_shadow_projection:
      sourceFixture.materialization_source.context_shadow_projection,
  }));
  const request = {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    operator_id: fixture.config.operator_id,
    frames: requests,
    window_kind: "recent_3" as const,
    paired_evaluation:
      sourceFixture.materialization_source.paired_evaluation,
    decision_time_cutoff: input.decision_time_cutoff,
    max_selected_candidates: input.max_selected_candidates,
  };
  assert.throws(
    () => readOperationalContinuationV01(db, request),
    /operational_continuation_query_only_required/u,
  );
  const before = databaseCountSnapshotV01(db);
  const databaseImageBefore = db.serialize();
  const taskPacketCountBefore = countVNextCoreRecordsV01(db, {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    record_kind: "task_context_packet",
  });
  const semanticStateBefore = rowCountIfPresentV01(
    db,
    "vnext_semantic_state_entries",
  );
  const semanticHeadBefore = rowCountIfPresentV01(
    db,
    "vnext_semantic_target_heads",
  );
  db.pragma("query_only = ON");
  const result = readOperationalContinuationV01(db, request);
  const replay = readOperationalContinuationV01(db, request);
  assert.deepEqual(replay, result);
  assert.equal(result.canonical_admission_identity_verified, true);
  assert.equal(result.exact_source_rematerialization_bound, true);
  assert.equal(result.historical_canonical_writer_invocation_proven, false);
  assert.deepEqual(result.persistence_boundary, {
    sqlite_query_only_required: true,
    inserts: 0,
    updates: 0,
    deletes: 0,
    migrations: 0,
    local_session_mutations: 0,
    proposal_mutations: 0,
    decision_mutations: 0,
    task_context_packet_writes: 0,
    semantic_writes: 0,
    attachment_or_execution_decisions: 0,
    provider_calls: 0,
    model_calls: 0,
    network_calls: 0,
    github_calls: 0,
    external_calls: 0,
  });
  assert.deepEqual(databaseCountSnapshotV01(db), before);
  assert.equal(
    countVNextCoreRecordsV01(db, {
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      record_kind: "task_context_packet",
    }),
    taskPacketCountBefore,
  );
  assert.equal(
    rowCountIfPresentV01(db, "vnext_semantic_state_entries"),
    semanticStateBefore,
  );
  assert.equal(
    rowCountIfPresentV01(db, "vnext_semantic_target_heads"),
    semanticHeadBefore,
  );
  assert.equal(
    readVNextCoreRecordV01(db, {
      record_kind: "task_context_packet",
      record_id:
        result.continuation.candidate_task_context_packet_b.packet_id,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
    }),
    null,
  );

  const json = runOperationalContinuationReportV01({
    ...request,
    database_path: fixture.database_path,
    format: "json",
  });
  const markdown = runOperationalContinuationReportV01({
    ...request,
    database_path: fixture.database_path,
    format: "markdown",
  });
  const parsed = JSON.parse(json) as {
    result: typeof result;
  };
  assert.deepEqual(parsed.result, result);
  assert.match(markdown, /# Operational Continuation Candidate/u);
  assert.match(markdown, /Persisted: false/u);
  assert.match(markdown, /Current packet: false/u);
  assert.match(markdown, /Execution eligible: false/u);
  assert.equal(json.includes(fixture.database_path), false);
  assert.equal(markdown.includes(fixture.database_path), false);
  assert.equal(json.includes(temporaryRoot), false);
  assert.equal(markdown.includes(temporaryRoot), false);
  assert.deepEqual(databaseCountSnapshotV01(db), before);
  assert.equal(db.serialize().equals(databaseImageBefore), true);
}

function createFixtureV01(databasePath: string): TestFixtureV01 {
  const db = new Database(databasePath);
  ensureVNextDurableSemanticStoreSchemaV01(db);
  db.exec(VNEXT_LOCAL_OPERATOR_SESSION_SCHEMA_SQL_V01);
  const sourceFixture = buildOperationalFrictionDisposableReviewFixtureV01({
    persisted_source_role: "operational_fixture",
  });
  for (const source of sourceFixture.exact_source_records) {
    persistSourceChainV01(db, source);
  }
  const materialization = materializeOperationalFrictionProposalV01(
    sourceFixture.materialization_source,
  );
  const admission = admitEpisodeDeltaProposalV01(db, {
    expected: materialization,
    source: sourceFixture.materialization_source,
  });
  assert.equal(admission.status, "inserted");
  const config: VNextLocalOperatorPilotConfigV01 = {
    enabled: true,
    workspace_id: sourceFixture.materialization_source.workspace_id,
    project_id: sourceFixture.materialization_source.project_id,
    operator_id: "operator:acgc5a-disposable-review",
    database_path: databasePath,
  };
  const clock = new MutableClockV01();
  const secretSource = new DeterministicSecretSourceV01();
  const issued = issueVNextLocalOperatorBootstrapV01(db, {
    config,
    clock,
    secret_source: secretSource,
  });
  const consumed = consumeVNextLocalOperatorBootstrapV01(db, {
    config,
    bootstrap_token: issued.bootstrap_token,
    clock,
    secret_source: secretSource,
  });
  let credential = consumed.credential;
  const dispositions = ["accept", "reject", "defer", "accept"] as const;
  for (const [index, disposition] of dispositions.entries()) {
    clock.value = `2026-07-19T00:00:0${index + 1}.000Z`;
    const candidate = admission.proposal.proposed_deltas[index]!;
    const recorded = recordVNextOperatorPilotReviewDecisionV01(db, {
      config,
      credential,
      request: {
        proposal_id: admission.proposal.proposal_id,
        proposal_fingerprint: admission.proposal.integrity.fingerprint,
        candidate_id: candidate.candidate_id,
        candidate_fingerprint:
          createEpisodeDeltaCandidateFingerprintV01(candidate),
        decision: disposition,
        rationale_summary: `Bounded ACGC5A ${disposition} fixture judgment.`,
        ...(disposition === "defer"
          ? {
              revisit: {
                condition_summary:
                  "Revisit when exact operational verification is available.",
              },
            }
          : {}),
      },
      clock,
      secret_source: secretSource,
    });
    credential = credentialFromCookieV01(recorded.session_cookie.value);
  }
  const canonical = readOperationalFrictionProposalFromExactSourcesV01(
    db,
    sourceFixture.materialization_source,
  );
  assert(canonical);
  const detail = readVNextOperatorPilotSemanticReviewV01(db, {
    config,
    proposal_id: admission.proposal.proposal_id,
    authenticated_session_id: null,
  });
  assert.equal(
    detail.decision_history.every(
      (entry) =>
        entry.status === "valid" &&
        entry.pilot_session_bound &&
        entry.errors.length === 0,
    ),
    true,
  );
  const latest = sourceFixture.exact_source_records.at(-1)!;
  return {
    db,
    database_path: databasePath,
    source_fixture: sourceFixture,
    config,
    input: {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      prior_packet_a: latest.prior_task_context_packet,
      packet_a: latest.later_task_context_packet,
      source_transition_receipt_a: latest.source_transition_receipt,
      run_receipt_a: latest.later_task_run_receipt,
      context_use_review_a: latest.context_use_review,
      operational_friction_source: sourceFixture.materialization_source,
      operational_friction_materialization: materialization,
      canonical_admission: {
        ...canonical,
        exact_source_rematerialization_bound: true,
      },
      decision_history: detail.decision_history,
      state_transition_receipts: detail.transition_receipts,
      decision_time_cutoff: "2026-07-19T01:00:00.000Z",
      max_selected_candidates: 1,
    },
  };
}

function persistSourceChainV01(
  db: Database.Database,
  source: {
    prior_task_context_packet: TaskContextPacketV01;
    later_task_context_packet: TaskContextPacketV01;
    source_transition_receipt: StateTransitionReceiptV01;
    later_task_run_receipt: RunReceiptV01;
    context_use_review: MaterializeSourceLinkedOperationalContinuationInputV01["context_use_review_a"];
  },
): void {
  const records: VNextCoreRecordEnvelopeV01[] = [
    {
      record_kind: "task_context_packet",
      record_id: source.prior_task_context_packet.packet_id,
      workspace_id: source.prior_task_context_packet.workspace_id,
      project_id: source.prior_task_context_packet.project_id,
      fingerprint: source.prior_task_context_packet.integrity.fingerprint,
      idempotency_key: null,
      payload: source.prior_task_context_packet,
      created_at: source.prior_task_context_packet.generated_at,
    },
    {
      record_kind: "task_context_packet",
      record_id: source.later_task_context_packet.packet_id,
      workspace_id: source.later_task_context_packet.workspace_id,
      project_id: source.later_task_context_packet.project_id,
      fingerprint: source.later_task_context_packet.integrity.fingerprint,
      idempotency_key: null,
      payload: source.later_task_context_packet,
      created_at: source.later_task_context_packet.generated_at,
    },
    {
      record_kind: "state_transition_receipt",
      record_id: source.source_transition_receipt.transition_receipt_id,
      workspace_id: source.source_transition_receipt.workspace_id,
      project_id: source.source_transition_receipt.project_id,
      fingerprint: source.source_transition_receipt.integrity.fingerprint,
      idempotency_key: source.source_transition_receipt.idempotency_key,
      payload: source.source_transition_receipt,
      created_at: source.source_transition_receipt.recorded_at,
    },
    {
      record_kind: "run_receipt",
      record_id: source.later_task_run_receipt.receipt_id,
      workspace_id: source.later_task_run_receipt.workspace_id,
      project_id: source.later_task_run_receipt.project_id,
      fingerprint: source.later_task_run_receipt.integrity.fingerprint,
      idempotency_key: source.later_task_run_receipt.idempotency_key,
      payload: source.later_task_run_receipt,
      created_at: source.later_task_run_receipt.recorded_at,
    },
    {
      record_kind: "context_use_review",
      record_id: source.context_use_review.review_id,
      workspace_id: source.context_use_review.workspace_id,
      project_id: source.context_use_review.project_id,
      fingerprint: source.context_use_review.integrity.fingerprint,
      idempotency_key: null,
      payload: source.context_use_review,
      created_at: source.context_use_review.reviewed_at,
    },
  ];
  for (const record of records) insertVNextCoreRecordV01(db, record);
}

function rebuildDecisionV01(
  decision: ReviewDecisionV01,
  overrides: Partial<Parameters<typeof buildReviewDecisionV01>[0]>,
): ReviewDecisionV01 {
  const {
    decision_version: _version,
    decision_id: _id,
    target_class: _targetClass,
    material_boundary: _boundary,
    authority_summary,
    integrity: _integrity,
    ...builderInput
  } = cloneV01(decision);
  return buildReviewDecisionV01({
    ...builderInput,
    ...overrides,
    authority_notes: authority_summary.notes,
  });
}

function syntheticDeferDecisionV01(
  reference: ReviewDecisionV01,
  candidate: MaterializeSourceLinkedOperationalContinuationInputV01["operational_friction_materialization"]["proposal"]["proposed_deltas"][number],
  suffix: string,
): ReviewDecisionV01 {
  return rebuildDecisionV01(reference, {
    candidate: {
      candidate_id: candidate.candidate_id,
      candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(candidate),
    },
    decision: "defer",
    rationale_summary: `Bounded ambiguous defer ${suffix}.`,
    decided_at: "2026-07-19T00:30:00.000Z",
    revisit: {
      revisit_at: "2026-07-20T00:30:00.000Z",
      expires_at: "2026-07-26T00:30:00.000Z",
      condition_summary: `Exact revisit condition ${suffix}.`,
    },
    requested_transition_intent: null,
    lineage: {
      prior_decisions: [],
      superseding_candidate: null,
      retracted_decision: null,
    },
  });
}

function syntheticHistoryItemV01(
  decision: ReviewDecisionV01,
): OperationalContinuationDecisionHistoryItemV01 {
  return {
    decision,
    status: "valid",
    pilot_session_bound: true,
    pilot_actionable: false,
    session_id: "session:synthetic-source-bound-fixture",
    request_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(decision),
    ),
    errors: [],
  };
}

function credentialFromCookieV01(
  value: string,
): VNextLocalOperatorSessionCredentialV01 {
  const [prefix, sessionId, sessionSecret, actionNonce] = value.split(".");
  assert.equal(prefix, "vnext_session_v01");
  assert(sessionId && sessionSecret && actionNonce);
  return {
    session_id: sessionId,
    session_secret: sessionSecret,
    action_nonce: actionNonce,
  };
}

function databaseCountSnapshotV01(db: Database.Database): Record<string, number> {
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`,
    )
    .all() as Array<{ name: string }>;
  return Object.fromEntries(
    tables.map(({ name }) => [name, rowCountIfPresentV01(db, name)]),
  );
}

function rowCountIfPresentV01(db: Database.Database, table: string): number {
  const exists = db
    .prepare(
      "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ?",
    )
    .get(table) as { present: 1 } | undefined;
  if (!exists) return 0;
  const escaped = table.replaceAll('"', '""');
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM "${escaped}"`)
    .get() as { count: number };
  return row.count;
}

function pickBudgetLimitsV01(packet: TaskContextPacketV01) {
  return {
    bounded: packet.constraints.context_budget.bounded,
    max_selected_entries:
      packet.constraints.context_budget.max_selected_entries,
    max_projection_items:
      packet.constraints.context_budget.max_projection_items,
    max_characters: packet.constraints.context_budget.max_characters,
    max_estimated_tokens:
      packet.constraints.context_budget.max_estimated_tokens,
  };
}

function assertAllBooleanAuthorityFalseV01(value: object): void {
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "boolean") assert.equal(item, false, key);
  }
}

function assertNoRankingFieldsV01(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertNoRankingFieldsV01);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    assert.doesNotMatch(key, /rank|priority|utility|winner|score|scalar/u);
    assertNoRankingFieldsV01(item);
  }
}

function cloneV01<T>(value: T): T {
  return structuredClone(value);
}

function deepFreezeV01<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeV01(child);
    }
  }
  return value;
}

main();
