import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { readAutonomyRunLedgerRecord } from "@/lib/autonomy/runner-ledger";
import {
  ACGC6A_MERGED_STAGE5_BASELINE_COMMIT_V01,
  buildModelHostSuccessionArmResultV01,
  buildModelHostSuccessionBenchmarkV01,
  buildModelHostSuccessionFallbackPlanV01,
  buildModelHostSuccessionFrozenCaseV01,
  buildModelHostSuccessionRouteProfileV01,
  routeProfileRefV01,
} from "@/lib/vnext/model-host-succession-benchmark";
import {
  readVNextCoreRecordV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  exportActivePortableProjectV01,
  importPortableProjectV01,
} from "@/lib/vnext/portability/portable-project";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  adoptLegacyPhysicalRootBaselineV01,
  grantRepositoryExecutionDecisionFromBrowserSessionV01,
  prepareRepositoryExecutionV01,
} from "@/lib/vnext/repository-execution/repository-execution";
import {
  prepareRepositoryManagedDelegationV01,
  startRepositoryManagedDelegationV01,
} from "@/lib/vnext/repository-execution/repository-managed-delegation";
import { readContextUseAttributionProjectionV01 } from "@/lib/vnext/runtime/context-use-attribution-read-model";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  issueVNextRepositoryDecisionChallengeV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "@/lib/vnext/runtime/local-operator-session";
import { LiveNativeHostRunServiceV01 } from "@/lib/vnext/runtime/live-native-host-run-service";
import { recordVNextOperatorPilotContextUseReviewV01 } from "@/lib/vnext/runtime/operator-pilot-context-use-review";
import { applyCanonicalDatabaseMigrations } from "@/scripts/canonical-database-migrations.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "@/scripts/recovery-canonical-record-validator";
import {
  admitReusableOperationalContinuationPacketBV01,
  cleanupReusableOperationalContinuationFixtureV01,
  createReusableOperationalContinuationFixtureV01,
  reusableOperationalContinuationFixtureFetchCallsV01,
  type AdmittedReusableOperationalContinuationPacketBV01,
  type ReusableOperationalContinuationFixtureV01,
} from "@/scripts/test-operational-continuation-admission";
import type { ContextUseAttributionProjectionV01 } from "@/types/vnext/context-use-attribution-projection";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01,
  type ModelHostSuccessionArmResultV01,
  type ModelHostSuccessionBenchmarkV01,
  type ModelHostSuccessionFallbackPlanV01,
  type ModelHostSuccessionPairwiseDeltaV01,
  type ModelHostSuccessionRouteProfileV01,
  type ModelHostSuccessionRouteRoleV01,
} from "@/types/vnext/model-host-succession-benchmark";
import {
  NATIVE_HOST_RESULT_VERSION_V01,
  type NativeHostAdapterV01,
  type NativeHostInvocationControlV01,
  type NativeHostRequestV01,
  type NativeHostResultV01,
  type NativeHostTerminalOutcomeV01,
} from "@/types/vnext/native-host-adapter";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

const CONSTRUCTION_CUTOFF = "2026-07-18T15:02:00.000Z";
const OBSERVATION_CUTOFF = "2026-07-18T18:00:00.000Z";
const ROUTE_OBSERVED_AT = "2026-07-18T15:02:00.000Z";
const FULL_CAPABILITY = [
  "return_bounded_structured_result",
  "validated_packet_delivery",
];
const REQUIRED_FROZEN_CHECK = "verify-portable-output";

export interface ModelHostSuccessionBenchmarkFixtureResultV01 {
  benchmark: ModelHostSuccessionBenchmarkV01;
  frozen_packet_b_canonical_bytes: string;
  captured_packet_b_canonical_bytes: string[];
  arm_database_paths: string[];
  arm_project_roots: string[];
  real_provider_calls: 0;
  fetch_calls: 0;
  cleanup_verified: true;
  source_fixture_root_removed: true;
}

interface ExecutedArmV01 {
  result: ModelHostSuccessionArmResultV01;
  captured_packet_b_canonical_bytes: string;
  database_path: string;
  project_root: string;
  review: ContextUseReviewV01;
  attribution: ContextUseAttributionProjectionV01;
  receipt: RunReceiptV01;
}

