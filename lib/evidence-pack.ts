import { listCoordinationEvents } from "@/lib/coordination-events";
import {
  CORE_GATED_PUBLISH_BOUNDARIES,
  CORE_GATED_PUBLISH_GATE_CHECKS,
} from "@/lib/core-gated-publish";
import { listActionRecords, type ActionRecord } from "@/lib/db";
import {
  listEvidenceRecords,
  type EvidenceRecord,
} from "@/lib/evidence-records";
import {
  listPublicationApprovalDecisions,
  type PublicationApprovalDecision,
} from "@/lib/publication-approval-decisions";
import {
  listPublicationApprovalRequests,
  type PublicationApprovalRequest,
} from "@/lib/publication-approval-requests";
import {
  listPublicationReadinessChecks,
  type PublicationReadinessCheck,
} from "@/lib/publication-readiness-checks";
import {
  getDelivery,
  getPublication,
  listDeliveries,
  listPublications,
  type DeliveryRecord,
  type PublicationDraft,
} from "@/lib/publications";
import { listSessionRefs, type SessionRef } from "@/lib/session-binding";
import { buildStateBrief } from "@/lib/state/brief";
import {
  getWorkItem,
  listWorkEvents,
  listWorkItems,
  normalizeScope,
  normalizeWorkId,
  type WorkEvent,
  type WorkItem,
} from "@/lib/work";

const PACK_VERSION = "v0.1";
const RECENT_EVENT_LIMIT = 8;
const LOOKBACK_LIMIT = 200;
const PREVIEW_EXCERPT_LIMIT = 320;

export type EvidencePackSelectionMode =
  | "latest"
  | "by_work_id"
  | "by_publication_id"
  | "by_delivery_id"
  | "by_target_ref";

export type EvidencePackFilters = {
  scope?: string | null;
  work_id?: string | null;
  publication_id?: string | null;
  delivery_id?: string | null;
  target_ref?: string | null;
};

export type EvidencePack = {
  runtime: "augnes";
  scope: string;
  generated_at: string;
  evidence_pack_version: typeof PACK_VERSION;
  selection: {
    mode: EvidencePackSelectionMode;
    work_id: string | null;
    publication_id: string | null;
    delivery_id: string | null;
    target_ref: string | null;
    selection_reason: string;
  };
  work_trace: {
    work_id: string | null;
    title: string | null;
    status: string | null;
    summary: string | null;
    next_action: string | null;
    recent_events: WorkEvent[];
  };
  publication_trace: {
    publication_id: string | null;
    status: string | null;
    target_surface: string | null;
    target_ref: string | null;
    preview_excerpt: string | null;
    created_by: string | null;
    approved_by: string | null;
    created_at: string | null;
    updated_at: string | null;
    sent_at: string | null;
  };
  approval_trace: {
    approval_request_id: string | null;
    approval_request_status: string | null;
    approval_decision_id: string | null;
    approval_decision: string | null;
    decided_by: string | null;
    decided_at: string | null;
  };
  readiness_trace: {
    readiness_check_id: string | null;
    status: string | null;
    dry_run: boolean | null;
    checked_by: string | null;
    checked_at: string | null;
    blocked_reasons: string[];
    gate_checks: string[];
  };
  delivery_trace: {
    delivery_id: string | null;
    status: string | null;
    target_surface: string | null;
    target_ref: string | null;
    idempotency_key_present: boolean;
    sent_at: string | null;
    acknowledged_at: string | null;
    error_message: string | null;
    external_artifact_id: string | null;
    external_artifact_url: string | null;
    external_artifact_type: string | null;
  };
  external_artifact_trace: {
    available: boolean;
    source_delivery_id: string | null;
    external_artifact_id: string | null;
    external_artifact_url: string | null;
    external_artifact_type: string | null;
  };
  replay_trace: {
    same_key_replay_supported: boolean;
    same_key_replay_observed: boolean | null;
    duplicate_block_observed: boolean | null;
    notes: string[];
  };
  verification_trace: {
    commands_run: Array<Record<string, unknown>>;
    checks_passed: Array<Record<string, unknown>>;
    skipped_checks: Array<Record<string, unknown>>;
    source_refs: string[];
  };
  session_trace: {
    session_refs: SessionRef[];
    note: string;
  };
  authority_trace: {
    allowed_now: string[];
    blocked_now: string[];
    boundaries: string[];
    non_authority_statement: string;
  };
  temporal_preview_trace: {
    available: boolean;
    generator: string | null;
    model: string | null;
    guardrails_passed: boolean | null;
    transition_relation: string | null;
    current_interpretation_excerpt: string | null;
    safe_next_step: string | null;
    non_authority_boundary: string | null;
  };
  gaps: string[];
  next_suggested_goal: string | null;
};

