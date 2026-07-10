import assert from "node:assert/strict";

import {
  blockedNoChecksInputFixture,
  completedFailedVerificationInputFixture,
  genericCliDirectObservationInputFixture,
  invalidRunReceiptFixtureCases,
  mixedProvenanceInputFixture,
  openAiCodexHostAttestationInputFixture,
} from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import {
  buildRunReceiptV01,
  canonicalizeRunReceiptValueV01,
  RUN_RECEIPT_REQUIRED_CORE_FIELDS_V01,
  validateRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "@/lib/vnext/run-receipt";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

const positiveFixtures = [
  ["generic_cli_direct_observation", genericCliDirectObservationInputFixture],
  ["openai_codex_host_attestation", openAiCodexHostAttestationInputFixture],
  ["mixed_provenance", mixedProvenanceInputFixture],
  ["completed_execution_failed_verification", completedFailedVerificationInputFixture],
  ["blocked_execution_no_checks", blockedNoChecksInputFixture],
] as const;

export interface RunReceiptConformanceSummaryV01 {
  suite: "run-receipt-v0.1";
  status: "passed";
  positive_fixtures: string[];
  positive_fixture_count: number;
  negative_fixture_count: number;
  deterministic_receipt_identity: true;
  generic_receipt_id: string;
  generic_idempotency_key: string;
  generic_fingerprint: string;
  required_openai_specific_core_fields: number;
  required_chatgpt_specific_core_fields: number;
  required_codex_specific_core_fields: number;
  generic_cli_valid_without_provider: true;
  observation_attestation_separation_checked: true;
  execution_verification_axes_checked: true;
  privacy_unknown_not_false_checked: true;
  cost_unknown_not_zero_checked: true;
}

export function runRunReceiptConformanceV01(): RunReceiptConformanceSummaryV01 {
  const receipts = new Map<string, RunReceiptV01>();
  for (const [name, input] of positiveFixtures) {
    const frozenInput = deepFreeze(clone(input));
    const before = canonicalizeRunReceiptValueV01(frozenInput);
    const receipt = buildRunReceiptV01(frozenInput);
    assert.equal(
      canonicalizeRunReceiptValueV01(frozenInput),
      before,
      `${name} builder input must not mutate`,
    );
    const validation = validateRunReceiptV01(receipt);
    assert.equal(validation.status, "valid", `${name}: ${format(validation)}`);
    receipts.set(name, receipt);
  }

  const generic = requiredReceipt(receipts, "generic_cli_direct_observation");
  assert.equal(generic.model_invocations.length, 0);
  assert.equal(generic.privacy_egress.egress_status, "unknown");
  assert.equal(generic.cost_usage.cost_amount, null);
  assert.equal(JSON.stringify(generic).match(/openai|chatgpt|codex/gi), null);
  assert.equal(generic.observations[0]?.trust_class, "direct_local_observation");
  assert.equal(generic.attestations.length, 0);

  const host = requiredReceipt(receipts, "openai_codex_host_attestation");
  assert.equal(host.observations.length, 0);
  assert.ok(host.attestations.length >= 2);
  assert.ok(
    host.attestations.every((item) => item.trust_class === "host_attestation"),
  );
  assert.ok(
    host.model_invocations.every(
      (item) =>
        item.raw_prompt_persisted === false &&
        item.raw_response_persisted === false &&
        item.hidden_reasoning_persisted === false,
    ),
  );
  assertProviderValuesOnlyInExternalRefs(host);

  const mixed = requiredReceipt(receipts, "mixed_provenance");
  assert.equal(mixed.execution.basis, "mixed");
  assert.equal(mixed.verification.basis, "mixed");
  assert.equal(mixed.trust_summary.direct_observations, 1);
  assert.equal(mixed.trust_summary.verified_external_observations, 1);
  assert.equal(mixed.trust_summary.host_attestations, 1);
  assert.equal("truth_score" in mixed.trust_summary, false);

  const failed = requiredReceipt(
    receipts,
    "completed_execution_failed_verification",
  );
  assert.equal(failed.execution.status, "completed");
  assert.equal(failed.verification.status, "failed");
  assert.equal(failed.checks[0]?.status, "failed");
  assert.equal(failed.authority_summary.receipt_is_approval, false);
  assert.equal(failed.authority_summary.closes_work, false);

  const blocked = requiredReceipt(receipts, "blocked_execution_no_checks");
  assert.equal(blocked.execution.status, "blocked");
  assert.equal(blocked.verification.status, "not_run");
  assert.equal(blocked.checks.length, 0);
  assert.equal(blocked.skipped_checks.length, 0);
  assert.ok(blocked.blockers.length > 0);

  const completedPartialInput = clone(genericCliDirectObservationInputFixture);
  completedPartialInput.run_id = "run-completed-partial-verification-001";
  completedPartialInput.verification.status = "partial";
  assert.equal(
    validateRunReceiptV01(buildRunReceiptV01(deepFreeze(completedPartialInput)))
      .status,
    "valid",
    "completed execution with partial verification must remain valid",
  );

  const unknownExecutionInput = clone(openAiCodexHostAttestationInputFixture);
  unknownExecutionInput.run_id = "run-unknown-execution-attested-check-001";
  unknownExecutionInput.execution = {
    status: "unknown",
    basis: "unknown",
    source_refs: [],
  };
  assert.equal(
    validateRunReceiptV01(buildRunReceiptV01(deepFreeze(unknownExecutionInput)))
      .status,
    "valid",
    "unknown execution with attested check claims must remain valid",
  );

  const repeated = buildRunReceiptV01(
    deepFreeze(clone(genericCliDirectObservationInputFixture)),
  );
  assert.deepEqual(repeated, generic);
  assert.equal(repeated.receipt_id, generic.receipt_id);
  assert.equal(repeated.idempotency_key, generic.idempotency_key);
  assert.equal(repeated.integrity.fingerprint, generic.integrity.fingerprint);

  const reordered = clone(genericCliDirectObservationInputFixture);
  reorderSemanticallyUnorderedArrays(reordered);
  assert.deepEqual(buildRunReceiptV01(deepFreeze(reordered)), generic);

  for (const invalidCase of invalidRunReceiptFixtureCases) {
    const validation = validateRunReceiptV01(invalidCase.mutate(generic));
    assert.equal(
      validation.status,
      invalidCase.expected_status,
      `${invalidCase.name}: ${format(validation)}`,
    );
    assert.ok(
      validation.errors.some(
        (issue) => issue.code === invalidCase.expected_error_code,
      ),
      `${invalidCase.name} must report ${invalidCase.expected_error_code}: ${format(validation)}`,
    );
  }

  const requiredOpenAiSpecificFields = RUN_RECEIPT_REQUIRED_CORE_FIELDS_V01.filter(
    (field) => /openai/i.test(field),
  );
  const requiredChatGptSpecificFields = RUN_RECEIPT_REQUIRED_CORE_FIELDS_V01.filter(
    (field) => /chatgpt/i.test(field),
  );
  const requiredCodexSpecificFields = RUN_RECEIPT_REQUIRED_CORE_FIELDS_V01.filter(
    (field) => /codex/i.test(field),
  );
  const providerSpecificRequiredFields = [
    ...requiredOpenAiSpecificFields,
    ...requiredChatGptSpecificFields,
    ...requiredCodexSpecificFields,
  ];
  assert.deepEqual(providerSpecificRequiredFields, []);

  return {
    suite: "run-receipt-v0.1",
    status: "passed",
    positive_fixtures: positiveFixtures.map(([name]) => name),
    positive_fixture_count: positiveFixtures.length,
    negative_fixture_count: invalidRunReceiptFixtureCases.length,
    deterministic_receipt_identity: true,
    generic_receipt_id: generic.receipt_id,
    generic_idempotency_key: generic.idempotency_key,
    generic_fingerprint: generic.integrity.fingerprint,
    required_openai_specific_core_fields: requiredOpenAiSpecificFields.length,
    required_chatgpt_specific_core_fields:
      requiredChatGptSpecificFields.length,
    required_codex_specific_core_fields: requiredCodexSpecificFields.length,
    generic_cli_valid_without_provider: true,
    observation_attestation_separation_checked: true,
    execution_verification_axes_checked: true,
    privacy_unknown_not_false_checked: true,
    cost_unknown_not_zero_checked: true,
  };
}

function requiredReceipt(
  receipts: Map<string, RunReceiptV01>,
  name: string,
): RunReceiptV01 {
  const receipt = receipts.get(name);
  assert.ok(receipt, `missing receipt fixture ${name}`);
  return receipt;
}

function reorderSemanticallyUnorderedArrays(input: RunReceiptBuilderInputV01) {
  input.observations.reverse();
  input.changed_artifacts.reverse();
  input.commands.reverse();
  input.checks.reverse();
  input.external_refs.reverse();
  input.source_refs.reverse();
  input.artifact_refs.reverse();
  input.execution.source_refs.reverse();
  input.verification.source_refs.reverse();
  input.verification.required_check_ids.reverse();
  input.execution_environment.runtime_labels.reverse();
}

function assertProviderValuesOnlyInExternalRefs(value: unknown) {
  walk(value, "$", false);

  function walk(candidate: unknown, path: string, insideExternalRef: boolean) {
    if (Array.isArray(candidate)) {
      candidate.forEach((child, index) =>
        walk(child, `${path}[${index}]`, insideExternalRef),
      );
      return;
    }
    if (!candidate || typeof candidate !== "object") return;
    const record = candidate as Record<string, unknown>;
    const isExternalRef = record.ref_version === "external_ref.v0.1";
    for (const [key, child] of Object.entries(record)) {
      if (!insideExternalRef && !isExternalRef && typeof child === "string") {
        if (/openai|chatgpt|codex/i.test(child)) {
          assert.match(
            path,
            /^\$\.compatibility\.(?:source_contracts|warnings)/,
            `provider value escaped ExternalRef at ${path}.${key}`,
          );
        }
      }
      walk(child, `${path}.${key}`, insideExternalRef || isExternalRef);
    }
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return Object.freeze(value);
}

function format(value: {
  status: string;
  errors: Array<{ code: string; path: string | null; message: string }>;
  warnings: Array<{ code: string; path: string | null; message: string }>;
}) {
  return JSON.stringify(value, null, 2);
}
