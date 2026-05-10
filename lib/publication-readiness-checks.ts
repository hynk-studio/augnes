import { randomUUID } from "node:crypto";
import {
  GITHUB_PR_COMMENT_TARGET_SURFACE,
  parseGitHubPrCommentTargetRef,
} from "@/lib/github-pr-comment-target";
import {
  ApprovalDecisionNotFoundError,
  ApprovalDecisionValidationError,
  type PublicationApprovalDecision,
} from "@/lib/publication-approval-decisions";
import { type PublicationApprovalRequest } from "@/lib/publication-approval-requests";
import { type PublicationDraft } from "@/lib/publications";
import { openDatabase } from "@/lib/db";
import { normalizeScope } from "@/lib/work";

const DEFAULT_READINESS_CHECK_LIMIT = 50;
const MAX_READINESS_CHECK_LIMIT = 200;
const TARGET_SURFACE_PATTERN = /^[a-z][a-z0-9_:-]{1,63}$/;

export const READINESS_CHECK_STATUSES = ["ready", "blocked"] as const;

export const READINESS_CHECK_BOUNDARIES = [
  "This is dry-run readiness only.",
  "Dry-run is not publication.",
  "Approval is not publication.",
  "Publish execution remains a separate future Core-gated route.",
  "This route does not publish, retry, record proof, update mailbox status, commit or reject state, execute Codex, mutate GitHub, post to Discord, or create delivery rows.",
  "Future publish still requires explicit target approval, approved publication status, dry_run=false, stored target_ref, required idempotency_key, delivery freshness, token availability, and replay/no-duplicate evidence.",
  "PR #67 does not authorize automatic posting.",
];

const READY_GATE_CHECKS = [
  "approval decision exists in scope",
  "approval decision is approved",
  "linked approval request status is requested",
  "linked publication exists in scope",
  "publication status is approved",
  "publication approved_by is present",
  "publication, request, and decision targets match",
  "target_surface is github_pr_comment",
  "target_ref uses owner/repo#pull_number format",
  "preview_body is non-empty",
  "no sent delivery exists for the stored publication target",
  "no pending delivery exists for the stored publication target",
  "future publish will require idempotency_key",
  "future publish will require dry_run=false in a separate Core-gated route",
];

export type ReadinessCheckStatus = (typeof READINESS_CHECK_STATUSES)[number];

export type PublicationReadinessCheck = {
  readiness_check_id: string;
  scope: string;
  publication_id: string;
  approval_request_id: string;
  approval_decision_id: string;
  work_id: string | null;
  target_surface: string;
  target_ref: string;
  dry_run: boolean;
  status: ReadinessCheckStatus | string;
  checked_by: string;
  checked_at: string;
  gate_checks: string[];
  blocked_reasons: string[];
  readiness_summary: string;
  idempotency_key_required: boolean;
  publish_route_required: string;
  source_control_packet_ref: string | null;
  created_at: string;
};

export type ReadinessCheckInput = {
  readiness_check_id?: string;
  scope?: string | null;
  approval_decision_id: string;
  checked_by: string;
  source_control_packet_ref?: string | null;
  checked_at?: string;
};

export type PublicationReadinessCheckResult = {
  scope: string;
  readiness_check: PublicationReadinessCheck;
  approval_decision: PublicationApprovalDecision;
  approval_request: PublicationApprovalRequest | null;
  publication: PublicationDraft | null;
  ready: boolean;
  blocked_reasons: string[];
  boundaries: string[];
};

type ReadinessCheckRow = Omit<
  PublicationReadinessCheck,
  "dry_run" | "gate_checks" | "blocked_reasons" | "idempotency_key_required"
> & {
  dry_run: number;
  gate_checks: string;
  blocked_reasons: string;
  idempotency_key_required: number;
};

type ApprovalDecisionRow = Omit<
  PublicationApprovalDecision,
  "gate_checks" | "authority_boundaries"
> & {
  gate_checks: string;
  authority_boundaries: string;
};

type ApprovalRequestRow = Omit<
  PublicationApprovalRequest,
  "required_gate_checks" | "authority_boundaries"
> & {
  required_gate_checks: string;
  authority_boundaries: string;
};

type PublicationDraftRow = PublicationDraft;

