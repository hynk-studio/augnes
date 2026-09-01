#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  canonicalSerialize,
  fingerprintCanonicalValue,
} from "./local-canonical-receipt.mjs";
import {
  LOCAL_CANONICAL_PR_EVIDENCE_END_MARKER,
  LOCAL_CANONICAL_PR_EVIDENCE_SCHEMA,
  LOCAL_CANONICAL_PR_EVIDENCE_START_MARKER,
  MAX_PUBLICATION_COMMENT_BYTES,
  OPERATING_POLICY_PUBLIC_PHASE_COMMANDS,
  PUBLIC_PHASE_COMMANDS,
  assertValidPublicationEnvelope,
  buildPublicationEnvelope,
  discoverPublicationComments,
  parsePublicationComment,
  renderPublicationComment,
} from "./local-canonical-pr-evidence-envelope.mjs";
import {
  assertEnvelopeMatchesPullRequest,
  assertLocalLinkedPublication,
  assertLivePullRequest,
  assertPublicationIdentity,
  parseEvidenceCli,
  verifyRemotePublicationProjection,
} from "./local-canonical-pr-evidence.mjs";

const baseSha = "1".repeat(40);
const headSha = "2".repeat(40);
const branch = "codex/local-canonical-pr-evidence";
const publicationCreatedAt = "2026-07-24T12:00:00.000Z";
const receipt = buildReceipt();
const pullRequest = buildPullRequest();
const envelope = buildPublicationEnvelope({
  receipt,
  pullRequest,
  publicationCreatedAt,
});
const duplicateEnvelope = buildPublicationEnvelope({
  receipt: structuredClone(receipt),
  pullRequest: structuredClone(pullRequest),
  publicationCreatedAt,
});

assert.equal(envelope.schema, LOCAL_CANONICAL_PR_EVIDENCE_SCHEMA);
assert.equal(
  canonicalSerialize(envelope),
  canonicalSerialize(duplicateEnvelope),
);
assert.equal(
  envelope.integrity.content_fingerprint,
  duplicateEnvelope.integrity.content_fingerprint,
);
assert.deepEqual(
  envelope.phases.map((phase) => phase.id),
  Object.keys(PUBLIC_PHASE_COMMANDS),
);
assert.equal(envelope.cleanup.completed, true);
assert.equal(envelope.cleanup.remaining_owned_processes, 0);
assert.equal(envelope.verification.deciding, true);
assert.equal(envelope.verification.transferable, true);
assert.equal(Object.hasOwn(envelope.platform, "machine_fingerprint"), false);

const body = renderPublicationComment(envelope);
assert.equal(
  Buffer.byteLength(body, "utf8") <= MAX_PUBLICATION_COMMENT_BYTES,
  true,
);
assert.equal(body.startsWith(LOCAL_CANONICAL_PR_EVIDENCE_START_MARKER), true);
assert.equal(body.endsWith(LOCAL_CANONICAL_PR_EVIDENCE_END_MARKER), true);
assert.match(body, /not a signature or independent attestation/u);
assert.match(body, /GitHub did not run these tests/u);
assert.match(body, /status check/u);
assert.deepEqual(parsePublicationComment(body), envelope);
assert.equal(body.includes("/Users/"), false);
assert.equal(body.includes("raw stdout"), false);
assert.equal(body.includes("machine_fingerprint"), false);

const unrelated = {
  id: 1,
  body: "ordinary review discussion",
  url: "https://github.com/hynk-studio/augnes/pull/1#issuecomment-1",
  created_at: publicationCreatedAt,
  updated_at: publicationCreatedAt,
};
const owned = {
  ...unrelated,
  id: 2,
  body,
};
assert.equal(discoverPublicationComments([unrelated]), null);
assert.equal(discoverPublicationComments([unrelated, owned]).comment.id, 2);
assert.throws(
  () => discoverPublicationComments([owned, { ...owned, id: 3 }]),
  hasCode("duplicate_publication_comments"),
);
assert.throws(
  () =>
    discoverPublicationComments([
      {
        ...owned,
        body: `${LOCAL_CANONICAL_PR_EVIDENCE_START_MARKER}\nmalformed`,
      },
    ]),
  hasCode("malformed_publication_comment"),
);