type EvidenceContext = {
  mode: EvidencePackSelectionMode;
  normalizedScope: string;
  work: WorkItem | null;
  publication: PublicationDraft | null;
  delivery: DeliveryRecord | null;
  targetRef: string | null;
  selectionReason: string;
};

export class EvidencePackNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidencePackNotFoundError";
  }
}

export function buildEvidencePack(filters: EvidencePackFilters = {}): EvidencePack {
  const normalizedScope = normalizeScope(filters.scope);
  const context = resolveEvidenceContext(filters, normalizedScope);
  const workId =
    context.work?.work_id ?? context.publication?.work_id ?? null;
  const work = context.work ?? (workId ? getWorkItem(workId, normalizedScope) : null);
  const publication = context.publication;
  const delivery = context.delivery;
  const recentEvents = work
    ? listWorkEvents({
        workId: work.work_id,
        scope: normalizedScope,
        limit: RECENT_EVENT_LIMIT,
      })
    : [];
  const approvalRequest = selectApprovalRequest({
    scope: normalizedScope,
    publication,
  });
  const approvalDecision = selectApprovalDecision({
    scope: normalizedScope,
    publication,
    approvalRequest,
  });
  const readinessCheck = selectReadinessCheck({
    scope: normalizedScope,
    publication,
    approvalDecision,
  });
  const evidenceRecords = selectEvidenceRecordsForContext({
    scope: normalizedScope,
    work,
    publication,
    delivery,
    targetRef: context.targetRef,
  });
  const sessionRefs = listSessionRefs({
    scope: normalizedScope,
    work_id: work?.work_id ?? publication?.work_id ?? null,
    related_pr:
      context.targetRef ??
      delivery?.target_ref ??
      publication?.target_ref ??
      null,
    limit: 20,
  });
  const stateBrief = buildStateBrief(normalizedScope);
  const gaps = collectGaps({
    work,
    publication,
    delivery,
    approvalRequest,
    approvalDecision,
    readinessCheck,
    evidenceRecords,
  });

  return {
    runtime: "augnes",
    scope: normalizedScope,
    generated_at: new Date().toISOString(),
    evidence_pack_version: PACK_VERSION,
    selection: {
      mode: context.mode,
      work_id: work?.work_id ?? publication?.work_id ?? null,
      publication_id: publication?.publication_id ?? delivery?.publication_id ?? null,
      delivery_id: delivery?.delivery_id ?? null,
      target_ref:
        context.targetRef ??
        delivery?.target_ref ??
        publication?.target_ref ??
        null,
      selection_reason: context.selectionReason,
    },
    work_trace: {
      work_id: work?.work_id ?? publication?.work_id ?? null,
      title: work?.title ?? null,
      status: work?.status ?? null,
      summary: work?.summary ?? null,
      next_action: work?.next_action ?? null,
      recent_events: recentEvents,
    },
    publication_trace: {
      publication_id: publication?.publication_id ?? null,
      status: publication?.status ?? null,
      target_surface: publication?.target_surface ?? null,
      target_ref: publication?.target_ref ?? null,
      preview_excerpt: publication ? excerpt(publication.preview_body) : null,
      created_by: publication?.created_by ?? null,
      approved_by: publication?.approved_by ?? null,
      created_at: publication?.created_at ?? null,
      updated_at: publication?.updated_at ?? null,
      sent_at: publication?.sent_at ?? null,
    },
    approval_trace: {
      approval_request_id: approvalRequest?.approval_request_id ?? null,
      approval_request_status: approvalRequest?.status ?? null,
      approval_decision_id: approvalDecision?.approval_decision_id ?? null,
      approval_decision: approvalDecision?.decision ?? null,
      decided_by: approvalDecision?.decided_by ?? null,
      decided_at: approvalDecision?.decided_at ?? null,
    },
    readiness_trace: {
      readiness_check_id: readinessCheck?.readiness_check_id ?? null,
      status: readinessCheck?.status ?? null,
      dry_run: readinessCheck?.dry_run ?? null,
      checked_by: readinessCheck?.checked_by ?? null,
      checked_at: readinessCheck?.checked_at ?? null,
      blocked_reasons: readinessCheck?.blocked_reasons ?? [],
      gate_checks: readinessCheck?.gate_checks ?? [],
    },
    delivery_trace: {
      delivery_id: delivery?.delivery_id ?? null,
      status: delivery?.status ?? null,
      target_surface: delivery?.target_surface ?? null,
      target_ref: delivery?.target_ref ?? null,
      idempotency_key_present: Boolean(delivery?.idempotency_key),
      sent_at: delivery?.sent_at ?? null,
      acknowledged_at: delivery?.acknowledged_at ?? null,
      error_message: delivery?.error_message ?? null,
      external_artifact_id: delivery?.external_artifact_id ?? null,
      external_artifact_url: delivery?.external_artifact_url ?? null,
      external_artifact_type: delivery?.external_artifact_type ?? null,
    },
    external_artifact_trace: {
      available: Boolean(
        delivery?.external_artifact_id ||
          delivery?.external_artifact_url ||
          delivery?.external_artifact_type,
      ),
      source_delivery_id: delivery?.delivery_id ?? null,
      external_artifact_id: delivery?.external_artifact_id ?? null,
      external_artifact_url: delivery?.external_artifact_url ?? null,
      external_artifact_type: delivery?.external_artifact_type ?? null,
    },
    replay_trace: buildReplayTrace(delivery, evidenceRecords),
    verification_trace: buildVerificationTrace({
      scope: normalizedScope,
      work,
      recentEvents,
      publication,
      delivery,
      evidenceRecords,
    }),
    session_trace: {
      session_refs: sessionRefs,
      note:
        "Session refs are binding metadata only; Evidence Pack does not create, bind, or expand sessions.",
    },
    authority_trace: {
      allowed_now: [
        "Read this derived Evidence Pack.",
        "Inspect linked Core records in existing read-only routes.",
        "Use gaps to decide the next explicit user/PM-scoped action.",
      ],
      blocked_now: [
        "approve publication",
        "publish or replay delivery",
        "call GitHub",
        "call OpenAI",
        "record proof",
        "commit or reject state",
        "mutate mailbox",
        "execute Codex",
      ],
      boundaries: [
        "Evidence Pack v0.1 is a derived read-only review artifact.",
        ...CORE_GATED_PUBLISH_BOUNDARIES,
        ...CORE_GATED_PUBLISH_GATE_CHECKS.map((check) => `Gate check: ${check}`),
      ],
      non_authority_statement:
        "This Evidence Pack summarizes existing Core records and gaps; it is not approval, publication, proof recording, state approval, or broad correctness evidence.",
    },
    temporal_preview_trace: {
      available: false,
      generator: null,
      model: null,
      guardrails_passed: null,
      transition_relation: null,
      current_interpretation_excerpt: null,
      safe_next_step: null,
      non_authority_boundary:
        "Evidence Pack v0.1 does not invoke Temporal Preview or OpenAI. Use /api/temporal-interpretation/preview separately when explicitly requested.",
    },
    gaps,
    next_suggested_goal:
      stateBrief.agent_handoff.next_recommended_action.title ?? null,
  };
}

