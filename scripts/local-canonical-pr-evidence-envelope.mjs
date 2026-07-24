import { createHash } from "node:crypto";

import {
  assertPublicSafeReceipt,
  canonicalSerialize,
  fingerprintCanonicalValue,
} from "./local-canonical-receipt.mjs";

export const LOCAL_CANONICAL_PR_EVIDENCE_SCHEMA =
  "augnes.local-canonical-pr-evidence.v1";
export const LOCAL_CANONICAL_PR_EVIDENCE_VERSION = 1;
export const LOCAL_CANONICAL_PR_EVIDENCE_TRANSPORT_VERSION =
  "gh-cli-rest-v1";
export const LOCAL_CANONICAL_PR_EVIDENCE_START_MARKER =
  "<!-- augnes-local-canonical-pr-evidence:v1 -->";
export const LOCAL_CANONICAL_PR_EVIDENCE_END_MARKER =
  "<!-- /augnes-local-canonical-pr-evidence:v1 -->";
export const MAX_PUBLICATION_ENVELOPE_BYTES = 32 * 1024;
export const MAX_PUBLICATION_COMMENT_BYTES = 48 * 1024;

export const PUBLIC_PHASE_COMMANDS = Object.freeze({
  "dependencies-root": "npm ci --no-audit --no-fund",
  "dependencies-nested": "npm ci --no-audit --no-fund",
  typecheck: "npm run typecheck",
  build: "npm run build",
  unit: "npm test",
  authority: "npm run test:authority",
  integration: "npm run test:integration",
  operability: "npm run test:operability",
  "e2e-core": "npm run test:e2e:core",
  "e2e-continuity": "npm run test:e2e:continuity",
});

const PHASE_LABELS = Object.freeze({
  "dependencies-root": "Root dependencies",
  "dependencies-nested": "Nested dependencies",
  "documentation-validator": "Documentation validator",
  typecheck: "Typecheck",
  build: "Build",
  unit: "Unit",
  authority: "Authority",
  integration: "Integration",
  operability: "Operability",
  "e2e-core": "E2E core",
  "e2e-continuity": "E2E continuity",
});

const TRUST_BOUNDARY = Object.freeze({
  content_integrity:
    "Envelope SHA-256 proves content integrity only; it is not a signature or independent attestation.",
  github_role:
    "GitHub stores this mutable comment but did not run the verification or authenticate the local execution environment.",
  remote_only_limit:
    "Remote-only verification cannot independently recompute the local receipt, executor, lockfiles, environment, or omitted receipt fields.",
});

export function buildPublicationEnvelope({
  receipt,
  pullRequest,
  publicationCreatedAt,
  supersededPublicationFingerprint = null,
}) {
  assertReceiptProjectionEligible(receipt);
  assertPullRequestProjection(pullRequest);
  assertIsoTimestamp(publicationCreatedAt, "publication creation timestamp");
  if (
    supersededPublicationFingerprint !== null &&
    !isSha256(supersededPublicationFingerprint)
  ) {
    throw evidenceError(
      "invalid_superseded_publication_fingerprint",
      "superseded publication fingerprint must be a SHA-256 value",
    );
  }

  const envelopeContent = {
    schema: LOCAL_CANONICAL_PR_EVIDENCE_SCHEMA,
    version: LOCAL_CANONICAL_PR_EVIDENCE_VERSION,
    repository: {
      repository_id: pullRequest.repository_id,
      pr_number: pullRequest.number,
      base_sha: pullRequest.base_sha,
      head_sha: pullRequest.head_sha,
      head_branch: pullRequest.head_branch,
    },
    receipt: {
      schema: receipt.schema,
      content_fingerprint: receipt.integrity.content_fingerprint,
      executor_fingerprint: receipt.executor.source_fingerprint,
      root_lock_fingerprint: receipt.dependencies.root_lock_sha256,
      nested_lock_fingerprint: receipt.dependencies.nested_lock_sha256,
    },
    verification: {
      mode: receipt.evidence.mode,
      planner_event: receipt.evidence.planner_event,
      selected_plan: receipt.evidence.selected_plan,
      final_result: receipt.final.result,
      deciding: receipt.evidence.deciding,
      transferable: receipt.evidence.transferable,
    },
    toolchain: {
      canonical_node_policy: receipt.environment.node.canonical_version,
      actual_node_version: receipt.environment.node.actual_version,
      npm_version: receipt.environment.npm_version,
    },
    platform: {
      operating_system_family: receipt.environment.operating_system,
      operating_system_version: receipt.environment.operating_system_version,
      architecture: receipt.environment.architecture,
    },
    run: {
      started_at: receipt.run.started_at,
      finished_at: receipt.run.finished_at,
      duration_ms: receipt.run.duration_ms,
    },
    phases: receipt.phases.map((phase) => ({
      id: phase.id,
      command: expectedPublicCommand(phase.id, receipt),
      status: phase.status,
      duration_ms: phase.duration_ms,
      timed_out: phase.timed_out,
      cleanup_completed: phase.cleanup.completed,
      remaining_owned_processes: phase.cleanup.remaining_owned_processes,
    })),
    cleanup: {
      completed: receipt.cleanup.completed,
      remaining_owned_processes: receipt.cleanup.remaining_owned_processes,
    },
    publication: {
      created_at: publicationCreatedAt,
      transport_version: LOCAL_CANONICAL_PR_EVIDENCE_TRANSPORT_VERSION,
      superseded_publication_fingerprint:
        supersededPublicationFingerprint,
    },
    trust_boundary: TRUST_BOUNDARY,
  };
  const envelope = {
    ...envelopeContent,
    integrity: {
      algorithm: "sha256",
      canonicalization: "json-sorted-keys-v1",
      content_fingerprint: fingerprintCanonicalValue(envelopeContent),
    },
  };
  assertValidPublicationEnvelope(envelope);
  return envelope;
}

