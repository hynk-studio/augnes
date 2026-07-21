import { TextDecoder } from "node:util";
import { randomUUID } from "node:crypto";
import { lstatSync, mkdirSync, rmdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import packageMetadata from "@/package.json";
import {
  admitPortablePersonalPerspectiveScopeInsideTransactionV01,
  readPersonalPerspectiveEffectiveScopeV01,
  readPersonalPerspectiveProjectScopeV01,
} from "@/lib/vnext/persistence/project-control-store";
import {
  admitPortableProjectIdentityInsideTransactionV01,
  nativeLocalProjectPathFlavorV01,
  readCanonicalProjectIdentityV01,
  readCanonicalProjectWithRootV01,
  readDefaultWorkspaceIdentityV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  deriveVNextSemanticTargetKeyV01,
  insertVNextCoreRecordV01,
  deleteVNextSemanticStateEntryCasV01,
  insertVNextSemanticStateEntryV01,
  insertVNextSemanticTargetHeadV01,
  rebuildVNextPersistedSemanticStateV01,
  type VNextCoreRecordEnvelopeV01,
  type VNextCoreRecordKindV01,
  type VNextPersistedSemanticStateVersionV01,
  type VNextSemanticStateProjectionEntryV01,
  type VNextSemanticTargetHeadV01,
  updateVNextSemanticStateEntryCasV01,
  updateVNextSemanticTargetHeadCasV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { isPersonalPerspectiveSelectedEntryV01 } from "@/lib/vnext/project-controls/project-controls";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import { validateRecoveryCanonicalDatabaseV01 } from "@/scripts/recovery-canonical-record-validator";
import { applyCanonicalDatabaseMigrations } from "@/scripts/canonical-database-migrations.mjs";
import type { VNextSemanticCommitGateRecordV01 } from "@/lib/vnext/runtime/durable-semantic-transition";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import {
  PORTABLE_PROJECT_CANONICALIZATION_V01,
  PORTABLE_PROJECT_CONTRACT_V01,
  PORTABLE_PROJECT_CONTRACT_VERSION_V01,
  type PortableProjectPreviewV01,
  type PortableProjectV01,
} from "@/types/vnext/portable-project";

export const PORTABLE_PROJECT_SUPPORTED_RECORD_KINDS_V01 = Object.freeze([
  "evidence_record",
  "claim_record",
  "claim_evidence_relation",
  "episode_delta_proposal",
  "review_decision",
  "semantic_commit_gate",
  "semantic_state",
  "state_transition_receipt",
  "task_context_packet",
  "run_receipt",
  "context_use_review",
] as const satisfies readonly VNextCoreRecordKindV01[]);

export const PORTABLE_PROJECT_EXCLUDED_CATEGORIES_V01 = Object.freeze([
  "automation_work_items_and_capability_grants",
  "credentials_tokens_cookies_and_session_secrets",
  "raw_prompts_transcripts_reasoning_and_provider_payloads",
  "terminal_output_unbounded_logs_and_ephemeral_host_state",
  "absolute_local_paths_and_unrelated_projects",
  "rebuildable_layout_ranking_cache_and_diagnostics",
] as const);

export const MAX_PORTABLE_PROJECT_BYTES_V01 = 16 * 1024 * 1024;
export const MAX_PORTABLE_PROJECT_RECORDS_V01 = 4_096;

const PACKAGE_KEYS = [
  "contract",
  "contract_version",
  "manifest",
  "records",
  "operator_provenance_sessions",
  "personal_perspective_scope",
  "integrity",
] as const;
const MANIFEST_KEYS = [
  "application_version",
  "build_identity",
  "package_contract",
  "package_contract_version",
  "runtime_contract",
  "runtime_schema_version",
  "database_schema_contract",
  "database_migration_contract",
  "database_migration_contract_version",
  "database_migration_ids",
  "canonical_record_contract",
  "canonical_record_contract_version",
  "portability_contract",
  "source_compatibility",
  "exported_at",
  "workspace",
  "project",
  "record_kinds",
  "record_counts",
  "record_count",
  "source_lineage_record_count",
  "personal_perspective",
  "exclusions",
  "warnings",
  "content_fingerprint",
] as const;
const PERSONAL_MANIFEST_KEYS = [
  "consented",
  "source_scope",
  "included",
  "excluded_record_count",
] as const;
const INTEGRITY_KEYS = [
  "algorithm",
  "canonicalization",
  "fingerprint_scope",
  "fingerprint",
] as const;
const RECORD_KEYS = [
  "record_kind",
  "record_id",
  "workspace_id",
  "project_id",
  "fingerprint",
  "idempotency_key",
  "payload",
  "created_at",
] as const;
const PROVENANCE_SESSION_KEYS = [
  "session_id",
  "workspace_id",
  "project_id",
  "operator_id",
  "issued_at",
  "expires_at",
  "bootstrap_consumed_at",
  "source_revoked_at",
  "action_nonce_expires_at",
] as const;
const FORBIDDEN_MATERIAL_KEY = /^(?:raw_)?(?:prompt|transcript|hidden_reasoning|reasoning|provider_(?:request|response|payload|output)|stdout|stderr|terminal_output|credential|credentials|token|tokens|secret|secrets|api_key|cookie|cookies)$/iu;
const PATH_MATERIAL_KEY = /(?:^|_)(?:absolute_)?(?:path|root|cwd|working_directory)$/iu;
const SECRET_VALUE = /(?:\bBearer\s+[A-Za-z0-9._~+\/-]{12,}|\b(?:sk|ghp|github_pat)_[A-Za-z0-9_-]{12,})/u;

export class PortableProjectErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 422) {
    super(code);
    this.name = "PortableProjectErrorV01";
  }
}

export interface PortableProjectExportResultV01 {
  package: PortableProjectV01;
  bytes: Uint8Array;
  filename: string;
}