class BenchmarkSecretSourceV01 implements VNextLocalOperatorSecretSourceV01 {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

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

export function buildModelHostSuccessionRouteProfilesFixtureV01(): ModelHostSuccessionRouteProfileV01[] {
  const predecessorIdentity = {
    provider_ref: null,
    model_ref: null,
    host_ref: routeExternalRefV01(
      "native_host",
      "deterministic_local",
      "observed_deterministic_execution",
    ),
    adapter_implementation_id: "deterministic_codex_adapter",
    adapter_implementation_version: "deterministic_codex_adapter.v0.1",
    native_host_adapter_version: "deterministic_codex_adapter.v0.1",
    capability_version: "codex_host_round_trip.v0.1",
    execution_profile: "deterministic_zero_model" as const,
    provider_egress_policy: "forbidden" as const,
    session_continuity_mode: "fresh_session_no_reuse" as const,
    supported_operation_classes: FULL_CAPABILITY,
    unsupported_operation_classes: [
      REQUIRED_FROZEN_CHECK,
      "provider_or_model_egress",
      "repository_command_execution",
    ],
    capability_coverage: coverageV01(
      FULL_CAPABILITY,
      [
        REQUIRED_FROZEN_CHECK,
        "provider_or_model_egress",
        "repository_command_execution",
      ],
    ),
    predecessor_route_ref: null,
    fallback_target_ref: null,
  };
  const predecessor = buildModelHostSuccessionRouteProfileV01({
    route_role: "predecessor_route_replay",
    evidence_class: "observed_deterministic_execution",
    ...predecessorIdentity,
  });
  const predecessorRef = routeProfileRefV01(predecessor);
  const zero = buildModelHostSuccessionRouteProfileV01({
    route_role: "zero_model_fallback",
    evidence_class: "observed_deterministic_execution",
    ...predecessorIdentity,
    predecessor_route_ref: predecessorRef,
  });
  const sameModel = buildModelHostSuccessionRouteProfileV01({
    route_role: "same_model_cold_session_simulation",
    evidence_class: "simulated_route_contract",
    ...predecessorIdentity,
    predecessor_route_ref: predecessorRef,
  });
  const constrained = buildModelHostSuccessionRouteProfileV01({
    route_role: "capability_constrained_simulation",
    provider_ref: null,
    model_ref: null,
    host_ref: cloneV01(predecessorIdentity.host_ref),
    adapter_implementation_id: "benchmark_capability_constrained_adapter",
    adapter_implementation_version:
      "benchmark_capability_constrained_adapter.v0.1",
    native_host_adapter_version:
      "benchmark_native_host_adapter.capability_constrained.v0.1",
    capability_version: "codex_host_round_trip.constrained.v0.1",
    execution_profile: "deterministic_zero_model",
    provider_egress_policy: "forbidden",
    session_continuity_mode: "fresh_session_no_reuse",
    evidence_class: "simulated_route_contract",
    supported_operation_classes: ["validated_packet_delivery"],
    unsupported_operation_classes: [
      REQUIRED_FROZEN_CHECK,
      "provider_or_model_egress",
      "repository_command_execution",
      "return_bounded_structured_result",
    ],
    capability_coverage: coverageV01(
      ["validated_packet_delivery"],
      [
        REQUIRED_FROZEN_CHECK,
        "provider_or_model_egress",
        "repository_command_execution",
        "return_bounded_structured_result",
      ],
    ),
    predecessor_route_ref: predecessorRef,
    fallback_target_ref: routeProfileRefV01(zero),
  });
  const alternate = buildModelHostSuccessionRouteProfileV01({
    route_role: "alternate_provider_host_contract_simulation",
    provider_ref: routeExternalRefV01(
      "provider",
      "synthetic-alternate-provider",
      "simulated_route_contract",
    ),
    model_ref: routeExternalRefV01(
      "model",
      "synthetic-alternate-model",
      "simulated_route_contract",
    ),
    host_ref: routeExternalRefV01(
      "native_host",
      "synthetic-alternate-host",
      "simulated_route_contract",
    ),
    adapter_implementation_id: "benchmark_alternate_contract_adapter",
    adapter_implementation_version:
      "benchmark_alternate_contract_adapter.v0.1",
    native_host_adapter_version:
      "benchmark_native_host_adapter.alternate_contract.v0.1",
    capability_version: "alternate_contract_capability.v0.1",
    execution_profile: "deterministic_zero_model",
    provider_egress_policy: "forbidden",
    session_continuity_mode: "fresh_session_no_reuse",
    evidence_class: "simulated_route_contract",
    supported_operation_classes: FULL_CAPABILITY,
    unsupported_operation_classes: [
      REQUIRED_FROZEN_CHECK,
      "provider_or_model_egress",
      "repository_command_execution",
    ],
    capability_coverage: coverageV01(
      FULL_CAPABILITY,
      [
        REQUIRED_FROZEN_CHECK,
        "provider_or_model_egress",
        "repository_command_execution",
      ],
    ),
    predecessor_route_ref: predecessorRef,
    fallback_target_ref: null,
  });
  return [sameModel, constrained, alternate, zero, predecessor];
}

export async function buildDeterministicModelHostSuccessionBenchmarkFixtureV01(): Promise<ModelHostSuccessionBenchmarkFixtureResultV01> {
  let sourceFixture: ReusableOperationalContinuationFixtureV01 | null = null;
  let sourceRoot = "";
  try {
    sourceFixture = await createReusableOperationalContinuationFixtureV01({
      data_classification: "public_safe",
    });
    sourceRoot = sourceFixture.root;
    const admitted = admitReusableOperationalContinuationPacketBV01(sourceFixture);
    const frozenCase = buildFrozenCaseV01(sourceFixture, admitted);
    const exported = exportActivePortableProjectV01(sourceFixture.db, {
      include_personal_perspective: false,
      exported_at: "2026-07-18T15:02:30.000Z",
    });
    const profiles = buildModelHostSuccessionRouteProfilesFixtureV01();
    const executed: ExecutedArmV01[] = [];
    for (const [index, profile] of profiles.slice(0, 4).entries()) {
      executed.push(await executeArmV01({
        source_fixture: sourceFixture,
        admitted,
        portable_bytes: exported.bytes,
        frozen_case: frozenCase,
        profile,
        index,
      }));
    }
    const constrained = executed.find(
      (arm) =>
        arm.result.route_profile_ref.route_role ===
        "capability_constrained_simulation",
    );
    assert(constrained);
    const candidateHistoryBefore = canonicalizeProtocolValueV01(
      constrained.result,
    );
    const predecessorProfile = profiles[4]!;
    const fallbackPlan = buildFallbackPlanV01(
      frozenCase,
      constrained.result,
      predecessorProfile,
    );
    const predecessor = await executeArmV01({
      source_fixture: sourceFixture,
      admitted,
      portable_bytes: exported.bytes,
      frozen_case: frozenCase,
      profile: predecessorProfile,
      index: 4,
    });
    executed.push(predecessor);
    assert.equal(
      canonicalizeProtocolValueV01(constrained.result),
      candidateHistoryBefore,
      "predecessor replay mutated the settled candidate history",
    );
    assertNoCrossArmIdentityReuseV01(executed.map((arm) => arm.result));
    const benchmark = buildModelHostSuccessionBenchmarkV01({
      frozen_case: frozenCase,
      route_profiles: profiles,
      arm_results: executed.map((arm) => arm.result),
      fallback_plan: fallbackPlan,
      fallback_relation: {
        candidate_arm_id: constrained.result.arm_id,
        predecessor_replay_arm_id: predecessor.result.arm_id,
        candidate_history_unchanged: true,
        cross_arm_contamination_detected: false,
        automatic_execution_used: false,
      },
      pairwise_route_deltas: pairwiseDeltasV01(executed.map((arm) => arm.result)),
      trade_offs: [
        "The constrained route preserved the unsupported-operation hard gate but required explicit fallback.",
        "The alternate simulated route preserved normalized request and result contracts without establishing equal capability or model quality.",
        "The zero-model route preserved packet delivery and bounded receipts while leaving repository execution and model quality unsupported.",
        "The predecessor replay demonstrated fresh exact-source reconstruction, not automatic rollback authority.",
      ],
      resource_observation_provenance: [
        "Provider, model, network, GitHub, and external call counts come from the deterministic fixture ledger and bounded adapter metadata.",
        "Usage, monetary cost, genuine performance latency, and required human intervention were not observed.",
      ],
      missing_evidence: [
        "Real model quality remains unobserved because no live provider or model was called.",
        "Provider usage and monetary cost remain unobserved.",
        "Genuine performance latency remains unobserved; fixture chronology is synthetic.",
        "Required human intervention and real-host recovery burden remain unobserved.",
        "Capability equality across simulated identities remains unobserved.",
      ],
      limitations: [
        "This exact synthetic public-safe case evaluates route-contract portability and fallback readiness only.",
        "Simulated provider and model identities do not represent real provider execution.",
        "Same normalized output does not establish equal capability or model quality.",
        "Packet delivery and receipt reference do not establish item use, support, outcome association, or causal contribution.",
        "Fallback readiness does not authorize automatic fallback, rollback, Start, or Resume.",
        "The benchmark creates no operational policy, active route pointer, provider registry, activation receipt, or rollback receipt.",
      ],
      adr_owner_gap_observations: adrOwnerGapObservationsV01(),
    });
    assert.equal(reusableOperationalContinuationFixtureFetchCallsV01(), 0);
    const result = {
      benchmark,
      frozen_packet_b_canonical_bytes: canonicalizeProtocolValueV01(
        frozenCase.packet_b,
      ),
      captured_packet_b_canonical_bytes: executed.map(
        (arm) => arm.captured_packet_b_canonical_bytes,
      ),
      arm_database_paths: executed.map((arm) => arm.database_path),
      arm_project_roots: executed.map((arm) => arm.project_root),
      real_provider_calls: 0 as const,
      fetch_calls: 0 as const,
      cleanup_verified: true as const,
      source_fixture_root_removed: true as const,
    };
    cleanupReusableOperationalContinuationFixtureV01(sourceFixture);
    sourceFixture = null;
    assert.equal(execFileSync("test", ["!", "-e", sourceRoot], {
      encoding: "utf8",
    }), "");
    return result;
  } finally {
    if (sourceFixture) cleanupReusableOperationalContinuationFixtureV01(sourceFixture);
  }
}

function buildFrozenCaseV01(
  source: ReusableOperationalContinuationFixtureV01,
  admitted: AdmittedReusableOperationalContinuationPacketBV01,
) {
  return buildModelHostSuccessionFrozenCaseV01({
    packet_a: source.packet_a,
    operational_context_selection: admitted.continuation.selection,
    acgc5a_materialization_identity: admitted.continuation.materialization_identity,
    packet_b: admitted.packet_b,
    continuation_admission: admitted.admission,
    frozen_head_commit: gitV01(source.project_root, ["rev-parse", "HEAD"]),
    frozen_worktree_content_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(
        gitV01(source.project_root, ["ls-files", "-s"]).split("\n"),
      ),
    ),
    construction_cutoff: CONSTRUCTION_CUTOFF,
    observation_cutoff: OBSERVATION_CUTOFF,
    platform: "darwin",
  });
}

