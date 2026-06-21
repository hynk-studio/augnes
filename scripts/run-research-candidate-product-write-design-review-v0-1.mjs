import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const ARTIFACT_DIR = "/tmp/augnes-product-write-design-review-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const REVIEW_PATH = path.join(ARTIFACT_DIR, "product-write-design-review.json");
const INVENTORY_PATH = path.join(ARTIFACT_DIR, "repo-inventory.json");
const TRANSACTION_PLAN_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-disabled-write-adapter-transaction-plan.sample.v0.1.json";
const ABORT_RESULT_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-disabled-write-adapter-abort-result.sample.v0.1.json";
const CONTRACT_TEST_REPORT_PATH =
  "/tmp/augnes-disabled-write-adapter-contract-tests-v0-1/report.json";
const TRANSACTION_PLAN_REPORT_PATH =
  "/tmp/augnes-disabled-write-adapter-transaction-plan-v0-1/report.json";
const REVIEW_VERSION = "manual_note_product_write_design_review.v0.1";
const SCANNED_PATHS = ["lib", "app/api", "components", "docs", "fixtures", "scripts"];
const SELF_INVENTORY_EXCLUDES = new Set([
  "lib/research-candidate-review/manual-note-product-write-design-review.ts",
  "fixtures/research-candidate-review.manual-note-product-write-design-review.sample.v0.1.json",
  "scripts/run-research-candidate-product-write-design-review-v0-1.mjs",
  "scripts/smoke-research-candidate-product-write-design-review-v0-1.mjs",
]);
const SEARCH_TERMS = [
  "perspective",
  "canonical",
  "proof",
  "evidence",
  "work item",
  "audit",
  "idempotency",
  "rollback",
  "promotion",
  "graph",
  "source verification",
];

