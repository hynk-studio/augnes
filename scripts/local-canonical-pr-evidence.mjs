#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AUTHORIZED_ORIGIN_URL,
  AUTHORIZED_REPOSITORY_ID,
  collectRepositoryIdentity,
  ensureBoundedLocalDirectory,
} from "./local-canonical-environment.mjs";
import {
  canonicalSerialize,
  readReceiptFile,
} from "./local-canonical-receipt.mjs";
import {
  createGitHubTransport,
  assertPrNumber,
} from "./local-canonical-github-transport.mjs";
import {
  assertValidPublicationEnvelope,
  buildPublicationEnvelope,
  discoverPublicationComments,
  renderPublicationComment,
  sha256Text,
} from "./local-canonical-pr-evidence-envelope.mjs";
import {
  validateReceiptAgainstCurrentRepository,
} from "./run-local-canonical-verification.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const artifactRoot = path.join(
  repositoryRoot,
  ".augnes-local-verification",
);
const publicationRoot = path.join(artifactRoot, "publications");
const RECEIPT_DIRECTORY = path.join(artifactRoot, "receipts");
const MAX_LOCAL_PUBLICATION_RECORD_BYTES = 64 * 1024;
const PREPARATION_RETENTION = 20;
const RECORD_RETENTION = 40;

export function parseEvidenceCli(argv) {
  if (!Array.isArray(argv) || argv.length === 0) {
    throw evidenceCliError(
      "missing_evidence_subcommand",
      "evidence command requires prepare, publish, or verify",
    );
  }
  const subcommand = argv[0];
  if (!["prepare", "publish", "verify"].includes(subcommand)) {
    throw evidenceCliError(
      "invalid_evidence_subcommand",
      "evidence command requires prepare, publish, or verify",
    );
  }
  const values = new Map();
  const flags = new Set();
  for (let index = 1; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key?.startsWith("--")) {
      throw evidenceCliError(
        "invalid_evidence_argument",
        "evidence arguments must use explicit flags",
      );
    }
    const normalized = key.slice(2);
    if (values.has(normalized) || flags.has(normalized)) {
      throw evidenceCliError(
        "duplicate_evidence_argument",
        "evidence argument was provided more than once",
      );
    }
    if (normalized === "confirm-publish") {
      flags.add(normalized);
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw evidenceCliError(
        "missing_evidence_argument_value",
        "evidence argument requires a value",
      );
    }
    values.set(normalized, value);
    index += 1;
  }
  const allowed = {
    prepare: new Set(["pr", "receipt"]),
    publish: new Set(["pr", "receipt", "replace-existing"]),
    verify: new Set(["pr", "receipt"]),
  }[subcommand];
  for (const key of values.keys()) {
    if (!allowed.has(key)) {
      throw evidenceCliError(
        "unknown_evidence_argument",
        "unknown evidence argument",
      );
    }
  }
  if (flags.size > 0 && subcommand !== "publish") {
    throw evidenceCliError(
      "unexpected_publish_confirmation",
      "publish confirmation is valid only for publish",
    );
  }
  const rawPr = values.get("pr");
  if (!rawPr || !/^[1-9][0-9]*$/u.test(rawPr)) {
    throw evidenceCliError(
      "invalid_pull_request_number",
      "pull request number must be a positive integer",
    );
  }
  const prNumber = Number(rawPr);
  assertPrNumber(prNumber);
  if (
    ["prepare", "publish"].includes(subcommand) &&
    !values.get("receipt")
  ) {
    throw evidenceCliError(
      "missing_receipt_argument",
      `${subcommand} requires --receipt`,
    );
  }
  if (subcommand === "publish" && !flags.has("confirm-publish")) {
    throw evidenceCliError(
      "missing_publish_confirmation",
      "publish requires --confirm-publish",
    );
  }
  const replaceExisting = values.get("replace-existing") ?? null;
  if (
    replaceExisting !== null &&
    !/^[0-9a-f]{64}$/u.test(replaceExisting)
  ) {
    throw evidenceCliError(
      "invalid_replacement_fingerprint",
      "replacement authority requires an exact prior SHA-256 fingerprint",
    );
  }
  return {
    subcommand,
    prNumber,
    receiptPath: values.get("receipt") ?? null,
    confirmPublish: flags.has("confirm-publish"),
    replaceExisting,
  };
}

