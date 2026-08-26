import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
  scanForbiddenProtocolMaterialV01,
} from "./protocol-primitives";
import {
  CODEX_CURRENT_CONTINUITY_VERSION_V01,
  type CodexCurrentContinuityAuthorityBoundaryV01,
} from "@/types/vnext/codex-current-continuity";
import {
  PORTABLE_PROJECT_CONTRACT_V01,
  PORTABLE_PROJECT_CONTRACT_VERSION_V01,
} from "@/types/vnext/portable-project";
import {
  PROJECT_VERIFY_LINEAGE_VERSION_V01,
  type ProjectVerifyLineageV01,
} from "@/types/vnext/project-verify-lineage";
import {
  PROJECT_VERIFY_RECONCILIATION_VERSION_V01,
  type ProjectVerifyExactProtocolRefV01,
  type ProjectVerifyReadAuthorityV01,
  type ProjectVerifyReconciliationV01,
} from "@/types/vnext/project-verify-reconciliation";
import { CRITERION_VERIFICATION_EVALUATOR_VERSION_V01 } from "@/types/vnext/criterion-verification-plan";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import {
  validateClaimEvidenceRelationV01,
  validateClaimRecordV01,
  validateEvidenceRecordV01,
} from "./project-verify-material";
import { validateTaskContextPacketV01 } from "./task-context-packet";
import { VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01 } from "./runtime/persisted-semantic-context-compiler";
import {
  RECONSTRUCTION_CONFORMANCE_NORMALIZATION_VERSION_V01,
  RECONSTRUCTION_CONFORMANCE_PORTABLE_REBUILD_BINDING_VERSION_V01,
  RECONSTRUCTION_CONFORMANCE_REPORT_VERSION_V01,
  type ReconstructionConformanceEnvironmentV01,
  type ReconstructionConformanceExactCheckV01,
  type ReconstructionConformanceInputV01,
  type ReconstructionConformanceLaneStatusV01,
  type ReconstructionConformanceReportV01,
  type ReconstructionConformanceSemanticDifferenceV01,
  type ReconstructionConformanceSemanticRelationV01,
  type ReconstructionConformanceSourceRecordV01,
} from "@/types/vnext/reconstruction-conformance";

const SHA256_V01 = /^sha256:[a-f0-9]{64}$/u;
const MAX_SOURCE_RECORDS_V01 = 4_096;
const MAX_LINEAGES_V01 = 64;
const MAX_NORMALIZED_RELATIONS_V01 = 16_384;
const MAX_REPORT_BYTES_V01 = 8 * 1_024 * 1_024;
const PRIVATE_ABSOLUTE_PATH_V01 = /^(?:\/Users\/|\/home\/|[A-Za-z]:[\\/]|\\\\)/u;
const REPORT_SAFE_OUTPUT_FALSE_INVARIANTS_V01 = new Set([
  "raw_prompts_persisted",
  "transcripts_persisted",
  "hidden_reasoning_persisted",
  "provider_payloads_persisted",
  "credentials_persisted",
  "operator_session_credentials_copied",
  "private_paths_persisted",
  "projection_or_rendering_copied",
]);

/** Presence requirements for this RC1 fixture, not the full portable contract. */
const RC1_FIXTURE_REQUIRED_SOURCE_KINDS_V01 = Object.freeze([
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
]);
const EXACT_CHECK_IDS_V01 = Object.freeze([
  "portable_contract_and_rc1_rebuild_binding",
  "source_bound_work_and_rule_identity",
  "workspace_project_and_root_binding_identity",
  "reconstruction_input_portable_content_and_integrity",
  "canonical_source_record_manifest",
  "rc1_fixture_source_presence_and_current_owner_bindings",
  "decision_time_cutoff",
  "projection_versions",
  "environmental_observations_and_import_safety_effects",
  "codex_current_continuity_projection",
  "project_verify_reconciliation_projection",
  "project_verify_exact_lineage_collection",
  "later_context_feedback_state",
  "read_only_authority_and_forbidden_effects",
]);
const SEMANTIC_RELATION_KINDS_V01 = new Set([
  "project_currentness",
  "current_work",
  "managed_execution",
  "execution_result",
  "performed_check",
  "check_not_performed",
  "review_and_transition",
  "action_constraint",
  "packet_context_status",
  "packet_selected_context",
  "packet_excluded_context",
  "packet_gap",
  "packet_required_check",
  "packet_forbidden_action",
  "packet_constraint_boundary",
  "criterion_status",
  "evidence_source",
  "claim_family_currentness",
  "claim_revision_lifecycle",
  "relation_family_currentness",
  "source_supports",
  "source_opposes",
  "source_contradicts",
  "source_qualifies",
  "source_contextualizes",
  "source_insufficient",
  "relation_material_disposition",
  "applicability_group",
  "later_context_feedback",
  "current_feedback_state",
  "lineage_node",
  "lineage_edge",
  "lineage_stop",
  "reconciliation_summary",
]);

const CROSSING_MATERIAL_V01 = Object.freeze([
  {
    material: "portable_project.canonical_records",
    classification: "canonical_source" as const,
    crosses_boundary: true as const,
  },
  {
    material: "portable_project.workspace_and_project_identity",
    classification: "exact_identity_source_metadata" as const,
    crosses_boundary: true as const,
  },
  {
    material: "portable_project.operator_provenance_sessions_source_metadata",
    classification: "exact_identity_source_metadata" as const,
    crosses_boundary: true as const,
  },
  {
    material: "destination_project_root_rebuild_base",
    classification: "allowed_environmental_observation" as const,
    crosses_boundary: true as const,
  },
  {
    material: "portable_contract_and_rc1_research_method_binding",
    classification: "versioned_rebuild_rule" as const,
    crosses_boundary: true as const,
  },
  {
    material: "current_packet_source_bound_work_and_rule_identity",
    classification: "exact_identity_source_metadata" as const,
    crosses_boundary: true as const,
  },
  {
    material: "projection_versions_and_decision_time_cutoff",
    classification: "versioned_rebuild_rule" as const,
    crosses_boundary: true as const,
  },
  {
    material: "project_root_availability",
    classification: "allowed_environmental_observation" as const,
    crosses_boundary: true as const,
  },
  {
    material: "operator_config_and_managed_start_availability",
    classification: "allowed_environmental_observation" as const,
    crosses_boundary: true as const,
  },
]);

const NON_CROSSING_MATERIAL_V01 = Object.freeze([
  {
    material: "baseline_and_reconstructed_project_root_binding_fingerprints",
    classification: "independently_observed_exact_identity" as const,
    crosses_boundary: false as const,
  },
  {
    material: "imported_operator_sessions_randomized_revoked_and_inert",
    classification: "required_importer_safety_effect" as const,
    crosses_boundary: false as const,
  },
]);

const EXCLUDED_DERIVED_MATERIAL_NAMES_V01 = Object.freeze([
  "baseline_continuity_projection_or_snapshot",
  "baseline_project_verify_reconciliation_or_lineage",
  "baseline_summary_digest_or_conformance_report",
  "guidebrief_or_prior_packet_prose_as_authority",
  "inspector_or_product_ui_rendering",
  "provider_session_or_model_memory",
  "projection_cache_graph_layout_or_active_pointer",
  "raw_prompt_transcript_hidden_reasoning_or_provider_payload",
  "credential_secret_or_unrelated_private_path",
]);

const REPORT_AUTHORITY_V01 = Object.freeze({
  read_only_report: true as const,
  durable_core_record_created: false as const,
  writes_database: false as const,
  writes_project_files: false as const,
  calls_model_or_provider: false as const,
  performs_network_or_external_action: false as const,
  creates_proposal_or_candidate: false as const,
  creates_review_decision: false as const,
  creates_or_applies_transition: false as const,
  creates_execution_grant_or_policy: false as const,
  repairs_or_promotes_semantics: false as const,
  scores_ranks_or_selects_winner: false as const,
});

const MATERIAL_BOUNDARY_V01 = Object.freeze({
  raw_prompts_persisted: false as const,
  transcripts_persisted: false as const,
  hidden_reasoning_persisted: false as const,
  provider_payloads_persisted: false as const,
  credentials_persisted: false as const,
  operator_session_credentials_copied: false as const,
  private_paths_persisted: false as const,
  projection_or_rendering_copied: false as const,
});

const METHOD_BOUNDARY_V01 = Object.freeze({
  portable_rebuild_binding_version:
    RECONSTRUCTION_CONFORMANCE_PORTABLE_REBUILD_BINDING_VERSION_V01,
  exact_and_relational_lanes_separate: true as const,
  hard_failures_non_compensable: true as const,
  deterministic_replay_required: true as const,
  model_as_judge_calls: 0 as const,
  real_provider_calls: 0 as const,
  external_network_calls: 0 as const,
  automatic_repair_or_rollback: false as const,
  semantic_promotion_or_context_injection: false as const,
});

const CONTINUITY_AUTHORITY_V01: CodexCurrentContinuityAuthorityBoundaryV01 =
  Object.freeze({
    writes_database: false,
    writes_project_files: false,
    changes_project_selection: false,
    changes_operator_session: false,
    creates_run: false,
    starts_codex_or_native_host: false,
    calls_provider: false,
    approves_host_action: false,
    cancels_or_resumes_run: false,
    creates_or_admits_result: false,
    creates_proof_or_evidence: false,
    creates_proposal: false,
    creates_review_decision: false,
    creates_or_applies_transition: false,
    mutates_accepted_state: false,
    retries_or_replays: false,
    calls_github: false,
    creates_branch_or_pr: false,
    merges_releases_or_deploys: false,
    starts_background_work: false,
  });