export class ReadinessCheckNotFoundError extends Error {
  constructor(readinessCheckId: string, scope: string | null) {
    super(
      scope
        ? `Unknown readiness_check_id ${readinessCheckId} for scope ${scope}.`
        : `Unknown readiness_check_id ${readinessCheckId}.`,
    );
    this.name = "ReadinessCheckNotFoundError";
  }
}

export class ReadinessCheckValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReadinessCheckValidationError";
  }
}

export function listPublicationReadinessChecks({
  scope,
  publicationId,
  approvalDecisionId,
  status,
  targetSurface,
  limit = DEFAULT_READINESS_CHECK_LIMIT,
}: {
  scope?: string | null;
  publicationId?: string | null;
  approvalDecisionId?: string | null;
  status?: ReadinessCheckStatus | null;
  targetSurface?: string | null;
  limit?: number;
}) {
  const normalizedScope = normalizeScope(scope);
  const clauses = ["scope = ?"];
  const params: Array<string | number> = [normalizedScope];

  if (publicationId) {
    clauses.push("publication_id = ?");
    params.push(normalizePublicationId(publicationId));
  }

  if (approvalDecisionId) {
    clauses.push("approval_decision_id = ?");
    params.push(normalizeApprovalDecisionId(approvalDecisionId));
  }

  if (status) {
    assertReadinessCheckStatus(status);
    clauses.push("status = ?");
    params.push(status);
  }

  const cleanTargetSurface = cleanNullableString(targetSurface);
  if (cleanTargetSurface) {
    assertTargetSurface(cleanTargetSurface);
    clauses.push("target_surface = ?");
    params.push(cleanTargetSurface);
  }

  params.push(normalizeLimit(limit));
  const db = openDatabase();

  try {
    const rows = db
      .prepare(
        `
          SELECT
            readiness_check_id,
            scope,
            publication_id,
            approval_request_id,
            approval_decision_id,
            work_id,
            target_surface,
            target_ref,
            dry_run,
            status,
            checked_by,
            checked_at,
            gate_checks,
            blocked_reasons,
            readiness_summary,
            idempotency_key_required,
            publish_route_required,
            source_control_packet_ref,
            created_at
          FROM publication_readiness_checks
          WHERE ${clauses.join(" AND ")}
          ORDER BY checked_at DESC, readiness_check_id ASC
          LIMIT ?
        `,
      )
      .all(...params) as ReadinessCheckRow[];

    return rows.map(parseReadinessCheckRow);
  } finally {
    db.close();
  }
}

export function getPublicationReadinessCheck(
  readinessCheckId: string,
  scope?: string | null,
) {
  const normalizedScope = scope ? normalizeScope(scope) : null;
  const db = openDatabase();

  try {
    const row = selectReadinessCheckByIdOrNull(
      db,
      normalizeReadinessCheckId(readinessCheckId),
      normalizedScope,
    );

    return row ? parseReadinessCheckRow(row) : null;
  } finally {
    db.close();
  }
}

