import { NextResponse } from "next/server";

import { openDatabase } from "@/lib/db";
import {
  ProjectControlStoreErrorV01,
  mutateProjectControlV01,
} from "@/lib/vnext/persistence/project-control-store";
import { readDefaultWorkspaceIdentityV01 } from "@/lib/vnext/persistence/project-identity-registry";
import {
  VNextLocalOperatorSessionErrorV01,
  assertVNextLocalOperatorRequestBoundaryV01,
  readBoundedVNextLocalOperatorBodyV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { ProjectControlActionV01 } from "@/types/vnext/project-controls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};
const ACTIONS = new Set<ProjectControlActionV01>([
  "enable_automation",
  "disable_automation",
  "pause_automation",
  "resume_automation",
  "include_personal_perspective",
  "exclude_personal_perspective",
]);
const BODY_KEYS = new Set([
  "action",
  "project_id",
  "expected_active_project_id",
  "expected_active_selection_revision",
  "expected_control_revision",
]);

export async function GET() {
  return json({ ok: false, error_code: "method_not_allowed" }, 405);
}

export async function POST(request: Request) {
  let db: ReturnType<typeof openDatabase> | null = null;
  try {
    const requestUrl = assertVNextLocalOperatorRequestBoundaryV01(request, {
      mutating: true,
    });
    if ([...requestUrl.searchParams.keys()].length > 0) {
      return json({ ok: false, error_code: "project_control_request_invalid" }, 400);
    }
    const body = parseBody(
      await readBoundedVNextLocalOperatorBodyV01(request),
    );
    db = openDatabase();
    const workspace = readDefaultWorkspaceIdentityV01(db);
    if (!workspace) {
      return json({ ok: false, error_code: "project_control_project_not_found" }, 404);
    }
    const result = mutateProjectControlV01(db, {
      workspace_id: workspace.workspace_id,
      ...body,
    });
    return json({ ok: true, result });
  } catch (error) {
    return routeError(error);
  } finally {
    db?.close();
  }
}

function parseBody(body: Record<string, unknown>): {
  action: ProjectControlActionV01;
  project_id: string;
  expected_active_project_id: string;
  expected_active_selection_revision: number;
  expected_control_revision: number | null;
} {
  if (
    Object.keys(body).length !== BODY_KEYS.size ||
    Object.keys(body).some((key) => !BODY_KEYS.has(key)) ||
    typeof body.action !== "string" ||
    !ACTIONS.has(body.action as ProjectControlActionV01) ||
    !validId(body.project_id) ||
    !validId(body.expected_active_project_id) ||
    !validRevision(body.expected_active_selection_revision) ||
    !(
      body.expected_control_revision === null ||
      validRevision(body.expected_control_revision)
    )
  ) {
    throw new ProjectControlStoreErrorV01("project_control_request_invalid");
  }
  return {
    action: body.action as ProjectControlActionV01,
    project_id: body.project_id,
    expected_active_project_id: body.expected_active_project_id,
    expected_active_selection_revision:
      body.expected_active_selection_revision,
    expected_control_revision: body.expected_control_revision,
  };
}

function validId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    value.length > 0 &&
    value.length <= 256 &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function validRevision(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function routeError(error: unknown) {
  if (error instanceof VNextLocalOperatorSessionErrorV01) {
    return json({ ok: false, error_code: error.code }, error.status);
  }
  if (error instanceof ProjectControlStoreErrorV01) {
    const status =
      error.code === "project_control_request_invalid"
        ? 400
        : error.code === "project_control_project_not_found"
          ? 404
          : [
                "active_project_conflict",
                "automation_revision_conflict",
                "personal_perspective_revision_conflict",
                "automation_transition_invalid",
                "personal_perspective_transition_invalid",
                "project_control_scope_conflict",
              ].includes(error.code)
            ? 409
            : 500;
    return json(
      {
        ok: false,
        error_code:
          status === 500 ? "project_control_unavailable" : error.code,
      },
      status,
    );
  }
  return json({ ok: false, error_code: "project_control_unavailable" }, 500);
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: HEADERS });
}
