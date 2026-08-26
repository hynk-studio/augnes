#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { createDeterministicCodexAdapterV01 } from "../lib/vnext/native-host/deterministic-codex-adapter";
import {
  assertReconstructionConformanceReportV01,
  buildReconstructionConformanceReportV01,
  ReconstructionConformanceErrorV01,
} from "../lib/vnext/reconstruction-conformance";
import { readCodexProjectContinuityV01 } from "../lib/vnext/codex-current-continuity/codex-current-continuity";
import {
  exportActivePortableProjectV01,
  importPortableProjectV01,
} from "../lib/vnext/portability/portable-project";
import {
  normalizeLocalProjectRootRefV01,
  readCanonicalProjectWithRootV01,
  rebindCanonicalProjectLocalRootV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  insertVNextCoreRecordV01,
  listVNextCoreRecordsV01,
  readVNextCoreRecordV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import {
  admitProjectVerifyLifecycleProposalV01,
  materializeProjectVerifyRelationLifecycleProposalV01,
} from "../lib/vnext/persistence/project-verify-lifecycle-admission";
import { admitClaimEvidenceRelationV01 } from "../lib/vnext/persistence/project-verify-material-store";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "../lib/vnext/protocol-primitives";
import {
  buildTaskContextPacketV01,
  type TaskContextPacketBuilderInputV01,
} from "../lib/vnext/task-context-packet";
import {
  buildClaimEvidenceRelationV01,
  type ClaimEvidenceRelationBuilderInputV01,
} from "../lib/vnext/project-verify-material";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
  type ReviewDecisionBuilderInputV01,
} from "../lib/vnext/review-decision";
import { readProjectHomeDatabaseCompatibilityV01 } from "../lib/vnext/project-home/project-home-projection";
import { commitVNextSemanticTransitionWithOperatorPilotCapabilityInsideTransactionV01 } from "../lib/vnext/runtime/durable-semantic-transition";
import { runDirectNativeHostRoundTripV01 } from "../lib/vnext/runtime/direct-native-host-round-trip";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "../lib/vnext/runtime/local-operator-session";
import { readProjectVerifyLineageV01 } from "../lib/vnext/runtime/project-verify-lineage";
import { readProjectVerifyReconciliationV01 } from "../lib/vnext/runtime/project-verify-reconciliation";
import {
  projectVNextOperatorPilotContinuityV01,
  resolveVNextOperatorPilotPendingContextUseReviewV01,
} from "../lib/vnext/runtime/operator-pilot-project-continuity";
import type { LiveNativeHostRunProjectionV01 } from "../lib/vnext/runtime/live-native-host-run-service";
import type { VNextLocalOperatorPilotConfigV01 } from "../lib/vnext/runtime/local-operator-session";
import {
  compileTaskContextPacketFromPersistedSemanticStateInsideTransactionV01,
  resolveImmediatePersistedSemanticPriorPacketV01,
  VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
} from "../lib/vnext/runtime/persisted-semantic-context-compiler";
import { recordVNextOperatorPilotReviewDecisionV01 } from "../lib/vnext/runtime/operator-pilot-review-material";
import {
  confirmVNextOperatorPilotSemanticCommitV01,
  prepareVNextOperatorPilotSemanticCommitPreviewV01,
} from "../lib/vnext/runtime/operator-pilot-semantic-transition";
import {
  createVNextOperatorPilotReviewWindowCapabilityV01,
  readVNextOperatorPilotReviewWindowConfigV01,
} from "../lib/vnext/runtime/operator-pilot-review-window-config-v0-1";
import { CRITERION_VERIFICATION_EVALUATOR_VERSION_V01 } from "../types/vnext/criterion-verification-plan";
import type { PortableProjectV01 } from "../types/vnext/portable-project";
import type { EpisodeDeltaProposalV01 } from "../types/vnext/episode-delta-proposal";
import type { ClaimEvidenceRelationV01 } from "../types/vnext/project-verify-material";
import type { ReviewDecisionV01 } from "../types/vnext/review-decision";
import type { ProjectVerifyLineageV01 } from "../types/vnext/project-verify-lineage";
import type { ProjectVerifyReconciliationV01 } from "../types/vnext/project-verify-reconciliation";
import {
  RECONSTRUCTION_CONFORMANCE_PORTABLE_REBUILD_BINDING_VERSION_V01,
  type ReconstructionConformanceEnvironmentV01,
  type ReconstructionConformanceInputV01,
  type ReconstructionConformanceReportV01,
  type ReconstructionConformanceSourceBoundaryV01,
} from "../types/vnext/reconstruction-conformance";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import {
  installZeroNetworkGuard,
  ZERO_NETWORK_GUARD_METHODS,
} from "./test-harness-zero-network-guard.mjs";
import {
  buildVNextOperatorBrowserFixtureV01,
  type VNextOperatorBrowserFixtureManifestV01,
} from "./vnext-operator-browser-fixture-builder-v0-1";

const REFERENCE_AT = "2026-07-17T12:00:00.000Z";
const BOUNDARY_AT = "2026-07-17T13:00:00.000Z";
const OBSERVED_AT = "2026-07-17T13:30:00.000Z";
const REQUIRED_SOURCE_KINDS = [
  "task_context_packet",
  "run_receipt",
  "evidence_record",
  "claim_record",
  "claim_evidence_relation",
  "episode_delta_proposal",
  "review_decision",
  "semantic_commit_gate",
  "state_transition_receipt",
  "semantic_state",
] as const;
const RELATION_KINDS = [
  "supports",
  "opposes",
  "contradicts",
  "qualifies",
  "contextualizes",
] as const;
const assertions: string[] = [];
const tempRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-reconstruction-conformance-"),
);
const sourceFixtureRoot = path.join(tempRoot, "artifacts", "source-fixture");
const reconstructedRoot = path.join(tempRoot, "data", "reconstructed");
const sharedProjectRootBase = path.join(tempRoot, "repositories");
const sourceDbPath = path.join(sourceFixtureRoot, "operator-pilot.db");
const reconstructedDbPath = path.join(reconstructedRoot, "augnes.db");
const disposableEnvironment = {
  HOME: path.join(tempRoot, "home"),
  XDG_DATA_HOME: path.join(tempRoot, "data"),
  XDG_CONFIG_HOME: path.join(tempRoot, "config"),
  AUGNES_DATA_DIR: path.join(tempRoot, "data", "augnes"),
  AUGNES_RUNTIME_DIR: path.join(tempRoot, "runtime"),
  AUGNES_ARTIFACT_ROOT: path.join(tempRoot, "artifacts"),
  AUGNES_DB_PATH: path.join(tempRoot, "data", "ambient.db"),
};
const priorEnvironment = new Map(
  Object.keys(disposableEnvironment).map((key) => [key, process.env[key]]),
);
const network = installZeroNetworkGuard({
  allowLoopback: false,
  errorPrefix: "reconstruction_conformance_external_network_forbidden",
});

