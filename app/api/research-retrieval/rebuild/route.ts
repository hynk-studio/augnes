import { NextResponse } from "next/server";

import {
  buildRebuildableRetrievalIndexV01,
  createRebuildableRetrievalIndexRuntimeBoundaryV01,
  validateRebuildableRetrievalIndexBuildInputV01,
} from "@/lib/research-retrieval/rebuild-index";
import {
  createReadOnlyRebuildableRetrievalIndexStoreSnapshotV01,
  rebuildableRetrievalIndexRuntimeDerivedStoreV01,
} from "@/lib/research-retrieval/index-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!requestHasSameOriginBoundary(request)) {
    return jsonResponse(errorResponse("same_origin_required"), 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(errorResponse("invalid_json_body"), 400);
  }

  if (!isRecord(body)) {
    return jsonResponse(errorResponse("json_object_required"), 400);
  }

  const validation = validateRebuildableRetrievalIndexBuildInputV01(body);
  const report = buildRebuildableRetrievalIndexV01(body as never);
  if (validation.passed && report.index) {
    rebuildableRetrievalIndexRuntimeDerivedStoreV01.saveIndex(report.index);
  }

  return jsonResponse(
    {
      route_version: "rebuildable_retrieval_index_rebuild_route.v0.1",
      scope: "project:augnes",
      status: validation.passed && report.index ? "ok" : "rejected",
      report,
      derived_cache_snapshot: createReadOnlyRebuildableRetrievalIndexStoreSnapshotV01(
        rebuildableRetrievalIndexRuntimeDerivedStoreV01,
      ),
      boundary_notes: [
        "Route accepts caller-provided bounded summaries and symbolic refs only.",
        "Returned index is derived, rebuildable, and non-authoritative.",
        "Process memory cache is derived and ephemeral only.",
      ],
      authority_boundary: createRebuildableRetrievalIndexRuntimeBoundaryV01(),
    },
    validation.passed ? 200 : 400,
  );
}

function requestHasSameOriginBoundary(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;

  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
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

function errorResponse(errorCode: string) {
  return {
    route_version: "rebuildable_retrieval_index_rebuild_route.v0.1",
    scope: "project:augnes",
    status: "error",
    error_code: errorCode,
    authority_boundary: createRebuildableRetrievalIndexRuntimeBoundaryV01(),
  };
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
