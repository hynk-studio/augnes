import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { createVNextOperatorSemanticReviewHandlersV01 } from "../app/api/vnext/operator/semantic-review/route";
import { createVNextOperatorSemanticTransitionHandlersV01 } from "../app/api/vnext/operator/semantic-transition/route";
import {
  buildSemanticReviewLoopTaskContextPacketFixture,
  buildSemanticReviewLoopProposalFixture,
  buildSemanticReviewLoopRunReceiptFixture,
} from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import { insertVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  normalizeLocalProjectRootRefV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import { mutateProjectControlV01 } from "../lib/vnext/persistence/project-control-store";
import { admitStructuredRunReceiptV01 } from "../lib/vnext/persistence/structured-run-receipt-admission";
import { createProtocolSha256V01 } from "../lib/vnext/protocol-primitives";
import { createEpisodeDeltaCandidateFingerprintV01 } from "../lib/vnext/review-decision";
import { buildRunReceiptV01 } from "../lib/vnext/run-receipt";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01,
} from "../lib/vnext/runtime/local-operator-session";
import { buildTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
import { buildVNextOperatorBrowserFixtureV01 } from "./vnext-operator-browser-fixture-builder-v0-1";
import { buildOperatorExecutionPermittedEffectContractV1 } from "./operator-execution-effect-ledger-v1.mjs";

export const OPERATOR_EXECUTION_FIXTURE_VERSION_V1 =
  "operator_execution_browser_fixture.v1";
export const OPERATOR_EXECUTION_FIXTURE_PROFILES_V1 = [
  "review_control",
  "native_host_execution",
  "multi_candidate",
] as const;
export const OPERATOR_EXECUTION_INSPECTOR_ROUTE_FIXTURE_VERSION_V1 =
  "operator_execution_inspector_route_fixture.v1" as const;
export type OperatorExecutionFixtureProfileV1 =
  (typeof OPERATOR_EXECUTION_FIXTURE_PROFILES_V1)[number];

const PROFILE_PROJECT_UUID = "8bff6cf8-9b33-4f85-909f-a53ca3f28d17";
const AUTOMATION_PROJECT_UUID = "1fdfb249-0cf1-4d72-b16e-2e22c05c9f84";

export interface OperatorExecutionFixtureManifestV1 {
  fixture_version: typeof OPERATOR_EXECUTION_FIXTURE_VERSION_V1;
  profile: OperatorExecutionFixtureProfileV1;
  source_fixture_version: "vnext_operator_pilot_browser_fixture.v0.1";
  source_database_file: "source/operator-pilot.db";
  writable_database_file: `writable/${OperatorExecutionFixtureProfileV1}.db`;
  source_database_sha256: `sha256:${string}`;
  writable_seed_sha256: `sha256:${string}`;
  workspace_id: string;
  project_id: string;
  operator_id: string;
  packet_id: string;
  packet_fingerprint: string;
  proposal_id: string;
  proposal_fingerprint: string;
  strategic_source_proposal_id: string;
  strategic_source_proposal_fingerprint: string;
  strategic_working_frame_fingerprint: string;
  strategic_source_catalog_fingerprint: string;
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
  baseline_run_id: string;
  baseline_run_contract: string;
  profile_project_id: string | null;
  automation_project_id: string | null;
  automation_packet_id: string | null;
  automation_packet_fingerprint: string | null;
  multi_candidate_fixture: {
    target_proposal_id: string;
    target_proposal_fingerprint: string;
    target_proposal_path: string;
    blocked_proposal_id: string;
    blocked_proposal_fingerprint: string;
    blocked_proposal_path: string;
    candidate_ids: [string, string];
    candidate_fingerprints: [string, string];
    exact_binding: {
      pending_proposal_id: string;
      pending_proposal_fingerprint: string;
      pending_proposal_path: string;
      preferred_candidate_id: string;
      preferred_candidate_fingerprint: string;
      newer_proposal_id: string;
      newer_proposal_fingerprint: string;
    };
  } | null;
  inspector_route_fixture: {
    fixture_version: typeof OPERATOR_EXECUTION_INSPECTOR_ROUTE_FIXTURE_VERSION_V1;
    project_id: string;
    bounded_receipt_id: string;
    bounded_receipt_fingerprint: string;
    admitted_record_count: 2;
    production_state: "inspector_section_fixed_bound_exceeded";
    unavailable_browser_disposition: "pure_presentation_contract_only_no_production_failure_seam";
  } | null;
  records_present_at_start: string[];
  records_intentionally_absent: string[];
  permitted_effect_contract: ReturnType<
    typeof buildOperatorExecutionPermittedEffectContractV1
  >;
  forbidden_effects: string[];
  production_owners: string[];
  execution_capability: "deterministic_local_only" | "none";
  provider_network_capability: "none";
  authority_boundary: string[];
  source_bound: true;
  credential_material_included: false;
  fixture_fingerprint: `sha256:${string}`;
}

export interface OperatorExecutionBrowserFixtureV1 {
  manifest: OperatorExecutionFixtureManifestV1;
  manifest_path: string;
  source_database_path: string;
  writable_database_path: string;
  source_root: string;
  writable_root: string;
  profile_project_root: string | null;
}

export async function buildOperatorExecutionBrowserFixtureV1(input: {
  output_directory: string;
  reference_time: string;
  profile: OperatorExecutionFixtureProfileV1;
}): Promise<OperatorExecutionBrowserFixtureV1> {
  assert.equal(path.isAbsolute(input.output_directory), true);
  assert.equal(readdirSync(input.output_directory).length, 0);
  assert.equal(OPERATOR_EXECUTION_FIXTURE_PROFILES_V1.includes(input.profile), true);
  assert.equal(Number.isFinite(Date.parse(input.reference_time)), true);
  const sourceRoot = path.join(input.output_directory, "source");
  const writableRoot = path.join(input.output_directory, "writable");
  mkdirSync(sourceRoot, { recursive: false, mode: 0o700 });
  mkdirSync(writableRoot, { recursive: false, mode: 0o700 });
  const sourceSummary = await buildVNextOperatorBrowserFixtureV01({
    output_directory: sourceRoot,
    reference_time: input.reference_time,
  });
  assert.equal(sourceSummary.status, "pass");
  assert.equal(sourceSummary.external_network_calls, 0);
  assert.equal(sourceSummary.provider_calls, 0);
  assert.equal(sourceSummary.default_database_accessed, false);
  const sourceDatabasePath = path.join(sourceRoot, "operator-pilot.db");
  const sourceManifestPath = path.join(
    sourceRoot,
    "operator-pilot-browser-fixture.json",
  );
  const sourceManifest = JSON.parse(readFileSync(sourceManifestPath, "utf8"));
  const writableDatabasePath = path.join(
    writableRoot,
    `${input.profile}.db`,
  );
  copyFileSync(sourceDatabasePath, writableDatabasePath);
  const sourceDatabaseSha256 = sha256File(sourceDatabasePath);

  let profileProjectId: string | null = null;
  let profileProjectRoot: string | null = null;
  let automationProjectId: string | null = null;
  let automationPacketId: string | null = null;
  let automationPacketFingerprint: string | null = null;
  let multiCandidateFixture: OperatorExecutionFixtureManifestV1["multi_candidate_fixture"] = null;
  let inspectorRouteFixture: OperatorExecutionFixtureManifestV1["inspector_route_fixture"] = null;
  const database = new Database(writableDatabasePath, { fileMustExist: true });
  let baselineRunId = "";
  let baselineRunContract = "";
  try {
    database.pragma("foreign_keys = ON");
    const baselineRun = database
      .prepare(
        "SELECT run_id, autonomy_contract_ref FROM autonomy_runs ORDER BY run_id",
      )
      .get() as
      | { run_id: string; autonomy_contract_ref: string }
      | undefined;
    assert(baselineRun, "operator fixture baseline run missing");
    baselineRunId = requiredString(baselineRun.run_id);
    baselineRunContract = requiredString(baselineRun.autonomy_contract_ref);
    if (
      input.profile === "native_host_execution" ||
      input.profile === "review_control"
    ) {
      profileProjectRoot = path.join(
        writableRoot,
        input.profile === "native_host_execution"
          ? "first-work-project-root"
          : "review-control-refusal-project-root",
      );
      mkdirSync(profileProjectRoot, { recursive: false, mode: 0o700 });
      const registration = getOrCreateCanonicalProjectForLocalRootV01(
        database,
        {
          workspace_id: requiredString(sourceManifest.workspace_id),
          local_root: normalizeLocalProjectRootRefV01(profileProjectRoot, {
            base_path: path.parse(profileProjectRoot).root,
          }),
          display_name:
            input.profile === "native_host_execution"
              ? "Operator Native Host First Work"
              : "Operator Review Refusal Project",
        },
        {
          create_uuid: () => PROFILE_PROJECT_UUID,
          now: () => input.reference_time,
        },
      );
      profileProjectId = registration.project.project_id;
      touchRecentProjectV01(database, {
        workspace_id: sourceManifest.workspace_id,
        project_id: profileProjectId,
        now: input.reference_time,
      });
      if (input.profile === "native_host_execution") {
        const automationProjectRoot = path.join(
          writableRoot,
          "bounded-automation-project-root",
        );
        mkdirSync(automationProjectRoot, { recursive: false, mode: 0o700 });
        const automationRegistration =
          getOrCreateCanonicalProjectForLocalRootV01(
            database,
            {
              workspace_id: requiredString(sourceManifest.workspace_id),
              local_root: normalizeLocalProjectRootRefV01(
                automationProjectRoot,
                { base_path: path.parse(automationProjectRoot).root },
              ),
              display_name: "Operator Bounded Automation Fixture",
            },
            {
              create_uuid: () => AUTOMATION_PROJECT_UUID,
              now: () => input.reference_time,
            },
          );
        automationProjectId = automationRegistration.project.project_id;
        touchRecentProjectV01(database, {
          workspace_id: sourceManifest.workspace_id,
          project_id: automationProjectId,
          now: input.reference_time,
        });
      } else {
        inspectorRouteFixture = admitBoundedInspectorRouteFixtureV1(database, {
          workspace_id: requiredString(sourceManifest.workspace_id),
          project_id: profileProjectId,
        });
      }
    }
    if (input.profile === "multi_candidate") {
      multiCandidateFixture = admitMultiCandidateFixture(database, {
        workspace_id: requiredString(sourceManifest.workspace_id),
        project_id: requiredString(sourceManifest.project_id),
      });
    }
    const selectedProjectId =
      input.profile === "native_host_execution"
        ? requiredString(profileProjectId)
        : requiredString(sourceManifest.project_id);
    if (input.profile !== "native_host_execution") {
      touchRecentProjectV01(database, {
        workspace_id: sourceManifest.workspace_id,
        project_id: selectedProjectId,
        now: input.reference_time,
      });
    }
    let current = readActiveProjectSelectionV01(
      database,
      sourceManifest.workspace_id,
    );
    if (input.profile === "native_host_execution") {
      assert(automationProjectId);
      if (current?.project_id !== automationProjectId) {
        current = selectActiveProjectV01(database, {
          workspace_id: requiredString(sourceManifest.workspace_id),
          project_id: automationProjectId,
          now: input.reference_time,
          expected_project_id: current?.project_id ?? null,
          expected_revision: current?.selection_revision ?? null,
        });
      }
      const automationPacket = await admitFreshAutomationSourcePacketV1(
        database,
        {
          workspace_id: requiredString(sourceManifest.workspace_id),
          project_id: automationProjectId,
          operator_id: requiredString(sourceManifest.operator_id),
          database_path: writableDatabasePath,
          observed_at: input.reference_time,
        },
      );
      automationPacketId = automationPacket.packet_id;
      automationPacketFingerprint = automationPacket.integrity.fingerprint;
      mutateProjectControlV01(
        database,
        {
          workspace_id: requiredString(sourceManifest.workspace_id),
          project_id: automationProjectId,
          action: "enable_automation",
          expected_active_project_id: current.project_id,
          expected_active_selection_revision: current.selection_revision,
          expected_control_revision: null,
        },
        { now: () => input.reference_time },
      );
    }
    selectActiveProjectV01(database, {
      workspace_id: sourceManifest.workspace_id,
      project_id: selectedProjectId,
      now: input.reference_time,
      expected_project_id: current?.project_id ?? null,
      expected_revision: current?.selection_revision ?? null,
    });
    assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
  } finally {
    database.close();
  }
  const writableSeedSha256 = sha256File(writableDatabasePath);

  const profileContract = profileEffectContract(input.profile);
  const withoutFingerprint: Omit<
    OperatorExecutionFixtureManifestV1,
    "fixture_fingerprint"
  > = {
    fixture_version: OPERATOR_EXECUTION_FIXTURE_VERSION_V1,
    profile: input.profile,
    source_fixture_version: "vnext_operator_pilot_browser_fixture.v0.1",
    source_database_file: "source/operator-pilot.db",
    writable_database_file: `writable/${input.profile}.db`,
    source_database_sha256: sourceDatabaseSha256,
    writable_seed_sha256: writableSeedSha256,
    workspace_id: requiredString(sourceManifest.workspace_id),
    project_id: requiredString(sourceManifest.project_id),
    operator_id: requiredString(sourceManifest.operator_id),
    packet_id: requiredString(sourceManifest.packet_id),
    packet_fingerprint: requiredString(sourceManifest.packet_fingerprint),
    proposal_id: requiredString(sourceManifest.proposal_id),
    proposal_fingerprint: requiredString(sourceManifest.proposal_fingerprint),
    strategic_source_proposal_id: requiredString(
      sourceManifest.strategic_source_proposal_id,
    ),
    strategic_source_proposal_fingerprint: requiredString(
      sourceManifest.strategic_source_proposal_fingerprint,
    ),
    strategic_working_frame_fingerprint: requiredString(
      sourceManifest.strategic_working_frame_fingerprint,
    ),
    strategic_source_catalog_fingerprint: requiredString(
      sourceManifest.strategic_source_catalog_fingerprint,
    ),
    transition_receipt_id: requiredString(sourceManifest.transition_receipt_id),
    transition_receipt_fingerprint: requiredString(
      sourceManifest.transition_receipt_fingerprint,
    ),
    baseline_run_id: baselineRunId,
    baseline_run_contract: baselineRunContract,
    profile_project_id: profileProjectId,
    automation_project_id: automationProjectId,
    automation_packet_id: automationPacketId,
    automation_packet_fingerprint: automationPacketFingerprint,
    multi_candidate_fixture: multiCandidateFixture,
    inspector_route_fixture: inspectorRouteFixture,
    records_present_at_start: profileContract.records_present_at_start,
    records_intentionally_absent: profileContract.records_intentionally_absent,
    permitted_effect_contract:
      buildOperatorExecutionPermittedEffectContractV1(input.profile),
    forbidden_effects: profileContract.forbidden_effects,
    production_owners: [
      "vnext_operator_browser_fixture_builder_v0_1",
      "project_identity_registry_v0_1",
      "project_lifecycle_registry_v0_1",
      "project_control_store_v0_1",
      "initial_project_work_context_compiler_v0_1",
      "durable_semantic_store_v0_1",
      "structured_run_receipt_admission_v0_1",
      "episode_delta_proposal_admission_v0_1",
      "local_operator_session_v0_1",
    ],
    execution_capability:
      input.profile === "native_host_execution"
        ? "deterministic_local_only"
        : "none",
    provider_network_capability: "none",
    authority_boundary: [
      "fixture_record_is_not_approval",
      "session_is_not_provider_authority",
      "assessment_is_not_decision",
      "decision_is_not_transition",
      "result_review_is_not_semantic_authority",
    ],
    source_bound: true,
    credential_material_included: false,
  };
  const manifest: OperatorExecutionFixtureManifestV1 = {
    ...withoutFingerprint,
    fixture_fingerprint: sha256Json(withoutFingerprint),
  };
  const manifestPath = path.join(
    input.output_directory,
    `operator-execution-${input.profile}.v1.json`,
  );
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
  return {
    manifest,
    manifest_path: manifestPath,
    source_database_path: sourceDatabasePath,
    writable_database_path: writableDatabasePath,
    source_root: sourceRoot,
    writable_root: writableRoot,
    profile_project_root: profileProjectRoot,
  };
}

function admitBoundedInspectorRouteFixtureV1(
  database: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
  },
): NonNullable<OperatorExecutionFixtureManifestV1["inspector_route_fixture"]> {
  const sourcePacket = buildSemanticReviewLoopTaskContextPacketFixture(
    {
      fixture_id: "operator-execution-inspector-bounded-source",
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      run_id: "run:operator-execution-inspector-bounded-source",
    },
    { data_classification: "public_safe" },
  );
  const {
    packet_version: _packetVersion,
    packet_id: _packetId,
    authority_summary: _authoritySummary,
    integrity: _integrity,
    ...builderInput
  } = sourcePacket;
  const packet = buildTaskContextPacketV01({
    ...structuredClone(builderInput),
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    task: {
      ...structuredClone(builderInput.task),
      goal: "Render one production Inspector view whose exact capability section exceeds its fixed presentation bound.",
    },
  });
  const baseReceipt = buildSemanticReviewLoopRunReceiptFixture(
    {
      fixture_id: "operator-execution-inspector-bounded-receipt",
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      run_id: "run:operator-execution-inspector-bounded-receipt",
    },
    packet,
  );
  const {
    receipt_version: _receiptVersion,
    receipt_id: _receiptId,
    trust_summary: _trustSummary,
    authority_summary: _receiptAuthoritySummary,
    idempotency_key: _receiptIdempotencyKey,
    integrity: _receiptIntegrity,
    ...receiptInput
  } = baseReceipt;
  const sourceCapability = baseReceipt.capability_coverage[0];
  assert(sourceCapability);
  const boundedReceipt = buildRunReceiptV01({
    ...structuredClone(receiptInput),
    capability_coverage: Array.from({ length: 65 }, (_, index) => ({
      ...structuredClone(sourceCapability),
      capability: `bounded_inspector_capability_${String(index).padStart(2, "0")}`,
      notes: ["Immutable fixture capability used only to exercise the production Inspector presentation bound."],
    })),
  });
  database.transaction(() => {
    assert.equal(
      insertVNextCoreRecordV01(database, {
        record_kind: "task_context_packet",
        record_id: packet.packet_id,
        workspace_id: packet.workspace_id,
        project_id: packet.project_id,
        fingerprint: packet.integrity.fingerprint,
        idempotency_key: null,
        payload: packet,
        created_at: packet.generated_at,
      }).status,
      "inserted",
    );
    assert.equal(admitStructuredRunReceiptV01(database, boundedReceipt).status, "inserted");
  })();
  return {
    fixture_version: OPERATOR_EXECUTION_INSPECTOR_ROUTE_FIXTURE_VERSION_V1,
    project_id: input.project_id,
    bounded_receipt_id: boundedReceipt.receipt_id,
    bounded_receipt_fingerprint: boundedReceipt.integrity.fingerprint,
    admitted_record_count: 2,
    production_state: "inspector_section_fixed_bound_exceeded",
    unavailable_browser_disposition:
      "pure_presentation_contract_only_no_production_failure_seam",
  };
}

