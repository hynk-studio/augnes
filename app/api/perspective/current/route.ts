import {
  CURRENT_WORKING_PERSPECTIVE_CACHE_CONTROL,
  CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_HEADER,
  CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_MARKER,
  buildCurrentWorkingPerspectiveReadError,
  buildCurrentWorkingPerspectiveRuntimeReadModel,
  validateCurrentWorkingPerspectiveReadRequest,
} from "@/lib/perspective/current-working-perspective-source";
import { readCurrentWorkingPerspectiveRouteIntegrationForWebV01 } from "@/lib/perspective/read-current-working-perspective-route-integration-for-web";
import type { CurrentWorkingPerspectiveRouteIntegrationReadMode } from "@/types/current-working-perspective-route-integration-read";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const READONLY_RESPONSE_HEADERS = {
  [CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_HEADER]:
    CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_MARKER,
  "cache-control": CURRENT_WORKING_PERSPECTIVE_CACHE_CONTROL,
} as const;

const ROUTE_INTEGRATION_QUERY_PARAMS = [
  "route_integration_contract_db_path",
  "applied_snapshot_db_path",
  "route_integration_mode",
  "include_route_integration_metadata",
  "include_applied_snapshot_overlay",
] as const;

export function GET(request: Request) {
  try {
    const validation = validateCurrentWorkingPerspectiveReadRequest(request);

    if (!validation.ok) {
      return NextResponse.json(
        buildCurrentWorkingPerspectiveReadError({
          code: validation.code,
          status: validation.status,
          authorityBoundary: validation.authority_boundary,
        }),
        {
          status: validation.status,
          headers: READONLY_RESPONSE_HEADERS,
        },
      );
    }

    const readModel = buildCurrentWorkingPerspectiveRuntimeReadModel({
      scope: validation.scope,
    });
    const url = new URL(request.url);
    const hasRouteIntegrationParams = ROUTE_INTEGRATION_QUERY_PARAMS.some(
      (param) => url.searchParams.has(param),
    );
    if (!hasRouteIntegrationParams) {
      return NextResponse.json(readModel, {
        status: 200,
        headers: READONLY_RESPONSE_HEADERS,
      });
    }

    const routeIntegrationRead =
      readCurrentWorkingPerspectiveRouteIntegrationForWebV01({
        runtime_current_working_perspective_read: readModel,
        route_integration_contract_db_path: url.searchParams.get(
          "route_integration_contract_db_path",
        ),
        applied_snapshot_db_path: url.searchParams.get("applied_snapshot_db_path"),
        requested_route_integration_mode: parseRouteIntegrationMode(
          url.searchParams.get("route_integration_mode"),
        ),
        scope: validation.scope,
        as_of: readModel.as_of,
        source_refs: [
          "route:/api/perspective/current",
          "route_integration_read:explicit_query_params",
        ],
      });
    const includeRouteIntegrationMetadata =
      url.searchParams.get("include_route_integration_metadata") !== "false";
    const includeAppliedSnapshotOverlay =
      url.searchParams.get("include_applied_snapshot_overlay") !== "false";

    return NextResponse.json(
      {
        ...readModel,
        primary_current_working_perspective:
          routeIntegrationRead.primary_current_working_perspective,
        runtime_current_working_perspective:
          routeIntegrationRead.runtime_current_working_perspective,
        applied_current_working_perspective: includeAppliedSnapshotOverlay
          ? routeIntegrationRead.applied_current_working_perspective
          : null,
        applied_snapshot_metadata:
          routeIntegrationRead.applied_snapshot_metadata,
        route_integration_metadata:
          routeIntegrationRead.route_integration_metadata,
        route_integration: includeRouteIntegrationMetadata
          ? routeIntegrationRead
          : {
              read_version: routeIntegrationRead.read_version,
              status: routeIntegrationRead.status,
              response_mode: routeIntegrationRead.response_mode,
              route_path: routeIntegrationRead.route_path,
              route_family: routeIntegrationRead.route_family,
              fallback_metadata: routeIntegrationRead.fallback_metadata,
              authority_boundary: routeIntegrationRead.authority_boundary,
            },
      },
      {
        status: 200,
        headers: {
          ...READONLY_RESPONSE_HEADERS,
          "x-augnes-current-working-perspective-route-integration":
            routeIntegrationRead.read_version,
          "x-augnes-current-working-perspective-route-integration-status":
            routeIntegrationRead.status,
          "x-augnes-current-working-perspective-route-integration-mode":
            routeIntegrationRead.response_mode,
        },
      },
    );
  } catch {
    return NextResponse.json(
      buildCurrentWorkingPerspectiveReadError({
        code: "unavailable",
        status: 500,
      }),
      {
        status: 500,
        headers: READONLY_RESPONSE_HEADERS,
      },
    );
  }
}

function parseRouteIntegrationMode(
  value: string | null,
): CurrentWorkingPerspectiveRouteIntegrationReadMode | undefined {
  if (
    value === "runtime_only_with_applied_snapshot_hint" ||
    value === "applied_snapshot_overlay_candidate" ||
    value === "applied_snapshot_preferred_with_runtime_fallback"
  ) {
    return value;
  }
  return undefined;
}
