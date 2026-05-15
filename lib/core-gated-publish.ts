import {
  GITHUB_PR_COMMENT_TARGET_SURFACE,
  parseGitHubPrCommentTargetRef,
} from "@/lib/github-pr-comment-target";
import { publishGitHubPrComment } from "@/lib/github-publication";
import { resolveGitHubPublishToken } from "@/lib/github-token-provider";
import {
  getPublicationApprovalDecision,
  type PublicationApprovalDecision,
} from "@/lib/publication-approval-decisions";
import {
  getPublicationApprovalRequest,
  type PublicationApprovalRequest,
} from "@/lib/publication-approval-requests";
import {
  getPublicationReadinessCheck,
  type PublicationReadinessCheck,
} from "@/lib/publication-readiness-checks";
import { openDatabase } from "@/lib/db";
import {
  getDeliveryByIdempotencyKey,
  getPublication,
  type DeliveryRecord,
  type PublicationDraft,
} from "@/lib/publications";
import { normalizeScope } from "@/lib/work";

export const PUBLISH_READINESS_FRESHNESS_WINDOW_MS = 30 * 60 * 1000;

export const CORE_GATED_PUBLISH_BOUNDARIES = [
  "This is explicit Core-gated publish control.",
  "dry_run=true is preview only and creates no external side effect.",
  "dry_run=false is the only publish path and requires explicit target approval.",
  "Actual publish posts one GitHub PR comment.",
  "Approval is not publication.",
  "Dry-run readiness is not publication.",
  "Replay must not duplicate.",
  "This route does not merge PRs, submit PR reviews, request reviewers, mutate labels/titles/bodies, post to Discord, record proof, update mailbox, commit/reject state, or execute Codex.",
  "PR #67 does not authorize automatic future posting.",
];

export const CORE_GATED_PUBLISH_GATE_CHECKS = [
  "readiness_check_id is valid",
  "readiness check exists in scope",
  "readiness check status is ready",
  "readiness check is dry_run=true",
  "linked approval decision exists",
  "approval decision is approved",
  "linked approval request exists",
  "approval request status is requested",
  "linked publication exists",
  "publication status is approved, unless returning a same-key sent or acknowledged delivery replay",
  "publication approved_by is present",
  "target_surface is github_pr_comment",
  "target_ref matches readiness check, approval decision, approval request, and publication",
  "target_ref uses owner/repo#pull_number format",
  "preview_body is non-empty",
  "idempotency_key is required",
  "no pending delivery exists for the same publication target, even under a different idempotency_key",
  "no sent or acknowledged delivery exists for the same publication target unless it is a same-key idempotent replay",
  "replay only applies to the same idempotency_key",
  "readiness check is fresh within 30 minutes, unless returning a durable same-key sent or acknowledged delivery replay",
  "dry_run is explicitly present as a boolean",
  "dry_run=true never calls the GitHub adapter and never creates delivery rows",
  "dry_run=false requires explicit target approval",
  "dry_run=false requires token availability before adapter execution",
];

const FORBIDDEN_REQUEST_FIELDS = [
  "github_token",
  "GITHUB_TOKEN",
  "token",
  "post_to_discord",
  "discord",
  "webhook",
  "proof",
  "record_proof",
  "target_ref",
  "target_surface",
  "target_override",
  "expected_target_surface",
  "publication_id",
  "approval_request_id",
  "approval_decision_id",
  "delivery_id",
  "delivery_status",
  "retry",
  "merge",
  "auto_merge",
  "submit_review",
  "request_reviewers",
  "labels",
  "title",
  "body",
  "mailbox_status",
  "state_commit",
  "state_reject",
];

export type CoreGatedPublishRequest = {
  readinessCheckId: string;
  scope: string;
  requestedBy: string;
  dryRun: boolean;
  idempotencyKey: string;
  explicitTargetApproval: boolean;
  approvedTargetRef: string | null;
  approvedTargetSurface: string | null;
};