async function executeArmV01(input: {
  source_fixture: ReusableOperationalContinuationFixtureV01;
  admitted: AdmittedReusableOperationalContinuationPacketBV01;
  portable_bytes: Uint8Array;
  frozen_case: ReturnType<typeof buildFrozenCaseV01>;
  profile: ModelHostSuccessionRouteProfileV01;
  index: number;
}): Promise<ExecutedArmV01> {
  const role = input.profile.route_role;
  const armScopeRoot = path.join(
    input.source_fixture.root,
    `acgc6a-arm-${String(input.index + 1).padStart(2, "0")}-${role}`,
  );
  const projectsRoot = path.join(armScopeRoot, "projects");
  const databasePath = path.join(armScopeRoot, "augnes.db");
  mkdirSync(projectsRoot, { recursive: true });
  const db = openDatabaseV01(databasePath);
  let service: LiveNativeHostRunServiceV01 | null = null;
  try {
    const baseMs = Date.parse("2026-07-18T16:00:00.000Z") +
      input.index * 12 * 60_000;
    const at = (offsetMs: number) => new Date(baseMs + offsetMs).toISOString();
    const imported = importPortableProjectV01(db, {
      bytes: input.portable_bytes,
      destination_root_base: projectsRoot,
      imported_at: at(0),
    });
    assert.equal(imported.status, "imported");
    const projectRoot = path.join(
      projectsRoot,
      imported.project_id.slice("project:".length),
    );
    execFileSync("git", [
      "clone", "--quiet", "--no-hardlinks",
      input.source_fixture.project_root,
      projectRoot,
    ]);
    execFileSync("git", ["-C", projectRoot, "remote", "remove", "origin"]);
    assert.equal(gitV01(projectRoot, ["status", "--porcelain"]), "");
    assert.equal(
      gitV01(projectRoot, ["rev-parse", "HEAD"]),
      input.frozen_case.repository_state.frozen_head_commit,
    );
    assert.equal(
      createProtocolSha256V01(
        canonicalizeProtocolValueV01(
          gitV01(projectRoot, ["ls-files", "-s"]).split("\n"),
        ),
      ),
      input.frozen_case.repository_state.frozen_worktree_content_fingerprint,
    );
    const config: VNextLocalOperatorPilotConfigV01 = {
      enabled: true,
      workspace_id: imported.workspace_id,
      project_id: imported.project_id,
      operator_id: input.source_fixture.config.operator_id,
      database_path: databasePath,
    };
    const protectedStateBefore = protectedSemanticStateV01(db, config);
    const secrets = new BenchmarkSecretSourceV01(0x6a00_0000 + input.index);
    const baselinePreparation = await prepareRepositoryExecutionV01(
      db,
      config,
      { now: () => at(60_000), platform: "darwin" },
    );
    assert.equal(baselinePreparation.status, "baseline_adoption_required");
    assert(
      baselinePreparation.decision_request &&
      baselinePreparation.admission?.physical_root_observation_fingerprint,
    );
    const baselineAdmission = baselinePreparation.admission;
    assert(baselineAdmission);
    assert(baselineAdmission.physical_root_observation_fingerprint);
    const baselineGrant = grantBrowserDecisionV01(
      db,
      config,
      baselinePreparation.decision_request,
      at(90_000),
      secrets,
    );
    await adoptLegacyPhysicalRootBaselineV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      expected_admission_fingerprint:
        baselineAdmission.admission_fingerprint,
      expected_observation_fingerprint:
        baselineAdmission.physical_root_observation_fingerprint,
      decision_request_fingerprint:
        baselineGrant.decision.request_fingerprint,
      decision_grant_fingerprint:
        baselineGrant.decision.grant_fingerprint!,
    }, { now: () => at(90_000), platform: "darwin" });
    const attachment = await prepareRepositoryExecutionV01(db, config, {
      now: () => at(120_000),
      platform: "darwin",
    });
    assert.equal(attachment.status, "prepared", JSON.stringify(attachment));
    assert(attachment.attachment);
    const captured: NativeHostRequestV01[] = [];
    const adapter = createBenchmarkRouteAdapterV01(
      input.profile,
      at(360_000),
      captured,
    );
    const runtimeInstanceFingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01({ role, runtime: input.index + 1 }),
    );
    service = new LiveNativeHostRunServiceV01({
      open_database: () => openDatabaseV01(databasePath),
      adapter_factory: () => adapter,
      now: () => at(360_000),
      runtime_instance_fingerprint: runtimeInstanceFingerprint,
      runtime_generation_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01({ role, generation: 1 }),
      ),
      repository_execution_dependencies: { platform: "darwin" },
    });
    const prepared = await prepareRepositoryManagedDelegationV01(
      db,
      {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        attachment_id: attachment.attachment.attachment_id,
      },
      service,
      { now: () => at(180_000), platform: "darwin" },
    );
    assert.equal(prepared.status, "decision_required", JSON.stringify(prepared));
    assert(prepared.decision_request && prepared.execution_envelope);
    const startGrant = grantBrowserDecisionV01(
      db,
      config,
      prepared.decision_request,
      at(240_000),
      secrets,
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
        decision_request_fingerprint:
          startGrant.decision.request_fingerprint,
        decision_grant_fingerprint:
          startGrant.decision.grant_fingerprint!,
      },
      service,
      { now: () => at(300_000), platform: "darwin" },
    );
    assert.equal(started.status, "accepted", JSON.stringify(started));
    await waitForTerminalV01(db, started.run_id);
    const run = readAutonomyRunLedgerRecord(started.run_id, { db });
    assert(run);
    const receiptRecord = readVNextCoreRecordV01(db, {
      record_kind: "run_receipt",
      record_id: String(run.metadata.run_receipt_id),
      workspace_id: config.workspace_id,
      project_id: config.project_id,
    });
    assert(receiptRecord);
    const receipt = receiptRecord.payload as RunReceiptV01;
    assert.equal(captured.length, 1);
    assert.equal(
      canonicalizeProtocolValueV01(captured[0]!.packet),
      canonicalizeProtocolValueV01(input.admitted.packet_b),
    );
    const reviewCredential = createOperatorCredentialV01(
      db,
      config,
      at(420_000),
      secrets,
    );
    const recordedReview = recordVNextOperatorPilotContextUseReviewV01(db, {
      config,
      credential: reviewCredential,
      request: {
        action: "record_context_use_review",
        later_run_receipt_id: receipt.receipt_id,
        later_run_receipt_fingerprint: receipt.integrity.fingerprint,
        actually_used: "unknown",
        assessment: "not_applicable",
        correction_summaries: [],
        notes: [
          "ACGC6A records packet delivery separately from unknown item-level use.",
        ],
        metrics: {
          wrong_context_correction_count: null,
          repeated_explanation_estimate: null,
          missing_critical_context_count: null,
          context_refs_used_count: null,
        },
      },
      clock: fixedClockV01(at(480_000)),
      secret_source: secrets,
    });
    assert.equal(recordedReview.status, "inserted");
    const attribution = readContextUseAttributionProjectionV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      review_id: recordedReview.review.review_id,
      review_fingerprint: recordedReview.review.integrity.fingerprint,
      operational_context_selection:
        input.admitted.continuation.selection,
    });
    const operationalRows = attribution.rows.filter(
      (row) => row.operational_continuation,
    );
    assert.equal(operationalRows.length, 1);
    assert.equal(operationalRows[0]!.actual_use.status, "unknown");
    assert.equal(operationalRows[0]!.support_validation.status, "unknown");
    assert.equal(operationalRows[0]!.outcome_association.status, "unknown");
    assert.equal(operationalRows[0]!.causal_contribution.status, "unknown");
    assert.equal(receipt.model_invocations.length, 0);
    assert.equal(receipt.privacy_egress.egress_status, "did_not_occur");
    assert.equal(receipt.commands.length, 0);
    assert.equal(
      receipt.external_refs.some(
        (ref) => ref.external_id === input.profile.route_profile_id,
      ),
      true,
      "route identity missing from exact RunReceipt",
    );
    for (const excluded of input.admitted.continuation.selection.excluded_rows) {
      assert.equal(
        attribution.rows.some(
          (row) =>
            row.operational_continuation?.candidate_id ===
            excluded.candidate_id,
        ),
        false,
        "excluded continuation candidate received an attribution row",
      );
    }
    assert.equal(
      protectedSemanticStateV01(db, config),
      protectedStateBefore,
      "managed arm changed semantic state, Transition history, or Packet count",
    );
    assert.equal(gitV01(projectRoot, ["status", "--porcelain"]), "");
    assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
    const result = armResultV01({
      profile: input.profile,
      config,
      database_path: databasePath,
      project_root: projectRoot,
      attachment_id: attachment.attachment.attachment_id,
      attachment_binding_fingerprint:
        attachment.attachment.binding_fingerprint,
      start_request_fingerprint:
        prepared.decision_request.request_fingerprint,
      start_grant_fingerprint: startGrant.decision.grant_fingerprint!,
      run,
      receipt,
      review: recordedReview.review,
      attribution,
      runtime_instance_fingerprint: runtimeInstanceFingerprint,
      browser_session_id: startGrant.session_id,
      captured_request: captured[0]!,
    });
    await service.shutdown();
    service = null;
    db.close();
    return {
      result,
      captured_packet_b_canonical_bytes: canonicalizeProtocolValueV01(
        captured[0]!.packet,
      ),
      database_path: databasePath,
      project_root: projectRoot,
      review: recordedReview.review,
      attribution,
      receipt,
    };
  } finally {
    if (service) await service.shutdown();
    if (db.open) db.close();
  }
}