function resolveEvidenceContext(
  filters: EvidencePackFilters,
  normalizedScope: string,
): EvidenceContext {
  const deliveryId = clean(filters.delivery_id);
  const publicationId = clean(filters.publication_id);
  const workId = clean(filters.work_id);
  const targetRef = clean(filters.target_ref);
  const suppliedFilters = [
    deliveryId ? "delivery_id" : null,
    publicationId ? "publication_id" : null,
    workId ? "work_id" : null,
    targetRef ? "target_ref" : null,
  ].filter(Boolean);
  const multiFilterNote =
    suppliedFilters.length > 1
      ? ` Multiple filters were supplied; selection priority is delivery_id, publication_id, work_id, target_ref.`
      : "";

  if (deliveryId) {
    const delivery = getDelivery(deliveryId, normalizedScope);
    if (!delivery) {
      throw new EvidencePackNotFoundError(
        `Unknown delivery_id ${deliveryId} for scope ${normalizedScope}.`,
      );
    }

    const publication = getPublication(delivery.publication_id, normalizedScope);
    return {
      mode: "by_delivery_id",
      normalizedScope,
      delivery,
      publication,
      work: publication?.work_id
        ? getWorkItem(publication.work_id, normalizedScope)
        : null,
      targetRef: delivery.target_ref,
      selectionReason: `Selected requested delivery_id ${delivery.delivery_id}.${multiFilterNote}`,
    };
  }

  if (publicationId) {
    const publication = getPublication(publicationId, normalizedScope);
    if (!publication) {
      throw new EvidencePackNotFoundError(
        `Unknown publication_id ${publicationId} for scope ${normalizedScope}.`,
      );
    }

    return {
      mode: "by_publication_id",
      normalizedScope,
      publication,
      delivery: selectLatestDeliveryForPublication(
        normalizedScope,
        publication.publication_id,
      ),
      work: publication.work_id
        ? getWorkItem(publication.work_id, normalizedScope)
        : null,
      targetRef: publication.target_ref,
      selectionReason: `Selected requested publication_id ${publication.publication_id}.${multiFilterNote}`,
    };
  }

  if (workId) {
    const normalizedWorkId = normalizeWorkId(workId);
    const work = getWorkItem(normalizedWorkId, normalizedScope);
    if (!work) {
      throw new EvidencePackNotFoundError(
        `Unknown work_id ${normalizedWorkId} for scope ${normalizedScope}.`,
      );
    }

    const publication = listPublications({
      scope: normalizedScope,
      workId: normalizedWorkId,
      limit: LOOKBACK_LIMIT,
    })[0] ?? null;

    return {
      mode: "by_work_id",
      normalizedScope,
      work,
      publication,
      delivery: publication
        ? selectLatestDeliveryForPublication(
            normalizedScope,
            publication.publication_id,
          )
        : null,
      targetRef: publication?.target_ref ?? null,
      selectionReason: publication
        ? `Selected latest publication for requested work_id ${normalizedWorkId}.${multiFilterNote}`
        : `Selected requested work_id ${normalizedWorkId}; no publication exists for this work in the bounded read.${multiFilterNote}`,
    };
  }

  if (targetRef) {
    const delivery = selectLatestDeliveryForTargetRef(normalizedScope, targetRef);
    const selectedPublication = delivery
      ? getPublication(delivery.publication_id, normalizedScope)
      : selectLatestPublicationForTargetRef(normalizedScope, targetRef);
    if (!selectedPublication && !delivery) {
      throw new EvidencePackNotFoundError(
        `No publication or delivery found for target_ref ${targetRef} in scope ${normalizedScope}.`,
      );
    }

    return {
      mode: "by_target_ref",
      normalizedScope,
      publication: selectedPublication,
      delivery:
        delivery ??
        (selectedPublication
          ? selectLatestDeliveryForPublication(
              normalizedScope,
              selectedPublication.publication_id,
            )
          : null),
      work: selectedPublication?.work_id
        ? getWorkItem(selectedPublication.work_id, normalizedScope)
        : null,
      targetRef,
      selectionReason: `Selected latest publication/delivery matching target_ref ${targetRef}.${multiFilterNote}`,
    };
  }

  return selectLatestContext(normalizedScope);
}

