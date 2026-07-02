import { createHash } from "node:crypto";

import {
  buildConversationHandoffPacketV02,
  createConversationHandoffPacketAuthorityBoundaryV02,
} from "./build-conversation-handoff-packet";
import {
  buildPrivacyRedactionRuntimeGuardReportV01,
  type PrivacyRedactionRuntimeGuardReport,
} from "../privacy/redaction-guard";
import {
  ConversationHandoffPacketInputVersionV02,
  ConversationHandoffPacketNextSliceV02,
  ConversationHandoffPacketProfilesV02,
  ConversationHandoffPacketScopeV02,
  ConversationHandoffPacketVersionV02,
  type ConversationHandoffPacketAuthorityBoundaryV02,
  type ConversationHandoffPacketBuildStatusV02,
  type ConversationHandoffPacketInputV02,
  type ConversationHandoffPacketProfileV02,
  type ConversationHandoffPacketV02,
} from "../../types/conversation-handoff-packet";
import type {
  DogfoodingResearchRecord,
  DogfoodingResearchRecordInput,
} from "../../types/dogfooding-research-record-runtime-contract";

type JsonRecord = Record<string, unknown>;
type PublicSafeDogfoodingRecordLike =
  | Partial<DogfoodingResearchRecord>
  | Partial<DogfoodingResearchRecordInput>
  | JsonRecord;

export const ConversationHandoffFromDogfoodingRecordVersionV01 =
  "conversation_handoff_from_dogfooding_record.v0.1" as const;
export const ConversationHandoffFromDogfoodingRecordSliceV01 =
  "conversation_handoff_packet_from_dogfooding_record_v0_1" as const;
export const ConversationHandoffFromDogfoodingRecordNextSliceV01 =
  "dogfooding_record_to_review_memory_proposal_v0_1" as const;
export const ConversationHandoffFromDogfoodingRecordNoNextCueV01 =
  "no_next_slice_v0_3_core_sequence_complete_pending_operator_decision" as const;
export const ConversationHandoffFromDogfoodingRecordDefaultProfileV01 =
  "codex_implementation" as const satisfies ConversationHandoffPacketProfileV02;

export const ConversationHandoffFromDogfoodingRecordStatusesV01 = [
  "built",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
] as const;
export type ConversationHandoffFromDogfoodingRecordStatusV01 =
  (typeof ConversationHandoffFromDogfoodingRecordStatusesV01)[number];

export interface ConversationHandoffFromDogfoodingRecordAuthorityBoundaryV01 {
  dogfooding_record_to_handoff_packet_builder_now: true;
  existing_conversation_handoff_packet_builder_used_now: true;
  caller_provided_public_safe_dogfooding_material_only: true;
  candidate_only_handoff_guidance: true;
  db_read_now: false;
  db_write_now: false;
  route_now: false;
  ui_now: false;
  component_now: false;
  cockpit_change_now: false;
  public_surface_change_now: false;
  route_model_change_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  retrieval_index_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  review_memory_write_now: false;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  formation_receipt_write_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  codex_execution_from_augnes_runtime_now: false;
  github_api_call_now: false;
  git_write_now: false;
  github_git_actuation_now: false;
  release_deploy_publish_now: false;
  dogfooding_record_to_handoff_packet_is_execution_approval: false;
  dogfooding_record_to_handoff_packet_is_truth: false;
  dogfooding_record_to_handoff_packet_is_proof: false;
  dogfooding_record_to_handoff_packet_is_accepted_evidence: false;
  dogfooding_record_to_handoff_packet_is_review_memory_write: false;
  dogfooding_record_to_handoff_packet_is_promotion: false;
  dogfooding_record_to_handoff_packet_is_formation_receipt: false;
  dogfooding_record_to_handoff_packet_is_durable_perspective_state: false;
  dogfooding_record_to_handoff_packet_is_product_write: false;
  handoff_packet_is_execution_approval: false;
  dogfooding_record_is_candidate_only: true;
  pr_body_is_truth: false;
  changed_files_are_proof: false;
  observed_files_are_proof: false;
  validation_pass_is_approval: false;
  validation_failure_is_rejection: false;
  smoke_pass_is_evidence: false;
  smoke_failure_is_rejection: false;
  ci_pass_is_authority: false;
  ci_failure_is_rejection: false;
  skipped_checks_are_automatic_failure: false;
  known_warnings_are_automatic_rejection: false;
  not_done_items_are_automatic_task_creation: false;
  expected_observed_delta_is_approval_or_rejection: false;
  review_memory_refs_are_reference_only: true;
  promotion_receipt_state_refs_are_reference_only: true;
  git_ref_is_authority: false;
  github_pr_ref_is_authority: false;
  next_recommended_slice_is_execution_approval: false;
}