function admitMultiCandidateFixture(
  database: Database.Database,
  identity: { workspace_id: string; project_id: string },
): NonNullable<OperatorExecutionFixtureManifestV1["multi_candidate_fixture"]> {
  const currentPacket = (
    database
      .prepare(
        `SELECT payload_json
         FROM vnext_core_records
         WHERE record_kind = 'task_context_packet'
           AND workspace_id = ?
           AND project_id = ?
         ORDER BY created_at DESC, record_id DESC`,
      )
      .all(identity.workspace_id, identity.project_id) as Array<{
      payload_json: string;
    }>
  )
    .map((row) => JSON.parse(row.payload_json))
    .find((packet) =>
      packet.selected_context?.some(
        (entry: { entry_kind?: string }) =>
          entry.entry_kind === "accepted_state_ref",
      ),
    );
  assert(currentPacket, "operator_multi_candidate_packet_missing");
  const targetIdentity = {
    fixture_id: "operator-execution-multi-candidate-target",
    workspace_id: identity.workspace_id,
    project_id: identity.project_id,
    run_id: "run:operator-execution-multi-candidate-target",
  };
  const targetReceipt = buildSemanticReviewLoopRunReceiptFixture(
    targetIdentity,
    currentPacket,
    { timeline_anchor_at: currentPacket.generated_at },
  );
  const targetProposal = buildSemanticReviewLoopProposalFixture(
    targetIdentity,
    currentPacket,
    targetReceipt,
    {
      primary_delta_type: "agent_plan_delta",
      candidate_namespace: "operator-execution-multi-candidate-target",
      timeline_anchor_at: currentPacket.generated_at,
    },
  );
  const blockedIdentity = {
    ...targetIdentity,
    fixture_id: "operator-execution-multi-candidate-blocked",
    run_id: "run:operator-execution-multi-candidate-blocked",
  };
  const blockedReceipt = buildSemanticReviewLoopRunReceiptFixture(
    blockedIdentity,
    currentPacket,
    { timeline_anchor_at: currentPacket.generated_at },
  );
  const blockedProposal = buildSemanticReviewLoopProposalFixture(
    blockedIdentity,
    currentPacket,
    blockedReceipt,
    {
      primary_delta_type: "agent_plan_delta",
      candidate_namespace: "operator-execution-multi-candidate-target",
      timeline_anchor_at: currentPacket.generated_at,
    },
  );
  const latestProposalCreatedAt = String(
    (
      database
        .prepare(
          `SELECT MAX(created_at) AS created_at
           FROM vnext_core_records
           WHERE record_kind = 'episode_delta_proposal'
             AND workspace_id = ?
             AND project_id = ?`,
        )
        .get(identity.workspace_id, identity.project_id) as {
        created_at: string | null;
      }
    ).created_at ?? currentPacket.generated_at,
  );
  const exactBindingBase = Math.max(
    Date.parse(currentPacket.generated_at),
    Date.parse(latestProposalCreatedAt),
  );
  assert.equal(Number.isFinite(exactBindingBase), true);
  const pendingAnchor = new Date(exactBindingBase + 60_000).toISOString();
  const pendingIdentity = {
    ...targetIdentity,
    fixture_id: "operator-execution-exact-binding-pending",
    run_id: "run:operator-execution-exact-binding-pending",
  };
  const pendingReceipt = buildSemanticReviewLoopRunReceiptFixture(
    pendingIdentity,
    currentPacket,
    { timeline_anchor_at: pendingAnchor },
  );
  const pendingProposal = buildSemanticReviewLoopProposalFixture(
    pendingIdentity,
    currentPacket,
    pendingReceipt,
    {
      primary_delta_type: "agent_plan_delta",
      candidate_namespace: "operator-execution-exact-binding-pending",
      timeline_anchor_at: pendingAnchor,
    },
  );
  const newerAnchor = new Date(exactBindingBase + 120_000).toISOString();
  const newerIdentity = {
    ...targetIdentity,
    fixture_id: "operator-execution-exact-binding-newer",
    run_id: "run:operator-execution-exact-binding-newer",
  };
  const newerReceipt = buildSemanticReviewLoopRunReceiptFixture(
    newerIdentity,
    currentPacket,
    { timeline_anchor_at: newerAnchor },
  );
  const newerProposal = buildSemanticReviewLoopProposalFixture(
    newerIdentity,
    currentPacket,
    newerReceipt,
    {
      primary_delta_type: "agent_plan_delta",
      candidate_namespace: "operator-execution-exact-binding-newer",
      timeline_anchor_at: newerAnchor,
    },
  );
  assert.equal(targetProposal.proposed_deltas.length, 2);
  assert.equal(pendingProposal.proposed_deltas.length, 2);
  const preferredCandidate = pendingProposal.proposed_deltas[1];
  assert(preferredCandidate);
  const candidateFingerprints = targetProposal.proposed_deltas.map((entry) =>
    createEpisodeDeltaCandidateFingerprintV01(entry),
  ) as [string, string];
  database.transaction(() => {
    for (const [receipt, proposal] of [
      [targetReceipt, targetProposal],
      [blockedReceipt, blockedProposal],
      [pendingReceipt, pendingProposal],
      [newerReceipt, newerProposal],
    ] as const) {
      admitStructuredRunReceiptV01(database, receipt);
      insertVNextCoreRecordV01(database, {
        record_kind: "episode_delta_proposal",
        record_id: proposal.proposal_id,
        workspace_id: proposal.workspace_id,
        project_id: proposal.project_id,
        fingerprint: proposal.integrity.fingerprint,
        idempotency_key: null,
        payload: proposal,
        created_at: proposal.created_at,
      });
    }
  })();
  return {
    target_proposal_id: targetProposal.proposal_id,
    target_proposal_fingerprint: targetProposal.integrity.fingerprint,
    target_proposal_path: proposalPath(targetProposal.proposal_id),
    blocked_proposal_id: blockedProposal.proposal_id,
    blocked_proposal_fingerprint: blockedProposal.integrity.fingerprint,
    blocked_proposal_path: proposalPath(blockedProposal.proposal_id),
    candidate_ids: targetProposal.proposed_deltas.map(
      (entry) => entry.candidate_id,
    ) as [string, string],
    candidate_fingerprints: candidateFingerprints,
    exact_binding: {
      pending_proposal_id: pendingProposal.proposal_id,
      pending_proposal_fingerprint: pendingProposal.integrity.fingerprint,
      pending_proposal_path: proposalPath(pendingProposal.proposal_id),
      preferred_candidate_id: preferredCandidate.candidate_id,
      preferred_candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(preferredCandidate),
      newer_proposal_id: newerProposal.proposal_id,
      newer_proposal_fingerprint: newerProposal.integrity.fingerprint,
    },
  };
}

