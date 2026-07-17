import type Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  readDefaultWorkspaceIdentityV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import {
  readActiveProjectSelectionV01,
} from "@/lib/vnext/persistence/project-lifecycle-registry";
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
  ProjectRunResultReadErrorV01,
  readProjectRunResultDetailV01,
} from "@/lib/vnext/runtime/project-run-result-read-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "vnext_operator_run_results_route.v0.1" as const;
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
  open_database?: (
    config: VNextLocalOperatorPilotConfigV01,
  ) => Database.Database;
}

export function createVNextOperatorRunResultReadHandlerV01(
  options: HandlerOptionsV01 = {},
) {
  const openDatabase =
    options.open_database ?? openVNextLocalOperatorDatabaseV01;
  return async function GET(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: false,
      });
      const receiptId = receiptIdFromQueryV01(url);
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential =
        readVNextLocalOperatorCredentialFromRequestV01(request);
      db = openDatabase(config);
      authenticateVNextLocalOperatorSessionV01(db, {
        config,
        credential,
        clock: options.clock,
      });
      const workspace = readDefaultWorkspaceIdentityV01(db);
      const active = workspace
        ? readActiveProjectSelectionV01(db, workspace.workspace_id)
        : null;
      if (
        !workspace ||
        !active ||
        workspace.workspace_id !== config.workspace_id ||
        active.project_id !== config.project_id
      ) {
        throw new OperatorRunResultRouteErrorV01(
          "run_result_active_project_conflict",
          409,
        );
      }
      const result = readProjectRunResultDetailV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: active.project_id,
        receipt_id: receiptId,
      });
      return jsonV01(
        {
          ok: true,
          route_version: ROUTE_VERSION,
          status: "result_detail",
          result,
          proposal_created: false,
          review_decision_created: false,
          semantic_transition_created: false,
          evidence_accepted: false,
          work_closed: false,
        },
        200,
      );
    } catch (error) {
      return errorResponseV01(error);
    } finally {
      db?.close();
    }
  };
}

export const GET = createVNextOperatorRunResultReadHandlerV01();

class OperatorRunResultRouteErrorV01 extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
    this.name = "OperatorRunResultRouteErrorV01";
  }
}

function receiptIdFromQueryV01(url: URL): string {
  if (
    url.search.length > 128 ||
    [...url.searchParams.keys()].some((key) => key !== "receipt_ref") ||
    url.searchParams.getAll("receipt_ref").length !== 1
  ) {
    throw new OperatorRunResultRouteErrorV01(
      "run_result_query_invalid",
      400,
    );
  }
  const value = url.searchParams.get("receipt_ref") ?? "";
  if (!/^run-receipt:[a-f0-9]{24}$/u.test(value)) {
    throw new OperatorRunResultRouteErrorV01(
      "run_result_ref_invalid",
      400,
    );
  }
  return value;
}

function errorResponseV01(error: unknown): NextResponse {
  if (error instanceof VNextLocalOperatorSessionErrorV01) {
    return jsonV01({ ok: false, error_code: error.code }, error.status);
  }
  if (error instanceof OperatorRunResultRouteErrorV01) {
    return jsonV01({ ok: false, error_code: error.code }, error.status);
  }
  if (error instanceof ProjectRunResultReadErrorV01) {
    return jsonV01({ ok: false, error_code: "run_result_unavailable" }, 404);
  }
  return jsonV01({ ok: false, error_code: "run_result_read_failed" }, 500);
}

function jsonV01(
  body: Record<string, unknown>,
  status: number,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: SECURITY_HEADERS,
  });
}