export interface PortableProjectImportResultV01 {
  contract: "augnes.portable-project-import-result.v1";
  status: "imported" | "exact_replay";
  reason_code: "portable_project_imported" | "portable_project_exact_replay";
  workspace_id: string;
  project_id: string;
  project_home_href: string;
  record_count: number;
  projection_reader_verification: "verified";
  semantic_authority_created: false;
  automation_authority_created: false;
  external_action_created: false;
  next_action: "open_imported_project_home";
}

export function previewActivePortableProjectV01(
  db: Database.Database,
): PortableProjectPreviewV01 {
  const scope = requireActiveProjectScopeV01(db);
  const all = readBoundedProjectRecordsV01(db, scope);
  const personal = readPersonalPerspectiveEffectiveScopeV01(db, scope);
  const personalBound = all.filter(recordContainsPersonalPerspectiveV01);
  const selected = selectPortableRecordsV01(all, false);
  return {
    contract: "augnes.portable-project-preview.v1",
    active_project: true,
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
    project_display_name: scope.display_name,
    record_kinds: presentKindsV01(selected.records),
    record_counts: countKindsV01(selected.records),
    record_count: selected.records.length,
    source_lineage_record_count: countSourceLineageRecordsV01(selected.records),
    personal_perspective: {
      source_scope: personal.status,
      included_by_default: false,
      consent_available: personal.status === "included",
      bound_record_count: personalBound.length,
    },
    excluded_categories: [...PORTABLE_PROJECT_EXCLUDED_CATEGORIES_V01],
    warnings: selected.warnings,
    compatibility_version: 1,
    export_available: true,
  };
}

export function exportActivePortableProjectV01(
  db: Database.Database,
  input: { include_personal_perspective: boolean; exported_at?: string },
): PortableProjectExportResultV01 {
  if (typeof input.include_personal_perspective !== "boolean") {
    refuseV01("portable_project_consent_invalid");
  }
  const exportedAt = input.exported_at ?? new Date().toISOString();
  if (parseStrictIsoTimestampV01(exportedAt) === null) {
    refuseV01("portable_project_timestamp_invalid");
  }
  const scope = requireActiveProjectScopeV01(db);
  const workspace = readDefaultWorkspaceIdentityV01(db);
  const project = readCanonicalProjectIdentityV01(db, scope);
  if (!workspace || !project) refuseV01("portable_project_scope_unavailable", 409);
  const effectivePersonal = readPersonalPerspectiveEffectiveScopeV01(db, scope);
  if (
    input.include_personal_perspective &&
    effectivePersonal.status !== "included"
  ) {
    refuseV01("portable_project_personal_scope_not_included", 409);
  }
  const sourceRecords = readBoundedProjectRecordsV01(db, scope);
  const selected = selectPortableRecordsV01(
    sourceRecords,
    input.include_personal_perspective,
  );
  for (const record of selected.records) {
    assertPortableRecordMaterialV01(record, scope);
  }
  const personalScope = input.include_personal_perspective
    ? readPersonalPerspectiveProjectScopeV01(db, scope)
    : null;
  if (input.include_personal_perspective && personalScope?.selection !== "included") {
    refuseV01("portable_project_personal_scope_not_included", 409);
  }
  const operatorProvenanceSessions = readPortableOperatorProvenanceSessionsV01(
    db,
    selected.records,
    scope,
  );
  const contentFingerprint = portableContentFingerprintV01({
    workspace,
    project,
    records: selected.records,
    operator_provenance_sessions: operatorProvenanceSessions,
    personal_perspective_scope: personalScope,
  });
  const manifest: PortableProjectV01["manifest"] = {
    application_version: packageMetadata.version,
    build_identity:
      process.env.AUGNES_BUILD_IDENTITY ?? `source:${packageMetadata.version}`,
    package_contract: "augnes.distributable.v1",
    package_contract_version: 2,
    runtime_contract: "augnes-local-runtime-supervisor-v1",
    runtime_schema_version: 2,
    database_schema_contract: "augnes.sqlite.structural-schema.v1",
    database_migration_contract: "augnes.canonical-database-migrations.v1",
    database_migration_contract_version: 1,
    database_migration_ids: ["0001_r8_recovery_contract"],
    canonical_record_contract: "augnes.vnext-canonical-records.v1",
    canonical_record_contract_version: 1,
    portability_contract: PORTABLE_PROJECT_CONTRACT_V01,
    source_compatibility: "exact_current_v1",
    exported_at: exportedAt,
    workspace,
    project,
    record_kinds: presentKindsV01(selected.records),
    record_counts: countKindsV01(selected.records),
    record_count: selected.records.length,
    source_lineage_record_count: countSourceLineageRecordsV01(selected.records),
    personal_perspective: {
      consented: input.include_personal_perspective,
      source_scope: effectivePersonal.status,
      included: personalScope?.selection === "included",
      excluded_record_count: selected.excludedPersonalCount,
    },
    exclusions: [...PORTABLE_PROJECT_EXCLUDED_CATEGORIES_V01],
    warnings: selected.warnings,
    content_fingerprint: contentFingerprint,
  };
  const withoutIntegrity = {
    contract: PORTABLE_PROJECT_CONTRACT_V01,
    contract_version: PORTABLE_PROJECT_CONTRACT_VERSION_V01,
    manifest,
    records: selected.records,
    operator_provenance_sessions: operatorProvenanceSessions,
    personal_perspective_scope: personalScope,
  };
  const portablePackage: PortableProjectV01 = {
    ...withoutIntegrity,
    integrity: {
      algorithm: "sha256",
      canonicalization: PORTABLE_PROJECT_CANONICALIZATION_V01,
      fingerprint_scope: "portable_project_without_integrity",
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(withoutIntegrity),
      ),
    },
  };
  const serialized = `${canonicalizeProtocolValueV01(portablePackage)}\n`;
  const bytes = new TextEncoder().encode(serialized);
  if (bytes.byteLength > MAX_PORTABLE_PROJECT_BYTES_V01) {
    refuseV01("portable_project_size_exceeded", 413);
  }
  return {
    package: portablePackage,
    bytes,
    filename: `${portableFilenameSegmentV01(project.display_name ?? "project")}.augnes-project.json`,
  };
}

