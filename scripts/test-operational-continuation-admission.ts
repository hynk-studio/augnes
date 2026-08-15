#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { readAutonomyRunLedgerRecord } from "@/lib/autonomy/runner-ledger";
import { buildOperationalFrictionDisposableReviewFixtureFromSourceChainV01 } from "@/fixtures/vnext/research/operational-friction-proposal-v0-1";
import {
  buildSemanticReviewLoopProposalFixture,
  buildSemanticReviewLoopRunReceiptFixture,
  buildSemanticReviewLoopTaskContextPacketFixture,
  type SemanticReviewLoopProjectFixtureV01,
} from "@/fixtures/vnext/protocol/semantic-review-loop-v0-1";
import { createSemanticTransitionDecisionInputV01 } from "@/fixtures/vnext/protocol/semantic-transition-loop-v0-1";
import {
  confirmLocalProjectOnboardingV01,
  pickAndInspectLocalProjectV01,
} from "@/lib/vnext/onboarding/local-project-onboarding";
import {
  materializeOperationalFrictionProposalV01,
} from "@/lib/vnext/operational-friction-proposal";
import {
  admitEpisodeDeltaProposalV01,
  readOperationalFrictionProposalFromExactSourcesV01,
} from "@/lib/vnext/persistence/episode-delta-proposal-admission";
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
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  issueVNextRepositoryDecisionChallengeV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "@/lib/vnext/runtime/local-operator-session";
import { LiveNativeHostRunServiceV01 } from "@/lib/vnext/runtime/live-native-host-run-service";
import {
  admitSourceLinkedOperationalContinuationV01,
} from "@/lib/vnext/runtime/operational-continuation-admission";
import {
  rebuildOperationalContinuationFromDurableSourcesV01,
  type OperationalContinuationReadRequestV01,
} from "@/lib/vnext/runtime/operational-continuation-read-model";
import {
  inspectVNextOperatorPilotPacketLineageV01,
  projectVNextOperatorPilotContinuityV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  recordVNextOperatorPilotContextUseReviewV01,
} from "@/lib/vnext/runtime/operator-pilot-context-use-review";
import { createVNextOperatorPilotContextUseReviewLogicalIdentityV01 } from "@/lib/vnext/runtime/operator-pilot-context-use-contract";
import {
  readVNextOperatorPilotSemanticReviewV01,
  recordVNextOperatorPilotReviewDecisionV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import {
  applyVNextOperatorPilotReviewedSemanticTransitionV01,
  confirmVNextOperatorPilotSemanticCommitV01,
  prepareVNextOperatorPilotSemanticCommitPreviewV01,
} from "@/lib/vnext/runtime/operator-pilot-semantic-transition";
import { readProjectWorkInitializationV01 } from "@/lib/vnext/runtime/project-work-initialization";
import {
  inspectSourceLinkedOperationalContinuationLineageV01,
  readOperationalContinuationLineageStateV01,
} from "@/lib/vnext/runtime/source-linked-operational-continuation-lineage";
import { createDeterministicCodexAdapterV01 } from "@/lib/vnext/native-host/deterministic-codex-adapter";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  exportActivePortableProjectV01,
  importPortableProjectV01,
  parseAndValidatePortableProjectV01,
} from "@/lib/vnext/portability/portable-project";
import { applyCanonicalDatabaseMigrations } from "@/scripts/canonical-database-migrations.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "@/scripts/recovery-canonical-record-validator";
import type {
  AdmitSourceLinkedOperationalContinuationRequestV01,
  OperationalContinuationAdmissionV01,
} from "@/types/vnext/operational-continuation-admission";
import type { NativeHostAdapterV01, NativeHostRequestV01 } from "@/types/vnext/native-host-adapter";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const ROOT = mkdtempSync(path.join(tmpdir(), "augnes-acgc5b-"));
const DATABASE_PATH = path.join(ROOT, "augnes.db");
const PROJECT_ROOT = path.join(ROOT, "project");
const originalEnvironment = { ...process.env };
const originalFetch = globalThis.fetch;
let fetchCalls = 0;

class DeterministicSecretSourceV01
  implements VNextLocalOperatorSecretSourceV01
{
  private state = 0x5a17c9e3;

  bytes(size: number): Uint8Array {
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

const secrets = new DeterministicSecretSourceV01();

interface FixtureV01 {
  db: Database.Database;
  config: VNextLocalOperatorPilotConfigV01;
  initial_packet: TaskContextPacketV01;
  packet_a: TaskContextPacketV01;
  transition_receipt: StateTransitionReceiptV01;
  run_a: NonNullable<ReturnType<typeof readAutonomyRunLedgerRecord>>;
  run_a_receipt: RunReceiptV01;
  run_a_attachment_id: string;
  run_a_attachment_binding_fingerprint: string;
  run_a_start_request_fingerprint: string;
  run_a_grant_fingerprint: string;
  run_a_controller_runtime_instance_fingerprint: string;
  source_request: Omit<
    OperationalContinuationReadRequestV01,
    "workspace_id" | "project_id" | "operator_id"
  >;
  admission_request: AdmitSourceLinkedOperationalContinuationRequestV01;
  admission_credential: VNextLocalOperatorSessionCredentialV01;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  process.env.AUGNES_CANONICAL_TEST_MODE = "1";
  process.env.AUGNES_VNEXT_REPOSITORY_DELEGATION_TEST_ADAPTER = "1";
  process.env.AUGNES_CANONICAL_TEMP_ROOT = ROOT;
  process.env.AUGNES_DB_PATH = DATABASE_PATH;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("ACGC5B must not call fetch");
  }) as typeof fetch;
  initializeRepositoryV01();
  const db = openDatabaseV01();
  try {
    const fixture = await createFixtureV01(db);
    await assertAdmissionAndFreshStartV01(fixture);
    assert.equal(fetchCalls, 0);
    assert.equal(gitStatusV01(), "");
    console.log(
      JSON.stringify(
        {
          suite: "operational-continuation-admission-v0.1",
          status: "passed",
          exact_acgc5a_rematerialization: true,
          authenticated_atomic_admission: true,
          packet_b_current_before_start: true,
          packet_b_execution_authority: false,
          source_linked_non_semantic_lineage: true,
          fresh_attachment_and_browser_start: true,
          run_a_terminal: true,
          run_b_distinct_and_started: true,
          same_run_resume_used: false,
          real_provider_calls: 0,
          network_calls: 0,
          github_calls: 0,
          project_file_writes: 0,
          project_commands: 0,
        },
        null,
        2,
      ),
    );
  } finally {
    db.close();
    globalThis.fetch = originalFetch;
    process.env = originalEnvironment;
    rmSync(ROOT, { recursive: true, force: true });
  }
}

