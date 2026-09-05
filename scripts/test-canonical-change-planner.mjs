#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  OWNER_TARGETED_DEPENDENCY_PHASE_IDS,
  PERMANENT_BROWSER_PHASE_IDS,
  classifyCanonicalBrowserOwnership,
  parseNameStatus,
  planCanonicalChange,
  selectCanonicalBrowserPhasesForChanges,
  validateChangeOwnerManifest,
} from "./canonical-change-planner.mjs";
import {
  validateCanonicalDocumentationChange,
  validateCanonicalOperatingPolicyChange,
  validateCanonicalOwnerTargetedChange,
} from "./validate-canonical-docs-change.mjs";

const temporaryRoot = mkdtempSync(path.join(tmpdir(), "ag-planner-"));
const results = [];
const targetedPhaseIds = (...ownerPhaseIds) => [
  "targeted-change-validator",
  ...OWNER_TARGETED_DEPENDENCY_PHASE_IDS,
  ...ownerPhaseIds,
];

try {
  runPlanCase("README-only", "documentation-only", ({ write }) => {
    write("README.md", "# Updated\n");
  });
  runPlanCase("docs-only", "documentation-only", ({ write }) => {
    write("docs/guide.md", "# Guide\n");
  });
  runPlanCase("research-only", "documentation-only", ({ write }) => {
    write("research/note.md", "# Note\n");
  });
  runPlanCase("submission-image-plus-markdown", "documentation-only", ({ write }) => {
    write("docs/submission/entry.md", "![Preview](preview.png)\n");
    write("docs/submission/preview.png", Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  });
  runPlanCase("AGENTS.md", "operating-policy-only", ({ write }) => {
    write("AGENTS.md", "# Changed instructions\n");
  });
  runPlanCase("AGENTS-plus-documentation", "full-canonical", ({ write }) => {
    write("AGENTS.md", "# Changed instructions\n");
    write("README.md", "# Updated with policy\n");
  });
  runPlanCase("nested-AGENTS", "full-canonical", ({ write }) => {
    write("docs/AGENTS.md", "# Nested instructions\n");
  });
  runPlanCase("AGENTS-deletion", "full-canonical", ({ remove }) => {
    remove("AGENTS.md");
  });
  runPlanCase("AGENTS-rename", "full-canonical", ({ rename }) => {
    rename("AGENTS.md", "docs/OPERATING_POLICY.md");
  });
  runPlanCase("workflow", "full-canonical", ({ write }) => {
    write(".github/workflows/new.yml", "name: test\n");
  });
  runPlanCase("composite-action", "full-canonical", ({ write }) => {
    write(".github/actions/example/action.yml", "name: example\n");
  });
  runPlanCase("unknown-source-file", "full-canonical", ({ write }) => {
    write("lib/example.ts", "export const value = 1;\n");
  });
  runPlanCase(
    "leaf-internal-known-owner",
    "owner-targeted",
    ({ write }) => {
      write(
        "lib/temporal-interpretation/guardrails.ts",
        "export const guarded = true;\n",
      );
    },
    {
      reason: "all_changes_have_owner_complete_targeted_coverage",
      ownerIds: ["temporal-interpretation-preview"],
      phaseIds: targetedPhaseIds("typecheck", "authority"),
    },
  );
  runPlanCase(
    "test-only-leaf-known-owner",
    "owner-targeted",
    ({ write }) => {
      write(
        "scripts/test-codex-augnes-user-hook-migration.mjs",
        "export {};\n",
      );
    },
    {
      ownerIds: ["codex-user-reuse-hook"],
      phaseIds: targetedPhaseIds("unit"),
    },
  );
  runPlanCase(
    "qualified-runtime-registry-test-owner",
    "owner-targeted",
    ({ write }) => {
      write(
        "scripts/test-codex-qualified-runtime-registry.ts",
        "export {};\n",
      );
    },
    {
      ownerIds: ["codex-qualified-runtime-registry"],
      phaseIds: targetedPhaseIds("typecheck", "integration"),
    },
  );
  runPlanCase(
    "ordinary-runtime-candidate-test-owner",
    "owner-targeted",
    ({ write }) => {
      write(
        "scripts/test-codex-ordinary-runtime-candidate.ts",
        "export {};\n",
      );
    },
    {
      ownerIds: ["codex-ordinary-runtime-candidate"],
      phaseIds: targetedPhaseIds("typecheck", "integration"),
    },
  );
  runPlanCase(
    "rolling-stable-candidate-owner",
    "owner-targeted",
    ({ write }) => {
      write("scripts/run-codex-rolling-stable-candidate.ts", "export {};\n");
      write("scripts/test-codex-rolling-stable-candidate.ts", "export {};\n");
    },
    {
      ownerIds: ["codex-ordinary-runtime-candidate"],
      phaseIds: targetedPhaseIds("typecheck", "integration"),
    },
  );
  runPlanCase(
    "rolling-stable-runtime-shared-owner",
    "full-canonical",
    ({ write }) => {
      write("lib/vnext/native-host/codex-rolling-stable-candidate.ts", "export {};\n");
    },
  );
  runPlanCase(
    "managed-runtime-store-test-owner",
    "owner-targeted",
    ({ write }) => {
      write("scripts/test-codex-managed-runtime-store.ts", "export {};\n");
    },
    {
      ownerIds: ["codex-managed-runtime-store"],
      phaseIds: targetedPhaseIds("typecheck", "integration"),
    },
  );
  runPlanCase(
    "fixture-only-leaf-known-owner",
    "owner-targeted",
    ({ write }) => {
      write("fixtures/local-canonical-owner-contract/current.json", "{}\n");
    },
    {
      ownerIds: ["local-canonical-owner-contract-fixture"],
      phaseIds: targetedPhaseIds("unit"),
    },
  );
  runPlanCase(
    "consumer-proven-leaf-deletion",
    "owner-targeted",
    ({ remove }) => {
      remove("fixtures/local-canonical-owner-contract/retired.json");
    },
    {
      ownerIds: ["local-canonical-owner-contract-fixture"],
      phaseIds: targetedPhaseIds("unit"),
    },
  );
  runPlanCase(
    "single-browser-owner",
    "owner-targeted",
    ({ write }) => {
      write(
        "components/guide-brief/current-action.tsx",
        "export const CurrentAction = () => null;\n",
      );
    },
    {
      ownerIds: ["product-multi-candidate"],
      phaseIds: [
        ...targetedPhaseIds("typecheck", "unit"),
        "e2e-operator-multi-candidate",
      ],
      browserPhaseIds: ["e2e-operator-multi-candidate"],
    },
  );
  runPlanCase(
    "targeted-owner-plus-documentation",
    "owner-targeted",
    ({ write }) => {
      write(
        ".codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs",
        "export {};\n",
      );
      write("docs/guide.md", "# Updated guide\n");
    },
    {
      ownerIds: ["codex-user-reuse-hook", "documentation"],
      phaseIds: targetedPhaseIds("unit"),
    },
  );
  runPlanCase("targeted-owner-deletion-unproven", "full-canonical", ({ remove }) => {
    remove("scripts/test-codex-augnes-user-hook-migration.mjs");
  });
  runPlanCase(
    "multi-owner-product-composition",
    "full-canonical",
    ({ write }) => {
      write(
        "lib/vnext/project-work-initialization.ts",
        "export const initialize = true;\n",
      );
    },
    {
      ownerIds: ["multi-owner-product-composition"],
      fullReasons: [
        "composition_browser_ownership_requires_full:lib/vnext/project-work-initialization.ts",
      ],
    },
  );
  runPlanCase(
    "native-host-security-credential",
    "full-canonical",
    ({ write }) => {
      write(
        "lib/vnext/native-host/credential-broker.ts",
        "export const broker = true;\n",
      );
    },
    {
      ownerIds: ["security-authority-process-isolation"],
      fullReasons: [
        "security_authority_or_process_isolation:lib/vnext/native-host/credential-broker.ts",
      ],
    },
  );
  runPlanCase(
    "migration",
    "full-canonical",
    ({ write }) => {
      write("data/migrations/001.sql", "select 1;\n");
    },
    {
      ownerIds: ["schema-migration-current-data"],
      fullReasons: [
        "schema_migration_or_current_data:data/migrations/001.sql",
      ],
    },
  );
  runPlanCase(
    "package-manifest",
    "full-canonical",
    ({ write }) => {
      write("package.json", "{\"private\":true,\"version\":\"2\"}\n");
    },
    {
      ownerIds: ["package-build-distribution"],
      fullReasons: ["package_build_distribution_foundation:package.json"],
    },
  );
  runPlanCase("nested-lockfile", "full-canonical", ({ write }) => {
    write("apps/example/package-lock.json", "{\"lockfileVersion\":3}\n");
  });
  runPlanCase("docs-to-source-rename", "full-canonical", ({ rename }) => {
    rename("docs/existing.md", "lib/existing.md");
  });
  runPlanCase("documentation-deletion", "full-canonical", ({ remove }) => {
    remove("docs/existing.md");
  });
  runPlanCase(
    "unknown-path",
    "full-canonical",
    ({ write }) => {
      write("docs/unknown.payload", "unknown\n");
    },
    {
      ownerIds: ["unknown-owner"],
      fullReasons: ["unknown_or_unmatched_owner:docs/unknown.payload"],
    },
  );
  runPlanCase(
    "planner-receipt-executor-self-change",
    "full-canonical",
    ({ write }) => {
      write("scripts/canonical-change-planner.mjs", "export const changed = true;\n");
    },
    {
      ownerIds: ["local-canonical-integrity"],
      fullReasons: [
        "local_canonical_integrity_self_change:scripts/canonical-change-planner.mjs",
      ],
    },
  );
  if (process.platform === "win32") {
    results.push("AGENTS-mode-change:posix_mode_unavailable_on_windows_ntfs");
    results.push("executable-mode-change:posix_mode_unavailable_on_windows_ntfs");
    results.push("symlink:windows_symlink_privilege_unavailable");
  } else {
    runPlanCase("AGENTS-mode-change", "full-canonical", ({ chmod }) => {
      chmod("AGENTS.md", 0o755);
    });
    runPlanCase("executable-mode-change", "full-canonical", ({ chmod }) => {
      chmod("README.md", 0o755);
    });
    runPlanCase("symlink", "full-canonical", ({ symlink }) => {
      symlink("README.md", "docs/readme-link.md");
    });
  }

  const malformedRepo = createRepository("malformed-sha");
  assert.throws(
    () =>
      planCanonicalChange({
        eventName: "pull_request",
        baseSha: "missing",
        headSha: malformedRepo.baseSha,
        cwd: malformedRepo.cwd,
      }),
    /base SHA must be exactly 40/u,
  );
  assert.throws(
    () =>
      planCanonicalChange({
        eventName: "pull_request",
        baseSha: malformedRepo.baseSha,
        headSha: "0".repeat(40),
        cwd: malformedRepo.cwd,
      }),
    /git cat-file failed/u,
  );
  assert.throws(
    () => parseNameStatus(Buffer.from("X\0path\0", "utf8")),
    /unsupported canonical diff status/u,
  );
  assert.throws(
    () => parseNameStatus(Buffer.from("M\0path", "utf8")),
    /not NUL terminated/u,
  );
  assert.throws(
    () => parseNameStatus(Buffer.from("M\0../escape\0", "utf8")),
    /path escapes the repository/u,
  );
  results.push("malformed-or-missing-base-head");

  const pushPlan = planCanonicalChange({
    eventName: "push",
    baseSha: "",
    headSha: malformedRepo.baseSha,
    cwd: malformedRepo.cwd,
  });
  assert.equal(pushPlan.plan, "full-canonical");
  assert.equal(pushPlan.reason, "main_push_always_full");
  results.push("main-push-always-full");

  assert.deepEqual(
    selectCanonicalBrowserPhasesForChanges([
      { oldPath: null, newPath: "components/project-home/project-home.tsx" },
    ]),
    ["e2e-project-experience"],
  );
  assert.deepEqual(
    selectCanonicalBrowserPhasesForChanges([
      { oldPath: null, newPath: "lib/vnext/native-host-run-receipt.ts" },
    ]),
    ["e2e-operator-native-host-execution"],
  );
  assert.deepEqual(
    selectCanonicalBrowserPhasesForChanges([
      { oldPath: null, newPath: "lib/vnext/recovery-validator.ts" },
    ]),
    ["e2e-continuity"],
  );
  assert.deepEqual(
    selectCanonicalBrowserPhasesForChanges([
      { oldPath: null, newPath: "lib/vnext/project-work-initialization.ts" },
    ]),
    [
      "e2e-project-experience",
      "e2e-operator-native-host-execution",
      "e2e-golden",
    ],
  );
  assert.deepEqual(
    selectCanonicalBrowserPhasesForChanges([
      { oldPath: null, newPath: "scripts/canonical-child-runner.mjs" },
    ]),
    PERMANENT_BROWSER_PHASE_IDS,
  );
  assert.deepEqual(
    classifyCanonicalBrowserOwnership([
      { oldPath: null, newPath: "components/project-home/project-home.tsx" },
    ]),
    { status: "owned", phase_ids: ["e2e-project-experience"] },
  );
  assert.equal(
    classifyCanonicalBrowserOwnership([
      { oldPath: null, newPath: "lib/vnext/project-work-initialization.ts" },
    ]).status,
    "composition",
  );
  assert.equal(
    classifyCanonicalBrowserOwnership([
      { oldPath: null, newPath: "unclassified/behavior-owner.ts" },
    ]).status,
    "unknown",
  );
  assert.deepEqual(
    selectCanonicalBrowserPhasesForChanges([
      { oldPath: null, newPath: "unclassified/behavior-owner.ts" },
    ]),
    PERMANENT_BROWSER_PHASE_IDS,
  );
  assert.throws(
    () => selectCanonicalBrowserPhasesForChanges([]),
    /requires changed paths/u,
  );
  results.push("permanent-browser-owner-selection");

  const ownerManifest = JSON.parse(
    readFileSync(
      new URL("./local-canonical-change-owners.v1.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(validateChangeOwnerManifest(ownerManifest), true);
  const malformedOwnerManifest = structuredClone(ownerManifest);
  malformedOwnerManifest.targeted_phase_order.push("caller-selected-command");
  malformedOwnerManifest.targeted_owners[0].phase_ids = [
    "caller-selected-command",
  ];
  assert.throws(
    () => validateChangeOwnerManifest(malformedOwnerManifest),
    /targeted phase order is invalid/u,
  );
  const duplicateOwnerManifest = structuredClone(ownerManifest);
  duplicateOwnerManifest.high_risk_owners[0].id =
    duplicateOwnerManifest.targeted_owners[0].id;
  assert.throws(
    () => validateChangeOwnerManifest(duplicateOwnerManifest),
    /duplicate canonical owner id/u,
  );
  results.push("owner-manifest-fail-closed");

  runDocumentationValidatorCases();

  console.log(
    JSON.stringify(
      {
        test: "canonical-change-planner",
        status: "pass",
        cases: results,
        fail_closed: true,
        documentation_validation: true,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function runPlanCase(name, expectedPlan, mutate, expected = {}) {
  const repository = createRepository(name);
  mutate(repository);
  commitAll(repository.cwd, `case: ${name}`);
  const headSha = git(repository.cwd, ["rev-parse", "HEAD"]).trim();
  const plan = planCanonicalChange({
    eventName: "pull_request",
    baseSha: repository.baseSha,
    headSha,
    cwd: repository.cwd,
  });
  assert.equal(plan.plan, expectedPlan, name);
  if (expected.reason) assert.equal(plan.reason, expected.reason, name);
  if (expected.ownerIds) {
    assert.deepEqual(plan.owner_ids, expected.ownerIds, `${name}:owners`);
  }
  if (expected.phaseIds) {
    assert.deepEqual(
      plan.targeted_phase_ids,
      expected.phaseIds,
      `${name}:phases`,
    );
  }
  if (expected.fullReasons) {
    assert.deepEqual(
      plan.full_reasons,
      expected.fullReasons,
      `${name}:full-reasons`,
    );
  }
  if (expected.browserPhaseIds) {
    assert.deepEqual(
      plan.browser_phase_ids,
      expected.browserPhaseIds,
      `${name}:browser-phases`,
    );
  }
  if (expectedPlan === "operating-policy-only") {
    assert.equal(plan.reason, "exact_safe_agents_operating_policy_change", name);
    assert.deepEqual(plan.full_reasons, [], name);
    assert.deepEqual(plan.browser_phase_ids, [], name);
  }
  results.push(name);
}

function createRepository(name) {
  const cwd = path.join(temporaryRoot, name);
  mkdirSync(cwd, { recursive: true });
  git(cwd, ["init", "--quiet"]);
  git(cwd, ["config", "user.email", "local-canonical@example.invalid"]);
  git(cwd, ["config", "user.name", "Canonical Tests"]);
  write(cwd, "README.md", "# Fixture\n");
  write(cwd, "AGENTS.md", "# Instructions\n");
  write(cwd, "docs/existing.md", "# Existing\n");
  write(cwd, "package.json", "{\"private\":true}\n");
  write(
    cwd,
    "fixtures/local-canonical-owner-contract/retired.json",
    "{}\n",
  );
  write(
    cwd,
    "scripts/test-codex-augnes-user-hook-migration.mjs",
    "export const baseline = true;\n",
  );
  commitAll(cwd, "base");
  const baseSha = git(cwd, ["rev-parse", "HEAD"]).trim();
  return {
    cwd,
    baseSha,
    write: (relativePath, content) => write(cwd, relativePath, content),
    remove: (relativePath) => unlinkSync(path.join(cwd, relativePath)),
    rename: (from, to) => {
      mkdirSync(path.dirname(path.join(cwd, to)), { recursive: true });
      git(cwd, ["mv", from, to]);
    },
    chmod: (relativePath, mode) => chmodSync(path.join(cwd, relativePath), mode),
    symlink: (target, relativePath) => {
      mkdirSync(path.dirname(path.join(cwd, relativePath)), { recursive: true });
      symlinkSync(target, path.join(cwd, relativePath));
    },
  };
}

function runDocumentationValidatorCases() {
  const valid = createRepository("docs-validator-valid");
  valid.write(
    "docs/existing.md",
    "# Existing\n\n[Section](#details)\n\n## Details\n\n[README](../README.md#fixture)\n",
  );
  commitAll(valid.cwd, "valid docs");
  let headSha = git(valid.cwd, ["rev-parse", "HEAD"]).trim();
  const validResult = validateCanonicalDocumentationChange({
    baseSha: valid.baseSha,
    headSha,
    cwd: valid.cwd,
  });
  assert.equal(validResult.status, "pass");
  assert.equal(validResult.relative_links_checked, 1);
  assert.equal(validResult.local_anchors_checked, 2);
  results.push("documentation-links-and-anchors");

  const missingLink = createRepository("docs-validator-missing-link");
  missingLink.write("docs/existing.md", "# Existing\n\n[Missing](missing.md)\n");
  commitAll(missingLink.cwd, "missing link");
  headSha = git(missingLink.cwd, ["rev-parse", "HEAD"]).trim();
  assert.throws(
    () =>
      validateCanonicalDocumentationChange({
        baseSha: missingLink.baseSha,
        headSha,
        cwd: missingLink.cwd,
      }),
    /unresolved relative Markdown link/u,
  );
  results.push("documentation-missing-link-refused");

  const missingAnchor = createRepository("docs-validator-missing-anchor");
  missingAnchor.write("docs/existing.md", "# Existing\n\n[Missing](#absent)\n");
  commitAll(missingAnchor.cwd, "missing anchor");
  headSha = git(missingAnchor.cwd, ["rev-parse", "HEAD"]).trim();
  assert.throws(
    () =>
      validateCanonicalDocumentationChange({
        baseSha: missingAnchor.baseSha,
        headSha,
        cwd: missingAnchor.cwd,
      }),
    /unresolved local Markdown anchor/u,
  );
  results.push("documentation-missing-anchor-refused");

  const privatePath = createRepository("docs-validator-private-path");
  privatePath.write("docs/existing.md", "# Existing\n\n/Users/private/project\n");
  commitAll(privatePath.cwd, "private path");
  headSha = git(privatePath.cwd, ["rev-parse", "HEAD"]).trim();
  assert.throws(
    () =>
      validateCanonicalDocumentationChange({
        baseSha: privatePath.baseSha,
        headSha,
        cwd: privatePath.cwd,
      }),
    /private absolute filesystem path/u,
  );
  results.push("documentation-private-path-refused");

  const operatingPolicy = createRepository("operating-policy-validator-valid");
  operatingPolicy.write(
    "AGENTS.md",
    "# Instructions\n\n[Repository guide](README.md#fixture)\n",
  );
  commitAll(operatingPolicy.cwd, "valid operating policy");
  headSha = git(operatingPolicy.cwd, ["rev-parse", "HEAD"]).trim();
  const operatingPolicyResult = validateCanonicalOperatingPolicyChange({
    baseSha: operatingPolicy.baseSha,
    headSha,
    cwd: operatingPolicy.cwd,
  });
  assert.equal(operatingPolicyResult.status, "pass");
  assert.equal(operatingPolicyResult.plan, "operating-policy-only");
  assert.equal(operatingPolicyResult.markdown_files_checked, 1);
  results.push("operating-policy-links-and-anchors");

  const ownerTargeted = createRepository("owner-targeted-validator-valid");
  ownerTargeted.write(
    "scripts/test-codex-augnes-user-hook-migration.mjs",
    "export const updated = true;\n",
  );
  commitAll(ownerTargeted.cwd, "valid owner-targeted change");
  headSha = git(ownerTargeted.cwd, ["rev-parse", "HEAD"]).trim();
  const ownerTargetedResult = validateCanonicalOwnerTargetedChange({
    baseSha: ownerTargeted.baseSha,
    headSha,
    cwd: ownerTargeted.cwd,
  });
  assert.equal(ownerTargetedResult.status, "pass");
  assert.equal(ownerTargetedResult.plan, "owner-targeted");
  assert.deepEqual(ownerTargetedResult.owner_ids, [
    "codex-user-reuse-hook",
  ]);
  assert.deepEqual(
    ownerTargetedResult.targeted_phase_ids,
    targetedPhaseIds("unit"),
  );
  results.push("owner-targeted-exact-plan-validator");
}

function write(cwd, relativePath, content) {
  const target = path.join(cwd, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function commitAll(cwd, message) {
  git(cwd, ["add", "-A"]);
  git(cwd, ["commit", "--quiet", "-m", message]);
}

function git(cwd, args) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  }
  return result.stdout;
}
