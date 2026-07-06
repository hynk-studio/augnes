import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_PREVIEW_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_SCOPE,
  type HandoffPacketCopyExportContractAuthorityBoundary,
  type HandoffPacketCopyExportContractMaterial,
  type HandoffPacketCopyExportContractPreview,
  type HandoffPacketCopyExportContractPreviewInput,
  type HandoffPacketCopyExportContractPreviewStatus,
  type HandoffPacketCopyExportContractReadiness,
  type HandoffPacketCopyExportPacketFormat,
  type HandoffPacketCopyExportPlan,
  type HandoffPacketCopyExportTarget,
  type HandoffPacketEntry,
  type HandoffPacketManifest,
  type HandoffPacketSection,
} from "@/types/handoff-packet-copy-export-contract-preview";
import {
  APPLIED_HANDOFF_CONTEXT_SNAPSHOT_VERSION,
  HANDOFF_CONTEXT_APPLY_RECORD_VERSION,
  HANDOFF_CONTEXT_APPLY_WRITE_SCOPE,
  type AppliedHandoffContextSnapshot,
  type HandoffContextApplyRecord,
} from "@/types/handoff-context-apply-write";
import { HANDOFF_CONTEXT_APPLY_RECORD_REVIEW_VERSION } from "@/types/handoff-context-apply-record-review";

type RecordValue = Record<string, unknown>;

const packetFormats: HandoffPacketCopyExportPacketFormat[] = [
  "operator_handoff_packet_markdown",
  "codex_handoff_packet_json",
  "conversation_handoff_capsule",
  "dual_markdown_and_json",
];

const copyExportTargets: HandoffPacketCopyExportTarget[] = [
  "clipboard_candidate",
  "download_candidate",
  "local_file_candidate",
  "operator_copy_surface_candidate",
];

const appliedReadVersion = "applied_handoff_context_read.v0.1" as const;

const sectionMap: Record<string, HandoffPacketSection> = {
  current_frame_section: "current_frame_section",
  current_thesis_section: "current_thesis_section",
  active_goals_section: "active_goals_section",
  next_candidates_section: "next_candidates_section",
  open_questions_section: "open_questions_section",
  active_risks_section: "active_risks_section",
  continuity_relay_section: "continuity_relay_section",
  perspective_units_section: "perspective_units_section",
  next_work_bias_section: "next_work_bias_section",
  route_integration_metadata_section: "route_integration_metadata_section",
  operator_review_required_section: "operator_review_required_section",
  blocked_or_missing_context_section: "blocked_or_missing_context_section",
};

export function createHandoffPacketCopyExportContractPreviewAuthorityBoundaryV01():
  HandoffPacketCopyExportContractAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    contract_material_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_handoff_packet_copy_export_contract_record: false,
    can_copy_export_handoff_packet: false,
    can_write_handoff_packet_file: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_send_handoff: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context_update_live: false,
    can_write_selected_refs_to_live_handoff: false,
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
      "Preview creates contract material only for a future handoff packet copy/export slice.",
      "It cannot copy, export, download, write files, write clipboard, send handoff, mutate live handoff context, memory, metrics, routes, relay, or external systems.",
    ],
  };
}