export function checkPublicationReadiness(
  input: ReadinessCheckInput,
): PublicationReadinessCheckResult {
  const scope = normalizeScope(input.scope);
  const approvalDecisionId = normalizeApprovalDecisionId(
    input.approval_decision_id,
  );
  const checkedAt = input.checked_at ?? new Date().toISOString();
  const checkedBy = requireNonEmptyString(input.checked_by, "checked_by");
  const readinessCheckId =
    cleanNullableString(input.readiness_check_id) ??
    `readiness_check:${randomUUID()}`;
  assertReadinessCheckId(readinessCheckId);

  const db = openDatabase();

  try {
    return db.transaction(() => {
      const approvalDecision = selectApprovalDecisionByIdOrNull(
        db,
        approvalDecisionId,
        scope,
      );
      if (!approvalDecision) {
        throw new ApprovalDecisionNotFoundError(approvalDecisionId, scope);
      }

      const approvalRequest = selectApprovalRequestByIdOrNull(
        db,
        approvalDecision.approval_request_id,
        scope,
      );
      const publication = selectPublicationByIdOrNull(
        db,
        approvalDecision.publication_id,
        scope,
      );
      const blockedReasons = collectBlockedReasons({
        approvalDecision,
        approvalRequest,
        publication,
        db,
      });
      const status: ReadinessCheckStatus =
        blockedReasons.length > 0 ? "blocked" : "ready";
      const row = {
        readiness_check_id: readinessCheckId,
        scope,
        publication_id: approvalDecision.publication_id,
        approval_request_id: approvalDecision.approval_request_id,
        approval_decision_id: approvalDecision.approval_decision_id,
        work_id: approvalDecision.work_id,
        target_surface: approvalDecision.target_surface,
        target_ref: approvalDecision.target_ref,
        dry_run: 1,
        status,
        checked_by: checkedBy,
        checked_at: checkedAt,
        gate_checks: stringifyStringArray(READY_GATE_CHECKS),
        blocked_reasons: stringifyStringArray(blockedReasons),
        readiness_summary: getReadinessSummary(status, blockedReasons),
        idempotency_key_required: 1,
        publish_route_required: "future_core_gated_publish_route",
        source_control_packet_ref: cleanNullableString(
          input.source_control_packet_ref,
        ),
        created_at: checkedAt,
      };

      db.prepare(
        `
          INSERT INTO publication_readiness_checks (
            readiness_check_id,
            scope,
            publication_id,
            approval_request_id,
            approval_decision_id,
            work_id,
            target_surface,
            target_ref,
            dry_run,
            status,
            checked_by,
            checked_at,
            gate_checks,
            blocked_reasons,
            readiness_summary,
            idempotency_key_required,
            publish_route_required,
            source_control_packet_ref,
            created_at
          )
          VALUES (
            @readiness_check_id,
            @scope,
            @publication_id,
            @approval_request_id,
            @approval_decision_id,
            @work_id,
            @target_surface,
            @target_ref,
            @dry_run,
            @status,
            @checked_by,
            @checked_at,
            @gate_checks,
            @blocked_reasons,
            @readiness_summary,
            @idempotency_key_required,
            @publish_route_required,
            @source_control_packet_ref,
            @created_at
          )
        `,
      ).run(row);

      const readinessCheck = selectReadinessCheckById(
        db,
        readinessCheckId,
        scope,
      );

      return {
        scope,
        readiness_check: readinessCheck,
        approval_decision: parseApprovalDecisionRow(approvalDecision),
        approval_request: approvalRequest
          ? parseApprovalRequestRow(approvalRequest)
          : null,
        publication: publication ?? null,
        ready: readinessCheck.status === "ready",
        blocked_reasons: readinessCheck.blocked_reasons,
        boundaries: READINESS_CHECK_BOUNDARIES,
      };
    })();
  } finally {
    db.close();
  }
}

function collectBlockedReasons({
  approvalDecision,
  approvalRequest,
  publication,
  db,
}: {
  approvalDecision: ApprovalDecisionRow;
  approvalRequest: ApprovalRequestRow | undefined;
  publication: PublicationDraftRow | undefined;
  db: ReturnType<typeof openDatabase>;
}) {
  const blockedReasons: string[] = [];

  if (approvalDecision.decision !== "approved") {
    blockedReasons.push("approval decision is not approved");
  }

  if (!approvalRequest) {
    blockedReasons.push("linked approval request is missing");
  } else {
    if (approvalRequest.status !== "requested") {
      blockedReasons.push(
        `approval request status is ${approvalRequest.status}`,
      );
    }
    if (
      approvalRequest.publication_id !== approvalDecision.publication_id ||
      approvalRequest.target_surface !== approvalDecision.target_surface ||
      approvalRequest.target_ref !== approvalDecision.target_ref
    ) {
      blockedReasons.push(
        "approval request target does not match the approval decision target",
      );
    }
  }

  if (!publication) {
    blockedReasons.push("linked publication is missing");
  } else {
    if (publication.status !== "approved") {
      blockedReasons.push(`publication status is ${publication.status}`);
    }
    if (!publication.approved_by) {
      blockedReasons.push("publication approved_by is missing");
    }
    if (
      publication.publication_id !== approvalDecision.publication_id ||
      publication.target_surface !== approvalDecision.target_surface ||
      publication.target_ref !== approvalDecision.target_ref
    ) {
      blockedReasons.push(
        "publication target does not match the approval decision target",
      );
    }
    if (publication.preview_body.trim().length === 0) {
      blockedReasons.push("publication preview_body is empty");
    }
  }

  if (approvalDecision.target_surface !== GITHUB_PR_COMMENT_TARGET_SURFACE) {
    blockedReasons.push(
      "target_surface is not supported by the GitHub PR comment adapter readiness check",
    );
  }

  try {
    parseGitHubPrCommentTargetRef(approvalDecision.target_ref);
  } catch (error) {
    blockedReasons.push(
      error instanceof Error
        ? error.message
        : "target_ref is not a valid GitHub PR comment target",
    );
  }

  if (publication) {
    if (
      hasDeliveryForPublicationTarget({
        db,
        publication,
        status: "sent",
      })
    ) {
      blockedReasons.push(
        "a sent delivery already exists for this publication target",
      );
    }
    if (
      hasDeliveryForPublicationTarget({
        db,
        publication,
        status: "pending",
      })
    ) {
      blockedReasons.push(
        "a pending delivery already exists for this publication target",
      );
    }
  }

  return uniqueStrings(blockedReasons);
}

