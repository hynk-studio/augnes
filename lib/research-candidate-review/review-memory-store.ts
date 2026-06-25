import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type {
  ResearchCandidateReviewMemoryAuthorityBoundary,
  ResearchCandidateReviewMemoryContractVersion,
  ResearchCandidateReviewMemoryDiscardInput,
  ResearchCandidateReviewMemoryLifecycleState,
  ResearchCandidateReviewMemoryPrivacyClass,
  ResearchCandidateReviewMemoryRecord,
  ResearchCandidateReviewMemoryRecordKind,
  ResearchCandidateReviewMemoryReasonCode,
  ResearchCandidateReviewMemoryReviewDecision,
  ResearchCandidateReviewMemoryScope,
  ResearchCandidateReviewMemorySourceSurface,
  ResearchCandidateReviewMemoryStatus,
  ResearchCandidateReviewMemoryStoreAuthorityBoundary,
  ResearchCandidateReviewMemoryStoreInput,
  ResearchCandidateReviewMemoryStoreSnapshot,
  ResearchCandidateReviewMemorySupersedeInput,
  ResearchCandidateReviewMemoryValidationResult,
} from "../../types/research-candidate-review-memory-contract";

const storeVersion = "research_candidate_review_memory_store.v0.1" as const;
const contractVersion =
  "research_candidate_review_memory_contract.v0.1" as ResearchCandidateReviewMemoryContractVersion;
const recordVersion = "research_candidate_review_memory_record.v0.1" as const;
const memoryScope = "project:augnes" as ResearchCandidateReviewMemoryScope;
const recordStatus = "contract_only" as ResearchCandidateReviewMemoryStatus;
const storeStatus = "local_store_snapshot" as const;

const recordKindValues: ResearchCandidateReviewMemoryRecordKind[] = [
  "candidate_review_snapshot",
  "operator_review_note",
  "discard_record",
  "feedback_summary",
  "handoff_summary",
  "diagnostic_summary",
  "profile_summary",
];

const lifecycleStateValues: ResearchCandidateReviewMemoryLifecycleState[] = [
  "draft",
  "active",
  "discarded",
  "superseded",
  "archived",
];

const reviewDecisionValues: ResearchCandidateReviewMemoryReviewDecision[] = [
  "none",
  "keep_for_review",
  "discard",
  "supersede",
  "needs_more_evidence",
  "needs_operator_review",
];

const sourceSurfaceValues: ResearchCandidateReviewMemorySourceSurface[] = [
  "research_candidate_lifecycle_read_model",
  "research_candidate_calibration_diagnostic",
  "logical_claim_shape_preview",
  "feedback_to_rule_candidate",
  "temporal_handoff_diagnostic_sections",
  "target_agent_ai_context_packet_profiles",
  "operator_note",
  "manual_source_ref",
  "unknown",
];

const privacyClassValues: ResearchCandidateReviewMemoryPrivacyClass[] = [
  "public_safe",
  "private_ref_only",
  "blocked_raw_private_payload",
];

const reasonCodeValues: ResearchCandidateReviewMemoryReasonCode[] = [
  "candidate_ref_present",
  "candidate_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "operator_review_required",
  "discard_is_not_deletion",
  "supersede_preserves_lineage",
  "privacy_boundary_preserved",
  "raw_payload_blocked",
  "contract_only_not_runtime_memory",
  "candidate_memory_not_truth",
  "review_memory_not_promotion",
  "product_write_denied",
];

const requiredReasonCodes: ResearchCandidateReviewMemoryReasonCode[] = [
  "privacy_boundary_preserved",
  "contract_only_not_runtime_memory",
  "candidate_memory_not_truth",
  "review_memory_not_promotion",
  "product_write_denied",
];

const recordForbiddenAuthorityFields = [
  "runtime_memory_write_now",
  "db_query_or_write_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "codex_execution_authority",
  "github_automation_authority",
  "provider_openai_authority",
  "source_fetch_authority",
  "retrieval_rag_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
] as const;

const storeForbiddenAuthorityFields = [
  "runtime_route_added_now",
  "ui_added_now",
  "db_migration_added_now",
  "db_query_or_write_now",
  "provider_openai_call_now",
  "source_fetch_now",
  "retrieval_rag_execution_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "codex_execution_authority",
  "github_automation_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
] as const;

