import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_REVIEW_VERSION,
} from "@/types/handoff-packet-copy-export-contract-record-review";
import {
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE,
  type HandoffPacketCopyExportContractRecord,
} from "@/types/handoff-packet-copy-export-contract-write";
import {
  HANDOFF_PACKET_COPY_EXPORT_SCOPE,
  HANDOFF_PACKET_COPY_EXPORT_PREVIEW_VERSION,
  HANDOFF_PACKET_EXPORTED_ARTIFACT_VERSION,
  type HandoffPacketCopyExportAuthorityBoundary,
  type HandoffPacketCopyExportPreview,
  type HandoffPacketCopyExportPreviewInput,
  type HandoffPacketCopyExportPreviewStatus,
  type HandoffPacketCopyExportReadiness,
  type HandoffPacketExportedArtifact,
} from "@/types/handoff-packet-copy-export-preview";
import type {
  HandoffPacketCopyExportPacketFormat,
  HandoffPacketCopyExportTarget,
  HandoffPacketEntry,
  HandoffPacketManifest,
} from "@/types/handoff-packet-copy-export-contract-preview";

type RecordValue = Record<string, unknown>;

const packetFormats = [
  "operator_handoff_packet_markdown",
  "codex_handoff_packet_json",
  "conversation_handoff_capsule",
  "dual_markdown_and_json",
] as const satisfies readonly HandoffPacketCopyExportPacketFormat[];

const copyExportTargets = [
  "clipboard_candidate",
  "download_candidate",
  "local_file_candidate",
  "operator_copy_surface_candidate",
] as const satisfies readonly HandoffPacketCopyExportTarget[];

export function createHandoffPacketCopyExportPreviewAuthorityBoundaryV01():
  HandoffPacketCopyExportAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    copy_export_preview_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_handoff_packet_copy_export_record: false,
    can_create_handoff_packet_copy_export_receipt: false,
    can_create_handoff_packet_exported_artifact: false,
    can_persist_local_packet_artifact: false,
    can_copy_export_handoff_packet_to_local_artifact: false,
    can_write_handoff_packet_file: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_send_handoff: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context_update_live: false,
    can_write_selected_refs_to_live_handoff: false,
    can_write_handoff_packet_copy_export_contract_record: false,
    can_write_handoff_context_apply_record: false,
    can_write_applied_handoff_context_snapshot: false,
    can_write_handoff_context_update_contract_record: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_update_global_dogfood_metrics: false,
    can_write_dogfood_metrics: false,
    can_write_dogfood_metric_snapshot: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: [
      "Preview materializes packet payload candidates in memory only.",
      "It cannot write the DB, clipboard, files, downloads, send handoff, mutate handoff context, route, CWP, relay, memory, metrics, or external systems.",
    ],
  };
}