function armResultV01(input: {
  profile: ModelHostSuccessionRouteProfileV01;
  config: VNextLocalOperatorPilotConfigV01;
  database_path: string;
  project_root: string;
  attachment_id: string;
  attachment_binding_fingerprint: string;
  start_request_fingerprint: string;
  start_grant_fingerprint: string;
  run: NonNullable<ReturnType<typeof readAutonomyRunLedgerRecord>>;
  receipt: RunReceiptV01;
  review: ContextUseReviewV01;
  attribution: ContextUseAttributionProjectionV01;
  runtime_instance_fingerprint: string;
  browser_session_id: string;
  captured_request: NativeHostRequestV01;
}): ModelHostSuccessionArmResultV01 {
  const constrained =
    input.profile.route_role === "capability_constrained_simulation";
  const role = input.profile.route_role;
  const requiredChecks = input.captured_request.packet.constraints.required_checks;
  const passed = requiredChecks.filter((check) =>
    input.receipt.checks.some(
      (row) => row.check_id === check && row.status === "passed",
    ));
  const failed = requiredChecks.filter((check) =>
    input.receipt.checks.some(
      (row) => row.check_id === check && row.status === "failed",
    ));
  const blocked = requiredChecks.filter((check) =>
    input.receipt.checks.some(
      (row) => row.check_id === check && row.status === "blocked",
    ));
  const skipped = requiredChecks.filter((check) =>
    input.receipt.skipped_checks.some((row) => row.check_id === check));
  const unknown = requiredChecks.filter(
    (check) => ![...passed, ...failed, ...blocked, ...skipped].includes(check),
  );
  const operationalRows = input.attribution.rows.filter(
    (row) => row.operational_continuation,
  );
  assert.equal(operationalRows.length, 1);
  const row = operationalRows[0]!;
  const hostThreadRef = input.receipt.external_refs.find(
    (ref) => ref.ref_type === "host_thread",
  );
  const hostSessionRef = input.receipt.external_refs.find(
    (ref) => ref.ref_type === "host_session",
  );
  const hostTurnRef = input.receipt.external_refs.find(
    (ref) => ref.ref_type === "host_turn",
  );
  const providerThreadRef = input.receipt.external_refs.find(
    (ref) => ref.ref_type === "provider_thread",
  );
  return buildModelHostSuccessionArmResultV01({
    route_profile_ref: routeProfileRefV01(input.profile),
    evidence_class: input.profile.evidence_class,
    fresh_identity_proof: {
      project_scope_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          role,
          workspace_id: input.config.workspace_id,
          project_id: input.config.project_id,
          database_scope: createProtocolSha256V01(input.database_path),
        }),
      ),
      database_scope_fingerprint: createProtocolSha256V01(input.database_path),
      repository_root_fingerprint: createProtocolSha256V01(input.project_root),
      attachment_id: input.attachment_id,
      attachment_binding_fingerprint: input.attachment_binding_fingerprint,
      start_request_fingerprint: input.start_request_fingerprint,
      start_grant_fingerprint: input.start_grant_fingerprint,
      managed_run_id: input.run.run_id,
      controller_identity_fingerprint: input.runtime_instance_fingerprint,
      browser_decision_session_identity_fingerprint: createProtocolSha256V01(
        input.browser_session_id,
      ),
      host_session_identity_fingerprint: hostSessionRef
        ? createProtocolSha256V01(canonicalizeProtocolValueV01(hostSessionRef))
        : createProtocolSha256V01(`host-session:${role}`),
      host_thread_identity_fingerprint: hostThreadRef
        ? createProtocolSha256V01(canonicalizeProtocolValueV01(hostThreadRef))
        : createProtocolSha256V01(`host-thread:${role}`),
      host_turn_identity_fingerprint: hostTurnRef
        ? createProtocolSha256V01(canonicalizeProtocolValueV01(hostTurnRef))
        : createProtocolSha256V01(`host-turn:${role}`),
      provider_thread_identity_fingerprint: providerThreadRef
        ? createProtocolSha256V01(canonicalizeProtocolValueV01(providerThreadRef))
        : null,
      prior_identity_reuse_count: 0,
      no_reuse_proven: true,
      resume_used: false,
      retry_used: false,
    },
    contract_status: constrained ? "fallback_required" : "contract_compatible",
    execution_status: input.receipt.execution.status,
    verification_status: input.receipt.verification.status,
    required_checks: { passed, failed, blocked, skipped, unknown },
    supported_capability: input.profile.supported_operation_classes,
    unsupported_capability: input.profile.unsupported_operation_classes,
    unsupported_operation_executed_count: 0,
    stronger_result_inherited: false,
    silent_fallback_used: false,
    continuation_trace: {
      packet_b_exact_bytes_delivered: true,
      selected_entry_count: operationalRows.length,
      selected_entry_delivered_count:
        row.presentation.status === "yes" ? 1 : 0,
      selected_entry_exact_receipt_referenced_count:
        row.citation_or_reference.status === "referenced" ? 1 : 0,
      excluded_candidate_credit_count: 0,
      bundle_credit_assigned: false,
      packet_level_actual_use_claim: "unknown",
      item_actual_use: "unknown",
      support_validation: "unknown",
      outcome_association: "unknown",
      causal_contribution: "unknown",
    },
    record_refs: {
      run: {
        record_version: "managed_autonomy_run_ledger.v0.1",
        record_id: input.run.run_id,
        record_fingerprint: createProtocolSha256V01(
          canonicalizeProtocolValueV01(input.run),
        ),
      },
      run_receipt: {
        record_version: input.receipt.receipt_version,
        record_id: input.receipt.receipt_id,
        record_fingerprint: input.receipt.integrity.fingerprint,
      },
      context_use_review: {
        record_version: input.review.review_version,
        record_id: input.review.review_id,
        record_fingerprint: input.review.integrity.fingerprint,
      },
      context_use_attribution: {
        record_version: input.attribution.projection_version,
        record_id: input.attribution.projection_id,
        record_fingerprint: input.attribution.integrity.fingerprint,
      },
    },
    resource_observations: {
      provider_calls: 0,
      model_calls: 0,
      network_calls: 0,
      github_calls: 0,
      external_calls: 0,
      usage_units: null,
      monetary_cost_microunits: null,
      genuine_latency_ms: null,
      observation_provenance:
        input.profile.evidence_class === "simulated_route_contract"
          ? "simulated_contract_only"
          : "exact_deterministic_fixture_ledger",
    },
    privacy_egress: "none_observed",
    review_burden: {
      review_action_count: 1,
      correction_count: input.review.corrections.correction_count,
      required_human_intervention_count: null,
    },
    fallback_required: constrained,
    fallback_used:
      role === "zero_model_fallback" || role === "predecessor_route_replay",
    direct_success_claimed: false,
    predecessor_replay_status:
      role === "predecessor_route_replay"
        ? "explicit_fresh_replay_completed"
        : "not_applicable",
    cleanup_recovery_burden: null,
    cleanup_status: "complete",
    platform_boundary:
      "macOS source runtime deterministic fixture; no live provider, packaged host, Windows, Linux, or remote-node claim.",
    limitations: constrained
      ? [
          "The required repository verification operation was unsupported and not executed.",
          "The arm settled as fallback-required; it is not a direct-success result.",
        ]
      : [
          "Repository verification remained skipped because this benchmark executes no project command.",
          "Contract compatibility does not establish model quality or equal capability.",
        ],
  });
}

