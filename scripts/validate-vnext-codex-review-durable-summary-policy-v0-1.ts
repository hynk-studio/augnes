import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  CODEX_REVIEW_DURABLE_SUMMARY_PILOT_POLICY_V01,
  codexReviewDurableRequirementCandidateV01,
  codexReviewDurableRequirementMapperInputFixtureV01,
} from "@/fixtures/vnext/protocol/codex-review-durable-summary-policy-v0-1";
import { codexReviewProposalMapperInputFixture } from "@/fixtures/vnext/protocol/episode-delta-proposal-codex-review-v0-1";
import {
  CODEX_REVIEW_DURABLE_SUMMARY_MAX_CHARACTERS_V01,
  CODEX_REVIEW_DURABLE_SUMMARY_POLICY_VERSION_V01,
  deriveCodexReviewDurableSummaryV01,
  normalizeDurableSummaryWhitespaceV01,
} from "@/lib/vnext/compat/codex-review-durable-summary-policy-v0-1";
import {
  mapCodexSemanticReviewToEpisodeDeltaProposalV01,
  type CodexReviewEpisodeDeltaProposalInputV01,
  type CodexReviewEpisodeDeltaProposalMappingResultV01,
} from "@/lib/vnext/compat/episode-delta-proposal-from-codex-review";
import {
  buildVNextPersistedSemanticStateV01,
  validateVNextPersistedSemanticStateV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";

const POLICY_SOURCE =
  "lib/vnext/compat/codex-review-durable-summary-policy-v0-1.ts";
const MAPPER_SOURCE =
  "lib/vnext/compat/episode-delta-proposal-from-codex-review.ts";
const SYNTHETIC_DECISION_ID =
  "review-decision:synthetic-durable-summary-conformance";
const SYNTHETIC_DECISION_FINGERPRINT = `sha256:${"7".repeat(64)}`;
const SYNTHETIC_STATE_CREATED_AT = "2026-07-13T05:00:00.000Z";

export interface CodexReviewDurableSummaryConformanceSummaryV01 {
  suite: "codex-review-durable-summary-policy-v0.1";
  status: "passed";
  policy_version: typeof CODEX_REVIEW_DURABLE_SUMMARY_POLICY_VERSION_V01;
  positive_fixture_count: number;
  negative_fixture_count: number;
  candidate_display_summary_length: number;
  durable_summary_length: number;
  exact_policy_preserved: true;
  candidate_count: 1;
  target_count: 1;
  proposal_created_in_memory_only: true;
  semantic_state_built_in_memory_only: true;
  deterministic_mapping: true;
  collection_order_equivalence: true;
  canonical_output_sha256: string;
  database_reads: 0;
  database_writes: 0;
  network_calls: 0;
  provider_model_calls: 0;
  filesystem_writes_by_pure_library: 0;
  implicit_clock_reads: 0;
  random_calls: 0;
  external_actuation: 0;
}

export function runCodexReviewDurableSummaryPolicyConformanceV01(): CodexReviewDurableSummaryConformanceSummaryV01 {
  assertPureLibrarySources();
  assert.equal(CODEX_REVIEW_DURABLE_SUMMARY_PILOT_POLICY_V01.length, 354);

  let fetchCalls = 0;
  let clockReads = 0;
  let randomCalls = 0;
  const originalFetch = globalThis.fetch;
  const originalDateNow = Date.now;
  const originalRandom = Math.random;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("Durable-summary conformance forbids fetch.");
  }) as typeof fetch;
  Date.now = () => {
    clockReads += 1;
    throw new Error(
      "Durable-summary conformance forbids implicit clock reads.",
    );
  };
  Math.random = () => {
    randomCalls += 1;
    throw new Error("Durable-summary conformance forbids random calls.");
  };

  try {
    const short = requireMapped(
      "short_requirement",
      mapFrozen(
        codexReviewDurableRequirementMapperInputFixtureV01(
          "Short requirement.",
        ),
      ),
    );
    assert.equal(
      short.proposal.proposed_deltas[0]?.proposed_state_summary,
      "Short requirement.",
    );

    const pilotInput = codexReviewDurableRequirementMapperInputFixtureV01();
    const pilotInputBefore = canonicalizeProtocolValueV01(pilotInput);
    const pilotCandidate =
      codexReviewDurableRequirementCandidateV01(pilotInput);
    assert.equal(pilotCandidate.summary.length, 180);
    assert.match(pilotCandidate.summary, /\.\.\.$/);
    assert.equal(pilotCandidate.review_required, true);
    assert.equal(pilotCandidate.candidate_only, true);
    const pilot = requireMapped("pilot_policy", mapFrozen(pilotInput));
    assert.equal(canonicalizeProtocolValueV01(pilotInput), pilotInputBefore);
    assert.equal(pilot.proposal.status, "pending_review");
    assert.equal(pilot.proposal.proposed_deltas.length, 1);
    const pilotDelta = pilot.proposal.proposed_deltas[0]!;
    assert.equal(pilotDelta.target_refs.length, 1);
    assert.equal(
      pilotDelta.proposed_state_summary,
      CODEX_REVIEW_DURABLE_SUMMARY_PILOT_POLICY_V01,
    );
    assert.doesNotMatch(pilotDelta.proposed_state_summary, /\.\.\.$/);
    assert.ok(
      pilot.proposal.compatibility.source_contracts.includes(
        CODEX_REVIEW_DURABLE_SUMMARY_POLICY_VERSION_V01,
      ),
    );
    assert.ok(
      Object.entries(pilot.proposal.authority_summary)
        .filter(([, value]) => typeof value === "boolean")
        .every(([, value]) => value === false),
    );

    const mediumSignal = boundedSignal(512);
    const medium = requireMapped(
      "long_below_bound",
      mapFrozen(
        codexReviewDurableRequirementMapperInputFixtureV01(mediumSignal),
      ),
    );
    assert.equal(
      medium.proposal.proposed_deltas[0]?.proposed_state_summary,
      mediumSignal,
    );

    const maximumSignal = boundedSignal(
      CODEX_REVIEW_DURABLE_SUMMARY_MAX_CHARACTERS_V01,
    );
    const maximum = requireMapped(
      "exact_bound",
      mapFrozen(
        codexReviewDurableRequirementMapperInputFixtureV01(maximumSignal),
      ),
    );
    assert.equal(
      maximum.proposal.proposed_deltas[0]?.proposed_state_summary.length,
      CODEX_REVIEW_DURABLE_SUMMARY_MAX_CHARACTERS_V01,
    );
    assert.equal(
      maximum.proposal.proposed_deltas[0]?.proposed_state_summary,
      maximumSignal,
    );

    const repeated = requireMapped(
      "repeated",
      mapFrozen(codexReviewDurableRequirementMapperInputFixtureV01()),
    );
    assert.deepEqual(repeated.result, pilot.result);

    const reorderedInput = codexReviewDurableRequirementMapperInputFixtureV01();
    reverseArrays(reorderedInput.expected_observed_delta_preview);
    const reordered = requireMapped("reordered", mapFrozen(reorderedInput));
    assert.deepEqual(reordered.proposal, pilot.proposal);

    assertNonRequirementSummariesUnchanged();

    const semanticState = buildVNextPersistedSemanticStateV01({
      proposal: pilot.proposal,
      candidate_id: pilotDelta.candidate_id,
      target_ref: pilotDelta.target_refs[0]!,
      source_decision: {
        decision_id: SYNTHETIC_DECISION_ID,
        decision_fingerprint: SYNTHETIC_DECISION_FINGERPRINT,
      },
      created_at: SYNTHETIC_STATE_CREATED_AT,
    });
    const stateValidation =
      validateVNextPersistedSemanticStateV01(semanticState);
    assert.equal(stateValidation.status, "valid");
    assert.equal(
      semanticState.state_content.proposed_state_summary,
      CODEX_REVIEW_DURABLE_SUMMARY_PILOT_POLICY_V01,
    );
    assert.equal(
      semanticState.bounded_state_summary,
      CODEX_REVIEW_DURABLE_SUMMARY_PILOT_POLICY_V01,
    );

    const negativeCases = buildNegativeCases();
    for (const negative of negativeCases) {
      const before = canonicalizeProtocolValueV01(negative.input);
      const mapping = mapCodexSemanticReviewToEpisodeDeltaProposalV01(
        deepFreeze(negative.input),
      );
      assert.ok(
        mapping.status === "blocked" || mapping.status === "invalid",
        `${negative.name} must fail closed`,
      );
      assert.equal(
        mapping.proposal,
        null,
        `${negative.name} returned a proposal`,
      );
      assert.equal(canonicalizeProtocolValueV01(negative.input), before);
      const renderedIssues = JSON.stringify([
        ...mapping.errors,
        ...mapping.warnings,
      ]);
      for (const raw of negative.rejected_raw_values) {
        assert.equal(
          renderedIssues.includes(raw),
          false,
          `${negative.name} leaked rejected material`,
        );
      }
    }

    for (const invalid of ["", "   \n\t  "]) {
      const policy = deriveCodexReviewDurableSummaryV01({
        candidate_bucket: "requirement_progress_delta_candidates",
        canonical_source_signal: invalid,
        candidate_display_summary: "legacy display",
      });
      assert.equal(policy.status, "blocked");
      assert.equal(policy.summary, null);
    }

    assert.equal(fetchCalls, 0);
    assert.equal(clockReads, 0);
    assert.equal(randomCalls, 0);
    const canonicalOutputSha256 = createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        policy_version: CODEX_REVIEW_DURABLE_SUMMARY_POLICY_VERSION_V01,
        receipt: pilot.receipt,
        proposal: pilot.proposal,
        semantic_state: semanticState,
      }),
    );
    return {
      suite: "codex-review-durable-summary-policy-v0.1",
      status: "passed",
      policy_version: CODEX_REVIEW_DURABLE_SUMMARY_POLICY_VERSION_V01,
      positive_fixture_count: 8,
      negative_fixture_count: negativeCases.length + 2,
      candidate_display_summary_length: pilotCandidate.summary.length,
      durable_summary_length: pilotDelta.proposed_state_summary.length,
      exact_policy_preserved: true,
      candidate_count: 1,
      target_count: 1,
      proposal_created_in_memory_only: true,
      semantic_state_built_in_memory_only: true,
      deterministic_mapping: true,
      collection_order_equivalence: true,
      canonical_output_sha256: canonicalOutputSha256,
      database_reads: 0,
      database_writes: 0,
      network_calls: fetchCalls,
      provider_model_calls: 0,
      filesystem_writes_by_pure_library: 0,
      implicit_clock_reads: clockReads,
      random_calls: randomCalls,
      external_actuation: 0,
    };
  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalDateNow;
    Math.random = originalRandom;
  }
}

