import {
  rollbackResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReceipt,
} from "@/lib/research-candidate-review/manual-global-dogfood-perspective-writer-compatibility-write";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const routeVersion =
  "research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollback_route.v0.1" as const;

export async function POST(
  request: Request,
  context: { params: Promise<{ receipt_id: string }> },
) {
  if (!requestHasSameOriginBoundary(request)) {
    return errorResponse("same_origin_required", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_json_body", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse("invalid_json_object", 400);
  }

  const { receipt_id } = await context.params;
  const result = rollbackResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReceipt({
    ...(body as Record<string, unknown>),
    receipt_id: decodeURIComponent(receipt_id),
  });
  return NextResponse.json(
    {
      ok: result.ok,
      route_version: routeVersion,
      result,
      rollback: result.rollback,
      receipt: result.receipt,
      readback: result.readback,
      ...nonTargetRouteFlags(),
    },
    { status: result.ok ? 200 : 400 },
  );
}

function requestHasSameOriginBoundary(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return false;
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  if (!origin) return isLocalTestHost(host);

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

function isLocalTestHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return (
    /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(normalized) ||
    /^\[::1\](:\d+)?$/.test(normalized)
  );
}

function nonTargetRouteFlags() {
  return {
    existing_current_working_writer_called: false,
    existing_canonical_state_writer_called: false,
    canonical_perspective_state_written: false,
    existing_canonical_perspective_state_table_mutated: false,
    direct_canonical_perspective_state_table_mutated: false,
    current_working_perspective_updated: false,
    work_mutated: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    perspective_state_application_record_mutated: false,
    perspective_adapter_record_mutated: false,
    perspective_state_mutation_record_mutated: false,
    perspective_apply_record_mutated: false,
    canonical_perspective_update_record_mutated: false,
    perspective_relay_mutated: false,
    next_work_bias_mutated: false,
    dogfood_metrics_written: false,
    global_dogfood_ledger_mutated: false,
    metric_snapshot_mutated: false,
    next_work_signal_decision_mutated: false,
    proof_or_evidence_rows_written: false,
    product_write_executed: false,
    provider_called: false,
    openai_called: false,
    github_called: false,
    codex_executed: false,
    retrieval_or_source_fetch_run: false,
  };
}

function errorResponse(errorCode: string, status: number) {
  return NextResponse.json(
    {
      ok: false,
      route_version: routeVersion,
      error_code: errorCode,
      ...nonTargetRouteFlags(),
    },
    { status },
  );
}
