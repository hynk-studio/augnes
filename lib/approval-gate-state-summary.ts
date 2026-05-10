import {
  listPublicationApprovalRequests,
  type ApprovalRequestStatus,
  type PublicationApprovalRequest,
} from "@/lib/publication-approval-requests";
import {
  getPublication,
  listDeliveries,
  type DeliveryRecord,
  type PublicationDraft,
} from "@/lib/publications";
import { normalizeScope } from "@/lib/work";

const DEFAULT_GATE_STATE_LIMIT = 50;
const MAX_GATE_STATE_LIMIT = 200;
const DELIVERY_LOOKBACK_LIMIT = 200;

export type ApprovalGateState =
  | "ready_for_future_approval_review"
  | "blocked_missing_publication"
  | "blocked_target_mismatch"
  | "blocked_already_sent"
  | "blocked_cancelled_publication"
  | "blocked_existing_sent_delivery"
  | "needs_failure_review"
  | "inactive_request"
  | "blocked_or_not_ready";

export type ApprovalGateStateItem = {
  approval_request_id: string;
  publication_id: string;
  work_id: string | null;
  target_surface: string;
  target_ref: string;
  status: string;
  requested_by: string;
  requested_at: string;
  decision_prompt: string;
  side_effect_summary: string;
  required_gate_checks: string[];
  authority_boundaries: string[];
  publication_status: string | null;
  publication_target_match: boolean;
  latest_delivery_status: string | null;
  latest_delivery_id: string | null;
  latest_delivery_error: string | null;
  gate_state: ApprovalGateState;
  gate_reasons: string[];
  safe_next_step: string;
  source_refs: {
    approval_request_id: string;
    publication_id: string;
    latest_delivery_id: string | null;
  };
};

export type ApprovalGateStateSummaryResult = {
  scope: string;
  as_of: string;
  summary: {
    requested: ApprovalGateStateItem[];
    blocked_or_not_ready: ApprovalGateStateItem[];
    ready_for_future_approval_review: ApprovalGateStateItem[];
    stale_or_mismatched: ApprovalGateStateItem[];
    terminal_or_inactive: {
      superseded_count: number;
      cancelled_count: number;
      expired_count: number;
    };
  };
  counts: {
    requested_count: number;
    blocked_count: number;
    ready_for_review_count: number;
    superseded_count: number;
    cancelled_count: number;
    expired_count: number;
  };
  limits: {
    bounded_view: true;
    approval_request_limit: number;
    delivery_limit: number;
  };
  boundaries: string[];
};

export const APPROVAL_GATE_STATE_BOUNDARIES = [
  "This is a derived read-only gate-state view.",
  "Approval request is not approval grant.",
  "Approval is not publication.",
  "Dry-run is not publication.",
  "Publish execution remains a separate future Core-gated route.",
  "This view does not approve, publish, retry, record proof, update mailbox status, commit or reject state, execute Codex, mutate GitHub, post to Discord, or create delivery rows.",
  "PR #67 remains one target-specific live adapter test only and does not authorize automatic future posting.",
];

export function buildApprovalGateStateSummary({
  scope,
  publicationId,
  status,
  targetSurface,
  limit = DEFAULT_GATE_STATE_LIMIT,
}: {
  scope?: string | null;
  publicationId?: string | null;
  status?: ApprovalRequestStatus | null;
  targetSurface?: string | null;
  limit?: number;
} = {}): ApprovalGateStateSummaryResult {
  const normalizedScope = normalizeScope(scope);
  const normalizedLimit = normalizeLimit(limit);
  const requests = listPublicationApprovalRequests({
    scope: normalizedScope,
    publicationId,
    status,
    targetSurface,
    limit: normalizedLimit,
  });
  const deliveries = listDeliveries({
    scope: normalizedScope,
    limit: DELIVERY_LOOKBACK_LIMIT,
  });
  const latestDeliveriesByPublication = groupLatestDeliveriesByPublication(
    deliveries,
  );
  const items = requests.map((approvalRequest) => {
    const publication = getPublication(
      approvalRequest.publication_id,
      normalizedScope,
    );

    return buildApprovalGateStateItem({
      approvalRequest,
      publication,
      latestDelivery:
        latestDeliveriesByPublication.get(approvalRequest.publication_id) ??
        null,
    });
  });
  const supersededCount = items.filter(
    (item) => item.status === "superseded",
  ).length;
  const cancelledCount = items.filter(
    (item) => item.status === "cancelled",
  ).length;
  const expiredCount = items.filter((item) => item.status === "expired").length;
  const readyItems = items.filter(
    (item) => item.gate_state === "ready_for_future_approval_review",
  );
  const staleOrMismatchedItems = items.filter(
    (item) =>
      item.gate_state === "blocked_missing_publication" ||
      item.gate_state === "blocked_target_mismatch",
  );
  const activeBlockedItems = items.filter(
    (item) =>
      item.status === "requested" &&
      item.gate_state !== "ready_for_future_approval_review",
  );
  const blockedOrNotReadyItems = activeBlockedItems.filter(
    (item) =>
      item.gate_state !== "blocked_missing_publication" &&
      item.gate_state !== "blocked_target_mismatch",
  );

  return {
    scope: normalizedScope,
    as_of: new Date().toISOString(),
    summary: {
      requested: items.filter((item) => item.status === "requested"),
      blocked_or_not_ready: blockedOrNotReadyItems,
      ready_for_future_approval_review: readyItems,
      stale_or_mismatched: staleOrMismatchedItems,
      terminal_or_inactive: {
        superseded_count: supersededCount,
        cancelled_count: cancelledCount,
        expired_count: expiredCount,
      },
    },
    counts: {
      requested_count: items.filter((item) => item.status === "requested")
        .length,
      blocked_count: activeBlockedItems.length,
      ready_for_review_count: readyItems.length,
      superseded_count: supersededCount,
      cancelled_count: cancelledCount,
      expired_count: expiredCount,
    },
    limits: {
      bounded_view: true,
      approval_request_limit: normalizedLimit,
      delivery_limit: DELIVERY_LOOKBACK_LIMIT,
    },
    boundaries: APPROVAL_GATE_STATE_BOUNDARIES,
  };
}