export interface ConversationHandoffFromDogfoodingRecordResultV01 {
  ok: boolean;
  status: ConversationHandoffFromDogfoodingRecordStatusV01;
  error_code: ConversationHandoffFromDogfoodingRecordStatusV01 | null;
  packet_input: ConversationHandoffPacketInputV02 | null;
  packet: ConversationHandoffPacketV02 | null;
  source_record_refs: string[];
  profile: ConversationHandoffPacketProfileV02;
  reason_codes: string[];
  privacy_report: PrivacyRedactionRuntimeGuardReport | null;
  authority_boundary: ConversationHandoffFromDogfoodingRecordAuthorityBoundaryV01;
  packet_authority_boundary: ConversationHandoffPacketAuthorityBoundaryV02;
  product_write_executed: false;
  review_memory_written: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  promotion_executed: false;
  formation_receipt_written: false;
  durable_state_applied: false;
  github_git_actuated: false;
  provider_called: false;
  retrieval_executed: false;
  source_fetched: false;
  release_deploy_publish_executed: false;
}

type NormalizedDogfoodingRecord = {
  record_ref: string;
  record_kind: string | null;
  created_at: string | null;
  normalized_summary: string | null;
  source_refs: string[];
  pr_refs: string[];
  branch_refs: string[];
  commit_refs: string[];
  changed_file_refs: string[];
  validation_refs: string[];
  skipped_check_refs: string[];
  known_warning_refs: string[];
  not_done_refs: string[];
  expected_observed_delta_refs: string[];
  review_cues: string[];
  boundary_notes: string[];
  reason_codes: string[];
  next_recommended_slice: string | null;
};

type NormalizedDogfoodingMaterial = {
  packet_id: string | null;
  created_at: string | null;
  profile: ConversationHandoffPacketProfileV02;
  records: NormalizedDogfoodingRecord[];
  summary_fields: {
    project_context: string[];
    current_baseline: string[];
    current_task: string[];
    expected_files: string[];
    observed_files: string[];
    expected_checks: string[];
    observed_checks: string[];
    expected_observed_delta: string[];
    known_warnings: string[];
    skipped_checks: string[];
    not_done_items: string[];
    source_refs: string[];
    dogfooding_record_refs: string[];
    review_memory_refs: string[];
    promotion_receipt_state_refs: string[];
    unresolved_tensions: string[];
    forbidden_capabilities: string[];
    stop_conditions: string[];
    pr_body_requirements: string[];
    validation_commands: string[];
    reason_codes: string[];
    next_recommended_slice: string | null;
  };
};

const defaultCreatedAt = "1970-01-01T00:00:00.000Z" as const;

const defaultCurrentBaseline = [
  "#868 is the frozen web baseline for /, /perspective, and /workbench.",
  "#870 through #878 added the non-UI dogfooding, handoff, export, and audit behavior sequence.",
  "#871 added dogfooding research records as candidate-only review material.",
  "#872 added Codex result report to dogfooding research record binding.",
  "#873 added the deterministic conversation handoff packet builder used by this slice.",
] as const;

const defaultProjectContext = [
  "Augnes active development favors functional completion, measurable capability and performance improvement, and behavior-focused tests.",
  "Dogfooding records become candidate-only handoff packet input, not execution approval.",
] as const;

const defaultForbiddenCapabilities = [
  "Dogfooding-to-handoff mapping only.",
  "UI, route, DB, provider, retrieval, and source-fetch work remain out of scope.",
  "Review Memory, proof/evidence, promotion, Formation Receipt, durable state, and product-write remain out of scope.",
  "Codex, GitHub, Git, release, deploy, and publish execution remain out of scope.",
] as const;

const defaultStopConditions = [
  "Stop before reading database row payloads, adding routes, adding UI, or dereferencing GitHub, provider, retrieval, uploaded-file, connector, or local file refs.",
  "Stop before Review Memory writes, promotion, proof/evidence creation, durable state apply, product-write, release, deploy, or publish behavior.",
  "Stop if caller input includes private/raw/provider/runtime/local/credential/hidden-reasoning markers.",
] as const;