export async function runEvidenceCommand(
  command,
  {
    transport = createGitHubTransport(),
    now = () => new Date().toISOString(),
    writeArtifacts = true,
  } = {},
) {
  assertCommandShape(command);
  if (command.subcommand === "prepare") {
    return prepareEvidence(command, { transport, now, writeArtifacts });
  }
  if (command.subcommand === "publish") {
    return publishEvidence(command, { transport, now, writeArtifacts });
  }
  return verifyEvidence(command, { transport, now, writeArtifacts });
}

export async function prepareEvidence(
  command,
  { transport, now, writeArtifacts = true },
) {
  const context = await validateLocalPublicationContext(command, transport);
  const prepared = loadOrCreatePreparation({
    context,
    publicationCreatedAt: now(),
    writeArtifacts,
  });
  return {
    action: "prepared",
    repository: AUTHORIZED_REPOSITORY_ID,
    pr_number: command.prNumber,
    base_sha: context.pullRequest.base_sha,
    head_sha: context.pullRequest.head_sha,
    head_branch: context.pullRequest.head_branch,
    receipt_fingerprint: context.receipt.integrity.content_fingerprint,
    publication_fingerprint:
      prepared.envelope.integrity.content_fingerprint,
    envelope_path: prepared.envelopeRelativePath,
    preview_path: prepared.previewRelativePath,
    github_write_performed: false,
  };
}

export async function publishEvidence(
  command,
  { transport, now, writeArtifacts = true },
) {
  if (command.confirmPublish !== true) {
    throw evidenceCliError(
      "missing_publish_confirmation",
      "publish requires --confirm-publish",
    );
  }
  const context = await validateLocalPublicationContext(command, transport);
  let prepared = loadOrCreatePreparation({
    context,
    publicationCreatedAt: now(),
    writeArtifacts,
  });
  const reconciliation = await reconcilePublicationComment({
    prNumber: command.prNumber,
    replaceExisting: command.replaceExisting,
    prepared,
    context,
    transport,
    now,
    writeArtifacts,
  });
  prepared = reconciliation.prepared;
  const {
    action,
    confirmed,
    confirmedPublication,
    beforeHash,
    beforeUpdatedAt,
  } = reconciliation;
  const record = {
    schema: "augnes.local-canonical-pr-publication-record.v1",
    version: 1,
    target_repository: AUTHORIZED_REPOSITORY_ID,
    pr_number: command.prNumber,
    base_sha: context.pullRequest.base_sha,
    head_sha: context.pullRequest.head_sha,
    head_branch: context.pullRequest.head_branch,
    comment_id: confirmed.id,
    comment_url: confirmed.url,
    action,
    receipt_fingerprint: context.receipt.integrity.content_fingerprint,
    publication_fingerprint:
      prepared.envelope.integrity.content_fingerprint,
    prior_publication_fingerprint:
      prepared.envelope.publication.superseded_publication_fingerprint,
    remote_body_hash_before: beforeHash,
    remote_body_hash_after: confirmedPublication.body_hash,
    remote_updated_at_before: beforeUpdatedAt,
    remote_updated_at_after: confirmed.updated_at,
    recorded_at: now(),
    transport_result: action === "idempotent_noop" ? "no_write" : "confirmed",
    marker_comment_count: 1,
  };
  const recordRelativePath = writeArtifacts
    ? writePublicationRecord(record)
    : null;
  return {
    action,
    repository: AUTHORIZED_REPOSITORY_ID,
    pr_number: command.prNumber,
    base_sha: context.pullRequest.base_sha,
    head_sha: context.pullRequest.head_sha,
    receipt_fingerprint: context.receipt.integrity.content_fingerprint,
    publication_fingerprint:
      prepared.envelope.integrity.content_fingerprint,
    comment_id: confirmed.id,
    comment_url: confirmed.url,
    remote_body_hash: confirmedPublication.body_hash,
    remote_updated_at: confirmed.updated_at,
    marker_comment_count: 1,
    github_write_performed: action !== "idempotent_noop",
    record_path: recordRelativePath,
  };
}

