import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-product-write-design-review.ts";
const fixturePath =
  "fixtures/research-candidate-review.manual-note-product-write-design-review.sample.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-product-write-design-review-v0-1.mjs";
const tempDbSingleClaimDesignHelperPath =
  "lib/research-candidate-review/manual-note-temp-db-single-claim-prototype-design.ts";
const tempDbSingleClaimDesignFixturePath =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-prototype-design.sample.v0.1.json";
const tempDbSingleClaimDesignSmokePath =
  "scripts/smoke-research-candidate-temp-db-single-claim-prototype-design-v0-1.mjs";
const tempDbSingleClaimDesignRunnerPath =
  "scripts/run-research-candidate-temp-db-single-claim-prototype-design-v0-1.mjs";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const requiredTargetGroups = [
  "claims",
  "evidence_or_proof_records",
  "perspective_records",
  "canonical_graph_edges",
  "source_verification_records",
  "work_items",
  "audit_records",
  "idempotency_records",
  "rollback_records",
];

for (const filePath of [
  helperPath,
  fixturePath,
  runnerPath,
  tempDbSingleClaimDesignHelperPath,
  tempDbSingleClaimDesignFixturePath,
  tempDbSingleClaimDesignSmokePath,
  tempDbSingleClaimDesignRunnerPath,
  docsIndexPath,
  packagePath,
  browserValidatorPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const runner = readFileSync(runnerPath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const docsIndex = readFileSync(docsIndexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const browserValidator = readFileSync(browserValidatorPath, "utf8");
const normalizedDocsIndex = docsIndex.replace(/\s+/g, " ");

assertHelperContract();
assertFixtureContract();
assertRunnerContract();
assertDocsPackageAndBrowserPointers();
assertNoRouteUiSchemaDependencyExpansion();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-product-write-design-review-v0-1",
      helper_exists: true,
      fixture_exists_and_parses: true,
      runner_exists: true,
      package_scripts_checked: true,
      docs_pointer_checked: true,
      no_new_api_route_checked: true,
      no_ui_component_added: true,
      no_schema_migration_changes_checked: true,
      no_dependency_addition_checked: true,
      static_inventory_checked: true,
      design_review_only_boundaries_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_PRODUCT_WRITE_DESIGN_REVIEW_VERSION",
    "manual_note_product_write_design_review.v0.1",
    "buildManualNoteProductWriteDesignReview",
    "buildManualNoteProductWriteDesignReviewMarkdown",
    "buildManualNoteProductWriteDesignReviewJson",
    "createManualNoteProductWriteDesignReviewFingerprint",
    "manual_note_product_write_design_review",
    "write_design_review_only",
    "candidate_product_write_targets",
    "required_authority_contracts",
    "proposed_future_schema_or_migration_work",
    "smallest_safe_future_write_prototype",
    "single_claim_candidate_fixture_write_dry_run",
    "product_write_boundary",
    "design_review_only: true",
    "normal_product_write_enabled: false",
    "product_db_write: false",
    "product_ids_created: false",
    "schema_changed: false",
    "migration_added: false",
    "provider_or_openai_calls: false",
    "retrieval_or_rag: false",
    "source_fetching: false",
    "external_handoff_sent: false",
    "durable_persistence: false",
    "browser_persistence: false",
    "temp_db_single_claim_write_prototype_design",
    "0x811c9dc5",
    "0x01000193",
    'key !== "generated_at" && key !== "local_copy_packet"',
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
  for (const targetGroup of requiredTargetGroups) {
    assert.ok(
      helper.includes(`target_group: "${targetGroup}"`),
      `helper must include target group ${targetGroup}`,
    );
  }
}

function assertFixtureContract() {
  assert.equal(fixture.review_kind, "manual_note_product_write_design_review");
  assert.equal(
    fixture.review_version,
    "manual_note_product_write_design_review.v0.1",
  );
  assert.match(fixture.review_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(fixture.design_status, "write_design_review_only");
  assert.equal(fixture.next_recommended_slice, "temp_db_single_claim_write_prototype_design");
  assert.equal(fixture.source_transaction_plan.commit_allowed, false);
  assert.equal(fixture.source_abort_result.product_write_attempted, false);
  assert.equal(fixture.source_abort_result.product_write_performed, false);

  const targetGroups = fixture.candidate_product_write_targets.map(
    (target) => target.target_group,
  );
  assert.deepEqual(
    targetGroups.sort(),
    [...requiredTargetGroups].sort(),
    "fixture must include every required candidate product write target group exactly once",
  );
  for (const target of fixture.candidate_product_write_targets) {
    assert.equal(target.future_write_allowed_in_this_pr, false);
    assert.equal(target.product_ids_allocated_now, false);
    assert.ok(
      Array.isArray(target.existing_repo_surface_candidates),
      `${target.target_group} must include repo surface candidates array`,
    );
    assert.ok(
      Array.isArray(target.required_authority_before_write) &&
        target.required_authority_before_write.length > 0,
      `${target.target_group} must include required authority contracts`,
    );
  }

  for (const requiredAuthority of [
    "explicit_operator_promotion_decision_contract",
    "source_verification_authority_contract",
    "proof_evidence_write_authority_contract",
    "canonical_perspective_write_authority_contract",
    "idempotency_storage_contract",
    "rollback_storage_contract",
    "review_audit_record_contract",
    "product_write_route_contract",
    "disabled_to_enabled_adapter_review_contract",
  ]) {
    assert.equal(
      fixture.required_authority_contracts[requiredAuthority],
      true,
      `${requiredAuthority} must be required`,
    );
  }

  assert.equal(
    fixture.smallest_safe_future_write_prototype.prototype_name,
    "single_claim_candidate_fixture_write_dry_run",
  );
  assert.equal(
    fixture.smallest_safe_future_write_prototype.still_requires_schema_review,
    true,
  );
  assert.equal(
    fixture.smallest_safe_future_write_prototype.still_requires_operator_gate,
    true,
  );
  assert.equal(
    fixture.smallest_safe_future_write_prototype.still_requires_temp_db_only_first,
    true,
  );
  assert.equal(
    fixture.smallest_safe_future_write_prototype
      .still_no_normal_product_write_until_approved,
    true,
  );

  assertBoundary(fixture.product_write_boundary);
  assert.equal(fixture.local_copy_packet.local_clipboard_only, true);
  assert.equal(fixture.local_copy_packet.external_handoff_sent, false);
  assert.equal(fixture.local_copy_packet.packet_persisted, false);
  assert.equal(fixture.local_copy_packet.product_write_authority_granted, false);
  assert.equal(fixture.local_copy_packet.actual_promotion_allowed, false);
  assert.deepEqual(fixture.repo_inventory_summary.scanned_paths, [
    "lib",
    "app/api",
    "components",
    "docs",
    "fixtures",
    "scripts",
  ]);
  assert.ok(
    fixture.repo_inventory_summary.inventory_limitations.some((line) =>
      line.includes("Static text inventory only"),
    ),
    "fixture must state static inventory limitation",
  );
  assert.doesNotMatch(fixtureText, /https?:\/\//i);
  assert.doesNotMatch(
    fixtureText,
    /raw manual note|manual note raw text|verbatim manual note/i,
  );
  assert.doesNotMatch(fixtureText, /\/tmp\/|\.db|sqlite/i);
}

function assertRunnerContract() {
  for (const requiredText of [
    "/tmp/augnes-product-write-design-review-v0-1",
    "product-write-design-review.json",
    "repo-inventory.json",
    "TRANSACTION_PLAN_FIXTURE_PATH",
    "ABORT_RESULT_FIXTURE_PATH",
    "CONTRACT_TEST_REPORT_PATH",
    "TRANSACTION_PLAN_REPORT_PATH",
    "SCANNED_PATHS",
    '"lib"',
    '"app/api"',
    '"components"',
    '"docs"',
    '"fixtures"',
    '"scripts"',
    "SELF_INVENTORY_EXCLUDES",
    helperPath,
    fixturePath,
    runnerPath,
    "scripts/smoke-research-candidate-product-write-design-review-v0-1.mjs",
    "SEARCH_TERMS",
    "Static text inventory only",
    "Inventory does not grant product write authority",
    "Inventory does not import or execute repo modules",
    "manual_note_product_write_design_review_report",
    "process.exitCode = 1",
  ]) {
    assert.ok(runner.includes(requiredText), `runner must include ${requiredText}`);
  }
  assert.doesNotMatch(
    runner,
    /from\s+["'][.]{1,2}\//,
    "runner must not import repo modules",
  );
  assert.doesNotMatch(
    runner,
    /\b(import\s*\(|require\s*\()/,
    "runner must not dynamically execute repo modules",
  );
  const writeFileLines = runner
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("await writeFile("));
  assert.deepEqual(writeFileLines, [
    "await writeFile(INVENTORY_PATH, `${JSON.stringify(repoInventory, null, 2)}\\n`);",
    "await writeFile(REVIEW_PATH, `${JSON.stringify(review, null, 2)}\\n`);",
    "await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\\n`);",
  ]);
}

function assertDocsPackageAndBrowserPointers() {
  assert.equal(
    packageJson.scripts["smoke:research-candidate-product-write-design-review-v0-1"],
    "node scripts/smoke-research-candidate-product-write-design-review-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts["design:research-candidate-product-write-design-review-v0-1"],
    "node scripts/run-research-candidate-product-write-design-review-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-temp-db-single-claim-prototype-design-v0-1"
    ],
    "node scripts/smoke-research-candidate-temp-db-single-claim-prototype-design-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "design:research-candidate-temp-db-single-claim-prototype-design-v0-1"
    ],
    "node scripts/run-research-candidate-temp-db-single-claim-prototype-design-v0-1.mjs",
  );

  for (const requiredText of [
    "Manual note first product-write design review",
    "Manual note temp DB single-claim write prototype design",
    "static repo inventory",
    "candidate product write target groups",
    "smallest safe future write prototype",
    "structured temp schema design objects",
    "idempotency/rollback/audit/source-authority gates",
    "future temp DB execution harness spec",
    "no temp DB execution yet",
    "no DB file creation",
    "no SQL execution",
    "no executable SQL strings",
    tempDbSingleClaimDesignHelperPath,
    "npm run smoke:research-candidate-temp-db-single-claim-prototype-design-v0-1",
    "npm run design:research-candidate-temp-db-single-claim-prototype-design-v0-1",
    "/tmp design review report runner",
    "no new route",
    "no UI behavior change",
    "no normal product write",
    "no actual promotion",
    "no proof/evidence write",
    "no Perspective/canonical graph write",
    "no work item",
    "no provider/retrieval/source fetch",
    "no external handoff",
    "no durable persistence",
    "no schema/migration/dependency",
    "best available method",
  ]) {
    assert.ok(
      normalizedDocsIndex.includes(requiredText),
      `docs must include ${requiredText}`,
    );
  }

  assert.ok(
    browserValidator.includes("product_write_design_review_artifact_note"),
    "browser validator should include product-write design review artifact note",
  );
  assert.ok(
    browserValidator.includes("product_write_design_review_no_browser_route"),
    "browser validator should assert no product-write design review route is called",
  );
  assert.ok(
    browserValidator.includes(
      "temp_db_single_claim_prototype_design_artifact_note",
    ),
    "browser validator should include temp DB single-claim prototype design artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "temp_db_single_claim_prototype_design_no_browser_route",
    ),
    "browser validator should assert no temp DB single-claim prototype design route is called",
  );
}

function assertNoRouteUiSchemaDependencyExpansion() {
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /product-write-design-review|product-write-design|write-design-review/i.test(
      filePath,
    ),
  );
  assert.deepEqual(routeFiles, [], "no API route may be added for design review");

  const uiFiles = listFiles("components").filter((filePath) =>
    /product-write-design-review|product-write-design|write-design-review/i.test(
      filePath,
    ),
  );
  assert.deepEqual(uiFiles, [], "no UI component should be added for this slice");

  const changedFiles = new Set(readGitChangedFiles());
  for (const filePath of changedFiles) {
    assert.ok(
      !/(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
        filePath,
      ) && !/^lib\/db(\.ts|\/)/.test(filePath),
      `schema or migration file must not be changed: ${filePath}`,
    );
  }

  const packageDiff = readCommand("git diff -- package.json");
  const addedPackageLines = packageDiff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  for (const line of addedPackageLines) {
    assert.ok(
      line.includes(
        '"smoke:research-candidate-product-write-design-review-v0-1"',
      ) ||
      line.includes(
        '"design:research-candidate-product-write-design-review-v0-1"',
      ) ||
        line.includes(
          '"smoke:research-candidate-temp-db-single-claim-prototype-design-v0-1"',
        ) ||
        line.includes(
          '"design:research-candidate-temp-db-single-claim-prototype-design-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-temp-db-single-claim-write-prototype-v0-1"',
        ) ||
        line.includes(
          '"harness:research-candidate-temp-db-single-claim-write-prototype-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-temp-db-single-claim-result-review-v0-1"',
        ) ||
        line.includes(
          '"review:research-candidate-temp-db-single-claim-result-review-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-temp-db-single-claim-result-contract-tests-v0-1"',
        ) ||
        line.includes(
          '"contracts:research-candidate-temp-db-single-claim-result-contract-tests-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-product-write-gate-design-v0-1"',
        ) ||
        line.includes(
          '"design:research-candidate-single-claim-product-write-gate-design-v0-1"',
        ),
      `package.json must only add product-write design-review or temp DB single-claim design/harness scripts, not dependencies: ${line}`,
    );
  }
}

function assertForbiddenPatternsAbsent() {
  for (const [label, text] of [
    ["helper", helper],
    ["runner", runner],
  ]) {
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not call fetch`);
    assert.doesNotMatch(
      text,
      /\bopenDatabase\s*\(/,
      `${label} must not call openDatabase`,
    );
    assert.doesNotMatch(
      text,
      /\b(INSERT|UPDATE|DELETE|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\b/i,
      `${label} must not contain SQL write/schema statements`,
    );
    assert.doesNotMatch(
      text,
      /\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/,
      `${label} must not use browser persistence`,
    );
    assert.doesNotMatch(
      text,
      /from\s+["'][^"']*(openai|provider|retrieval|rag|source-fetch|proof|evidence|work-item|perspective-write|canonical-write)[^"']*["']/i,
      `${label} must not import provider/retrieval/source/proof/evidence/work/Perspective write modules`,
    );
  }
}

function assertBoundary(boundary) {
  assert.equal(boundary.design_review_only, true);
  for (const [key, value] of Object.entries(boundary)) {
    if (key === "design_review_only") continue;
    assert.equal(value, false, `boundary flag ${key} must be false`);
  }
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  const output = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    const stat = statSync(current);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(current)) stack.push(path.join(current, entry));
      continue;
    }
    output.push(current);
  }
  return output;
}

function readGitChangedFiles() {
  return readCommand("git diff --name-only")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readCommand(command) {
  return execSync(command, { encoding: "utf8" });
}