const defaultReasonCodes = [
  "conversation_handoff_from_dogfooding_record_present",
  "existing_conversation_handoff_packet_builder_used",
  "caller_provided_public_safe_dogfooding_material_only",
  "dogfooding_record_candidate_only",
  "handoff_packet_candidate_only",
  "db_not_read",
  "db_not_written",
  "route_not_added",
  "ui_not_added",
  "review_memory_not_written",
  "proof_not_created",
  "evidence_not_created",
  "promotion_not_executed",
  "formation_receipt_not_written",
  "durable_state_not_applied",
  "product_write_denied",
  "git_github_not_executed",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "source_fetch_not_executed",
  "release_not_executed",
] as const;

const allowedDogfoodingAuthorityTrueFields = new Set([
  "dogfooding_research_record_runtime_now",
  "same_origin_route_now",
  "local_test_db_query_or_write_now",
  "operator_supplied_payload_only",
  "caller_injected_local_db_only",
  "candidate_only",
  "public_safe_summary_only",
  "conversation_handoff_packet_builder_now",
  "caller_provided_input_only",
  "candidate_only_conversation_guidance",
  "dogfooding_record_is_candidate_only",
  "review_memory_refs_are_reference_only",
  "promotion_receipt_state_refs_are_reference_only",
]);

export function createConversationHandoffFromDogfoodingRecordAuthorityBoundaryV01():
  ConversationHandoffFromDogfoodingRecordAuthorityBoundaryV01 {
  return {
    dogfooding_record_to_handoff_packet_builder_now: true,
    existing_conversation_handoff_packet_builder_used_now: true,
    caller_provided_public_safe_dogfooding_material_only: true,
    candidate_only_handoff_guidance: true,
    db_read_now: false,
    db_write_now: false,
    route_now: false,
    ui_now: false,
    component_now: false,
    cockpit_change_now: false,
    public_surface_change_now: false,
    route_model_change_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    retrieval_index_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    review_memory_write_now: false,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    formation_receipt_write_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    codex_execution_from_augnes_runtime_now: false,
    github_api_call_now: false,
    git_write_now: false,
    github_git_actuation_now: false,
    release_deploy_publish_now: false,
    dogfooding_record_to_handoff_packet_is_execution_approval: false,
    dogfooding_record_to_handoff_packet_is_truth: false,
    dogfooding_record_to_handoff_packet_is_proof: false,
    dogfooding_record_to_handoff_packet_is_accepted_evidence: false,
    dogfooding_record_to_handoff_packet_is_review_memory_write: false,
    dogfooding_record_to_handoff_packet_is_promotion: false,
    dogfooding_record_to_handoff_packet_is_formation_receipt: false,
    dogfooding_record_to_handoff_packet_is_durable_perspective_state: false,
    dogfooding_record_to_handoff_packet_is_product_write: false,
    handoff_packet_is_execution_approval: false,
    dogfooding_record_is_candidate_only: true,
    pr_body_is_truth: false,
    changed_files_are_proof: false,
    observed_files_are_proof: false,
    validation_pass_is_approval: false,
    validation_failure_is_rejection: false,
    smoke_pass_is_evidence: false,
    smoke_failure_is_rejection: false,
    ci_pass_is_authority: false,
    ci_failure_is_rejection: false,
    skipped_checks_are_automatic_failure: false,
    known_warnings_are_automatic_rejection: false,
    not_done_items_are_automatic_task_creation: false,
    expected_observed_delta_is_approval_or_rejection: false,
    review_memory_refs_are_reference_only: true,
    promotion_receipt_state_refs_are_reference_only: true,
    git_ref_is_authority: false,
    github_pr_ref_is_authority: false,
    next_recommended_slice_is_execution_approval: false,
  };
}

export function buildConversationHandoffPacketInputFromDogfoodingRecordV01(
  input: unknown,
  profileOverride?: ConversationHandoffPacketProfileV02,
): ConversationHandoffPacketInputV02 | null {
  const normalized = normalizeDogfoodingMaterial(input, profileOverride);
  if (!normalized) return null;
  return buildPacketInput(normalized);
}

