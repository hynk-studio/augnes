import type { RunReceiptBuilderInputV01 } from "@/lib/vnext/run-receipt";
import {
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefTrustClassV01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

export const RUN_RECEIPT_FIXTURE_RECORDED_AT = "2026-07-10T03:00:00.000Z";
const STARTED_AT = "2026-07-10T02:00:00.000Z";
const FINISHED_AT = "2026-07-10T02:30:00.000Z";

function ref(
  ref_type: string,
  external_id: string,
  trust_class: ExternalRefTrustClassV01,
  extra: Partial<ExternalRefV01> = {},
): ExternalRefV01 {
  return {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type,
    external_id,
    trust_class,
    ...extra,
  };
}

const localObserverRef = ref(
  "worker",
  "generic-cli-worker",
  "direct_local_observation",
  { host: "local-cli", observed_at: FINISHED_AT },
);
const localVerifierRef = ref(
  "verifier",
  "local-test-runner",
  "direct_local_observation",
  { host: "local-cli", observed_at: FINISHED_AT },
);
const repositoryRef = ref(
  "repository",
  "hynk-studio/augnes",
  "direct_local_observation",
  { host: "git", observed_at: FINISHED_AT },
);
const artifactRef = ref(
  "repository_relative_path",
  "lib/vnext/run-receipt.ts",
  "direct_local_observation",
  { host: "git", observed_at: FINISHED_AT },
);

function baseInput(): RunReceiptBuilderInputV01 {
  return {
    workspace_id: "workspace-augnes-fixture",
    project_id: "project-augnes-fixture",
    run_id: "run-generic-cli-001",
    work_ref: null,
    task_context_packet_ref: ref(
      "task_context_packet",
      "task-context-packet:fixture",
      "direct_local_observation",
    ),
    recorded_at: RUN_RECEIPT_FIXTURE_RECORDED_AT,
    started_at: STARTED_AT,
    finished_at: FINISHED_AT,
    execution: {
      status: "completed",
      basis: "observed",
      source_refs: [localObserverRef],
    },
    verification: {
      status: "passed",
      basis: "observed",
      required_check_ids: ["check:typecheck"],
      source_refs: [localVerifierRef],
    },
    reporter_ref: localObserverRef,
    observer_refs: [localObserverRef],
    verifier_refs: [localVerifierRef],
    host_ref: null,
    worker_ref: localObserverRef,
    model_invocations: [],
    execution_environment: {
      environment_kind: "local",
      host_ref: null,
      worker_ref: localObserverRef,
      operating_system: "portable-cli",
      runtime_labels: ["node", "typescript"],
      source_refs: [localObserverRef],
    },
    observations: [
      {
        observation_id: "observation:command:typecheck",
        observation_kind: "command_result",
        summary: "The local typecheck command exited successfully.",
        event_at: FINISHED_AT,
        observed_at: FINISHED_AT,
        observer_ref: localObserverRef,
        trust_class: "direct_local_observation",
        source_refs: [localVerifierRef],
        related_command_ids: ["command:typecheck"],
        related_check_ids: ["check:typecheck"],
        related_artifact_refs: [],
      },
      {
        observation_id: "observation:artifact:hash",
        observation_kind: "repository_artifact_hash",
        summary: "The repository-relative artifact hash was observed locally.",
        event_at: FINISHED_AT,
        observed_at: FINISHED_AT,
        observer_ref: localObserverRef,
        trust_class: "direct_local_observation",
        source_refs: [repositoryRef],
        related_command_ids: [],
        related_check_ids: [],
        related_artifact_refs: [artifactRef],
      },
    ],
    attestations: [],
    changed_artifacts: [
      {
        artifact_ref: artifactRef,
        change_kind: "added",
        before_hash: null,
        after_hash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        basis: "observed",
        related_observation_ids: ["observation:artifact:hash"],
        related_attestation_ids: [],
        source_refs: [repositoryRef],
      },
    ],
    commands: [
      {
        command_id: "command:typecheck",
        summary: "Run the repository typecheck.",
        command_fingerprint:
          "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        started_at: STARTED_AT,
        finished_at: FINISHED_AT,
        exit_code: 0,
        status: "completed",
        basis: "observed",
        source_refs: [localObserverRef],
        raw_output_included: false,
      },
    ],
    checks: [
      {
        check_id: "check:typecheck",
        required: true,
        status: "passed",
        basis: "observed",
        summary: "Repository typecheck passed.",
        source_refs: [localVerifierRef],
      },
    ],
    skipped_checks: [],
    external_refs: [repositoryRef],
    result_summary: {
      summary: "The bounded Generic CLI run completed and its required check passed.",
      outcome: "Contract fixture completed.",
      limitations: ["Receipt is not approval or accepted Evidence."],
    },
    blockers: [],
    warnings: [],
    gaps: [
      {
        code: "egress_not_evaluated",
        summary: "The fixture does not claim knowledge of run egress.",
        source_refs: [],
      },
    ],
    privacy_egress: {
      data_classification: "public_safe",
      egress_status: "unknown",
      basis: "unknown",
      destination_refs: [],
      redaction_status: "not_needed",
      retention_class: null,
      raw_prompt_persisted: false,
      raw_output_persisted: false,
      raw_transcript_persisted: false,
      secret_material_persisted: false,
      source_refs: [],
      notes: ["Builder purity is not evidence about run egress."],
    },
    cost_usage: {
      cost_basis: "unknown",
      cost_amount: null,
      currency: null,
      usage: {
        basis: "unknown",
        input_units: null,
        output_units: null,
        total_units: null,
        unit: null,
      },
      source_refs: [],
    },
    capability_coverage: [
      {
        capability: "local_repository_observation",
        coverage_level: "observed",
        source_ref: localObserverRef,
        notes: ["Observation does not imply enforcement."],
      },
    ],
    source_refs: [repositoryRef],
    artifact_refs: [artifactRef],
    compatibility: {
      source_contracts: [],
      unmapped_fields: [],
      warnings: [],
      external_refs: [],
    },
    authority_notes: [],
  };
}

export const genericCliDirectObservationInputFixture = baseInput();

export const openAiCodexHostAttestationInputFixture = (() => {
  const hostReporter = ref("codex_session", "codex-session-fixture", "host_attestation", {
    provider: "openai",
    host: "codex",
    observed_at: FINISHED_AT,
  });
  const providerRef = ref("provider", "openai", "provider_report", {
    provider: "openai",
  });
  const modelRef = ref("model", "provider-model-fixture", "provider_report", {
    provider: "openai",
  });
  const invocationRef = ref(
    "model_invocation",
    "response-fixture-001",
    "provider_report",
    { provider: "openai", host: "codex" },
  );
  const changedRef = ref(
    "repository_relative_path",
    "types/vnext/run-receipt.ts",
    "host_attestation",
    { host: "codex" },
  );
  const input = baseInput();
  input.run_id = "run-host-attestation-001";
  input.execution = { status: "completed", basis: "attested", source_refs: [hostReporter] };
  input.verification = {
    status: "passed",
    basis: "attested",
    required_check_ids: ["check:typecheck"],
    source_refs: [hostReporter],
  };
  input.reporter_ref = hostReporter;
  input.observer_refs = [];
  input.verifier_refs = [hostReporter];
  input.host_ref = hostReporter;
  input.worker_ref = hostReporter;
  input.execution_environment = {
    environment_kind: "remote",
    host_ref: hostReporter,
    worker_ref: hostReporter,
    operating_system: null,
    runtime_labels: ["host-reported"],
    source_refs: [hostReporter],
  };
  input.observations = [];
  input.attestations = [
    {
      attestation_id: "attestation:changed-file",
      attestation_kind: "changed_artifact_claim",
      summary: "The host reported that a repository-relative file changed.",
      reported_at: FINISHED_AT,
      reporter_ref: hostReporter,
      trust_class: "host_attestation",
      source_refs: [hostReporter],
      subject_refs: [changedRef],
    },
    {
      attestation_id: "attestation:check",
      attestation_kind: "check_result_claim",
      summary: "The host reported that typecheck passed.",
      reported_at: FINISHED_AT,
      reporter_ref: hostReporter,
      trust_class: "host_attestation",
      source_refs: [hostReporter],
      subject_refs: [],
    },
  ];
  input.changed_artifacts = [
    {
      artifact_ref: changedRef,
      change_kind: "added",
      before_hash: null,
      after_hash: null,
      basis: "attested",
      related_observation_ids: [],
      related_attestation_ids: ["attestation:changed-file"],
      source_refs: [hostReporter],
    },
  ];
  input.commands = [];
  input.checks = [
    {
      check_id: "check:typecheck",
      required: true,
      status: "passed",
      basis: "attested",
      summary: "Host-reported typecheck pass.",
      source_refs: [hostReporter],
    },
  ];
  input.skipped_checks = [
    {
      check_id: "check:browser",
      required: false,
      reason: "No UI or browser behavior changed in this protocol-only fixture.",
      basis: "attested",
      source_refs: [hostReporter],
    },
  ];
  input.model_invocations = [
    {
      invocation_ref: invocationRef,
      provider_ref: providerRef,
      model_ref: modelRef,
      started_at: STARTED_AT,
      finished_at: FINISHED_AT,
      input_units: 120,
      output_units: 45,
      latency_ms: 900,
      retry_count: 0,
      status: "completed",
      retention_class: "provider-declared",
      egress_status: "occurred",
      raw_prompt_persisted: false,
      raw_response_persisted: false,
      hidden_reasoning_persisted: false,
      source_refs: [providerRef],
    },
  ];
  input.privacy_egress = {
    ...input.privacy_egress,
    egress_status: "occurred",
    basis: "attested",
    destination_refs: [providerRef],
    source_refs: [hostReporter],
    notes: ["Egress is host-attested, not directly observed by Core."],
  };
  input.cost_usage = {
    cost_basis: "unknown",
    cost_amount: null,
    currency: null,
    usage: {
      basis: "attested",
      input_units: 120,
      output_units: 45,
      total_units: 165,
      unit: "tokens",
    },
    source_refs: [providerRef],
  };
  input.external_refs = [hostReporter, providerRef, modelRef, invocationRef];
  input.source_refs = [hostReporter];
  input.artifact_refs = [changedRef];
  input.compatibility = {
    source_contracts: ["host_result_fixture.v0.1"],
    unmapped_fields: [],
    warnings: ["Host claims remain attestations."],
    external_refs: [hostReporter, providerRef, modelRef, invocationRef],
  };
  return input;
})();

export const mixedProvenanceInputFixture = (() => {
  const input = baseInput();
  const hostReporter = ref("host_report", "host-report-mixed", "host_attestation");
  const ciVerifier = ref(
    "ci_job",
    "ci-job-fixture",
    "verified_external_observation",
    { host: "generic-ci", observed_at: FINISHED_AT },
  );
  input.run_id = "run-mixed-001";
  input.execution = { status: "completed", basis: "mixed", source_refs: [localObserverRef, hostReporter] };
  input.verification = { status: "passed", basis: "mixed", required_check_ids: ["check:typecheck"], source_refs: [ciVerifier, hostReporter] };
  input.reporter_ref = hostReporter;
  input.observer_refs = [localObserverRef, ciVerifier];
  input.verifier_refs = [ciVerifier];
  input.observations = [
    baseInput().observations[1]!,
    {
      observation_id: "observation:ci:typecheck",
      observation_kind: "external_ci_check",
      summary: "The external CI source independently verified typecheck.",
      event_at: FINISHED_AT,
      observed_at: FINISHED_AT,
      observer_ref: ciVerifier,
      trust_class: "verified_external_observation",
      source_refs: [ciVerifier],
      related_command_ids: [],
      related_check_ids: ["check:typecheck"],
      related_artifact_refs: [],
    },
  ];
  input.attestations = [
    {
      attestation_id: "attestation:host:files",
      attestation_kind: "changed_artifact_claim",
      summary: "The host attested that files changed.",
      reported_at: FINISHED_AT,
      reporter_ref: hostReporter,
      trust_class: "host_attestation",
      source_refs: [hostReporter],
      subject_refs: [artifactRef],
    },
  ];
  input.changed_artifacts[0] = {
    ...input.changed_artifacts[0]!,
    basis: "mixed",
    related_attestation_ids: ["attestation:host:files"],
  };
  input.checks[0] = {
    ...input.checks[0]!,
    basis: "observed",
    source_refs: [ciVerifier],
  };
  input.external_refs = [repositoryRef, hostReporter, ciVerifier];
  input.source_refs = [repositoryRef, hostReporter, ciVerifier];
  return input;
})();

export const completedFailedVerificationInputFixture = (() => {
  const input = baseInput();
  input.run_id = "run-completed-failed-verification-001";
  input.verification.status = "failed";
  input.checks[0] = { ...input.checks[0]!, status: "failed", summary: "Required typecheck failed." };
  return input;
})();

export const blockedNoChecksInputFixture = (() => {
  const input = baseInput();
  input.run_id = "run-blocked-001";
  input.execution = { status: "blocked", basis: "observed", source_refs: [localObserverRef] };
  input.verification = { status: "not_run", basis: "unknown", required_check_ids: [], source_refs: [] };
  input.observations = [
    {
      observation_id: "observation:execution:blocked",
      observation_kind: "execution_blocker",
      summary: "The local observer recorded that execution could not start.",
      event_at: FINISHED_AT,
      observed_at: FINISHED_AT,
      observer_ref: localObserverRef,
      trust_class: "direct_local_observation",
      source_refs: [localObserverRef],
      related_command_ids: [],
      related_check_ids: [],
      related_artifact_refs: [],
    },
  ];
  input.changed_artifacts = [];
  input.commands = [];
  input.checks = [];
  input.skipped_checks = [];
  input.blockers = [
    {
      code: "required_input_missing",
      summary: "Execution could not start because a required input was unavailable.",
      source_refs: [localObserverRef],
    },
  ];
  input.artifact_refs = [];
  return input;
})();

export interface InvalidRunReceiptFixtureCaseV01 {
  name: string;
  expected_status: "invalid" | "blocked";
  expected_error_code: string;
  mutate(receipt: RunReceiptV01): unknown;
}

function mutation(
  name: string,
  expected_status: "invalid" | "blocked",
  expected_error_code: string,
  mutate: (receipt: RunReceiptV01 & Record<string, unknown>) => void,
): InvalidRunReceiptFixtureCaseV01 {
  return {
    name,
    expected_status,
    expected_error_code,
    mutate(receipt) {
      const value = JSON.parse(JSON.stringify(receipt)) as RunReceiptV01 &
        Record<string, unknown>;
      mutate(value);
      return value;
    },
  };
}

export const invalidRunReceiptFixtureCases: InvalidRunReceiptFixtureCaseV01[] = [
  mutation("missing_workspace_id", "invalid", "workspace_id_missing", (value) => { value.workspace_id = ""; }),
  mutation("missing_project_id", "invalid", "project_id_missing", (value) => { value.project_id = ""; }),
  mutation("missing_canonical_run_id", "invalid", "run_id_missing", (value) => { value.run_id = ""; }),
  mutation("unknown_receipt_version", "blocked", "unsupported_protocol_version", (value) => { value.receipt_version = "run_receipt.v9" as never; }),
  mutation("malformed_receipt_id", "invalid", "receipt_identity_mismatch", (value) => { value.receipt_id = "run-receipt:wrong"; }),
  mutation("invalid_fingerprint", "invalid", "fingerprint_mismatch", (value) => { value.integrity.fingerprint = "sha256:wrong"; }),
  mutation("invalid_idempotency_key", "invalid", "idempotency_key_mismatch", (value) => { value.idempotency_key = "sha256:wrong"; }),
  mutation("direct_observation_no_observer", "invalid", "external_ref_malformed", (value) => { (value.observations[0] as unknown as Record<string, unknown>).observer_ref = null; }),
  mutation("observation_attestation_trust", "blocked", "observation_trust_class_invalid", (value) => { value.observations[0]!.trust_class = "host_attestation" as never; }),
  mutation("attestation_observation_trust", "blocked", "attestation_trust_class_invalid", (value) => { value.attestations = [{ ...openAiCodexHostAttestationInputFixture.attestations[0]!, trust_class: "direct_local_observation" as never }]; }),
  mutation("provider_native_run_id", "blocked", "provider_specific_core_field", (value) => { (value.compatibility as unknown as Record<string, unknown>).run_id = "provider-run"; }),
  mutation("raw_prompt_field", "blocked", "raw_prompt_shaped_field", (value) => { value.raw_prompt = "fixture"; }),
  mutation("raw_provider_output_field", "blocked", "raw_provider_output_shaped_field", (value) => { value.raw_provider_output = "fixture"; }),
  mutation("raw_terminal_log_field", "blocked", "raw_terminal_log_shaped_field", (value) => { value.raw_terminal_log = "fixture"; }),
  mutation("raw_transcript_field", "blocked", "raw_transcript_shaped_field", (value) => { value.raw_transcript = "fixture"; }),
  mutation("hidden_reasoning_field", "blocked", "hidden_reasoning_shaped_field", (value) => { value.hidden_reasoning = "fixture"; }),
  mutation("secret_shaped_value", "blocked", "secret_shaped_material", (value) => { value.warnings[0] = { code: "fixture", summary: "OPENAI_API_KEY=fixture-secret-value", source_refs: [] }; }),
  mutation("absolute_local_path", "blocked", "absolute_local_path_forbidden", (value) => { value.changed_artifacts[0]!.artifact_ref.external_id = "/Users/example/private/file.ts"; }),
  mutation("invalid_timestamp", "invalid", "timestamp_invalid", (value) => { value.recorded_at = "not-a-time"; }),
  mutation("finish_before_start", "invalid", "time_order_invalid", (value) => { value.finished_at = "2026-07-10T01:00:00.000Z"; }),
  mutation("required_failed_check_with_pass", "invalid", "verification_pass_conflicts_required_check", (value) => { value.checks[0]!.status = "failed"; }),
  mutation("required_skipped_check_with_pass", "invalid", "verification_pass_conflicts_required_skip", (value) => { value.checks = []; value.skipped_checks = [{ check_id: "check:typecheck", required: true, reason: "The required compiler was unavailable.", basis: "attested", source_refs: [localObserverRef] }]; }),
  mutation("required_unaccounted_check_with_pass", "invalid", "required_check_unaccounted", (value) => { value.checks = []; }),
  mutation("skipped_check_no_reason", "invalid", "reason_missing", (value) => { value.skipped_checks = [{ check_id: "check:browser", required: false, reason: "", basis: "unknown", source_refs: [] }]; }),
  mutation("conflicting_check_results", "blocked", "conflicting_check_results", (value) => { value.checks.push({ ...value.checks[0]!, status: "failed" }); }),
  mutation("measured_cost_without_currency", "invalid", "cost_currency_missing", (value) => { value.cost_usage.cost_basis = "measured"; value.cost_usage.cost_amount = 1.25; value.cost_usage.currency = null; }),
  mutation("unknown_cost_as_zero", "invalid", "unknown_cost_must_be_null", (value) => { value.cost_usage.cost_basis = "unknown"; value.cost_usage.cost_amount = 0; }),
  mutation("egress_claim_inconsistent", "invalid", "egress_claim_basis_inconsistent", (value) => { value.privacy_egress.egress_status = "did_not_occur"; value.privacy_egress.basis = "unknown"; }),
  mutation("unknown_observation_authority_field", "blocked", "forbidden_semantic_field", (value) => { (value.observations[0] as unknown as Record<string, unknown>).accepted_evidence = true; }),
  mutation("unknown_attestation_approval_field", "blocked", "forbidden_semantic_field", (value) => { const item = JSON.parse(JSON.stringify(openAiCodexHostAttestationInputFixture.attestations[0])) as Record<string, unknown>; item.approval_granted = true; value.attestations = [item as never]; }),
  mutation("unknown_check_state_field", "blocked", "forbidden_semantic_field", (value) => { (value.checks[0] as unknown as Record<string, unknown>).canonical_state_applied = true; }),
  mutation("unknown_result_summary_work_field", "blocked", "forbidden_semantic_field", (value) => { (value.result_summary as unknown as Record<string, unknown>).work_closed = true; }),
  mutation("unknown_privacy_policy_field", "invalid", "unknown_nested_field", (value) => { (value.privacy_egress as unknown as Record<string, unknown>).extra_policy_claim = true; }),
  mutation("unknown_usage_metric_field", "invalid", "unknown_nested_field", (value) => { (value.cost_usage.usage as unknown as Record<string, unknown>).unrecognized_metric = 1; }),
  mutation("execution_observed_without_observation", "invalid", "observed_basis_unsupported", (value) => { value.observations = []; }),
  mutation("execution_attested_without_reporter", "invalid", "attested_basis_unsupported", (value) => { value.execution.basis = "attested"; }),
  mutation("execution_mixed_without_attestation", "invalid", "mixed_basis_unsupported", (value) => { value.execution.basis = "mixed"; }),
  mutation("blocked_execution_without_blocker", "invalid", "blocked_execution_requires_blocker", (value) => { value.execution.status = "blocked"; value.blockers = []; }),
  mutation("verification_observed_without_material", "invalid", "observed_basis_unsupported", (value) => { value.checks[0]!.basis = "unknown"; value.observations.forEach((item) => { item.related_check_ids = []; }); }),
  mutation("verification_attested_without_reporter", "invalid", "attested_basis_unsupported", (value) => { value.verification.basis = "attested"; }),
  mutation("verification_mixed_without_attestation", "invalid", "mixed_basis_unsupported", (value) => { value.verification.basis = "mixed"; }),
  mutation("command_observed_source_unregistered", "invalid", "basis_provenance_source_unregistered", (value) => { value.commands[0]!.source_refs = [repositoryRef]; }),
  mutation("command_attested_without_reporter", "invalid", "attested_basis_unsupported", (value) => { value.commands[0]!.basis = "attested"; }),
  mutation("check_observed_source_unregistered", "invalid", "basis_provenance_source_unregistered", (value) => { value.checks[0]!.source_refs = [repositoryRef]; }),
  mutation("skipped_check_attested_without_reporter", "invalid", "attested_basis_unsupported", (value) => { value.skipped_checks = [{ check_id: "check:optional", required: false, reason: "Optional environment was unavailable.", basis: "attested", source_refs: [localObserverRef] }]; }),
  mutation("duplicate_conflicting_observation_id", "invalid", "duplicate_observation_id", (value) => { value.observations.push({ ...value.observations[0]!, summary: "Conflicting observation meaning." }); }),
  mutation("duplicate_conflicting_attestation_id", "invalid", "duplicate_attestation_id", (value) => { const item = JSON.parse(JSON.stringify(openAiCodexHostAttestationInputFixture.attestations[0])); value.attestations = [item, { ...item, summary: "Conflicting attestation meaning." }]; }),
  mutation("duplicate_command_id", "invalid", "duplicate_command_id", (value) => { value.commands.push({ ...value.commands[0]!, summary: "Conflicting command meaning." }); }),
  mutation("duplicate_same_status_check_id", "invalid", "duplicate_check_id", (value) => { value.checks.push({ ...value.checks[0]!, summary: "Conflicting same-status check meaning." }); }),
  mutation("duplicate_skipped_check_id", "invalid", "duplicate_skipped_check_id", (value) => { const skipped = { check_id: "check:optional", required: false, reason: "Optional browser was unavailable.", basis: "unknown" as const, source_refs: [] }; value.skipped_checks = [skipped, { ...skipped, reason: "A different skip meaning." }]; }),
  mutation("check_and_skip_same_id", "blocked", "check_result_and_skip_conflict", (value) => { value.skipped_checks = [{ check_id: "check:typecheck", required: false, reason: "Conflicting skip entry.", basis: "unknown", source_refs: [] }]; }),
  mutation("unknown_related_command_id", "invalid", "observation_related_command_missing", (value) => { value.observations[0]!.related_command_ids.push("command:missing"); }),
  mutation("unknown_related_check_id", "invalid", "observation_related_check_missing", (value) => { value.observations[0]!.related_check_ids.push("check:missing"); }),
  mutation("unknown_related_artifact_ref", "invalid", "observation_related_artifact_missing", (value) => { value.observations[0]!.related_artifact_refs.push(ref("repository_relative_path", "missing/artifact.ts", "direct_local_observation")); }),
  mutation("unknown_related_observation_with_valid", "invalid", "artifact_related_observation_missing", (value) => { value.changed_artifacts[0]!.related_observation_ids.push("observation:missing"); }),
  mutation("unknown_related_attestation_with_valid", "invalid", "artifact_related_attestation_missing", (value) => { const attestation = JSON.parse(JSON.stringify(openAiCodexHostAttestationInputFixture.attestations[0])); value.attestations = [attestation]; value.changed_artifacts[0]!.basis = "mixed"; value.changed_artifacts[0]!.related_attestation_ids = [attestation.attestation_id, "attestation:missing"]; }),
  mutation("invalid_data_classification", "invalid", "data_classification_invalid", (value) => { value.privacy_egress.data_classification = "unclassified" as never; }),
  mutation("invalid_redaction_status", "invalid", "redaction_status_invalid", (value) => { value.privacy_egress.redaction_status = "complete" as never; }),
  mutation("non_unknown_egress_without_source", "invalid", "egress_source_missing", (value) => { value.privacy_egress.egress_status = "blocked"; value.privacy_egress.basis = "observed"; value.privacy_egress.source_refs = []; }),
  mutation("did_not_occur_with_unjustified_destination", "invalid", "did_not_occur_destination_unjustified", (value) => { value.privacy_egress.egress_status = "did_not_occur"; value.privacy_egress.basis = "observed"; value.privacy_egress.source_refs = [localObserverRef]; value.privacy_egress.destination_refs = [repositoryRef]; }),
  mutation("privacy_notes_malformed", "invalid", "string_array_malformed", (value) => { value.privacy_egress.notes = [""]; }),
  mutation("privacy_retention_malformed", "invalid", "retention_class_invalid", (value) => { value.privacy_egress.retention_class = ""; }),
  mutation("model_non_unknown_egress_without_source", "invalid", "model_egress_source_missing", (value) => { const invocation = JSON.parse(JSON.stringify(openAiCodexHostAttestationInputFixture.model_invocations[0])); invocation.source_refs = []; value.model_invocations = [invocation]; }),
  mutation("model_occurred_egress_without_destination", "invalid", "model_egress_destination_missing", (value) => { const invocation = JSON.parse(JSON.stringify(openAiCodexHostAttestationInputFixture.model_invocations[0])); invocation.provider_ref = null; invocation.source_refs = [invocation.invocation_ref]; value.model_invocations = [invocation]; }),
  mutation("unsupported_usage_basis", "invalid", "usage_basis_invalid", (value) => { value.cost_usage.usage.basis = "reported" as never; }),
  mutation("negative_usage", "invalid", "usage_value_invalid", (value) => { value.cost_usage.usage.basis = "measured"; value.cost_usage.usage.input_units = -1; value.cost_usage.usage.unit = "tokens"; }),
  mutation("non_finite_usage", "invalid", "usage_value_invalid", (value) => { value.cost_usage.usage.basis = "measured"; value.cost_usage.usage.input_units = Number.POSITIVE_INFINITY; value.cost_usage.usage.unit = "tokens"; }),
  mutation("measured_usage_without_counts", "invalid", "usage_counts_missing", (value) => { value.cost_usage.usage.basis = "measured"; value.cost_usage.usage.unit = "tokens"; }),
  mutation("measured_usage_without_unit", "invalid", "usage_unit_missing", (value) => { value.cost_usage.usage.basis = "measured"; value.cost_usage.usage.input_units = 1; value.cost_usage.usage.unit = null; }),
  mutation("measured_cost_without_amount", "invalid", "cost_amount_missing", (value) => { value.cost_usage.cost_basis = "measured"; value.cost_usage.cost_amount = null; value.cost_usage.currency = "USD"; }),
  mutation("unknown_cost_with_currency", "invalid", "unknown_cost_currency_must_be_null", (value) => { value.cost_usage.currency = "USD"; }),
  mutation("unknown_usage_with_unit", "invalid", "unknown_usage_unit_must_be_null", (value) => { value.cost_usage.usage.unit = "tokens"; }),
  mutation("authority_grant", "blocked", "authority_boundary_violation", (value) => { (value.authority_summary as unknown as Record<string, unknown>).authorizes_execution = true; }),
  mutation("authority_write_grant", "blocked", "authority_boundary_violation", (value) => { (value.authority_summary as unknown as Record<string, unknown>).authorizes_write = true; }),
];
