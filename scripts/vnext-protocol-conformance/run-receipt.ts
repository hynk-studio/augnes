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
  createRunReceiptFingerprintV01,
  deriveRunReceiptIdV01,
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
  strict_nested_schema_checked: true;
  provenance_basis_coherence_checked: true;
  relation_integrity_checked: true;
  clock_skew_warning_checked: true;
  allowed_scalar_shapes_checked: true;
  resigned_malformed_receipt_rejected: true;
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
  assert.equal(generic.receipt_id, "run-receipt:597672d1ff739903c66b204f");
  assert.equal(
    generic.idempotency_key,
    "sha256:b39288d9e75983b9407f752b8d29720bf54ef64971df0ef36594c3cb81a5acf6",
  );
  assert.equal(
    generic.integrity.fingerprint,
    "sha256:b99ad3cd7e02e54b6c2f9ffce821a0e50856a45e5349879e84633fcebe7ada97",
  );

  const resignedMalformedReceipt = clone(generic);
  (
    resignedMalformedReceipt.execution_environment as unknown as Record<
      string,
      unknown
    >
  ).operating_system = { payload: "malformed" };
  resignedMalformedReceipt.receipt_id = deriveRunReceiptIdV01(
    resignedMalformedReceipt,
  );
  resignedMalformedReceipt.integrity.fingerprint =
    createRunReceiptFingerprintV01(resignedMalformedReceipt);
  const resignedValidation = validateRunReceiptV01(resignedMalformedReceipt);
  assert.equal(resignedValidation.status, "invalid", format(resignedValidation));
  assert.ok(
    resignedValidation.errors.some(
      (issue) =>
        issue.code === "nullable_string_malformed" &&
        issue.path === "$.execution_environment.operating_system",
    ),
    "re-signed malformed receipt must fail the allowed-field shape check",
  );
  for (const integrityCode of [
    "receipt_identity_mismatch",
    "fingerprint_mismatch",
    "idempotency_key_mismatch",
  ]) {
    assert.equal(
      resignedValidation.errors.some((issue) => issue.code === integrityCode),
      false,
      `re-signed malformed receipt must not rely on ${integrityCode}`,
    );
  }

  const unknownFieldInput = clone(genericCliDirectObservationInputFixture);
  (unknownFieldInput.observations[0] as unknown as Record<string, unknown>)
    .accepted_evidence = true;
  (unknownFieldInput.privacy_egress as unknown as Record<string, unknown>)
    .extra_policy_claim = true;
  (unknownFieldInput.cost_usage.usage as unknown as Record<string, unknown>)
    .unrecognized_metric = 1;
  assert.deepEqual(
    buildRunReceiptV01(deepFreeze(unknownFieldInput)),
    generic,
    "builder must drop unknown nested runtime fields instead of fingerprinting them",
  );

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
  assert.ok(blocked.observations.length > 0);

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

  const clockSkewInput = clone(genericCliDirectObservationInputFixture);
  clockSkewInput.run_id = "run-clock-skew-warning-001";
  clockSkewInput.recorded_at = "2026-07-10T02:15:00.000Z";
  const clockSkewValidation = validateRunReceiptV01(
    buildRunReceiptV01(deepFreeze(clockSkewInput)),
  );
  assert.equal(clockSkewValidation.status, "valid", format(clockSkewValidation));
  assert.ok(
    clockSkewValidation.warnings.some(
      (issue) =>
        issue.code === "remote_clock_skew_possible" &&
        issue.path === "$.finished_at",
    ),
    "finished_at later than recorded_at must warn without rewriting time",
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
    strict_nested_schema_checked: true,
    provenance_basis_coherence_checked: true,
    relation_integrity_checked: true,
    clock_skew_warning_checked: true,
    allowed_scalar_shapes_checked: true,
    resigned_malformed_receipt_rejected: true,
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