const forbiddenSourceRefPatterns = [
  /https?:\/\//i,
  /file:\/\//i,
  /\/Users\//,
  /\/home\//,
  /C:\\Users\\/i,
  /private URL/i,
  /private_url/i,
  /local private path/i,
  /raw source body/i,
  /raw candidate payload/i,
  /raw provider output/i,
  /provider thread/i,
  /provider_thread/i,
  /provider run/i,
  /provider_run/i,
  /provider session/i,
  /thread_/i,
  /run_/i,
  /raw db row/i,
  /raw_db_row/i,
  /raw browser dump/i,
  /browser dump/i,
  /hidden reasoning/i,
  /sk-/i,
  /ghp_/i,
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /password:/i,
  /secret:/i,
  /private key/i,
  /-----BEGIN PRIVATE KEY-----/i,
  /-----BEGIN RSA PRIVATE KEY-----/i,
  /-----BEGIN OPENSSH PRIVATE KEY-----/i,
];

const forbiddenSummaryPattern =
  /raw conversation|hidden reasoning|raw source body|raw candidate payload|raw provider output|provider thread|provider run|provider session|private URL|private_url|file:\/\/|\/Users\/|\/home\/|C:\\Users\\|\bsecret\b|\btoken\b|sk-|ghp_|OPENAI_API_KEY|GITHUB_TOKEN|password:|private key|raw db row|raw_db_row|browser dump|raw browser dump/i;

const isoUtcTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function getResearchCandidateReviewMemoryStoreAuthorityBoundary(): ResearchCandidateReviewMemoryStoreAuthorityBoundary {
  return {
    local_store_only: true,
    explicit_file_write_only: true,
    runtime_route_added_now: false,
    ui_added_now: false,
    db_migration_added_now: false,
    db_query_or_write_now: false,
    provider_openai_call_now: false,
    source_fetch_now: false,
    retrieval_rag_execution_now: false,
    source_of_truth: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state: false,
    work_mutation: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    git_ledger_export_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
  };
}

export function validateResearchCandidateReviewMemoryRecordForStore(
  record: ResearchCandidateReviewMemoryRecord,
): ResearchCandidateReviewMemoryValidationResult {
  const failureCodes: string[] = [];
  if (record?.record_version !== recordVersion) failureCodes.push("invalid_record_version");
  if (record?.scope !== memoryScope) failureCodes.push("invalid_scope");
  if (record?.status !== recordStatus) failureCodes.push("invalid_status");
  if (!record?.record_id) failureCodes.push("missing_record_id");
  if (!record?.candidate_ref) failureCodes.push("missing_candidate_ref");
  if (!recordKindValues.includes(record?.record_kind)) failureCodes.push("invalid_record_kind");
  if (!lifecycleStateValues.includes(record?.lifecycle_state)) {
    failureCodes.push("invalid_lifecycle_state");
  }
  if (!reviewDecisionValues.includes(record?.review_decision)) {
    failureCodes.push("invalid_review_decision");
  }
  if (!record?.bounded_summary) failureCodes.push("missing_bounded_summary");
  if (record?.bounded_summary && forbiddenSummaryPattern.test(record.bounded_summary)) {
    failureCodes.push("bounded_summary_private_pattern");
  }
  if (
    record?.operator_note_summary &&
    forbiddenSummaryPattern.test(record.operator_note_summary)
  ) {
    failureCodes.push("operator_note_summary_private_pattern");
  }
  if (!Array.isArray(record?.source_refs)) {
    failureCodes.push("invalid_source_refs");
  } else {
    for (const sourceRef of record.source_refs) {
      if (!sourceSurfaceValues.includes(sourceRef?.source_surface)) {
        failureCodes.push(`invalid_source_surface:${sourceRef?.source_surface ?? "missing"}`);
      }
      if (!sourceRef?.source_ref) {
        failureCodes.push("missing_source_ref");
      } else if (sourceRefHasForbiddenPrivatePattern(sourceRef.source_ref)) {
        failureCodes.push(`source_ref_private_pattern:${sourceRef.source_ref}`);
      }
      if (typeof sourceRef?.public_safe !== "boolean") {
        failureCodes.push(`invalid_source_ref_public_safe:${sourceRef?.source_ref ?? "missing"}`);
      }
    }
  }
  failureCodes.push(...validateRecordTimestamps(record));
  failureCodes.push(...validatePrivacyReport(record));
  failureCodes.push(...validateRecordAuthorityBoundary(record?.authority_boundary));
  if (record?.lifecycle_state === "discarded" && !record.discard_reason) {
    failureCodes.push("discarded_missing_discard_reason");
  }
  if (record?.lifecycle_state === "superseded" && !record.supersedes_record_ref) {
    failureCodes.push("superseded_missing_supersedes_record_ref");
  }
  if (!Array.isArray(record?.reason_codes)) {
    failureCodes.push("invalid_reason_codes");
  } else {
    for (const reasonCode of record.reason_codes) {
      if (!reasonCodeValues.includes(reasonCode)) {
        failureCodes.push(`invalid_reason_code:${reasonCode}`);
      }
    }
  }
  if (Array.isArray(record?.source_refs)) {
    if (record.source_refs.length > 0 && !record.reason_codes?.includes("source_ref_present")) {
      failureCodes.push("source_ref_present_reason_missing");
    }
    if (record.source_refs.length === 0 && !record.reason_codes?.includes("source_ref_missing")) {
      failureCodes.push("source_ref_missing_reason_missing");
    }
    if (record.source_refs.length > 0 && record.reason_codes?.includes("source_ref_missing")) {
      failureCodes.push("source_ref_missing_reason_mismatch");
    }
    if (record.source_refs.length === 0 && record.reason_codes?.includes("source_ref_present")) {
      failureCodes.push("source_ref_present_reason_mismatch");
    }
  }
  for (const reasonCode of requiredReasonCodes) {
    if (!record?.reason_codes?.includes(reasonCode)) {
      failureCodes.push(`missing_reason_code:${reasonCode}`);
    }
  }
  if (!record?.reason_codes?.includes("candidate_ref_present")) {
    failureCodes.push("candidate_ref_present_reason_missing");
  }

  return { passed: failureCodes.length === 0, failure_codes: failureCodes.sort() };
}

