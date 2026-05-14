import { randomUUID } from "node:crypto";
import { openDatabase } from "@/lib/db";
import { normalizeScope, normalizeWorkId } from "@/lib/work";

const DEFAULT_SCOPE = "project:augnes";
export const TEMPORAL_INTERPRETATION_WORK_ID = "AG-TEMPORAL-INTERPRETATION";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export const TEMPORAL_REVIEW_CAPTURE_MODES = [
  "mock",
  "openai",
  "mock_fallback",
  "route_capture",
  "cockpit_capture",
] as const;

export const TEMPORAL_REVIEW_VERDICTS = [
  "pass",
  "pass_with_notes",
  "fail",
  "not_reviewed",
] as const;

export const TEMPORAL_REVIEW_REDACTION_STATUSES = [
  "redacted",
  "bounded",
  "raw_disallowed",
] as const;

const FORBIDDEN_FIELDS = [
  "approval_status",
  "publish_status",
  "replay_status",
  "commit_status",
  "memory_admission_status",
  "durable_perspective_snapshot_id",
  "raw_openai_response",
  "secret_material",
  "cockpit_dom_as_truth",
  "safe_next_step_instruction",
  "user_preference_as_readiness",
  "summary_only_ref_as_evidence",
] as const;

const JSON_ARRAY_FIELDS = [
  "source_refs",
  "evidence_anchor_refs",
  "summary_refs",
  "counterexample_refs",
  "residual_tension_refs",
  "admission_decisions_json",
  "guardrail_warnings_json",
  "linked_evidence_record_ids",
] as const;

export type TemporalReviewCaptureMode =
  (typeof TEMPORAL_REVIEW_CAPTURE_MODES)[number];
export type TemporalReviewVerdict = (typeof TEMPORAL_REVIEW_VERDICTS)[number];
export type TemporalReviewRedactionStatus =
  (typeof TEMPORAL_REVIEW_REDACTION_STATUSES)[number];

export type TemporalPreviewReviewArtifact = {
  artifact_id: string;
  scope: string;
  work_id: string;
  source_route: string;
  source_surface: string;
  source_ref: string | null;
  generator: string;
  model: string | null;
  as_of: string;
  capture_mode: TemporalReviewCaptureMode;
  preview_excerpt: string;
  bounded_preview_json: unknown;
  preview_hash: string | null;
  source_refs: string[];
  evidence_anchor_refs: string[];
  summary_refs: string[];
  counterexample_refs: string[];
  residual_tension_refs: string[];
  admission_decisions_json: unknown[];
  guardrail_passed: boolean;
  guardrail_warnings_json: unknown[];
  reviewer_verdict: TemporalReviewVerdict;
  reviewer_notes: string | null;
  manual_review_report_path: string | null;
  linked_evidence_record_ids: string[];
  linked_session_id: string | null;
  linked_pr_url: string | null;
  redaction_status: TemporalReviewRedactionStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TemporalPreviewReviewArtifactInput = {
  artifact_id?: string | null;
  scope?: string | null;
  work_id: string;
  source_route: string;
  source_surface: string;
  source_ref?: string | null;
  generator: string;
  model?: string | null;
  as_of: string;
  capture_mode: string;
  preview_excerpt: string;
  bounded_preview_json: unknown;
  preview_hash?: string | null;
  source_refs?: unknown[] | string | null;
  evidence_anchor_refs?: unknown[] | string | null;
  summary_refs?: unknown[] | string | null;
  counterexample_refs?: unknown[] | string | null;
  residual_tension_refs?: unknown[] | string | null;
  admission_decisions_json?: unknown[] | string | null;
  guardrail_passed: boolean | number;
  guardrail_warnings_json?: unknown[] | string | null;
  reviewer_verdict: string;
  reviewer_notes?: string | null;
  manual_review_report_path?: string | null;
  linked_evidence_record_ids?: unknown[] | string | null;
  linked_session_id?: string | null;
  linked_pr_url?: string | null;
  redaction_status: string;
  created_by: string;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type TemporalPreviewReviewArtifactFilters = {
  scope?: string | null;
  work_id?: string | null;
  generator?: string | null;
  reviewer_verdict?: string | null;
  guardrail_passed?: boolean | number | string | null;
  linked_session_id?: string | null;
  linked_pr_url?: string | null;
  limit?: number | string | null;
};

type TemporalPreviewReviewArtifactRow = Omit<
  TemporalPreviewReviewArtifact,
  | "bounded_preview_json"
  | "source_refs"
  | "evidence_anchor_refs"
  | "summary_refs"
  | "counterexample_refs"
  | "residual_tension_refs"
  | "admission_decisions_json"
  | "guardrail_passed"
  | "guardrail_warnings_json"
  | "linked_evidence_record_ids"
> & {
  bounded_preview_json: string;
  source_refs: string;
  evidence_anchor_refs: string;
  summary_refs: string;
  counterexample_refs: string;
  residual_tension_refs: string;
  admission_decisions_json: string;
  guardrail_passed: number;
  guardrail_warnings_json: string;
  linked_evidence_record_ids: string;
};

type NormalizedTemporalPreviewReviewArtifactRow =
  TemporalPreviewReviewArtifactRow;

export class TemporalPreviewReviewArtifactValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemporalPreviewReviewArtifactValidationError";
  }
}

