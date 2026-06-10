import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const packageFile = "package.json";
const helperFile = "scripts/perspective-codex-former-capture-helper.mjs";
const smokeFile = "scripts/smoke-perspective-codex-former-capture-helper.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_WORKFLOW_V0_1.md";
const reportFile =
  "reports/2026-06-10-perspective-codex-former-capture-helper.md";
const manualWorkflowDocsSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-workflow-docs.mjs";
const manualCopyPacketSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs";
const separateSessionPrepSmokeFile =
  "scripts/smoke-perspective-codex-former-separate-session-capture-packet-prep.mjs";
const separateSessionCaptureSmokeFile =
  "scripts/smoke-perspective-codex-former-separate-session-provenance-clean-capture.mjs";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const tmpDir = "/tmp/augnes-codex-former-capture-helper-smoke";
const promptPath = join(tmpDir, "codex-former-copyable-prompt.txt");
const envelopeTemplatePath = join(
  tmpDir,
  "codex-former-capture-return-envelope-template.txt",
);
const metadataPath = join(tmpDir, "codex-former-capture-metadata.json");
const positiveEnvelopePath = join(tmpDir, "returned-envelope.txt");
const positiveSummaryPath = join(tmpDir, "validation-summary.json");
const missingProvenanceEnvelopePath = join(
  tmpDir,
  "missing-provenance-envelope.txt",
);
const mismatchEnvelopePath = join(tmpDir, "mismatched-provenance-envelope.txt");