export function parseAndValidatePortableProjectV01(
  bytes: Uint8Array,
): PortableProjectV01 {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) {
    refuseV01("portable_project_bytes_invalid");
  }
  if (bytes.byteLength > MAX_PORTABLE_PROJECT_BYTES_V01) {
    refuseV01("portable_project_size_exceeded", 413);
  }
  let text: string;
  let value: unknown;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    value = JSON.parse(text) as unknown;
  } catch {
    refuseV01("portable_project_json_invalid");
  }
  assertPlainRecordV01(value, "portable_project_shape_invalid");
  assertExactKeysV01(value, PACKAGE_KEYS, "portable_project_shape_invalid");
  const candidate = value as unknown as PortableProjectV01;
  assertPlainRecordV01(candidate.manifest, "portable_project_manifest_invalid");
  assertExactKeysV01(candidate.manifest, MANIFEST_KEYS, "portable_project_manifest_invalid");
  assertPlainRecordV01(
    candidate.manifest.personal_perspective,
    "portable_project_manifest_invalid",
  );
  assertExactKeysV01(
    candidate.manifest.personal_perspective,
    PERSONAL_MANIFEST_KEYS,
    "portable_project_manifest_invalid",
  );
  assertPlainRecordV01(candidate.integrity, "portable_project_integrity_invalid");
  assertExactKeysV01(candidate.integrity, INTEGRITY_KEYS, "portable_project_integrity_invalid");
  if (
    candidate.contract !== PORTABLE_PROJECT_CONTRACT_V01 ||
    candidate.contract_version !== PORTABLE_PROJECT_CONTRACT_VERSION_V01 ||
    candidate.manifest.portability_contract !== PORTABLE_PROJECT_CONTRACT_V01 ||
    candidate.manifest.application_version !== packageMetadata.version ||
    candidate.manifest.package_contract !== "augnes.distributable.v1" ||
    candidate.manifest.package_contract_version !== 2 ||
    candidate.manifest.runtime_contract !== "augnes-local-runtime-supervisor-v1" ||
    candidate.manifest.runtime_schema_version !== 2 ||
    candidate.manifest.database_schema_contract !== "augnes.sqlite.structural-schema.v1" ||
    candidate.manifest.database_migration_contract !== "augnes.canonical-database-migrations.v1" ||
    candidate.manifest.database_migration_contract_version !== 1 ||
    canonicalizeProtocolValueV01(candidate.manifest.database_migration_ids) !==
      canonicalizeProtocolValueV01(["0001_r8_recovery_contract"]) ||
    candidate.manifest.canonical_record_contract !== "augnes.vnext-canonical-records.v1" ||
    candidate.manifest.canonical_record_contract_version !== 1 ||
    candidate.manifest.source_compatibility !== "exact_current_v1" ||
    parseStrictIsoTimestampV01(candidate.manifest.exported_at) === null ||
    candidate.integrity.algorithm !== "sha256" ||
    candidate.integrity.canonicalization !== PORTABLE_PROJECT_CANONICALIZATION_V01 ||
    candidate.integrity.fingerprint_scope !== "portable_project_without_integrity" ||
    !validSha256V01(candidate.integrity.fingerprint) ||
    !validSha256V01(candidate.manifest.content_fingerprint)
  ) {
    refuseV01("portable_project_compatibility_invalid");
  }
  if (!Array.isArray(candidate.records) || candidate.records.length > MAX_PORTABLE_PROJECT_RECORDS_V01) {
    refuseV01("portable_project_record_count_invalid");
  }
  const scope = {
    workspace_id: candidate.manifest.workspace.workspace_id,
    project_id: candidate.manifest.project.project_id,
  };
  if (
    !Array.isArray(candidate.operator_provenance_sessions) ||
    candidate.operator_provenance_sessions.length > 64
  ) {
    refuseV01("portable_project_provenance_invalid");
  }
  const provenanceIds = new Set<string>();
  for (const session of candidate.operator_provenance_sessions) {
    assertPlainRecordV01(session, "portable_project_provenance_invalid");
    assertExactKeysV01(session, PROVENANCE_SESSION_KEYS, "portable_project_provenance_invalid");
    if (
      provenanceIds.has(session.session_id) ||
      session.workspace_id !== scope.workspace_id ||
      session.project_id !== scope.project_id ||
      !session.session_id.startsWith("vnext-local-operator-session:") ||
      typeof session.operator_id !== "string" ||
      parseStrictIsoTimestampV01(session.issued_at) === null ||
      parseStrictIsoTimestampV01(session.expires_at) === null ||
      parseStrictIsoTimestampV01(session.bootstrap_consumed_at) === null ||
      (session.source_revoked_at !== null &&
        parseStrictIsoTimestampV01(session.source_revoked_at) === null) ||
      parseStrictIsoTimestampV01(session.action_nonce_expires_at) === null
    ) {
      refuseV01("portable_project_provenance_invalid");
    }
    provenanceIds.add(session.session_id);
  }
  if (
    canonicalizeProtocolValueV01(candidate.operator_provenance_sessions) !==
      canonicalizeProtocolValueV01(
        [...candidate.operator_provenance_sessions].sort((left, right) =>
          left.session_id.localeCompare(right.session_id),
        ),
      ) ||
    candidate.records
      .filter((record) => record.record_kind === "review_decision")
      .some((record) => {
        const decision = record.payload as {
          authorization_basis_refs?: Array<{ ref_type?: string; external_id?: string }>;
        };
        const refs = decision.authorization_basis_refs?.filter(
          (ref) => ref.ref_type === "local_operator_session_action",
        ) ?? [];
        return refs.length !== 1 || !provenanceIds.has(refs[0]!.external_id ?? "");
      })
  ) {
    refuseV01("portable_project_provenance_invalid");
  }
  const identities = new Set<string>();
  for (const record of candidate.records) {
    assertPlainRecordV01(record, "portable_project_record_invalid");
    assertExactKeysV01(record, RECORD_KEYS, "portable_project_record_invalid");
    if (
      !PORTABLE_PROJECT_SUPPORTED_RECORD_KINDS_V01.includes(
        record.record_kind as (typeof PORTABLE_PROJECT_SUPPORTED_RECORD_KINDS_V01)[number],
      ) ||
      record.workspace_id !== scope.workspace_id ||
      record.project_id !== scope.project_id ||
      identities.has(`${record.record_kind}\0${record.record_id}`)
    ) {
      refuseV01("portable_project_record_scope_invalid");
    }
    identities.add(`${record.record_kind}\0${record.record_id}`);
    assertPortableRecordMaterialV01(record, scope);
  }
  const sorted = sortRecordsV01(candidate.records);
  if (canonicalizeProtocolValueV01(sorted) !== canonicalizeProtocolValueV01(candidate.records)) {
    refuseV01("portable_project_order_invalid");
  }
  if (
    candidate.manifest.record_count !== candidate.records.length ||
    canonicalizeProtocolValueV01(candidate.manifest.record_kinds) !==
      canonicalizeProtocolValueV01(presentKindsV01(candidate.records)) ||
    canonicalizeProtocolValueV01(candidate.manifest.record_counts) !==
      canonicalizeProtocolValueV01(countKindsV01(candidate.records)) ||
    candidate.manifest.source_lineage_record_count !==
      countSourceLineageRecordsV01(candidate.records) ||
    candidate.manifest.personal_perspective.included !==
      (candidate.personal_perspective_scope?.selection === "included") ||
    candidate.manifest.personal_perspective.consented !==
      candidate.manifest.personal_perspective.included ||
    (!candidate.manifest.personal_perspective.consented &&
      candidate.records.some(recordContainsPersonalPerspectiveV01))
  ) {
    refuseV01("portable_project_manifest_invalid");
  }
  if (candidate.personal_perspective_scope) {
    if (
      candidate.personal_perspective_scope.workspace_id !== scope.workspace_id ||
      candidate.personal_perspective_scope.project_id !== scope.project_id ||
      candidate.personal_perspective_scope.selection !== "included"
    ) {
      refuseV01("portable_project_personal_scope_invalid");
    }
  }
  const expectedContent = portableContentFingerprintV01({
    workspace: candidate.manifest.workspace,
    project: candidate.manifest.project,
    records: candidate.records,
    operator_provenance_sessions: candidate.operator_provenance_sessions,
    personal_perspective_scope: candidate.personal_perspective_scope,
  });
  const { integrity: _integrity, ...withoutIntegrity } = candidate;
  if (
    candidate.manifest.content_fingerprint !== expectedContent ||
    createProtocolSha256V01(canonicalizeProtocolValueV01(withoutIntegrity)) !==
      candidate.integrity.fingerprint ||
    text !== `${canonicalizeProtocolValueV01(candidate)}\n`
  ) {
    refuseV01("portable_project_integrity_invalid");
  }
  validatePortablePackageSemanticsV01(candidate);
  return candidate;
}

