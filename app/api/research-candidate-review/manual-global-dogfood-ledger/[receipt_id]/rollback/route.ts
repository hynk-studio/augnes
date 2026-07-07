import {
  rollbackResearchCandidateManualGlobalDogfoodLedgerReceipt,
} from "@/lib/research-candidate-review/manual-global-dogfood-ledger-write";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const routeVersion =
  "research_candidate_manual_global_dogfood_ledger_rollback_route.v0.1" as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ receipt_id: string }> },
) {
  if (!requestHasSameOriginBoundary(request)) {
    return errorResponse("same_origin_required", 403);
  }

  const { receipt_id: encodedReceiptId } = await params;
  const receiptId = decodeURIComponent(encodedReceiptId);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_json_body", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse("invalid_json_object", 400);
  }

  const result = rollbackResearchCandidateManualGlobalDogfoodLedgerReceipt({
    ...(body as Record<string, unknown>),
    receipt_id: receiptId,
  });
  return NextResponse.json(
    {
      ok: result.ok,
      route_version: routeVersion,
      result,
      rollback: result.rollback,
      receipt: result.receipt,
      readback: result.readback,
      records_deleted: false,
      ledger_record_deleted: false,
      dogfood_metrics_written: false,
      proof_or_evidence_rows_written: false,
      work_or_perspective_rows_written: false,
      perspective_memory_written: false,
      product_write_executed: false,
      provider_called: false,
      openai_called: false,
      github_called: false,
      codex_executed: false,
      retrieval_or_source_fetch_run: false,
    },
    { status: result.ok ? 200 : result.result_status === "not_found" ? 404 : 400 },
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

function errorResponse(errorCode: string, status: number) {
  return NextResponse.json(
    {
      ok: false,
      route_version: routeVersion,
      error_code: errorCode,
      records_deleted: false,
      ledger_record_deleted: false,
      dogfood_metrics_written: false,
      proof_or_evidence_rows_written: false,
      work_or_perspective_rows_written: false,
      perspective_memory_written: false,
      product_write_executed: false,
      provider_called: false,
      openai_called: false,
      github_called: false,
      codex_executed: false,
      retrieval_or_source_fetch_run: false,
    },
    { status },
  );
}
