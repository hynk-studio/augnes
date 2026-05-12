import {
  GITHUB_PR_COMMENT_TARGET_SURFACE,
  parseGitHubPrCommentTargetRef,
} from "@/lib/github-pr-comment-target";
import {
  DELIVERY_STATUSES,
  PUBLICATION_STATUSES,
  listDeliveries,
  listPublications,
  type DeliveryRecord,
  type DeliveryStatus,
  type PublicationDraft,
  type PublicationStatus,
} from "@/lib/publications";
import { normalizeScope } from "@/lib/work";

const SUMMARY_LIMIT = 200;
const PREVIEW_EXCERPT_LIMIT = 320;

export type PublicationEligibility = {
  dry_run: boolean;
  actual_publish: boolean;
  reason: string;
};

export type PublicationSummaryItem = {
  publication_id: string;
  scope: string;
  work_id: string | null;
  source_event_id: string | null;
  target_surface: string;
  target_ref: string;
  status: string;
  preview_excerpt: string;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  latest_delivery_status: string | null;
  latest_delivery_id: string | null;
  latest_delivery_error: string | null;
  latest_delivery_external_artifact_id: string | null;
  latest_delivery_external_artifact_url: string | null;
  latest_delivery_external_artifact_type: string | null;
  delivery_count: number;
  publish_eligibility: PublicationEligibility;
  summary_reason: string;
};

export type FailedDeliverySummaryItem = {
  delivery_id: string;
  publication_id: string;
  scope: string;
  target_surface: string;
  target_ref: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  acknowledged_at: string | null;
  external_artifact_id: string | null;
  external_artifact_url: string | null;
  external_artifact_type: string | null;
  publication_status: string | null;
  work_id: string | null;
  summary_reason: string;
};

export type PublicationSummary = {
  drafts: PublicationSummaryItem[];
  approved_previews: PublicationSummaryItem[];
  sent: PublicationSummaryItem[];
  failed: PublicationSummaryItem[];
  cancelled: PublicationSummaryItem[];
  delivery_status: Record<`${DeliveryStatus}_count`, number>;
  failed_deliveries: FailedDeliverySummaryItem[];
};

export type PublicationSummaryResult = {
  scope: string;
  as_of: string;
  summary: PublicationSummary;
  limits: {
    bounded_view: true;
    publication_limit: number;
    delivery_limit: number;
  };
  boundaries: string[];
};

export const PUBLICATION_SUMMARY_BOUNDARIES = [
  "Publication summaries are derived read-only views.",
  "This view does not approve, publish, retry, post to GitHub, post to Discord, record proof, or commit state.",
  "Actual GitHub posting remains backend-adapter gated by approved publication status, explicit dry_run=false, backend replay guard, stored target_ref, and token availability.",
];

export function buildPublicationSummary({
  scope,
}: {
  scope?: string | null;
} = {}): PublicationSummaryResult {
  const normalizedScope = normalizeScope(scope);
  const publications = listPublications({
    scope: normalizedScope,
    limit: SUMMARY_LIMIT,
  });
  const deliveries = listDeliveries({
    scope: normalizedScope,
    limit: SUMMARY_LIMIT,
  });
  const deliveriesByPublication = groupDeliveriesByPublication(deliveries);
  const publicationById = new Map(
    publications.map((publication) => [publication.publication_id, publication]),
  );
  const items = publications.map((publication) =>
    buildPublicationSummaryItem(
      publication,
      deliveriesByPublication.get(publication.publication_id) ?? [],
    ),
  );
  const deliveryStatus = DELIVERY_STATUSES.reduce(
    (counts, status) => {
      counts[`${status}_count` as `${DeliveryStatus}_count`] = deliveries.filter(
        (delivery) => delivery.status === status,
      ).length;
      return counts;
    },
    {
      pending_count: 0,
      sent_count: 0,
      failed_count: 0,
      acknowledged_count: 0,
    } as Record<`${DeliveryStatus}_count`, number>,
  );

  return {
    scope: normalizedScope,
    as_of: new Date().toISOString(),
    summary: {
      drafts: bucketItems(items, "draft"),
      approved_previews: bucketItems(items, "approved"),
      sent: bucketItems(items, "sent"),
      failed: bucketItems(items, "failed"),
      cancelled: bucketItems(items, "cancelled"),
      delivery_status: deliveryStatus,
      failed_deliveries: deliveries
        .filter((delivery) => delivery.status === "failed")
        .map((delivery) =>
          buildFailedDeliverySummaryItem(
            delivery,
            publicationById.get(delivery.publication_id) ?? null,
          ),
        ),
    },
    limits: {
      bounded_view: true,
      publication_limit: SUMMARY_LIMIT,
      delivery_limit: SUMMARY_LIMIT,
    },
    boundaries: PUBLICATION_SUMMARY_BOUNDARIES,
  };
}