function selectLatestContext(normalizedScope: string): EvidenceContext {
  const latestDelivery =
    sortDeliveries(
      listDeliveries({
        scope: normalizedScope,
        limit: LOOKBACK_LIMIT,
      }),
    )[0] ?? null;
  if (latestDelivery) {
    const publication = getPublication(latestDelivery.publication_id, normalizedScope);
    return {
      mode: "latest",
      normalizedScope,
      delivery: latestDelivery,
      publication,
      work: publication?.work_id
        ? getWorkItem(publication.work_id, normalizedScope)
        : null,
      targetRef: latestDelivery.target_ref,
      selectionReason:
        "No filter supplied; selected the most recent delivery by updated_at, created_at, then delivery_id.",
    };
  }

  const latestPublication =
    listPublications({
      scope: normalizedScope,
      limit: LOOKBACK_LIMIT,
    })[0] ?? null;
  if (latestPublication) {
    return {
      mode: "latest",
      normalizedScope,
      delivery: null,
      publication: latestPublication,
      work: latestPublication.work_id
        ? getWorkItem(latestPublication.work_id, normalizedScope)
        : null,
      targetRef: latestPublication.target_ref,
      selectionReason:
        "No filter supplied and no delivery rows exist; selected the latest publication by created_at then publication_id.",
    };
  }

  const latestWork = listWorkItems(normalizedScope)[0] ?? null;
  return {
    mode: "latest",
    normalizedScope,
    delivery: null,
    publication: null,
    work: latestWork,
    targetRef: null,
    selectionReason: latestWork
      ? "No publication or delivery rows exist; selected the first deterministic work item from the work list."
      : "No work, publication, or delivery records exist for this scope.",
  };
}

