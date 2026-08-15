#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { readAutonomyRunLedgerRecord } from "@/lib/autonomy/runner-ledger";
import {
  buildSemanticReviewLoopProposalFixture,
  buildSemanticReviewLoopRunReceiptFixture,
  buildSemanticReviewLoopTaskContextPacketFixture,
  type SemanticReviewLoopProjectFixtureV01,
} from "@/fixtures/vnext/protocol/semantic-review-loop-v0-1";
import {
  buildContextUseAttributionProjectionV01,
  validateContextUseAttributionProjectionV01,
} from "@/lib/vnext/context-use-attribution-projection";
import {
  deriveContextUseReviewPresentationProvenanceV01,
  createContextUseReviewFingerprintV01,
  deriveContextUseReviewIdV01,
  validateContextUseReviewRelationsV01,
  validateContextUseReviewV01,
} from "@/lib/vnext/context-use-review";
import {
  buildOperationalContinuationComparisonV01,
  deriveOperationalContinuationExactCaseStatusV01,
  validateOperationalContinuationComparisonV01,
  type BuildOperationalContinuationComparisonInputV01,
} from "@/lib/vnext/operational-continuation-comparison";
import {
  confirmLocalProjectOnboardingV01,
  pickAndInspectLocalProjectV01,
} from "@/lib/vnext/onboarding/local-project-onboarding";
import {
  countVNextCoreRecordsV01,
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordKindV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
} from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  exportActivePortableProjectV01,
  importPortableProjectV01,
  parseAndValidatePortableProjectV01,
} from "@/lib/vnext/portability/portable-project";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  grantRepositoryExecutionDecisionFromBrowserSessionV01,
  prepareRepositoryExecutionV01,
} from "@/lib/vnext/repository-execution/repository-execution";
import {
  prepareRepositoryManagedDelegationV01,
  startRepositoryManagedDelegationV01,
} from "@/lib/vnext/repository-execution/repository-managed-delegation";
import {
  createEpisodeDeltaCandidateFingerprintV01,
} from "@/lib/vnext/review-decision";
import {
  buildRunReceiptV01,
  createRunReceiptFingerprintV01,
  deriveRunReceiptIdV01,
} from "@/lib/vnext/run-receipt";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  issueVNextRepositoryDecisionChallengeV01,
  revokeVNextLocalOperatorSessionByCredentialV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "@/lib/vnext/runtime/local-operator-session";
