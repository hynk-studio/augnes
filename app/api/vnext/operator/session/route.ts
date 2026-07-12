import type Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  VNextLocalOperatorSessionErrorV01,
  assertVNextLocalOperatorRequestBoundaryV01,
  authenticateVNextLocalOperatorSessionV01,
  consumeVNextLocalOperatorBootstrapV01,
  openVNextLocalOperatorDatabaseV01,
  readBoundedVNextLocalOperatorBodyV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  readVNextLocalOperatorPilotConfigV01,
  revokeVNextLocalOperatorSessionByCredentialV01,
  serializeVNextLocalOperatorSessionCookieClearV01,
  serializeVNextLocalOperatorSessionCookieV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "vnext_local_operator_session_route.v0.1" as const;
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

export function createVNextLocalOperatorSessionHandlersV01(
  options: HandlerOptionsV01 = {},
) {
  const openDatabase =
    options.open_database ?? openVNextLocalOperatorDatabaseV01;

  async function getSession(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertPilotEnabled(environment);
      const requestUrl = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: false,
      });
      assertNoCredentialQuery(requestUrl);
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      db = openDatabase(config);
      const authentication = authenticateVNextLocalOperatorSessionV01(db, {
        config,
        credential,
        clock: options.clock,
      });
      return jsonResponse({
        ok: true,
        route_version: ROUTE_VERSION,
        status: "authenticated",
        session: authentication.session,
        authentication_boundary:
          "local_secret_possession_only_not_external_identity",
        semantic_authority_granted: false,
      });
    } catch (error) {
      return routeErrorResponse(error);
    } finally {
      db?.close();
    }
  }

  async function postSession(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertPilotEnabled(environment);
      const requestUrl = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: true,
      });
      assertNoCredentialQuery(requestUrl);
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const body = await readBoundedVNextLocalOperatorBodyV01(request);
      const action = body.action;
      if (action === "bootstrap") {
        assertExactBodyKeys(body, ["action", "bootstrap_token"]);
        if (typeof body.bootstrap_token !== "string") {
          throw new VNextLocalOperatorSessionErrorV01(
            "operator_bootstrap_invalid",
            401,
          );
        }
        db = openDatabase(config);
        const admission = consumeVNextLocalOperatorBootstrapV01(db, {
          config,
          bootstrap_token: body.bootstrap_token,
          clock: options.clock,
          secret_source: options.secret_source,
        });
        return jsonResponse(
          {
            ok: true,
            route_version: ROUTE_VERSION,
            status: "authenticated",
            session: admission.session,
            authentication_boundary:
              "local_secret_possession_only_not_external_identity",
            semantic_authority_granted: false,
          },
          200,
          serializeVNextLocalOperatorSessionCookieV01({
            value: admission.cookie_value,
            expires_at: admission.cookie_expires_at,
            max_age_seconds: admission.cookie_max_age_seconds,
            secure: requestUrl.protocol === "https:",
          }),
        );
      }
      if (action === "logout") {
        assertExactBodyKeys(body, ["action"]);
        const credential =
          readVNextLocalOperatorCredentialFromRequestV01(request);
        db = openDatabase(config);
        const session = revokeVNextLocalOperatorSessionByCredentialV01(db, {
          config,
          credential,
          clock: options.clock,
        });
        return jsonResponse(
          {
            ok: true,
            route_version: ROUTE_VERSION,
            status: "revoked",
            session,
            semantic_authority_granted: false,
          },
          200,
          serializeVNextLocalOperatorSessionCookieClearV01({
            secure: requestUrl.protocol === "https:",
          }),
        );
      }
      throw new VNextLocalOperatorSessionErrorV01(
        "operator_pilot_body_invalid",
        400,
      );
    } catch (error) {
      return routeErrorResponse(error);
    } finally {
      db?.close();
    }
  }

  return { GET: getSession, POST: postSession };
}

const handlers = createVNextLocalOperatorSessionHandlersV01();

export const GET = handlers.GET;
export const POST = handlers.POST;

function assertPilotEnabled(environment: NodeJS.ProcessEnv): void {
  if (environment.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED !== "1") {
    throw new VNextLocalOperatorSessionErrorV01(
      "operator_pilot_disabled",
      404,
    );
  }
}

function assertNoCredentialQuery(url: URL): void {
  if ([...url.searchParams.keys()].length > 0) {
    throw new VNextLocalOperatorSessionErrorV01(
      "operator_pilot_request_invalid",
      400,
    );
  }
}

function assertExactBodyKeys(
  body: Record<string, unknown>,
  allowedKeys: readonly string[],
): void {
  const keys = Object.keys(body).sort();
  const allowed = [...allowedKeys].sort();
  if (
    keys.length !== allowed.length ||
    keys.some((key, index) => key !== allowed[index])
  ) {
    throw new VNextLocalOperatorSessionErrorV01(
      "operator_pilot_body_invalid",
      400,
    );
  }
}

function routeErrorResponse(error: unknown): NextResponse {
  if (error instanceof VNextLocalOperatorSessionErrorV01) {
    if (error.code === "operator_pilot_disabled") {
      return jsonResponse(
        {
          ok: false,
          route_version: ROUTE_VERSION,
          status: "not_found",
          error_code: "not_found",
          semantic_authority_granted: false,
        },
        404,
      );
    }
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
      error_code: "operator_session_invalid",
      semantic_authority_granted: false,
    },
    500,
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
