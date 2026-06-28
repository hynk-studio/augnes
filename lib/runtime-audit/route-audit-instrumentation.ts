import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import SqliteDatabase from "better-sqlite3";

import {
  RUNTIME_AUDIT_EVENT_REQUEST_VERSION,
  RUNTIME_AUDIT_EVENT_VERSION,
  createRuntimeAuditEventAuthorityBoundaryV01,
  createRuntimeAuditEventV01,
  isSafeRuntimeAuditDbPathV01,
  type RuntimeAuditEventInputV01,
  type RuntimeAuditEventKindV01,
  type RuntimeAuditEventSurfaceV01,
  type RuntimeAuditSqliteLikeV01,
} from "@/lib/runtime-audit/audit-event-store";

const scope = "project:augnes" as const;

export const RUNTIME_AUDIT_ROUTE_INSTRUMENTATION_VERSION_V01 =
  "runtime_audit_selected_route_instrumentation.v0.1" as const;

export type RuntimeRouteAuditInstrumentationStatusV01 =
  | "audit_not_requested"
  | "audit_skipped_invalid_db_path"
  | "audit_skipped_private_or_raw_payload"
  | "audit_skipped_forbidden_authority"
  | "audit_event_created"
  | "idempotent_existing"
  | "audit_conflict_existing_event"
  | "audit_write_failed_bounded";

export interface RuntimeRouteAuditInstrumentationInputV01 {
  audit_db_path?: unknown;
  route_ref: string;
  runtime_slice_ref: string;
  event_surface: RuntimeAuditEventSurfaceV01;
  event_kind: RuntimeAuditEventKindV01;
  event_action: string;
  event_status: string;
  subject_ref: string;
  related_refs?: string[];
  created_by?: string;
  created_at?: string;
  bounded_summary: string;
  bounded_error_code?: string | null;
  primary_result_status?: string | null;
  primary_result_ref?: string | null;
  authority_boundary?: unknown;
}

export interface RuntimeRouteAuditInstrumentationResultV01 {
  instrumentation_version: typeof RUNTIME_AUDIT_ROUTE_INSTRUMENTATION_VERSION_V01;
  scope: typeof scope;
  status: RuntimeRouteAuditInstrumentationStatusV01;
  audit_event_ref: string | null;
  audit_event_id: string | null;
  audit_event_persisted: boolean;
  reason_codes: string[];
  authority_boundary: ReturnType<typeof createRuntimeRouteAuditInstrumentationAuthorityBoundaryV01>;
}

export function maybeWriteRuntimeRouteAuditEventV01(
  input: RuntimeRouteAuditInstrumentationInputV01,
): RuntimeRouteAuditInstrumentationResultV01 {
  try {
    if (input.audit_db_path === undefined || input.audit_db_path === null || input.audit_db_path === "") {
      return auditInstrumentationResult("audit_not_requested", null, false, [
        "audit_db_path_absent",
        "primary_route_behavior_unchanged",
      ]);
    }
    if (!isSafeRuntimeAuditDbPathV01(input.audit_db_path)) {
      return auditInstrumentationResult("audit_skipped_invalid_db_path", null, false, [
        "audit_db_path_invalid",
        "unsafe_audit_path_not_echoed",
      ]);
    }
    const unsafeStatus = classifyUnsafeInput(input);
    if (unsafeStatus) {
      return auditInstrumentationResult(unsafeStatus, null, false, [
        unsafeStatus,
        "audit_event_not_written",
      ]);
    }

    const auditDbPath = input.audit_db_path as string;
    const auditEvent = buildRuntimeRouteAuditEventInputV01(input);
    mkdirSync(dirname(auditDbPath), { recursive: true });
    const db = new SqliteDatabase(auditDbPath);
    try {
      const writeResult = createRuntimeAuditEventV01(
        auditEvent,
        db as unknown as RuntimeAuditSqliteLikeV01,
      );
      if (writeResult.status === "conflict_existing_audit_event") {
        return auditInstrumentationResult(
          "audit_conflict_existing_event",
          writeResult.audit_event_ref,
          false,
          writeResult.reason_codes,
          writeResult.audit_event_id,
        );
      }
      if (writeResult.status === "audit_event_created" || writeResult.status === "idempotent_existing") {
        return auditInstrumentationResult(
          writeResult.status,
          writeResult.audit_event_ref,
          writeResult.audit_event_persisted,
          writeResult.reason_codes,
          writeResult.audit_event_id,
        );
      }
      return auditInstrumentationResult(
        writeResult.status === "blocked_forbidden_authority"
          ? "audit_skipped_forbidden_authority"
          : "audit_skipped_private_or_raw_payload",
        null,
        false,
        writeResult.reason_codes,
      );
    } finally {
      db.close();
    }
  } catch {
    return auditInstrumentationResult("audit_write_failed_bounded", null, false, [
      "audit_write_failed_bounded",
      "primary_route_not_failed_by_audit",
    ]);
  }
}