const PROJECT_VERIFY_AUTHORITY_V01: ProjectVerifyReadAuthorityV01 =
  Object.freeze({
    read_only: true,
    projection_is_rebuildable: true,
    writes_database: false,
    creates_evidence: false,
    accepts_evidence: false,
    creates_claim_or_relation: false,
    creates_proposal: false,
    creates_review_decision: false,
    authorizes_semantic_commit_gate: false,
    applies_transition: false,
    selects_current_head: false,
    establishes_truth: false,
    changes_semantic_state: false,
    changes_later_context: false,
    calls_model_or_provider: false,
    performs_network_or_external_action: false,
  });

export class ReconstructionConformanceErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "ReconstructionConformanceErrorV01";
  }
}

/**
 * Pure, bounded research comparison. All source reconstruction and projection
 * reads happen before this function. The report is never admitted into Core.
 */
export function buildReconstructionConformanceReportV01(
  input: ReconstructionConformanceInputV01,
): ReconstructionConformanceReportV01 {
  validateEnvironmentV01(input.baseline, "baseline");
  validateEnvironmentV01(input.reconstructed, "reconstructed");
  refuseCrossProjectV01(input);

  const exactChecks = buildExactChecksV01(input);
  const exactStatus = laneStatusV01(exactChecks);
  const baselineRelations = normalizeRelationsV01(input.baseline);
  const reconstructedRelations = normalizeRelationsV01(input.reconstructed);
  const differences = relationDifferencesV01(
    baselineRelations,
    reconstructedRelations,
  );
  const relationalStatus = relationalStatusV01(
    input,
    differences,
  );
  const relationalIncompleteReasons = relationalIncompleteReasonsV01(input);

  const withoutIntegrity = {
    report_version: RECONSTRUCTION_CONFORMANCE_REPORT_VERSION_V01,
    normalization_version:
      RECONSTRUCTION_CONFORMANCE_NORMALIZATION_VERSION_V01,
    generated_at: input.baseline.decision_time_cutoff,
    scope: {
      workspace_id: input.baseline.source_boundary.workspace_id,
      project_id: input.baseline.source_boundary.project_id,
      decision_time_cutoff: input.baseline.decision_time_cutoff,
    },
    reconstruction_boundary: {
      crossing_material: CROSSING_MATERIAL_V01.map((entry) => ({ ...entry })),
      non_crossing_material: NON_CROSSING_MATERIAL_V01.map((entry) => ({
        ...entry,
      })),
      excluded_derived_material: EXCLUDED_DERIVED_MATERIAL_NAMES_V01.map(
        (material) => ({
          material,
          classification: "excluded_derived_material" as const,
          crosses_boundary: false as const,
        }),
      ),
      baseline_source_record_count:
        input.baseline.source_boundary.source_records.length,
      reconstructed_source_record_count:
        input.reconstructed.source_boundary.source_records.length,
    },
    exact_integrity: {
      status: exactStatus,
      checks: exactChecks,
    },
    relational_semantic: {
      status: relationalStatus,
      incomplete_reasons: relationalIncompleteReasons,
      baseline_relations: baselineRelations,
      reconstructed_relations: reconstructedRelations,
      differences,
    },
    authority: { ...REPORT_AUTHORITY_V01 },
    material_boundary: { ...MATERIAL_BOUNDARY_V01 },
    method_boundary: { ...METHOD_BOUNDARY_V01 },
    limitations: [
      "Conformance establishes deterministic source reconstruction only; it does not establish usefulness or policy fitness.",
      "Portable reconstruction excludes managed-run, grant, provider-session, and machine-local execution state by contract.",
      "The report does not establish Stage 7, live commissioned work, or RW1B conclusions.",
    ],
  } satisfies Omit<ReconstructionConformanceReportV01, "integrity">;

  const report: ReconstructionConformanceReportV01 = {
    ...withoutIntegrity,
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: "reconstruction_conformance_report_without_integrity",
      fingerprint: fingerprintV01(withoutIntegrity),
    },
  };
  assertSafeReportOutputV01(report);
  return report;
}

/** Revalidates a serialized or in-memory report without consulting source state. */
export function assertReconstructionConformanceReportV01(
  report: ReconstructionConformanceReportV01,
  sourceInput: ReconstructionConformanceInputV01,
): ReconstructionConformanceReportV01 {
  if (
    report.report_version !== RECONSTRUCTION_CONFORMANCE_REPORT_VERSION_V01 ||
    report.normalization_version !==
      RECONSTRUCTION_CONFORMANCE_NORMALIZATION_VERSION_V01 ||
    parseStrictIsoTimestampV01(report.generated_at) === null ||
    report.integrity.algorithm !== "sha256" ||
    report.integrity.canonicalization !== "augnes-json-c14n-v0_1" ||
    report.integrity.fingerprint_scope !==
      "reconstruction_conformance_report_without_integrity"
  ) {
    failV01("reconstruction_conformance_report_contract_invalid");
  }
  const { integrity, ...withoutIntegrity } = report;
  if (integrity.fingerprint !== fingerprintV01(withoutIntegrity)) {
    failV01("reconstruction_conformance_report_integrity_invalid");
  }
  if (
    canonicalizeProtocolValueV01(report.authority) !==
      canonicalizeProtocolValueV01(REPORT_AUTHORITY_V01) ||
    canonicalizeProtocolValueV01(report.material_boundary) !==
      canonicalizeProtocolValueV01(MATERIAL_BOUNDARY_V01) ||
    canonicalizeProtocolValueV01(report.method_boundary) !==
      canonicalizeProtocolValueV01(METHOD_BOUNDARY_V01) ||
    canonicalizeProtocolValueV01(
      report.reconstruction_boundary.crossing_material,
    ) !== canonicalizeProtocolValueV01(CROSSING_MATERIAL_V01) ||
    canonicalizeProtocolValueV01(
      report.reconstruction_boundary.non_crossing_material,
    ) !== canonicalizeProtocolValueV01(NON_CROSSING_MATERIAL_V01) ||
    report.relational_semantic.baseline_relations.length >
      MAX_NORMALIZED_RELATIONS_V01 ||
    report.relational_semantic.reconstructed_relations.length >
      MAX_NORMALIZED_RELATIONS_V01
  ) {
    failV01("reconstruction_conformance_report_boundary_invalid");
  }
  assertExactKeysV01(report as unknown as Record<string, unknown>, [
    "report_version",
    "normalization_version",
    "generated_at",
    "scope",
    "reconstruction_boundary",
    "exact_integrity",
    "relational_semantic",
    "authority",
    "material_boundary",
    "method_boundary",
    "limitations",
    "integrity",
  ], "reconstruction_conformance_report_fields_invalid");
  if (
    canonicalizeProtocolValueV01(
      report.exact_integrity.checks.map((check) => check.check),
    ) !== canonicalizeProtocolValueV01(EXACT_CHECK_IDS_V01) ||
    !report.relational_semantic.baseline_relations.every((relation) =>
      SEMANTIC_RELATION_KINDS_V01.has(relation.relation_kind)) ||
    !report.relational_semantic.reconstructed_relations.every((relation) =>
      SEMANTIC_RELATION_KINDS_V01.has(relation.relation_kind))
  ) {
    failV01("reconstruction_conformance_report_derived_shape_invalid");
  }
  assertSafeReportOutputV01(report);
  if (
    canonicalizeProtocolValueV01(buildReconstructionConformanceReportV01(sourceInput)) !==
      canonicalizeProtocolValueV01(report)
  ) {
    failV01("reconstruction_conformance_report_derived_material_invalid");
  }
  return report;
}

function assertSafeReportOutputV01(
  report: ReconstructionConformanceReportV01,
): void {
  const serialized = canonicalizeProtocolValueV01(report);
  if (Buffer.byteLength(serialized, "utf8") > MAX_REPORT_BYTES_V01) {
    failV01("reconstruction_conformance_report_safe_output_invalid");
  }
  const issues = new Set<string>();
  scanForbiddenProtocolMaterialV01(
    report,
    "$",
    {
      error: (code) => issues.add(code),
      warning: () => {},
    },
    {
      secret_material_message:
        "Secret-shaped material is forbidden in reconstruction conformance output.",
      provider_specific_field_message:
        "Provider-specific identity is forbidden in reconstruction conformance output.",
      allowed_false_invariant_fields:
        REPORT_SAFE_OUTPUT_FALSE_INVARIANTS_V01,
    },
  );
  scanStringValuesV01(report, (value) => {
    if (PRIVATE_ABSOLUTE_PATH_V01.test(value)) {
      issues.add("private_absolute_path");
    }
  });
  if (issues.size > 0) {
    failV01("reconstruction_conformance_report_safe_output_invalid");
  }
}

