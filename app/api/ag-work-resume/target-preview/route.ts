import {
  preflightAgWorkResumePacket,
  type AgWorkResumePacketPreflightCheck,
  type AgWorkResumePacketPreflightResult,
} from "@/lib/ag-work-resume-packet-preflight";
import type { AgWorkResumePacketV02 } from "@/lib/ag-work-resume-packet";
import {
  buildAgWorkResumeTargetPreview,
  type AgWorkResumeTargetLocalContext,
  type AgWorkResumeTargetPreview,
  type AgWorkResumeTargetPreviewStatus,
} from "@/lib/ag-work-resume-target-preview";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_ID = "ag_work_resume_target_preview.v0_1";
const SKIPPED_PREFLIGHT_WARNING =
  "Packet preflight was skipped; run ag:resume-preflight before relying on this target preview.";
const SKIPPED_PREFLIGHT_NEXT_STEP =
  "Run ag:resume-preflight before relying on this target preview.";

type RoutePreflightStatus = "pass" | "warn" | "fail" | "skipped";

type RoutePreflightResult = {
  ran: boolean;
  ok: boolean | null;
  strict: true;
  status: RoutePreflightStatus;
  warnings: string[];
  failures: string[];
};

type RouteBody = {
  packet: Record<string, unknown>;
  local: Record<string, unknown> | null;
  strict: boolean;
  skipPreflight: boolean;
};

export async function POST(request: Request) {
  if (!acceptsJson(request)) {
    return badRequest("Request content-type must be application/json.");
  }

  const bodyResult = await parseBody(request);
  if ("error" in bodyResult) return badRequest(bodyResult.error);

  const { packet, local, strict, skipPreflight } = bodyResult;
  const preflight = skipPreflight
    ? skippedPreflight()
    : adaptPreflightResult(
        preflightAgWorkResumePacket(packet, {
          strict: true,
          rawInput: JSON.stringify(packet),
          inputMode: "json",
        }),
      );

  if (preflight.ran && preflight.ok !== true) {
    return NextResponse.json(
      {
        ok: false,
        route: ROUTE_ID,
        strict,
        preflight,
        preview: null,
        recommended_next_step:
          "Stop. Fix failed packet preflight checks before target preview.",
      },
      { status: 422 },
    );
  }

  const preview = buildAgWorkResumeTargetPreview({
    packet: packet as unknown as AgWorkResumePacketV02,
    local: local as AgWorkResumeTargetLocalContext | null,
    strict,
  });
  const ok = isNonBlockingStatus(preview.status);

  return NextResponse.json(
    {
      ok,
      route: ROUTE_ID,
      strict,
      preflight,
      preview,
      recommended_next_step: recommendedNextStepForPreview(
        preview,
        skipPreflight,
      ),
    },
    { status: statusForPreview(preview.status) },
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

  const local = value.local ?? null;
  if (local !== null && !isRecord(local)) {
    return { error: "Local B context must be an object or null." };
  }
  if ("strict" in value && typeof value.strict !== "boolean") {
    return { error: "strict must be a boolean when supplied." };
  }
  if ("skip_preflight" in value && typeof value.skip_preflight !== "boolean") {
    return { error: "skip_preflight must be a boolean when supplied." };
  }

  return {
    packet: value.packet,
    local,
    strict: value.strict === true,
    skipPreflight: value.skip_preflight === true,
  };
}

function adaptPreflightResult(
  result: AgWorkResumePacketPreflightResult,
): RoutePreflightResult {
  const warnings = result.checks
    .filter((check) => check.status === "warn")
    .map(formatCheck);
  const failures = result.checks
    .filter((check) => check.status === "fail")
    .map(formatCheck);
  const ok = result.ok === true && failures.length === 0;

  return {
    ran: true,
    ok,
    strict: true,
    status: ok ? (warnings.length > 0 ? "warn" : "pass") : "fail",
    warnings,
    failures,
  };
}

function skippedPreflight(): RoutePreflightResult {
  return {
    ran: false,
    ok: null,
    strict: true,
    status: "skipped",
    warnings: [SKIPPED_PREFLIGHT_WARNING],
    failures: [],
  };
}

function formatCheck(check: AgWorkResumePacketPreflightCheck) {
  return `${check.id}: ${check.message}`;
}

function isNonBlockingStatus(status: AgWorkResumeTargetPreviewStatus) {
  return (
    status === "ready_for_user_core_review" ||
    status === "needs_mapping" ||
    status === "context_only"
  );
}

function statusForPreview(status: AgWorkResumeTargetPreviewStatus) {
  if (status === "conflict") return 409;
  if (status === "blocked") return 422;
  return 200;
}

function recommendedNextStepForPreview(
  preview: AgWorkResumeTargetPreview,
  skippedPreflight: boolean,
) {
  const base =
    preview.status === "ready_for_user_core_review"
      ? "User/Core should review and confirm the local mapping and authority choices before any Codex start."
      : preview.status === "needs_mapping"
        ? "User/Core must confirm whether the foreign work maps to an existing local work item; do not auto-create one."
        : preview.status === "context_only"
          ? "Use the packet as human-readable context only until local runtime and work mapping context are supplied."
          : preview.next_step;
  return skippedPreflight ? `${base} ${SKIPPED_PREFLIGHT_NEXT_STEP}` : base;
}

function badRequest(error: string) {
  return NextResponse.json(
    {
      ok: false,
      route: ROUTE_ID,
      error,
    },
    { status: 400 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
