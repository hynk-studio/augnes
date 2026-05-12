import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-c5-artifacts-"));
process.env.AUGNES_DB_PATH = path.join(tempDir, "augnes.db");

let fetchCalls = 0;

try {
  const { resetDatabase } = await import("./db-common.mjs");
  const db = resetDatabase();
  db.close();

  const {
    createDelivery,
    createPublication,
    getDelivery,
    listDeliveries,
  } = await import("../lib/publications.ts");
  const { createPublicationApprovalRequest } = await import(
    "../lib/publication-approval-requests.ts"
  );
  const { approvePublicationApprovalRequest } = await import(
    "../lib/publication-approval-decisions.ts"
  );
  const { checkPublicationReadiness } = await import(
    "../lib/publication-readiness-checks.ts"
  );
  const {
    PublishGateConflictError,
    buildDryRunPublishPreview,
    executeGitHubPrCommentPublish,
  } = await import("../lib/core-gated-publish.ts");
  const { publishGitHubPrComment } = await import("../lib/github-publication.ts");

  const firstFlow = createReadyFlow({
    suffix: "success",
    createPublication,
    createPublicationApprovalRequest,
    approvePublicationApprovalRequest,
    checkPublicationReadiness,
  });
  const commentUrl =
    "https://github.com/Aurna-code/augnes/pull/999#issuecomment-987654321";
  globalThis.fetch = async () => {
    fetchCalls += 1;

    return new Response(
      JSON.stringify({
        id: 987654321,
        html_url: commentUrl,
      }),
      {
        status: 201,
        headers: { "content-type": "application/json" },
      },
    );
  };
  process.env.GITHUB_TOKEN = "local-smoke-token";

  const publishResult = await executeGitHubPrCommentPublish({
    readinessCheckId: firstFlow.readinessCheckId,
    scope: firstFlow.scope,
    requestedBy: "codex-smoke",
    dryRun: false,
    idempotencyKey: firstFlow.idempotencyKey,
    explicitTargetApproval: true,
    approvedTargetRef: firstFlow.targetRef,
    approvedTargetSurface: "github_pr_comment",
  });

  assertEqual(fetchCalls, 1, "successful publish should call adapter once");
  assertEqual(publishResult.posted, true, "successful publish should post");
  assertEqual(
    publishResult.github_comment_id,
    987654321,
    "successful publish should return comment id",
  );
  assertEqual(
    publishResult.github_comment_url,
    commentUrl,
    "successful publish should return comment URL",
  );
  assertEqual(
    publishResult.delivery.external_artifact_id,
    "987654321",
    "delivery result should include persisted artifact id",
  );
  assertEqual(
    publishResult.delivery.external_artifact_url,
    commentUrl,
    "delivery result should include persisted artifact URL",
  );
  assertEqual(
    publishResult.delivery.external_artifact_type,
    "github_pr_comment",
    "delivery result should include persisted artifact type",
  );

  const storedDelivery = getDelivery(publishResult.delivery.delivery_id, firstFlow.scope);
  assertEqual(
    storedDelivery?.external_artifact_id,
    "987654321",
    "stored delivery should include artifact id",
  );
  assertEqual(
    storedDelivery?.external_artifact_url,
    commentUrl,
    "stored delivery should include artifact URL",
  );
  assertEqual(
    storedDelivery?.external_artifact_type,
    "github_pr_comment",
    "stored delivery should include artifact type",
  );

  delete process.env.GITHUB_TOKEN;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error("adapter should not be called on same-key replay");
  };

  const directReplay = await publishGitHubPrComment({
    publicationId: firstFlow.publicationId,
    scope: firstFlow.scope,
    dryRun: false,
    idempotencyKey: firstFlow.idempotencyKey,
    requestedBy: "codex-smoke",
  });
  assertEqual(
    directReplay.idempotent_replay,
    true,
    "direct publish replay should be idempotent",
  );
  assertEqual(directReplay.posted, false, "direct replay should not post");
  assertEqual(
    directReplay.github_comment_id,
    987654321,
    "direct replay should return persisted comment id",
  );
  assertEqual(
    directReplay.github_comment_url,
    commentUrl,
    "direct replay should return persisted comment URL",
  );

  const replayFetchCallsBefore = fetchCalls;
  const coreReplay = await executeGitHubPrCommentPublish({
    readinessCheckId: firstFlow.readinessCheckId,
    scope: firstFlow.scope,
    requestedBy: "codex-smoke",
    dryRun: false,
    idempotencyKey: firstFlow.idempotencyKey,
    explicitTargetApproval: true,
    approvedTargetRef: firstFlow.targetRef,
    approvedTargetSurface: "github_pr_comment",
  });
  assertEqual(
    fetchCalls,
    replayFetchCallsBefore,
    "core replay should avoid adapter call without token",
  );
  assertEqual(coreReplay.idempotent_replay, true, "core replay should be idempotent");
  assertEqual(coreReplay.posted, false, "core replay should not post");
  assertEqual(
    coreReplay.github_comment_id,
    987654321,
    "core replay should return persisted comment id",
  );
  assertEqual(
    coreReplay.github_comment_url,
    commentUrl,
    "core replay should return persisted comment URL",
  );

  await assertRejectsConflict(
    () =>
      executeGitHubPrCommentPublish({
        readinessCheckId: firstFlow.readinessCheckId,
        scope: firstFlow.scope,
        requestedBy: "codex-smoke",
        dryRun: false,
        idempotencyKey: "c5-smoke-different-key",
        explicitTargetApproval: true,
        approvedTargetRef: firstFlow.targetRef,
        approvedTargetSurface: "github_pr_comment",
      }),
    PublishGateConflictError,
    "different-key duplicate should remain blocked",
  );

  const dryRunFlow = createReadyFlow({
    suffix: "dry-run",
    createPublication,
    createPublicationApprovalRequest,
    approvePublicationApprovalRequest,
    checkPublicationReadiness,
  });
  const dryRunPreview = buildDryRunPublishPreview({
    readinessCheckId: dryRunFlow.readinessCheckId,
    scope: dryRunFlow.scope,
    requestedBy: "codex-smoke",
    dryRun: true,
    idempotencyKey: dryRunFlow.idempotencyKey,
    explicitTargetApproval: false,
    approvedTargetRef: null,
    approvedTargetSurface: null,
  });
  assertEqual(dryRunPreview.dry_run, true, "dry-run preview should be dry_run");
  assertEqual(
    listDeliveries({
      scope: dryRunFlow.scope,
      publicationId: dryRunFlow.publicationId,
    }).length,
    0,
    "dry-run should create no delivery rows",
  );

  const oldNullFlow = createReadyFlow({
    suffix: "old-null",
    createPublication,
    createPublicationApprovalRequest,
    approvePublicationApprovalRequest,
    checkPublicationReadiness,
  });
  const oldDelivery = createDelivery({
    publication_id: oldNullFlow.publicationId,
    scope: oldNullFlow.scope,
    target_surface: "github_pr_comment",
    target_ref: oldNullFlow.targetRef,
    status: "sent",
    idempotency_key: oldNullFlow.idempotencyKey,
  }).delivery;
  assertEqual(
    oldDelivery.external_artifact_id,
    null,
    "old-style delivery should serialize null artifact id",
  );
  assertEqual(
    oldDelivery.external_artifact_url,
    null,
    "old-style delivery should serialize null artifact URL",
  );
  assertEqual(
    oldDelivery.external_artifact_type,
    null,
    "old-style delivery should serialize null artifact type",
  );

  const nullArtifactReplay = await executeGitHubPrCommentPublish({
    readinessCheckId: oldNullFlow.readinessCheckId,
    scope: oldNullFlow.scope,
    requestedBy: "codex-smoke",
    dryRun: false,
    idempotencyKey: oldNullFlow.idempotencyKey,
    explicitTargetApproval: true,
    approvedTargetRef: oldNullFlow.targetRef,
    approvedTargetSurface: "github_pr_comment",
  });
  assertEqual(
    nullArtifactReplay.github_comment_id,
    null,
    "replay of old/null artifact delivery should return null comment id",
  );
  assertEqual(
    nullArtifactReplay.github_comment_url,
    null,
    "replay of old/null artifact delivery should return null comment URL",
  );

  console.log(
    JSON.stringify(
      {
        smoke: "c5-delivery-artifacts",
        db_path: process.env.AUGNES_DB_PATH,
        adapter_calls: fetchCalls,
        persisted_artifact_type: storedDelivery?.external_artifact_type,
        same_key_replay_returned_artifact: coreReplay.github_comment_id === 987654321,
        different_key_duplicate_blocked: true,
        dry_run_delivery_count: 0,
        old_null_artifact_replay_safe: true,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function createReadyFlow({
  suffix,
  createPublication,
  createPublicationApprovalRequest,
  approvePublicationApprovalRequest,
  checkPublicationReadiness,
}) {
  const scope = "project:augnes";
  const targetRef = `Aurna-code/augnes#${900 + suffix.length}`;
  const publicationId = `publication:c5-artifact-${suffix}`;
  const approvalRequestId = `approval_request:c5-artifact-${suffix}`;
  const approvalDecisionId = `approval_decision:c5-artifact-${suffix}`;
  const readinessCheckId = `readiness_check:c5-artifact-${suffix}`;
  const idempotencyKey = `c5-artifact-${suffix}-key`;

  createPublication({
    publication_id: publicationId,
    scope,
    target_surface: "github_pr_comment",
    target_ref: targetRef,
    preview_body: `C5 artifact persistence smoke body for ${suffix}.`,
    created_by: "codex-smoke",
  });
  createPublicationApprovalRequest({
    approval_request_id: approvalRequestId,
    scope,
    publication_id: publicationId,
    requested_by: "codex-smoke",
    decision_prompt: `Approve C5 artifact smoke ${suffix}.`,
    side_effect_summary: "Would post one GitHub PR comment in smoke with mocked fetch.",
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
    targetRef,
    publicationId,
    readinessCheckId,
    idempotencyKey,
  };
}

async function assertRejectsConflict(operation, ConflictError, message) {
  try {
    await operation();
  } catch (error) {
    if (error instanceof ConflictError) {
      return;
    }

    throw error;
  }

  throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}