export function buildHandoffFromDogfoodingRecordV01(
  input: unknown,
  profileOverride?: ConversationHandoffPacketProfileV02,
): ConversationHandoffFromDogfoodingRecordResultV01 {
  const authorityBoundary =
    createConversationHandoffFromDogfoodingRecordAuthorityBoundaryV01();
  const packetAuthorityBoundary =
    createConversationHandoffPacketAuthorityBoundaryV02();
  const profile = resolveProfile(input, profileOverride);
  const privacyScanInput = stripAllowedAuthorityTrueFieldsForPrivacyScan(input);
  const privacyReport = buildPrivacyRedactionRuntimeGuardReportV01(privacyScanInput);
  if (privacyReport.status !== "passed") {
    return result({
      status:
        privacyReport.status === "blocked_forbidden_authority"
          ? "blocked_forbidden_authority"
          : "blocked_private_or_raw_payload",
      profile,
      packetInput: null,
      packet: null,
      sourceRecordRefs: [],
      privacyReport,
      authorityBoundary,
      packetAuthorityBoundary,
      reasonCodes: [
        ...defaultReasonCodes,
        privacyReport.status === "blocked_forbidden_authority"
          ? "forbidden_authority_blocked"
          : "raw_private_payload_blocked",
      ],
    });
  }

  const sourceStatus = detectBlockedSourceStatus(input);
  if (sourceStatus) {
    return result({
      status: sourceStatus,
      profile,
      packetInput: null,
      packet: null,
      sourceRecordRefs: collectSourceRecordRefs(input),
      privacyReport,
      authorityBoundary,
      packetAuthorityBoundary,
      reasonCodes: [
        ...defaultReasonCodes,
        sourceStatus === "blocked_forbidden_authority"
          ? "source_record_blocked_forbidden_authority"
          : "source_record_blocked_private_or_raw_payload",
      ],
    });
  }

  const packetInput =
    buildConversationHandoffPacketInputFromDogfoodingRecordV01(input, profile);
  if (!packetInput) {
    return result({
      status: "rejected",
      profile,
      packetInput: null,
      packet: null,
      sourceRecordRefs: [],
      privacyReport,
      authorityBoundary,
      packetAuthorityBoundary,
      reasonCodes: [...defaultReasonCodes, "invalid_dogfooding_material_rejected"],
    });
  }

  const packetBuild = buildConversationHandoffPacketV02(packetInput);
  if (!packetBuild.ok || !packetBuild.packet) {
    return result({
      status: mapPacketBuildStatus(packetBuild.status),
      profile,
      packetInput: null,
      packet: null,
      sourceRecordRefs: normalizeList(packetInput.dogfooding_record_refs),
      privacyReport: packetBuild.privacy_report ?? privacyReport,
      authorityBoundary,
      packetAuthorityBoundary: packetBuild.authority_boundary,
      reasonCodes: [
        ...defaultReasonCodes,
        ...packetBuild.reason_codes,
        packetBuild.status === "blocked_forbidden_authority"
          ? "forbidden_authority_blocked"
          : "packet_builder_rejected",
      ],
    });
  }

  return result({
    status: "built",
    profile: packetInput.profile,
    packetInput,
    packet: packetBuild.packet,
    sourceRecordRefs: normalizeList(packetInput.dogfooding_record_refs),
    privacyReport,
    authorityBoundary,
    packetAuthorityBoundary: packetBuild.authority_boundary,
    reasonCodes: [
      ...defaultReasonCodes,
      ...packetBuild.reason_codes,
      "changed_file_refs_mapped_to_observed_files",
      "validation_refs_mapped_to_observed_checks",
      "skipped_checks_preserved",
      "known_warnings_preserved",
      "not_done_preserved",
      "expected_observed_delta_preserved",
      "review_cues_preserved_as_context",
    ],
  });
}

export function buildConversationHandoffFromDogfoodingRecordV01(
  input: unknown,
  profileOverride?: ConversationHandoffPacketProfileV02,
): ConversationHandoffFromDogfoodingRecordResultV01 {
  return buildHandoffFromDogfoodingRecordV01(input, profileOverride);
}

function result({
  status,
  profile,
  packetInput,
  packet,
  sourceRecordRefs,
  privacyReport,
  authorityBoundary,
  packetAuthorityBoundary,
  reasonCodes,
}: {
  status: ConversationHandoffFromDogfoodingRecordStatusV01;
  profile: ConversationHandoffPacketProfileV02;
  packetInput: ConversationHandoffPacketInputV02 | null;
  packet: ConversationHandoffPacketV02 | null;
  sourceRecordRefs: string[];
  privacyReport: PrivacyRedactionRuntimeGuardReport | null;
  authorityBoundary: ConversationHandoffFromDogfoodingRecordAuthorityBoundaryV01;
  packetAuthorityBoundary: ConversationHandoffPacketAuthorityBoundaryV02;
  reasonCodes: readonly string[];
}): ConversationHandoffFromDogfoodingRecordResultV01 {
  return {
    ok: status === "built",
    status,
    error_code: status === "built" ? null : status,
    packet_input: packetInput,
    packet,
    source_record_refs: uniqueSortedStrings(sourceRecordRefs),
    profile,
    reason_codes: uniqueSortedStrings(reasonCodes),
    privacy_report: privacyReport,
    authority_boundary: authorityBoundary,
    packet_authority_boundary: packetAuthorityBoundary,
    product_write_executed: false,
    review_memory_written: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    formation_receipt_written: false,
    durable_state_applied: false,
    github_git_actuated: false,
    provider_called: false,
    retrieval_executed: false,
    source_fetched: false,
    release_deploy_publish_executed: false,
  };
}