function proposalPath(proposalId: string) {
  return `/workbench/semantic-review/${proposalId.replace(":", "~")}`;
}

export function operatorExecutionFixtureFingerprintV1(
  manifest: OperatorExecutionFixtureManifestV1,
) {
  const { fixture_fingerprint: _fingerprint, ...material } = manifest;
  return sha256Json(material);
}

function profileEffectContract(profile: OperatorExecutionFixtureProfileV1) {
  if (profile === "review_control") {
    return {
      records_present_at_start: [
        "source_bound_packet",
        "terminal_run_receipt",
        "unreviewed_proposals",
        "non_target_applied_transition",
      ],
      records_intentionally_absent: ["strategic_transfer_proposal"],
      forbidden_effects: [
        "native_host_execution",
        "provider_call",
        "external_network_call",
        "work_closure",
        "memory_mutation",
      ],
    };
  }
  if (profile === "native_host_execution") {
    return {
      records_present_at_start: [
        "source_bound_packet",
        "deterministic_native_host_seam",
        "clean_first_work_project",
        "enabled_project_automation_control_fixture_input",
        "fresh_bounded_automation_project_packet_fixture_input",
      ],
      records_intentionally_absent: [
        "first_work_definition_for_clean_project",
        "running_native_host_process",
      ],
      forbidden_effects: [
        "review_decision",
        "applied_transition",
        "provider_call",
        "external_network_call",
        "work_closure",
      ],
    };
  }
  return {
    records_present_at_start: [
      "source_bound_packet",
      "multi_candidate_proposal_source",
      "exact_binding_ready_and_newer_undecided_proposal_sources",
      "non_target_applied_transition",
    ],
    records_intentionally_absent: ["target_candidate_decision"],
    forbidden_effects: [
      "native_host_execution",
      "provider_call",
      "external_network_call",
      "work_closure",
      "cross_project_candidate_mutation",
    ],
  };
}

