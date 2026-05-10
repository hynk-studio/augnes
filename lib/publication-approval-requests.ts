import { randomUUID } from "node:crypto";
import { openDatabase } from "@/lib/db";
import {
  PublicationNotFoundError,
  getPublication,
} from "@/lib/publications";
import { normalizeScope } from "@/lib/work";

const DEFAULT_APPROVAL_REQUEST_LIMIT = 50;
const MAX_APPROVAL_REQUEST_LIMIT = 200;
const TARGET_SURFACE_PATTERN = /^[a-z][a-z0-9_:-]{1,63}$/;

export const APPROVAL_REQUEST_STATUSES = [
  "requested",
  "superseded",
  "cancelled",
  "expired",
] as const;

export const DEFAULT_REQUIRED_GATE_CHECKS = [
  "publication exists",
  "target_surface and target_ref match stored publication",
  "approval request is target-specific",
  "approval is not publication",
  "publish execution remains a separate Core-gated route",
  "dry-run is not publication",
  "idempotency_key will be required for future publish execution",
  "PR #67 does not authorize automatic posting",
];

export const DEFAULT_AUTHORITY_BOUNDARIES = [
  "user remains durable approval authority",
  "Augnes Core remains source of truth and gate authority",
  "ChatGPT Apps may display decisions but cannot approve or publish",
  "Cockpit may observe but cannot become hidden authority",
  "Codex may implement and verify but cannot publish externally without explicit approval",
  "GitHub is an external side-effect target, not Augnes authority",
];

export type ApprovalRequestStatus =
  (typeof APPROVAL_REQUEST_STATUSES)[number];

export type PublicationApprovalRequest = {
  approval_request_id: string;
  scope: string;
  publication_id: string;
  work_id: string | null;
  target_surface: string;
  target_ref: string;
  requested_by: string;
  requested_at: string;
  status: ApprovalRequestStatus | string;
  decision_prompt: string;
  side_effect_summary: string;
  required_gate_checks: string[];
  authority_boundaries: string[];
  source_control_packet_ref: string | null;
  created_at: string;
  updated_at: string;
  supersedes_request_id: string | null;
};

export type ApprovalRequestInput = {
  approval_request_id?: string;
  scope?: string | null;
  publication_id: string;
  requested_by: string;
  decision_prompt: string;
  side_effect_summary: string;
  required_gate_checks?: string[];
  authority_boundaries?: string[];
  source_control_packet_ref?: string | null;
  supersedes_request_id?: string | null;
  status?: ApprovalRequestStatus;
  created_at?: string;
};

type ApprovalRequestRow = Omit<
  PublicationApprovalRequest,
  "required_gate_checks" | "authority_boundaries"
> & {
  required_gate_checks: string;
  authority_boundaries: string;
};

export class ApprovalRequestNotFoundError extends Error {
  constructor(approvalRequestId: string, scope: string | null) {
    super(
      scope
        ? `Unknown approval_request_id ${approvalRequestId} for scope ${scope}.`
        : `Unknown approval_request_id ${approvalRequestId}.`,
    );
    this.name = "ApprovalRequestNotFoundError";
  }
}

export class ApprovalRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApprovalRequestValidationError";
  }
}