const tampered = structuredClone(envelope);
tampered.run.duration_ms += 1;
assert.throws(
  () => assertValidPublicationEnvelope(tampered),
  hasCode("publication_integrity_mismatch"),
);
const unexpectedField = structuredClone(envelope);
unexpectedField.untrusted_prose = "arbitrary prose must not be accepted";
refingerprint(unexpectedField);
assert.throws(
  () => assertValidPublicationEnvelope(unexpectedField),
  hasCode("unexpected_publication_field"),
);
const changedTrust = structuredClone(envelope);
changedTrust.trust_boundary.github_role = "different trust claim";
refingerprint(changedTrust);
assert.throws(
  () => assertValidPublicationEnvelope(changedTrust),
  hasCode("invalid_publication_trust_boundary"),
);

for (const prohibited of [
  { private_path: "/Users/private/project/file" },
  { username: "private-user" },
  { hostname: "private-host" },
  { environment_dump: { PRIVATE_VALUE: "hidden" } },
  { credentials: "hidden" },
  { token: "ghp_abcdefghijklmnopqrstuvwxyz0123456789" },
  { raw_output: "command output" },
  { prompt: "hidden prompt" },
  { model_output: "hidden model text" },
  { database_content: "private row" },
]) {
  const unsafe = structuredClone(envelope);
  unsafe.prohibited = prohibited;
  refingerprint(unsafe);
  assert.throws(
    () => assertValidPublicationEnvelope(unsafe),
    /public-safe|forbidden|private|secret/iu,
  );
}

for (const mutation of [
  (candidate) => {
    candidate.evidence.mode = "quick";
  },
  (candidate) => {
    candidate.evidence.deciding = false;
  },
  (candidate) => {
    candidate.evidence.transferable = false;
  },
  (candidate) => {
    candidate.final.result = "failure";
  },
  (candidate) => {
    candidate.environment.node.canonical_match = false;
  },
  (candidate) => {
    candidate.repository.worktree_after = "dirty";
  },
  (candidate) => {
    candidate.cleanup.completed = false;
  },
  (candidate) => {
    candidate.cleanup.remaining_owned_processes = 1;
  },
  (candidate) => {
    candidate.phases[0].status = "failure";
  },
  (candidate) => {
    candidate.phases[0].timed_out = true;
  },
  (candidate) => {
    candidate.phases[0].cleanup.completed = false;
  },
  (candidate) => {
    candidate.phases[0].cleanup.remaining_owned_processes = 1;
  },
  (candidate) => {
    candidate.phases[0].duration_ms = Number.NaN;
  },
  (candidate) => {
    candidate.phases.pop();
  },
  (candidate) => {
    candidate.integrity.content_fingerprint = "invalid";
  },
]) {
  const candidate = structuredClone(receipt);
  mutation(candidate);
  assert.throws(() =>
    buildPublicationEnvelope({
      receipt: candidate,
      pullRequest,
      publicationCreatedAt,
    }),
  );
}

const changedReceipt = buildReceipt({
  mode: "changed",
  selectedPlan: "documentation-only",
  phases: [
    buildPhase(
      "documentation-validator",
      `node scripts/validate-canonical-docs-change.mjs --base ${baseSha} --head ${headSha}`,
    ),
  ],
});
const changedEnvelope = buildPublicationEnvelope({
  receipt: changedReceipt,
  pullRequest,
  publicationCreatedAt,
});
assert.equal(changedEnvelope.verification.mode, "changed");
assert.deepEqual(
  changedEnvelope.phases.map((phase) => phase.id),
  ["documentation-validator"],
);