export function buildRuntimeRouteAuditEventInputV01(
  input: RuntimeRouteAuditInstrumentationInputV01,
): RuntimeAuditEventInputV01 {
  const primaryResultRef = publicSafeStringOrFallback(
    input.primary_result_ref,
    "runtime-result:unreferenced",
  );
  const relatedRefs = [
    ...(input.related_refs ?? []),
    ...(primaryResultRef ? [primaryResultRef] : []),
  ].filter((ref) => typeof ref === "string" && ref.trim().length > 0);
  return {
    request_version: RUNTIME_AUDIT_EVENT_REQUEST_VERSION,
    event_version: RUNTIME_AUDIT_EVENT_VERSION,
    scope,
    audit_event_id: createRuntimeRouteAuditEventIdV01(input),
    event_kind: input.event_kind,
    event_surface: input.event_surface,
    event_action: input.event_action,
    event_status: publicSafeStringOrFallback(input.event_status, "unknown"),
    subject_ref: publicSafeStringOrFallback(input.subject_ref, "subject:unknown"),
    related_refs: relatedRefs.length > 0 ? relatedRefs : ["runtime-route:audit-related-ref-none"],
    route_ref: input.route_ref,
    runtime_slice_ref: input.runtime_slice_ref,
    created_by: publicSafeStringOrFallback(input.created_by, "route:runtime-audit-instrumentation"),
    created_at: publicSafeStringOrFallback(input.created_at, "1970-01-01T00:00:00.000Z"),
    bounded_summary: sanitizeRuntimeRouteAuditSummaryV01(input.bounded_summary),
    bounded_error_code:
      input.bounded_error_code && typeof input.bounded_error_code === "string"
        ? input.bounded_error_code.slice(0, 120)
        : undefined,
    authority_boundary: createRuntimeAuditEventAuthorityBoundaryV01({ persistenceNow: true }),
    privacy_report: {
      bounded_summary_only: true,
      raw_request_body_stored_now: false,
      raw_response_body_stored_now: false,
      hidden_reasoning_stored_now: false,
      raw_provider_output_stored_now: false,
      raw_retrieval_output_stored_now: false,
    },
    reason_codes: [
      "runtime_audit_selected_route_instrumentation",
      "bounded_summary_only",
      "raw_request_body_not_stored",
      "raw_response_body_not_stored",
      "audit_event_is_not_truth",
      "audit_event_is_not_proof",
      "audit_event_is_not_approval",
      "audit_event_is_not_durable_state",
      "audit_event_is_not_product_write_authority",
      "product_write_denied",
      ...(input.primary_result_status ? [`primary_result_status:${input.primary_result_status}`] : []),
    ],
  };
}

export function createRuntimeRouteAuditEventIdV01(
  input: RuntimeRouteAuditInstrumentationInputV01,
): string {
  const routePart = safeIdPart(input.route_ref);
  const actionPart = safeIdPart(input.event_action);
  const subjectPart = safeIdPart(input.subject_ref);
  const statusPart = safeIdPart(input.event_status);
  const primaryResultRef =
    typeof input.primary_result_ref === "string" ? input.primary_result_ref.trim() : "";
  const resultPart =
    primaryResultRef.length > 0
      ? `${safeIdPart(primaryResultRef)}-${shortHash(primaryResultRef)}`
      : `fingerprint-${shortHash({
          route_ref: input.route_ref,
          event_action: input.event_action,
          event_status: input.event_status,
          subject_ref: input.subject_ref,
          related_refs: input.related_refs ?? [],
          bounded_summary: sanitizeRuntimeRouteAuditSummaryV01(input.bounded_summary),
          bounded_error_code: input.bounded_error_code ?? null,
          created_at: input.created_at ?? null,
        })}`;
  return `audit:event:${routePart}:${actionPart}:${subjectPart}:${statusPart}:${resultPart}`;
}