async function main(): Promise<void> {
  let source: Database.Database | null = null;
  let reconstructed: Database.Database | null = null;
  let completionSummary: Record<string, unknown> | null = null;
  try {
    for (const [key, value] of Object.entries(disposableEnvironment)) {
      mkdirSync(value.endsWith(".db") ? path.dirname(value) : value, {
        recursive: true,
        mode: 0o700,
      });
      process.env[key] = value;
    }
    mkdirSync(sourceFixtureRoot, { recursive: true, mode: 0o700 });
    mkdirSync(reconstructedRoot, { recursive: true, mode: 0o700 });
    mkdirSync(sharedProjectRootBase, { recursive: true, mode: 0o700 });

    const built = await buildVNextOperatorBrowserFixtureV01({
      output_directory: sourceFixtureRoot,
      reference_time: REFERENCE_AT,
    });
    assert.equal(built.status, "pass");
    assert.equal(built.provider_calls, 0);
    assert.equal(built.external_network_calls, 0);
    assert.equal(built.credential_material_included, false);
    assert.equal(built.private_absolute_path_in_manifest, false);
    assert.equal(built.default_database_accessed, false);
    assert.equal(built.ambient_database_observation, "absent_before_and_after");
    assert.deepEqual(built.network_guard_methods, ZERO_NETWORK_GUARD_METHODS);
    record("canonical_production_fixture_is_zero_provider_and_zero_network");

    const baseFixtureManifest = JSON.parse(
      readFileSync(
        path.join(sourceFixtureRoot, built.manifest_file),
        "utf8",
      ),
    ) as VNextOperatorBrowserFixtureManifestV01;
    source = new Database(sourceDbPath, { fileMustExist: true });
    source.pragma("foreign_keys = ON");
    touchRecentProjectV01(source, {
      workspace_id: baseFixtureManifest.workspace_id,
      project_id: baseFixtureManifest.project_id,
      now: rc1TimeV01(-1),
    });
    const sourceSelection = selectActiveProjectV01(source, {
      workspace_id: baseFixtureManifest.workspace_id,
      project_id: baseFixtureManifest.project_id,
      now: rc1TimeV01(-1),
      expected_project_id: null,
      expected_revision: null,
    });
    assert.equal(sourceSelection.selection_revision, 1);
    const augmentation = await augmentRc1SourceLifecycleV01(
      source,
      sourceDbPath,
      baseFixtureManifest,
    );
    const fixtureManifest = augmentation.manifest;
    assert.equal(augmentation.provider_calls, 0);
    assert.equal(augmentation.external_network_calls, 0);
    record("project_verify_lifecycle_uses_current_authenticated_writers_and_zero_model_later_use");

    const projectSegment = fixtureManifest.project_id.slice("project:".length);
    const exactRegisteredRoot = path.join(
      sharedProjectRootBase,
      projectSegment,
    );
    mkdirSync(exactRegisteredRoot, { mode: 0o700 });

    const baselineRootBinding = rebindCanonicalProjectLocalRootV01(
      source,
      {
        workspace_id: fixtureManifest.workspace_id,
        project_id: fixtureManifest.project_id,
        local_root: normalizeLocalProjectRootRefV01(exactRegisteredRoot, {
          base_path: path.parse(exactRegisteredRoot).root,
        }),
      },
      { now: () => BOUNDARY_AT },
    );
    assert.equal(baselineRootBinding.bound_at, BOUNDARY_AT);
    assert.equal(
      baselineRootBinding.local_root.normalized_path,
      exactRegisteredRoot,
    );
    assertProjectHomeCompatibilityV01(
      source,
      sourceDbPath,
      fixtureManifest,
    );
    verifyProjectHomeLifecycleLineageRefusalV01(
      source,
      sourceDbPath,
      fixtureManifest,
    );
    const baselineSelection = readActiveProjectSelectionV01(
      source,
      fixtureManifest.workspace_id,
    );
    assert(baselineSelection);
    assert.equal(baselineSelection.selection_revision, 1);

    const sourceBeforeRead = databaseFingerprintV01(sourceDbPath);
    source.pragma("query_only = ON");
    const baselineOwners = await readCurrentOwnersV01(
      source,
      sourceDbPath,
      exactRegisteredRoot,
      fixtureManifest,
    );
    const portableBaseline = exportActivePortableProjectV01(source, {
      include_personal_perspective: false,
      exported_at: BOUNDARY_AT,
    });
    assert.equal(databaseFingerprintV01(sourceDbPath), sourceBeforeRead);
    assert.equal(
      new TextDecoder().decode(portableBaseline.bytes).includes(tempRoot),
      false,
    );
    assert.equal(
      portableBaseline.package.manifest.exclusions.some((entry) =>
        entry.includes("raw_prompts_transcripts_reasoning")),
      true,
    );
    for (const kind of REQUIRED_SOURCE_KINDS) {
      assert.equal(
        portableBaseline.package.manifest.record_kinds.includes(kind),
        true,
        `portable source kind ${kind}`,
      );
    }
    verifyImmediatePriorResolutionV01(
      portableBaseline.package,
      fixtureManifest.packet_id,
      augmentation.immediate_prior_packet_ref,
    );
    record("baseline_current_owners_are_read_only_and_portable_boundary_is_canonical_only");

    const baselineRegistration = readCanonicalProjectWithRootV01(source, {
      workspace_id: fixtureManifest.workspace_id,
      project_id: fixtureManifest.project_id,
    });
    assert(baselineRegistration);
    const baselineEnvironment = environmentV01({
      boundary_portable: portableBaseline.package,
      observed_portable: portableBaseline.package,
      root_binding_fingerprint: fingerprintV01(
        baselineRegistration.root_binding,
      ),
      owners: baselineOwners,
      current_packet_id: fixtureManifest.packet_id,
      operator_provenance_state: "source_authenticated",
    });
    source.close();
    source = null;

    assert.deepEqual(readdirSync(exactRegisteredRoot), []);
    rmdirSync(exactRegisteredRoot);
    assert.equal(existsSync(exactRegisteredRoot), false);

    initializeDatabaseV01(reconstructedDbPath);
    reconstructed = new Database(reconstructedDbPath, { fileMustExist: true });
    reconstructed.pragma("foreign_keys = ON");
    const imported = importPortableProjectV01(reconstructed, {
      bytes: portableBaseline.bytes,
      destination_root_base: sharedProjectRootBase,
      imported_at: BOUNDARY_AT,
    });
    assert.equal(imported.status, "imported");
    assert.equal(imported.projection_reader_verification, "verified");
    assert.equal(imported.semantic_authority_created, false);
    assert.equal(imported.automation_authority_created, false);
    assert.equal(imported.external_action_created, false);
    assert.equal(existsSync(exactRegisteredRoot), true);
    assert.equal(
      readActiveProjectSelectionV01(
        reconstructed,
        fixtureManifest.workspace_id,
      )?.selection_revision,
      1,
    );

    const reconstructedBeforeRead = databaseFingerprintV01(reconstructedDbPath);
    reconstructed.pragma("query_only = ON");
    const reconstructedOwners = await readCurrentOwnersV01(
      reconstructed,
      reconstructedDbPath,
      exactRegisteredRoot,
      fixtureManifest,
    );
    assertProjectHomeCompatibilityV01(
      reconstructed,
      reconstructedDbPath,
      fixtureManifest,
    );
    const portableReconstructed = exportActivePortableProjectV01(reconstructed, {
      include_personal_perspective: false,
      exported_at: BOUNDARY_AT,
    });
    assert.equal(
      databaseFingerprintV01(reconstructedDbPath),
      reconstructedBeforeRead,
    );
    assert.deepEqual(
      portableReconstructed.package.records,
      portableBaseline.package.records,
    );
    assert.deepEqual(
      {
        workspace: portableReconstructed.package.manifest.workspace,
        project: portableReconstructed.package.manifest.project,
        record_kinds: portableReconstructed.package.manifest.record_kinds,
        record_counts: portableReconstructed.package.manifest.record_counts,
        record_count: portableReconstructed.package.manifest.record_count,
        exclusions: portableReconstructed.package.manifest.exclusions,
      },
      {
        workspace: portableBaseline.package.manifest.workspace,
        project: portableBaseline.package.manifest.project,
        record_kinds: portableBaseline.package.manifest.record_kinds,
        record_counts: portableBaseline.package.manifest.record_counts,
        record_count: portableBaseline.package.manifest.record_count,
        exclusions: portableBaseline.package.manifest.exclusions,
      },
    );
    assert.deepEqual(
      portableReconstructed.package.operator_provenance_sessions.map(
        (session) => ({ ...session, source_revoked_at: null }),
      ),
      portableBaseline.package.operator_provenance_sessions.map(
        (session) => ({ ...session, source_revoked_at: null }),
      ),
    );
    assert.equal(
      portableReconstructed.package.operator_provenance_sessions.every(
        (session) => session.source_revoked_at === BOUNDARY_AT,
      ),
      true,
    );
    const reconstructedRegistration = readCanonicalProjectWithRootV01(
      reconstructed,
      {
        workspace_id: fixtureManifest.workspace_id,
        project_id: fixtureManifest.project_id,
      },
    );
    assert(reconstructedRegistration);
    const reconstructedEnvironment = environmentV01({
      boundary_portable: portableBaseline.package,
      observed_portable: portableReconstructed.package,
      root_binding_fingerprint: fingerprintV01(
        reconstructedRegistration.root_binding,
      ),
      owners: reconstructedOwners,
      current_packet_id: fixtureManifest.packet_id,
      operator_provenance_state: "imported_inert",
    });
    record("fresh_database_import_rebuilds_source_equivalent_environment_and_current_owners");

    assert.deepEqual(
      reconstructedOwners.continuity,
      baselineOwners.continuity,
    );
    assert.deepEqual(
      reconstructedOwners.reconciliation,
      baselineOwners.reconciliation,
    );
    assert.deepEqual(
      reconstructedOwners.lineages,
      baselineOwners.lineages,
    );
    assert.deepEqual(
      reconstructedOwners.missing_lineage,
      baselineOwners.missing_lineage,
    );
    assert.deepEqual(
      reconstructedOwners.excluded_incomplete_lineages,
      baselineOwners.excluded_incomplete_lineages,
    );
    assert.equal(
      baselineOwners.excluded_incomplete_lineages.length > 0,
      true,
      "positive exact-lineage lane must classify every bounded or missing owner read outside conformance",
    );
    assertOwnerShapedLifecycleMatrixV01(baselineOwners);
    assertOwnerShapedLifecycleMatrixV01(reconstructedOwners);
    assert.equal(
      baselineOwners.feedback_state.status,
      "feedback_pending",
    );
    assertFeedbackOwnerBindingsV01(baselineEnvironment);
    assertFeedbackOwnerBindingsV01(reconstructedEnvironment);
    record("exact_current_continuity_reconciliation_linked_lineage_negative_space_and_feedback_pending_match");

    for (const [side, environment] of [
      ["baseline", baselineEnvironment],
      ["reconstructed", reconstructedEnvironment],
    ] as const) {
      assert.equal(
        environment.continuity.source_status,
        "exact",
        `${side} continuity ${JSON.stringify({
          snapshot: environment.continuity.snapshot.status,
          current_work: environment.continuity.current_work.status,
          currentness: environment.continuity.current_work.currentness,
          managed_execution: environment.continuity.managed_execution.stage,
          latest_result: environment.continuity.latest_result.state,
          result_currentness:
            environment.continuity.latest_result.currentness,
          review: environment.continuity.review_continuity.state,
          gaps: environment.continuity.gaps,
        })}`,
      );
      assert.equal(environment.continuity.snapshot.status, "exact");
    }

    const validInput: ReconstructionConformanceInputV01 = {
      baseline: baselineEnvironment,
      reconstructed: reconstructedEnvironment,
    };
    const validReport = buildReconstructionConformanceReportV01(validInput);
    assert.equal(
      validReport.exact_integrity.status,
      "conformant",
      JSON.stringify(
        validReport.exact_integrity.checks.filter(
          (check) => check.status !== "match",
        ),
      ),
    );
    assert.equal(validReport.relational_semantic.status, "conformant");
    assert.equal(validReport.relational_semantic.differences.length, 0);
    assert.deepEqual(validReport.relational_semantic.incomplete_reasons, []);
    assert.equal(
      validReport.exact_integrity.checks.every(
        (check) => check.status === "match" && check.non_compensable,
      ),
      true,
    );
    assert.equal(
      JSON.stringify(validReport).includes(tempRoot),
      false,
    );
    assertReconstructionConformanceReportV01(validReport, validInput);
    const parsedReport = JSON.parse(
      JSON.stringify(validReport),
    ) as ReconstructionConformanceReportV01;
    assert.deepEqual(
      assertReconstructionConformanceReportV01(parsedReport, validInput),
      validReport,
    );
    const replay = buildReconstructionConformanceReportV01(validInput);
    assert.deepEqual(replay, validReport);
    assert.equal(replay.integrity.fingerprint, validReport.integrity.fingerprint);
    record("valid_report_is_two_lane_bounded_safe_and_deterministically_replayable");

    verifySourceAndRuleDriftV01(validInput);
    verifyAuthorityFarSubstitutionsV01(validInput);
    verifyNegativeSpaceV01(
      validInput,
      baselineOwners.missing_lineage,
      reconstructedOwners.missing_lineage,
    );
    verifyRelationVocabularyV01(validReport);
    verifyCrossProjectRefusalV01(validInput);
    verifyReportTamperRefusalV01(validInput, validReport);

    assert.equal(network.attempts.length, 0);
    assert.equal(validReport.authority.calls_model_or_provider, false);
    assert.equal(
      validReport.authority.performs_network_or_external_action,
      false,
    );
    assert.equal(validReport.authority.durable_core_record_created, false);
    record("report_path_has_zero_provider_network_persistence_and_authority_effects");

    completionSummary = {
      status: "pass",
      contract: "reconstruction_conformance_test.v0.1",
      assertions,
      assertion_count: assertions.length,
      source_record_count:
        validReport.reconstruction_boundary.baseline_source_record_count,
      normalized_relation_count:
        validReport.relational_semantic.baseline_relations.length,
      excluded_incomplete_lineages:
        baselineOwners.excluded_incomplete_lineages.map((lineage) => ({
          lookup_kind: lineage.lookup.lookup_kind,
          stop_reason: lineage.stop.reason,
          completeness: lineage.completeness.status,
        })),
      report_fingerprint: validReport.integrity.fingerprint,
      provider_calls: 0,
      external_network_calls: network.attempts.length,
      owned_processes_started: 0,
      owned_listeners_started: 0,
      disposable_roots: [
        "home",
        "data",
        "config",
        "database",
        "project_repository",
        "runtime",
        "artifacts",
      ],
      cleanup: "complete",
    };
  } finally {
    source?.close();
    reconstructed?.close();
    network.restore();
    for (const [key, prior] of priorEnvironment) {
      if (prior === undefined) delete process.env[key];
      else process.env[key] = prior;
    }
    rmSync(tempRoot, { recursive: true, force: true });
  }
  assert.equal(existsSync(tempRoot), false);
  assert(completionSummary);
  console.log(JSON.stringify(completionSummary, null, 2));
}