export function assertValidPublicationEnvelope(envelope) {
  if (!isPlainObject(envelope)) {
    throw evidenceError(
      "invalid_publication_envelope",
      "publication envelope must be an object",
    );
  }
  assertPublicSafeReceipt(envelope);
  const bytes = Buffer.byteLength(canonicalSerialize(envelope), "utf8");
  if (bytes > MAX_PUBLICATION_ENVELOPE_BYTES) {
    throw evidenceError(
      "publication_envelope_too_large",
      "publication envelope exceeds the bounded byte limit",
    );
  }
  if (
    envelope.schema !== LOCAL_CANONICAL_PR_EVIDENCE_SCHEMA ||
    envelope.version !== LOCAL_CANONICAL_PR_EVIDENCE_VERSION
  ) {
    throw evidenceError(
      "unsupported_publication_envelope_schema",
      "publication envelope schema is unsupported",
    );
  }
  assertExactKeys(envelope, [
    "schema",
    "version",
    "repository",
    "receipt",
    "verification",
    "toolchain",
    "platform",
    "run",
    "phases",
    "cleanup",
    "publication",
    "trust_boundary",
    "integrity",
  ]);
  assertExactKeys(envelope.repository, [
    "repository_id",
    "pr_number",
    "base_sha",
    "head_sha",
    "head_branch",
  ]);
  assertExactKeys(envelope.receipt, [
    "schema",
    "content_fingerprint",
    "executor_fingerprint",
    "root_lock_fingerprint",
    "nested_lock_fingerprint",
  ]);
  assertExactKeys(envelope.verification, [
    "mode",
    "planner_event",
    "selected_plan",
    "final_result",
    "deciding",
    "transferable",
  ]);
  assertExactKeys(envelope.toolchain, [
    "canonical_node_policy",
    "actual_node_version",
    "npm_version",
  ]);
  assertExactKeys(envelope.platform, [
    "operating_system_family",
    "operating_system_version",
    "architecture",
  ]);
  assertExactKeys(envelope.run, [
    "started_at",
    "finished_at",
    "duration_ms",
  ]);
  assertExactKeys(envelope.cleanup, [
    "completed",
    "remaining_owned_processes",
  ]);
  assertExactKeys(envelope.publication, [
    "created_at",
    "transport_version",
    "superseded_publication_fingerprint",
  ]);
  assertExactKeys(envelope.trust_boundary, [
    "content_integrity",
    "github_role",
    "remote_only_limit",
  ]);
  assertExactKeys(envelope.integrity, [
    "algorithm",
    "canonicalization",
    "content_fingerprint",
  ]);
  assertPullRequestProjection(envelope.repository);
  assertSha256(envelope.receipt?.content_fingerprint, "receipt fingerprint");
  assertSha256(envelope.receipt?.executor_fingerprint, "executor fingerprint");
  assertSha256(
    envelope.receipt?.root_lock_fingerprint,
    "root lock fingerprint",
  );
  assertSha256(
    envelope.receipt?.nested_lock_fingerprint,
    "nested lock fingerprint",
  );
  if (envelope.receipt?.schema !== "augnes.local-canonical-receipt.v1") {
    throw evidenceError(
      "invalid_receipt_schema_projection",
      "receipt schema projection is invalid",
    );
  }
  if (!["changed", "full"].includes(envelope.verification?.mode)) {
    throw evidenceError(
      "non_deciding_publication_mode",
      "only changed or full evidence may be published",
    );
  }
  if (
    !["documentation-only", "full-canonical"].includes(
      envelope.verification?.selected_plan,
    ) ||
    envelope.verification?.planner_event !== "pull_request" ||
    envelope.verification?.final_result !== "pass" ||
    envelope.verification?.deciding !== true ||
    envelope.verification?.transferable !== true
  ) {
    throw evidenceError(
      "non_deciding_publication_claim",
      "publication envelope must claim complete deciding evidence",
    );
  }
  assertSafeScalar(
    envelope.toolchain?.canonical_node_policy,
    "canonical Node policy",
  );
  assertSafeScalar(
    envelope.toolchain?.actual_node_version,
    "actual Node version",
  );
  assertSafeScalar(envelope.toolchain?.npm_version, "npm version");
  assertSafeScalar(
    envelope.platform?.operating_system_family,
    "operating system family",
  );
  assertSafeScalar(
    envelope.platform?.operating_system_version,
    "operating system version",
  );
  if (!["arm64", "x64"].includes(envelope.platform?.architecture)) {
    throw evidenceError(
      "invalid_publication_architecture",
      "publication architecture is invalid",
    );
  }
  assertRun(envelope.run);
  assertPhases(envelope);
  if (
    envelope.cleanup?.completed !== true ||
    envelope.cleanup?.remaining_owned_processes !== 0
  ) {
    throw evidenceError(
      "publication_cleanup_incomplete",
      "publication cleanup must be complete with zero owned processes",
    );
  }
  assertIsoTimestamp(envelope.publication?.created_at, "publication timestamp");
  if (
    envelope.publication?.transport_version !==
    LOCAL_CANONICAL_PR_EVIDENCE_TRANSPORT_VERSION
  ) {
    throw evidenceError(
      "invalid_publication_transport_version",
      "publication transport version is invalid",
    );
  }
  const superseded =
    envelope.publication?.superseded_publication_fingerprint;
  if (superseded !== null && !isSha256(superseded)) {
    throw evidenceError(
      "invalid_superseded_publication_fingerprint",
      "superseded publication fingerprint is invalid",
    );
  }
  if (canonicalSerialize(envelope.trust_boundary) !== canonicalSerialize(TRUST_BOUNDARY)) {
    throw evidenceError(
      "invalid_publication_trust_boundary",
      "publication trust boundary must use fixed text",
    );
  }
  if (
    envelope.integrity?.algorithm !== "sha256" ||
    envelope.integrity?.canonicalization !== "json-sorted-keys-v1" ||
    !isSha256(envelope.integrity?.content_fingerprint)
  ) {
    throw evidenceError(
      "invalid_publication_integrity",
      "publication integrity metadata is invalid",
    );
  }
  const { integrity, ...content } = envelope;
  if (
    fingerprintCanonicalValue(content) !== integrity.content_fingerprint
  ) {
    throw evidenceError(
      "publication_integrity_mismatch",
      "publication envelope fingerprint does not match its content",
    );
  }
  return envelope;
}

