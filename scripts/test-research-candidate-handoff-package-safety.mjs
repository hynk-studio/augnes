#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  buildCandidateToCodexHandoffDraftGeometrySubstrate,
} from "../lib/research-candidate-review/candidate-to-codex-handoff-draft.ts";
import {
  buildCandidateToCodexHandoffDraftReview,
} from "../lib/research-candidate-review/candidate-to-codex-handoff-draft-review.ts";
import {
  buildResearchCandidateManualNoteHandoffSeed,
} from "../lib/research-candidate-review/manual-note-handoff-seed.ts";
import {
  buildCodexHandoffDraftImplementationFixture,
} from "../lib/research-candidate-review/codex-handoff-draft.ts";
import {
  containsAbsoluteUserHomePath,
  RESEARCH_CANDIDATE_OPERATOR_BOUND_CHECKOUT_INSTRUCTION,
} from "../lib/research-candidate-review/operator-bound-checkout.ts";
import {
  sanitizePrivateBuildPaths,
} from "./build-distributable-package.mjs";

const repositoryRoot = process.cwd();
const manualPreviewFixture = JSON.parse(
  readFileSync(
    path.join(
      repositoryRoot,
      "fixtures/research-candidate-review.manual-note-preview.sample.v0.1.json",
    ),
    "utf8",
  ),
);
const upgradedPacketFixture = JSON.parse(
  readFileSync(
    path.join(
      repositoryRoot,
      "fixtures/research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1.json",
    ),
    "utf8",
  ),
);
const codexHandoffContractFixture = JSON.parse(
  readFileSync(
    path.join(
      repositoryRoot,
      "fixtures/research-candidate-review.codex-handoff-draft-contract.sample.v0.1.json",
    ),
    "utf8",
  ),
);

const manualSeed = buildResearchCandidateManualNoteHandoffSeed({
  preview: manualPreviewFixture.preview,
  warnings: [],
  source_metadata: {
    result_source: "local_parse",
    parser_version: manualPreviewFixture.parser_version,
  },
  target_label: "manual Research Candidate Review follow-up",
});
const candidateDraft = buildCandidateToCodexHandoffDraftGeometrySubstrate({
  upgradedAiContextPacket: upgradedPacketFixture,
});
const candidateReview = buildCandidateToCodexHandoffDraftReview({
  handoffDraft: candidateDraft,
  sourceUpgradedAiContextPacket: upgradedPacketFixture,
});
const genericHandoffImplementation =
  buildCodexHandoffDraftImplementationFixture({
    codex_handoff_draft_contract: codexHandoffContractFixture,
  });

for (const prompt of [manualSeed.copyable_prompt, candidateDraft.copyable_prompt]) {
  assert.equal(
    prompt.includes(RESEARCH_CANDIDATE_OPERATOR_BOUND_CHECKOUT_INSTRUCTION),
    true,
  );
  assert.equal(prompt.includes("/Users/hynk/code/augnes"), false);
  assert.equal(prompt.includes("/Users/hynk/Documents/augnes"), false);
  assert.equal(containsAbsoluteUserHomePath(prompt), false);
  assert.doesNotMatch(prompt, /%2[Ff](?:Users|home)%2[Ff]/u);
}

for (const statement of [
  "Do not execute Codex automatically",
  "Do not create branch/PR unless a human explicitly uses",
  "Do not call GitHub automation",
  "Do not allocate product IDs or execute product write",
]) {
  assert.equal(manualSeed.copyable_prompt.includes(statement), true);
  assert.equal(candidateDraft.copyable_prompt.includes(statement), true);
}
assert.equal(manualSeed.authority_boundary.can_execute_codex, false);
assert.equal(manualSeed.authority_boundary.can_create_branch, false);
assert.equal(manualSeed.authority_boundary.can_open_pr, false);
assert.equal(manualSeed.authority_boundary.can_call_github, false);
assert.equal(manualSeed.authority_boundary.can_execute_product_write, false);
assert.equal(candidateDraft.validation.passed, true);
assert.equal(candidateReview.prompt_review.prompt_checkout_is_operator_bound, true);
assert.equal(
  candidateReview.prompt_review.prompt_excludes_private_checkout_paths,
  true,
);
assert.equal(candidateReview.boundary_review.codex_execution_not_granted, true);
assert.equal(candidateReview.boundary_review.github_automation_not_granted, true);
assert.equal(candidateReview.boundary_review.branch_creation_not_granted, true);
assert.equal(candidateReview.boundary_review.pr_creation_not_granted, true);
assert.equal(candidateReview.boundary_review.product_write_not_granted, true);
assert.equal(genericHandoffImplementation.validated_implementation.passed, true);
assert.equal(
  genericHandoffImplementation.built_codex_handoff_draft_preview_bundle
    .draft_preview.canonical_checkout,
  RESEARCH_CANDIDATE_OPERATOR_BOUND_CHECKOUT_INSTRUCTION,
);
assert.equal(
  containsAbsoluteUserHomePath(
    genericHandoffImplementation.built_codex_handoff_draft_preview_bundle
      .draft_preview.canonical_checkout,
  ),
  false,
);

const guardRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-private-path-guard-test-"),
);
const stagingRoot = path.join(guardRoot, "staging");
const injectedHome = path.join(guardRoot, "private-home");
mkdirSync(stagingRoot, { recursive: true, mode: 0o700 });
mkdirSync(injectedHome, { recursive: true, mode: 0o700 });
writeFileSync(
  path.join(stagingRoot, "server.js"),
  `const privateCheckout = ${JSON.stringify(path.join(injectedHome, "checkout"))};\n`,
  { encoding: "utf8", mode: 0o600 },
);

let rejectedError = null;
try {
  sanitizePrivateBuildPaths(stagingRoot, repositoryRoot, {
    HOME: injectedHome,
    USERPROFILE: injectedHome,
  });
} catch (error) {
  rejectedError = error;
}
assert.equal(rejectedError?.code, "package_private_path_leak");
assert.equal(String(rejectedError).includes(injectedHome), false);
rmSync(guardRoot, { recursive: true, force: true });

console.log("Research Candidate handoff package-safety tests passed.");
