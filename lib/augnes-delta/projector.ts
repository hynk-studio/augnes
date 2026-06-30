import type {
  ArtifactRef,
  AugnesDelta,
  AugnesDeltaAuthorityBoundary,
  AugnesDeltaStatus,
  AugnesDeltaType,
  AugnesDeltaValidationSummary,
  DeltaBatch,
  DeltaMergePolicy,
  DeltaMergePolicyMode,
  EvidenceRef,
  HandoffRef,
  ResearchDiagnosticRef,
  SnapshotRef,
} from "../../types/augnes-delta";
import type {
  AugnesDeltaProjectionActionRecordInput,
  AugnesDeltaProjectionCodexResultTraceInput,
  AugnesDeltaProjectionCoordinationEventInput,
  AugnesDeltaProjectionDogfoodingRecordInput,
  AugnesDeltaProjectionEvidenceRecordInput,
  AugnesDeltaProjectionGap,
  AugnesDeltaProjectionGapSeverity,
  AugnesDeltaProjectionHandoffTraceInput,
  AugnesDeltaProjectionInput,
  AugnesDeltaProjectionReadModel,
  AugnesDeltaProjectionResult,
  AugnesDeltaProjectionSourceCounts,
  AugnesDeltaProjectionSourceKind,
  AugnesDeltaProjectionSourceRefs,
  AugnesDeltaProjectionStateDeltaProposalInput,
  AugnesDeltaProjectionWorkEventInput,
} from "../../types/augnes-delta-projection";

const CONTRACT_VERSION = "augnes_delta_contract.v0.1" as const;
const PROJECTION_VERSION = "augnes_delta_projection.v0.1" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z";
const PROJECTION_CREATED_BY = "augnes_delta_projection_v0_1";
const PROJECTION_TARGET_SCOPE = "projection_read_model";
const PHASE_2_BLOCKED_REASON =
  "Phase 2 projection read model has no apply authority.";

const DEFAULT_NON_GOALS = [
  "No state mutation.",
  "No proof or evidence write.",
  "No durable Perspective apply.",
  "No memory mutation.",
  "No external side effect.",
  "No merge, publish, retry, replay, or deploy behavior.",
];

export function buildAugnesDeltaProjectionReadModel(
  input: AugnesDeltaProjectionInput,
): AugnesDeltaProjectionReadModel {
  const normalized = normalizeProjectionInput(input);
  const scope = normalized.scope;
  const asOf = normalized.as_of || deriveAsOf(normalized);
  const gaps = [...normalized.gaps];

  const projectedDeltas = [
    ...normalized.state_delta_proposals.map((source) =>
      projectStateDeltaProposalToDelta(source, { scope, as_of: asOf }),
    ),
    ...normalized.work_events.map((source) =>
      projectWorkEventToDelta(source, { scope, as_of: asOf }),
    ),
    ...normalized.coordination_events.map((source) =>
      projectCoordinationEventToDelta(source, { scope, as_of: asOf }),
    ),
    ...normalized.action_records.map((source) =>
      projectActionRecordToDelta(source, { scope, as_of: asOf }),
    ),
    ...normalized.evidence_records.map((source) =>
      projectEvidenceRecordToDelta(source, { scope, as_of: asOf }),
    ),
    ...normalized.dogfooding_records.map((source) =>
      projectDogfoodingRecordToDelta(source, { scope, as_of: asOf }),
    ),
    ...normalized.handoff_traces.map((source) =>
      projectHandoffTraceToDelta(source, { scope, as_of: asOf }),
    ),
    ...normalized.codex_result_traces.map((source) =>
      projectCodexResultTraceToDelta(source, { scope, as_of: asOf }),
    ),
  ];

  if (normalized.snapshot_refs.length === 0) {
    gaps.push(
      createProjectionGap({
        code: "snapshot_not_materialized",
        severity: "medium",
        source_kind: "perspective_snapshot",
        summary:
          "Delta projection did not materialize a fresh PerspectiveSnapshot in this phase.",
        details: [
          "Phase 2A accepts SnapshotRef inputs but does not read or create snapshots.",
        ],
      }),
    );
  }

  appendEmptySourceGaps(gaps, normalized);

  const batches =
    projectedDeltas.length > 0
      ? [
          buildProjectionBatch({
            scope,
            created_at: asOf,
            deltas: projectedDeltas,
            snapshot_refs: normalized.snapshot_refs,
            diagnostic_refs: normalized.diagnostic_refs,
          }),
        ]
      : [];

  const sourceRefs = buildSourceRefs(normalized);
  const sourceCounts = buildSourceCounts(
    normalized,
    projectedDeltas,
    batches,
    gaps,
  );

  return {
    runtime: "augnes",
    projection_version: PROJECTION_VERSION,
    contract_version: CONTRACT_VERSION,
    scope,
    as_of: asOf,
    source_refs: sourceRefs,
    source_counts: sourceCounts,
    deltas: projectedDeltas,
    batches,
    gaps,
    authority_boundary: buildDefaultDeltaProjectionAuthorityBoundary(),
    next_phase_notes:
      normalized.next_phase_notes.length > 0
        ? normalized.next_phase_notes
        : [
            "Phase 2B may add a read-only route only under an explicit operator prompt.",
            "Phase 3 can consume deltas, batches, source_refs, gaps, and snapshot_refs.",
          ],
  };
}