export function buildHandoffPacketCopyExportPreviewV01(
  input: HandoffPacketCopyExportPreviewInput = {},
): HandoffPacketCopyExportPreview {
  const asOf = input.as_of ?? new Date().toISOString();
  const requestedSourceRefs = uniqueCandidateIngressStringsV01(
    input.source_refs ?? [],
  );
  const sourceRefs = publicSafeRefs(requestedSourceRefs);
  const requestedOperatorRef = safeRef(input.requested_operator_ref);
  const requestedIdempotencyKey = safeRef(input.requested_idempotency_key);
  const reviewConfirmationRef = safeRef(input.review_confirmation_ref);
  const review = parseContractRecordReview(
    input.handoff_packet_copy_export_contract_record_review,
  );
  const directRecord = isContractRecord(
    input.handoff_packet_copy_export_contract_record,
  )
    ? input.handoff_packet_copy_export_contract_record
    : null;
  const selectedOrLatestRecord = selectRecord({ review, directRecord });
  const record = selectedOrLatestRecord.record;
  const appliedRead = parseAppliedHandoffRead(input.applied_handoff_context_read);
  const existingHandoffUnsafe = containsRawOrPrivateMarkers(
    input.existing_handoff_packet_or_capsule,
  );
  const reviewEvidenceSummary = getRecord(review, "evidence_summary");
  const evidenceRefs = publicSafeRefs([
    ...(record?.evidence_refs ?? []),
    ...safeStringArray(reviewEvidenceSummary?.evidence_refs),
  ]);
  const suppliedRefs = [
    ...requestedSourceRefs,
    ...evidenceRefs,
    input.requested_operator_ref,
    input.requested_idempotency_key,
    input.review_confirmation_ref,
  ];
  const unsafeRefs = suppliedRefs.filter(
    (ref): ref is string =>
      typeof ref === "string" && !isCandidateIngressPublicSafeRefV01(ref),
  );

  const packetFormat = parsePacketFormat(record?.requested_packet_format);
  const target = parseCopyExportTarget(record?.requested_copy_export_target);
  const manifest = isPacketManifest(record?.proposed_packet_manifest)
    ? record.proposed_packet_manifest
    : null;
  const entries = Array.isArray(record?.proposed_packet_entries)
    ? record.proposed_packet_entries.filter(isPacketEntry)
    : [];
  const artifact =
    record && packetFormat && target && manifest && entries.length
      ? buildArtifact({ record, packetFormat, target, manifest, entries, asOf })
      : null;

  const blockers = uniqueCandidateIngressStringsV01([
    ...(input.handoff_packet_copy_export_contract_record_review !== undefined &&
    input.handoff_packet_copy_export_contract_record_review !== null &&
    !review
      ? ["handoff_packet_copy_export_contract_record_review_malformed"]
      : []),
    ...(review?.review_status === "records_invalid"
      ? ["handoff_packet_copy_export_contract_record_review_invalid"]
      : []),
    ...(review?.review_status === "schema_missing"
      ? ["handoff_packet_copy_export_contract_record_review_schema_missing"]
      : []),
    ...(review?.review_status === "selected_record_missing"
      ? ["handoff_packet_copy_export_contract_record_review_selected_record_missing"]
      : []),
    ...(reviewEvidenceSummary?.has_receipt_side_effect_problem === true
      ? ["handoff_packet_copy_export_contract_record_review_receipt_side_effect_invalid"]
      : []),
    ...(record && !isContractAuthorityProfileSafe(record.authority_profile)
      ? ["handoff_packet_copy_export_contract_record_authority_profile_invalid"]
      : []),
    ...(record && !isContractNoCopyExportOrSendSafe(
      record.no_copy_export_or_send_performed,
    )
      ? ["handoff_packet_copy_export_contract_record_no_copy_export_or_send_invalid"]
      : []),
    ...(record && !isContractWriteAuthoritySafe(record.authority_boundary)
      ? ["handoff_packet_copy_export_contract_record_authority_boundary_invalid"]
      : []),
    ...(record && !manifest ? ["handoff_packet_manifest_malformed"] : []),
    ...(record && !entries.length ? ["handoff_packet_entries_malformed"] : []),
    ...(record && !packetFormat ? ["requested_packet_format_unsupported"] : []),
    ...(record && !target ? ["requested_copy_export_target_unsupported"] : []),
    ...(appliedRead && !appliedReadMatchesRecord(appliedRead, record)
      ? ["applied_handoff_context_read_snapshot_mismatch"]
      : []),
    ...(artifact && !hasReadOnlyArtifactAuthority(artifact.authority_boundary)
      ? ["exported_packet_artifact_authority_boundary_invalid"]
      : []),
  ]);

  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(sourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
    ...(!requestedOperatorRef ? ["requested_operator_ref_missing"] : []),
    ...(!requestedIdempotencyKey ? ["requested_idempotency_key_missing"] : []),
    ...(!reviewConfirmationRef ? ["review_confirmation_ref_missing"] : []),
  ]);

  const refusals = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length ? ["unsafe_refs_refused"] : []),
    ...(existingHandoffUnsafe
      ? ["raw_or_private_existing_handoff_packet_or_capsule_refused"]
      : []),
    ...(record && containsRawOrPrivateMarkers(record)
      ? ["raw_or_private_contract_record_material_refused"]
      : []),
  ]);

  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!review && !directRecord
      ? ["handoff_packet_copy_export_contract_record_review_missing"]
      : []),
    ...(!record ? ["handoff_packet_copy_export_contract_record_missing"] : []),
    ...(record && !artifact ? ["exported_packet_artifact_missing"] : []),
  ]);

  const ready =
    Boolean(record) &&
    Boolean(artifact) &&
    Boolean(requestedOperatorRef) &&
    Boolean(requestedIdempotencyKey) &&
    Boolean(reviewConfirmationRef) &&
    blockers.length === 0 &&
    missingEvidence.length === 0 &&
    refusals.length === 0 &&
    insufficientData.length === 0;
  const status = determineStatus({
    record,
    ready,
    blockers,
    missingEvidence,
    refusals,
    insufficientData,
  });

  return {
    preview_version: HANDOFF_PACKET_COPY_EXPORT_PREVIEW_VERSION,
    scope: HANDOFF_PACKET_COPY_EXPORT_SCOPE,
    as_of: asOf,
    source_refs: sourceRefs,
    copy_export_preview_status: status,
    recommended_next_action: ready
      ? "write_handoff_packet_copy_export_record"
      : blockers.length || refusals.length
        ? "resolve_handoff_packet_copy_export_blockers"
        : record
          ? "review_handoff_packet_copy_export_preview"
          : "supply_handoff_packet_copy_export_contract_record",
    input_summary: {
      has_contract_record_review: Boolean(review),
      has_direct_contract_record: Boolean(directRecord),
      has_applied_handoff_context_read: Boolean(appliedRead),
      requested_packet_format: record?.requested_packet_format ?? null,
      requested_copy_export_target: record?.requested_copy_export_target ?? null,
      proposed_packet_entry_count: entries.length,
      proposed_packet_section_count: Object.keys(
        record?.proposed_packet_section_counts ?? {},
      ).length,
      blocker_count: blockers.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusals.length,
      insufficient_data_reason_count: insufficientData.length,
      review_confirmation_supplied: Boolean(reviewConfirmationRef),
      requested_idempotency_key_supplied: Boolean(requestedIdempotencyKey),
      requested_operator_ref_supplied: Boolean(requestedOperatorRef),
    },
    source_status: {
      handoff_packet_copy_export_contract_record_review: review
        ? review.review_status === "records_invalid"
          ? "invalid"
          : "supplied"
        : input.handoff_packet_copy_export_contract_record_review === undefined ||
            input.handoff_packet_copy_export_contract_record_review === null
          ? "missing"
          : "malformed",
      selected_contract_record: record ? "found" : "missing",
      applied_handoff_context_read: appliedRead
        ? appliedReadMatchesRecord(appliedRead, record)
          ? "supplied"
          : "invalid"
        : input.applied_handoff_context_read === undefined ||
            input.applied_handoff_context_read === null
          ? "missing"
          : "malformed",
      existing_handoff_material: existingHandoffUnsafe
        ? "unsafe"
        : input.existing_handoff_packet_or_capsule
          ? "supplied"
          : "missing",
    },
    copy_export_readiness: createReadiness({
      ready,
      blockers,
      missingEvidence,
      refusals,
      insufficientData,
    }),
    approval_requirements: [
      "confirm_approved_copy_export_contract_record_is_source",
      "confirm_scoped_local_packet_artifact_store_is_the_only_write_target",
      "confirm_no_clipboard_download_file_or_handoff_send_by_this_slice",
    ],
    blocking_reasons: blockers,
    missing_evidence: missingEvidence,
    refusal_reasons: refusals,
    evidence_summary: {
      has_contract_record_review: Boolean(review),
      has_contract_record: Boolean(record),
      has_packet_manifest: Boolean(manifest),
      has_packet_entries: entries.length > 0,
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_missing_evidence: missingEvidence.length > 0,
      has_receipt_side_effect_problem:
        reviewEvidenceSummary?.has_receipt_side_effect_problem === true,
      no_clipboard_write_confirmed: true,
      no_file_download_confirmed: true,
      no_handoff_send_confirmed: true,
      source_refs: uniqueCandidateIngressStringsV01([
        ...sourceRefs,
        ...(record?.source_refs ?? []),
      ]),
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      problem_record_ids: safeStringArray(reviewEvidenceSummary?.problem_record_ids),
    },
    source_contract_summary: {
      source_copy_export_contract_record_ref: record?.record_id ?? null,
      source_applied_handoff_context_snapshot_ref:
        record?.source_applied_handoff_context_snapshot_ref ?? null,
      requested_packet_format: record?.requested_packet_format ?? null,
      requested_copy_export_target: record?.requested_copy_export_target ?? null,
      proposed_packet_entry_count: entries.length,
      proposed_packet_section_counts: record?.proposed_packet_section_counts ?? {},
    },
    proposed_exported_packet_artifact_summary: {
      artifact_ref: artifact?.artifact_ref ?? null,
      packet_format: artifact?.packet_format ?? null,
      copy_export_target: artifact?.copy_export_target ?? null,
      packet_entry_count: artifact?.packet_entry_count ?? 0,
      packet_section_counts: artifact?.packet_section_counts ?? {},
      has_markdown_payload: Boolean(artifact?.markdown_payload),
      has_json_payload: Boolean(artifact?.json_payload),
      has_capsule_payload: Boolean(artifact?.capsule_payload),
      payload_hash: artifact?.payload_hash ?? null,
    },
    proposed_exported_packet_artifact: artifact,
    proposed_packet_rendering_summary: {
      markdown_payload_present: Boolean(artifact?.markdown_payload),
      json_payload_present: Boolean(artifact?.json_payload),
      capsule_payload_present: Boolean(artifact?.capsule_payload),
      payload_hash: artifact?.payload_hash ?? null,
      clipboard_write_not_performed: true,
      download_not_performed: true,
      file_write_not_performed: true,
      handoff_send_not_performed: true,
    },
    proposed_packet_artifact_plan: {
      plan_version: "handoff_packet_copy_export_artifact_plan.v0.1",
      source_contract_record_ref: record?.record_id ?? null,
      packet_format: packetFormat,
      copy_export_target: target,
      packet_entry_count: entries.length,
      packet_section_counts: record?.proposed_packet_section_counts ?? {},
      local_artifact_persistence_required: true,
      clipboard_write_not_performed: true,
      file_write_not_performed: true,
      download_not_performed: true,
      handoff_send_not_performed: true,
    },
    would_write_handoff_packet_copy_export_record_preview: {
      record_version: "handoff_packet_copy_export_record.v0.1",
      scope: HANDOFF_PACKET_COPY_EXPORT_SCOPE,
      requested_operator_ref: input.requested_operator_ref ?? null,
      requested_idempotency_key: input.requested_idempotency_key ?? null,
      review_confirmation_ref: input.review_confirmation_ref ?? null,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      source_copy_export_contract_record_ref: record?.record_id ?? null,
      source_applied_handoff_context_snapshot_ref:
        record?.source_applied_handoff_context_snapshot_ref ?? null,
      requested_packet_format: packetFormat,
      requested_copy_export_target: target,
      proposed_exported_packet_artifact: artifact,
      packet_entry_count: artifact?.packet_entry_count ?? 0,
      packet_section_counts: artifact?.packet_section_counts ?? {},
      artifact_hash: artifact?.payload_hash ?? null,
      no_actual_external_copy_export_performed: true,
    },
    operator_review_checklist: [
      "confirm_packet_payload_is_bounded_and_public_safe",
      "confirm_exported_artifact_is_scoped_local_store_material_only",
      "confirm_no_clipboard_download_file_write_or_handoff_send",
    ],
    would_not_write: [
      "does_not_write_clipboard_download_or_arbitrary_file",
      "does_not_send_handoff",
      "does_not_mutate_live_handoff_context_or_selected_refs",
      "does_not_mutate_route_cwp_relay_memory_metrics_or_external_systems",
    ],
    non_goals: [
      "no_os_clipboard_write",
      "no_browser_download_creation",
      "no_arbitrary_packet_file_write",
      "no_handoff_send",
    ],
    authority_boundary: createHandoffPacketCopyExportPreviewAuthorityBoundaryV01(),
  };
}

