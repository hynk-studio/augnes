import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  PERSONAL_PERSPECTIVE_CASEBOOK_NEGATIVE_FIXTURES_V01,
  PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01,
  buildPersonalPerspectiveCasebookNegativeInputV01,
  createExactBoundaryPersonalPerspectiveCasebookSeedV01,
  createExactMaxCollectionsPersonalPerspectiveCasebookSeedV01,
} from "@/fixtures/vnext/research/personal-perspective-semantic-casebook-v0-1";
import {
  PERSONAL_PERSPECTIVE_AUTHORITY_FLAGS_V01,
  PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01,
  PERSONAL_PERSPECTIVE_CASEBOOK_METHOD_VERSION_V01,
  PERSONAL_PERSPECTIVE_CASEBOOK_VERSION_V01,
  PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01,
  PERSONAL_PERSPECTIVE_SEMANTIC_DEFINITION_VERSION_V01,
  canonicalizePersonalPerspectiveCasebookValueV01,
  clone,
  normalizeAndBuildPersonalPerspectiveSemanticCasebookV01,
  resignPersonalPerspectiveSemanticCasebookV01,
  validatePersonalPerspectiveSemanticCasebookV01,
  type PersonalPerspectiveSemanticCasebookSeedV01,
  type PersonalPerspectiveSemanticCasebookV01,
  type PersonalPerspectiveValidationIssueV01,
} from "@/scripts/lib/personal-perspective-semantic-casebook-v0-1";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";

const PURE_LIBRARY_PATH =
  "scripts/lib/personal-perspective-semantic-casebook-v0-1.ts";
const FIXED_PRIMITIVE_CANONICAL = '{"a":["synthetic",true],"z":1}';
const FIXED_PRIMITIVE_SHA256 =
  "sha256:1a41d3f0604c122e12fa1f3b3ae99bafc51fb7aecca14d7705a329cd39e69094";
const FIXED_SEMANTIC_DEFINITION_VERSION =
  "personal_perspective_semantics.v0.1";
const FIXED_REPRESENTATIVE_CASE_ID =
  "ppscb-case-v0-1:019f0a735ab5a7e2ef2c0f2c";
const FIXED_REPRESENTATIVE_CASE_FINGERPRINT =
  "sha256:0d3ea065090e06ac1f90664602cc96bef0ee2f34727a3231a4e9f55a41a692e9";
const FIXED_AGGREGATE_FINGERPRINT =
  "sha256:246253b71d15b8f23a3803737df8bc7c28f741aa99f94419d15e42e5b53e785b";
const FIXED_VALID_CASE_COUNT = 29;
const FIXED_NEGATIVE_FIXTURE_COUNT = 214;
const REQUIRED_RESIGNED_SEMANTIC_ATTACKS = new Set([
  "resigned_model_inference_accepted_identity",
  "resigned_deleted_item_reuse",
  "resigned_hidden_context_injection",
  "resigned_fake_personal_project_id",
  "resigned_known_present_without_relation",
  "resigned_task_choice_promoted_global",
  "resigned_false_premise_admission",
  "resigned_persistence_authority",
  "resigned_cross_project_sharing_authority",
]);

let fetchCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = (async () => {
  fetchCalls += 1;
  throw new Error("casebook_validation_fetch_forbidden");
}) as typeof fetch;