function buildPacketInput(
  normalized: NormalizedDogfoodingMaterial,
): ConversationHandoffPacketInputV02 {
  const recordRefs = uniqueSortedStrings([
    ...normalized.summary_fields.dogfooding_record_refs,
    ...normalized.records.map((record) => record.record_ref),
  ]);
  const sourceRefs = uniqueSortedStrings([
    ...normalized.summary_fields.source_refs,
    ConversationHandoffFromDogfoodingRecordSliceV01,
    "conversation_handoff_packet_builder_v0_2",
    ...normalized.records.flatMap((record) => [
      ...record.source_refs,
      ...record.pr_refs.map((ref) => `pr-ref:${ref}`),
      ...record.branch_refs.map((ref) => `branch-ref:${ref}`),
      ...record.commit_refs.map((ref) => `commit-ref:${ref}`),
      ...record.reason_codes.map((reasonCode) => `dogfooding-reason-code:${reasonCode}`),
    ]),
  ]);
  const observedFiles = uniqueSortedStrings([
    ...normalized.summary_fields.observed_files,
    ...normalized.records.flatMap((record) => record.changed_file_refs),
  ]);
  const observedChecks = uniqueSortedStrings([
    ...normalized.summary_fields.observed_checks,
    ...normalized.records.flatMap((record) => record.validation_refs),
  ]);
  const validationCommands = uniqueSortedStrings([
    ...normalized.summary_fields.validation_commands,
    ...normalized.records.flatMap((record) =>
      record.validation_refs.map((ref) => `candidate-validation-ref:${ref}`),
    ),
  ]);
  const skippedChecks = uniqueSortedStrings([
    ...normalized.summary_fields.skipped_checks,
    ...normalized.records.flatMap((record) =>
      record.skipped_check_refs.map(
        (ref) => `${ref} remains review context, not automatic failure.`,
      ),
    ),
  ]);
  const knownWarnings = uniqueSortedStrings([
    ...normalized.summary_fields.known_warnings,
    ...normalized.records.flatMap((record) =>
      record.known_warning_refs.map(
        (ref) => `${ref} remains review context, not automatic rejection.`,
      ),
    ),
  ]);
  const notDoneItems = uniqueSortedStrings([
    ...normalized.summary_fields.not_done_items,
    ...normalized.records.flatMap((record) =>
      record.not_done_refs.map(
        (ref) => `${ref} remains a next-task cue, not automatic task creation.`,
      ),
    ),
    ...normalized.records.flatMap((record) =>
      record.review_cues
        .filter((cue) => /not[-_\s]?done|preserve_not_done|no_action/i.test(cue))
        .map((cue) => `review-cue-not-done-context:${cue}`),
    ),
  ]);
  const expectedObservedDelta = uniqueSortedStrings([
    ...normalized.summary_fields.expected_observed_delta,
    ...normalized.records.flatMap((record) =>
      record.expected_observed_delta_refs.map(
        (ref) => `${ref} remains review context, not approval or rejection.`,
      ),
    ),
  ]);
  const reviewCueContext = uniqueSortedStrings([
    ...normalized.summary_fields.unresolved_tensions,
    ...normalized.records.flatMap((record) =>
      record.review_cues.map((cue) => `review-cue-context:${cue}`),
    ),
    ...normalized.records.flatMap((record) =>
      record.boundary_notes.map((note) => `dogfooding-boundary-note:${note}`),
    ),
  ]);
  const currentTask = uniqueSortedStrings([
    ...normalized.summary_fields.current_task,
    ...normalized.records
      .map((record) =>
        record.normalized_summary
          ? `Candidate dogfooding summary from ${record.record_ref}: ${record.normalized_summary}`
          : "",
      )
      .filter(Boolean),
  ]);
  const projectContext = uniqueSortedStrings([
    ...defaultProjectContext,
    ...normalized.summary_fields.project_context,
  ]);
  const nextRecommendedSlice = resolveNextRecommendedSlice(normalized);

  return {
    input_version: ConversationHandoffPacketInputVersionV02,
    packet_id:
      normalized.packet_id ??
      `conversation-handoff-from-dogfooding-record:${normalized.profile}:${hashSuffix({
        recordRefs,
        sourceRefs,
        currentTask,
        observedFiles,
        observedChecks,
      })}`,
    packet_version: ConversationHandoffPacketVersionV02,
    scope: ConversationHandoffPacketScopeV02,
    profile: normalized.profile,
    created_at: normalized.created_at ?? createdAtFromRecords(normalized.records),
    project_context: projectContext,
    current_baseline: uniqueSortedStrings([
      ...defaultCurrentBaseline,
      ...normalized.summary_fields.current_baseline,
    ]),
    current_task: currentTask,
    expected_files: uniqueSortedStrings(normalized.summary_fields.expected_files),
    observed_files: observedFiles,
    expected_checks: uniqueSortedStrings(normalized.summary_fields.expected_checks),
    observed_checks: observedChecks,
    expected_observed_delta: expectedObservedDelta,
    known_warnings: knownWarnings,
    skipped_checks: skippedChecks,
    not_done_items: notDoneItems,
    source_refs: sourceRefs,
    dogfooding_record_refs: recordRefs,
    review_memory_refs: uniqueSortedStrings(normalized.summary_fields.review_memory_refs),
    promotion_receipt_state_refs: uniqueSortedStrings(
      normalized.summary_fields.promotion_receipt_state_refs,
    ),
    unresolved_tensions: reviewCueContext,
    authority_boundary: {
      ...createConversationHandoffPacketAuthorityBoundaryV02(),
    } as Record<string, unknown>,
    forbidden_capabilities: uniqueSortedStrings([
      ...defaultForbiddenCapabilities,
      ...normalized.summary_fields.forbidden_capabilities,
    ]),
    stop_conditions: uniqueSortedStrings([
      ...defaultStopConditions,
      ...normalized.summary_fields.stop_conditions,
    ]),
    pr_body_requirements: uniqueSortedStrings(normalized.summary_fields.pr_body_requirements),
    validation_commands: validationCommands,
    next_recommended_slice: nextRecommendedSlice,
    privacy_report: {
      status: "passed",
      caller_provided_public_safe_dogfooding_material_only: true,
    },
    reason_codes: [
      "conversation_handoff_packet_builder_present",
      "candidate_only_conversation_guidance",
      "dogfooding_record_candidate_only",
      "next_slice_is_cue_not_execution_approval",
    ],
  };
}