export function importPortableProjectV01(
  db: Database.Database,
  input: {
    bytes: Uint8Array;
    destination_root_base: string;
    imported_at?: string;
  },
): PortableProjectImportResultV01 {
  const portablePackage = parseAndValidatePortableProjectV01(input.bytes);
  const importedAt = input.imported_at ?? new Date().toISOString();
  if (parseStrictIsoTimestampV01(importedAt) === null) {
    refuseV01("portable_project_timestamp_invalid");
  }
  const rootBase = path.resolve(input.destination_root_base);
  if (!path.isAbsolute(input.destination_root_base)) {
    refuseV01("portable_project_destination_invalid");
  }
  ensureSafeExistingDirectoryV01(rootBase, "portable_project_destination_invalid");
  const projectSegment = portablePackage.manifest.project.project_id.slice("project:".length);
  const destinationRoot = path.join(rootBase, projectSegment);
  if (path.dirname(destinationRoot) !== rootBase) {
    refuseV01("portable_project_destination_invalid");
  }
  const existingProject = readCanonicalProjectWithRootV01(db, {
    workspace_id: portablePackage.manifest.workspace.workspace_id,
    project_id: portablePackage.manifest.project.project_id,
  });
  let createdRoot = false;
  if (!existingProject) {
    try {
      mkdirSync(destinationRoot, { mode: 0o700 });
      createdRoot = true;
    } catch {
      refuseV01("portable_project_destination_conflict", 409);
    }
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitPortableProjectIdentityInsideTransactionV01(db, {
      workspace: portablePackage.manifest.workspace,
      project: portablePackage.manifest.project,
      local_root: {
        local_root_ref_version: "local_project_root_ref.v0.1",
        ref_kind: "local_project_root",
        path_flavor: nativeLocalProjectPathFlavorV01(),
        normalized_path: destinationRoot,
      },
      bound_at: importedAt,
    });
    assertExistingPortableContentV01(db, portablePackage, admission.status);
    for (const record of portablePackage.records) {
      const write = insertVNextCoreRecordV01(db, record);
      if (admission.status === "inserted" && write.status !== "inserted") {
        refuseV01("portable_project_content_conflict", 409);
      }
    }
    if (admission.status === "inserted") {
      admitPortableOperatorProvenanceSessionsV01(
        db,
        portablePackage.operator_provenance_sessions,
        importedAt,
      );
    }
    if (portablePackage.personal_perspective_scope) {
      admitPortablePersonalPerspectiveScopeInsideTransactionV01(
        db,
        portablePackage.personal_perspective_scope,
      );
    }
    if (admission.status === "inserted") {
      rebuildPortableSemanticReaderProjectionV01(db, portablePackage.records);
      touchRecentProjectV01(db, {
        workspace_id: portablePackage.manifest.workspace.workspace_id,
        project_id: portablePackage.manifest.project.project_id,
        now: importedAt,
      });
      const active = readActiveProjectSelectionV01(
        db,
        portablePackage.manifest.workspace.workspace_id,
      );
      selectActiveProjectV01(db, {
        workspace_id: portablePackage.manifest.workspace.workspace_id,
        project_id: portablePackage.manifest.project.project_id,
        now: importedAt,
        expected_project_id: active?.project_id ?? null,
        expected_revision: active?.selection_revision ?? null,
      });
    }
    const validation = validateRecoveryCanonicalDatabaseV01(db);
    if (validation.status !== "valid") {
      refuseV01(validation.code, 409);
    }
    db.exec("COMMIT");
    const replay = admission.status === "exact_replay";
    return {
      contract: "augnes.portable-project-import-result.v1",
      status: replay ? "exact_replay" : "imported",
      reason_code: replay
        ? "portable_project_exact_replay"
        : "portable_project_imported",
      workspace_id: portablePackage.manifest.workspace.workspace_id,
      project_id: portablePackage.manifest.project.project_id,
      project_home_href: `/projects/${encodeURIComponent(portablePackage.manifest.project.project_id)}`,
      record_count: portablePackage.records.length,
      projection_reader_verification: "verified",
      semantic_authority_created: false,
      automation_authority_created: false,
      external_action_created: false,
      next_action: "open_imported_project_home",
    };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    if (createdRoot) {
      try {
        rmdirSync(destinationRoot);
      } catch {
        // A non-empty or identity-changed root is not removed blindly.
      }
    }
    throw error;
  }
}