export function buildHandoffPacketCopyExportContractPreviewV01(
  input: HandoffPacketCopyExportContractPreviewInput = {},
): HandoffPacketCopyExportContractPreview {
  const asOf = input.as_of ?? new Date().toISOString();
  const requestedSourceRefs = uniqueCandidateIngressStringsV01(
    input.source_refs ?? [],
  );
  const sourceRefs = publicSafeRefs(requestedSourceRefs);
  const requestedOperatorRef = safeRef(input.requested_operator_ref);
  const requestedIdempotencyKey = safeRef(input.requested_idempotency_key);
  const reviewConfirmationRef = safeRef(input.review_confirmation_ref);
  const packetFormat = parsePacketFormat(input.requested_packet_format);
  const target = parseCopyExportTarget(input.requested_copy_export_target);
  const appliedRead = parseAppliedHandoffRead(input.applied_handoff_context_read);
  const directSnapshot = isAppliedSnapshot(input.applied_handoff_context_snapshot)
    ? input.applied_handoff_context_snapshot
    : null;
  const directRecord = isApplyRecord(input.handoff_context_apply_record)
    ? input.handoff_context_apply_record
    : null;
  const appliedReadSnapshot = isAppliedSnapshot(appliedRead?.latest_applied_snapshot)
    ? appliedRead.latest_applied_snapshot
    : null;
  const appliedReadRecord = isApplyRecord(appliedRead?.latest_record)
    ? appliedRead.latest_record
    : null;
  const snapshot: AppliedHandoffContextSnapshot | null =
    appliedReadSnapshot ?? directSnapshot;
  const latestRecord: HandoffContextApplyRecord | null =
    appliedReadRecord ?? directRecord;
  const applyReview = parseApplyRecordReview(
    input.handoff_context_apply_record_review,
  );
  const applyReviewEvidenceSummary = getRecord(applyReview, "evidence_summary");
  const evidenceRefs = publicSafeRefs([
    ...(snapshot?.evidence_refs ?? []),
    ...(snapshot?.applied_handoff_context.evidence_refs ?? []),
    ...safeStringArray(applyReviewEvidenceSummary?.evidence_refs),
    ...(latestRecord?.evidence_refs ?? []),
  ]);
  const existingHandoffUnsafe = containsRawOrPrivateMarkers(
    input.existing_handoff_packet_or_capsule,
  );
  const suppliedRefs = [
    ...requestedSourceRefs,
    ...evidenceRefs,
    ...(input.requested_operator_ref ? [input.requested_operator_ref] : []),
    ...(input.requested_idempotency_key ? [input.requested_idempotency_key] : []),
    ...(input.review_confirmation_ref ? [input.review_confirmation_ref] : []),
  ];
  const unsafeRefs = suppliedRefs.filter(
    (ref) => !isCandidateIngressPublicSafeRefV01(ref),
  );

  const blockers = uniqueCandidateIngressStringsV01([
    ...(input.applied_handoff_context_read !== undefined &&
    input.applied_handoff_context_read !== null &&
    !appliedRead
      ? ["applied_handoff_context_read_malformed"]
      : []),
    ...(appliedRead?.status === "no_applied_handoff_context_snapshot"
      ? ["applied_handoff_context_read_no_applied_snapshot"]
      : []),
    ...(appliedRead &&
    appliedRead.status !== "latest_applied_handoff_context_snapshot_available"
      ? ["applied_handoff_context_read_not_latest_snapshot_available"]
      : []),
    ...(appliedRead?.latest_applied_snapshot &&
    !isAppliedSnapshot(appliedRead.latest_applied_snapshot)
      ? ["applied_handoff_context_snapshot_malformed"]
      : []),
    ...(snapshot && !isAppliedHandoffContextLike(snapshot.applied_handoff_context)
      ? ["applied_handoff_context_malformed"]
      : []),
    ...(snapshot && snapshot.applied_entry_count <= 0
      ? ["applied_handoff_context_entries_missing"]
      : []),
    ...(snapshot && !hasReadOnlyAppliedContextAuthority(
      getRecord(snapshot.applied_handoff_context, "authority_boundary"),
    )
      ? ["applied_handoff_context_authority_boundary_invalid"]
      : []),
    ...(snapshot && !hasSafeSnapshotAuthority(getRecord(snapshot, "authority_boundary"))
      ? ["applied_handoff_context_snapshot_authority_boundary_invalid"]
      : []),
    ...(input.handoff_context_apply_record_review !== undefined &&
    input.handoff_context_apply_record_review !== null &&
    !applyReview
      ? ["handoff_context_apply_record_review_malformed"]
      : []),
    ...applyReviewBlockers(applyReview),
    ...(snapshot && applyReview && !snapshotSupportedByApplyReview(snapshot, applyReview)
      ? ["applied_handoff_context_snapshot_not_supported_by_apply_record_review"]
      : []),
  ]);

  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(sourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
    ...(!requestedOperatorRef ? ["requested_operator_ref_missing"] : []),
    ...(!requestedIdempotencyKey ? ["requested_idempotency_key_missing"] : []),
    ...(!reviewConfirmationRef ? ["review_confirmation_ref_missing"] : []),
    ...(!input.requested_packet_format ? ["requested_packet_format_missing"] : []),
    ...(!input.requested_copy_export_target
      ? ["requested_copy_export_target_missing"]
      : []),
  ]);

  const refusals = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length ? ["unsafe_refs_refused"] : []),
    ...(input.requested_packet_format && !packetFormat
      ? ["requested_packet_format_unsupported"]
      : []),
    ...(input.requested_copy_export_target && !target
      ? ["requested_copy_export_target_unsupported"]
      : []),
    ...(existingHandoffUnsafe
      ? ["raw_or_private_existing_handoff_packet_or_capsule_refused"]
      : []),
  ]);

  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!appliedRead && !directSnapshot
      ? ["applied_handoff_context_read_missing"]
      : []),
    ...(!snapshot ? ["applied_handoff_context_snapshot_missing"] : []),
    ...(!applyReview && !directRecord
      ? ["handoff_context_apply_record_review_missing"]
      : []),
  ]);

  const manifestAndEntries =
    snapshot && packetFormat && target
      ? buildPacketMaterial({
          snapshot,
          latestRecord,
          packetFormat,
          target,
          sourceRefs,
          evidenceRefs,
          asOf,
        })
      : null;
  const contract =
    manifestAndEntries && snapshot && packetFormat && target
    ? createContract({
        snapshot,
        latestRecord,
        manifest: manifestAndEntries.manifest,
        entries: manifestAndEntries.entries,
        plan: manifestAndEntries.plan,
        packetFormat,
        target,
        sourceRefs,
        evidenceRefs,
      })
    : null;
  const ready =
    Boolean(contract) &&
    Boolean(requestedOperatorRef) &&
    Boolean(requestedIdempotencyKey) &&
    Boolean(reviewConfirmationRef) &&
    blockers.length === 0 &&
    missingEvidence.length === 0 &&
    refusals.length === 0 &&
    insufficientData.length === 0;
  const status = determineStatus({
    snapshot,
    ready,
    blockers,
    missingEvidence,
    refusals,
    insufficientData,
  });
  const sectionCounts = manifestAndEntries?.sectionCounts ?? {};
  const plan =
    manifestAndEntries?.plan ??
    createEmptyPlan(packetFormat, target, snapshot?.applied_handoff_context_snapshot_ref ?? null);

  return {
    preview_version: HANDOFF_PACKET_COPY_EXPORT_CONTRACT_PREVIEW_VERSION,
    scope: HANDOFF_PACKET_COPY_EXPORT_CONTRACT_SCOPE,
    as_of: asOf,
    source_refs: sourceRefs,
    contract_preview_status: status,
    recommended_next_action: ready
      ? "write_handoff_packet_copy_export_contract_record"
      : blockers.length || refusals.length
        ? "resolve_handoff_packet_copy_export_contract_blockers"
        : snapshot
          ? "review_handoff_packet_copy_export_contract"
          : "supply_applied_handoff_context_snapshot",
    input_summary: {
      has_applied_handoff_context_read: Boolean(appliedRead),
      has_apply_record_review: Boolean(applyReview),
      has_direct_apply_record: Boolean(directRecord),
      has_direct_applied_snapshot: Boolean(directSnapshot),
      requested_packet_format: input.requested_packet_format ?? null,
      requested_copy_export_target: input.requested_copy_export_target ?? null,
      proposed_packet_entry_count: manifestAndEntries?.entries.length ?? 0,
      proposed_packet_section_count: Object.keys(sectionCounts).length,
      blocker_count: blockers.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusals.length,
      insufficient_data_reason_count: insufficientData.length,
      review_confirmation_supplied: Boolean(reviewConfirmationRef),
      requested_idempotency_key_supplied: Boolean(requestedIdempotencyKey),
      requested_operator_ref_supplied: Boolean(requestedOperatorRef),
    },
    source_status: {
      applied_handoff_context_read: appliedRead
        ? appliedRead.status === "latest_applied_handoff_context_snapshot_available"
          ? "supplied"
          : "no_applied_snapshot"
        : input.applied_handoff_context_read === undefined ||
            input.applied_handoff_context_read === null
          ? "missing"
          : "malformed",
      handoff_context_apply_record_review: applyReview
        ? applyReview.review_status === "records_invalid"
          ? "invalid"
          : "supplied"
        : input.handoff_context_apply_record_review === undefined ||
            input.handoff_context_apply_record_review === null
          ? "missing"
          : "malformed",
      existing_handoff_material: existingHandoffUnsafe
        ? "unsafe"
        : input.existing_handoff_packet_or_capsule
          ? "supplied"
          : "missing",
    },
    contract_readiness: createReadiness({
      ready,
      blockers,
      missingEvidence,
      refusals,
      insufficientData,
    }),
    approval_requirements: [
      "confirm_operator_review_for_scoped_local_handoff_packet_copy_export_contract_record",
      "confirm_no_packet_copy_export_download_file_clipboard_write_or_send_by_this_slice",
      "confirm_future_copy_export_slice_required_before packet material leaves contract store",
    ],
    blocking_reasons: blockers,
    missing_evidence: missingEvidence,
    refusal_reasons: refusals,
    evidence_summary: {
      has_applied_handoff_context_read: Boolean(appliedRead),
      has_latest_applied_snapshot: Boolean(snapshot),
      has_applied_handoff_context_entries:
        (snapshot?.applied_entry_count ?? 0) > 0,
      has_apply_record_review: Boolean(applyReview),
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_missing_evidence: missingEvidence.length > 0,
      has_receipt_side_effect_problem:
        applyReviewEvidenceSummary?.has_receipt_side_effect_problem === true,
      no_copy_export_confirmed: true,
      no_handoff_send_confirmed: true,
      source_refs: uniqueCandidateIngressStringsV01([
        ...sourceRefs,
        ...(snapshot?.source_refs ?? []),
      ]),
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      problem_record_ids: safeStringArray(
        applyReviewEvidenceSummary?.problem_record_ids,
      ),
    },
    source_applied_handoff_context_summary: {
      applied_handoff_context_snapshot_ref:
        snapshot?.applied_handoff_context_snapshot_ref ?? null,
      source_handoff_context_apply_record_ref: latestRecord?.record_id ?? null,
      source_handoff_context_update_contract_record_ref:
        snapshot?.source_handoff_context_update_contract_record_ref ?? null,
      source_route_integration_read_ref:
        snapshot?.source_route_integration_read_ref ?? null,
      source_runtime_current_working_perspective_ref:
        snapshot?.source_runtime_current_working_perspective_ref ?? null,
      source_applied_cwp_snapshot_ref: snapshot?.source_applied_snapshot_ref ?? null,
      entry_count: snapshot?.applied_entry_count ?? 0,
      section_counts: snapshot
        ? countBy(
            snapshot.applied_handoff_context_entries.map(
              (entry) => entry.handoff_section,
            ),
          )
        : {},
      copy_export_still_pending:
        snapshot?.applied_handoff_context.apply_metadata.future_copy_export_required ??
        false,
      send_still_pending:
        snapshot?.applied_handoff_context.apply_metadata.future_send_required ??
        false,
    },
    proposed_handoff_packet_copy_export_contract: contract,
    would_write_handoff_packet_copy_export_contract_record_preview: {
      record_version: "handoff_packet_copy_export_contract_record.v0.1",
      scope: HANDOFF_PACKET_COPY_EXPORT_CONTRACT_SCOPE,
      requested_operator_ref: input.requested_operator_ref ?? null,
      requested_idempotency_key: input.requested_idempotency_key ?? null,
      review_confirmation_ref: input.review_confirmation_ref ?? null,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      source_applied_handoff_context_snapshot_ref:
        snapshot?.applied_handoff_context_snapshot_ref ?? null,
      source_handoff_context_apply_record_ref: latestRecord?.record_id ?? null,
      source_handoff_context_update_contract_record_ref:
        snapshot?.source_handoff_context_update_contract_record_ref ?? null,
      source_route_integration_read_ref:
        snapshot?.source_route_integration_read_ref ?? null,
      source_runtime_current_working_perspective_ref:
        snapshot?.source_runtime_current_working_perspective_ref ?? null,
      source_applied_cwp_snapshot_ref: snapshot?.source_applied_snapshot_ref ?? null,
      requested_packet_format: packetFormat,
      requested_copy_export_target: target,
      proposed_handoff_packet_copy_export_contract: contract,
      proposed_packet_manifest: manifestAndEntries?.manifest ?? null,
      proposed_packet_entries: manifestAndEntries?.entries ?? [],
      proposed_packet_section_counts: sectionCounts,
      proposed_copy_export_plan: plan,
    },
    operator_review_checklist: [
      "confirm_applied_handoff_context_snapshot_is_source_refed",
      "confirm_packet_entries_are_public_safe_and_raw_private_material_excluded",
      "confirm_contract_record_is_the_only_write_target",
      "confirm_future_slice_required_for_copy_export_download_clipboard_or_send",
    ],
    would_not_write: [
      "does_not_copy_export_download_write_file_or_clipboard",
      "does_not_send_handoff",
      "does_not_mutate_live_handoff_context_or_selected_refs",
      "does_not_mutate_route_cwp_relay_memory_metrics_or_external_systems",
    ],
    non_goals: [
      "no_actual_handoff_packet_copy",
      "no_actual_handoff_packet_export",
      "no_file_download_or_clipboard_write",
      "no_handoff_send",
      "no_live_handoff_context_mutation",
    ],
    authority_boundary:
      createHandoffPacketCopyExportContractPreviewAuthorityBoundaryV01(),
  };
}