function validateEnvironmentV01(
  environment: ReconstructionConformanceEnvironmentV01,
  label: "baseline" | "reconstructed",
): void {
  if (parseStrictIsoTimestampV01(environment.decision_time_cutoff) === null) {
    failV01(`${label}_decision_time_cutoff_invalid`);
  }
  const source = environment.source_boundary;
  requireTextV01(source.workspace_id, `${label}_workspace_id_invalid`);
  requireTextV01(source.project_id, `${label}_project_id_invalid`);
  if (source.work_id !== null) {
    requireTextV01(source.work_id, `${label}_work_id_invalid`);
  }
  if (source.current_packet_ref !== null) {
    requireTextV01(
      source.current_packet_ref.record_kind,
      `${label}_current_packet_kind_invalid`,
    );
    requireTextV01(
      source.current_packet_ref.record_id,
      `${label}_current_packet_id_invalid`,
    );
    requireFingerprintV01(
      source.current_packet_ref.record_fingerprint,
      `${label}_current_packet_fingerprint_invalid`,
    );
  }
  requireFingerprintV01(
    source.reconstruction_input_content_fingerprint,
    `${label}_reconstruction_input_content_fingerprint_invalid`,
  );
  if (
    !["source_authenticated", "imported_inert"].includes(
      environment.environmental_observation.operator_provenance_state,
    ) ||
    typeof environment.environmental_observation.operator_config_available !==
      "boolean" ||
    typeof environment.environmental_observation.managed_start_available !==
      "boolean" ||
    !Number.isSafeInteger(
      environment.environmental_observation.managed_run_projection_reads,
    ) ||
    environment.environmental_observation.managed_run_projection_reads !== 0 ||
    (environment.continuity.snapshot.status === "exact" &&
      (environment.continuity.snapshot.binding === null ||
        !SHA256_V01.test(environment.continuity.snapshot.binding)))
  ) {
    failV01(`${label}_environmental_or_snapshot_binding_invalid`);
  }
  if (
    validateTaskContextPacketV01(environment.current_packet, {
      evaluated_at: environment.current_packet.generated_at,
    }).status !== "valid" ||
    environment.current_packet.workspace_id !== source.workspace_id ||
    environment.current_packet.project_id !== source.project_id ||
    source.current_packet_ref?.record_kind !== "task_context_packet" ||
    environment.current_packet.packet_id !== source.current_packet_ref.record_id ||
    environment.current_packet.integrity.fingerprint !==
      source.current_packet_ref.record_fingerprint
  ) {
    failV01(`${label}_current_packet_binding_invalid`);
  }
  validateFeedbackStateV01(environment, label);
  requireFingerprintV01(
    source.reconstruction_input_integrity_fingerprint,
    `${label}_reconstruction_input_integrity_fingerprint_invalid`,
  );
  requireFingerprintV01(
    source.root_binding_fingerprint,
    `${label}_root_binding_fingerprint_invalid`,
  );
  if (
    !Array.isArray(source.source_records) ||
    source.source_records.length > MAX_SOURCE_RECORDS_V01
  ) {
    failV01(`${label}_source_manifest_bounded_invalid`);
  }
  const sourceKeys = new Set<string>();
  for (const record of source.source_records) {
    requireTextV01(record.record_kind, `${label}_source_record_kind_invalid`);
    requireTextV01(record.record_id, `${label}_source_record_id_invalid`);
    requireFingerprintV01(
      record.record_fingerprint,
      `${label}_source_record_fingerprint_invalid`,
    );
    const key = `${record.record_kind}\u0000${record.record_id}`;
    if (sourceKeys.has(key)) failV01(`${label}_source_manifest_duplicate`);
    sourceKeys.add(key);
  }
  if (
    source.current_packet_ref !== null &&
    !sourceKeys.has(
      `${source.current_packet_ref.record_kind}\u0000${source.current_packet_ref.record_id}`,
    )
  ) {
    failV01(`${label}_current_packet_source_missing`);
  }
  if (!Array.isArray(environment.lineages) || environment.lineages.length > MAX_LINEAGES_V01) {
    failV01(`${label}_lineage_collection_bounded_invalid`);
  }
  const lookupKeys = new Set<string>();
  for (const lineage of environment.lineages) {
    const key = canonicalizeProtocolValueV01(lineage.lookup);
    if (lookupKeys.has(key)) failV01(`${label}_lineage_lookup_duplicate`);
    lookupKeys.add(key);
  }
  assertCurrentPacketSourceBindingsV01(environment, label);
}

function assertCurrentPacketSourceBindingsV01(
  environment: ReconstructionConformanceEnvironmentV01,
  label: "baseline" | "reconstructed",
): void {
  const packet = environment.current_packet;
  const source = environment.source_boundary;
  const packetWorkId = exactPacketWorkIdV01(packet);
  if (
    packetWorkId === null ||
    source.work_id === null ||
    source.work_id !== packetWorkId
  ) {
    failV01(`${label}_current_packet_work_binding_invalid`);
  }

  const verificationPlan = packet.criterion_verification_plan;
  if (
    verificationPlan === undefined ||
    source.criterion_evaluator_version !== verificationPlan.evaluator_version
  ) {
    failV01(`${label}_current_packet_evaluator_binding_invalid`);
  }

  const compilerVersion = source.semantic_context_compiler_version;
  const compilerLineageRefs = packet.compatibility.source_refs.filter(
    (ref) =>
      ref.ref_type === "task_context_packet" &&
      ref.compatibility_namespace === compilerVersion,
  );
  if (
    compilerVersion !== VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01 ||
    !packet.compatibility.source_contracts.includes(compilerVersion) ||
    compilerLineageRefs.length === 0 ||
    compilerLineageRefs.some(
      (ref) =>
        ref.trust_class !== "derived_interpretation" ||
        typeof ref.source_ref !== "string" ||
        !SHA256_V01.test(ref.source_ref) ||
        !source.source_records.some(
          (record) =>
            record.record_kind === "task_context_packet" &&
            record.record_id === ref.external_id &&
            record.record_fingerprint === ref.source_ref,
        ),
    )
  ) {
    failV01(`${label}_current_packet_compiler_binding_invalid`);
  }
}

function exactPacketWorkIdV01(packet: TaskContextPacketV01): string | null {
  if (typeof packet.work_ref === "string") {
    return packet.work_ref.trim().length > 0 ? packet.work_ref : null;
  }
  if (
    packet.work_ref === null ||
    typeof packet.work_ref.external_id !== "string" ||
    packet.work_ref.external_id.trim().length === 0
  ) {
    return null;
  }
  return packet.work_ref.external_id;
}

function validateFeedbackStateV01(
  environment: ReconstructionConformanceEnvironmentV01,
  label: "baseline" | "reconstructed",
): void {
  const feedback = environment.feedback_state;
  if (![
    "feedback_pending",
    "feedback_recorded",
    "not_applicable",
  ].includes(feedback.status)) {
    failV01(`${label}_feedback_state_invalid`);
  }
  if (feedback.status === "not_applicable") {
    if (Object.entries(feedback).some(
      ([field, value]) => field !== "status" && value !== null)) {
      failV01(`${label}_feedback_not_applicable_material_invalid`);
    }
    return;
  }
  for (const [field, value] of [
    ["later_run_receipt_id", feedback.later_run_receipt_id],
    ["packet_id", feedback.packet_id],
    ["transition_receipt_id", feedback.transition_receipt_id],
    ["proposal_id", feedback.proposal_id],
  ] as const) {
    requireTextV01(value, `${label}_feedback_${field}_invalid`);
  }
  for (const [field, value] of [
    ["later_run_receipt_fingerprint", feedback.later_run_receipt_fingerprint],
    ["packet_fingerprint", feedback.packet_fingerprint],
    ["transition_receipt_fingerprint", feedback.transition_receipt_fingerprint],
    ["proposal_fingerprint", feedback.proposal_fingerprint],
  ] as const) {
    requireFingerprintV01(value, `${label}_feedback_${field}_invalid`);
  }
}

function refuseCrossProjectV01(input: ReconstructionConformanceInputV01): void {
  const baselineScope = scopeMaterialV01(input.baseline);
  const reconstructedScope = scopeMaterialV01(input.reconstructed);
  if (
    canonicalizeProtocolValueV01(baselineScope) !==
      canonicalizeProtocolValueV01(reconstructedScope)
  ) {
    failV01("reconstruction_cross_project_refused");
  }
  for (const [label, environment] of [
    ["baseline", input.baseline],
    ["reconstructed", input.reconstructed],
  ] as const) {
    const { workspace_id: workspaceId, project_id: projectId } =
      environment.source_boundary;
    if (
      environment.reconciliation.workspace_id !== workspaceId ||
      environment.reconciliation.project_id !== projectId ||
      environment.lineages.some(
        (lineage) =>
          lineage.workspace_id !== workspaceId || lineage.project_id !== projectId,
      )
    ) {
      failV01(`${label}_projection_scope_refused`);
    }
  }
}

function scopeMaterialV01(environment: ReconstructionConformanceEnvironmentV01) {
  return {
    workspace_id: environment.source_boundary.workspace_id,
    project_id: environment.source_boundary.project_id,
  };
}