function requireActiveProjectScopeV01(db: Database.Database): {
  workspace_id: string;
  project_id: string;
  display_name: string | null;
} {
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace) refuseV01("portable_project_workspace_unavailable", 409);
  const active = readActiveProjectSelectionV01(db, workspace.workspace_id);
  if (!active) refuseV01("portable_project_active_project_unavailable", 409);
  const project = readCanonicalProjectIdentityV01(db, active);
  if (!project) refuseV01("portable_project_active_project_unavailable", 409);
  return {
    workspace_id: workspace.workspace_id,
    project_id: active.project_id,
    display_name: project.display_name,
  };
}

function readBoundedProjectRecordsV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
): VNextCoreRecordEnvelopeV01[] {
  const count = db.prepare(
    `SELECT COUNT(*) AS count FROM vnext_core_records
     WHERE workspace_id = ? AND project_id = ?
       AND record_kind IN (${PORTABLE_PROJECT_SUPPORTED_RECORD_KINDS_V01.map(() => "?").join(",")})`,
  ).get(
    scope.workspace_id,
    scope.project_id,
    ...PORTABLE_PROJECT_SUPPORTED_RECORD_KINDS_V01,
  ) as { count: number };
  if (count.count > MAX_PORTABLE_PROJECT_RECORDS_V01) {
    refuseV01("portable_project_record_count_exceeded", 413);
  }
  const rows = db.prepare(
    `SELECT record_kind, record_id, workspace_id, project_id, fingerprint,
            idempotency_key, payload_json, created_at
       FROM vnext_core_records
      WHERE workspace_id = ? AND project_id = ?
        AND record_kind IN (${PORTABLE_PROJECT_SUPPORTED_RECORD_KINDS_V01.map(() => "?").join(",")})
      ORDER BY record_kind, record_id`,
  ).all(
    scope.workspace_id,
    scope.project_id,
    ...PORTABLE_PROJECT_SUPPORTED_RECORD_KINDS_V01,
  ) as Array<{
    record_kind: VNextCoreRecordKindV01;
    record_id: string;
    workspace_id: string;
    project_id: string;
    fingerprint: string;
    idempotency_key: string | null;
    payload_json: string;
    created_at: string;
  }>;
  return rows.map((row) => ({
    record_kind: row.record_kind,
    record_id: row.record_id,
    workspace_id: row.workspace_id,
    project_id: row.project_id,
    fingerprint: row.fingerprint,
    idempotency_key: row.idempotency_key,
    payload: JSON.parse(row.payload_json) as unknown,
    created_at: row.created_at,
  }));
}