function buildPacketMaterial({
  snapshot,
  latestRecord,
  packetFormat,
  target,
  sourceRefs,
  evidenceRefs,
  asOf,
}: {
  snapshot: AppliedHandoffContextSnapshot;
  latestRecord: HandoffContextApplyRecord | null;
  packetFormat: HandoffPacketCopyExportPacketFormat;
  target: HandoffPacketCopyExportTarget;
  sourceRefs: string[];
  evidenceRefs: string[];
  asOf: string;
}): {
  manifest: HandoffPacketManifest;
  entries: HandoffPacketEntry[];
  plan: HandoffPacketCopyExportPlan;
  sectionCounts: Record<string, number>;
} {
  const packetRef = `handoff-packet-copy-export-candidate:${fingerprint({
    snapshot: snapshot.applied_handoff_context_snapshot_ref,
    packetFormat,
    target,
    asOf,
  }).slice(0, 24)}`;
  const sourceRecordRefs = uniqueCandidateIngressStringsV01([
    latestRecord?.record_id,
    snapshot.source_handoff_context_update_contract_record_ref,
    snapshot.source_route_integration_read_ref,
    snapshot.source_runtime_current_working_perspective_ref,
    snapshot.source_applied_snapshot_ref,
  ]);
  const bodyEntries: HandoffPacketEntry[] =
    snapshot.applied_handoff_context_entries.map((entry, index) => {
      const packetSection =
        sectionMap[entry.handoff_section] ?? "blocked_or_missing_context_section";
      return {
        packet_entry_ref: `handoff-packet-entry:${fingerprint({
          packetRef,
          entry: entry.applied_entry_ref,
          index,
        }).slice(0, 24)}`,
        source_applied_entry_ref: entry.applied_entry_ref,
        packet_section: packetSection,
        entry_kind: mapEntryKind(entry.entry_kind),
        copy_export_rendering_hint:
          packetFormat === "conversation_handoff_capsule"
            ? "capsule_field"
            : packetFormat === "codex_handoff_packet_json"
              ? "json_field"
              : "markdown_bullet",
        summary: entry.summary,
        source_record_refs: uniqueCandidateIngressStringsV01([
          ...sourceRecordRefs,
          ...entry.source_record_refs,
        ]),
        source_refs: uniqueCandidateIngressStringsV01([
          ...sourceRefs,
          ...entry.source_refs,
        ]),
        evidence_refs: uniqueCandidateIngressStringsV01([
          ...evidenceRefs,
          ...entry.evidence_refs,
        ]),
        public_safe: true,
        raw_private_material_excluded: true,
        authority_required: "future_handoff_packet_copy_export",
        persistence_horizon: "handoff_packet_copy_export_contract_record",
      };
    });
  const header: HandoffPacketEntry = {
    packet_entry_ref: `${packetRef}:header`,
    source_applied_entry_ref: null,
    packet_section: "packet_header_section",
    entry_kind: "heading",
    copy_export_rendering_hint: "markdown_heading",
    summary: "Augnes operator handoff packet candidate",
    source_record_refs: sourceRecordRefs,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    public_safe: true,
    raw_private_material_excluded: true,
    authority_required: "future_handoff_packet_copy_export",
    persistence_horizon: "handoff_packet_copy_export_contract_record",
  };
  const sourceTrace: HandoffPacketEntry = {
    packet_entry_ref: `${packetRef}:source-trace`,
    source_applied_entry_ref: null,
    packet_section: "source_trace_section",
    entry_kind: "source_trace",
    copy_export_rendering_hint:
      packetFormat === "codex_handoff_packet_json" ? "json_field" : "markdown_bullet",
    summary: `Source applied handoff context snapshot ${snapshot.applied_handoff_context_snapshot_ref}`,
    source_record_refs: sourceRecordRefs,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    public_safe: true,
    raw_private_material_excluded: true,
    authority_required: "future_handoff_packet_copy_export",
    persistence_horizon: "handoff_packet_copy_export_contract_record",
  };
  const footer: HandoffPacketEntry = {
    packet_entry_ref: `${packetRef}:footer`,
    source_applied_entry_ref: null,
    packet_section: "packet_footer_section",
    entry_kind: "footer",
    copy_export_rendering_hint: "markdown_bullet",
    summary: "Copy/export and handoff send remain future, separate operator-reviewed actions.",
    source_record_refs: sourceRecordRefs,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    public_safe: true,
    raw_private_material_excluded: true,
    authority_required: "future_handoff_packet_copy_export",
    persistence_horizon: "handoff_packet_copy_export_contract_record",
  };
  const entries = [header, ...bodyEntries, sourceTrace, footer];
  const sectionCounts = countBy(entries.map((entry) => entry.packet_section));
  const manifest: HandoffPacketManifest = {
    manifest_version: "handoff_packet_manifest.v0.1",
    packet_ref: packetRef,
    packet_title: "Augnes Operator Handoff Packet Candidate",
    packet_format: packetFormat,
    packet_target: target,
    source_applied_handoff_context_snapshot_ref:
      snapshot.applied_handoff_context_snapshot_ref,
    source_apply_record_ref: latestRecord?.record_id ?? null,
    entry_count: entries.length,
    section_count: Object.keys(sectionCounts).length,
    public_safe: true,
    raw_private_material_excluded: true,
    copy_export_not_performed: true,
    send_not_performed: true,
    future_copy_export_required: true,
    future_send_required: true,
  };
  const plan: HandoffPacketCopyExportPlan = {
    plan_version: "handoff_packet_copy_export_plan.v0.1",
    packet_format: packetFormat,
    copy_export_target: target,
    packet_entry_count: entries.length,
    packet_section_counts: sectionCounts,
    source_applied_handoff_context_snapshot_ref:
      snapshot.applied_handoff_context_snapshot_ref,
    copy_export_not_performed: true,
    clipboard_write_not_performed: true,
    file_write_not_performed: true,
    download_not_performed: true,
    handoff_send_not_performed: true,
    future_copy_export_required: true,
    future_send_required: true,
  };
  return { manifest, entries, plan, sectionCounts };
}

