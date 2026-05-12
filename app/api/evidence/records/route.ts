import {
  EVIDENCE_KINDS,
  EVIDENCE_STATUSES,
  EvidenceRecordValidationError,
  createEvidenceRecord,
  listEvidenceRecords,
  type EvidenceKind,
  type EvidenceRecordInput,
  type EvidenceStatus,
} from "@/lib/evidence-records";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));

    return NextResponse.json({
      scope,
      records: listEvidenceRecords({
        scope,
        work_id: searchParams.get("work_id"),
        publication_id: searchParams.get("publication_id"),
        delivery_id: searchParams.get("delivery_id"),
        target_surface: searchParams.get("target_surface"),
        target_ref: searchParams.get("target_ref"),
        evidence_kind: readOptionalKind(searchParams.get("evidence_kind")),
        status: readOptionalStatus(searchParams.get("status")),
        limit: readOptionalLimit(searchParams.get("limit")),
      }),
      boundaries: evidenceRecordBoundaries(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to list evidence records.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input: EvidenceRecordInput = {
      evidence_id: readOptionalString(body, "evidence_id"),
      scope: readOptionalString(body, "scope"),
      work_id: readOptionalString(body, "work_id"),
      publication_id: readOptionalString(body, "publication_id"),
      delivery_id: readOptionalString(body, "delivery_id"),
      target_surface: readOptionalString(body, "target_surface"),
      target_ref: readOptionalString(body, "target_ref"),
      evidence_kind: requireString(body, "evidence_kind"),
      label: requireString(body, "label"),
      status: requireString(body, "status"),
      command: readOptionalString(body, "command"),
      result_summary: requireString(body, "result_summary"),
      skipped_reason: readOptionalString(body, "skipped_reason"),
      observed_behavior: readOptionalString(body, "observed_behavior"),
      source_surface: requireString(body, "source_surface"),
      source_ref: readOptionalString(body, "source_ref"),
      related_action_id: readOptionalString(body, "related_action_id"),
      related_work_event_id: readOptionalString(body, "related_work_event_id"),
      metadata: readOptionalMetadata(body, "metadata"),
      created_by: requireString(body, "created_by"),
      created_at: readOptionalString(body, "created_at"),
    };
    const record = createEvidenceRecord(input);

    return NextResponse.json(
      {
        scope: record.scope,
        record,
        boundaries: evidenceRecordBoundaries(),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create evidence record.",
      },
      { status: error instanceof EvidenceRecordValidationError ? 400 : 500 },
    );
  }
}

function evidenceRecordBoundaries() {
  return [
    "Records observation evidence only.",
    "Does not approve, publish, replay, retry, commit or reject state, mutate mailbox, or call external services.",
    "Does not call GitHub or OpenAI and does not require GITHUB_TOKEN or OPENAI_API_KEY.",
  ];
}

async function readJsonBody(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new EvidenceRecordValidationError(
        "Request body must be a JSON object.",
      );
    }

    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof EvidenceRecordValidationError) {
      throw error;
    }

    throw new EvidenceRecordValidationError("Request body must be valid JSON.");
  }
}

function requireString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new EvidenceRecordValidationError(`${key} is required.`);
  }

  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new EvidenceRecordValidationError(`${key} must be a string.`);
  }

  return value.trim() || null;
}

function readOptionalMetadata(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (
    typeof value !== "object" &&
    typeof value !== "string"
  ) {
    throw new EvidenceRecordValidationError(
      "metadata must be a JSON object.",
    );
  }

  return value as Record<string, unknown> | string;
}

function readOptionalKind(value: string | null) {
  if (!value) {
    return null;
  }

  if (EVIDENCE_KINDS.includes(value as EvidenceKind)) {
    return value as EvidenceKind;
  }

  throw new EvidenceRecordValidationError(
    `evidence_kind must be one of: ${EVIDENCE_KINDS.join(", ")}.`,
  );
}

function readOptionalStatus(value: string | null) {
  if (!value) {
    return null;
  }

  if (EVIDENCE_STATUSES.includes(value as EvidenceStatus)) {
    return value as EvidenceStatus;
  }

  throw new EvidenceRecordValidationError(
    `status must be one of: ${EVIDENCE_STATUSES.join(", ")}.`,
  );
}

function readOptionalLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const limit = Number(value);
  if (!Number.isFinite(limit)) {
    throw new EvidenceRecordValidationError("limit must be a number.");
  }

  return limit;
}
