import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  realpath,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { genericCliDirectObservationInputFixture } from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  LOCAL_PROJECT_ROOT_VERIFICATION_EXPECTED_OUTPUTS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01,
  createLocalProjectRootCriterionVerificationPlanV01,
} from "@/lib/vnext/automation/local-project-root-verification-profile";
import {
  evaluateCriterionAssessmentV01,
  parseCriterionRelationRefExternalIdV01,
} from "@/lib/vnext/criterion-assessment";
import {
  buildContextUseReviewV01,
  validateContextUseReviewRelationsV01,
} from "@/lib/vnext/context-use-review";
import {
  MAX_ROOT_ENTRIES_V01,
  createLocalProjectVerificationAdapterV01,
  enumerateBoundedProjectRootManifestV01,
  fingerprintProjectRootManifestV01,
  normalizeProjectRootManifestV01,
  type BoundedProjectRootDirectoryEntryV01,
  type BoundedProjectRootDirectoryHandleV01,
  type LocalProjectVerificationFilesystemV01,
  type ProjectRootManifestEntryV01,
} from "@/lib/vnext/native-host/local-project-verification-adapter";
import { inspectNativeHostPhysicalRootIdentityV01 } from "@/lib/vnext/native-host/project-root-identity";
import { assertNativeHostResultV01 } from "@/lib/vnext/native-host/native-host-contract";
import { deriveNativeHostDeliveryAuthorityV01 } from "@/lib/vnext/native-host/native-host-delivery-authority";
import { admitEpisodeDeltaProposalV01 } from "@/lib/vnext/persistence/episode-delta-proposal-admission";
import {
  countVNextCoreRecordsV01,
  deriveVNextSemanticTargetKeyV01,
  ensureVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
  readVNextSemanticStateEntryV01,
  readVNextSemanticTargetHeadV01,
  rebuildVNextPersistedSemanticStateV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  admitProjectVerifyLifecycleProposalV01,
  materializeProjectVerifyClaimLifecycleProposalV01,
  materializeProjectVerifyRelationLifecycleProposalV01,
} from "@/lib/vnext/persistence/project-verify-lifecycle-admission";
import {
  admitClaimRecordV01,
  admitEvidenceRecordV01,
} from "@/lib/vnext/persistence/project-verify-material-store";
import {
  admitRunCriterionProjectVerifyMaterialV01,
  readSourceBoundRunCriterionProjectVerifyMaterialV01,
} from "@/lib/vnext/persistence/run-criterion-project-verify-material-admission";
import { admitStructuredRunReceiptV01 } from "@/lib/vnext/persistence/structured-run-receipt-admission";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  materializeValidatedPacketDeliveryCheckV01,
  projectDirectNativeHostActionObservationsV01,
} from "@/lib/vnext/runtime/direct-native-host-round-trip";
import {
  buildRunReceiptV01,
  validateRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "@/lib/vnext/run-receipt";
import { materializeRunAssessmentProposalV01 } from "@/lib/vnext/run-assessment-proposal";
import { materializeRunCriterionProjectVerifyMaterialV01 } from "@/lib/vnext/run-criterion-project-verify-material";
import {
  buildClaimRecordV01,
  buildEvidenceRecordV01,
  claimRecordReferenceV01,
} from "@/lib/vnext/project-verify-material";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
  type ReviewDecisionBuilderInputV01,
} from "@/lib/vnext/review-decision";
import {
  commitVNextSemanticTransitionV01,
  loadValidatedVNextSemanticTransitionRelationV01,
  persistVNextSemanticReviewMaterialV01,
  prepareVNextSemanticCommitPreviewV01,
  recordVNextSemanticCommitAuthorizationV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import { compileTaskContextPacketFromPersistedSemanticStateV01 } from "@/lib/vnext/runtime/persisted-semantic-context-compiler";
import { readProjectVerifyLineageV01 } from "@/lib/vnext/runtime/project-verify-lineage";
import {
  assertProjectVerifyContextUseReviewEnvelopeV01,
  assertProjectVerifyContextUseReviewSourceBoundV01,
  assertProjectVerifyRunReceiptEnvelopeV01,
  assertProjectVerifyTaskContextPacketEnvelopeV01,
  readProjectVerifyReconciliationV01,
} from "@/lib/vnext/runtime/project-verify-reconciliation";
import { createVNextOperatorPilotContextUseReviewLogicalIdentityV01 } from "@/lib/vnext/runtime/operator-pilot-context-use-contract";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  NativeHostPhysicalRootIdentityV01,
  NativeHostRequestV01,
  NativeHostResultV01,
} from "@/types/vnext/native-host-adapter";
import type {
  CriterionAssessmentItemV01,
  CriterionAssessmentStatusV01,
  CriterionAssessmentV01,
} from "@/types/vnext/criterion-assessment";
import type { ClaimRecordV01 } from "@/types/vnext/project-verify-material";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const TEST_AT = "2026-07-19T08:00:00.000Z";
const INCLUDE_SR3_PRODUCTION_LIFECYCLE =
  process.argv.includes("--sr3-lifecycle");
let root = "";

