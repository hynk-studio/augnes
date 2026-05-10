import { randomUUID } from "node:crypto";
import { openDatabase } from "@/lib/db";
import {
  ApprovalRequestNotFoundError,
  ApprovalRequestValidationError,
  type PublicationApprovalRequest,
} from "@/lib/publication-approval-requests";
import {
  PublicationNotFoundError,
  type PublicationDraft,
} from "@/lib/publications";
import { normalizeScope } from "@/lib/work";

const DEFAULT_APPROVAL_DECISION_LIMIT = 50;
const MAX_APPROVAL_DECISION_LIMIT = 200;
const TARGET_SURFACE_PATTERN = /^[a-z][a-z0-9_:-]{1,63}$/;

export const APPROVAL_DECISION_TYPES = ["approved"] as const;

export const DEFAULT_APPROVAL_DECISION_GATE_CHECKS = [
  "approval request exists in scope",
  "approval request status is requested",
  "linked publication exists in scope",
  "approval request target_surface and target_ref match stored publication",
  "publication status is draft before approval grant",
  "no sent delivery exists for the publication target",
  "no existing approved decision exists for this approval request",
  "approval grant is not publication",
  "dry-run remains a separate future Core-gated route",
  "publish execution remains a separate future Core-gated route",
];

export const APPROVAL_DECISION_AUTHORITY_BOUNDARIES = [
  "Approval grant is not publication.",
  "Dry-run is not publication.",
  "Publish execution remains a separate future Core-gated route.",
  "This route does not publish, retry, record proof, update mailbox status, commit or reject state, execute Codex, mutate GitHub, post to Discord, or create delivery rows.",
  "Future publish still requires explicit target approval, approved publication status, dry_run=false, stored target_ref, required idempotency_key, delivery freshness, token availability, and replay/no-duplicate evidence.",
  "PR #67 does not authorize automatic posting.",
];

export type ApprovalDecisionType = (typeof APPROVAL_DECISION_TYPES)[number];

export type PublicationApprovalDecision = {
  approval_decision_id: string;
  scope: string;
  approval_request_id: string;
  publication_id: string;
  work_id: string | null;
  target_surface: string;
  target_ref: string;
  decision: ApprovalDecisionType | string;
  decided_by: string;
  decided_at: string;
  decision_reason: string;
  gate_checks: string[];
  authority_boundaries: string[];
  source_control_packet_ref: string | null;
  created_at: string;
};

export type ApprovalDecisionInput = {
  approval_decision_id?: string;
  scope?: string | null;
  approval_request_id: string;
  decided_by: string;
  decision_reason: string;
  gate_checks?: string[];
  authority_boundaries?: string[];
  source_control_packet_ref?: string | null;
  decided_at?: string;
};

export type ApprovalDecisionResult = {
  scope: string;
  approval_decision: PublicationApprovalDecision;
  approval_request: PublicationApprovalRequest;
  publication: PublicationDraft;
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

export class ApprovalDecisionNotFoundError extends Error {
  constructor(approvalDecisionId: string, scope: string | null) {
    super(
      scope
        ? `Unknown approval_decision_id ${approvalDecisionId} for scope ${scope}.`
        : `Unknown approval_decision_id ${approvalDecisionId}.`,
    );
    this.name = "ApprovalDecisionNotFoundError";
  }
}

export class ApprovalDecisionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApprovalDecisionValidationError";
  }
}

export class ApprovalDecisionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApprovalDecisionConflictError";
  }
}

