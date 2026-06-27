#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const smokeVersion = "authority_boundary_regression_ci.v0.1";
const fixtureVersion = "authority_boundary_regression_baseline.sample.v0.1";
const scope = "project:augnes";

const docsPath = "docs/AUTHORITY_BOUNDARY_REGRESSION_CI_V0_1.md";
const fixturePath =
  "fixtures/authority-boundary-regression-baseline.sample.v0.1.json";
const smokePath = "scripts/smoke-authority-boundary-regression-v0-1.mjs";
const workflowPath = ".github/workflows/authority-boundary-smoke.yml";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const privacyDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const exportPolicyDocsPath = "docs/LOCAL_DATA_EXPORT_IMPORT_POLICY_V0_1.md";

const packageScriptName = "smoke:authority-boundary-regression-v0-1";
const packageScriptValue =
  "node scripts/smoke-authority-boundary-regression-v0-1.mjs";

const expectedSliceFiles = [
  docsPath,
  fixturePath,
  smokePath,
  workflowPath,
  packagePath,
  indexPath,
];

const authorityAllowedTrueFields = [
  "authority_boundary_regression_static_smoke_now",
  "github_actions_static_smoke_now",
  "diagnostic_only",
  "caller_provided_repo_text_only",
];

const authorityFalseFields = [
  "runtime_state_mutation_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "export_import_runtime_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "github_branch_create_now",
  "github_commit_create_now",
  "github_pr_create_now",
  "github_merge_now",
  "repository_file_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "product_write_now",
  "product_id_allocation_now",
  "codex_execution_authority",
  "github_automation_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
  "ci_pass_is_approval",
  "ci_failure_is_rejection",
  "pr_body_is_authority",
  "git_ref_is_authority",
];

const requiredReasonCodes = [
  "candidate_not_fact",
  "candidate_not_proof",
  "provider_output_not_truth",
  "retrieval_result_not_evidence",
  "retrieval_score_not_truth_score",
  "feedback_not_truth",
  "layout_coordinate_not_authority",
  "codex_handoff_not_execution_approval",
  "pr_body_not_authority",
  "ci_pass_not_truth",
  "smoke_pass_not_truth",
  "git_ref_not_authority",
  "product_write_parked",
  "product_write_denied",
  "raw_private_marker_blocked",
  "export_import_auto_action_blocked",
  "static_smoke_only",
  "diagnostic_only",
  "no_runtime_mutation",
  "no_github_mutation",
];

const docsRequiredPhrases = [
  "This slice is static-smoke-only and diagnostic-only.",
  "It does not add runtime routes or UI.",
  "It does not query/write DB.",
  "It does not call providers.",
  "It does not fetch sources.",
  "It does not execute retrieval/RAG.",
  "It does not create proof/evidence.",
  "It does not promote Perspective.",
  "It does not write/apply durable Perspective state.",
  "It does not write Formation Receipts.",
  "It does not execute Git Ledger export.",
  "It does not call GitHub APIs for mutation.",
  "It does not execute Git writes.",
  "It does not execute Codex.",
  "It does not product-write or allocate product IDs.",
  "CI pass is not truth, proof, approval, promotion, merge approval, release approval, product-write authority, or durable state.",
  "CI failure is diagnostic, not automatic rejection.",
  "Smoke pass is not truth.",
  "PR body is not authority.",
  "Git ref is not authority.",
  "GitHub PR is not Core decision.",
  "Product-write remains parked by #686.",
  "The roadmap guide is not SSOT.",
  "Allowed negated/boundary phrases are match-local.",
  "Nearby unrelated negation does not allow a positive authority claim.",
];

const forbiddenWorkflowPatterns = [
  /\bgh\s+pr\s+create\b/i,
  /\bgh\s+pr\s+merge\b/i,
  /\bgh\s+api\b/i,
  /\bgit\s+push\b/i,
  /\bgit\s+commit\b/i,
  /\bgit\s+tag\b/i,
  /\bgit\s+merge\b/i,
  /\bcurl\b[^\n]*(?:api\.github|github\.com\/api)/i,
  /\bOPENAI_API_KEY\b/,
  /\bGITHUB_TOKEN\b/,
  /\bsecrets\./,
  /\bnpm\s+run\s+(?:build|typecheck|smoke)(?!:authority-boundary-regression-v0-1\b)/,
  /\bnpx\s+prisma\s+migrate\b/i,
  /\bnpm\s+run\s+db\b/i,
  /\bdeploy\b/i,
  /\bproduct-write\b/i,
];

