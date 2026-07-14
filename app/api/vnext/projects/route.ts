import { NextResponse } from "next/server";

import { openDatabase } from "@/lib/db";
import {
  ProjectOnboardingErrorV01,
  confirmLocalProjectOnboardingV01,
  listRecentProjectsV01,
  openRecentProjectV01,
  pickAndInspectLocalProjectV01,
  readProjectDestinationV01,
  rebindLocalProjectRootFromSelectionV01,
  removeProjectFromRecentV01,
} from "@/lib/vnext/onboarding/local-project-onboarding";
import { ProjectLifecycleErrorV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import { ProjectIdentityRegistryErrorV01 } from "@/lib/vnext/persistence/project-identity-registry";
import {
  VNextLocalOperatorSessionErrorV01,
  assertVNextLocalOperatorRequestBoundaryV01,
} from "@/lib/vnext/runtime/local-operator-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY" };
const MAX_BODY_BYTES = 16 * 1024;

export async function GET(request: Request) {
  let db = null;
  try {
    const url = assertVNextLocalOperatorRequestBoundaryV01(request, { mutating: false });
    db = openDatabase();
    const projectId = url.searchParams.get("project_id");
    if (projectId) {
      const project = await readProjectDestinationV01(db, projectId);
      return project ? json({ ok: true, project }) : json({ ok: false, error_code: "not_found" }, 404);
    }
    return json({ ok: true, recent_projects: await listRecentProjectsV01(db) });
  } catch (error) { return routeError(error); }
  finally { db?.close(); }
}

export async function POST(request: Request) {
  let db = null;
  try {
    assertVNextLocalOperatorRequestBoundaryV01(request, { mutating: true });
    const body = await readBoundedBody(request);
    if (body.action === "choose_folder") {
      return json({ ok: true, picker: await pickAndInspectLocalProjectV01() });
    }
    db = openDatabase();
    if (body.action === "confirm") {
      return json({ ok: true, result: await confirmLocalProjectOnboardingV01(db, {
        selection_token: requiredString(body.selection_token),
        inspection_fingerprint: requiredString(body.inspection_fingerprint),
      }) });
    }
    if (body.action === "open") {
      return json({ ok: true, result: await openRecentProjectV01(db, {
        project_id: requiredString(body.project_id),
        ...(Object.hasOwn(body, "expected_project_id") ? { expected_project_id: optionalNullableString(body.expected_project_id) } : {}),
        ...(Object.hasOwn(body, "expected_revision") ? { expected_revision: optionalNullableNumber(body.expected_revision) } : {}),
      }) });
    }
    if (body.action === "remove") {
      return json({ ok: true, result: removeProjectFromRecentV01(db, requiredString(body.project_id)) });
    }
    if (body.action === "confirm_rebind") {
      return json({ ok: true, result: await rebindLocalProjectRootFromSelectionV01(db, {
        project_id: requiredString(body.project_id),
        selection_token: requiredString(body.selection_token),
        inspection_fingerprint: requiredString(body.inspection_fingerprint),
      }) });
    }
    throw new ProjectOnboardingErrorV01("selection_invalid", 400);
  } catch (error) { return routeError(error); }
  finally { db?.close(); }
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || !value) throw new ProjectOnboardingErrorV01("selection_invalid");
  return value;
}
async function readBoundedBody(request: Request): Promise<Record<string, unknown>> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new ProjectOnboardingErrorV01("selection_invalid", 413);
  }
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_BODY_BYTES) {
    throw new ProjectOnboardingErrorV01("selection_invalid", 413);
  }
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("invalid");
    }
    return value as Record<string, unknown>;
  } catch {
    throw new ProjectOnboardingErrorV01("selection_invalid", 400);
  }
}
function optionalNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value === "string") return value;
  throw new ProjectOnboardingErrorV01("selection_invalid");
}
function optionalNullableNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || (typeof value === "number" && Number.isInteger(value))) return value;
  throw new ProjectOnboardingErrorV01("selection_invalid");
}
function routeError(error: unknown) {
  if (error instanceof ProjectOnboardingErrorV01) return json({ ok: false, error_code: error.code }, error.status);
  if (error instanceof ProjectLifecycleErrorV01) return json({ ok: false, error_code: error.code }, error.code === "active_selection_conflict" ? 409 : 404);
  if (error instanceof ProjectIdentityRegistryErrorV01) return json({ ok: false, error_code: error.code }, error.code.includes("conflict") ? 409 : 400);
  if (error instanceof VNextLocalOperatorSessionErrorV01) return json({ ok: false, error_code: error.code }, error.status);
  return json({ ok: false, error_code: "onboarding_unavailable" }, 500);
}
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: HEADERS }); }