try {
  assert.equal(
    PERSONAL_PERSPECTIVE_SEMANTIC_DEFINITION_VERSION_V01,
    FIXED_SEMANTIC_DEFINITION_VERSION,
    "semantic definition version must match its independent regression anchor",
  );
  const frozenSeed = deepFreeze(clone(PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01));
  const seedBefore = canonicalizePersonalPerspectiveCasebookValueV01(frozenSeed);
  const primary = normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(frozenSeed);
  assert.equal(
    canonicalizePersonalPerspectiveCasebookValueV01(frozenSeed),
    seedBefore,
    "normalizer must not mutate its source fixture",
  );
  const frozenPrimary = deepFreeze(clone(primary));
  const primaryBefore = canonicalizePersonalPerspectiveCasebookValueV01(frozenPrimary);
  const primaryValidation = validatePersonalPerspectiveSemanticCasebookV01(frozenPrimary);
  assert.equal(
    canonicalizePersonalPerspectiveCasebookValueV01(frozenPrimary),
    primaryBefore,
    "validator must not mutate its input",
  );
  assert.equal(primaryValidation.status, "valid", formatIssues(primaryValidation.issues));
  assert.ok(primaryValidation.normalized);

  const repeated = normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(
    deepFreeze(clone(PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01)),
  );
  assert.equal(
    canonicalizePersonalPerspectiveCasebookValueV01(repeated),
    canonicalizePersonalPerspectiveCasebookValueV01(primary),
    "identical source input must yield byte-identical normalized output",
  );

  const reorderedSeed = reverseUnorderedSeed(
    clone(PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01),
  );
  const reordered = normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(
    deepFreeze(reorderedSeed),
  );
  assert.equal(
    canonicalizePersonalPerspectiveCasebookValueV01(reordered),
    canonicalizePersonalPerspectiveCasebookValueV01(primary),
    "semantically unordered seed collections must normalize equivalently",
  );

  const resignedReordered = resignPersonalPerspectiveSemanticCasebookV01({
    ...clone(primary),
    sources: [...clone(primary.sources)].reverse(),
    cases: [...clone(primary.cases)].reverse(),
    coverage_matrix: [...clone(primary.coverage_matrix)].reverse(),
  });
  assert.equal(
    canonicalizePersonalPerspectiveCasebookValueV01(resignedReordered),
    canonicalizePersonalPerspectiveCasebookValueV01(primary),
    "normalized contract collection order must be canonical",
  );

  const exactDuplicateSeed = clone(PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01);
  exactDuplicateSeed.sources.push(clone(requiredFirst(exactDuplicateSeed.sources)));
  exactDuplicateSeed.cases.push(clone(requiredFirst(exactDuplicateSeed.cases)));
  const duplicateNormalized = normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(
    deepFreeze(exactDuplicateSeed),
  );
  assert.equal(
    canonicalizePersonalPerspectiveCasebookValueV01(duplicateNormalized),
    canonicalizePersonalPerspectiveCasebookValueV01(primary),
    "exact duplicate seed items must deduplicate deterministically",
  );

  const conflictingDuplicateSeed = clone(
    PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01,
  );
  const conflictingSource = clone(requiredFirst(conflictingDuplicateSeed.sources));
  conflictingSource.summary =
    "A conflicting fictional source reuses one seed identity.";
  conflictingDuplicateSeed.sources.push(conflictingSource);
  assert.throws(
    () =>
      normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(
        conflictingDuplicateSeed,
      ),
    /casebook_fixture_conflicting_duplicate_identity/,
    "conflicting seed duplicates must fail closed",
  );

  const authorityShapedSeed = clone(
    PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01,
  ) as PersonalPerspectiveSemanticCasebookSeedV01 & Record<string, unknown>;
  authorityShapedSeed.persistence_authorized = true;
  assert.throws(
    () => normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(authorityShapedSeed),
    /casebook_seed_definition_invalid/,
    "normalization must not drop an unknown authority-shaped seed field",
  );

  const ambiguousScopeSeed = clone(
    PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01,
  );
  (ambiguousScopeSeed.cases[0]!.scope as unknown as Record<string, unknown>).ambiguous =
    true;
  assert.throws(
    () => normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(ambiguousScopeSeed),
    /casebook_seed_definition_invalid/,
    "normalization must not coerce ambiguous scope into admitted scope",
  );

  const providerFieldSeed = clone(
    PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01,
  );
  (providerFieldSeed.cases[0] as unknown as Record<string, unknown>).provider_required =
    true;
  assert.throws(
    () => normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(providerFieldSeed),
    /casebook_seed_definition_invalid/,
    "normalization must not drop provider-specific seed fields",
  );

  const unknownCoverageSeed = clone(
    PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01,
  );
  (
    unknownCoverageSeed.coverage[0] as unknown as Record<string, unknown>
  ).requirement_id = "P99_unknown_fixture_claim";
  assert.throws(
    () =>
      normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(
        unknownCoverageSeed,
      ),
    /casebook_seed_definition_invalid/,
    "normalization must reject unknown coverage requirements",
  );

  const conflictingCoverageSeed = clone(
    PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01,
  );
  const conflictingCoverage = clone(requiredFirst(conflictingCoverageSeed.coverage));
  conflictingCoverage.case_keys = ["aspirational-identity"];
  conflictingCoverageSeed.coverage.push(conflictingCoverage);
  assert.throws(
    () =>
      normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(
        conflictingCoverageSeed,
      ),
    /casebook_seed_definition_invalid/,
    "normalization must reject conflicting duplicate coverage claims",
  );

  const exactDuplicateCoverageSeed = clone(
    PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01,
  );
  exactDuplicateCoverageSeed.coverage.push(
    clone(requiredFirst(exactDuplicateCoverageSeed.coverage)),
  );
  const exactDuplicateCoverage =
    normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(
      exactDuplicateCoverageSeed,
    );
  assert.equal(
    canonicalizePersonalPerspectiveCasebookValueV01(exactDuplicateCoverage),
    canonicalizePersonalPerspectiveCasebookValueV01(primary),
    "exact duplicate coverage claims must normalize deterministically",
  );

  for (const caseKey of [
    "stale-candidate",
    "retracted-candidate",
    "deleted-item-tombstone",
  ]) {
    const missingStatusSeed = clone(
      PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01,
    );
    const caseSeed = missingStatusSeed.cases.find(
      (candidate) => candidate.case_key === caseKey,
    );
    assert.ok(caseSeed);
    delete (caseSeed as unknown as Record<string, unknown>).candidate_status;
    assert.throws(
      () =>
        normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(
          missingStatusSeed,
        ),
      /casebook_seed_definition_invalid/,
      `${caseKey} status must not disappear during normalization`,
    );
  }

  const inheritedAuthoritySeed = Object.assign(
    Object.create({ persistence_authorized: true }) as Record<string, unknown>,
    clone(PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01),
  ) as unknown as PersonalPerspectiveSemanticCasebookSeedV01;
  assert.throws(
    () =>
      normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(
        inheritedAuthoritySeed,
      ),
    /casebook_seed_definition_invalid/,
    "normalization must reject non-plain seed objects with inherited authority",
  );

  const exactBoundary = normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(
    deepFreeze(createExactBoundaryPersonalPerspectiveCasebookSeedV01()),
  );
  const exactBoundaryValidation = validatePersonalPerspectiveSemanticCasebookV01(
    deepFreeze(exactBoundary),
  );
  assert.equal(
    exactBoundaryValidation.status,
    "valid",
    formatIssues(exactBoundaryValidation.issues),
  );

  const exactMaxCollections = normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(
    deepFreeze(createExactMaxCollectionsPersonalPerspectiveCasebookSeedV01()),
  );
  const exactMaxCollectionsValidation =
    validatePersonalPerspectiveSemanticCasebookV01(deepFreeze(exactMaxCollections));
  assert.equal(
    exactMaxCollectionsValidation.status,
    "valid",
    formatIssues(exactMaxCollectionsValidation.issues),
  );

  assert.equal(primary.coverage_matrix.length, PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01.length);
  assert.deepEqual(
    primary.coverage_matrix.map((entry) => entry.requirement_id),
    [...PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01],
  );
  assert.ok(primary.coverage_matrix.every((entry) => entry.case_refs.length > 0));

  let invalidAdmittedCandidates = 0;
  let resignedAttackCount = 0;
  for (const descriptor of PERSONAL_PERSPECTIVE_CASEBOOK_NEGATIVE_FIXTURES_V01) {
    const invalidInput = buildPersonalPerspectiveCasebookNegativeInputV01(
      descriptor,
      primary,
    );
    const before = canonicalizePersonalPerspectiveCasebookValueV01(invalidInput);
    const validation = validatePersonalPerspectiveSemanticCasebookV01(
      deepFreeze(invalidInput),
    );
    assert.ok(
      canonicalizePersonalPerspectiveCasebookValueV01(invalidInput) === before,
      `${descriptor.name} validator input must remain unchanged`,
    );
    assert.notEqual(validation.status, "valid", `${descriptor.name} must fail closed`);
    assert.equal(
      validation.admitted_candidate_count,
      0,
      `${descriptor.name} must return no admitted candidates`,
    );
    if (validation.admitted_candidate_count > 0) invalidAdmittedCandidates += 1;
    assert.ok(
      validation.issues.some(
        (issue) => issue.code === descriptor.expected_issue_code,
      ),
      `${descriptor.name} must include ${descriptor.expected_issue_code}: ${formatIssues(validation.issues)}`,
    );
    if (REQUIRED_RESIGNED_SEMANTIC_ATTACKS.has(descriptor.name)) {
      resignedAttackCount += 1;
      assert.ok(
        validation.issues.some(
          (issue) => issue.category === "semantic" || issue.category === "unsafe_material",
        ),
        `${descriptor.name} must fail for semantic or unsafe reasons after re-signing`,
      );
      assert.ok(
        validation.issues.some(
          (issue) => !issue.code.includes("fingerprint_mismatch"),
        ),
        `${descriptor.name} fingerprint mismatch must not be the only reason`,
      );
    }
  }
  assert.equal(invalidAdmittedCandidates, 0);
  assert.equal(
    resignedAttackCount,
    REQUIRED_RESIGNED_SEMANTIC_ATTACKS.size,
    "all nine required re-signed attacks must exist",
  );

  let exhaustiveAuthorityAssertions = 0;
  for (const field of PERSONAL_PERSPECTIVE_AUTHORITY_FLAGS_V01) {
    for (const location of ["aggregate", "case", "source"] as const) {
      const authorityAttack = clone(primary);
      const boundary =
        location === "aggregate"
          ? authorityAttack.authority_boundary
          : location === "case"
            ? requiredFirst(authorityAttack.cases).authority_boundary
            : requiredFirst(authorityAttack.sources).authority_boundary;
      (boundary as unknown as Record<string, unknown>)[field] = true;
      const validation = validatePersonalPerspectiveSemanticCasebookV01(
        resignPersonalPerspectiveSemanticCasebookV01(authorityAttack),
      );
      assert.notEqual(
        validation.status,
        "valid",
        `${location} authority flag ${field} must fail closed`,
      );
      assert.equal(validation.admitted_candidate_count, 0);
      assert.ok(
        validation.issues.some(
          (issue) => issue.code === `prohibited_authority_true_${field}`,
        ),
        `${location} authority flag ${field} must retain its exact issue code`,
      );
      exhaustiveAuthorityAssertions += 1;
    }
  }

  const cyclicInput: Record<string, unknown> = {};
  cyclicInput.self = cyclicInput;
  const cyclicValidation = validatePersonalPerspectiveSemanticCasebookV01(
    cyclicInput,
  );
  assert.equal(cyclicValidation.status, "invalid");
  assert.ok(
    cyclicValidation.issues.some(
      (issue) => issue.code === "cyclic_input_forbidden",
    ),
    "cyclic malformed input must return a structured issue instead of throwing",
  );

  const unsafeEchoInput = clone(primary) as unknown as Record<string, unknown>;
  const unsafeCallerKey = ["api", "key", "caller", "literal"].join("_");
  const unsafeCallerValue =
    ["token", "caller", "literal"].join("-") + "z".repeat(18);
  unsafeEchoInput[unsafeCallerKey] = unsafeCallerValue;
  const unsafeEchoValidation = validatePersonalPerspectiveSemanticCasebookV01(
    unsafeEchoInput,
  );
  const boundedIssues = JSON.stringify(unsafeEchoValidation.issues);
  assert.equal(unsafeEchoValidation.status, "blocked");
  assert.doesNotMatch(boundedIssues, new RegExp(unsafeCallerKey));
  assert.doesNotMatch(boundedIssues, new RegExp(unsafeCallerValue));

  const multiIssueDescriptor = PERSONAL_PERSPECTIVE_CASEBOOK_NEGATIVE_FIXTURES_V01.find(
    (descriptor) => descriptor.name === "multiple_issue_ordering",
  );
  assert.ok(multiIssueDescriptor, "multiple_issue_ordering fixture must exist");
  const multiIssue = buildPersonalPerspectiveCasebookNegativeInputV01(
    multiIssueDescriptor,
    primary,
  );
  const forwardIssues = validatePersonalPerspectiveSemanticCasebookV01(multiIssue).issues;
  const reversedIssues = validatePersonalPerspectiveSemanticCasebookV01(
    reverseObjectKeysDeep(multiIssue),
  ).issues;
  assert.deepEqual(reversedIssues, forwardIssues, "issue ordering must be deterministic");

  const issueFlood = clone(primary);
  for (const caseItem of issueFlood.cases) {
    caseItem.title = "";
    caseItem.summary = "";
    caseItem.rationale = "";
    caseItem.limitations = [];
    caseItem.future_review_actions = [];
    (caseItem as unknown as Record<string, unknown>).semantic_kind =
      "fictional-invalid-kind";
    caseItem.scope.qualifiers = [];
    (caseItem.counterexample as unknown as Record<string, unknown>).status =
      "fictional-invalid-status";
  }
  const issueFloodValidation =
    validatePersonalPerspectiveSemanticCasebookV01(issueFlood);
  assert.notEqual(issueFloodValidation.status, "valid");
  assert.equal(issueFloodValidation.admitted_candidate_count, 0);
  assert.equal(
    issueFloodValidation.issues.length,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.validation_issues,
  );
  assert.ok(issueFloodValidation.issues_truncated);
  assert.ok(
    issueFloodValidation.issue_count > issueFloodValidation.issues.length,
  );

  const primitiveValue = { z: 1, a: ["synthetic", true] };
  assert.equal(canonicalizeProtocolValueV01(primitiveValue), FIXED_PRIMITIVE_CANONICAL);
  assert.equal(
    createProtocolSha256V01(canonicalizeProtocolValueV01(primitiveValue)),
    FIXED_PRIMITIVE_SHA256,
  );

  const representative =
    primary.cases.find(
      (caseItem) => caseItem.case_key === "descriptive-self-understanding",
    ) ?? requiredFirst(primary.cases);
  assert.equal(representative.case_id, FIXED_REPRESENTATIVE_CASE_ID);
  assert.equal(
    representative.integrity.fingerprint,
    FIXED_REPRESENTATIVE_CASE_FINGERPRINT,
  );
  assert.equal(primary.integrity.fingerprint, FIXED_AGGREGATE_FINGERPRINT);
  assert.equal(primary.cases.length, FIXED_VALID_CASE_COUNT);
  assert.equal(
    PERSONAL_PERSPECTIVE_CASEBOOK_NEGATIVE_FIXTURES_V01.length,
    FIXED_NEGATIVE_FIXTURE_COUNT,
  );

  const purity = assertPureLibraryBoundary();
  assert.equal(fetchCalls, 0, "validation must perform zero fetch calls");

  const caseKeysById = new Map(
    primary.cases.map((caseItem) => [caseItem.case_id, caseItem.case_key]),
  );
  const coverageRows = primary.coverage_matrix.map((entry) => ({
    requirement_id: entry.requirement_id,
    case_keys: entry.case_refs.map((ref) => {
      const caseKey = caseKeysById.get(ref);
      assert.ok(caseKey, `coverage ref ${ref} must resolve to a case key`);
      return caseKey;
    }),
  }));

  const summary = {
    contract_version: PERSONAL_PERSPECTIVE_CASEBOOK_VERSION_V01,
    semantic_definition_version:
      PERSONAL_PERSPECTIVE_SEMANTIC_DEFINITION_VERSION_V01,
    deterministic_method_version:
      PERSONAL_PERSPECTIVE_CASEBOOK_METHOD_VERSION_V01,
    classification: "lab_r_and_d",
    workstream: "K",
    stage: 1,
    synthetic_only: true,
    non_authoritative: true,
    non_persistent: true,
    positive_case_count: primary.cases.length,
    negative_adversarial_case_count:
      PERSONAL_PERSPECTIVE_CASEBOOK_NEGATIVE_FIXTURES_V01.length,
    required_coverage_matrix: {
      passed: true,
      required_row_count: PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01.length,
      rows: coverageRows,
    },
    invalid_fixtures_producing_admitted_candidates: invalidAdmittedCandidates,
    resigned_semantic_attacks: {
      passed: true,
      count: resignedAttackCount,
    },
    representative_case: {
      case_id: representative.case_id,
      fingerprint: representative.integrity.fingerprint,
    },
    aggregate_fingerprint: primary.integrity.fingerprint,
    determinism: {
      repeated_output_byte_identical: true,
      unordered_collection_equivalence: true,
      exact_duplicate_deduplication: true,
      deterministic_issue_ordering: true,
      bounded_issue_output: true,
      fixed_protocol_primitive_anchor: true,
    },
    input_immutability: true,
    authority_boundary: {
      passed: true,
      prohibited_meaning_count:
        PERSONAL_PERSPECTIVE_AUTHORITY_FLAGS_V01.length,
      validated_locations: ["aggregate", "case", "source"],
      assertion_count: exhaustiveAuthorityAssertions,
    },
    privacy_boundary: true,
    purity,
    maturity_claim_boundary: {
      before: "level_0_intent",
      after: "level_1_validated_contract",
      level_2_claimed: false,
      production_integration_claimed: false,
      user_endorsement_claimed: false,
      reviewed_reuse_claimed: false,
      outcome_improvement_claimed: false,
    },
  } as const;

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} finally {
  globalThis.fetch = originalFetch;
}