export async function reconcilePublicationComment({
  prNumber,
  replaceExisting,
  prepared: initialPrepared,
  context,
  transport,
  now,
  writeArtifacts = true,
}) {
  let prepared = initialPrepared;
  const comments = await transport.listPullRequestComments(prNumber);
  const existing = discoverPublicationComments(comments);
  let action;
  let comment;
  let beforeHash = null;
  let beforeUpdatedAt = null;

  if (!existing) {
    if (replaceExisting !== null) {
      throw evidenceCliError(
        "replacement_target_missing",
        "replacement authority was provided but no marker comment exists",
      );
    }
    const freshComments = await transport.listPullRequestComments(prNumber);
    if (discoverPublicationComments(freshComments) !== null) {
      throw evidenceCliError(
        "publication_comment_changed_before_create",
        "publication comment inventory changed before create",
      );
    }
    comment = await transport.createIssueComment(prNumber, prepared.body);
    action = "created";
  } else if (
    existing.envelope.integrity.content_fingerprint ===
    prepared.envelope.integrity.content_fingerprint
  ) {
    if (
      replaceExisting !== null &&
      replaceExisting !==
        existing.envelope.integrity.content_fingerprint
    ) {
      throw evidenceCliError(
        "replacement_fingerprint_mismatch",
        "replacement fingerprint does not match the current publication",
      );
    }
    beforeHash = existing.body_hash;
    beforeUpdatedAt = existing.comment.updated_at;
    const fresh = await transport.fetchIssueComment(existing.comment.id);
    const freshPublication = discoverPublicationComments([fresh]);
    if (
      !freshPublication ||
      fresh.id !== existing.comment.id ||
      freshPublication.body_hash !== beforeHash ||
      fresh.updated_at !== beforeUpdatedAt ||
      freshPublication.envelope.integrity.content_fingerprint !==
        existing.envelope.integrity.content_fingerprint
    ) {
      throw evidenceCliError(
        "publication_comment_changed_before_noop",
        "publication comment changed before idempotence confirmation",
      );
    }
    action = "idempotent_noop";
    comment = fresh;
  } else {
    if (
      replaceExisting === null ||
      replaceExisting !==
        existing.envelope.integrity.content_fingerprint
    ) {
      throw evidenceCliError(
        "replacement_authority_required",
        "different publication requires the exact prior fingerprint",
      );
    }
    beforeHash = existing.body_hash;
    beforeUpdatedAt = existing.comment.updated_at;
    prepared = createReplacementPreparation({
      context,
      publicationCreatedAt: now(),
      supersededPublicationFingerprint: replaceExisting,
      writeArtifacts,
    });
    const fresh = await transport.fetchIssueComment(existing.comment.id);
    const freshPublication = discoverPublicationComments([fresh]);
    if (
      !freshPublication ||
      fresh.id !== existing.comment.id ||
      freshPublication.body_hash !== beforeHash ||
      freshPublication.envelope.integrity.content_fingerprint !==
        replaceExisting
    ) {
      throw evidenceCliError(
        "publication_comment_changed_before_update",
        "publication comment changed before optimistic replacement",
      );
    }
    comment = await transport.updateIssueComment(
      existing.comment.id,
      prepared.body,
    );
    action = "updated";
  }

  const confirmed = await transport.fetchIssueComment(comment.id);
  const confirmedPublication = discoverPublicationComments([confirmed]);
  if (
    !confirmedPublication ||
    confirmed.id !== comment.id ||
    confirmed.body !== prepared.body ||
    confirmedPublication.envelope.integrity.content_fingerprint !==
      prepared.envelope.integrity.content_fingerprint
  ) {
    throw evidenceCliError(
      "publication_write_confirmation_failed",
      "remote publication did not match the exact prepared evidence",
    );
  }
  if (
    action === "idempotent_noop" &&
    (confirmedPublication.body_hash !== beforeHash ||
      confirmed.updated_at !== beforeUpdatedAt)
  ) {
    throw evidenceCliError(
      "idempotent_noop_remote_state_changed",
      "remote state changed during the idempotent no-op",
    );
  }
  const finalComments = await transport.listPullRequestComments(prNumber);
  const finalPublication = discoverPublicationComments(finalComments);
  if (
    !finalPublication ||
    finalPublication.comment.id !== confirmed.id ||
    finalPublication.envelope.integrity.content_fingerprint !==
      prepared.envelope.integrity.content_fingerprint
  ) {
    throw evidenceCliError(
      "publication_inventory_confirmation_failed",
      "final marker comment inventory did not contain exactly one publication",
    );
  }
  return {
    action,
    prepared,
    confirmed,
    confirmedPublication,
    beforeHash,
    beforeUpdatedAt,
  };
}