export function validateResearchCandidateReviewMemoryStoreSnapshot(
  snapshot: ResearchCandidateReviewMemoryStoreSnapshot,
): ResearchCandidateReviewMemoryValidationResult {
  const failureCodes: string[] = [];
  if (snapshot?.store_version !== storeVersion) failureCodes.push("invalid_store_version");
  if (snapshot?.contract_version !== contractVersion) {
    failureCodes.push("invalid_contract_version");
  }
  if (snapshot?.scope !== memoryScope) failureCodes.push("invalid_scope");
  if (snapshot?.status !== storeStatus) failureCodes.push("invalid_status");
  if (!Array.isArray(snapshot?.records)) {
    failureCodes.push("invalid_records");
  }
  const records = Array.isArray(snapshot?.records) ? snapshot.records : [];
  const recordIds = records.map((record) => record.record_id);
  const duplicateIds = recordIds.filter((id, index) => recordIds.indexOf(id) !== index);
  for (const duplicateId of uniqueSorted(duplicateIds)) {
    failureCodes.push(`duplicate_record_id:${duplicateId}`);
  }
  const expectedOrder = uniqueSorted(recordIds);
  if (!arraysEqual(snapshot?.record_order ?? [], expectedOrder)) {
    failureCodes.push("record_order_mismatch");
  }
  if (snapshot?.record_count !== records.length) failureCodes.push("record_count_mismatch");
  if (!arraysEqual(snapshot?.active_record_refs ?? [], refsForState(records, "active"))) {
    failureCodes.push("active_record_refs_mismatch");
  }
  if (!arraysEqual(snapshot?.discarded_record_refs ?? [], refsForState(records, "discarded"))) {
    failureCodes.push("discarded_record_refs_mismatch");
  }
  if (!arraysEqual(snapshot?.superseded_record_refs ?? [], refsForState(records, "superseded"))) {
    failureCodes.push("superseded_record_refs_mismatch");
  }
  failureCodes.push(...validateLineageRefs(records));
  if (!snapshot?.store_fingerprint) {
    failureCodes.push("empty_store_fingerprint");
  } else if (
    snapshot.store_fingerprint !==
    createResearchCandidateReviewMemoryStoreFingerprint(snapshot)
  ) {
    failureCodes.push("store_fingerprint_mismatch");
  }
  failureCodes.push(...validateStoreAuthorityBoundary(snapshot?.authority_boundary));
  for (const record of records) {
    const validation = validateResearchCandidateReviewMemoryRecordForStore(record);
    if (!validation.passed) {
      failureCodes.push(
        ...validation.failure_codes.map((failureCode) =>
          `record:${record.record_id}:${failureCode}`,
        ),
      );
    }
  }

  return { passed: failureCodes.length === 0, failure_codes: failureCodes.sort() };
}