const operatingPolicyReceipt = buildReceipt({
  mode: "changed",
  selectedPlan: "operating-policy-only",
  phases: [
    buildPhase(
      "operating-policy-validator",
      `node scripts/validate-canonical-docs-change.mjs --base ${baseSha} --head ${headSha} --plan operating-policy-only`,
    ),
    ...Object.entries(OPERATING_POLICY_PUBLIC_PHASE_COMMANDS).map(
      ([id, command]) => buildPhase(id, command),
    ),
  ],
});
const operatingPolicyEnvelope = buildPublicationEnvelope({
  receipt: operatingPolicyReceipt,
  pullRequest,
  publicationCreatedAt,
});
assert.equal(
  operatingPolicyEnvelope.verification.selected_plan,
  "operating-policy-only",
);
assert.deepEqual(
  operatingPolicyEnvelope.phases.map((phase) => phase.id),
  [
    "operating-policy-validator",
    ...Object.keys(OPERATING_POLICY_PUBLIC_PHASE_COMMANDS),
  ],
);

const targetedReceipt = buildReceipt({
  mode: "changed",
  selectedPlan: "owner-targeted",
  phases: [
    buildPhase(
      "targeted-change-validator",
      `node scripts/validate-canonical-docs-change.mjs --base ${baseSha} --head ${headSha} --plan owner-targeted`,
    ),
    buildPhase("unit", PUBLIC_PHASE_COMMANDS.unit),
  ],
});
const targetedEnvelope = buildPublicationEnvelope({
  receipt: targetedReceipt,
  pullRequest,
  publicationCreatedAt,
});
assert.equal(
  targetedEnvelope.verification.selected_plan,
  "owner-targeted",
);
assert.deepEqual(
  targetedEnvelope.phases.map((phase) => phase.id),
  ["targeted-change-validator", "unit"],
);
for (const mutate of [
  (candidate) => {
    candidate.evidence.planner_owner_ids = [];
  },
  (candidate) => {
    candidate.evidence.planner_targeted_phase_ids = ["unit"];
  },
]) {
  const candidate = structuredClone(targetedReceipt);
  mutate(candidate);
  assert.throws(
    () =>
      buildPublicationEnvelope({
        receipt: candidate,
        pullRequest,
        publicationCreatedAt,
      }),
    hasCode("receipt_owner_targeted_projection_mismatch"),
  );
}
for (const phases of [
  [buildPhase("unit", PUBLIC_PHASE_COMMANDS.unit)],
  [
    buildPhase("unit", PUBLIC_PHASE_COMMANDS.unit),
    buildPhase(
      "targeted-change-validator",
      `node scripts/validate-canonical-docs-change.mjs --base ${baseSha} --head ${headSha} --plan owner-targeted`,
    ),
  ],
]) {
  assert.throws(
    () =>
      buildPublicationEnvelope({
        receipt: buildReceipt({
          mode: "changed",
          selectedPlan: "owner-targeted",
          phases,
        }),
        pullRequest,
        publicationCreatedAt,
      }),
    hasCode("invalid_owner_targeted_publication_phases"),
  );
}

const replacementEnvelope = buildPublicationEnvelope({
  receipt,
  pullRequest,
  publicationCreatedAt: "2026-07-24T12:01:00.000Z",
  supersededPublicationFingerprint:
    envelope.integrity.content_fingerprint,
});
assert.equal(
  replacementEnvelope.publication.superseded_publication_fingerprint,
  envelope.integrity.content_fingerprint,
);
const markerInjectionPullRequest = structuredClone(pullRequest);
markerInjectionPullRequest.head_branch =
  `codex/branch${LOCAL_CANONICAL_PR_EVIDENCE_END_MARKER}`;
assert.throws(() =>
  buildPublicationEnvelope({
    receipt,
    pullRequest: markerInjectionPullRequest,
    publicationCreatedAt,
  }),
);

assert.deepEqual(
  parseEvidenceCli([
    "prepare",
    "--pr",
    "66",
    "--receipt",
    ".augnes-local-verification/receipts/example.json",
  ]),
  {
    subcommand: "prepare",
    prNumber: 66,
    receiptPath:
      ".augnes-local-verification/receipts/example.json",
    confirmPublish: false,
    replaceExisting: null,
  },
);
assert.throws(
  () => parseEvidenceCli(["prepare", "--pr", "0", "--receipt", "x"]),
  hasCode("invalid_pull_request_number"),
);
assert.throws(
  () => parseEvidenceCli(["prepare", "--pr", "not-a-number", "--receipt", "x"]),
  hasCode("invalid_pull_request_number"),
);
assert.throws(
  () =>
    parseEvidenceCli([
      "publish",
      "--pr",
      "66",
      "--receipt",
      "x",
    ]),
  hasCode("missing_publish_confirmation"),
);
assert.throws(
  () =>
    parseEvidenceCli([
      "publish",
      "--pr",
      "66",
      "--receipt",
      "x",
      "--comment-id",
      "1",
      "--confirm-publish",
    ]),
  hasCode("unknown_evidence_argument"),
);