async function admitFreshAutomationSourcePacketV1(
  database: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    operator_id: string;
    database_path: string;
    observed_at: string;
  },
): Promise<TaskContextPacketV01> {
  const baseTime = Date.parse(input.observed_at);
  assert.equal(Number.isFinite(baseTime), true);
  const fixtureProject = {
    fixture_id: "operator-execution-bounded-source",
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    run_id: "run:operator-execution-bounded-source",
  };
  const priorPacket = boundedAutomationSourcePacketV1(
    buildSemanticReviewLoopTaskContextPacketFixture(fixtureProject, {
      data_classification: "public_safe",
    }),
    input.observed_at,
  );
  const receipt = buildSemanticReviewLoopRunReceiptFixture(
    fixtureProject,
    priorPacket,
    { timeline_anchor_at: new Date(baseTime + 1_000).toISOString() },
  );
  const proposal = buildSemanticReviewLoopProposalFixture(
    fixtureProject,
    priorPacket,
    receipt,
    {
      primary_delta_type: "agent_plan_delta",
      candidate_namespace: "operator-execution-bounded-source",
      timeline_anchor_at: new Date(baseTime + 2_000).toISOString(),
    },
  );
  assert.equal(
    insertVNextCoreRecordV01(database, {
      record_kind: "task_context_packet",
      record_id: priorPacket.packet_id,
      workspace_id: priorPacket.workspace_id,
      project_id: priorPacket.project_id,
      fingerprint: priorPacket.integrity.fingerprint,
      idempotency_key: null,
      payload: priorPacket,
      created_at: priorPacket.generated_at,
    }).status,
    "inserted",
  );
  assert.equal(admitStructuredRunReceiptV01(database, receipt).status, "inserted");
  assert.equal(
    insertVNextCoreRecordV01(database, {
      record_kind: "episode_delta_proposal",
      record_id: proposal.proposal_id,
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      fingerprint: proposal.integrity.fingerprint,
      idempotency_key: null,
      payload: proposal,
      created_at: proposal.created_at,
    }).status,
    "inserted",
  );

  const clock = new MutableFixtureClockV1(
    new Date(baseTime + 3_000).toISOString(),
  );
  const secretSource = deterministicFixtureSecretSource(
    `operator-execution:${input.project_id}:semantic-transition`,
  );
  const admission = createFixtureOperatorAdmission(database, input, {
    clock,
    secret_source: secretSource,
  });
  const environment: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: input.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: input.project_id,
    AUGNES_VNEXT_OPERATOR_ID: input.operator_id,
    AUGNES_DB_PATH: input.database_path,
  };
  const reviewHandlers = createVNextOperatorSemanticReviewHandlersV01({
    environment,
    clock,
    secret_source: secretSource,
  });
  const transitionHandlers = createVNextOperatorSemanticTransitionHandlersV01({
    environment,
    clock,
    secret_source: secretSource,
  });
  const jar = new FixtureCookieJarV1(admission.cookie_value);
  const candidate = proposal.proposed_deltas[0];
  assert(candidate);
  const candidateFingerprint =
    createEpisodeDeltaCandidateFingerprintV01(candidate);
  clock.advance(1_000);
  const decisionResponse = await reviewHandlers.POST(
    fixtureRouteRequestV1("/api/vnext/operator/semantic-review", {
      method: "POST",
      jar,
      body: {
        proposal_id: proposal.proposal_id,
        proposal_fingerprint: proposal.integrity.fingerprint,
        candidate_id: candidate.candidate_id,
        candidate_fingerprint: candidateFingerprint,
        decision: "accept",
        rationale_summary:
          "Fixture-only acceptance compiles one fresh bounded source packet.",
        revisit: null,
      },
    }),
  );
  const decisionBody = await requireFixtureResponseV1(
    decisionResponse,
    201,
    "bounded_source_decision",
  );
  jar.absorb(decisionResponse);
  const decision = decisionBody.decision as {
    decision_id: string;
    integrity: { fingerprint: string };
  };
  const decisionBinding = {
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
  };

  clock.advance(1_000);
  const previewResponse = await transitionHandlers.GET(
    fixtureRouteRequestV1("/api/vnext/operator/semantic-transition", {
      method: "GET",
      jar,
      query: decisionBinding,
    }),
  );
  const previewBody = await requireFixtureResponseV1(
    previewResponse,
    200,
    "bounded_source_preview",
  );
  jar.absorb(previewResponse);
  const preview = previewBody.preview as { confirmation_digest: string };

  clock.advance(1_000);
  const confirmResponse = await transitionHandlers.POST(
    fixtureRouteRequestV1("/api/vnext/operator/semantic-transition", {
      method: "POST",
      jar,
      body: {
        action: "confirm",
        ...decisionBinding,
        confirmation_digest: preview.confirmation_digest,
      },
    }),
  );
  const confirmBody = await requireFixtureResponseV1(
    confirmResponse,
    201,
    "bounded_source_confirm",
  );
  jar.absorb(confirmResponse);
  const gate = confirmBody.gate_record as {
    gate_record_id: string;
    integrity: { fingerprint: string };
  };

  clock.advance(1_000);
  const applyResponse = await transitionHandlers.POST(
    fixtureRouteRequestV1("/api/vnext/operator/semantic-transition", {
      method: "POST",
      jar,
      body: {
        action: "apply",
        ...decisionBinding,
        gate_record_id: gate.gate_record_id,
        gate_record_fingerprint: gate.integrity.fingerprint,
        prior_packet_id: priorPacket.packet_id,
        prior_packet_fingerprint: priorPacket.integrity.fingerprint,
      },
    }),
  );
  const applyBody = await requireFixtureResponseV1(
    applyResponse,
    201,
    "bounded_source_apply",
  );
  jar.absorb(applyResponse);
  assert.equal(applyBody.packet_compiled, true);
  return applyBody.later_packet as TaskContextPacketV01;
}