function createContract({
  snapshot,
  latestRecord,
  manifest,
  entries,
  plan,
  packetFormat,
  target,
  sourceRefs,
  evidenceRefs,
}: {
  snapshot: AppliedHandoffContextSnapshot;
  latestRecord: HandoffContextApplyRecord | null;
  manifest: HandoffPacketManifest;
  entries: HandoffPacketEntry[];
  plan: HandoffPacketCopyExportPlan;
  packetFormat: HandoffPacketCopyExportPacketFormat;
  target: HandoffPacketCopyExportTarget;
  sourceRefs: string[];
  evidenceRefs: string[];
}): HandoffPacketCopyExportContractMaterial {
  return {
    contract_kind: "handoff_packet_copy_export_contract.v0.1",
    packet_family: "augnes_operator_handoff_packet",
    source_applied_handoff_context_snapshot_ref:
      snapshot.applied_handoff_context_snapshot_ref,
    source_handoff_context_apply_record_ref: latestRecord?.record_id ?? null,
    source_handoff_context_update_contract_record_ref:
      snapshot.source_handoff_context_update_contract_record_ref,
    source_route_integration_read_ref: snapshot.source_route_integration_read_ref,
    source_runtime_current_working_perspective_ref:
      snapshot.source_runtime_current_working_perspective_ref,
    source_applied_cwp_snapshot_ref: snapshot.source_applied_snapshot_ref,
    requested_packet_format: packetFormat,
    requested_copy_export_target: target,
    proposed_packet_manifest: manifest,
    proposed_packet_sections: Object.keys(plan.packet_section_counts) as HandoffPacketSection[],
    proposed_packet_entries: entries,
    proposed_copy_export_plan: plan,
    required_source_refs: sourceRefs,
    required_evidence_refs: evidenceRefs,
    blocked_live_mutations: [
      "handoff_packet_copied",
      "handoff_packet_exported",
      "handoff_packet_file_written",
      "clipboard_written",
      "handoff_sent",
      "live_handoff_context_mutated",
      "selected_refs_written_to_live_handoff",
      "memory_or_metric_or_external_write",
    ],
    future_copy_export_requirements: [
      "valid_approved_handoff_packet_copy_export_contract_record",
      "operator_selected_copy_export_surface",
      "separate_copy_export_slice_with_no_send_authority",
    ],
    future_send_requirements: [
      "copied_or_exported_packet_record",
      "separate_handoff_send_contract",
      "operator_send_approval",
    ],
    operator_acceptance_criteria: [
      "packet_entries_are_source_refed",
      "raw_private_material_is_excluded",
      "copy_export_and_send_are_not_performed_by_contract_write",
    ],
    rollback_and_fallback_plan: [
      "discard_unapproved_contract_record",
      "continue_using_applied_handoff_context_snapshot_as_readback_source",
      "require_new_contract_for_changed_packet_format_or_target",
    ],
  };
}