export async function verifyEvidence(
  command,
  { transport, now, writeArtifacts = true },
) {
  collectRepositoryIdentity(repositoryRoot);
  const pullRequest = await transport.fetchPullRequest(command.prNumber);
  assertLivePullRequest(pullRequest, command.prNumber);
  const comments = await transport.listPullRequestComments(command.prNumber);
  const { publication, ...remoteResult } =
    verifyRemotePublicationProjection({ pullRequest, comments });
  let localLinkedMatch = null;
  if (command.receiptPath !== null) {
    const context = await validateLocalPublicationContext(command, transport, {
      existingPullRequest: pullRequest,
    });
    assertLocalLinkedPublication({
      receipt: context.receipt,
      pullRequest,
      envelope: publication.envelope,
    });
    localLinkedMatch = true;
  }
  const record = {
    schema: "augnes.local-canonical-pr-publication-verification.v1",
    version: 1,
    target_repository: AUTHORIZED_REPOSITORY_ID,
    pr_number: command.prNumber,
    base_sha: pullRequest.base_sha,
    head_sha: pullRequest.head_sha,
    head_branch: pullRequest.head_branch,
    comment_id: publication.comment.id,
    comment_url: publication.comment.url,
    receipt_fingerprint:
      publication.envelope.receipt.content_fingerprint,
    publication_fingerprint:
      publication.envelope.integrity.content_fingerprint,
    remote_body_hash: publication.body_hash,
    publication_current: true,
    local_linked_match: localLinkedMatch,
    verified_at: now(),
    limitations: remoteResult.limitations,
  };
  const recordRelativePath = writeArtifacts
    ? writePublicationRecord(record)
    : null;
  return {
    action: command.receiptPath === null
      ? "verified_remote_only"
      : "verified_local_linked",
    repository: AUTHORIZED_REPOSITORY_ID,
    pr_number: command.prNumber,
    base_sha: pullRequest.base_sha,
    head_sha: pullRequest.head_sha,
    comment_id: publication.comment.id,
    comment_url: publication.comment.url,
    receipt_fingerprint:
      publication.envelope.receipt.content_fingerprint,
    publication_fingerprint:
      publication.envelope.integrity.content_fingerprint,
    ...remoteResult,
    local_linked_match: localLinkedMatch,
    record_path: recordRelativePath,
    github_write_performed: false,
  };
}

