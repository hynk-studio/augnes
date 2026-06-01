import {
  createAgWorkResumeImportedContext,
  type AgWorkResumeImportedContextCreateResult,
} from "@/lib/ag-work-resume-imported-context";
import {
  readAgWorkResumeImportedContexts,
  type AgWorkResumeImportedContextReadInput,
} from "@/lib/ag-work-resume-imported-context-read";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_ID = "ag_work_resume_imported_contexts.v0_1";
const READ_ROUTE_ID = "ag_work_resume_imported_context_read.v0_1";
const SUPPORTED_BODY_FIELDS = new Set([
  "mapping_id",
  "packet_id",
  "packet_hash",
  "source_runtime_instance_id",
  "foreign_scope",
  "foreign_work_id",
  "local_scope",
  "local_work_id",
  "imported_summary",
  "imported_expected_files",
  "imported_expected_checks",
  "foreign_refs_summary",
  "redaction_report",
  "created_by",
  "import_reason",
  "created_at",
]);
const READ_QUERY_PARAMS = new Set([
  "import_id",
  "mapping_id",
  "foreign_scope",
  "foreign_work_id",
  "local_scope",
  "local_work_id",
  "packet_id",
  "packet_hash",
  "status",
  "created_by",
  "limit",
]);

type ImportedContextRouteBody = {
  mapping_id?: unknown;
  packet_id?: unknown;
  packet_hash?: unknown;
  source_runtime_instance_id?: unknown;
  foreign_scope?: unknown;
  foreign_work_id?: unknown;
  local_scope?: unknown;
  local_work_id?: unknown;
  imported_summary?: unknown;
  imported_expected_files?: unknown;
  imported_expected_checks?: unknown;
  foreign_refs_summary?: unknown;
  redaction_report?: unknown;
  created_by?: unknown;
  import_reason?: unknown;
  created_at?: unknown;
};

export async function POST(request: Request) {
  if (!acceptsJson(request)) {
    return badRequest("Request content-type must be application/json.");
  }

  const bodyResult = await parseBody(request);
  if ("error" in bodyResult) return badRequest(bodyResult.error);

  const result = createAgWorkResumeImportedContext({
    mapping_id: bodyResult.mapping_id,
    packet_id: bodyResult.packet_id,
    packet_hash: bodyResult.packet_hash,
    source_runtime_instance_id: bodyResult.source_runtime_instance_id,
    foreign_scope: bodyResult.foreign_scope,
    foreign_work_id: bodyResult.foreign_work_id,
    local_scope: bodyResult.local_scope,
    local_work_id: bodyResult.local_work_id,
    imported_summary: bodyResult.imported_summary,
    imported_expected_files: bodyResult.imported_expected_files,
    imported_expected_checks: bodyResult.imported_expected_checks,
    foreign_refs_summary: bodyResult.foreign_refs_summary,
    redaction_report: bodyResult.redaction_report,
    created_by: bodyResult.created_by,
    import_reason: bodyResult.import_reason,
    created_at: bodyResult.created_at,
  });

  return NextResponse.json(
    {
      ok: result.ok,
      route: ROUTE_ID,
      result,
      authority_boundary: result.authority_boundary,
      recommended_next_step:
        "User/Core may review the imported context metadata. This route is not proof/evidence authorization, session binding, Codex execution authority, work item/event creation, approval, publish, retry, replay, or merge authority.",
    },
    { status: statusForResult(result) },
  );
}

export function GET(request: Request) {
  if (request.body !== null) {
    return badReadRequest("GET imported context reads do not accept a body.");
  }

  const { searchParams } = new URL(request.url);
  const input = parseReadQuery(searchParams);
  if ("error" in input) return badReadRequest(input.error);

  const result = readAgWorkResumeImportedContexts(input);

  return NextResponse.json(
    {
      ok: result.ok,
      route: READ_ROUTE_ID,
      result,
      authority_boundary: result.authority_boundary,
      recommended_next_step:
        "User/Core may review imported context metadata. This read route is not proof/evidence authorization, session binding, Codex execution authority, work item/event creation, approval, publish, retry, replay, or merge authority.",
    },
    { status: statusForReadResult(result.status) },
  );
}