export function projectStateDeltaProposalToDelta(
  proposal: AugnesDeltaProjectionStateDeltaProposalInput,
  context: ProjectionContext,
): AugnesDelta {
  const type = mapStateDeltaProposalType(proposal);
  const status = mapStateDeltaProposalStatus(proposal.status);
  const stateKey = proposal.state_key ?? "unknown_state_key";
  const createdAt = proposal.proposed_at ?? context.as_of;
  const mergePolicy = buildProposalMergePolicy({ proposal, type, status });

  return buildProjectedDelta({
    delta_id: `delta.state_delta_proposal.${safeId(proposal.id)}`,
    scope: proposal.scope ?? context.scope,
    type,
    status,
    source: "state_delta_proposal",
    title: `Projected state delta proposal: ${stateKey}`,
    summary:
      proposal.reason ??
      "Projected state delta proposal; proposal status is review metadata only.",
    created_at: createdAt,
    created_by: proposal.source_agent_id ?? PROJECTION_CREATED_BY,
    target_refs: compact([
      `state_delta_proposal:${proposal.id}`,
      proposal.state_key ? `state_key:${proposal.state_key}` : null,
      proposal.source_session_id ? `session:${proposal.source_session_id}` : null,
    ]),
    snapshot_refs: [],
    diagnostic_refs: [],
    evidence_refs: [],
    artifact_refs: [],
    handoff_refs: [],
    merge_policy: mergePolicy,
    review_notes: [
      "State Delta Proposal source remains authoritative.",
      "Committed proposals must not be recommitted by this projection.",
      "Rejected proposals must not be restored by this projection.",
    ],
  });
}

export function projectWorkEventToDelta(
  event: AugnesDeltaProjectionWorkEventInput,
  context: ProjectionContext,
): AugnesDelta {
  const type = mapWorkEventType(event.event_type);
  const status = mapWorkEventStatus(event.result_status);
  const createdAt = event.created_at ?? context.as_of;
  const artifactRefs = event.related_pr
    ? [
        buildPointerArtifactRef({
          artifact_ref: `artifact.pr.${safeId(event.related_pr)}`,
          artifact_kind: "code",
          summary:
            "Pointer to related PR only; GitHub PRs are external review artifacts for code deltas.",
        }),
      ]
    : [];
  const evidenceRefs = event.related_action_id
    ? [
        buildPointerEvidenceRef({
          evidence_ref: `action_record.pointer.${safeId(event.related_action_id)}`,
          evidence_kind: "validation_pointer",
          summary: "Pointer to related action record only.",
          verified_status: "unverified",
        }),
      ]
    : [];
  const handoffRefs =
    type === "handoff_delta"
      ? [
          buildPointerHandoffRef({
            handoff_ref: `handoff.work_event.${safeId(event.id)}`,
            handoff_kind: "codex_handoff",
            summary: "Pointer to work-event handoff trace only.",
          }),
        ]
      : [];

  return buildProjectedDelta({
    delta_id: `delta.work_event.${safeId(event.id)}`,
    scope: event.scope ?? context.scope,
    type,
    status,
    source: "work_event",
    title: `Projected work event: ${event.event_type ?? "unknown"}`,
    summary:
      event.summary ??
      "Projected WorkEvent trace; not proof, evidence, approval, or readiness.",
    created_at: createdAt,
    created_by: event.actor ?? PROJECTION_CREATED_BY,
    target_refs: compact([
      `work_event:${event.id}`,
      event.work_id ? `work:${event.work_id}` : null,
      event.result_kind ? `result_kind:${event.result_kind}` : null,
      ...(event.related_state_keys ?? []).map((key) => `state_key:${key}`),
    ]),
    snapshot_refs: [],
    diagnostic_refs: [],
    evidence_refs: evidenceRefs,
    artifact_refs: artifactRefs,
    handoff_refs: handoffRefs,
    merge_policy: buildMergePolicyForDeltaType(type, {
      requires_user_judgment: status === "needs_review",
      requires_validation: ["code_delta", "validation_delta", "handoff_delta"].includes(
        type,
      ),
    }),
    review_notes: [
      "WorkEvent is a human-readable trace.",
      "WorkEvent does not become proof, evidence, approval, or readiness.",
    ],
  });
}