export function calculateHandoffPacketExportedArtifactPayloadHashV01(
  artifact: Pick<
    HandoffPacketExportedArtifact,
    "markdown_payload" | "json_payload" | "capsule_payload" | "packet_format"
  >,
): string {
  return fingerprint({
    packet_format: artifact.packet_format,
    markdown_payload: artifact.markdown_payload,
    json_payload: artifact.json_payload,
    capsule_payload: artifact.capsule_payload,
  });
}

function buildArtifact({
  record,
  packetFormat,
  target,
  manifest,
  entries,
  asOf,
}: {
  record: HandoffPacketCopyExportContractRecord;
  packetFormat: HandoffPacketCopyExportPacketFormat;
  target: HandoffPacketCopyExportTarget;
  manifest: HandoffPacketManifest;
  entries: HandoffPacketEntry[];
  asOf: string;
}): HandoffPacketExportedArtifact {
  const artifactRef = `handoff-packet-exported-artifact:${fingerprint({
    record: record.record_id,
    manifest: manifest.packet_ref,
    packetFormat,
    target,
  }).slice(0, 24)}`;
  const markdownPayload =
    packetFormat === "operator_handoff_packet_markdown" ||
    packetFormat === "dual_markdown_and_json"
      ? renderMarkdownPayload({ record, manifest, entries, artifactRef })
      : null;
  const jsonPayload =
    packetFormat === "codex_handoff_packet_json" ||
    packetFormat === "dual_markdown_and_json"
      ? renderJsonPayload({ record, manifest, entries, artifactRef })
      : null;
  const capsulePayload =
    packetFormat === "conversation_handoff_capsule"
      ? renderCapsulePayload({ record, manifest, entries, artifactRef })
      : null;
  const payloadHash = calculateHandoffPacketExportedArtifactPayloadHashV01({
    packet_format: packetFormat,
    markdown_payload: markdownPayload,
    json_payload: jsonPayload,
    capsule_payload: capsulePayload,
  });
  return {
    artifact_version: HANDOFF_PACKET_EXPORTED_ARTIFACT_VERSION,
    artifact_ref: artifactRef,
    scope: HANDOFF_PACKET_COPY_EXPORT_SCOPE,
    as_of: asOf,
    packet_family: "augnes_operator_handoff_packet",
    packet_format: packetFormat,
    copy_export_target: target,
    source_copy_export_contract_record_ref: record.record_id,
    source_applied_handoff_context_snapshot_ref:
      record.source_applied_handoff_context_snapshot_ref,
    source_handoff_context_apply_record_ref:
      record.source_handoff_context_apply_record_ref,
    source_handoff_context_update_contract_record_ref:
      record.source_handoff_context_update_contract_record_ref,
    source_route_integration_read_ref: record.source_route_integration_read_ref,
    source_runtime_current_working_perspective_ref:
      record.source_runtime_current_working_perspective_ref,
    source_applied_cwp_snapshot_ref: record.source_applied_cwp_snapshot_ref,
    packet_manifest: manifest,
    packet_entries: entries,
    packet_entry_count: entries.length,
    packet_section_counts: countBy(entries.map((entry) => entry.packet_section)),
    markdown_payload: markdownPayload,
    json_payload: jsonPayload,
    capsule_payload: capsulePayload,
    payload_hash: payloadHash,
    public_safety_summary: {
      public_safe: true,
      raw_private_material_excluded: true,
      raw_text_excluded: true,
      raw_report_excluded: true,
      raw_excerpt_excluded: true,
    },
    source_refs: record.source_refs,
    evidence_refs: record.evidence_refs,
    artifact_metadata: {
      local_artifact_only: true,
      clipboard_write_not_performed: true,
      file_write_not_performed: true,
      download_not_performed: true,
      handoff_send_not_performed: true,
      future_user_surface_copy_export_required: true,
      future_handoff_send_contract_required: true,
    },
    authority_boundary: createHandoffPacketCopyExportPreviewAuthorityBoundaryV01(),
  };
}