export function verifyRemotePublicationProjection({
  pullRequest,
  comments,
}) {
  const publication = discoverPublicationComments(comments);
  if (!publication) {
    throw evidenceCliError(
      "publication_comment_missing",
      "no Local Canonical evidence comment exists",
    );
  }
  assertEnvelopeMatchesPullRequest(publication.envelope, pullRequest);
  return {
    publication,
    publication_current: true,
    envelope_integrity_valid: true,
    marker_structure_valid: true,
    marker_comment_count: 1,
    limitations: [
      "underlying local receipt is not available in remote-only verification",
      "receipt fingerprint links only to a claimed local artifact",
      "executor, lockfiles, environment, and omitted receipt fields were not independently recomputed",
      "GitHub did not run the verification",
      "comment write authority is not a cryptographic signing identity",
    ],
  };
}

export function assertLocalLinkedPublication({
  receipt,
  pullRequest,
  envelope,
}) {
  const expected = buildPublicationEnvelope({
    receipt,
    pullRequest,
    publicationCreatedAt: envelope.publication.created_at,
    supersededPublicationFingerprint:
      envelope.publication.superseded_publication_fingerprint,
  });
  if (
    canonicalSerialize(expected) !== canonicalSerialize(envelope) ||
    receipt.integrity.content_fingerprint !==
      envelope.receipt.content_fingerprint
  ) {
    throw evidenceCliError(
      "local_linked_publication_mismatch",
      "published projection does not exactly match the local receipt",
    );
  }
  return true;
}

export function assertLivePullRequest(pullRequest, expectedPrNumber) {
  if (
    pullRequest.repository_id !== AUTHORIZED_REPOSITORY_ID ||
    pullRequest.number !== expectedPrNumber
  ) {
    throw evidenceCliError(
      "unauthorized_pull_request_repository",
      "pull request is not in the authorized repository",
    );
  }
  if (pullRequest.state !== "open" || pullRequest.merged === true) {
    throw evidenceCliError(
      "pull_request_not_open",
      "publication requires an open, unmerged pull request",
    );
  }
  if (pullRequest.draft !== true) {
    throw evidenceCliError(
      "pull_request_not_draft",
      "publication requires the current task Draft PR",
    );
  }
  if (
    pullRequest.base_branch !== "main" ||
    pullRequest.head_repository_id !== AUTHORIZED_REPOSITORY_ID
  ) {
    throw evidenceCliError(
      "pull_request_identity_not_authorized",
      "pull request base or head repository is not authorized",
    );
  }
}

export function assertPublicationIdentity({
  identity,
  pullRequest,
  receipt,
  remoteHeadSha,
  remoteBaseSha,
}) {
  if (identity.worktree_dirty) {
    throw evidenceCliError(
      "dirty_worktree_not_publishable",
      "publication requires a clean exact-head worktree",
    );
  }
  if (identity.detached || identity.branch !== pullRequest.head_branch) {
    throw evidenceCliError(
      "publication_branch_mismatch",
      "local branch does not match the pull request head branch",
    );
  }
  if (
    identity.head_sha !== pullRequest.head_sha ||
    identity.head_sha !== receipt.repository.head_sha ||
    remoteHeadSha !== identity.head_sha
  ) {
    throw evidenceCliError(
      "publication_head_mismatch",
      "local, remote, pull request, and receipt head SHAs must match",
    );
  }
  if (
    pullRequest.base_sha !== receipt.repository.base_sha ||
    remoteBaseSha !== pullRequest.base_sha
  ) {
    throw evidenceCliError(
      "publication_base_mismatch",
      "live main, pull request, and receipt base SHAs must match",
    );
  }
  if (
    receipt.repository.branch !== identity.branch ||
    receipt.repository.origin !== AUTHORIZED_ORIGIN_URL ||
    receipt.repository.repository_id !== AUTHORIZED_REPOSITORY_ID
  ) {
    throw evidenceCliError(
      "publication_receipt_repository_mismatch",
      "receipt repository identity does not match the current repository",
    );
  }
}