export function normalizeTemporalReviewArtifactId(artifactId?: string | null) {
  const value = artifactId?.trim();
  return value && value.length > 0 ? value : `temporal-review:${randomUUID()}`;
}

export function normalizeTemporalReviewArtifactScope(scope?: string | null) {
  return normalizeScope(scope ?? DEFAULT_SCOPE);
}

export function listTemporalPreviewReviewArtifacts(
  filters: TemporalPreviewReviewArtifactFilters = {},
) {
  const normalizedScope = normalizeTemporalReviewArtifactScope(filters.scope);
  const clauses = ["scope = ?"];
  const params: Array<string | number> = [normalizedScope];

  addOptionalClause(clauses, params, "work_id", normalizeNullableWorkId(filters.work_id));
  addOptionalClause(clauses, params, "generator", cleanNullableString(filters.generator));
  addOptionalClause(
    clauses,
    params,
    "reviewer_verdict",
    normalizeNullableReviewerVerdict(filters.reviewer_verdict),
  );
  addOptionalClause(
    clauses,
    params,
    "guardrail_passed",
    normalizeNullableGuardrail(filters.guardrail_passed),
  );
  addOptionalClause(
    clauses,
    params,
    "linked_session_id",
    cleanNullableString(filters.linked_session_id),
  );
  addOptionalClause(
    clauses,
    params,
    "linked_pr_url",
    cleanNullableString(filters.linked_pr_url),
  );

  params.push(normalizeLimit(filters.limit));
  const db = openDatabase();

  try {
    const rows = db
      .prepare(
        `
          SELECT ${selectColumns()}
          FROM temporal_preview_review_artifacts
          WHERE ${clauses.join(" AND ")}
          ORDER BY created_at DESC, artifact_id ASC
          LIMIT ?
        `,
      )
      .all(...params) as TemporalPreviewReviewArtifactRow[];

    return rows.map(parseTemporalPreviewReviewArtifactRow);
  } finally {
    db.close();
  }
}

export function getTemporalPreviewReviewArtifact(
  artifactId: string,
  scope?: string | null,
) {
  const normalizedId = requireNonEmptyString(artifactId, "artifact_id");
  const normalizedScope = normalizeTemporalReviewArtifactScope(scope);
  const db = openDatabase();

  try {
    const row = db
      .prepare(
        `
          SELECT ${selectColumns()}
          FROM temporal_preview_review_artifacts
          WHERE scope = ? AND artifact_id = ?
        `,
      )
      .get(normalizedScope, normalizedId) as
      | TemporalPreviewReviewArtifactRow
      | undefined;

    return row ? parseTemporalPreviewReviewArtifactRow(row) : null;
  } finally {
    db.close();
  }
}