export function projectCoordinationEventToDelta(
  event: AugnesDeltaProjectionCoordinationEventInput,
  context: ProjectionContext,
): AugnesDelta {
  const type = mapCoordinationEventType(event.event_type);
  const status = mapCoordinationEventStatus(event.result_status);
  const publicationEvent = (event.event_type ?? "").startsWith("publication_");
  const mergePolicy = publicationEvent
    ? buildBlockedProjectionMergePolicy(
        "Publication coordination events are pointer-only and grant no publish authority.",
        { requires_user_judgment: true },
      )
    : buildMergePolicyForDeltaType(type, {
        requires_user_judgment:
          status === "needs_review" || type === "user_decision_delta",
        requires_validation: type === "validation_delta" || type === "handoff_delta",
      });
  const artifactRefs = publicationEvent
    ? [
        buildPointerArtifactRef({
          artifact_ref: event.payload_ref
            ? `artifact.publication.${safeId(event.payload_ref)}`
            : `artifact.publication_event.${safeId(event.event_id)}`,
          artifact_kind: "artifact",
          summary:
            "Pointer to publication coordination event only; no publish authority.",
        }),
      ]
    : [];
  const handoffRefs =
    type === "handoff_delta"
      ? [
          buildPointerHandoffRef({
            handoff_ref: event.payload_ref
              ? `handoff.${safeId(event.payload_ref)}`
              : `handoff.coordination_event.${safeId(event.event_id)}`,
            handoff_kind: "operator_packet",
            summary: "Pointer to coordination handoff event only.",
          }),
        ]
      : [];

  return buildProjectedDelta({
    delta_id: `delta.coordination_event.${safeId(event.event_id)}`,
    scope: event.scope ?? context.scope,
    type,
    status,
    source: "coordination_event",
    title: `Projected coordination event: ${event.event_type ?? "unknown"}`,
    summary:
      event.payload_ref ??
      "Projected coordination event; authority_level is not delta authority.",
    created_at: event.created_at ?? context.as_of,
    created_by: event.actor ?? PROJECTION_CREATED_BY,
    target_refs: compact([
      `coordination_event:${event.event_id}`,
      event.work_id ? `work:${event.work_id}` : null,
      event.target ? `target:${event.target}` : null,
      event.source_surface ? `source_surface:${event.source_surface}` : null,
      event.authority_level ? `source_authority_level:${event.authority_level}` : null,
      event.causal_parent_id ? `parent:${event.causal_parent_id}` : null,
      ...(event.state_keys ?? []).map((key) => `state_key:${key}`),
    ]),
    snapshot_refs: [],
    diagnostic_refs: [],
    evidence_refs: [],
    artifact_refs: artifactRefs,
    handoff_refs: handoffRefs,
    merge_policy: mergePolicy,
    review_notes: [
      "Coordination event authority_level is not AugnesDelta authority.",
      "Committed-state coordination metadata does not let Phase 2 mutate state.",
    ],
  });
}

export function projectActionRecordToDelta(
  action: AugnesDeltaProjectionActionRecordInput,
  context: ProjectionContext,
): AugnesDelta {
  const completed = normalizeToken(action.status ?? "").includes("completed");
  const type: AugnesDeltaType = completed ? "validation_delta" : "coordination_delta";
  const createdAt = action.completed_at ?? action.created_at ?? context.as_of;

  return buildProjectedDelta({
    delta_id: `delta.action_record.${safeId(action.id)}`,
    scope: action.scope ?? context.scope,
    type,
    status: completed ? "draft" : "needs_review",
    source: "action_record",
    title: action.title ?? `Projected action record: ${action.id}`,
    summary:
      action.description ??
      "Projected action record pointer; proof-only action records are not approval.",
    created_at: createdAt,
    created_by: action.source_agent_id ?? PROJECTION_CREATED_BY,
    target_refs: compact([
      `action_record:${action.id}`,
      action.state_key ? `state_key:${action.state_key}` : null,
      action.source_session_id ? `session:${action.source_session_id}` : null,
    ]),
    snapshot_refs: [],
    diagnostic_refs: [],
    evidence_refs: [
      buildPointerEvidenceRef({
        evidence_ref: `action_record.pointer.${safeId(action.id)}`,
        evidence_kind: "validation_pointer",
        summary: "Pointer to action record only; no proof or evidence write authority.",
        verified_status: completed ? "partial" : "unverified",
      }),
    ],
    artifact_refs: [],
    handoff_refs: [],
    merge_policy: buildMergePolicyForDeltaType(type, {
      requires_user_judgment: !completed,
      requires_validation: type === "validation_delta",
    }),
    validation_summary: buildPointerValidationSummary(
      "action_record",
      `action_record:${action.id}`,
    ),
    review_notes: [
      "Action records do not grant retry, replay, deploy, or merge authority.",
    ],
  });
}

