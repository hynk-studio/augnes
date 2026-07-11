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
  VNextOperatorPilotLaterResultErrorV01,
  readLatestVNextOperatorPilotLaterResultForPacketV01,
  readVNextOperatorPilotLaterResultV01,
  recordVNextOperatorPilotLaterResultV01,
} from "@/lib/vnext/runtime/operator-pilot-later-result-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "vnext_operator_later_result_route.v0.1" as const;
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

export function createVNextOperatorLaterResultHandlersV01(
  options: HandlerOptionsV01 = {},
) {
  const openDatabase = options.open_database ?? openVNextLocalOperatorDatabaseV01;

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
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      db = openDatabase(config);
      authenticateVNextLocalOperatorSessionV01(db, {
        config,
        credential,
        clock: options.clock,
      });
      const result = query.mode === "receipt"
        ? readVNextOperatorPilotLaterResultV01(db, {
            config,
            receipt_id: query.receipt_id,
            receipt_fingerprint: query.receipt_fingerprint,
          })
        : readLatestVNextOperatorPilotLaterResultForPacketV01(db, {
            config,
            packet_id: query.packet_id,
            packet_fingerprint: query.packet_fingerprint,
          });
      return jsonResponse({
        ok: true,
        route_version: ROUTE_VERSION,
        status: "later_result",
        ...result,
        authentication_boundary:
          "local_secret_possession_only_not_external_identity",
        semantic_authority_granted: false,
      });
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
        throw new VNextOperatorPilotLaterResultErrorV01(
          "operator_pilot_later_result_query_forbidden",
          400,
        );
      }
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      const body = await readBoundedVNextLocalOperatorBodyV01(request);
      db = openDatabase(config);
      const result = recordVNextOperatorPilotLaterResultV01(db, {
        config,
        credential,
        request: body,
        clock: options.clock,
        secret_source: options.secret_source,
      });
      return jsonResponse(
        {
          ok: true,
          route_version: ROUTE_VERSION,
          status: result.status,
          intake_version: result.intake_version,
          workspace_id: result.workspace_id,
          project_id: result.project_id,
          receipt: result.receipt,
          source_transition_receipt: result.source_transition_receipt,
          packet_consumption: result.packet_consumption,
          relation: result.relation,
          proposal_created: false,
          decision_created: false,
          transition_created: false,
          evidence_accepted: false,
          work_closed: false,
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
  }

  return { GET, POST };
}

const handlers = createVNextOperatorLaterResultHandlersV01();
export const GET = handlers.GET;
export const POST = handlers.POST;

type ReadQueryV01 =
  | { mode: "receipt"; receipt_id: string; receipt_fingerprint: string }
  | { mode: "packet"; packet_id: string; packet_fingerprint: string };

function parseReadQuery(url: URL): ReadQueryV01 {
  const keys = [...url.searchParams.keys()];
  const receiptMode = keys.every((key) =>
    ["receipt_id", "receipt_fingerprint"].includes(key),
  );
  const packetMode = keys.every((key) =>
    ["packet_id", "packet_fingerprint"].includes(key),
  );
  if (
    keys.length !== 2 ||
    (!receiptMode && !packetMode) ||
    keys.some((key) => url.searchParams.getAll(key).length !== 1)
  ) {
    throw new VNextOperatorPilotLaterResultErrorV01(
      "operator_pilot_later_result_query_invalid",
      400,
    );
  }
  if (receiptMode) {
    return {
      mode: "receipt",
      receipt_id: url.searchParams.get("receipt_id")!,
      receipt_fingerprint: url.searchParams.get("receipt_fingerprint")!,
    };
  }
  return {
    mode: "packet",
    packet_id: url.searchParams.get("packet_id")!,
    packet_fingerprint: url.searchParams.get("packet_fingerprint")!,
  };
}

function assertEnabled(environment: NodeJS.ProcessEnv): void {
  if (environment.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED !== "1") {
    throw new VNextLocalOperatorSessionErrorV01("operator_pilot_disabled", 404);
  }
}

function errorResponse(error: unknown): NextResponse {
  const known =
    error instanceof VNextLocalOperatorSessionErrorV01 ||
    error instanceof VNextOperatorPilotLaterResultErrorV01;
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
          : "operator_pilot_later_result_request_failed",
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