import { LiveNativeHostRunServiceV01 } from "@/lib/vnext/runtime/live-native-host-run-service";
import {
  recordVNextOperatorPilotContextUseReviewV01,
} from "@/lib/vnext/runtime/operator-pilot-context-use-review";
import {
  readVNextOperatorPilotSemanticReviewV01,
  recordVNextOperatorPilotReviewDecisionV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import {
  applyVNextOperatorPilotReviewedSemanticTransitionV01,
  confirmVNextOperatorPilotSemanticCommitV01,
  prepareVNextOperatorPilotSemanticCommitPreviewV01,
} from "@/lib/vnext/runtime/operator-pilot-semantic-transition";
import {
  readContextUseAttributionProjectionV01,
} from "@/lib/vnext/runtime/context-use-attribution-read-model";
import { createDeterministicCodexAdapterV01 } from "@/lib/vnext/native-host/deterministic-codex-adapter";
import { applyCanonicalDatabaseMigrations } from "@/scripts/canonical-database-migrations.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "@/scripts/recovery-canonical-record-validator";
import { renderOperationalContinuationComparisonReportV01 } from "@/scripts/operational-continuation-comparison-report";
import {
  runContextUseAttributionConformanceV01,
} from "@/scripts/vnext-protocol-conformance/context-use-attribution-projection";
import {
  runContextUseReviewConformanceV01,
} from "@/scripts/vnext-protocol-conformance/context-use-review";
import {
  cleanupReusableOperationalContinuationFixtureV01,
  completeReusableOperationalContinuationRunBV01,
  createReusableOperationalContinuationFixtureV01,
  reusableOperationalContinuationFixtureFetchCallsV01,
  type ReusableOperationalContinuationFixtureV01,
} from "@/scripts/test-operational-continuation-admission";
import type { AutonomyRunRecord } from "@/types/autonomy-runner-execution";
import type { ContextUseAttributionProjectionV01 } from "@/types/vnext/context-use-attribution-projection";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { NativeHostRequestV01 } from "@/types/vnext/native-host-adapter";
import type {
  OperationalContinuationComparisonV01,
  OperationalContinuationComparisonDimensionDeltaV01,
  OperationalContinuationManagedRunBindingV01,
  OperationalContinuationRepositoryStateBindingV01,
} from "@/types/vnext/operational-continuation-comparison";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

class DeterministicSecretsV01 implements VNextLocalOperatorSecretSourceV01 {
  private state = 0x6c4f2a19;
  calls = 0;

  bytes(size: number): Uint8Array {
    this.calls += 1;
    const value = new Uint8Array(size);
    for (let index = 0; index < size; index += 1) {
      this.state ^= this.state << 13;
      this.state ^= this.state >>> 17;
      this.state ^= this.state << 5;
      value[index] = this.state & 0xff;
    }
    return value;
  }
}

interface BaselineFixtureV01 {
  db: Database.Database;
  database_path: string;
  project_root: string;
  config: VNextLocalOperatorPilotConfigV01;
  prior_packet: TaskContextPacketV01;
  packet: TaskContextPacketV01;
  transition_receipt: StateTransitionReceiptV01;
  run: AutonomyRunRecord;
  run_receipt: RunReceiptV01;
  review: ContextUseReviewV01;
  attachment_id: string;
  attachment_binding_fingerprint: string;
  start_request_fingerprint: string;
  grant_fingerprint: string;
  controller_identity_fingerprint: string;
  delivered_request: NativeHostRequestV01;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const historicalReview = runContextUseReviewConformanceV01();
  const historicalAttribution = runContextUseAttributionConformanceV01();
  assert.equal(
    historicalReview.review_id,
    "context-use-review:829c76450c0d5995a87676d3",
  );
  assert.equal(
    historicalReview.fingerprint,
    "sha256:921f7ab49c08290a487eac63dba45c08a7319a622e457ee05f26b44800cd3fa0",
  );
  assert.equal(historicalAttribution.historical_review_compatibility_checked, true);
  assert.equal(
    historicalAttribution.fingerprint,
    "sha256:8f023e6faad3668247b2f5f1a4a339a75a25156b5e4110586ad4a104ffe0ed66",
  );

  const candidateFixture =
    await createReusableOperationalContinuationFixtureV01();
  let baseline: BaselineFixtureV01 | null = null;
  try {
    const candidateRunB =
      await completeReusableOperationalContinuationRunBV01(candidateFixture);
    assertTerminalRunBAndReceiptV01(candidateFixture, candidateRunB);
    const reviewResult = assertContinuationReviewV01(
      candidateFixture,
      candidateRunB,
    );
    const attribution = assertContinuationAttributionV01(
      candidateFixture,
      candidateRunB,
      reviewResult.review,
    );
    baseline = await buildBaselineV01(candidateFixture);
    const comparisonInput = buildComparisonInputV01(
      candidateFixture,
      candidateRunB,
      reviewResult.review,
      attribution,
      baseline,
    );
    const candidateStateBefore = databaseStateV01(candidateFixture.db);
    const baselineStateBefore = databaseStateV01(baseline.db);
    const candidateGitBefore = gitStatusV01(candidateFixture.project_root);
    const baselineGitBefore = gitStatusV01(baseline.project_root);
    assert.equal(candidateGitBefore, "");
    assert.equal(baselineGitBefore, "");
    const comparison = buildOperationalContinuationComparisonV01(
      deepFreeze(structuredClone(comparisonInput)),
    );
    assert.equal(validateOperationalContinuationComparisonV01(comparison).status, "valid");
    assertComparisonSemanticsV01(comparisonInput, comparison);
    assertComparisonIdentityV01(comparisonInput, comparison);
    const jsonReport = renderOperationalContinuationComparisonReportV01(
      comparison,
      "json",
    );
    const markdownReport = renderOperationalContinuationComparisonReportV01(
      comparison,
      "markdown",
    );
    assert.match(jsonReport, /"exact_case_status"/u);
    assert.match(jsonReport, /"synthetic_event_chronology"/u);
    assert.match(markdownReport, /Packet-level use is not distributed/u);
    assert.match(markdownReport, /inconclusive rather than refuted/u);
    assert.match(
      markdownReport,
      /Candidate latency provenance: synthetic_event_chronology/u,
    );
    assert.equal(databaseStateV01(candidateFixture.db), candidateStateBefore);
    assert.equal(databaseStateV01(baseline.db), baselineStateBefore);
    assert.equal(gitStatusV01(candidateFixture.project_root), candidateGitBefore);
    assert.equal(gitStatusV01(baseline.project_root), baselineGitBefore);
    assert.equal(validateRecoveryCanonicalDatabaseV01(candidateFixture.db).status, "valid");
    assert.equal(validateRecoveryCanonicalDatabaseV01(baseline.db).status, "valid");
    assertContinuationPortabilityV01(
      candidateFixture,
      reviewResult.review,
      attribution,
      candidateRunB,
    );
    assert.equal(reusableOperationalContinuationFixtureFetchCallsV01(), 0);
    assert.equal(gitRemotesV01(candidateFixture.project_root), "");
    assert.equal(gitRemotesV01(baseline.project_root), "");
    console.log(
      JSON.stringify(
        {
          suite: "operational-continuation-comparison-v0.1",
          status: "passed",
          historical_review_id: historicalReview.review_id,
          historical_review_fingerprint: historicalReview.fingerprint,
          historical_attribution_fingerprint: historicalAttribution.fingerprint,
          run_b_status: candidateRunB.run_b.status,
          run_b_receipt_id: candidateRunB.run_b_receipt.receipt_id,
          selected_operational_entries:
            comparison.continuation_contribution
              .selected_operational_entry_count,
          exact_delivered_entries:
            comparison.continuation_contribution.exact_delivered_count,
          exact_referenced_entries:
            comparison.continuation_contribution.exact_referenced_count,
          item_level_actual_use_proven: 0,
          comparison_id: comparison.comparison_id,
          comparison_fingerprint: comparison.integrity.fingerprint,
          exact_case_status: comparison.exact_case_status,
          complete_equal_budget_claim:
            comparison.equal_ceiling.complete_equal_budget_claim,
          equal_budget_is_equal_capability:
            comparison.equal_ceiling.equal_budget_is_equal_capability,
          candidate_review_burden: comparison.candidate_review_burden,
          baseline_review_burden: comparison.baseline_review_burden,
          candidate_coordination_overhead:
            comparison.candidate_coordination_overhead,
          baseline_coordination_overhead:
            comparison.baseline_coordination_overhead,
          candidate_cost_operability: comparison.candidate_cost_operability,
          baseline_cost_operability: comparison.baseline_cost_operability,
          trade_offs: comparison.trade_offs,
          skipped_unobserved_dimensions:
            comparison.skipped_unobserved_dimensions,
          harmful_transfer: comparison.harmful_transfer,
          real_provider_calls: 0,
          network_calls: 0,
          github_calls: 0,
          comparison_writes: 0,
          session_mutations_during_exact_replay: 0,
          packet_c_created: false,
          policy_activated: false,
          automatic_start_or_resume: false,
        },
        null,
        2,
      ),
    );
  } finally {
    baseline?.db.close();
    cleanupReusableOperationalContinuationFixtureV01(candidateFixture);
    assert.equal(existsSync(candidateFixture.root), false);
  }
}

type CandidateRunBV01 = Awaited<
  ReturnType<typeof completeReusableOperationalContinuationRunBV01>
>;

function assertTerminalRunBAndReceiptV01(
  fixture: ReusableOperationalContinuationFixtureV01,
  completed: CandidateRunBV01,
): void {
  assert.ok(
    ["completed", "failed", "blocked", "cancelled", "timed_out"].includes(
      completed.run_b.status,
    ),
  );
  assert.notEqual(completed.run_b.run_id, fixture.run_a.run_id);
  assert.notEqual(completed.run_b_attachment_id, fixture.run_a_attachment_id);
  assert.notEqual(
    completed.run_b_attachment_binding_fingerprint,
    fixture.run_a_attachment_binding_fingerprint,
  );
  assert.notEqual(
    completed.run_b_start_request_fingerprint,
    fixture.run_a_start_request_fingerprint,
  );
  assert.notEqual(
    completed.run_b_grant_fingerprint,
    fixture.run_a_grant_fingerprint,
  );
  assert.notEqual(
    completed.run_b_controller_runtime_instance_fingerprint,
    fixture.run_a_controller_runtime_instance_fingerprint,
  );
  assert.equal(completed.run_b_receipt.run_id, completed.run_b.run_id);
  assert.equal(
    completed.run_b_receipt.task_context_packet_ref?.external_id,
    completed.packet_b.packet_id,
  );
  assert.equal(
    completed.run_b_receipt.task_context_packet_ref?.source_ref,
    completed.packet_b.integrity.fingerprint,
  );
  assert.equal(
    "lineage_kind" in completed.delivered_request.packet_lineage &&
      completed.delivered_request.packet_lineage.lineage_kind,
    "source_linked_operational_continuation",
  );
  assert.equal(completed.delivered_request.repository_resume_context ?? null, null);
  for (const expected of [
    {
      ref_type: "operational_continuation_admission",
      external_id: completed.admission.admission_id,
      source_ref: completed.admission.integrity.fingerprint,
    },
    {
      ref_type: "source_linked_operational_continuation",
      external_id:
        completed.continuation.materialization_identity.materialization_id,
      source_ref:
        completed.continuation.materialization_identity
          .materialization_fingerprint,
    },
    {
      ref_type: "task_context_packet",
      external_id: fixture.packet_a.packet_id,
      source_ref: fixture.packet_a.integrity.fingerprint,
    },
  ]) {
    assert.ok(
      [...completed.run_b_receipt.source_refs, ...completed.run_b_receipt.external_refs].some(
        (ref) =>
          ref.ref_type === expected.ref_type &&
          ref.external_id === expected.external_id &&
          ref.source_ref === expected.source_ref,
      ),
      JSON.stringify(expected),
    );
  }
  const receiptCountBefore = countVNextCoreRecordsV01(fixture.db, {
    workspace_id: fixture.config.workspace_id,
    project_id: fixture.config.project_id,
    record_kind: "run_receipt",
  });
  const receiptReplay = insertVNextCoreRecordV01(fixture.db, {
    record_kind: "run_receipt",
    record_id: completed.run_b_receipt.receipt_id,
    workspace_id: fixture.config.workspace_id,
    project_id: fixture.config.project_id,
    fingerprint: completed.run_b_receipt.integrity.fingerprint,
    idempotency_key: completed.run_b_receipt.idempotency_key,
    payload: completed.run_b_receipt,
    created_at: completed.run_b_receipt.recorded_at,
  });
  assert.equal(receiptReplay.status, "exact_replay");
  const conflictingReceipt = structuredClone(completed.run_b_receipt);
  conflictingReceipt.result_summary.summary =
    "Conflicting duplicate terminal result must fail closed.";
  conflictingReceipt.receipt_id = deriveRunReceiptIdV01(conflictingReceipt);
  conflictingReceipt.integrity.fingerprint =
    createRunReceiptFingerprintV01(conflictingReceipt);
  assert.throws(
    () =>
      insertVNextCoreRecordV01(fixture.db, {
        record_kind: "run_receipt",
        record_id: conflictingReceipt.receipt_id,
        workspace_id: fixture.config.workspace_id,
        project_id: fixture.config.project_id,
        fingerprint: conflictingReceipt.integrity.fingerprint,
        idempotency_key: completed.run_b_receipt.idempotency_key,
        payload: conflictingReceipt,
        created_at: conflictingReceipt.recorded_at,
      }),
    /conflict|idempotency/u,
  );
  assert.equal(
    countVNextCoreRecordsV01(fixture.db, {
      workspace_id: fixture.config.workspace_id,
      project_id: fixture.config.project_id,
      record_kind: "run_receipt",
    }),
    receiptCountBefore,
  );
}

function assertContinuationReviewV01(
  fixture: ReusableOperationalContinuationFixtureV01,
  completed: CandidateRunBV01,
) {
  const secrets = new DeterministicSecretsV01();
  const request = {
    action: "record_context_use_review" as const,
    later_run_receipt_id: completed.run_b_receipt.receipt_id,
    later_run_receipt_fingerprint:
      completed.run_b_receipt.integrity.fingerprint,
    actually_used: "yes" as const,
    assessment: "helpful" as const,
    correction_summaries: [],
    notes: [
      "Packet-level continuation review; no item-level use or contribution is asserted.",
    ],
    metrics: {
      wrong_context_correction_count: 0,
      repeated_explanation_estimate: 0,
      missing_critical_context_count: 0,
      context_refs_used_count:
        completed.continuation.selection.selected_rows.length,
    },
  };
  const sessionBefore = sessionRowV01(
    fixture.db,
    completed.current_credential.session_id,
  );
  const coreCountBefore = countVNextCoreRecordsV01(fixture.db, {
    workspace_id: fixture.config.workspace_id,
    project_id: fixture.config.project_id,
    record_kind: "context_use_review",
  });
  const unauthorizedStateBefore = unauthorizedReviewEffectStateV01(fixture.db);
  const projectStateBefore = gitStatusV01(fixture.project_root);
  const secretCallsBefore = secrets.calls;
  const inserted = recordVNextOperatorPilotContextUseReviewV01(fixture.db, {
    config: fixture.config,
    credential: completed.current_credential,
    request,
    clock: fixedClockV01("2026-07-18T15:10:00.000Z"),
    secret_source: secrets,
  });
  assert.equal(inserted.status, "inserted");
  assert.equal(secrets.calls, secretCallsBefore + 1);
  assert.equal(
    countVNextCoreRecordsV01(fixture.db, {
      workspace_id: fixture.config.workspace_id,
      project_id: fixture.config.project_id,
      record_kind: "context_use_review",
    }),
    coreCountBefore + 1,
  );
  assert.equal(
    unauthorizedReviewEffectStateV01(fixture.db),
    unauthorizedStateBefore,
  );
  assert.equal(gitStatusV01(fixture.project_root), projectStateBefore);
  const currentCredential = credentialFromCookieV01(
    inserted.session_admission.cookie_value,
  );
  const sessionAfter = sessionRowV01(
    fixture.db,
    currentCredential.session_id,
  );
  assert.deepEqual(changedKeysV01(sessionBefore, sessionAfter), [
    "action_nonce_hash",
    "updated_at",
  ]);
  assert.notEqual(sessionBefore.action_nonce_hash, sessionAfter.action_nonce_hash);
  assert.equal(sessionAfter.updated_at, inserted.review.reviewed_at);
  assert.equal(inserted.review.source_transition_receipt, undefined);
  assert.deepEqual(inserted.review.source_operational_continuation, {
    lineage_kind: "source_linked_operational_continuation",
    admission_version: completed.admission.admission_version,
    admission_id: completed.admission.admission_id,
    admission_fingerprint: completed.admission.integrity.fingerprint,
    materialization_id:
      completed.continuation.materialization_identity.materialization_id,
    materialization_fingerprint:
      completed.continuation.materialization_identity
        .materialization_fingerprint,
    selection_id: completed.continuation.selection.selection_id,
    selection_fingerprint:
      completed.continuation.selection.integrity.fingerprint,
  });
  assert.equal(
    validateContextUseReviewRelationsV01(
      inserted.review,
      fixture.packet_a,
      completed.packet_b,
      completed.admission,
      completed.run_b_receipt,
    ).status,
    "valid",
  );

  const originalCredentialState = databaseStateV01(fixture.db);
  assert.throws(
    () =>
      recordVNextOperatorPilotContextUseReviewV01(fixture.db, {
        config: fixture.config,
        credential: completed.current_credential,
        request,
        clock: fixedClockV01("2026-07-18T15:10:30.000Z"),
        secret_source: secrets,
      }),
    /operator_action_nonce_invalid/u,
  );
  assert.equal(databaseStateV01(fixture.db), originalCredentialState);

  const stateBeforeReplay = databaseStateV01(fixture.db);
  const sessionBeforeReplay = sessionRowV01(
    fixture.db,
    currentCredential.session_id,
  );
  const callsBeforeReplay = secrets.calls;
  const replay = recordVNextOperatorPilotContextUseReviewV01(fixture.db, {
    config: fixture.config,
    credential: currentCredential,
    request,
    clock: fixedClockV01("2026-07-18T15:11:00.000Z"),
    secret_source: secrets,
  });
  assert.equal(replay.status, "exact_replay");
  assert.deepEqual(replay.review, inserted.review);
  assert.deepEqual(
    credentialFromCookieV01(replay.session_admission.cookie_value),
    currentCredential,
  );
  assert.equal(databaseStateV01(fixture.db), stateBeforeReplay);
  assert.deepEqual(
    sessionRowV01(fixture.db, currentCredential.session_id),
    sessionBeforeReplay,
  );
  assert.equal(secrets.calls, callsBeforeReplay);
  const secondReplay = recordVNextOperatorPilotContextUseReviewV01(
    fixture.db,
    {
      config: fixture.config,
      credential: currentCredential,
      request,
      clock: fixedClockV01("2026-07-18T15:11:01.000Z"),
      secret_source: secrets,
    },
  );
  assert.equal(secondReplay.status, "exact_replay");
  assert.equal(databaseStateV01(fixture.db), stateBeforeReplay);

  const secondConnection = new Database(fixture.database_path, {
    fileMustExist: true,
  });
  secondConnection.pragma("foreign_keys = ON");
  try {
    const insertionReplay = recordVNextOperatorPilotContextUseReviewV01(
      secondConnection,
      {
        config: fixture.config,
        credential: currentCredential,
        request,
        clock: fixedClockV01("2026-07-18T15:11:02.000Z"),
        secret_source: secrets,
      },
    );
    assert.equal(insertionReplay.status, "exact_replay");
  } finally {
    secondConnection.close();
  }
  assert.equal(databaseStateV01(fixture.db), stateBeforeReplay);
  assert.deepEqual(
    sessionRowV01(fixture.db, currentCredential.session_id),
    sessionBeforeReplay,
  );

  for (const [name, credential, clock, expected] of [
    [
      "invalid",
      { ...currentCredential, action_nonce: `${currentCredential.action_nonce}x` },
      "2026-07-18T15:11:03.000Z",
      /operator_action_nonce_invalid/u,
    ],
    [
      "expired",
      currentCredential,
      "2030-07-18T15:11:03.000Z",
      /operator_session_expired|operator_action_nonce_expired/u,
    ],
  ] as const) {
    const before = databaseStateV01(fixture.db);
    assert.throws(
      () =>
        recordVNextOperatorPilotContextUseReviewV01(fixture.db, {
          config: fixture.config,
          credential,
          request,
          clock: fixedClockV01(clock),
          secret_source: secrets,
        }),
      expected,
      name,
    );
    assert.equal(databaseStateV01(fixture.db), before, name);
  }

  const conflictBefore = databaseStateV01(fixture.db);
  assert.throws(
    () =>
      recordVNextOperatorPilotContextUseReviewV01(fixture.db, {
        config: fixture.config,
        credential: currentCredential,
        request: { ...request, assessment: "noisy" },
        clock: fixedClockV01("2026-07-18T15:11:04.000Z"),
        secret_source: secrets,
      }),
    /context_use_review_replay_conflict/u,
  );
  assert.equal(databaseStateV01(fixture.db), conflictBefore);
  assert.deepEqual(
    sessionRowV01(fixture.db, currentCredential.session_id),
    sessionBeforeReplay,
  );

  const revokedPath = path.join(fixture.root, "revoked-review.sqlite");
  writeFileSync(revokedPath, fixture.db.serialize());
  const revokedDb = new Database(revokedPath, { fileMustExist: true });
  revokedDb.pragma("foreign_keys = ON");
  try {
    revokeVNextLocalOperatorSessionByCredentialV01(revokedDb, {
      config: fixture.config,
      credential: currentCredential,
      clock: fixedClockV01("2026-07-18T15:11:05.000Z"),
    });
    const afterRevocation = databaseStateV01(revokedDb);
    assert.throws(
      () =>
        recordVNextOperatorPilotContextUseReviewV01(revokedDb, {
          config: fixture.config,
          credential: currentCredential,
          request,
          clock: fixedClockV01("2026-07-18T15:11:06.000Z"),
          secret_source: secrets,
        }),
      /operator_session_revoked/u,
    );
    assert.equal(databaseStateV01(revokedDb), afterRevocation);
  } finally {
    revokedDb.close();
  }

  const foreignPath = path.join(fixture.root, "foreign-review.sqlite");
  writeFileSync(foreignPath, fixture.db.serialize());
  const foreignDb = new Database(foreignPath, { fileMustExist: true });
  foreignDb.pragma("foreign_keys = ON");
  try {
    const foreignCredential = credentialV01(
      foreignDb,
      {
        ...fixture.config,
        project_id: `${fixture.config.project_id}-foreign`,
      },
      secrets,
      "2026-07-18T15:11:07.000Z",
    );
    const foreignBefore = databaseStateV01(foreignDb);
    assert.throws(
      () =>
        recordVNextOperatorPilotContextUseReviewV01(foreignDb, {
          config: fixture.config,
          credential: foreignCredential,
          request,
          clock: fixedClockV01("2026-07-18T15:11:08.000Z"),
          secret_source: secrets,
        }),
      /operator_session_scope_mismatch/u,
    );
    assert.equal(databaseStateV01(foreignDb), foreignBefore);
  } finally {
    foreignDb.close();
  }

  assertContinuationReviewNegativeRelationsV01(
    fixture,
    completed,
    inserted.review,
  );
  return { ...inserted, current_credential: currentCredential };
}

function assertContinuationReviewNegativeRelationsV01(
  fixture: ReusableOperationalContinuationFixtureV01,
  completed: CandidateRunBV01,
  review: ContextUseReviewV01,
): void {
  const both = structuredClone(review);
  both.source_transition_receipt = {
    transition_receipt_version: "state_transition_receipt.v0.1",
    transition_receipt_id: fixture.transition_receipt.transition_receipt_id,
    transition_receipt_fingerprint:
      fixture.transition_receipt.integrity.fingerprint,
  };
  resignReviewV01(both);
  assert.equal(validateContextUseReviewV01(both).status, "blocked");
  const neither = structuredClone(review);
  delete neither.source_operational_continuation;
  resignReviewV01(neither);
  assert.equal(validateContextUseReviewV01(neither).status, "blocked");
  const fakeTransition = structuredClone(review);
  delete fakeTransition.source_operational_continuation;
  fakeTransition.source_transition_receipt = {
    transition_receipt_version: "state_transition_receipt.v0.1",
    transition_receipt_id: fixture.transition_receipt.transition_receipt_id,
    transition_receipt_fingerprint:
      fixture.transition_receipt.integrity.fingerprint,
  };
  resignReviewV01(fakeTransition);
  assert.notEqual(
    validateContextUseReviewRelationsV01(
      fakeTransition,
      fixture.packet_a,
      completed.packet_b,
      fixture.transition_receipt,
      completed.run_b_receipt,
    ).status,
    "valid",
  );
  const orphan = structuredClone(review);
  orphan.source_operational_continuation!.admission_id =
    "operational-continuation-admission:orphan";
  resignReviewV01(orphan);
  assert.notEqual(
    validateContextUseReviewRelationsV01(
      orphan,
      fixture.packet_a,
      completed.packet_b,
      completed.admission,
      completed.run_b_receipt,
    ).status,
    "valid",
  );
  for (const [name, mutate] of [
    [
      "materialization_mismatch",
      (value: ContextUseReviewV01) => {
        value.source_operational_continuation!.materialization_fingerprint =
          `sha256:${"d".repeat(64)}`;
      },
    ],
    [
      "selection_mismatch",
      (value: ContextUseReviewV01) => {
        value.source_operational_continuation!.selection_fingerprint =
          `sha256:${"e".repeat(64)}`;
      },
    ],
  ] as const) {
    const mismatched = structuredClone(review);
    mutate(mismatched);
    resignReviewV01(mismatched);
    assert.notEqual(
      validateContextUseReviewRelationsV01(
        mismatched,
        fixture.packet_a,
        completed.packet_b,
        completed.admission,
        completed.run_b_receipt,
      ).status,
      "valid",
      name,
    );
  }
  for (const [name, admission] of [
    [
      "resealed_admission",
      {
        ...structuredClone(completed.admission),
        effect_summary: {
          ...completed.admission.effect_summary,
          packet_b_became_current_work: false,
        },
      },
    ],
    [
      "cross_scope_admission",
      {
        ...structuredClone(completed.admission),
        project_id: `${completed.admission.project_id}-foreign`,
      },
    ],
    [
      "second_hop_admission",
      {
        ...structuredClone(completed.admission),
        lineage: {
          ...completed.admission.lineage,
          continuation_hop: 2,
        },
      },
    ],
  ] as const) {
    assert.notEqual(
      validateContextUseReviewRelationsV01(
        review,
        fixture.packet_a,
        completed.packet_b,
        admission,
        completed.run_b_receipt,
      ).status,
      "valid",
      name,
    );
  }
  const missingLineageReceipt = buildRunReceiptV01({
    ...completed.run_b_receipt,
    source_refs: completed.run_b_receipt.source_refs.filter(
      (ref) =>
        ref.ref_type !== "operational_continuation_admission" ||
        ref.external_id !== completed.admission.admission_id,
    ),
    authority_notes: completed.run_b_receipt.authority_summary.notes,
  });
  const missingLineageReview = reviewForReceiptVariantV01(
    review,
    missingLineageReceipt,
  );
  assert.notEqual(
    validateContextUseReviewRelationsV01(
      missingLineageReview,
      fixture.packet_a,
      completed.packet_b,
      completed.admission,
      missingLineageReceipt,
    ).status,
    "valid",
  );
  const mismatchedPacketReceipt = buildRunReceiptV01({
    ...completed.run_b_receipt,
    task_context_packet_ref: {
      ...completed.run_b_receipt.task_context_packet_ref!,
      source_ref: `sha256:${"a".repeat(64)}`,
    },
    authority_notes: completed.run_b_receipt.authority_summary.notes,
  });
  const mismatchedPacketReview = reviewForReceiptVariantV01(
    review,
    mismatchedPacketReceipt,
  );
  assert.notEqual(
    validateContextUseReviewRelationsV01(
      mismatchedPacketReview,
      fixture.packet_a,
      completed.packet_b,
      completed.admission,
      mismatchedPacketReceipt,
    ).status,
    "valid",
  );
  const preReceipt = structuredClone(review);
  preReceipt.reviewed_at = "2026-07-18T15:07:00.000Z";
  resignReviewV01(preReceipt);
  assert.notEqual(
    validateContextUseReviewRelationsV01(
      preReceipt,
      fixture.packet_a,
      completed.packet_b,
      completed.admission,
      completed.run_b_receipt,
    ).status,
    "valid",
  );
}

function assertContinuationAttributionV01(
  fixture: ReusableOperationalContinuationFixtureV01,
  completed: CandidateRunBV01,
  review: ContextUseReviewV01,
): ContextUseAttributionProjectionV01 {
  const before = databaseStateV01(fixture.db);
  const projection = readContextUseAttributionProjectionV01(fixture.db, {
    workspace_id: fixture.config.workspace_id,
    project_id: fixture.config.project_id,
    review_id: review.review_id,
    review_fingerprint: review.integrity.fingerprint,
    operational_context_selection: completed.continuation.selection,
  });
  assert.equal(databaseStateV01(fixture.db), before);
  assert.equal(validateContextUseAttributionProjectionV01(projection).status, "valid");
  const operationalRows = projection.rows.filter(
    (row) => row.operational_continuation !== undefined,
  );
  assert.equal(
    operationalRows.length,
    completed.continuation.selection.selected_rows.length,
  );
  assert.ok(operationalRows.length > 0);
  for (const row of operationalRows) {
    assert.equal(row.selected, true);
    assert.equal(row.presentation.status, "yes");
    assert.equal(row.presentation.basis, "exact_packet_delivery");
    assert.equal(row.citation_or_reference.status, "referenced");
    assert.equal(
      row.citation_or_reference.basis,
      "exact_run_receipt_reference",
    );
    assert.equal(row.actual_use.status, "unknown");
    assert.equal(row.support_validation.status, "unknown");
    assert.equal(row.outcome_association.status, "unknown");
    assert.equal(row.causal_contribution.status, "unknown");
    assert.equal(row.operational_continuation!.item_level_credit_or_blame, false);
  }
  const excluded = new Set(
    completed.continuation.selection.excluded_rows.map(
      (row) => `${row.candidate_id}\0${row.candidate_fingerprint}`,
    ),
  );
  assert.equal(
    operationalRows.some((row) =>
      excluded.has(
        `${row.operational_continuation!.candidate_id}\0${row.operational_continuation!.candidate_fingerprint}`,
      ),
    ),
    false,
  );
  for (const request of [
    {
      workspace_id: fixture.config.workspace_id,
      project_id: fixture.config.project_id,
      review_id: review.review_id,
      review_fingerprint: `sha256:${"f".repeat(64)}`,
      operational_context_selection: completed.continuation.selection,
    },
    {
      workspace_id: fixture.config.workspace_id,
      project_id: `${fixture.config.project_id}-foreign`,
      review_id: review.review_id,
      review_fingerprint: review.integrity.fingerprint,
      operational_context_selection: completed.continuation.selection,
    },
    {
      workspace_id: fixture.config.workspace_id,
      project_id: fixture.config.project_id,
      review_id: review.review_id,
      review_fingerprint: review.integrity.fingerprint,
      operational_context_selection: {
        ...completed.continuation.selection,
        selection_id: "operational-context-selection:resealed",
      },
    },
  ]) {
    const state = databaseStateV01(fixture.db);
    assert.throws(() => readContextUseAttributionProjectionV01(fixture.db, request));
    assert.equal(databaseStateV01(fixture.db), state);
  }
  return projection;
}

function assertContinuationPortabilityV01(
  fixture: ReusableOperationalContinuationFixtureV01,
  review: ContextUseReviewV01,
  attribution: ContextUseAttributionProjectionV01,
  completed: CandidateRunBV01,
): void {
  const exported = exportActivePortableProjectV01(fixture.db, {
    include_personal_perspective: false,
    exported_at: "2026-07-18T15:30:00.000Z",
  });
  const parsed = parseAndValidatePortableProjectV01(exported.bytes);
  assert.equal(
    parsed.records.filter(
      (record) =>
        record.record_kind === "context_use_review" &&
        record.record_id === review.review_id &&
        record.fingerprint === review.integrity.fingerprint,
    ).length,
    1,
  );
  const destinationRoot = path.join(fixture.root, "acgc5c-portable-destination");
  const destinationProjects = path.join(destinationRoot, "projects");
  mkdirSync(destinationProjects, { recursive: true });
  const destination = new Database(path.join(destinationRoot, "augnes.db"));
  destination.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(destination);
  try {
    const imported = importPortableProjectV01(destination, {
      bytes: exported.bytes,
      destination_root_base: destinationProjects,
      imported_at: "2026-07-18T15:31:00.000Z",
    });
    assert.equal(imported.status, "imported");
    assert.equal(validateRecoveryCanonicalDatabaseV01(destination).status, "valid");
    assert.deepEqual(
      readContextUseAttributionProjectionV01(destination, {
        workspace_id: fixture.config.workspace_id,
        project_id: fixture.config.project_id,
        review_id: review.review_id,
        review_fingerprint: review.integrity.fingerprint,
        operational_context_selection: completed.continuation.selection,
      }),
      attribution,
    );
  } finally {
    destination.close();
  }
}

async function buildBaselineV01(
  candidate: ReusableOperationalContinuationFixtureV01,
): Promise<BaselineFixtureV01> {
  const databasePath = path.join(candidate.root, "baseline.sqlite");
  const projectRoot = candidate.baseline_seed_root;
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = projectRoot;
  const openDatabase = () => openDatabaseV01(databasePath);
  const db = openDatabase();
  const secrets = new DeterministicSecretsV01();
  try {
    const picked = await pickAndInspectLocalProjectV01({
      open_database: openDatabase,
      now: () => "2026-07-18T09:55:00.000Z",
      repository_execution_dependencies: { platform: "darwin" },
    });
    assert.equal(picked.status, "selected");
    const onboarded = await confirmLocalProjectOnboardingV01(
      db,
      {
        selection_token: picked.selection_token,
        inspection_fingerprint: picked.inspection.inspection_fingerprint,
        display_name: "ACGC5C isolated one-run baseline",
      },
      {
        now: () => "2026-07-18T09:56:00.000Z",
        repository_execution_dependencies: { platform: "darwin" },
      },
    );
    const existing = readActiveProjectSelectionV01(
      db,
      onboarded.project.workspace_id,
    );
    if (existing?.project_id !== onboarded.project.project_id) {
      selectActiveProjectV01(db, {
        workspace_id: onboarded.project.workspace_id,
        project_id: onboarded.project.project_id,
        expected_project_id: existing?.project_id ?? null,
        expected_revision: existing?.selection_revision ?? null,
        now: "2026-07-18T09:57:00.000Z",
      });
    }
    const config: VNextLocalOperatorPilotConfigV01 = {
      enabled: true,
      workspace_id: onboarded.project.workspace_id,
      project_id: onboarded.project.project_id,
      operator_id: "operator:acgc5c-baseline",
      database_path: databasePath,
    };
    const semanticProject: SemanticReviewLoopProjectFixtureV01 = {
      fixture_id: "acgc5c-baseline-packet",
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      run_id: "run:acgc5c-baseline-semantic-source",
    };
    const priorPacket = buildSemanticReviewLoopTaskContextPacketFixture(
      semanticProject,
    );
    persistCoreV01(db, "task_context_packet", priorPacket, null);
    const semanticReceipt = buildSemanticReviewLoopRunReceiptFixture(
      semanticProject,
      priorPacket,
      { timeline_anchor_at: "2026-07-18T10:05:00.000Z" },
    );
    const semanticProposal = buildSemanticReviewLoopProposalFixture(
      semanticProject,
      priorPacket,
      semanticReceipt,
      { timeline_anchor_at: "2026-07-18T10:10:00.000Z" },
    );
    persistCoreV01(db, "run_receipt", semanticReceipt);
    persistCoreV01(db, "episode_delta_proposal", semanticProposal);
    const semanticReview = readVNextOperatorPilotSemanticReviewV01(db, {
      config,
      proposal_id: semanticProposal.proposal_id,
      authenticated_session_id: null,
    });
    const admission = semanticReview.candidate_admissions.find(
      (item) => item.decision_allowed.accept,
    );
    const semanticCandidate = semanticProposal.proposed_deltas.find(
      (item) =>
        item.candidate_id === admission?.candidate_id &&
        createEpisodeDeltaCandidateFingerprintV01(item) ===
          admission.candidate_fingerprint,
    );
    assert(semanticCandidate);
    const decisionCredential = credentialV01(
      db,
      config,
      secrets,
      "2026-07-18T10:20:00.000Z",
    );
    const decision = recordVNextOperatorPilotReviewDecisionV01(db, {
      config,
      credential: decisionCredential,
      request: {
        proposal_id: semanticProposal.proposal_id,
        proposal_fingerprint: semanticProposal.integrity.fingerprint,
        candidate_id: semanticCandidate.candidate_id,
        candidate_fingerprint:
          createEpisodeDeltaCandidateFingerprintV01(semanticCandidate),
        decision: "accept",
        rationale_summary:
          "Accept the bounded isolated semantic packet used by the one-run baseline.",
        revisit: null,
      },
      clock: fixedClockV01("2026-07-18T10:21:00.000Z"),
      secret_source: secrets,
    });
    const exactDecision = {
      proposal_id: semanticProposal.proposal_id,
      proposal_fingerprint: semanticProposal.integrity.fingerprint,
      decision_id: decision.decision.decision_id,
      decision_fingerprint: decision.decision.integrity.fingerprint,
    };
    const postDecisionCredential = credentialFromCookieV01(
      decision.session_cookie.value,
    );
    const preview = prepareVNextOperatorPilotSemanticCommitPreviewV01(db, {
      config,
      credential: postDecisionCredential,
      request: exactDecision,
      clock: sequenceClockV01(
        "2026-07-18T10:22:00.000Z",
        "2026-07-18T10:22:01.000Z",
      ),
    });
    const authorization = confirmVNextOperatorPilotSemanticCommitV01(db, {
      config,
      credential: postDecisionCredential,
      preview_binding_cookie: preview.preview_binding_cookie,
      request: {
        ...exactDecision,
        confirmation_digest: preview.preview.confirmation_digest,
      },
      clock: fixedClockV01("2026-07-18T10:23:00.000Z"),
      secret_source: secrets,
    });
    const applied = applyVNextOperatorPilotReviewedSemanticTransitionV01(db, {
      config,
      credential: credentialFromCookieV01(
        authorization.session_admission.cookie_value,
      ),
      request: {
        ...exactDecision,
        gate_record_id: authorization.gate_record.gate_record_id,
        gate_record_fingerprint:
          authorization.gate_record.integrity.fingerprint,
        prior_packet_id: priorPacket.packet_id,
        prior_packet_fingerprint: priorPacket.integrity.fingerprint,
      },
      clock: sequenceClockV01(
        "2026-07-18T10:24:00.000Z",
        "2026-07-18T10:24:01.000Z",
        "2026-07-18T10:24:02.000Z",
        "2026-07-18T10:24:03.000Z",
        "2026-07-18T10:24:04.000Z",
      ),
      secret_source: secrets,
    });
    assert.equal(applied.status, "applied");
    const attachment = await prepareRepositoryExecutionV01(
      db,
      { workspace_id: config.workspace_id, project_id: config.project_id },
      { now: () => "2026-07-18T10:40:00.000Z", platform: "darwin" },
    );
    assert.equal(attachment.status, "prepared", JSON.stringify(attachment));
    assert(attachment.attachment);
    const captured: NativeHostRequestV01[] = [];
    const delegate = createDeterministicCodexAdapterV01({
      now: () => "2026-07-18T10:47:00.000Z",
    });
    const service = new LiveNativeHostRunServiceV01({
      open_database: openDatabase,
      adapter_factory: () => ({
        ...delegate,
        invoke(request, control) {
          captured.push(structuredClone(request));
          return delegate.invoke(request, control);
        },
      }),
      now: () => "2026-07-18T10:47:00.000Z",
      runtime_instance_fingerprint: `sha256:${"3".repeat(64)}`,
      runtime_generation_fingerprint: `sha256:${"c".repeat(64)}`,
      repository_execution_dependencies: { platform: "darwin" },
    });
    let run: AutonomyRunRecord;
    let runReceipt: RunReceiptV01;
    let startRequestFingerprint: string;
    let grantFingerprint: string;
    try {
      const prepared = await prepareRepositoryManagedDelegationV01(
        db,
        {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          attachment_id: attachment.attachment.attachment_id,
        },
        service,
        { now: () => "2026-07-18T10:41:00.000Z", platform: "darwin" },
      );
      assert.equal(prepared.status, "decision_required");
      assert(prepared.decision_request && prepared.execution_envelope);
      const grant = grantStartDecisionV01(
        db,
        config,
        secrets,
        prepared.decision_request,
        "2026-07-18T10:42:00.000Z",
      );
      const started = await startRepositoryManagedDelegationV01(
        db,
        {
          config,
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          attachment_id: attachment.attachment.attachment_id,
          expected_attachment_binding_fingerprint:
            attachment.attachment.binding_fingerprint,
          expected_execution_envelope_fingerprint:
            prepared.execution_envelope.envelope_fingerprint,
          decision_request_fingerprint: grant.request_fingerprint,
          decision_grant_fingerprint: grant.grant_fingerprint!,
        },
        service,
        { now: () => "2026-07-18T10:43:00.000Z", platform: "darwin" },
      );
      assert.equal(started.status, "accepted");
      await waitForTerminalV01(db, started.run_id);
      const found = readAutonomyRunLedgerRecord(started.run_id, { db });
      assert(found);
      run = found;
      const receiptRecord = readVNextCoreRecordV01(db, {
        record_kind: "run_receipt",
        record_id: String(run.metadata.run_receipt_id),
        workspace_id: config.workspace_id,
        project_id: config.project_id,
      });
      assert(receiptRecord);
      runReceipt = receiptRecord.payload as RunReceiptV01;
      startRequestFingerprint = prepared.decision_request.request_fingerprint;
      grantFingerprint = grant.grant_fingerprint!;
    } finally {
      await service.shutdown();
    }
    assert.equal(captured.length, 1);
    assert.equal(captured[0]!.repository_resume_context ?? null, null);
    assert.equal(
      "source_transition_receipt_ref" in captured[0]!.packet_lineage,
      true,
    );
    const reviewCredential = credentialV01(
      db,
      config,
      secrets,
      "2026-07-18T10:48:00.000Z",
    );
    const review = recordVNextOperatorPilotContextUseReviewV01(db, {
      config,
      credential: reviewCredential,
      request: {
        action: "record_context_use_review",
        later_run_receipt_id: runReceipt.receipt_id,
        later_run_receipt_fingerprint: runReceipt.integrity.fingerprint,
        actually_used: "yes",
        assessment: "helpful",
        correction_summaries: [],
        notes: [
          "Isolated one-run baseline review with no continuation material.",
        ],
        metrics: {
          wrong_context_correction_count: 0,
          repeated_explanation_estimate: 0,
          missing_critical_context_count: 0,
          context_refs_used_count: 0,
        },
      },
      clock: fixedClockV01("2026-07-18T10:49:00.000Z"),
      secret_source: secrets,
    });
    assert.equal(review.status, "inserted");
    assert.equal(review.review.source_operational_continuation, undefined);
    assert.ok(review.review.source_transition_receipt);
    assert.equal(
      countVNextCoreRecordsV01(db, {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        record_kind: "operational_continuation_admission",
      }),
      0,
    );
    assert.equal(
      countScopedV01(db, "autonomy_runs", config),
      1,
    );
    return {
      db,
      database_path: databasePath,
      project_root: projectRoot,
      config,
      prior_packet: priorPacket,
      packet: applied.later_packet,
      transition_receipt: applied.transition_receipt,
      run,
      run_receipt: runReceipt,
      review: review.review,
      attachment_id: attachment.attachment.attachment_id,
      attachment_binding_fingerprint:
        attachment.attachment.binding_fingerprint,
      start_request_fingerprint: startRequestFingerprint,
      grant_fingerprint: grantFingerprint,
      controller_identity_fingerprint: `sha256:${"3".repeat(64)}`,
      delivered_request: captured[0]!,
    };
  } catch (error) {
    db.close();
    throw error;
  }
}

function buildComparisonInputV01(
  candidate: ReusableOperationalContinuationFixtureV01,
  completed: CandidateRunBV01,
  reviewB: ContextUseReviewV01,
  attributionB: ContextUseAttributionProjectionV01,
  baseline: BaselineFixtureV01,
): BuildOperationalContinuationComparisonInputV01 {
  assert.deepEqual(candidate.packet_a.task, baseline.packet.task);
  assert.deepEqual(
    candidate.packet_a.constraints.required_checks,
    baseline.packet.constraints.required_checks,
  );
  assert.deepEqual(
    candidate.packet_a.constraints.forbidden_actions,
    baseline.packet.constraints.forbidden_actions,
  );
  assert.equal(
    candidate.packet_a.constraints.data_classification,
    baseline.packet.constraints.data_classification,
  );
  const constructionCutoff = "2026-07-18T09:54:00.000Z";
  const candidateRepository = repositoryStateV01(
    candidate.project_root,
    candidateRunPolicyV01(completed.delivered_request),
    verifierOwnerFingerprintV01(completed.run_b_receipt),
    constructionCutoff,
  );
  const baselineRepository = repositoryStateV01(
    baseline.project_root,
    candidateRunPolicyV01(baseline.delivered_request),
    verifierOwnerFingerprintV01(baseline.run_receipt),
    constructionCutoff,
  );
  assert.equal(
    candidateRepository.frozen_head_commit,
    baselineRepository.frozen_head_commit,
  );
  assert.equal(
    candidateRepository.frozen_worktree_content_fingerprint,
    baselineRepository.frozen_worktree_content_fingerprint,
  );
  assert.equal(
    candidateRepository.operation_approval_policy_fingerprint,
    baselineRepository.operation_approval_policy_fingerprint,
  );
  assert.equal(
    candidateRepository.verification_owner_set_fingerprint,
    baselineRepository.verification_owner_set_fingerprint,
  );
  const runA = managedRunBindingV01({
    run: candidate.run_a,
    receipt: candidate.run_a_receipt,
    packet: candidate.packet_a,
    attachment_id: candidate.run_a_attachment_id,
    attachment_binding_fingerprint:
      candidate.run_a_attachment_binding_fingerprint,
    start_request_fingerprint: candidate.run_a_start_request_fingerprint,
    grant_fingerprint: candidate.run_a_grant_fingerprint,
    controller_identity_fingerprint:
      candidate.run_a_controller_runtime_instance_fingerprint,
  });
  const runB = managedRunBindingV01({
    run: completed.run_b,
    receipt: completed.run_b_receipt,
    packet: completed.packet_b,
    attachment_id: completed.run_b_attachment_id,
    attachment_binding_fingerprint:
      completed.run_b_attachment_binding_fingerprint,
    start_request_fingerprint: completed.run_b_start_request_fingerprint,
    grant_fingerprint: completed.run_b_grant_fingerprint,
    controller_identity_fingerprint:
      completed.run_b_controller_runtime_instance_fingerprint,
  });
  const baselineRun = managedRunBindingV01({
    run: baseline.run,
    receipt: baseline.run_receipt,
    packet: baseline.packet,
    attachment_id: baseline.attachment_id,
    attachment_binding_fingerprint:
      baseline.attachment_binding_fingerprint,
    start_request_fingerprint: baseline.start_request_fingerprint,
    grant_fingerprint: baseline.grant_fingerprint,
    controller_identity_fingerprint:
      baseline.controller_identity_fingerprint,
  });
  return {
    task_family_key: "semantic-review-loop-equal-budget-stage-5",
    frozen_construction_cutoff: constructionCutoff,
    observation_cutoff: "2026-07-18T16:00:00.000Z",
    equal_ceiling: {
      provider_call_count: 0,
      host_tool_command_count: 0,
      step_operation_count: runA.run_id === runB.run_id ? 1 : 2,
      usage_unit_count: 0,
      cost_microunits: 0,
      latency_ms: 10_000_000,
    },
    candidate: {
      evaluation_case_id: "evaluation-case:acgc5c-stage-5",
      repository_state: candidateRepository,
      packet_a: candidate.packet_a,
      run_a: runA,
      run_receipt_a: candidate.run_a_receipt,
      continuation: completed.continuation,
      admission: completed.admission,
      run_b: runB,
      run_receipt_b: completed.run_b_receipt,
      context_use_review_b: reviewB,
      context_use_attribution_b: attributionB,
      exact_observations: {
        step_operation_count:
          candidate.run_a.steps.length + completed.run_b.steps.length,
        required_human_interventions: null,
        recovery_reconciliation_actions: 0,
        cleanup_recovery_burden: 0,
        additional_review_actions: 0,
        latency_provenance: "synthetic_event_chronology",
      },
    },
    baseline: {
      evaluation_case_id: "evaluation-case:acgc5c-stage-5",
      repository_state: baselineRepository,
      prior_packet: baseline.prior_packet,
      packet: baseline.packet,
      source_transition_receipt: baseline.transition_receipt,
      run: baselineRun,
      run_receipt: baseline.run_receipt,
      context_use_review: baseline.review,
      exact_observations: {
        step_operation_count: baseline.run.steps.length,
        required_human_interventions: null,
        recovery_reconciliation_actions: 0,
        cleanup_recovery_burden: 0,
        additional_review_actions: 0,
        latency_provenance: "synthetic_event_chronology",
      },
    },
    limitations: [
      "The deterministic exact-case fixture does not observe usage units or monetary cost.",
      "Injected deterministic timestamps preserve protocol chronology but do not measure performance latency.",
      "The baseline and candidate have equal declared ceilings, not proven equal capability.",
    ],
  };
}

function assertComparisonSemanticsV01(
  input: BuildOperationalContinuationComparisonInputV01,
  comparison: OperationalContinuationComparisonV01,
): void {
  assert.equal(comparison.candidate.run_a.run_id, input.candidate.run_a.run_id);
  assert.equal(comparison.candidate.run_b.run_id, input.candidate.run_b.run_id);
  assert.notEqual(comparison.candidate.run_a.run_id, comparison.candidate.run_b.run_id);
  assert.equal(comparison.baseline.run_count, 1);
  assert.equal(comparison.baseline.resume_used, false);
  assert.equal(comparison.baseline.operational_continuation_present, false);
  assert.equal(comparison.equal_ceiling.same_total_declared_ceiling, true);
  assert.equal(
    comparison.equal_ceiling.baseline_not_artificially_capability_constrained,
    true,
  );
  assert.equal(comparison.equal_ceiling.equal_budget_is_equal_capability, false);
  assert.equal(comparison.equal_ceiling.complete_equal_budget_claim, false);
  assert.ok(
    comparison.skipped_unobserved_dimensions.includes(
      "budget.usage_unit_count",
    ),
  );
  assert.ok(
    comparison.skipped_unobserved_dimensions.includes("budget.cost_microunits"),
  );
  assert.ok(
    comparison.skipped_unobserved_dimensions.includes("budget.latency_ms"),
  );
  assert.equal(
    comparison.continuation_contribution.selected_operational_entry_count,
    input.candidate.continuation.selection.selected_rows.length,
  );
  assert.equal(
    comparison.continuation_contribution.exact_delivered_count,
    comparison.continuation_contribution.selected_operational_entry_count,
  );
  assert.equal(
    comparison.continuation_contribution.exact_referenced_count,
    comparison.continuation_contribution.selected_operational_entry_count,
  );
  assert.equal(
    comparison.continuation_contribution.item_level_actual_use_proven_count,
    0,
  );
  assert.equal(comparison.continuation_contribution.support_validated_count, 0);
  assert.equal(comparison.continuation_contribution.outcome_associated_count, 0);
  assert.equal(comparison.continuation_contribution.causally_supported_count, 0);
  assert.equal(comparison.continuation_contribution.bundle_credit_assigned, false);
  assert.equal(comparison.candidate_coordination_overhead.managed_runs, 2);
  assert.equal(comparison.baseline_coordination_overhead.managed_runs, 1);
  assert.equal(comparison.candidate_coordination_overhead.repository_attachments, 2);
  assert.equal(comparison.baseline_coordination_overhead.repository_attachments, 1);
  assert.equal(comparison.candidate_cost_operability.provider_model_call_count, 0);
  assert.equal(comparison.baseline_cost_operability.provider_model_call_count, 0);
  assert.equal(
    comparison.candidate_coordination_overhead.required_human_interventions,
    null,
  );
  assert.equal(
    comparison.baseline_coordination_overhead.required_human_interventions,
    null,
  );
  for (const cost of [
    comparison.candidate_cost_operability,
    comparison.baseline_cost_operability,
  ]) {
    assert.equal(cost.usage_unit_count, null);
    assert.equal(cost.cost_microunits, null);
    assert.equal(cost.run_latency_ms, null);
    assert.equal(cost.end_to_end_latency_ms, null);
    assert.equal(cost.latency_provenance, "synthetic_event_chronology");
  }
  for (const coordination of [
    comparison.candidate_coordination_overhead,
    comparison.baseline_coordination_overhead,
  ]) {
    assert.equal(coordination.coordination_elapsed_latency_ms, null);
    assert.equal(
      coordination.latency_provenance,
      "synthetic_event_chronology",
    );
  }
  const observedBaselineBetterCoordination = [
    "coordination.managed_runs",
    "coordination.repository_attachments",
    "coordination.browser_start_confirmations",
    "coordination.proposal_only_review_decisions",
    "coordination.continuation_admission_actions",
    "coordination.context_use_review_actions",
  ];
  for (const dimension of observedBaselineBetterCoordination) {
    assert.equal(
      comparison.dimension_deltas.find((row) => row.dimension === dimension)
        ?.relation,
      "baseline_better",
      dimension,
    );
  }
  assert.equal(
    comparison.dimension_deltas.some(
      (row) => row.relation === "candidate_better",
    ),
    false,
  );
  assert.equal(comparison.exact_case_status, "inconclusive");
  assert.equal(comparison.exact_case_only, true);
  assert.equal(comparison.no_bundle_credit, true);
  for (const [key, value] of Object.entries(comparison.authority_summary)) {
    assert.equal(value, false, key);
  }
  assertNoScoreRankWinnerV01(comparison);
  assertStatusVariantsV01(comparison);
  assertTerminalReceiptVariantsV01(input);
}

function assertComparisonIdentityV01(
  input: BuildOperationalContinuationComparisonInputV01,
  comparison: OperationalContinuationComparisonV01,
): void {
  const inputBefore = canonicalizeProtocolValueV01(input);
  const replay = buildOperationalContinuationComparisonV01(input);
  assert.deepEqual(replay, comparison);
  assert.equal(canonicalizeProtocolValueV01(input), inputBefore);

  const reordered = structuredClone(input);
  reordered.limitations.reverse();
  assert.deepEqual(
    buildOperationalContinuationComparisonV01(reordered),
    comparison,
  );

  const changedBudget = structuredClone(input);
  changedBudget.equal_ceiling.latency_ms += 1;
  const budgetComparison =
    buildOperationalContinuationComparisonV01(changedBudget);
  assert.notEqual(budgetComparison.comparison_id, comparison.comparison_id);
  assert.notEqual(
    budgetComparison.integrity.fingerprint,
    comparison.integrity.fingerprint,
  );

  const changedObservation = structuredClone(input);
  changedObservation.candidate.exact_observations.cleanup_recovery_burden = 1;
  const observationComparison =
    buildOperationalContinuationComparisonV01(changedObservation);
  assert.notEqual(observationComparison.comparison_id, comparison.comparison_id);

  const changedSyntheticSpacing = structuredClone(input);
  changedSyntheticSpacing.candidate.context_use_review_b.reviewed_at =
    "2026-07-18T15:50:00.000Z";
  resignReviewV01(changedSyntheticSpacing.candidate.context_use_review_b);
  changedSyntheticSpacing.candidate.context_use_attribution_b =
    buildContextUseAttributionProjectionV01({
      review: changedSyntheticSpacing.candidate.context_use_review_b,
      prior_packet: changedSyntheticSpacing.candidate.packet_a,
      later_packet:
        changedSyntheticSpacing.candidate.continuation
          .candidate_task_context_packet_b,
      source_operational_continuation_admission:
        changedSyntheticSpacing.candidate.admission,
      source_operational_context_selection:
        changedSyntheticSpacing.candidate.continuation.selection,
      later_task_run_receipt:
        changedSyntheticSpacing.candidate.run_receipt_b,
    });
  const changedSyntheticSpacingComparison =
    buildOperationalContinuationComparisonV01(changedSyntheticSpacing);
  assert.notEqual(
    changedSyntheticSpacingComparison.comparison_id,
    comparison.comparison_id,
  );
  assert.equal(
    changedSyntheticSpacingComparison.exact_case_status,
    "inconclusive",
  );
  assert.equal(
    changedSyntheticSpacingComparison.candidate_coordination_overhead
      .coordination_elapsed_latency_ms,
    null,
  );
  assert.equal(
    changedSyntheticSpacingComparison.candidate_cost_operability
      .end_to_end_latency_ms,
    null,
  );

  const unavailableLatency = structuredClone(input);
  unavailableLatency.candidate.exact_observations.latency_provenance =
    "unobserved";
  unavailableLatency.baseline.exact_observations.latency_provenance =
    "unobserved";
  const unavailableLatencyComparison =
    buildOperationalContinuationComparisonV01(unavailableLatency);
  assert.equal(
    unavailableLatencyComparison.candidate_cost_operability.latency_provenance,
    "unobserved",
  );
  assert.equal(
    unavailableLatencyComparison.candidate_cost_operability.run_latency_ms,
    null,
  );
  assert.equal(
    unavailableLatencyComparison.exact_case_status,
    "inconclusive",
  );

  const unsupportedObservedLatency = structuredClone(input);
  unsupportedObservedLatency.candidate.exact_observations.latency_provenance =
    "observed_elapsed";
  assert.throws(
    () =>
      buildOperationalContinuationComparisonV01(
        unsupportedObservedLatency,
      ),
    /operational_comparison_observed_latency_source_unavailable/u,
  );

  const changedReview = structuredClone(input);
  changedReview.candidate.context_use_review_b.metrics.repeated_explanation_estimate =
    1;
  resignReviewV01(changedReview.candidate.context_use_review_b);
  changedReview.candidate.context_use_attribution_b =
    buildContextUseAttributionProjectionV01({
      review: changedReview.candidate.context_use_review_b,
      prior_packet: changedReview.candidate.packet_a,
      later_packet:
        changedReview.candidate.continuation.candidate_task_context_packet_b,
      source_operational_continuation_admission:
        changedReview.candidate.admission,
      source_operational_context_selection:
        changedReview.candidate.continuation.selection,
      later_task_run_receipt: changedReview.candidate.run_receipt_b,
    });
  const reviewComparison =
    buildOperationalContinuationComparisonV01(changedReview);
  assert.notEqual(reviewComparison.comparison_id, comparison.comparison_id);
  assert.notEqual(
    reviewComparison.candidate.context_use_review_b.record_fingerprint,
    comparison.candidate.context_use_review_b.record_fingerprint,
  );
  assert.notEqual(
    reviewComparison.candidate.context_use_attribution_b.record_fingerprint,
    comparison.candidate.context_use_attribution_b.record_fingerprint,
  );

  const changedCutoff = structuredClone(input);
  changedCutoff.frozen_construction_cutoff = "2026-07-18T09:53:00.000Z";
  changedCutoff.candidate.repository_state.construction_cutoff =
    changedCutoff.frozen_construction_cutoff;
  changedCutoff.baseline.repository_state.construction_cutoff =
    changedCutoff.frozen_construction_cutoff;
  assert.notEqual(
    buildOperationalContinuationComparisonV01(changedCutoff).comparison_id,
    comparison.comparison_id,
  );

  const resealed = structuredClone(comparison);
  resealed.trade_offs = ["Conflicting reseal."];
  assert.equal(validateOperationalContinuationComparisonV01(resealed).status, "blocked");

  const injectedRank = structuredClone(comparison) as unknown as {
    candidate_task_outcome: Record<string, unknown>;
  };
  injectedRank.candidate_task_outcome.rank = 1;
  assert.deepEqual(
    validateOperationalContinuationComparisonV01(injectedRank).errors[0],
    {
      code: "operational_comparison_unknown_or_missing_field",
      path: "$.candidate_task_outcome",
    },
  );

  for (const mutation of [
    (value: BuildOperationalContinuationComparisonInputV01) => {
      value.limitations.push("OPENAI_API_KEY=forbidden-fixture-value");
    },
    (value: BuildOperationalContinuationComparisonInputV01) => {
      value.limitations.push("Unsafe private location /Users/example/private.txt");
    },
    (value: BuildOperationalContinuationComparisonInputV01) => {
      (
        value.candidate.exact_observations as unknown as Record<
          string,
          unknown
        >
      ).raw_terminal_output = "forbidden raw output";
    },
    (value: BuildOperationalContinuationComparisonInputV01) => {
      value.observation_cutoff = "2026-07-18T15:09:00.000Z";
    },
  ]) {
    const unsafe = structuredClone(input);
    mutation(unsafe);
    assert.throws(() => buildOperationalContinuationComparisonV01(unsafe));
  }
}

function assertStatusVariantsV01(
  comparison: OperationalContinuationComparisonV01,
): void {
  const row = (
    relation: OperationalContinuationComparisonDimensionDeltaV01["relation"],
  ): OperationalContinuationComparisonDimensionDeltaV01 => ({
    dimension: "fixture.dimension",
    relation,
    preferred_direction: "lower",
    candidate_value: 0,
    baseline_value: 1,
    exact_delta: -1,
    basis: "focused_status_fixture",
  });
  const clearHardGate = {
    ...comparison.candidate_task_outcome,
    failed_count: 0,
    blocked_count: 0,
    hard_gate_failure: false,
    hard_gate_codes: [],
  };
  const completeComparable = {
    complete_equal_budget_claim: true,
    structural_parity: comparison.structural_parity,
  };
  assert.equal(
    completeComparable.structural_parity.every(
      (parity) => parity.status === "equal",
    ),
    true,
  );
  assert.equal(
    deriveOperationalContinuationExactCaseStatusV01(
      [row("candidate_better")],
      clearHardGate,
      clearHardGate,
      completeComparable,
    ),
    "supported",
  );
  assert.equal(
    deriveOperationalContinuationExactCaseStatusV01(
      [row("candidate_better"), row("baseline_better")],
      clearHardGate,
      clearHardGate,
      completeComparable,
    ),
    "mixed",
  );
  assert.equal(
    deriveOperationalContinuationExactCaseStatusV01(
      [row("baseline_better")],
      clearHardGate,
      clearHardGate,
      completeComparable,
    ),
    "refuted",
  );
  assert.equal(
    deriveOperationalContinuationExactCaseStatusV01(
      [row("equal")],
      clearHardGate,
      clearHardGate,
      completeComparable,
    ),
    "inconclusive",
  );
  assert.equal(
    deriveOperationalContinuationExactCaseStatusV01(
      [row("candidate_better")],
      {
        ...clearHardGate,
        failed_count: 1,
        hard_gate_failure: true,
        hard_gate_codes: ["required-check"],
      },
      clearHardGate,
      {
        complete_equal_budget_claim: false,
        structural_parity: comparison.structural_parity,
      },
    ),
    "refuted",
  );
  assert.equal(
    deriveOperationalContinuationExactCaseStatusV01(
      [row("unknown")],
      clearHardGate,
      {
        ...clearHardGate,
        failed_count: 1,
        hard_gate_failure: true,
        hard_gate_codes: ["baseline-required-check"],
      },
      {
        complete_equal_budget_claim: false,
        structural_parity: comparison.structural_parity,
      },
    ),
    "supported",
  );
  assert.equal(
    deriveOperationalContinuationExactCaseStatusV01(
      [row("candidate_better"), row("unknown")],
      clearHardGate,
      clearHardGate,
      completeComparable,
    ),
    "inconclusive",
  );
  assert.equal(
    deriveOperationalContinuationExactCaseStatusV01(
      [row("baseline_better")],
      clearHardGate,
      clearHardGate,
      {
        complete_equal_budget_claim: false,
        structural_parity: comparison.structural_parity,
      },
    ),
    "inconclusive",
  );
  const notComparableParity = structuredClone(comparison.structural_parity);
  notComparableParity[0]!.status = "not_comparable";
  notComparableParity[0]!.limitation =
    "Focused status fixture is not structurally comparable.";
  assert.equal(
    deriveOperationalContinuationExactCaseStatusV01(
      [row("baseline_better")],
      clearHardGate,
      clearHardGate,
      {
        complete_equal_budget_claim: true,
        structural_parity: notComparableParity,
      },
    ),
    "inconclusive",
  );
}

function assertTerminalReceiptVariantsV01(
  input: BuildOperationalContinuationComparisonInputV01,
): void {
  const originalComparison = buildOperationalContinuationComparisonV01(input);
  for (const status of ["failed", "blocked", "cancelled"] as const) {
    const variant = structuredClone(input);
    const sourceReceipt = variant.candidate.run_receipt_b;
    const receipt = buildRunReceiptV01({
      ...sourceReceipt,
      execution: {
        ...sourceReceipt.execution,
        status,
      },
      blockers:
        status === "blocked"
          ? [
              ...sourceReceipt.blockers,
              {
                code: "acgc5c_terminal_blocked_variant",
                summary:
                  "The deterministic terminal-status fixture is blocked.",
                source_refs: sourceReceipt.execution.source_refs,
              },
            ]
          : sourceReceipt.blockers,
      authority_notes: sourceReceipt.authority_summary.notes,
    });
    variant.candidate.run_b.status = status;
    variant.candidate.run_receipt_b = receipt;
    variant.candidate.context_use_review_b = reviewForReceiptVariantV01(
      variant.candidate.context_use_review_b,
      receipt,
    );
    variant.candidate.context_use_attribution_b =
      buildContextUseAttributionProjectionV01({
        review: variant.candidate.context_use_review_b,
        prior_packet: variant.candidate.packet_a,
        later_packet:
          variant.candidate.continuation.candidate_task_context_packet_b,
        source_operational_continuation_admission:
          variant.candidate.admission,
        source_operational_context_selection:
          variant.candidate.continuation.selection,
        later_task_run_receipt: receipt,
      });
    const comparison = buildOperationalContinuationComparisonV01(variant);
    assert.equal(comparison.candidate.run_b.status, status);
    assert.equal(comparison.candidate_task_outcome.execution_status, status);
    assert.notEqual(comparison.comparison_id, originalComparison.comparison_id);
    assert.equal(validateOperationalContinuationComparisonV01(comparison).status, "valid");
  }
}

function reviewForReceiptVariantV01(
  reviewInput: ContextUseReviewV01,
  receipt: RunReceiptV01,
): ContextUseReviewV01 {
  const review = structuredClone(reviewInput);
  review.later_task_run_receipt = {
    receipt_version: receipt.receipt_version,
    receipt_id: receipt.receipt_id,
    receipt_fingerprint: receipt.integrity.fingerprint,
  };
  const presentation = deriveContextUseReviewPresentationProvenanceV01(receipt);
  review.usage.presented = presentation.presented;
  if (review.usage_provenance) {
    review.usage_provenance.presented = presentation.provenance;
  }
  resignReviewV01(review);
  return review;
}

function managedRunBindingV01(input: {
  run: AutonomyRunRecord;
  receipt: RunReceiptV01;
  packet: TaskContextPacketV01;
  attachment_id: string;
  attachment_binding_fingerprint: string;
  start_request_fingerprint: string;
  grant_fingerprint: string;
  controller_identity_fingerprint: string;
}): OperationalContinuationManagedRunBindingV01 {
  assert.ok(
    ["completed", "failed", "blocked", "cancelled", "timed_out", "needs_review"].includes(
      input.run.status,
    ),
  );
  assert(input.receipt.started_at && input.receipt.finished_at);
  return {
    run_id: input.run.run_id,
    packet_id: input.packet.packet_id,
    packet_fingerprint: input.packet.integrity.fingerprint,
    attachment_id: input.attachment_id,
    attachment_binding_fingerprint: input.attachment_binding_fingerprint,
    start_request_fingerprint: input.start_request_fingerprint,
    start_grant_fingerprint: input.grant_fingerprint,
    controller_identity_fingerprint: input.controller_identity_fingerprint,
    action: "start_repository_managed_delegation",
    resume_used: false,
    status: input.run.status as OperationalContinuationManagedRunBindingV01["status"],
    started_at: input.receipt.started_at,
    finished_at: input.receipt.finished_at,
  };
}

function repositoryStateV01(
  repositoryRoot: string,
  operationPolicyFingerprint: string,
  verifierFingerprint: string,
  constructionCutoff: string,
): OperationalContinuationRepositoryStateBindingV01 {
  const adapter = createDeterministicCodexAdapterV01({
    now: () => "2026-07-18T09:54:00.000Z",
  });
  return {
    frozen_head_commit: gitV01(repositoryRoot, ["rev-parse", "HEAD"]),
    frozen_worktree_content_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(
        gitV01(repositoryRoot, ["ls-files", "-s"]).split("\n"),
      ),
    ),
    construction_cutoff: constructionCutoff,
    platform: "darwin",
    native_host_adapter_version: adapter.adapter_version,
    native_host_capability_version: adapter.capability_version,
    operation_approval_policy_fingerprint: operationPolicyFingerprint,
    verification_owner_set_fingerprint: verifierFingerprint,
  };
}