export function insertTemporalPreviewReviewArtifactForSmoke(
  input: TemporalPreviewReviewArtifactInput,
) {
  const row = validateTemporalPreviewReviewArtifactInput(input);
  const db = openDatabase();

  try {
    assertWorkExists(db, row.scope, row.work_id);
    assertLinkedSessionExists(db, row.linked_session_id);
    assertLinkedEvidenceRecordsExist(db, row.scope, row.linked_evidence_record_ids);

    db.prepare(
      `
        INSERT INTO temporal_preview_review_artifacts (
          artifact_id,
          scope,
          work_id,
          source_route,
          source_surface,
          source_ref,
          generator,
          model,
          as_of,
          capture_mode,
          preview_excerpt,
          bounded_preview_json,
          preview_hash,
          source_refs,
          evidence_anchor_refs,
          summary_refs,
          counterexample_refs,
          residual_tension_refs,
          admission_decisions_json,
          guardrail_passed,
          guardrail_warnings_json,
          reviewer_verdict,
          reviewer_notes,
          manual_review_report_path,
          linked_evidence_record_ids,
          linked_session_id,
          linked_pr_url,
          redaction_status,
          created_by,
          created_at,
          updated_at
        )
        VALUES (
          @artifact_id,
          @scope,
          @work_id,
          @source_route,
          @source_surface,
          @source_ref,
          @generator,
          @model,
          @as_of,
          @capture_mode,
          @preview_excerpt,
          @bounded_preview_json,
          @preview_hash,
          @source_refs,
          @evidence_anchor_refs,
          @summary_refs,
          @counterexample_refs,
          @residual_tension_refs,
          @admission_decisions_json,
          @guardrail_passed,
          @guardrail_warnings_json,
          @reviewer_verdict,
          @reviewer_notes,
          @manual_review_report_path,
          @linked_evidence_record_ids,
          @linked_session_id,
          @linked_pr_url,
          @redaction_status,
          @created_by,
          @created_at,
          @updated_at
        )
      `,
    ).run(row);

    return selectTemporalPreviewReviewArtifactById(db, row.scope, row.artifact_id);
  } finally {
    db.close();
  }
}

export function validateTemporalPreviewReviewArtifactRow(
  row: TemporalPreviewReviewArtifactRow,
) {
  return parseTemporalPreviewReviewArtifactRow(row);
}

export function serializeJsonArrayField(value: unknown[] | string | null | undefined) {
  return JSON.stringify(normalizeJsonArray(value));
}

export function deserializeJsonArrayField(value: string, fieldName = "json_array") {
  const parsed = parseJson(value, fieldName);
  if (!Array.isArray(parsed)) {
    throw new TemporalPreviewReviewArtifactValidationError(
      `${fieldName} must be a JSON array.`,
    );
  }

  return parsed;
}