function normalizeDogfoodingMaterial(
  input: unknown,
  profileOverride?: ConversationHandoffPacketProfileV02,
): NormalizedDogfoodingMaterial | null {
  if (!isRecord(input) && !Array.isArray(input)) return null;
  const root = isRecord(input) ? input : {};
  const records = extractRecordValues(input).map(normalizeRecord).sort((a, b) =>
    a.record_ref.localeCompare(b.record_ref),
  );
  const summaryFields = {
    project_context: normalizeList(root.project_context),
    current_baseline: normalizeList(root.current_baseline),
    current_task: normalizeList(root.current_task),
    expected_files: normalizeList(root.expected_files),
    observed_files: normalizeList(root.observed_files),
    expected_checks: normalizeList(root.expected_checks),
    observed_checks: normalizeList(root.observed_checks),
    expected_observed_delta: normalizeList(root.expected_observed_delta),
    known_warnings: normalizeList(root.known_warnings),
    skipped_checks: normalizeList(root.skipped_checks),
    not_done_items: normalizeList(root.not_done_items),
    source_refs: normalizeList(root.source_refs),
    dogfooding_record_refs: normalizeList(root.dogfooding_record_refs),
    review_memory_refs: normalizeList(root.review_memory_refs),
    promotion_receipt_state_refs: normalizeList(root.promotion_receipt_state_refs),
    unresolved_tensions: normalizeList(root.unresolved_tensions),
    forbidden_capabilities: normalizeList(root.forbidden_capabilities),
    stop_conditions: normalizeList(root.stop_conditions),
    pr_body_requirements: normalizeList(root.pr_body_requirements),
    validation_commands: normalizeList(root.validation_commands),
    reason_codes: normalizeList(root.reason_codes),
    next_recommended_slice: resolveRootNextRecommendedSlice(root),
  };
  const hasSummaryOnlyRefs =
    summaryFields.dogfooding_record_refs.length > 0 ||
    summaryFields.current_task.length > 0 ||
    summaryFields.observed_files.length > 0 ||
    summaryFields.observed_checks.length > 0;
  if (records.length === 0 && !hasSummaryOnlyRefs) return null;
  return {
    packet_id: normalizeOptionalString(root.packet_id),
    created_at: normalizeOptionalString(root.created_at),
    profile: resolveProfile(input, profileOverride),
    records,
    summary_fields: summaryFields,
  };
}