function createEmptyPlan(
  packetFormat: HandoffPacketCopyExportPacketFormat | null,
  target: HandoffPacketCopyExportTarget | null,
  snapshotRef: string | null,
): HandoffPacketCopyExportPlan {
  return {
    plan_version: "handoff_packet_copy_export_plan.v0.1",
    packet_format: packetFormat,
    copy_export_target: target,
    packet_entry_count: 0,
    packet_section_counts: {},
    source_applied_handoff_context_snapshot_ref: snapshotRef,
    copy_export_not_performed: true,
    clipboard_write_not_performed: true,
    file_write_not_performed: true,
    download_not_performed: true,
    handoff_send_not_performed: true,
    future_copy_export_required: true,
    future_send_required: true,
  };
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
}): HandoffPacketCopyExportContractReadiness {
  return {
    write_ready: ready,
    readiness_label: ready ? "write_ready" : "not_write_ready",
    requires_applied_handoff_context_snapshot: true,
    requires_packet_format: true,
    requires_copy_export_target: true,
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
  snapshot,
  ready,
  blockers,
  missingEvidence,
  refusals,
  insufficientData,
}: {
  snapshot: AppliedHandoffContextSnapshot | null;
  ready: boolean;
  blockers: string[];
  missingEvidence: string[];
  refusals: string[];
  insufficientData: string[];
}): HandoffPacketCopyExportContractPreviewStatus {
  if (ready) {
    return "ready_for_future_handoff_packet_copy_export_contract_record_write";
  }
  if (!snapshot) return "no_applied_handoff_context_snapshot";
  if (refusals.length || blockers.length) return "blocked";
  if (missingEvidence.length) return "needs_more_evidence";
  if (insufficientData.length) return "insufficient_data";
  return "ready_for_operator_review";
}