function parseReadQuery(
  searchParams: URLSearchParams,
): AgWorkResumeImportedContextReadInput | { error: string } {
  for (const key of searchParams.keys()) {
    if (!READ_QUERY_PARAMS.has(key)) {
      return { error: `Unsupported read query parameter: ${key}.` };
    }
    if (searchParams.getAll(key).length > 1) {
      return { error: `Read query parameter must not be repeated: ${key}.` };
    }
  }

  return {
    import_id: searchParams.get("import_id"),
    mapping_id: searchParams.get("mapping_id"),
    foreign_scope: searchParams.get("foreign_scope"),
    foreign_work_id: searchParams.get("foreign_work_id"),
    local_scope: searchParams.get("local_scope"),
    local_work_id: searchParams.get("local_work_id"),
    packet_id: searchParams.get("packet_id"),
    packet_hash: searchParams.get("packet_hash"),
    status: searchParams.get("status"),
    created_by: searchParams.get("created_by"),
    limit: searchParams.get("limit"),
  };
}

function acceptsJson(request: Request) {
  return (request.headers.get("content-type") ?? "")
    .toLowerCase()
    .includes("application/json");
}

async function parseBody(
  request: Request,
): Promise<ImportedContextRouteBody | { error: string }> {
  let value: unknown;
  try {
    const text = await request.text();
    value = text.trim().length > 0 ? JSON.parse(text) : null;
  } catch (error) {
    return {
      error: `Invalid JSON request body: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  if (!isRecord(value)) {
    return { error: "Request body must be a JSON object." };
  }

  const unsupportedFields = Object.keys(value).filter(
    (key) => !SUPPORTED_BODY_FIELDS.has(key),
  );
  if (unsupportedFields.length > 0) {
    return {
      error: `Unsupported imported context request field(s): ${unsupportedFields.join(", ")}.`,
    };
  }

  return {
    mapping_id: value.mapping_id,
    packet_id: value.packet_id,
    packet_hash: value.packet_hash,
    source_runtime_instance_id: value.source_runtime_instance_id,
    foreign_scope: value.foreign_scope,
    foreign_work_id: value.foreign_work_id,
    local_scope: value.local_scope,
    local_work_id: value.local_work_id,
    imported_summary: value.imported_summary,
    imported_expected_files: value.imported_expected_files,
    imported_expected_checks: value.imported_expected_checks,
    foreign_refs_summary: value.foreign_refs_summary,
    redaction_report: value.redaction_report,
    created_by: value.created_by,
    import_reason: value.import_reason,
    created_at: value.created_at,
  };
}

function statusForResult(result: AgWorkResumeImportedContextCreateResult) {
  if (result.status === "created") return 201;
  if (result.status === "invalid_input") return 400;
  if (result.status === "mapping_not_found") return 404;
  if (result.status === "mapping_not_active") return 409;
  if (result.status === "mapping_mismatch") return 409;
  if (result.status === "redaction_blocked") return 400;
  return 500;
}

function statusForReadResult(status: string) {
  if (status === "fetched" || status === "listed") return 200;
  if (status === "invalid_input") return 400;
  if (status === "not_found") return 404;
  return 500;
}

function badRequest(error: string) {
  return NextResponse.json(
    {
      ok: false,
      route: ROUTE_ID,
      error,
      recommended_next_step:
        "Stop. Provide valid AG Resume imported context creation JSON.",
    },
    { status: 400 },
  );
}

function badReadRequest(error: string) {
  return NextResponse.json(
    {
      ok: false,
      route: READ_ROUTE_ID,
      error,
      recommended_next_step:
        "Stop. Provide supported AG Resume imported context read query parameters only.",
    },
    { status: 400 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