function selectLatestPublicationForTargetRef(scope: string, targetRef: string) {
  return listPublications({
    scope,
    limit: LOOKBACK_LIMIT,
  }).find((publication) => publication.target_ref === targetRef) ?? null;
}

function selectLatestDeliveryForTargetRef(scope: string, targetRef: string) {
  return (
    sortDeliveries(
      listDeliveries({
        scope,
        limit: LOOKBACK_LIMIT,
      }).filter((delivery) => delivery.target_ref === targetRef),
    )[0] ?? null
  );
}

function selectLatestDeliveryForPublication(scope: string, publicationId: string) {
  return (
    sortDeliveries(
      listDeliveries({
        scope,
        publicationId,
        limit: LOOKBACK_LIMIT,
      }),
    )[0] ?? null
  );
}

function selectApprovalRequest({
  scope,
  publication,
}: {
  scope: string;
  publication: PublicationDraft | null;
}) {
  if (!publication) {
    return null;
  }

  return (
    listPublicationApprovalRequests({
      scope,
      publicationId: publication.publication_id,
      limit: LOOKBACK_LIMIT,
    })[0] ?? null
  );
}

function selectApprovalDecision({
  scope,
  publication,
  approvalRequest,
}: {
  scope: string;
  publication: PublicationDraft | null;
  approvalRequest: PublicationApprovalRequest | null;
}) {
  if (!publication) {
    return null;
  }

  const decisions = listPublicationApprovalDecisions({
    scope,
    publicationId: publication.publication_id,
    limit: LOOKBACK_LIMIT,
  });
  if (!approvalRequest) {
    return decisions[0] ?? null;
  }

  return (
    decisions.find(
      (decision) =>
        decision.approval_request_id === approvalRequest.approval_request_id,
    ) ??
    decisions[0] ??
    null
  );
}