export function projectEvidenceRecordToDelta(
  evidence: AugnesDeltaProjectionEvidenceRecordInput,
  context: ProjectionContext,
): AugnesDelta {
  const verifiedStatus = mapEvidenceVerifiedStatus(evidence.status);

  return buildProjectedDelta({
    delta_id: `delta.evidence_record.${safeId(evidence.evidence_id)}`,
    scope: evidence.scope ?? context.scope,
    type: "validation_delta",
    status: verifiedStatus === "verified" ? "draft" : "needs_review",
    source: "evidence_record",
    title: evidence.label ?? `Projected evidence record: ${evidence.evidence_id}`,
    summary:
      evidence.result_summary ??
      evidence.observed_behavior ??
      "Projected evidence record pointer; Phase 2A creates no evidence rows.",
    created_at: evidence.created_at ?? context.as_of,
    created_by: evidence.created_by ?? PROJECTION_CREATED_BY,
    target_refs: compact([
      `evidence_record:${evidence.evidence_id}`,
      evidence.work_id ? `work:${evidence.work_id}` : null,
      evidence.publication_id ? `publication:${evidence.publication_id}` : null,
      evidence.delivery_id ? `delivery:${evidence.delivery_id}` : null,
      evidence.target_ref ? `target:${evidence.target_ref}` : null,
      evidence.source_ref ? `source_ref:${evidence.source_ref}` : null,
      evidence.related_action_id ? `action_record:${evidence.related_action_id}` : null,
      evidence.related_work_event_id
        ? `work_event:${evidence.related_work_event_id}`
        : null,
    ]),
    snapshot_refs: [],
    diagnostic_refs: [],
    evidence_refs: [
      buildPointerEvidenceRef({
        evidence_ref: `evidence_record.pointer.${safeId(evidence.evidence_id)}`,
        evidence_kind: evidence.evidence_kind ?? "evidence_pointer",
        summary:
          evidence.skipped_reason ??
          "Pointer to existing evidence record only; no evidence write authority.",
        verified_status: verifiedStatus,
      }),
    ],
    artifact_refs: [],
    handoff_refs: [],
    merge_policy: buildMergePolicyForDeltaType("validation_delta", {
      requires_user_judgment: verifiedStatus !== "verified",
      requires_validation: true,
    }),
    validation_summary: buildPointerValidationSummary(
      "evidence_record",
      `evidence_record:${evidence.evidence_id}`,
    ),
    review_notes: [
      "EvidenceRef remains pointer-only.",
      "Validation pass is not approval.",
    ],
  });
}

export function projectDogfoodingRecordToDelta(
  record: AugnesDeltaProjectionDogfoodingRecordInput,
  context: ProjectionContext,
): AugnesDelta {
  const type = mapDogfoodingRecordType(record.record_kind);

  return buildProjectedDelta({
    delta_id: `delta.dogfooding_record.${safeId(record.record_id)}`,
    scope: record.scope ?? context.scope,
    type,
    status: "needs_review",
    source: "dogfooding_record",
    title: record.title ?? `Projected dogfooding record: ${record.record_id}`,
    summary:
      record.summary ??
      "Projected bounded dogfooding summary only; no raw conversation ingestion.",
    created_at: record.created_at ?? context.as_of,
    created_by: record.created_by ?? PROJECTION_CREATED_BY,
    target_refs: compact([
      `dogfooding_record:${record.record_id}`,
      record.status ? `status:${record.status}` : null,
      ...(record.signal_refs ?? []).map((signalRef) => `signal:${signalRef}`),
    ]),
    snapshot_refs: [],
    diagnostic_refs: [],
    evidence_refs: [],
    artifact_refs: [],
    handoff_refs: [],
    merge_policy: buildMergePolicyForDeltaType(type, {
      requires_user_judgment: true,
      requires_validation: type === "validation_delta",
    }),
    review_notes: [
      "Dogfooding records are bounded summaries only.",
      "No raw conversation ingestion or product-write execution is authorized.",
    ],
  });
}

export function projectHandoffTraceToDelta(
  handoff: AugnesDeltaProjectionHandoffTraceInput,
  context: ProjectionContext,
): AugnesDelta {
  return buildProjectedDelta({
    delta_id: `delta.handoff_packet.${safeId(handoff.handoff_ref)}`,
    scope: handoff.scope ?? context.scope,
    type: "handoff_delta",
    status: "draft",
    source: "handoff_packet",
    title: `Projected handoff trace: ${handoff.handoff_ref}`,
    summary: handoff.summary ?? "Projected handoff pointer only.",
    created_at: handoff.created_at ?? context.as_of,
    created_by: handoff.created_by ?? PROJECTION_CREATED_BY,
    target_refs: [`handoff:${handoff.handoff_ref}`],
    snapshot_refs: [],
    diagnostic_refs: [],
    evidence_refs: [],
    artifact_refs: [],
    handoff_refs: [
      buildPointerHandoffRef({
        handoff_ref: handoff.handoff_ref,
        handoff_kind: handoff.handoff_kind ?? "operator_packet",
        summary: "Pointer to existing handoff trace only.",
      }),
    ],
    merge_policy: buildMergePolicyForDeltaType("handoff_delta", {
      requires_user_judgment: false,
      requires_validation: true,
    }),
    review_notes: ["Handoff traces grant no execution or external send authority."],
  });
}

export function projectCodexResultTraceToDelta(
  result: AugnesDeltaProjectionCodexResultTraceInput,
  context: ProjectionContext,
): AugnesDelta {
  const type = mapCodexResultTraceType(result.result_kind);

  return buildProjectedDelta({
    delta_id: `delta.codex_result.${safeId(result.result_ref)}`,
    scope: result.scope ?? context.scope,
    type,
    status: mapWorkEventStatus(result.status),
    source: "codex_result",
    title: `Projected Codex result trace: ${result.result_ref}`,
    summary:
      result.summary ??
      "Projected Codex result pointer only; no Codex execution authority.",
    created_at: result.created_at ?? context.as_of,
    created_by: result.created_by ?? PROJECTION_CREATED_BY,
    target_refs: [`codex_result:${result.result_ref}`],
    snapshot_refs: [],
    diagnostic_refs: [],
    evidence_refs: result.evidence_refs ?? [],
    artifact_refs: result.artifact_refs ?? [],
    handoff_refs: result.handoff_refs ?? [],
    merge_policy: buildMergePolicyForDeltaType(type, {
      requires_user_judgment: true,
      requires_validation: type === "code_delta" || type === "validation_delta",
    }),
    review_notes: [
      "Codex result traces are projection inputs only.",
      "Phase 2A does not execute Codex.",
    ],
  });
}