export function assertEnvelopeMatchesPullRequest(envelope, pullRequest) {
  assertValidPublicationEnvelope(envelope);
  if (
    envelope.repository.repository_id !== pullRequest.repository_id ||
    envelope.repository.pr_number !== pullRequest.number ||
    envelope.repository.base_sha !== pullRequest.base_sha ||
    envelope.repository.head_sha !== pullRequest.head_sha ||
    envelope.repository.head_branch !== pullRequest.head_branch
  ) {
    throw evidenceCliError(
      "published_evidence_stale",
      "published evidence does not match the live pull request identity",
    );
  }
}

async function validateLocalPublicationContext(
  command,
  transport,
  { existingPullRequest = null } = {},
) {
  const identity = collectRepositoryIdentity(repositoryRoot);
  const receiptRelativePath = resolveReceiptPath(command.receiptPath);
  const receipt = readReceiptFile(
    path.join(repositoryRoot, receiptRelativePath),
  );
  const inspection =
    validateReceiptAgainstCurrentRepository(receiptRelativePath);
  if (inspection.valid_deciding_evidence !== true) {
    const error = evidenceCliError(
      "receipt_not_current_deciding_evidence",
      "receipt validator rejected publication eligibility",
    );
    error.reason_codes = inspection.reason_codes;
    throw error;
  }
  const pullRequest =
    existingPullRequest ??
    (await transport.fetchPullRequest(command.prNumber));
  assertLivePullRequest(pullRequest, command.prNumber);
  const remoteHeadSha = resolveRemoteBranchSha(pullRequest.head_branch);
  const remoteBaseSha = resolveRemoteBranchSha("main");
  assertPublicationIdentity({
    identity,
    pullRequest,
    receipt,
    remoteHeadSha,
    remoteBaseSha,
  });
  return {
    identity,
    receipt,
    receiptRelativePath,
    inspection,
    pullRequest,
  };
}

function loadOrCreatePreparation({
  context,
  publicationCreatedAt,
  writeArtifacts,
}) {
  const receiptFingerprint =
    context.receipt.integrity.content_fingerprint;
  const baseName =
    `prepared-pr-${context.pullRequest.number}-${receiptFingerprint}`;
  const envelopeRelativePath = path.posix.join(
    ".augnes-local-verification",
    "publications",
    `${baseName}.json`,
  );
  const previewRelativePath = path.posix.join(
    ".augnes-local-verification",
    "publications",
    `${baseName}.md`,
  );
  const envelopePath = path.join(repositoryRoot, envelopeRelativePath);
  let envelope;
  if (existsSync(envelopePath)) {
    assertSafeOwnedFile(envelopePath);
    envelope = JSON.parse(readFileSync(envelopePath, "utf8"));
    assertValidPublicationEnvelope(envelope);
    const expected = buildPublicationEnvelope({
      receipt: context.receipt,
      pullRequest: context.pullRequest,
      publicationCreatedAt: envelope.publication.created_at,
      supersededPublicationFingerprint: null,
    });
    if (canonicalSerialize(expected) !== canonicalSerialize(envelope)) {
      throw evidenceCliError(
        "stale_local_preparation",
        "existing local preparation does not match current evidence",
      );
    }
  } else {
    envelope = buildPublicationEnvelope({
      receipt: context.receipt,
      pullRequest: context.pullRequest,
      publicationCreatedAt,
      supersededPublicationFingerprint: null,
    });
  }
  const body = renderPublicationComment(envelope);
  if (writeArtifacts) {
    writeStableOwnedFile(
      envelopeRelativePath,
      `${canonicalSerialize(envelope)}\n`,
    );
    writeStableOwnedFile(previewRelativePath, `${body}\n`);
    pruneOwnedFiles(/^prepared-pr-[0-9]+-[0-9a-f]{64}\.(json|md)$/u, PREPARATION_RETENTION * 2);
  }
  return {
    envelope,
    body,
    envelopeRelativePath: writeArtifacts ? envelopeRelativePath : null,
    previewRelativePath: writeArtifacts ? previewRelativePath : null,
  };
}