export function renderPublicationComment(envelope) {
  assertValidPublicationEnvelope(envelope);
  const rows = envelope.phases
    .map(
      (phase) =>
        `| ${PHASE_LABELS[phase.id]} | <code>${escapeHtml(phase.command)}</code> | ${phase.status} | ${formatDuration(phase.duration_ms)} | ${phase.timed_out ? "yes" : "no"} | ${phase.cleanup_completed ? "complete" : "incomplete"} | ${phase.remaining_owned_processes} |`,
    )
    .join("\n");
  const body = [
    LOCAL_CANONICAL_PR_EVIDENCE_START_MARKER,
    "## Local Canonical verification",
    "",
    `**Result:** pass · **Plan:** \`${envelope.verification.selected_plan}\` · **Mode:** \`${envelope.verification.mode}\``,
    "",
    `- Base: \`${envelope.repository.base_sha}\``,
    `- Head: \`${envelope.repository.head_sha}\``,
    `- Branch: \`${envelope.repository.head_branch}\``,
    `- Environment: ${envelope.platform.operating_system_family} ${envelope.platform.operating_system_version} ${envelope.platform.architecture}; Node ${envelope.toolchain.actual_node_version}; npm ${envelope.toolchain.npm_version}`,
    `- Total duration: ${formatDuration(envelope.run.duration_ms)}`,
    "",
    "| Phase | Command | Result | Duration | Timed out | Cleanup | Owned processes |",
    "| --- | --- | --- | ---: | --- | --- | ---: |",
    rows,
    "",
    `Cleanup: **complete**, remaining owned processes: **${envelope.cleanup.remaining_owned_processes}**.`,
    "",
    `Receipt fingerprint: \`${envelope.receipt.content_fingerprint}\`  `,
    `Publication envelope fingerprint: \`${envelope.integrity.content_fingerprint}\``,
    "",
    "> This mutable PR comment is local evidence only. Its SHA-256 fingerprints prove content integrity, not a signature or independent attestation. GitHub did not run these tests, authenticate the local environment, or create a status check.",
    "",
    "<details>",
    "<summary>Machine-readable publication envelope</summary>",
    "",
    "```json",
    canonicalSerialize(envelope),
    "```",
    "",
    "</details>",
    LOCAL_CANONICAL_PR_EVIDENCE_END_MARKER,
  ].join("\n");
  const bytes = Buffer.byteLength(body, "utf8");
  if (bytes > MAX_PUBLICATION_COMMENT_BYTES) {
    throw evidenceError(
      "publication_comment_too_large",
      "publication comment exceeds the bounded byte limit",
    );
  }
  return body;
}