export function buildDefaultDeltaProjectionAuthorityBoundary(): AugnesDeltaAuthorityBoundary {
  return buildDefaultDeltaAuthorityBoundary();
}

export function buildDefaultDeltaAuthorityBoundary(): AugnesDeltaAuthorityBoundary {
  return {
    source_of_truth:
      "Existing Augnes source records remain authoritative; this delta is a read-only projection.",
    can_commit_or_reject_state: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_mutate_memory: false,
    can_apply_project_perspective: false,
    can_publish_external: false,
    can_merge: false,
    can_retry_replay_deploy: false,
    can_call_github: false,
    can_call_openai_or_provider: false,
    can_execute_codex: false,
    can_create_branch_or_pr: false,
    notes: [
      "read-only projection",
      "pointer-only refs",
      "no durable apply",
      "no external side effect",
      "no proof/evidence write",
      "no source-of-truth claim",
    ],
  };
}

export function buildBlockedProjectionMergePolicy(
  blocked_reason = PHASE_2_BLOCKED_REASON,
  options: ProjectionMergePolicyOptions = {},
): DeltaMergePolicy {
  return buildProjectionMergePolicy({
    ...options,
    mode: "blocked",
    blocked_reason,
    allowed_auto_apply: false,
    durable_memory_allowed: false,
    project_perspective_allowed: false,
    external_side_effect_allowed: false,
  });
}

export function buildManualProjectionMergePolicy(
  options: ProjectionMergePolicyOptions = {},
): DeltaMergePolicy {
  return buildProjectionMergePolicy({
    ...options,
    mode: options.mode ?? "manual_review_required",
    blocked_reason: options.blocked_reason ?? PHASE_2_BLOCKED_REASON,
    allowed_auto_apply: false,
    durable_memory_allowed: false,
    project_perspective_allowed: false,
    external_side_effect_allowed: false,
  });
}

export function buildPointerEvidenceRef({
  evidence_ref,
  evidence_kind,
  summary,
  verified_status = "unverified",
}: PointerEvidenceRefInput): EvidenceRef {
  return {
    evidence_ref,
    evidence_kind,
    pointer_semantics: "pointer_only",
    summary,
    verified_status,
    proof_write_authority: false,
    evidence_write_authority: false,
  };
}

export function buildPointerArtifactRef({
  artifact_ref,
  artifact_kind,
  summary,
}: PointerArtifactRefInput): ArtifactRef {
  return {
    artifact_ref,
    artifact_kind,
    pointer_semantics: "pointer_only",
    summary,
    source_of_truth: false,
  };
}

export function buildPointerHandoffRef({
  handoff_ref,
  handoff_kind,
  summary,
}: PointerHandoffRefInput): HandoffRef {
  return {
    handoff_ref,
    handoff_kind,
    pointer_semantics: "pointer_only",
    summary,
    execution_authority: false,
    external_send_authority: false,
  };
}

export function buildProjectionBatch({
  scope,
  created_at,
  deltas,
  snapshot_refs = [],
  diagnostic_refs = [],
}: ProjectionBatchInput): DeltaBatch {
  return {
    batch_id: `batch.augnes_delta_projection.${safeId(scope)}.v0.1`,
    contract_version: CONTRACT_VERSION,
    scope,
    title: "Augnes Delta projection read-model batch",
    summary:
      "Read-only projection batch built from existing Augnes source records.",
    created_at,
    created_by: PROJECTION_CREATED_BY,
    deltas,
    snapshot_refs,
    diagnostic_refs,
    authority_boundary: buildDefaultDeltaAuthorityBoundary(),
    validation_summary: {
      validation_status: "not_run",
      required_checks: ["npm run smoke:augnes-delta-projection-v0-1"],
      completed_checks: [],
      failed_checks: [],
      skipped_checks: [],
      notes: [
        "Projection batch is deterministic read-model output only.",
        "Static smoke validates fixture shape and authority boundary.",
      ],
    },
    budget_summary: {
      budget_scope: "projection_read_model",
      estimated_delta_count: deltas.length,
      reviewed_delta_count: 0,
      auto_apply_candidate_count: 0,
      manual_review_required_count: deltas.filter(
        (delta) => delta.merge_policy.mode !== "blocked",
      ).length,
      blocked_delta_count: deltas.filter(
        (delta) => delta.merge_policy.mode === "blocked",
      ).length,
      notes: ["Counts are read-model metadata only."],
    },
  };
}