function buildExactChecksV01(
  input: ReconstructionConformanceInputV01,
): ReconstructionConformanceExactCheckV01[] {
  const baseline = input.baseline;
  const reconstructed = input.reconstructed;
  const checks: ReconstructionConformanceExactCheckV01[] = [];
  const push = (
    check: string,
    baselineValue: unknown,
    reconstructedValue: unknown,
    options: { valid?: boolean; incomplete?: boolean } = {},
  ) => {
    const equal =
      canonicalizeProtocolValueV01(baselineValue) ===
      canonicalizeProtocolValueV01(reconstructedValue);
    checks.push({
      check,
      status: !equal || options.valid === false
        ? "mismatch"
        : options.incomplete
          ? "incomplete"
          : "match",
      non_compensable: true,
      baseline_fingerprint: fingerprintV01(baselineValue),
      reconstructed_fingerprint: fingerprintV01(reconstructedValue),
    });
  };

  push(
    "portable_contract_and_rc1_rebuild_binding",
    portableRebuildMethodMaterialV01(baseline),
    portableRebuildMethodMaterialV01(reconstructed),
    {
      valid:
        validPortableRebuildMethodV01(baseline) &&
        validPortableRebuildMethodV01(reconstructed),
    },
  );
  push(
    "source_bound_work_and_rule_identity",
    sourceBoundWorkAndRuleMaterialV01(baseline),
    sourceBoundWorkAndRuleMaterialV01(reconstructed),
    {
      valid:
        currentPacketSourceBindingsValidV01(baseline) &&
        currentPacketSourceBindingsValidV01(reconstructed),
    },
  );
  push(
    "workspace_project_and_root_binding_identity",
    {
      ...scopeMaterialV01(baseline),
      work_id: exactPacketWorkIdV01(baseline.current_packet),
      current_packet_ref: baseline.source_boundary.current_packet_ref,
      root_binding_fingerprint:
        baseline.source_boundary.root_binding_fingerprint,
    },
    {
      ...scopeMaterialV01(reconstructed),
      work_id: exactPacketWorkIdV01(reconstructed.current_packet),
      current_packet_ref: reconstructed.source_boundary.current_packet_ref,
      root_binding_fingerprint:
        reconstructed.source_boundary.root_binding_fingerprint,
    },
  );
  push(
    "reconstruction_input_portable_content_and_integrity",
    {
      content:
        baseline.source_boundary.reconstruction_input_content_fingerprint,
      integrity:
        baseline.source_boundary.reconstruction_input_integrity_fingerprint,
    },
    {
      content:
        reconstructed.source_boundary.reconstruction_input_content_fingerprint,
      integrity:
        reconstructed.source_boundary.reconstruction_input_integrity_fingerprint,
    },
  );
  push(
    "canonical_source_record_manifest",
    sortedSourceRecordsV01(baseline.source_boundary.source_records),
    sortedSourceRecordsV01(reconstructed.source_boundary.source_records),
  );
  push(
    "rc1_fixture_source_presence_and_current_owner_bindings",
    currentOwnerBindingMaterialV01(baseline),
    currentOwnerBindingMaterialV01(reconstructed),
    {
      valid:
        rc1FixtureRequiredSourceKindsPresentV01(baseline) &&
        rc1FixtureRequiredSourceKindsPresentV01(reconstructed) &&
        currentOwnerBindingsValidV01(baseline) &&
        currentOwnerBindingsValidV01(reconstructed),
    },
  );
  push(
    "decision_time_cutoff",
    decisionTimeMaterialV01(baseline),
    decisionTimeMaterialV01(reconstructed),
    {
      valid:
        validDecisionTimeMaterialV01(baseline) &&
        validDecisionTimeMaterialV01(reconstructed),
    },
  );
  push(
    "projection_versions",
    projectionVersionsV01(baseline),
    projectionVersionsV01(reconstructed),
    {
      valid:
        validProjectionVersionsV01(baseline) &&
        validProjectionVersionsV01(reconstructed),
    },
  );
  push(
    "environmental_observations_and_import_safety_effects",
    environmentalComparisonMaterialV01(baseline),
    environmentalComparisonMaterialV01(reconstructed),
    {
      valid:
        baseline.environmental_observation.root_availability ===
          baseline.continuity.project.root_availability &&
        reconstructed.environmental_observation.root_availability ===
          reconstructed.continuity.project.root_availability &&
        baseline.environmental_observation.operator_config_available === true &&
        reconstructed.environmental_observation.operator_config_available === true &&
        baseline.environmental_observation.managed_start_available === true &&
        reconstructed.environmental_observation.managed_start_available === true &&
        baseline.environmental_observation.managed_run_projection_reads === 0 &&
        reconstructed.environmental_observation.managed_run_projection_reads === 0 &&
        baseline.environmental_observation.operator_provenance_state ===
          "source_authenticated" &&
        reconstructed.environmental_observation.operator_provenance_state ===
          "imported_inert",
    },
  );
  push(
    "codex_current_continuity_projection",
    baseline.continuity,
    reconstructed.continuity,
    {
      valid:
        validContinuityAuthorityV01(baseline.continuity.authority) &&
        validContinuityAuthorityV01(reconstructed.continuity.authority),
      incomplete:
        continuityIncompleteV01(baseline) ||
        continuityIncompleteV01(reconstructed),
    },
  );
  push(
    "project_verify_reconciliation_projection",
    baseline.reconciliation,
    reconstructed.reconciliation,
    {
      valid:
        validReconciliationProjectionV01(baseline.reconciliation) &&
        validReconciliationProjectionV01(reconstructed.reconciliation) &&
        !projectionConflictV01(baseline.reconciliation) &&
        !projectionConflictV01(reconstructed.reconciliation),
      incomplete:
        projectionIncompleteV01(baseline.reconciliation.completeness.status) ||
        projectionIncompleteV01(reconstructed.reconciliation.completeness.status),
    },
  );
  push(
    "project_verify_exact_lineage_collection",
    sortedLineagesV01(baseline.lineages),
    sortedLineagesV01(reconstructed.lineages),
    {
      valid:
        baseline.lineages.every(validLineageProjectionV01) &&
        reconstructed.lineages.every(validLineageProjectionV01) &&
        baseline.lineages.every((lineage) => !lineageConflictV01(lineage)) &&
        reconstructed.lineages.every((lineage) => !lineageConflictV01(lineage)),
      incomplete:
        baseline.lineages.some(lineageIncompleteV01) ||
        reconstructed.lineages.some(lineageIncompleteV01),
    },
  );
  push(
    "later_context_feedback_state",
    baseline.feedback_state,
    reconstructed.feedback_state,
    {
      valid:
        feedbackStateBoundToCurrentOwnersV01(baseline) &&
        feedbackStateBoundToCurrentOwnersV01(reconstructed),
    },
  );
  push(
    "read_only_authority_and_forbidden_effects",
    authorityMaterialV01(baseline),
    authorityMaterialV01(reconstructed),
    {
      valid:
        validEnvironmentAuthorityV01(baseline) &&
        validEnvironmentAuthorityV01(reconstructed),
    },
  );
  return checks;
}

function portableRebuildMethodMaterialV01(
  environment: ReconstructionConformanceEnvironmentV01,
) {
  return {
    portable_contract: environment.source_boundary.portable_contract,
    portable_contract_version:
      environment.source_boundary.portable_contract_version,
    portable_rebuild_binding_version:
      environment.source_boundary.portable_rebuild_binding_version,
  };
}

function validPortableRebuildMethodV01(
  environment: ReconstructionConformanceEnvironmentV01,
) {
  return (
    environment.source_boundary.portable_contract ===
      PORTABLE_PROJECT_CONTRACT_V01 &&
    environment.source_boundary.portable_contract_version ===
      PORTABLE_PROJECT_CONTRACT_VERSION_V01 &&
    environment.source_boundary.portable_rebuild_binding_version ===
      RECONSTRUCTION_CONFORMANCE_PORTABLE_REBUILD_BINDING_VERSION_V01
  );
}

function sourceBoundWorkAndRuleMaterialV01(
  environment: ReconstructionConformanceEnvironmentV01,
) {
  const packet = environment.current_packet;
  const compilerVersion = environment.source_boundary
    .semantic_context_compiler_version;
  return {
    work_id: exactPacketWorkIdV01(packet),
    criterion_evaluator_version:
      packet.criterion_verification_plan?.evaluator_version ?? null,
    semantic_context_compiler_version: compilerVersion,
    semantic_context_compiler_lineage_refs: packet.compatibility.source_refs
      .filter(
        (ref) =>
          ref.ref_type === "task_context_packet" &&
          ref.compatibility_namespace === compilerVersion,
      )
      .map((ref) => ({
        record_kind: "task_context_packet",
        record_id: ref.external_id,
        record_fingerprint: ref.source_ref,
      }))
      .sort((left, right) =>
        compareProtocolCodeUnitsV01(
          canonicalizeProtocolValueV01(left),
          canonicalizeProtocolValueV01(right),
        )),
  };
}

function currentPacketSourceBindingsValidV01(
  environment: ReconstructionConformanceEnvironmentV01,
): boolean {
  const packet = environment.current_packet;
  const source = environment.source_boundary;
  const packetWorkId = exactPacketWorkIdV01(packet);
  const compilerVersion = source.semantic_context_compiler_version;
  const compilerLineageRefs = packet.compatibility.source_refs.filter(
    (ref) =>
      ref.ref_type === "task_context_packet" &&
      ref.compatibility_namespace === compilerVersion,
  );
  return (
    packetWorkId !== null &&
    source.work_id === packetWorkId &&
    packet.criterion_verification_plan !== undefined &&
    source.criterion_evaluator_version ===
      packet.criterion_verification_plan.evaluator_version &&
    source.criterion_evaluator_version ===
      CRITERION_VERIFICATION_EVALUATOR_VERSION_V01 &&
    compilerVersion === VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01 &&
    packet.compatibility.source_contracts.includes(compilerVersion) &&
    compilerLineageRefs.length > 0 &&
    compilerLineageRefs.every(
      (ref) =>
        ref.trust_class === "derived_interpretation" &&
        typeof ref.source_ref === "string" &&
        SHA256_V01.test(ref.source_ref) &&
        source.source_records.some(
          (record) =>
            record.record_kind === "task_context_packet" &&
            record.record_id === ref.external_id &&
            record.record_fingerprint === ref.source_ref,
        ),
    )
  );
}