function candidateRunPolicyV01(request: NativeHostRequestV01): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(request.policy),
  );
}

function verifierOwnerFingerprintV01(receipt: RunReceiptV01): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(
      receipt.verifier_refs
        .map((ref) => ({
          ref_type: ref.ref_type,
          external_id: ref.external_id,
          compatibility_namespace: ref.compatibility_namespace ?? null,
        }))
        .sort((left, right) =>
          canonicalizeProtocolValueV01(left).localeCompare(
            canonicalizeProtocolValueV01(right),
          ),
        ),
    ),
  );
}

function assertNoScoreRankWinnerV01(value: unknown, pathValue = "$"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoScoreRankWinnerV01(item, `${pathValue}[${index}]`),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (/(?:score|rank|winner|promotion|scalar_fitness)/u.test(key)) {
      assert.equal(child, false, `${pathValue}.${key}`);
    }
    assertNoScoreRankWinnerV01(child, `${pathValue}.${key}`);
  }
}

function persistCoreV01(
  db: Database.Database,
  kind: VNextCoreRecordKindV01,
  payloadInput: object,
  idempotencyOverride?: string | null,
): void {
  const payload = payloadInput as Record<string, unknown>;
  const binding = (() => {
    switch (kind) {
      case "task_context_packet":
        return {
          id: String(payload.packet_id),
          workspace: String(payload.workspace_id),
          project: String(payload.project_id),
          fingerprint: String(
            (payload.integrity as Record<string, unknown>).fingerprint,
          ),
          idempotency: null,
          created: String(payload.generated_at),
        };
      case "run_receipt":
        return {
          id: String(payload.receipt_id),
          workspace: String(payload.workspace_id),
          project: String(payload.project_id),
          fingerprint: String(
            (payload.integrity as Record<string, unknown>).fingerprint,
          ),
          idempotency: String(payload.idempotency_key),
          created: String(payload.recorded_at),
        };
      case "episode_delta_proposal":
        return {
          id: String(payload.proposal_id),
          workspace: String(payload.workspace_id),
          project: String(payload.project_id),
          fingerprint: String(
            (payload.integrity as Record<string, unknown>).fingerprint,
          ),
          idempotency: null,
          created: String(payload.created_at),
        };
      default:
        assert.fail(`unsupported focused fixture record kind: ${kind}`);
    }
  })();
  insertVNextCoreRecordV01(db, {
    record_kind: kind,
    record_id: binding.id,
    workspace_id: binding.workspace,
    project_id: binding.project,
    fingerprint: binding.fingerprint,
    idempotency_key:
      idempotencyOverride === undefined
        ? binding.idempotency
        : idempotencyOverride,
    payload,
    created_at: binding.created,
  });
}

