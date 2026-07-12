import type Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  VNextLocalOperatorSessionErrorV01,
  assertVNextLocalOperatorRequestBoundaryV01,
  authenticateVNextLocalOperatorSessionV01,
  openVNextLocalOperatorDatabaseV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  readVNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorPilotConfigV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import {
  VNextOperatorPilotContinuityErrorV01,
  buildVNextOperatorPilotPacketHandoffV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "vnext_operator_packet_handoff_route.v0.1" as const;
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
  open_database?: (config: VNextLocalOperatorPilotConfigV01) => Database.Database;
}

export function createVNextOperatorPacketHandoffHandlerV01(
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
      const query = parseQuery(url);
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      db = (options.open_database ?? openVNextLocalOperatorDatabaseV01)(config);
      authenticateVNextLocalOperatorSessionV01(db, {
        config,
        credential,
        clock: options.clock,
      });
      const result = buildVNextOperatorPilotPacketHandoffV01(db, {
        config,
        packet_id: query.packet_id,
        packet_fingerprint: query.packet_fingerprint,
        clock: options.clock,
      });
      if (query.format === "json") {
        return attachmentResponse(
          result.bounded_json,
          "application/json; charset=utf-8",
          "augnes-vnext-task-context-packet-handoff.json",
        );
      }
      if (query.format === "text") {
        return attachmentResponse(
          result.bounded_text,
          "text/plain; charset=utf-8",
          "augnes-vnext-task-context-packet-handoff.txt",
        );
      }
      return jsonResponse({
        ok: true,
        route_version: ROUTE_VERSION,
        status: "packet_handoff",
        handoff: result.handoff,
        bounded_text: result.bounded_text,
        packet_currentness: result.handoff.packet.currentness,
        handoff_is_execution: false,
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

export const GET = createVNextOperatorPacketHandoffHandlerV01();

function parseQuery(url: URL): {
  packet_id: string;
  packet_fingerprint: string;
  format: "metadata" | "json" | "text";
} {
  const allowed = ["packet_id", "packet_fingerprint", "format"] as const;
  const keys = [...url.searchParams.keys()];
  if (
    keys.some((key) => !allowed.includes(key as (typeof allowed)[number])) ||
    allowed.some((key) => url.searchParams.getAll(key).length > 1)
  ) {
    throw new VNextOperatorPilotContinuityErrorV01(
      "operator_pilot_handoff_query_invalid",
      400,
    );
  }
  const packetId = url.searchParams.get("packet_id")?.trim();
  const packetFingerprint = url.searchParams.get("packet_fingerprint")?.trim();
  const format = url.searchParams.get("format") ?? "metadata";
  if (
    !packetId ||
    packetId !== url.searchParams.get("packet_id") ||
    packetId.length > 256 ||
    !packetFingerprint ||
    !/^sha256:[a-f0-9]{64}$/.test(packetFingerprint) ||
    !(["metadata", "json", "text"] as const).includes(format as never)
  ) {
    throw new VNextOperatorPilotContinuityErrorV01(
      "operator_pilot_handoff_query_invalid",
      400,
    );
  }
  return {
    packet_id: packetId,
    packet_fingerprint: packetFingerprint,
    format: format as "metadata" | "json" | "text",
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
    error instanceof VNextOperatorPilotContinuityErrorV01;
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
          : "operator_pilot_handoff_read_failed",
      semantic_authority_granted: false,
    },
    disabled ? 404 : known ? error.status : 500,
  );
}

function attachmentResponse(
  body: string,
  contentType: string,
  filename: string,
): NextResponse {
  const headers = new Headers(SECURITY_HEADERS);
  headers.set("Content-Type", contentType);
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  return new NextResponse(body, { status: 200, headers });
}

function jsonResponse(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: new Headers(SECURITY_HEADERS),
  });
}
