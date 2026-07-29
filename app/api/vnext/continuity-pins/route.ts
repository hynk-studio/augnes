import { NextResponse } from "next/server";

import { openDatabase } from "@/lib/db";
import {
  buildBlankStateContinuityV01,
} from "@/lib/vnext/blank-state/blank-state-continuity";
import {
  readBlankStateSourceV01,
} from "@/lib/vnext/blank-state/blank-state-source";
import {
  isRetainedContinuityPinTargetV01,
  isSupportedContinuityPinTargetV01,
  sameContinuityPinTargetV01,
} from "@/lib/vnext/continuity-pins/continuity-pin-target";
import {
  ProjectContinuityPinStoreErrorV01,
  mutateProjectContinuityPinsV01,
  readProjectContinuityPinProjectionV01,
} from "@/lib/vnext/persistence/project-continuity-pin-store";
import { readDefaultWorkspaceIdentityV01 } from "@/lib/vnext/persistence/project-identity-registry";
import {
  VNextLocalOperatorSessionErrorV01,
  assertVNextLocalOperatorRequestBoundaryV01,
  readBoundedVNextLocalOperatorBodyV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type {
  ContinuityPinTargetRefV01,
  ProjectContinuityPinMutationActionV01,
} from "@/types/vnext/continuity-pins";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};
export async function GET(request: Request) {
  let db: ReturnType<typeof openDatabase> | null = null;
  try {
    const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
      mutating: false,
    });
    if (
      [...url.searchParams.keys()].some((key) => key !== "project_id") ||
      url.searchParams.getAll("project_id").length !== 1
    ) {
      return json({ ok: false, error_code: "continuity_pin_request_invalid" }, 400);
    }
    const projectId = requiredIdV01(url.searchParams.get("project_id"));
    db = openDatabase();
    const workspace = readDefaultWorkspaceIdentityV01(db);
    if (!workspace) {
      return json(
        { ok: false, error_code: "continuity_pin_project_not_found" },
        404,
      );
    }
    return json({
      ok: true,
      collection: readProjectContinuityPinProjectionV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: projectId,
      }),
    });
  } catch (error) {
    return routeErrorV01(error);
  } finally {
    db?.close();
  }
}

export async function POST(request: Request) {
  let db: ReturnType<typeof openDatabase> | null = null;
  try {
    const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
      mutating: true,
    });
    if ([...url.searchParams.keys()].length > 0) {
      return json({ ok: false, error_code: "continuity_pin_request_invalid" }, 400);
    }
    const body = await readBoundedVNextLocalOperatorBodyV01(request);
    const parsed = parseMutationV01(body);
    db = openDatabase();
    const workspace = readDefaultWorkspaceIdentityV01(db);
    if (!workspace) {
      return json(
        { ok: false, error_code: "continuity_pin_project_not_found" },
        404,
      );
    }
    let mutation: ProjectContinuityPinMutationActionV01;
    if (parsed.action === "pin") {
      const source = await readBlankStateSourceV01(db, {
        route_mode: "canonical",
        requested_project_id: null,
      });
      if (
        source.projection?.project_id !== parsed.project_id ||
        !source.projection.project_summary.is_active
      ) {
        throw new ProjectContinuityPinStoreErrorV01(
          "continuity_pin_project_mismatch",
        );
      }
      const composition = buildBlankStateContinuityV01(source);
      const item = [
        composition.highlighted_item,
        ...composition.continuity_items,
      ].find((candidate) => candidate.item_id === parsed.source_item_id);
      if (
        !item ||
        item.pinning.status !== "eligible" ||
        !sameContinuityPinTargetV01(item.pinning.target, parsed.target)
      ) {
        throw new ProjectContinuityPinStoreErrorV01(
          "continuity_pin_invalid_target",
        );
      }
      mutation = {
        action: "pin",
        expected_revision: parsed.expected_revision,
        target: item.pinning.target,
        source_family: item.source_family,
        source_item_id: item.item_id,
        label_snapshot: item.work_name,
        state_snapshot: item.meaningful_state,
      };
    } else if (parsed.action === "unpin") {
      mutation = {
        action: "unpin",
        expected_revision: parsed.expected_revision,
        target: parsed.target,
      };
    } else {
      mutation = {
        action: "reorder",
        expected_revision: parsed.expected_revision,
        target_order: parsed.target_order,
      };
    }
    const result = mutateProjectContinuityPinsV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: parsed.project_id,
      mutation,
    });
    return json({ ok: true, result });
  } catch (error) {
    return routeErrorV01(error);
  } finally {
    db?.close();
  }
}