function createBenchmarkRouteAdapterV01(
  profile: ModelHostSuccessionRouteProfileV01,
  observedAt: string,
  captured: NativeHostRequestV01[],
): NativeHostAdapterV01 {
  return {
    adapter_version: profile.native_host_adapter_version,
    capability_version: profile.capability_version,
    execution_profile: profile.execution_profile,
    provider_egress: "forbidden",
    invoke(
      request: NativeHostRequestV01,
      control: NativeHostInvocationControlV01,
    ) {
      captured.push(cloneV01(request));
      const result = Promise.resolve().then(() =>
        buildBenchmarkNativeHostResultV01(
          profile,
          request,
          observedAt,
          control.cancellation_signal.aborted
            ? "cancelled"
            : profile.route_role === "capability_constrained_simulation"
              ? "blocked"
              : "completed",
        ));
      const settled = result.then(() => undefined, () => undefined);
      return {
        result,
        settled,
        request_stop: () => settled,
      };
    },
  };
}

function buildBenchmarkNativeHostResultV01(
  profile: ModelHostSuccessionRouteProfileV01,
  request: NativeHostRequestV01,
  observedAt: string,
  outcome: NativeHostTerminalOutcomeV01,
): NativeHostResultV01 {
  const routeRef = routeExternalRefV01(
    "model_host_succession_route_profile",
    profile.route_profile_id,
    profile.evidence_class,
    profile.integrity.fingerprint,
  );
  const hostSession = routeExternalRefV01(
    "host_session",
    `session:${profile.route_role}:${request.run_id}`,
    profile.evidence_class,
  );
  const hostThread = routeExternalRefV01(
    "host_thread",
    `thread:${profile.route_role}:${request.run_id}`,
    profile.evidence_class,
  );
  const hostTurn = routeExternalRefV01(
    "host_turn",
    `turn:${profile.route_role}:${request.request_id}`,
    profile.evidence_class,
  );
  const providerThread = profile.provider_ref
    ? routeExternalRefV01(
        "provider_thread",
        `simulated-provider-thread:${profile.route_role}:${request.run_id}`,
        "simulated_route_contract",
      )
    : null;
  const hostRefs = [
    routeRef,
    cloneV01(profile.host_ref),
    hostSession,
    hostThread,
    hostTurn,
    ...(profile.provider_ref ? [cloneV01(profile.provider_ref)] : []),
    ...(profile.model_ref ? [cloneV01(profile.model_ref)] : []),
    ...(providerThread ? [providerThread] : []),
  ];
  const constrained =
    profile.route_role === "capability_constrained_simulation";
  return {
    result_version: NATIVE_HOST_RESULT_VERSION_V01,
    request_id: request.request_id,
    run_id: request.run_id,
    outcome,
    public_stop_reason: constrained
      ? "required_operation_unsupported_fallback_required"
      : outcome === "cancelled"
        ? "host_invocation_cancelled_before_execution"
        : null,
    started_at: observedAt,
    finished_at: observedAt,
    host_refs: hostRefs,
    adapter_version: profile.native_host_adapter_version,
    capability_version: profile.capability_version,
    changed_files: [],
    artifacts: [],
    observed_actions: [
      "received_exact_validated_task_context_packet",
      constrained
        ? "refused_unsupported_required_operation"
        : "returned_normalized_bounded_structured_result",
    ],
    commands: [],
    checks: [
      {
        check_id: "benchmark_packet_delivery",
        required: true,
        status: "passed",
        summary:
          "The benchmark adapter received the exact admitted Packet B through the managed product path.",
      },
    ],
    skipped_checks: request.packet.constraints.required_checks.map((checkId) => ({
      check_id: checkId,
      required: true,
      reason: constrained
        ? "The constrained capability contract marks this required operation unsupported; it was not executed."
        : "ACGC6A does not execute repository commands; route-contract compatibility leaves this check unobserved.",
    })),
    model_invocation_receipt_refs: [],
    summary: constrained
      ? "The constrained route delivered Packet B, preserved the hard gate, and settled fallback-required without executing unsupported work."
      : "The route delivered Packet B and returned one normalized bounded result without provider, model, network, or project-command execution.",
    uncertainty: [
      "Model quality, equal capability, usage, cost, and genuine latency remain unobserved.",
    ],
    gaps: [
      "The exact repository verification command was not executed.",
    ],
    proposed_next_steps: [
      constrained
        ? "The benchmark harness may explicitly evaluate a fresh fallback route after this arm settles."
        : "Review the bounded route-contract result without selecting or activating a route.",
    ],
    capability_coverage: profile.capability_coverage.map((row) => ({
      capability: row.operation_class,
      coverage: row.coverage === "supported" ? "observed" : "unsupported",
      source_ref: row.operation_class === "validated_packet_delivery"
        ? request.task_context_packet_ref
        : null,
      notes: [row.basis],
    })),
    adapter_extension: {
      extension_version: "model_host_succession_benchmark_extension.v0.1",
      adapter_kind: "benchmark_only_route_contract",
      bounded_metadata: {
        route_profile_id: profile.route_profile_id,
        route_profile_fingerprint: profile.integrity.fingerprint,
        evidence_class: profile.evidence_class,
        live_provider_invoked: false,
        real_provider_calls: 0,
        model_calls: 0,
        network_calls: 0,
        raw_provider_payload_included: false,
        automatic_fallback_used: false,
      },
    },
  };
}

