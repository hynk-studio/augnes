import {
  createAgWorkResumeMappingProposalRecord,
  type AgWorkResumeMappingProposalRecordCreateResult,
} from "@/lib/ag-work-resume-mapping-proposal-record";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_ID = "ag_work_resume_mapping_proposal_records.v0_1";

type RouteBody = {
  packet: Record<string, unknown>;
  candidates: unknown[];
  selected_candidate_id: string;
  proposed_by: string;
  proposal_reason: string;
  status?: "proposed" | "needs_review";
  expires_at?: string | null;
  source?: {
    reviewed_by_surface?:
      | "cockpit"
      | "local_helper"
      | "route"
      | "chatgpt_app"
      | "codex"
      | "unknown";
    reviewed_at?: string | null;
  };
};

export async function POST(request: Request) {
  if (!acceptsJson(request)) {
    return badRequest("Request content-type must be application/json.");
  }

  const bodyResult = await parseBody(request);
  if ("error" in bodyResult) return badRequest(bodyResult.error);

  const result = createAgWorkResumeMappingProposalRecord({
    packet: bodyResult.packet,
    candidates: bodyResult.candidates,
    selected_candidate_id: bodyResult.selected_candidate_id,
    proposed_by: bodyResult.proposed_by,
    proposal_reason: bodyResult.proposal_reason,
    status: bodyResult.status,
    expires_at: bodyResult.expires_at,
    source: bodyResult.source,
  });

  return NextResponse.json(
    {
      ok: result.ok,
      route: ROUTE_ID,
      result,
      recommended_next_step:
        "User/Core should review the proposal record. This is not mapping confirmation, import authorization, or Codex execution authority.",
    },
    { status: statusForResult(result) },
  );
}

function acceptsJson(request: Request) {
  return (request.headers.get("content-type") ?? "")
    .toLowerCase()
    .includes("application/json");
}

async function parseBody(
  request: Request,
): Promise<RouteBody | { error: string }> {
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
  if (!isRecord(value.packet)) {
    return { error: "Request body must include a packet object." };
  }
  if (!Array.isArray(value.candidates)) {
    return { error: "Request body must include a candidates array." };
  }
  if (
    typeof value.selected_candidate_id !== "string" ||
    value.selected_candidate_id.trim().length === 0
  ) {
    return {
      error: "Request body must include a non-empty selected_candidate_id string.",
    };
  }
  if (
    typeof value.proposed_by !== "string" ||
    value.proposed_by.trim().length === 0
  ) {
    return { error: "Request body must include a non-empty proposed_by string." };
  }
  if (
    typeof value.proposal_reason !== "string" ||
    value.proposal_reason.trim().length === 0
  ) {
    return {
      error: "Request body must include a non-empty proposal_reason string.",
    };
  }
  if (
    "status" in value &&
    value.status !== undefined &&
    value.status !== null &&
    value.status !== "proposed" &&
    value.status !== "needs_review"
  ) {
    return { error: "status must be omitted, proposed, or needs_review." };
  }
  if (
    "expires_at" in value &&
    value.expires_at !== undefined &&
    value.expires_at !== null &&
    typeof value.expires_at !== "string"
  ) {
    return {
      error: "expires_at must be omitted, null, or a future ISO UTC timestamp.",
    };
  }
  if ("source" in value && value.source !== undefined && !isRecord(value.source)) {
    return { error: "source must be an object when supplied." };
  }

  return {
    packet: value.packet,
    candidates: value.candidates,
    selected_candidate_id: value.selected_candidate_id.trim(),
    proposed_by: value.proposed_by.trim(),
    proposal_reason: value.proposal_reason.trim(),
    status:
      value.status === "proposed" || value.status === "needs_review"
        ? value.status
        : undefined,
    expires_at:
      typeof value.expires_at === "string"
        ? value.expires_at
        : value.expires_at === null
          ? null
          : undefined,
    source: normalizeSource(value.source),
  };
}

function normalizeSource(value: unknown): RouteBody["source"] {
  if (!isRecord(value)) return undefined;
  const reviewedBySurface =
    value.reviewed_by_surface === "cockpit" ||
    value.reviewed_by_surface === "local_helper" ||
    value.reviewed_by_surface === "route" ||
    value.reviewed_by_surface === "chatgpt_app" ||
    value.reviewed_by_surface === "codex" ||
    value.reviewed_by_surface === "unknown"
      ? value.reviewed_by_surface
      : undefined;
  const reviewedAt =
    typeof value.reviewed_at === "string"
      ? value.reviewed_at
      : value.reviewed_at === null
        ? null
        : undefined;

  return {
    reviewed_by_surface: reviewedBySurface,
    reviewed_at: reviewedAt,
  };
}

function statusForResult(result: AgWorkResumeMappingProposalRecordCreateResult) {
  if (result.status === "created") return 201;
  if (result.status === "invalid_input") return 400;
  if (result.status === "preflight_failed") return 422;
  if (result.status === "duplicate_active_proposal") return 409;
  if (result.status === "preview_not_creatable") {
    return result.preview?.status === "conflict" ? 409 : 422;
  }
  return 500;
}

function badRequest(error: string) {
  return NextResponse.json(
    {
      ok: false,
      route: ROUTE_ID,
      error,
      recommended_next_step:
        "Stop. Provide valid AG Resume mapping proposal record creation JSON.",
    },
    { status: 400 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