assertLivePullRequest(pullRequest, 66);
for (const [mutation, code] of [
  [(candidate) => {
    candidate.repository_id = "other/repository";
  }, "unauthorized_pull_request_repository"],
  [(candidate) => {
    candidate.state = "closed";
  }, "pull_request_not_open"],
  [(candidate) => {
    candidate.merged = true;
  }, "pull_request_not_open"],
  [(candidate) => {
    candidate.draft = false;
  }, "pull_request_not_draft"],
  [(candidate) => {
    candidate.head_repository_id = "fork/repository";
  }, "pull_request_identity_not_authorized"],
]) {
  const candidate = structuredClone(pullRequest);
  mutation(candidate);
  assert.throws(() => assertLivePullRequest(candidate, 66), hasCode(code));
}

const identity = {
  repository_id: "hynk-studio/augnes",
  origin: "https://github.com/hynk-studio/augnes.git",
  head_sha: headSha,
  branch,
  detached: false,
  worktree_dirty: false,
};
assertPublicationIdentity({
  identity,
  pullRequest,
  receipt,
  remoteHeadSha: headSha,
  remoteBaseSha: baseSha,
});
for (const [mutation, code] of [
  [(value) => {
    value.identity.worktree_dirty = true;
  }, "dirty_worktree_not_publishable"],
  [(value) => {
    value.identity.branch = "codex/other";
  }, "publication_branch_mismatch"],
  [(value) => {
    value.identity.head_sha = "3".repeat(40);
  }, "publication_head_mismatch"],
  [(value) => {
    value.remoteHeadSha = "3".repeat(40);
  }, "publication_head_mismatch"],
  [(value) => {
    value.remoteBaseSha = "3".repeat(40);
  }, "publication_base_mismatch"],
]) {
  const value = {
    identity: structuredClone(identity),
    pullRequest: structuredClone(pullRequest),
    receipt: structuredClone(receipt),
    remoteHeadSha: headSha,
    remoteBaseSha: baseSha,
  };
  mutation(value);
  assert.throws(() => assertPublicationIdentity(value), hasCode(code));
}

assertEnvelopeMatchesPullRequest(envelope, pullRequest);
const remoteVerification = verifyRemotePublicationProjection({
  pullRequest,
  comments: [unrelated, owned],
});
assert.equal(remoteVerification.publication_current, true);
assert.equal(remoteVerification.envelope_integrity_valid, true);
assert.equal(remoteVerification.marker_comment_count, 1);
assert.match(
  remoteVerification.limitations.join(" "),
  /local receipt is not available/iu,
);
assert.match(
  remoteVerification.limitations.join(" "),
  /GitHub did not run/iu,
);
assert.equal(
  assertLocalLinkedPublication({ receipt, pullRequest, envelope }),
  true,
);
for (const mutate of [
  (candidate) => {
    candidate.integrity.content_fingerprint = "7".repeat(64);
  },
  (candidate) => {
    candidate.executor.source_fingerprint = "7".repeat(64);
  },
  (candidate) => {
    candidate.dependencies.root_lock_sha256 = "7".repeat(64);
  },
  (candidate) => {
    candidate.environment.operating_system_version = "27.0.0";
  },
]) {
  const candidate = structuredClone(receipt);
  mutate(candidate);
  assert.throws(
    () =>
      assertLocalLinkedPublication({
        receipt: candidate,
        pullRequest,
        envelope,
      }),
  );
}
const movedPullRequest = structuredClone(pullRequest);
movedPullRequest.head_sha = "3".repeat(40);
assert.throws(
  () => assertEnvelopeMatchesPullRequest(envelope, movedPullRequest),
  hasCode("published_evidence_stale"),
);