export function listPublicationApprovalDecisions({
  scope,
  approvalRequestId,
  publicationId,
  targetSurface,
  limit = DEFAULT_APPROVAL_DECISION_LIMIT,
}: {
  scope?: string | null;
  approvalRequestId?: string | null;
  publicationId?: string | null;
  targetSurface?: string | null;
  limit?: number;
}) {
  const normalizedScope = normalizeScope(scope);
  const clauses = ["scope = ?"];
  const params: Array<string | number> = [normalizedScope];

  if (approvalRequestId) {
    clauses.push("approval_request_id = ?");
    params.push(normalizeApprovalRequestId(approvalRequestId));
  }

  if (publicationId) {
    clauses.push("publication_id = ?");
    params.push(normalizePublicationId(publicationId));
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
          WHERE ${clauses.join(" AND ")}
          ORDER BY decided_at DESC, approval_decision_id ASC
          LIMIT ?
        `,
      )
      .all(...params) as ApprovalDecisionRow[];

    return rows.map(parseApprovalDecisionRow);
  } finally {
    db.close();
  }
}

export function getPublicationApprovalDecision(
  approvalDecisionId: string,
  scope?: string | null,
) {
  const normalizedScope = scope ? normalizeScope(scope) : null;
  const db = openDatabase();

  try {
    const row = selectApprovalDecisionByIdOrNull(
      db,
      normalizeApprovalDecisionId(approvalDecisionId),
      normalizedScope,
    );

    return row ? parseApprovalDecisionRow(row) : null;
  } finally {
    db.close();
  }
}

export function getApprovalDecisionByRequest(
  approvalRequestId: string,
  scope?: string | null,
) {
  const normalizedScope = scope ? normalizeScope(scope) : null;
  const db = openDatabase();

  try {
    const row = selectApprovalDecisionByRequestOrNull(
      db,
      normalizeApprovalRequestId(approvalRequestId),
      normalizedScope,
    );

    return row ? parseApprovalDecisionRow(row) : null;
  } finally {
    db.close();
  }
}

export function approvePublicationApprovalRequest(
  input: ApprovalDecisionInput,
): ApprovalDecisionResult {
  const scope = normalizeScope(input.scope);
  const approvalRequestId = normalizeApprovalRequestId(
    input.approval_request_id,
  );
  const decidedAt = input.decided_at ?? new Date().toISOString();
  const row = {
    approval_decision_id:
      cleanNullableString(input.approval_decision_id) ??
      `approval_decision:${randomUUID()}`,
    scope,
    approval_request_id: approvalRequestId,
    publication_id: "",
    work_id: null as string | null,
    target_surface: "",
    target_ref: "",
    decision: "approved" as const,
    decided_by: requireNonEmptyString(input.decided_by, "decided_by"),
    decided_at: decidedAt,
    decision_reason: requireNonEmptyString(
      input.decision_reason,
      "decision_reason",
    ),
    gate_checks: stringifyStringArray(
      input.gate_checks ?? DEFAULT_APPROVAL_DECISION_GATE_CHECKS,
    ),
    authority_boundaries: stringifyStringArray(
      input.authority_boundaries ?? APPROVAL_DECISION_AUTHORITY_BOUNDARIES,
    ),
    source_control_packet_ref: cleanNullableString(
      input.source_control_packet_ref,
    ),
    created_at: decidedAt,
  };
  assertApprovalDecisionId(row.approval_decision_id);

  const db = openDatabase();

  try {
    return db.transaction(() => {
      const approvalRequest = selectApprovalRequestByIdOrNull(
        db,
        approvalRequestId,
        scope,
      );
      if (!approvalRequest) {
        throw new ApprovalRequestNotFoundError(approvalRequestId, scope);
      }
      if (approvalRequest.status !== "requested") {
        throw new ApprovalDecisionValidationError(
          `Approval request status must be requested; found ${approvalRequest.status}.`,
        );
      }

      const existingDecision = selectApprovalDecisionByRequestOrNull(
        db,
        approvalRequestId,
        scope,
      );
      if (existingDecision) {
        throw new ApprovalDecisionConflictError(
          "Approval request already has an approved decision.",
        );
      }

      const publication = selectPublicationByIdOrNull(
        db,
        approvalRequest.publication_id,
        scope,
      );
      if (!publication) {
        throw new PublicationNotFoundError(
          approvalRequest.publication_id,
          scope,
        );
      }

      validateTargetMatch(approvalRequest, publication);
      if (publication.status !== "draft") {
        throw new ApprovalDecisionConflictError(
          `Publication status must be draft before C3 approval grant; found ${publication.status}.`,
        );
      }
      if (hasSentDeliveryForPublicationTarget(db, publication)) {
        throw new ApprovalDecisionConflictError(
          "A sent delivery already exists for this publication target.",
        );
      }

      const decisionRow = {
        ...row,
        publication_id: publication.publication_id,
        work_id: publication.work_id,
        target_surface: publication.target_surface,
        target_ref: publication.target_ref,
      };

      db.prepare(
        `
          INSERT INTO publication_approval_decisions (
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
          )
          VALUES (
            @approval_decision_id,
            @scope,
            @approval_request_id,
            @publication_id,
            @work_id,
            @target_surface,
            @target_ref,
            @decision,
            @decided_by,
            @decided_at,
            @decision_reason,
            @gate_checks,
            @authority_boundaries,
            @source_control_packet_ref,
            @created_at
          )
        `,
      ).run(decisionRow);

      db.prepare(
        `
          UPDATE publication_drafts
          SET
            status = 'approved',
            approved_by = ?,
            updated_at = ?
          WHERE publication_id = ?
            AND scope = ?
        `,
      ).run(row.decided_by, decidedAt, publication.publication_id, scope);

      const approvalDecision = selectApprovalDecisionById(
        db,
        row.approval_decision_id,
        scope,
      );
      const updatedPublication = selectPublicationById(
        db,
        publication.publication_id,
        scope,
      );

      return {
        scope,
        approval_decision: approvalDecision,
        approval_request: parseApprovalRequestRow(approvalRequest),
        publication: updatedPublication,
      };
    })();
  } finally {
    db.close();
  }
}

function selectApprovalDecisionById(
  db: ReturnType<typeof openDatabase>,
  approvalDecisionId: string,
  scope?: string | null,
) {
  const row = selectApprovalDecisionByIdOrNull(db, approvalDecisionId, scope);
  if (!row) {
    throw new ApprovalDecisionNotFoundError(approvalDecisionId, scope ?? null);
  }

  return parseApprovalDecisionRow(row);
}

function selectApprovalDecisionByIdOrNull(
  db: ReturnType<typeof openDatabase>,
  approvalDecisionId: string,
  scope?: string | null,
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
          ${scope ? "AND scope = ?" : ""}
      `,
    )
    .get(...([approvalDecisionId, scope].filter(Boolean) as string[])) as
    | ApprovalDecisionRow
    | undefined;
}