export function sanitizeRuntimeRouteAuditSummaryV01(input: unknown): string {
  if (typeof input !== "string") return "Runtime route returned bounded result.";
  const compact = input.replace(/\s+/g, " ").trim();
  if (compact.length === 0) return "Runtime route returned bounded result.";
  return compact.slice(0, 300);
}

export function createRuntimeRouteAuditInstrumentationAuthorityBoundaryV01() {
  return {
    runtime_audit_selected_route_instrumentation_now: true,
    runtime_audit_event_persistence_now: true,
    selected_route_subset_only: true,
    audit_db_path_optional: true,
    primary_route_failure_from_audit_now: false,
    raw_request_body_stored_now: false,
    raw_response_body_stored_now: false,
    raw_terminal_log_stored_now: false,
    browser_dump_ingested_now: false,
    hidden_reasoning_stored_now: false,
    raw_provider_output_stored_now: false,
    raw_retrieval_output_stored_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    work_item_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    product_persistence_now: false,
    git_write_now: false,
    github_api_call_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    audit_event_is_truth: false,
    audit_event_is_proof: false,
    audit_event_is_approval: false,
    audit_event_is_durable_state: false,
    audit_event_is_product_write_authority: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

function auditInstrumentationResult(
  status: RuntimeRouteAuditInstrumentationStatusV01,
  auditEventRef: string | null,
  persisted: boolean,
  reasonCodes: string[],
  auditEventId: string | null = null,
): RuntimeRouteAuditInstrumentationResultV01 {
  return {
    instrumentation_version: RUNTIME_AUDIT_ROUTE_INSTRUMENTATION_VERSION_V01,
    scope,
    status,
    audit_event_ref: auditEventRef,
    audit_event_id: auditEventId,
    audit_event_persisted: persisted,
    reason_codes: [...new Set(["runtime_audit_selected_route_instrumentation", ...reasonCodes])].sort(),
    authority_boundary: createRuntimeRouteAuditInstrumentationAuthorityBoundaryV01(),
  };
}

function classifyUnsafeInput(
  input: RuntimeRouteAuditInstrumentationInputV01,
): "audit_skipped_private_or_raw_payload" | "audit_skipped_forbidden_authority" | null {
  const text = JSON.stringify({
    route_ref: input.route_ref,
    runtime_slice_ref: input.runtime_slice_ref,
    event_action: input.event_action,
    event_status: input.event_status,
    subject_ref: input.subject_ref,
    related_refs: input.related_refs,
    created_by: input.created_by,
    created_at: input.created_at,
    bounded_summary: input.bounded_summary,
    bounded_error_code: input.bounded_error_code,
    primary_result_status: input.primary_result_status,
    primary_result_ref: input.primary_result_ref,
  });
  if (
    /(SAFE_MARKER_|\/Users\/|\/home\/|file:\/\/|sk-|ghp_|OPENAI_API_KEY|GITHUB_TOKEN|password:|secret:|secret[-_]?token|raw request body|raw response body|raw terminal log|browser dump|raw provider output|raw retrieval output|raw source body|raw conversation|hidden reasoning|telemetry dump|raw DB row|raw diff)/i.test(
      text,
    )
  ) {
    return "audit_skipped_private_or_raw_payload";
  }
  if (hasForbiddenAuthorityGrant(input.authority_boundary)) {
    return "audit_skipped_forbidden_authority";
  }
  return null;
}

function hasForbiddenAuthorityGrant(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => hasForbiddenAuthorityGrant(item));
  for (const [key, nested] of Object.entries(value)) {
    if (
      /(_authority|_write_now|_call_now|_execution_now|_stored_now|_ingested_now|_is_truth|_is_proof|product_write|product_id_allocation|proof_or_evidence|claim_or_evidence|promotion_execution|durable_state_apply|formation_receipt_write|github_api_call|git_write)/.test(
        key,
      ) &&
      nested !== false &&
      nested !== null &&
      nested !== undefined
    ) {
      return true;
    }
    if (hasForbiddenAuthorityGrant(nested)) return true;
  }
  return false;
}

function publicSafeStringOrFallback(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 0 ? compact.slice(0, 220) : fallback;
}

function safeIdPart(value: unknown): string {
  const input = typeof value === "string" ? value : "unknown";
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return cleaned || "unknown";
}

function shortHash(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16);
}

function stableStringify(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