const realLookingPrivatePatterns = [
  /\bhttps?:\/\//,
  /\bfile:\/\//,
  /\/Users\//,
  /\/home\//,
  /\bsk-[A-Za-z0-9_-]{8,}\b/,
  /\bghp_[A-Za-z0-9_]{8,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(thread|run|session|resp|file)_[A-Za-z0-9]{16,}\b/,
];

const claimPatterns = [
  {
    category: "candidate_as_proof_fact_or_accepted_evidence",
    pattern:
      /\b(?:candidate|candidates)\s+(?:is|are|=|as)\s+(?!not\b)(?:proof|facts?|accepted evidence)\b/gi,
  },
  {
    category: "evidence_candidate_as_accepted_evidence",
    pattern:
      /\bevidence candidate\s+(?:is|=|as)\s+(?!not\b)accepted evidence\b/gi,
  },
  {
    category: "perspective_delta_candidate_as_committed_state",
    pattern:
      /\bperspective delta candidate\s+(?:is|=|as)\s+(?!not\b)committed state\b/gi,
  },
  {
    category: "provider_output_as_truth_proof_or_evidence",
    pattern:
      /\bprovider output\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|evidence|accepted evidence)\b/gi,
  },
  {
    category: "provider_confidence_as_promotion_readiness",
    pattern:
      /\bprovider confidence\s+(?:is|=|as)\s+(?!not\b)promotion readiness\b/gi,
  },
  {
    category: "retrieval_result_as_evidence_or_authority",
    pattern:
      /\bretrieval result\s+(?:is|=|as)\s+(?!not\b)(?:evidence|authority|promotion authority)\b/gi,
  },
  {
    category: "retrieval_score_as_truth_score_or_promotion_readiness",
    pattern:
      /\bretrieval score\s+(?:is|=|as)\s+(?!not\b)(?:truth score|promotion readiness)\b/gi,
  },
  {
    category: "rag_context_as_truth",
    pattern: /\brag context\s+(?:is|=|as)\s+(?!not\b)truth\b/gi,
  },
  {
    category: "feedback_as_truth",
    pattern: /\bfeedback\s+(?:is|=|as)\s+(?!not\b)truth\b/gi,
  },
  {
    category: "dismiss_as_deletion",
    pattern: /\bdismiss(?:al)?\s+(?:is|=|as)\s+(?!not\b)deletion\b/gi,
  },
  {
    category: "pin_as_promotion",
    pattern: /\bpin\s+(?:is|=|as)\s+(?!not\b)promotion\b/gi,
  },
  {
    category: "layout_coordinate_as_truth_or_authority",
    pattern:
      /\blayout coordinates?\s+(?:is|are|=|as)\s+(?!not\b)(?:truth|authority|source of truth)\b/gi,
  },
  {
    category: "salience_score_as_truth_score",
    pattern:
      /\bsalience score\s+(?:is|=|as)\s+(?!not\b)truth score\b/gi,
  },
  {
    category: "codex_handoff_draft_as_execution_approval",
    pattern:
      /\bcodex handoff draft\s+(?:is|=|as)\s+(?!not\b)execution approval\b/gi,
  },
  {
    category: "codex_result_report_as_proof_evidence_or_state",
    pattern:
      /\bcodex result report\s+(?:is|=|as)\s+(?!not\b)(?:proof|evidence|state|durable state)\b/gi,
  },
  {
    category: "pr_body_as_authority",
    pattern: /\bpr body\s+(?:is|=|as)\s+(?!not\b)authority\b/gi,
  },
  {
    category: "ci_pass_as_proof_truth_or_approval",
    pattern:
      /\bci pass\s+(?:is|=|as)\s+(?!not\b)(?:proof|truth|approval|promotion|merge approval|release approval|product-write authority|durable state)\b/gi,
  },
  {
    category: "smoke_pass_as_proof_truth_or_approval",
    pattern:
      /\bsmoke pass\s+(?:is|=|as)\s+(?!not\b)(?:proof|truth|approval|promotion|merge approval|release approval|product-write authority|durable state)\b/gi,
  },
  {
    category: "git_ref_as_authority",
    pattern:
      /\bgit (?:commit|ref|tag|branch)\s+(?:is|=|as)\s+(?!not\b)(?:approval|authority|durable state|core decision|promotion)\b/gi,
  },
  {
    category: "github_pr_as_core_decision_or_execution_authority",
    pattern:
      /\bgithub (?:branch|commit|pr)\s+(?:is|=|as)\s+(?!not\b)(?:core decision|automatic execution authority|execution authority)\b/gi,
  },
  {
    category: "product_write_available_before_reentry",
    pattern:
      /\bproduct-write\s+(?:is|=)\s+(?:available|enabled|allowed)\b(?!(?:[^.]{0,120})\bparked\b)/gi,
  },
  {
    category: "product_id_allocation_available_before_contract",
    pattern:
      /\bproduct id allocation\s+(?:is|=)\s+(?:available|enabled|allowed)\b/gi,
  },
  {
    category: "raw_private_marker_allowed_as_canonical_label",
    pattern:
      /\bSAFE_MARKER_[A-Z0-9_]+\s+(?:is|=)\s+(?:allowed|permitted)\s+as\s+canonical label\b/g,
  },
  {
    category: "export_import_auto_action_allowed",
    pattern:
      /\b(?:export\/import|import|export) policy\s+(?:allows|permits|enables)\s+auto-(?:promote|product-write|proof\/evidence-write|durable-state-apply|provider-call|retrieval|git\/github)\b/gi,
  },
];

