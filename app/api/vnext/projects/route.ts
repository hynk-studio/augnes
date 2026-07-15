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
        expected_project_id: requiredNullableString(body, "expected_project_id"),
        expected_revision: requiredNullableRevision(body, "expected_revision"),
      }) });
    }
    if (body.action === "remove") {
      return json({ ok: true, result: removeProjectFromRecentV01(db, {
        project_id: requiredString(body.project_id),
        expected_project_id: requiredNullableString(body, "expected_project_id"),
        expected_revision: requiredNullableRevision(body, "expected_revision"),
      }) });
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
  const declaredLengthValue = request.headers.get("content-length");
  if (declaredLengthValue !== null) {
    if (!/^(0|[1-9]\d*)$/.test(declaredLengthValue)) {
      throw new ProjectOnboardingErrorV01("selection_invalid", 400);
    }
    const declaredLength = Number(declaredLengthValue);
    if (!Number.isSafeInteger(declaredLength)) {
      throw new ProjectOnboardingErrorV01("selection_invalid", 400);
    }
    if (declaredLength > MAX_BODY_BYTES) {
      throw new ProjectOnboardingErrorV01("selection_invalid", 413);
    }
  }
  if (!request.body) throw new ProjectOnboardingErrorV01("selection_invalid", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const remainingWithDetectionByte = MAX_BODY_BYTES + 1 - total;
      if (value.byteLength >= remainingWithDetectionByte) {
        total += remainingWithDetectionByte;
        try { await reader.cancel(); } catch {}
        throw new ProjectOnboardingErrorV01("selection_invalid", 413);
      }
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
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
function requiredNullableString(record: Record<string, unknown>, key: string): string | null {
  if (!Object.hasOwn(record, key)) throw new ProjectOnboardingErrorV01("selection_invalid");
  const value = record[key];
  if (value === null || (typeof value === "string" && value.length > 0)) return value;
  throw new ProjectOnboardingErrorV01("selection_invalid");
}
function requiredNullableRevision(record: Record<string, unknown>, key: string): number | null {
  if (!Object.hasOwn(record, key)) throw new ProjectOnboardingErrorV01("selection_invalid");
  const value = record[key];
  if (value === null || (typeof value === "number" && Number.isSafeInteger(value) && value > 0)) return value;
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