function selectReadinessCheck({
  scope,
  publication,
  approvalDecision,
}: {
  scope: string;
  publication: PublicationDraft | null;
  approvalDecision: PublicationApprovalDecision | null;
}) {
  if (!publication) {
    return null;
  }

  const checks = listPublicationReadinessChecks({
    scope,
    publicationId: publication.publication_id,
    limit: LOOKBACK_LIMIT,
  });
  if (!approvalDecision) {
    return checks[0] ?? null;
  }

  return (
    checks.find(
      (check) =>
        check.approval_decision_id === approvalDecision.approval_decision_id,
    ) ??
    checks[0] ??
    null
  );
}

function buildReplayTrace(
  delivery: DeliveryRecord | null,
  evidenceRecords: EvidenceRecord[],
) {
  const sameKeyReplaySupported = Boolean(
    delivery?.idempotency_key &&
      (delivery.status === "sent" || delivery.status === "acknowledged"),
  );
  const replayRecords = evidenceRecords.filter(
    (record) => record.evidence_kind === "replay_observed",
  );
  const duplicateBlockRecords = evidenceRecords.filter(
    (record) => record.evidence_kind === "duplicate_block_observed",
  );

  return {
    same_key_replay_supported: sameKeyReplaySupported,
    same_key_replay_observed: replayRecords.length ? true : null,
    duplicate_block_observed: duplicateBlockRecords.length ? true : null,
    notes: [
      "Evidence Pack does not execute replay, publish, or adapter calls.",
      sameKeyReplaySupported
        ? "Replay support is inferred from a sent/acknowledged delivery with an idempotency_key; no replay action was executed by this endpoint."
        : "No sent/acknowledged delivery with an idempotency_key was selected, so same-key replay support is not inferred for this pack.",
      replayRecords.length
        ? `Replay observation records: ${replayRecords.map((record) => record.evidence_id).join(", ")}.`
        : "Same-key replay is not marked observed unless an explicit stored verification record says so.",
      duplicateBlockRecords.length
        ? `Duplicate-block observation records: ${duplicateBlockRecords.map((record) => record.evidence_id).join(", ")}.`
        : "Different-key duplicate blocking is not marked observed unless an explicit stored verification record says so.",
    ],
  };
}

function buildVerificationTrace({
  scope,
  work,
  recentEvents,
  publication,
  delivery,
  evidenceRecords,
}: {
  scope: string;
  work: WorkItem | null;
  recentEvents: WorkEvent[];
  publication: PublicationDraft | null;
  delivery: DeliveryRecord | null;
  evidenceRecords: EvidenceRecord[];
}) {
  const actionRecords = selectActionRecords(scope, recentEvents);
  const verificationEvents = recentEvents.filter(isVerificationEvent);
  const commandRecords = evidenceRecords.filter(
    (record) => record.evidence_kind === "command_run",
  );
  const checkPassedRecords = evidenceRecords.filter(
    (record) => record.evidence_kind === "check_passed",
  );
  const skippedCheckRecords = evidenceRecords.filter(
    (record) => record.evidence_kind === "check_skipped",
  );
  const checksPassed = [
    ...checkPassedRecords.map(formatEvidenceRecordForTrace),
    ...verificationEvents
      .filter((event) => isPassedStatus(event.result_status))
      .map((event) => ({
        source: "work_events",
        id: event.id,
        result_status: event.result_status,
        result_kind: event.result_kind,
        summary: event.summary,
      })),
    ...actionRecords
      .filter((record) => isPassedStatus(record.status))
      .map((record) => ({
        source: "action_records",
        id: record.id,
        status: record.status,
        title: record.title,
      })),
  ];

  return {
    commands_run: commandRecords.map(formatEvidenceRecordForTrace),
    checks_passed: checksPassed,
    skipped_checks: [
      ...skippedCheckRecords.map(formatEvidenceRecordForTrace),
      ...verificationEvents
        .filter((event) => isSkippedStatus(event.result_status))
        .map((event) => ({
          source: "work_events",
          id: event.id,
          result_status: event.result_status,
          summary: event.summary,
        })),
    ],
    source_refs: [
      "docs/VERIFICATION_EVIDENCE_PACK.md",
      "docs/AUGNES_CORE_GATED_APPROVE_PUBLISH_WORKFLOW.md",
      "docs/AUTHORITY_MATRIX.md",
      "docs/EXECUTION_SURFACE_RECORD.md",
      "apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md",
      ...(work ? [`work:${work.work_id}`] : []),
      ...(publication ? [`publication:${publication.publication_id}`] : []),
      ...(delivery ? [`delivery:${delivery.delivery_id}`] : []),
      ...evidenceRecords.map((record) => `evidence:${record.evidence_id}`),
      ...evidenceRecords
        .map((record) => record.source_ref)
        .filter((ref): ref is string => Boolean(ref)),
      ...recentEvents.map((event) => `work_event:${event.id}`),
      ...actionRecords.map((record) => `action_record:${record.id}`),
      ...listCoordinationEvents({
        scope,
        workId: work?.work_id ?? undefined,
        limit: 5,
      }).map((event) => `coordination_event:${event.event_id}`),
    ],
  };
}