for (const requiredPath of [
  docsPath,
  fixturePath,
  smokePath,
  workflowPath,
  packagePath,
  indexPath,
  roadmapPath,
  privacyDocsPath,
  exportPolicyDocsPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const docs = read(docsPath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const smokeSource = read(smokePath);
const workflow = read(workflowPath);
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);
const roadmap = read(roadmapPath);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.smoke_version, smokeVersion);
assert.equal(fixture.scope, scope);
assert.ok(
  roadmap.includes("authority_boundary_regression_ci_v0_1"),
  "roadmap must contain authority_boundary_regression_ci_v0_1",
);
assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the authority boundary regression smoke",
);

for (const pointer of [docsPath, fixturePath, smokePath, workflowPath]) {
  assert.ok(index.includes(pointer), `latest index must point to ${pointer}`);
}

for (const phrase of docsRequiredPhrases) {
  assert.ok(
    includesNormalized(docs, phrase),
    `docs must include required phrase: ${phrase}`,
  );
}

assertAuthorityBoundaryClosed(fixture.authority_boundary, "fixture.authority_boundary");

for (const reasonCode of requiredReasonCodes) {
  assert.ok(
    fixture.reason_codes.includes(reasonCode),
    `fixture must include reason code ${reasonCode}`,
  );
}

for (const blockedExample of fixture.expected_blocked_examples) {
  const findings = classifyAuthorityBoundaryClaims(blockedExample.text);
  assert.ok(
    findings.some((finding) => finding.category === blockedExample.expected_category),
    `blocked fixture example must be blocked: ${blockedExample.example_id}`,
  );
}

for (const allowedExample of fixture.expected_allowed_examples) {
  const findings = classifyAuthorityBoundaryClaims(allowedExample.text);
  assert.deepEqual(
    findings,
    [],
    `allowed fixture example must not be blocked: ${allowedExample.example_id}`,
  );
}

assertWorkflowBoundary();
assertNoRealLookingPrivateExamples();
assertNarrowSliceFileScope();
assertStaticRepoScan();

console.log("authority_boundary_regression_ci_v0_1 smoke passed");

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function includesNormalized(source, phrase) {
  return source.replace(/\s+/g, " ").includes(phrase.replace(/\s+/g, " "));
}

function classifyAuthorityBoundaryClaims(text) {
  const findings = [];
  for (const { category, pattern } of claimPatterns) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const matchStart = match.index ?? 0;
      const matchEnd = matchStart + match[0].length;
      if (isAllowedBoundaryContext(text, matchStart, matchEnd)) {
        continue;
      }
      findings.push({
        category,
        excerpt: buildExcerpt(text, matchStart),
      });
    }
  }
  return findings;
}

function buildExcerpt(source, index) {
  const start = Math.max(0, index - 80);
  const end = Math.min(source.length, index + 160);
  return source.slice(start, end).trim();
}

