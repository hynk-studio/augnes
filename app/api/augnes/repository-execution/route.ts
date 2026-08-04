import { timingSafeEqual } from "node:crypto";
import path from "node:path";

import { NextResponse } from "next/server";

import { openDatabase } from "@/lib/db";
import { resolveCodexRepositoryProjectV01 } from "@/lib/vnext/codex-repository-continuity/codex-repository-continuity";
import { normalizeLocalProjectRootRefV01 } from "@/lib/vnext/persistence/project-identity-registry";
import {
  adoptLegacyPhysicalRootBaselineV01,
  prepareRepositoryExecutionV01,
  previewRepositoryExecutionAttachmentRevocationV01,
  previewRepositoryExecutionRootRebindV01,
  projectPhysicalRootMutationResultV01,
  RepositoryExecutionErrorV01,
  rebindRepositoryExecutionRootV01,
  revokeRepositoryExecutionAttachmentV01,
  validateRepositoryExecutionAttachmentV01,
} from "@/lib/vnext/repository-execution/repository-execution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_MARKER = "repository-execution-attachment-v0.1";
const COMPANION_PROXY_HEADER = "x-augnes-companion-proxy";
const MAX_REQUEST_BYTES = 32 * 1024;

export async function POST(request: Request) {
  if (!localRequestV01(request)) return routeError("local_access_refused", 403);
  if (!constantTimeEqualV01(
    request.headers.get(COMPANION_PROXY_HEADER),
    process.env.AUGNES_COMPANION_PROXY_TOKEN,
  )) return routeError("companion_channel_refused", 403);
  if (!liveCompanionIdentityV01()) return routeError("companion_unavailable", 503);
  if ((request.headers.get("content-type") ?? "").split(";", 1)[0] !== "application/json") {
    return routeError("invalid_content_type", 415);
  }
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_REQUEST_BYTES) return routeError("request_too_large", 413);
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return routeError("invalid_json", 400);
  }

  const db = openDatabase();
  try {
    const result = await dispatchV01(db, body);
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "x-augnes-repository-execution": ROUTE_MARKER,
        ...runtimeIdentityHeadersV01(),
      },
    });
  } catch (error) {
    if (error instanceof RepositoryExecutionErrorV01) {
      return routeError(error.code, error.status);
    }
    return routeError("repository_execution_unavailable", 503);
  } finally {
    db.close();
  }
}

async function dispatchV01(db: ReturnType<typeof openDatabase>, body: Record<string, unknown>) {
  if (body.action === "prepare") {
    exactKeys(body, ["action", "repository_root"]);
    const resolution = await resolveProject(db, body.repository_root);
    return prepareRepositoryExecutionV01(db, resolution);
  }
  if (body.action === "adopt_legacy_baseline") {
    exactKeys(body, [
      "action", "repository_root", "expected_admission_fingerprint",
      "expected_observation_fingerprint", "decision_request_fingerprint",
      "decision_grant_fingerprint",
    ]);
    const resolution = await resolveProject(db, body.repository_root);
    const result = await adoptLegacyPhysicalRootBaselineV01(db, {
      ...resolution,
      expected_admission_fingerprint: requiredString(body.expected_admission_fingerprint),
      expected_observation_fingerprint: requiredString(body.expected_observation_fingerprint),
      decision_request_fingerprint: requiredString(body.decision_request_fingerprint),
      decision_grant_fingerprint: requiredString(body.decision_grant_fingerprint),
    });
    return projectPhysicalRootMutationResultV01(
      result,
      "This folder is now the project's trusted execution root.",
    );
  }
  if (body.action === "validate") {
    exactKeys(body, ["action", "attachment_id"]);
    return {
      status: "validated",
      attachment: await validateRepositoryExecutionAttachmentV01(
        db,
        requiredString(body.attachment_id),
      ),
    };
  }
  if (body.action === "revoke") {
    exactKeys(body, [
      "action", "attachment_id", "expected_binding_fingerprint",
      "decision_request_fingerprint", "decision_grant_fingerprint",
    ]);
    return {
      status: "revoked",
      attachment: revokeRepositoryExecutionAttachmentV01(db, {
        attachment_id: requiredString(body.attachment_id),
        expected_binding_fingerprint: requiredString(body.expected_binding_fingerprint),
        decision_request_fingerprint: requiredString(body.decision_request_fingerprint),
        decision_grant_fingerprint: requiredString(body.decision_grant_fingerprint),
      }),
    };
  }
  if (body.action === "preview_revoke") {
    exactKeys(body, ["action", "attachment_id", "expected_binding_fingerprint"]);
    return previewRepositoryExecutionAttachmentRevocationV01(db, {
      attachment_id: requiredString(body.attachment_id),
      expected_binding_fingerprint: requiredString(body.expected_binding_fingerprint),
    });
  }
  if (body.action === "rebind_root") {
    exactKeys(body, [
      "action", "workspace_id", "project_id", "new_repository_root",
      "expected_old_root_binding_fingerprint", "expected_old_baseline_fingerprint",
      "expected_new_observation_fingerprint", "decision_request_fingerprint",
      "decision_grant_fingerprint",
    ]);
    const newRoot = requiredString(body.new_repository_root);
    const result = await rebindRepositoryExecutionRootV01(db, {
      workspace_id: requiredString(body.workspace_id),
      project_id: requiredString(body.project_id),
      new_local_root: normalizeLocalProjectRootRefV01(newRoot, {
        base_path: path.parse(newRoot).root,
      }),
      expected_old_root_binding_fingerprint: requiredString(body.expected_old_root_binding_fingerprint),
      expected_old_baseline_fingerprint: requiredString(body.expected_old_baseline_fingerprint),
      expected_new_observation_fingerprint: requiredString(body.expected_new_observation_fingerprint),
      decision_request_fingerprint: requiredString(body.decision_request_fingerprint),
      decision_grant_fingerprint: requiredString(body.decision_grant_fingerprint),
    });
    return projectPhysicalRootMutationResultV01(
      result,
      "The project's trusted execution root has been updated.",
    );
  }
  if (body.action === "preview_rebind_root") {
    exactKeys(body, ["action", "workspace_id", "project_id", "new_repository_root"]);
    const newRoot = requiredString(body.new_repository_root);
    return previewRepositoryExecutionRootRebindV01(db, {
      workspace_id: requiredString(body.workspace_id),
      project_id: requiredString(body.project_id),
      new_local_root: normalizeLocalProjectRootRefV01(newRoot, {
        base_path: path.parse(newRoot).root,
      }),
    });
  }
  throw new RepositoryExecutionErrorV01("repository_execution_action_invalid", 400);
}