function collectGaps({
  work,
  publication,
  delivery,
  approvalRequest,
  approvalDecision,
  readinessCheck,
  evidenceRecords,
}: {
  work: WorkItem | null;
  publication: PublicationDraft | null;
  delivery: DeliveryRecord | null;
  approvalRequest: PublicationApprovalRequest | null;
  approvalDecision: PublicationApprovalDecision | null;
  readinessCheck: PublicationReadinessCheck | null;
  evidenceRecords: EvidenceRecord[];
}) {
  const gaps: string[] = ["Temporal Preview is not invoked by Evidence Pack v0.1"];

  if (!evidenceRecords.some((record) => record.evidence_kind === "command_run")) {
    gaps.push("commands_run are not yet persisted as structured Core records");
  }
  if (!evidenceRecords.some((record) => record.evidence_kind === "check_skipped")) {
    gaps.push("skipped_checks are not yet fully structured in Core records");
  }
  if (!evidenceRecords.some((record) => record.evidence_kind === "replay_observed")) {
    gaps.push("same-key replay observations are not persisted as first-class Core records");
  }
  if (
    !evidenceRecords.some(
      (record) => record.evidence_kind === "duplicate_block_observed",
    )
  ) {
    gaps.push("duplicate-block observations are not persisted as first-class Core records");
  }

  if (!work) {
    gaps.push("No linked work trace was found for the selected evidence");
  }
  if (!publication) {
    gaps.push("No publication trace was found for the selected evidence");
  }
  if (!approvalRequest) {
    gaps.push("No approval request record was found for the selected evidence");
  }
  if (!approvalDecision) {
    gaps.push("No approval decision record was found for the selected evidence");
  }
  if (!readinessCheck) {
    gaps.push("No readiness check record was found for the selected evidence");
  }
  if (!delivery) {
    gaps.push("No delivery ledger row was found for the selected evidence");
  } else if (
    !delivery.external_artifact_id &&
    !delivery.external_artifact_url &&
    !delivery.external_artifact_type
  ) {
    gaps.push("Selected delivery has no external artifact id/url/type recorded");
  }

  return [...new Set(gaps)];
}

function selectEvidenceRecordsForContext({
  scope,
  work,
  publication,
  delivery,
  targetRef,
}: {
  scope: string;
  work: WorkItem | null;
  publication: PublicationDraft | null;
  delivery: DeliveryRecord | null;
  targetRef: string | null;
}) {
  const selectedWorkId = work?.work_id ?? publication?.work_id ?? null;
  const selectedPublicationId =
    publication?.publication_id ?? delivery?.publication_id ?? null;
  const selectedDeliveryId = delivery?.delivery_id ?? null;
  const selectedTargetSurface =
    delivery?.target_surface ?? publication?.target_surface ?? null;
  const selectedTargetRef =
    targetRef ?? delivery?.target_ref ?? publication?.target_ref ?? null;

  return listEvidenceRecords({ scope, limit: LOOKBACK_LIMIT }).filter((record) =>
    isEvidenceRecordForSelection({
      record,
      selectedWorkId,
      selectedPublicationId,
      selectedDeliveryId,
      selectedTargetSurface,
      selectedTargetRef,
    }),
  );
}