function renderMarkdownPayload({
  record,
  manifest,
  entries,
  artifactRef,
}: {
  record: HandoffPacketCopyExportContractRecord;
  manifest: HandoffPacketManifest;
  entries: HandoffPacketEntry[];
  artifactRef: string;
}): string {
  const lines = [
    `# ${manifest.packet_title}`,
    "",
    `Artifact: ${artifactRef}`,
    `Source contract: ${record.record_id}`,
    `Source applied snapshot: ${record.source_applied_handoff_context_snapshot_ref}`,
    "",
  ];
  for (const [section, sectionEntries] of Object.entries(groupEntries(entries))) {
    lines.push(`## ${section}`);
    for (const entry of sectionEntries) {
      lines.push(`- ${entry.summary}`);
    }
    lines.push("");
  }
  lines.push(
    "Local artifact only. Clipboard write, browser download, packet file write, external export, and handoff send were not performed.",
  );
  return lines.join("\n");
}

function renderJsonPayload({
  record,
  manifest,
  entries,
  artifactRef,
}: {
  record: HandoffPacketCopyExportContractRecord;
  manifest: HandoffPacketManifest;
  entries: HandoffPacketEntry[];
  artifactRef: string;
}): Record<string, unknown> {
  return {
    packet_version: "codex_handoff_packet_json.v0.1",
    artifact_ref: artifactRef,
    source_copy_export_contract_record_ref: record.record_id,
    source_applied_handoff_context_snapshot_ref:
      record.source_applied_handoff_context_snapshot_ref,
    manifest,
    entries,
    metadata: {
      local_artifact_only: true,
      clipboard_write_not_performed: true,
      download_not_performed: true,
      file_write_not_performed: true,
      handoff_send_not_performed: true,
    },
  };
}