async function createFixtureV01(db: Database.Database): Promise<FixtureV01> {
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = PROJECT_ROOT;
  const picked = await pickAndInspectLocalProjectV01({
    open_database: openDatabaseV01,
    now: () => "2026-07-18T09:55:00.000Z",
    repository_execution_dependencies: { platform: "darwin" },
  });
  assert.equal(picked.status, "selected");
  const onboarded = await confirmLocalProjectOnboardingV01(
    db,
    {
      selection_token: picked.selection_token,
      inspection_fingerprint: picked.inspection.inspection_fingerprint,
      display_name: "ACGC5B disposable project",
    },
    {
      now: () => "2026-07-18T09:56:00.000Z",
      repository_execution_dependencies: { platform: "darwin" },
    },
  );
  const workspaceId = onboarded.project.workspace_id;
  const projectId = onboarded.project.project_id;
  const existingSelection = readActiveProjectSelectionV01(db, workspaceId);
  if (existingSelection?.project_id !== projectId) {
    selectActiveProjectV01(db, {
      workspace_id: workspaceId,
      project_id: projectId,
      expected_project_id: existingSelection?.project_id ?? null,
      expected_revision: existingSelection?.selection_revision ?? null,
      now: "2026-07-18T09:57:00.000Z",
    });
  }
  const config: VNextLocalOperatorPilotConfigV01 = {
    enabled: true,
    workspace_id: workspaceId,
    project_id: projectId,
    operator_id: "operator:acgc5b-disposable",
    database_path: DATABASE_PATH,
  };
  const semanticProject: SemanticReviewLoopProjectFixtureV01 = {
    fixture_id: "acgc5b-packet-a",
    workspace_id: workspaceId,
    project_id: projectId,
    run_id: "run:acgc5b-semantic-source",
  };
  const initialPacket = buildSemanticReviewLoopTaskContextPacketFixture(
    semanticProject,
  );
  insertVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: initialPacket.packet_id,
    workspace_id: workspaceId,
    project_id: projectId,
    fingerprint: initialPacket.integrity.fingerprint,
    idempotency_key: null,
    payload: initialPacket,
    created_at: initialPacket.generated_at,
  });
  const semanticReceipt = buildSemanticReviewLoopRunReceiptFixture(
    semanticProject,
    initialPacket,
    { timeline_anchor_at: "2026-07-18T10:05:00.000Z" },
  );
  const semanticProposal = buildSemanticReviewLoopProposalFixture(
    semanticProject,
    initialPacket,
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
  const candidateAdmission = semanticReview.candidate_admissions.find(
    (candidate) => candidate.decision_allowed.accept,
  );
  const semanticCandidate = semanticProposal.proposed_deltas.find(
    (candidate) =>
      candidate.candidate_id === candidateAdmission?.candidate_id &&
      createEpisodeDeltaCandidateFingerprintV01(candidate) ===
        candidateAdmission.candidate_fingerprint,
  );
  assert(semanticCandidate);
  const semanticCredential = credentialV01(
    db,
    config,
    "2026-07-18T10:20:00.000Z",
  );
  const semanticDecision = recordVNextOperatorPilotReviewDecisionV01(db, {
    config,
    credential: semanticCredential,
    request: {
      proposal_id: semanticProposal.proposal_id,
      proposal_fingerprint: semanticProposal.integrity.fingerprint,
      candidate_id: semanticCandidate.candidate_id,
      candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(semanticCandidate),
      decision: "accept",
      rationale_summary:
        "Accept the bounded synthetic candidate for exact semantic-lineage setup.",
      revisit: null,
    },
    clock: fixedClockV01("2026-07-18T10:21:00.000Z"),
    secret_source: secrets,
  });
  const exactDecision = {
    proposal_id: semanticProposal.proposal_id,
    proposal_fingerprint: semanticProposal.integrity.fingerprint,
    decision_id: semanticDecision.decision.decision_id,
    decision_fingerprint: semanticDecision.decision.integrity.fingerprint,
  };
  const semanticPostDecisionCredential = credentialFromCookieV01(
    semanticDecision.session_cookie.value,
  );
  const preview = prepareVNextOperatorPilotSemanticCommitPreviewV01(db, {
    config,
    credential: semanticPostDecisionCredential,
    request: exactDecision,
    clock: sequenceClockV01(
      "2026-07-18T10:22:00.000Z",
      "2026-07-18T10:22:01.000Z",
    ),
  });
  const authorization = confirmVNextOperatorPilotSemanticCommitV01(db, {
    config,
    credential: semanticPostDecisionCredential,
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
      gate_record_fingerprint: authorization.gate_record.integrity.fingerprint,
      prior_packet_id: initialPacket.packet_id,
      prior_packet_fingerprint: initialPacket.integrity.fingerprint,
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
  assert.equal(
    inspectVNextOperatorPilotPacketLineageV01(db, {
      config,
      packet_id: applied.later_packet.packet_id,
      packet_fingerprint: applied.later_packet.integrity.fingerprint,
    }).lineage_kind,
    "semantic_transition",
  );

  const attachmentA = await prepareRepositoryExecutionV01(
    db,
    { workspace_id: workspaceId, project_id: projectId },
    {
      now: () => "2026-07-18T10:30:00.000Z",
      platform: "darwin",
    },
  );
  assert.equal(attachmentA.status, "prepared", JSON.stringify(attachmentA));
  assert(attachmentA.attachment);
  const serviceA = deterministicServiceV01(
    "sha256:" + "1".repeat(64),
    "2026-07-18T10:32:00.000Z",
  );
  const preparedA = await prepareRepositoryManagedDelegationV01(
    db,
    {
      workspace_id: workspaceId,
      project_id: projectId,
      attachment_id: attachmentA.attachment.attachment_id,
    },
    serviceA,
    { now: () => "2026-07-18T10:31:00.000Z", platform: "darwin" },
  );
  assert.equal(preparedA.status, "decision_required");
  assert(preparedA.decision_request && preparedA.execution_envelope);
  const grantA = grantStartDecisionV01(
    db,
    config,
    preparedA.decision_request,
    "2026-07-18T10:31:30.000Z",
  );
  const startedA = await startRepositoryManagedDelegationV01(
    db,
    {
      config,
      workspace_id: workspaceId,
      project_id: projectId,
      attachment_id: attachmentA.attachment.attachment_id,
      expected_attachment_binding_fingerprint:
        attachmentA.attachment.binding_fingerprint,
      expected_execution_envelope_fingerprint:
        preparedA.execution_envelope.envelope_fingerprint,
      decision_request_fingerprint: grantA.request_fingerprint,
      decision_grant_fingerprint: grantA.grant_fingerprint!,
    },
    serviceA,
    { now: () => "2026-07-18T10:32:00.000Z", platform: "darwin" },
  );
  assert.equal(startedA.status, "accepted");
  await waitForTerminalV01(db, startedA.run_id);
  await serviceA.shutdown();
  const runA = readAutonomyRunLedgerRecord(startedA.run_id, { db });
  assert(runA && ["completed", "failed", "blocked", "cancelled", "timed_out"].includes(runA.status));
  const runAReceiptId = String(runA.metadata.run_receipt_id);
  const runAReceiptRecord = readVNextCoreRecordV01(db, {
    record_kind: "run_receipt",
    record_id: runAReceiptId,
    workspace_id: workspaceId,
    project_id: projectId,
  });
  assert(runAReceiptRecord);
  const runAReceipt = runAReceiptRecord.payload as RunReceiptV01;
  assert.equal(runAReceipt.run_id, runA.run_id);

  const contextCredential = credentialV01(
    db,
    config,
    "2026-07-18T10:40:00.000Z",
  );
  const baseReview = recordVNextOperatorPilotContextUseReviewV01(db, {
    config,
    credential: contextCredential,
    request: {
      action: "record_context_use_review",
      later_run_receipt_id: runAReceipt.receipt_id,
      later_run_receipt_fingerprint: runAReceipt.integrity.fingerprint,
      actually_used: "yes",
      assessment: "stale",
      correction_summaries: ["One bounded operational correction was needed."],
      notes: ["Exact disposable ACGC5B Run A review."],
      metrics: {
        wrong_context_correction_count: 1,
        repeated_explanation_estimate: 1,
        missing_critical_context_count: 1,
        context_refs_used_count: 1,
      },
    },
    clock: fixedClockV01("2026-07-18T10:41:00.000Z"),
    secret_source: secrets,
  });
  const operationalSource =
    buildOperationalFrictionDisposableReviewFixtureFromSourceChainV01(
      {
        prior_packet: initialPacket,
        later_packet: applied.later_packet,
        source_transition_receipt: applied.transition_receipt,
        later_task_run_receipt: runAReceipt,
        review: baseReview.review,
      },
      {
        persisted_source_role: "operational_fixture",
        materialization_final_reviewed_at: baseReview.review.reviewed_at,
        preserve_final_exact_source_chain: true,
      },
    );
  for (const source of operationalSource.exact_source_records) {
    persistOperationalSourceV01(db, source);
  }
  const operationalMaterialization = materializeOperationalFrictionProposalV01(
    operationalSource.materialization_source,
  );
  const operationalAdmission = admitEpisodeDeltaProposalV01(db, {
    expected: operationalMaterialization,
    source: operationalSource.materialization_source,
  });
  assert.equal(operationalAdmission.status, "inserted");
  let decisionCredential = credentialV01(
    db,
    config,
    "2026-07-18T14:25:00.000Z",
  );
  const dispositions = ["accept", "reject", "defer", "accept"] as const;
  for (const [index, disposition] of dispositions.entries()) {
    const candidate = operationalAdmission.proposal.proposed_deltas[index]!;
    const decision = recordVNextOperatorPilotReviewDecisionV01(db, {
      config,
      credential: decisionCredential,
      request: {
        proposal_id: operationalAdmission.proposal.proposal_id,
        proposal_fingerprint: operationalAdmission.proposal.integrity.fingerprint,
        candidate_id: candidate.candidate_id,
        candidate_fingerprint:
          createEpisodeDeltaCandidateFingerprintV01(candidate),
        decision: disposition,
        rationale_summary: `Bounded ACGC5B ${disposition} fixture judgment.`,
        ...(disposition === "defer"
          ? {
              revisit: {
                condition_summary:
                  "Revisit when exact operational verification is available.",
              },
            }
          : {}),
      },
      clock: fixedClockV01(
        `2026-07-18T14:3${index}:00.000Z`,
      ),
      secret_source: secrets,
    });
    decisionCredential = credentialFromCookieV01(decision.session_cookie.value);
  }
  assert(
    readOperationalFrictionProposalFromExactSourcesV01(
      db,
      operationalSource.materialization_source,
    ),
  );
  const sourceRequest = {
    frames: operationalSource.exact_source_records.map((source) => ({
      review_id: source.context_use_review.review_id,
      review_fingerprint: source.context_use_review.integrity.fingerprint,
      context_shadow_projection:
        operationalSource.materialization_source.context_shadow_projection,
    })),
    window_kind: "recent_3" as const,
    paired_evaluation:
      operationalSource.materialization_source.paired_evaluation,
    decision_time_cutoff: "2026-07-18T15:00:00.000Z",
    max_selected_candidates: 1,
  };
  const continuation = rebuildOperationalContinuationFromDurableSourcesV01(
    db,
    {
      workspace_id: workspaceId,
      project_id: projectId,
      operator_id: config.operator_id,
      ...sourceRequest,
    },
  );
  const admissionRequest: AdmitSourceLinkedOperationalContinuationRequestV01 = {
    request_version: "operational_continuation_admission_request.v0.1",
    action: "admit_source_linked_operational_continuation",
    workspace_id: workspaceId,
    project_id: projectId,
    expected_active_project_id: projectId,
    expected_active_selection_revision:
      readActiveProjectSelectionV01(db, workspaceId)!.selection_revision,
    expected_current_packet_a_id: applied.later_packet.packet_id,
    expected_current_packet_a_fingerprint:
      applied.later_packet.integrity.fingerprint,
    source_request: sourceRequest,
    expected_materialization_identity:
      continuation.materialization_identity,
    expected_selection_id: continuation.selection.selection_id,
    expected_selection_fingerprint: continuation.selection.integrity.fingerprint,
    expected_packet_b_id:
      continuation.candidate_task_context_packet_b.packet_id,
    expected_packet_b_fingerprint:
      continuation.candidate_task_context_packet_b.integrity.fingerprint,
  };
  return {
    db,
    config,
    initial_packet: initialPacket,
    packet_a: applied.later_packet,
    transition_receipt: applied.transition_receipt,
    run_a: runA,
    run_a_receipt: runAReceipt,
    run_a_attachment_id: attachmentA.attachment.attachment_id,
    run_a_attachment_binding_fingerprint:
      attachmentA.attachment.binding_fingerprint,
    run_a_start_request_fingerprint: grantA.request_fingerprint,
    run_a_grant_fingerprint: grantA.grant_fingerprint!,
    run_a_controller_runtime_instance_fingerprint: `sha256:${"1".repeat(64)}`,
    source_request: sourceRequest,
    admission_request: admissionRequest,
    admission_credential: credentialV01(
      db,
      config,
      "2026-07-18T15:00:30.000Z",
    ),
  };
}

async function assertAdmissionAndFreshStartV01(
  fixture: FixtureV01,
): Promise<void> {
  const { db, config, admission_request: request } = fixture;
  const beforeAdmission = readProjectWorkInitializationV01(db, config);
  assert.equal(beforeAdmission.current_packet?.packet_id, fixture.packet_a.packet_id);
  assert.equal(
    beforeAdmission.current_packet?.packet_fingerprint,
    fixture.packet_a.integrity.fingerprint,
  );
  assert.ok(
    Buffer.byteLength(JSON.stringify(request), "utf8") <= 2 * 1024 * 1024,
    "exact source admission request exceeded the existing ACGC5A bounded-input limit",
  );
  assertPreAdmissionRefusalsAndAtomicityV01(fixture);
  const semanticStateBefore = tableSnapshotV01(
    db,
    "vnext_semantic_state_entries",
  );
  const semanticHeadsBefore = tableSnapshotV01(
    db,
    "vnext_semantic_target_heads",
  );
  const effectCountsBefore = effectCountsV01(db, config);
  const inputBefore = canonicalizeProtocolValueV01(request);
  const expectedContinuation =
    rebuildOperationalContinuationFromDurableSourcesV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      operator_id: config.operator_id,
      ...request.source_request,
    });
  const admitted = admitSourceLinkedOperationalContinuationV01(db, {
    config,
    credential: fixture.admission_credential,
    request,
    clock: fixedClockV01("2026-07-18T15:01:00.000Z"),
    secret_source: secrets,
  });
  assert.equal(admitted.status, "inserted");
  assert.equal(canonicalizeProtocolValueV01(request), inputBefore);
  assert.equal(admitted.packet_b.packet_id, request.expected_packet_b_id);
  assert.equal(
    admitted.packet_b.integrity.fingerprint,
    request.expected_packet_b_fingerprint,
  );
  assert.deepEqual(
    admitted.packet_b,
    expectedContinuation.candidate_task_context_packet_b,
  );
  assert.deepEqual(admitted.packet_b.task, fixture.packet_a.task);
  assert.deepEqual(
    admitted.packet_b.constraints.required_checks,
    fixture.packet_a.constraints.required_checks,
  );
  assert.deepEqual(
    admitted.packet_b.constraints.forbidden_actions,
    fixture.packet_a.constraints.forbidden_actions,
  );
  assert.equal(admitted.packet_b.generated_at, expectedContinuation.candidate_task_context_packet_b.generated_at);
  assert.notEqual(admitted.packet_b.generated_at, admitted.admission.authenticated_action.admitted_at);
  assert.deepEqual(
    readProjectWorkInitializationV01(db, config).current_packet,
    {
      packet_id: admitted.packet_b.packet_id,
      packet_fingerprint: admitted.packet_b.integrity.fingerprint,
      generated_at: admitted.packet_b.generated_at,
      lineage_kind: "source_linked_operational_continuation",
    },
  );
  const lineage = inspectSourceLinkedOperationalContinuationLineageV01(db, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    packet_id: admitted.packet_b.packet_id,
    packet_fingerprint: admitted.packet_b.integrity.fingerprint,
  });
  assert.equal(lineage.prior_packet.packet_id, fixture.packet_a.packet_id);
  assert.equal(lineage.semantic_transition_created, false);
  assert.equal(lineage.exact_source_rematerialization_reperformed, false);
  assert.equal(lineage.historical_canonical_writer_invocation_proven, false);
  assert.equal(
    inspectVNextOperatorPilotPacketLineageV01(db, {
      config,
      packet_id: admitted.packet_b.packet_id,
      packet_fingerprint: admitted.packet_b.integrity.fingerprint,
    }).lineage_kind,
    "source_linked_operational_continuation",
  );
  assert.equal(
    inspectVNextOperatorPilotPacketLineageV01(db, {
      config,
      packet_id: fixture.packet_a.packet_id,
      packet_fingerprint: fixture.packet_a.integrity.fingerprint,
    }).projection_current,
    false,
  );
  assert.equal(
    projectVNextOperatorPilotContinuityV01(db, {
      config,
      clock: fixedClockV01("2026-07-18T15:01:01.000Z"),
    }).latest_compiled_packet?.lineage_kind,
    "source_linked_operational_continuation",
  );
  assert.deepEqual(tableSnapshotV01(db, "vnext_semantic_state_entries"), semanticStateBefore);
  assert.deepEqual(tableSnapshotV01(db, "vnext_semantic_target_heads"), semanticHeadsBefore);
  const effectCountsAfterAdmission = effectCountsV01(db, config);
  assert.equal(
    effectCountsAfterAdmission.task_context_packet,
    effectCountsBefore.task_context_packet + 1,
  );
  assert.equal(effectCountsAfterAdmission.operational_continuation_admission, 1);
  for (const key of [
    "repository_attachment",
    "repository_decision",
    "autonomy_run",
    "state_transition_receipt",
    "episode_delta_proposal",
    "review_decision",
  ] as const) {
    assert.equal(effectCountsAfterAdmission[key], effectCountsBefore[key], key);
  }
  assertAllBooleanAuthorityFalseV01(admitted.admission.authority_boundary);
  assert.equal(admitted.packet_b.capability_grant, null);
  assert.equal(admitted.attachment_prepared, false);
  assert.equal(admitted.grant_issued, false);
  assert.equal(admitted.run_created, false);
  const serializedPacketB = canonicalizeProtocolValueV01(admitted.packet_b);
  assert.equal(serializedPacketB.includes(fixture.run_a_grant_fingerprint), false);
  assert.equal(serializedPacketB.includes(fixture.run_a_attachment_id), false);
  assert.equal(serializedPacketB.includes(fixture.run_a_start_request_fingerprint), false);
  assertRecoveryAndPortabilityV01(fixture, admitted.packet_b.packet_id);
  assertDuplicateAdmissionFailsClosedV01(
    fixture,
    admitted.admission,
    admitted.packet_b.packet_id,
  );
  assertUnknownHistoricalPacketRemainsHistoryV01(fixture, admitted.packet_b);

  const replay = admitSourceLinkedOperationalContinuationV01(db, {
    config,
    credential: credentialFromCookieV01(
      admitted.session_admission.cookie_value,
    ),
    request,
    clock: fixedClockV01("2026-07-18T15:02:00.000Z"),
    secret_source: secrets,
  });
  assert.equal(replay.status, "exact_replay");
  assert.deepEqual(replay.admission, admitted.admission);
  assert.deepEqual(replay.packet_b, admitted.packet_b);
  assert.deepEqual(effectCountsV01(db, config), effectCountsAfterAdmission);
  assert.throws(
    () =>
      admitSourceLinkedOperationalContinuationV01(db, {
        config,
        credential: fixture.admission_credential,
        request,
        clock: fixedClockV01("2026-07-18T15:02:01.000Z"),
        secret_source: secrets,
      }),
    /operator_action_nonce_invalid/u,
  );
  assert.deepEqual(effectCountsV01(db, config), effectCountsAfterAdmission);

  const changedBudgetSourceRequest = {
    ...structuredClone(request.source_request),
    max_selected_candidates: 2,
  };
  const changedBudgetContinuation =
    rebuildOperationalContinuationFromDurableSourcesV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      operator_id: config.operator_id,
      ...changedBudgetSourceRequest,
    });
  const secondContinuationRequest = requestForContinuationV01(
    request,
    changedBudgetSourceRequest,
    changedBudgetContinuation,
  );
  const beforeSecondContinuation = databaseStateV01(db);
  assert.throws(
    () =>
      admitSourceLinkedOperationalContinuationV01(db, {
        config,
        credential: credentialFromCookieV01(
          replay.session_admission.cookie_value,
        ),
        request: secondContinuationRequest,
        clock: fixedClockV01("2026-07-18T15:02:30.000Z"),
        secret_source: secrets,
      }),
    /operational_continuation_admission_replay_conflict/u,
  );
  assert.equal(databaseStateV01(db), beforeSecondContinuation);

  const attachmentB = await prepareRepositoryExecutionV01(
    db,
    { workspace_id: config.workspace_id, project_id: config.project_id },
    { now: () => "2026-07-18T15:03:00.000Z", platform: "darwin" },
  );
  assert.equal(attachmentB.status, "prepared", JSON.stringify(attachmentB));
  assert(attachmentB.attachment);
  assert.notEqual(attachmentB.attachment.attachment_id, fixture.run_a_attachment_id);
  assert.notEqual(
    attachmentB.attachment.binding_fingerprint,
    fixture.run_a_attachment_binding_fingerprint,
  );
  assert.equal(
    attachmentB.attachment.task_context_packet_id,
    admitted.packet_b.packet_id,
  );
  assert.equal(
    attachmentB.attachment.task_context_packet_fingerprint,
    admitted.packet_b.integrity.fingerprint,
  );

  const capturedRequests: NativeHostRequestV01[] = [];
  const serviceB = blockingDeterministicServiceV01(capturedRequests);
  try {
    const reusedRunAAttachment = await prepareRepositoryManagedDelegationV01(
      db,
      {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        attachment_id: fixture.run_a_attachment_id,
      },
      serviceB,
      { now: () => "2026-07-18T15:03:30.000Z", platform: "darwin" },
    );
    assert.equal(reusedRunAAttachment.status, "blocked");
    assert.equal(reusedRunAAttachment.decision_request, null);
    const preparedB = await prepareRepositoryManagedDelegationV01(
      db,
      {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        attachment_id: attachmentB.attachment.attachment_id,
      },
      serviceB,
      { now: () => "2026-07-18T15:04:00.000Z", platform: "darwin" },
    );
    assert.equal(preparedB.status, "decision_required");
    assert(preparedB.decision_request && preparedB.execution_envelope);
    assert.equal(
      preparedB.decision_request.action,
      "start_repository_managed_delegation",
    );
    assert.notEqual(
      preparedB.decision_request.request_fingerprint,
      fixture.run_a_start_request_fingerprint,
    );
    assert.equal(effectCountsV01(db, config).autonomy_run, effectCountsAfterAdmission.autonomy_run);
    assert.equal(
      readProjectWorkInitializationV01(db, config).current_packet?.packet_id,
      admitted.packet_b.packet_id,
    );
    await assert.rejects(
      () =>
        startRepositoryManagedDelegationV01(
          db,
          {
            config,
            workspace_id: config.workspace_id,
            project_id: config.project_id,
            attachment_id: attachmentB.attachment!.attachment_id,
            expected_attachment_binding_fingerprint:
              attachmentB.attachment!.binding_fingerprint,
            expected_execution_envelope_fingerprint:
              preparedB.execution_envelope!.envelope_fingerprint,
            decision_request_fingerprint:
              preparedB.decision_request!.request_fingerprint,
            decision_grant_fingerprint: `sha256:${"0".repeat(64)}`,
          },
          serviceB,
          { now: () => "2026-07-18T15:04:30.000Z", platform: "darwin" },
        ),
      /repository_execution_decision_mismatch|repository_delegation_decision_not_granted|repository_execution_decision_grant/u,
    );
    assert.equal(effectCountsV01(db, config).autonomy_run, effectCountsAfterAdmission.autonomy_run);
    assert.equal(capturedRequests.length, 0);
    const grantB = grantStartDecisionV01(
      db,
      config,
      preparedB.decision_request,
      "2026-07-18T15:05:00.000Z",
    );
    assert.notEqual(grantB.grant_fingerprint, fixture.run_a_grant_fingerprint);
    const startedB = await startRepositoryManagedDelegationV01(
      db,
      {
        config,
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        attachment_id: attachmentB.attachment.attachment_id,
        expected_attachment_binding_fingerprint:
          attachmentB.attachment.binding_fingerprint,
        expected_execution_envelope_fingerprint:
          preparedB.execution_envelope.envelope_fingerprint,
        decision_request_fingerprint: grantB.request_fingerprint,
        decision_grant_fingerprint: grantB.grant_fingerprint!,
      },
      serviceB,
      { now: () => "2026-07-18T15:06:00.000Z", platform: "darwin" },
    );
    assert.equal(startedB.status, "accepted");
    assert.notEqual(startedB.run_id, fixture.run_a.run_id);
    const runB = readAutonomyRunLedgerRecord(startedB.run_id, { db });
    assert(runB && !["completed", "failed", "blocked", "cancelled", "timed_out"].includes(runB.status));
    assert.equal(runB.metadata.packet_id, admitted.packet_b.packet_id);
    assert.equal(runB.metadata.packet_fingerprint, admitted.packet_b.integrity.fingerprint);
    assert.notDeepEqual(
      {
        run_id: runB.run_id,
        controller_generation: runB.metadata.controller_generation ?? 1,
      },
      {
        run_id: fixture.run_a.run_id,
        controller_generation:
          fixture.run_a.metadata.controller_generation ?? 1,
      },
    );
    const controllerB = serviceB.readRepositoryControllerObservationV01(
      config,
      startedB.run_id,
    );
    assert.equal(controllerB.owned, true);
    assert.equal(
      controllerB.runtime_instance_fingerprint,
      `sha256:${"2".repeat(64)}`,
    );
    assert.notEqual(
      controllerB.runtime_instance_fingerprint,
      fixture.run_a_controller_runtime_instance_fingerprint,
    );
    assert.equal(controllerB.controller_generation, 1);
    assert.equal(controllerB.attachment_id, attachmentB.attachment.attachment_id);
    assert.equal(capturedRequests.length, 1);
    assert.equal(capturedRequests[0]!.packet.packet_id, admitted.packet_b.packet_id);
    assert(
      "lineage_kind" in capturedRequests[0]!.packet_lineage &&
        capturedRequests[0]!.packet_lineage.lineage_kind ===
          "source_linked_operational_continuation",
    );
    assert.equal(capturedRequests[0]!.repository_resume_context ?? null, null);
    const startReplay = await startRepositoryManagedDelegationV01(
      db,
      {
        config,
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        attachment_id: attachmentB.attachment.attachment_id,
        expected_attachment_binding_fingerprint:
          attachmentB.attachment.binding_fingerprint,
        expected_execution_envelope_fingerprint:
          preparedB.execution_envelope.envelope_fingerprint,
        decision_request_fingerprint: grantB.request_fingerprint,
        decision_grant_fingerprint: grantB.grant_fingerprint!,
      },
      serviceB,
      { now: () => "2026-07-18T15:07:00.000Z", platform: "darwin" },
    );
    assert.equal(startReplay.status, "exact_replay");
    assert.equal(startReplay.run_id, startedB.run_id);
    assert.equal(capturedRequests.length, 1);
  } finally {
    await serviceB.shutdown();
  }
  assert.equal(fetchCalls, 0);
}