function createReplacementPreparation({
  context,
  publicationCreatedAt,
  supersededPublicationFingerprint,
  writeArtifacts,
}) {
  const envelope = buildPublicationEnvelope({
    receipt: context.receipt,
    pullRequest: context.pullRequest,
    publicationCreatedAt,
    supersededPublicationFingerprint,
  });
  const body = renderPublicationComment(envelope);
  if (writeArtifacts) {
    const baseName =
      `replacement-pr-${context.pullRequest.number}-${envelope.integrity.content_fingerprint}`;
    writeStableOwnedFile(
      path.posix.join(
        ".augnes-local-verification",
        "publications",
        `${baseName}.json`,
      ),
      `${canonicalSerialize(envelope)}\n`,
    );
    writeStableOwnedFile(
      path.posix.join(
        ".augnes-local-verification",
        "publications",
        `${baseName}.md`,
      ),
      `${body}\n`,
    );
    pruneOwnedFiles(/^replacement-pr-[0-9]+-[0-9a-f]{64}\.(json|md)$/u, PREPARATION_RETENTION * 2);
  }
  return { envelope, body };
}

function resolveReceiptPath(input) {
  if (
    typeof input !== "string" ||
    input.length === 0 ||
    path.isAbsolute(input) ||
    input.includes("\0")
  ) {
    throw evidenceCliError(
      "unsafe_receipt_path",
      "receipt path must be repository-relative",
    );
  }
  const absolute = path.resolve(repositoryRoot, input);
  const relativeToReceipts = path.relative(RECEIPT_DIRECTORY, absolute);
  if (
    relativeToReceipts === "" ||
    relativeToReceipts === ".." ||
    relativeToReceipts.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToReceipts) ||
    !relativeToReceipts.endsWith(".json")
  ) {
    throw evidenceCliError(
      "unsafe_receipt_path",
      "receipt must be a JSON file in the bounded receipt directory",
    );
  }
  assertSafeOwnedFile(absolute);
  return path.relative(repositoryRoot, absolute).split(path.sep).join("/");
}

function resolveRemoteBranchSha(branch) {
  if (
    typeof branch !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,200}$/u.test(branch) ||
    branch.includes("..") ||
    branch.includes("@{")
  ) {
    throw evidenceCliError(
      "unsafe_remote_branch",
      "remote branch identity is invalid",
    );
  }
  const result = spawnSync(
    "git",
    ["ls-remote", "--exit-code", "--heads", "origin", `refs/heads/${branch}`],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      timeout: 30_000,
      maxBuffer: 64 * 1024,
      windowsHide: true,
      shell: false,
    },
  );
  if (result.error || result.status !== 0) {
    throw evidenceCliError(
      "remote_branch_identity_unavailable",
      "remote branch identity could not be proven",
    );
  }
  const lines = result.stdout.trim().split(/\r?\n/u).filter(Boolean);
  if (lines.length !== 1) {
    throw evidenceCliError(
      "remote_branch_identity_ambiguous",
      "remote branch identity is absent or ambiguous",
    );
  }
  const match = lines[0].match(
    /^([0-9a-f]{40})\trefs\/heads\/(.+)$/u,
  );
  if (!match || match[2] !== branch) {
    throw evidenceCliError(
      "remote_branch_identity_invalid",
      "remote branch response did not match the requested branch",
    );
  }
  return match[1];
}