function renderCapsulePayload({
  record,
  manifest,
  entries,
  artifactRef,
}: {
  record: HandoffPacketCopyExportContractRecord;
  manifest: HandoffPacketManifest;
  entries: HandoffPacketEntry[];
  artifactRef: string;
}): Record<string, unknown> {
  return {
    capsule_version: "conversation_handoff_capsule.v0.1",
    artifact_ref: artifactRef,
    source_copy_export_contract_record_ref: record.record_id,
    title: manifest.packet_title,
    sections: groupEntries(entries),
    source_refs: record.source_refs,
    evidence_refs: record.evidence_refs,
    local_artifact_only: true,
    handoff_send_not_performed: true,
  };
}

function groupEntries(entries: HandoffPacketEntry[]): Record<string, HandoffPacketEntry[]> {
  return entries.reduce<Record<string, HandoffPacketEntry[]>>((acc, entry) => {
    acc[entry.packet_section] = [...(acc[entry.packet_section] ?? []), entry];
    return acc;
  }, {});
}

function selectRecord({
  review,
  directRecord,
}: {
  review: RecordValue | null;
  directRecord: HandoffPacketCopyExportContractRecord | null;
}): { record: HandoffPacketCopyExportContractRecord | null } {
  if (directRecord) return { record: directRecord };
  const records = Array.isArray(review?.records)
    ? review.records.filter(isContractRecord)
    : [];
  const selectedId = getRecord(review, "input_summary")?.selected_record_id;
  if (typeof selectedId === "string" && selectedId) {
    return {
      record: records.find((record) => record.record_id === selectedId) ?? null,
    };
  }
  const latest =
    records.slice().sort((a, b) =>
      `${b.created_at}:${b.record_id}`.localeCompare(`${a.created_at}:${a.record_id}`),
    )[0] ?? null;
  return { record: latest };
}

