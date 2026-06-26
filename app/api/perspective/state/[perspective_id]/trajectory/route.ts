import { existsSync } from "node:fs";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  buildPerspectiveTrajectoryV01,
  createPerspectiveTrajectoryAuthorityBoundaryV01,
  createPerspectiveTrajectoryInputFromDurableStateV01,
  type PerspectiveTrajectory,
} from "../../../../../../lib/perspective/state/build-trajectory";
import {
  durablePerspectiveStateSchemaExistsV01,
  isSafeDurablePerspectiveStateRouteDbPathV01,
  listDurablePerspectiveApplyEventsV01,
  readDurablePerspectiveStateV01,
  type DurablePerspectiveStateApplyResult,
} from "../../../../../../lib/perspective/state/state-store";

export const runtime = "nodejs";

const scope = "project:augnes" as const;
const routeVersion = "perspective_trajectory_read_route.v0.1" as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ perspective_id: string }> },
) {
  const { perspective_id } = await params;
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeDurablePerspectiveStateRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const opened = openReadOnlyLocalDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(errorResponse(opened.errorCode), opened.status);
  }
  const db = opened.db;
  try {
    if (!durablePerspectiveStateSchemaExistsV01(db)) {
      return jsonResponse(errorResponse("schema_missing"), 400);
    }
    const decodedPerspectiveId = decodeURIComponent(perspective_id);
    const stateResult = readDurablePerspectiveStateV01(decodedPerspectiveId, db);
    if (stateResult.status !== "applied" || !stateResult.state) {
      return jsonResponse(storeResultResponse(stateResult), storeResultHttpStatus(stateResult));
    }
    const applyEvents = listDurablePerspectiveApplyEventsV01({ perspective_id: decodedPerspectiveId }, db);
    if (applyEvents.status.startsWith("blocked") || applyEvents.status === "not_found") {
      return jsonResponse(storeResultResponse(applyEvents), storeResultHttpStatus(applyEvents));
    }
    const input = createPerspectiveTrajectoryInputFromDurableStateV01({
      state: stateResult.state,
      apply_events: applyEvents.apply_events,
      as_of: url.searchParams.get("as_of") ?? stateResult.state.updated_at,
    });
    const trajectory = buildPerspectiveTrajectoryV01(input);
    return jsonResponse(trajectoryResponse(trajectory), trajectoryHttpStatus(trajectory));
  } finally {
    db.close();
  }
}

function openReadOnlyLocalDb(dbPath: string):
  | { db: Database.Database }
  | { errorCode: "db_missing"; status: 404 } {
  if (!existsSync(dbPath)) return { errorCode: "db_missing", status: 404 };
  try {
    return { db: new Database(dbPath, { readonly: true, fileMustExist: true }) };
  } catch {
    return { errorCode: "db_missing", status: 404 };
  }
}

function storeResultHttpStatus(result: DurablePerspectiveStateApplyResult): number {
  if (result.status === "not_found") return 404;
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status.startsWith("blocked")) return 400;
  return 200;
}

function trajectoryHttpStatus(trajectory: PerspectiveTrajectory): number {
  if (trajectory.status === "blocked_private_or_raw_payload" || trajectory.status === "blocked_invalid_input") {
    return 400;
  }
  return 200;
}

function storeResultResponse(result: DurablePerspectiveStateApplyResult) {
  const errorCode = result.status.startsWith("blocked") || result.status === "not_found"
    ? result.status
    : null;
  return {
    route_version: routeVersion,
    scope,
    status: errorCode ? "error" : "ok",
    error_code: errorCode,
    result,
    trajectory: null,
    authority_boundary: createPerspectiveTrajectoryAuthorityBoundaryV01(),
  };
}

function trajectoryResponse(trajectory: PerspectiveTrajectory) {
  const errorCode = trajectory.status.startsWith("blocked") ? trajectory.status : null;
  return {
    route_version: routeVersion,
    scope,
    status: errorCode ? "error" : "ok",
    error_code: errorCode,
    trajectory,
    authority_boundary: createPerspectiveTrajectoryAuthorityBoundaryV01(),
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: routeVersion,
    scope,
    status: "error",
    error_code: errorCode,
    trajectory: null,
    authority_boundary: createPerspectiveTrajectoryAuthorityBoundaryV01(),
  };
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}