function selectPortableRecordsV01(
  source: VNextCoreRecordEnvelopeV01[],
  includePersonal: boolean,
): {
  records: VNextCoreRecordEnvelopeV01[];
  excludedPersonalCount: number;
  warnings: string[];
} {
  if (includePersonal) {
    return { records: sortRecordsV01(source), excludedPersonalCount: 0, warnings: [] };
  }
  const excluded = new Map<string, VNextCoreRecordEnvelopeV01>();
  for (const record of source) {
    if (recordContainsPersonalPerspectiveV01(record)) {
      excluded.set(recordKeyV01(record), record);
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    const excludedBindings = new Set(
      [...excluded.values()].flatMap((record) => [record.record_id, record.fingerprint]),
    );
    for (const record of source) {
      if (excluded.has(recordKeyV01(record))) continue;
      if (containsAnyStringV01(record.payload, excludedBindings)) {
        excluded.set(recordKeyV01(record), record);
        changed = true;
      }
    }
  }
  const records = sortRecordsV01(
    source.filter((record) => !excluded.has(recordKeyV01(record))),
  );
  return {
    records,
    excludedPersonalCount: excluded.size,
    warnings:
      excluded.size > 0
        ? [
            `${excluded.size} source-bound Personal Perspective record${excluded.size === 1 ? "" : "s"} and dependent lineage were excluded.`,
          ]
        : [],
  };
}

function recordContainsPersonalPerspectiveV01(
  record: VNextCoreRecordEnvelopeV01,
): boolean {
  if (record.record_kind !== "task_context_packet") return false;
  const packet = record.payload as TaskContextPacketV01;
  return (
    Array.isArray(packet.selected_context) &&
    packet.selected_context.some(isPersonalPerspectiveSelectedEntryV01)
  );
}

function assertPortableRecordMaterialV01(
  record: VNextCoreRecordEnvelopeV01,
  scope: { workspace_id: string; project_id: string },
): void {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
    fingerprint: record.fingerprint,
  });
  walkV01(record.payload, (key, value) => {
    if (FORBIDDEN_MATERIAL_KEY.test(key) && value !== false && value !== null) {
      refuseV01("portable_project_private_material_forbidden");
    }
    if (key === "workspace_id" && value !== scope.workspace_id) {
      refuseV01("portable_project_cross_workspace_reference");
    }
    if (key === "project_id" && value !== scope.project_id) {
      refuseV01("portable_project_cross_project_reference");
    }
    if (
      typeof value === "string" &&
      (SECRET_VALUE.test(value) ||
        (PATH_MATERIAL_KEY.test(key) &&
          (path.posix.isAbsolute(value) || path.win32.isAbsolute(value))))
    ) {
      refuseV01("portable_project_private_material_forbidden");
    }
  });
}

function validatePortablePackageSemanticsV01(
  portablePackage: PortableProjectV01,
): void {
  const db = new Database(":memory:");
  try {
    db.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(db);
    db.exec("BEGIN IMMEDIATE");
    admitPortableProjectIdentityInsideTransactionV01(db, {
      workspace: portablePackage.manifest.workspace,
      project: portablePackage.manifest.project,
      local_root: {
        local_root_ref_version: "local_project_root_ref.v0.1",
        ref_kind: "local_project_root",
        path_flavor: nativeLocalProjectPathFlavorV01(),
        normalized_path: path.resolve(
          path.sep,
          "augnes-portable-validation",
          portablePackage.manifest.project.project_id.slice("project:".length),
        ),
      },
      bound_at: portablePackage.manifest.exported_at,
    });
    for (const record of portablePackage.records) {
      insertVNextCoreRecordV01(db, record);
    }
    admitPortableOperatorProvenanceSessionsV01(
      db,
      portablePackage.operator_provenance_sessions,
      portablePackage.manifest.exported_at,
    );
    if (portablePackage.personal_perspective_scope) {
      admitPortablePersonalPerspectiveScopeInsideTransactionV01(
        db,
        portablePackage.personal_perspective_scope,
      );
    }
    rebuildPortableSemanticReaderProjectionV01(db, portablePackage.records);
    touchRecentProjectV01(db, {
      workspace_id: portablePackage.manifest.workspace.workspace_id,
      project_id: portablePackage.manifest.project.project_id,
      now: portablePackage.manifest.exported_at,
    });
    selectActiveProjectV01(db, {
      workspace_id: portablePackage.manifest.workspace.workspace_id,
      project_id: portablePackage.manifest.project.project_id,
      now: portablePackage.manifest.exported_at,
      expected_project_id: null,
      expected_revision: null,
    });
    const validation = validateRecoveryCanonicalDatabaseV01(db);
    if (validation.status !== "valid") refuseV01(validation.code);
    db.exec("ROLLBACK");
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    if (error instanceof PortableProjectErrorV01) throw error;
    refuseV01("portable_project_canonical_invariant_failed");
  } finally {
    db.close();
  }
}

function assertExistingPortableContentV01(
  db: Database.Database,
  portablePackage: PortableProjectV01,
  admission: "inserted" | "exact_replay",
): void {
  if (admission === "inserted") return;
  const records = readBoundedProjectRecordsV01(db, {
    workspace_id: portablePackage.manifest.workspace.workspace_id,
    project_id: portablePackage.manifest.project.project_id,
  });
  const scope = readPersonalPerspectiveProjectScopeV01(db, {
    workspace_id: portablePackage.manifest.workspace.workspace_id,
    project_id: portablePackage.manifest.project.project_id,
  });
  const existingFingerprint = portableContentFingerprintV01({
    workspace: portablePackage.manifest.workspace,
    project: portablePackage.manifest.project,
    records,
    operator_provenance_sessions: portablePackage.operator_provenance_sessions,
    personal_perspective_scope: scope,
  });
  if (existingFingerprint !== portablePackage.manifest.content_fingerprint) {
    refuseV01("portable_project_identity_content_conflict", 409);
  }
}