function parseContractRecordReview(value: unknown): RecordValue | null {
  if (!isRecord(value)) return null;
  return value.review_version === HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_REVIEW_VERSION &&
    value.scope === HANDOFF_PACKET_COPY_EXPORT_SCOPE
    ? value
    : null;
}

function parseAppliedHandoffRead(value: unknown): RecordValue | null {
  if (!isRecord(value)) return null;
  return value.read_version === "applied_handoff_context_read.v0.1" &&
    value.scope === HANDOFF_PACKET_COPY_EXPORT_SCOPE
    ? value
    : null;
}

function appliedReadMatchesRecord(
  read: RecordValue | null,
  record: HandoffPacketCopyExportContractRecord | null,
): boolean {
  if (!read || !record) return true;
  const summaryRef = getRecord(read, "summary")?.applied_handoff_context_snapshot_ref;
  const latestRef = getRecord(read, "latest_applied_snapshot")
    ?.applied_handoff_context_snapshot_ref;
  const suppliedRef =
    typeof latestRef === "string"
      ? latestRef
      : typeof summaryRef === "string"
        ? summaryRef
        : null;
  return !suppliedRef || suppliedRef === record.source_applied_handoff_context_snapshot_ref;
}

function isContractRecord(
  value: unknown,
): value is HandoffPacketCopyExportContractRecord {
  return Boolean(
    isRecord(value) &&
      value.record_version === HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_VERSION &&
      value.scope === HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE &&
      typeof value.record_id === "string" &&
      typeof value.created_at === "string" &&
      typeof value.source_applied_handoff_context_snapshot_ref === "string" &&
      Array.isArray(value.source_refs) &&
      Array.isArray(value.evidence_refs) &&
      isPacketManifest(value.proposed_packet_manifest) &&
      Array.isArray(value.proposed_packet_entries) &&
      value.proposed_packet_entries.every(isPacketEntry),
  );
}

function isPacketManifest(value: unknown): value is HandoffPacketManifest {
  return Boolean(
    isRecord(value) &&
      value.manifest_version === "handoff_packet_manifest.v0.1" &&
      typeof value.packet_ref === "string" &&
      typeof value.packet_format === "string" &&
      typeof value.packet_target === "string" &&
      typeof value.entry_count === "number" &&
      value.public_safe === true &&
      value.raw_private_material_excluded === true &&
      value.copy_export_not_performed === true &&
      value.send_not_performed === true,
  );
}

function isPacketEntry(value: unknown): value is HandoffPacketEntry {
  return Boolean(
    isRecord(value) &&
      typeof value.packet_entry_ref === "string" &&
      typeof value.packet_section === "string" &&
      typeof value.entry_kind === "string" &&
      typeof value.summary === "string" &&
      Array.isArray(value.source_refs) &&
      Array.isArray(value.evidence_refs) &&
      value.public_safe === true &&
      value.raw_private_material_excluded === true &&
      value.authority_required === "future_handoff_packet_copy_export",
  );
}

function parsePacketFormat(value: unknown): HandoffPacketCopyExportPacketFormat | null {
  return typeof value === "string" &&
    packetFormats.includes(value as HandoffPacketCopyExportPacketFormat)
    ? (value as HandoffPacketCopyExportPacketFormat)
    : null;
}

function parseCopyExportTarget(value: unknown): HandoffPacketCopyExportTarget | null {
  return typeof value === "string" &&
    copyExportTargets.includes(value as HandoffPacketCopyExportTarget)
    ? (value as HandoffPacketCopyExportTarget)
    : null;
}

function createReadiness({
  ready,
  blockers,
  missingEvidence,
  refusals,
  insufficientData,
}: {
  ready: boolean;
  blockers: string[];
  missingEvidence: string[];
  refusals: string[];
  insufficientData: string[];
}): HandoffPacketCopyExportReadiness {
  return {
    write_ready: ready,
    readiness_label: ready ? "write_ready" : "not_write_ready",
    requires_contract_record: true,
    requires_review_confirmation: true,
    requires_idempotency_key: true,
    requires_operator_ref: true,
    requires_source_refs: true,
    requires_evidence_refs: true,
    requires_no_blockers: true,
    current_blockers: blockers,
    current_missing_evidence: missingEvidence,
    current_refusal_reasons: refusals,
    current_insufficient_data: insufficientData,
  };
}