function applyReviewBlockers(review: RecordValue | null): string[] {
  if (!review) return [];
  const reasons: string[] = [];
  if (review.review_status === "records_invalid") {
    reasons.push("handoff_context_apply_record_review_invalid");
  }
  if (review.review_status === "schema_missing") {
    reasons.push("handoff_context_apply_record_review_schema_missing");
  }
  if (review.review_status === "no_records") {
    reasons.push("handoff_context_apply_record_review_no_records");
  }
  if (review.review_status === "selected_record_missing") {
    reasons.push("handoff_context_apply_record_review_selected_record_missing");
  }
  if (review.review_status === "selected_applied_snapshot_missing") {
    reasons.push("handoff_context_apply_record_review_selected_applied_snapshot_missing");
  }
  if (Number(getRecord(review, "input_summary")?.valid_record_count ?? 0) <= 0) {
    reasons.push("handoff_context_apply_record_review_valid_records_missing");
  }
  if (!Array.isArray(review.records) || review.records.length === 0) {
    reasons.push("handoff_context_apply_record_review_records_missing");
  }
  if (!Array.isArray(review.applied_snapshots) || review.applied_snapshots.length === 0) {
    reasons.push("handoff_context_apply_record_review_applied_snapshots_missing");
  }
  if (getRecord(review, "evidence_summary")?.has_receipt_side_effect_problem === true) {
    reasons.push("handoff_context_apply_record_review_receipt_side_effect_invalid");
  }
  return reasons;
}