interface Rc1SourceLifecycleAugmentationV01 {
  manifest: VNextOperatorBrowserFixtureManifestV01;
  immediate_prior_packet_ref: {
    packet_id: string;
    packet_fingerprint: string;
  };
  provider_calls: 0;
  external_network_calls: 0;
}

async function augmentRc1SourceLifecycleV01(
  db: Database.Database,
  databasePath: string,
  manifest: VNextOperatorBrowserFixtureManifestV01,
): Promise<Rc1SourceLifecycleAugmentationV01> {
  const config: VNextLocalOperatorPilotConfigV01 = {
    enabled: true,
    workspace_id: manifest.workspace_id,
    project_id: manifest.project_id,
    operator_id: manifest.operator_id,
    database_path: databasePath,
  };
  const sourcePacketRecord = readVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: manifest.packet_id,
    workspace_id: manifest.workspace_id,
    project_id: manifest.project_id,
  });
  assert(sourcePacketRecord);
  assert.equal(sourcePacketRecord.fingerprint, manifest.packet_fingerprint);
  let priorPacket = structuredClone(
    sourcePacketRecord.payload as TaskContextPacketV01,
  );

  const initialReconciliation = readProjectVerifyReconciliationV01(db, {
    workspace_id: manifest.workspace_id,
    project_id: manifest.project_id,
    observed_at: rc1TimeV01(0),
  });
  const sourceRelations = initialReconciliation.relation_families
    .flatMap((family) => family.revisions.map((revision) => revision.relation))
    .filter(
      (relation) =>
        relation.revision === 1 &&
        relation.operation_intent === "create" &&
        relation.relation_kind === "supports",
    )
    .sort((left, right) => left.relation_id.localeCompare(right.relation_id));
  assert.equal(
    sourceRelations.length >= 4,
    true,
    "RC1 fixture requires four independently source-authenticated relation families",
  );
  for (const [index, relationKind] of (
    ["opposes", "contradicts", "contextualizes"] as const
  ).entries()) {
    const relation = buildRelationVocabularyVariantV01(
      sourceRelations[0]!,
      relationKind,
      rc1TimeV01(0, index + 2),
    );
    assert.equal(
      admitClaimEvidenceRelationV01(db, {
        workspace_id: manifest.workspace_id,
        project_id: manifest.project_id,
        relation,
      }).status,
      "inserted",
    );
  }

  const secretSource = new Rc1DeterministicSecretSourceV01();
  const issued = issueVNextLocalOperatorBootstrapV01(db, {
    config,
    clock: fixedClockV01(rc1TimeV01(0)),
    secret_source: secretSource,
  });
  const consumed = consumeVNextLocalOperatorBootstrapV01(db, {
    config,
    bootstrap_token: issued.bootstrap_token,
    clock: fixedClockV01(rc1TimeV01(0, 1)),
    secret_source: secretSource,
  });
  let credential = consumed.credential;
  const reviewWindowConfig = readVNextOperatorPilotReviewWindowConfigV01({});
  const reviewWindowCapability =
    createVNextOperatorPilotReviewWindowCapabilityV01({
      config: reviewWindowConfig,
      workspace_id: manifest.workspace_id,
      project_id: manifest.project_id,
    });

  const decideLifecycle = (input: {
    relation: ClaimEvidenceRelationV01;
    decision: "accept" | "reject" | "defer" | "supersede" | "retract";
    material_minute: number;
    decision_minute: number;
    preview_minute?: number;
    confirm_minute?: number;
    commit_minute?: number;
    compile_minute?: number;
  }): {
    transition_receipt_id: string | null;
    transition_receipt_fingerprint: string | null;
  } => {
    const material = materializeProjectVerifyRelationLifecycleProposalV01(db, {
      workspace_id: manifest.workspace_id,
      project_id: manifest.project_id,
      relation_id: input.relation.relation_id,
      observed_at: rc1TimeV01(input.material_minute),
    });
    const admitted = admitProjectVerifyLifecycleProposalV01(db, material);
    assert.equal(admitted.status, "inserted");
    const candidate = admitted.proposal.proposed_deltas[0];
    assert(candidate);
    const decisionResult = recordVNextOperatorPilotReviewDecisionV01(db, {
      config,
      credential,
      request: {
        proposal_id: admitted.proposal.proposal_id,
        proposal_fingerprint: admitted.proposal.integrity.fingerprint,
        candidate_id: candidate.candidate_id,
        candidate_fingerprint:
          createEpisodeDeltaCandidateFingerprintV01(candidate),
        decision: input.decision,
        rationale_summary:
          `Disposable RC1 fixture records one exact ${input.decision} judgment without granting authority beyond this isolated database.`,
        ...(input.decision === "defer"
          ? {
              revisit: {
                condition_summary:
                  "Review again only if exact bounded source material changes.",
              },
            }
          : {}),
      },
      clock: fixedClockV01(rc1TimeV01(input.decision_minute)),
      secret_source: secretSource,
    });
    assert.equal(decisionResult.status, "inserted");
    assert.equal(decisionResult.decision.decision, input.decision);
    credential = credentialFromCookieV01(decisionResult.session_cookie.value);
    if (input.decision === "reject" || input.decision === "defer") {
      return {
        transition_receipt_id: null,
        transition_receipt_fingerprint: null,
      };
    }

    assert.notEqual(input.preview_minute, undefined);
    assert.notEqual(input.confirm_minute, undefined);
    assert.notEqual(input.commit_minute, undefined);
    assert.notEqual(input.compile_minute, undefined);
    const binding = {
      proposal_id: admitted.proposal.proposal_id,
      proposal_fingerprint: admitted.proposal.integrity.fingerprint,
      decision_id: decisionResult.decision.decision_id,
      decision_fingerprint: decisionResult.decision.integrity.fingerprint,
    };
    const preview = prepareVNextOperatorPilotSemanticCommitPreviewV01(db, {
      config,
      credential,
      request: binding,
      review_window_config: reviewWindowConfig,
      clock: sequenceClockV01([
        rc1TimeV01(input.preview_minute!),
        rc1TimeV01(input.preview_minute!, 1),
      ]),
    });
    const authorization = confirmVNextOperatorPilotSemanticCommitV01(db, {
      config,
      credential,
      preview_binding_cookie: preview.preview_binding_cookie,
      request: {
        ...binding,
        confirmation_digest: preview.preview.confirmation_digest,
      },
      review_window_config: reviewWindowConfig,
      clock: fixedClockV01(rc1TimeV01(input.confirm_minute!)),
      secret_source: secretSource,
    });
    assert.equal(authorization.status, "inserted");
    assert.equal(authorization.state_applied, false);
    credential = credentialFromCookieV01(
      authorization.session_admission.cookie_value,
    );

    db.exec("BEGIN IMMEDIATE");
    try {
      const committed =
        commitVNextSemanticTransitionWithOperatorPilotCapabilityInsideTransactionV01(
          db,
          {
            workspace_id: manifest.workspace_id,
            project_id: manifest.project_id,
            ...binding,
            gate_record_id: authorization.gate_record.gate_record_id,
            gate_record_fingerprint:
              authorization.gate_record.integrity.fingerprint,
            review_window_capability: reviewWindowCapability,
            clock: sequenceClockV01([
              rc1TimeV01(input.commit_minute!),
              rc1TimeV01(input.commit_minute!, 1),
            ]),
          },
        );
      assert.equal(committed.status, "applied");
      const compiled =
        compileTaskContextPacketFromPersistedSemanticStateInsideTransactionV01(
          db,
          {
            workspace_id: manifest.workspace_id,
            project_id: manifest.project_id,
            prior_packet: priorPacket,
            transition_receipt_id:
              committed.transition_receipt.transition_receipt_id,
            transition_receipt_fingerprint:
              committed.transition_receipt.integrity.fingerprint,
            expiry_policy: { mode: "explicit", expires_at: null },
            clock: fixedClockV01(rc1TimeV01(input.compile_minute!)),
          },
        );
      assert.equal(compiled.status, "inserted");
      assert.equal(compiled.full_chain_relation.status, "valid");
      priorPacket = compiled.later_packet;
      db.exec("COMMIT");
      return {
        transition_receipt_id:
          committed.transition_receipt.transition_receipt_id,
        transition_receipt_fingerprint:
          committed.transition_receipt.integrity.fingerprint,
      };
    } catch (error) {
      if (db.inTransaction) db.exec("ROLLBACK");
      throw error;
    }
  };

  decideLifecycle({
    relation: sourceRelations[1]!,
    decision: "reject",
    material_minute: 1,
    decision_minute: 2,
  });
  decideLifecycle({
    relation: sourceRelations[2]!,
    decision: "defer",
    material_minute: 3,
    decision_minute: 4,
  });
  decideLifecycle({
    relation: sourceRelations[3]!,
    decision: "accept",
    material_minute: 11,
    decision_minute: 12,
    preview_minute: 13,
    confirm_minute: 14,
    commit_minute: 15,
    compile_minute: 16,
  });

  const supersedingRelation = buildRelationRevisionV01(
    sourceRelations[3]!,
    "supersede",
    rc1TimeV01(17),
  );
  assert.equal(
    admitClaimEvidenceRelationV01(db, {
      workspace_id: manifest.workspace_id,
      project_id: manifest.project_id,
      relation: supersedingRelation,
    }).status,
    "inserted",
  );
  decideLifecycle({
    relation: supersedingRelation,
    decision: "supersede",
    material_minute: 18,
    decision_minute: 19,
    preview_minute: 20,
    confirm_minute: 21,
    commit_minute: 22,
    compile_minute: 23,
  });

  const retractingRelation = buildRelationRevisionV01(
    supersedingRelation,
    "retract",
    rc1TimeV01(24),
  );
  assert.equal(
    admitClaimEvidenceRelationV01(db, {
      workspace_id: manifest.workspace_id,
      project_id: manifest.project_id,
      relation: retractingRelation,
    }).status,
    "inserted",
  );
  decideLifecycle({
    relation: retractingRelation,
    decision: "retract",
    material_minute: 25,
    decision_minute: 26,
    preview_minute: 27,
    confirm_minute: 28,
    commit_minute: 29,
    compile_minute: 30,
  });

  const immediatePriorPacketRef = {
    packet_id: priorPacket.packet_id,
    packet_fingerprint: priorPacket.integrity.fingerprint,
  };
  const finalTransition = decideLifecycle({
    relation: sourceRelations[0]!,
    decision: "accept",
    material_minute: 31,
    decision_minute: 32,
    preview_minute: 33,
    confirm_minute: 34,
    commit_minute: 35,
    compile_minute: 36,
  });
  assert(finalTransition.transition_receipt_id);
  assert(finalTransition.transition_receipt_fingerprint);

  const networkAttemptsBefore = network.attempts.length;
  const adapter = createDeterministicCodexAdapterV01({
    now: () => rc1TimeV01(37),
  });
  assert.equal(adapter.provider_egress, "forbidden");
  const laterUse = await runDirectNativeHostRoundTripV01(
    db,
    { config, mode: "interactive" },
    {
      adapter,
      now: () => rc1TimeV01(37),
    },
  );
  assert.equal(laterUse.status, "inserted");
  assert.equal(laterUse.receipt.task_context_packet_ref?.external_id, priorPacket.packet_id);
  assert.equal(
    laterUse.receipt.task_context_packet_ref?.source_ref,
    priorPacket.integrity.fingerprint,
  );
  assert.deepEqual(laterUse.receipt.model_invocations, []);
  assert.equal(network.attempts.length, networkAttemptsBefore);

  return {
    manifest: {
      ...manifest,
      packet_id: priorPacket.packet_id,
      packet_fingerprint: priorPacket.integrity.fingerprint,
      transition_receipt_id: finalTransition.transition_receipt_id,
      transition_receipt_fingerprint:
        finalTransition.transition_receipt_fingerprint,
    },
    immediate_prior_packet_ref: immediatePriorPacketRef,
    provider_calls: 0,
    external_network_calls: 0,
  };
}