export function createResearchCandidateReviewMemoryStoreFingerprint(
  snapshot: ResearchCandidateReviewMemoryStoreSnapshot,
): string {
  const { store_fingerprint: _fingerprint, ...hashInput } = snapshot;
  return createHash("sha256").update(canonicalJson(hashInput)).digest("hex");
}

export function createEmptyResearchCandidateReviewMemoryStoreSnapshot(
  input: ResearchCandidateReviewMemoryStoreInput,
): ResearchCandidateReviewMemoryStoreSnapshot {
  const baseSnapshot: ResearchCandidateReviewMemoryStoreSnapshot = {
    store_version: storeVersion,
    contract_version: contractVersion,
    scope: input.scope,
    status: storeStatus,
    as_of: input.as_of,
    records: input.records ?? [],
    record_order: [],
    record_count: 0,
    discarded_record_refs: [],
    superseded_record_refs: [],
    active_record_refs: [],
    boundary_notes: [
      "Product-write remains parked by #686.",
      "Review memory is not truth.",
      "Research Candidate Review Memory Store v0.1 is local-store-only.",
      "Writes require an explicit caller-provided file path.",
    ].sort(),
    authority_boundary: getResearchCandidateReviewMemoryStoreAuthorityBoundary(),
    store_fingerprint: "",
  };
  return rebuildSnapshot(baseSnapshot);
}

export function upsertResearchCandidateReviewMemoryRecord(
  snapshot: ResearchCandidateReviewMemoryStoreSnapshot,
  record: ResearchCandidateReviewMemoryRecord,
): ResearchCandidateReviewMemoryStoreSnapshot {
  assertValidation(validateResearchCandidateReviewMemoryStoreSnapshot(snapshot));
  assertValidation(validateResearchCandidateReviewMemoryRecordForStore(record));
  const existingRecord = snapshot.records.find((candidate) => candidate.record_id === record.record_id);
  if (existingRecord && canonicalJson(existingRecord) === canonicalJson(record)) {
    return cloneSnapshot(snapshot);
  }
  if (existingRecord && compareIsoTimestamp(record.updated_at, existingRecord.updated_at) < 0) {
    throw new Error(`older_record_update_rejected:${record.record_id}`);
  }
  const records = snapshot.records.filter((candidate) => candidate.record_id !== record.record_id);
  records.push(cloneRecord(record));
  const rebuiltSnapshot = rebuildSnapshot({ ...cloneSnapshot(snapshot), records });
  assertValidation(validateResearchCandidateReviewMemoryStoreSnapshot(rebuiltSnapshot));
  return rebuiltSnapshot;
}

export function discardResearchCandidateReviewMemoryRecord(
  snapshot: ResearchCandidateReviewMemoryStoreSnapshot,
  input: ResearchCandidateReviewMemoryDiscardInput,
): ResearchCandidateReviewMemoryStoreSnapshot {
  assertValidation(validateResearchCandidateReviewMemoryStoreSnapshot(snapshot));
  if (!input.discard_reason) throw new Error("discard_reason_required");
  const record = snapshot.records.find((candidate) => candidate.record_id === input.record_id);
  if (!record) throw new Error(`record_not_found:${input.record_id}`);
  const updatedRecord: ResearchCandidateReviewMemoryRecord = {
    ...cloneRecord(record),
    lifecycle_state: "discarded",
    review_decision: "discard",
    discard_reason: input.discard_reason,
    updated_at: input.updated_at,
    reason_codes: uniqueSorted([...record.reason_codes, "discard_is_not_deletion"]),
  };
  return upsertResearchCandidateReviewMemoryRecord(snapshot, updatedRecord);
}

