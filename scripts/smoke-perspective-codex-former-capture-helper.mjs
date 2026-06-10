import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
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
const sourceInputTemplateDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md";
const reportFile =
  "reports/2026-06-10-perspective-codex-former-capture-helper.md";
const parameterizedReportFile =
  "reports/2026-06-10-perspective-codex-former-capture-helper-parameterized-input.md";
const sourceInputHardeningReportFile =
  "reports/2026-06-10-perspective-codex-former-source-input-hardening.md";
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
const defaultTmpDir = "/tmp/augnes-codex-former-capture-helper-smoke-default";
const parameterizedTmpDir =
  "/tmp/augnes-codex-former-capture-helper-smoke-parameterized";
const sourceInputPath = join(parameterizedTmpDir, "bounded-source-input.json");
const rejectionTmpDir = join(parameterizedTmpDir, "rejection-cases");
const promptPath = join(
  parameterizedTmpDir,
  "codex-former-copyable-prompt.txt",
);
const envelopeTemplatePath = join(
  parameterizedTmpDir,
  "codex-former-capture-return-envelope-template.txt",
);
const metadataPath = join(
  parameterizedTmpDir,
  "codex-former-capture-metadata.json",
);
const defaultMetadataPath = join(
  defaultTmpDir,
  "codex-former-capture-metadata.json",
);
const positiveEnvelopePath = join(parameterizedTmpDir, "returned-envelope.txt");
const positiveSummaryPath = join(parameterizedTmpDir, "validation-summary.json");
const multipleCandidateEnvelopePath = join(
  parameterizedTmpDir,
  "multiple-candidate-envelope.txt",
);
const missingProvenanceEnvelopePath = join(
  parameterizedTmpDir,
  "missing-provenance-envelope.txt",
);
const mismatchEnvelopePath = join(
  parameterizedTmpDir,
  "mismatched-provenance-envelope.txt",
);

