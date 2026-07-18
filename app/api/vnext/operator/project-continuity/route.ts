import type Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  VNextLocalOperatorSessionErrorV01,
  assertVNextLocalOperatorRequestBoundaryV01,
  authenticateVNextLocalOperatorSessionV01,
  openVNextLocalOperatorDatabaseV01,
  readBoundedVNextLocalOperatorBodyV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  readVNextLocalOperatorPilotConfigV01,
  serializeVNextLocalOperatorSessionCookieV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import {
  VNextOperatorPilotContinuityErrorV01,
  projectVNextOperatorPilotContinuityV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  VNextOperatorPilotContextUseReviewErrorV01,
  recordVNextOperatorPilotContextUseReviewV01,
} from "@/lib/vnext/runtime/operator-pilot-context-use-review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "vnext_operator_project_continuity_route.v0.1" as const;
const SECURITY_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
} as const;

interface HandlerOptionsV01 {
  environment?: NodeJS.ProcessEnv;
  clock?: VNextLocalRuntimeClockV01;
  secret_source?: VNextLocalOperatorSecretSourceV01;
  open_database?: (config: VNextLocalOperatorPilotConfigV01) => Database.Database;
}

export function createVNextOperatorProjectContinuityHandlerV01(
  options: HandlerOptionsV01 = {},
) {
  return async function GET(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertEnabled(environment);
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: false,
      });
      if ([...url.searchParams.keys()].length > 0) {
        throw new VNextOperatorPilotContinuityErrorV01(
          "operator_pilot_continuity_query_forbidden",
          400,
        );
      }
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      db = (options.open_database ?? openVNextLocalOperatorDatabaseV01)(config);
      authenticateVNextLocalOperatorSessionV01(db, {
        config,
        credential,
        clock: options.clock,
      });
      const continuity = projectVNextOperatorPilotContinuityV01(db, {
        config,
        clock: options.clock,
      });
      return jsonResponse({
        ok: true,
        route_version: ROUTE_VERSION,
        status: "project_continuity",
        project: {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
        },
        continuity,
        projection_is_read_only: true,
        authentication_boundary:
          "local_secret_possession_only_not_external_identity",
        semantic_authority_granted: false,
      });
    } catch (error) {
      return errorResponse(error);
    } finally {
      db?.close();
    }
  };
}

export const GET = createVNextOperatorProjectContinuityHandlerV01();

export function createVNextOperatorContextUseReviewHandlerV01(
  options: HandlerOptionsV01 = {},
) {
  return async function POST(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertEnabled(environment);
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: true,
      });
      if ([...url.searchParams.keys()].length > 0) {
        throw new VNextOperatorPilotContextUseReviewErrorV01(
          "operator_pilot_context_use_review_query_forbidden",
          400,
        );
      }
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      db = (options.open_database ?? openVNextLocalOperatorDatabaseV01)(config);
      const result = recordVNextOperatorPilotContextUseReviewV01(db, {
        config,
        credential,
        request: await readBoundedVNextLocalOperatorBodyV01(request),
        clock: options.clock,
        secret_source: options.secret_source,
      });
      return jsonResponse(
        {
          ok: true,
          route_version: ROUTE_VERSION,
          status: result.status,
          review: result.review,
          semantic_state_changed: false,
          transition_created: false,
          packet_created: false,
          authentication_boundary:
            "local_secret_possession_only_not_external_identity",
          semantic_authority_granted: false,
        },
        result.status === "inserted" ? 201 : 200,
        serializeVNextLocalOperatorSessionCookieV01({
          value: result.session_admission.cookie_value,
          expires_at: result.session_admission.cookie_expires_at,
          max_age_seconds: result.session_admission.cookie_max_age_seconds,
          secure: url.protocol === "https:",
        }),
      );
    } catch (error) {
      return errorResponse(error);
    } finally {
      db?.close();
    }
  };
}

export const POST = createVNextOperatorContextUseReviewHandlerV01();

function assertEnabled(environment: NodeJS.ProcessEnv): void {
  if (environment.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED !== "1") {
    throw new VNextLocalOperatorSessionErrorV01("operator_pilot_disabled", 404);
  }
}

function errorResponse(error: unknown): NextResponse {
  const known =
    error instanceof VNextLocalOperatorSessionErrorV01 ||
    error instanceof VNextOperatorPilotContinuityErrorV01 ||
    error instanceof VNextOperatorPilotContextUseReviewErrorV01;
  const disabled =
    error instanceof VNextLocalOperatorSessionErrorV01 &&
    error.code === "operator_pilot_disabled";
  return jsonResponse(
    {
      ok: false,
      route_version: ROUTE_VERSION,
      status: disabled ? "not_found" : "error",
      error_code: disabled
        ? "not_found"
        : known
          ? error.code
          : "operator_pilot_continuity_read_failed",
      semantic_authority_granted: false,
    },
    disabled ? 404 : known ? error.status : 500,
  );
}

function jsonResponse(
  body: unknown,
  status = 200,
  cookie?: string,
): NextResponse {
  const headers = new Headers(SECURITY_HEADERS);
  if (cookie) headers.append("Set-Cookie", cookie);
  return NextResponse.json(body, {
    status,
    headers,
  });
}
