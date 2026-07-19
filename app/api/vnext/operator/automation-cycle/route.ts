import { NextResponse } from "next/server";

import {
  BoundedAutomationCycleErrorV01,
  createBoundedAutomationCycleServiceV01,
} from "@/lib/vnext/runtime/bounded-automation-cycle";
import {
  VNextLocalOperatorSessionErrorV01,
  assertVNextLocalOperatorRequestBoundaryV01,
  authenticateVNextLocalOperatorSessionV01,
  openVNextLocalOperatorDatabaseV01,
  readBoundedVNextLocalOperatorBodyV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  readVNextLocalOperatorPilotConfigV01,
  serializeVNextLocalOperatorSessionCookieV01,
  type VNextLocalOperatorSessionMutationAdmissionV01,
  type VNextLocalOperatorSecretSourceV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import type { BoundedAutomationCycleServiceV01 } from "@/lib/vnext/runtime/bounded-automation-cycle";
import { LiveNativeHostRunServiceV01 } from "@/lib/vnext/runtime/live-native-host-run-service";
import { createDeterministicCodexAdapterV01 } from "@/lib/vnext/native-host/deterministic-codex-adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "vnext_operator_bounded_automation_cycle_route.v0.1" as const;
let canonicalTestServiceV01: BoundedAutomationCycleServiceV01 | null = null;
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
  service?: BoundedAutomationCycleServiceV01;
}

export function createVNextOperatorAutomationCycleHandlerV01(
  options: HandlerOptionsV01 = {},
) {
  return async function POST(request: Request): Promise<NextResponse> {
    try {
      const environment = options.environment ?? process.env;
      assertEnabledV01(environment);
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: true,
      });
      assertNoQueryV01(url);
      const body = await readBoundedVNextLocalOperatorBodyV01(request);
      const action = stringFieldV01(body.action);
      const expectedKeys =
        action === "run_one_bounded_cycle"
          ? ["action", "expected_control_revision"]
          : ["action"];
      assertExactKeysV01(body, expectedKeys);
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      const authDb = openVNextLocalOperatorDatabaseV01(config);
      try {
        authenticateVNextLocalOperatorSessionV01(authDb, {
          config,
          credential,
          clock: options.clock,
        });
      } finally {
        authDb.close();
      }
      const service = options.service ?? serviceForEnvironmentV01(environment);
      const common = {
        config,
        credential,
        clock: options.clock,
        secret_source: options.secret_source,
      };
      const result =
        action === "run_one_bounded_cycle"
          ? await service.runOne({
              ...common,
              expected_control_revision: revisionV01(
                body.expected_control_revision,
              ),
            })
          : action === "cancel_bounded_cycle"
            ? await service.cancel(common)
            : action === "retry_bounded_cycle"
              ? await service.retry(common)
              : (() => {
                  throw new BoundedAutomationCycleErrorV01(
                    "bounded_automation_action_unsupported",
                    400,
                  );
                })();
      return jsonResponse(
        {
          ok: true,
          route_version: ROUTE_VERSION,
          status: result.status,
          automation_cycle: result.projection,
          decision_created: false,
          transition_created: false,
          semantic_state_changed: false,
          model_invocation_created: false,
        },
        result.status === "accepted" ? 202 : 200,
        cookieFromAdmissionV01(result.session_admission, url),
      );
    } catch (error) {
      return errorResponseV01(error);
    }
  };
}

export function createVNextOperatorAutomationCycleReadHandlerV01(
  options: HandlerOptionsV01 = {},
) {
  return async function GET(request: Request): Promise<NextResponse> {
    let db: ReturnType<typeof openVNextLocalOperatorDatabaseV01> | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertEnabledV01(environment);
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: false,
      });
      assertNoQueryV01(url);
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      db = openVNextLocalOperatorDatabaseV01(config);
      authenticateVNextLocalOperatorSessionV01(db, {
        config,
        credential,
        clock: options.clock,
      });
      const service = options.service ?? serviceForEnvironmentV01(environment);
      return jsonResponse({
        ok: true,
        route_version: ROUTE_VERSION,
        status: "projection",
        automation_cycle: service.read(config),
        read_only: true,
      });
    } catch (error) {
      return errorResponseV01(error);
    } finally {
      db?.close();
    }
  };
}

export const POST = createVNextOperatorAutomationCycleHandlerV01();
export const GET = createVNextOperatorAutomationCycleReadHandlerV01();

function serviceForEnvironmentV01(
  environment: NodeJS.ProcessEnv,
): BoundedAutomationCycleServiceV01 {
  if (
    environment.AUGNES_CANONICAL_TEST_MODE === "1" &&
    environment.AUGNES_VNEXT_BOUNDED_CYCLE_DETERMINISTIC_ADAPTER === "1"
  ) {
    canonicalTestServiceV01 ??= createBoundedAutomationCycleServiceV01({
      live_service: new LiveNativeHostRunServiceV01({
        adapter_factory: () => createDeterministicCodexAdapterV01(),
      }),
    });
    return canonicalTestServiceV01;
  }
  return createBoundedAutomationCycleServiceV01();
}

function assertEnabledV01(environment: NodeJS.ProcessEnv): void {
  if (environment.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED !== "1") {
    throw new VNextLocalOperatorSessionErrorV01("operator_pilot_disabled", 404);
  }
}

function assertNoQueryV01(url: URL): void {
  if ([...url.searchParams.keys()].length > 0) {
    throw new BoundedAutomationCycleErrorV01(
      "bounded_automation_query_forbidden",
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
    throw new BoundedAutomationCycleErrorV01(
      "bounded_automation_action_body_invalid",
      400,
    );
  }
}

function stringFieldV01(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) {
    throw new BoundedAutomationCycleErrorV01(
      "bounded_automation_action_invalid",
      400,
    );
  }
  return value;
}

function revisionV01(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) {
    throw new BoundedAutomationCycleErrorV01(
      "bounded_automation_control_revision_invalid",
      400,
    );
  }
  return Number(value);
}

function jsonResponse(
  value: unknown,
  status = 200,
  cookie: string | null = null,
): NextResponse {
  const headers = new Headers(SECURITY_HEADERS);
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (cookie) headers.append("Set-Cookie", cookie);
  return new NextResponse(JSON.stringify(value), { status, headers });
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

function errorResponseV01(error: unknown): NextResponse {
  const recognized =
    error instanceof BoundedAutomationCycleErrorV01 ||
    error instanceof VNextLocalOperatorSessionErrorV01;
  return jsonResponse(
    {
      ok: false,
      route_version: ROUTE_VERSION,
      error_code: recognized ? error.code : "bounded_automation_route_failed",
      decision_created: false,
      transition_created: false,
      semantic_state_changed: false,
      semantic_authority_granted: false,
      model_invocation_created: false,
    },
    recognized ? error.status : 500,
  );
}