function buildApprovalGateStateItem({
  approvalRequest,
  publication,
  latestDelivery,
}: {
  approvalRequest: PublicationApprovalRequest;
  publication: PublicationDraft | null;
  latestDelivery: DeliveryRecord | null;
}): ApprovalGateStateItem {
  const targetMatches =
    !!publication &&
    publication.target_surface === approvalRequest.target_surface &&
    publication.target_ref === approvalRequest.target_ref;
  const gate = getGateState({
    approvalRequest,
    publication,
    latestDelivery,
    targetMatches,
  });

  return {
    approval_request_id: approvalRequest.approval_request_id,
    publication_id: approvalRequest.publication_id,
    work_id: approvalRequest.work_id,
    target_surface: approvalRequest.target_surface,
    target_ref: approvalRequest.target_ref,
    status: approvalRequest.status,
    requested_by: approvalRequest.requested_by,
    requested_at: approvalRequest.requested_at,
    decision_prompt: approvalRequest.decision_prompt,
    side_effect_summary: approvalRequest.side_effect_summary,
    required_gate_checks: approvalRequest.required_gate_checks,
    authority_boundaries: approvalRequest.authority_boundaries,
    publication_status: publication?.status ?? null,
    publication_target_match: targetMatches,
    latest_delivery_status: latestDelivery?.status ?? null,
    latest_delivery_id: latestDelivery?.delivery_id ?? null,
    latest_delivery_error: latestDelivery?.error_message ?? null,
    gate_state: gate.gate_state,
    gate_reasons: gate.gate_reasons,
    safe_next_step: gate.safe_next_step,
    source_refs: {
      approval_request_id: approvalRequest.approval_request_id,
      publication_id: approvalRequest.publication_id,
      latest_delivery_id: latestDelivery?.delivery_id ?? null,
    },
  };
}

function getGateState({
  approvalRequest,
  publication,
  latestDelivery,
  targetMatches,
}: {
  approvalRequest: PublicationApprovalRequest;
  publication: PublicationDraft | null;
  latestDelivery: DeliveryRecord | null;
  targetMatches: boolean;
}): {
  gate_state: ApprovalGateState;
  gate_reasons: string[];
  safe_next_step: string;
} {
  if (approvalRequest.status !== "requested") {
    return {
      gate_state: "inactive_request",
      gate_reasons: [
        `approval request status is ${approvalRequest.status}`,
        "inactive requests are visible for audit context only",
      ],
      safe_next_step:
        "No approval action is available from this read-only view.",
    };
  }

  if (!publication) {
    return {
      gate_state: "blocked_missing_publication",
      gate_reasons: ["referenced publication is missing"],
      safe_next_step:
        "Review the request record and publication lineage before any future approval slice.",
    };
  }

  if (!targetMatches) {
    return {
      gate_state: "blocked_target_mismatch",
      gate_reasons: [
        "approval request target_surface or target_ref differs from the stored publication",
      ],
      safe_next_step:
        "Resolve the target mismatch in a separate Core-gated workflow before any approval grant.",
    };
  }

  if (publication.status === "sent") {
    return {
      gate_state: "blocked_already_sent",
      gate_reasons: ["publication status is sent"],
      safe_next_step:
        "Review existing publication evidence; replay must not duplicate external side effects.",
    };
  }

  if (publication.status === "cancelled") {
    return {
      gate_state: "blocked_cancelled_publication",
      gate_reasons: ["publication status is cancelled"],
      safe_next_step:
        "Create a new approval request only through a future explicit Core-gated slice if needed.",
    };
  }

  if (latestDelivery?.status === "sent") {
    return {
      gate_state: "blocked_existing_sent_delivery",
      gate_reasons: ["latest delivery status is sent"],
      safe_next_step:
        "Review the delivery ledger; future replay must return the existing delivery without posting.",
    };
  }

  if (latestDelivery?.status === "failed") {
    return {
      gate_state: "needs_failure_review",
      gate_reasons: ["latest delivery status is failed"],
      safe_next_step:
        "Review the failed delivery before any separate, idempotency-aware retry design.",
    };
  }

  if (publication.status === "draft" || publication.status === "approved") {
    return {
      gate_state: "ready_for_future_approval_review",
      gate_reasons: [
        "approval request is requested",
        "publication exists",
        "target_surface and target_ref match the stored publication",
        "no sent delivery is visible in the bounded delivery ledger",
      ],
      safe_next_step:
        "Review request; future approval grant must be separate and Core-gated.",
    };
  }

  return {
    gate_state: "blocked_or_not_ready",
    gate_reasons: [`publication status is ${publication.status}`],
    safe_next_step:
      "Review this derived state before proposing any future approval workflow.",
  };
}

function groupLatestDeliveriesByPublication(deliveries: DeliveryRecord[]) {
  const grouped = new Map<string, DeliveryRecord>();

  for (const delivery of deliveries) {
    if (!grouped.has(delivery.publication_id)) {
      grouped.set(delivery.publication_id, delivery);
    }
  }

  return grouped;
}

function normalizeLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_GATE_STATE_LIMIT;
  }

  return Math.min(MAX_GATE_STATE_LIMIT, Math.max(1, Math.floor(limit)));
}