function buildFallbackPlanV01(
  frozenCase: ReturnType<typeof buildFrozenCaseV01>,
  candidate: ModelHostSuccessionArmResultV01,
  predecessor: ModelHostSuccessionRouteProfileV01,
): ModelHostSuccessionFallbackPlanV01 {
  assert.equal(candidate.contract_status, "fallback_required");
  return buildModelHostSuccessionFallbackPlanV01({
    failed_arm_ref: {
      arm_id: candidate.arm_id,
      arm_fingerprint: candidate.integrity.fingerprint,
      settled_status: "fallback_required",
    },
    predecessor_route_ref: routeProfileRefV01(predecessor),
    frozen_case_ref: {
      frozen_case_id: frozenCase.frozen_case_id,
      frozen_case_fingerprint: frozenCase.integrity.fingerprint,
    },
    fallback_reason:
      "The constrained route cannot execute the frozen required repository verification operation.",
    fallback_trigger:
      "Execute only after the constrained arm has settled as fallback-required.",
    benchmark_harness_authorization: "explicit_harness_sequence_only",
    required_fresh_execution_identities: [
      "attachment",
      "browser_decision_session",
      "browser_start_grant",
      "controller",
      "database_scope",
      "host_session",
      "host_thread",
      "host_turn",
      "managed_run",
      "project_scope",
      "provider_thread_if_used",
      "repository_root",
      "start_request",
    ],
  });
}

