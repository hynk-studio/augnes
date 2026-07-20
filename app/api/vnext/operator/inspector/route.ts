import type Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  readCanonicalProjectIdentityV01,
  readDefaultWorkspaceIdentityV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  VNextLocalOperatorSessionErrorV01,
  assertVNextLocalOperatorRequestBoundaryV01,
  authenticateVNextLocalOperatorSessionV01,
  openVNextLocalOperatorDatabaseV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  readVNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorPilotConfigV01,
} from "@/lib/vnext/runtime/local-operator-session";
import {
  readVNextLocalRuntimeClockNowV01,
  type VNextLocalRuntimeClockV01,
} from "@/lib/vnext/runtime/local-runtime-clock";
import {
  SharedProjectInspectorReadErrorV01,
  readSharedProjectInspectorV01,
} from "@/lib/vnext/runtime/shared-project-inspector";
import {
  SharedProjectInspectorTargetErrorV01,
  parseSharedInspectorTargetV01,
} from "@/lib/vnext/shared-project-inspector-href";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "vnext_operator_shared_inspector_route.v0.1" as const;
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

export function createVNextOperatorSharedInspectorReadHandlerV01(
  options: HandlerOptionsV01 = {},
) {
  const openDatabase = options.open_database ?? openVNextLocalOperatorDatabaseV01;
  return async function GET(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: false,
      });
      const target = parseSharedInspectorTargetV01(url);
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      db = openDatabase(config);
      const authentication = authenticateVNextLocalOperatorSessionV01(db, {
        config,
        credential,
        clock: options.clock,
      });
      const workspace = readDefaultWorkspaceIdentityV01(db);
      const active = workspace
        ? readActiveProjectSelectionV01(db, workspace.workspace_id)
        : null;
      const project = readCanonicalProjectIdentityV01(db, {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
      });
      if (
        !workspace ||
        workspace.workspace_id !== config.workspace_id ||
        !project
      ) {
        throw new SharedProjectInspectorReadErrorV01(
          "shared_inspector_active_project_conflict",
          409,
        );
      }
      const observedAt = readVNextLocalRuntimeClockNowV01(
        options.clock,
        "shared_project_inspector_observed_at",
      );
      const inspector = readSharedProjectInspectorV01(db, {
        config,
        authenticated_session_id: authentication.session.session_id,
        observed_at: observedAt,
        target,
      });
      return jsonV01(
        {
          ok: true,
          route_version: ROUTE_VERSION,
          status: "inspector_read",
          inspector,
          project_scope_source: "authenticated_server_configuration",
          project_activity:
            active?.project_id === config.project_id
              ? "active"
              : "inactive_read_only",
          semantic_mutation_available: false,
          model_or_provider_call_performed: false,
          external_action_performed: false,
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

export const GET = createVNextOperatorSharedInspectorReadHandlerV01();

function errorResponseV01(error: unknown): NextResponse {
  if (error instanceof VNextLocalOperatorSessionErrorV01) {
    return jsonV01({ ok: false, error_code: error.code }, error.status);
  }
  if (error instanceof SharedProjectInspectorTargetErrorV01) {
    return jsonV01({ ok: false, error_code: error.code }, 400);
  }
  if (error instanceof SharedProjectInspectorReadErrorV01) {
    return jsonV01({ ok: false, error_code: error.code }, error.status);
  }
  return jsonV01(
    { ok: false, error_code: "shared_inspector_read_failed" },
    500,
  );
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