export function createProjectionGap({
  code,
  severity,
  source_kind,
  summary,
  details = [],
  source_refs = [],
}: ProjectionGapInput): AugnesDeltaProjectionGap {
  return {
    code,
    severity,
    source_kind,
    summary,
    details,
    source_refs,
  };
}

export function buildAugnesDeltaProjectionResult(
  input: AugnesDeltaProjectionInput,
): AugnesDeltaProjectionResult {
  const readModel = buildAugnesDeltaProjectionReadModel(input);

  return {
    read_model: readModel,
    projected_delta_count: readModel.deltas.length,
    batch_count: readModel.batches.length,
    gap_count: readModel.gaps.length,
  };
}

interface ProjectionContext {
  scope: string;
  as_of: string;
}

interface NormalizedProjectionInput extends Required<AugnesDeltaProjectionInput> {}

interface ProjectionMergePolicyOptions {
  mode?: DeltaMergePolicyMode;
  target_scope?: string;
  allowed_auto_apply?: boolean;
  requires_user_judgment?: boolean;
  requires_fresh_snapshot?: boolean;
  requires_validation?: boolean;
  durable_memory_allowed?: boolean;
  project_perspective_allowed?: boolean;
  external_side_effect_allowed?: boolean;
  blocked_reason?: string;
}

interface ProjectedDeltaInput {
  delta_id: string;
  scope: string;
  type: AugnesDeltaType;
  status: AugnesDeltaStatus;
  source: AugnesDelta["source"];
  title: string;
  summary: string;
  created_at: string;
  created_by: string;
  target_refs: string[];
  snapshot_refs: SnapshotRef[];
  diagnostic_refs: ResearchDiagnosticRef[];
  evidence_refs: EvidenceRef[];
  artifact_refs: ArtifactRef[];
  handoff_refs: HandoffRef[];
  merge_policy: DeltaMergePolicy;
  validation_summary?: AugnesDeltaValidationSummary;
  review_notes?: string[];
}

interface PointerEvidenceRefInput {
  evidence_ref: string;
  evidence_kind: EvidenceRef["evidence_kind"];
  summary: string;
  verified_status?: EvidenceRef["verified_status"];
}

interface PointerArtifactRefInput {
  artifact_ref: string;
  artifact_kind: ArtifactRef["artifact_kind"];
  summary: string;
}

interface PointerHandoffRefInput {
  handoff_ref: string;
  handoff_kind: HandoffRef["handoff_kind"];
  summary: string;
}

interface ProjectionBatchInput {
  scope: string;
  created_at: string;
  deltas: AugnesDelta[];
  snapshot_refs?: SnapshotRef[];
  diagnostic_refs?: ResearchDiagnosticRef[];
}

interface ProjectionGapInput {
  code: string;
  severity: AugnesDeltaProjectionGapSeverity;
  source_kind: AugnesDeltaProjectionSourceKind;
  summary: string;
  details?: string[];
  source_refs?: string[];
}

function normalizeProjectionInput(
  input: AugnesDeltaProjectionInput,
): NormalizedProjectionInput {
  return {
    scope: input.scope,
    as_of: input.as_of ?? "",
    state_delta_proposals: input.state_delta_proposals ?? [],
    work_events: input.work_events ?? [],
    coordination_events: input.coordination_events ?? [],
    action_records: input.action_records ?? [],
    evidence_records: input.evidence_records ?? [],
    dogfooding_records: input.dogfooding_records ?? [],
    handoff_traces: input.handoff_traces ?? [],
    codex_result_traces: input.codex_result_traces ?? [],
    snapshot_refs: input.snapshot_refs ?? [],
    diagnostic_refs: input.diagnostic_refs ?? [],
    gaps: input.gaps ?? [],
    next_phase_notes: input.next_phase_notes ?? [],
  };
}

function buildProjectedDelta(input: ProjectedDeltaInput): AugnesDelta {
  return {
    delta_id: input.delta_id,
    contract_version: CONTRACT_VERSION,
    scope: input.scope,
    type: input.type,
    status: input.status,
    source: input.source,
    title: input.title,
    summary: input.summary,
    created_at: input.created_at,
    created_by: input.created_by,
    target_refs: input.target_refs,
    snapshot_refs: input.snapshot_refs,
    diagnostic_refs: input.diagnostic_refs,
    evidence_refs: input.evidence_refs,
    artifact_refs: input.artifact_refs,
    handoff_refs: input.handoff_refs,
    merge_policy: input.merge_policy,
    authority_boundary: buildDefaultDeltaAuthorityBoundary(),
    validation_summary: input.validation_summary,
    review_notes: input.review_notes,
    non_goals: DEFAULT_NON_GOALS,
  };
}

