import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const typePath = "types/candidate-to-codex-handoff-draft.ts";
const builderPath =
  "lib/research-candidate-review/candidate-to-codex-handoff-draft.ts";
const sourcePacketFixturePath =
  "fixtures/research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1.json";
const basePacketFixturePath =
  "fixtures/research-candidate-review.ai-context-packet.sample.v0.1.json";
const manualPacketFixturePath =
  "fixtures/research-candidate-review.manual-note-ai-context-packet.sample.v0.1.json";
const substratePreviewFixturePath =
  "fixtures/agent-perspective-substrate-preview.sample.v0.1.json";
const geometryDigestFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest.sample.v0.1.json";
const manualGeometryDigestFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest.manual-parser.sample.v0.1.json";
const draftFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft.geometry-substrate.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const sourcePacketSmokePath =
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs";
const foldedAuditPanelSmokePath =
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs";
const previewBuilderSmokePath =
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs";
const substrateSmokePath = "scripts/smoke-agent-perspective-substrate-v0-1.mjs";
const geometryDigestSmokePath =
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs";
const basePacketSmokePath =
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs";
const formationReceiptSmokePath =
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs";
const productWriteStoplineSmokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs";

const packageScriptName =
  "smoke:research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1";
const packageScriptValue = `node ${smokePath}`;
const nextRecommendedSlice = "candidate_to_codex_handoff_draft_review_v0_1";
const sourcePacketNextSlice =
  "candidate_to_codex_handoff_draft_geometry_substrate_v0_1";
const foldedAuditPanelAnchorId = "agent-perspective-substrate-folded-audit-panel";
const expectedChangedFiles = [
  typePath,
  builderPath,
  draftFixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  sourcePacketSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  geometryDigestSmokePath,
  basePacketSmokePath,
  formationReceiptSmokePath,
  productWriteStoplineSmokePath,
];

for (const filePath of [
  typePath,
  builderPath,
  sourcePacketFixturePath,
  basePacketFixturePath,
  manualPacketFixturePath,
  substratePreviewFixturePath,
  geometryDigestFixturePath,
  manualGeometryDigestFixturePath,
  draftFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  sourcePacketSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  geometryDigestSmokePath,
  basePacketSmokePath,
  formationReceiptSmokePath,
  productWriteStoplineSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const builderSource = readFileSync(builderPath, "utf8");
const smokeSource = readFileSync(smokePath, "utf8");
const sourcePacketFixture = readJson(sourcePacketFixturePath);
const basePacketFixture = readJson(basePacketFixturePath);
const manualPacketFixture = readJson(manualPacketFixturePath);
const substratePreviewFixture = readJson(substratePreviewFixturePath);
const geometryDigestFixture = readJson(geometryDigestFixturePath);
const manualGeometryDigestFixture = readJson(manualGeometryDigestFixturePath);
const draftFixture = readJson(draftFixturePath);
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const substrateDoc = readFileSync(substrateDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const sourcePacketSmoke = readFileSync(sourcePacketSmokePath, "utf8");
const foldedAuditPanelSmoke = readFileSync(foldedAuditPanelSmokePath, "utf8");
const previewBuilderSmoke = readFileSync(previewBuilderSmokePath, "utf8");
const substrateSmoke = readFileSync(substrateSmokePath, "utf8");
const geometryDigestSmoke = readFileSync(geometryDigestSmokePath, "utf8");

assertTypeAndBuilderContracts();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenImplementationPatterns();
assertDocsPointers();
assertAdjacentSmokePointers();

const builderModule = await importBuilderModule();
const rebuiltDraft = builderModule.buildCandidateToCodexHandoffDraftGeometrySubstrate({
  upgradedAiContextPacket: sourcePacketFixture,
  target: "codex_implementation",
  handoff_mode: "copyable_codex_prompt_preview",
  scope: "project:augnes",
  as_of:
    "fixture:research-candidate-review.candidate-to-codex-handoff-draft.geometry-substrate.sample.v0.1",
});
const rebuiltDraftAgain =
  builderModule.buildCandidateToCodexHandoffDraftGeometrySubstrate({
    upgradedAiContextPacket: sourcePacketFixture,
    target: "codex_implementation",
    handoff_mode: "copyable_codex_prompt_preview",
    scope: "project:augnes",
    as_of:
      "fixture:research-candidate-review.candidate-to-codex-handoff-draft.geometry-substrate.sample.v0.1",
  });

assert.deepEqual(
  rebuiltDraft,
  draftFixture,
  "rebuilt Candidate-to-Codex handoff draft must match committed fixture",
);
assert.equal(
  rebuiltDraft.draft_fingerprint,
  rebuiltDraftAgain.draft_fingerprint,
  "draft fingerprint must be stable across repeated builds",
);
assertDraft(draftFixture);

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1",
      final_status: "pass",
      draft_fingerprint: draftFixture.draft_fingerprint,
      source_ai_context_packet_fingerprint:
        draftFixture.source_ai_context_packet_fingerprint,
      source_ref_count: draftFixture.source_refs.length,
      unresolved_tension_count: draftFixture.unresolved_tensions.length,
      next_recommended_slice: draftFixture.next_recommended_slice,
      checked_copyable_preview_only_boundary: true,
      checked_manual_lineage_preserved: true,
      checked_no_codex_github_or_external_execution: true,
      checked_product_write_stopline_parked: true,
    },
    null,
    2,
  ),
);