function hasDeliveryForPublicationTarget({
  db,
  publication,
  status,
}: {
  db: ReturnType<typeof openDatabase>;
  publication: PublicationDraft;
  status: "sent" | "pending";
}) {
  return Boolean(
    db
      .prepare(
        `
          SELECT delivery_id
          FROM delivery_ledger
          WHERE scope = ?
            AND publication_id = ?
            AND target_surface = ?
            AND target_ref = ?
            AND status = ?
          LIMIT 1
        `,
      )
      .get(
        publication.scope,
        publication.publication_id,
        publication.target_surface,
        publication.target_ref,
        status,
      ),
  );
}

function getReadinessSummary(
  status: ReadinessCheckStatus,
  blockedReasons: string[],
) {
  if (status === "ready") {
    return "Dry-run readiness passed; actual publish remains a separate Core-gated C5 route.";
  }

  return `Dry-run readiness blocked by ${blockedReasons.length} gate${
    blockedReasons.length === 1 ? "" : "s"
  }.`;
}

function selectReadinessCheckById(
  db: ReturnType<typeof openDatabase>,
  readinessCheckId: string,
  scope?: string | null,
) {
  const row = selectReadinessCheckByIdOrNull(db, readinessCheckId, scope);
  if (!row) {
    throw new ReadinessCheckNotFoundError(readinessCheckId, scope ?? null);
  }

  return parseReadinessCheckRow(row);
}

function selectReadinessCheckByIdOrNull(
  db: ReturnType<typeof openDatabase>,
  readinessCheckId: string,
  scope?: string | null,
) {
  return db
    .prepare(
      `
        SELECT
          readiness_check_id,
          scope,
          publication_id,
          approval_request_id,
          approval_decision_id,
          work_id,
          target_surface,
          target_ref,
          dry_run,
          status,
          checked_by,
          checked_at,
          gate_checks,
          blocked_reasons,
          readiness_summary,
          idempotency_key_required,
          publish_route_required,
          source_control_packet_ref,
          created_at
        FROM publication_readiness_checks
        WHERE readiness_check_id = ?
          ${scope ? "AND scope = ?" : ""}
      `,
    )
    .get(...([readinessCheckId, scope].filter(Boolean) as string[])) as
    | ReadinessCheckRow
    | undefined;
}

function selectApprovalDecisionByIdOrNull(
  db: ReturnType<typeof openDatabase>,
  approvalDecisionId: string,
  scope: string,
) {
  return db
    .prepare(
      `
        SELECT
          approval_decision_id,
          scope,
          approval_request_id,
          publication_id,
          work_id,
          target_surface,
          target_ref,
          decision,
          decided_by,
          decided_at,
          decision_reason,
          gate_checks,
          authority_boundaries,
          source_control_packet_ref,
          created_at
        FROM publication_approval_decisions
        WHERE approval_decision_id = ?
          AND scope = ?
      `,
    )
    .get(approvalDecisionId, scope) as ApprovalDecisionRow | undefined;
}

function selectApprovalRequestByIdOrNull(
  db: ReturnType<typeof openDatabase>,
  approvalRequestId: string,
  scope: string,
) {
  return db
    .prepare(
      `
        SELECT
          approval_request_id,
          scope,
          publication_id,
          work_id,
          target_surface,
          target_ref,
          requested_by,
          requested_at,
          status,
          decision_prompt,
          side_effect_summary,
          required_gate_checks,
          authority_boundaries,
          source_control_packet_ref,
          created_at,
          updated_at,
          supersedes_request_id
        FROM publication_approval_requests
        WHERE approval_request_id = ?
          AND scope = ?
      `,
    )
    .get(approvalRequestId, scope) as ApprovalRequestRow | undefined;
}