function validateTemporalPreviewReviewArtifactInput(
  input: TemporalPreviewReviewArtifactInput,
): NormalizedTemporalPreviewReviewArtifactRow {
  rejectForbiddenFields(input);
  const now = new Date().toISOString();
  const scope = normalizeTemporalReviewArtifactScope(input.scope);
  const workId = normalizeWorkId(requireNonEmptyString(input.work_id, "work_id"));
  if (workId !== TEMPORAL_INTERPRETATION_WORK_ID) {
    throw new TemporalPreviewReviewArtifactValidationError(
      `work_id must be ${TEMPORAL_INTERPRETATION_WORK_ID}.`,
    );
  }

  const captureMode = requireEnum(
    input.capture_mode,
    "capture_mode",
    TEMPORAL_REVIEW_CAPTURE_MODES,
  );
  const reviewerVerdict = requireEnum(
    input.reviewer_verdict,
    "reviewer_verdict",
    TEMPORAL_REVIEW_VERDICTS,
  );
  const redactionStatus = requireEnum(
    input.redaction_status,
    "redaction_status",
    TEMPORAL_REVIEW_REDACTION_STATUSES,
  );
  const sourceRefs = normalizeStringArray(input.source_refs, "source_refs");
  const evidenceAnchorRefs = normalizeStringArray(
    input.evidence_anchor_refs,
    "evidence_anchor_refs",
  );
  const summaryRefs = normalizeStringArray(input.summary_refs, "summary_refs");
  assertSummaryRefsNotEvidenceAnchors(evidenceAnchorRefs, summaryRefs);

  return {
    artifact_id: normalizeTemporalReviewArtifactId(input.artifact_id),
    scope,
    work_id: workId,
    source_route: requireRouteString(input.source_route),
    source_surface: requireNonEmptyString(input.source_surface, "source_surface"),
    source_ref: cleanNullableString(input.source_ref),
    generator: requireNonEmptyString(input.generator, "generator"),
    model: cleanNullableString(input.model),
    as_of: requireNonEmptyString(input.as_of, "as_of"),
    capture_mode: captureMode,
    preview_excerpt: requireNonEmptyString(input.preview_excerpt, "preview_excerpt"),
    bounded_preview_json: serializeBoundedPreview(input.bounded_preview_json),
    preview_hash: cleanNullableString(input.preview_hash),
    source_refs: JSON.stringify(sourceRefs),
    evidence_anchor_refs: JSON.stringify(evidenceAnchorRefs),
    summary_refs: JSON.stringify(summaryRefs),
    counterexample_refs: JSON.stringify(
      normalizeStringArray(input.counterexample_refs, "counterexample_refs"),
    ),
    residual_tension_refs: JSON.stringify(
      normalizeStringArray(input.residual_tension_refs, "residual_tension_refs"),
    ),
    admission_decisions_json: serializeJsonArrayField(input.admission_decisions_json),
    guardrail_passed: normalizeGuardrailPassed(input.guardrail_passed),
    guardrail_warnings_json: serializeJsonArrayField(input.guardrail_warnings_json),
    reviewer_verdict: reviewerVerdict,
    reviewer_notes: cleanNullableString(input.reviewer_notes),
    manual_review_report_path: cleanNullableString(input.manual_review_report_path),
    linked_evidence_record_ids: JSON.stringify(
      normalizeStringArray(
        input.linked_evidence_record_ids,
        "linked_evidence_record_ids",
      ),
    ),
    linked_session_id: cleanNullableString(input.linked_session_id),
    linked_pr_url: cleanNullableString(input.linked_pr_url),
    redaction_status: redactionStatus,
    created_by: requireNonEmptyString(input.created_by, "created_by"),
    created_at: cleanNullableString(input.created_at) ?? now,
    updated_at: cleanNullableString(input.updated_at) ?? now,
  };
}

function parseTemporalPreviewReviewArtifactRow(
  row: TemporalPreviewReviewArtifactRow,
): TemporalPreviewReviewArtifact {
  const artifact: TemporalPreviewReviewArtifact = {
    ...row,
    bounded_preview_json: parseJson(
      row.bounded_preview_json,
      "bounded_preview_json",
    ),
    source_refs: parseStringArray(row.source_refs, "source_refs"),
    evidence_anchor_refs: parseStringArray(
      row.evidence_anchor_refs,
      "evidence_anchor_refs",
    ),
    summary_refs: parseStringArray(row.summary_refs, "summary_refs"),
    counterexample_refs: parseStringArray(
      row.counterexample_refs,
      "counterexample_refs",
    ),
    residual_tension_refs: parseStringArray(
      row.residual_tension_refs,
      "residual_tension_refs",
    ),
    admission_decisions_json: deserializeJsonArrayField(
      row.admission_decisions_json,
      "admission_decisions_json",
    ),
    guardrail_passed: row.guardrail_passed === 1,
    guardrail_warnings_json: deserializeJsonArrayField(
      row.guardrail_warnings_json,
      "guardrail_warnings_json",
    ),
    linked_evidence_record_ids: parseStringArray(
      row.linked_evidence_record_ids,
      "linked_evidence_record_ids",
    ),
  };
  assertSummaryRefsNotEvidenceAnchors(
    artifact.evidence_anchor_refs,
    artifact.summary_refs,
  );
  assertKnownEnum(
    artifact.capture_mode,
    "capture_mode",
    TEMPORAL_REVIEW_CAPTURE_MODES,
  );
  assertKnownEnum(
    artifact.reviewer_verdict,
    "reviewer_verdict",
    TEMPORAL_REVIEW_VERDICTS,
  );
  assertKnownEnum(
    artifact.redaction_status,
    "redaction_status",
    TEMPORAL_REVIEW_REDACTION_STATUSES,
  );

  return artifact;
}

function selectTemporalPreviewReviewArtifactById(
  db: ReturnType<typeof openDatabase>,
  scope: string,
  artifactId: string,
) {
  const row = db
    .prepare(
      `
        SELECT ${selectColumns()}
        FROM temporal_preview_review_artifacts
        WHERE scope = ? AND artifact_id = ?
      `,
    )
    .get(scope, artifactId) as TemporalPreviewReviewArtifactRow | undefined;

  if (!row) {
    throw new TemporalPreviewReviewArtifactValidationError(
      `Failed to read artifact_id ${artifactId}.`,
    );
  }

  return parseTemporalPreviewReviewArtifactRow(row);
}