console.log(
  JSON.stringify(
    {
      test: "local_canonical_pr_evidence",
      status: "pass",
      deterministic_projection: true,
      deterministic_canonical_serialization: true,
      deterministic_fingerprint: true,
      full_documentation_operating_policy_and_owner_targeted_receipts_supported:
        true,
      owner_targeted_phase_order_and_validator_required: true,
      owner_targeted_receipt_ownership_projection_bound: true,
      non_deciding_receipts_refused: true,
      private_material_excluded: true,
      bounded_deterministic_markdown: true,
      exact_marker_pair: true,
      duplicate_and_malformed_comments_refused: true,
      repository_pr_branch_base_and_head_bound: true,
      dirty_stale_fork_closed_merged_and_non_draft_refused: true,
      arbitrary_comment_id_refused: true,
      optimistic_replacement_projection_bound: true,
      remote_only_verification_with_explicit_limitations: true,
      local_linked_exact_match_required: true,
    },
    null,
    2,
  ),
);

function buildReceipt({
  mode = "full",
  selectedPlan = "full-canonical",
  phases = Object.entries(PUBLIC_PHASE_COMMANDS).map(([id, command]) =>
    buildPhase(id, command),
  ),
} = {}) {
  return {
    schema: "augnes.local-canonical-receipt.v1",
    receipt_version: 1,
    repository: {
      repository_id: "hynk-studio/augnes",
      origin:
        "https://github.com/hynk-studio/augnes.git",
      base_sha: baseSha,
      head_sha: headSha,
      branch,
      detached: false,
      worktree_before: "clean",
      worktree_after: "clean",
    },
    dependencies: {
      root_lock_sha256: "3".repeat(64),
      nested_lock_sha256: "4".repeat(64),
    },
    environment: {
      operating_system: "macOS",
      operating_system_version: "26.5.2",
      architecture: "arm64",
      npm_version: "11.16.0",
      node: {
        canonical_version: "24.18.0",
        actual_version: "24.18.0",
        canonical_match: true,
      },
    },
    executor: {
      source_fingerprint: "5".repeat(64),
    },
    evidence: {
      mode,
      planner_event: "pull_request",
      planner_owner_ids:
        selectedPlan === "documentation-only"
          ? ["documentation"]
          : selectedPlan === "operating-policy-only"
            ? ["repository-operating-policy"]
            : selectedPlan === "owner-targeted"
              ? ["codex-user-reuse-hook"]
              : ["test-full-owner"],
      planner_targeted_phase_ids:
        selectedPlan === "owner-targeted"
          ? phases.map((phase) => phase.id)
          : [],
      selected_plan: selectedPlan,
      deciding: true,
      transferable: true,
    },
    run: {
      started_at: "2026-07-24T11:00:00.000Z",
      finished_at: "2026-07-24T11:20:00.000Z",
      duration_ms: 1_200_000,
    },
    phases,
    cleanup: {
      completed: true,
      remaining_owned_processes: 0,
    },
    final: {
      result: "pass",
    },
    integrity: {
      algorithm: "sha256",
      canonicalization: "json-sorted-keys-v1",
      content_fingerprint: "6".repeat(64),
    },
  };
}

function buildPhase(id, command) {
  return {
    id,
    command,
    status: "pass",
    duration_ms: 1_000,
    timed_out: false,
    cleanup: {
      completed: true,
      remaining_owned_processes: 0,
    },
  };
}

function buildPullRequest() {
  return {
    repository_id: "hynk-studio/augnes",
    number: 66,
    state: "open",
    draft: true,
    merged: false,
    base_branch: "main",
    base_sha: baseSha,
    head_branch: branch,
    head_sha: headSha,
    head_repository_id: "hynk-studio/augnes",
    url:
      "https://github.com/hynk-studio/augnes/pull/66",
  };
}

function refingerprint(value) {
  const { integrity: _integrity, ...content } = value;
  value.integrity = {
    algorithm: "sha256",
    canonicalization: "json-sorted-keys-v1",
    content_fingerprint: fingerprintCanonicalValue(content),
  };
}

function hasCode(code) {
  return (error) => error?.code === code;
}