function buildNegativeCases(): Array<{
  name: string;
  input: CodexReviewEpisodeDeltaProposalInputV01;
  rejected_raw_values: string[];
}> {
  const safeCandidateSignal = "Safe canonical requirement.";
  const cases: Array<{
    name: string;
    signal: string;
    candidate_signal?: string;
  }> = [
    { name: "over_bound", signal: boundedSignal(2001) },
    { name: "empty", signal: "", candidate_signal: safeCandidateSignal },
    {
      name: "whitespace_only",
      signal: "   \n\t ",
      candidate_signal: safeCandidateSignal,
    },
    {
      name: "secret_shaped",
      signal: "OPENAI_API_KEY=forbidden-value",
      candidate_signal: safeCandidateSignal,
    },
    {
      name: "credential_shaped",
      signal: "sk-proj-forbidden123456",
      candidate_signal: safeCandidateSignal,
    },
    {
      name: "absolute_unix_path",
      signal: "/Users/example/private.txt",
      candidate_signal: safeCandidateSignal,
    },
    {
      name: "absolute_windows_path",
      signal: "C:\\private\\payload.txt",
      candidate_signal: safeCandidateSignal,
    },
    {
      name: "private_url",
      signal: "https://127.0.0.1/internal",
      candidate_signal: safeCandidateSignal,
    },
    {
      name: "embedded_credential_url",
      signal: "https://user:pass@example.com/private",
      candidate_signal: safeCandidateSignal,
    },
    {
      name: "raw_prompt",
      signal: "raw_prompt: forbidden material",
      candidate_signal: safeCandidateSignal,
    },
    {
      name: "raw_transcript",
      signal: "transcript: forbidden material",
      candidate_signal: safeCandidateSignal,
    },
    {
      name: "hidden_reasoning",
      signal: "chain_of_thought: forbidden material",
      candidate_signal: safeCandidateSignal,
    },
    {
      name: "environment_dump",
      signal: "environment_dump: forbidden material",
      candidate_signal: safeCandidateSignal,
    },
    {
      name: "terminal_dump",
      signal: "terminal_output: forbidden material",
      candidate_signal: safeCandidateSignal,
    },
  ];
  const negatives = cases.map((item) => ({
    name: item.name,
    input: codexReviewDurableRequirementMapperInputFixtureV01(item.signal, {
      candidate_signal: item.candidate_signal,
    }),
    rejected_raw_values: [item.signal].filter(
      (value) => value.length > 0 && value.length <= 256,
    ),
  }));

  for (const field of [
    "raw_prompt",
    "raw_transcript",
    "hidden_reasoning",
    "environment_dump",
    "terminal_output",
  ]) {
    const input = codexReviewDurableRequirementMapperInputFixtureV01();
    (
      input.expected_observed_delta_preview as unknown as Record<string, unknown>
    )[field] = "rejected synthetic raw material";
    negatives.push({
      name: `${field}_field`,
      input,
      rejected_raw_values: ["rejected synthetic raw material"],
    });
  }

  const malformedBucket = codexReviewDurableRequirementMapperInputFixtureV01();
  (
    malformedBucket.expected_observed_delta_preview
      .delta_candidates as unknown as Record<string, unknown>
  ).unsupported_candidates = [];
  negatives.push({
    name: "unsupported_candidate_bucket",
    input: malformedBucket,
    rejected_raw_values: [],
  });

  negatives.push({
    name: "candidate_derivation_mismatch",
    input: codexReviewDurableRequirementMapperInputFixtureV01(
      "Canonical requirement.",
      { candidate_signal: "Different requirement." },
    ),
    rejected_raw_values: [],
  });

  const sourceMismatch = codexReviewDurableRequirementMapperInputFixtureV01();
  codexReviewDurableRequirementCandidateV01(sourceMismatch).source_ref =
    "codex-report:forged-source";
  negatives.push({
    name: "candidate_source_ref_mismatch",
    input: sourceMismatch,
    rejected_raw_values: [],
  });

  const multiple = codexReviewDurableRequirementMapperInputFixtureV01();
  const duplicate = clone(codexReviewDurableRequirementCandidateV01(multiple));
  multiple.expected_observed_delta_preview.delta_candidates.requirement_progress_delta_candidates.push(
    duplicate,
  );
  multiple.expected_observed_delta_preview.input_summary.delta_candidate_count = 2;
  multiple.expected_observed_delta_preview.requirement_progress_comparison.requirement_progress_delta_candidates.push(
    duplicate,
  );
  negatives.push({
    name: "multiple_candidates_in_single_candidate_fixture",
    input: multiple,
    rejected_raw_values: [],
  });

  const override =
    codexReviewDurableRequirementMapperInputFixtureV01() as CodexReviewEpisodeDeltaProposalInputV01 & {
      durable_summary_override?: string;
    };
  override.durable_summary_override = "Caller-selected durable authority.";
  negatives.push({
    name: "explicit_durable_summary_override",
    input: override,
    rejected_raw_values: [override.durable_summary_override],
  });
  return negatives;
}

