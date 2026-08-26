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

import {
  TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT,
  TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
  genericCliBuilderInputFixture,
} from "../fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  buildSemanticReviewLoopProposalFixture,
  buildSemanticReviewLoopRunReceiptFixture,
  buildSemanticReviewLoopTaskContextPacketFixture,
} from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import { insertAutonomyRunLedgerRecord } from "../lib/autonomy/runner-ledger";
import {
  buildDefaultRunnerAuthorityBoundary,
  buildDefaultRunnerBudgetSnapshot,
  buildDefaultRunnerSourceRefs,
} from "../lib/autonomy/runner-state";
import { insertVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store";
import { admitStructuredRunReceiptV01 } from "../lib/vnext/persistence/structured-run-receipt-admission";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import { createSharedInspectorHrefV01 } from "../lib/vnext/shared-project-inspector-href";
import {
  buildTaskContextPacketV01,
  type TaskContextPacketBuilderInputV01,
} from "../lib/vnext/task-context-packet";
import { DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01 } from "../lib/vnext/runtime/direct-native-host-round-trip";
import {
  readProjectRunResultDetailV01,
  readProjectRunResultOverviewV01,
} from "../lib/vnext/runtime/project-run-result-read-model";
import { buildVNextOperatorBrowserFixtureV01 } from "./vnext-operator-browser-fixture-builder-v0-1";

export const PROJECT_EXPERIENCE_FIXTURE_VERSION_V1 =
  "project_experience_browser_fixture.v1";
export const PROJECT_EXPERIENCE_PRESENTATION_RUN_ID_V1 =
  "run:project-experience-rendered-state-v1";

export interface ProjectExperienceBrowserFixtureManifestV1 {
  fixture_version: typeof PROJECT_EXPERIENCE_FIXTURE_VERSION_V1;
  source_fixture_version: "vnext_operator_pilot_browser_fixture.v0.1";
  source_database_file: "source/operator-pilot.db";
  writable_database_file: "writable/project-experience.db";
  source_database_sha256: `sha256:${string}`;
  writable_seed_sha256: `sha256:${string}`;
  workspace_id: string;
  project_id: string;
  operator_id: string;
  rendered_state_inputs: {
    first_work_not_defined: "created_by_project_onboarding";
    delegated_work: {
      run_id: typeof PROJECT_EXPERIENCE_PRESENTATION_RUN_ID_V1;
      status: "paused";
      timeline_event_count: 2;
      execution_capable: false;
    };
    proposal_list_supplements: Array<{
      proposal_id: string;
      proposal_fingerprint: string;
    }>;
    result_ready: {
      receipt_id: string;
      receipt_fingerprint: string;
      review_href: string;
    };
    proposal_review: {
      proposal_id: string;
      proposal_fingerprint: string;
      review_href: string;
    };
    inspector: {
      target_kind: "episode_delta_proposal";
      href: string;
    };
    recovery_context: "created_from_disposable_project_root";
  };
  production_owners: string[];
  source_bound: true;
  presentation_only: true;
  execution_capable: false;
  external_network_calls: 0;
  provider_calls: 0;
  credential_material_included: false;
  semantic_authority_granted: false;
  execution_authority_granted: false;
  fixture_fingerprint: `sha256:${string}`;
}

export interface ProjectExperienceBrowserFixtureV1 {
  manifest: ProjectExperienceBrowserFixtureManifestV1;
  manifest_path: string;
  source_database_path: string;
  writable_database_path: string;
  source_project_root: string;
}

export async function buildProjectExperienceBrowserFixtureV1(input: {
  output_directory: string;
  reference_time: string;
}): Promise<ProjectExperienceBrowserFixtureV1> {
  assert.equal(path.isAbsolute(input.output_directory), true);
  assert.equal(readdirSync(input.output_directory).length, 0);
  assert.equal(Number.isFinite(Date.parse(input.reference_time)), true);

  const sourceDirectory = path.join(input.output_directory, "source");
  const writableDirectory = path.join(input.output_directory, "writable");
  mkdirSync(sourceDirectory, { recursive: false, mode: 0o700 });
  mkdirSync(writableDirectory, { recursive: false, mode: 0o700 });

  const sourceSummary = await buildVNextOperatorBrowserFixtureV01({
    output_directory: sourceDirectory,
    reference_time: input.reference_time,
  });
  assert.equal(sourceSummary.status, "pass");
  assert.equal(sourceSummary.external_network_calls, 0);
  assert.equal(sourceSummary.provider_calls, 0);
  assert.equal(sourceSummary.default_database_accessed, false);
  assert.equal(sourceSummary.credential_material_included, false);

  const sourceManifestPath = path.join(
    sourceDirectory,
    "operator-pilot-browser-fixture.json",
  );
  const sourceDatabasePath = path.join(sourceDirectory, "operator-pilot.db");
  const writableDatabasePath = path.join(
    writableDirectory,
    "project-experience.db",
  );
  const sourceManifest = JSON.parse(
    readFileSync(sourceManifestPath, "utf8"),
  ) as Record<string, unknown>;
  assert.equal(
    sourceManifest.fixture_version,
    "vnext_operator_pilot_browser_fixture.v0.1",
  );
  assert.equal(sourceManifest.credential_material_included, false);
  assert.equal(sourceManifest.semantic_authority_granted, false);
  copyFileSync(sourceDatabasePath, writableDatabasePath);

  const sourceDatabaseSha256 = sha256File(sourceDatabasePath);
  const writableSeedSha256 = sha256File(writableDatabasePath);
  assert.equal(writableSeedSha256, sourceDatabaseSha256);

  const database = new Database(writableDatabasePath, {
    readonly: true,
    fileMustExist: true,
  });
  let latestResult;
  let resultDetail;
  try {
    database.pragma("foreign_keys = ON");
    assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
    latestResult = readProjectRunResultOverviewV01(database, {
      workspace_id: requiredString(sourceManifest.workspace_id),
      project_id: requiredString(sourceManifest.project_id),
    }).latest_result;
    assert(latestResult, "project experience result presentation fixture missing");
    resultDetail = readProjectRunResultDetailV01(database, {
      workspace_id: requiredString(sourceManifest.workspace_id),
      project_id: requiredString(sourceManifest.project_id),
      receipt_id: latestResult.receipt_ref,
    });
  } finally {
    database.close();
  }

  const proposalId = requiredString(sourceManifest.proposal_id);
  const proposalFingerprint = requiredString(
    sourceManifest.proposal_fingerprint,
  );
  const proposalReviewHref = `/workbench/semantic-review/${proposalId.replace(
    ":",
    "~",
  )}`;
  const inspectorHref = createSharedInspectorHrefV01({
    target_kind: "episode_delta_proposal",
    record_id: proposalId,
    expected_fingerprint: proposalFingerprint,
  });
  const proposalListSupplements = buildProposalListSupplements({
    workspace_id: requiredString(sourceManifest.workspace_id),
    project_id: requiredString(sourceManifest.project_id),
  });
  const manifestWithoutFingerprint: Omit<
    ProjectExperienceBrowserFixtureManifestV1,
    "fixture_fingerprint"
  > = {
    fixture_version: PROJECT_EXPERIENCE_FIXTURE_VERSION_V1,
    source_fixture_version:
      "vnext_operator_pilot_browser_fixture.v0.1" as const,
    source_database_file: "source/operator-pilot.db" as const,
    writable_database_file: "writable/project-experience.db" as const,
    source_database_sha256: sourceDatabaseSha256,
    writable_seed_sha256: writableSeedSha256,
    workspace_id: requiredString(sourceManifest.workspace_id),
    project_id: requiredString(sourceManifest.project_id),
    operator_id: requiredString(sourceManifest.operator_id),
    rendered_state_inputs: {
      first_work_not_defined: "created_by_project_onboarding" as const,
      delegated_work: {
        run_id: PROJECT_EXPERIENCE_PRESENTATION_RUN_ID_V1,
        status: "paused" as const,
        timeline_event_count: 2 as const,
        execution_capable: false as const,
      },
      proposal_list_supplements: proposalListSupplements.map((entry) => ({
        proposal_id: entry.proposal.proposal_id,
        proposal_fingerprint: entry.proposal.integrity.fingerprint,
      })),
      result_ready: {
        receipt_id: latestResult.receipt_ref,
        receipt_fingerprint: resultDetail.identity.receipt_fingerprint,
        review_href: latestResult.review_href,
      },
      proposal_review: {
        proposal_id: proposalId,
        proposal_fingerprint: proposalFingerprint,
        review_href: proposalReviewHref,
      },
      inspector: {
        target_kind: "episode_delta_proposal" as const,
        href: inspectorHref,
      },
      recovery_context: "created_from_disposable_project_root" as const,
    },
    production_owners: [
      "vnext_operator_browser_fixture_builder_v0_1",
      "project_lifecycle_registry_v0_1",
      "autonomy_runner_ledger",
      "project_run_result_read_model_v0_1",
      "shared_project_inspector_href_v0_1",
      "task_context_packet_builder_v0_1",
      "durable_semantic_store_v0_1",
      "structured_run_receipt_admission_v0_1",
      "semantic_review_loop_fixture_v0_1",
    ],
    source_bound: true as const,
    presentation_only: true as const,
    execution_capable: false as const,
    external_network_calls: 0 as const,
    provider_calls: 0 as const,
    credential_material_included: false as const,
    semantic_authority_granted: false as const,
    execution_authority_granted: false as const,
  };
  const manifest: ProjectExperienceBrowserFixtureManifestV1 = {
    ...manifestWithoutFingerprint,
    fixture_fingerprint: sha256Json(manifestWithoutFingerprint),
  };
  const manifestPath = path.join(
    input.output_directory,
    "project-experience-fixture.v1.json",
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
    source_project_root: sourceDirectory,
  };
}

export function admitProjectExperienceRenderedStateV1(input: {
  database_path: string;
  manifest: ProjectExperienceBrowserFixtureManifestV1;
  admitted_at: string;
}): { delegated_run_id: typeof PROJECT_EXPERIENCE_PRESENTATION_RUN_ID_V1 } {
  const database = new Database(input.database_path, { fileMustExist: true });
  try {
    database.pragma("foreign_keys = ON");
    touchRecentProjectV01(database, {
      workspace_id: input.manifest.workspace_id,
      project_id: input.manifest.project_id,
      now: input.admitted_at,
    });
    const active = readActiveProjectSelectionV01(
      database,
      input.manifest.workspace_id,
    );
    selectActiveProjectV01(database, {
      workspace_id: input.manifest.workspace_id,
      project_id: input.manifest.project_id,
      now: input.admitted_at,
      expected_project_id: active?.project_id ?? null,
      expected_revision: active?.selection_revision ?? null,
    });
    const proposalListSupplements = buildProposalListSupplements({
      workspace_id: input.manifest.workspace_id,
      project_id: input.manifest.project_id,
    });
    assert.deepEqual(
      proposalListSupplements.map((entry) => ({
        proposal_id: entry.proposal.proposal_id,
        proposal_fingerprint: entry.proposal.integrity.fingerprint,
      })),
      input.manifest.rendered_state_inputs.proposal_list_supplements,
    );
    for (const supplement of proposalListSupplements) {
      const packetWrite = insertVNextCoreRecordV01(database, {
        record_kind: "task_context_packet",
        record_id: supplement.packet.packet_id,
        workspace_id: supplement.packet.workspace_id,
        project_id: supplement.packet.project_id,
        fingerprint: supplement.packet.integrity.fingerprint,
        idempotency_key: null,
        payload: supplement.packet,
        created_at: supplement.packet.generated_at,
      });
      assert.equal(
        ["inserted", "exact_replay"].includes(packetWrite.status),
        true,
      );
      const receiptWrite = admitStructuredRunReceiptV01(
        database,
        supplement.receipt,
      );
      assert.equal(receiptWrite.status, "inserted");
      const proposalWrite = insertVNextCoreRecordV01(database, {
        record_kind: "episode_delta_proposal",
        record_id: supplement.proposal.proposal_id,
        workspace_id: supplement.proposal.workspace_id,
        project_id: supplement.proposal.project_id,
        fingerprint: supplement.proposal.integrity.fingerprint,
        idempotency_key: null,
        payload: supplement.proposal,
        created_at: supplement.proposal.created_at,
      });
      assert.equal(proposalWrite.status, "inserted");
    }
    const admittedAtMs = Date.parse(input.admitted_at);
    assert.equal(Number.isFinite(admittedAtMs), true);
    insertAutonomyRunLedgerRecord(
      {
        run_id: PROJECT_EXPERIENCE_PRESENTATION_RUN_ID_V1,
        scope: input.manifest.project_id,
        autonomy_contract_ref: DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
        title: "Rendered delegated work fixture",
        status: "paused",
        scheduled_for: null,
        started_at: input.admitted_at,
        finished_at: null,
        created_at: input.admitted_at,
        updated_at: input.admitted_at,
        stop_reason: null,
        source_refs: buildDefaultRunnerSourceRefs({
          runner_refs: [PROJECT_EXPERIENCE_PRESENTATION_RUN_ID_V1],
        }),
        authority_boundary: buildDefaultRunnerAuthorityBoundary(),
        budget_snapshot: buildDefaultRunnerBudgetSnapshot({
          budget_id: "budget:project-experience-rendered-state-v1",
        }),
        metadata: {
          workspace_id: input.manifest.workspace_id,
          project_id: input.manifest.project_id,
          invocation_origin: "interactive",
          lifecycle_mode: "managed_live",
          reconciliation_required: true,
          automatic_retry: false,
          presentation_fixture_version: PROJECT_EXPERIENCE_FIXTURE_VERSION_V1,
          execution_authority: false,
          presentation_only: true,
        },
      },
      [],
      [
        {
          event_id: "event:project-experience-rendered-state-delegated",
          run_id: PROJECT_EXPERIENCE_PRESENTATION_RUN_ID_V1,
          step_id: null,
          event_type: "run_created",
          status: "running",
          message: "Presentation fixture admitted delegated work.",
          payload: { presentation_only: true },
          created_at: new Date(admittedAtMs - 1_000).toISOString(),
        },
        {
          event_id: "event:project-experience-rendered-state-interrupted",
          run_id: PROJECT_EXPERIENCE_PRESENTATION_RUN_ID_V1,
          step_id: null,
          event_type: "run_reconciliation_required",
          status: "paused",
          message: "Presentation fixture requires explicit resume.",
          payload: { presentation_only: true },
          created_at: input.admitted_at,
        },
      ],
      { db: database },
    );
    assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
  } finally {
    database.close();
  }
  return { delegated_run_id: PROJECT_EXPERIENCE_PRESENTATION_RUN_ID_V1 };
}

function buildProposalListSupplements(input: {
  workspace_id: string;
  project_id: string;
}) {
  return [1, 2].map((index) => {
    const project = {
      fixture_id: `project-experience-proposal-list-${index}`,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      run_id: `run:project-experience-proposal-list-${index}`,
    };
    const packet = buildSemanticReviewLoopTaskContextPacketFixture(project, {
      data_classification: "public_safe",
    });
    const anchor = `2026-07-0${index}T00:00:00.000Z`;
    const receipt = buildSemanticReviewLoopRunReceiptFixture(project, packet, {
      timeline_anchor_at: anchor,
    });
    const proposal = buildSemanticReviewLoopProposalFixture(
      project,
      packet,
      receipt,
      {
        candidate_namespace: `project-experience-${index}`,
        timeline_anchor_at: anchor,
      },
    );
    return { packet, receipt, proposal };
  });
}

export function admitExpiredProjectContextPresentationV1(input: {
  database_path: string;
  project_id: string;
  marker: string;
}): { packet_id: string } {
  const database = new Database(input.database_path, { fileMustExist: true });
  try {
    database.pragma("foreign_keys = ON");
    const project = database
      .prepare(
        "SELECT workspace_id, project_id FROM vnext_project_identities WHERE project_id = ?",
      )
      .get(input.project_id) as
      | { workspace_id: string; project_id: string }
      | undefined;
    assert(project, "project experience expired-context project missing");
    const latestPacket = database
      .prepare(
        `SELECT created_at
           FROM vnext_core_records
          WHERE workspace_id = ? AND project_id = ?
            AND record_kind = 'task_context_packet'
          ORDER BY created_at DESC, record_id DESC
          LIMIT 1`,
      )
      .get(project.workspace_id, project.project_id) as
      | { created_at: string }
      | undefined;
    const generatedAt = latestPacket
      ? new Date(Date.parse(latestPacket.created_at) + 1).toISOString()
      : TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT;
    const expiresAt = latestPacket
      ? new Date(Date.parse(generatedAt) + 1).toISOString()
      : TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT;
    const packetInput: TaskContextPacketBuilderInputV01 = structuredClone(
      genericCliBuilderInputFixture,
    );
    packetInput.workspace_id = project.workspace_id;
    packetInput.project_id = project.project_id;
    packetInput.generated_at = generatedAt;
    packetInput.expires_at = expiresAt;
    packetInput.current_projection = {
      projection_kind: "current_working_perspective",
      projection_only: true,
      canonical_state: false,
      perspective_ref: "perspective:project-experience-expired-context-v1",
      bounded_summary: input.marker,
      as_of: generatedAt,
      items: [
        {
          item_kind: "frame",
          summary: input.marker,
          source_refs: ["source:project-experience-expired-context-v1"],
          external_refs: [],
          currentness: structuredClone(packetInput.source_status.currentness),
        },
      ],
      source_refs: ["source:project-experience-expired-context-v1"],
      external_refs: [],
      currentness: structuredClone(packetInput.source_status.currentness),
      warnings: [],
    };
    packetInput.gaps = [];
    const packet = buildTaskContextPacketV01(packetInput);
    insertVNextCoreRecordV01(database, {
      record_kind: "task_context_packet",
      record_id: packet.packet_id,
      workspace_id: packet.workspace_id,
      project_id: packet.project_id,
      fingerprint: packet.integrity.fingerprint,
      idempotency_key: null,
      payload: packet,
      created_at: packet.generated_at,
    });
    return { packet_id: packet.packet_id };
  } finally {
    database.close();
  }
}

export function projectExperienceFixtureFingerprintV1(
  manifest: ProjectExperienceBrowserFixtureManifestV1,
): string {
  const { fixture_fingerprint: _fingerprint, ...material } = manifest;
  return sha256Json(material);
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