const allowedChangedFiles = new Set([
  packageFile,
  helperFile,
  smokeFile,
  docFile,
  reportFile,
  manualWorkflowDocsSmokeFile,
  manualCopyPacketSmokeFile,
  separateSessionPrepSmokeFile,
  separateSessionCaptureSmokeFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const helperText = readFileSync(helperFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");

assertPackageScripts();
assertHelperSourceBoundary();
assertDocsAndReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertChangedFileBoundary();
runPrepareMode();
runValidateMode();
runNegativeValidationCases();

console.log("PASS smoke:perspective-codex-former-capture-helper");

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts["perspective:codex-former:capture-packet"],
    `${expectedTsxCommand} ${helperFile} prepare`,
    "package.json must register the prepare helper command",
  );
  assert.equal(
    packageJson.scripts["perspective:codex-former:validate-capture"],
    `${expectedTsxCommand} ${helperFile} validate`,
    "package.json must register the validate helper command",
  );
  assert.equal(
    packageJson.scripts["smoke:perspective-codex-former-capture-helper"],
    `${expectedTsxCommand} ${smokeFile}`,
    "package.json must register the capture helper smoke",
  );
}

function runPrepareMode() {
  rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(tmpDir, { recursive: true });
  const stdout = execFileSync(
    "npm",
    [
      "run",
      "perspective:codex-former:capture-packet",
      "--",
      "--out-dir",
      tmpDir,
      "--generated-at",
      "2026-06-10T00:00:00.000Z",
    ],
    { encoding: "utf8" },
  );

  assertContainsAll(stdout, [
    "mode=prepare",
    "source_manual_copy_packet_id=",
    "source_former_input_packet_id=",
    "source_prompt_hash=",
    `copyable_prompt_path=${promptPath}`,
    `capture_return_envelope_template_path=${envelopeTemplatePath}`,
    `metadata_path=${metadataPath}`,
  ]);
  assert.equal(existsSync(promptPath), true, "prepare must write prompt file");
  assert.equal(
    existsSync(envelopeTemplatePath),
    true,
    "prepare must write return envelope template",
  );
  assert.equal(
    existsSync(metadataPath),
    true,
    "prepare must write metadata file",
  );

  const prompt = readFileSync(promptPath, "utf8");
  const envelopeTemplate = readFileSync(envelopeTemplatePath, "utf8");
  const metadata = readMetadata();

  assertContainsAll(prompt, [
    "Prompt contract: CodexPerspectiveFormerDraftPromptContract v0.1",
    "Return JSON only.",
    "source_former_input_packet must match the former input packet ref above.",
  ]);
  assert.equal(
    prompt.includes("Use the PR #479 prompt contract below."),
    false,
    "prepare prompt must not include stale PR #479 wording",
  );
  assertContainsAll(envelopeTemplate, [
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "capture_method: human_manual",
    "codex_surface_label: separate user-started Codex session",
    "prompt_was_generated_by_manual_copy_packet: true",
    "source_manual_copy_packet_id:",
    "source_former_input_packet_id:",
    "source_prompt_hash:",
    "RETURNED_CODEX_RESPONSE:",
    "END RETURNED_CODEX_RESPONSE",
  ]);

  assert.equal(
    hasText(metadata.source_manual_copy_packet_id),
    true,
    "metadata must include packet id",
  );
  assert.equal(
    hasText(metadata.source_former_input_packet_id),
    true,
    "metadata must include former input packet id",
  );
  assert.equal(
    hasText(metadata.source_prompt_hash),
    true,
    "metadata must include prompt hash",
  );
  for (const value of [
    metadata.source_manual_copy_packet_id,
    metadata.source_former_input_packet_id,
    metadata.source_prompt_hash,
  ]) {
    assert.notEqual(value, "not_supplied_in_chat");
  }
  assert.equal(
    metadata.source_former_input_packet.packet_id,
    metadata.source_former_input_packet_id,
  );
  assert.equal(
    metadata.authority_boundary.accepted_augnes_state,
    false,
    "helper metadata must not claim accepted Augnes state",
  );
}

function runValidateMode() {
  const metadata = readMetadata();
  const envelope = buildReturnedEnvelope({
    metadata,
    candidate: buildNeedsReviewCandidate(metadata),
  });
  writeFileSync(positiveEnvelopePath, envelope, "utf8");

  const stdout = execFileSync(
    "npm",
    [
      "run",
      "perspective:codex-former:validate-capture",
      "--",
      "--envelope",
      positiveEnvelopePath,
      "--metadata",
      metadataPath,
      "--summary-out",
      positiveSummaryPath,
    ],
    { encoding: "utf8" },
  );
  const summary = JSON.parse(readFileSync(positiveSummaryPath, "utf8"));

  assertContainsAll(stdout, [
    "mode=validate",
    "conclusion=PASS with follow-up",
    "provenance_status=complete",
    "metadata_match=true",
    "candidate_count=1",
    "contract_fit_status=needs_review",
    "direct_validation_status=needs_review",
    "candidate_compatible_material=true",
    "candidate_authority=non_committed",
    "candidate_basis_quality=needs_review",
    "alignment_counted_as_direct_success=false",
    "worker_guidance_advisory_only=true",
    "unknown_pointer_ref",
  ]);
  assert.equal(summary.conclusion, "PASS with follow-up");
  assert.equal(summary.provenance_status, "complete");
  assert.equal(summary.metadata_match, true);
  assert.equal(summary.extraction.candidate_count, 1);
  assert.equal(summary.direct_validation.candidate_compatible_material, true);
  assert.equal(
    summary.pointer_warning_summary.some((warning) =>
      warning.includes("unknown_pointer_ref"),
    ),
    true,
    "validate mode must surface unknown pointer warnings",
  );
  assert.equal(summary.authority_flags_all_false, true);
  assert.equal(summary.unsafe_material_detected, false);
}

function runNegativeValidationCases() {
  const metadata = readMetadata();
  const candidate = buildNeedsReviewCandidate(metadata);
  writeFileSync(
    missingProvenanceEnvelopePath,
    buildReturnedEnvelope({
      metadata,
      candidate,
      omitPromptHash: true,
    }),
    "utf8",
  );
  const missingOutput = expectCommandFailure([
    "run",
    "perspective:codex-former:validate-capture",
    "--",
    "--envelope",
    missingProvenanceEnvelopePath,
    "--metadata",
    metadataPath,
  ]);
  assertContainsAll(missingOutput, [
    "conclusion=BLOCKED with useful findings",
    "provenance_status=blocked",
    "missing provenance fields: source_prompt_hash",
  ]);

  writeFileSync(
    mismatchEnvelopePath,
    buildReturnedEnvelope({
      metadata,
      candidate,
      sourcePromptHash: "mismatched-prompt-hash",
    }),
    "utf8",
  );
  const mismatchOutput = expectCommandFailure([
    "run",
    "perspective:codex-former:validate-capture",
    "--",
    "--envelope",
    mismatchEnvelopePath,
    "--metadata",
    metadataPath,
  ]);
  assertContainsAll(mismatchOutput, [
    "conclusion=BLOCKED with useful findings",
    "provenance_status=blocked",
    "source_prompt_hash does not match metadata",
  ]);
}

function buildReturnedEnvelope({
  metadata,
  candidate,
  omitPromptHash = false,
  sourcePromptHash = metadata.source_prompt_hash,
}) {
  return [
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "",
    "capture_method: human_manual",
    "codex_surface_label: separate user-started Codex session",
    "prompt_was_generated_by_manual_copy_packet: true",
    `source_manual_copy_packet_id: ${metadata.source_manual_copy_packet_id}`,
    `source_former_input_packet_id: ${metadata.source_former_input_packet_id}`,
    ...(omitPromptHash ? [] : [`source_prompt_hash: ${sourcePromptHash}`]),
    "captured_at: 2026-06-10T00:00:00.000Z",
    "",
    "TRANSCRIPT_REDACTION_NOTES:",
    "- Included only returned candidate JSON.",
    "- Unsafe private source material was omitted.",
    "",
    "RETURNED_CODEX_RESPONSE:",
    JSON.stringify(candidate, null, 2),
    "END RETURNED_CODEX_RESPONSE",
    "",
  ].join("\n");
}

function buildNeedsReviewCandidate(metadata) {
  const formerInputPacket = metadata.source_former_input_packet;
  const knownPointer = formerInputPacket.pointer_refs[0];
  assert(knownPointer, "prepared former input packet must include pointer refs");

  return {
    draft_version: "codex_perspective_candidate_draft.v0.1",
    draft_kind: "codex_perspective_candidate_draft",
    source_former_input_packet: {
      packet_version: formerInputPacket.packet_version,
      packet_id: formerInputPacket.packet_id,
      role: formerInputPacket.role,
    },
    thesis:
      "The validation boundary is the useful perspective: the helper reduces provenance copy mistakes, but the returned candidate remains draft/review-only until local Augnes review completes.",
    selected_material: {
      changed_files: [
        "scripts/perspective-codex-former-capture-helper.mjs",
        "scripts/smoke-perspective-codex-former-capture-helper.mjs",
        "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_WORKFLOW_V0_1.md",
      ],
      changed_files_summary:
        "The helper writes the copyable prompt, return envelope template, and metadata, then validates returned capture envelopes without creating accepted Augnes state.",
      work_id: "AG-codex-former-capture-helper-v0-1",
      source_pr_refs: ["pr:hynk-studio/augnes#493"],
    },
    evidence_pointer_refs: [
      {
        pointer_kind: knownPointer.pointer_kind,
        pointer_semantics: "pointer_only",
        ref: knownPointer.ref,
      },
      {
        pointer_kind: knownPointer.pointer_kind,
        pointer_semantics: "pointer_only",
        ref: "evidence:row:unknown-helper-pointer",
      },
    ],
    unresolved_tensions: [
      {
        tension_kind: "readiness_reason",
        summary:
          "The capture helper improves operator reliability, but pointer warnings and basis quality still require human review.",
        source_ref: "readiness:needs_review",
      },
    ],
    basis_quality_suggestion: {
      status: "needs_review",
      reasons: [
        "This fixture intentionally carries an unknown pointer warning to preserve the PR #492 caveat.",
        "The material is useful beyond a plain summary because it identifies the validation boundary.",
      ],
    },
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary:
          "Review the non-committed candidate material and decide whether the pointer warning is acceptable.",
      },
      {
        action_id: "fix_input_gaps",
        summary:
          "If the pointer warning is material, refine the packet pointers before downstream use.",
      },
    ],
    user_core_decision_questions: [
      "Should the operator accept this needs_review capture as review material?",
    ],
    qualification_notes: [
      "This is useful beyond a plain summary because it separates helper mechanics from validation authority.",
      "Candidate material remains non-authoritative and review-only.",
    ],
    privacy_flags: {
      raw_payloads_included: false,
      unsafe_input_material_omitted: false,
      omitted_unsafe_fields: [],
    },
    authority_flags: {
      committed_state: false,
      persistence: false,
      provider_model_api_calls: false,
      proof_evidence_readiness_writes: false,
      codex_execution: false,
      github_mutation: false,
      merge_publish_approval: false,
      core_decision: false,
    },
    forbidden_actions: [
      "Do not create accepted Augnes state.",
      "Do not write proof, evidence, or readiness records.",
      "Do not call model APIs or execute Codex from Augnes.",
      "Do not approve, merge, publish, or make Core decisions.",
    ],
  };
}

