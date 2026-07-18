import type Database from "better-sqlite3";
import { NextResponse } from "next/server";

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
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import {
  VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_V01,
  VNextOperatorPilotTransitionErrorV01,
  applyVNextOperatorPilotReviewedSemanticTransitionV01,
  confirmVNextOperatorPilotSemanticCommitV01,
  prepareVNextOperatorPilotSemanticCommitPreviewV01,
  readVNextOperatorPilotPreviewBindingCookieFromRequestV01,
  serializeVNextOperatorPilotPreviewBindingCookieClearV01,
  serializeVNextOperatorPilotPreviewBindingCookieV01,
} from "@/lib/vnext/runtime/operator-pilot-semantic-transition";
import {
  VNextOperatorPilotReviewWindowConfigErrorV01,
  readVNextOperatorPilotReviewWindowConfigV01,
} from "@/lib/vnext/runtime/operator-pilot-review-window-config-v0-1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "vnext_operator_semantic_transition_route.v0.1" as const;
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

export function createVNextOperatorSemanticTransitionHandlersV01(
  options: HandlerOptionsV01 = {},
) {
  const openDatabase = options.open_database ?? openVNextLocalOperatorDatabaseV01;

  async function getPreview(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertPilotEnabled(environment);
      const requestUrl = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: false,
      });
      const binding = parsePreviewQuery(requestUrl);
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const reviewWindowConfig =
        readVNextOperatorPilotReviewWindowConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      db = openDatabase(config);
      const result = prepareVNextOperatorPilotSemanticCommitPreviewV01(db, {
        config,
        credential,
        request: binding,
        review_window_config: reviewWindowConfig,
        clock: options.clock,
      });
      const expiresAt = result.pilot_policy.preview_binding_expires_at;
      return jsonResponse(
        {
          ok: true,
          route_version: ROUTE_VERSION,
          status: "preview",
          preview: result.preview,
          pilot_policy: result.pilot_policy,
          preview_is_write: false,
          authentication_boundary:
            "local_secret_possession_only_not_external_identity",
          semantic_authority_granted: false,
        },
        200,
        [
          serializeVNextOperatorPilotPreviewBindingCookieV01({
            value: result.preview_binding_cookie,
            expires_at: expiresAt,
            max_age_ms: result.pilot_policy.preview_max_age_ms,
            secure: requestUrl.protocol === "https:",
          }),
        ],
      );
    } catch (error) {
      return routeErrorResponse(error);
    } finally {
      db?.close();
    }
  }

  async function postTransition(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertPilotEnabled(environment);
      const requestUrl = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: true,
      });
      if ([...requestUrl.searchParams.keys()].length > 0) {
        throw new VNextOperatorPilotTransitionErrorV01(
          "operator_pilot_transition_query_forbidden",
          400,
        );
      }
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const reviewWindowConfig =
        readVNextOperatorPilotReviewWindowConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      const parsed = parseActionBody(
        await readBoundedVNextLocalOperatorBodyV01(request),
      );
      db = openDatabase(config);
      if (parsed.action === "confirm") {
        const result = confirmVNextOperatorPilotSemanticCommitV01(db, {
          config,
          credential,
          preview_binding_cookie:
            readVNextOperatorPilotPreviewBindingCookieFromRequestV01(request),
          request: parsed.payload,
          review_window_config: reviewWindowConfig,
          clock: options.clock,
          secret_source: options.secret_source,
        });
        return jsonResponse(
          {
            ok: true,
            route_version: ROUTE_VERSION,
            status: result.status,
            gate_record: result.gate_record,
            eligibility_status: result.eligibility_status,
            eligibility: result.eligibility,
            state_applied: false,
            authentication_boundary:
              "local_secret_possession_only_not_external_identity",
            semantic_authority_granted: false,
          },
          result.status === "inserted" ? 201 : 200,
          mutationCookies(result.session_admission, requestUrl, true),
        );
      }
      const result = applyVNextOperatorPilotReviewedSemanticTransitionV01(
        db,
        {
          config,
          credential,
          request: parsed.payload,
          review_window_config: reviewWindowConfig,
          clock: options.clock,
          secret_source: options.secret_source,
        },
      );
      return jsonResponse(
        {
          ok: true,
          route_version: ROUTE_VERSION,
          status: result.status,
          packet_status: result.packet_status,
          gate_record: result.gate_record,
          transition_receipt: result.transition_receipt,
          later_packet: result.later_packet,
          eligibility_status: result.eligibility_status,
          eligibility: result.eligibility,
          packet_compiled: true,
          authentication_boundary:
            "local_secret_possession_only_not_external_identity",
          semantic_authority_granted: false,
        },
        result.status === "applied" ? 201 : 200,
        mutationCookies(result.session_admission, requestUrl, false),
      );
    } catch (error) {
      return routeErrorResponse(error);
    } finally {
      db?.close();
    }
  }

  return { GET: getPreview, POST: postTransition };
}