export function listPublicationApprovalRequests({
  scope,
  publicationId,
  status,
  targetSurface,
  limit = DEFAULT_APPROVAL_REQUEST_LIMIT,
}: {
  scope?: string | null;
  publicationId?: string | null;
  status?: ApprovalRequestStatus | null;
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

  if (status) {
    assertApprovalRequestStatus(status);
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
          WHERE ${clauses.join(" AND ")}
          ORDER BY requested_at DESC, approval_request_id ASC
          LIMIT ?
        `,
      )
      .all(...params) as ApprovalRequestRow[];

    return rows.map(parseApprovalRequestRow);
  } finally {
    db.close();
  }
}

export function getPublicationApprovalRequest(
  approvalRequestId: string,
  scope?: string | null,
) {
  const normalizedScope = scope ? normalizeScope(scope) : null;
  const db = openDatabase();

  try {
    const row = selectApprovalRequestByIdOrNull(
      db,
      normalizeApprovalRequestId(approvalRequestId),
      normalizedScope,
    );

    return row ? parseApprovalRequestRow(row) : null;
  } finally {
    db.close();
  }
}

export function createPublicationApprovalRequest(input: ApprovalRequestInput) {
  const now = input.created_at ?? new Date().toISOString();
  const scope = normalizeScope(input.scope);
  const publicationId = normalizePublicationId(input.publication_id);
  const status = input.status ?? "requested";
  assertApprovalRequestStatus(status);
  if (status !== "requested") {
    throw new ApprovalRequestValidationError(
      "Approval requests must be created with status requested. C1 does not grant, cancel, expire, supersede, publish, or retry.",
    );
  }

  const publication = getPublication(publicationId, scope);
  if (!publication) {
    throw new PublicationNotFoundError(publicationId, scope);
  }

  const supersedesRequestId = cleanNullableString(input.supersedes_request_id);
  const row = {
    approval_request_id:
      cleanNullableString(input.approval_request_id) ??
      `approval_request:${randomUUID()}`,
    scope,
    publication_id: publication.publication_id,
    work_id: publication.work_id,
    target_surface: normalizeTargetSurface(publication.target_surface),
    target_ref: requireNonEmptyString(publication.target_ref, "target_ref"),
    requested_by: requireNonEmptyString(input.requested_by, "requested_by"),
    requested_at: now,
    status,
    decision_prompt: requireNonEmptyString(
      input.decision_prompt,
      "decision_prompt",
    ),
    side_effect_summary: requireNonEmptyString(
      input.side_effect_summary,
      "side_effect_summary",
    ),
    required_gate_checks: stringifyStringArray(
      input.required_gate_checks ?? DEFAULT_REQUIRED_GATE_CHECKS,
    ),
    authority_boundaries: stringifyStringArray(
      input.authority_boundaries ?? DEFAULT_AUTHORITY_BOUNDARIES,
    ),
    source_control_packet_ref: cleanNullableString(
      input.source_control_packet_ref,
    ),
    created_at: now,
    updated_at: now,
    supersedes_request_id: supersedesRequestId,
  };

  assertApprovalRequestId(row.approval_request_id);
  validatePublicationTargetCopy({
    publicationTargetSurface: publication.target_surface,
    publicationTargetRef: publication.target_ref,
    requestTargetSurface: row.target_surface,
    requestTargetRef: row.target_ref,
  });

  const db = openDatabase();
  let approvalRequest: PublicationApprovalRequest;

  try {
    approvalRequest = db.transaction(() => {
      if (supersedesRequestId) {
        selectApprovalRequestById(db, supersedesRequestId, scope);
      }

      db.prepare(
        `
          INSERT INTO publication_approval_requests (
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
          )
          VALUES (
            @approval_request_id,
            @scope,
            @publication_id,
            @work_id,
            @target_surface,
            @target_ref,
            @requested_by,
            @requested_at,
            @status,
            @decision_prompt,
            @side_effect_summary,
            @required_gate_checks,
            @authority_boundaries,
            @source_control_packet_ref,
            @created_at,
            @updated_at,
            @supersedes_request_id
          )
        `,
      ).run(row);

      return selectApprovalRequestById(db, row.approval_request_id);
    })();
  } finally {
    db.close();
  }

  return approvalRequest;
}

function selectApprovalRequestById(
  db: ReturnType<typeof openDatabase>,
  approvalRequestId: string,
  scope?: string | null,
) {
  const row = selectApprovalRequestByIdOrNull(db, approvalRequestId, scope);
  if (!row) {
    throw new ApprovalRequestNotFoundError(approvalRequestId, scope ?? null);
  }

  return parseApprovalRequestRow(row);
}

function selectApprovalRequestByIdOrNull(
  db: ReturnType<typeof openDatabase>,
  approvalRequestId: string,
  scope?: string | null,
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
          ${scope ? "AND scope = ?" : ""}
      `,
    )
    .get(...([approvalRequestId, scope].filter(Boolean) as string[])) as
    | ApprovalRequestRow
    | undefined;
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

function validatePublicationTargetCopy({
  publicationTargetSurface,
  publicationTargetRef,
  requestTargetSurface,
  requestTargetRef,
}: {
  publicationTargetSurface: string;
  publicationTargetRef: string;
  requestTargetSurface: string;
  requestTargetRef: string;
}) {
  if (
    requestTargetSurface !== publicationTargetSurface ||
    requestTargetRef !== publicationTargetRef
  ) {
    throw new ApprovalRequestValidationError(
      "Approval request target_surface and target_ref must match the stored publication target.",
    );
  }
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
    return DEFAULT_APPROVAL_REQUEST_LIMIT;
  }

  return Math.min(MAX_APPROVAL_REQUEST_LIMIT, Math.max(1, Math.floor(limit)));
}

function assertApprovalRequestStatus(
  value: string,
): asserts value is ApprovalRequestStatus {
  if (!APPROVAL_REQUEST_STATUSES.includes(value as ApprovalRequestStatus)) {
    throw new ApprovalRequestValidationError(
      `status must be one of: ${APPROVAL_REQUEST_STATUSES.join(", ")}.`,
    );
  }
}

function normalizeTargetSurface(value: string) {
  const targetSurface = requireNonEmptyString(value, "target_surface");
  assertTargetSurface(targetSurface);

  return targetSurface;
}

function assertTargetSurface(value: string) {
  if (!TARGET_SURFACE_PATTERN.test(value)) {
    throw new ApprovalRequestValidationError(
      "target_surface must start with a lowercase letter and contain only lowercase letters, numbers, underscores, colons, or hyphens.",
    );
  }
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
    throw new ApprovalRequestValidationError(
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
    throw new ApprovalRequestValidationError(`${key} is required.`);
  }

  return value.trim();
}

function cleanNullableString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}
