import { NextResponse } from "next/server";
import type Database from "better-sqlite3";
import { assertVNextLocalOperatorRequestBoundaryV01, readBoundedVNextLocalOperatorBodyV01, assertVNextLocalReviewEnabledV01, openVNextLocalOperatorDatabaseV01, VNextLocalOperatorSessionErrorV01 } from "@/lib/vnext/runtime/local-operator-session";
import { authenticateDirectionAgent, mutateAgentDirection, readAgentDirection } from "@/lib/vnext/runtime/project-direction";
import { ProjectDirectionError } from "@/lib/vnext/persistence/project-direction-store";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
/** Provider-neutral local capability transport. Human cookies are not accepted.
 * Possession proves this exact delegation, never external agent identity. */
export function createAgentProjectDirectionHandler(options: { environment?: NodeJS.ProcessEnv; clock?: VNextLocalRuntimeClockV01 } = {}) {
  return async (request: Request) => {
    let db: Database.Database | null = null;
    try {
      const env = options.environment ?? process.env;
      assertVNextLocalReviewEnabledV01(env);
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, { mutating: request.method === "POST" });
      if (request.headers.has("cookie")) throw new ProjectDirectionError("project_direction_agent_credential_required", 401);
      const authorization = request.headers.get("authorization") ?? "";
      if (!authorization.startsWith("Bearer ")) throw new ProjectDirectionError("project_direction_agent_credential_required", 401);
      const token = authorization.slice(7);
      const at = options.clock?.now() ?? new Date().toISOString();
      if (!env.AUGNES_DB_PATH) throw new ProjectDirectionError("project_direction_runtime_unavailable", 503);
      db = openVNextLocalOperatorDatabaseV01({ database_path: env.AUGNES_DB_PATH });
      const access = authenticateDirectionAgent(db, token, at);
      if (request.method === "GET") {
        if ([...url.searchParams.keys()].join() !== "project_id") throw new ProjectDirectionError("project_direction_scope_required", 400);
        return NextResponse.json({ ok: true, principal: access.grant.value.principal, sequence: access.sequence,
          policy: access.grant, state: readAgentDirection(db, access, url.searchParams.get("project_id")!, at),
          authentication: "possession_of_bounded_local_direction_capability_not_external_identity" }, { headers });
      }
      if (request.method !== "POST" || url.search) throw new ProjectDirectionError("project_direction_request_invalid", 400);
      const body = await readBoundedVNextLocalOperatorBodyV01(request);
      return NextResponse.json({ ok: true, ...mutateAgentDirection(db, { token, request: body, at }) }, { headers });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof ProjectDirectionError || error instanceof VNextLocalOperatorSessionErrorV01 ? error.code : "project_direction_request_refused" },
        { status: error instanceof ProjectDirectionError || error instanceof VNextLocalOperatorSessionErrorV01 ? error.status : 409, headers });
    } finally { db?.close(); }
  };
}
export const GET = createAgentProjectDirectionHandler();
export const POST = createAgentProjectDirectionHandler();