const handlers = createVNextOperatorSemanticTransitionHandlersV01();
export const GET = handlers.GET;
export const POST = handlers.POST;

function parsePreviewQuery(url: URL): Record<string, string> {
  const expected = [
    "proposal_id",
    "proposal_fingerprint",
    "decision_id",
    "decision_fingerprint",
  ] as const;
  const keys = [...url.searchParams.keys()];
  if (
    keys.length !== expected.length ||
    keys.some((key) => !expected.includes(key as (typeof expected)[number])) ||
    expected.some((key) => url.searchParams.getAll(key).length !== 1)
  ) {
    throw new VNextOperatorPilotTransitionErrorV01(
      "operator_pilot_preview_query_invalid",
      400,
    );
  }
  return Object.fromEntries(expected.map((key) => [key, url.searchParams.get(key)!]));
}

function parseActionBody(value: unknown): {
  action: "confirm" | "apply";
  payload: Record<string, unknown>;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new VNextOperatorPilotTransitionErrorV01(
      "operator_pilot_transition_body_invalid",
      400,
    );
  }
  const record = value as Record<string, unknown>;
  if (!(["confirm", "apply"] as const).includes(record.action as never)) {
    throw new VNextOperatorPilotTransitionErrorV01(
      "operator_pilot_transition_action_invalid",
      400,
    );
  }
  const { action, ...payload } = record;
  return {
    action: action as "confirm" | "apply",
    payload,
  };
}

function mutationCookies(
  admission: {
    cookie_value: string;
    cookie_expires_at: string;
    cookie_max_age_seconds: number;
  },
  url: URL,
  clearPreview: boolean,
): string[] {
  const cookies = [
    serializeVNextLocalOperatorSessionCookieV01({
      value: admission.cookie_value,
      expires_at: admission.cookie_expires_at,
      max_age_seconds: admission.cookie_max_age_seconds,
      secure: url.protocol === "https:",
    }),
  ];
  if (clearPreview) {
    cookies.push(
      serializeVNextOperatorPilotPreviewBindingCookieClearV01(
        url.protocol === "https:",
      ),
    );
  }
  return cookies;
}

function assertPilotEnabled(environment: NodeJS.ProcessEnv): void {
  if (environment.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED !== "1") {
    throw new VNextLocalOperatorSessionErrorV01("operator_pilot_disabled", 404);
  }
}

function routeErrorResponse(error: unknown): NextResponse {
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
  if (error instanceof VNextOperatorPilotTransitionErrorV01) {
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
  if (error instanceof VNextOperatorPilotReviewWindowConfigErrorV01) {
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
      error_code: "operator_pilot_transition_conflict",
      semantic_authority_granted: false,
    },
    409,
  );
}

function jsonResponse(
  body: unknown,
  status = 200,
  cookies: string[] = [],
): NextResponse {
  const headers = new Headers(SECURITY_HEADERS);
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return NextResponse.json(body, { status, headers });
}