function rebuildPortableSemanticReaderProjectionV01(
  db: Database.Database,
  records: VNextCoreRecordEnvelopeV01[],
): void {
  const byIdentity = new Map(records.map((record) => [recordKeyV01(record), record]));
  const historyByTarget = new Map<string, Array<{
    receipt: StateTransitionReceiptV01;
    effect: StateTransitionReceiptV01["effects"][number];
    revision: number;
  }>>();
  for (const record of records.filter((item) => item.record_kind === "state_transition_receipt")) {
    const receipt = record.payload as StateTransitionReceiptV01;
    const gateId = receipt.semantic_commit_gate?.evaluation_ref?.external_id;
    const gateRecord = byIdentity.get(`semantic_commit_gate\0${gateId}`);
    if (!gateRecord) refuseV01("portable_project_projection_source_missing");
    const gate = gateRecord.payload as VNextSemanticCommitGateRecordV01;
    for (const effect of receipt.effects) {
      const targetKey = deriveVNextSemanticTargetKeyV01(effect.target_ref);
      const intended = gate.intended_effects.find((candidate) => candidate.target_key === targetKey);
      if (!intended) refuseV01("portable_project_projection_source_invalid");
      const history = historyByTarget.get(targetKey) ?? [];
      if (history.some((entry) => entry.revision === intended.expected_revision)) {
        refuseV01("portable_project_projection_revision_conflict");
      }
      history.push({ receipt, effect, revision: intended.expected_revision });
      historyByTarget.set(targetKey, history);
    }
  }
  for (const [targetKey, unsortedHistory] of historyByTarget) {
    const history = [...unsortedHistory].sort((left, right) => left.revision - right.revision);
    if (history.some((entry, index) => entry.revision !== index + 1)) {
      refuseV01("portable_project_projection_revision_gap");
    }
    let currentHead: VNextSemanticTargetHeadV01 | null = null;
    let currentProjection: VNextSemanticStateProjectionEntryV01 | null = null;
    for (const current of history) {
      const head: VNextSemanticTargetHeadV01 = {
        workspace_id: current.receipt.workspace_id,
        project_id: current.receipt.project_id,
        target_key: targetKey,
        revision: current.revision,
        presence: current.effect.after_state.presence,
        current_state_fingerprint: current.effect.after_state.state_fingerprint,
        source_transition_receipt_id: current.receipt.transition_receipt_id,
        source_transition_receipt_fingerprint: current.receipt.integrity.fingerprint,
        updated_at: current.receipt.recorded_at,
      };
      if (current.effect.after_state.presence === "absent") {
        if (!currentProjection || current.effect.before_state.presence !== "present") {
          refuseV01("portable_project_projection_state_invalid");
        }
        deleteVNextSemanticStateEntryCasV01(db, {
          workspace_id: currentProjection.workspace_id,
          project_id: currentProjection.project_id,
          target_key: currentProjection.target_key,
          expected_revision: currentProjection.revision,
          expected_state_fingerprint: currentProjection.state_fingerprint,
        });
        currentProjection = null;
      } else {
        const stateId = current.effect.after_state.state_ref.external_id;
        const stateRecord = byIdentity.get(`semantic_state\0${stateId}`);
        if (!stateRecord) refuseV01("portable_project_projection_state_missing");
        const state = rebuildVNextPersistedSemanticStateV01(
          stateRecord.payload,
        ) as VNextPersistedSemanticStateVersionV01;
        if (
          state.target_key !== targetKey ||
          state.state_content_fingerprint !== current.effect.after_state.state_fingerprint ||
          state.source_proposal_id !== current.receipt.source_proposal.proposal_id ||
          state.source_candidate_id !== current.receipt.source_candidate.candidate_id
        ) {
          refuseV01("portable_project_projection_state_invalid");
        }
        const projection: VNextSemanticStateProjectionEntryV01 = {
          workspace_id: state.workspace_id,
          project_id: state.project_id,
          presence: "present",
          target_key: state.target_key,
          target_ref: state.target_ref,
          state_ref: state.state_ref,
          state_fingerprint: state.state_content_fingerprint,
          bounded_state_summary: state.bounded_state_summary,
          source_proposal_id: state.source_proposal_id,
          source_proposal_fingerprint: state.source_proposal_fingerprint,
          source_candidate_id: state.source_candidate_id,
          source_candidate_fingerprint: state.source_candidate_fingerprint,
          source_transition_receipt_id: current.receipt.transition_receipt_id,
          source_transition_receipt_fingerprint: current.receipt.integrity.fingerprint,
          revision: current.revision,
          updated_at: current.receipt.recorded_at,
        };
        if (currentProjection) {
          updateVNextSemanticStateEntryCasV01(db, {
            expected_revision: currentProjection.revision,
            expected_state_fingerprint: currentProjection.state_fingerprint,
            next: projection,
          });
        } else {
          insertVNextSemanticStateEntryV01(db, projection);
        }
        currentProjection = projection;
      }
      if (currentHead) {
        updateVNextSemanticTargetHeadCasV01(db, { expected: currentHead, next: head });
      } else {
        insertVNextSemanticTargetHeadV01(db, head);
      }
      currentHead = head;
    }
  }
}

function portableContentFingerprintV01(input: {
  workspace: PortableProjectV01["manifest"]["workspace"];
  project: PortableProjectV01["manifest"]["project"];
  records: VNextCoreRecordEnvelopeV01[];
  operator_provenance_sessions: PortableProjectV01["operator_provenance_sessions"];
  personal_perspective_scope: PortableProjectV01["personal_perspective_scope"];
}): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01({
    workspace: input.workspace,
    project: input.project,
    records: sortRecordsV01(input.records),
    operator_provenance_sessions: input.operator_provenance_sessions,
    personal_perspective_scope: input.personal_perspective_scope,
  }));
}

function readPortableOperatorProvenanceSessionsV01(
  db: Database.Database,
  records: VNextCoreRecordEnvelopeV01[],
  scope: { workspace_id: string; project_id: string },
): PortableProjectV01["operator_provenance_sessions"] {
  const ids = new Set<string>();
  for (const record of records) {
    if (record.record_kind !== "review_decision") continue;
    const decision = record.payload as {
      authorization_basis_refs?: Array<{ ref_type?: string; external_id?: string }>;
    };
    const refs = decision.authorization_basis_refs?.filter(
      (ref) => ref.ref_type === "local_operator_session_action",
    ) ?? [];
    if (refs.length !== 1 || typeof refs[0]!.external_id !== "string") {
      refuseV01("portable_project_provenance_invalid");
    }
    ids.add(refs[0]!.external_id!);
  }
  return [...ids].sort().map((sessionId) => {
    const row = db.prepare(
      `SELECT session_id, workspace_id, project_id, operator_id,
              issued_at, expires_at, bootstrap_consumed_at, revoked_at,
              action_nonce_expires_at
         FROM vnext_local_operator_sessions WHERE session_id = ?`,
    ).get(sessionId) as {
      session_id: string;
      workspace_id: string;
      project_id: string;
      operator_id: string;
      issued_at: string;
      expires_at: string;
      bootstrap_consumed_at: string | null;
      revoked_at: string | null;
      action_nonce_expires_at: string | null;
    } | undefined;
    if (
      !row ||
      row.workspace_id !== scope.workspace_id ||
      row.project_id !== scope.project_id ||
      row.bootstrap_consumed_at === null ||
      row.action_nonce_expires_at === null
    ) {
      refuseV01("portable_project_provenance_invalid");
    }
    return {
      session_id: row.session_id,
      workspace_id: row.workspace_id,
      project_id: row.project_id,
      operator_id: row.operator_id,
      issued_at: row.issued_at,
      expires_at: row.expires_at,
      bootstrap_consumed_at: row.bootstrap_consumed_at,
      source_revoked_at: row.revoked_at,
      action_nonce_expires_at: row.action_nonce_expires_at,
    };
  });
}