function pairwiseDeltasV01(
  arms: ModelHostSuccessionArmResultV01[],
): ModelHostSuccessionPairwiseDeltaV01[] {
  const rows: ModelHostSuccessionPairwiseDeltaV01[] = [];
  for (let leftIndex = 0; leftIndex < arms.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < arms.length; rightIndex += 1) {
      const left = arms[leftIndex]!;
      const right = arms[rightIndex]!;
      const constrained = [left, right].some(
        (arm) => arm.contract_status === "fallback_required",
      );
      rows.push({
        left_route_role: left.route_profile_ref.route_role,
        right_route_role: right.route_profile_ref.route_role,
        dimension: "route_contract_status",
        relation: constrained ? "tradeoff" : "equal",
        left_value: left.contract_status,
        right_value: right.contract_status,
        basis: constrained
          ? "One exact constrained route preserved a narrower hard gate and required fallback; this is not a global route ranking."
          : "Both routes preserved normalized contracts in this deterministic exact case only.",
      });
      rows.push({
        left_route_role: left.route_profile_ref.route_role,
        right_route_role: right.route_profile_ref.route_role,
        dimension: "model_quality",
        relation: "unknown",
        left_value: null,
        right_value: null,
        basis: "No live provider or model execution occurred, so model quality is unobserved.",
      });
      rows.push({
        left_route_role: left.route_profile_ref.route_role,
        right_route_role: right.route_profile_ref.route_role,
        dimension: "capability_coverage",
        relation:
          left.supported_capability.length === right.supported_capability.length
            ? "not_comparable"
            : "tradeoff",
        left_value: left.supported_capability.length,
        right_value: right.supported_capability.length,
        basis:
          "Coverage counts describe explicit tested operation classes and do not establish capability equality or a winner.",
      });
    }
  }
  return rows;
}