function determineStatus({
  record,
  ready,
  blockers,
  missingEvidence,
  refusals,
  insufficientData,
}: {
  record: HandoffPacketCopyExportContractRecord | null;
  ready: boolean;
  blockers: string[];
  missingEvidence: string[];
  refusals: string[];
  insufficientData: string[];
}): HandoffPacketCopyExportPreviewStatus {
  if (ready) return "ready_for_future_handoff_packet_copy_export_record_write";
  if (!record) return "no_handoff_packet_copy_export_contract_record";
  if (blockers.length || refusals.length) return "blocked";
  if (missingEvidence.length) return "needs_more_evidence";
  if (insufficientData.length) return "insufficient_data";
  return "ready_for_operator_review";
}

function isContractAuthorityProfileSafe(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return fieldsTrue(value, contractAuthorityProfileRequiredTrueFields) &&
    fieldsFalse(value, contractAuthorityProfileRequiredFalseFields) &&
    fieldsNotTrue(value, contractAuthorityProfileForbiddenTrueFields);
}

function isContractNoCopyExportOrSendSafe(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return forbiddenNoSideEffectFields.every((field) => value[field] === false);
}

function isContractWriteAuthoritySafe(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return fieldsTrue(value, contractRecordAuthorityRequiredTrueFields) &&
    fieldsFalse(value, contractRecordAuthorityRequiredFalseFields) &&
    fieldsNotTrue(value, contractRecordAuthorityForbiddenTrueFields);
}

function hasReadOnlyArtifactAuthority(authority: unknown): boolean {
  if (!isRecord(authority)) return false;
  return (
    authority.read_only === true &&
    authority.source_of_truth === false &&
    authority.can_write_db === false &&
    authority.can_write_clipboard === false &&
    authority.can_download_file === false &&
    authority.can_write_handoff_packet_file === false &&
    authority.can_send_handoff === false &&
    authority.can_mutate_handoff_context === false &&
    authority.can_write_selected_refs_to_live_handoff === false &&
    authority.can_write_memory === false &&
    authority.can_write_dogfood_metrics === false &&
    authority.can_call_provider_openai === false &&
    authority.can_call_github === false
  );
}

function fieldsTrue(value: RecordValue, fields: readonly string[]): boolean {
  return fields.every((field) => value[field] === true);
}

function fieldsFalse(value: RecordValue, fields: readonly string[]): boolean {
  return fields.every((field) => value[field] === false);
}

function fieldsNotTrue(value: RecordValue, fields: readonly string[]): boolean {
  return fields.every((field) => value[field] !== true);
}

const contractAuthorityProfileRequiredTrueFields = [
  "durable_local_handoff_packet_copy_export_contract",
  "local_project_handoff_packet_copy_export_contract_only",
  "handoff_packet_copy_export_contract_written",
] as const;

const contractAuthorityProfileRequiredFalseFields = [
  "source_of_truth",
  "handoff_packet_copied",
  "handoff_packet_exported",
  "handoff_packet_file_written",
  "clipboard_written",
  "handoff_sent",
  "live_handoff_context_mutated",
  "selected_refs_written_to_live_handoff",
  "handoff_context_apply_record_written",
  "applied_handoff_context_snapshot_written",
  "handoff_context_update_contract_record_written",
  "api_perspective_current_route_modified",
  "upstream_current_working_perspective_source_tables_mutated",
  "perspective_unit_write_performed",
  "next_work_bias_write_performed",
  "continuity_relay_write_performed",
  "continuity_relay_update_performed",
  "memory_promotion_performed",
  "metric_update_performed",
] as const;

const contractAuthorityProfileForbiddenTrueFields = [
  "current_working_perspective_route_response_replaced",
  "upstream_current_working_perspective_source_tables_updated",
  "current_working_perspective_apply_record_written",
  "current_working_perspective_update_contract_record_written",
  "route_integration_contract_record_written",
  "provider_called",
  "github_called",
  "codex_executed",
  "pr_created",
  "pr_merged",
  "autonomous_action_run",
  "graph_or_vector_store_created",
  "rag_stack_created",
  "browser_observed",
  "crawler_or_browser_observer_created",
  "workbench_action_button_rendered",
] as const;

