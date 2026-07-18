import type Database from "better-sqlite3";
import { NextResponse } from "next/server";

import type { NativeHostAdapterV01 } from "@/types/vnext/native-host-adapter";
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
  type VNextLocalOperatorSessionMutationAdmissionV01,
} from "@/lib/vnext/runtime/local-operator-session";
import {
  readVNextLocalRuntimeClockNowV01,
  type VNextLocalRuntimeClockV01,
} from "@/lib/vnext/runtime/local-runtime-clock";
import {
  DirectNativeHostRoundTripErrorV01,
  runDirectNativeHostRoundTripV01,
} from "@/lib/vnext/runtime/direct-native-host-round-trip";
import {
  LiveNativeHostRunServiceErrorV01,
  getLiveNativeHostRunServiceV01,
  type LiveNativeHostRunProjectionV01,
  type LiveNativeHostRunServiceV01,
} from "@/lib/vnext/runtime/live-native-host-run-service";
import { VNextOperatorPilotContinuityErrorV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "vnext_operator_host_round_trip_route.v0.2" as const;
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
  adapter?: NativeHostAdapterV01;
  timeout_ms?: number;
  open_database?: (
    config: VNextLocalOperatorPilotConfigV01,
  ) => Database.Database;
  live_service?: LiveNativeHostRunServiceV01;
}

export function createVNextOperatorHostRoundTripHandlerV01(
  options: HandlerOptionsV01 = {},
) {
  const openDatabase = options.open_database ?? openVNextLocalOperatorDatabaseV01;
  return async function POST(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertEnabledV01(environment);
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: true,
      });
      assertNoQueryV01(url);
      const body = await readBoundedVNextLocalOperatorBodyV01(request);
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);

      if (Object.keys(body).length === 0) {
        db = openDatabase(config);
        const result = await runDirectNativeHostRoundTripV01(
          db,
          {
            config,
            mode: "interactive",
            operator_mutation: {
              credential,
              clock: options.clock,
              secret_source: options.secret_source,
            },
          },
          {
            adapter: options.adapter,
            timeout_ms: options.timeout_ms,
            now: () => nowV01(options.clock),
          },
        );
        return jsonResponse(
          {
            ok: true,
            route_version: ROUTE_VERSION,
            path_kind: "deterministic_compatibility",
            status: result.status,
            mode: result.mode,
            receipt: result.receipt,
            host_outcome:
              result.host_result?.outcome ?? result.receipt.result_summary.outcome,
            packet_copy_actions: result.packet_copy_actions,
            handoff_paste_actions: result.handoff_paste_actions,
            result_paste_actions: result.result_paste_actions,
            internal_id_entry_actions: result.internal_id_entry_actions,
            proposal: result.proposal,
            proposal_created: result.proposal_created,
            ...noSemanticAuthorityV01(),
          },
          result.status === "inserted" ? 201 : 200,
          cookieFromAdmissionV01(result.session_admission, url),
        );
      }

      if (body.action === undefined) {
        throw new DirectNativeHostRoundTripErrorV01(
          "direct_host_body_must_be_empty",
          400,
        );
      }
      const action = stringFieldV01(body.action, "live_host_action_invalid");
      const liveService = options.live_service ?? getLiveNativeHostRunServiceV01();
      if (action === "start_live") {
        assertExactKeysV01(body, ["action"]);
        const result = await liveService.start({
          config,
          mode: "interactive",
          operator_mutation: {
            credential,
            clock: options.clock,
            secret_source: options.secret_source,
          },
        });
        return liveResponseV01(
          result.projection,
          result.status,
          result.status === "accepted" ? 202 : 200,
          cookieFromAdmissionV01(result.session_admission, url),
        );
      }
      if (action === "approve_once" || action === "decline") {
        assertExactKeysV01(body, [
          "action",
          "run_ref",
          "approval_ref",
          "control_revision",
        ]);
        const result = await liveService.decide({
          config,
          run_ref: opaqueRefV01(body.run_ref),
          approval_ref: opaqueRefV01(body.approval_ref),
          control_revision: revisionV01(body.control_revision),
          decision: action,
          credential,
          clock: options.clock,
          secret_source: options.secret_source,
        });
        return liveResponseV01(
          result.projection,
          "decision_admitted",
          200,
          cookieFromAdmissionV01(result.session_admission, url),
        );
      }
      if (action === "cancel" || action === "resume") {
        assertExactKeysV01(body, ["action", "run_ref", "control_revision"]);
        const common = {
          config,
          run_ref: opaqueRefV01(body.run_ref),
          control_revision: revisionV01(body.control_revision),
          credential,
          clock: options.clock,
          secret_source: options.secret_source,
        };
        if (action === "cancel") {
          const result = await liveService.cancel(common);
          return liveResponseV01(
            result.projection,
            "cancellation_admitted",
            200,
            cookieFromAdmissionV01(result.session_admission, url),
          );
        }
        const result = await liveService.resume(common);
        return liveResponseV01(
          result.projection,
          "resume_admitted",
          result.status === "accepted" ? 202 : 200,
          cookieFromAdmissionV01(result.session_admission, url),
        );
      }
      throw new LiveNativeHostRunServiceErrorV01(
        "live_host_action_unsupported",
        400,
      );
    } catch (error) {
      return errorResponse(error);
    } finally {
      db?.close();
    }
  };
}