function buildRelationRevisionV01(
  prior: ClaimEvidenceRelationV01,
  operation: "supersede" | "retract",
  createdAt: string,
): ClaimEvidenceRelationV01 {
  const priorRef = {
    record_kind: "claim_evidence_relation" as const,
    record_id: prior.relation_id,
    record_fingerprint: prior.integrity.fingerprint,
  };
  const input: ClaimEvidenceRelationBuilderInputV01 = {
    family_origin: {
      origin_namespace: prior.family_origin.origin_namespace,
      origin_seed: prior.family_origin.origin_seed,
      origin_profile: prior.family_origin.origin_profile,
      origin_producer_kind: prior.family_origin.origin_producer_kind,
    },
    workspace_id: prior.workspace_id,
    project_id: prior.project_id,
    revision: prior.revision + 1,
    prior_relation_ref: priorRef,
    operation_intent: operation,
    supersedes_relation_ref: operation === "supersede" ? priorRef : null,
    claim_ref: structuredClone(prior.claim_ref),
    evidence_ref: structuredClone(prior.evidence_ref),
    relation_kind:
      operation === "supersede" ? "qualifies" : prior.relation_kind,
    applicability_scope: structuredClone(prior.applicability_scope),
    basis: prior.basis,
    trust_class: prior.trust_class,
    source_refs: structuredClone(prior.source_refs),
    limitations: [
      ...prior.limitations,
      `This disposable RC1 ${operation} revision exists only to verify preserved negative lifecycle space.`,
    ],
    uncertainty: structuredClone(prior.uncertainty),
    producer: {
      producer_kind: "local_adapter",
      producer_profile: "reconstruction_conformance_fixture_revision.v0.1",
    },
    created_at: createdAt,
  };
  return buildClaimEvidenceRelationV01(input);
}

function buildRelationVocabularyVariantV01(
  source: ClaimEvidenceRelationV01,
  relationKind: "opposes" | "contradicts" | "contextualizes",
  createdAt: string,
): ClaimEvidenceRelationV01 {
  const producer = {
    producer_kind: "local_adapter" as const,
    producer_profile:
      "reconstruction_conformance_relation_vocabulary.v0.1",
  };
  return buildClaimEvidenceRelationV01({
    family_origin: {
      origin_namespace:
        "reconstruction_conformance_relation_vocabulary.v0.1",
      origin_seed: `${relationKind}:${source.relation_id}`,
      origin_profile: producer.producer_profile,
      origin_producer_kind: producer.producer_kind,
    },
    workspace_id: source.workspace_id,
    project_id: source.project_id,
    revision: 1,
    prior_relation_ref: null,
    operation_intent: "create",
    supersedes_relation_ref: null,
    claim_ref: structuredClone(source.claim_ref),
    evidence_ref: structuredClone(source.evidence_ref),
    relation_kind: relationKind,
    applicability_scope: structuredClone(source.applicability_scope),
    basis: source.basis,
    trust_class: source.trust_class,
    source_refs: structuredClone(source.source_refs),
    limitations: [
      `This disposable RC1 ${relationKind} relation exists only to verify source-owned relational vocabulary reconstruction.`,
    ],
    uncertainty: [
      "The relation remains candidate material and does not establish Claim truth.",
    ],
    producer,
    created_at: createdAt,
  });
}

class Rc1DeterministicSecretSourceV01
  implements VNextLocalOperatorSecretSourceV01
{
  private sequence = 1;

  bytes(size: number): Uint8Array {
    const seed = createHash("sha256")
      .update(`reconstruction-conformance-secret:${this.sequence}`)
      .digest();
    this.sequence += 1;
    return Uint8Array.from(
      { length: size },
      (_, index) => seed[index % seed.byteLength]!,
    );
  }
}