async function main(): Promise<void> {
  root = await mkdtemp(path.join(tmpdir(), "augnes-local-verify-"));
  try {
    await assertBoundedEnumerationV01();
    assertCanonicalManifestV01();
    await assertRootAndResidueOutcomesV01();
    assertNoInvocationDeliveryV01();
    process.stdout.write(
      `${JSON.stringify(
        {
          suite: "local-project-verification-adapter.v0.1",
          status: "passed",
          max_root_entries: MAX_ROOT_ENTRIES_V01,
          incremental_bound_checked: true,
          canonical_manifest_checked: true,
          exact_root_identity_checked: true,
          truthful_terminal_residue_checked: true,
          typed_criterion_plan_checked: true,
          relation_aware_production_assessment_checked: true,
          project_verify_candidate_material_checked: true,
          durable_project_verify_candidate_material_checked: true,
          project_verify_transition_lifecycle_checked:
            INCLUDE_SR3_PRODUCTION_LIFECYCLE,
          user_authored_claim_revision_transition_checked:
            INCLUDE_SR3_PRODUCTION_LIFECYCLE,
          pure_claim_retraction_transition_checked:
            INCLUDE_SR3_PRODUCTION_LIFECYCLE,
          project_verify_reconciliation_and_lineage_checked:
            INCLUDE_SR3_PRODUCTION_LIFECYCLE,
          later_packet_transition_lineage_checked:
            INCLUDE_SR3_PRODUCTION_LIFECYCLE,
          context_use_review_exact_lifecycle_lineage_checked:
            INCLUDE_SR3_PRODUCTION_LIFECYCLE,
          blocked_cancelled_skipped_unknown_checked: true,
          packet_presentation_egress_separation_checked: true,
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function assertBoundedEnumerationV01(): Promise<void> {
  for (const count of [0, 1, MAX_ROOT_ENTRIES_V01]) {
    const fixture = directoryFixtureV01(count);
    const result = await enumerateBoundedProjectRootManifestV01({
      open_directory: async () => fixture.handle,
      cancellation_signal: new AbortController().signal,
    });
    assert.equal(result.status, "completed");
    assert.equal(
      result.status === "completed" ? result.entries.length : -1,
      count,
    );
    assert.equal(fixture.closed(), true);
  }

  const overflow = directoryFixtureV01(10_000);
  const overflowResult = await enumerateBoundedProjectRootManifestV01({
    open_directory: async () => overflow.handle,
    cancellation_signal: new AbortController().signal,
  });
  assert.equal(overflowResult.status, "bound_exceeded");
  assert.equal(overflow.reads(), MAX_ROOT_ENTRIES_V01 + 1);
  assert.equal(overflow.closed(), true);

  const cancellation = new AbortController();
  const cancelled = directoryFixtureV01(10, {
    after_read: (reads) => {
      if (reads === 1) cancellation.abort();
    },
  });
  const cancelledResult = await enumerateBoundedProjectRootManifestV01({
    open_directory: async () => cancelled.handle,
    cancellation_signal: cancellation.signal,
  });
  assert.equal(cancelledResult.status, "cancelled");
  assert.equal(cancelled.closed(), true);

  const failed = directoryFixtureV01(10, { fail_at_read: 2 });
  await assert.rejects(
    enumerateBoundedProjectRootManifestV01({
      open_directory: async () => failed.handle,
      cancellation_signal: new AbortController().signal,
    }),
    /injected_directory_read_failure/u,
  );
  assert.equal(failed.closed(), true);
}

function assertCanonicalManifestV01(): void {
  const material: ProjectRootManifestEntryV01[] = [
    { name: "z", kind: "file" },
    { name: "A", kind: "directory" },
    { name: "ä", kind: "symbolic_link" },
    { name: "a", kind: "other" },
  ];
  const expected = normalizeProjectRootManifestV01(material);
  assert.deepEqual(
    expected.map((entry) => entry.name),
    ["A", "a", "z", "ä"],
  );
  assert.equal(
    fingerprintProjectRootManifestV01(material),
    fingerprintProjectRootManifestV01([...material].reverse()),
  );
  const originalLocaleCompare = String.prototype.localeCompare;
  try {
    String.prototype.localeCompare = () => {
      throw new Error("locale_compare_must_not_be_used");
    };
    assert.equal(
      fingerprintProjectRootManifestV01(material),
      fingerprintProjectRootManifestV01([...material].reverse()),
    );
  } finally {
    String.prototype.localeCompare = originalLocaleCompare;
  }
  assert.notEqual(
    fingerprintProjectRootManifestV01(material),
    fingerprintProjectRootManifestV01([
      ...material.slice(0, 3),
      { name: "b", kind: "other" },
    ]),
  );
  assert.notEqual(
    fingerprintProjectRootManifestV01(material),
    fingerprintProjectRootManifestV01([
      { name: "z", kind: "directory" },
      ...material.slice(1),
    ]),
  );
  assert.throws(
    () =>
      fingerprintProjectRootManifestV01([
        { name: "duplicate", kind: "file" },
        { name: "duplicate", kind: "directory" },
      ]),
    /duplicate_name/u,
  );
}

async function assertRootAndResidueOutcomesV01(): Promise<void> {
  const projectRoot = path.join(root, "project");
  await mkdir(projectRoot);
  await writeFile(path.join(projectRoot, "package.json"), "{}\n", "utf8");
  await mkdir(path.join(projectRoot, "src"));
  const identity = await inspectNativeHostPhysicalRootIdentityV01(projectRoot);

  const completedRequest = requestV01(projectRoot, identity);
  assertProductionCriterionVerificationPlanV01(completedRequest);
  const completed = await invokeV01(completedRequest);
  assert.equal(completed.outcome, "completed");
  assert.deepEqual(completed.checks.map((check) => check.check_id).sort(), [
    ...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  ]);
  assert.equal(completed.artifacts.length, 1);
  assert.equal(completed.skipped_checks.length, 0);
  assert.deepEqual(completed.observed_actions, [
    "project_root_inspection_started",
    "verified_exact_project_root_binding",
    "enumerated_bounded_project_root_manifest",
    "fingerprinted_bounded_project_root_manifest",
  ]);
  assert.equal(
    actionReceiptObservationsV01(completed).filter(
      (observation) =>
        observation.summary === "fingerprinted_bounded_project_root_manifest",
    ).length,
    1,
  );
  assert.equal(
    completed.observed_actions.includes(
      "fingerprinted_bounded_project_root_manifest",
    ),
    true,
  );
  assert.equal(JSON.stringify(completed).includes(projectRoot), false);
  assert.equal(JSON.stringify(completed).includes("package.json"), false);
  assertLocalDeliveryV01(completed);
  const completedSource = productionSourceMaterialV01(
    completedRequest,
    completed,
  );
  const completedAssessment = completedSource.assessment;
  assertProductionAssessmentV01(completedAssessment, {
    root: "satisfied",
    bound: "satisfied",
    manifest: "satisfied",
    side_effects: "satisfied",
  });
  assert.deepEqual(completedAssessment.summary, {
    satisfied: 4,
    unsatisfied: 0,
    unknown: 0,
    not_applicable: 0,
  });
  assert.equal(
    completedAssessment.criteria.every(
      (criterion) =>
        criterion.basis === "observed" &&
        criterion.supporting_refs.length > 0 &&
        criterion.opposing_refs.length === 0 &&
        criterion.missing_refs.length === 0,
    ),
    true,
  );
  assert.equal(
    completedAssessment.criteria.every((criterion) =>
      criterion.supporting_refs.every(
        (ref) =>
          ref.ref_type === "criterion_check_support" &&
          ref.source_ref === completedAssessment.receipt_ref.source_ref &&
          ref.trust_class === "direct_local_observation",
      ),
    ),
    true,
  );
  assert.equal(
    completedAssessment.criteria.some((criterion) =>
      [
        ...criterion.supporting_refs,
        ...criterion.opposing_refs,
        ...criterion.missing_refs,
      ].some((ref) => {
        const identity = parseCriterionRelationRefExternalIdV01(
          ref.external_id,
        );
        return (
          identity?.kind === "check" &&
          identity.check_id === "validated_packet_delivery"
        );
      }),
    ),
    false,
    "the unrelated packet-delivery check must not create a criterion relation",
  );
  const completedVerifyExpected: ProductionVerifyMaterialExpectationV01 = {
    relation_kinds: {
      supports: 5,
      opposes: 0,
      insufficient: 0,
    },
    criterion_relation_kinds: {
      root: ["supports"],
      bound: ["supports"],
      manifest: ["supports"],
      side_effects: ["supports", "supports"],
    },
  };
  assertProductionVerifyMaterialV01(
    completedSource.verifyMaterial,
    completedVerifyExpected,
  );
  if (INCLUDE_SR3_PRODUCTION_LIFECYCLE) {
    const interactiveRequest = requestV01(projectRoot, identity);
    interactiveRequest.mode = "interactive";
    const interactiveResult = await invokeV01(interactiveRequest);
    assert.equal(interactiveResult.outcome, "completed");
    assert.deepEqual(
      interactiveResult.checks.map((check) => check.check_id).sort(),
      [...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01],
    );
    assert.equal(interactiveResult.artifacts.length, 1);
    assert.equal(interactiveResult.skipped_checks.length, 0);
    const interactiveSource = productionSourceMaterialV01(
      interactiveRequest,
      interactiveResult,
    );
    assertCanonicalProtocolEqualV01(
      interactiveSource.verifyMaterial,
      completedSource.verifyMaterial,
    );
    assertCanonicalProtocolEqualV01(
      interactiveSource.assessment,
      completedSource.assessment,
    );
    assert.equal(interactiveRequest.mode, "interactive");
    assert.equal(completedRequest.mode, "policy_triggered");
  }
  assertDurableProductionVerifyMaterialV01(
    completedSource,
    completedVerifyExpected,
    INCLUDE_SR3_PRODUCTION_LIFECYCLE,
  );

  const preCancelledController = new AbortController();
  preCancelledController.abort();
  const preCancelledRequest = requestV01(projectRoot, identity);
  const preCancelled = await invokeV01(
    preCancelledRequest,
    undefined,
    preCancelledController.signal,
  );
  assertNegativeResidueV01(preCancelled, "cancelled");
  assert.deepEqual(preCancelled.observed_actions, []);
  assert.deepEqual(preCancelled.checks, []);
  assert.deepEqual(
    preCancelled.skipped_checks.map((check) => check.check_id).sort(),
    [...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01],
  );
  assertLocalDeliveryV01(preCancelled);
  const preCancelledSource = productionSourceMaterialV01(
    preCancelledRequest,
    preCancelled,
  );
  assertProductionAssessmentV01(preCancelledSource.assessment, {
    root: "unknown",
    bound: "unknown",
    manifest: "unknown",
    side_effects: "unknown",
  });
  const preCancelledVerifyExpected: ProductionVerifyMaterialExpectationV01 = {
    relation_kinds: {
      supports: 0,
      opposes: 0,
      insufficient: 5,
    },
    criterion_relation_kinds: {
      root: ["insufficient"],
      bound: ["insufficient"],
      manifest: ["insufficient"],
      side_effects: ["insufficient", "insufficient"],
    },
  };
  assertProductionVerifyMaterialV01(
    preCancelledSource.verifyMaterial,
    preCancelledVerifyExpected,
  );
  assertDurableProductionVerifyMaterialV01(
    preCancelledSource,
    preCancelledVerifyExpected,
  );

  const duringController = new AbortController();
  const duringFixture = directoryFixtureV01(10, {
    after_read: () => duringController.abort(),
  });
  const duringFilesystem = filesystemV01(async () => duringFixture.handle);
  const duringCancelledRequest = requestV01(projectRoot, identity);
  const duringCancelled = await invokeV01(
    duringCancelledRequest,
    duringFilesystem,
    duringController.signal,
  );
  assertNegativeResidueV01(duringCancelled, "cancelled");
  assert.deepEqual(duringCancelled.observed_actions, [
    "project_root_inspection_started",
    "verified_exact_project_root_binding",
  ]);
  assert.deepEqual(
    duringCancelled.checks.map(({ check_id, status }) => ({
      check_id,
      status,
    })),
    [{ check_id: "project_root_scope_verified", status: "passed" }],
  );
  assert.equal(duringFixture.closed(), true);
  assertLocalDeliveryV01(duringCancelled);
  assertProductionAssessmentV01(
    productionAssessmentV01(duringCancelledRequest, duringCancelled),
    {
      root: "satisfied",
      bound: "unknown",
      manifest: "unknown",
      side_effects: "unknown",
    },
  );

  const conflictingIdentity: NativeHostPhysicalRootIdentityV01 = {
    ...identity,
    inode: `${identity.inode}-changed`,
  };
  const conflictRequest = requestV01(projectRoot, conflictingIdentity);
  const conflict = await invokeV01(conflictRequest);
  assertNegativeResidueV01(conflict, "blocked");
  assert.deepEqual(conflict.observed_actions, [
    "project_root_inspection_started",
  ]);
  assert.equal(
    conflict.checks.find(
      (check) => check.check_id === "project_root_scope_verified",
    )?.status,
    "blocked",
  );
  assertLocalDeliveryV01(conflict);
  assertProductionAssessmentV01(
    productionAssessmentV01(conflictRequest, conflict),
    {
      root: "unknown",
      bound: "unknown",
      manifest: "unknown",
      side_effects: "unknown",
    },
  );

  const overflow = directoryFixtureV01(MAX_ROOT_ENTRIES_V01 + 1);
  const overflowRequest = requestV01(projectRoot, identity);
  const overflowResult = await invokeV01(
    overflowRequest,
    filesystemV01(async () => overflow.handle),
  );
  assertNegativeResidueV01(overflowResult, "blocked");
  assert.equal(overflow.closed(), true);
  assert.equal(
    overflowResult.observed_actions.includes(
      "project_root_manifest_bound_exceeded",
    ),
    true,
  );
  assert.deepEqual(
    overflowResult.checks.map(({ check_id, status }) => ({ check_id, status })),
    [
      { check_id: "project_root_scope_verified", status: "passed" },
      { check_id: "project_root_manifest_bound", status: "blocked" },
    ],
  );
  assertLocalDeliveryV01(overflowResult);
  assertProductionAssessmentV01(
    productionAssessmentV01(overflowRequest, overflowResult),
    {
      root: "satisfied",
      bound: "unknown",
      manifest: "unknown",
      side_effects: "unknown",
    },
  );

  const filesystemFailureRequest = requestV01(projectRoot, identity);
  filesystemFailureRequest.request_id =
    "host-request:local-verification:filesystem-failure";
  filesystemFailureRequest.run_id =
    "host-run:local-verification:filesystem-failure";
  filesystemFailureRequest.idempotency_key = `sha256:${"e".repeat(64)}`;
  const filesystemFailure = await invokeV01(
    filesystemFailureRequest,
    filesystemV01(async () => {
      throw new Error("injected_open_failure");
    }),
  );
  assertNegativeResidueV01(filesystemFailure, "failed");
  assert.equal(
    filesystemFailure.observed_actions.includes(
      "verified_exact_project_root_binding",
    ),
    true,
  );
  assert.deepEqual(
    filesystemFailure.checks.map(({ check_id, status }) => ({
      check_id,
      status,
    })),
    [
      { check_id: "project_root_scope_verified", status: "passed" },
      { check_id: "project_root_manifest_verified", status: "failed" },
    ],
  );
  assertLocalDeliveryV01(filesystemFailure);
  const failedSource = productionSourceMaterialV01(
    filesystemFailureRequest,
    filesystemFailure,
  );
  const failedAssessment = failedSource.assessment;
  assertProductionAssessmentV01(failedAssessment, {
    root: "satisfied",
    bound: "unknown",
    manifest: "unsatisfied",
    side_effects: "unknown",
  });
  assert.deepEqual(failedAssessment.summary, {
    satisfied: 1,
    unsatisfied: 1,
    unknown: 2,
    not_applicable: 0,
  });
  const failedManifest = criterionByRoleV01(failedAssessment, "manifest");
  assert.equal(failedManifest.basis, "observed");
  assert.equal(failedManifest.supporting_refs.length, 0);
  assert.equal(failedManifest.opposing_refs.length, 1);
  assert.equal(failedManifest.missing_refs.length, 0);
  const failedManifestRelation = parseCriterionRelationRefExternalIdV01(
    failedManifest.opposing_refs[0]?.external_id,
  );
  assert.equal(
    failedManifestRelation?.kind === "check" &&
      failedManifestRelation.check_id === "project_root_manifest_verified",
    true,
  );
  const failedVerifyExpected: ProductionVerifyMaterialExpectationV01 = {
    relation_kinds: {
      supports: 1,
      opposes: 1,
      insufficient: 3,
    },
    criterion_relation_kinds: {
      root: ["supports"],
      bound: ["insufficient"],
      manifest: ["opposes"],
      side_effects: ["insufficient", "insufficient"],
    },
  };
  assertProductionVerifyMaterialV01(
    failedSource.verifyMaterial,
    failedVerifyExpected,
  );
  assertDurableProductionVerifyMaterialV01(failedSource, failedVerifyExpected);
  if (!INCLUDE_SR3_PRODUCTION_LIFECYCLE) {
    assertExactCriterionReceiptIsolationV01(completedSource, failedSource);
  }

  const replaced = path.join(root, "replaced");
  const replacedPrior = path.join(root, "replaced-prior");
  await mkdir(replaced);
  const replacedIdentity =
    await inspectNativeHostPhysicalRootIdentityV01(replaced);
  await import("node:fs/promises").then(({ rename }) =>
    rename(replaced, replacedPrior),
  );
  await mkdir(replaced);
  assertNegativeResidueV01(
    await invokeV01(requestV01(replaced, replacedIdentity)),
    "blocked",
  );

  const linkTargetA = path.join(root, "link-target-a");
  const linkTargetB = path.join(root, "link-target-b");
  const linkedRoot = path.join(root, "linked-root");
  await mkdir(linkTargetA);
  await mkdir(linkTargetB);
  await symlink(linkTargetA, linkedRoot);
  const linkedIdentity =
    await inspectNativeHostPhysicalRootIdentityV01(linkedRoot);
  await rm(linkedRoot);
  await symlink(linkTargetB, linkedRoot);
  assertNegativeResidueV01(
    await invokeV01(requestV01(linkedRoot, linkedIdentity)),
    "blocked",
  );

  const notDirectory = path.join(root, "not-directory");
  await writeFile(notDirectory, "not a directory\n", "utf8");
  assertNegativeResidueV01(
    await invokeV01(requestV01(notDirectory, identity)),
    "blocked",
  );
}

type ProductionCriterionRoleV01 =
  "root" | "bound" | "manifest" | "side_effects";

const PRODUCTION_CRITERION_INDEX_V01 = {
  root: 0,
  bound: 1,
  manifest: 2,
  side_effects: 3,
} as const satisfies Record<ProductionCriterionRoleV01, number>;

const PRODUCTION_CRITERION_CHECKS_V01 = {
  root: ["project_root_scope_verified"],
  bound: ["project_root_manifest_bound"],
  manifest: ["project_root_manifest_verified"],
  side_effects: [
    "project_file_mutation_absent",
    "provider_model_network_absent",
  ],
} as const satisfies Record<ProductionCriterionRoleV01, readonly string[]>;

function assertProductionCriterionVerificationPlanV01(
  request: NativeHostRequestV01,
): void {
  const expected = createLocalProjectRootCriterionVerificationPlanV01({
    workspace_id: request.workspace_id,
    project_id: request.project_id,
  });
  assert.deepEqual(request.packet.criterion_verification_plan, expected);
  assert.deepEqual(
    expected.criteria.map((entry) => entry.criterion).sort(),
    [...LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.success_criteria].sort(),
  );
  for (const role of Object.keys(
    PRODUCTION_CRITERION_INDEX_V01,
  ) as ProductionCriterionRoleV01[]) {
    const criterion =
      LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.success_criteria[
        PRODUCTION_CRITERION_INDEX_V01[role]
      ];
    const entry = expected.criteria.find(
      (candidate) => candidate.criterion === criterion,
    );
    assert(entry, `missing production verification entry for ${role}`);
    assert.deepEqual(
      entry.obligations.map((obligation) => obligation.check_id).sort(),
      [...PRODUCTION_CRITERION_CHECKS_V01[role]].sort(),
    );
  }
}

function productionSourceMaterialV01(
  request: NativeHostRequestV01,
  result: NativeHostResultV01,
) {
  const adapter = {
    adapter_version: "local_project_verification_adapter.v0.1",
    execution_profile: "deterministic_zero_model" as const,
    provider_egress: "forbidden" as const,
  };
  const materialized = materializeValidatedPacketDeliveryCheckV01({
    adapter,
    result,
    adapter_invocation_started: true,
  });
  const verifierRef = refV01(
    "native_host_orchestrator",
    "local_project_verification_relation_fixture.v0.1",
    `sha256:${"d".repeat(64)}`,
  );
  const fixture = structuredClone(
    genericCliDirectObservationInputFixture,
  ) as RunReceiptBuilderInputV01;
  const requiredChecks = [
    ...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  ];
  const checkIds = materialized.checks.map((check) => check.check_id);
  const failed = materialized.checks.some(
    (check) => check.required && check.status === "failed",
  );
  const allRequiredPassed = requiredChecks.every((checkId) =>
    materialized.checks.some(
      (check) => check.check_id === checkId && check.status === "passed",
    ),
  );
  const receiptInput: RunReceiptBuilderInputV01 = {
    ...fixture,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    run_id: request.run_id,
    work_ref: request.work_ref,
    task_context_packet_ref: request.task_context_packet_ref,
    recorded_at: materialized.finished_at,
    started_at: materialized.started_at,
    finished_at: materialized.finished_at,
    execution: {
      status: receiptExecutionStatusV01(materialized.outcome),
      basis: "observed",
      source_refs: [verifierRef],
    },
    verification: {
      status: allRequiredPassed
        ? "passed"
        : failed
          ? "failed"
          : checkIds.length === 0
            ? "not_run"
            : "partial",
      basis: "observed",
      required_check_ids: requiredChecks,
      source_refs: [verifierRef],
    },
    reporter_ref: verifierRef,
    observer_refs: [verifierRef],
    verifier_refs: [verifierRef],
    host_ref: null,
    worker_ref: verifierRef,
    model_invocations: [],
    execution_environment: {
      environment_kind: "local",
      host_ref: null,
      worker_ref: verifierRef,
      operating_system: null,
      runtime_labels: [
        "local_project_verification_adapter.v0.1",
        "deterministic_zero_model",
      ],
      source_refs: [verifierRef],
    },
    observations: materialized.checks.map((check, index) => ({
      observation_id: `observation:local-verification-check:${index}:${check.check_id}`,
      observation_kind: "local_project_verification_check_result",
      summary: check.summary,
      event_at: materialized.finished_at,
      observed_at: materialized.finished_at,
      observer_ref: verifierRef,
      trust_class: "direct_local_observation",
      source_refs: [verifierRef],
      related_command_ids: [],
      related_check_ids: [check.check_id],
      related_artifact_refs: [],
    })),
    attestations: [],
    changed_artifacts: [],
    commands: [],
    checks: materialized.checks.map((check) => ({
      ...check,
      basis: "observed",
      source_refs: [verifierRef],
    })),
    skipped_checks: materialized.skipped_checks.map((check) => ({
      ...check,
      basis: "observed",
      source_refs: [verifierRef],
    })),
    external_refs: materialized.artifacts.map(
      (artifact) => artifact.artifact_ref,
    ),
    result_summary: {
      summary: materialized.summary,
      outcome: materialized.outcome,
      limitations: [
        ...materialized.uncertainty,
        ...materialized.gaps,
        "This receipt is execution residue, not accepted Evidence or task acceptance.",
      ],
    },
    blockers:
      materialized.outcome === "blocked"
        ? [
            {
              code: "local_project_verification_blocked",
              summary:
                materialized.public_stop_reason ??
                "Local project verification was blocked.",
              source_refs: [verifierRef],
            },
          ]
        : [],
    warnings: [],
    gaps: materialized.gaps.map((gap, index) => ({
      code: `local_project_verification_gap_${index}`,
      summary: gap,
      source_refs: [verifierRef],
    })),
    privacy_egress: {
      data_classification: "local_only",
      egress_status: "did_not_occur",
      basis: "observed",
      destination_refs: [],
      redaction_status: "not_needed",
      retention_class: "bounded_structured_local_receipt_only",
      raw_prompt_persisted: false,
      raw_output_persisted: false,
      raw_transcript_persisted: false,
      secret_material_persisted: false,
      source_refs: [verifierRef],
      notes: [
        "The in-process deterministic adapter performed no network, provider, or model call.",
      ],
    },
    cost_usage: {
      cost_basis: "measured",
      cost_amount: 0,
      currency: "USD",
      usage: {
        basis: "measured",
        input_units: 0,
        output_units: 0,
        total_units: 0,
        unit: "model_tokens",
      },
      source_refs: [verifierRef],
    },
    capability_coverage: materialized.capability_coverage.map((entry) => ({
      capability: entry.capability,
      coverage_level:
        entry.coverage === "unsupported"
          ? "outside_coverage"
          : entry.coverage === "host_attested"
            ? "advisory"
            : entry.coverage,
      source_ref: entry.source_ref,
      notes: [...entry.notes],
    })),
    source_refs: [verifierRef, request.task_context_packet_ref],
    artifact_refs: materialized.artifacts.map(
      (artifact) => artifact.artifact_ref,
    ),
    compatibility: {
      source_contracts: [
        "local_project_verification_adapter.v0.1",
        "criterion_verification_plan.v0.1",
      ],
      unmapped_fields: [],
      warnings: [],
      external_refs: [],
    },
    authority_notes: [
      "Criterion assessment creates no Evidence, Claim, proposal, decision, Transition, or semantic state.",
    ],
  };
  const receipt = buildRunReceiptV01(receiptInput);
  const validation = validateRunReceiptV01(receipt);
  assert.equal(validation.status, "valid", JSON.stringify(validation));
  assert.equal(receipt.model_invocations.length, 0);
  assert.equal(receipt.privacy_egress.egress_status, "did_not_occur");
  assert.equal(receipt.authority_summary.writes_database, false);
  const assessment = evaluateCriterionAssessmentV01({
    packet: request.packet,
    receipt,
  });
  const proposalMaterial = materializeRunAssessmentProposalV01({
    packet: request.packet,
    receipt,
    assessment,
  });
  const proposal = proposalMaterial.proposal;
  const verifyMaterial = materializeRunCriterionProjectVerifyMaterialV01({
    packet: request.packet,
    receipt,
    assessment,
    proposal,
  });
  return {
    packet: request.packet,
    receipt,
    assessment,
    proposalMaterial,
    proposal,
    verifyMaterial,
  };
}

function productionAssessmentV01(
  request: NativeHostRequestV01,
  result: NativeHostResultV01,
): CriterionAssessmentV01 {
  return productionSourceMaterialV01(request, result).assessment;
}

function receiptExecutionStatusV01(
  outcome: NativeHostResultV01["outcome"],
): RunReceiptBuilderInputV01["execution"]["status"] {
  if (outcome === "timed_out") return "failed";
  if (outcome === "unavailable") return "blocked";
  return outcome;
}

function assertProductionAssessmentV01(
  assessment: CriterionAssessmentV01,
  expected: Record<ProductionCriterionRoleV01, CriterionAssessmentStatusV01>,
): void {
  for (const role of Object.keys(expected) as ProductionCriterionRoleV01[]) {
    const criterion = criterionByRoleV01(assessment, role);
    assert.equal(criterion.status, expected[role], `${role} status`);
    const exactChecks = PRODUCTION_CRITERION_CHECKS_V01[role];
    const relationRefs = [
      ...criterion.supporting_refs,
      ...criterion.opposing_refs,
      ...criterion.missing_refs,
    ];
    for (const checkId of exactChecks) {
      assert.equal(
        relationRefs.some((ref) => {
          const identity = parseCriterionRelationRefExternalIdV01(
            ref.external_id,
          );
          return identity?.kind === "check" && identity.check_id === checkId;
        }),
        true,
        `${role} must retain an exact relation ref for ${checkId}`,
      );
    }
    if (criterion.status === "satisfied") {
      assert.equal(criterion.basis, "observed");
      assert.equal(criterion.supporting_refs.length, exactChecks.length);
      assert.equal(criterion.opposing_refs.length, 0);
      assert.equal(criterion.missing_refs.length, 0);
    } else if (criterion.status === "unsatisfied") {
      assert.equal(criterion.basis, "observed");
      assert.equal(criterion.supporting_refs.length, 0);
      assert.equal(criterion.opposing_refs.length > 0, true);
      assert.equal(criterion.missing_refs.length, 0);
    } else {
      assert.equal(criterion.basis, "insufficient");
      assert.equal(criterion.missing_refs.length > 0, true);
    }
  }
  assert.equal(assessment.authority.authoritative, false);
  assert.equal(assessment.authority.creates_evidence, false);
  assert.equal(assessment.authority.validates_claims, false);
  assert.equal(assessment.authority.creates_proposal, false);
  assert.equal(assessment.authority.creates_decision, false);
  assert.equal(assessment.authority.applies_transition, false);
  assert.equal(assessment.authority.changes_semantic_state, false);
  assert.equal(assessment.authority.changes_later_context, false);
}

type ProductionVerifyRelationKindV01 = "supports" | "opposes" | "insufficient";

interface ProductionVerifyMaterialExpectationV01 {
  relation_kinds: Record<ProductionVerifyRelationKindV01, number>;
  criterion_relation_kinds: Record<
    ProductionCriterionRoleV01,
    ProductionVerifyRelationKindV01[]
  >;
}

function assertProductionVerifyMaterialV01(
  material: ReturnType<typeof materializeRunCriterionProjectVerifyMaterialV01>,
  expected: ProductionVerifyMaterialExpectationV01,
): void {
  assert.equal(material.evidence_records.length, 5);
  assert.equal(material.claim_records.length, 4);
  assert.equal(material.relations.length, 5);
  assert.deepEqual(material.authority, {
    explicit_admission_required: true,
    source_validation_grants_truth: false,
    evidence_is_accepted_automatically: false,
    claims_are_candidate_only: true,
    relations_are_candidate_only: true,
    creates_review_decision: false,
    applies_transition: false,
    changes_semantic_state: false,
    selects_applied_current_head: false,
    changes_later_context: false,
  });

  for (const evidence of material.evidence_records) {
    assert.equal(evidence.evidence_kind, "exact_criterion_relation_material");
    assert.deepEqual(evidence.lifecycle, {
      record_status: "recorded",
      review_status: "not_reviewed",
      decision_ref: null,
      acceptance_status: "not_accepted",
      transition_ref: null,
    });
    assert.equal(evidence.authority.record_establishes_truth, false);
    assert.equal(evidence.authority.record_is_accepted_semantic_state, false);
    assert.equal(evidence.authority.satisfies_criterion_automatically, false);
    assert.equal(evidence.authority.activates_claim_automatically, false);
    assert.equal(evidence.authority.creates_review_decision, false);
    assert.equal(evidence.authority.applies_transition, false);
    assert.equal(evidence.authority.changes_semantic_state, false);
    assert.equal(evidence.authority.changes_later_context, false);
    assert.equal(
      evidence.producer.producer_kind,
      "server_deterministic_evaluator",
    );
    assert.equal(
      evidence.source_refs.some(
        (ref) =>
          ref.ref_type === "task_context_packet" &&
          ref.external_id === material.source.packet.packet_id &&
          ref.source_ref === material.source.packet.packet_fingerprint,
      ),
      true,
    );
    assert.equal(
      evidence.source_refs.some(
        (ref) =>
          ref.ref_type === "run_receipt" &&
          ref.external_id === material.source.receipt.receipt_id &&
          ref.source_ref === material.source.receipt.receipt_fingerprint,
      ),
      true,
    );
    assert.equal(
      evidence.source_refs.some(
        (ref) =>
          ref.ref_type === "criterion_assessment" &&
          ref.external_id ===
            material.source.assessment.assessment_fingerprint &&
          ref.source_ref === material.source.assessment.assessment_fingerprint,
      ),
      true,
    );
    assert.equal(
      evidence.source_refs.some(
        (ref) =>
          ref.ref_type === "episode_delta_proposal" &&
          ref.external_id === material.source.proposal.proposal_id &&
          ref.source_ref === material.source.proposal.proposal_fingerprint,
      ),
      true,
    );
    const exactSourceRefs = evidence.source_refs.flatMap((ref) => {
      const parsed = parseCriterionRelationRefExternalIdV01(ref.external_id);
      return parsed ? [{ ref, parsed }] : [];
    });
    assert.equal(exactSourceRefs.length, 1);
    const parsed = exactSourceRefs[0]?.parsed;
    assert(parsed);
    assert.equal(
      evidence.material_fingerprint,
      parsed.relation_material_fingerprint,
    );
    assert.equal(evidence.trust_class, parsed.trust_class);
    assert.equal(
      evidence.coverage,
      parsed.kind === "applicability"
        ? "not_applicable"
        : parsed.direction === "missing"
          ? "partial"
          : "complete",
    );
  }

  for (const claim of material.claim_records) {
    assert.equal(claim.revision, 1);
    assert.equal(claim.operation_intent, "create");
    assert.equal(claim.prior_claim_ref, null);
    assert.equal(claim.operation_target_claim_ref, null);
    assert.deepEqual(claim.lifecycle, {
      record_status: "recorded",
      candidate_status: "candidate",
      review_status: "not_reviewed",
      decision_ref: null,
      application_status: "not_applied",
      transition_ref: null,
      truth_status: "not_established",
    });
    assert.equal(claim.authority.record_establishes_truth, false);
    assert.equal(claim.authority.selects_applied_current_head, false);
    assert.equal(claim.authority.creates_review_decision, false);
    assert.equal(claim.authority.applies_transition, false);
    assert.equal(claim.authority.changes_semantic_state, false);
    assert.equal(claim.authority.changes_later_context, false);
  }

  const actualKindCounts: Record<ProductionVerifyRelationKindV01, number> = {
    supports: 0,
    opposes: 0,
    insufficient: 0,
  };
  for (const relation of material.relations) {
    assert.equal(
      relation.relation_kind === "supports" ||
        relation.relation_kind === "opposes" ||
        relation.relation_kind === "insufficient",
      true,
    );
    const relationKind =
      relation.relation_kind as ProductionVerifyRelationKindV01;
    actualKindCounts[relationKind] += 1;
    assert.deepEqual(relation.lifecycle, {
      record_status: "recorded",
      candidate_status: "candidate",
      review_status: "not_reviewed",
      decision_ref: null,
      application_status: "not_applied",
      transition_ref: null,
      relation_status: "not_established",
    });
    assert.equal(relation.authority.relation_existence_proves_claim, false);
    assert.equal(relation.authority.evidence_count_calculates_truth, false);
    assert.equal(relation.authority.selects_applied_current_head, false);
    assert.equal(relation.authority.creates_review_decision, false);
    assert.equal(relation.authority.applies_transition, false);
    assert.equal(relation.authority.changes_semantic_state, false);
    assert.equal(relation.authority.changes_later_context, false);

    const claim = material.claim_records.find(
      (candidate) => candidate.claim_id === relation.claim_ref.record_id,
    );
    const evidence = material.evidence_records.find(
      (candidate) => candidate.evidence_id === relation.evidence_ref.record_id,
    );
    assert(claim);
    assert(evidence);
    assert.equal(
      relation.claim_ref.record_fingerprint,
      claim.integrity.fingerprint,
    );
    assert.equal(
      relation.evidence_ref.record_fingerprint,
      evidence.integrity.fingerprint,
    );
    const exactSource = evidence.source_refs
      .map((ref) => parseCriterionRelationRefExternalIdV01(ref.external_id))
      .find((parsed) => parsed !== null);
    assert(exactSource);
    const expectedKind =
      exactSource.kind === "applicability"
        ? "qualifies"
        : exactSource.direction === "support"
          ? "supports"
          : exactSource.direction === "opposition"
            ? "opposes"
            : "insufficient";
    assert.equal(relation.relation_kind, expectedKind);
    assert.equal(
      relation.basis,
      relationKind === "insufficient" ? "insufficient" : "observed",
    );
  }
  assert.deepEqual(actualKindCounts, expected.relation_kinds);

  for (const role of Object.keys(
    expected.criterion_relation_kinds,
  ) as ProductionCriterionRoleV01[]) {
    const proposition =
      LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.success_criteria[
        PRODUCTION_CRITERION_INDEX_V01[role]
      ];
    const claim = material.claim_records.find(
      (candidate) => candidate.proposition === proposition,
    );
    assert(claim, `missing project Verify Claim candidate for ${role}`);
    const relationKinds = material.relations
      .filter((relation) => relation.claim_ref.record_id === claim.claim_id)
      .map((relation) => relation.relation_kind)
      .sort();
    assert.deepEqual(
      relationKinds,
      [...expected.criterion_relation_kinds[role]].sort(),
      `${role} project Verify relations`,
    );
  }
}

function assertDurableProductionVerifyMaterialV01(
  source: ReturnType<typeof productionSourceMaterialV01>,
  expected: ProductionVerifyMaterialExpectationV01,
  proveLifecycle = false,
): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const packetWrite = insertVNextCoreRecordV01(db, {
      record_kind: "task_context_packet",
      record_id: source.packet.packet_id,
      workspace_id: source.packet.workspace_id,
      project_id: source.packet.project_id,
      fingerprint: source.packet.integrity.fingerprint,
      idempotency_key: null,
      payload: source.packet,
      created_at: source.packet.generated_at,
    });
    assert.equal(packetWrite.status, "inserted");
    assertCanonicalProtocolEqualV01(packetWrite.record.payload, source.packet);
    const receiptWrite = admitStructuredRunReceiptV01(db, source.receipt);
    assert.equal(receiptWrite.status, "inserted");
    assertCanonicalProtocolEqualV01(receiptWrite.receipt, source.receipt);
    const proposalWrite = admitEpisodeDeltaProposalV01(db, {
      expected: source.proposalMaterial,
      source: {
        packet: source.packet,
        receipt: source.receipt,
        assessment: source.assessment,
      },
    });
    assert.equal(proposalWrite.status, "inserted");
    assertCanonicalProtocolEqualV01(proposalWrite.proposal, source.proposal);

    const scope = {
      workspace_id: source.packet.workspace_id,
      project_id: source.packet.project_id,
      receipt_id: source.receipt.receipt_id,
    };
    const authorityBefore = durableAuthoritySnapshotV01(db, scope);
    assert.deepEqual(authorityBefore, {
      review_decisions: 0,
      semantic_commit_gates: 0,
      state_transition_receipts: 0,
      semantic_state_records: 0,
      semantic_state_entries: 0,
      semantic_target_heads: 0,
    });

    const admitted = admitRunCriterionProjectVerifyMaterialV01(db, scope);
    assert.equal(admitted.status, "inserted");
    assertCanonicalProtocolEqualV01(admitted.material, source.verifyMaterial);
    assertProductionVerifyMaterialV01(admitted.material, expected);
    assert.equal(
      countVNextCoreRecordsV01(db, {
        workspace_id: scope.workspace_id,
        project_id: scope.project_id,
        record_kind: "evidence_record",
      }),
      5,
    );
    assert.equal(
      countVNextCoreRecordsV01(db, {
        workspace_id: scope.workspace_id,
        project_id: scope.project_id,
        record_kind: "claim_record",
      }),
      4,
    );
    assert.equal(
      countVNextCoreRecordsV01(db, {
        workspace_id: scope.workspace_id,
        project_id: scope.project_id,
        record_kind: "claim_evidence_relation",
      }),
      5,
    );
    assert.deepEqual(durableAuthoritySnapshotV01(db, scope), authorityBefore);

    const replay = admitRunCriterionProjectVerifyMaterialV01(db, scope);
    assert.equal(replay.status, "exact_replay");
    assertCanonicalProtocolEqualV01(replay.material, admitted.material);
    assertProductionVerifyMaterialV01(replay.material, expected);

    const reloaded = readSourceBoundRunCriterionProjectVerifyMaterialV01(
      db,
      scope,
    );
    assertCanonicalProtocolEqualV01(reloaded, admitted.material);
    assertProductionVerifyMaterialV01(reloaded, expected);
    assert.deepEqual(durableAuthoritySnapshotV01(db, scope), authorityBefore);
    if (proveLifecycle) {
      assertProductionVerifyLifecycleGoldenV01(db, source, admitted.material);
    }
  } finally {
    db.close();
  }
}

function assertExactCriterionReceiptIsolationV01(
  completed: ReturnType<typeof productionSourceMaterialV01>,
  failed: ReturnType<typeof productionSourceMaterialV01>,
): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    assert.equal(completed.packet.packet_id, failed.packet.packet_id);
    assert.equal(
      completed.packet.integrity.fingerprint,
      failed.packet.integrity.fingerprint,
    );
    assert.notEqual(completed.receipt.receipt_id, failed.receipt.receipt_id);
    for (const [index, source] of [completed, failed].entries()) {
      const packetWrite = insertVNextCoreRecordV01(db, {
        record_kind: "task_context_packet",
        record_id: source.packet.packet_id,
        workspace_id: source.packet.workspace_id,
        project_id: source.packet.project_id,
        fingerprint: source.packet.integrity.fingerprint,
        idempotency_key: null,
        payload: source.packet,
        created_at: source.packet.generated_at,
      });
      assert.equal(
        packetWrite.status,
        index === 0 ? "inserted" : "exact_replay",
      );
      assert.equal(
        admitStructuredRunReceiptV01(db, source.receipt).status,
        "inserted",
      );
      assert.equal(
        admitEpisodeDeltaProposalV01(db, {
          expected: source.proposalMaterial,
          source: {
            packet: source.packet,
            receipt: source.receipt,
            assessment: source.assessment,
          },
        }).status,
        "inserted",
      );
      assert.equal(
        admitRunCriterionProjectVerifyMaterialV01(db, {
          workspace_id: source.packet.workspace_id,
          project_id: source.packet.project_id,
          receipt_id: source.receipt.receipt_id,
        }).status,
        "inserted",
      );
    }

    const fillerSubject = refV01(
      "project_verify_subject",
      "subject:exact-criterion-receipt-isolation-fillers",
      `sha256:${"6".repeat(64)}`,
    );
    for (let index = 1; index <= 257; index += 1) {
      const suffix = index.toString().padStart(3, "0");
      const recordedAt = new Date(
        Date.parse(TEST_AT) + 60 * 60 * 1000 + index,
      ).toISOString();
      const sourceRef = refV01(
        "bounded_focus_filler_source",
        `source:bounded-focus-filler:${suffix}`,
        `sha256:${(index + 10_000).toString(16).padStart(64, "0")}`,
      );
      const evidence = buildEvidenceRecordV01({
        identity_namespace: "augnes.test.sr3.bounded-focus-filler.v0.1",
        identity_key: `bounded-focus-filler:${suffix}`,
        workspace_id: completed.packet.workspace_id,
        project_id: completed.packet.project_id,
        evidence_kind: "derived_interpretation_material",
        subject_refs: [fillerSubject],
        source_refs: [sourceRef],
        source_observed_or_reported_at: recordedAt,
        recorded_at: recordedAt,
        trust_class: "derived_interpretation",
        coverage: "partial",
        bounded_summary: `Unrelated bounded focus filler ${suffix}.`,
        material_fingerprint: null,
        limitations: ["This unrelated fixture establishes no truth."],
        uncertainty: ["It is unrelated to the exact criterion lookup."],
        producer: {
          producer_kind: "server_deterministic_evaluator",
          producer_profile: "sr3-bounded-focus-filler.v0.1",
        },
      });
      assert.equal(
        admitEvidenceRecordV01(db, {
          workspace_id: completed.packet.workspace_id,
          project_id: completed.packet.project_id,
          evidence,
        }).status,
        "inserted",
      );
      assert.equal(
        insertVNextCoreRecordV01(db, {
          record_kind: "episode_delta_proposal",
          record_id: `bounded-focus-proposal-filler:${suffix}`,
          workspace_id: completed.packet.workspace_id,
          project_id: completed.packet.project_id,
          fingerprint: `sha256:${(index + 20_000)
            .toString(16)
            .padStart(64, "0")}`,
          idempotency_key: null,
          payload: { bounded_focus_filler: true, index },
          created_at: recordedAt,
        }).status,
        "inserted",
      );
    }

    const completedManifest = criterionByRoleV01(
      completed.assessment,
      "manifest",
    );
    const failedManifest = criterionByRoleV01(failed.assessment, "manifest");
    const exactLineage = (source: typeof completed) =>
      readProjectVerifyLineageV01(db, {
        workspace_id: source.packet.workspace_id,
        project_id: source.packet.project_id,
        observed_at: new Date(
          Date.parse(TEST_AT) + 2 * 60 * 60 * 1000,
        ).toISOString(),
        lookup: {
          lookup_kind: "criterion",
          criterion_id: criterionByRoleV01(source.assessment, "manifest")
            .criterion_id,
          packet_ref: {
            record_kind: "task_context_packet",
            record_id: source.packet.packet_id,
            record_fingerprint: source.packet.integrity.fingerprint,
          },
          receipt_ref: {
            record_kind: "run_receipt",
            record_id: source.receipt.receipt_id,
            record_fingerprint: source.receipt.integrity.fingerprint,
          },
        },
      });
    const completedLineage = exactLineage(completed);
    const failedLineage = exactLineage(failed);
    assert.notEqual(
      completed.assessment.assessment_fingerprint,
      failed.assessment.assessment_fingerprint,
    );
    const completedCriterionNode = assertPresentV01(
      completedLineage.nodes.find((node) => node.node_kind === "criterion"),
    );
    const failedCriterionNode = assertPresentV01(
      failedLineage.nodes.find((node) => node.node_kind === "criterion"),
    );
    assert.notEqual(
      completedCriterionNode.node_id,
      failedCriterionNode.node_id,
    );
    assert.equal(
      completedCriterionNode.record_fingerprint,
      completed.assessment.assessment_fingerprint,
    );
    assert.equal(
      failedCriterionNode.record_fingerprint,
      failed.assessment.assessment_fingerprint,
    );
    for (const [source, criterion, lineage] of [
      [completed, completedManifest, completedLineage],
      [failed, failedManifest, failedLineage],
    ] as const) {
      const exactRelationRef = assertPresentV01(
        criterion.supporting_refs[0] ?? criterion.opposing_refs[0],
      );
      const exactEvidence = assertPresentV01(
        source.verifyMaterial.evidence_records.find((record) =>
          record.source_refs.some(
            (ref) =>
              canonicalizeProtocolValueV01(ref) ===
              canonicalizeProtocolValueV01(exactRelationRef),
          ),
        ),
      );
      assert.equal(
        lineage.nodes.some(
          (node) =>
            node.node_kind === "criterion_relation_residue" &&
            node.record_id === exactRelationRef.external_id,
        ),
        true,
      );
      assert.equal(
        lineage.nodes.some(
          (node) =>
            node.node_kind === "evidence_record" &&
            node.record_id === exactEvidence.evidence_id &&
            node.record_fingerprint === exactEvidence.integrity.fingerprint,
        ),
        true,
      );
      assert.notEqual(lineage.completeness.status, "bounded_incomplete");
    }
    assert.equal(completedManifest.status, "satisfied");
    assert.equal(failedManifest.status, "unsatisfied");
  } finally {
    db.close();
  }
}

function assertProductionVerifyLifecycleGoldenV01(
  db: Database.Database,
  source: ReturnType<typeof productionSourceMaterialV01>,
  material: ReturnType<typeof materializeRunCriterionProjectVerifyMaterialV01>,
): void {
  const scope = {
    workspace_id: source.packet.workspace_id,
    project_id: source.packet.project_id,
  };
  const manifestProposition =
    LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.success_criteria[
      PRODUCTION_CRITERION_INDEX_V01.manifest
    ];
  const claim = material.claim_records.find(
    (candidate) => candidate.proposition === manifestProposition,
  );
  assert(claim, "missing exact production manifest Claim candidate");
  const relation = material.relations.find(
    (candidate) =>
      candidate.claim_ref.record_id === claim.claim_id &&
      candidate.relation_kind === "supports",
  );
  assert(relation, "missing exact production manifest support relation");

  const beforeLifecycleProposal = durableAuthoritySnapshotV01(db, scope);
  const claimProposalMaterial =
    materializeProjectVerifyClaimLifecycleProposalV01(db, {
      ...scope,
      claim_id: claim.claim_id,
      observed_at: productionLifecycleTimestampV01(9, 0),
    });
  assert.deepEqual(
    durableAuthoritySnapshotV01(db, scope),
    beforeLifecycleProposal,
    "lifecycle proposal materialization is read-only",
  );
  assert.equal(
    admitProjectVerifyLifecycleProposalV01(db, claimProposalMaterial).status,
    "inserted",
  );
  assert.deepEqual(
    durableAuthoritySnapshotV01(db, scope),
    beforeLifecycleProposal,
    "recording a lifecycle proposal creates no decision or applied state",
  );

  const claimDecision = buildProductionLifecycleDecisionV01(
    claimProposalMaterial.proposal,
    10,
  );
  assert.deepEqual(
    durableAuthoritySnapshotV01(db, scope),
    beforeLifecycleProposal,
    "constructing a ReviewDecision performs no write",
  );
  const claimApplied = applyProductionLifecycleV01({
    db,
    scope,
    proposal: claimProposalMaterial.proposal,
    decision: claimDecision,
    cycle: 10,
    expected_authority_before_review: beforeLifecycleProposal,
  });
  assertCurrentProductionLifecycleBindingV01({
    db,
    scope,
    proposal: claimProposalMaterial.proposal,
    transition_receipt_id:
      claimApplied.transition_receipt.transition_receipt_id,
    transition_receipt_fingerprint:
      claimApplied.transition_receipt.integrity.fingerprint,
  });
  assert.equal(claim.lifecycle.application_status, "not_applied");
  assert.equal(claim.lifecycle.truth_status, "not_established");

  const beforeClaimLaterPacket = durableAuthoritySnapshotV01(db, scope);
  const claimLater = compileTaskContextPacketFromPersistedSemanticStateV01(db, {
    ...scope,
    prior_packet: source.packet,
    transition_receipt_id:
      claimApplied.transition_receipt.transition_receipt_id,
    transition_receipt_fingerprint:
      claimApplied.transition_receipt.integrity.fingerprint,
    expiry_policy: { mode: "explicit", expires_at: null },
    clock: fixedProductionLifecycleClockV01(
      productionLifecycleTimestampV01(15, 0),
    ),
  });
  assert.equal(claimLater.status, "inserted");
  assert.equal(claimLater.full_chain_relation.status, "valid");
  assert.equal(claimLater.current_state_entries.length, 1);
  assertLaterPacketTransitionRefV01(
    claimLater.later_packet,
    claimApplied.transition_receipt.transition_receipt_id,
    claimApplied.transition_receipt.integrity.fingerprint,
  );
  assert.deepEqual(
    durableAuthoritySnapshotV01(db, scope),
    beforeClaimLaterPacket,
    "the existing context compiler reads applied Claim state without lifecycle writes",
  );

  const relationProposalMaterial =
    materializeProjectVerifyRelationLifecycleProposalV01(db, {
      ...scope,
      relation_id: relation.relation_id,
      observed_at: productionLifecycleTimestampV01(19, 0),
    });
  const beforeRelationProposal = durableAuthoritySnapshotV01(db, scope);
  assert.equal(
    admitProjectVerifyLifecycleProposalV01(db, relationProposalMaterial).status,
    "inserted",
  );
  assert.deepEqual(
    durableAuthoritySnapshotV01(db, scope),
    beforeRelationProposal,
    "recording a relation lifecycle proposal does not apply its Claim or relation",
  );
  const relationDecision = buildProductionLifecycleDecisionV01(
    relationProposalMaterial.proposal,
    20,
  );
  const relationApplied = applyProductionLifecycleV01({
    db,
    scope,
    proposal: relationProposalMaterial.proposal,
    decision: relationDecision,
    cycle: 20,
    expected_authority_before_review: beforeRelationProposal,
  });
  assertCurrentProductionLifecycleBindingV01({
    db,
    scope,
    proposal: relationProposalMaterial.proposal,
    transition_receipt_id:
      relationApplied.transition_receipt.transition_receipt_id,
    transition_receipt_fingerprint:
      relationApplied.transition_receipt.integrity.fingerprint,
  });
  assert.equal(relation.lifecycle.application_status, "not_applied");
  assert.equal(relation.lifecycle.relation_status, "not_established");
  assert.equal(claim.lifecycle.truth_status, "not_established");

  const beforeLaterPacket = durableAuthoritySnapshotV01(db, scope);
  const later = compileTaskContextPacketFromPersistedSemanticStateV01(db, {
    ...scope,
    prior_packet: claimLater.later_packet,
    transition_receipt_id:
      relationApplied.transition_receipt.transition_receipt_id,
    transition_receipt_fingerprint:
      relationApplied.transition_receipt.integrity.fingerprint,
    expiry_policy: { mode: "explicit", expires_at: null },
    clock: fixedProductionLifecycleClockV01(
      productionLifecycleTimestampV01(30, 0),
    ),
  });
  assert.equal(later.status, "inserted");
  assert.equal(later.full_chain_relation.status, "valid");
  assert.equal(later.current_state_entries.length, 2);
  assertLaterPacketTransitionRefV01(
    later.later_packet,
    relationApplied.transition_receipt.transition_receipt_id,
    relationApplied.transition_receipt.integrity.fingerprint,
  );
  assert.deepEqual(
    durableAuthoritySnapshotV01(db, scope),
    beforeLaterPacket,
    "the existing context compiler reads applied state without adding lifecycle authority",
  );

  const relationContextReview = recordProductionLifecycleContextUseReviewV01({
    db,
    scope,
    prior_packet: claimLater.later_packet,
    later_packet: later.later_packet,
    transition_receipt: relationApplied.transition_receipt,
  });
  assert.equal(relationContextReview.status, "inserted");
  const secondRelationContextReview =
    recordProductionLifecycleContextUseReviewV01({
      db,
      scope,
      prior_packet: claimLater.later_packet,
      later_packet: later.later_packet,
      transition_receipt: relationApplied.transition_receipt,
      variant: 1,
    });
  assert.equal(secondRelationContextReview.status, "inserted");
  assert.notEqual(
    secondRelationContextReview.review.review_id,
    relationContextReview.review.review_id,
  );
  assertLaterContextEnvelopeForgeryRefusedV01({
    db,
    scope,
    later_packet: later.later_packet,
    transition_receipt: relationApplied.transition_receipt,
    later_receipt_id: relationContextReview.receipt.receipt_id,
    context_use_review_id: relationContextReview.review.review_id,
    other_context_use_review_id: secondRelationContextReview.review.review_id,
  });

  const userRevision = buildUserAuthoredProductionClaimRevisionV01({
    prior: claim,
    operation: "revise",
    proposition: `User-authored correction candidate: ${claim.proposition}`,
    created_at: productionLifecycleTimestampV01(35, 0),
  });
  const beforeUserRevision = durableAuthoritySnapshotV01(db, scope);
  assert.equal(
    admitClaimRecordV01(db, { ...scope, claim: userRevision }).status,
    "inserted",
  );
  assert.deepEqual(
    durableAuthoritySnapshotV01(db, scope),
    beforeUserRevision,
    "recording a user-authored Claim revision creates no lifecycle authority",
  );
  assert.equal(userRevision.claim_family_id, claim.claim_family_id);
  assert.equal(userRevision.producer.producer_kind, "user");
  assert.notEqual(userRevision.proposition, claim.proposition);
  const userRevisionProposal =
    materializeProjectVerifyClaimLifecycleProposalV01(db, {
      ...scope,
      claim_id: userRevision.claim_id,
      observed_at: productionLifecycleTimestampV01(39, 0),
    });
  assert.equal(
    admitProjectVerifyLifecycleProposalV01(db, userRevisionProposal).status,
    "inserted",
  );
  const beforeUserRevisionDecision = durableAuthoritySnapshotV01(db, scope);
  const userRevisionDecision = buildProductionLifecycleDecisionV01(
    userRevisionProposal.proposal,
    40,
    claimDecision,
  );
  const userRevisionApplied = applyProductionLifecycleV01({
    db,
    scope,
    proposal: userRevisionProposal.proposal,
    decision: userRevisionDecision,
    cycle: 40,
    expected_authority_before_review: beforeUserRevisionDecision,
    assert_before_commit: (preview) => {
      assertCurrentProductionLifecycleBindingV01({
        db,
        scope,
        proposal: claimProposalMaterial.proposal,
        transition_receipt_id:
          claimApplied.transition_receipt.transition_receipt_id,
        transition_receipt_fingerprint:
          claimApplied.transition_receipt.integrity.fingerprint,
      });
      const expectedFutureStateFingerprint =
        preview.intended_effects[0]?.expected_after_state_fingerprint;
      assert(expectedFutureStateFingerprint);
      assert.equal(
        later.later_packet.selected_context.some(
          (entry) => entry.source_ref === expectedFutureStateFingerprint,
        ),
        false,
        "a decision and authorized gate do not place the pending Claim revision into an already compiled later packet",
      );
    },
  });
  assertCurrentProductionLifecycleBindingV01({
    db,
    scope,
    proposal: userRevisionProposal.proposal,
    transition_receipt_id:
      userRevisionApplied.transition_receipt.transition_receipt_id,
    transition_receipt_fingerprint:
      userRevisionApplied.transition_receipt.integrity.fingerprint,
  });
  const revisionLater = compileTaskContextPacketFromPersistedSemanticStateV01(
    db,
    {
      ...scope,
      prior_packet: later.later_packet,
      transition_receipt_id:
        userRevisionApplied.transition_receipt.transition_receipt_id,
      transition_receipt_fingerprint:
        userRevisionApplied.transition_receipt.integrity.fingerprint,
      expiry_policy: { mode: "explicit", expires_at: null },
      clock: fixedProductionLifecycleClockV01(
        productionLifecycleTimestampV01(45, 0),
      ),
    },
  );
  assert.equal(revisionLater.full_chain_relation.status, "valid");
  assert.equal(revisionLater.current_state_entries.length, 2);
  assertLaterPacketTransitionRefV01(
    revisionLater.later_packet,
    userRevisionApplied.transition_receipt.transition_receipt_id,
    userRevisionApplied.transition_receipt.integrity.fingerprint,
  );

  const retraction = buildUserAuthoredProductionClaimRevisionV01({
    prior: userRevision,
    operation: "retract",
    proposition: userRevision.proposition,
    created_at: productionLifecycleTimestampV01(50, 0),
  });
  assertCanonicalProtocolEqualV01(
    {
      family_origin: retraction.family_origin,
      proposition: retraction.proposition,
      subject_refs: retraction.subject_refs,
      applicability_scope: retraction.applicability_scope,
    },
    {
      family_origin: userRevision.family_origin,
      proposition: userRevision.proposition,
      subject_refs: userRevision.subject_refs,
      applicability_scope: userRevision.applicability_scope,
    },
  );
  const beforeRetraction = durableAuthoritySnapshotV01(db, scope);
  assert.equal(
    admitClaimRecordV01(db, { ...scope, claim: retraction }).status,
    "inserted",
  );
  assert.deepEqual(
    durableAuthoritySnapshotV01(db, scope),
    beforeRetraction,
    "a pure immutable retraction candidate does not remove or apply state",
  );
  const retractionProposal = materializeProjectVerifyClaimLifecycleProposalV01(
    db,
    {
      ...scope,
      claim_id: retraction.claim_id,
      observed_at: productionLifecycleTimestampV01(54, 0),
    },
  );
  assert.equal(
    admitProjectVerifyLifecycleProposalV01(db, retractionProposal).status,
    "inserted",
  );
  const beforeRetractionDecision = durableAuthoritySnapshotV01(db, scope);
  const retractionDecision = buildProductionLifecycleDecisionV01(
    retractionProposal.proposal,
    55,
    userRevisionDecision,
  );
  const retracted = applyProductionLifecycleV01({
    db,
    scope,
    proposal: retractionProposal.proposal,
    decision: retractionDecision,
    cycle: 55,
    expected_authority_before_review: beforeRetractionDecision,
  });
  assertRetractedProductionLifecycleBindingV01({
    db,
    scope,
    proposal: retractionProposal.proposal,
    transition_receipt_id: retracted.transition_receipt.transition_receipt_id,
    transition_receipt_fingerprint:
      retracted.transition_receipt.integrity.fingerprint,
  });
  for (const immutableClaim of [claim, userRevision, retraction]) {
    const envelope = readVNextCoreRecordV01(db, {
      ...scope,
      record_kind: "claim_record",
      record_id: immutableClaim.claim_id,
    });
    assert(envelope);
    assertCanonicalProtocolEqualV01(envelope.payload, immutableClaim);
  }
  const postRetract = compileTaskContextPacketFromPersistedSemanticStateV01(
    db,
    {
      ...scope,
      prior_packet: revisionLater.later_packet,
      transition_receipt_id: retracted.transition_receipt.transition_receipt_id,
      transition_receipt_fingerprint:
        retracted.transition_receipt.integrity.fingerprint,
      expiry_policy: { mode: "explicit", expires_at: null },
      clock: fixedProductionLifecycleClockV01(
        productionLifecycleTimestampV01(60, 0),
      ),
    },
  );
  assert.equal(postRetract.full_chain_relation.status, "valid");
  assert.equal(postRetract.current_state_entries.length, 1);
  const claimTargetKey = deriveVNextSemanticTargetKeyV01(
    retractionProposal.proposal.project_verify_lifecycle!.lifecycle_binding
      .family_target_ref,
  );
  assert.equal(
    postRetract.current_state_entries.some(
      (entry) => entry.target_key === claimTargetKey,
    ),
    false,
    "post-retract current state excludes the Claim family",
  );
  assert.equal(
    postRetract.later_packet.selected_context.some(
      (entry) =>
        entry.external_ref?.external_id ===
        userRevisionApplied.semantic_state?.state_ref.external_id,
    ),
    false,
    "post-retract context does not reactivate an older Claim revision",
  );
  assertLaterPacketTransitionRefV01(
    postRetract.later_packet,
    retracted.transition_receipt.transition_receipt_id,
    retracted.transition_receipt.integrity.fingerprint,
  );

  insertLaterContextSliceFillersV01(db, scope);
  const beforeReads = durableAuthoritySnapshotV01(db, scope);
  const reconciliation = readProjectVerifyReconciliationV01(db, {
    ...scope,
    observed_at: productionLifecycleTimestampV01(61, 0),
  });
  assert.equal(reconciliation.completeness.status, "bounded_incomplete");
  const claimFamily = reconciliation.claim_families.find(
    (candidate) => candidate.claim_family_id === claim.claim_family_id,
  );
  assert(claimFamily, "missing production Claim lifecycle reconciliation");
  assert.equal(claimFamily.revisions.length, 3);
  assert.equal(claimFamily.applied_current_head_ref, null);
  assert.equal(reconciliation.summary.retracted, true);
  assert.equal(
    claimFamily.revisions.every(
      (revision) =>
        revision.lifecycle.truth.claim_truth === "not_established" &&
        revision.lifecycle.truth.evidence_acceptance ===
          "not_established_by_reconciliation",
    ),
    true,
  );
  const relationFamily = reconciliation.relation_families.find(
    (candidate) => candidate.relation_family_id === relation.relation_family_id,
  );
  assert(
    relationFamily,
    "missing production relation lifecycle reconciliation",
  );
  assert.equal(
    relationFamily.applied_current_head_ref?.record_id,
    relation.relation_id,
  );
  assert.equal(reconciliation.applied_relation_material.supports.length, 1);
  assert.equal(reconciliation.summary.support_present, true);
  assert.equal(reconciliation.summary.applied_current, true);
  assert.equal(reconciliation.summary.claim_truth, "not_established");
  assert.equal(reconciliation.authority.writes_database, false);
  assert.equal(reconciliation.authority.establishes_truth, false);
  assert.equal(
    reconciliation.later_context.some(
      (entry) =>
        entry.source_transition_receipt_ref.record_id ===
          relationApplied.transition_receipt.transition_receipt_id &&
        entry.later_packet_ref?.record_id === later.later_packet.packet_id &&
        entry.context_use_review_ref?.record_id ===
          relationContextReview.review.review_id &&
        entry.status === "feedback_recorded",
    ),
    true,
  );
  assert.equal(
    reconciliation.later_context.some(
      (entry) =>
        entry.source_transition_receipt_ref.record_id ===
          relationApplied.transition_receipt.transition_receipt_id &&
        entry.later_packet_ref?.record_id === later.later_packet.packet_id &&
        entry.context_use_review_ref?.record_id ===
          secondRelationContextReview.review.review_id &&
        entry.status === "feedback_recorded",
    ),
    true,
    "multiple exact reviews for one later packet remain separate truthful chains",
  );

  const lineage = readProjectVerifyLineageV01(db, {
    ...scope,
    observed_at: productionLifecycleTimestampV01(61, 1),
    lookup: {
      lookup_kind: "claim_evidence_relation",
      relation_id: relation.relation_id,
      expected_fingerprint: relation.integrity.fingerprint,
    },
  });
  assert.equal(lineage.conflicts.length, 0);
  assert.equal(lineage.completeness.status, "complete");
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
    "context_use_review",
  ] as const) {
    assert.equal(
      lineage.nodes.some((node) => node.node_kind === nodeKind),
      true,
      `production lineage must include ${nodeKind}`,
    );
  }
  assert.equal(
    lineage.nodes.some(
      (node) =>
        node.node_kind === "context_use_review" &&
        node.record_id === relationContextReview.review.review_id &&
        node.record_fingerprint ===
          relationContextReview.review.integrity.fingerprint &&
        node.status === "present",
    ),
    true,
    "exact lifecycle lineage reaches the source-bound ContextUseReview",
  );
  assert.equal(
    lineage.nodes.some(
      (node) =>
        node.node_kind === "context_use_review" &&
        node.record_id === secondRelationContextReview.review.review_id &&
        node.record_fingerprint ===
          secondRelationContextReview.review.integrity.fingerprint,
    ),
    true,
  );
  assert.equal(
    lineage.stop.reason,
    "later_packet_feedback_pending",
    "the exact recorded review remains visible while later descendant packets without feedback stop truthfully at pending",
  );
  assert.equal(lineage.authority.writes_database, false);
  assert.equal(lineage.authority.establishes_truth, false);

  // Exact relation lookup expands its Claim endpoint and the complete Claim
  // family, so the same authenticated graph proves the retraction and its
  // later packet without rebuilding the full reconciliation a second time.
  assert.equal(
    lineage.nodes.some(
      (node) =>
        node.node_kind === "state_transition_receipt_effect" &&
        node.status === "retracted",
    ),
    true,
  );
  assert.equal(
    lineage.nodes.some(
      (node) =>
        node.node_kind === "later_task_context_packet" &&
        node.record_id === postRetract.later_packet.packet_id,
    ),
    true,
  );
  assert.equal(lineage.stop.reason, "later_packet_feedback_pending");
  assert.deepEqual(
    durableAuthoritySnapshotV01(db, scope),
    beforeReads,
    "reconciliation and exact lineage reads perform no lifecycle write",
  );
}

function assertLaterContextEnvelopeForgeryRefusedV01(input: {
  db: Database.Database;
  scope: { workspace_id: string; project_id: string };
  later_packet: TaskContextPacketV01;
  transition_receipt: StateTransitionReceiptV01;
  later_receipt_id: string;
  context_use_review_id: string;
  other_context_use_review_id: string;
}): void {
  const exactRecords = [
    {
      record_kind: "context_use_review" as const,
      record_id: input.context_use_review_id,
      expected_error: "project_verify_context_use_review_envelope_conflict",
      forged_idempotency_key: null,
      validate: assertProjectVerifyContextUseReviewEnvelopeV01,
    },
    {
      record_kind: "run_receipt" as const,
      record_id: input.later_receipt_id,
      expected_error:
        "project_verify_context_use_run_receipt_envelope_conflict",
      forged_idempotency_key: null,
      validate: assertProjectVerifyRunReceiptEnvelopeV01,
    },
    {
      record_kind: "task_context_packet" as const,
      record_id: input.later_packet.packet_id,
      expected_error: "project_verify_task_context_packet_envelope_conflict",
      forged_idempotency_key: `sha256:${"f".repeat(64)}`,
      validate: assertProjectVerifyTaskContextPacketEnvelopeV01,
    },
  ];
  for (const target of exactRecords) {
    const envelope = readVNextCoreRecordV01(input.db, {
      ...input.scope,
      record_kind: target.record_kind,
      record_id: target.record_id,
    });
    assert(envelope);
    assert.throws(
      () =>
        target.validate(
          {
            ...structuredClone(envelope),
            idempotency_key: target.forged_idempotency_key,
          },
          input.scope,
        ),
      new RegExp(target.expected_error),
      `${target.record_kind} envelope idempotency forgery fails standalone source validation`,
    );
    if (target.record_kind === "context_use_review") {
      const transition = loadValidatedVNextSemanticTransitionRelationV01(
        input.db,
        {
          ...input.scope,
          transition_receipt_id: input.transition_receipt.transition_receipt_id,
          transition_receipt_fingerprint:
            input.transition_receipt.integrity.fingerprint,
        },
      );
      assert.throws(
        () =>
          assertProjectVerifyContextUseReviewSourceBoundV01(
            input.db,
            input.scope,
            {
              ...structuredClone(envelope),
              idempotency_key: null,
            },
            input.later_packet,
            transition,
          ),
        new RegExp(target.expected_error),
        "a restored ContextUseReview envelope forgery cannot authenticate the mandatory source-bound read path",
      );
      const otherEnvelope = readVNextCoreRecordV01(input.db, {
        ...input.scope,
        record_kind: "context_use_review",
        record_id: input.other_context_use_review_id,
      });
      assert(otherEnvelope);
      assert.throws(
        () =>
          assertProjectVerifyContextUseReviewSourceBoundV01(
            input.db,
            input.scope,
            {
              ...structuredClone(envelope),
              payload: structuredClone(otherEnvelope.payload),
            },
            input.later_packet,
            transition,
          ),
        /project_verify_protocol_envelope_conflict|project_verify_context_use_review_envelope_conflict/,
        "one valid review payload cannot authenticate through another review envelope",
      );
    }
  }
}

function insertLaterContextSliceFillersV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
): void {
  for (let index = 1; index <= 257; index += 1) {
    const suffix = index.toString().padStart(3, "0");
    const packetFingerprint = `sha256:${index.toString(16).padStart(64, "0")}`;
    const reviewFingerprint = `sha256:${(index + 1024)
      .toString(16)
      .padStart(64, "0")}`;
    assert.equal(
      insertVNextCoreRecordV01(db, {
        record_kind: "task_context_packet",
        record_id: `bounded-later-packet-filler:${suffix}`,
        ...scope,
        fingerprint: packetFingerprint,
        idempotency_key: null,
        payload: { bounded_exact_later_context_fixture: true, index },
        created_at: productionLifecycleTimestampV01(60, 50),
      }).status,
      "inserted",
    );
    assert.equal(
      insertVNextCoreRecordV01(db, {
        record_kind: "context_use_review",
        record_id: `bounded-context-review-filler:${suffix}`,
        ...scope,
        fingerprint: reviewFingerprint,
        idempotency_key: null,
        payload: { bounded_exact_later_context_fixture: true, index },
        created_at: productionLifecycleTimestampV01(60, 50),
      }).status,
      "inserted",
    );
  }
}

function buildUserAuthoredProductionClaimRevisionV01(input: {
  prior: ClaimRecordV01;
  operation: "revise" | "retract";
  proposition: string;
  created_at: string;
}): ClaimRecordV01 {
  return buildClaimRecordV01({
    family_origin: structuredClone(input.prior.family_origin),
    workspace_id: input.prior.workspace_id,
    project_id: input.prior.project_id,
    revision: input.prior.revision + 1,
    prior_claim_ref: claimRecordReferenceV01(input.prior),
    operation_intent: input.operation,
    operation_target_claim_ref:
      input.operation === "retract"
        ? claimRecordReferenceV01(input.prior)
        : null,
    proposition: input.proposition,
    subject_refs: structuredClone(input.prior.subject_refs),
    applicability_scope: structuredClone(input.prior.applicability_scope),
    source_refs: [
      productionLifecycleRefV01(
        "user_claim_revision",
        `user:local-project-verification:${input.prior.claim_family_id}:${input.prior.revision + 1}:${input.operation}`,
        input.prior.integrity.fingerprint,
        input.created_at,
      ),
    ],
    limitations: [
      input.operation === "retract"
        ? "This is a pure immutable retraction candidate; it deletes no history and applies nothing by itself."
        : "This user-authored revision remains candidate material and is not source-bound observation.",
    ],
    uncertainty: [
      "Claim truth and application remain separately unestablished by this immutable record.",
    ],
    producer: {
      producer_kind: "user",
      producer_profile: "local-project-verification-user-candidate.v0.1",
    },
    created_at: input.created_at,
  });
}

function buildProductionLifecycleDecisionV01(
  proposal: EpisodeDeltaProposalV01,
  cycle: number,
  priorDecision: ReviewDecisionV01 | null = null,
): ReviewDecisionV01 {
  const profile = proposal.project_verify_lifecycle;
  const candidate = proposal.proposed_deltas[0];
  assert(profile);
  assert(candidate);
  const operation = profile.lifecycle_binding.selected_record_operation_intent;
  const decisionValue =
    operation === "supersede"
      ? ("supersede" as const)
      : operation === "retract"
        ? ("retract" as const)
        : ("accept" as const);
  const transitionKind =
    operation === "supersede"
      ? ("semantic_candidate_supersede" as const)
      : operation === "retract"
        ? ("semantic_candidate_retract" as const)
        : ("semantic_candidate_apply" as const);
  assert.equal(operation === "create", priorDecision === null);
  const decidedAt = productionLifecycleTimestampV01(cycle, 0);
  const sourceFingerprint = profile.integrity.fingerprint;
  const candidateBinding = {
    candidate_id: candidate.candidate_id,
    candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(candidate),
  };
  const input: ReviewDecisionBuilderInputV01 = {
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    source_proposal: {
      proposal_version: proposal.proposal_version,
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
    },
    candidate: candidateBinding,
    decision: decisionValue,
    actor_ref: productionLifecycleRefV01(
      "operator_actor",
      `operator:local-project-verification:${cycle}`,
      sourceFingerprint,
      decidedAt,
    ),
    authorization_basis_refs: [
      productionLifecycleRefV01(
        "operator_authorization_basis",
        `authorization:local-project-verification:${cycle}`,
        sourceFingerprint,
        decidedAt,
      ),
    ],
    decision_basis_material_ids: [...candidate.basis_material_ids],
    decision_basis_refs: [candidate.source_refs[0]!],
    rationale_summary:
      "The deterministic production proof records an explicit test operator decision; construction alone grants no application or truth authority.",
    decided_at: decidedAt,
    revisit: null,
    requested_transition_intent: {
      intent_id: `transition-intent:local-project-verification:${sourceFingerprint.slice(7, 23)}`,
      transition_kind: transitionKind,
      bounded_summary:
        "Request application of one exact project Verify family target through the existing semantic commit gate and Transition writer.",
      target_refs: [profile.lifecycle_binding.family_target_ref],
      intent_only: true,
      applied: false,
      state_transition_receipt_ref: null,
    },
    lineage: {
      prior_decisions: priorDecision
        ? [
            {
              decision_id: priorDecision.decision_id,
              decision_fingerprint: priorDecision.integrity.fingerprint,
            },
          ]
        : [],
      superseding_candidate:
        operation === "supersede" ? candidateBinding : null,
      retracted_decision:
        operation === "retract" && priorDecision
          ? {
              decision_id: priorDecision.decision_id,
              decision_fingerprint: priorDecision.integrity.fingerprint,
            }
          : null,
    },
    compatibility: {
      source_contracts: [
        proposal.proposal_version,
        profile.proposal_profile,
        profile.lifecycle_binding.binding_version,
      ],
      unmapped_fields: [],
      warnings: [
        "Claim truth and Evidence acceptance remain outside ReviewDecision.",
      ],
      external_refs: [],
    },
    authority_notes: [
      "Only a later successfully committed Transition may change the exact family head.",
    ],
  };
  const decision = buildReviewDecisionV01(input);
  assert.equal(validateReviewDecisionV01(decision).status, "valid");
  assert.equal(
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(decision, proposal)
      .status,
    "valid",
  );
  return decision;
}

function applyProductionLifecycleV01(input: {
  db: Database.Database;
  scope: { workspace_id: string; project_id: string };
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  cycle: number;
  expected_authority_before_review: ReturnType<
    typeof durableAuthoritySnapshotV01
  >;
  assert_before_commit?: (
    preview: ReturnType<typeof prepareVNextSemanticCommitPreviewV01>,
  ) => void;
}) {
  const persisted = persistVNextSemanticReviewMaterialV01(input.db, {
    proposal: input.proposal,
    decision: input.decision,
  });
  assert.equal(persisted.proposal_record.status, "exact_replay");
  assert.equal(persisted.decision_record.status, "inserted");
  const afterDecision = durableAuthoritySnapshotV01(input.db, input.scope);
  assert.deepEqual(afterDecision, {
    ...input.expected_authority_before_review,
    review_decisions:
      input.expected_authority_before_review.review_decisions + 1,
  });

  const preview = prepareVNextSemanticCommitPreviewV01(input.db, {
    ...input.scope,
    proposal_id: input.proposal.proposal_id,
    proposal_fingerprint: input.proposal.integrity.fingerprint,
    decision_id: input.decision.decision_id,
    decision_fingerprint: input.decision.integrity.fingerprint,
    authorized_applier_identity: {
      ref_type: "semantic_transition_applier",
      external_id: `local-core-applier:local-project-verification:${input.cycle}`,
    },
    gate_ttl_ms: 30_000,
    clock: fixedProductionLifecycleClockV01(
      productionLifecycleTimestampV01(input.cycle, 1),
      productionLifecycleTimestampV01(input.cycle, 2),
    ),
  });
  assert.deepEqual(
    durableAuthoritySnapshotV01(input.db, input.scope),
    afterDecision,
    "preview observes the current family head without applying it",
  );

  const authorization = recordVNextSemanticCommitAuthorizationV01(input.db, {
    preview,
    confirmation_digest: preview.confirmation_digest,
    operator_actor_ref: input.decision.actor_ref,
    clock: fixedProductionLifecycleClockV01(
      productionLifecycleTimestampV01(input.cycle, 3),
      productionLifecycleTimestampV01(input.cycle, 4),
      productionLifecycleTimestampV01(input.cycle, 5),
    ),
  });
  assert.equal(authorization.status, "inserted");
  assert.equal(authorization.eligibility.status, "eligible");
  assert.deepEqual(durableAuthoritySnapshotV01(input.db, input.scope), {
    ...afterDecision,
    semantic_commit_gates: afterDecision.semantic_commit_gates + 1,
  });
  input.assert_before_commit?.(preview);

  const committed = commitVNextSemanticTransitionV01(input.db, {
    ...input.scope,
    proposal_id: input.proposal.proposal_id,
    proposal_fingerprint: input.proposal.integrity.fingerprint,
    decision_id: input.decision.decision_id,
    decision_fingerprint: input.decision.integrity.fingerprint,
    gate_record_id: authorization.gate_record.gate_record_id,
    gate_record_fingerprint: authorization.gate_record.integrity.fingerprint,
    clock: fixedProductionLifecycleClockV01(
      productionLifecycleTimestampV01(input.cycle, 6),
      productionLifecycleTimestampV01(input.cycle, 7),
    ),
  });
  assert.equal(committed.status, "applied");
  return committed;
}

function recordProductionLifecycleContextUseReviewV01(input: {
  db: Database.Database;
  scope: { workspace_id: string; project_id: string };
  prior_packet: TaskContextPacketV01;
  later_packet: TaskContextPacketV01;
  transition_receipt: StateTransitionReceiptV01;
  variant?: number;
}) {
  const variant = input.variant ?? 0;
  const identitySuffix = variant === 0 ? "primary" : `variant-${variant}`;
  const startedAt = productionLifecycleTimestampV01(31 + variant, 0);
  const finishedAt = productionLifecycleTimestampV01(31 + variant, 1);
  const reviewedAt = productionLifecycleTimestampV01(31 + variant, 2);
  const sourceRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "local_test_observer",
    external_id: `project-verify-context-use-review-fixture:${identitySuffix}`,
    trust_class: "direct_local_observation",
    observed_at: finishedAt,
    source_ref: input.transition_receipt.integrity.fingerprint,
    compatibility_namespace: "project_verify_context_use_review_fixture.v0.1",
  };
  const packetRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "task_context_packet",
    external_id: input.later_packet.packet_id,
    trust_class: "direct_local_observation",
    observed_at: finishedAt,
    source_ref: input.later_packet.integrity.fingerprint,
    compatibility_namespace: "vnext_operator_pilot_later_result_intake.v0.1",
  };
  const transitionRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "state_transition_receipt",
    external_id: input.transition_receipt.transition_receipt_id,
    trust_class: "direct_local_observation",
    observed_at: finishedAt,
    source_ref: input.transition_receipt.integrity.fingerprint,
    compatibility_namespace: "vnext_operator_pilot_later_result_intake.v0.1",
  };
  const fixture = structuredClone(
    genericCliDirectObservationInputFixture,
  ) as RunReceiptBuilderInputV01;
  const laterReceipt = buildRunReceiptV01({
    ...fixture,
    workspace_id: input.scope.workspace_id,
    project_id: input.scope.project_id,
    run_id: `run:project-verify-later-context:${input.transition_receipt.transition_receipt_id}:${identitySuffix}`,
    work_ref: null,
    task_context_packet_ref: packetRef,
    recorded_at: finishedAt,
    started_at: startedAt,
    finished_at: finishedAt,
    execution: {
      status: "completed",
      basis: "observed",
      source_refs: [sourceRef],
    },
    verification: {
      status: "not_run",
      basis: "unknown",
      required_check_ids: [],
      source_refs: [],
    },
    reporter_ref: sourceRef,
    observer_refs: [sourceRef],
    verifier_refs: [],
    host_ref: null,
    worker_ref: sourceRef,
    model_invocations: [],
    execution_environment: {
      environment_kind: "local",
      host_ref: null,
      worker_ref: sourceRef,
      operating_system: null,
      runtime_labels: ["project_verify_context_use_review_fixture.v0.1"],
      source_refs: [sourceRef],
    },
    observations: [
      {
        observation_id: `observation:project-verify-later-task-completed:${identitySuffix}`,
        observation_kind: "later_task_completion",
        summary: "The bounded later task completed locally.",
        event_at: finishedAt,
        observed_at: finishedAt,
        observer_ref: sourceRef,
        trust_class: "direct_local_observation",
        source_refs: [sourceRef],
        related_command_ids: [],
        related_check_ids: [],
        related_artifact_refs: [],
      },
    ],
    attestations: [],
    changed_artifacts: [],
    commands: [],
    checks: [],
    skipped_checks: [],
    external_refs: [transitionRef],
    result_summary: {
      summary:
        "A bounded later task completed without asserting whether the applied context was used.",
      outcome: "Later task completed; context use remains unknown.",
      limitations: [
        "This receipt does not infer context use, Claim truth, or Evidence acceptance.",
      ],
    },
    blockers: [],
    warnings: [],
    gaps: [],
    privacy_egress: {
      data_classification: "local_only",
      egress_status: "did_not_occur",
      basis: "observed",
      destination_refs: [],
      redaction_status: "not_needed",
      retention_class: "bounded_structured_local_receipt_only",
      raw_prompt_persisted: false,
      raw_output_persisted: false,
      raw_transcript_persisted: false,
      secret_material_persisted: false,
      source_refs: [sourceRef],
      notes: ["The proof creates no provider, model, or network call."],
    },
    cost_usage: {
      cost_basis: "measured",
      cost_amount: 0,
      currency: "USD",
      usage: {
        basis: "measured",
        input_units: 0,
        output_units: 0,
        total_units: 0,
        unit: "model_tokens",
      },
      source_refs: [sourceRef],
    },
    capability_coverage: [],
    source_refs: [sourceRef, packetRef, transitionRef],
    artifact_refs: [],
    compatibility: {
      source_contracts: [
        "project_verify_context_use_review_fixture.v0.1",
        "vnext_operator_pilot_later_result_intake.v0.1",
      ],
      unmapped_fields: [],
      warnings: [],
      external_refs: [],
    },
    authority_notes: [
      "The later receipt grants no semantic, review, transition, or truth authority.",
    ],
  });
  const laterReceiptValidation = validateRunReceiptV01(laterReceipt);
  assert.equal(
    laterReceiptValidation.status,
    "valid",
    JSON.stringify(laterReceiptValidation),
  );
  assert.equal(
    admitStructuredRunReceiptV01(input.db, laterReceipt).status,
    "inserted",
  );

  const reviewerRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "local_operator_actor",
    external_id: `operator:project-verify-context-review:${identitySuffix}`,
    trust_class: "user_declaration",
    observed_at: reviewedAt,
    source_ref: laterReceipt.integrity.fingerprint,
    compatibility_namespace: "project_verify_context_use_review_fixture.v0.1",
  };
  const reviewerBasisRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "local_operator_session_action",
    external_id: `session:project-verify-context-review:${identitySuffix}`,
    trust_class: "direct_local_observation",
    observed_at: reviewedAt,
    source_ref: laterReceipt.integrity.fingerprint,
    compatibility_namespace: "project_verify_context_use_review_fixture.v0.1",
  };
  const review = buildContextUseReviewV01({
    workspace_id: input.scope.workspace_id,
    project_id: input.scope.project_id,
    prior_packet: {
      packet_version: input.prior_packet.packet_version,
      packet_id: input.prior_packet.packet_id,
      packet_fingerprint: input.prior_packet.integrity.fingerprint,
    },
    later_packet: {
      packet_version: input.later_packet.packet_version,
      packet_id: input.later_packet.packet_id,
      packet_fingerprint: input.later_packet.integrity.fingerprint,
    },
    source_transition_receipt: {
      transition_receipt_version:
        input.transition_receipt.transition_receipt_version,
      transition_receipt_id: input.transition_receipt.transition_receipt_id,
      transition_receipt_fingerprint:
        input.transition_receipt.integrity.fingerprint,
    },
    later_task_run_receipt: {
      receipt_version: laterReceipt.receipt_version,
      receipt_id: laterReceipt.receipt_id,
      receipt_fingerprint: laterReceipt.integrity.fingerprint,
    },
    reviewer_ref: reviewerRef,
    reviewer_authentication_basis_refs: [reviewerBasisRef],
    reviewed_at: reviewedAt,
    usage: { presented: "unknown", actually_used: "unknown" },
    assessment: "not_applicable",
    corrections: { correction_count: 0, summaries: [] },
    metrics: {
      wrong_context_correction_count: null,
      repeated_explanation_estimate: null,
      missing_critical_context_count: null,
      context_refs_used_count: null,
    },
    notes: ["Context use was not asserted by the bounded proof."],
    compatibility: {
      source_contracts: ["project_verify_context_use_review_fixture.v0.1"],
      unmapped_fields: [],
      warnings: [],
      external_refs: [],
    },
    authority_notes: [
      "This review cannot establish Claim truth or apply lifecycle state.",
    ],
  });
  const relationValidation = validateContextUseReviewRelationsV01(
    review,
    input.prior_packet,
    input.later_packet,
    input.transition_receipt,
    laterReceipt,
  );
  assert.equal(
    relationValidation.status,
    "valid",
    JSON.stringify(relationValidation),
  );
  const write = insertVNextCoreRecordV01(input.db, {
    record_kind: "context_use_review",
    record_id: review.review_id,
    workspace_id: review.workspace_id,
    project_id: review.project_id,
    fingerprint: review.integrity.fingerprint,
    idempotency_key: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        logical_identity:
          createVNextOperatorPilotContextUseReviewLogicalIdentityV01(review),
      }),
    ),
    payload: review,
    created_at: review.reviewed_at,
  });
  return { status: write.status, receipt: laterReceipt, review };
}

function assertCurrentProductionLifecycleBindingV01(input: {
  db: Database.Database;
  scope: { workspace_id: string; project_id: string };
  proposal: EpisodeDeltaProposalV01;
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
}): void {
  const binding = input.proposal.project_verify_lifecycle?.lifecycle_binding;
  assert(binding);
  const targetKey = deriveVNextSemanticTargetKeyV01(binding.family_target_ref);
  const head = readVNextSemanticTargetHeadV01(input.db, {
    ...input.scope,
    target_key: targetKey,
  });
  assert(head);
  assert.equal(head.presence, "present");
  assert.equal(head.source_transition_receipt_id, input.transition_receipt_id);
  assert.equal(
    head.source_transition_receipt_fingerprint,
    input.transition_receipt_fingerprint,
  );
  const projection = readVNextSemanticStateEntryV01(input.db, {
    ...input.scope,
    target_key: targetKey,
  });
  assert(projection);
  assert.equal(head.current_state_fingerprint, projection.state_fingerprint);
  const stateEnvelope = readVNextCoreRecordV01(input.db, {
    record_kind: "semantic_state",
    record_id: projection.state_ref.external_id,
    ...input.scope,
  });
  assert(stateEnvelope);
  const state = rebuildVNextPersistedSemanticStateV01(stateEnvelope.payload);
  assert.equal(state.state_content_fingerprint, projection.state_fingerprint);
  assertCanonicalProtocolEqualV01(
    state.state_content.project_verify_lifecycle_binding,
    binding,
  );
}

function assertRetractedProductionLifecycleBindingV01(input: {
  db: Database.Database;
  scope: { workspace_id: string; project_id: string };
  proposal: EpisodeDeltaProposalV01;
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
}): void {
  const binding = input.proposal.project_verify_lifecycle?.lifecycle_binding;
  assert(binding);
  const targetKey = deriveVNextSemanticTargetKeyV01(binding.family_target_ref);
  const head = readVNextSemanticTargetHeadV01(input.db, {
    ...input.scope,
    target_key: targetKey,
  });
  assert(head);
  assert.equal(head.presence, "absent");
  assert.equal(head.current_state_fingerprint, null);
  assert.equal(head.source_transition_receipt_id, input.transition_receipt_id);
  assert.equal(
    head.source_transition_receipt_fingerprint,
    input.transition_receipt_fingerprint,
  );
  assert.equal(
    readVNextSemanticStateEntryV01(input.db, {
      ...input.scope,
      target_key: targetKey,
    }),
    null,
  );
}

function productionLifecycleRefV01(
  refType: string,
  externalId: string,
  sourceRef: string,
  observedAt: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: observedAt,
    source_ref: sourceRef,
    compatibility_namespace: "project_verify_lifecycle_proposal.v0.1",
    trust_class: "user_declaration",
  };
}

function assertLaterPacketTransitionRefV01(
  packet: TaskContextPacketV01,
  transitionReceiptId: string,
  transitionReceiptFingerprint: string,
): void {
  assert.equal(
    packet.compatibility.source_refs.some(
      (ref) =>
        ref.ref_type === "state_transition_receipt" &&
        ref.external_id === transitionReceiptId &&
        ref.source_ref === transitionReceiptFingerprint,
    ),
    true,
  );
}

function fixedProductionLifecycleClockV01(...timestamps: string[]) {
  assert(timestamps.length > 0);
  let index = 0;
  return {
    now() {
      const value = timestamps[Math.min(index, timestamps.length - 1)]!;
      if (index < timestamps.length - 1) index += 1;
      return value;
    },
  };
}

function productionLifecycleTimestampV01(
  cycle: number,
  offsetSeconds: number,
): string {
  return new Date(
    Date.parse(TEST_AT) + cycle * 60_000 + offsetSeconds * 1_000,
  ).toISOString();
}

function durableAuthoritySnapshotV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
) {
  const recordScope = {
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
  };
  return {
    review_decisions: countVNextCoreRecordsV01(db, {
      ...recordScope,
      record_kind: "review_decision",
    }),
    semantic_commit_gates: countVNextCoreRecordsV01(db, {
      ...recordScope,
      record_kind: "semantic_commit_gate",
    }),
    state_transition_receipts: countVNextCoreRecordsV01(db, {
      ...recordScope,
      record_kind: "state_transition_receipt",
    }),
    semantic_state_records: countVNextCoreRecordsV01(db, {
      ...recordScope,
      record_kind: "semantic_state",
    }),
    semantic_state_entries: (
      db
        .prepare(
          `SELECT COUNT(*) AS count
           FROM vnext_semantic_state_entries
           WHERE workspace_id = ? AND project_id = ?`,
        )
        .get(scope.workspace_id, scope.project_id) as { count: number }
    ).count,
    semantic_target_heads: (
      db
        .prepare(
          `SELECT COUNT(*) AS count
           FROM vnext_semantic_target_heads
           WHERE workspace_id = ? AND project_id = ?`,
        )
        .get(scope.workspace_id, scope.project_id) as { count: number }
    ).count,
  };
}

function assertCanonicalProtocolEqualV01(
  actual: unknown,
  expected: unknown,
): void {
  assert.equal(
    canonicalizeProtocolValueV01(actual),
    canonicalizeProtocolValueV01(expected),
  );
}

function criterionByRoleV01(
  assessment: CriterionAssessmentV01,
  role: ProductionCriterionRoleV01,
): CriterionAssessmentItemV01 {
  const expected =
    LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.success_criteria[
      PRODUCTION_CRITERION_INDEX_V01[role]
    ];
  const criterion = assessment.criteria.find(
    (candidate) => candidate.criterion === expected,
  );
  assert(criterion, `missing production assessment criterion for ${role}`);
  return criterion;
}

function assertLocalDeliveryV01(result: NativeHostResultV01): void {
  const adapter = {
    adapter_version: "local_project_verification_adapter.v0.1",
    execution_profile: "deterministic_zero_model" as const,
    provider_egress: "forbidden" as const,
  };
  const authority = deriveNativeHostDeliveryAuthorityV01({
    adapter,
    result,
    adapter_invocation_started: true,
  });
  assert.deepEqual(authority, {
    authority_version: "native_host_delivery_authority.v0.1",
    packet_presented_to_adapter: true,
    privacy_or_external_egress_occurred: false,
    provider_or_model_egress_occurred: false,
    delivery_scope: "local_in_process",
    validated_packet_delivery_observed: true,
  });
  const materialized = materializeValidatedPacketDeliveryCheckV01({
    adapter,
    result,
    adapter_invocation_started: true,
  });
  assert.equal(
    materialized.checks.filter(
      (check) =>
        check.check_id === "validated_packet_delivery" &&
        check.status === "passed",
    ).length,
    1,
  );
  assert.equal(materialized.model_invocation_receipt_refs.length, 0);
}

function assertNoInvocationDeliveryV01(): void {
  const result: NativeHostResultV01 = {
    result_version: "native_host_result.v0.1",
    request_id: "host-request:not-started",
    run_id: "host-run:not-started",
    outcome: "failed",
    public_stop_reason: "adapter_invocation_not_started",
    started_at: TEST_AT,
    finished_at: TEST_AT,
    host_refs: [],
    adapter_version: "local_project_verification_adapter.v0.1",
    capability_version: "local_project_verification_capability.v0.1",
    changed_files: [],
    artifacts: [],
    observed_actions: [],
    commands: [],
    checks: [],
    skipped_checks: [],
    model_invocation_receipt_refs: [],
    summary: "Adapter invocation did not begin.",
    uncertainty: [],
    gaps: [],
    proposed_next_steps: [],
    capability_coverage: [],
    adapter_extension: {
      extension_version: "native_host_boundary_extension.v0.1",
      adapter_kind: "local_project_verification_adapter.v0.1",
      bounded_metadata: {
        live_host_invoked: false,
        packet_delivery_initiated: false,
        raw_provider_payload_included: false,
      },
    },
  };
  const adapter = {
    adapter_version: "local_project_verification_adapter.v0.1",
    execution_profile: "deterministic_zero_model" as const,
    provider_egress: "forbidden" as const,
  };
  const authority = deriveNativeHostDeliveryAuthorityV01({
    adapter,
    result,
    adapter_invocation_started: false,
  });
  assert.equal(authority.packet_presented_to_adapter, false);
  assert.equal(authority.validated_packet_delivery_observed, false);
  assert.equal(authority.privacy_or_external_egress_occurred, false);
  assert.equal(authority.provider_or_model_egress_occurred, false);
  assert.equal(
    materializeValidatedPacketDeliveryCheckV01({
      adapter,
      result,
      adapter_invocation_started: false,
    }).checks.length,
    0,
  );
}

function assertNegativeResidueV01(
  result: NativeHostResultV01,
  outcome: NativeHostResultV01["outcome"],
): void {
  assert.equal(result.outcome, outcome);
  assert.equal(result.artifacts.length, 0);
  assert.equal(
    result.observed_actions.includes(
      "fingerprinted_bounded_project_root_manifest",
    ),
    false,
  );
  assert.equal(
    result.checks.some(
      (check) =>
        check.check_id === "project_root_manifest_verified" &&
        check.status === "passed",
    ),
    false,
  );
  assert.equal(
    actionReceiptObservationsV01(result).some(
      (observation) =>
        observation.summary === "fingerprinted_bounded_project_root_manifest",
    ),
    false,
  );
  assert.equal(
    result.capability_coverage.some(
      (entry) =>
        entry.capability === "provider_or_model_egress" &&
        entry.coverage === "enforced",
    ),
    true,
  );
}

function actionReceiptObservationsV01(result: NativeHostResultV01) {
  const sourceFingerprint = `sha256:${"c".repeat(64)}`;
  return projectDirectNativeHostActionObservationsV01({
    result,
    run_ref: refV01("automation_run", result.run_id, sourceFingerprint),
    adapter_ref: refV01(
      "native_host_adapter_version",
      result.adapter_version,
      sourceFingerprint,
    ),
    reporter_ref: refV01(
      "native_host_orchestrator",
      "direct_native_host_round_trip.v0.1",
      sourceFingerprint,
    ),
  });
}

async function invokeV01(
  request: NativeHostRequestV01,
  filesystem?: LocalProjectVerificationFilesystemV01,
  cancellationSignal = new AbortController().signal,
): Promise<NativeHostResultV01> {
  let tick = 0;
  const adapter = createLocalProjectVerificationAdapterV01({
    filesystem,
    now: () => new Date(Date.parse(TEST_AT) + tick++).toISOString(),
  });
  const result = await adapter.invoke(request, {
    cancellation_signal: cancellationSignal,
    timeout_ms: 30_000,
    stop_settle_timeout_ms: 1_000,
  }).result;
  return assertNativeHostResultV01(request, result);
}

function filesystemV01(
  openDirectory: LocalProjectVerificationFilesystemV01["openDirectory"],
): LocalProjectVerificationFilesystemV01 {
  return { realpath, stat, openDirectory };
}

function requestV01(
  canonicalRoot: string,
  physicalIdentity: NativeHostPhysicalRootIdentityV01,
): NativeHostRequestV01 {
  const packetInput = structuredClone(genericCliBuilderInputFixture);
  const packet = buildTaskContextPacketV01({
    ...packetInput,
    task: structuredClone(LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01),
    constraints: {
      ...packetInput.constraints,
      required_checks: [...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01],
    },
    criterion_verification_plan:
      createLocalProjectRootCriterionVerificationPlanV01({
        workspace_id: packetInput.workspace_id,
        project_id: packetInput.project_id,
      }),
    return_contract: {
      ...packetInput.return_contract,
      required_checks: [...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01],
      expected_artifacts: [
        ...LOCAL_PROJECT_ROOT_VERIFICATION_EXPECTED_OUTPUTS_V01,
      ],
    },
  });
  const scopeFingerprint = `sha256:${"a".repeat(64)}`;
  const workRef = refV01(
    "automation_work_item",
    "work:local-verification",
    scopeFingerprint,
  );
  const packetRef = refV01(
    "task_context_packet",
    packet.packet_id,
    packet.integrity.fingerprint,
  );
  return {
    request_version: "native_host_request.v0.1",
    request_id: "host-request:local-verification",
    run_id: "host-run:local-verification",
    idempotency_key: `sha256:${"b".repeat(64)}`,
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    work_ref: workRef,
    task_ref: refV01(
      "task_definition",
      "task:local-verification",
      scopeFingerprint,
    ),
    task_context_packet_ref: packetRef,
    packet,
    packet_lineage: {
      source_transition_receipt_ref: refV01(
        "state_transition_receipt",
        "transition:fixture",
        scopeFingerprint,
      ),
      packet_source_refs: [],
      selected_context_refs: [],
    },
    mode: "policy_triggered",
    root_scope: {
      canonical_root: canonicalRoot,
      path_flavor: "posix",
      root_kind: "plain_folder",
      root_fingerprint: scopeFingerprint,
      physical_root_identity: physicalIdentity,
      root_scope_ref: refV01(
        "project_root_scope",
        packet.project_id,
        scopeFingerprint,
      ),
      repository_ref: null,
      selected_worktree_ref: null,
    },
    requested_capability: "project_scoped_structured_task_round_trip.v0.1",
    allowed_operation_categories: [
      "read_validated_task_context",
      "return_bounded_structured_result",
    ],
    forbidden_operation_categories: [
      "network_egress",
      "provider_or_model_call",
      "external_state_mutation",
    ],
    packet_capability_grant: packet.capability_grant,
    execution_grant_ref: null,
    automation_context: null,
    policy: {
      filesystem: "selected_project_root_only",
      network: "forbidden",
      commands: "forbidden_in_deterministic_adapter",
      model: "forbidden_in_deterministic_adapter",
      host_egress: "forbidden",
      max_changed_files: 0,
      max_artifacts: 1,
      max_commands: 0,
      max_checks: 16,
      timeout_ms: 30_000,
      stop_settle_timeout_ms: 1_000,
      stop_conditions: ["timeout", "cancellation_requested"],
    },
    result_return: {
      return_version: "native_host_result_return.v0.1",
      structured_result_required: true,
      legacy_result_text_allowed: false,
      raw_output_allowed: false,
      max_result_bytes: 128 * 1024,
    },
  };
}

function directoryFixtureV01(
  count: number,
  options: {
    after_read?: (reads: number) => void;
    fail_at_read?: number;
  } = {},
): {
  handle: BoundedProjectRootDirectoryHandleV01;
  reads(): number;
  closed(): boolean;
} {
  let index = 0;
  let reads = 0;
  let closed = false;
  const handle: BoundedProjectRootDirectoryHandleV01 = {
    async read() {
      reads += 1;
      if (options.fail_at_read === reads) {
        throw new Error("injected_directory_read_failure");
      }
      if (index >= count) return null;
      const entry = directoryEntryV01(
        `entry-${String(index).padStart(5, "0")}`,
      );
      index += 1;
      options.after_read?.(reads);
      return entry;
    },
    async close() {
      assert.equal(closed, false, "directory handle closed more than once");
      closed = true;
    },
  };
  return {
    handle,
    reads: () => reads,
    closed: () => closed,
  };
}

function directoryEntryV01(name: string): BoundedProjectRootDirectoryEntryV01 {
  return {
    name,
    isDirectory: () => false,
    isFile: () => true,
    isSymbolicLink: () => false,
  };
}

function refV01(
  refType: string,
  externalId: string,
  sourceRef: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: TEST_AT,
    source_ref: sourceRef,
    compatibility_namespace: "local_project_verification_adapter.v0.1",
    trust_class: "direct_local_observation",
  };
}

function assertPresentV01<T>(value: T | null | undefined): T {
  assert(value !== null && value !== undefined);
  return value;
}