export function createVNextOperatorHostRoundTripReadHandlerV01(
  options: HandlerOptionsV01 = {},
) {
  const openDatabase = options.open_database ?? openVNextLocalOperatorDatabaseV01;
  return async function GET(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertEnabledV01(environment);
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: false,
      });
      assertNoQueryV01(url);
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      db = openDatabase(config);
      authenticateVNextLocalOperatorSessionV01(db, {
        config,
        credential,
        clock: options.clock,
      });
      const projection = (
        options.live_service ?? getLiveNativeHostRunServiceV01()
      ).read(config);
      return liveResponseV01(projection, "projection", 200, null);
    } catch (error) {
      return errorResponse(error);
    } finally {
      db?.close();
    }
  };
}

const POST_HANDLER = createVNextOperatorHostRoundTripHandlerV01();
export const POST = POST_HANDLER;
export const GET = createVNextOperatorHostRoundTripReadHandlerV01();

function liveResponseV01(
  projection: LiveNativeHostRunProjectionV01,
  status: string,
  httpStatus: number,
  cookie: string | null,
): NextResponse {
  return jsonResponse(
    {
      ok: true,
      route_version: ROUTE_VERSION,
      path_kind: "live_codex_app_server",
      status,
      live_run: projection,
      authentication_boundary:
        "local_secret_possession_only_not_external_identity",
      proposal_created: false,
      ...noSemanticAuthorityV01(),
    },
    httpStatus,
    cookie,
  );
}

function noSemanticAuthorityV01() {
  return {
    decision_created: false,
    transition_created: false,
    evidence_accepted: false,
    work_closed: false,
    semantic_state_changed: false,
    semantic_authority_granted: false,
  } as const;
}

function assertEnabledV01(environment: NodeJS.ProcessEnv): void {
  if (environment.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED !== "1") {
    throw new VNextLocalOperatorSessionErrorV01("operator_pilot_disabled", 404);
  }
}

function assertNoQueryV01(url: URL): void {
  if ([...url.searchParams.keys()].length > 0) {
    throw new DirectNativeHostRoundTripErrorV01(
      "direct_host_query_forbidden",
      400,
    );
  }
}

function assertExactKeysV01(
  body: Record<string, unknown>,
  expected: string[],
): void {
  const actual = Object.keys(body).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    throw new LiveNativeHostRunServiceErrorV01(
      "live_host_action_body_invalid",
      400,
    );
  }
}

function opaqueRefV01(value: unknown): string {
  const ref = stringFieldV01(value, "live_host_reference_invalid");
  if (ref.length > 512 || /[\u0000-\u001f\u007f]/u.test(ref)) {
    throw new LiveNativeHostRunServiceErrorV01(
      "live_host_reference_invalid",
      400,
    );
  }
  return ref;
}

function revisionV01(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new LiveNativeHostRunServiceErrorV01(
      "live_host_control_revision_invalid",
      400,
    );
  }
  return Number(value);
}

function stringFieldV01(value: unknown, code: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new LiveNativeHostRunServiceErrorV01(code, 400);
  }
  return value;
}

function nowV01(clock?: VNextLocalRuntimeClockV01): string {
  return readVNextLocalRuntimeClockNowV01(
    clock,
    "operator_host_round_trip_observed_at",
  );
}

function cookieFromAdmissionV01(
  admission: VNextLocalOperatorSessionMutationAdmissionV01 | null,
  url: URL,
): string | null {
  return admission
    ? serializeVNextLocalOperatorSessionCookieV01({
        value: admission.cookie_value,
        expires_at: admission.cookie_expires_at,
        max_age_seconds: admission.cookie_max_age_seconds,
        secure: url.protocol === "https:",
      })
    : null;
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof VNextLocalOperatorSessionErrorV01) {
    return jsonResponse(
      {
        ok: false,
        route_version: ROUTE_VERSION,
        status: error.code === "operator_pilot_disabled" ? "not_found" : "error",
        error_code:
          error.code === "operator_pilot_disabled" ? "not_found" : error.code,
        semantic_authority_granted: false,
      },
      error.status,
    );
  }
  if (
    error instanceof DirectNativeHostRoundTripErrorV01 ||
    error instanceof VNextOperatorPilotContinuityErrorV01 ||
    error instanceof LiveNativeHostRunServiceErrorV01
  ) {
    return jsonResponse(
      {
        ok: false,
        route_version: ROUTE_VERSION,
        status: "error",
        error_code: error.code,
        semantic_authority_granted: false,
      },
      error.status,
    );
  }
  return jsonResponse(
    {
      ok: false,
      route_version: ROUTE_VERSION,
      status: "error",
      error_code: "direct_host_round_trip_failed",
      semantic_authority_granted: false,
    },
    500,
  );
}

function jsonResponse(
  body: unknown,
  status = 200,
  cookie: string | null = null,
): NextResponse {
  const response = NextResponse.json(body, {
    status,
    headers: SECURITY_HEADERS,
  });
  if (cookie) response.headers.append("Set-Cookie", cookie);
  return response;
}
