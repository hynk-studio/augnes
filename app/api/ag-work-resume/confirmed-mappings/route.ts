import {
  createAgWorkResumeConfirmedMapping,
  type AgWorkResumeConfirmedMappingCreateResult,
} from "@/lib/ag-work-resume-confirmed-mapping";
import {
  readAgWorkResumeConfirmedMappings,
  type AgWorkResumeConfirmedMappingReadInput,
} from "@/lib/ag-work-resume-confirmed-mapping-read";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_ID = "ag_work_resume_confirmed_mappings.v0_1";
const READ_ROUTE_ID = "ag_work_resume_confirmed_mapping_read.v0_1";
const SUPPORTED_BODY_FIELDS = new Set([
  "source_proposal_id",
  "foreign_scope",
  "foreign_work_id",
  "local_scope",
  "local_work_id",
  "packet_id",
  "packet_hash",
  "source_runtime_instance_id",
  "confirmed_by",
  "confirmation_reason",
  "confirmed_at",
]);
const READ_QUERY_PARAMS = new Set([
  "mapping_id",
  "foreign_scope",
  "foreign_work_id",
  "local_scope",
  "local_work_id",
  "source_proposal_id",
  "packet_id",
  "packet_hash",
  "status",
  "limit",
]);

type ConfirmedMappingRouteBody = {
  source_proposal_id?: unknown;
  foreign_scope?: unknown;
  foreign_work_id?: unknown;
  local_scope?: unknown;
  local_work_id?: unknown;
  packet_id?: unknown;
  packet_hash?: unknown;
  source_runtime_instance_id?: unknown;
  confirmed_by?: unknown;
  confirmation_reason?: unknown;
  confirmed_at?: unknown;
};

export async function POST(request: Request) {
  if (!acceptsJson(request)) {
    return badRequest("Request content-type must be application/json.");
  }

  const bodyResult = await parseBody(request);
  if ("error" in bodyResult) return badRequest(bodyResult.error);

  const result = createAgWorkResumeConfirmedMapping({
    source_proposal_id: bodyResult.source_proposal_id,
    foreign_scope: bodyResult.foreign_scope,
    foreign_work_id: bodyResult.foreign_work_id,
    local_scope: bodyResult.local_scope,
    local_work_id: bodyResult.local_work_id,
    packet_id: bodyResult.packet_id,
    packet_hash: bodyResult.packet_hash,
    source_runtime_instance_id: bodyResult.source_runtime_instance_id,
    confirmed_by: bodyResult.confirmed_by,
    confirmation_reason: bodyResult.confirmation_reason,
    confirmed_at: bodyResult.confirmed_at,
  });

  return NextResponse.json(
    {
      ok: result.ok,
      route: ROUTE_ID,
      result,
      authority_boundary: result.authority_boundary,
      recommended_next_step:
        "User/Core may review the confirmed mapping identity association. This route is not import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority.",
    },
    { status: statusForResult(result) },
  );
}

export function GET(request: Request) {
  if (request.body !== null) {
    return badReadRequest("GET confirmed mapping reads do not accept a body.");
  }

  const { searchParams } = new URL(request.url);
  const input = parseReadQuery(searchParams);
  if ("error" in input) return badReadRequest(input.error);

  const result = readAgWorkResumeConfirmedMappings(input);

  return NextResponse.json(
    {
      ok: result.ok,
      route: READ_ROUTE_ID,
      result,
      authority_boundary: result.authority_boundary,
      recommended_next_step:
        "User/Core may review confirmed mapping identity metadata. This read route is not import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority.",
    },
    { status: statusForReadResult(result.status) },
  );
}

function parseReadQuery(
  searchParams: URLSearchParams,
): AgWorkResumeConfirmedMappingReadInput | { error: string } {
  for (const key of searchParams.keys()) {
    if (!READ_QUERY_PARAMS.has(key)) {
      return { error: `Unsupported read query parameter: ${key}.` };
    }
    if (searchParams.getAll(key).length > 1) {
      return { error: `Read query parameter must not be repeated: ${key}.` };
    }
  }

  return {
    mapping_id: searchParams.get("mapping_id"),
    foreign_scope: searchParams.get("foreign_scope"),
    foreign_work_id: searchParams.get("foreign_work_id"),
    local_scope: searchParams.get("local_scope"),
    local_work_id: searchParams.get("local_work_id"),
    source_proposal_id: searchParams.get("source_proposal_id"),
    packet_id: searchParams.get("packet_id"),
    packet_hash: searchParams.get("packet_hash"),
    status: searchParams.get("status"),
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
): Promise<ConfirmedMappingRouteBody | { error: string }> {
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
      error: `Unsupported confirmed mapping request field(s): ${unsupportedFields.join(", ")}.`,
    };
  }

  return {
    source_proposal_id: value.source_proposal_id,
    foreign_scope: value.foreign_scope,
    foreign_work_id: value.foreign_work_id,
    local_scope: value.local_scope,
    local_work_id: value.local_work_id,
    packet_id: value.packet_id,
    packet_hash: value.packet_hash,
    source_runtime_instance_id: value.source_runtime_instance_id,
    confirmed_by: value.confirmed_by,
    confirmation_reason: value.confirmation_reason,
    confirmed_at: value.confirmed_at,
  };
}

function statusForResult(result: AgWorkResumeConfirmedMappingCreateResult) {
  if (result.status === "created") return 201;
  if (result.status === "invalid_input") return 400;
  if (result.status === "proposal_not_found") return 404;
  if (result.status === "proposal_not_active") return 409;
  if (result.status === "local_work_not_found") return 404;
  if (result.status === "proposal_mismatch") return 409;
  if (result.status === "duplicate_active_mapping") return 409;
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
        "Stop. Provide valid AG Resume confirmed mapping creation JSON.",
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
        "Stop. Provide supported AG Resume confirmed mapping read query parameters only.",
    },
    { status: 400 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
