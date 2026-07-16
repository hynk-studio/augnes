import type Database from "better-sqlite3";
import { NextResponse } from "next/server";

import type { NativeHostAdapterV01 } from "@/types/vnext/native-host-adapter";
import {
  VNextLocalOperatorSessionErrorV01,
  assertVNextLocalOperatorRequestBoundaryV01,
  openVNextLocalOperatorDatabaseV01,
  readBoundedVNextLocalOperatorBodyV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  readVNextLocalOperatorPilotConfigV01,
  serializeVNextLocalOperatorSessionCookieV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
} from "@/lib/vnext/runtime/local-operator-session";
import {
  readVNextLocalRuntimeClockNowV01,
  type VNextLocalRuntimeClockV01,
} from "@/lib/vnext/runtime/local-runtime-clock";
import {
  DirectNativeHostRoundTripErrorV01,
  runDirectNativeHostRoundTripV01,
} from "@/lib/vnext/runtime/direct-native-host-round-trip";
import { VNextOperatorPilotContinuityErrorV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "vnext_operator_host_round_trip_route.v0.1" as const;
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
}

export function createVNextOperatorHostRoundTripHandlerV01(
  options: HandlerOptionsV01 = {},
) {
  const openDatabase =
    options.open_database ?? openVNextLocalOperatorDatabaseV01;
  return async function POST(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      if (environment.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED !== "1") {
        throw new VNextLocalOperatorSessionErrorV01(
          "operator_pilot_disabled",
          404,
        );
      }
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: true,
      });
      if ([...url.searchParams.keys()].length > 0) {
        throw new DirectNativeHostRoundTripErrorV01(
          "direct_host_query_forbidden",
          400,
        );
      }
      const body = await readBoundedVNextLocalOperatorBodyV01(request);
      if (Object.keys(body).length !== 0) {
        throw new DirectNativeHostRoundTripErrorV01(
          "direct_host_body_must_be_empty",
          400,
        );
      }
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential =
        readVNextLocalOperatorCredentialFromRequestV01(request);
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
          now: () =>
            readVNextLocalRuntimeClockNowV01(
              options.clock,
              "operator_host_round_trip_observed_at",
            ),
        },
      );
      return jsonResponse(
        {
          ok: true,
          route_version: ROUTE_VERSION,
          status: result.status,
          mode: result.mode,
          receipt: result.receipt,
          host_outcome:
            result.host_result?.outcome ?? result.receipt.result_summary.outcome,
          packet_copy_actions: result.packet_copy_actions,
          handoff_paste_actions: result.handoff_paste_actions,
          result_paste_actions: result.result_paste_actions,
          internal_id_entry_actions: result.internal_id_entry_actions,
          proposal_created: false,
          decision_created: false,
          transition_created: false,
          evidence_accepted: false,
          work_closed: false,
          semantic_state_changed: false,
          authentication_boundary:
            "local_secret_possession_only_not_external_identity",
          semantic_authority_granted: false,
        },
        result.status === "inserted" ? 201 : 200,
        result.session_admission
          ? serializeVNextLocalOperatorSessionCookieV01({
              value: result.session_admission.cookie_value,
              expires_at: result.session_admission.cookie_expires_at,
              max_age_seconds:
                result.session_admission.cookie_max_age_seconds,
              secure: url.protocol === "https:",
            })
          : null,
      );
    } catch (error) {
      return errorResponse(error);
    } finally {
      db?.close();
    }
  };
}

const handler = createVNextOperatorHostRoundTripHandlerV01();
export const POST = handler;

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
    error instanceof VNextOperatorPilotContinuityErrorV01
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