function isAllowedBoundaryContext(source, matchStart, matchEnd) {
  const sentenceContext = getSentenceContext(source, matchStart, matchEnd);
  return (
    hasLocalBoundaryCue(source, sentenceContext, matchStart, matchEnd) ||
    isInBoundaryList(source, matchStart)
  );
}

function getSentenceContext(source, matchStart, matchEnd) {
  const before = source.slice(0, matchStart);
  const after = source.slice(matchEnd);
  const boundaryBefore = Math.max(
    before.lastIndexOf("."),
    before.lastIndexOf("!"),
    before.lastIndexOf("?"),
    before.lastIndexOf(";"),
  );
  const relativeAfter = after.search(/[.!?;]/);
  const start = boundaryBefore === -1 ? 0 : boundaryBefore + 1;
  const end = relativeAfter === -1 ? source.length : matchEnd + relativeAfter + 1;
  return { text: source.slice(start, end), start, end };
}

function hasLocalBoundaryCue(source, sentenceContext, matchStart, matchEnd) {
  const prefix = source.slice(sentenceContext.start, matchStart);
  const suffix = source.slice(matchEnd, sentenceContext.end);
  const sentence = sentenceContext.text;
  const normalizedPrefix = prefix
    .replace(/[{}()[\]"'`<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const normalizedSuffix = suffix
    .replace(/[{}()[\]"'`<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const normalizedSentence = sentence
    .replace(/[{}()[\]"'`<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const prefixAllows = [
    /\bdo not (?:treat|use|promote)\b/,
    /\bmust not (?:treat|use|promote)\b/,
    /\bdoes not (?:treat|use|promote)\b/,
    /\bwithout (?:treating|using|promoting)\b/,
    /\bnot (?:treat|use|promote)\b/,
    /\b(?:must\s+)?forbid\b/,
    /\bforbidden shortcut\b/,
    /\bassert\.doesnotmatch\b/,
    /\bdoesnotmatch\b/,
  ].some((pattern) => pattern.test(normalizedPrefix));

  const suffixAllows = [
    /\b(?:is|are)\s+(?:explicitly\s+)?forbidden\b/,
    /\b(?:is|are)\s+blocked\b/,
    /\b(?:is|are)\s+denied\b/,
  ].some((pattern) => pattern.test(normalizedSuffix));

  const sentenceAllows = [
    /\bforbidden capabilities\b/,
    /\bforbidden false fields\b/,
    /\balways false\b/,
    /\bdisallowed_actions\b/,
    /\bforbidden_shortcuts\b/,
    /^no\b.*\bis available here\b/,
  ].some((pattern) => pattern.test(normalizedSentence));

  return prefixAllows || suffixAllows || sentenceAllows;
}

function isInBoundaryList(source, matchStart) {
  const beforeLines = source.slice(0, matchStart).split(/\r?\n/);
  const currentLine = beforeLines.at(-1) ?? "";
  if (!/^\s*(?:[-*]|\d+\.|["'])/.test(currentLine)) {
    return false;
  }
  const nearbyIntro = beforeLines.slice(-12).join("\n").toLowerCase();
  return [
    /\bforbidden capabilities\b/,
    /\bforbidden false fields\b/,
    /\bforbidden_shortcuts\b/,
    /\bdisallowed_actions\b/,
    /\bexplicitly_does_not_prove\b/,
    /\bprohibited_in_this_lane\b/,
    /\balways false\b/,
  ].some((pattern) => pattern.test(nearbyIntro));
}

function assertAuthorityBoundaryClosed(boundary, label) {
  assert.ok(boundary && typeof boundary === "object", `${label} must exist`);
  for (const allowedField of authorityAllowedTrueFields) {
    assert.equal(
      boundary[allowedField],
      true,
      `${label} allowed field must be true: ${allowedField}`,
    );
  }
  for (const falseField of authorityFalseFields) {
    assert.equal(
      boundary[falseField],
      false,
      `${label} forbidden field must be false: ${falseField}`,
    );
  }
}

function assertWorkflowBoundary() {
  assert.ok(
    workflow.includes("name: Authority Boundary Smoke"),
    "workflow must have the expected name",
  );
  assert.ok(
    workflow.includes("pull_request:"),
    "workflow must run on pull_request",
  );
  assert.ok(workflow.includes("push:"), "workflow must run on push");
  assert.ok(workflow.includes("branches: [main]"), "workflow push trigger must target main");
  assert.ok(
    workflow.includes("contents: read"),
    "workflow must keep contents permission read-only",
  );
  assert.ok(
    workflow.includes("actions/checkout@"),
    "workflow must use actions/checkout",
  );
  assert.ok(
    workflow.includes("actions/setup-node@"),
    "workflow must use actions/setup-node",
  );
  assert.ok(workflow.includes("npm ci"), "workflow must install with npm ci");
  assert.ok(
    workflow.includes(`npm run ${packageScriptName}`),
    "workflow must run only the authority boundary smoke package script",
  );
  assert.ok(!workflow.includes("write-all"), "workflow must not request write-all");
  assert.ok(!workflow.includes("contents: write"), "workflow must not request write contents");
  for (const forbiddenPattern of forbiddenWorkflowPatterns) {
    assert.ok(
      !forbiddenPattern.test(workflow),
      `workflow must not include forbidden runtime or mutation command: ${forbiddenPattern}`,
    );
  }
}

function assertNoRealLookingPrivateExamples() {
  const newSliceSources = [
    [docsPath, docs],
    [fixturePath, fixtureText],
    [smokePath, smokeSource],
    [workflowPath, workflow],
  ];
  for (const [filePath, source] of newSliceSources) {
    for (const pattern of realLookingPrivatePatterns) {
      assert.ok(
        !pattern.test(source),
        `${filePath} must not include live-looking private/provider/secret examples: ${pattern}`,
      );
    }
  }
}

function assertNarrowSliceFileScope() {
  for (const expectedPath of expectedSliceFiles) {
    assert.ok(existsSync(expectedPath), `expected slice file must exist: ${expectedPath}`);
  }
  const unexpected = [];
  for (const filePath of walk(".")) {
    if (
      /authority[-_]boundary[-_]regression|authority[-_]boundary[-_]smoke/i.test(
        filePath,
      ) &&
      !expectedSliceFiles.includes(filePath)
    ) {
      unexpected.push(filePath);
    }
  }
  assert.deepEqual(
    unexpected.sort(),
    [],
    "authority boundary regression slice files must stay in the expected file set",
  );
}

function assertStaticRepoScan() {
  const scannedFiles = collectScannableRepoFiles();
  assert.ok(scannedFiles.length > 0, "static scan must inspect repo text files");

  const findings = [];
  for (const filePath of scannedFiles) {
    const source = read(filePath);
    for (const finding of classifyAuthorityBoundaryClaims(source)) {
      findings.push({ filePath, ...finding });
    }
  }

  assert.deepEqual(
    findings,
    [],
    `static authority boundary scan found forbidden positive claims: ${JSON.stringify(
      findings.slice(0, 10),
      null,
      2,
    )}`,
  );
}

function collectScannableRepoFiles() {
  const roots = ["docs", "types", "fixtures", "scripts", "components", "app", "lib"];
  const files = [];
  for (const root of roots) {
    if (!existsSync(root)) {
      continue;
    }
    for (const filePath of walk(root)) {
      if (shouldScanFile(filePath)) {
        files.push(filePath);
      }
    }
  }
  return files.sort();
}

function shouldScanFile(filePath) {
  const normalized = filePath.replaceAll(path.sep, "/");
  if (
    normalized === roadmapPath ||
    normalized === fixturePath ||
    normalized.endsWith("package-lock.json")
  ) {
    return false;
  }
  if (
    /(^|\/)(node_modules|\.next|\.git|dist|build|coverage|out|\.turbo)\//.test(
      normalized,
    )
  ) {
    return false;
  }
  if (!/\.(?:md|ts|tsx|js|jsx|mjs|json|yml|yaml|txt)$/.test(normalized)) {
    return false;
  }
  const size = statSync(filePath).size;
  return size <= 750_000;
}

function walk(root) {
  const paths = [];
  for (const entry of readdirSync(root)) {
    const fullPath = path.join(root, entry);
    const normalized = fullPath.replaceAll(path.sep, "/");
    if (
      /(^|\/)(node_modules|\.next|\.git|dist|build|coverage|out|\.turbo)$/.test(
        normalized,
      )
    ) {
      continue;
    }
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      paths.push(...walk(fullPath));
      continue;
    }
    paths.push(normalized);
  }
  return paths;
}