function assertPreAdmissionRefusalsAndAtomicityV01(
  fixture: FixtureV01,
): void {
  const { db, config, admission_request: request } = fixture;
  const before = databaseStateV01(db);
  const refuseWithoutMutation = (
    changedRequest: unknown,
    expected: RegExp,
    credential = fixture.admission_credential,
    observedAt = "2026-07-18T15:00:40.000Z",
  ) => {
    assert.throws(
      () =>
        admitSourceLinkedOperationalContinuationV01(db, {
          config,
          credential,
          request: changedRequest,
          clock: fixedClockV01(observedAt),
          secret_source: secrets,
        }),
      expected,
    );
    assert.equal(databaseStateV01(db), before);
  };

  const sourceMismatch = structuredClone(request);
  sourceMismatch.source_request.frames[0]!.review_fingerprint =
    `sha256:${"f".repeat(64)}`;
  refuseWithoutMutation(
    sourceMismatch,
    /context_use_attribution_review_fingerprint_mismatch|continuity_dynamics_review_fingerprint_mismatch/u,
  );

  const identityMismatch = structuredClone(request);
  identityMismatch.expected_materialization_identity = {
    ...identityMismatch.expected_materialization_identity,
    materialization_fingerprint: `sha256:${"e".repeat(64)}`,
  };
  refuseWithoutMutation(
    identityMismatch,
    /operational_continuation_expected_materialization_mismatch/u,
  );

  const packetMismatch = structuredClone(request);
  packetMismatch.expected_packet_b_fingerprint = `sha256:${"d".repeat(64)}`;
  refuseWithoutMutation(
    packetMismatch,
    /operational_continuation_expected_materialization_mismatch/u,
  );

  const cutoffMismatch = structuredClone(request);
  cutoffMismatch.source_request.decision_time_cutoff =
    "2026-07-18T15:00:01.000Z";
  refuseWithoutMutation(
    cutoffMismatch,
    /operational_continuation_expected_materialization_mismatch/u,
  );

  const staleSelection = structuredClone(request);
  staleSelection.expected_active_selection_revision += 1;
  refuseWithoutMutation(
    staleSelection,
    /operational_continuation_active_selection_changed/u,
  );

  const crossScope = structuredClone(request);
  crossScope.project_id = "project:foreign";
  refuseWithoutMutation(
    crossScope,
    /operational_continuation_admission_scope_conflict/u,
  );
  const crossWorkspace = structuredClone(request);
  crossWorkspace.workspace_id = "workspace:foreign";
  refuseWithoutMutation(
    crossWorkspace,
    /operational_continuation_admission_scope_conflict/u,
  );

  const injectedAuthority = {
    ...structuredClone(request),
    actor: "caller:forbidden",
    admitted_at: "2026-07-18T15:00:40.000Z",
    record_id: "caller:forbidden",
    execution_authority_granted: true,
  };
  refuseWithoutMutation(
    injectedAuthority,
    /operational_continuation_admission_request_invalid/u,
  );

  const zeroSourceRequest = {
    ...structuredClone(request.source_request),
    max_selected_candidates: 0,
  };
  const zeroContinuation =
    rebuildOperationalContinuationFromDurableSourcesV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      operator_id: config.operator_id,
      ...zeroSourceRequest,
    });
  const noEligible = requestForContinuationV01(
    request,
    zeroSourceRequest,
    zeroContinuation,
  );
  refuseWithoutMutation(
    noEligible,
    /operational_continuation_no_selected_eligible_material/u,
  );

  refuseWithoutMutation(
    request,
    /operator_action_nonce_invalid/u,
    {
      ...fixture.admission_credential,
      action_nonce: `${fixture.admission_credential.action_nonce}invalid`,
    },
  );
  refuseWithoutMutation(
    request,
    /operator_session_expired|operator_action_nonce_expired/u,
    fixture.admission_credential,
    "2026-07-19T15:00:40.000Z",
  );

  for (const [name, dependencies] of [
    [
      "before-transaction",
      { before_transaction: () => { throw new Error("injected_before_transaction"); } },
    ],
    [
      "after-packet",
      {
        after_packet_insert_inside_transaction: () => {
          throw new Error("injected_after_packet");
        },
      },
    ],
    [
      "after-admission",
      {
        after_admission_insert_inside_transaction: () => {
          throw new Error("injected_after_admission");
        },
      },
    ],
  ] as const) {
    const clone = cloneDatabaseV01(db, `atomic-${name}`);
    try {
      const cloneBefore = databaseStateV01(clone);
      assert.throws(
        () =>
          admitSourceLinkedOperationalContinuationV01(
            clone,
            {
              config,
              credential: fixture.admission_credential,
              request,
              clock: fixedClockV01("2026-07-18T15:00:50.000Z"),
              secret_source: secrets,
            },
            dependencies,
          ),
        /injected_before_transaction|operational_continuation_admission_write_failed/u,
      );
      assert.equal(databaseStateV01(clone), cloneBefore);
      assert.equal(
        readOperationalContinuationLineageStateV01(clone, config),
        null,
      );
    } finally {
      clone.close();
    }
  }

  const stalePacketA = cloneDatabaseV01(db, "stale-packet-a");
  try {
    stalePacketA
      .prepare(
        `UPDATE vnext_semantic_target_heads
            SET revision = revision + 1,
                updated_at = '2026-07-18T15:00:54.000Z'
          WHERE workspace_id = ? AND project_id = ?`,
      )
      .run(config.workspace_id, config.project_id);
    const changed = databaseStateV01(stalePacketA);
    assert.notEqual(
      readProjectWorkInitializationV01(stalePacketA, config).current_packet
        ?.packet_id,
      fixture.packet_a.packet_id,
    );
    assert.throws(
      () =>
        admitSourceLinkedOperationalContinuationV01(stalePacketA, {
          config,
          credential: fixture.admission_credential,
          request,
          clock: fixedClockV01("2026-07-18T15:00:54.000Z"),
          secret_source: secrets,
        }),
      /operational_continuation_packet_a_no_longer_current/u,
    );
    assert.equal(databaseStateV01(stalePacketA), changed);
  } finally {
    stalePacketA.close();
  }

  const nonterminal = cloneDatabaseV01(db, "nonterminal-run");
  try {
    nonterminal
      .prepare(
        "UPDATE autonomy_runs SET status = 'running', finished_at = NULL WHERE run_id = ?",
      )
      .run(fixture.run_a.run_id);
    const changed = databaseStateV01(nonterminal);
    assert.throws(
      () =>
        admitSourceLinkedOperationalContinuationV01(nonterminal, {
          config,
          credential: fixture.admission_credential,
          request,
          clock: fixedClockV01("2026-07-18T15:00:55.000Z"),
          secret_source: secrets,
        }),
      /operational_continuation_nonterminal_run_conflict/u,
    );
    assert.equal(databaseStateV01(nonterminal), changed);
  } finally {
    nonterminal.close();
  }

  const orphanPacket = cloneDatabaseV01(db, "orphan-packet");
  try {
    const continuation = rebuildOperationalContinuationFromDurableSourcesV01(
      orphanPacket,
      {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        operator_id: config.operator_id,
        ...request.source_request,
      },
    );
    const packetB = continuation.candidate_task_context_packet_b;
    insertVNextCoreRecordV01(orphanPacket, {
      record_kind: "task_context_packet",
      record_id: packetB.packet_id,
      workspace_id: packetB.workspace_id,
      project_id: packetB.project_id,
      fingerprint: packetB.integrity.fingerprint,
      idempotency_key:
        continuation.materialization_identity.future_admission_idempotency_key,
      payload: packetB,
      created_at: packetB.generated_at,
    });
    const projected = readProjectWorkInitializationV01(orphanPacket, config);
    assert.notEqual(projected.current_packet?.packet_id, packetB.packet_id);
    assert.throws(
      () =>
        admitSourceLinkedOperationalContinuationV01(orphanPacket, {
          config,
          credential: fixture.admission_credential,
          request,
          clock: fixedClockV01("2026-07-18T15:00:56.000Z"),
          secret_source: secrets,
        }),
      /operational_continuation_orphan_packet_conflict/u,
    );
  } finally {
    orphanPacket.close();
  }

  let rolledBackAdmission: OperationalContinuationAdmissionV01 | null = null;
  const capturedAdmission = cloneDatabaseV01(db, "captured-admission");
  try {
    assert.throws(
      () =>
        admitSourceLinkedOperationalContinuationV01(
          capturedAdmission,
          {
            config,
            credential: fixture.admission_credential,
            request,
            clock: fixedClockV01("2026-07-18T15:00:57.000Z"),
            secret_source: secrets,
          },
          {
            after_admission_insert_inside_transaction: () => {
              const row = capturedAdmission
                .prepare(
                  "SELECT payload_json FROM vnext_core_records WHERE record_kind = 'operational_continuation_admission'",
                )
                .get() as { payload_json: string };
              rolledBackAdmission = JSON.parse(
                row.payload_json,
              ) as OperationalContinuationAdmissionV01;
              throw new Error("capture_rollback_admission");
            },
          },
        ),
      /operational_continuation_admission_write_failed/u,
    );
    assert.equal(readOperationalContinuationLineageStateV01(capturedAdmission, config), null);
  } finally {
    capturedAdmission.close();
  }
  assert(rolledBackAdmission);
  const exactRolledBackAdmission =
    rolledBackAdmission as OperationalContinuationAdmissionV01;

  const orphanAdmission = cloneDatabaseV01(db, "orphan-admission");
  try {
    insertAdmissionOnlyV01(orphanAdmission, exactRolledBackAdmission);
    assert.throws(
      () => readOperationalContinuationLineageStateV01(orphanAdmission, config),
      /operational_continuation_packet_missing/u,
    );
    assert.notEqual(
      readProjectWorkInitializationV01(orphanAdmission, config).current_packet
        ?.packet_id,
      request.expected_packet_b_id,
    );
  } finally {
    orphanAdmission.close();
  }

  const mismatchedPacketAdmission = cloneDatabaseV01(
    db,
    "mismatched-packet-admission",
  );
  try {
    const alternatePacket = zeroContinuation.candidate_task_context_packet_b;
    assert.notEqual(alternatePacket.packet_id, request.expected_packet_b_id);
    insertVNextCoreRecordV01(mismatchedPacketAdmission, {
      record_kind: "task_context_packet",
      record_id: request.expected_packet_b_id,
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      fingerprint: alternatePacket.integrity.fingerprint,
      idempotency_key: exactRolledBackAdmission.idempotency_key,
      payload: alternatePacket,
      created_at: alternatePacket.generated_at,
    });
    insertAdmissionOnlyV01(
      mismatchedPacketAdmission,
      exactRolledBackAdmission,
    );
    assert.throws(
      () =>
        readOperationalContinuationLineageStateV01(
          mismatchedPacketAdmission,
          config,
        ),
      /operational_continuation_packet_resealed/u,
    );
    assert.notEqual(
      readProjectWorkInitializationV01(mismatchedPacketAdmission, config)
        .current_packet?.packet_id,
      request.expected_packet_b_id,
    );
  } finally {
    mismatchedPacketAdmission.close();
  }
}

