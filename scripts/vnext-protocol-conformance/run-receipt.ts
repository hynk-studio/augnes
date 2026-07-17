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
import {
  NativeHostResultNormalizationErrorV01,
  normalizeNativeHostResultResidueV01,
} from "@/lib/vnext/native-host/native-host-result-normalization";
import type { NativeHostResultV01 } from "@/types/vnext/native-host-adapter";
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
  assert.equal(host.model_invocations.length, 1);
  assert.ok(
    host.model_invocations.every((item) => !("entry_version" in item)),
    "host-attested pre-Gateway activity remains an explicit v0.1 compatibility summary",
  );
  assert.ok(
    host.model_invocations.every(
      (item) => !("invocation_receipt" in item),
    ),
    "host-attested compatibility must not fabricate a ModelInvocationReceiptV02",
  );
  assert.equal(
    JSON.stringify(host.model_invocations).includes("model_gateway_version"),
    false,
    "host-attested compatibility must not fabricate Gateway version claims",
  );
  assert.ok(
    host.compatibility.source_contracts.includes("host_result_fixture.v0.1"),
  );
  assert.ok(
    host.attestations.every((item) => item.trust_class === "host_attestation"),
  );
  assert.ok(
    host.model_invocations.every(
      (item) =>
        "entry_version" in item
          ? item.invocation_receipt.raw_prompt_persisted === false &&
            item.invocation_receipt.raw_response_persisted === false &&
            item.invocation_receipt.hidden_reasoning_persisted === false
          : item.raw_prompt_persisted === false &&
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

  assert.equal(
    Object.hasOwn(generic, "host_approvals"),
    false,
    "pre-PR-C receipts remain byte- and fingerprint-compatible without the additive field",
  );
  const approvalInput = clone(genericCliDirectObservationInputFixture);
  approvalInput.run_id = "run-host-approval-residue-001";
  const approvalSource = approvalInput.reporter_ref;
  const approvalRef = receiptRef("native_host_approval", "native-host-approval:fixture");
  const threadRef = receiptRef("host_thread", "thread-fixture");
  const turnRef = receiptRef("host_turn", "turn-fixture");
  const itemRef = receiptRef("host_item", "item-fixture");
  const requestRef = receiptRef("host_approval_request", "request-fixture");
  const approval = {
    approval_ref: approvalRef,
    host_thread_ref: threadRef,
    host_turn_ref: turnRef,
    host_item_ref: itemRef,
    host_request_ref: requestRef,
    operation_class: "command_execution" as const,
    resource_summary: "Run the bounded repository check.",
    resource_refs: [receiptRef("repository_relative_artifact", "src/check.ts")],
    command_fingerprint: `sha256:${"1".repeat(64)}`,
    request_fingerprint: `sha256:${"2".repeat(64)}`,
    decision: "approve_once" as const,
    decision_source: "explicit_local_operator" as const,
    decision_fingerprint: `sha256:${"3".repeat(64)}`,
    issued_at: "2026-07-10T02:10:00.000Z",
    decided_at: "2026-07-10T02:11:00.000Z",
    expires_at: "2026-07-10T02:20:00.000Z",
    coverage: "observed" as const,
    source_refs: [approvalSource, threadRef, turnRef, itemRef, requestRef],
    semantic_approval_created: false as const,
  };
  approvalInput.host_approvals = [approval, clone(approval)];
  const approvalReceipt = buildRunReceiptV01(deepFreeze(approvalInput));
  assert.equal(validateRunReceiptV01(approvalReceipt).status, "valid");
  assert.equal(approvalReceipt.host_approvals?.length, 1);
  assert.equal(
    approvalReceipt.host_approvals?.[0]?.semantic_approval_created,
    false,
  );
  const conflictingApprovalInput = clone(approvalInput);
  conflictingApprovalInput.host_approvals![1]!.decision = "decline";
  const conflictingApproval = buildRunReceiptV01(
    deepFreeze(conflictingApprovalInput),
  );
  assert.ok(
    validateRunReceiptV01(conflictingApproval).errors.some(
      (issue) => issue.code === "host_approval_identity_conflict",
    ),
    "conflicting material for one approval identity must fail closed",
  );
  for (const [unsafePathIndex, unsafePath] of [
    "/home/private/result.txt",
    "C:\\private\\result.txt",
    "\\\\server\\share\\result.txt",
    "\\rooted\\result.txt",
    "file:///home/private/result.txt",
  ].entries()) {
    const unsafeApprovalInput = clone(approvalInput);
    unsafeApprovalInput.run_id = `run-unsafe-approval-${unsafePathIndex}`;
    unsafeApprovalInput.host_approvals![0]!.resource_summary = unsafePath;
    unsafeApprovalInput.host_approvals = [unsafeApprovalInput.host_approvals![0]!];
    const unsafeReceipt = buildRunReceiptV01(
      deepFreeze(unsafeApprovalInput),
    );
    assert.ok(
      validateRunReceiptV01(unsafeReceipt).errors.some(
        (issue) => issue.code === "absolute_local_path_forbidden",
      ),
      `${unsafePath} must not enter a canonical RunReceipt`,
    );
  }
  const opaqueArtifactInput = clone(genericCliDirectObservationInputFixture);
  opaqueArtifactInput.run_id = "run-opaque-provider-artifact-001";
  const opaqueArtifactRef = receiptRef(
    "provider_artifact",
    String.raw`C:\opaque\provider-id`,
  );
  opaqueArtifactInput.external_refs = [
    ...opaqueArtifactInput.external_refs,
    opaqueArtifactRef,
  ];
  opaqueArtifactInput.artifact_refs = [
    ...opaqueArtifactInput.artifact_refs,
    opaqueArtifactRef,
  ];
  const opaqueArtifactReceipt = buildRunReceiptV01(
    deepFreeze(opaqueArtifactInput),
  );
  assert.equal(
    validateRunReceiptV01(opaqueArtifactReceipt).status,
    "valid",
    "opaque ExternalRef IDs must not acquire filesystem-path semantics",
  );

  const normalizedResidueInput = nativeHostResultFixtureV01();
  normalizedResidueInput.changed_files = [
    {
      repository_relative_path: "docs/./guide.md",
      change_kind: "modified",
      before_hash: null,
      after_hash: `sha256:${"4".repeat(64)}`,
    },
    {
      repository_relative_path: "docs/guide.md",
      change_kind: "modified",
      before_hash: null,
      after_hash: `sha256:${"4".repeat(64)}`,
    },
  ];
  normalizedResidueInput.commands = [
    ...normalizedResidueInput.commands,
    clone(normalizedResidueInput.commands[0]!),
  ];
  normalizedResidueInput.artifacts = [
    {
      artifact_ref: receiptRef(
        "repository_relative_artifact",
        "reports/./result.json",
      ),
      summary: "Bounded result artifact.",
    },
    {
      artifact_ref: receiptRef(
        "repository_relative_artifact",
        "reports/result.json",
      ),
      summary: "Bounded result artifact.",
    },
  ];
  normalizedResidueInput.observed_actions = ["z-action", "a-action", "z-action"];
  const normalizedResidue = normalizeNativeHostResultResidueV01({
    result: normalizedResidueInput,
    required_check_ids: ["check:typecheck", "check:missing"],
  });
  assert.equal(normalizedResidue.result.changed_files.length, 1);
  assert.equal(
    normalizedResidue.result.changed_files[0]?.repository_relative_path,
    "docs/guide.md",
  );
  assert.equal(normalizedResidue.result.commands.length, 1);
  assert.equal(normalizedResidue.result.artifacts.length, 1);
  assert.equal(
    normalizedResidue.result.artifacts[0]?.artifact_ref.external_id,
    "reports/result.json",
  );
  assert.deepEqual(normalizedResidue.result.observed_actions, ["a-action", "z-action"]);
  assert.deepEqual(normalizedResidue.synthesized_skipped_check_ids, ["check:missing"]);
  assert.equal(
    normalizedResidue.result.skipped_checks[0]?.reason.includes("remains unverified"),
    true,
  );
  const reorderedResidue = clone(normalizedResidueInput);
  reorderedResidue.changed_files.reverse();
  reorderedResidue.commands.reverse();
  reorderedResidue.artifacts.reverse();
  reorderedResidue.observed_actions.reverse();
  assert.deepEqual(
    normalizeNativeHostResultResidueV01({
      result: reorderedResidue,
      required_check_ids: ["check:missing", "check:typecheck"],
    }),
    normalizedResidue,
    "semantically identical residue must normalize independent of event order",
  );
  const conflictingChangedFile = nativeHostResultFixtureV01();
  conflictingChangedFile.changed_files = [
    {
      repository_relative_path: "src/file.ts",
      change_kind: "added",
      before_hash: null,
      after_hash: null,
    },
    {
      repository_relative_path: "src/file.ts",
      change_kind: "deleted",
      before_hash: null,
      after_hash: null,
    },
  ];
  assert.throws(
    () =>
      normalizeNativeHostResultResidueV01({
        result: conflictingChangedFile,
        required_check_ids: [],
      }),
    (error) =>
      error instanceof NativeHostResultNormalizationErrorV01 &&
      error.code === "native_host_changed_file_conflict",
  );
  const conflictingCommand = nativeHostResultFixtureV01();
  conflictingCommand.commands.push({
    ...conflictingCommand.commands[0]!,
    status: "failed",
  });
  assert.throws(
    () =>
      normalizeNativeHostResultResidueV01({
        result: conflictingCommand,
        required_check_ids: [],
      }),
    (error) =>
      error instanceof NativeHostResultNormalizationErrorV01 &&
      error.code === "native_host_command_conflict",
  );
  const conflictingArtifact = nativeHostResultFixtureV01();
  conflictingArtifact.artifacts = [
    {
      artifact_ref: receiptRef(
        "repository_relative_artifact",
        "reports/result.json",
      ),
      summary: "First bounded summary.",
    },
    {
      artifact_ref: receiptRef(
        "repository_relative_artifact",
        "reports/result.json",
      ),
      summary: "Conflicting bounded summary.",
    },
  ];
  assert.throws(
    () =>
      normalizeNativeHostResultResidueV01({
        result: conflictingArtifact,
        required_check_ids: [],
      }),
    (error) =>
      error instanceof NativeHostResultNormalizationErrorV01 &&
      error.code === "native_host_artifact_conflict",
  );
  const conflictingCheck = nativeHostResultFixtureV01();
  conflictingCheck.checks.push({
    ...conflictingCheck.checks[0]!,
    status: "failed",
  });
  assert.throws(
    () =>
      normalizeNativeHostResultResidueV01({
        result: conflictingCheck,
        required_check_ids: [],
      }),
    (error) =>
      error instanceof NativeHostResultNormalizationErrorV01 &&
      error.code === "native_host_check_conflict",
  );
  const checkSkipConflict = nativeHostResultFixtureV01();
  checkSkipConflict.skipped_checks = [
    {
      check_id: "check:typecheck",
      required: true,
      reason: "The check was explicitly skipped by the bounded fixture.",
    },
  ];
  assert.throws(
    () =>
      normalizeNativeHostResultResidueV01({
        result: checkSkipConflict,
        required_check_ids: ["check:typecheck"],
      }),
    (error) =>
      error instanceof NativeHostResultNormalizationErrorV01 &&
      error.code === "native_host_check_result_skip_conflict",
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

function receiptRef(ref_type: string, external_id: string) {
  return {
    ref_version: "external_ref.v0.1" as const,
    ref_type,
    external_id,
    observed_at: "2026-07-10T02:11:00.000Z",
    trust_class: "direct_local_observation" as const,
  };
}

function nativeHostResultFixtureV01(): NativeHostResultV01 {
  const hostRef = receiptRef("native_host_adapter", "fixture-adapter");
  return {
    result_version: "native_host_result.v0.1",
    request_id: "native-host-request:fixture",
    run_id: "native-host-run:fixture",
    outcome: "completed",
    public_stop_reason: null,
    started_at: "2026-07-10T02:00:00.000Z",
    finished_at: "2026-07-10T02:01:00.000Z",
    host_refs: [hostRef],
    adapter_version: "fixture-adapter.v0.1",
    capability_version: "fixture-capability.v0.1",
    changed_files: [],
    artifacts: [],
    observed_actions: [],
    commands: [
      {
        command_id: "command:typecheck",
        summary: "Run the bounded typecheck.",
        command_fingerprint: `sha256:${"5".repeat(64)}`,
        started_at: "2026-07-10T02:00:10.000Z",
        finished_at: "2026-07-10T02:00:20.000Z",
        exit_code: 0,
        status: "completed",
      },
    ],
    checks: [
      {
        check_id: "check:typecheck",
        required: true,
        status: "passed",
        summary: "The bounded typecheck passed.",
      },
    ],
    skipped_checks: [],
    model_invocation_receipt_refs: [],
    summary: "The bounded fixture completed.",
    uncertainty: [],
    gaps: [],
    proposed_next_steps: [],
    capability_coverage: [],
    adapter_extension: {
      extension_version: "fixture-extension.v0.1",
      adapter_kind: "fixture",
      bounded_metadata: {},
    },
  };
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