export function supersedeResearchCandidateReviewMemoryRecord(
  snapshot: ResearchCandidateReviewMemoryStoreSnapshot,
  input: ResearchCandidateReviewMemorySupersedeInput,
): ResearchCandidateReviewMemoryStoreSnapshot {
  assertValidation(validateResearchCandidateReviewMemoryStoreSnapshot(snapshot));
  const existingRecord = snapshot.records.find((record) => record.record_id === input.record_id);
  if (!existingRecord) throw new Error(`record_not_found:${input.record_id}`);
  if (input.superseding_record.record_id === input.record_id) {
    throw new Error(`self_supersede_rejected:${input.record_id}`);
  }
  const supersedingRecord: ResearchCandidateReviewMemoryRecord = {
    ...cloneRecord(input.superseding_record),
    related_record_refs: uniqueSorted([
      ...(input.superseding_record.related_record_refs ?? []),
      existingRecord.record_id,
    ]),
  };
  assertValidation(validateResearchCandidateReviewMemoryRecordForStore(supersedingRecord));
  const updatedExistingRecord: ResearchCandidateReviewMemoryRecord = {
    ...cloneRecord(existingRecord),
    lifecycle_state: "superseded",
    review_decision: "supersede",
    supersedes_record_ref: supersedingRecord.record_id,
    related_record_refs: uniqueSorted([
      ...existingRecord.related_record_refs,
      supersedingRecord.record_id,
    ]),
    updated_at:
      supersedingRecord.updated_at >= existingRecord.updated_at
        ? supersedingRecord.updated_at
        : existingRecord.updated_at,
    reason_codes: uniqueSorted([...existingRecord.reason_codes, "supersede_preserves_lineage"]),
  };
  const records = snapshot.records.filter(
    (record) =>
      record.record_id !== existingRecord.record_id &&
      record.record_id !== supersedingRecord.record_id,
  );
  records.push(updatedExistingRecord, supersedingRecord);
  const rebuiltSnapshot = rebuildSnapshot({ ...cloneSnapshot(snapshot), records });
  assertValidation(validateResearchCandidateReviewMemoryStoreSnapshot(rebuiltSnapshot));
  return rebuiltSnapshot;
}

export function readResearchCandidateReviewMemoryStoreFile(
  filePath: string,
): ResearchCandidateReviewMemoryStoreSnapshot {
  const parsed = JSON.parse(readFileSync(filePath, "utf8"));
  const validation = validateResearchCandidateReviewMemoryStoreSnapshot(parsed);
  assertValidation(validation);
  return parsed;
}

export function writeResearchCandidateReviewMemoryStoreFile(
  filePath: string,
  snapshot: ResearchCandidateReviewMemoryStoreSnapshot,
): void {
  assertValidation(validateResearchCandidateReviewMemoryStoreSnapshot(snapshot));
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
}

function validatePrivacyReport(record: ResearchCandidateReviewMemoryRecord): string[] {
  const failureCodes: string[] = [];
  const report = record?.privacy_report;
  if (!report) return ["missing_privacy_report"];
  if (!privacyClassValues.includes(report.privacy_class)) {
    failureCodes.push("invalid_privacy_class");
  }
  if (typeof report.public_safe !== "boolean") failureCodes.push("invalid_privacy_public_safe");
  for (const field of [
    "raw_conversation_included",
    "hidden_reasoning_included",
    "raw_source_body_included",
    "raw_candidate_payload_included",
    "raw_provider_output_included",
    "provider_thread_run_session_ids_included",
    "private_urls_included",
    "local_private_paths_included",
    "secrets_included",
    "raw_db_rows_included",
    "raw_browser_dump_included",
  ] as const) {
    if (report[field] !== false) failureCodes.push(`privacy_${field}_not_false`);
  }
  if (!Array.isArray(report.blocked_reason_codes)) {
    failureCodes.push("invalid_blocked_reason_codes");
  }
  if (
    report.privacy_class === "blocked_raw_private_payload" &&
    (!Array.isArray(report.blocked_reason_codes) || report.blocked_reason_codes.length === 0)
  ) {
    failureCodes.push("blocked_payload_missing_blocked_reason_codes");
  }
  return failureCodes;
}

function validateRecordTimestamps(record: ResearchCandidateReviewMemoryRecord): string[] {
  const failureCodes: string[] = [];
  if (!record?.created_at) {
    failureCodes.push("missing_created_at");
  } else if (!isIsoUtcTimestamp(record.created_at)) {
    failureCodes.push("invalid_created_at");
  }
  if (!record?.updated_at) {
    failureCodes.push("missing_updated_at");
  } else if (!isIsoUtcTimestamp(record.updated_at)) {
    failureCodes.push("invalid_updated_at");
  }
  if (
    isIsoUtcTimestamp(record?.created_at) &&
    isIsoUtcTimestamp(record?.updated_at) &&
    compareIsoTimestamp(record.updated_at, record.created_at) < 0
  ) {
    failureCodes.push("updated_at_before_created_at");
  }
  return failureCodes;
}