function extractRecordValues(input: unknown): PublicSafeDogfoodingRecordLike[] {
  if (Array.isArray(input)) return input.filter(isRecord);
  if (!isRecord(input)) return [];
  for (const key of ["records", "dogfooding_records", "dogfooding_research_records"]) {
    const value = input[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  const single = input.record ?? input.dogfooding_record ?? input.dogfooding_research_record;
  if (isRecord(single)) return [single];
  if (
    "record_id" in input ||
    "normalized_summary" in input ||
    "changed_file_refs" in input ||
    "validation_refs" in input
  ) {
    return [input];
  }
  return [];
}

function normalizeRecord(
  record: PublicSafeDogfoodingRecordLike,
  index = 0,
): NormalizedDogfoodingRecord {
  const recordView = record as JsonRecord;
  const recordRef =
    normalizeOptionalString(recordView.record_id) ??
    normalizeOptionalString(recordView.record_ref) ??
    `dogfooding-record-summary:${String(index + 1).padStart(3, "0")}`;
  return {
    record_ref: recordRef,
    record_kind: normalizeOptionalString(recordView.record_kind),
    created_at: normalizeOptionalString(recordView.created_at),
    normalized_summary: normalizeOptionalString(recordView.normalized_summary),
    source_refs: normalizeList(recordView.source_refs),
    pr_refs: normalizeList(recordView.pr_refs),
    branch_refs: normalizeList(recordView.branch_refs),
    commit_refs: normalizeList(recordView.commit_refs),
    changed_file_refs: normalizeList(recordView.changed_file_refs),
    validation_refs: normalizeList(recordView.validation_refs),
    skipped_check_refs: normalizeList(recordView.skipped_check_refs),
    known_warning_refs: normalizeList(recordView.known_warning_refs),
    not_done_refs: normalizeList(recordView.not_done_refs),
    expected_observed_delta_refs: normalizeList(
      recordView.expected_observed_delta_refs,
    ),
    review_cues: normalizeReviewCues(recordView.review_cues),
    boundary_notes: normalizeList(
      isRecord(recordView.privacy_report)
        ? recordView.privacy_report.boundary_notes
        : [],
    ),
    reason_codes: normalizeList(recordView.reason_codes),
    next_recommended_slice: resolveRootNextRecommendedSlice(recordView),
  };
}

function normalizeReviewCues(value: unknown): string[] {
  if (!Array.isArray(value)) return normalizeList(value);
  return uniqueSortedStrings(
    value.map((item) => {
      if (!isRecord(item)) return normalizeString(item);
      const cueKind = normalizeOptionalString(item.cue_kind) ?? "review_cue";
      const summary =
        normalizeOptionalString(item.public_safe_summary) ??
        normalizeOptionalString(item.bounded_summary) ??
        normalizeOptionalString(item.summary) ??
        "public-safe review cue";
      return `${cueKind}:${summary}`;
    }),
  );
}

function resolveRootNextRecommendedSlice(root: JsonRecord): string | null {
  return (
    normalizeOptionalString(root.next_recommended_slice) ??
    normalizeOptionalString(root.next_slice)
  );
}

function resolveNextRecommendedSlice(
  normalized: NormalizedDogfoodingMaterial,
): string {
  return (
    normalized.summary_fields.next_recommended_slice ??
    normalized.records
      .map((record) => record.next_recommended_slice)
      .find((value): value is string => Boolean(value)) ??
    detectNoNextCueFromMaterial(normalized) ??
    ConversationHandoffFromDogfoodingRecordNextSliceV01
  );
}

function detectNoNextCueFromMaterial(
  normalized: NormalizedDogfoodingMaterial,
): string | null {
  const values = [
    ...Object.values(normalized.summary_fields).flatMap((value) =>
      Array.isArray(value) ? value : [value],
    ),
    ...normalized.records.flatMap((record) => [
      record.record_ref,
      record.record_kind,
      record.created_at,
      record.normalized_summary,
      record.next_recommended_slice,
      ...record.source_refs,
      ...record.pr_refs,
      ...record.branch_refs,
      ...record.commit_refs,
      ...record.changed_file_refs,
      ...record.validation_refs,
      ...record.skipped_check_refs,
      ...record.known_warning_refs,
      ...record.not_done_refs,
      ...record.expected_observed_delta_refs,
      ...record.review_cues,
      ...record.boundary_notes,
      ...record.reason_codes,
    ]),
  ];
  return values.some(
    (value) =>
      typeof value === "string" &&
      value.includes(ConversationHandoffFromDogfoodingRecordNoNextCueV01),
  )
    ? ConversationHandoffFromDogfoodingRecordNoNextCueV01
    : null;
}

function resolveProfile(
  input: unknown,
  profileOverride?: ConversationHandoffPacketProfileV02,
): ConversationHandoffPacketProfileV02 {
  if (profileOverride && ConversationHandoffPacketProfilesV02.includes(profileOverride)) {
    return profileOverride;
  }
  if (isRecord(input) && typeof input.profile === "string") {
    const profile = input.profile as ConversationHandoffPacketProfileV02;
    if (ConversationHandoffPacketProfilesV02.includes(profile)) return profile;
  }
  return ConversationHandoffFromDogfoodingRecordDefaultProfileV01;
}

function mapPacketBuildStatus(
  status: ConversationHandoffPacketBuildStatusV02,
): ConversationHandoffFromDogfoodingRecordStatusV01 {
  if (status === "built") return "built";
  if (status === "blocked_forbidden_authority") return "blocked_forbidden_authority";
  if (status === "blocked_private_or_raw_payload") {
    return "blocked_private_or_raw_payload";
  }
  return "rejected";
}

function detectBlockedSourceStatus(
  input: unknown,
): "blocked_private_or_raw_payload" | "blocked_forbidden_authority" | null {
  let blockedPrivate = false;
  let blockedAuthority = false;
  visitValue(input, (value, key) => {
    if (key !== "status" || typeof value !== "string") return;
    if (value === "blocked_forbidden_authority") blockedAuthority = true;
    if (value === "blocked_private_or_raw_payload") blockedPrivate = true;
  });
  if (blockedAuthority) return "blocked_forbidden_authority";
  if (blockedPrivate) return "blocked_private_or_raw_payload";
  return null;
}

function collectSourceRecordRefs(input: unknown): string[] {
  return extractRecordValues(input)
    .map((record) => normalizeOptionalString(record.record_id))
    .filter((value): value is string => Boolean(value));
}

function stripAllowedAuthorityTrueFieldsForPrivacyScan(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripAllowedAuthorityTrueFieldsForPrivacyScan(item));
  }
  if (!isRecord(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce<JsonRecord>((acc, key) => {
      const child = value[key];
      if (
        allowedDogfoodingAuthorityTrueFields.has(key) &&
        (child === true || child === false)
      ) {
        acc[key] = false;
        return acc;
      }
      acc[key] = stripAllowedAuthorityTrueFieldsForPrivacyScan(child);
      return acc;
    }, {});
}

function createdAtFromRecords(records: NormalizedDogfoodingRecord[]): string {
  const dates = records
    .map((record) => record.created_at)
    .filter((value): value is string => Boolean(value))
    .sort();
  return dates[0] ?? defaultCreatedAt;
}

function hashSuffix(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex").slice(0, 16);
}

function normalizeList(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return uniqueSortedStrings(value.map(normalizeString));
  return uniqueSortedStrings([normalizeString(value)]);
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = normalizeString(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeString(value: unknown): string {
  if (typeof value === "string") return clampText(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  return clampText(canonicalJson(value));
}

function clampText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 480) return normalized;
  return `${normalized.slice(0, 477).trimEnd()}...`;
}

function uniqueSortedStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort();
}

function visitValue(
  value: unknown,
  visitor: (value: unknown, key?: string) => void,
  key?: string,
): void {
  visitor(value, key);
  if (Array.isArray(value)) {
    for (const item of value) visitValue(item, visitor);
    return;
  }
  if (!isRecord(value)) return;
  for (const childKey of Object.keys(value).sort()) {
    visitValue(value[childKey], visitor, childKey);
  }
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sortJson(item));
  if (!isRecord(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce<JsonRecord>((acc, key) => {
      acc[key] = sortJson(value[key]);
      return acc;
    }, {});
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