export type PublishGateResult = {
  scope: string;
  readiness_check: PublicationReadinessCheck;
  approval_decision: PublicationApprovalDecision;
  approval_request: PublicationApprovalRequest;
  publication: PublicationDraft;
  target_surface: typeof GITHUB_PR_COMMENT_TARGET_SURFACE;
  target_ref: string;
  idempotency_key: string;
  gate_checks: string[];
  blocked_reasons: string[];
  boundaries: string[];
  freshness: {
    checked_at: string;
    window_ms: number;
    age_ms: number;
  };
  existing_delivery: DeliveryRecord | null;
  target_blocking_deliveries: TargetBlockingDeliveries;
};

export type DryRunPublishPreview = {
  scope: string;
  dry_run: true;
  would_publish: true;
  target_surface: typeof GITHUB_PR_COMMENT_TARGET_SURFACE;
  target_ref: string;
  publication_id: string;
  readiness_check_id: string;
  approval_decision_id: string;
  approval_request_id: string;
  idempotency_key: string;
  requested_by: string;
  preview_excerpt: string;
  gate_checks: string[];
  blocked_reasons: string[];
  boundaries: string[];
  freshness: {
    checked_at: string;
    window_ms: number;
    age_ms: number;
  };
};

export class PublishGateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishGateValidationError";
  }
}

export class PublishGateNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishGateNotFoundError";
  }
}

export class PublishGateConflictError extends Error {
  blockedReasons: string[];
  gateChecks: string[];

  constructor(message: string, blockedReasons: string[], gateChecks: string[]) {
    super(message);
    this.name = "PublishGateConflictError";
    this.blockedReasons = blockedReasons;
    this.gateChecks = gateChecks;
  }
}

export class PublishTokenUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishTokenUnavailableError";
  }
}

type TargetBlockingDeliveries = {
  pending: DeliveryRecord[];
  sent_or_acknowledged: DeliveryRecord[];
};

export function validateGitHubPrCommentPublishRequest({
  readinessCheckId,
  body,
}: {
  readinessCheckId: string;
  body: Record<string, unknown>;
}): CoreGatedPublishRequest {
  const unsupportedKeys = FORBIDDEN_REQUEST_FIELDS.filter(
    (key) => body[key] !== undefined,
  );
  if (unsupportedKeys.length > 0) {
    throw new PublishGateValidationError(
      `${unsupportedKeys.join(", ")} ${
        unsupportedKeys.length === 1 ? "is" : "are"
      } not accepted by the Core-gated GitHub PR comment publish route.`,
    );
  }

  const dryRun = requireBoolean(body, "dry_run");
  const explicitTargetApproval =
    readOptionalBoolean(body, "explicit_target_approval") ?? false;
  const approvedTargetRef = readOptionalString(body, "approved_target_ref");
  const approvedTargetSurface = readOptionalString(
    body,
    "approved_target_surface",
  );

  if (
    dryRun &&
    (body.explicit_target_approval !== undefined ||
      body.approved_target_ref !== undefined ||
      body.approved_target_surface !== undefined)
  ) {
    throw new PublishGateValidationError(
      "dry_run=true does not accept explicit target approval fields.",
    );
  }

  if (!dryRun) {
    if (explicitTargetApproval !== true) {
      throw new PublishGateValidationError(
        "dry_run=false requires explicit_target_approval=true.",
      );
    }
    if (!approvedTargetRef) {
      throw new PublishGateValidationError(
        "dry_run=false requires approved_target_ref.",
      );
    }
    if (!approvedTargetSurface) {
      throw new PublishGateValidationError(
        "dry_run=false requires approved_target_surface.",
      );
    }
  }

  return {
    readinessCheckId: normalizeReadinessCheckId(
      decodeURIComponent(readinessCheckId),
    ),
    scope: normalizeScope(readOptionalString(body, "scope")),
    requestedBy: requireString(body, "requested_by"),
    dryRun,
    idempotencyKey: requireString(body, "idempotency_key"),
    explicitTargetApproval,
    approvedTargetRef,
    approvedTargetSurface,
  };
}