function snapshotSupportedByApplyReview(
  snapshot: AppliedHandoffContextSnapshot,
  review: RecordValue,
): boolean {
  const candidates = [
    getRecord(review, "latest_applied_snapshot_summary")?.applied_handoff_context_snapshot_ref,
    getRecord(review, "selected_applied_snapshot_summary")?.applied_handoff_context_snapshot_ref,
    ...(Array.isArray(review.applied_snapshots)
      ? review.applied_snapshots
          .filter(isRecord)
          .map((candidate) => candidate.applied_handoff_context_snapshot_ref)
      : []),
  ];
  return candidates.includes(snapshot.applied_handoff_context_snapshot_ref);
}

function parseApplyRecordReview(value: unknown): RecordValue | null {
  if (!isRecord(value)) return null;
  return value.review_version === HANDOFF_CONTEXT_APPLY_RECORD_REVIEW_VERSION
    ? value
    : null;
}

function parseAppliedHandoffRead(value: unknown): RecordValue | null {
  if (!isRecord(value)) return null;
  return value.read_version === appliedReadVersion &&
    value.scope === HANDOFF_CONTEXT_APPLY_WRITE_SCOPE
    ? value
    : null;
}

function isApplyRecord(value: unknown): value is HandoffContextApplyRecord {
  return Boolean(
    isRecord(value) &&
      value.record_version === HANDOFF_CONTEXT_APPLY_RECORD_VERSION &&
      value.scope === HANDOFF_CONTEXT_APPLY_WRITE_SCOPE &&
      typeof value.record_id === "string" &&
      isAppliedSnapshot(value.applied_snapshot),
  );
}

function isAppliedSnapshot(value: unknown): value is AppliedHandoffContextSnapshot {
  return Boolean(
    isRecord(value) &&
      value.snapshot_version === APPLIED_HANDOFF_CONTEXT_SNAPSHOT_VERSION &&
      value.scope === HANDOFF_CONTEXT_APPLY_WRITE_SCOPE &&
      typeof value.applied_handoff_context_snapshot_ref === "string" &&
      typeof value.source_handoff_context_update_contract_record_ref === "string" &&
      isAppliedHandoffContextLike(value.applied_handoff_context) &&
      Array.isArray(value.applied_handoff_context_entries) &&
      typeof value.applied_entry_count === "number" &&
      Array.isArray(value.source_refs) &&
      Array.isArray(value.evidence_refs),
  );
}

function isAppliedHandoffContextLike(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const metadata = getRecord(value, "apply_metadata");
  return (
    value.handoff_context_version === "applied_handoff_context.v0.1" &&
    value.scope === HANDOFF_CONTEXT_APPLY_WRITE_SCOPE &&
    typeof value.as_of === "string" &&
    typeof value.source_contract_record_ref === "string" &&
    Array.isArray(value.applied_entries) &&
    value.applied_entries.length > 0 &&
    metadata?.local_snapshot_only === true &&
    metadata.does_not_send_handoff === true &&
    metadata.does_not_write_live_packet === true &&
    metadata.future_copy_export_required === true &&
    metadata.future_send_required === true
  );
}

function hasReadOnlyAppliedContextAuthority(authority: RecordValue | null): boolean {
  if (!authority) return false;
  return (
    authority.read_only === true &&
    (authority.advisory_only === undefined || authority.advisory_only === true) &&
    (authority.apply_preview_only === undefined ||
      authority.apply_preview_only === true) &&
    authority.source_of_truth === false &&
    fieldsFalse(authority, appliedContextAuthorityRequiredFalseFields) &&
    fieldsNotTrue(authority, appliedContextAuthorityRequiredNotTrueFields)
  );
}