export function parsePublicationComment(body) {
  if (typeof body !== "string") {
    throw evidenceError(
      "malformed_publication_comment",
      "publication comment body must be text",
    );
  }
  if (Buffer.byteLength(body, "utf8") > MAX_PUBLICATION_COMMENT_BYTES) {
    throw evidenceError(
      "publication_comment_too_large",
      "publication comment exceeds the bounded byte limit",
    );
  }
  if (
    countOccurrences(body, LOCAL_CANONICAL_PR_EVIDENCE_START_MARKER) !== 1 ||
    countOccurrences(body, LOCAL_CANONICAL_PR_EVIDENCE_END_MARKER) !== 1 ||
    !body.startsWith(`${LOCAL_CANONICAL_PR_EVIDENCE_START_MARKER}\n`) ||
    !body.endsWith(LOCAL_CANONICAL_PR_EVIDENCE_END_MARKER)
  ) {
    throw evidenceError(
      "malformed_publication_comment",
      "publication comment marker structure is invalid",
    );
  }
  const fenceStart = "```json\n";
  const fenceEnd = "\n```";
  const start = body.indexOf(fenceStart);
  const end = body.indexOf(fenceEnd, start + fenceStart.length);
  if (
    start < 0 ||
    end < 0 ||
    body.indexOf(fenceStart, start + fenceStart.length) >= 0 ||
    body.indexOf(fenceEnd, end + fenceEnd.length) >= 0
  ) {
    throw evidenceError(
      "malformed_publication_comment",
      "publication comment machine envelope is invalid",
    );
  }
  let envelope;
  try {
    envelope = JSON.parse(
      body.slice(start + fenceStart.length, end),
    );
  } catch {
    throw evidenceError(
      "malformed_publication_comment",
      "publication comment machine envelope is not valid JSON",
    );
  }
  assertValidPublicationEnvelope(envelope);
  if (renderPublicationComment(envelope) !== body) {
    throw evidenceError(
      "noncanonical_publication_comment",
      "publication comment does not match the deterministic renderer",
    );
  }
  return envelope;
}

export function discoverPublicationComments(comments) {
  if (!Array.isArray(comments)) {
    throw evidenceError(
      "invalid_publication_comment_list",
      "publication comments response must be an array",
    );
  }
  const markerComments = comments.filter(
    (comment) =>
      typeof comment?.body === "string" &&
      (comment.body.includes(LOCAL_CANONICAL_PR_EVIDENCE_START_MARKER) ||
        comment.body.includes(LOCAL_CANONICAL_PR_EVIDENCE_END_MARKER)),
  );
  if (markerComments.length > 1) {
    throw evidenceError(
      "duplicate_publication_comments",
      "more than one Local Canonical evidence comment exists",
    );
  }
  if (markerComments.length === 0) return null;
  const comment = markerComments[0];
  const envelope = parsePublicationComment(comment.body);
  return {
    comment,
    envelope,
    body_hash: sha256Text(comment.body),
  };
}