function assertUnknownHistoricalPacketRemainsHistoryV01(
  fixture: FixtureV01,
  packetB: TaskContextPacketV01,
): void {
  const historical = cloneDatabaseV01(fixture.db, "unknown-historical-packet");
  try {
    const {
      packet_version: _packetVersion,
      packet_id: _packetId,
      authority_summary: authoritySummary,
      integrity: _integrity,
      ...packetInput
    } = packetB;
    const unknownPacket = buildTaskContextPacketV01({
      ...packetInput,
      compatibility: {
        ...structuredClone(packetB.compatibility),
        source_contracts: ["unknown_historical_packet_fixture.v0.1"],
        source_refs: [],
      },
      authority_notes: authoritySummary.notes,
    });
    insertVNextCoreRecordV01(historical, {
      record_kind: "task_context_packet",
      record_id: unknownPacket.packet_id,
      workspace_id: unknownPacket.workspace_id,
      project_id: unknownPacket.project_id,
      fingerprint: unknownPacket.integrity.fingerprint,
      idempotency_key: null,
      payload: unknownPacket,
      created_at: unknownPacket.generated_at,
    });
    assert.equal(
      readProjectWorkInitializationV01(historical, fixture.config).current_packet
        ?.packet_id,
      packetB.packet_id,
    );
    assert.throws(
      () =>
        inspectVNextOperatorPilotPacketLineageV01(historical, {
          config: fixture.config,
          packet_id: unknownPacket.packet_id,
          packet_fingerprint: unknownPacket.integrity.fingerprint,
        }),
      /initial_project_work_lineage_invalid|operator_pilot_initial_packet_lineage_invalid|operator_pilot_handoff_packet_not_compiled/u,
    );
  } finally {
    historical.close();
  }
}