function assertDocsAndReport() {
  assertContainsAll(docText, [
    "Operator Capture Helper",
    "npm run perspective:codex-former:capture-packet",
    "npm run perspective:codex-former:validate-capture",
    "copyable prompt file",
    "capture return envelope template file",
    "metadata file",
    "The helper does not paste into Codex",
    "unknown pointer warnings",
  ]);
  assertContainsAll(reportText, [
    "Perspective Codex Former Capture Helper",
    "Conclusion: PASS with follow-up",
    "Why Follows PR #493",
    "What The Helper Does",
    "What The Helper Still Does Not Do",
    "Pointer Warning Caveat",
    "Verification",
    "Skipped Checks With Reasons",
    "Add operator-facing capture helper or CLI wrapper",
  ]);
}

function assertHelperSourceBoundary() {
  assertContainsAll(helperText, [
    "buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep",
    "evaluateCodexPerspectiveCandidateDraftPromptContractFit",
    "validateAndNormalizeCodexPerspectiveCandidateDraft",
    "alignCodexPerspectiveCandidateDraftSchemaFromModelOutput",
    "buildWorkerFacingPerspectiveGuidanceFromCandidate",
    "writeFileSync",
  ]);
  for (const snippet of [
    "await" + " fetch(",
    "globalThis" + ".fetch(",
    "XML" + "HttpRequest",
    "responses" + ".create",
    "openai" + ".chat",
    "app" + "/api/",
    "navigator" + ".clipboard",
    "sqlite",
  ]) {
    assert.equal(
      helperText.includes(snippet),
      false,
      `helper must not introduce forbidden implementation surface ${snippet}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Perspective Codex former capture helper changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        !changedFile.startsWith("lib/"),
      `Perspective Codex former capture helper must not change forbidden surfaces: ${changedFile}`,
    );
  }
}

function collectChangedFiles() {
  const workingTreeFiles = gitLines(["diff", "--name-only", "--diff-filter=ACMR"]);
  const stagedFiles = gitLines([
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMR",
  ]);
  const branchFiles = gitLines([
    "diff",
    "--name-only",
    "--diff-filter=ACMR",
    "origin/main...HEAD",
  ]);
  const untrackedFiles = gitLines([
    "ls-files",
    "--others",
    "--exclude-standard",
  ]);

  return [
    ...new Set([
      ...workingTreeFiles,
      ...stagedFiles,
      ...branchFiles,
      ...untrackedFiles,
    ]),
  ].sort();
}

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function expectCommandFailure(args) {
  try {
    execFileSync("npm", args, { encoding: "utf8" });
  } catch (error) {
    return `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
  }
  throw new Error(`expected npm ${args.join(" ")} to fail`);
}

function readMetadata() {
  return JSON.parse(readFileSync(metadataPath, "utf8"));
}

function assertContainsAll(value, expectedSnippets) {
  for (const snippet of expectedSnippets) {
    assert(
      value.includes(snippet),
      `expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = `${docText}\n${reportText}`;
  for (const marker of [
    "hidden" + "_reasoning",
    "raw_page" + "_dump",
    "raw_pr" + "_diff",
    "raw_review" + "_payload",
    "access" + "_token",
    "refresh" + "_token",
    "api" + "_key",
    "oauth" + "_token",
    "sk-proj" + "-",
    "ghp" + "_",
  ]) {
    assert.equal(
      publicText.includes(marker),
      false,
      `public docs/report must not echo raw unsafe marker ${marker}`,
    );
  }
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}