export function sha256Text(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function assertReceiptProjectionEligible(receipt) {
  if (!isPlainObject(receipt)) {
    throw evidenceError(
      "invalid_receipt_projection",
      "receipt projection requires a receipt object",
    );
  }
  if (
    receipt.schema !== "augnes.local-canonical-receipt.v1" ||
    !isSha256(receipt.integrity?.content_fingerprint) ||
    !isSha256(receipt.executor?.source_fingerprint) ||
    !isSha256(receipt.dependencies?.root_lock_sha256) ||
    !isSha256(receipt.dependencies?.nested_lock_sha256)
  ) {
    throw evidenceError(
      "invalid_receipt_projection",
      "receipt projection identity fields are invalid",
    );
  }
  if (
    !["changed", "full"].includes(receipt.evidence?.mode) ||
    !["documentation-only", "full-canonical"].includes(
      receipt.evidence?.selected_plan,
    ) ||
    receipt.evidence?.planner_event !== "pull_request" ||
    receipt.evidence?.deciding !== true ||
    receipt.evidence?.transferable !== true ||
    receipt.final?.result !== "pass" ||
    receipt.environment?.node?.canonical_match !== true ||
    receipt.repository?.worktree_before !== "clean" ||
    receipt.repository?.worktree_after !== "clean" ||
    receipt.cleanup?.completed !== true ||
    receipt.cleanup?.remaining_owned_processes !== 0
  ) {
    throw evidenceError(
      "receipt_not_eligible_for_publication",
      "receipt is not current deciding evidence",
    );
  }
  assertRun(receipt.run);
  if (!Array.isArray(receipt.phases) || receipt.phases.length === 0) {
    throw evidenceError(
      "receipt_phase_inventory_incomplete",
      "receipt phase inventory is incomplete",
    );
  }
  for (const phase of receipt.phases) {
    expectedPublicCommand(phase.id, receipt);
    if (
      phase.status !== "pass" ||
      !Number.isFinite(phase.duration_ms) ||
      phase.duration_ms < 0 ||
      phase.timed_out !== false ||
      phase.cleanup?.completed !== true ||
      phase.cleanup?.remaining_owned_processes !== 0
    ) {
      throw evidenceError(
        "receipt_phase_not_publishable",
        "receipt phase is failed, incomplete, or timed out",
      );
    }
  }
}

function assertPullRequestProjection(pullRequest) {
  const prNumber = pullRequest?.number ?? pullRequest?.pr_number;
  if (
    pullRequest?.repository_id !==
      "hynk-studio/augnes-perspective-lab" ||
    !Number.isSafeInteger(prNumber) ||
    prNumber <= 0 ||
    (pullRequest?.number !== undefined &&
      pullRequest?.pr_number !== undefined &&
      pullRequest.number !== pullRequest.pr_number) ||
    !isSha(pullRequest?.base_sha) ||
    !isSha(pullRequest?.head_sha) ||
    !isSafeBranch(pullRequest?.head_branch)
  ) {
    throw evidenceError(
      "invalid_pull_request_projection",
      "pull request projection identity is invalid",
    );
  }
}

function assertRun(run) {
  assertIsoTimestamp(run?.started_at, "run start timestamp");
  assertIsoTimestamp(run?.finished_at, "run finish timestamp");
  if (
    !Number.isFinite(run?.duration_ms) ||
    run.duration_ms < 0 ||
    Date.parse(run.finished_at) < Date.parse(run.started_at)
  ) {
    throw evidenceError(
      "invalid_publication_run",
      "publication run duration or ordering is invalid",
    );
  }
}

function assertPhases(envelope) {
  if (!Array.isArray(envelope.phases) || envelope.phases.length === 0) {
    throw evidenceError(
      "publication_phase_inventory_incomplete",
      "publication phase inventory is incomplete",
    );
  }
  const seen = new Set();
  for (const phase of envelope.phases) {
    assertExactKeys(phase, [
      "id",
      "command",
      "status",
      "duration_ms",
      "timed_out",
      "cleanup_completed",
      "remaining_owned_processes",
    ]);
    if (
      !Object.hasOwn(PHASE_LABELS, phase?.id) ||
      seen.has(phase.id) ||
      phase.command !== expectedPublicCommandForEnvelope(phase, envelope) ||
      phase.status !== "pass" ||
      !Number.isFinite(phase.duration_ms) ||
      phase.duration_ms < 0 ||
      phase.timed_out !== false ||
      phase.cleanup_completed !== true ||
      phase.remaining_owned_processes !== 0
    ) {
      throw evidenceError(
        "invalid_publication_phase",
        "publication phase is unknown, duplicate, failed, or incomplete",
      );
    }
    seen.add(phase.id);
  }
  if (
    envelope.verification.selected_plan === "documentation-only" &&
    (envelope.phases.length !== 1 ||
      envelope.phases[0].id !== "documentation-validator")
  ) {
    throw evidenceError(
      "invalid_documentation_publication_phases",
      "documentation-only publication must contain only its validator",
    );
  }
  if (envelope.verification.selected_plan === "full-canonical") {
    const expected = Object.keys(PUBLIC_PHASE_COMMANDS);
    if (
      canonicalSerialize(envelope.phases.map((phase) => phase.id)) !==
      canonicalSerialize(expected)
    ) {
      throw evidenceError(
        "invalid_full_publication_phases",
        "full publication must preserve the complete ordered phase inventory",
      );
    }
  }
}

function expectedPublicCommand(phaseId, receipt) {
  if (phaseId === "documentation-validator") {
    const expected =
      `node scripts/validate-canonical-docs-change.mjs --base ${receipt.repository.base_sha} --head ${receipt.repository.head_sha}`;
    const actual = receipt.phases.find((phase) => phase.id === phaseId)?.command;
    if (actual !== expected) {
      throw evidenceError(
        "untrusted_publication_phase_command",
        "documentation phase command does not match its exact receipt identity",
      );
    }
    return expected;
  }
  const expected = PUBLIC_PHASE_COMMANDS[phaseId];
  const actual = receipt.phases.find((phase) => phase.id === phaseId)?.command;
  if (!expected || actual !== expected) {
    throw evidenceError(
      "untrusted_publication_phase_command",
      "phase command is not a fixed public command",
    );
  }
  return expected;
}

function expectedPublicCommandForEnvelope(phase, envelope) {
  if (phase.id === "documentation-validator") {
    return `node scripts/validate-canonical-docs-change.mjs --base ${envelope.repository.base_sha} --head ${envelope.repository.head_sha}`;
  }
  return PUBLIC_PHASE_COMMANDS[phase.id] ?? null;
}

function assertSafeScalar(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 80 ||
    /[\u0000-\u001f\u007f`|<>]/u.test(value)
  ) {
    throw evidenceError(
      "invalid_publication_scalar",
      `${label} contains unsafe material`,
    );
  }
}

function assertIsoTimestamp(value, label) {
  if (
    typeof value !== "string" ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  ) {
    throw evidenceError(
      "invalid_publication_timestamp",
      `${label} must be a canonical ISO timestamp`,
    );
  }
}

function assertSha256(value, label) {
  if (!isSha256(value)) {
    throw evidenceError(
      "invalid_publication_fingerprint",
      `${label} is invalid`,
    );
  }
}

function isSha(value) {
  return typeof value === "string" && /^[0-9a-f]{40}$/u.test(value);
}

function isSha256(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
}

function isSafeBranch(value) {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._/-]{0,200}$/u.test(value) &&
    !value.includes("..") &&
    !value.includes("//") &&
    !value.includes("@{") &&
    !value.endsWith(".lock") &&
    !value.endsWith("/") &&
    !value.endsWith(".")
  );
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function assertExactKeys(value, expectedKeys) {
  if (!isPlainObject(value)) {
    throw evidenceError(
      "invalid_publication_object",
      "publication envelope contains a non-object record",
    );
  }
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (canonicalSerialize(actual) !== canonicalSerialize(expected)) {
    throw evidenceError(
      "unexpected_publication_field",
      "publication envelope contains missing or unexpected fields",
    );
  }
}

function formatDuration(durationMs) {
  if (durationMs < 1_000) return `${durationMs} ms`;
  return `${(durationMs / 1_000).toFixed(3)} s`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function countOccurrences(value, needle) {
  return value.split(needle).length - 1;
}

function evidenceError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