function rc1FixtureRequiredSourceKindsPresentV01(
  environment: ReconstructionConformanceEnvironmentV01,
): boolean {
  const present = new Set(
    environment.source_boundary.source_records.map((record) => record.record_kind),
  );
  return (
    environment.source_boundary.work_id !== null &&
    environment.source_boundary.current_packet_ref?.record_kind ===
      "task_context_packet" &&
    RC1_FIXTURE_REQUIRED_SOURCE_KINDS_V01.every((kind) => present.has(kind))
  );
}

type ExactRefLikeV01 = {
  record_kind: string;
  record_id: string;
  record_fingerprint: string;
};

const NON_PORTABLE_PROJECTION_REF_KINDS_V01 = new Set([
  "criterion_assessment",
  "episode_delta_proposal_candidate",
  "semantic_target_head",
]);

const LINEAGE_NODE_EXACT_KIND_V01: Readonly<Record<string, string>> =
  Object.freeze({
    criterion: "criterion_assessment",
    evidence_record: "evidence_record",
    claim_record: "claim_record",
    claim_evidence_relation: "claim_evidence_relation",
    episode_delta_proposal_candidate: "episode_delta_proposal_candidate",
    review_decision: "review_decision",
    semantic_commit_gate: "semantic_commit_gate",
    state_transition_receipt_effect: "state_transition_receipt",
    semantic_state: "semantic_state",
    semantic_target_head: "semantic_target_head",
    later_task_context_packet: "task_context_packet",
    context_use_review: "context_use_review",
  });

function currentOwnerBindingMaterialV01(
  environment: ReconstructionConformanceEnvironmentV01,
) {
  return {
    current_packet_ref: environment.source_boundary.current_packet_ref,
    reconciliation_source_packets: environment.reconciliation.source_packets,
    reconciliation_source_receipts: environment.reconciliation.source_receipts,
    lifecycle_refs: lifecycleRefsV01(environment.reconciliation),
    later_context: environment.reconciliation.later_context,
    lineage_lookups: environment.lineages.map((lineage) => lineage.lookup),
    feedback_state: environment.feedback_state,
  };
}

function lifecycleRefsV01(reconciliation: ProjectVerifyReconciliationV01) {
  return [
    ...reconciliation.claim_families.flatMap((family) =>
      family.revisions.map((revision) => ({
        record_ref: revision.claim_ref,
        review: revision.lifecycle.review,
        decision: revision.lifecycle.decision,
        gate: revision.lifecycle.gate,
        transition: revision.lifecycle.transition,
        application: revision.lifecycle.application,
      }))),
    ...reconciliation.relation_families.flatMap((family) =>
      family.revisions.map((revision) => ({
        record_ref: revision.relation_ref,
        review: revision.lifecycle.review,
        decision: revision.lifecycle.decision,
        gate: revision.lifecycle.gate,
        transition: revision.lifecycle.transition,
        application: revision.lifecycle.application,
      }))),
  ];
}

function sourceManifestHasRefV01(
  environment: ReconstructionConformanceEnvironmentV01,
  ref: ExactRefLikeV01,
): boolean {
  if (NON_PORTABLE_PROJECTION_REF_KINDS_V01.has(ref.record_kind)) return true;
  return environment.source_boundary.source_records.some(
    (source) =>
      source.record_kind === ref.record_kind &&
      source.record_id === ref.record_id &&
      source.record_fingerprint === ref.record_fingerprint,
  );
}

function nullableSourceRefValidV01(
  environment: ReconstructionConformanceEnvironmentV01,
  ref: ExactRefLikeV01 | null,
): boolean {
  return ref === null || sourceManifestHasRefV01(environment, ref);
}

function currentOwnerBindingsValidV01(
  environment: ReconstructionConformanceEnvironmentV01,
): boolean {
  if (!embeddedProjectVerifyMaterialValidV01(environment)) return false;
  const currentPacketRef = environment.source_boundary.current_packet_ref;
  if (
    currentPacketRef === null ||
    !sourceManifestHasRefV01(environment, currentPacketRef) ||
    ![
      ...environment.reconciliation.source_packets,
      ...environment.reconciliation.later_context.flatMap((later) =>
        later.later_packet_ref === null ? [] : [later.later_packet_ref]),
    ].some((ref) => exactRefsEqualV01(ref, currentPacketRef))
  ) {
    return false;
  }
  const directRefs: ExactRefLikeV01[] = [
    ...environment.reconciliation.source_packets,
    ...environment.reconciliation.source_receipts,
    ...environment.reconciliation.evidence.map((item) => item.evidence_ref),
    ...environment.reconciliation.claim_families.flatMap((family) =>
      family.revisions.map((revision) => revision.claim_ref)),
    ...environment.reconciliation.relation_families.flatMap((family) =>
      family.revisions.map((revision) => revision.relation_ref)),
  ];
  if (!directRefs.every((ref) => sourceManifestHasRefV01(environment, ref))) {
    return false;
  }
  for (const lifecycle of lifecycleRefsV01(environment.reconciliation)) {
    const refs = [
      lifecycle.review.proposal_ref,
      lifecycle.review.proposal_candidate_ref,
      lifecycle.decision.decision_ref,
      lifecycle.gate.gate_ref,
      lifecycle.transition.transition_receipt_ref,
      lifecycle.transition.semantic_state_ref,
      lifecycle.transition.semantic_target_head_ref,
    ];
    if (!refs.every((ref) => nullableSourceRefValidV01(environment, ref))) {
      return false;
    }
  }
  for (const later of environment.reconciliation.later_context) {
    if (
      !sourceManifestHasRefV01(
        environment,
        later.source_transition_receipt_ref,
      ) ||
      !nullableSourceRefValidV01(environment, later.later_packet_ref) ||
      !nullableSourceRefValidV01(environment, later.context_use_review_ref)
    ) {
      return false;
    }
  }
  for (const lineage of environment.lineages) {
    for (const node of lineage.nodes) {
      if (node.exact_ref === null) continue;
      const expectedKind = LINEAGE_NODE_EXACT_KIND_V01[node.node_kind];
      if (
        expectedKind !== undefined &&
        node.exact_ref.record_kind !== expectedKind
      ) {
        return false;
      }
      if (!sourceManifestHasRefV01(environment, node.exact_ref)) return false;
    }
  }
  return feedbackStateBoundToCurrentOwnersV01(environment);
}

function embeddedProjectVerifyMaterialValidV01(
  environment: ReconstructionConformanceEnvironmentV01,
): boolean {
  const reconciliation = environment.reconciliation;
  const scope = environment.source_boundary;
  for (const projection of reconciliation.evidence) {
    const evidence = projection.evidence;
    if (
      validateEvidenceRecordV01(evidence).status !== "valid" ||
      evidence.workspace_id !== scope.workspace_id ||
      evidence.project_id !== scope.project_id ||
      projection.evidence_ref.record_id !== evidence.evidence_id ||
      projection.evidence_ref.record_fingerprint !==
        evidence.integrity.fingerprint ||
      projection.trust_class !== evidence.trust_class ||
      canonicalizeProtocolValueV01(projection.coverage) !==
        canonicalizeProtocolValueV01(evidence.coverage) ||
      canonicalizeProtocolValueV01(projection.source_refs) !==
        canonicalizeProtocolValueV01(evidence.source_refs) ||
      canonicalizeProtocolValueV01(projection.limitations) !==
        canonicalizeProtocolValueV01(evidence.limitations) ||
      canonicalizeProtocolValueV01(projection.uncertainty) !==
        canonicalizeProtocolValueV01(evidence.uncertainty)
    ) {
      return false;
    }
  }
  for (const family of reconciliation.claim_families) {
    for (const revision of family.revisions) {
      const claim = revision.claim;
      if (
        validateClaimRecordV01(claim).status !== "valid" ||
        claim.workspace_id !== scope.workspace_id ||
        claim.project_id !== scope.project_id ||
        claim.claim_family_id !== family.claim_family_id ||
        claim.applicability_scope.scope_fingerprint !==
          family.applicability_scope_fingerprint ||
        revision.claim_ref.record_id !== claim.claim_id ||
        revision.claim_ref.record_fingerprint !== claim.integrity.fingerprint
      ) {
        return false;
      }
    }
  }
  for (const family of reconciliation.relation_families) {
    for (const revision of family.revisions) {
      const relation = revision.relation;
      if (
        validateClaimEvidenceRelationV01(relation).status !== "valid" ||
        relation.workspace_id !== scope.workspace_id ||
        relation.project_id !== scope.project_id ||
        relation.relation_family_id !== family.relation_family_id ||
        relation.applicability_scope.scope_fingerprint !==
          family.applicability_scope_fingerprint ||
        !exactRefsEqualV01(relation.claim_ref, family.claim_ref) ||
        !exactRefsEqualV01(relation.evidence_ref, family.evidence_ref) ||
        revision.relation_ref.record_id !== relation.relation_id ||
        revision.relation_ref.record_fingerprint !==
          relation.integrity.fingerprint
      ) {
        return false;
      }
    }
  }
  return true;
}

function environmentalComparisonMaterialV01(
  environment: ReconstructionConformanceEnvironmentV01,
) {
  return {
    root_availability: environment.environmental_observation.root_availability,
    operator_config_available:
      environment.environmental_observation.operator_config_available,
    managed_start_available:
      environment.environmental_observation.managed_start_available,
    managed_run_projection_reads:
      environment.environmental_observation.managed_run_projection_reads,
  };
}