function buildProposalMergePolicy({
  proposal,
  type,
  status,
}: {
  proposal: AugnesDeltaProjectionStateDeltaProposalInput;
  type: AugnesDeltaType;
  status: AugnesDeltaStatus;
}): DeltaMergePolicy {
  if (proposal.status === "committed") {
    return buildBlockedProjectionMergePolicy(
      "Committed source proposal is already source-record state and must not be recommitted.",
      {
        requires_user_judgment: true,
        requires_fresh_snapshot: type === "perspective_delta" || type === "memory_delta",
      },
    );
  }

  if (proposal.status === "rejected") {
    return buildBlockedProjectionMergePolicy(
      "Rejected source proposal must not be restored by a projection.",
      {
        requires_user_judgment: true,
        requires_fresh_snapshot: type === "perspective_delta" || type === "memory_delta",
      },
    );
  }

  return buildMergePolicyForDeltaType(type, {
    requires_user_judgment: status === "needs_review",
    requires_fresh_snapshot: type === "perspective_delta" || type === "memory_delta",
  });
}

function buildMergePolicyForDeltaType(
  type: AugnesDeltaType,
  options: ProjectionMergePolicyOptions = {},
): DeltaMergePolicy {
  if (type === "perspective_delta") {
    return buildManualProjectionMergePolicy({
      ...options,
      mode: "review_required_for_project_perspective",
      requires_user_judgment: true,
      requires_fresh_snapshot: true,
    });
  }

  if (type === "memory_delta") {
    return buildManualProjectionMergePolicy({
      ...options,
      mode: "review_required_for_durable_memory",
      requires_user_judgment: true,
      requires_fresh_snapshot: true,
    });
  }

  return buildManualProjectionMergePolicy(options);
}

function buildProjectionMergePolicy(
  options: ProjectionMergePolicyOptions,
): DeltaMergePolicy {
  return {
    mode: options.mode ?? "manual_review_required",
    target_scope: options.target_scope ?? PROJECTION_TARGET_SCOPE,
    allowed_auto_apply: false,
    requires_user_judgment: options.requires_user_judgment ?? true,
    requires_fresh_snapshot: options.requires_fresh_snapshot ?? false,
    requires_validation: options.requires_validation ?? false,
    durable_memory_allowed: false,
    project_perspective_allowed: false,
    external_side_effect_allowed: false,
    blocked_reason: options.blocked_reason ?? PHASE_2_BLOCKED_REASON,
  };
}

function buildPointerValidationSummary(
  sourceKind: string,
  sourceRef: string,
): AugnesDeltaValidationSummary {
  return {
    validation_status: "not_run",
    required_checks: [],
    completed_checks: [],
    failed_checks: [],
    skipped_checks: [
      {
        check: `${sourceKind}_runtime_validation`,
        reason:
          "Phase 2A projection is pointer-only and does not run source validation.",
      },
    ],
    notes: [`Validation summary source pointer: ${sourceRef}`],
  };
}

function mapStateDeltaProposalType(
  proposal: AugnesDeltaProjectionStateDeltaProposalInput,
): AugnesDeltaType {
  const semanticText = normalizeToken(
    [proposal.state_key, proposal.change_type, proposal.temporal_scope].join(" "),
  );

  if (semanticText.includes("memory")) {
    return "memory_delta";
  }

  if (
    semanticText.includes("perspective") ||
    semanticText.includes("project") ||
    semanticText.includes("state")
  ) {
    return "perspective_delta";
  }

  return "coordination_delta";
}

function mapStateDeltaProposalStatus(
  status: AugnesDeltaProjectionStateDeltaProposalInput["status"],
): AugnesDeltaStatus {
  switch (status) {
    case "pending":
      return "needs_review";
    case "committed":
      return "approved";
    case "rejected":
      return "rejected";
    default:
      return "draft";
  }
}

function mapWorkEventType(eventType: string | null | undefined): AugnesDeltaType {
  switch (eventType) {
    case "implementation":
      return "code_delta";
    case "verification":
      return "validation_delta";
    case "review":
      return "user_decision_delta";
    case "handoff":
      return "handoff_delta";
    case "decision":
      return "user_decision_delta";
    case "blocked":
      return "coordination_delta";
    default:
      return "coordination_delta";
  }
}

function mapWorkEventStatus(status: string | null | undefined): AugnesDeltaStatus {
  switch (status) {
    case "failed":
    case "blocked":
    case "partial":
    case "needs_review":
      return "needs_review";
    case "completed":
      return "draft";
    default:
      return "draft";
  }
}

function mapCoordinationEventType(
  eventType: string | null | undefined,
): AugnesDeltaType {
  if (
    eventType === "handoff_created" ||
    eventType === "handoff_ready" ||
    eventType === "handoff_delivered" ||
    eventType === "handoff_acknowledged"
  ) {
    return "handoff_delta";
  }

  if (eventType === "action_result_recorded") {
    return "validation_delta";
  }

  if (eventType === "result_review_created") {
    return "validation_delta";
  }

  if (eventType?.startsWith("publication_")) {
    return "artifact_delta";
  }

  return "coordination_delta";
}

function mapCoordinationEventStatus(
  resultStatus: string | null | undefined,
): AugnesDeltaStatus {
  switch (resultStatus) {
    case "failed":
    case "blocked":
    case "partial":
    case "needs_review":
      return "needs_review";
    default:
      return "draft";
  }
}

function mapEvidenceVerifiedStatus(
  status: string | null | undefined,
): EvidenceRef["verified_status"] {
  switch (status) {
    case "passed":
    case "verified":
    case "completed":
      return "verified";
    case "partial":
      return "partial";
    case "stale":
      return "stale";
    case "skipped":
      return "skipped";
    default:
      return "unverified";
  }
}