type ParsedMutationV01 =
  | {
      action: "pin";
      project_id: string;
      expected_revision: number;
      source_item_id: string;
      target: ContinuityPinTargetRefV01 & {
        owner: Extract<
          ContinuityPinTargetRefV01["owner"],
          { kind: "managed_run" | "core_record" }
        >;
      };
    }
  | {
      action: "unpin";
      project_id: string;
      expected_revision: number;
      target: ContinuityPinTargetRefV01;
    }
  | {
      action: "reorder";
      project_id: string;
      expected_revision: number;
      target_order: ContinuityPinTargetRefV01[];
    };

function parseMutationV01(body: Record<string, unknown>): ParsedMutationV01 {
  const action = body.action;
  const projectId = requiredIdV01(body.project_id);
  const expectedRevision = requiredRevisionV01(body.expected_revision);
  if (action === "pin") {
    assertExactKeysV01(body, [
      "action",
      "project_id",
      "expected_revision",
      "source_item_id",
      "target",
    ]);
    if (
      !isSupportedContinuityPinTargetV01(body.target) ||
      body.target.project_id !== projectId
    ) {
      invalidV01();
    }
    return {
      action,
      project_id: projectId,
      expected_revision: expectedRevision,
      source_item_id: requiredIdV01(body.source_item_id, 512),
      target: body.target,
    };
  }
  if (action === "unpin") {
    assertExactKeysV01(body, [
      "action",
      "project_id",
      "expected_revision",
      "target",
    ]);
    if (
      !isRetainedContinuityPinTargetV01(body.target) ||
      body.target.project_id !== projectId
    ) {
      invalidV01();
    }
    return {
      action,
      project_id: projectId,
      expected_revision: expectedRevision,
      target: body.target,
    };
  }
  if (action === "reorder") {
    assertExactKeysV01(body, [
      "action",
      "project_id",
      "expected_revision",
      "target_order",
    ]);
    if (
      !Array.isArray(body.target_order) ||
      body.target_order.some(
        (target) =>
          !isRetainedContinuityPinTargetV01(target) ||
          target.project_id !== projectId,
      )
    ) {
      invalidV01();
    }
    return {
      action,
      project_id: projectId,
      expected_revision: expectedRevision,
      target_order: body.target_order as ContinuityPinTargetRefV01[],
    };
  }
  invalidV01();
}

function assertExactKeysV01(
  body: Record<string, unknown>,
  keys: string[],
): void {
  const expected = new Set(keys);
  if (
    Object.keys(body).length !== expected.size ||
    Object.keys(body).some((key) => !expected.has(key))
  ) {
    invalidV01();
  }
}

function requiredIdV01(value: unknown, limit = 256): string {
  if (
    typeof value !== "string" ||
    value !== value.trim() ||
    value.length < 1 ||
    value.length > limit ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    invalidV01();
  }
  return value;
}

function requiredRevisionV01(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) invalidV01();
  return Number(value);
}

function invalidV01(): never {
  throw new ProjectContinuityPinStoreErrorV01(
    "continuity_pin_request_invalid",
  );
}

function routeErrorV01(error: unknown) {
  if (error instanceof VNextLocalOperatorSessionErrorV01) {
    return json({ ok: false, error_code: error.code }, error.status);
  }
  if (error instanceof ProjectContinuityPinStoreErrorV01) {
    const status =
      error.code === "continuity_pin_request_invalid" ||
      error.code === "continuity_pin_invalid_target"
        ? 400
        : error.code === "continuity_pin_project_not_found"
          ? 404
          : [
                "continuity_pin_project_mismatch",
                "continuity_pin_stale_write",
                "continuity_pin_target_unavailable",
                "continuity_pin_collection_full",
              ].includes(error.code)
            ? 409
            : 500;
    return json(
      {
        ok: false,
        error_code:
          status === 500 ? "continuity_pin_unavailable" : error.code,
        ...(error.code === "continuity_pin_stale_write"
          ? { current_revision: error.current_revision }
          : {}),
      },
      status,
    );
  }
  return json({ ok: false, error_code: "continuity_pin_unavailable" }, 500);
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: HEADERS });
}
