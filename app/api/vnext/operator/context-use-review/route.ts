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
  VNextOperatorPilotContextUseReviewErrorV01,
  readVNextOperatorPilotContextUseReviewForLaterResultV01,
  readVNextOperatorPilotContextUseReviewV01,
  recordVNextOperatorPilotContextUseReviewV01,
} from "@/lib/vnext/runtime/operator-pilot-context-use-review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "vnext_operator_context_use_review_route.v0.1" as const;
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
  open_database?: (
    config: VNextLocalOperatorPilotConfigV01,
  ) => Database.Database;
}

export function createVNextOperatorContextUseReviewHandlersV01(
  options: HandlerOptionsV01 = {},
) {
  const openDatabase =
    options.open_database ?? openVNextLocalOperatorDatabaseV01;

  async function GET(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertEnabled(environment);
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: false,
      });
      const query = parseReadQuery(url);
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential =
        readVNextLocalOperatorCredentialFromRequestV01(request);
      db = openDatabase(config);
      authenticateVNextLocalOperatorSessionV01(db, {
        config,
        credential,
        clock: options.clock,
      });
      const result =
        query.mode === "review"
          ? readVNextOperatorPilotContextUseReviewV01(db, {
              config,
              review_id: query.review_id,
              review_fingerprint: query.review_fingerprint,
            })
          : readVNextOperatorPilotContextUseReviewForLaterResultV01(db, {
              config,
              later_task_run_receipt_id:
                query.later_task_run_receipt_id,
              later_task_run_receipt_fingerprint:
                query.later_task_run_receipt_fingerprint,
            });
      return successResponse("context_use_review", result);
    } catch (error) {
      return errorResponse(error);
    } finally {
      db?.close();
    }
  }

  async function POST(request: Request): Promise<NextResponse> {
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
      const credential =
        readVNextLocalOperatorCredentialFromRequestV01(request);
      const body = await readBoundedVNextLocalOperatorBodyV01(request);
      db = openDatabase(config);
      const result = recordVNextOperatorPilotContextUseReviewV01(db, {
        config,
        credential,
        request: body,
        clock: options.clock,
        secret_source: options.secret_source,
      });
      return successResponse(
        result.status,
        result,
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
  }

  return { GET, POST };
}

const handlers = createVNextOperatorContextUseReviewHandlersV01();
export const GET = handlers.GET;
export const POST = handlers.POST;

type ReadQueryV01 =
  | { mode: "review"; review_id: string; review_fingerprint: string }
  | {
      mode: "later_result";
      later_task_run_receipt_id: string;
      later_task_run_receipt_fingerprint: string;
    };

function parseReadQuery(url: URL): ReadQueryV01 {
  const keys = [...url.searchParams.keys()];
  const reviewMode = keys.every((key) =>
    ["review_id", "review_fingerprint"].includes(key),
  );
  const laterResultMode = keys.every((key) =>
    [
      "later_task_run_receipt_id",
      "later_task_run_receipt_fingerprint",
    ].includes(key),
  );
  if (
    keys.length !== 2 ||
    (!reviewMode && !laterResultMode) ||
    keys.some((key) => url.searchParams.getAll(key).length !== 1)
  ) {
    throw new VNextOperatorPilotContextUseReviewErrorV01(
      "operator_pilot_context_use_review_query_invalid",
      400,
    );
  }
  if (reviewMode) {
    return {
      mode: "review",
      review_id: url.searchParams.get("review_id")!,
      review_fingerprint: url.searchParams.get("review_fingerprint")!,
    };
  }
  return {
    mode: "later_result",
    later_task_run_receipt_id: url.searchParams.get(
      "later_task_run_receipt_id",
    )!,
    later_task_run_receipt_fingerprint: url.searchParams.get(
      "later_task_run_receipt_fingerprint",
    )!,
  };
}

function assertEnabled(environment: NodeJS.ProcessEnv): void {
  if (environment.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED !== "1") {
    throw new VNextLocalOperatorSessionErrorV01(
      "operator_pilot_disabled",
      404,
    );
  }
}

function successResponse(
  status: "inserted" | "exact_replay" | "context_use_review",
  result: {
    review_version: string;
    workspace_id: string;
    project_id: string;
    review: unknown;
    relation: unknown;
    correction_proposal_created: false;
    semantic_state_mutated: false;
    transition_created: false;
    evidence_accepted: false;
    perspective_mutated: false;
    memory_promoted: false;
    work_closed: false;
    automatic_context_change: false;
  },
  responseStatus = 200,
  setCookie?: string,
): NextResponse {
  return jsonResponse(
    {
      ok: true,
      route_version: ROUTE_VERSION,
      status,
      review_version: result.review_version,
      workspace_id: result.workspace_id,
      project_id: result.project_id,
      review: result.review,
      relation: result.relation,
      correction_proposal_created: result.correction_proposal_created,
      semantic_state_mutated: result.semantic_state_mutated,
      transition_created: result.transition_created,
      evidence_accepted: result.evidence_accepted,
      perspective_mutated: result.perspective_mutated,
      memory_promoted: result.memory_promoted,
      work_closed: result.work_closed,
      automatic_context_change: result.automatic_context_change,
      authentication_boundary:
        "local_secret_possession_only_not_external_identity",
      semantic_authority_granted: false,
    },
    responseStatus,
    setCookie,
  );
}

function errorResponse(error: unknown): NextResponse {
  const known =
    error instanceof VNextLocalOperatorSessionErrorV01 ||
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
          : "operator_pilot_context_use_review_request_failed",
      semantic_authority_granted: false,
    },
    disabled ? 404 : known ? error.status : 500,
  );
}

function jsonResponse(
  body: unknown,
  status = 200,
  setCookie?: string,
): NextResponse {
  const headers = new Headers(SECURITY_HEADERS);
  if (setCookie) headers.set("Set-Cookie", setCookie);
  return NextResponse.json(body, { status, headers });
}