function isEvidenceRecordForSelection({
  record,
  selectedWorkId,
  selectedPublicationId,
  selectedDeliveryId,
  selectedTargetSurface,
  selectedTargetRef,
}: {
  record: EvidenceRecord;
  selectedWorkId: string | null;
  selectedPublicationId: string | null;
  selectedDeliveryId: string | null;
  selectedTargetSurface: string | null;
  selectedTargetRef: string | null;
}) {
  const matchesDelivery = Boolean(
    selectedDeliveryId && record.delivery_id === selectedDeliveryId,
  );
  const matchesPublication = Boolean(
    selectedPublicationId && record.publication_id === selectedPublicationId,
  );
  const matchesTarget = Boolean(
    selectedTargetSurface &&
      selectedTargetRef &&
      record.target_surface === selectedTargetSurface &&
      record.target_ref === selectedTargetRef,
  );

  if (
    record.evidence_kind === "replay_observed" ||
    record.evidence_kind === "duplicate_block_observed"
  ) {
    return matchesDelivery || matchesPublication || matchesTarget;
  }

  return (
    matchesDelivery ||
    matchesPublication ||
    Boolean(selectedWorkId && record.work_id === selectedWorkId) ||
    matchesTarget
  );
}

function formatEvidenceRecordForTrace(record: EvidenceRecord) {
  return {
    source: "verification_evidence_records",
    evidence_id: record.evidence_id,
    evidence_kind: record.evidence_kind,
    status: record.status,
    label: record.label,
    command: record.command,
    result_summary: record.result_summary,
    skipped_reason: record.skipped_reason,
    observed_behavior: record.observed_behavior,
    source_surface: record.source_surface,
    source_ref: record.source_ref,
    created_by: record.created_by,
    created_at: record.created_at,
  };
}

function selectActionRecords(scope: string, recentEvents: WorkEvent[]) {
  const relatedActionIds = new Set(
    recentEvents
      .map((event) => event.related_action_id)
      .filter((id): id is string => Boolean(id)),
  );
  const records = listActionRecords(scope);

  if (relatedActionIds.size === 0) {
    return records.filter(isVerificationAction).slice(0, 5);
  }

  return records
    .filter((record) => relatedActionIds.has(record.id) || isVerificationAction(record))
    .slice(0, 8);
}

function isVerificationEvent(event: WorkEvent) {
  return (
    event.event_type === "verification" ||
    event.result_kind === "verification" ||
    event.summary.toLowerCase().includes("verification")
  );
}

function isVerificationAction(record: ActionRecord) {
  const text = [record.title, record.description, record.state_key]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return ["verification", "smoke", "typecheck", "build"].some((keyword) =>
    text.includes(keyword),
  );
}

function isPassedStatus(status: string | null) {
  return Boolean(status && ["completed", "passed", "pass"].includes(status));
}

function isSkippedStatus(status: string | null) {
  return Boolean(status && ["skipped", "blocked", "unavailable"].includes(status));
}

function sortDeliveries(deliveries: DeliveryRecord[]) {
  return [...deliveries].sort((first, second) => {
    const firstTime = Date.parse(first.updated_at || first.created_at || "");
    const secondTime = Date.parse(second.updated_at || second.created_at || "");
    const normalizedFirst = Number.isFinite(firstTime) ? firstTime : 0;
    const normalizedSecond = Number.isFinite(secondTime) ? secondTime : 0;

    return (
      normalizedSecond - normalizedFirst ||
      first.delivery_id.localeCompare(second.delivery_id)
    );
  });
}

function excerpt(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > PREVIEW_EXCERPT_LIMIT
    ? `${normalized.slice(0, PREVIEW_EXCERPT_LIMIT - 3).trimEnd()}...`
    : normalized;
}

function clean(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() || null : null;
}