function feedbackStateBoundToCurrentOwnersV01(
  environment: ReconstructionConformanceEnvironmentV01,
): boolean {
  const feedback = environment.feedback_state;
  const fields = [
    feedback.later_run_receipt_id,
    feedback.later_run_receipt_fingerprint,
    feedback.packet_id,
    feedback.packet_fingerprint,
    feedback.transition_receipt_id,
    feedback.transition_receipt_fingerprint,
    feedback.proposal_id,
    feedback.proposal_fingerprint,
  ];
  if (feedback.status === "not_applicable") {
    return fields.every((value) => value === null);
  }
  if (fields.some((value) => value === null)) return false;
  const exact = feedback as typeof feedback & {
    later_run_receipt_id: string;
    later_run_receipt_fingerprint: string;
    packet_id: string;
    packet_fingerprint: string;
    transition_receipt_id: string;
    transition_receipt_fingerprint: string;
    proposal_id: string;
    proposal_fingerprint: string;
  };
  if (
    !sourceManifestHasRefV01(environment, {
      record_kind: "run_receipt",
      record_id: exact.later_run_receipt_id,
      record_fingerprint: exact.later_run_receipt_fingerprint,
    }) ||
    !sourceManifestHasRefV01(environment, {
      record_kind: "task_context_packet",
      record_id: exact.packet_id,
      record_fingerprint: exact.packet_fingerprint,
    }) ||
    !sourceManifestHasRefV01(environment, {
      record_kind: "state_transition_receipt",
      record_id: exact.transition_receipt_id,
      record_fingerprint: exact.transition_receipt_fingerprint,
    }) ||
    !sourceManifestHasRefV01(environment, {
      record_kind: "episode_delta_proposal",
      record_id: exact.proposal_id,
      record_fingerprint: exact.proposal_fingerprint,
    })
  ) {
    return false;
  }
  const expectedStatus = feedback.status === "feedback_pending"
    ? "packet_compiled_feedback_pending"
    : "feedback_recorded";
  return environment.reconciliation.later_context.some(
    (later) =>
      later.status === expectedStatus &&
      (feedback.status === "feedback_pending"
        ? later.context_use_review_ref === null
        : later.context_use_review_ref !== null) &&
      later.later_packet_ref !== null &&
      later.source_transition_receipt_ref.record_id ===
        exact.transition_receipt_id &&
      later.source_transition_receipt_ref.record_fingerprint ===
        exact.transition_receipt_fingerprint &&
      later.later_packet_ref.record_id === exact.packet_id &&
      later.later_packet_ref.record_fingerprint === exact.packet_fingerprint,
  );
}

function exactRefsEqualV01(
  left: ExactRefLikeV01,
  right: ExactRefLikeV01,
): boolean {
  return (
    left.record_kind === right.record_kind &&
    left.record_id === right.record_id &&
    left.record_fingerprint === right.record_fingerprint
  );
}

function decisionTimeMaterialV01(environment: ReconstructionConformanceEnvironmentV01) {
  return {
    cutoff: environment.decision_time_cutoff,
    continuity_generated_at: environment.continuity.generated_at,
    reconciliation_observed_at: environment.reconciliation.observed_at,
    lineage_observed_at: [...new Set(
      environment.lineages.map((lineage) => lineage.observed_at),
    )].sort(compareProtocolCodeUnitsV01),
  };
}

function validDecisionTimeMaterialV01(
  environment: ReconstructionConformanceEnvironmentV01,
): boolean {
  return (
    environment.continuity.generated_at === environment.decision_time_cutoff &&
    environment.reconciliation.observed_at === environment.decision_time_cutoff &&
    environment.lineages.every(
      (lineage) => lineage.observed_at === environment.decision_time_cutoff,
    )
  );
}

function projectionVersionsV01(environment: ReconstructionConformanceEnvironmentV01) {
  return {
    continuity: environment.continuity.projection_version,
    reconciliation: environment.reconciliation.reconciliation_version,
    lineages: [...new Set(
      environment.lineages.map((lineage) => lineage.lineage_version),
    )].sort(compareProtocolCodeUnitsV01),
  };
}

function validProjectionVersionsV01(
  environment: ReconstructionConformanceEnvironmentV01,
): boolean {
  return (
    environment.continuity.projection_version ===
      CODEX_CURRENT_CONTINUITY_VERSION_V01 &&
    environment.reconciliation.reconciliation_version ===
      PROJECT_VERIFY_RECONCILIATION_VERSION_V01 &&
    environment.lineages.every(
      (lineage) => lineage.lineage_version === PROJECT_VERIFY_LINEAGE_VERSION_V01,
    )
  );
}

function validReconciliationProjectionV01(
  projection: ProjectVerifyReconciliationV01,
): boolean {
  const { projection_fingerprint: actual, ...withoutFingerprint } = projection;
  return (
    actual === fingerprintV01(withoutFingerprint) &&
    validProjectVerifyAuthorityV01(projection.authority)
  );
}

function validLineageProjectionV01(projection: ProjectVerifyLineageV01): boolean {
  const { projection_fingerprint: actual, ...withoutFingerprint } = projection;
  return (
    actual === fingerprintV01(withoutFingerprint) &&
    validProjectVerifyAuthorityV01(projection.authority)
  );
}

function validProjectVerifyAuthorityV01(
  authority: ProjectVerifyReadAuthorityV01,
): boolean {
  return canonicalizeProtocolValueV01(authority) ===
    canonicalizeProtocolValueV01(PROJECT_VERIFY_AUTHORITY_V01);
}

function validContinuityAuthorityV01(
  authority: CodexCurrentContinuityAuthorityBoundaryV01,
): boolean {
  return canonicalizeProtocolValueV01(authority) ===
    canonicalizeProtocolValueV01(CONTINUITY_AUTHORITY_V01);
}

function validEnvironmentAuthorityV01(
  environment: ReconstructionConformanceEnvironmentV01,
): boolean {
  return (
    validContinuityAuthorityV01(environment.continuity.authority) &&
    validProjectVerifyAuthorityV01(environment.reconciliation.authority) &&
    environment.lineages.every((lineage) =>
      validProjectVerifyAuthorityV01(lineage.authority))
  );
}

function authorityMaterialV01(environment: ReconstructionConformanceEnvironmentV01) {
  return {
    continuity: environment.continuity.authority,
    reconciliation: environment.reconciliation.authority,
    lineages: environment.lineages.map((lineage) => lineage.authority),
  };
}

function projectionConflictV01(
  projection: ProjectVerifyReconciliationV01,
): boolean {
  return (
    projection.completeness.status === "conflict" ||
    projection.conflicts.length > 0
  );
}

function lineageConflictV01(projection: ProjectVerifyLineageV01): boolean {
  return (
    projection.completeness.status === "conflict" ||
    projection.conflicts.length > 0 ||
    projection.stop.reason === "source_conflict"
  );
}

function projectionIncompleteV01(status: string): boolean {
  return status === "partial" || status === "bounded_incomplete";
}

function lineageIncompleteV01(projection: ProjectVerifyLineageV01): boolean {
  return (
    projectionIncompleteV01(projection.completeness.status) ||
    projection.stop.reason === "source_missing" ||
    projection.stop.reason === "bounded_incomplete"
  );
}

function continuityIncompleteV01(
  environment: ReconstructionConformanceEnvironmentV01,
): boolean {
  return (
    environment.continuity.source_status !== "exact" ||
    environment.continuity.snapshot.status !== "exact"
  );
}

function laneStatusV01(
  checks: ReconstructionConformanceExactCheckV01[],
): ReconstructionConformanceLaneStatusV01 {
  if (checks.some((check) => check.status === "mismatch")) {
    return "non_conformant";
  }
  if (checks.some((check) => check.status === "incomplete")) {
    return "incomplete";
  }
  return "conformant";
}

function relationalStatusV01(
  input: ReconstructionConformanceInputV01,
  differences: ReconstructionConformanceSemanticDifferenceV01[],
): ReconstructionConformanceLaneStatusV01 {
  if (
    differences.length > 0 ||
    projectionConflictV01(input.baseline.reconciliation) ||
    projectionConflictV01(input.reconstructed.reconciliation) ||
    input.baseline.lineages.some(lineageConflictV01) ||
    input.reconstructed.lineages.some(lineageConflictV01)
  ) {
    return "non_conformant";
  }
  if (
    continuityIncompleteV01(input.baseline) ||
    continuityIncompleteV01(input.reconstructed) ||
    projectionIncompleteV01(input.baseline.reconciliation.completeness.status) ||
    projectionIncompleteV01(input.reconstructed.reconciliation.completeness.status) ||
    input.baseline.lineages.some(lineageIncompleteV01) ||
    input.reconstructed.lineages.some(lineageIncompleteV01)
  ) {
    return "incomplete";
  }
  return "conformant";
}

function relationalIncompleteReasonsV01(
  input: ReconstructionConformanceInputV01,
): string[] {
  const reasons = new Set<string>();
  for (const [side, environment] of [
    ["baseline", input.baseline],
    ["reconstructed", input.reconstructed],
  ] as const) {
    if (continuityIncompleteV01(environment)) {
      reasons.add(`${side}_continuity_source_incomplete`);
    }
    if (projectionIncompleteV01(environment.reconciliation.completeness.status)) {
      reasons.add(`${side}_reconciliation_bounded_or_partial`);
    }
    for (const lineage of environment.lineages) {
      if (projectionIncompleteV01(lineage.completeness.status)) {
        reasons.add(`${side}_lineage_bounded_or_partial:${fingerprintV01(lineage.lookup)}`);
      }
      if (
        lineage.stop.reason === "source_missing" ||
        lineage.stop.reason === "bounded_incomplete"
      ) {
        reasons.add(`${side}_lineage_${lineage.stop.reason}:${fingerprintV01(lineage.lookup)}`);
      }
    }
  }
  return [...reasons].sort(compareProtocolCodeUnitsV01);
}

