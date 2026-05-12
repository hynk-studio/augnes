import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-verification-evidence-"));
process.env.AUGNES_DB_PATH = path.join(tempDir, "augnes.db");
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";
process.env.GITHUB_TOKEN = "smoke-github-token-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Verification evidence smoke must not call fetch.");
};

try {
  const { resetDatabase, openDatabase } = await import("./db-common.mjs");
  const db = resetDatabase();
  seedWorkItem(db);
  db.close();

  const { GET: getEvidencePack } = await import("../app/api/evidence-pack/route.ts");
  const {
    GET: listEvidenceRecordsApi,
    POST: createEvidenceRecordApi,
  } = await import("../app/api/evidence/records/route.ts");
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

  const flow = createReadyFlow({
    suffix: "structured",
    createPublication,
    createPublicationApprovalRequest,
    approvePublicationApprovalRequest,
    checkPublicationReadiness,
  });
  const delivery = createDelivery({
    delivery_id: "delivery:verification-evidence-structured",
    publication_id: flow.publicationId,
    scope: flow.scope,
    target_surface: "github_pr_comment",
    target_ref: flow.targetRef,
    status: "sent",
    idempotency_key: flow.idempotencyKey,
    external_artifact_id: "verification-evidence-comment",
    external_artifact_url:
      "https://github.com/Aurna-code/augnes/pull/105#issuecomment-structured",
    external_artifact_type: "github_pr_comment",
  }).delivery;

  const oldFlow = createReadyFlow({
    suffix: "old-no-evidence",
    workId: "AG-EVIDENCE-OLD",
    createPublication,
    createPublicationApprovalRequest,
    approvePublicationApprovalRequest,
    checkPublicationReadiness,
  });
  const oldDelivery = createDelivery({
    delivery_id: "delivery:verification-evidence-old",
    publication_id: oldFlow.publicationId,
    scope: oldFlow.scope,
    target_surface: "github_pr_comment",
    target_ref: oldFlow.targetRef,
    status: "sent",
    idempotency_key: oldFlow.idempotencyKey,
  }).delivery;

  const oldBeforeResponse = await getEvidencePack(
    new Request(
      `http://localhost/api/evidence-pack?scope=project:augnes&delivery_id=${encodeURIComponent(
        oldDelivery.delivery_id,
      )}`,
    ),
  );
  const oldBeforePack = await oldBeforeResponse.json();
  assert(
    oldBeforePack.gaps.includes(
      "commands_run are not yet persisted as structured Core records",
    ),
    "old/no evidence pack should retain command gap",
  );
  assertEqual(
    oldBeforePack.replay_trace.same_key_replay_observed,
    null,
    "old/no evidence pack should not claim replay observation",
  );

  const beforeEvidenceSnapshot = readMutationSnapshot(openDatabase);

  const commandRecord = await postEvidenceRecord(createEvidenceRecordApi, {
    evidence_id: "evidence:command-run",
    scope: flow.scope,
    work_id: flow.workId,
    publication_id: flow.publicationId,
    delivery_id: delivery.delivery_id,
    target_surface: delivery.target_surface,
    target_ref: delivery.target_ref,
    evidence_kind: "command_run",
    label: "Root typecheck",
    status: "passed",
    command: "npm run typecheck",
    result_summary: "TypeScript completed with no errors.",
    source_surface: "codex",
    source_ref: "local-smoke:command-run",
    metadata: { cwd: "repo root" },
    created_by: "codex-smoke",
  });
  await postEvidenceRecord(createEvidenceRecordApi, {
    evidence_id: "evidence:check-passed",
    scope: flow.scope,
    work_id: flow.workId,
    publication_id: flow.publicationId,
    delivery_id: delivery.delivery_id,
    target_surface: delivery.target_surface,
    target_ref: delivery.target_ref,
    evidence_kind: "check_passed",
    label: "Evidence API list check",
    status: "passed",
    result_summary: "Evidence record list endpoint returned the expected records.",
    source_surface: "local_runtime",
    source_ref: "local-smoke:check-passed",
    created_by: "codex-smoke",
  });
  await postEvidenceRecord(createEvidenceRecordApi, {
    evidence_id: "evidence:check-skipped",
    scope: flow.scope,
    work_id: flow.workId,
    publication_id: flow.publicationId,
    delivery_id: delivery.delivery_id,
    target_surface: delivery.target_surface,
    target_ref: delivery.target_ref,
    evidence_kind: "check_skipped",
    label: "Browser check",
    status: "skipped",
    result_summary: "Browser check skipped in local smoke.",
    skipped_reason: "No browser runtime is needed for this API-only smoke.",
    source_surface: "codex",
    source_ref: "local-smoke:check-skipped",
    created_by: "codex-smoke",
  });
  await postEvidenceRecord(createEvidenceRecordApi, {
    evidence_id: "evidence:replay-observed",
    scope: flow.scope,
    publication_id: flow.publicationId,
    delivery_id: delivery.delivery_id,
    target_surface: delivery.target_surface,
    target_ref: delivery.target_ref,
    evidence_kind: "replay_observed",
    label: "Same-key replay observation",
    status: "observed",
    result_summary:
      "A same-key replay was explicitly observed outside Evidence Pack and returned the persisted delivery artifact.",
    observed_behavior: "same-key replay returned idempotent_replay=true",
    source_surface: "codex",
    source_ref: "local-smoke:replay-observed",
    created_by: "codex-smoke",
  });
  await postEvidenceRecord(createEvidenceRecordApi, {
    evidence_id: "evidence:duplicate-block-observed",
    scope: flow.scope,
    publication_id: flow.publicationId,
    delivery_id: delivery.delivery_id,
    target_surface: delivery.target_surface,
    target_ref: delivery.target_ref,
    evidence_kind: "duplicate_block_observed",
    label: "Different-key duplicate block observation",
    status: "blocked",
    result_summary:
      "A different-key duplicate block was explicitly observed outside Evidence Pack.",
    observed_behavior: "duplicate publish attempt was blocked before posting",
    source_surface: "codex",
    source_ref: "local-smoke:duplicate-block-observed",
    created_by: "codex-smoke",
  });

  const listByKindResponse = await listEvidenceRecordsApi(
    new Request(
      "http://localhost/api/evidence/records?scope=project:augnes&evidence_kind=command_run",
    ),
  );
  const listByKind = await listByKindResponse.json();
  assertEqual(listByKind.records.length, 1, "kind filter should return one record");
  assertEqual(
    listByKind.records[0].evidence_id,
    commandRecord.evidence_id,
    "kind filter should return command record",
  );

  const listByDeliveryResponse = await listEvidenceRecordsApi(
    new Request(
      `http://localhost/api/evidence/records?scope=project:augnes&delivery_id=${encodeURIComponent(
        delivery.delivery_id,
      )}`,
    ),
  );
  const listByDelivery = await listByDeliveryResponse.json();
  assertEqual(
    listByDelivery.records.length,
    5,
    "delivery filter should return all five matching records",
  );

  const invalidKindResponse = await createEvidenceRecordApi(
    jsonRequest("http://localhost/api/evidence/records", {
      scope: flow.scope,
      evidence_kind: "not_real",
      label: "Invalid",
      status: "passed",
      result_summary: "Should fail.",
      source_surface: "codex",
      created_by: "codex-smoke",
    }),
  );
  assertEqual(invalidKindResponse.status, 400, "invalid kind should fail");

  const invalidStatusResponse = await createEvidenceRecordApi(
    jsonRequest("http://localhost/api/evidence/records", {
      scope: flow.scope,
      evidence_kind: "check_passed",
      label: "Invalid",
      status: "done",
      result_summary: "Should fail.",
      source_surface: "codex",
      created_by: "codex-smoke",
    }),
  );
  assertEqual(invalidStatusResponse.status, 400, "invalid status should fail");

  const invalidMetadataResponse = await createEvidenceRecordApi(
    jsonRequest("http://localhost/api/evidence/records", {
      scope: flow.scope,
      evidence_kind: "check_passed",
      label: "Invalid metadata",
      status: "passed",
      result_summary: "Should fail.",
      source_surface: "codex",
      created_by: "codex-smoke",
      metadata: "{not-json",
    }),
  );
  assertEqual(invalidMetadataResponse.status, 400, "invalid metadata should fail");

  const afterEvidenceSnapshot = readMutationSnapshot(openDatabase);
  assertDeepEqual(
    afterEvidenceSnapshot,
    beforeEvidenceSnapshot,
    "evidence record creation should not mutate publication, approval, readiness, delivery, mailbox, or state rows",
  );

  const evidencePackResponse = await getEvidencePack(
    new Request(
      `http://localhost/api/evidence-pack?scope=project:augnes&delivery_id=${encodeURIComponent(
        delivery.delivery_id,
      )}`,
    ),
  );
  const evidencePack = await evidencePackResponse.json();
  assertEqual(
    evidencePack.verification_trace.commands_run.length,
    1,
    "Evidence Pack should include command_run records",
  );
  assertEqual(
    evidencePack.verification_trace.checks_passed.length,
    1,
    "Evidence Pack should include check_passed records",
  );
  assertEqual(
    evidencePack.verification_trace.skipped_checks.length,
    1,
    "Evidence Pack should include check_skipped records",
  );
  assertEqual(
    evidencePack.replay_trace.same_key_replay_observed,
    true,
    "Evidence Pack should mark matching replay observation true",
  );
  assertEqual(
    evidencePack.replay_trace.duplicate_block_observed,
    true,
    "Evidence Pack should mark matching duplicate block observation true",
  );
  assert(
    !evidencePack.gaps.includes(
      "commands_run are not yet persisted as structured Core records",
    ),
    "matching command records should reduce command gap",
  );
  assert(
    !evidencePack.gaps.includes(
      "skipped_checks are not yet fully structured in Core records",
    ),
    "matching skipped records should reduce skipped gap",
  );
  assert(
    !evidencePack.gaps.includes(
      "same-key replay observations are not persisted as first-class Core records",
    ),
    "matching replay record should reduce replay gap",
  );
  assert(
    !evidencePack.gaps.includes(
      "duplicate-block observations are not persisted as first-class Core records",
    ),
    "matching duplicate block record should reduce duplicate gap",
  );

  const oldAfterResponse = await getEvidencePack(
    new Request(
      `http://localhost/api/evidence-pack?scope=project:augnes&delivery_id=${encodeURIComponent(
        oldDelivery.delivery_id,
      )}`,
    ),
  );
  const oldAfterPack = await oldAfterResponse.json();
  assert(
    oldAfterPack.gaps.includes(
      "commands_run are not yet persisted as structured Core records",
    ),
    "unrelated evidence records should not reduce old delivery command gap",
  );
  assertEqual(
    oldAfterPack.replay_trace.same_key_replay_observed,
    null,
    "unrelated evidence records should not mark old delivery replay observed",
  );
  assertEqual(fetchCalls, 0, "smoke should make no fetch calls");

  console.log(
    JSON.stringify(
      {
        smoke: "verification-evidence-records",
        db_path: process.env.AUGNES_DB_PATH,
        records_created: listByDelivery.records.length,
        command_records_in_pack: evidencePack.verification_trace.commands_run.length,
        check_passed_records_in_pack:
          evidencePack.verification_trace.checks_passed.length,
        skipped_records_in_pack:
          evidencePack.verification_trace.skipped_checks.length,
        same_key_replay_observed:
          evidencePack.replay_trace.same_key_replay_observed,
        duplicate_block_observed:
          evidencePack.replay_trace.duplicate_block_observed,
        fetch_calls: fetchCalls,
        invalid_input_rejected: true,
        unrelated_evidence_gap_preserved: true,
        mutation_snapshot_unchanged: true,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

async function postEvidenceRecord(postRoute, body) {
  const response = await postRoute(
    jsonRequest("http://localhost/api/evidence/records", body),
  );
  const json = await response.json();
  assertEqual(response.status, 201, `record ${body.evidence_id} should be created`);
  return json.record;
}

function jsonRequest(url, body) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function readMutationSnapshot(openDatabase) {
  const db = openDatabase();
  try {
    return {
      publications: db
        .prepare(
          `
            SELECT publication_id, status, approved_by, sent_at, updated_at
            FROM publication_drafts
            ORDER BY publication_id
          `,
        )
        .all(),
      approval_requests: db
        .prepare(
          `
            SELECT approval_request_id, publication_id, status, updated_at
            FROM publication_approval_requests
            ORDER BY approval_request_id
          `,
        )
        .all(),
      approval_decisions: db
        .prepare(
          `
            SELECT approval_decision_id, publication_id, decision
            FROM publication_approval_decisions
            ORDER BY approval_decision_id
          `,
        )
        .all(),
      readiness_checks: db
        .prepare(
          `
            SELECT readiness_check_id, publication_id, status
            FROM publication_readiness_checks
            ORDER BY readiness_check_id
          `,
        )
        .all(),
      deliveries: db
        .prepare(
          `
            SELECT delivery_id, publication_id, status, sent_at, acknowledged_at, error_message, updated_at
            FROM delivery_ledger
            ORDER BY delivery_id
          `,
        )
        .all(),
      mailbox_count: db
        .prepare("SELECT COUNT(*) AS count FROM mailbox_messages")
        .get().count,
      state_entry_count: db
        .prepare("SELECT COUNT(*) AS count FROM state_entries")
        .get().count,
    };
  } finally {
    db.close();
  }
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
        'Structured verification evidence smoke work',
        'in_progress',
        'now',
        'Seeded local work trace for structured verification evidence smoke.',
        'Review the generated Evidence Pack.',
        0,
        '["coordination.evidence_pack"]',
        '{}',
        '2026-01-01T00:00:00.000Z',
        '2026-01-01T00:00:00.000Z'
      )
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
        'AG-EVIDENCE-OLD',
        'project:augnes',
        'Structured verification evidence old smoke work',
        'in_progress',
        'normal',
        'Seeded separate work trace for unrelated evidence smoke coverage.',
        'Confirm unrelated records do not suppress gaps.',
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
  workId = "AG-EVIDENCE",
  createPublication,
  createPublicationApprovalRequest,
  approvePublicationApprovalRequest,
  checkPublicationReadiness,
}) {
  const scope = "project:augnes";
  const targetRef = `Aurna-code/augnes#${900 + suffix.length}`;
  const publicationId = `publication:verification-evidence-${suffix}`;
  const approvalRequestId = `approval_request:verification-evidence-${suffix}`;
  const approvalDecisionId = `approval_decision:verification-evidence-${suffix}`;
  const readinessCheckId = `readiness_check:verification-evidence-${suffix}`;
  const idempotencyKey = `verification-evidence-${suffix}-key`;

  createPublication({
    publication_id: publicationId,
    scope,
    work_id: workId,
    target_surface: "github_pr_comment",
    target_ref: targetRef,
    preview_body: `Structured verification evidence smoke publication body for ${suffix}.`,
    created_by: "codex-smoke",
  });
  createPublicationApprovalRequest({
    approval_request_id: approvalRequestId,
    scope,
    publication_id: publicationId,
    requested_by: "codex-smoke",
    decision_prompt: `Approve structured verification evidence smoke ${suffix}.`,
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

function assertDeepEqual(actual, expected, message) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}: expected ${expectedJson}, got ${actualJson}`);
  }
}