function assertRecoveryAndPortabilityV01(
  fixture: FixtureV01,
  packetBId: string,
): void {
  const recovery = validateRecoveryCanonicalDatabaseV01(fixture.db);
  assert.equal(recovery.status, "valid", JSON.stringify(recovery));
  const exported = exportActivePortableProjectV01(fixture.db, {
    include_personal_perspective: false,
    exported_at: "2026-07-18T15:01:30.000Z",
  });
  const parsed = parseAndValidatePortableProjectV01(exported.bytes);
  assert.equal(
    parsed.records.filter(
      (record) => record.record_kind === "operational_continuation_admission",
    ).length,
    1,
  );
  assert.equal(
    new TextDecoder().decode(exported.bytes).includes(PROJECT_ROOT),
    false,
  );
  const destinationRoot = path.join(ROOT, "portable-destination");
  const destinationProjects = path.join(destinationRoot, "projects");
  const destinationPath = path.join(destinationRoot, "augnes.db");
  mkdirSync(destinationProjects, { recursive: true });
  const destination = new Database(destinationPath);
  destination.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(destination);
  try {
    const imported = importPortableProjectV01(destination, {
      bytes: exported.bytes,
      destination_root_base: destinationProjects,
      imported_at: "2026-07-18T15:01:40.000Z",
    });
    assert.equal(imported.status, "imported");
    const state = readOperationalContinuationLineageStateV01(
      destination,
      fixture.config,
    );
    assert.equal(state?.packet_b.packet_id, packetBId);
    assert.equal(
      readProjectWorkInitializationV01(destination, fixture.config)
        .current_packet?.packet_id,
      packetBId,
    );
    assert.equal(
      validateRecoveryCanonicalDatabaseV01(destination).status,
      "valid",
    );
  } finally {
    destination.close();
  }
}