function selectColumns() {
  return `
    artifact_id,
    scope,
    work_id,
    source_route,
    source_surface,
    source_ref,
    generator,
    model,
    as_of,
    capture_mode,
    preview_excerpt,
    bounded_preview_json,
    preview_hash,
    source_refs,
    evidence_anchor_refs,
    summary_refs,
    counterexample_refs,
    residual_tension_refs,
    admission_decisions_json,
    guardrail_passed,
    guardrail_warnings_json,
    reviewer_verdict,
    reviewer_notes,
    manual_review_report_path,
    linked_evidence_record_ids,
    linked_session_id,
    linked_pr_url,
    redaction_status,
    created_by,
    created_at,
    updated_at
  `;
}

function assertWorkExists(
  db: ReturnType<typeof openDatabase>,
  scope: string,
  workId: string,
) {
  const row = db
    .prepare("SELECT work_id FROM work_items WHERE scope = ? AND work_id = ?")
    .get(scope, workId);
  if (!row) {
    throw new TemporalPreviewReviewArtifactValidationError(
      `Unknown work_id ${workId} for scope ${scope}.`,
    );
  }
}

function assertLinkedSessionExists(
  db: ReturnType<typeof openDatabase>,
  sessionId: string | null,
) {
  if (!sessionId) {
    return;
  }

  const row = db.prepare("SELECT id FROM sessions WHERE id = ?").get(sessionId);
  if (!row) {
    throw new TemporalPreviewReviewArtifactValidationError(
      `Unknown linked_session_id ${sessionId}.`,
    );
  }
}

function assertLinkedEvidenceRecordsExist(
  db: ReturnType<typeof openDatabase>,
  scope: string,
  evidenceIdsJson: string,
) {
  const evidenceIds = parseStringArray(
    evidenceIdsJson,
    "linked_evidence_record_ids",
  );
  for (const evidenceId of evidenceIds) {
    const row = db
      .prepare(
        `
          SELECT evidence_id
          FROM verification_evidence_records
          WHERE scope = ? AND evidence_id = ?
        `,
      )
      .get(scope, evidenceId);
    if (!row) {
      throw new TemporalPreviewReviewArtifactValidationError(
        `Unknown linked evidence_id ${evidenceId} for scope ${scope}.`,
      );
    }
  }
}

function addOptionalClause(
  clauses: string[],
  params: Array<string | number>,
  column: string,
  value: string | number | null,
) {
  if (value !== null) {
    clauses.push(`${column} = ?`);
    params.push(value);
  }
}

function normalizeNullableWorkId(workId?: string | null) {
  const value = cleanNullableString(workId);
  return value ? normalizeWorkId(value) : null;
}

function normalizeNullableReviewerVerdict(verdict?: string | null) {
  const value = cleanNullableString(verdict);
  if (!value) {
    return null;
  }

  assertKnownEnum(value, "reviewer_verdict", TEMPORAL_REVIEW_VERDICTS);
  return value;
}

function normalizeNullableGuardrail(value?: boolean | number | string | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return normalizeGuardrailPassed(value);
}

function normalizeGuardrailPassed(value: boolean | number | string) {
  if (value === true || value === 1 || value === "1" || value === "true") {
    return 1;
  }

  if (value === false || value === 0 || value === "0" || value === "false") {
    return 0;
  }

  throw new TemporalPreviewReviewArtifactValidationError(
    "guardrail_passed must be boolean-shaped.",
  );
}

function normalizeLimit(limit?: number | string | null) {
  if (limit === null || limit === undefined || limit === "") {
    return DEFAULT_LIMIT;
  }

  const value = Number(limit);
  if (!Number.isFinite(value)) {
    throw new TemporalPreviewReviewArtifactValidationError(
      "limit must be a number.",
    );
  }

  return Math.max(1, Math.min(MAX_LIMIT, Math.trunc(value)));
}