export function buildDryRunPublishPreview(
  request: CoreGatedPublishRequest,
): DryRunPublishPreview {
  if (request.dryRun !== true) {
    throw new PublishGateValidationError(
      "buildDryRunPublishPreview requires dry_run=true.",
    );
  }

  const gate = validateCoreGatedPublish(request);

  return {
    scope: gate.scope,
    dry_run: true,
    would_publish: true,
    target_surface: gate.target_surface,
    target_ref: gate.target_ref,
    publication_id: gate.publication.publication_id,
    readiness_check_id: gate.readiness_check.readiness_check_id,
    approval_decision_id: gate.approval_decision.approval_decision_id,
    approval_request_id: gate.approval_request.approval_request_id,
    idempotency_key: request.idempotencyKey,
    requested_by: request.requestedBy,
    preview_excerpt: buildPreviewExcerpt(gate.publication.preview_body),
    gate_checks: gate.gate_checks,
    blocked_reasons: gate.blocked_reasons,
    boundaries: gate.boundaries,
    freshness: gate.freshness,
  };
}

export async function executeGitHubPrCommentPublish(
  request: CoreGatedPublishRequest,
) {
  if (request.dryRun !== false) {
    throw new PublishGateValidationError(
      "executeGitHubPrCommentPublish requires dry_run=false.",
    );
  }

  const gate = validateCoreGatedPublish(request);

  if (request.approvedTargetSurface !== gate.target_surface) {
    throw new PublishGateValidationError(
      "approved_target_surface must exactly match the stored target surface.",
    );
  }
  if (request.approvedTargetRef !== gate.target_ref) {
    throw new PublishGateValidationError(
      "approved_target_ref must exactly match the stored target_ref.",
    );
  }

  if (
    gate.existing_delivery &&
    (gate.existing_delivery.status === "sent" ||
      gate.existing_delivery.status === "acknowledged")
  ) {
    return {
      scope: gate.scope,
      dry_run: false,
      posted: false,
      would_publish: false,
      idempotent_replay: true,
      target_surface: gate.target_surface,
      target_ref: gate.target_ref,
      publication: gate.publication,
      delivery: gate.existing_delivery,
      github_comment_url: gate.existing_delivery.external_artifact_url,
      github_comment_id: parsePersistedGitHubCommentId(
        gate.existing_delivery.external_artifact_id,
      ),
      error_message: null,
      requested_by: request.requestedBy,
      gate_checks: gate.gate_checks,
      blocked_reasons: [],
      boundaries: gate.boundaries,
    };
  }

  const tokenResolution = resolveGitHubPublishToken();
  if (!tokenResolution.available || !tokenResolution.token) {
    throw new PublishTokenUnavailableError(
      "dry_run=false requires GitHub publish token availability before creating delivery rows or invoking the GitHub adapter.",
    );
  }

  const result = await publishGitHubPrComment({
    publicationId: gate.publication.publication_id,
    scope: gate.scope,
    dryRun: false,
    idempotencyKey: request.idempotencyKey,
    expectedTargetSurface: GITHUB_PR_COMMENT_TARGET_SURFACE,
    requestedBy: request.requestedBy,
    githubToken: tokenResolution.token,
  });

  return {
    scope: gate.scope,
    ...result,
    gate_checks: gate.gate_checks,
    blocked_reasons: [],
    boundaries: gate.boundaries,
  };
}