async function resolveProject(
  db: ReturnType<typeof openDatabase>,
  repositoryRoot: unknown,
): Promise<{ workspace_id: string; project_id: string }> {
  const resolution = await resolveCodexRepositoryProjectV01(db, {
    repository_root: requiredString(repositoryRoot),
  });
  if (resolution.status !== "resolved_exact" || !resolution.workspace_id || !resolution.project_id) {
    throw new RepositoryExecutionErrorV01(resolution.status, 409);
  }
  return { workspace_id: resolution.workspace_id, project_id: resolution.project_id };
}

function exactKeys(value: Record<string, unknown>, keys: string[]): void {
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) {
    throw new RepositoryExecutionErrorV01("repository_execution_request_invalid", 400);
  }
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || value.length < 1 || value.includes("\0")) {
    throw new RepositoryExecutionErrorV01("repository_execution_request_invalid", 400);
  }
  return value;
}

function localRequestV01(request: Request): boolean {
  try {
    const url = new URL(request.url);
    return request.method === "POST" &&
      ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) &&
      request.headers.get("x-augnes-repository-execution") === ROUTE_MARKER;
  } catch {
    return false;
  }
}

function liveCompanionIdentityV01(): boolean {
  return process.env.AUGNES_RECOVERY_MODE !== "1" &&
    process.env.AUGNES_RUNTIME_CHILD_ROLE === "ui" &&
    Boolean(process.env.AUGNES_RUNTIME_INSTANCE_ID) &&
    Boolean(process.env.AUGNES_RUNTIME_GENERATION_ID) &&
    Boolean(process.env.AUGNES_RUNTIME_REPOSITORY_FINGERPRINT);
}

function runtimeIdentityHeadersV01(): Record<string, string> {
  return {
    "x-augnes-runtime-instance": process.env.AUGNES_RUNTIME_INSTANCE_ID!,
    "x-augnes-runtime-generation": process.env.AUGNES_RUNTIME_GENERATION_ID!,
    "x-augnes-runtime-repository": process.env.AUGNES_RUNTIME_REPOSITORY_FINGERPRINT!,
  };
}

function routeError(code: string, status: number) {
  return NextResponse.json({
    response_version: "repository_execution_route_response.v0.1",
    error: { code, status },
    authority: {
      project_files_written: false,
      project_commands_executed: false,
      managed_run_created: false,
      execution_started: false,
      provider_called: false,
      semantic_authority_granted: false,
      execution_authority_granted: false,
    },
  }, { status, headers: { "cache-control": "no-store", "x-augnes-repository-execution": ROUTE_MARKER } });
}

function constantTimeEqualV01(left: string | null, right: string | undefined): boolean {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
