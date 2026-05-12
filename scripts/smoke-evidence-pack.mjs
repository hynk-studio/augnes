import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-evidence-pack-"));
process.env.AUGNES_DB_PATH = path.join(tempDir, "augnes.db");
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Evidence Pack smoke must not call fetch.");
};

try {
  const { resetDatabase } = await import("./db-common.mjs");
  const db = resetDatabase();
  seedWorkItem(db);
  db.close();

  const { GET } = await import("../app/api/evidence-pack/route.ts");
  const { insertActionRecord } = await import("../lib/db.ts");
  const { appendWorkEvent } = await import("../lib/work.ts");
  const { createPublication, createDelivery } = await import(
    "../lib/publications.ts"
  );
  const { createPublicationApprovalRequest } = await import(
    "../lib/publication-approval-requests.ts"
  );
  const { approvePublicationApprovalRequest } = await import(
    "../lib/publication-approval-decisions.ts"
  );
  const { checkPublicationReadiness } = await import(
    "../lib/publication-readiness-checks.ts"
  );

  const emptyResponse = await GET(
    new Request("http://localhost/api/evidence-pack?scope=project:augnes"),
  );
  assertEqual(emptyResponse.status, 200, "empty latest pack should return 200");
  const emptyPack = await emptyResponse.json();
  assertEqual(
    emptyPack.evidence_pack_version,
    "v0.1",
    "empty pack should include version",
  );
  assert(
    emptyPack.gaps.includes("No publication trace was found for the selected evidence"),
    "empty pack should surface missing publication gap",
  );

  const flow = createReadyFlow({
    suffix: "artifact",
    createPublication,
    createPublicationApprovalRequest,
    approvePublicationApprovalRequest,
    checkPublicationReadiness,
  });
  const action = insertActionRecord({
    id: "action:evidence-pack-smoke",
    scope: flow.scope,
    state_key: "coordination.evidence_pack",
    title: "Evidence Pack smoke verification",
    description: "Local smoke inserted a structured action record.",
    status: "completed",
    source_agent_id: "codex-smoke",
  });
  appendWorkEvent({
    work_id: flow.workId,
    scope: flow.scope,
    actor: "codex",
    event_type: "verification",
    summary: "Evidence Pack smoke verification completed.",
    result_status: "completed",
    result_kind: "verification",
    related_action_id: action.id,
  });
  const artifactUrl =
    "https://github.com/Aurna-code/augnes/pull/104#issuecomment-123456789";
  const delivery = createDelivery({
    delivery_id: "delivery:evidence-pack-artifact",
    publication_id: flow.publicationId,
    scope: flow.scope,
    target_surface: "github_pr_comment",
    target_ref: flow.targetRef,
    status: "sent",
    idempotency_key: flow.idempotencyKey,
    external_artifact_id: "123456789",
    external_artifact_url: artifactUrl,
    external_artifact_type: "github_pr_comment",
  }).delivery;

  const byDeliveryResponse = await GET(
    new Request(
      `http://localhost/api/evidence-pack?scope=project:augnes&delivery_id=${encodeURIComponent(
        delivery.delivery_id,
      )}`,
    ),
  );
  assertEqual(byDeliveryResponse.status, 200, "delivery filter should return 200");
  const byDeliveryPack = await byDeliveryResponse.json();
  assertEqual(
    byDeliveryPack.selection.mode,
    "by_delivery_id",
    "delivery filter should set selection mode",
  );
  assertEqual(
    byDeliveryPack.delivery_trace.external_artifact_id,
    "123456789",
    "delivery trace should include artifact id",
  );
  assertEqual(
    byDeliveryPack.delivery_trace.external_artifact_url,
    artifactUrl,
    "delivery trace should include artifact URL",
  );
  assertEqual(
    byDeliveryPack.delivery_trace.external_artifact_type,
    "github_pr_comment",
    "delivery trace should include artifact type",
  );
  assertEqual(
    byDeliveryPack.replay_trace.same_key_replay_supported,
    true,
    "sent delivery with idempotency key should infer same-key replay support",
  );
  assertEqual(
    byDeliveryPack.replay_trace.same_key_replay_observed,
    null,
    "Evidence Pack should not claim replay observation",
  );
  assertEqual(
    byDeliveryPack.verification_trace.commands_run.length,
    0,
    "Evidence Pack should not fabricate commands",
  );
  assert(
    byDeliveryPack.gaps.includes(
      "commands_run are not yet persisted as structured Core records",
    ),
    "missing command data should appear as a gap",
  );

  const byPublicationResponse = await GET(
    new Request(
      `http://localhost/api/evidence-pack?scope=project:augnes&publication_id=${encodeURIComponent(
        flow.publicationId,
      )}`,
    ),
  );
  assertEqual(
    byPublicationResponse.status,
    200,
    "publication filter should return 200",
  );
  const byPublicationPack = await byPublicationResponse.json();
  assertEqual(
    byPublicationPack.selection.delivery_id,
    delivery.delivery_id,
    "publication filter should choose latest delivery",
  );

  const oldNullFlow = createReadyFlow({
    suffix: "old-null",
    createPublication,
    createPublicationApprovalRequest,
    approvePublicationApprovalRequest,
    checkPublicationReadiness,
  });
  const oldNullDelivery = createDelivery({
    delivery_id: "delivery:evidence-pack-old-null",
    publication_id: oldNullFlow.publicationId,
    scope: oldNullFlow.scope,
    target_surface: "github_pr_comment",
    target_ref: oldNullFlow.targetRef,
    status: "sent",
    idempotency_key: oldNullFlow.idempotencyKey,
  }).delivery;
  const oldNullResponse = await GET(
    new Request(
      `http://localhost/api/evidence-pack?scope=project:augnes&delivery_id=${encodeURIComponent(
        oldNullDelivery.delivery_id,
      )}`,
    ),
  );
  const oldNullPack = await oldNullResponse.json();
  assertEqual(
    oldNullPack.delivery_trace.external_artifact_id,
    null,
    "old/null artifact row should serialize artifact id as null",
  );
  assert(
    oldNullPack.gaps.includes(
      "Selected delivery has no external artifact id/url/type recorded",
    ),
    "old/null artifact row should surface artifact gap",
  );

  const missingResponse = await GET(
    new Request(
      "http://localhost/api/evidence-pack?scope=project:augnes&publication_id=publication:missing",
    ),
  );
  assertEqual(
    missingResponse.status,
    404,
    "missing requested publication_id should return 404",
  );
  assertEqual(fetchCalls, 0, "Evidence Pack smoke should make no fetch calls");

  console.log(
    JSON.stringify(
      {
        smoke: "evidence-pack",
        db_path: process.env.AUGNES_DB_PATH,
        latest_empty_pack_returned: true,
        artifact_type: byDeliveryPack.delivery_trace.external_artifact_type,
        same_key_replay_executed: false,
        fetch_calls: fetchCalls,
        missing_verification_commands_gap: true,
        old_null_artifact_safe: true,
        publication_filter_delivery_id: byPublicationPack.selection.delivery_id,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function seedWorkItem(db) {
  db.prepare(
    `
      INSERT INTO agents (id, name, kind, created_at)
      VALUES ('codex-smoke', 'Codex Smoke', 'codex', '2026-01-01T00:00:00.000Z')
    `,
  ).run();
  db.prepare(
    `
      INSERT INTO work_items (
        work_id,
        scope,
        title,
        status,
        priority,
        summary,
        next_action,
        user_attention_required,
        related_state_keys,
        links,
        created_at,
        updated_at
      )
      VALUES (
        'AG-EVIDENCE',
        'project:augnes',
        'Evidence Pack smoke work',
        'in_progress',
        'now',
        'Seeded local work trace for Evidence Pack smoke.',
        'Review the generated Evidence Pack.',
        0,
        '["coordination.evidence_pack"]',
        '{}',
        '2026-01-01T00:00:00.000Z',
        '2026-01-01T00:00:00.000Z'
      )
    `,
  ).run();
}

function createReadyFlow({
  suffix,
  createPublication,
  createPublicationApprovalRequest,
  approvePublicationApprovalRequest,
  checkPublicationReadiness,
}) {
  const scope = "project:augnes";
  const workId = "AG-EVIDENCE";
  const targetRef = `Aurna-code/augnes#${800 + suffix.length}`;
  const publicationId = `publication:evidence-pack-${suffix}`;
  const approvalRequestId = `approval_request:evidence-pack-${suffix}`;
  const approvalDecisionId = `approval_decision:evidence-pack-${suffix}`;
  const readinessCheckId = `readiness_check:evidence-pack-${suffix}`;
  const idempotencyKey = `evidence-pack-${suffix}-key`;

  createPublication({
    publication_id: publicationId,
    scope,
    work_id: workId,
    target_surface: "github_pr_comment",
    target_ref: targetRef,
    preview_body: `Evidence Pack smoke publication body for ${suffix}.`,
    created_by: "codex-smoke",
  });
  createPublicationApprovalRequest({
    approval_request_id: approvalRequestId,
    scope,
    publication_id: publicationId,
    requested_by: "codex-smoke",
    decision_prompt: `Approve Evidence Pack smoke ${suffix}.`,
    side_effect_summary:
      "Would publish one GitHub PR comment only in a separately approved flow.",
  });
  approvePublicationApprovalRequest({
    approval_decision_id: approvalDecisionId,
    scope,
    approval_request_id: approvalRequestId,
    decided_by: "codex-smoke",
    decision_reason: `Local smoke approval for ${suffix}.`,
  });
  const readiness = checkPublicationReadiness({
    readiness_check_id: readinessCheckId,
    scope,
    approval_decision_id: approvalDecisionId,
    checked_by: "codex-smoke",
  });

  assertEqual(readiness.ready, true, `${suffix} readiness should be ready`);

  return {
    scope,
    workId,
    targetRef,
    publicationId,
    readinessCheckId,
    idempotencyKey,
  };
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}