function validateRecordAuthorityBoundary(
  boundary: ResearchCandidateReviewMemoryAuthorityBoundary,
): string[] {
  const failureCodes: string[] = [];
  if (boundary?.contract_only !== true) failureCodes.push("record_contract_only_not_true");
  for (const field of recordForbiddenAuthorityFields) {
    if (boundary?.[field] !== false) failureCodes.push(`record_authority_granted:${field}`);
  }
  return failureCodes;
}

function validateStoreAuthorityBoundary(
  boundary: ResearchCandidateReviewMemoryStoreAuthorityBoundary,
): string[] {
  const failureCodes: string[] = [];
  if (boundary?.local_store_only !== true) failureCodes.push("store_local_store_only_not_true");
  if (boundary?.explicit_file_write_only !== true) {
    failureCodes.push("store_explicit_file_write_only_not_true");
  }
  for (const field of storeForbiddenAuthorityFields) {
    if (boundary?.[field] !== false) failureCodes.push(`store_authority_granted:${field}`);
  }
  return failureCodes;
}

function validateLineageRefs(records: ResearchCandidateReviewMemoryRecord[]): string[] {
  const failureCodes: string[] = [];
  const recordIdSet = new Set(records.map((record) => record.record_id));
  for (const record of records) {
    for (const relatedRef of record.related_record_refs ?? []) {
      if (relatedRef === record.record_id) {
        failureCodes.push(`self_related_record_ref:${record.record_id}`);
      } else if (!recordIdSet.has(relatedRef)) {
        failureCodes.push(`dangling_related_record_ref:${record.record_id}:${relatedRef}`);
      }
    }
    if (record.supersedes_record_ref) {
      if (record.supersedes_record_ref === record.record_id) {
        failureCodes.push(`self_supersedes_record_ref:${record.record_id}`);
      } else if (!recordIdSet.has(record.supersedes_record_ref)) {
        failureCodes.push(
          `dangling_supersedes_record_ref:${record.record_id}:${record.supersedes_record_ref}`,
        );
      }
    }
  }
  return failureCodes;
}

function rebuildSnapshot(
  snapshot: ResearchCandidateReviewMemoryStoreSnapshot,
): ResearchCandidateReviewMemoryStoreSnapshot {
  const records = [...snapshot.records].map(cloneRecord).sort(compareRecords);
  const rebuilt: ResearchCandidateReviewMemoryStoreSnapshot = {
    ...cloneSnapshot(snapshot),
    records,
    record_order: records.map((record) => record.record_id),
    record_count: records.length,
    discarded_record_refs: refsForState(records, "discarded"),
    superseded_record_refs: refsForState(records, "superseded"),
    active_record_refs: refsForState(records, "active"),
    boundary_notes: uniqueSorted(snapshot.boundary_notes),
    authority_boundary: getResearchCandidateReviewMemoryStoreAuthorityBoundary(),
    store_fingerprint: "",
  };
  return {
    ...rebuilt,
    store_fingerprint: createResearchCandidateReviewMemoryStoreFingerprint(rebuilt),
  };
}

function refsForState(
  records: ResearchCandidateReviewMemoryRecord[],
  lifecycleState: ResearchCandidateReviewMemoryLifecycleState,
): string[] {
  return uniqueSorted(
    records
      .filter((record) => record.lifecycle_state === lifecycleState)
      .map((record) => record.record_id),
  );
}

function sourceRefHasForbiddenPrivatePattern(sourceRefValue: string): boolean {
  return forbiddenSourceRefPatterns.some((pattern) => pattern.test(sourceRefValue));
}

function isIsoUtcTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !isoUtcTimestampPattern.test(value)) return false;
  const parsedDate = new Date(value);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString() === value;
}

function compareIsoTimestamp(left: string, right: string): number {
  return left.localeCompare(right);
}

function assertValidation(result: ResearchCandidateReviewMemoryValidationResult): void {
  if (!result.passed) throw new Error(result.failure_codes.join(","));
}

function compareRecords(
  left: ResearchCandidateReviewMemoryRecord,
  right: ResearchCandidateReviewMemoryRecord,
): number {
  return left.record_id.localeCompare(right.record_id);
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values)).sort();
}

function cloneSnapshot(
  snapshot: ResearchCandidateReviewMemoryStoreSnapshot,
): ResearchCandidateReviewMemoryStoreSnapshot {
  return JSON.parse(JSON.stringify(snapshot));
}

function cloneRecord(record: ResearchCandidateReviewMemoryRecord): ResearchCandidateReviewMemoryRecord {
  return JSON.parse(JSON.stringify(record));
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
