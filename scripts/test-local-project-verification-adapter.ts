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

import { genericCliDirectObservationInputFixture } from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  LOCAL_PROJECT_ROOT_VERIFICATION_EXPECTED_OUTPUTS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01,
  createLocalProjectRootCriterionVerificationPlanV01,
} from "@/lib/vnext/automation/local-project-root-verification-profile";
import { evaluateCriterionAssessmentV01 } from "@/lib/vnext/criterion-assessment";
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
import {
  materializeValidatedPacketDeliveryCheckV01,
  projectDirectNativeHostActionObservationsV01,
} from "@/lib/vnext/runtime/direct-native-host-round-trip";
import {
  buildRunReceiptV01,
  validateRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "@/lib/vnext/run-receipt";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
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

const TEST_AT = "2026-07-19T08:00:00.000Z";
let root = "";

async function main(): Promise<void> {
  root = await mkdtemp(path.join(tmpdir(), "augnes-local-verify-"));
  try {
    await assertBoundedEnumerationV01();
    assertCanonicalManifestV01();
    await assertRootAndResidueOutcomesV01();
    assertNoInvocationDeliveryV01();
    process.stdout.write(
      `${JSON.stringify({
        suite: "local-project-verification-adapter.v0.1",
        status: "passed",
        max_root_entries: MAX_ROOT_ENTRIES_V01,
        incremental_bound_checked: true,
        canonical_manifest_checked: true,
        exact_root_identity_checked: true,
        truthful_terminal_residue_checked: true,
        typed_criterion_plan_checked: true,
        relation_aware_production_assessment_checked: true,
        blocked_cancelled_skipped_unknown_checked: true,
        packet_presentation_egress_separation_checked: true,
      }, null, 2)}\n`,
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
    assert.equal(result.status === "completed" ? result.entries.length : -1, count);
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
  assert.deepEqual(
    completed.checks.map((check) => check.check_id).sort(),
    [...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01],
  );
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
  const completedAssessment = productionAssessmentV01(
    completedRequest,
    completed,
  );
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
      [...criterion.supporting_refs, ...criterion.opposing_refs, ...criterion.missing_refs]
        .some((ref) => ref.external_id.includes("validated_packet_delivery")),
    ),
    false,
    "the unrelated packet-delivery check must not create a criterion relation",
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
  assertProductionAssessmentV01(
    productionAssessmentV01(preCancelledRequest, preCancelled),
    {
      root: "unknown",
      bound: "unknown",
      manifest: "unknown",
      side_effects: "unknown",
    },
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
    duringCancelled.checks.map(({ check_id, status }) => ({ check_id, status })),
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
    conflict.checks.find((check) => check.check_id === "project_root_scope_verified")
      ?.status,
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
    filesystemFailure.checks.map(({ check_id, status }) => ({ check_id, status })),
    [
      { check_id: "project_root_scope_verified", status: "passed" },
      { check_id: "project_root_manifest_verified", status: "failed" },
    ],
  );
  assertLocalDeliveryV01(filesystemFailure);
  const failedAssessment = productionAssessmentV01(
    filesystemFailureRequest,
    filesystemFailure,
  );
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
  assert.equal(
    failedManifest.opposing_refs[0]?.external_id.includes(
      "project_root_manifest_verified",
    ),
    true,
  );

  const replaced = path.join(root, "replaced");
  const replacedPrior = path.join(root, "replaced-prior");
  await mkdir(replaced);
  const replacedIdentity = await inspectNativeHostPhysicalRootIdentityV01(replaced);
  await import("node:fs/promises").then(({ rename }) => rename(replaced, replacedPrior));
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
  const linkedIdentity = await inspectNativeHostPhysicalRootIdentityV01(linkedRoot);
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
  | "root"
  | "bound"
  | "manifest"
  | "side_effects";

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

function productionAssessmentV01(
  request: NativeHostRequestV01,
  result: NativeHostResultV01,
): CriterionAssessmentV01 {
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
  return evaluateCriterionAssessmentV01({
    packet: request.packet,
    receipt,
  });
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
        relationRefs.some((ref) => ref.external_id.includes(checkId)),
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
      expected_artifacts: [...LOCAL_PROJECT_ROOT_VERIFICATION_EXPECTED_OUTPUTS_V01],
    },
  });
  const scopeFingerprint = `sha256:${"a".repeat(64)}`;
  const workRef = refV01("automation_work_item", "work:local-verification", scopeFingerprint);
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
    task_ref: refV01("task_definition", "task:local-verification", scopeFingerprint),
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
      root_scope_ref: refV01("project_root_scope", packet.project_id, scopeFingerprint),
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
      const entry = directoryEntryV01(`entry-${String(index).padStart(5, "0")}`);
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