function assertNonRequirementSummariesUnchanged() {
  const input = codexReviewProposalMapperInputFixture();
  const mapped = requireMapped("non_requirement_regression", mapFrozen(input));
  const candidates = Object.entries(
    input.expected_observed_delta_preview.delta_candidates,
  ).flatMap(([bucket, values]) =>
    bucket === "review_only_candidates" ||
    bucket === "requirement_progress_delta_candidates"
      ? []
      : values,
  );
  assert.ok(candidates.length > 0);
  for (const candidate of candidates) {
    const delta = mapped.proposal.proposed_deltas.find((item) =>
      item.target_refs.some(
        (ref) =>
          ref.ref_type === "expected_observed_delta_candidate" &&
          ref.external_id === candidate.candidate_id,
      ),
    );
    assert.ok(delta);
    assert.equal(delta.proposed_state_summary, candidate.summary);
  }
}

function assertPureLibrarySources() {
  const source = [POLICY_SOURCE, MAPPER_SOURCE]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  for (const pattern of [
    /from\s+["'](?:node:fs|fs|node:http|node:https|node:net|node:tls|node:dns|better-sqlite3)["']/,
    /\bfetch\s*\(/,
    /\b(?:writeFile|writeFileSync|appendFile|appendFileSync)\s*\(/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(\s*\)/,
    /\bMath\.random\s*\(/,
    /\brandomUUID\s*\(/,
  ]) {
    assert.doesNotMatch(source, pattern);
  }
}

function mapFrozen(input: CodexReviewEpisodeDeltaProposalInputV01) {
  return mapCodexSemanticReviewToEpisodeDeltaProposalV01(
    deepFreeze(clone(input)),
  );
}

function requireMapped(
  name: string,
  result: CodexReviewEpisodeDeltaProposalMappingResultV01,
) {
  assert.equal(result.status, "mapped", `${name}: ${JSON.stringify(result)}`);
  assert.ok(result.receipt, `${name} receipt missing`);
  assert.ok(result.proposal, `${name} proposal missing`);
  return {
    result,
    receipt: result.receipt,
    proposal: result.proposal,
  };
}

function boundedSignal(length: number): string {
  return "R".repeat(length);
}

function reverseArrays(value: unknown) {
  if (Array.isArray(value)) {
    value.reverse();
    value.forEach(reverseArrays);
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.values(value as Record<string, unknown>).forEach(reverseArrays);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value))
    return value;
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return Object.freeze(value);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(
    JSON.stringify(runCodexReviewDurableSummaryPolicyConformanceV01(), null, 2),
  );
}