const contractRecordAuthorityRequiredTrueFields = [
  "durable_local_handoff_packet_copy_export_contract",
  "local_project_handoff_packet_copy_export_contract_only",
  "can_write_db",
  "can_create_handoff_packet_copy_export_contract_record",
  "can_create_handoff_packet_copy_export_contract_receipt",
] as const;

const contractRecordAuthorityRequiredFalseFields = [
  "source_of_truth",
  "can_copy_export_handoff_packet",
  "can_write_handoff_packet_file",
  "can_write_clipboard",
  "can_download_file",
  "can_send_handoff",
  "can_mutate_handoff_context",
  "can_apply_handoff_context_update_live",
  "can_write_selected_refs_to_live_handoff",
  "can_write_handoff_context_apply_record",
  "can_write_applied_handoff_context_snapshot",
  "can_write_handoff_context_update_contract_record",
  "can_modify_api_perspective_current_route",
  "can_replace_current_working_perspective_route_response",
  "can_update_upstream_current_working_perspective_source_tables",
  "can_write_applied_current_working_perspective_snapshot",
  "can_write_current_working_perspective_apply_record",
  "can_write_current_working_perspective_update_contract_record",
  "can_write_route_integration_contract_record",
  "can_write_perspective_unit",
  "can_write_next_work_bias",
  "can_write_continuity_relay",
  "can_update_continuity_relay",
  "can_apply_live_relay_state",
  "can_write_memory",
  "can_mutate_memory",
  "can_promote_memory",
  "can_update_global_dogfood_metrics",
  "can_write_dogfood_metrics",
  "can_write_dogfood_metric_snapshot",
  "can_write_reuse_outcome_ledger",
  "can_write_expected_observed_delta",
  "can_write_work_episode",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
  "can_render_workbench_action_button",
] as const;

const contractRecordAuthorityForbiddenTrueFields = [
  "can_write_arbitrary_file",
  "can_copy_export_handoff_packet_to_local_artifact",
  "can_create_handoff_packet_exported_artifact",
  "can_persist_local_packet_artifact",
  "can_materialize_handoff_packet_to_local_artifact",
] as const;

const forbiddenNoSideEffectFields = [
  "handoff_packet_copied",
  "handoff_packet_exported",
  "handoff_packet_file_written",
  "clipboard_written",
  "file_download_created",
  "handoff_sent",
  "live_handoff_context_updated",
  "live_handoff_context_mutated",
  "handoff_context_applied_live",
  "handoff_context_mutated",
  "selected_refs_written_to_live_handoff",
  "handoff_context_apply_record_written",
  "applied_handoff_context_snapshot_written",
  "handoff_context_update_contract_record_written",
  "api_perspective_current_route_modified",
  "current_working_perspective_route_response_replaced",
  "upstream_current_working_perspective_source_tables_updated",
  "upstream_current_working_perspective_source_tables_mutated",
  "applied_current_working_perspective_snapshot_written",
  "current_working_perspective_apply_record_written",
  "current_working_perspective_update_contract_record_written",
  "route_integration_contract_record_written",
  "perspective_unit_written",
  "next_work_bias_written",
  "continuity_relay_written",
  "continuity_relay_updated",
  "live_relay_state_applied",
  "memory_written",
  "memory_promoted",
  "memory_mutated",
  "dogfood_metrics_written",
  "dogfood_metrics_global_state_updated",
  "dogfood_metric_snapshot_written",
  "reuse_outcome_ledger_written",
  "expected_observed_delta_written",
  "work_episode_written",
  "provider_called",
  "github_called",
  "codex_executed",
  "pr_created",
  "pr_merged",
  "autonomous_action_run",
  "graph_or_vector_store_created",
  "rag_stack_created",
  "browser_observed",
  "crawler_or_browser_observer_created",
  "workbench_action_button_rendered",
] as const;

function publicSafeRefs(values: unknown[]): string[] {
  return uniqueCandidateIngressStringsV01(values).filter(
    isCandidateIngressPublicSafeRefV01,
  );
}

function safeRef(value: unknown): value is string {
  return isCandidateIngressPublicSafeRefV01(value);
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function containsRawOrPrivateMarkers(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    return containsCandidateIngressUnsafeMarkerV01(value);
  }
  if (Array.isArray(value)) return value.some(containsRawOrPrivateMarkers);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, entry]) =>
      ["raw_text", "raw_report", "raw_excerpt"].includes(key) ||
      containsRawOrPrivateMarkers(entry),
  );
}

function countBy(values: unknown[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    if (typeof value !== "string" || !value) return acc;
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function getRecord(value: unknown, key: string): RecordValue | null {
  if (!isRecord(value)) return null;
  return isRecord(value[key]) ? value[key] : null;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