function openDatabaseV01(databasePath: string): Database.Database {
  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(db);
  return db;
}

function credentialV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  secrets: VNextLocalOperatorSecretSourceV01,
  now: string,
): VNextLocalOperatorSessionCredentialV01 {
  const base = Date.parse(now);
  const issued = issueVNextLocalOperatorBootstrapV01(db, {
    config,
    clock: fixedClockV01(new Date(base - 2_000).toISOString()),
    secret_source: secrets,
  });
  return consumeVNextLocalOperatorBootstrapV01(db, {
    config,
    bootstrap_token: issued.bootstrap_token,
    clock: fixedClockV01(new Date(base - 1_000).toISOString()),
    secret_source: secrets,
  }).credential;
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

function grantStartDecisionV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  secrets: VNextLocalOperatorSecretSourceV01,
  request: NonNullable<
    Awaited<
      ReturnType<typeof prepareRepositoryManagedDelegationV01>
    >["decision_request"]
  >,
  now: string,
) {
  const base = Date.parse(now);
  const issued = issueVNextLocalOperatorBootstrapV01(db, {
    config,
    clock: fixedClockV01(new Date(base - 2_000).toISOString()),
    secret_source: secrets,
  });
  const consumed = consumeVNextLocalOperatorBootstrapV01(db, {
    config,
    bootstrap_token: issued.bootstrap_token,
    clock: fixedClockV01(new Date(base - 1_000).toISOString()),
    secret_source: secrets,
  });
  const challenge = issueVNextRepositoryDecisionChallengeV01(db, {
    request_fingerprint: request.request_fingerprint,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    credential: consumed.repository_decision_session.credential,
    clock: fixedClockV01(now),
  });
  return grantRepositoryExecutionDecisionFromBrowserSessionV01(
    db,
    {
      request_fingerprint: request.request_fingerprint,
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      challenge_fingerprint: challenge.challenge_fingerprint,
      credential: consumed.repository_decision_session.credential,
    },
    { now: () => now },
  ).decision;
}