function assertDuplicateAdmissionFailsClosedV01(
  fixture: FixtureV01,
  admission: OperationalContinuationAdmissionV01,
  packetBId: string,
): void {
  const duplicate = cloneDatabaseV01(fixture.db, "duplicate-admission");
  try {
    duplicate
      .prepare(
        `INSERT INTO vnext_core_records (
           record_kind, record_id, workspace_id, project_id, fingerprint,
           idempotency_key, payload_json, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        "operational_continuation_admission",
        `${admission.admission_id}:duplicate`,
        admission.workspace_id,
        admission.project_id,
        admission.integrity.fingerprint,
        `sha256:${"9".repeat(64)}`,
        canonicalizeProtocolValueV01(admission),
        admission.authenticated_action.admitted_at,
      );
    assert.throws(
      () =>
        readOperationalContinuationLineageStateV01(
          duplicate,
          fixture.config,
        ),
      /operational_continuation_admission_ambiguous/u,
    );
    assert.notEqual(
      readProjectWorkInitializationV01(duplicate, fixture.config)
        .current_packet?.packet_id,
      packetBId,
    );
  } finally {
    duplicate.close();
  }
}

function requestForContinuationV01(
  base: AdmitSourceLinkedOperationalContinuationRequestV01,
  sourceRequest: AdmitSourceLinkedOperationalContinuationRequestV01["source_request"],
  continuation: ReturnType<
    typeof rebuildOperationalContinuationFromDurableSourcesV01
  >,
): AdmitSourceLinkedOperationalContinuationRequestV01 {
  return {
    ...structuredClone(base),
    source_request: structuredClone(sourceRequest),
    expected_materialization_identity:
      continuation.materialization_identity,
    expected_selection_id: continuation.selection.selection_id,
    expected_selection_fingerprint: continuation.selection.integrity.fingerprint,
    expected_packet_b_id:
      continuation.candidate_task_context_packet_b.packet_id,
    expected_packet_b_fingerprint:
      continuation.candidate_task_context_packet_b.integrity.fingerprint,
  };
}

function insertAdmissionOnlyV01(
  db: Database.Database,
  admission: OperationalContinuationAdmissionV01,
): void {
  insertVNextCoreRecordV01(db, {
    record_kind: "operational_continuation_admission",
    record_id: admission.admission_id,
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    fingerprint: admission.integrity.fingerprint,
    idempotency_key: admission.idempotency_key,
    payload: admission,
    created_at: admission.authenticated_action.admitted_at,
  });
}

function persistOperationalSourceV01(
  db: Database.Database,
  source: {
    prior_task_context_packet: TaskContextPacketV01;
    later_task_context_packet: TaskContextPacketV01;
    source_transition_receipt: StateTransitionReceiptV01;
    later_task_run_receipt: RunReceiptV01;
    context_use_review: ContextUseReviewV01;
  },
): void {
  persistCoreV01(db, "run_receipt", source.later_task_run_receipt);
  persistCoreV01(
    db,
    "context_use_review",
    source.context_use_review,
    createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        logical_identity:
          createVNextOperatorPilotContextUseReviewLogicalIdentityV01(
            source.context_use_review,
          ),
      }),
    ),
  );
}

function persistCoreV01(
  db: Database.Database,
  kind: "run_receipt" | "episode_delta_proposal" | "context_use_review",
  payload: RunReceiptV01 | ContextUseReviewV01 | ReturnType<typeof buildSemanticReviewLoopProposalFixture>,
  idempotencyOverride?: string | null,
): void {
  const binding =
    kind === "run_receipt"
      ? {
          record_id: (payload as RunReceiptV01).receipt_id,
          fingerprint: (payload as RunReceiptV01).integrity.fingerprint,
          idempotency_key: (payload as RunReceiptV01).idempotency_key,
          created_at: (payload as RunReceiptV01).recorded_at,
        }
      : kind === "episode_delta_proposal"
        ? {
            record_id: (payload as ReturnType<typeof buildSemanticReviewLoopProposalFixture>).proposal_id,
            fingerprint: (payload as ReturnType<typeof buildSemanticReviewLoopProposalFixture>).integrity.fingerprint,
            idempotency_key: null,
            created_at: (payload as ReturnType<typeof buildSemanticReviewLoopProposalFixture>).created_at,
          }
        : {
            record_id: (payload as ContextUseReviewV01).review_id,
            fingerprint: (payload as ContextUseReviewV01).integrity.fingerprint,
            idempotency_key: null,
            created_at: (payload as ContextUseReviewV01).reviewed_at,
          };
  insertVNextCoreRecordV01(db, {
    record_kind: kind,
    record_id: binding.record_id,
    workspace_id: payload.workspace_id,
    project_id: payload.project_id,
    fingerprint: binding.fingerprint,
    idempotency_key:
      idempotencyOverride === undefined
        ? binding.idempotency_key
        : idempotencyOverride,
    payload,
    created_at: binding.created_at,
  });
}

function deterministicServiceV01(
  runtimeInstanceFingerprint: string,
  now: string,
): LiveNativeHostRunServiceV01 {
  return new LiveNativeHostRunServiceV01({
    open_database: openDatabaseV01,
    adapter_factory: () =>
      createDeterministicCodexAdapterV01({ now: () => now }),
    now: () => now,
    runtime_instance_fingerprint: runtimeInstanceFingerprint,
    runtime_generation_fingerprint: `sha256:${"a".repeat(64)}`,
    repository_execution_dependencies: { platform: "darwin" },
  });
}

function blockingDeterministicServiceV01(
  captured: NativeHostRequestV01[],
): LiveNativeHostRunServiceV01 {
  const delegate = createDeterministicCodexAdapterV01({
    now: () => "2026-07-18T15:08:00.000Z",
  });
  const adapter: NativeHostAdapterV01 = {
    ...delegate,
    invoke(request, control) {
      captured.push(structuredClone(request));
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const result = gate.then(() => delegate.invoke(request, control).result);
      const settled = result.then(
        () => undefined,
        () => undefined,
      );
      return {
        result,
        settled,
        async request_stop() {
          release();
          await settled;
        },
      };
    },
  };
  return new LiveNativeHostRunServiceV01({
    open_database: openDatabaseV01,
    adapter_factory: () => adapter,
    now: () => "2026-07-18T15:08:00.000Z",
    runtime_instance_fingerprint: `sha256:${"2".repeat(64)}`,
    runtime_generation_fingerprint: `sha256:${"b".repeat(64)}`,
    repository_execution_dependencies: { platform: "darwin" },
  });
}

function grantStartDecisionV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: NonNullable<
    Awaited<ReturnType<typeof prepareRepositoryManagedDelegationV01>>["decision_request"]
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

function credentialV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
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

function effectCountsV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
) {
  const core = (recordKind: VNextCoreRecordKindV01) =>
    countVNextCoreRecordsV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      record_kind: recordKind,
    });
  return {
    task_context_packet: core("task_context_packet"),
    operational_continuation_admission: core(
      "operational_continuation_admission",
    ),
    state_transition_receipt: core("state_transition_receipt"),
    episode_delta_proposal: core("episode_delta_proposal"),
    review_decision: core("review_decision"),
    repository_attachment: countScopedV01(
      db,
      "vnext_repository_execution_attachments",
      config,
    ),
    repository_decision: countScopedV01(
      db,
      "vnext_repository_execution_decision_requests",
      config,
    ),
    autonomy_run: countScopedV01(db, "autonomy_runs", config),
  };
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

function tableSnapshotV01(db: Database.Database, table: string): unknown[] {
  return db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all();
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
        return [name, db.prepare(`SELECT * FROM "${escaped}" ORDER BY rowid`).all()];
      }),
    ),
  );
}

function cloneDatabaseV01(
  source: Database.Database,
  name: string,
): Database.Database {
  const clonePath = path.join(ROOT, `${name}.sqlite`);
  writeFileSync(clonePath, source.serialize());
  const clone = new Database(clonePath, { fileMustExist: true });
  clone.pragma("foreign_keys = ON");
  return clone;
}

function assertAllBooleanAuthorityFalseV01(value: object): void {
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "boolean") assert.equal(item, false, key);
  }
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
  assert.fail("managed Run A did not settle in the bounded loop");
}

function initializeRepositoryV01(): void {
  mkdirSync(PROJECT_ROOT, { recursive: true });
  writeFileSync(path.join(PROJECT_ROOT, "README.md"), "# ACGC5B disposable fixture\n", "utf8");
  execFileSync("git", ["init", "--quiet", PROJECT_ROOT]);
  execFileSync("git", ["-C", PROJECT_ROOT, "add", "README.md"]);
  execFileSync("git", [
    "-C",
    PROJECT_ROOT,
    "-c",
    "user.name=Augnes Test",
    "-c",
    "user.email=test@augnes.local",
    "commit",
    "--quiet",
    "-m",
    "fixture",
  ]);
}

function gitStatusV01(): string {
  return execFileSync("git", ["-C", PROJECT_ROOT, "status", "--porcelain"], {
    encoding: "utf8",
  }).trim();
}

function openDatabaseV01(): Database.Database {
  const db = new Database(DATABASE_PATH);
  db.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(db);
  return db;
}