function validateCoreGatedPublish(
  request: CoreGatedPublishRequest,
): PublishGateResult {
  const readinessCheck = getPublicationReadinessCheck(
    request.readinessCheckId,
    request.scope,
  );
  if (!readinessCheck) {
    throw new PublishGateNotFoundError(
      `Unknown readiness_check_id ${request.readinessCheckId} for scope ${request.scope}.`,
    );
  }

  const approvalDecision = getPublicationApprovalDecision(
    readinessCheck.approval_decision_id,
    request.scope,
  );
  const approvalRequest = getPublicationApprovalRequest(
    readinessCheck.approval_request_id,
    request.scope,
  );
  const publication = getPublication(readinessCheck.publication_id, request.scope);
  const existingDelivery = getDeliveryByIdempotencyKey({
    publicationId: readinessCheck.publication_id,
    targetSurface: readinessCheck.target_surface,
    targetRef: readinessCheck.target_ref,
    idempotencyKey: request.idempotencyKey,
  });
  const targetBlockingDeliveries = getBlockingDeliveriesForPublicationTarget({
    publicationId: readinessCheck.publication_id,
    targetSurface: readinessCheck.target_surface,
    targetRef: readinessCheck.target_ref,
  });
  const sameKeySentOrAcknowledgedReplay =
    isSameKeySentOrAcknowledgedReplayCandidate({
      request,
      readinessCheck,
      existingDelivery,
    });
  const freshness = getReadinessFreshness(readinessCheck.checked_at);
  const blockedReasons = collectBlockedReasons({
    request,
    readinessCheck,
    approvalDecision,
    approvalRequest,
    publication,
    existingDelivery,
    targetBlockingDeliveries,
    sameKeySentOrAcknowledgedReplay,
    freshness,
  });

  if (blockedReasons.length > 0) {
    throw new PublishGateConflictError(
      `Core-gated publish is blocked by ${blockedReasons.length} gate${
        blockedReasons.length === 1 ? "" : "s"
      }.`,
      blockedReasons,
      CORE_GATED_PUBLISH_GATE_CHECKS,
    );
  }

  return {
    scope: request.scope,
    readiness_check: readinessCheck,
    approval_decision: approvalDecision as PublicationApprovalDecision,
    approval_request: approvalRequest as PublicationApprovalRequest,
    publication: publication as PublicationDraft,
    target_surface: GITHUB_PR_COMMENT_TARGET_SURFACE,
    target_ref: readinessCheck.target_ref,
    idempotency_key: request.idempotencyKey,
    gate_checks: CORE_GATED_PUBLISH_GATE_CHECKS,
    blocked_reasons: [],
    boundaries: CORE_GATED_PUBLISH_BOUNDARIES,
    freshness,
    existing_delivery: existingDelivery,
    target_blocking_deliveries: targetBlockingDeliveries,
  };
}

function collectBlockedReasons({
  request,
  readinessCheck,
  approvalDecision,
  approvalRequest,
  publication,
  existingDelivery,
  targetBlockingDeliveries,
  sameKeySentOrAcknowledgedReplay,
  freshness,
}: {
  request: CoreGatedPublishRequest;
  readinessCheck: PublicationReadinessCheck;
  approvalDecision: PublicationApprovalDecision | null;
  approvalRequest: PublicationApprovalRequest | null;
  publication: PublicationDraft | null;
  existingDelivery: DeliveryRecord | null;
  targetBlockingDeliveries: TargetBlockingDeliveries;
  sameKeySentOrAcknowledgedReplay: boolean;
  freshness: PublishGateResult["freshness"];
}) {
  const reasons: string[] = [];

  if (readinessCheck.status !== "ready") {
    reasons.push(`readiness check status is ${readinessCheck.status}`);
  }
  if (readinessCheck.dry_run !== true) {
    reasons.push("readiness check must be dry_run=true");
  }

  if (!approvalDecision) {
    reasons.push("linked approval decision is missing");
  } else {
    if (approvalDecision.decision !== "approved") {
      reasons.push(`approval decision is ${approvalDecision.decision}`);
    }
    if (!targetMatchesReadiness(readinessCheck, approvalDecision)) {
      reasons.push(
        "approval decision target does not match readiness check target",
      );
    }
  }

  if (!approvalRequest) {
    reasons.push("linked approval request is missing");
  } else {
    if (approvalRequest.status !== "requested") {
      reasons.push(`approval request status is ${approvalRequest.status}`);
    }
    if (!targetMatchesReadiness(readinessCheck, approvalRequest)) {
      reasons.push(
        "approval request target does not match readiness check target",
      );
    }
  }

  if (!publication) {
    reasons.push("linked publication is missing");
  } else {
    if (sameKeySentOrAcknowledgedReplay) {
      if (publication.status !== "approved" && publication.status !== "sent") {
        reasons.push(
          `publication status is ${publication.status}; same-key replay requires approved or sent publication status`,
        );
      }
    } else if (publication.status !== "approved") {
      reasons.push(`publication status is ${publication.status}`);
    }
    if (!publication.approved_by) {
      reasons.push("publication approved_by is missing");
    }
    if (!targetMatchesReadiness(readinessCheck, publication)) {
      reasons.push("publication target does not match readiness check target");
    }
    if (publication.preview_body.trim().length === 0) {
      reasons.push("publication preview_body is empty");
    }
  }

  if (readinessCheck.target_surface !== GITHUB_PR_COMMENT_TARGET_SURFACE) {
    reasons.push("target_surface is not github_pr_comment");
  }

  try {
    parseGitHubPrCommentTargetRef(readinessCheck.target_ref);
  } catch (error) {
    reasons.push(
      error instanceof Error
        ? error.message
        : "target_ref is not a valid GitHub PR comment target",
    );
  }

  reasons.push(
    ...getTargetDeliveryBlockedReasons({
      request,
      targetBlockingDeliveries,
    }),
  );
  if (
    existingDelivery &&
    existingDelivery.status === "failed" &&
    request.dryRun === false
  ) {
    reasons.push(
      "a failed delivery already exists for this idempotency_key; use a new idempotency_key for a future retry design",
    );
  }

  if (
    !sameKeySentOrAcknowledgedReplay &&
    freshness.age_ms > PUBLISH_READINESS_FRESHNESS_WINDOW_MS
  ) {
    reasons.push("readiness check is stale; rerun dry-run readiness first");
  }
  if (!sameKeySentOrAcknowledgedReplay && freshness.age_ms < -60_000) {
    reasons.push("readiness check checked_at is in the future");
  }

  return [...new Set(reasons)];
}