async function main() {
  const transactionPlan = await readJson(TRANSACTION_PLAN_FIXTURE_PATH);
  const abortResult = await readJson(ABORT_RESULT_FIXTURE_PATH);
  const contractTestReport = await readOptionalJson(CONTRACT_TEST_REPORT_PATH);
  const transactionPlanReport = await readOptionalJson(TRANSACTION_PLAN_REPORT_PATH);
  const repoInventory = await buildRepoInventory();
  const review = buildDesignReview({
    transactionPlan,
    abortResult,
    repoInventory,
    contractTestReport,
  });
  const report = {
    report_kind: "manual_note_product_write_design_review_report",
    report_version: REVIEW_VERSION,
    artifact_dir: ARTIFACT_DIR,
    artifact_paths: {
      report: REPORT_PATH,
      product_write_design_review: REVIEW_PATH,
      repo_inventory: INVENTORY_PATH,
    },
    optional_inputs: {
      contract_test_report_present: Boolean(contractTestReport),
      transaction_plan_report_present: Boolean(transactionPlanReport),
      contract_test_final_status: contractTestReport?.final_status ?? null,
      transaction_plan_report_final_status:
        transactionPlanReport?.final_status ?? null,
    },
    repo_inventory: repoInventory,
    product_write_design_review: review,
    preserved_boundaries: productWriteBoundary(),
    final_status: validateReport(review) ? "pass" : "fail",
  };

  await mkdir(ARTIFACT_DIR, { recursive: true });
  await writeFile(INVENTORY_PATH, `${JSON.stringify(repoInventory, null, 2)}\n`);
  await writeFile(REVIEW_PATH, `${JSON.stringify(review, null, 2)}\n`);
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        design: "research-candidate-product-write-design-review-v0-1",
        final_status: report.final_status,
        review_fingerprint: review.review_fingerprint,
        candidate_product_write_target_count:
          review.candidate_product_write_targets.length,
        artifact_paths: report.artifact_paths,
        inventory_scanned_paths: repoInventory.scanned_paths,
      },
      null,
      2,
    ),
  );

  if (report.final_status !== "pass") {
    process.exitCode = 1;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readOptionalJson(filePath) {
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function buildRepoInventory() {
  const files = [];
  for (const scanPath of SCANNED_PATHS) {
    files.push(...(await collectTextFiles(scanPath)));
  }
  const termHits = new Map(SEARCH_TERMS.map((term) => [term, []]));
  for (const filePath of files.sort()) {
    const text = await readFile(filePath, "utf8").catch(() => "");
    const normalizedText = text.toLowerCase();
    for (const term of SEARCH_TERMS) {
      const count = countOccurrences(normalizedText, term.toLowerCase());
      if (count > 0) {
        termHits.get(term)?.push(`${filePath}#${term}:${count}`);
      }
    }
  }
  const likelyExisting = [];
  const ambiguous = [];
  const missing = [];
  for (const term of SEARCH_TERMS) {
    const hits = termHits.get(term) ?? [];
    if (hits.length === 0) {
      missing.push(term);
      continue;
    }
    for (const hit of hits.slice(0, 8)) {
      if (
        hit.startsWith("lib/") ||
        hit.startsWith("app/api/") ||
        hit.startsWith("components/")
      ) {
        likelyExisting.push(hit);
      } else {
        ambiguous.push(hit);
      }
    }
  }
  return {
    inventory_kind: "manual_note_product_write_design_static_repo_inventory",
    inventory_version: REVIEW_VERSION,
    scanned_paths: SCANNED_PATHS,
    search_terms: SEARCH_TERMS,
    likely_existing_surfaces: Array.from(new Set(likelyExisting)).sort().slice(0, 60),
    likely_missing_surfaces: missing,
    ambiguous_surfaces: Array.from(new Set(ambiguous)).sort().slice(0, 60),
    inventory_limitations: [
      "Static text inventory only; it does not prove write correctness.",
      "Inventory does not grant product write authority.",
      "Inventory does not prove schema readiness.",
      "Inventory does not perform source/evidence verification.",
      "Inventory does not import or execute repo modules.",
    ],
  };
}

async function collectTextFiles(rootPath) {
  const result = [];
  const rootStats = await stat(rootPath).catch(() => null);
  if (!rootStats) return result;
  async function visit(currentPath) {
    const currentStats = await stat(currentPath).catch(() => null);
    if (!currentStats) return;
    if (currentStats.isDirectory()) {
      const entries = await readdir(currentPath);
      for (const entry of entries) {
        if (
          entry === "node_modules" ||
          entry === ".next" ||
          entry === "dist" ||
          entry === "coverage"
        ) {
          continue;
        }
        await visit(path.join(currentPath, entry));
      }
      return;
    }
    if (
      isTextFile(currentPath) &&
      currentStats.size <= 400_000 &&
      !SELF_INVENTORY_EXCLUDES.has(currentPath)
    ) {
      result.push(currentPath);
    }
  }
  await visit(rootPath);
  return result;
}

function isTextFile(filePath) {
  return /\.(ts|tsx|js|jsx|mjs|cjs|json|md|css|sql|txt)$/i.test(filePath);
}

function countOccurrences(text, term) {
  if (!term) return 0;
  let count = 0;
  let index = text.indexOf(term);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(term, index + term.length);
  }
  return count;
}

function buildDesignReview({
  transactionPlan,
  abortResult,
  repoInventory,
  contractTestReport,
}) {
  const sourceTransactionPlan = {
    plan_version: transactionPlan.plan_version ?? null,
    plan_fingerprint: transactionPlan.plan_fingerprint ?? null,
    plan_status: transactionPlan.plan_status ?? null,
    operation_count: countOperations(transactionPlan.operation_groups),
    commit_allowed: false,
  };
  const sourceAbortResult = {
    result_version: abortResult.result_version ?? null,
    result_fingerprint: abortResult.result_fingerprint ?? null,
    result_status: abortResult.result_status ?? null,
    product_write_attempted: false,
    product_write_performed: false,
  };
  const reviewCore = {
    review_kind: "manual_note_product_write_design_review",
    review_version: REVIEW_VERSION,
    review_fingerprint: "",
    source_transaction_plan: sourceTransactionPlan,
    source_abort_result: sourceAbortResult,
    design_status: "write_design_review_only",
    review_summary:
      "Design review only: maps disabled transaction-plan operations to future product-write surfaces and authority contracts without enabling or performing writes.",
    candidate_product_write_targets: buildCandidateTargets(repoInventory),
    repo_inventory_summary: {
      scanned_paths: repoInventory.scanned_paths,
      likely_existing_surfaces: repoInventory.likely_existing_surfaces,
      likely_missing_surfaces: repoInventory.likely_missing_surfaces,
      ambiguous_surfaces: repoInventory.ambiguous_surfaces,
      inventory_limitations: repoInventory.inventory_limitations,
    },
    required_authority_contracts: {
      explicit_operator_promotion_decision_contract: true,
      source_verification_authority_contract: true,
      proof_evidence_write_authority_contract: true,
      canonical_perspective_write_authority_contract: true,
      idempotency_storage_contract: true,
      rollback_storage_contract: true,
      review_audit_record_contract: true,
      product_write_route_contract: true,
      disabled_to_enabled_adapter_review_contract: true,
    },
    proposed_future_schema_or_migration_work: {
      idempotency_storage_surface:
        "Design durable idempotency storage keyed by preview draft, selected candidate ids, transaction plan fingerprint, and a future operator decision id.",
      rollback_ledger_or_reversible_operation_log:
        "Design rollback ledger or reversible operation log before enabling any product write adapter.",
      promotion_audit_record:
        "Design promotion review audit records that are distinct from preview draft activity metadata.",
      source_evidence_verification_records:
        "Design source/evidence verification records in a separate authority lane before proof/evidence writes.",
      preview_candidate_to_product_id_mapping:
        "Design mapping from preview draft and candidate ids to product ids allocated only by a future authorized write contract.",
      existing_table_candidates_discovered_by_inventory:
        repoInventory.likely_existing_surfaces.slice(0, 12),
    },
    smallest_safe_future_write_prototype: {
      prototype_name: "single_claim_candidate_fixture_write_dry_run",
      still_requires_schema_review: true,
      still_requires_operator_gate: true,
      still_requires_temp_db_only_first: true,
      still_no_normal_product_write_until_approved: true,
      allowed_future_scope: [
        "one selected claim candidate",
        "temp DB only",
        "disabled-by-default execution flag",
        "explicit rollback/idempotency/audit report",
      ],
      forbidden_future_scope: [
        "bulk promotion",
        "proof/evidence creation",
        "Perspective graph mutation",
        "work item creation",
        "provider/retrieval/source fetch",
        "external handoff",
      ],
    },
    product_write_boundary: productWriteBoundary(),
    next_recommended_slice: "temp_db_single_claim_write_prototype_design",
  };
  const reviewFingerprint = fingerprint({
    ...reviewCore,
    source_transaction_plan: sourceTransactionPlan,
    source_abort_result: sourceAbortResult,
    contract_test_final_status: contractTestReport?.final_status ?? null,
  });
  const review = {
    ...reviewCore,
    review_fingerprint: reviewFingerprint,
  };
  return {
    ...review,
    local_copy_packet: {
      markdown: buildMarkdown(review),
      json: buildJson(review),
      fingerprint: reviewFingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted: false,
      product_write_authority_granted: false,
      actual_promotion_allowed: false,
    },
  };
}

function buildCandidateTargets(repoInventory) {
  return TARGET_GROUPS.map((target) => {
    const candidates = findSurfaceCandidates(target.surface_terms, repoInventory);
    return {
      target_group: target.target_group,
      source_operation_group: target.source_operation_group,
      future_product_record_kind: target.future_product_record_kind,
      existing_repo_surface_candidates: candidates,
      required_authority_before_write: target.authority,
      schema_status:
        candidates.length > 0 ? target.schema_status : "unknown_requires_inventory",
      future_write_allowed_in_this_pr: false,
      product_ids_allocated_now: false,
      open_design_questions: target.questions,
    };
  });
}

const TARGET_GROUPS = [
  {
    target_group: "claims",
    source_operation_group: "claim_operations",
    future_product_record_kind: "canonical claim or claim-candidate product record",
    authority: [
      "explicit_operator_promotion_decision_contract",
      "canonical_perspective_write_authority_contract",
      "product_write_route_contract",
      "idempotency_storage_contract",
      "rollback_storage_contract",
      "review_audit_record_contract",
    ],
    schema_status: "unknown_requires_inventory",
    questions: [
      "Which canonical claim table or product record owns promoted manual-note claims?",
      "Which operator decision record allocates a future claim product id?",
    ],
    surface_terms: ["canonical", "claim", "promotion"],
  },
  {
    target_group: "evidence_or_proof_records",
    source_operation_group: "evidence_operations",
    future_product_record_kind: "proof/evidence product record",
    authority: [
      "source_verification_authority_contract",
      "proof_evidence_write_authority_contract",
      "product_write_route_contract",
      "idempotency_storage_contract",
      "rollback_storage_contract",
      "review_audit_record_contract",
    ],
    schema_status: "requires_schema_design",
    questions: [
      "What verified source material may become proof or evidence?",
      "Which write contract allocates proof and evidence ids after verification?",
    ],
    surface_terms: ["proof", "evidence", "source verification"],
  },
  {
    target_group: "perspective_records",
    source_operation_group: "perspective_operations",
    future_product_record_kind: "Perspective or canonical Perspective product record",
    authority: [
      "explicit_operator_promotion_decision_contract",
      "canonical_perspective_write_authority_contract",
      "product_write_route_contract",
      "idempotency_storage_contract",
      "rollback_storage_contract",
      "review_audit_record_contract",
    ],
    schema_status: "existing_surface_candidate",
    questions: [
      "Which Perspective surface owns promoted claim framing?",
      "How should preview candidates map to a future Perspective id allocation contract?",
    ],
    surface_terms: ["perspective", "canonical", "promotion"],
  },
  {
    target_group: "canonical_graph_edges",
    source_operation_group: "perspective_operations",
    future_product_record_kind: "canonical graph edge product record",
    authority: [
      "canonical_perspective_write_authority_contract",
      "product_write_route_contract",
      "idempotency_storage_contract",
      "rollback_storage_contract",
      "review_audit_record_contract",
    ],
    schema_status: "requires_schema_design",
    questions: [
      "Which graph edge kinds are allowed for promoted manual-note candidates?",
      "How are reversible graph mutations represented before normal product writes?",
    ],
    surface_terms: ["graph", "canonical", "perspective"],
  },
  {
    target_group: "source_verification_records",
    source_operation_group: "source_verification_operations",
    future_product_record_kind: "source verification authority record",
    authority: [
      "source_verification_authority_contract",
      "product_write_route_contract",
      "idempotency_storage_contract",
      "rollback_storage_contract",
      "review_audit_record_contract",
    ],
    schema_status: "requires_schema_design",
    questions: [
      "Which lane verifies source references without fetching inside this lane?",
      "What record proves source verification before proof/evidence writes?",
    ],
    surface_terms: ["source verification", "source", "evidence"],
  },
  {
    target_group: "work_items",
    source_operation_group: "work_item_operations",
    future_product_record_kind: "separate work item lane record",
    authority: [
      "explicit_operator_promotion_decision_contract",
      "product_write_route_contract",
      "review_audit_record_contract",
    ],
    schema_status: "existing_surface_candidate",
    questions: [
      "Which separate lane may create work items from follow-up candidates?",
      "How does the promotion lane prove it did not create work items directly?",
    ],
    surface_terms: ["work item", "work_item", "work"],
  },
  {
    target_group: "audit_records",
    source_operation_group: "transaction_plan_control_plane",
    future_product_record_kind: "promotion review audit record",
    authority: [
      "review_audit_record_contract",
      "explicit_operator_promotion_decision_contract",
      "product_write_route_contract",
    ],
    schema_status: "requires_schema_design",
    questions: [
      "Which audit record distinguishes preview activity from operator promotion decision history?",
      "What fields are required to replay or inspect a future product write decision?",
    ],
    surface_terms: ["audit", "promotion"],
  },
  {
    target_group: "idempotency_records",
    source_operation_group: "transaction_plan_control_plane",
    future_product_record_kind: "durable idempotency record",
    authority: [
      "idempotency_storage_contract",
      "product_write_route_contract",
      "review_audit_record_contract",
    ],
    schema_status: "requires_schema_design",
    questions: [
      "Where is the future idempotency key stored before any product write?",
      "How are preview draft, selected candidate, and operator decision inputs bound?",
    ],
    surface_terms: ["idempotency", "promotion"],
  },
  {
    target_group: "rollback_records",
    source_operation_group: "transaction_plan_control_plane",
    future_product_record_kind: "rollback ledger or reversible operation log",
    authority: [
      "rollback_storage_contract",
      "product_write_route_contract",
      "review_audit_record_contract",
    ],
    schema_status: "requires_schema_design",
    questions: [
      "Which reversible operation log is required before any future product write?",
      "How does rollback identify all product ids allocated by a future write contract?",
    ],
    surface_terms: ["rollback", "audit", "promotion"],
  },
];

function findSurfaceCandidates(terms, repoInventory) {
  const normalizedTerms = terms.map((term) => term.toLowerCase());
  const candidates = [
    ...repoInventory.likely_existing_surfaces,
    ...repoInventory.ambiguous_surfaces,
  ].filter((surface) => {
    const normalizedSurface = surface.toLowerCase();
    return normalizedTerms.some((term) => normalizedSurface.includes(term));
  });
  return Array.from(new Set(candidates)).slice(0, 8);
}

function countOperations(operationGroups) {
  return Object.values(operationGroups ?? {}).reduce((total, value) => {
    if (!Array.isArray(value)) return total;
    return total + value.length;
  }, 0);
}

function productWriteBoundary() {
  return {
    design_review_only: true,
    normal_product_write_enabled: false,
    product_db_write: false,
    actual_promotion_performed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    product_ids_created: false,
    schema_changed: false,
    migration_added: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    durable_persistence: false,
    browser_persistence: false,
  };
}

function buildMarkdown(review) {
  const targetLines = review.candidate_product_write_targets.map(
    (target) =>
      `- ${target.target_group}: ${target.future_product_record_kind}; schema_status=${target.schema_status}; future_write_allowed_in_this_pr=false`,
  );
  return [
    "# Manual Note Product-Write Design Review",
    "",
    "Design review only.",
    "This does not perform normal product writes.",
    "This does not perform actual promotion.",
    `review_fingerprint: ${review.review_fingerprint}`,
    `source_plan_fingerprint: ${review.source_transaction_plan.plan_fingerprint}`,
    "",
    "## Candidate Product Write Targets",
    ...targetLines,
    "",
    "## Smallest Safe Future Prototype",
    review.smallest_safe_future_write_prototype.prototype_name,
    "",
    "## Boundary",
    "normal_product_write_enabled=false",
    "product_db_write=false",
    "product_ids_created=false",
  ].join("\n");
}

function buildJson(review) {
  return JSON.stringify(
    {
      review_kind: review.review_kind,
      review_version: review.review_version,
      review_fingerprint: review.review_fingerprint,
      design_status: review.design_status,
      target_groups: review.candidate_product_write_targets.map(
        (target) => target.target_group,
      ),
      product_write_boundary: review.product_write_boundary,
      next_recommended_slice: review.next_recommended_slice,
    },
    null,
    2,
  );
}

function validateReport(review) {
  if (review.review_kind !== "manual_note_product_write_design_review") return false;
  if (review.review_version !== REVIEW_VERSION) return false;
  if (!/^fnv1a32:[0-9a-f]{8}$/.test(review.review_fingerprint)) return false;
  if (review.design_status !== "write_design_review_only") return false;
  if (review.candidate_product_write_targets.length !== TARGET_GROUPS.length) {
    return false;
  }
  for (const target of review.candidate_product_write_targets) {
    if (target.future_write_allowed_in_this_pr !== false) return false;
    if (target.product_ids_allocated_now !== false) return false;
  }
  return validateBoundary(review.product_write_boundary);
}

function validateBoundary(boundary) {
  if (boundary.design_review_only !== true) return false;
  for (const [key, value] of Object.entries(boundary)) {
    if (key === "design_review_only") continue;
    if (value !== false) return false;
  }
  return true;
}

function fingerprint(input) {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function stripGeneratedFields(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stripGeneratedFields(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "generated_at" && key !== "local_copy_packet")
        .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]),
    );
  }
  return value;
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

await main();