function boundedAutomationSourcePacketV1(
  packet: TaskContextPacketV01,
  generatedAt: string,
): TaskContextPacketV01 {
  const expiresAt = new Date(
    Date.parse(generatedAt) + 60 * 60_000,
  ).toISOString();
  const grantFingerprint = createProtocolSha256V01(
    `${packet.workspace_id}:${packet.project_id}:operator-execution-bounded-source-grant.v1`,
  );
  const grantId = `grant:operator-execution:${grantFingerprint.slice(
    "sha256:".length,
    "sha256:".length + 24,
  )}`;
  const {
    packet_version: _packetVersion,
    packet_id: _packetId,
    authority_summary: authoritySummary,
    integrity: _integrity,
    ...builderInput
  } = packet;
  return buildTaskContextPacketV01({
    ...builderInput,
    capability_grant: {
      grant_ref: grantId,
      grant_external_ref: {
        ref_version: "external_ref.v0.1",
        ref_type: "capability_grant",
        external_id: grantId,
        observed_at: generatedAt,
        source_ref: grantFingerprint,
        compatibility_namespace:
          "operator_execution_fixture_source_grant.v1",
        trust_class: "direct_local_observation",
      },
      allowed_capabilities: [
        "project_scoped_structured_task_round_trip.v0.1",
      ],
      forbidden_capabilities: [
        "credential_access",
        "deploy",
        "external_post",
        "merge",
        "model_invocation",
        "network_access",
        "publish",
      ],
      resource_scope: [packet.project_id],
      stop_conditions: [
        "budget_exhausted",
        "cancellation_requested",
        "review_needed",
        "timeout",
      ],
      coverage: "enforced",
      expires_at: expiresAt,
    },
    authority_notes: authoritySummary.notes,
  });
}