function assertTypeAndBuilderContracts() {
  for (const exportName of [
    "CandidateToCodexHandoffDraft",
    "CandidateToCodexHandoffDraftInput",
    "CandidateToCodexHandoffDraftTarget",
    "CandidateToCodexHandoffDraftSection",
    "CandidateToCodexHandoffDraftExpectedChange",
    "CandidateToCodexHandoffDraftExpectedCheck",
    "CandidateToCodexHandoffDraftStopCondition",
    "CandidateToCodexHandoffDraftAuthorityBoundary",
    "CandidateToCodexHandoffDraftLineage",
    "CandidateToCodexHandoffDraftValidationResult",
  ]) {
    assert.match(
      typeSource,
      new RegExp(`export\\s+(interface|type)\\s+${escapeRegExp(exportName)}\\b`),
      `type file must export ${exportName}`,
    );
  }
  for (const exportName of [
    "buildCandidateToCodexHandoffDraftGeometrySubstrate",
    "validateCandidateToCodexHandoffDraftGeometrySubstrate",
    "createCandidateToCodexHandoffDraftFingerprint",
  ]) {
    assert.match(
      builderSource,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `builder must export ${exportName}`,
    );
  }
  for (const requiredText of [
    "candidate_to_codex_handoff_draft.geometry_substrate.v0.1",
    "copyable_codex_prompt_preview",
    "codex_implementation",
    "candidate_to_codex_handoff_draft_review_v0_1",
    "can_execute_codex",
    "can_call_github",
    "can_send_external_handoff",
    "manual_lineage_summary",
    "manual_formation_receipt_refs",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type source must include ${requiredText}`);
    assert.ok(
      builderSource.includes(requiredText),
      `builder source must include ${requiredText}`,
    );
  }
  assert.doesNotMatch(
    builderSource,
    /^import\s+(?!type\b)/m,
    "builder must keep runtime imports out",
  );
}

function assertDraft(draft) {
  assert.equal(draft.draft_kind, "candidate_to_codex_handoff_draft");
  assert.equal(draft.draft_version, "candidate_to_codex_handoff_draft.geometry_substrate.v0.1");
  assert.equal(draft.handoff_mode, "copyable_codex_prompt_preview");
  assert.equal(draft.target, "codex_implementation");
  assert.equal(draft.source_ai_context_packet_fingerprint, sourcePacketFixture.packet_fingerprint);
  assert.match(draft.draft_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(draft.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(draft.validation.passed, true);
  assert.deepEqual(draft.validation.failure_codes, []);
  assert.equal(
    draft.recommendation_status,
    "ready_for_candidate_to_codex_handoff_draft_review",
  );
  assert.equal(draft.next_recommended_slice, nextRecommendedSlice);

  assertCopyablePrompt(draft.copyable_prompt, draft);
  assert.ok(draft.structured_handoff, "structured_handoff exists");
  assert.ok(draft.expected_changes.length > 0, "expected changes exist");
  assert.ok(draft.expected_checks.length > 0, "expected checks exist");
  assert.ok(draft.stop_conditions.length >= 15, "stop conditions exist");
  assert.ok(draft.source_refs.length > 0, "source refs are present");
  assert.ok(draft.unresolved_tensions.length > 0, "unresolved tensions are preserved");
  assertManualLineage(draft);
  assertAuthorityBoundary(draft.authority_boundary);

  assert.equal(
    draft.structured_handoff.source_packet_summary.source_ai_context_packet_next_slice,
    sourcePacketNextSlice,
  );
  assert.equal(
    draft.folded_audit_summary.folded_panel_anchor_id,
    foldedAuditPanelAnchorId,
  );
  assert.equal(draft.manual_lineage_summary.manual_lineage_present, true);
  assert.equal(draft.manual_lineage_summary.manual_lineage_authority, false);
  assert.equal(
    draft.manual_lineage_summary.manual_lineage_included_in_copyable_prompt,
    true,
  );
  assertNoCoordinateFields(draft.geometry_context_summary);
  assert.equal(draft.geometry_context_summary.layout_coordinates_consumed, false);
  assert.equal(draft.geometry_context_summary.raw_layout_coordinates_exported, false);
  assert.equal(draft.geometry_context_summary.geometry_digest_is_authority, false);
  assert.ok(draft.agent_substrate_summary.surfaced_blocker_count > 0);
  assert.ok(draft.agent_substrate_summary.surfaced_warning_count > 0);
  assert.equal(draft.agent_substrate_summary.source_discipline_preserved, true);
  assert.match(draft.lineage.product_write_stopline_ref, /pr:686/);
}

function assertCopyablePrompt(prompt, draft) {
  assert.equal(typeof prompt, "string");
  assert.doesNotMatch(prompt, /```/, "copyable prompt must not be fenced markdown");
  for (const requiredText of [
    "Repo: hynk-studio/augnes",
    "Canonical checkout: /Users/hynk/code/augnes",
    "Do not touch: /Users/hynk/Documents/augnes",
    draft.source_ai_context_packet_fingerprint,
    `Source packet next slice: ${sourcePacketNextSlice}`,
    "Task title:",
    "Goal:",
    "Expected files:",
    "Expected checks:",
    "Source refs summary:",
    "Unresolved tensions summary:",
    "Geometry/Substrate/Folded audit summary:",
    "Manual lineage summary:",
    "Hard boundaries:",
    "Stop conditions:",
    "Final report requirements:",
    "Do not execute Codex automatically from this draft.",
    "Do not create branch/PR unless a human explicitly uses this draft as a Codex task.",
    "Do not call GitHub automation from this draft.",
    "Do not treat this packet as source of truth.",
    "Do not create proof/evidence, mutate work, or promote Perspective.",
    "Do not call providers/OpenAI.",
    "Do not run retrieval/RAG.",
    "Do not fetch sources.",
    "Do not send external handoff.",
    "Do not write DB, open DB, execute SQL, or execute transactions.",
    "Do not allocate product IDs or execute product write.",
  ]) {
    assert.ok(prompt.includes(requiredText), `copyable prompt must include ${requiredText}`);
  }
}

function assertManualLineage(draft) {
  assert.equal(
    draft.lineage.manual_ai_context_packet_base_ref,
    sourcePacketFixture.lineage.manual_ai_context_packet_base_ref,
  );
  assert.deepEqual(
    draft.lineage.manual_research_candidate_review_refs,
    sourcePacketFixture.lineage.manual_research_candidate_review_refs,
  );
  assert.deepEqual(
    draft.lineage.manual_formation_receipt_refs,
    sourcePacketFixture.lineage.manual_formation_receipt_refs,
  );
  assert.ok(draft.lineage.manual_ai_context_packet_base_ref, "manual packet ref");
  assert.ok(draft.lineage.manual_research_candidate_review_refs.length > 0);
  assert.ok(draft.lineage.manual_formation_receipt_refs.length > 0);
  assert.ok(
    draft.copyable_prompt.includes(draft.lineage.manual_ai_context_packet_base_ref),
    "copyable prompt must include manual packet ref",
  );
  assert.equal(manualPacketFixture.packet_version, basePacketFixture.packet_version);
  assert.equal(
    geometryDigestFixture.version,
    manualGeometryDigestFixture.version,
    "geometry fixtures must share version",
  );
  assert.ok(
    sourcePacketFixture.lineage.ai_context_packet_base_refs.includes(
      sourcePacketFixture.lineage.manual_ai_context_packet_base_ref,
    ),
    "#691 packet must preserve manual packet lineage",
  );
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.preview_only, true);
  assert.equal(boundary.copyable_text_only, true);
  for (const forbiddenKey of [
    "source_of_truth",
    "can_execute_codex",
    "can_create_branch",
    "can_open_pr",
    "can_call_github",
    "can_send_external_handoff",
    "can_commit_or_reject_state",
    "can_record_proof",
    "can_create_evidence",
    "can_update_work",
    "can_create_work_item",
    "can_execute_agents",
    "can_route_agents",
    "can_call_external_services",
    "can_call_providers_or_openai",
    "can_run_retrieval_or_rag",
    "can_fetch_sources",
    "can_promote_perspective",
    "can_allocate_product_ids",
    "can_execute_product_write",
    "can_open_db",
    "can_execute_sql",
    "can_execute_transaction",
    "can_add_route_or_ui",
    "durable_write_authority",
    "merge_authority",
  ]) {
    assert.equal(boundary[forbiddenKey], false, `${forbiddenKey} must be false`);
  }
}

