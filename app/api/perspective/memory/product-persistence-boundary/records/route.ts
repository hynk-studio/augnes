import {
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE,
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_STATUSES,
  isPerspectiveMemoryProductPersistenceBoundaryStatus,
  type PerspectiveMemoryProductPersistenceBoundaryStatus,
} from "@/lib/perspective-ingest/perspective-memory-product-persistence-boundary";
import {
  createPerspectiveMemoryProductPersistenceBoundaryRecord,
  listPerspectiveMemoryProductPersistenceBoundaryRecords,
} from "@/lib/perspective-ingest/perspective-memory-product-persistence-boundary-store";
import {
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
  safeParsePerspectiveMemoryLocalReviewQueue,
  type PerspectiveMemoryLocalReviewQueueItemV0,
} from "@/lib/perspective-ingest/perspective-memory-local-review-queue";
import {
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION,
  safeParsePerspectiveMemoryLocalWriteProposalList,
  type PerspectiveMemoryLocalWriteProposalV0,
} from "@/lib/perspective-ingest/perspective-memory-local-write-proposal";
import {
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION,
  safeParsePerspectiveMemoryLocalWriteProposalReviewChecklistList,
  type PerspectiveMemoryLocalWriteProposalReviewChecklistV0,
} from "@/lib/perspective-ingest/perspective-memory-local-write-proposal-review-checklist";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonBodyResult =
  | { value: Record<string, unknown> }
  | { error: string };

type BoundaryStatusParseResult =
  | { value: PerspectiveMemoryProductPersistenceBoundaryStatus | null }
  | { error: string };

type LimitParseResult = { value: number | null } | { error: string };

type BoundaryCreateSourceResult =
  | {
      checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0;
      proposal: PerspectiveMemoryLocalWriteProposalV0;
      queueItem: PerspectiveMemoryLocalReviewQueueItemV0;
      userConfirmation: {
        user_confirmed_not_accepted_memory?: boolean;
        user_confirmed_not_core_decision?: boolean;
        user_confirmed_no_automatic_promotion?: boolean;
      };
    }
  | { blocked_reasons: string[] };

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const boundaryStatus = parseBoundaryStatus(searchParams.get("boundary_status"));
  if ("error" in boundaryStatus) {
    return blockedResponse([boundaryStatus.error], 400);
  }
  const limit = parseLimit(searchParams.get("limit"));
  if ("error" in limit) {
    return blockedResponse([limit.error], 400);
  }
  const records = listPerspectiveMemoryProductPersistenceBoundaryRecords({
    boundaryStatus: boundaryStatus.value,
    sourceChecklistId: searchParams.get("source_checklist_id"),
    sourceProposalId: searchParams.get("source_proposal_id"),
    limit: limit.value,
  });
  return NextResponse.json({
    ok: true,
    route: PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE,
    persistence_backend: "sqlite:lib/db.ts",
    result: records,
    authority_boundary: {
      product_persistence_boundary_records_read: true,
      accepted_augnes_memory_created: false,
      product_memory_write_created: false,
      review_decision_created: false,
      core_decision_created: false,
      runtime_handoff_created: false,
      automatic_promotion: false,
    },
  });
}

export async function POST(request: Request) {
  if (!acceptsJson(request)) {
    return blockedResponse(["Request content-type must be application/json."], 400);
  }
  const body = await parseJsonBody(request);
  if ("error" in body) return blockedResponse([body.error], 400);
  const source = parseBoundaryCreateSource(body.value);
  if ("blocked_reasons" in source) {
    return blockedResponse(source.blocked_reasons, 400);
  }
  const result = createPerspectiveMemoryProductPersistenceBoundaryRecord({
    checklist: source.checklist,
    proposal: source.proposal,
    queueItem: source.queueItem,
    userConfirmation: source.userConfirmation,
  });
  if (!result.ok) return blockedResponse(result.blocked_reasons, 400);
  return NextResponse.json(
    {
      ok: true,
      route: PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE,
      persistence_backend: "sqlite:lib/db.ts",
      created: result.created,
      idempotent_replay: result.idempotent_replay,
      result: {
        record: result.record,
      },
      recommended_next_step:
        "Review the product persistence boundary record. This is not accepted memory, a Core decision, or automatic promotion.",
    },
    { status: result.created ? 201 : 200 },
  );
}