function isSameKeySentOrAcknowledgedReplayCandidate({
  request,
  readinessCheck,
  existingDelivery,
}: {
  request: CoreGatedPublishRequest;
  readinessCheck: PublicationReadinessCheck;
  existingDelivery: DeliveryRecord | null;
}) {
  return (
    request.dryRun === false &&
    existingDelivery !== null &&
    (existingDelivery.status === "sent" ||
      existingDelivery.status === "acknowledged") &&
    existingDelivery.publication_id === readinessCheck.publication_id &&
    existingDelivery.target_surface === readinessCheck.target_surface &&
    existingDelivery.target_ref === readinessCheck.target_ref &&
    existingDelivery.idempotency_key === request.idempotencyKey
  );
}

function getTargetDeliveryBlockedReasons({
  request,
  targetBlockingDeliveries,
}: {
  request: CoreGatedPublishRequest;
  targetBlockingDeliveries: TargetBlockingDeliveries;
}) {
  const reasons: string[] = [];
  const sameKeyPending = targetBlockingDeliveries.pending.some((delivery) =>
    hasSameIdempotencyKey(delivery, request.idempotencyKey),
  );
  const differentKeyPending = targetBlockingDeliveries.pending.some(
    (delivery) => !hasSameIdempotencyKey(delivery, request.idempotencyKey),
  );
  const sameKeySentOrAcknowledged =
    targetBlockingDeliveries.sent_or_acknowledged.some((delivery) =>
      hasSameIdempotencyKey(delivery, request.idempotencyKey),
    );
  const differentKeySentOrAcknowledged =
    targetBlockingDeliveries.sent_or_acknowledged.some(
      (delivery) => !hasSameIdempotencyKey(delivery, request.idempotencyKey),
    );

  if (sameKeyPending) {
    reasons.push(
      "a pending delivery already exists for this publication target and idempotency_key",
    );
  }
  if (differentKeyPending) {
    reasons.push(
      "a pending delivery already exists for this publication target with a different idempotency_key",
    );
  }
  if (differentKeySentOrAcknowledged) {
    reasons.push(
      "a sent delivery already exists for this publication target with a different idempotency_key",
    );
  }
  if (request.dryRun && sameKeySentOrAcknowledged) {
    reasons.push(
      "a sent delivery already exists for this publication target and idempotency_key",
    );
  }

  return reasons;
}