function assertPackageScript() {
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map(extractScriptName)
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    addedScriptNames,
    [packageScriptName],
    "package additions must only include the Candidate-to-Codex handoff draft smoke script",
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in handoff draft slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.doesNotMatch(changedFile, /^lib\/db(?:\.ts|\/)/, "must not change lib/db files");
    assert.doesNotMatch(changedFile, /schema\.sql$/, "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
  }
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /"dependencies"\s*:/,
    "dependencies must not be added",
  );
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /"devDependencies"\s*:/,
    "dev dependencies must not be added",
  );
}

function assertNoForbiddenImplementationPatterns() {
  const scannedSources = [
    [typePath, typeSource],
    [builderPath, builderSource],
    [smokePath, stripForbiddenPatternDefinitions(smokeSource)],
  ];
  const forbiddenPatterns = [
    pattern(["from ", '"openai"']),
    pattern(["new ", "OpenAI"]),
    pattern(["fetch", "("]),
    pattern(["XMLHttpRequest"]),
    pattern(["WebSocket"]),
    pattern(["EventSource"]),
    pattern(["sendBeacon"]),
    pattern(["localStorage"]),
    pattern(["sessionStorage"]),
    pattern(["indexedDB"]),
    pattern(["document", ".", "cookie"]),
    pattern(["createServer", "("]),
    pattern(["app", ".", "listen", "("]),
    pattern(["next", " ", "dev"]),
    pattern(["api", ".", "github", ".", "com"]),
    pattern(["Octokit"]),
    pattern(["gh", " ", "pr"]),
    pattern(["git", " ", "push"]),
    pattern(["codex", " ", "exec"]),
    pattern(["codex", " ", "run"]),
    pattern(["npm", " ", "run", " ", "codex"]),
    pattern(["executeProductWrite", "("]),
    pattern(["productDbWrite", "("]),
  ];
  for (const [filePath, source] of scannedSources) {
    for (const { label, regex } of forbiddenPatterns) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Candidate-to-Codex handoff draft Geometry/Substrate v0.1",
    typePath,
    builderPath,
    draftFixturePath,
    smokePath,
    packageScriptName,
    "consumes #691 upgraded AI Context Packet",
    "preserves base/static and manual-note lineage",
    "copyable preview text only",
    "no Codex execution",
    "no branch/PR/GitHub automation",
    "no external handoff sending",
    "no provider/OpenAI/source-fetch/retrieval execution",
    "no DB/proof/evidence/work/Perspective durable write",
    "no product write",
    "retrieval/RAG/source fetching",
    "retrieval/RAG/source fetching, Codex execution, or external handoffs",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Candidate-to-Codex handoff draft/i);
    assert.match(doc, /GeometryDigest|Geometry\/Substrate/i);
    assert.match(doc, /manual-note/i);
    assert.match(doc, /copyable-preview-only|copyable preview/i);
    assert.match(doc, /no Codex execution/i);
    assert.match(doc, /no branch\/PR\/GitHub automation/i);
    assert.match(doc, /no external handoff/i);
    assert.match(doc, /no product write/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertAdjacentSmokePointers() {
  for (const [label, source] of [
    ["#691 AI Context Packet geometry/substrate upgrade", sourcePacketSmoke],
    ["#690 folded audit panel", foldedAuditPanelSmoke],
    ["#689 preview builder", previewBuilderSmoke],
    ["#688 substrate", substrateSmoke],
    ["#687 geometry digest", geometryDigestSmoke],
  ]) {
    assert.match(source, new RegExp(packageScriptName), `${label} smoke package pointer`);
    assert.match(source, new RegExp(nextRecommendedSlice), `${label} smoke next pointer`);
  }
}

async function importBuilderModule() {
  const transformedSource = stripTypeScriptTypes(builderSource, {
    mode: "transform",
  });
  return import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`
  );
}

function assertNoCoordinateFields(value) {
  const offenders = [];
  visit(value, [], (pathSegments) => {
    const key = pathSegments.at(-1);
    if (["x", "y", "fx", "fy", "position"].includes(key)) {
      offenders.push(pathSegments.join("."));
    }
  });
  assert.deepEqual(offenders, [], "handoff draft must not export coordinate fields");
}

function visit(value, pathSegments, callback) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, [...pathSegments, String(index)], callback));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPath = [...pathSegments, key];
    callback(nextPath, nestedValue);
    visit(nestedValue, nextPath, callback);
  }
}

function readChangedFiles() {
  const baseRef = mergeBaseRef();
  return [
    ...readGitOutput(["diff", "--name-only", baseRef, "--"]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

function mergeBaseRef() {
  return readGitOutput(["merge-base", "origin/main", "HEAD"]).trim() || "origin/main";
}

function readGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return "";
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function extractScriptName(line) {
  return line.replace(/^\+\s*/, "").trim().match(/^"([^"]+)"/)?.[1] ?? null;
}

function stripForbiddenPatternDefinitions(source) {
  return source
    .split("\n")
    .filter((line) => !line.includes("pattern(["))
    .join("\n");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pattern(parts, prefix = "", suffix = "", flags = "") {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(`${prefix}${parts.map(escapeRegExp).join("")}${suffix}`, flags),
  };
}