function admitPortableOperatorProvenanceSessionsV01(
  db: Database.Database,
  sessions: PortableProjectV01["operator_provenance_sessions"],
  importedAt: string,
): void {
  for (const session of sessions) {
    const existing = db.prepare(
      `SELECT session_id, workspace_id, project_id, operator_id,
              issued_at, expires_at, bootstrap_consumed_at, revoked_at,
              action_nonce_expires_at
         FROM vnext_local_operator_sessions WHERE session_id = ?`,
    ).get(session.session_id) as Record<string, unknown> | undefined;
    if (existing) {
      if (
        existing.workspace_id !== session.workspace_id ||
        existing.project_id !== session.project_id ||
        existing.operator_id !== session.operator_id ||
        existing.issued_at !== session.issued_at ||
        existing.expires_at !== session.expires_at ||
        existing.bootstrap_consumed_at !== session.bootstrap_consumed_at ||
        existing.action_nonce_expires_at !== session.action_nonce_expires_at
      ) {
        refuseV01("portable_project_provenance_conflict", 409);
      }
      continue;
    }
    const nonce = randomUUID();
    db.prepare(
      `INSERT INTO vnext_local_operator_sessions (
        session_id, workspace_id, project_id, operator_id,
        bootstrap_token_hash, session_token_hash, issued_at, expires_at,
        bootstrap_consumed_at, revoked_at, action_nonce_hash,
        action_nonce_expires_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      session.session_id,
      session.workspace_id,
      session.project_id,
      session.operator_id,
      createProtocolSha256V01(`portable-revoked-bootstrap\0${nonce}`),
      createProtocolSha256V01(`portable-revoked-session\0${nonce}`),
      session.issued_at,
      session.expires_at,
      session.bootstrap_consumed_at,
      importedAt,
      createProtocolSha256V01(`portable-revoked-nonce\0${nonce}`),
      session.action_nonce_expires_at,
      importedAt,
    );
  }
}

function sortRecordsV01(records: VNextCoreRecordEnvelopeV01[]): VNextCoreRecordEnvelopeV01[] {
  return [...records].sort((left, right) =>
    left.record_kind.localeCompare(right.record_kind) || left.record_id.localeCompare(right.record_id),
  );
}

function presentKindsV01(records: VNextCoreRecordEnvelopeV01[]): string[] {
  const present = new Set(records.map((record) => record.record_kind));
  return PORTABLE_PROJECT_SUPPORTED_RECORD_KINDS_V01.filter((kind) => present.has(kind));
}

function countKindsV01(records: VNextCoreRecordEnvelopeV01[]): Record<string, number> {
  return Object.fromEntries(
    presentKindsV01(records).map((kind) => [
      kind,
      records.filter((record) => record.record_kind === kind).length,
    ]),
  );
}

function countSourceLineageRecordsV01(records: VNextCoreRecordEnvelopeV01[]): number {
  return records.filter((record) => {
    let found = false;
    walkV01(record.payload, (key, value) => {
      if (!found && /(?:source|basis|lineage).*ref/iu.test(key) && value !== null) found = true;
    });
    return found;
  }).length;
}

function recordKeyV01(record: Pick<VNextCoreRecordEnvelopeV01, "record_kind" | "record_id">): string {
  return `${record.record_kind}\0${record.record_id}`;
}

function containsAnyStringV01(value: unknown, candidates: Set<string>): boolean {
  let found = false;
  walkV01(value, (_key, item) => {
    if (!found && typeof item === "string" && candidates.has(item)) found = true;
  });
  return found;
}

function walkV01(
  value: unknown,
  visit: (key: string, value: unknown) => void,
  key = "",
): void {
  visit(key, value);
  if (Array.isArray(value)) {
    for (const item of value) walkV01(item, visit, key);
  } else if (value && typeof value === "object") {
    for (const [childKey, child] of Object.entries(value)) {
      walkV01(child, visit, childKey);
    }
  }
}

function assertPlainRecordV01(value: unknown, code: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    refuseV01(code);
  }
}

function assertExactKeysV01(
  value: Record<string, unknown>,
  expected: readonly string[],
  code: string,
): void {
  const actual = Object.keys(value).sort();
  const keys = [...expected].sort();
  if (canonicalizeProtocolValueV01(actual) !== canonicalizeProtocolValueV01(keys)) {
    refuseV01(code);
  }
}

function validSha256V01(value: unknown): value is string {
  return typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value);
}

function portableFilenameSegmentV01(value: string): string {
  const normalized = value.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "");
  return (normalized || "project").slice(0, 80);
}

function ensureSafeExistingDirectoryV01(directory: string, code: string): void {
  try {
    const stat = lstatSync(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) refuseV01(code);
  } catch (error) {
    if (error instanceof PortableProjectErrorV01) throw error;
    refuseV01(code);
  }
}

function refuseV01(code: string, status = 422): never {
  throw new PortableProjectErrorV01(code, status);
}