function selectApprovalDecisionByRequestOrNull(
  db: ReturnType<typeof openDatabase>,
  approvalRequestId: string,
  scope?: string | null,
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
        WHERE approval_request_id = ?
          AND decision = 'approved'
          ${scope ? "AND scope = ?" : ""}
        ORDER BY decided_at DESC, approval_decision_id ASC
        LIMIT 1
      `,
    )
    .get(...([approvalRequestId, scope].filter(Boolean) as string[])) as
    | ApprovalDecisionRow
    | undefined;
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

function selectPublicationById(
  db: ReturnType<typeof openDatabase>,
  publicationId: string,
  scope: string,
) {
  const row = selectPublicationByIdOrNull(db, publicationId, scope);
  if (!row) {
    throw new PublicationNotFoundError(publicationId, scope);
  }

  return row;
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

function hasSentDeliveryForPublicationTarget(
  db: ReturnType<typeof openDatabase>,
  publication: PublicationDraft,
) {
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
            AND status = 'sent'
          LIMIT 1
        `,
      )
      .get(
        publication.scope,
        publication.publication_id,
        publication.target_surface,
        publication.target_ref,
      ),
  );
}

function validateTargetMatch(
  approvalRequest: ApprovalRequestRow,
  publication: PublicationDraft,
) {
  if (
    approvalRequest.target_surface !== publication.target_surface ||
    approvalRequest.target_ref !== publication.target_ref
  ) {
    throw new ApprovalDecisionValidationError(
      "Approval request target_surface and target_ref must match the stored publication target.",
    );
  }
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
    return DEFAULT_APPROVAL_DECISION_LIMIT;
  }

  return Math.min(MAX_APPROVAL_DECISION_LIMIT, Math.max(1, Math.floor(limit)));
}

function assertTargetSurface(value: string) {
  if (!TARGET_SURFACE_PATTERN.test(value)) {
    throw new ApprovalDecisionValidationError(
      "target_surface must start with a lowercase letter and contain only lowercase letters, numbers, underscores, colons, or hyphens.",
    );
  }
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

function assertApprovalRequestId(value: string) {
  if (!value.startsWith("approval_request:") || value.trim() !== value) {
    throw new ApprovalRequestValidationError(
      "approval_request_id must start with approval_request: and contain no surrounding whitespace.",
    );
  }
}

function normalizeApprovalRequestId(value: string) {
  const approvalRequestId = requireNonEmptyString(
    value,
    "approval_request_id",
  );
  assertApprovalRequestId(approvalRequestId);

  return approvalRequestId;
}

function assertPublicationId(value: string) {
  if (!value.startsWith("publication:") || value.trim() !== value) {
    throw new ApprovalDecisionValidationError(
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
    throw new ApprovalDecisionValidationError(`${key} is required.`);
  }

  return value.trim();
}

function cleanNullableString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}
