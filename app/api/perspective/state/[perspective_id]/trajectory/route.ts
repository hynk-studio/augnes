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
import {
  maybeWriteRuntimeRouteAuditEventV01,
  type RuntimeRouteAuditInstrumentationResultV01,
} from "../../../../../../lib/runtime-audit/route-audit-instrumentation";

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
  const auditDbPath = url.searchParams.get("audit_db_path");
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
      const statusCode = storeResultHttpStatus(stateResult);
      const auditEventResult = maybeWriteRuntimeRouteAuditEventV01({
        audit_db_path: auditDbPath,
        route_ref: "route:/api/perspective/state/[perspective_id]/trajectory",
        runtime_slice_ref: "runtime_audit_selected_route_instrumentation_v0_4_phase_4_promotion_state_v0_1",
        event_surface: "perspective_trajectory_runtime",
        event_kind: "route_response",
        event_action: "perspective_trajectory_read",
        event_status: stateResult.status,
        subject_ref: decodedPerspectiveId,
        related_refs: [decodedPerspectiveId, stateResult.state?.state_fingerprint ?? ""].filter(Boolean),
        primary_result_status: stateResult.status,
        primary_result_ref: stateResult.state?.state_fingerprint ?? decodedPerspectiveId,
        bounded_summary: "Perspective trajectory route returned bounded trajectory result.",
        bounded_error_code: statusCode >= 400 ? stateResult.status : null,
      });
      return jsonResponse(storeResultResponse(stateResult, auditEventResult), statusCode);
    }
    const applyEvents = listDurablePerspectiveApplyEventsV01({ perspective_id: decodedPerspectiveId }, db);
    if (applyEvents.status.startsWith("blocked") || applyEvents.status === "not_found") {
      const statusCode = storeResultHttpStatus(applyEvents);
      const auditEventResult = maybeWriteRuntimeRouteAuditEventV01({
        audit_db_path: auditDbPath,
        route_ref: "route:/api/perspective/state/[perspective_id]/trajectory",
        runtime_slice_ref: "runtime_audit_selected_route_instrumentation_v0_4_phase_4_promotion_state_v0_1",
        event_surface: "perspective_trajectory_runtime",
        event_kind: "route_response",
        event_action: "perspective_trajectory_read",
        event_status: applyEvents.status,
        subject_ref: decodedPerspectiveId,
        related_refs: [
          decodedPerspectiveId,
          stateResult.state.state_fingerprint,
          ...applyEvents.apply_events.slice(0, 10).map((event) => event.apply_event_id),
        ],
        primary_result_status: applyEvents.status,
        primary_result_ref: stateResult.state.state_fingerprint,
        bounded_summary: "Perspective trajectory route returned bounded trajectory result.",
        bounded_error_code: statusCode >= 400 ? applyEvents.status : null,
      });
      return jsonResponse(storeResultResponse(applyEvents, auditEventResult), statusCode);
    }
    const input = createPerspectiveTrajectoryInputFromDurableStateV01({
      state: stateResult.state,
      apply_events: applyEvents.apply_events,
      as_of: url.searchParams.get("as_of") ?? stateResult.state.updated_at,
    });
    const trajectory = buildPerspectiveTrajectoryV01(input);
    const statusCode = trajectoryHttpStatus(trajectory);
    const auditEventResult = maybeWriteRuntimeRouteAuditEventV01({
      audit_db_path: auditDbPath,
      route_ref: "route:/api/perspective/state/[perspective_id]/trajectory",
      runtime_slice_ref: "runtime_audit_selected_route_instrumentation_v0_4_phase_4_promotion_state_v0_1",
      event_surface: "perspective_trajectory_runtime",
      event_kind: "route_response",
      event_action: "perspective_trajectory_read",
      event_status: trajectory.status,
      subject_ref: decodedPerspectiveId,
      related_refs: [
        decodedPerspectiveId,
        stateResult.state.state_fingerprint,
        trajectory.trajectory_fingerprint,
        ...applyEvents.apply_events.slice(0, 10).map((event) => event.apply_event_id),
      ],
      primary_result_status: trajectory.status,
      primary_result_ref: trajectory.trajectory_fingerprint,
      bounded_summary: "Perspective trajectory route returned bounded trajectory result.",
      bounded_error_code: statusCode >= 400 ? trajectory.status : null,
    });
    return jsonResponse(trajectoryResponse(trajectory, auditEventResult), statusCode);
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

function storeResultResponse(
  result: DurablePerspectiveStateApplyResult,
  auditEventResult?: RuntimeRouteAuditInstrumentationResultV01,
) {
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
    audit_event_result: auditEventResult,
  };
}

function trajectoryResponse(
  trajectory: PerspectiveTrajectory,
  auditEventResult?: RuntimeRouteAuditInstrumentationResultV01,
) {
  const errorCode = trajectory.status.startsWith("blocked") ? trajectory.status : null;
  return {
    route_version: routeVersion,
    scope,
    status: errorCode ? "error" : "ok",
    error_code: errorCode,
    trajectory,
    authority_boundary: createPerspectiveTrajectoryAuthorityBoundaryV01(),
    audit_event_result: auditEventResult,
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