function serializeBoundedPreview(value: unknown) {
  if (value === null || value === undefined) {
    throw new TemporalPreviewReviewArtifactValidationError(
      "bounded_preview_json is required.",
    );
  }

  rejectForbiddenFieldsDeep(value, "bounded_preview_json");
  if (typeof value === "string") {
    const parsed = parseJson(value, "bounded_preview_json");
    rejectForbiddenFieldsDeep(parsed, "bounded_preview_json");
    return JSON.stringify(parsed);
  }

  return JSON.stringify(value);
}

function normalizeStringArray(value: unknown[] | string | null | undefined, fieldName: string) {
  const array = normalizeJsonArray(value, fieldName);
  for (const item of array) {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new TemporalPreviewReviewArtifactValidationError(
        `${fieldName} must be a JSON array of non-empty strings.`,
      );
    }
  }

  return array.map((item) => item.trim());
}

function normalizeJsonArray(
  value: unknown[] | string | null | undefined,
  fieldName = "json_array",
) {
  if (value === undefined || value === null) {
    return [];
  }

  if (typeof value === "string") {
    const parsed = parseJson(value, fieldName);
    if (!Array.isArray(parsed)) {
      throw new TemporalPreviewReviewArtifactValidationError(
        `${fieldName} must be a JSON array.`,
      );
    }

    return parsed;
  }

  if (Array.isArray(value)) {
    return value;
  }

  throw new TemporalPreviewReviewArtifactValidationError(
    `${fieldName} must be a JSON array.`,
  );
}

function parseStringArray(value: string, fieldName: string) {
  return normalizeStringArray(value, fieldName);
}

function parseJson(value: string, fieldName: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new TemporalPreviewReviewArtifactValidationError(
      `${fieldName} must be valid JSON.`,
    );
  }
}

function requireNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TemporalPreviewReviewArtifactValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function requireRouteString(value: unknown) {
  const route = requireNonEmptyString(value, "source_route");
  if (!route.startsWith("/api/")) {
    throw new TemporalPreviewReviewArtifactValidationError(
      "source_route must be a route string.",
    );
  }

  return route;
}

function cleanNullableString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new TemporalPreviewReviewArtifactValidationError(
      "Expected a string value.",
    );
  }

  return value.trim() || null;
}

function requireEnum<const T extends readonly string[]>(
  value: unknown,
  fieldName: string,
  allowed: T,
): T[number] {
  const stringValue = requireNonEmptyString(value, fieldName);
  assertKnownEnum(stringValue, fieldName, allowed);
  return stringValue as T[number];
}

function assertKnownEnum<const T extends readonly string[]>(
  value: string,
  fieldName: string,
  allowed: T,
) {
  if (!allowed.includes(value)) {
    throw new TemporalPreviewReviewArtifactValidationError(
      `${fieldName} must be one of: ${allowed.join(", ")}.`,
    );
  }
}

function rejectForbiddenFields(input: Record<string, unknown>) {
  for (const field of FORBIDDEN_FIELDS) {
    if (Object.hasOwn(input, field)) {
      throw new TemporalPreviewReviewArtifactValidationError(
        `${field} is forbidden on TemporalPreviewReviewArtifact.`,
      );
    }
  }
}

function rejectForbiddenFieldsDeep(value: unknown, path: string) {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectForbiddenFieldsDeep(item, `${path}[${index}]`));
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (FORBIDDEN_FIELDS.includes(key as (typeof FORBIDDEN_FIELDS)[number])) {
      throw new TemporalPreviewReviewArtifactValidationError(
        `${key} is forbidden on TemporalPreviewReviewArtifact.`,
      );
    }
    rejectForbiddenFieldsDeep(nestedValue, `${path}.${key}`);
  }
}

function assertSummaryRefsNotEvidenceAnchors(
  evidenceAnchorRefs: string[],
  summaryRefs: string[],
) {
  const summaryRefSet = new Set(summaryRefs);
  const invalidRefs = evidenceAnchorRefs.filter(
    (ref) => summaryRefSet.has(ref) || ref.startsWith("summary:"),
  );

  if (invalidRefs.length > 0) {
    throw new TemporalPreviewReviewArtifactValidationError(
      `summary_refs must not be stored as evidence_anchor_refs: ${invalidRefs.join(", ")}.`,
    );
  }
}