function normalizeRelationsV01(
  environment: ReconstructionConformanceEnvironmentV01,
): ReconstructionConformanceSemanticRelationV01[] {
  const relations: ReconstructionConformanceSemanticRelationV01[] = [];
  const add = (
    relation_kind: string,
    identity: string,
    dimensions: ReconstructionConformanceSemanticRelationV01["dimensions"],
  ) => relations.push({ relation_kind, identity, dimensions });
  const continuity = environment.continuity;
  add("project_currentness", continuity.project.project_key ?? "project:none", {
    project_status: continuity.project.status,
    active: continuity.project.active,
    root_availability: continuity.project.root_availability,
  });
  add("current_work", continuity.current_work.lineage_kind ?? "work:none", {
    status: continuity.current_work.status,
    currentness: continuity.current_work.currentness,
    start_eligible: continuity.current_work.start_eligible,
    start_blocked: continuity.current_work.start_blocker !== null,
    revision_eligible: continuity.current_work.revision_eligible,
  });
  add("managed_execution", "managed_execution", {
    stage: continuity.managed_execution.stage,
    mode: continuity.managed_execution.mode,
    result_available: continuity.managed_execution.result_available,
    attention_required: continuity.managed_execution.attention_required,
    reconciliation_required: continuity.managed_execution.reconciliation_required,
  });
  add("execution_result", "latest_result", {
    state: continuity.latest_result.state,
    currentness: continuity.latest_result.currentness,
    execution_status: continuity.latest_result.execution_status,
    verification_status: continuity.latest_result.verification_status,
  });
  for (const check of continuity.latest_result.checks) {
    add(
      "performed_check",
      opaqueRelationIdentityV01("execution_check", check.check),
      {
        required: check.required,
        status: check.status,
      },
    );
  }
  for (const skipped of continuity.latest_result.skipped_checks) {
    add(
      "check_not_performed",
      opaqueRelationIdentityV01("execution_check", skipped.check),
      {
        required: skipped.required,
        status: "skipped",
      },
    );
  }
  add("review_and_transition", "review_continuity", {
    review_state: continuity.review_continuity.state,
    decision_kind: continuity.review_continuity.decision_kind,
    transition_currentness:
      continuity.review_continuity.transition_currentness,
  });
  add("action_constraint", "next_action", {
    action_kind: continuity.next_action.kind,
    user_action_required: continuity.next_action.user_action_required,
    executes: continuity.next_action.executes,
  });

  const packet = environment.current_packet;
  add("packet_context_status", exactPacketIdentityV01(packet), {
    source_status: packet.source_status.status,
    currentness: packet.source_status.currentness.status,
    selected_count: packet.selected_context.length,
    excluded_count: packet.excluded_context.length,
    gap_count: packet.gaps.length,
  });
  for (const selected of packet.selected_context) {
    add(
      "packet_selected_context",
      opaqueRelationIdentityV01("packet_context_entry", selected.entry_id),
      {
        entry_kind: selected.entry_kind,
        source_ref_fingerprint: nullableOpaqueSourceFingerprintV01(
          "packet_context_source_ref",
          selected.source_ref,
        ),
        external_ref_fingerprint: fingerprintV01(selected.external_ref),
        currentness: selected.currentness.status,
        trust_class: selected.trust_class,
      },
    );
  }
  for (const excluded of packet.excluded_context) {
    add(
      "packet_excluded_context",
      opaqueRelationIdentityV01("packet_context_entry", excluded.entry_id),
      {
        source_ref_fingerprint: nullableOpaqueSourceFingerprintV01(
          "packet_context_source_ref",
          excluded.source_ref,
        ),
        external_ref_fingerprint: fingerprintV01(excluded.external_ref),
        currentness: excluded.currentness.status,
      },
    );
  }
  for (const gap of packet.gaps) {
    add("packet_gap", opaqueRelationIdentityV01("packet_gap", gap.code), {
      severity: gap.severity,
      blocks_action: gap.severity === "blocking",
      missing_fields_fingerprint: fingerprintV01(
        [...gap.missing_fields].sort(compareProtocolCodeUnitsV01),
      ),
      source_refs_fingerprint: fingerprintV01(
        [...gap.source_refs].sort(compareProtocolCodeUnitsV01),
      ),
      external_refs_fingerprint: fingerprintV01(gap.external_refs),
    });
  }
  for (const requiredCheck of [...packet.constraints.required_checks].sort(
    compareProtocolCodeUnitsV01,
  )) {
    add(
      "packet_required_check",
      opaqueRelationIdentityV01("packet_required_check", requiredCheck),
      {
        blocks_completion_until_performed: true,
      },
    );
  }
  for (const forbiddenAction of [...packet.constraints.forbidden_actions].sort(
    compareProtocolCodeUnitsV01,
  )) {
    add(
      "packet_forbidden_action",
      opaqueRelationIdentityV01("packet_forbidden_action", forbiddenAction),
      {
        blocks_action: true,
      },
    );
  }
  add("packet_constraint_boundary", "packet_constraints", {
    data_classification: packet.constraints.data_classification,
    bounded: packet.constraints.context_budget.bounded,
    truncation_applied:
      packet.constraints.context_budget.truncation_applied,
  });

  const reconciliation = environment.reconciliation;
  for (const criterion of reconciliation.criteria) {
    add("criterion_status", criterion.criterion.criterion_id, {
      status: criterion.criterion.status,
      basis: criterion.criterion.basis,
      packet_ref: exactRefIdentityV01(criterion.packet_ref),
      receipt_ref: exactRefIdentityV01(criterion.receipt_ref),
      supporting_refs: fingerprintV01(criterion.criterion.supporting_refs),
      opposing_refs: fingerprintV01(criterion.criterion.opposing_refs),
      missing_refs: fingerprintV01(criterion.criterion.missing_refs),
    });
  }
  for (const evidence of reconciliation.evidence) {
    add("evidence_source", exactRecordRefIdentityV01(evidence.evidence_ref), {
      trust_class: evidence.trust_class,
      source_authentication: evidence.source_authentication.status,
      coverage: fingerprintV01(evidence.coverage),
      acceptance_status: evidence.acceptance_status,
    });
  }
  for (const family of reconciliation.claim_families) {
    add("claim_family_currentness", family.claim_family_id, {
      applicability_scope_fingerprint: family.applicability_scope_fingerprint,
      latest_recorded_candidate_ref:
        nullableRecordRefIdentityV01(family.latest_recorded_candidate_ref),
      applied_current_head_ref:
        nullableRecordRefIdentityV01(family.applied_current_head_ref),
      previously_applied_refs: fingerprintV01(family.previously_applied_refs),
      pending_revision_refs: fingerprintV01(family.pending_revision_refs),
    });
    for (const revision of family.revisions) {
    add("claim_revision_lifecycle", exactRecordRefIdentityV01(revision.claim_ref), {
      family_id: family.claim_family_id,
      recorded_latest: revision.lifecycle.record.latest_recorded_candidate,
      review: revision.lifecycle.review.status,
      proposal_ref:
        nullableExactRefIdentityV01(revision.lifecycle.review.proposal_ref),
      proposal_candidate_ref: nullableExactRefIdentityV01(
        revision.lifecycle.review.proposal_candidate_ref,
      ),
      decision: revision.lifecycle.decision.status,
      decision_ref:
        nullableExactRefIdentityV01(revision.lifecycle.decision.decision_ref),
      gate: revision.lifecycle.gate.status,
      gate_ref: nullableExactRefIdentityV01(revision.lifecycle.gate.gate_ref),
      transition: revision.lifecycle.transition.status,
      transition_receipt_ref: nullableExactRefIdentityV01(
        revision.lifecycle.transition.transition_receipt_ref,
      ),
      semantic_state_ref: nullableExactRefIdentityV01(
        revision.lifecycle.transition.semantic_state_ref,
      ),
      semantic_target_head_ref: nullableExactRefIdentityV01(
        revision.lifecycle.transition.semantic_target_head_ref,
      ),
      application: revision.lifecycle.application.status,
        current_family_head: revision.lifecycle.application.current_family_head,
        truth: revision.lifecycle.truth.claim_truth,
      });
    }
  }
  for (const family of reconciliation.relation_families) {
    add("relation_family_currentness", family.relation_family_id, {
      claim_ref: exactRecordRefIdentityV01(family.claim_ref),
      evidence_ref: exactRecordRefIdentityV01(family.evidence_ref),
      applicability_scope_fingerprint: family.applicability_scope_fingerprint,
      latest_recorded_candidate_ref:
        nullableRecordRefIdentityV01(family.latest_recorded_candidate_ref),
      applied_current_head_ref:
        nullableRecordRefIdentityV01(family.applied_current_head_ref),
      previously_applied_refs: fingerprintV01(family.previously_applied_refs),
      pending_revision_refs: fingerprintV01(family.pending_revision_refs),
    });
    for (const revision of family.revisions) {
      add(
        `source_${revision.relation.relation_kind}`,
        exactRecordRefIdentityV01(revision.relation_ref),
        {
          family_id: family.relation_family_id,
          claim_ref: exactRecordRefIdentityV01(revision.relation.claim_ref),
          evidence_ref: exactRecordRefIdentityV01(revision.relation.evidence_ref),
          recorded_latest: revision.lifecycle.record.latest_recorded_candidate,
          review: revision.lifecycle.review.status,
          proposal_ref:
            nullableExactRefIdentityV01(revision.lifecycle.review.proposal_ref),
          proposal_candidate_ref: nullableExactRefIdentityV01(
            revision.lifecycle.review.proposal_candidate_ref,
          ),
          decision: revision.lifecycle.decision.status,
          decision_ref: nullableExactRefIdentityV01(
            revision.lifecycle.decision.decision_ref,
          ),
          gate: revision.lifecycle.gate.status,
          gate_ref:
            nullableExactRefIdentityV01(revision.lifecycle.gate.gate_ref),
          transition: revision.lifecycle.transition.status,
          transition_receipt_ref: nullableExactRefIdentityV01(
            revision.lifecycle.transition.transition_receipt_ref,
          ),
          semantic_state_ref: nullableExactRefIdentityV01(
            revision.lifecycle.transition.semantic_state_ref,
          ),
          semantic_target_head_ref: nullableExactRefIdentityV01(
            revision.lifecycle.transition.semantic_target_head_ref,
          ),
          application: revision.lifecycle.application.status,
          current_family_head: revision.lifecycle.application.current_family_head,
        },
      );
    }
  }
  for (const [disposition, buckets] of [
    ["pending", reconciliation.pending_relation_material],
    ["applied", reconciliation.applied_relation_material],
  ] as const) {
    for (const [relationKind, refs] of Object.entries(buckets)) {
      for (const ref of refs) {
        add("relation_material_disposition", exactRecordRefIdentityV01(ref), {
          relation_kind: relationKind,
          disposition,
        });
      }
    }
  }
  for (const group of reconciliation.applicability_groups) {
    add("applicability_group", group.group_id, {
      disposition: group.disposition,
      claim_families: fingerprintV01(group.claim_family_ids),
      applied_relation_material: fingerprintV01(group.applied_relation_material),
    });
  }
  for (const later of reconciliation.later_context) {
    add(
      "later_context_feedback",
      exactRefIdentityV01(later.source_transition_receipt_ref),
      {
        status: later.status,
        later_packet_ref: nullableExactRefIdentityV01(later.later_packet_ref),
        context_use_review_ref:
          nullableExactRefIdentityV01(later.context_use_review_ref),
      },
    );
  }
  add("current_feedback_state", "latest_later_context", {
    status: environment.feedback_state.status,
    later_run_receipt_id: environment.feedback_state.later_run_receipt_id,
    later_run_receipt_fingerprint:
      environment.feedback_state.later_run_receipt_fingerprint,
    packet_id: environment.feedback_state.packet_id,
    packet_fingerprint: environment.feedback_state.packet_fingerprint,
    transition_receipt_id:
      environment.feedback_state.transition_receipt_id,
    transition_receipt_fingerprint:
      environment.feedback_state.transition_receipt_fingerprint,
    proposal_id: environment.feedback_state.proposal_id,
    proposal_fingerprint: environment.feedback_state.proposal_fingerprint,
  });

  for (const lineage of environment.lineages) {
    const lookupIdentity = fingerprintV01(lineage.lookup);
    for (const node of lineage.nodes) {
      add("lineage_node", `${lookupIdentity}:${node.node_id}`, {
        node_kind: node.node_kind,
        status: node.status,
        exact_ref: nullableExactRefIdentityV01(node.exact_ref),
        authority_boundary: node.authority_boundary,
      });
    }
    for (const edge of lineage.edges) {
      add("lineage_edge", `${lookupIdentity}:${edge.edge_id}`, {
        edge_kind: edge.edge_kind,
        from_node_id: edge.from_node_id,
        to_node_id: edge.to_node_id,
        status: edge.status,
      });
    }
    add("lineage_stop", lookupIdentity, {
      stopped_at: lineage.stop.stopped_at,
      reason: lineage.stop.reason,
      exact_ref: nullableExactRefIdentityV01(lineage.stop.exact_ref),
    });
  }
  for (const [key, value] of Object.entries(reconciliation.summary)) {
    add("reconciliation_summary", key, { value });
  }

  if (relations.length > MAX_NORMALIZED_RELATIONS_V01) {
    failV01("reconstruction_semantic_relations_bounded_invalid");
  }
  return relations.sort(compareRelationsV01);
}