async function parseJsonBody(request: Request): Promise<JsonBodyResult> {
  try {
    const text = await request.text();
    const value = text.trim().length > 0 ? JSON.parse(text) : null;
    if (!isRecord(value)) {
      return { error: "Request body must be a JSON object." };
    }
    return { value };
  } catch (error) {
    return {
      error: `Invalid JSON request body: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

function parseBoundaryCreateSource(
  body: Record<string, unknown>,
): BoundaryCreateSourceResult {
  const nowIso = new Date().toISOString();
  const checklistList =
    safeParsePerspectiveMemoryLocalWriteProposalReviewChecklistList(
      JSON.stringify({
        checklist_list_version:
          PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION,
        updated_at: nowIso,
        checklists: [body.checklist],
      }),
      nowIso,
    );
  const proposalList = safeParsePerspectiveMemoryLocalWriteProposalList(
    JSON.stringify({
      proposal_list_version: PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION,
      updated_at: nowIso,
      proposals: [body.proposal],
    }),
    nowIso,
  );
  const queue = safeParsePerspectiveMemoryLocalReviewQueue(
    JSON.stringify({
      queue_version: PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
      updated_at: nowIso,
      items: [body.queue_item],
    }),
    nowIso,
  );
  const blockedReasons: string[] = [];
  const checklist = checklistList.checklists[0] ?? null;
  const proposal = proposalList.proposals[0] ?? null;
  const queueItem = queue.items[0] ?? null;
  if (!checklist) blockedReasons.push("Request body must include a valid checklist.");
  if (!proposal) blockedReasons.push("Request body must include a valid proposal.");
  if (!queueItem) blockedReasons.push("Request body must include a valid queue_item.");
  const userConfirmation = body.user_confirmation;
  if (!isRecord(userConfirmation)) {
    blockedReasons.push("Request body must include user_confirmation.");
  }
  if (
    blockedReasons.length > 0 ||
    !checklist ||
    !proposal ||
    !queueItem ||
    !isRecord(userConfirmation)
  ) {
    return { blocked_reasons: blockedReasons };
  }
  return {
    checklist,
    proposal,
    queueItem,
    userConfirmation: {
      user_confirmed_not_accepted_memory:
        userConfirmation.user_confirmed_not_accepted_memory === true,
      user_confirmed_not_core_decision:
        userConfirmation.user_confirmed_not_core_decision === true,
      user_confirmed_no_automatic_promotion:
        userConfirmation.user_confirmed_no_automatic_promotion === true,
    },
  };
}

function parseBoundaryStatus(value: string | null): BoundaryStatusParseResult {
  if (!value) return { value: null };
  if (isPerspectiveMemoryProductPersistenceBoundaryStatus(value)) {
    return { value };
  }
  return {
    error: `boundary_status must be one of: ${PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_STATUSES.join(", ")}.`,
  };
}

function parseLimit(value: string | null): LimitParseResult {
  if (!value) return { value: null };
  const limit = Number(value);
  if (!Number.isFinite(limit)) {
    return { error: "limit must be a number." };
  }
  return { value: limit };
}

function acceptsJson(request: Request) {
  return (request.headers.get("content-type") ?? "")
    .toLowerCase()
    .includes("application/json");
}

function blockedResponse(blockedReasons: string[], status: number) {
  return NextResponse.json(
    {
      ok: false,
      route: PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE,
      result_state: "BLOCKED",
      blocked_reasons: blockedReasons,
      authority_boundary: {
        product_persistence_boundary_record_created: false,
        accepted_augnes_memory_created: false,
        product_memory_write_created: false,
        review_decision_created: false,
        core_decision_created: false,
        runtime_handoff_created: false,
        automatic_promotion: false,
      },
    },
    { status },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