const allowedChangedFiles = new Set([
  packageFile,
  helperFile,
  smokeFile,
  docFile,
  sourceInputTemplateDocFile,
  reportFile,
  parameterizedReportFile,
  sourceInputHardeningReportFile,
  manualWorkflowDocsSmokeFile,
  manualCopyPacketSmokeFile,
  separateSessionPrepSmokeFile,
  separateSessionCaptureSmokeFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const helperText = readFileSync(helperFile, "utf8");
const docText = `${readFileSync(docFile, "utf8")}\n${readFileSync(
  sourceInputTemplateDocFile,
  "utf8",
)}`;
const reportText = `${readFileSync(reportFile, "utf8")}\n${readFileSync(
  parameterizedReportFile,
  "utf8",
)}\n${readFileSync(sourceInputHardeningReportFile, "utf8")}`;

assertPackageScripts();
assertHelperSourceBoundary();
assertDocsAndReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertChangedFileBoundary();
runPrepareModes();
runSourceInputRejectionCases();
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

function runPrepareModes() {
  rmSync(defaultTmpDir, { recursive: true, force: true });
  mkdirSync(defaultTmpDir, { recursive: true });
  const defaultStdout = execFileSync(
    "npm",
    [
      "run",
      "perspective:codex-former:capture-packet",
      "--",
      "--out-dir",
      defaultTmpDir,
      "--generated-at",
      "2026-06-10T00:00:00.000Z",
    ],
    { encoding: "utf8" },
  );
  assertContainsAll(defaultStdout, [
    "mode=prepare",
    "capture_source_kind=separate_session_capture_packet_prep_builder",
    "source_manual_copy_packet_id=",
    "source_former_input_packet_id=",
    "source_prompt_hash=",
    `metadata_path=${defaultMetadataPath}`,
  ]);
  const defaultMetadata = JSON.parse(readFileSync(defaultMetadataPath, "utf8"));
  assert.equal(
    defaultMetadata.capture_source_kind,
    "separate_session_capture_packet_prep_builder",
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(defaultMetadata, "source_input_hash"),
    false,
    "legacy metadata must not invent source input hash",
  );

  rmSync(parameterizedTmpDir, { recursive: true, force: true });
  mkdirSync(parameterizedTmpDir, { recursive: true });
  writeFileSync(
    sourceInputPath,
    `${JSON.stringify(buildSourceInputFixture(), null, 2)}\n`,
    "utf8",
  );
  const expectedSourceInputHash = hashText(readFileSync(sourceInputPath, "utf8"));
  const stdout = execFileSync(
    "npm",
    [
      "run",
      "perspective:codex-former:capture-packet",
      "--",
      "--out-dir",
      parameterizedTmpDir,
      "--source-input",
      sourceInputPath,
      "--generated-at",
      "2026-06-10T00:00:00.000Z",
    ],
    { encoding: "utf8" },
  );

  assertContainsAll(stdout, [
    "mode=prepare",
    "capture_source_kind=bounded_source_input_file",
    `source_input_hash=${expectedSourceInputHash}`,
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

  assert.equal(
    metadata.capture_source_kind,
    "bounded_source_input_file",
    "metadata must record parameterized source kind",
  );
  assert.equal(metadata.source_input_path, sourceInputPath);
  assert.equal(metadata.source_input_hash, expectedSourceInputHash);
  assert.equal(
    metadata.source_input_hash,
    hashText(readFileSync(sourceInputPath, "utf8")),
    "source input hash must be deterministic",
  );
  assert.equal(metadata.generated_at, "2026-06-10T00:00:00.000Z");
  assert.equal(
    metadata.source_former_input_packet.source_formation_input_bundle
      .generated_at,
    "2026-06-10T00:00:00.000Z",
    "generated former input packet must use --generated-at override",
  );
  assert.notEqual(
    metadata.source_input_hash,
    hashText(
      JSON.stringify(
        {
          ...buildSourceInputFixture(),
          generated_at: "2026-06-10T00:00:00.000Z",
        },
        null,
        2,
      ) + "\n",
    ),
    "source input hash must remain the hash of the supplied file contents",
  );
  assert.equal(
    metadata.source_input_work_id,
    "AG-example-codex-former-capture-helper-parameterized-input",
  );
  assert.equal(metadata.source_input_scope, "project:augnes");

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

function runSourceInputRejectionCases() {
  mkdirSync(rejectionTmpDir, { recursive: true });
  const missingFileOutput = expectPrepareFailure(
    join(rejectionTmpDir, "missing-source-input.json"),
    "missing-file",
  );
  assertContainsAll(missingFileOutput, ["source input file does not exist"]);

  writeFileSync(join(rejectionTmpDir, "invalid-json.json"), "{ nope", "utf8");
  assertContainsAll(
    expectPrepareFailure(join(rejectionTmpDir, "invalid-json.json"), "invalid-json"),
    ["source input file is not valid JSON"],
  );

  writeFileSync(join(rejectionTmpDir, "non-object.json"), "[]\n", "utf8");
  assertContainsAll(
    expectPrepareFailure(join(rejectionTmpDir, "non-object.json"), "non-object"),
    ["source input JSON must be an object"],
  );

  writeRejectedSourceInputCase({
    fileName: "missing-scope.json",
    mutate: (fixture) => {
      delete fixture.scope;
    },
    expectedSnippets: ["source input scope is required"],
  });
  writeRejectedSourceInputCase({
    fileName: "missing-work-anchor.json",
    mutate: (fixture) => {
      delete fixture.work_id;
      fixture.source_pr_refs = [];
    },
    expectedSnippets: ["source input requires work_id or source_pr_refs"],
  });
  writeRejectedSourceInputCase({
    fileName: "empty-changed-files.json",
    mutate: (fixture) => {
      fixture.changed_files = [];
    },
    expectedSnippets: [
      "source input changed_files must include at least one file",
    ],
  });
  writeRejectedSourceInputCase({
    fileName: "no-verification-material.json",
    mutate: (fixture) => {
      fixture.tests_checks_run = [];
      fixture.skipped_checks = [];
      fixture.evidence_row_refs = [];
      fixture.proof_only_action_refs = [];
    },
    expectedSnippets: [
      "source input requires checks, skipped checks, evidence refs, or proof-only action refs",
    ],
  });
  writeRejectedSourceInputCase({
    fileName: "unsupported-check-status.json",
    mutate: (fixture) => {
      fixture.tests_checks_run[0].status = "unknown";
    },
    expectedSnippets: [
      "source input tests_checks_run[0].status must be passed or failed",
    ],
  });
  writeRejectedSourceInputCase({
    fileName: "missing-check-field.json",
    mutate: (fixture) => {
      delete fixture.tests_checks_run[0].check_id;
    },
    expectedSnippets: [
      "source input tests_checks_run[0].check_id must be a non-empty string",
    ],
  });
  writeRejectedSourceInputCase({
    fileName: "missing-skipped-reason.json",
    mutate: (fixture) => {
      delete fixture.skipped_checks[0].skipped_reason;
    },
    expectedSnippets: [
      "source input skipped_checks[0].skipped_reason must be a non-empty string",
    ],
  });
  writeRejectedSourceInputCase({
    fileName: "missing-gap-summary.json",
    mutate: (fixture) => {
      delete fixture.unresolved_gaps[0].summary;
    },
    expectedSnippets: [
      "source input unresolved_gaps[0].summary must be a non-empty string",
    ],
  });
  writeRejectedSourceInputCase({
    fileName: "unsafe-markers.json",
    mutate: (fixture) => {
      fixture.changed_files_summary = [
        "access_token refresh_token oauth_token api_key sk-proj- ghp_",
        "raw_pr_diff raw review payload raw page dump hidden_reasoning",
        "provider log cookie account data private_payload raw_source_payload",
        "raw_candidate_payload raw_private_payload secret",
      ].join(" ");
    },
    expectedSnippets: [
      "source input contains unsafe/private/provider material markers",
      "access_token",
      "raw_pr_diff",
      "provider log",
      "secret",
    ],
  });
}

function writeRejectedSourceInputCase({ fileName, mutate, expectedSnippets }) {
  const fixture = buildSourceInputFixture();
  mutate(fixture);
  const path = join(rejectionTmpDir, fileName);
  writeFileSync(path, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
  assertContainsAll(
    expectPrepareFailure(path, fileName.replace(/\.json$/, "")),
    expectedSnippets,
  );
}

function expectPrepareFailure(sourcePath, caseName) {
  return expectCommandFailure([
    "run",
    "perspective:codex-former:capture-packet",
    "--",
    "--out-dir",
    join(rejectionTmpDir, `out-${caseName}`),
    "--source-input",
    sourcePath,
    "--generated-at",
    "2026-06-10T00:00:00.000Z",
  ]);
}

function runValidateMode() {
  const metadata = readMetadata();
  const envelope = buildReturnedEnvelope({
    metadata,
    candidate: buildNeedsReviewCandidate(metadata),
    wrapReturnedResponseInProse: true,
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
    multipleCandidateEnvelopePath,
    buildReturnedEnvelope({
      metadata,
      candidate,
      extraCandidates: [
        {
          ...candidate,
          thesis:
            "The validation boundary remains useful, but this second candidate must block because exactly one candidate object is allowed.",
        },
      ],
      wrapReturnedResponseInProse: true,
    }),
    "utf8",
  );
  const multipleOutput = expectCommandFailure([
    "run",
    "perspective:codex-former:validate-capture",
    "--",
    "--envelope",
    multipleCandidateEnvelopePath,
    "--metadata",
    metadataPath,
  ]);
  assertContainsAll(multipleOutput, [
    "conclusion=BLOCKED with useful findings",
    "candidate_count=2",
    "expected exactly one CodexPerspectiveCandidateDraft object; found 2",
  ]);

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
  extraCandidates = [],
  omitPromptHash = false,
  sourcePromptHash = metadata.source_prompt_hash,
  wrapReturnedResponseInProse = false,
}) {
  const returnedResponse = wrapReturnedResponseInProse
    ? [
        "The bounded returned response follows. It contains candidate JSON only inside the balanced object below.",
        JSON.stringify(candidate, null, 2),
        ...extraCandidates.flatMap((extraCandidate) => [
          "A second returned candidate object follows for negative extraction coverage.",
          JSON.stringify(extraCandidate, null, 2),
        ]),
        "End of bounded returned response.",
      ].join("\n")
    : [candidate, ...extraCandidates]
        .map((candidateObject) => JSON.stringify(candidateObject, null, 2))
        .join("\n\n");

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
    returnedResponse,
    "END RETURNED_CODEX_RESPONSE",
    "",
  ].join("\n");
}

function buildSourceInputFixture() {
  return {
    generated_at: "2026-06-09T00:00:00.000Z",
    scope: "project:augnes",
    work_id: "AG-example-codex-former-capture-helper-parameterized-input",
    source_pr_refs: ["pr:hynk-studio/augnes#494"],
    changed_files: [
      "scripts/perspective-codex-former-capture-helper.mjs",
      "scripts/smoke-perspective-codex-former-capture-helper.mjs",
    ],
    changed_files_summary:
      "Bounded local source input for parameterized Codex Former capture helper smoke. Benign words: tokenizer, tokenization, and secretariat.",
    tests_checks_run: [
      {
        check_id: "check:example",
        command: "npm run smoke:perspective-codex-former-capture-helper",
        status: "passed",
        result_summary: "Parameterized helper smoke fixture.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:browser-computer-use",
        skipped_reason:
          "Screenshot validation skipped because no UI; check:browser-computer-use has no browser-visible surface; local docs report smoke work only.",
        result_summary: "No browser surface added.",
      },
    ],
    evidence_row_refs: ["evidence:row:parameterized-helper-smoke"],
    unresolved_gaps: [
      {
        gap_id: "gap:pointer-review",
        summary: "Pointer warnings remain review work, not product readiness.",
      },
    ],
    source_privacy_redaction_notes: [
      "Uses bounded local source input only.",
      "No private source material is included.",
    ],
    authority_boundaries: [
      "Local review-only helper input; no accepted state or Core decision.",
    ],
  };
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
    "--source-input",
    "capture_source_kind",
    "source_input_hash",
    "exactly one returned candidate draft JSON object",
    "unknown pointer warnings",
    "Perspective Codex Former Capture Source Input Template v0.1",
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
    "Perspective Codex Former Capture Helper Parameterized Input",
    "Why Follows PR #494",
    "Parameterized Source Input Behavior",
    "Validate Extraction Hardening",
    "exactly one",
    "Source-Input Rejection Hardening",
    "Unsafe Marker Precision",
    "generated_at / Source Hash Behavior",
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
    "sourceInputPath",
    "source_input_hash",
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

function hashText(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