class MutableFixtureClockV1 {
  constructor(private current: string) {}

  now() {
    return this.current;
  }

  advance(milliseconds: number) {
    this.current = new Date(
      Date.parse(this.current) + milliseconds,
    ).toISOString();
  }
}

class FixtureCookieJarV1 {
  private readonly values = new Map<string, string>();

  constructor(sessionCookieValue: string) {
    this.values.set(
      VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01,
      sessionCookieValue,
    );
  }

  absorb(response: Response) {
    const headers = response.headers as Headers & {
      getSetCookie?: () => string[];
    };
    const cookies =
      headers.getSetCookie?.() ??
      (response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie")!]
        : []);
    for (const cookie of cookies) {
      const pair = cookie.split(";", 1)[0]!;
      const separator = pair.indexOf("=");
      if (separator <= 0) continue;
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (/Max-Age=0(?:;|$)/iu.test(cookie) || value.length === 0) {
        this.values.delete(name);
      } else {
        this.values.set(name, value);
      }
    }
  }

  header() {
    return [...this.values]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

function fixtureRouteRequestV1(
  routePath: string,
  input: {
    method: "GET" | "POST";
    jar: FixtureCookieJarV1;
    query?: Record<string, string>;
    body?: Record<string, unknown>;
  },
) {
  const url = new URL(`http://127.0.0.1:3000${routePath}`);
  for (const [key, value] of Object.entries(input.query ?? {})) {
    url.searchParams.set(key, value);
  }
  const headers = new Headers({ host: "127.0.0.1:3000" });
  if (input.method === "POST") {
    headers.set("origin", "http://127.0.0.1:3000");
    headers.set("sec-fetch-site", "same-origin");
    headers.set("content-type", "application/json");
  }
  headers.set("cookie", input.jar.header());
  return new Request(url, {
    method: input.method,
    headers,
    ...(input.body ? { body: JSON.stringify(input.body) } : {}),
  });
}

async function requireFixtureResponseV1(
  response: Response,
  expectedStatus: number,
  label: string,
) {
  const body = (await response.clone().json()) as Record<string, unknown>;
  assert.equal(
    response.status,
    expectedStatus,
    `${label}:${String(body.error_code ?? body.status ?? "unexpected_response")}`,
  );
  return body;
}

function sha256File(filePath: string): `sha256:${string}` {
  return `sha256:${createHash("sha256")
    .update(readFileSync(filePath))
    .digest("hex")}`;
}

function sha256Json(value: unknown): `sha256:${string}` {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")}`;
}

function requiredString(value: unknown): string {
  assert.equal(typeof value, "string");
  assert.equal((value as string).length > 0, true);
  return value as string;
}

function createFixtureOperatorAdmission(
  database: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    operator_id: string;
    database_path: string;
    observed_at: string;
  },
  owners?: {
    clock?: { now(): string };
    secret_source?: ReturnType<typeof deterministicFixtureSecretSource>;
  },
) {
  const config = {
    enabled: true as const,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    operator_id: input.operator_id,
    database_path: input.database_path,
  };
  const secretSource =
    owners?.secret_source ??
    deterministicFixtureSecretSource(
      `operator-execution:${input.project_id}`,
    );
  const clock = owners?.clock ?? { now: () => input.observed_at };
  const issued = issueVNextLocalOperatorBootstrapV01(database, {
    config,
    clock,
    secret_source: secretSource,
  });
  return consumeVNextLocalOperatorBootstrapV01(database, {
    config,
    bootstrap_token: issued.bootstrap_token,
    clock,
    secret_source: secretSource,
  });
}

function deterministicFixtureSecretSource(seed: string) {
  let counter = 0;
  return {
    bytes(size: number) {
      const output = Buffer.alloc(size);
      let offset = 0;
      while (offset < size) {
        const digest = createHash("sha256")
          .update(`${seed}:${counter}`)
          .digest();
        counter += 1;
        const length = Math.min(digest.length, size - offset);
        digest.copy(output, offset, 0, length);
        offset += length;
      }
      return output;
    },
  };
}