function selectPublicationByIdOrNull(
  db: ReturnType<typeof openDatabase>,
  publicationId: string,
  scope: string,
) {
  return db
    .prepare(
      `
        SELECT
          publication_id,
          scope,
          work_id,
          source_event_id,
          target_surface,
          target_ref,
          status,
          preview_body,
          created_by,
          approved_by,
          created_at,
          updated_at,
          sent_at
        FROM publication_drafts
        WHERE publication_id = ?
          AND scope = ?
      `,
    )
    .get(publicationId, scope) as PublicationDraftRow | undefined;
}

function parseReadinessCheckRow(row: ReadinessCheckRow) {
  return {
    ...row,
    dry_run: row.dry_run === 1,
    gate_checks: parseStringArray(row.gate_checks),
    blocked_reasons: parseStringArray(row.blocked_reasons),
    idempotency_key_required: row.idempotency_key_required === 1,
  };
}

function parseApprovalDecisionRow(
  row: ApprovalDecisionRow,
): PublicationApprovalDecision {
  return {
    ...row,
    gate_checks: parseStringArray(row.gate_checks),
    authority_boundaries: parseStringArray(row.authority_boundaries),
  };
}

function parseApprovalRequestRow(
  row: ApprovalRequestRow,
): PublicationApprovalRequest {
  return {
    ...row,
    required_gate_checks: parseStringArray(row.required_gate_checks),
    authority_boundaries: parseStringArray(row.authority_boundaries),
  };
}

function stringifyStringArray(value: string[]) {
  return JSON.stringify(
    uniqueStrings(value.map((item) => item.trim()).filter(Boolean)),
  );
}

function parseStringArray(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function normalizeLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_READINESS_CHECK_LIMIT;
  }

  return Math.min(MAX_READINESS_CHECK_LIMIT, Math.max(1, Math.floor(limit)));
}

function assertReadinessCheckStatus(
  value: string,
): asserts value is ReadinessCheckStatus {
  if (!READINESS_CHECK_STATUSES.includes(value as ReadinessCheckStatus)) {
    throw new ReadinessCheckValidationError(
      `status must be one of: ${READINESS_CHECK_STATUSES.join(", ")}.`,
    );
  }
}

function assertTargetSurface(value: string) {
  if (!TARGET_SURFACE_PATTERN.test(value)) {
    throw new ReadinessCheckValidationError(
      "target_surface must start with a lowercase letter and contain only lowercase letters, numbers, underscores, colons, or hyphens.",
    );
  }
}

function assertReadinessCheckId(value: string) {
  if (!value.startsWith("readiness_check:") || value.trim() !== value) {
    throw new ReadinessCheckValidationError(
      "readiness_check_id must start with readiness_check: and contain no surrounding whitespace.",
    );
  }
}

function normalizeReadinessCheckId(value: string) {
  const readinessCheckId = requireNonEmptyString(
    value,
    "readiness_check_id",
  );
  assertReadinessCheckId(readinessCheckId);

  return readinessCheckId;
}

function assertApprovalDecisionId(value: string) {
  if (!value.startsWith("approval_decision:") || value.trim() !== value) {
    throw new ApprovalDecisionValidationError(
      "approval_decision_id must start with approval_decision: and contain no surrounding whitespace.",
    );
  }
}

function normalizeApprovalDecisionId(value: string) {
  const approvalDecisionId = requireNonEmptyString(
    value,
    "approval_decision_id",
  );
  assertApprovalDecisionId(approvalDecisionId);

  return approvalDecisionId;
}

function assertPublicationId(value: string) {
  if (!value.startsWith("publication:") || value.trim() !== value) {
    throw new ReadinessCheckValidationError(
      "publication_id must start with publication: and contain no surrounding whitespace.",
    );
  }
}

function normalizePublicationId(value: string) {
  const publicationId = requireNonEmptyString(value, "publication_id");
  assertPublicationId(publicationId);

  return publicationId;
}

function requireNonEmptyString(value: string, key: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ReadinessCheckValidationError(`${key} is required.`);
  }

  return value.trim();
}

function cleanNullableString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}