function adrOwnerGapObservationsV01() {
  return [
    {
      question: "Can current code and configuration represent each tested route identity?",
      observation:
        "ExternalRef, NativeHostAdapter, execution-profile, capability-version, NativeHostResult, and RunReceipt owners can carry each tested identity for one invocation; no durable active route is created.",
      evidence_owner_refs: [
        "types/vnext/native-host-adapter.ts",
        "lib/vnext/runtime/direct-native-host-round-trip.ts",
        "types/vnext/run-receipt.ts",
      ],
      decision_deferred_to_acgc6b: true as const,
    },
    {
      question: "Can current code and configuration represent one explicit fallback target?",
      observation:
        "The pure benchmark route profile and fallback plan can bind an explicit target, but current production configuration has no active fallback pointer.",
      evidence_owner_refs: [
        "lib/vnext/model-host-succession-benchmark.ts",
        "lib/vnext/repository-execution/repository-managed-delegation.ts",
      ],
      decision_deferred_to_acgc6b: true as const,
    },
    {
      question: "Which exact existing owner would have to hold active route, revision, expiry, fallback, and rollback semantics?",
      observation:
        "No single current owner demonstrably holds that tuple. Model Gateway owns per-invocation selection and receipts, while project execution control owns bounded project control without provider or model fields; owner selection remains undecided.",
      evidence_owner_refs: [
        "lib/vnext/model-gateway/model-gateway.ts",
        "lib/vnext/persistence/project-execution-control-store.ts",
      ],
      decision_deferred_to_acgc6b: true as const,
    },
    {
      question: "Is a durable activation receipt demonstrably necessary?",
      observation:
        "No. ACGC6A observes no activation and cannot establish the necessity or schema of an activation receipt.",
      evidence_owner_refs: [
        "types/vnext/model-invocation-receipt.ts",
        "lib/vnext/model-gateway/model-invocation-receipt.ts",
      ],
      decision_deferred_to_acgc6b: true as const,
    },
    {
      question: "What backup, restore, portability, and package impact would active policy introduce?",
      observation:
        "Any durable active-policy owner would require separate migration, recovery, backup, restore, portable-project inclusion or exclusion, and packaged-runtime audits; ACGC6A changes none of those owners.",
      evidence_owner_refs: [
        "scripts/recovery-canonical-record-validator.ts",
        "lib/vnext/portability/portable-project.ts",
        "scripts/build-local-package.mjs",
      ],
      decision_deferred_to_acgc6b: true as const,
    },
    {
      question: "What remains unknown without a real provider cohort?",
      observation:
        "Model quality, provider reliability, capability equivalence, usage, monetary cost, genuine latency, retention behavior, and required human intervention remain unknown.",
      evidence_owner_refs: [
        "types/vnext/model-invocation-receipt.ts",
        "types/vnext/run-receipt.ts",
      ],
      decision_deferred_to_acgc6b: true as const,
    },
  ];
}

function grantBrowserDecisionV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: { request_fingerprint: string },
  now: string,
  secrets: VNextLocalOperatorSecretSourceV01,
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
  const credential = consumed.repository_decision_session.credential;
  const challenge = issueVNextRepositoryDecisionChallengeV01(db, {
    request_fingerprint: request.request_fingerprint,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    credential,
    clock: fixedClockV01(now),
  });
  return {
    session_id: credential.session_id,
    decision: grantRepositoryExecutionDecisionFromBrowserSessionV01(
      db,
      {
        request_fingerprint: request.request_fingerprint,
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        challenge_fingerprint: challenge.challenge_fingerprint,
        credential,
      },
      { now: () => now },
    ).decision,
  };
}

function createOperatorCredentialV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  now: string,
  secrets: VNextLocalOperatorSecretSourceV01,
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

function coverageV01(supported: string[], unsupported: string[]) {
  return [
    ...supported.map((operationClass) => ({
      operation_class: operationClass,
      coverage: "supported" as const,
      basis:
        operationClass === "validated_packet_delivery"
          ? "Observed through the exact managed request object."
          : "Represented by the normalized bounded result contract only.",
    })),
    ...unsupported.map((operationClass) => ({
      operation_class: operationClass,
      coverage: "unsupported" as const,
      basis: "The benchmark adapter does not execute this operation class.",
    })),
  ];
}

function routeExternalRefV01(
  refType: string,
  externalId: string,
  evidenceClass: string,
  sourceRef?: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: ROUTE_OBSERVED_AT,
    trust_class:
      evidenceClass === "observed_deterministic_execution"
        ? "direct_local_observation"
        : "derived_interpretation",
    ...(sourceRef ? { source_ref: sourceRef } : {}),
    compatibility_namespace: "model_host_succession_benchmark.v0.1",
  };
}

function openDatabaseV01(databasePath: string): Database.Database {
  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(db);
  return db;
}

async function waitForTerminalV01(
  db: Database.Database,
  runId: string,
): Promise<void> {
  for (let index = 0; index < 4_096; index += 1) {
    const run = readAutonomyRunLedgerRecord(runId, { db });
    if (run && [
      "completed", "failed", "blocked", "cancelled", "timed_out",
    ].includes(run.status)) return;
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  assert.fail(`ACGC6A arm did not settle: ${runId}`);
}

function assertNoCrossArmIdentityReuseV01(
  arms: ModelHostSuccessionArmResultV01[],
): void {
  const seen = new Map<string, ModelHostSuccessionRouteRoleV01>();
  for (const arm of arms) {
    for (const value of Object.values(arm.fresh_identity_proof)) {
      if (typeof value !== "string") continue;
      const previous = seen.get(value);
      assert.equal(
        previous,
        undefined,
        `identity reused by ${previous} and ${arm.route_profile_ref.route_role}`,
      );
      seen.set(value, arm.route_profile_ref.route_role);
    }
  }
}

function protectedSemanticStateV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
): string {
  const query = (table: string) => db.prepare(
    `SELECT * FROM ${table} ORDER BY 1, 2`,
  ).all();
  const coreCounts = db.prepare(
    `SELECT record_kind, COUNT(*) AS count
       FROM vnext_core_records
      WHERE workspace_id = ? AND project_id = ?
        AND record_kind IN ('task_context_packet', 'state_transition_receipt')
      GROUP BY record_kind
      ORDER BY record_kind`,
  ).all(config.workspace_id, config.project_id);
  return canonicalizeProtocolValueV01({
    semantic_state_entries: query("vnext_semantic_state_entries"),
    semantic_target_heads: query("vnext_semantic_target_heads"),
    protected_core_counts: coreCounts,
  });
}

function fixedClockV01(value: string) {
  return { now: () => value };
}

function gitV01(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
  }).trim();
}

function cloneV01<T>(value: T): T {
  return structuredClone(value);
}

export {
  ACGC6A_MERGED_STAGE5_BASELINE_COMMIT_V01,
  MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01,
};