function buildPublicationSummaryItem(
  publication: PublicationDraft,
  deliveries: DeliveryRecord[],
): PublicationSummaryItem {
  const latestDelivery = deliveries[0] ?? null;

  return {
    publication_id: publication.publication_id,
    scope: publication.scope,
    work_id: publication.work_id,
    source_event_id: publication.source_event_id,
    target_surface: publication.target_surface,
    target_ref: publication.target_ref,
    status: publication.status,
    preview_excerpt: excerpt(publication.preview_body),
    created_by: publication.created_by,
    approved_by: publication.approved_by,
    created_at: publication.created_at,
    updated_at: publication.updated_at,
    sent_at: publication.sent_at,
    latest_delivery_status: latestDelivery?.status ?? null,
    latest_delivery_id: latestDelivery?.delivery_id ?? null,
    latest_delivery_error: latestDelivery?.error_message ?? null,
    latest_delivery_external_artifact_id:
      latestDelivery?.external_artifact_id ?? null,
    latest_delivery_external_artifact_url:
      latestDelivery?.external_artifact_url ?? null,
    latest_delivery_external_artifact_type:
      latestDelivery?.external_artifact_type ?? null,
    delivery_count: deliveries.length,
    publish_eligibility: getPublishEligibility(publication),
    summary_reason: getPublicationSummaryReason(publication, latestDelivery),
  };
}

function buildFailedDeliverySummaryItem(
  delivery: DeliveryRecord,
  publication: PublicationDraft | null,
): FailedDeliverySummaryItem {
  return {
    delivery_id: delivery.delivery_id,
    publication_id: delivery.publication_id,
    scope: delivery.scope,
    target_surface: delivery.target_surface,
    target_ref: delivery.target_ref,
    status: delivery.status,
    error_message: delivery.error_message,
    created_at: delivery.created_at,
    updated_at: delivery.updated_at,
    sent_at: delivery.sent_at,
    acknowledged_at: delivery.acknowledged_at,
    external_artifact_id: delivery.external_artifact_id,
    external_artifact_url: delivery.external_artifact_url,
    external_artifact_type: delivery.external_artifact_type,
    publication_status: publication?.status ?? null,
    work_id: publication?.work_id ?? null,
    summary_reason: delivery.error_message
      ? "failed delivery includes stored error_message"
      : "failed delivery has no stored error_message",
  };
}

function groupDeliveriesByPublication(deliveries: DeliveryRecord[]) {
  const grouped = new Map<string, DeliveryRecord[]>();

  for (const delivery of deliveries) {
    const existing = grouped.get(delivery.publication_id) ?? [];
    existing.push(delivery);
    grouped.set(delivery.publication_id, existing);
  }

  for (const records of grouped.values()) {
    records.sort(compareDeliveryRecency);
  }

  return grouped;
}

function compareDeliveryRecency(first: DeliveryRecord, second: DeliveryRecord) {
  const firstTime = new Date(first.updated_at || first.created_at).getTime();
  const secondTime = new Date(second.updated_at || second.created_at).getTime();
  if (secondTime !== firstTime) {
    return secondTime - firstTime;
  }

  return first.delivery_id.localeCompare(second.delivery_id);
}

function bucketItems(
  items: PublicationSummaryItem[],
  status: PublicationStatus,
) {
  if (!PUBLICATION_STATUSES.includes(status)) {
    return [];
  }

  return items.filter((item) => item.status === status);
}

function getPublishEligibility(
  publication: PublicationDraft,
): PublicationEligibility {
  if (publication.target_surface !== GITHUB_PR_COMMENT_TARGET_SURFACE) {
    return {
      dry_run: false,
      actual_publish: false,
      reason: "target_surface is not supported by the GitHub PR comment adapter",
    };
  }

  if (!isValidGitHubPrCommentTargetRef(publication.target_ref)) {
    return {
      dry_run: false,
      actual_publish: false,
      reason: "target_ref is not a valid owner/repo#pull_number GitHub PR ref",
    };
  }

  if (!publication.preview_body.trim()) {
    return {
      dry_run: false,
      actual_publish: false,
      reason: "preview_body is empty",
    };
  }

  if (publication.status === "approved") {
    return {
      dry_run: true,
      actual_publish: true,
      reason:
        "approved GitHub PR comment preview meets stored-state preconditions for the explicit backend publish route; this view cannot publish",
    };
  }

  return {
    dry_run: true,
    actual_publish: false,
    reason:
      "GitHub PR comment target can dry-run, but actual publish requires approved status",
  };
}

function isValidGitHubPrCommentTargetRef(targetRef: string) {
  try {
    parseGitHubPrCommentTargetRef(targetRef);
    return true;
  } catch {
    return false;
  }
}

function getPublicationSummaryReason(
  publication: PublicationDraft,
  latestDelivery: DeliveryRecord | null,
) {
  if (latestDelivery) {
    return `publication status ${publication.status}; latest delivery ${latestDelivery.status}`;
  }

  return `publication status ${publication.status}; no delivery rows`;
}

function excerpt(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= PREVIEW_EXCERPT_LIMIT) {
    return normalized;
  }

  return `${normalized.slice(0, PREVIEW_EXCERPT_LIMIT - 1)}...`;
}