function assertPureLibraryBoundary(): {
  database_calls: 0;
  filesystem_writes: 0;
  network_fetch_dns_socket_calls: 0;
  provider_model_calls: 0;
  child_process_calls: 0;
  environment_semantic_reads: 0;
  implicit_clock_reads: 0;
  random_reads: 0;
  external_actuation: 0;
} {
  const source = readFileSync(PURE_LIBRARY_PATH, "utf8");
  const forbidden = [
    /node:fs/,
    /node:child_process/,
    /node:net/,
    /node:dns/,
    /node:http/,
    /node:https/,
    /better-sqlite3/,
    /\bfetch\s*\(/,
    /\bprocess\.env\b/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(/,
    /\bMath\.random\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bexec(?:File)?(?:Sync)?\s*\(/,
    /\bspawn(?:Sync)?\s*\(/,
  ];
  for (const pattern of forbidden) {
    assert.doesNotMatch(source, pattern, `pure library forbids ${pattern}`);
  }
  return {
    database_calls: 0,
    filesystem_writes: 0,
    network_fetch_dns_socket_calls: 0,
    provider_model_calls: 0,
    child_process_calls: 0,
    environment_semantic_reads: 0,
    implicit_clock_reads: 0,
    random_reads: 0,
    external_actuation: 0,
  };
}

function reverseUnorderedSeed(
  seed: PersonalPerspectiveSemanticCasebookSeedV01,
): PersonalPerspectiveSemanticCasebookSeedV01 {
  seed.sources.reverse();
  seed.cases.reverse();
  seed.coverage.reverse();
  for (const source of seed.sources) source.scope.qualifiers.reverse();
  for (const caseItem of seed.cases) {
    caseItem.scope.qualifiers.reverse();
    caseItem.source_relations.reverse();
    caseItem.case_relations.reverse();
    caseItem.counterexample.source_keys.reverse();
    caseItem.limitations.reverse();
    caseItem.future_review_actions.reverse();
  }
  for (const coverage of seed.coverage) coverage.case_keys.reverse();
  return seed;
}

function reverseObjectKeysDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(reverseObjectKeysDeep) as T;
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .reverse()
      .map(([key, nested]) => [key, reverseObjectKeysDeep(nested)]),
  ) as T;
}

function requiredFirst<T>(values: T[]): T {
  const value = values[0];
  assert.ok(value);
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
  }
  return value;
}

function formatIssues(issues: PersonalPerspectiveValidationIssueV01[]): string {
  return JSON.stringify(issues, null, 2);
}