function hasSafeSnapshotAuthority(authority: RecordValue | null): boolean {
  if (!authority) return false;
  return (
    authority.source_of_truth === false &&
    fieldsFalse(authority, appliedSnapshotAuthorityRequiredFalseFields) &&
    fieldsNotTrue(authority, appliedSnapshotAuthorityRequiredNotTrueFields)
  );
}

function fieldsFalse(
  value: RecordValue,
  fields: readonly string[],
): boolean {
  return fields.every((field) => value[field] === false);
}

function fieldsNotTrue(
  value: RecordValue,
  fields: readonly string[],
): boolean {
  return fields.every((field) => value[field] !== true);
}

const appliedContextAuthorityRequiredFalseFields = [
  "can_write_db",
  "can_create_handoff_context_apply_record",
  "can_create_applied_handoff_context_snapshot",
  "can_apply_handoff_context_update_to_local_snapshot",
  "can_apply_handoff_context_update_live",
  "can_mutate_handoff_context",
  "can_send_handoff",
  "can_copy_export_handoff_packet",
  "can_write_selected_refs_to_live_handoff",
  "can_modify_api_perspective_current_route",
  "can_replace_current_working_perspective_route_response",
  "can_update_upstream_current_working_perspective_source_tables",
  "can_write_applied_current_working_perspective_snapshot",
  "can_write_current_working_perspective_apply_record",
  "can_write_current_working_perspective_update_contract_record",
  "can_write_route_integration_contract_record",
  "can_write_handoff_context_update_contract_record",
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

const appliedContextAuthorityRequiredNotTrueFields = [
  "can_create_handoff_packet_copy_export_contract_record",
  "can_copy_export_handoff_packet",
  "can_write_handoff_packet_file",
  "can_write_clipboard",
  "can_download_file",
  "can_write_handoff_context_apply_record",
  "can_write_applied_handoff_context_snapshot",
] as const;

const appliedSnapshotAuthorityRequiredFalseFields = [
  "can_apply_handoff_context_update_live",
  "can_mutate_handoff_context",
  "can_send_handoff",
  "can_copy_export_handoff_packet",
  "can_write_selected_refs_to_live_handoff",
  "can_modify_api_perspective_current_route",
  "can_replace_current_working_perspective_route_response",
  "can_update_upstream_current_working_perspective_source_tables",
  "can_write_applied_current_working_perspective_snapshot",
  "can_write_current_working_perspective_apply_record",
  "can_write_current_working_perspective_update_contract_record",
  "can_write_route_integration_contract_record",
  "can_write_handoff_context_update_contract_record",
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

const appliedSnapshotAuthorityRequiredNotTrueFields = [
  "can_create_handoff_packet_copy_export_contract_record",
  "can_copy_export_handoff_packet",
  "can_write_handoff_packet_file",
  "can_write_clipboard",
  "can_download_file",
  "can_write_handoff_context_apply_record",
  "can_write_applied_handoff_context_snapshot",
] as const;

function parsePacketFormat(
  value: HandoffPacketCopyExportContractPreviewInput["requested_packet_format"],
): HandoffPacketCopyExportPacketFormat | null {
  return typeof value === "string" &&
    packetFormats.includes(value as HandoffPacketCopyExportPacketFormat)
    ? (value as HandoffPacketCopyExportPacketFormat)
    : null;
}

function parseCopyExportTarget(
  value: HandoffPacketCopyExportContractPreviewInput["requested_copy_export_target"],
): HandoffPacketCopyExportTarget | null {
  return typeof value === "string" &&
    copyExportTargets.includes(value as HandoffPacketCopyExportTarget)
    ? (value as HandoffPacketCopyExportTarget)
    : null;
}

function mapEntryKind(kind: unknown): HandoffPacketEntry["entry_kind"] {
  if (kind === "next_action_candidate") return "next_action";
  if (kind === "review_required") return "review_required";
  if (kind === "stop_condition") return "stop_condition";
  if (kind === "source_trace") return "source_trace";
  if (kind === "fallback_note") return "fallback_note";
  if (kind === "warn") return "warning";
  return "summary";
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

function publicSafeRefs(values: unknown[]): string[] {
  return uniqueCandidateIngressStringsV01(values).filter(
    isCandidateIngressPublicSafeRefV01,
  );
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function safeRef(value: unknown): value is string {
  return isCandidateIngressPublicSafeRefV01(value);
}

function countBy(values: unknown[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    if (typeof value !== "string" || !value) return acc;
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function getRecord(value: unknown, key: string): RecordValue | null {
  if (!isRecord(value)) return null;
  return isRecord(value[key]) ? (value[key] as RecordValue) : null;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