function fixedClockV01(value: string) {
  return { now: () => value };
}

function sequenceClockV01(first: string, ...rest: string[]) {
  const values = [first, ...rest];
  let index = 0;
  return {
    now: () => values[Math.min(index++, values.length - 1)]!,
  };
}

async function waitForTerminalV01(
  db: Database.Database,
  runId: string,
): Promise<void> {
  for (let index = 0; index < 200; index += 1) {
    const run = readAutonomyRunLedgerRecord(runId, { db });
    if (
      run &&
      ["completed", "failed", "blocked", "cancelled", "timed_out"].includes(
        run.status,
      )
    ) {
      return;
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  assert.fail("baseline managed run did not settle in the bounded loop");
}

function databaseStateV01(db: Database.Database): string {
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`,
    )
    .all() as Array<{ name: string }>;
  return canonicalizeProtocolValueV01(
    Object.fromEntries(
      tables.map(({ name }) => {
        const escaped = name.replaceAll('"', '""');
        return [
          name,
          db.prepare(`SELECT * FROM "${escaped}" ORDER BY rowid`).all(),
        ];
      }),
    ),
  );
}

function unauthorizedReviewEffectStateV01(db: Database.Database): string {
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`,
    )
    .all() as Array<{ name: string }>;
  return canonicalizeProtocolValueV01(
    Object.fromEntries(
      tables
        .filter(({ name }) => name !== "vnext_local_operator_sessions")
        .map(({ name }) => {
          const escaped = name.replaceAll('"', '""');
          const where =
            name === "vnext_core_records"
              ? " WHERE record_kind <> 'context_use_review'"
              : "";
          return [
            name,
            db
              .prepare(`SELECT * FROM "${escaped}"${where} ORDER BY rowid`)
              .all(),
          ];
        }),
    ),
  );
}

function sessionRowV01(db: Database.Database, sessionId: string) {
  const row = db
    .prepare("SELECT * FROM vnext_local_operator_sessions WHERE session_id = ?")
    .get(sessionId) as Record<string, unknown> | undefined;
  assert(row);
  return structuredClone(row) as Record<string, unknown> & {
    action_nonce_hash: string;
    updated_at: string;
  };
}

function changedKeysV01(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  return Object.keys(before)
    .filter(
      (key) =>
        canonicalizeProtocolValueV01(before[key]) !==
        canonicalizeProtocolValueV01(after[key]),
    )
    .sort();
}

function resignReviewV01(review: ContextUseReviewV01): void {
  review.review_id = deriveContextUseReviewIdV01(review);
  review.integrity.fingerprint = createContextUseReviewFingerprintV01(review);
}

function countScopedV01(
  db: Database.Database,
  table: string,
  config: VNextLocalOperatorPilotConfigV01,
): number {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  const workspaceColumn = columns.some((column) => column.name === "workspace_id");
  const projectColumn = columns.some((column) => column.name === "project_id")
    ? "project_id"
    : "scope";
  const where = workspaceColumn
    ? `workspace_id = ? AND ${projectColumn} = ?`
    : `${projectColumn} = ?`;
  const args = workspaceColumn
    ? [config.workspace_id, config.project_id]
    : [config.project_id];
  return Number(
    (
      db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${where}`).get(
        ...args,
      ) as { count: number }
    ).count,
  );
}

function gitV01(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
  }).trim();
}

function gitStatusV01(root: string): string {
  return gitV01(root, ["status", "--porcelain"]);
}

function gitRemotesV01(root: string): string {
  return gitV01(root, ["remote", "-v"]);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