function writePublicationRecord(record) {
  const content = `${canonicalSerialize(record)}\n`;
  if (
    Buffer.byteLength(content, "utf8") >
    MAX_LOCAL_PUBLICATION_RECORD_BYTES
  ) {
    throw evidenceCliError(
      "local_publication_record_too_large",
      "local publication record exceeds its byte bound",
    );
  }
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  const suffix = sha256Text(content).slice(0, 16);
  const relativePath = path.posix.join(
    ".augnes-local-verification",
    "publications",
    `record-${timestamp}-${suffix}.json`,
  );
  writeStableOwnedFile(relativePath, content);
  pruneOwnedFiles(/^record-.*\.json$/u, RECORD_RETENTION);
  return relativePath;
}

function writeStableOwnedFile(relativePath, content) {
  ensureBoundedLocalDirectory(repositoryRoot, publicationRoot);
  const absolute = path.resolve(repositoryRoot, relativePath);
  const relative = path.relative(publicationRoot, absolute);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw evidenceCliError(
      "unsafe_publication_artifact_path",
      "publication artifact path escapes its bounded directory",
    );
  }
  if (
    Buffer.byteLength(content, "utf8") >
    MAX_LOCAL_PUBLICATION_RECORD_BYTES
  ) {
    throw evidenceCliError(
      "local_publication_artifact_too_large",
      "publication artifact exceeds its byte bound",
    );
  }
  if (existsSync(absolute)) {
    assertSafeOwnedFile(absolute);
    if (readFileSync(absolute, "utf8") !== content) {
      throw evidenceCliError(
        "local_publication_artifact_collision",
        "existing publication artifact content differs",
      );
    }
    return;
  }
  const descriptor = openSync(absolute, "wx", 0o600);
  try {
    writeFileSync(descriptor, content, "utf8");
  } finally {
    closeSync(descriptor);
  }
}

function pruneOwnedFiles(pattern, retain) {
  ensureBoundedLocalDirectory(repositoryRoot, publicationRoot);
  const files = readdirSync(publicationRoot)
    .filter((name) => pattern.test(name))
    .map((name) => {
      const absolute = path.join(publicationRoot, name);
      assertSafeOwnedFile(absolute);
      return { absolute, name, mtimeMs: lstatSync(absolute).mtimeMs };
    })
    .sort((left, right) =>
      right.mtimeMs - left.mtimeMs || right.name.localeCompare(left.name),
    );
  for (const entry of files.slice(retain)) unlinkSync(entry.absolute);
}

function assertSafeOwnedFile(filePath) {
  const absolute = path.resolve(filePath);
  const relative = path.relative(artifactRoot, absolute);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative) ||
    !existsSync(absolute)
  ) {
    throw evidenceCliError(
      "unsafe_local_evidence_file",
      "local evidence file escapes its bounded directory",
    );
  }
  const stats = lstatSync(absolute);
  if (
    !stats.isFile() ||
    stats.isSymbolicLink() ||
    realpathSync(absolute) !== absolute
  ) {
    throw evidenceCliError(
      "unsafe_local_evidence_file",
      "local evidence path must be a real file",
    );
  }
}

function assertCommandShape(command) {
  if (
    !command ||
    !["prepare", "publish", "verify"].includes(command.subcommand) ||
    !Number.isSafeInteger(command.prNumber) ||
    command.prNumber <= 0
  ) {
    throw evidenceCliError(
      "invalid_evidence_command",
      "evidence command is invalid",
    );
  }
}

function evidenceCliError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function safeErrorCode(error) {
  return typeof error?.code === "string" &&
    /^[a-zA-Z0-9_.-]{1,80}$/u.test(error.code)
    ? error.code
    : "local_canonical_evidence_failure";
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const command = parseEvidenceCli(process.argv.slice(2));
    const result = await runEvidenceCommand(command);
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(
      `[local-canonical-evidence] fatal code=${safeErrorCode(error)} message=${error instanceof Error ? error.message : "unknown failure"}`,
    );
    process.exitCode = 1;
  }
}