function mapDogfoodingRecordType(
  recordKind: string | null | undefined,
): AugnesDeltaType {
  if (recordKind === "dogfooding_review_cue") {
    return "user_decision_delta";
  }

  if (recordKind === "validation" || recordKind === "dogfooding_validation") {
    return "validation_delta";
  }

  if (recordKind === "coordination") {
    return "coordination_delta";
  }

  return "research_delta";
}

function mapCodexResultTraceType(
  resultKind: string | null | undefined,
): AugnesDeltaType {
  const token = normalizeToken(resultKind ?? "");

  if (token.includes("validation") || token.includes("verification")) {
    return "validation_delta";
  }

  if (token.includes("handoff")) {
    return "handoff_delta";
  }

  if (token.includes("code") || token.includes("implementation")) {
    return "code_delta";
  }

  return "coordination_delta";
}

function appendEmptySourceGaps(
  gaps: AugnesDeltaProjectionGap[],
  input: NormalizedProjectionInput,
): void {
  if (input.action_records.length === 0) {
    gaps.push(
      createProjectionGap({
        code: "action_records_not_projected",
        severity: "low",
        source_kind: "action_record",
        summary: "No safe structured ActionRecord inputs were provided.",
      }),
    );
  }

  if (input.evidence_records.length === 0) {
    gaps.push(
      createProjectionGap({
        code: "evidence_records_not_projected",
        severity: "low",
        source_kind: "evidence_record",
        summary: "No safe structured EvidenceRecord inputs were provided.",
      }),
    );
  }

  if (input.dogfooding_records.length === 0) {
    gaps.push(
      createProjectionGap({
        code: "dogfooding_records_not_available",
        severity: "medium",
        source_kind: "dogfooding_record",
        summary: "No safe structured dogfooding source was materialized in Phase 2A.",
      }),
    );
  }

  if (input.handoff_traces.length === 0 && input.codex_result_traces.length === 0) {
    gaps.push(
      createProjectionGap({
        code: "handoff_codex_result_traces_not_available",
        severity: "medium",
        source_kind: "handoff_packet",
        summary:
          "No safe structured handoff or Codex result trace source was materialized in Phase 2A.",
        details: ["The projector does not reconstruct missing result text."],
      }),
    );
  }
}

function buildSourceRefs(
  input: NormalizedProjectionInput,
): AugnesDeltaProjectionSourceRefs {
  return {
    state_delta_proposal_ids: input.state_delta_proposals.map((source) => source.id),
    work_event_ids: input.work_events.map((source) => source.id),
    coordination_event_ids: input.coordination_events.map(
      (source) => source.event_id,
    ),
    action_record_ids: input.action_records.map((source) => source.id),
    evidence_record_ids: input.evidence_records.map((source) => source.evidence_id),
    dogfooding_record_ids: input.dogfooding_records.map(
      (source) => source.record_id,
    ),
    handoff_refs: input.handoff_traces.map((source) => source.handoff_ref),
    codex_result_refs: input.codex_result_traces.map((source) => source.result_ref),
    snapshot_refs: input.snapshot_refs,
    diagnostic_refs: input.diagnostic_refs,
  };
}

function buildSourceCounts(
  input: NormalizedProjectionInput,
  deltas: AugnesDelta[],
  batches: DeltaBatch[],
  gaps: AugnesDeltaProjectionGap[],
): AugnesDeltaProjectionSourceCounts {
  return {
    state_delta_proposals: input.state_delta_proposals.length,
    work_events: input.work_events.length,
    coordination_events: input.coordination_events.length,
    action_records: input.action_records.length,
    evidence_records: input.evidence_records.length,
    dogfooding_records: input.dogfooding_records.length,
    handoff_traces: input.handoff_traces.length,
    codex_result_traces: input.codex_result_traces.length,
    snapshot_refs: input.snapshot_refs.length,
    diagnostic_refs: input.diagnostic_refs.length,
    total_projected_deltas: deltas.length,
    total_batches: batches.length,
    total_gaps: gaps.length,
  };
}

function deriveAsOf(input: NormalizedProjectionInput): string {
  const candidates = [
    ...input.state_delta_proposals.map((source) => source.proposed_at),
    ...input.work_events.map((source) => source.created_at),
    ...input.coordination_events.map((source) => source.created_at),
    ...input.action_records.map(
      (source) => source.completed_at ?? source.created_at,
    ),
    ...input.evidence_records.map((source) => source.created_at),
    ...input.dogfooding_records.map((source) => source.created_at),
    ...input.handoff_traces.map((source) => source.created_at),
    ...input.codex_result_traces.map((source) => source.created_at),
    ...input.snapshot_refs.map((source) => source.created_at),
  ].filter((value): value is string => Boolean(value));

  return candidates.sort().at(-1) ?? FALLBACK_AS_OF;
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9._:-]+/g, "_");
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_:-]+/g, " ");
}

function compact(values: Array<string | null | undefined>): string[] {
  return values.filter((value): value is string => Boolean(value));
}