function credentialFromCookieV01(
  cookieValue: string,
): VNextLocalOperatorSessionCredentialV01 {
  return readVNextLocalOperatorCredentialFromRequestV01(
    new Request("http://127.0.0.1/api/vnext/operator/semantic-review", {
      headers: {
        cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${cookieValue}`,
      },
    }),
  );
}

function fixedClockV01(value: string) {
  return { now: () => value };
}

function sequenceClockV01(values: string[]) {
  let index = 0;
  return {
    now: () => values[Math.min(index++, values.length - 1)]!,
  };
}

function rc1TimeV01(minuteOffset: number, secondOffset = 0): string {
  return new Date(
    Date.parse(REFERENCE_AT) + minuteOffset * 60_000 + secondOffset * 1_000,
  ).toISOString();
}

function assertProjectHomeCompatibilityV01(
  db: Database.Database,
  databasePath: string,
  manifest: VNextOperatorBrowserFixtureManifestV01,
): void {
  const observedAt = projectHomeCompatibilityObservedAtV01(db, manifest);
  assert.deepEqual(
    readProjectHomeDatabaseCompatibilityV01(
      db,
      {
        workspace_id: manifest.workspace_id,
        project_id: manifest.project_id,
      },
      {
        now: () => observedAt,
        operator_config: {
          enabled: true,
          workspace_id: manifest.workspace_id,
          project_id: manifest.project_id,
          operator_id: manifest.operator_id,
          database_path: databasePath,
        },
      },
    ),
    {
      workspace_id: manifest.workspace_id,
      project_id: manifest.project_id,
      read_compatible: true,
      projection_only: true,
    },
  );
}

function verifyProjectHomeLifecycleLineageRefusalV01(
  db: Database.Database,
  databasePath: string,
  manifest: VNextOperatorBrowserFixtureManifestV01,
): void {
  const scope = {
    workspace_id: manifest.workspace_id,
    project_id: manifest.project_id,
  };
  const observedAt = projectHomeCompatibilityObservedAtV01(db, manifest);
  const proposals = listVNextCoreRecordsV01(db, {
    ...scope,
    record_kinds: ["episode_delta_proposal"],
    limit: 256,
  }).map((record) => record.payload as EpisodeDeltaProposalV01);
  const decisions = listVNextCoreRecordsV01(db, {
    ...scope,
    record_kinds: ["review_decision"],
    limit: 256,
  }).map((record) => record.payload as ReviewDecisionV01);
  const proposal = proposals.find(
    (candidate) =>
      candidate.project_verify_lifecycle?.lifecycle_binding
        .selected_record_operation_intent === "retract" &&
      candidate.project_verify_lifecycle.lifecycle_binding
        .selected_record_revision > 1,
  );
  assert(proposal);
  const currentLifecycle = proposal.project_verify_lifecycle;
  assert(currentLifecycle);
  const applying = decisions.find(
    (decision) =>
      decision.source_proposal.proposal_id === proposal.proposal_id &&
      decision.decision === "retract",
  );
  assert(applying);
  const exactPriorBinding = applying.lineage.prior_decisions[0];
  assert(exactPriorBinding);
  const exactPrior = decisions.find(
    (decision) => decision.decision_id === exactPriorBinding.decision_id,
  );
  assert(exactPrior);
  const currentFamilyId = currentLifecycle.lifecycle_binding.family_id;
  const unrelatedPrior = decisions
    .filter(
      (decision) => {
        const sourceProposal = proposals.find(
          (candidate) =>
            candidate.proposal_id === decision.source_proposal.proposal_id,
        );
        const sourceFamilyId =
          sourceProposal?.project_verify_lifecycle?.lifecycle_binding.family_id;
        return (
          sourceFamilyId !== undefined &&
          sourceFamilyId !== currentFamilyId &&
          decision.decided_at <= applying.decided_at
        );
      },
    )
    .sort((left, right) => left.decided_at.localeCompare(right.decided_at))[0];
  assert(unrelatedPrior);
  const unrelatedProposal = proposals.find(
    (candidate) =>
      candidate.proposal_id === unrelatedPrior.source_proposal.proposal_id,
  );
  assert(unrelatedProposal?.project_verify_lifecycle);
  assert.notEqual(
    unrelatedProposal.project_verify_lifecycle.lifecycle_binding.family_id,
    currentFamilyId,
  );

  const sameProposalReject = rebuildReviewDecisionV01(applying, {
    decision: "reject",
    rationale_summary:
      "Disposable RC1 negative records a same-proposal rejection that must never substitute for the exact applied prior Transition.",
    revisit: null,
    requested_transition_intent: null,
    lineage: {
      prior_decisions: [],
      superseding_candidate: null,
      retracted_decision: null,
    },
  });
  const sameProposalBinding = {
    decision_id: sameProposalReject.decision_id,
    decision_fingerprint: sameProposalReject.integrity.fingerprint,
  };
  const noGenericFallback = rebuildReviewDecisionV01(applying, {
    lineage: {
      prior_decisions: [sameProposalBinding],
      superseding_candidate: null,
      retracted_decision: sameProposalBinding,
    },
  });
  const unrelatedBinding = {
    decision_id: unrelatedPrior.decision_id,
    decision_fingerprint: unrelatedPrior.integrity.fingerprint,
  };
  const unrelatedFamily = rebuildReviewDecisionV01(applying, {
    lineage: {
      prior_decisions: [unrelatedBinding],
      superseding_candidate: null,
      retracted_decision: unrelatedBinding,
    },
  });
  const wrongFingerprintBinding = {
    decision_id: exactPrior.decision_id,
    decision_fingerprint: `sha256:${"0".repeat(64)}`,
  };
  assert.notEqual(
    wrongFingerprintBinding.decision_fingerprint,
    exactPrior.integrity.fingerprint,
  );
  const wrongFingerprint = rebuildReviewDecisionV01(applying, {
    lineage: {
      prior_decisions: [wrongFingerprintBinding],
      superseding_candidate: null,
      retracted_decision: wrongFingerprintBinding,
    },
  });

  const scenarios = [
    {
      name: "no_generic_fallback",
      prerequisites: [sameProposalReject],
      decision: noGenericFallback,
    },
    {
      name: "unrelated_family",
      prerequisites: [],
      decision: unrelatedFamily,
    },
    {
      name: "wrong_fingerprint",
      prerequisites: [],
      decision: wrongFingerprint,
    },
  ] as const;
  for (const scenario of scenarios) {
    const savepoint = `rc1_project_home_${scenario.name}`;
    db.exec(`SAVEPOINT ${savepoint}`);
    try {
      for (const decision of scenario.prerequisites) {
        insertReviewDecisionV01(db, decision);
      }
      insertReviewDecisionV01(db, scenario.decision);
      assert.throws(
        () =>
          readProjectHomeDatabaseCompatibilityV01(db, scope, {
            now: () => observedAt,
            operator_config: {
              enabled: true,
              ...scope,
              operator_id: manifest.operator_id,
              database_path: databasePath,
            },
          }),
        /project_home_decision_lineage_invalid/,
        scenario.name,
      );
    } finally {
      db.exec(`ROLLBACK TO ${savepoint}`);
      db.exec(`RELEASE ${savepoint}`);
    }
  }
  assertProjectHomeCompatibilityV01(db, databasePath, manifest);
  record("project_home_lifecycle_lineage_reuses_exact_source_and_refuses_spoofs");
}

function projectHomeCompatibilityObservedAtV01(
  db: Database.Database,
  manifest: VNextOperatorBrowserFixtureManifestV01,
): string {
  const latestPacket = listVNextCoreRecordsV01(db, {
    workspace_id: manifest.workspace_id,
    project_id: manifest.project_id,
    record_kinds: ["task_context_packet"],
    limit: 1,
  })[0];
  assert(latestPacket);
  return latestPacket.created_at;
}

function rebuildReviewDecisionV01(
  decision: ReviewDecisionV01,
  overrides: Partial<ReviewDecisionBuilderInputV01>,
): ReviewDecisionV01 {
  const rebuilt = buildReviewDecisionV01({
    workspace_id: decision.workspace_id,
    project_id: decision.project_id,
    source_proposal: structuredClone(decision.source_proposal),
    candidate: structuredClone(decision.candidate),
    decision: decision.decision,
    actor_ref: structuredClone(decision.actor_ref),
    authorization_basis_refs: structuredClone(
      decision.authorization_basis_refs,
    ),
    decision_basis_material_ids: [...decision.decision_basis_material_ids],
    decision_basis_refs: structuredClone(decision.decision_basis_refs),
    rationale_summary: decision.rationale_summary,
    decided_at: decision.decided_at,
    revisit: structuredClone(decision.revisit),
    requested_transition_intent: structuredClone(
      decision.requested_transition_intent,
    ),
    lineage: structuredClone(decision.lineage),
    compatibility: structuredClone(decision.compatibility),
    authority_notes: [...decision.authority_summary.notes],
    ...structuredClone(overrides),
  });
  assert.equal(validateReviewDecisionV01(rebuilt).status, "valid");
  return rebuilt;
}

function insertReviewDecisionV01(
  db: Database.Database,
  decision: ReviewDecisionV01,
): void {
  const proposalRecord = readVNextCoreRecordV01(db, {
    record_kind: "episode_delta_proposal",
    record_id: decision.source_proposal.proposal_id,
    workspace_id: decision.workspace_id,
    project_id: decision.project_id,
  });
  assert(proposalRecord);
  assert.equal(
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(
      decision,
      proposalRecord.payload as EpisodeDeltaProposalV01,
    ).status,
    "valid",
  );
  insertVNextCoreRecordV01(db, {
    record_kind: "review_decision",
    record_id: decision.decision_id,
    workspace_id: decision.workspace_id,
    project_id: decision.project_id,
    fingerprint: decision.integrity.fingerprint,
    idempotency_key: null,
    payload: decision,
    created_at: decision.decided_at,
  });
}

interface CurrentOwnersV01 {
  continuity: Awaited<ReturnType<typeof readCodexProjectContinuityV01>>;
  reconciliation: ProjectVerifyReconciliationV01;
  lineages: ProjectVerifyLineageV01[];
  excluded_incomplete_lineages: ProjectVerifyLineageV01[];
  feedback_state: ReconstructionConformanceEnvironmentV01["feedback_state"];
  missing_lineage: ProjectVerifyLineageV01;
  managed_run_projection_reads: number;
}

async function readCurrentOwnersV01(
  db: Database.Database,
  databasePath: string,
  exactRoot: string,
  manifest: VNextOperatorBrowserFixtureManifestV01,
): Promise<CurrentOwnersV01> {
  const config: VNextLocalOperatorPilotConfigV01 = {
    enabled: true,
    workspace_id: manifest.workspace_id,
    project_id: manifest.project_id,
    operator_id: manifest.operator_id,
    database_path: databasePath,
  };
  let managedRunProjectionReads = 0;
  const continuity = await readCodexProjectContinuityV01(
    db,
    { project_id: manifest.project_id, generated_at: OBSERVED_AT },
    {
      managed_start_available: () => true,
      read_root_availability: async (root) =>
        root === exactRoot ? "available" : "inspection_error",
      read_operator_config: () => config,
      read_live_projection: () => {
        managedRunProjectionReads += 1;
        return {
          workspace_id: manifest.workspace_id,
          project_id: manifest.project_id,
          projection: idleLiveProjectionV01(),
        };
      },
    },
  );
  assert.equal(
    managedRunProjectionReads,
    0,
    "portable reconstruction must not consult managed-run projection state",
  );
  const reconciliation = readProjectVerifyReconciliationV01(db, {
    workspace_id: manifest.workspace_id,
    project_id: manifest.project_id,
    observed_at: OBSERVED_AT,
  });
  const lookups: Parameters<typeof readProjectVerifyLineageV01>[1]["lookup"][] = [];
  const criterion = reconciliation.criteria[0];
  assert(criterion);
  lookups.push({
    lookup_kind: "criterion",
    criterion_id: criterion.criterion.criterion_id,
    packet_ref: criterion.packet_ref,
    receipt_ref: criterion.receipt_ref,
  });
  const appliedRelationFamily = reconciliation.relation_families.find(
    (family) => family.applied_current_head_ref !== null,
  );
  assert(appliedRelationFamily);
  const claimRef = appliedRelationFamily.claim_ref;
  lookups.push({
    lookup_kind: "claim",
    claim_id: claimRef.record_id,
    expected_fingerprint: claimRef.record_fingerprint,
  });
  const relationRef = appliedRelationFamily.applied_current_head_ref;
  assert(relationRef);
  lookups.push({
    lookup_kind: "claim_evidence_relation",
    relation_id: relationRef.record_id,
    expected_fingerprint: relationRef.record_fingerprint,
  });
  const lifecycleLookups = reconciliation.relation_families.flatMap((family) =>
    family.revisions
      .filter(
        (revision) =>
          revision.lifecycle.decision.status === "rejected" ||
          revision.lifecycle.decision.status === "deferred" ||
          revision.lifecycle.application.status === "applied_superseded" ||
          revision.lifecycle.application.status === "applied_retracted",
      )
      .map((revision) => ({
        lookup_kind: "claim_evidence_relation" as const,
        relation_id: revision.relation_ref.record_id,
        expected_fingerprint: revision.relation_ref.record_fingerprint,
      })),
  );
  const seenRelationIds = new Set([relationRef.record_id]);
  for (const lookup of lifecycleLookups) {
    if (seenRelationIds.has(lookup.relation_id)) continue;
    seenRelationIds.add(lookup.relation_id);
    lookups.push(lookup);
  }
  const operatorContinuity = projectVNextOperatorPilotContinuityV01(db, {
    config,
    clock: { now: () => OBSERVED_AT },
  });
  const pendingFeedback = resolveVNextOperatorPilotPendingContextUseReviewV01(
    db,
    { config, continuity: operatorContinuity },
  );
  assert(pendingFeedback);
  const missingLineage = readProjectVerifyLineageV01(db, {
    workspace_id: manifest.workspace_id,
    project_id: manifest.project_id,
    observed_at: OBSERVED_AT,
    lookup: {
      lookup_kind: "claim_evidence_relation",
      relation_id: "relation:acgc-rc1-source-missing",
      expected_fingerprint: null,
    },
  });
  assert.deepEqual(missingLineage.nodes, []);
  assert.deepEqual(missingLineage.edges, []);
  assert.equal(missingLineage.stop.reason, "source_missing");
  const projectedLineages = lookups.map((lookup) =>
    readProjectVerifyLineageV01(db, {
      workspace_id: manifest.workspace_id,
      project_id: manifest.project_id,
      observed_at: OBSERVED_AT,
      lookup,
    }),
  );
  const incompleteLineage = (lineage: ProjectVerifyLineageV01) =>
    ["partial", "bounded_incomplete"].includes(
      lineage.completeness.status,
    ) ||
    ["source_missing", "bounded_incomplete"].includes(lineage.stop.reason);
  const excludedIncompleteLineages = projectedLineages.filter(incompleteLineage);
  const exactLineages = projectedLineages.filter(
    (lineage) => !incompleteLineage(lineage),
  );
  assert.equal(
    exactLineages.some(
      (lineage) =>
        lineage.nodes.some(
          (node) => node.node_kind === "state_transition_receipt_effect",
        ) &&
        lineage.nodes.some(
          (node) => node.node_kind === "later_task_context_packet",
        ),
    ),
    true,
    "positive lane requires one exact applied-transition lineage",
  );
  return {
    continuity,
    reconciliation,
    lineages: exactLineages,
    excluded_incomplete_lineages: excludedIncompleteLineages,
    feedback_state: {
      status: "feedback_pending",
      ...pendingFeedback,
    },
    missing_lineage: missingLineage,
    managed_run_projection_reads: managedRunProjectionReads,
  };
}

function environmentV01(input: {
  boundary_portable: PortableProjectV01;
  observed_portable: PortableProjectV01;
  root_binding_fingerprint: string;
  owners: CurrentOwnersV01;
  current_packet_id: string;
  operator_provenance_state: "source_authenticated" | "imported_inert";
}): ReconstructionConformanceEnvironmentV01 {
  return {
    source_boundary: sourceBoundaryV01(
      input.boundary_portable,
      input.observed_portable,
      input.root_binding_fingerprint,
      input.current_packet_id,
    ),
    decision_time_cutoff: OBSERVED_AT,
    environmental_observation: {
      root_availability: "available",
      operator_config_available: true,
      managed_start_available: true,
      managed_run_projection_reads: input.owners.managed_run_projection_reads,
      operator_provenance_state: input.operator_provenance_state,
    },
    current_packet: currentPacketV01(
      input.observed_portable,
      input.current_packet_id,
    ),
    continuity: input.owners.continuity,
    reconciliation: input.owners.reconciliation,
    lineages: input.owners.lineages,
    feedback_state: input.owners.feedback_state,
  };
}

function currentPacketV01(
  portable: PortableProjectV01,
  currentPacketId: string,
): TaskContextPacketV01 {
  const currentPacket = portable.records.find(
    (record) =>
      record.record_kind === "task_context_packet" &&
      record.record_id === currentPacketId,
  );
  assert(currentPacket);
  return structuredClone(currentPacket.payload as TaskContextPacketV01);
}

function verifyImmediatePriorResolutionV01(
  portable: PortableProjectV01,
  currentPacketId: string,
  expectedPrior: { packet_id: string; packet_fingerprint: string },
): void {
  const packet = currentPacketV01(portable, currentPacketId);
  const priorPackets = portable.records
    .filter(
      (record) =>
        record.record_kind === "task_context_packet" &&
        record.record_id !== currentPacketId,
    )
    .map((record) => structuredClone(record.payload as TaskContextPacketV01));
  const resolved = resolveImmediatePersistedSemanticPriorPacketV01({
    packet,
    prior_packets: priorPackets,
  });
  assert.equal(resolved.status, "resolved");
  assert(resolved.prior_packet);
  assert.deepEqual(
    {
      packet_id: resolved.prior_packet.packet_id,
      packet_fingerprint: resolved.prior_packet.integrity.fingerprint,
    },
    expectedPrior,
  );

  assert.equal(
    resolveImmediatePersistedSemanticPriorPacketV01({
      packet,
      prior_packets: [],
    }).status,
    "ambiguous",
  );
  assert.equal(
    resolveImmediatePersistedSemanticPriorPacketV01({
      packet,
      prior_packets: [resolved.prior_packet, resolved.prior_packet],
    }).status,
    "ambiguous",
  );

  const crossProject = structuredClone(resolved.prior_packet);
  crossProject.project_id = `${packet.project_id}:cross-project`;
  assert.equal(
    resolveImmediatePersistedSemanticPriorPacketV01({
      packet,
      prior_packets: [crossProject],
    }).status,
    "ambiguous",
  );
  assert.equal(
    resolveImmediatePersistedSemanticPriorPacketV01({
      packet,
      prior_packets: [packet],
    }).status,
    "ambiguous",
  );

  const selfReferential = structuredClone(resolved.prior_packet);
  const selfRef = packet.compatibility.source_refs.find(
    (ref) =>
      ref.ref_type === "task_context_packet" &&
      ref.external_id === selfReferential.packet_id &&
      ref.source_ref === selfReferential.integrity.fingerprint &&
      ref.compatibility_namespace ===
        VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
  );
  assert(selfRef);
  selfReferential.compatibility.source_refs.push(structuredClone(selfRef));
  assert.equal(
    resolveImmediatePersistedSemanticPriorPacketV01({
      packet,
      prior_packets: [selfReferential],
    }).status,
    "ambiguous",
  );
  record("immediate_prior_resolution_is_unique_scope_bound_and_cycle_refusing");
}

function sourceBoundaryV01(
  boundaryPortable: PortableProjectV01,
  observedPortable: PortableProjectV01,
  rootBindingFingerprint: string,
  currentPacketId: string,
): ReconstructionConformanceSourceBoundaryV01 {
  const currentPacket = observedPortable.records.find(
    (record) =>
      record.record_kind === "task_context_packet" &&
      record.record_id === currentPacketId,
  );
  assert(currentPacket);
  const packet = currentPacket.payload as TaskContextPacketV01;
  const workId = typeof packet.work_ref === "string"
    ? packet.work_ref
    : packet.work_ref?.external_id ?? null;
  assert(workId);
  return {
    portable_contract: boundaryPortable.contract,
    portable_contract_version: boundaryPortable.contract_version,
    reconstruction_input_content_fingerprint:
      boundaryPortable.manifest.content_fingerprint,
    reconstruction_input_integrity_fingerprint:
      boundaryPortable.integrity.fingerprint,
    workspace_id: boundaryPortable.manifest.workspace.workspace_id,
    project_id: boundaryPortable.manifest.project.project_id,
    work_id: workId,
    current_packet_ref: {
      record_kind: currentPacket.record_kind,
      record_id: currentPacket.record_id,
      record_fingerprint: currentPacket.fingerprint,
    },
    root_binding_fingerprint: rootBindingFingerprint,
    portable_rebuild_binding_version:
      RECONSTRUCTION_CONFORMANCE_PORTABLE_REBUILD_BINDING_VERSION_V01,
    criterion_evaluator_version:
      CRITERION_VERIFICATION_EVALUATOR_VERSION_V01,
    semantic_context_compiler_version:
      VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
    source_records: observedPortable.records.map((record) => ({
      record_kind: record.record_kind,
      record_id: record.record_id,
      record_fingerprint: record.fingerprint,
    })),
  };
}

function assertFeedbackOwnerBindingsV01(
  environment: ReconstructionConformanceEnvironmentV01,
): void {
  const feedback = environment.feedback_state;
  assert.equal(feedback.status, "feedback_pending");
  const expectedSourceRefs = [
    [
      "run_receipt",
      feedback.later_run_receipt_id,
      feedback.later_run_receipt_fingerprint,
    ],
    ["task_context_packet", feedback.packet_id, feedback.packet_fingerprint],
    [
      "state_transition_receipt",
      feedback.transition_receipt_id,
      feedback.transition_receipt_fingerprint,
    ],
    [
      "episode_delta_proposal",
      feedback.proposal_id,
      feedback.proposal_fingerprint,
    ],
  ] as const;
  for (const [recordKind, recordId, recordFingerprint] of expectedSourceRefs) {
    assert(
      environment.source_boundary.source_records.some(
        (record) =>
          record.record_kind === recordKind &&
          record.record_id === recordId &&
          record.record_fingerprint === recordFingerprint,
      ),
      `feedback source binding missing: ${recordKind}:${recordId}`,
    );
  }
  assert(
    environment.reconciliation.later_context.some(
      (later) =>
        later.status === "packet_compiled_feedback_pending" &&
        later.context_use_review_ref === null &&
        later.source_transition_receipt_ref.record_id ===
          feedback.transition_receipt_id &&
        later.source_transition_receipt_ref.record_fingerprint ===
          feedback.transition_receipt_fingerprint &&
        later.later_packet_ref?.record_id === feedback.packet_id &&
        later.later_packet_ref.record_fingerprint ===
          feedback.packet_fingerprint,
    ),
    `feedback reconciliation binding missing: ${JSON.stringify({
      feedback,
      later_context: environment.reconciliation.later_context,
    })}`,
  );
}

function assertOwnerShapedLifecycleMatrixV01(owners: CurrentOwnersV01): void {
  const appliedFamily = owners.reconciliation.relation_families.find(
    (family) => family.applied_current_head_ref !== null,
  );
  assert(appliedFamily?.applied_current_head_ref);
  const appliedLineage = owners.lineages.find(
    (lineage) =>
      lineage.lookup.lookup_kind === "claim_evidence_relation" &&
      lineage.lookup.relation_id ===
        appliedFamily.applied_current_head_ref?.record_id,
  );
  assert(appliedLineage);
  const nodeKinds = new Set(
    appliedLineage.nodes.map((node) => node.node_kind),
  );
  for (const nodeKind of [
    "criterion",
    "criterion_relation_residue",
    "evidence_record",
    "claim_record",
    "claim_evidence_relation",
    "episode_delta_proposal_candidate",
    "review_decision",
    "semantic_commit_gate",
    "state_transition_receipt_effect",
    "semantic_state",
    "semantic_target_head",
    "later_task_context_packet",
  ] as const) {
    assert.equal(nodeKinds.has(nodeKind), true, `linked node ${nodeKind}`);
  }
  const edgeKinds = new Set(
    appliedLineage.edges.map((edge) => edge.edge_kind),
  );
  for (const edgeKind of [
    "criterion_has_exact_residue",
    "residue_materialized_as_evidence",
    "evidence_related_to_claim",
    "claim_or_relation_selected_by_candidate",
    "candidate_reviewed_by_decision",
    "decision_authorized_by_gate",
    "gate_applied_by_transition",
    "transition_wrote_semantic_state",
    "transition_updated_target_head",
    "semantic_state_compiled_into_later_packet",
  ] as const) {
    assert.equal(edgeKinds.has(edgeKind), true, `linked edge ${edgeKind}`);
  }
  assert.equal(appliedLineage.stop.reason, "later_packet_feedback_pending");

  const decisionStatuses = new Set(
    owners.reconciliation.relation_families.flatMap((family) =>
      family.revisions.map((revision) => revision.lifecycle.decision.status),
    ),
  );
  assert.equal(decisionStatuses.has("rejected"), true);
  assert.equal(decisionStatuses.has("deferred"), true);
  const applicationStatuses = new Set(
    owners.reconciliation.relation_families.flatMap((family) =>
      family.revisions.map((revision) => revision.lifecycle.application.status),
    ),
  );
  assert.equal(applicationStatuses.has("applied_current"), true);
  assert.equal(applicationStatuses.has("applied_superseded"), true);
  assert.equal(applicationStatuses.has("applied_retracted"), true);
  const lineageStatuses = new Set(
    owners.lineages.flatMap((lineage) =>
      lineage.nodes.map((node) => node.status),
    ),
  );
  for (const status of ["rejected", "deferred"] as const) {
    assert.equal(lineageStatuses.has(status), true, `owner status ${status}`);
  }
}

function verifySourceAndRuleDriftV01(
  validInput: ReconstructionConformanceInputV01,
): void {
  const sourceDrift = cloneInputV01(validInput);
  sourceDrift.reconstructed.source_boundary.source_records[0]!.record_fingerprint =
    fingerprintV01("source-drift");
  const sourceDriftReport = buildReconstructionConformanceReportV01(sourceDrift);
  assert.equal(sourceDriftReport.exact_integrity.status, "non_conformant");
  assert.equal(sourceDriftReport.relational_semantic.status, "conformant");
  assert.deepEqual(
    sourceDriftReport.exact_integrity.checks
      .filter((check) => check.status === "mismatch")
      .map((check) => check.check),
    [
      "canonical_source_record_manifest",
      "rc1_fixture_source_presence_and_current_owner_bindings",
    ],
  );

  const sourceInconsistent = cloneInputV01(validInput);
  for (const environment of [
    sourceInconsistent.baseline,
    sourceInconsistent.reconstructed,
  ]) {
    const relation =
      environment.reconciliation.relation_families[0]?.revisions[0]?.relation;
    assert(relation);
    relation.relation_kind =
      relation.relation_kind === "supports" ? "opposes" : "supports";
    refingerprintReconciliationV01(environment.reconciliation);
  }
  const sourceInconsistentReport =
    buildReconstructionConformanceReportV01(sourceInconsistent);
  assert.equal(
    sourceInconsistentReport.exact_integrity.status,
    "non_conformant",
  );
  assert.equal(
    sourceInconsistentReport.relational_semantic.status,
    "conformant",
  );
  assert.equal(
    sourceInconsistentReport.exact_integrity.checks.some(
      (check) =>
        check.check ===
          "rc1_fixture_source_presence_and_current_owner_bindings" &&
        check.status === "mismatch" &&
        check.non_compensable,
    ),
    true,
  );
  record("embedded_source_integrity_failure_is_non_compensable");

  const cutoffDrift = cloneInputV01(validInput);
  const later = "2026-07-17T13:00:01.000Z";
  cutoffDrift.reconstructed.decision_time_cutoff = later;
  cutoffDrift.reconstructed.continuity.generated_at = later;
  cutoffDrift.reconstructed.reconciliation.observed_at = later;
  refingerprintReconciliationV01(cutoffDrift.reconstructed.reconciliation);
  for (const lineage of cutoffDrift.reconstructed.lineages) {
    lineage.observed_at = later;
    refingerprintLineageV01(lineage);
  }
  assert.equal(
    buildReconstructionConformanceReportV01(cutoffDrift).exact_integrity.status,
    "non_conformant",
  );

  const ruleDrift = cloneInputV01(validInput);
  ruleDrift.reconstructed.source_boundary.portable_rebuild_binding_version =
    "reconstruction_conformance_portable_rebuild_binding.v0.2";
  assert.equal(
    buildReconstructionConformanceReportV01(ruleDrift).exact_integrity.status,
    "non_conformant",
  );

  const evaluatorDrift = cloneInputV01(validInput);
  evaluatorDrift.reconstructed.source_boundary.criterion_evaluator_version =
    "criterion_exact_check_evaluator.v0.2";
  assert.equal(
    buildReconstructionConformanceReportV01(evaluatorDrift).exact_integrity.status,
    "non_conformant",
  );
  record("source_cutoff_rebuild_rule_and_evaluator_drift_are_non_compensable");
}

function verifyAuthorityFarSubstitutionsV01(
  validInput: ReconstructionConformanceInputV01,
): void {
  const decisionForTransition = cloneInputV01(validInput);
  const decisionRef =
    decisionForTransition.reconstructed.source_boundary.source_records.find(
      (record) => record.record_kind === "review_decision",
    );
  assert(decisionRef);
  decisionForTransition.reconstructed.feedback_state.transition_receipt_id =
    decisionRef.record_id;
  decisionForTransition.reconstructed.feedback_state.transition_receipt_fingerprint =
    decisionRef.record_fingerprint;
  const decisionSubstitution = buildReconstructionConformanceReportV01(
    decisionForTransition,
  );
  assert.equal(decisionSubstitution.exact_integrity.status, "non_conformant");
  assert.equal(
    decisionSubstitution.relational_semantic.status,
    "non_conformant",
  );

  const candidateForCurrent = cloneInputV01(validInput);
  const family = candidateForCurrent.reconstructed.reconciliation.claim_families
    .find((candidate) => candidate.latest_recorded_candidate_ref !== null);
  assert(family);
  family.applied_current_head_ref = structuredClone(
    family.latest_recorded_candidate_ref,
  );
  const revision = family.revisions.find(
    (candidate) =>
      candidate.claim_ref.record_id ===
      family.latest_recorded_candidate_ref?.record_id,
  );
  assert(revision);
  revision.lifecycle.application.status = "applied_current";
  revision.lifecycle.application.current_family_head = true;
  refingerprintReconciliationV01(
    candidateForCurrent.reconstructed.reconciliation,
  );
  const candidateSubstitution = buildReconstructionConformanceReportV01(
    candidateForCurrent,
  );
  assert.equal(
    candidateSubstitution.relational_semantic.status,
    "non_conformant",
  );

  const authorityDrift = cloneInputV01(validInput);
  (authorityDrift.reconstructed.continuity.authority as unknown as {
    calls_provider: boolean;
  }).calls_provider = true;
  const authorityReport = buildReconstructionConformanceReportV01(authorityDrift);
  assert.equal(authorityReport.exact_integrity.status, "non_conformant");
  assert.equal(
    authorityReport.exact_integrity.checks.find(
      (check) => check.check === "read_only_authority_and_forbidden_effects",
    )?.status,
    "mismatch",
  );
  record("decision_transition_candidate_current_and_authority_substitutions_fail_closed");
}

function verifyNegativeSpaceV01(
  validInput: ReconstructionConformanceInputV01,
  baselineMissing: ProjectVerifyLineageV01,
  reconstructedMissing: ProjectVerifyLineageV01,
): void {
  const validReport = buildReconstructionConformanceReportV01(validInput);
  assert.equal(validReport.exact_integrity.status, "conformant");
  assert.equal(validReport.relational_semantic.status, "conformant");
  const sourceRelations = validReport.relational_semantic.baseline_relations.filter(
    (relation) => relation.relation_kind.startsWith("source_"),
  );
  for (const status of ["rejected", "deferred"] as const) {
    assert.equal(
      sourceRelations.some((relation) => relation.dimensions.decision === status),
      true,
      `owner decision ${status}`,
    );
    assert.equal(
      validReport.relational_semantic.baseline_relations.some(
        (relation) =>
          relation.relation_kind === "lineage_node" &&
          relation.dimensions.status === status,
      ),
      true,
      `owner lineage ${status}`,
    );
  }
  for (const status of [
    "applied_superseded",
    "applied_retracted",
  ] as const) {
    assert.equal(
      sourceRelations.some(
        (relation) => relation.dimensions.application === status,
      ),
      true,
      `owner application ${status}`,
    );
  }
  assert.equal(
    validInput.baseline.lineages.some(
      (lineage) =>
        lineage.stop.reason === "review_rejected" &&
        lineage.nodes.some((node) => node.status === "rejected"),
    ),
    true,
  );
  assert.equal(
    validInput.baseline.lineages.some(
      (lineage) =>
        lineage.stop.reason === "review_deferred" &&
        lineage.nodes.some((node) => node.status === "deferred"),
    ),
    true,
  );
  for (const status of ["rejected", "deferred"] as const) {
    const revived = cloneInputV01(validInput);
    const revision = revived.reconstructed.reconciliation.relation_families
      .flatMap((family) => family.revisions)
      .find((candidate) => candidate.lifecycle.decision.status === status);
    assert(revision);
    revision.lifecycle.decision.status = "accepted";
    refingerprintReconciliationV01(revived.reconstructed.reconciliation);
    const report = buildReconstructionConformanceReportV01(revived);
    assert.equal(report.exact_integrity.status, "non_conformant");
    assert.equal(report.relational_semantic.status, "non_conformant");
  }
  for (const status of [
    "applied_superseded",
    "applied_retracted",
  ] as const) {
    const revived = cloneInputV01(validInput);
    const family = revived.reconstructed.reconciliation.relation_families.find(
      (candidate) =>
        candidate.revisions.some(
          (revision) => revision.lifecycle.application.status === status,
        ),
    );
    assert(family);
    const revision = family.revisions.find(
      (candidate) => candidate.lifecycle.application.status === status,
    );
    assert(revision);
    family.applied_current_head_ref = structuredClone(revision.relation_ref);
    revision.lifecycle.application.status = "applied_current";
    revision.lifecycle.application.current_family_head = true;
    refingerprintReconciliationV01(revived.reconstructed.reconciliation);
    const report = buildReconstructionConformanceReportV01(revived);
    assert.equal(report.exact_integrity.status, "non_conformant");
    assert.equal(report.relational_semantic.status, "non_conformant");
  }

  const missingPreserved = cloneInputV01(validInput);
  missingPreserved.baseline.lineages.push(structuredClone(baselineMissing));
  missingPreserved.reconstructed.lineages.push(
    structuredClone(reconstructedMissing),
  );
  const missingReport = buildReconstructionConformanceReportV01(
    missingPreserved,
  );
  assert.equal(missingReport.exact_integrity.status, "incomplete");
  assert.equal(missingReport.relational_semantic.status, "incomplete");
  assert.deepEqual(missingReport.relational_semantic.differences, []);
  assert.equal(
    missingReport.relational_semantic.incomplete_reasons.filter((reason) =>
      reason.includes("lineage_source_missing"),
    ).length,
    2,
  );
  const missingInferred = cloneInputV01(missingPreserved);
  const presentLineage = validInput.reconstructed.lineages.find(
    (lineage) => lineage.nodes.length > 0,
  );
  assert(presentLineage);
  const inferred = structuredClone(presentLineage);
  inferred.lookup = structuredClone(reconstructedMissing.lookup);
  inferred.observed_at = reconstructedMissing.observed_at;
  refingerprintLineageV01(inferred);
  missingInferred.reconstructed.lineages[
    missingInferred.reconstructed.lineages.length - 1
  ] = inferred;
  const inferredReport = buildReconstructionConformanceReportV01(
    missingInferred,
  );
  assert.equal(inferredReport.exact_integrity.status, "non_conformant");
  assert.equal(inferredReport.relational_semantic.status, "non_conformant");

  const stalePreserved = cloneInputV01(validInput);
  for (const environment of [
    stalePreserved.baseline,
    stalePreserved.reconstructed,
  ]) {
    environment.continuity.current_work.status = "stale_current_work";
    environment.continuity.current_work.currentness = "stale";
    environment.continuity.current_work.start_eligible = false;
    environment.continuity.current_work.start_blocker =
      "Current work is stale.";
  }
  const staleReport = buildReconstructionConformanceReportV01(stalePreserved);
  assert.equal(staleReport.exact_integrity.status, "conformant");
  assert.equal(staleReport.relational_semantic.status, "conformant");
  const stalePromoted = cloneInputV01(stalePreserved);
  stalePromoted.reconstructed.continuity.current_work.status = "current_work";
  stalePromoted.reconstructed.continuity.current_work.currentness = "fresh";
  stalePromoted.reconstructed.continuity.current_work.start_eligible = true;
  stalePromoted.reconstructed.continuity.current_work.start_blocker = null;
  const stalePromotedReport = buildReconstructionConformanceReportV01(
    stalePromoted,
  );
  assert.equal(stalePromotedReport.exact_integrity.status, "non_conformant");
  assert.equal(
    stalePromotedReport.relational_semantic.status,
    "non_conformant",
  );

  const unknownPreserved = cloneInputV01(validInput);
  for (const environment of [
    unknownPreserved.baseline,
    unknownPreserved.reconstructed,
  ]) {
    const criterion = environment.reconciliation.criteria[0]?.criterion;
    assert(criterion);
    criterion.status = "unknown";
    criterion.basis = "insufficient";
    refingerprintReconciliationV01(environment.reconciliation);
  }
  const unknownReport = buildReconstructionConformanceReportV01(
    unknownPreserved,
  );
  assert.equal(unknownReport.exact_integrity.status, "conformant");
  assert.equal(unknownReport.relational_semantic.status, "conformant");
  const unknownPromoted = cloneInputV01(unknownPreserved);
  const promotedCriterion =
    unknownPromoted.reconstructed.reconciliation.criteria[0]?.criterion;
  assert(promotedCriterion);
  promotedCriterion.status = "satisfied";
  promotedCriterion.basis = "observed";
  refingerprintReconciliationV01(
    unknownPromoted.reconstructed.reconciliation,
  );
  const unknownPromotedReport = buildReconstructionConformanceReportV01(
    unknownPromoted,
  );
  assert.equal(unknownPromotedReport.exact_integrity.status, "non_conformant");
  assert.equal(
    unknownPromotedReport.relational_semantic.status,
    "non_conformant",
  );

  const baselineRetired = validInput.baseline.current_packet.excluded_context.find(
    (entry) => entry.entry_id.startsWith("retracted-state:"),
  );
  const reconstructedRetired =
    validInput.reconstructed.current_packet.excluded_context.find(
      (entry) => entry.entry_id === baselineRetired?.entry_id,
    );
  assert(baselineRetired && reconstructedRetired);
  assert.equal(
    validInput.baseline.current_packet.selected_context.some(
      (entry) => entry.entry_id === baselineRetired.entry_id,
    ),
    false,
  );
  assert.equal(
    validReport.relational_semantic.baseline_relations.some(
      (relation) =>
        relation.relation_kind === "packet_excluded_context" &&
        relation.identity === baselineRetired.entry_id,
    ),
    true,
  );
  const retiredRevived = cloneInputV01(validInput);
  const retired = retiredRevived.reconstructed.current_packet.excluded_context.find(
    (entry) => entry.entry_id === baselineRetired.entry_id,
  );
  assert(retired);
  const rebuiltPacket = rebuildPacketWithRetiredSelectionV01(
    retiredRevived.reconstructed.current_packet,
    retired,
  );
  retiredRevived.reconstructed.current_packet = rebuiltPacket;
  retiredRevived.reconstructed.source_boundary.current_packet_ref = {
    record_kind: "task_context_packet",
    record_id: rebuiltPacket.packet_id,
    record_fingerprint: rebuiltPacket.integrity.fingerprint,
  };
  retiredRevived.reconstructed.source_boundary.source_records.push({
    record_kind: "task_context_packet",
    record_id: rebuiltPacket.packet_id,
    record_fingerprint: rebuiltPacket.integrity.fingerprint,
  });
  const retiredReport = buildReconstructionConformanceReportV01(retiredRevived);
  assert.equal(retiredReport.exact_integrity.status, "non_conformant");
  assert.equal(retiredReport.relational_semantic.status, "non_conformant");
  assert.equal(
    retiredReport.relational_semantic.differences.some(
      (difference) =>
        difference.difference_kind === "missing_from_reconstruction" &&
        difference.relation.relation_kind === "packet_excluded_context" &&
        difference.relation.identity === baselineRetired.entry_id,
    ),
    true,
  );
  assert.equal(
    retiredReport.relational_semantic.differences.some(
      (difference) =>
        difference.difference_kind === "added_by_reconstruction" &&
        difference.relation.relation_kind === "packet_selected_context" &&
        difference.relation.identity === baselineRetired.entry_id,
    ),
    true,
  );
  record("owner_rejection_deferral_supersession_retraction_staleness_missing_unknown_and_retirement_are_preserved");
}

function rebuildPacketWithRetiredSelectionV01(
  packet: TaskContextPacketV01,
  retired: TaskContextPacketV01["excluded_context"][number],
): TaskContextPacketV01 {
  const {
    packet_version: _packetVersion,
    packet_id: _packetId,
    authority_summary: authoritySummary,
    integrity: _integrity,
    ...input
  } = packet;
  return buildTaskContextPacketV01({
    ...input,
    selected_context: [
      ...packet.selected_context,
      {
        entry_id: retired.entry_id,
        entry_kind: "accepted_state_ref",
        source_ref: retired.source_ref,
        external_ref: structuredClone(retired.external_ref),
        why_included:
          "Adversarial conformance input reintroduces retired material as current.",
        currentness: structuredClone(retired.currentness),
        trust_class:
          retired.external_ref?.trust_class ?? "derived_interpretation",
        compatibility_source_ref: structuredClone(retired.external_ref),
        bounded_summary: "Retired material incorrectly presented as current.",
      },
    ],
    excluded_context: packet.excluded_context.filter(
      (entry) => entry.entry_id !== retired.entry_id,
    ),
    authority_notes: [...authoritySummary.notes],
  } satisfies TaskContextPacketBuilderInputV01);
}

function verifyRelationVocabularyV01(
  validReport: ReconstructionConformanceReportV01,
): void {
  for (const relationKind of RELATION_KINDS) {
    for (const relations of [
      validReport.relational_semantic.baseline_relations,
      validReport.relational_semantic.reconstructed_relations,
    ]) {
      assert.equal(
        relations.some(
        (relation) => relation.relation_kind === `source_${relationKind}`,
        ),
        true,
      );
    }
  }
  record("support_opposition_contradiction_qualification_and_contextualization_are_normalized");
}

function verifyCrossProjectRefusalV01(
  validInput: ReconstructionConformanceInputV01,
): void {
  const crossProject = cloneInputV01(validInput);
  const crossProjectId = "project:33333333-3333-4333-8333-333333333333";
  const reconstructed = crossProject.reconstructed;
  reconstructed.source_boundary.project_id = crossProjectId;
  const packet = rebuildPacketForProjectV01(
    reconstructed.current_packet,
    crossProjectId,
  );
  reconstructed.current_packet = packet;
  reconstructed.source_boundary.current_packet_ref = {
    record_kind: "task_context_packet",
    record_id: packet.packet_id,
    record_fingerprint: packet.integrity.fingerprint,
  };
  reconstructed.source_boundary.source_records.push({
    record_kind: "task_context_packet",
    record_id: packet.packet_id,
    record_fingerprint: packet.integrity.fingerprint,
  });
  reconstructed.reconciliation.project_id = crossProjectId;
  refingerprintReconciliationV01(reconstructed.reconciliation);
  for (const lineage of reconstructed.lineages) {
    lineage.project_id = crossProjectId;
    for (const node of lineage.nodes) node.project_id = crossProjectId;
    refingerprintLineageV01(lineage);
  }
  assert.throws(
    () => buildReconstructionConformanceReportV01(crossProject),
    (error: unknown) =>
      error instanceof ReconstructionConformanceErrorV01 &&
      error.code === "reconstruction_cross_project_refused",
  );
  record("cross_project_material_is_refused_before_comparison");
}

function rebuildPacketForProjectV01(
  packet: TaskContextPacketV01,
  projectId: string,
): TaskContextPacketV01 {
  const {
    packet_version: _packetVersion,
    packet_id: _packetId,
    authority_summary: authoritySummary,
    integrity: _integrity,
    ...input
  } = packet;
  return buildTaskContextPacketV01({
    ...input,
    project_id: projectId,
    authority_notes: [...authoritySummary.notes],
  } satisfies TaskContextPacketBuilderInputV01);
}

function verifyReportTamperRefusalV01(
  validInput: ReconstructionConformanceInputV01,
  validReport: ReconstructionConformanceReportV01,
): void {
  const unsafeOutput = cloneInputV01(validInput);
  for (const environment of [
    unsafeOutput.baseline,
    unsafeOutput.reconstructed,
  ]) {
    const criterion = environment.reconciliation.criteria[0]?.criterion;
    assert(criterion);
    criterion.criterion_id = "/Users/rc1-private-output-should-not-cross";
    refingerprintReconciliationV01(environment.reconciliation);
  }
  assert.throws(
    () => buildReconstructionConformanceReportV01(unsafeOutput),
    (error: unknown) =>
      error instanceof ReconstructionConformanceErrorV01 &&
      error.code === "reconstruction_conformance_report_safe_output_invalid",
  );
  record("report_builder_refuses_private_path_shaped_output");

  const tampered = structuredClone(validReport);
  tampered.exact_integrity.status = "non_conformant";
  const { integrity: _integrity, ...withoutIntegrity } = tampered;
  tampered.integrity.fingerprint = fingerprintV01(withoutIntegrity);
  assert.throws(
    () => assertReconstructionConformanceReportV01(tampered, validInput),
    (error: unknown) =>
      error instanceof ReconstructionConformanceErrorV01 &&
      error.code === "reconstruction_conformance_report_derived_material_invalid",
  );
  record("resealed_derived_report_tampering_is_refused_against_exact_sources");
}

function refingerprintReconciliationV01(
  projection: ProjectVerifyReconciliationV01,
): void {
  const { projection_fingerprint: _fingerprint, ...withoutFingerprint } =
    projection;
  projection.projection_fingerprint = fingerprintV01(withoutFingerprint);
}

function refingerprintLineageV01(projection: ProjectVerifyLineageV01): void {
  const { projection_fingerprint: _fingerprint, ...withoutFingerprint } =
    projection;
  projection.projection_fingerprint = fingerprintV01(withoutFingerprint);
}

function cloneInputV01(
  input: ReconstructionConformanceInputV01,
): ReconstructionConformanceInputV01 {
  return structuredClone(input);
}

function idleLiveProjectionV01(): LiveNativeHostRunProjectionV01 {
  return {
    service_version: "live_native_host_run_service.v0.1",
    status: "idle",
    run_ref: null,
    mode: null,
    control_revision: 0,
    reconciliation_required: false,
    public_reason: null,
    capability: {
      status: "not_checked",
      adapter_version: null,
      capability_version: null,
      cli_version: null,
      public_reason: null,
    },
    pending_approval: null,
    receipt: null,
    packet_copy_actions: 0,
    handoff_paste_actions: 0,
    result_paste_actions: 0,
    internal_id_entry_actions: 0,
    semantic_authority_granted: false,
  };
}

function initializeDatabaseV01(databasePath: string): void {
  mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  const db = new Database(databasePath);
  try {
    db.pragma("journal_mode = DELETE");
    db.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(db);
  } finally {
    db.close();
  }
}

function databaseFingerprintV01(databasePath: string): string {
  return `sha256:${createHash("sha256")
    .update(readFileSync(databasePath))
    .digest("hex")}`;
}

function fingerprintV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function record(assertion: string): void {
  assertions.push(assertion);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