function relationDifferencesV01(
  baseline: ReconstructionConformanceSemanticRelationV01[],
  reconstructed: ReconstructionConformanceSemanticRelationV01[],
): ReconstructionConformanceSemanticDifferenceV01[] {
  const baselineByFingerprint = new Map(
    baseline.map((relation) => [fingerprintV01(relation), relation]),
  );
  const reconstructedByFingerprint = new Map(
    reconstructed.map((relation) => [fingerprintV01(relation), relation]),
  );
  const differences: ReconstructionConformanceSemanticDifferenceV01[] = [];
  for (const [relationFingerprint, relation] of baselineByFingerprint) {
    if (!reconstructedByFingerprint.has(relationFingerprint)) {
      differences.push({
        difference_kind: "missing_from_reconstruction",
        relation_fingerprint: relationFingerprint,
        relation,
        non_compensable: true,
      });
    }
  }
  for (const [relationFingerprint, relation] of reconstructedByFingerprint) {
    if (!baselineByFingerprint.has(relationFingerprint)) {
      differences.push({
        difference_kind: "added_by_reconstruction",
        relation_fingerprint: relationFingerprint,
        relation,
        non_compensable: true,
      });
    }
  }
  return differences.sort((left, right) =>
    compareProtocolCodeUnitsV01(
      `${left.difference_kind}:${left.relation_fingerprint}`,
      `${right.difference_kind}:${right.relation_fingerprint}`,
    ));
}

function compareRelationsV01(
  left: ReconstructionConformanceSemanticRelationV01,
  right: ReconstructionConformanceSemanticRelationV01,
): number {
  return compareProtocolCodeUnitsV01(
    canonicalizeProtocolValueV01(left),
    canonicalizeProtocolValueV01(right),
  );
}

function exactRefIdentityV01(ref: ProjectVerifyExactProtocolRefV01): string {
  return `${ref.record_kind}:${ref.record_id}@${ref.record_fingerprint}`;
}

function nullableExactRefIdentityV01(
  ref: ProjectVerifyExactProtocolRefV01 | null,
): string {
  return ref ? exactRefIdentityV01(ref) : "none";
}

function exactRecordRefIdentityV01(ref: {
  record_kind: string;
  record_id: string;
  record_fingerprint: string;
}): string {
  return `${ref.record_kind}:${ref.record_id}@${ref.record_fingerprint}`;
}

function nullableRecordRefIdentityV01(
  ref: {
    record_kind: string;
    record_id: string;
    record_fingerprint: string;
  } | null,
): string {
  return ref ? exactRecordRefIdentityV01(ref) : "none";
}

function exactPacketIdentityV01(packet: TaskContextPacketV01): string {
  return `task_context_packet:${packet.packet_id}@${packet.integrity.fingerprint}`;
}

function sortedSourceRecordsV01(
  records: ReconstructionConformanceSourceRecordV01[],
): ReconstructionConformanceSourceRecordV01[] {
  return records
    .map((record) => ({ ...record }))
    .sort((left, right) =>
      compareProtocolCodeUnitsV01(
        `${left.record_kind}:${left.record_id}:${left.record_fingerprint}`,
        `${right.record_kind}:${right.record_id}:${right.record_fingerprint}`,
      ));
}

function sortedLineagesV01(
  lineages: ProjectVerifyLineageV01[],
): ProjectVerifyLineageV01[] {
  return [...lineages].sort((left, right) =>
    compareProtocolCodeUnitsV01(
      canonicalizeProtocolValueV01(left.lookup),
      canonicalizeProtocolValueV01(right.lookup),
    ));
}

function fingerprintV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function opaqueRelationIdentityV01(
  identityKind: string,
  sourceValue: string,
): string {
  return `${identityKind}:${fingerprintV01({
    normalization_version: RECONSTRUCTION_CONFORMANCE_NORMALIZATION_VERSION_V01,
    identity_kind: identityKind,
    source_value: sourceValue,
  })}`;
}

function nullableOpaqueSourceFingerprintV01(
  identityKind: string,
  sourceValue: string | null,
): string | null {
  return sourceValue === null
    ? null
    : opaqueRelationIdentityV01(identityKind, sourceValue);
}

function scanStringValuesV01(
  value: unknown,
  visit: (value: string) => void,
): void {
  if (typeof value === "string") {
    visit(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => scanStringValuesV01(item, visit));
  } else if (value !== null && typeof value === "object") {
    Object.values(value).forEach((item) => scanStringValuesV01(item, visit));
  }
}

function requireTextV01(value: unknown, code: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 8_192) {
    failV01(code);
  }
}

function requireFingerprintV01(
  value: unknown,
  code: string,
): asserts value is string {
  if (typeof value !== "string" || !SHA256_V01.test(value)) failV01(code);
}

function assertExactKeysV01(
  value: Record<string, unknown>,
  expected: readonly string[],
  code: string,
): void {
  const actual = Object.keys(value).sort(compareProtocolCodeUnitsV01);
  const expectedSorted = [...expected].sort(compareProtocolCodeUnitsV01);
  if (
    canonicalizeProtocolValueV01(actual) !==
    canonicalizeProtocolValueV01(expectedSorted)
  ) {
    failV01(code);
  }
}

function failV01(code: string): never {
  throw new ReconstructionConformanceErrorV01(code);
}