function hasSameIdempotencyKey(
  delivery: DeliveryRecord,
  idempotencyKey: string,
) {
  return delivery.idempotency_key === idempotencyKey;
}

function targetMatchesReadiness(
  readinessCheck: PublicationReadinessCheck,
  record:
    | PublicationApprovalDecision
    | PublicationApprovalRequest
    | PublicationDraft,
) {
  return (
    record.publication_id === readinessCheck.publication_id &&
    record.target_surface === readinessCheck.target_surface &&
    record.target_ref === readinessCheck.target_ref
  );
}

function getReadinessFreshness(checkedAt: string) {
  const checkedAtMs = Date.parse(checkedAt);
  if (!Number.isFinite(checkedAtMs)) {
    return {
      checked_at: checkedAt,
      window_ms: PUBLISH_READINESS_FRESHNESS_WINDOW_MS,
      age_ms: Number.POSITIVE_INFINITY,
    };
  }

  return {
    checked_at: checkedAt,
    window_ms: PUBLISH_READINESS_FRESHNESS_WINDOW_MS,
    age_ms: Date.now() - checkedAtMs,
  };
}

function getBlockingDeliveriesForPublicationTarget({
  publicationId,
  targetSurface,
  targetRef,
}: {
  publicationId: string;
  targetSurface: string;
  targetRef: string;
}): TargetBlockingDeliveries {
  const deliveries = listDeliveriesForPublicationTarget({
    publicationId,
    targetSurface,
    targetRef,
  });

  return {
    pending: deliveries.filter((delivery) => delivery.status === "pending"),
    sent_or_acknowledged: deliveries.filter(
      (delivery) =>
        delivery.status === "sent" || delivery.status === "acknowledged",
    ),
  };
}

function listDeliveriesForPublicationTarget({
  publicationId,
  targetSurface,
  targetRef,
}: {
  publicationId: string;
  targetSurface: string;
  targetRef: string;
}) {
  const db = openDatabase();

  try {
    const rows = db
      .prepare(
        `
          SELECT
            delivery_id,
            publication_id,
            scope,
            target_surface,
            target_ref,
            status,
            sent_at,
            acknowledged_at,
            error_message,
            idempotency_key,
            external_artifact_id,
            external_artifact_url,
            external_artifact_type,
            created_at,
            updated_at
          FROM delivery_ledger
          WHERE publication_id = ?
            AND target_surface = ?
            AND target_ref = ?
            AND status IN ('pending', 'sent', 'acknowledged')
          ORDER BY created_at DESC, delivery_id ASC
        `,
      )
      .all(publicationId, targetSurface, targetRef) as DeliveryRecord[];

    return rows;
  } finally {
    db.close();
  }
}

function buildPreviewExcerpt(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 240
    ? `${normalized.slice(0, 237).trimEnd()}...`
    : normalized;
}


function parsePersistedGitHubCommentId(value: string | null) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

function requireString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new PublishGateValidationError(`${key} is required.`);
  }

  return value.trim();
}

function requireBoolean(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw new PublishGateValidationError(
      `${key} must be explicitly provided as a boolean.`,
    );
  }

  return value;
}

function readOptionalBoolean(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "boolean") {
    throw new PublishGateValidationError(`${key} must be a boolean.`);
  }

  return value;
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new PublishGateValidationError(`${key} must be a string.`);
  }

  return value.trim() || null;
}

function normalizeReadinessCheckId(value: string) {
  const readinessCheckId = requireRawString(value, "readiness_check_id");
  if (
    !readinessCheckId.startsWith("readiness_check:") ||
    readinessCheckId.trim() !== readinessCheckId
  ) {
    throw new PublishGateValidationError(
      "readiness_check_id must start with readiness_check: and contain no surrounding whitespace.",
    );
  }

  return readinessCheckId;
}

function requireRawString(value: unknown, key: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new PublishGateValidationError(`${key} is required.`);
  }

  return value.trim();
}
