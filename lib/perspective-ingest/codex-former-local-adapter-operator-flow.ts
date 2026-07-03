import type {
  CodexFormerLocalAdapterValidateAuthorityFlags,
  CodexFormerLocalAdapterValidateExecutionResult,
  CodexFormerLocalAdapterValidateFailureKind,
} from "@/lib/perspective-ingest/codex-former-local-adapter-validate-orchestration";
import type {
  CodexFormerLocalAdapterValidateExecutionSummaryForSnapshots,
  CodexFormerLocalAdapterValidateResultState,
} from "@/lib/perspective-ingest/codex-former-local-adapter-validate-result-snapshots";

export const CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_ROUTE =
  "/perspective/codex-former/local-adapter-operator-flow";
export const CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_VALIDATE_ROUTE =
  "/api/perspective/codex-former/local-adapter-operator-flow/validate";
export const CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_INTAKE_DIR =
  "reports/intake/codex-former-returned-envelopes";
export const CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_RETURNED_ENVELOPE_INTAKE_ROUTE =
  "/api/perspective/codex-former/local-adapter-operator-flow/returned-envelope-intake";
export const CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_RETURNED_ENVELOPE_INTAKE_VALIDATE_ROUTE =
  "/api/perspective/codex-former/local-adapter-operator-flow/returned-envelope-intake/validate";

export const CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_STORAGE_NAMESPACE =
  "augnes.codexFormer.localAdapterOperatorFlow.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_AUTHORITY_BOUNDARY =
  "review-only local-only non-authorizing";

export const operatorFlowSourceInputRefs = [
  "reports/fixtures/2026-06-12-codex-former-local-adapter-source-input-pass.json",
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json",
] as const;

export const operatorFlowPrepareExecutionSummaryRefs = [
  "reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass-with-follow-up.json",
] as const;

export type OperatorFlowReturnedEnvelopeFixtureKey =
  | "pass"
  | "pass_with_follow_up"
  | "blocked";

export type OperatorFlowActiveStep =
  | "source_prepare"
  | "copy_for_codex"
  | "returned_envelope"
  | "validate_result"
  | "candidate_review"
  | "candidate_action";

export type OperatorFlowValidationResultState =
  | "not_validated"
  | CodexFormerLocalAdapterValidateResultState;

export type OperatorFlowValidationSource =
  | "not_run"
  | "fixture_preview"
  | "real_local_validate_execution"
  | "blocked_before_execution";

export type OperatorFlowCandidateAction =
  | "keep_review_only"
  | "accept_as_perspective_candidate"
  | "reject_from_memory_candidate"
  | "supersede_previous_candidate";

export const operatorFlowReturnedEnvelopeFixtureKeys: OperatorFlowReturnedEnvelopeFixtureKey[] =
  ["pass", "pass_with_follow_up", "blocked"];

export const operatorFlowCandidateActions: OperatorFlowCandidateAction[] = [
  "keep_review_only",
  "accept_as_perspective_candidate",
  "reject_from_memory_candidate",
  "supersede_previous_candidate",
];

export const operatorFlowActiveSteps: OperatorFlowActiveStep[] = [
  "source_prepare",
  "copy_for_codex",
  "returned_envelope",
  "validate_result",
  "candidate_review",
  "candidate_action",
];

export type OperatorFlowSourceInput = {
  generated_at: string;
  work_id: string;
  source_pr_refs: string[];
  changed_files: string[];
  changed_files_summary: string;
  tests_checks_run: Array<{
    check_id: string;
    command: string;
    status: string;
    result_summary: string;
  }>;
  skipped_checks: unknown[];
  unresolved_gaps: unknown[];
  readiness: {
    status: string;
    reasons: string[];
  };
  authority_boundaries: string[];
  source_privacy_redaction_notes: string[];
};

export type OperatorFlowPrepareExecutionSummary = {
  mode: "prepare-orchestration-execution";
  generated_at: string;
  source_input_path: string;
  source_input_hash: string;
  execution_result: "success" | string;
  output_discovery_status: string;
  next_safe_action: string;
  helper_output_refs: {
    former_input_packet_ref: string;
    manual_copy_packet_ref: string;
  };
  authority_flags: Record<string, boolean>;
};

export type OperatorFlowScenarioInput = {
  key: OperatorFlowReturnedEnvelopeFixtureKey;
  label: string;
  sourceInput: OperatorFlowSourceInput;
  sourceInputPath: string;
  prepareSummary: OperatorFlowPrepareExecutionSummary;
  prepareSummaryPath: string;
  validateSummary: CodexFormerLocalAdapterValidateExecutionSummaryForSnapshots;
  validateSummaryPath: string;
  returnedEnvelopeText: string;
  returnedEnvelopePath: string;
};

export type OperatorFlowInput = {
  scenarios: Record<
    OperatorFlowReturnedEnvelopeFixtureKey,
    OperatorFlowScenarioInput
  >;
};

export type OperatorFlowRef = {
  ref: string;
  path: string;
  hash: string;
  generated_at: string;
};

export type OperatorFlowCheckSummary = {
  check_id: string;
  command: string;
  status: string;
  result_summary: string;
};

export type OperatorFlowValidationPreview = {
  validation_source: Exclude<OperatorFlowValidationSource, "not_run">;
  result_state: CodexFormerLocalAdapterValidateResultState;
  execution_result: CodexFormerLocalAdapterValidateExecutionResult;
  failure_kind:
    | CodexFormerLocalAdapterValidateFailureKind
    | "blocked_before_execution";
  candidate_count: number;
  warnings: string[];
  pointer_warnings: string[];
  blocked_reasons: string[];
  next_safe_action: string;
  candidate_compatible_review_material: boolean;
  worker_facing_guidance_status: string;
  candidate_basis_quality: string | null;
  candidate_authority: string | null;
  validation_summary_path: string;
  validation_summary_hash: string;
  source_input_hash: string;
  prepare_execution_summary_hash: string;
  returned_envelope_hash: string;
  authority_flags: CodexFormerLocalAdapterValidateAuthorityFlags;
  authority_boundary: typeof CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_AUTHORITY_BOUNDARY;
};

export type OperatorFlowLocalValidationRequest = {
  selected_returned_envelope_fixture_key: OperatorFlowReturnedEnvelopeFixtureKey | null;
  source_input_ref: string;
  prepare_summary_ref: string;
  returned_envelope_text: string;
};

export type OperatorFlowLocalValidationResponse = {
  validation_source:
    | "real_local_validate_execution"
    | "blocked_before_execution";
  validation_result: OperatorFlowValidationPreview;
  bridge_execution_path:
    | "direct_validate_orchestration_library_call"
    | "blocked_before_execution";
  boundary: typeof CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_AUTHORITY_BOUNDARY;
};

export type OperatorFlowReturnedEnvelopeIntakeEntry = {
  ref: string;
  file_size_bytes: number;
  content_hash: string;
  modified_at: string;
  valid: boolean;
  blocked_reasons: string[];
};

export type OperatorFlowReturnedEnvelopeIntakeListResponse = {
  intake_directory_ref: `${typeof CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_INTAKE_DIR}/`;
  max_returned_envelope_bytes: number;
  latest_ref: string | null;
  latest: OperatorFlowReturnedEnvelopeIntakeEntry | null;
  entries: OperatorFlowReturnedEnvelopeIntakeEntry[];
  blocked_reasons: string[];
  boundary: typeof CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_AUTHORITY_BOUNDARY;
};

export type OperatorFlowReturnedEnvelopeIntakeValidationResponse =
  OperatorFlowLocalValidationResponse & {
    returned_envelope_intake: OperatorFlowReturnedEnvelopeIntakeEntry | null;
    returned_envelope_text: string | null;
  };

export type OperatorFlowScenarioViewModel = {
  key: OperatorFlowReturnedEnvelopeFixtureKey;
  label: string;
  source_input_ref: OperatorFlowRef & {
    changed_files_count: number;
    changed_files: string[];
    readiness_status: string;
    readiness_reasons: string[];
    source_pr_refs: string[];
    summary: string;
    tests_checks_run: OperatorFlowCheckSummary[];
    skipped_checks_summary: string;
    unresolved_gaps_summary: string;
  };
  prepare_summary_ref: OperatorFlowRef & {
    status: string;
    output_discovery_status: string;
    former_input_packet_ref: string;
    manual_copy_packet_ref: string;
    source_prompt_hash: string | null;
    source_manual_copy_packet_id: string | null;
    next_safe_action: string;
  };
  returned_envelope_fixture: {
    key: OperatorFlowReturnedEnvelopeFixtureKey;
    label: string;
    path: string;
    hash: string;
    text: string;
  };
  validation_result: OperatorFlowValidationPreview;
  candidate_review_material: {
    available: boolean;
    review_summary: string;
    changed_files_count: number;
    source_pr_refs: string[];
    worker_facing_guidance_status: string;
    candidate_basis_quality: string | null;
    candidate_authority: string | null;
  };
};

export type OperatorFlowViewModel = {
  route: typeof CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_ROUTE;
  storage_namespace: typeof CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_STORAGE_NAMESPACE;
  default_fixture_key: OperatorFlowReturnedEnvelopeFixtureKey;
  scenarios: Record<
    OperatorFlowReturnedEnvelopeFixtureKey,
    OperatorFlowScenarioViewModel
  >;
  candidate_actions: OperatorFlowCandidateAction[];
  active_steps: OperatorFlowActiveStep[];
  copy_packet_preview: string;
  validation: {
    valid: boolean;
    errors: string[];
  };
};

export type OperatorFlowPersistedDraft = {
  draft_id: string;
  generated_at: string;
  updated_at: string;
  selected_source_input_ref: string;
  selected_prepare_summary_ref: string;
  active_step: OperatorFlowActiveStep;
  selected_returned_envelope_fixture_key: OperatorFlowReturnedEnvelopeFixtureKey | null;
  returned_envelope_draft_saved_explicitly: boolean;
  returned_envelope_text?: string;
  validation_result_state: OperatorFlowValidationResultState;
  validation_result_source: OperatorFlowValidationSource;
  validation_summary_hash?: string;
  source_input_hash?: string;
  prepare_execution_summary_hash?: string;
  returned_envelope_hash?: string;
  candidate_action_choice: OperatorFlowCandidateAction;
  supersede_previous_candidate_ref?: string;
};

export type OperatorFlowStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const defaultFixtureKey: OperatorFlowReturnedEnvelopeFixtureKey =
  "pass_with_follow_up";

const defaultCandidateAction: OperatorFlowCandidateAction = "keep_review_only";

export function buildCodexFormerLocalAdapterOperatorFlowViewModel(
  input: OperatorFlowInput,
): OperatorFlowViewModel {
  const scenarios = {
    pass: buildScenario(input.scenarios.pass),
    pass_with_follow_up: buildScenario(input.scenarios.pass_with_follow_up),
    blocked: buildScenario(input.scenarios.blocked),
  };
  const copyPacketPreview = buildCopyPacketPreview(
    scenarios[defaultFixtureKey],
  );
  const viewModel: OperatorFlowViewModel = {
    route: CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_ROUTE,
    storage_namespace: CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_STORAGE_NAMESPACE,
    default_fixture_key: defaultFixtureKey,
    scenarios,
    candidate_actions: operatorFlowCandidateActions,
    active_steps: operatorFlowActiveSteps,
    copy_packet_preview: copyPacketPreview,
    validation: { valid: true, errors: [] },
  };
  viewModel.validation = validateCodexFormerLocalAdapterOperatorFlowViewModel(
    viewModel,
  );
  return viewModel;
}

export function createInitialOperatorFlowDraft(
  viewModel: OperatorFlowViewModel,
  nowIso: string,
): OperatorFlowPersistedDraft {
  const scenario = viewModel.scenarios[viewModel.default_fixture_key];
  return {
    draft_id: "local-adapter-operator-flow-draft:v0.1",
    generated_at: nowIso,
    updated_at: nowIso,
    selected_source_input_ref: scenario.source_input_ref.path,
    selected_prepare_summary_ref: scenario.prepare_summary_ref.path,
    active_step: "source_prepare",
    selected_returned_envelope_fixture_key: null,
    returned_envelope_draft_saved_explicitly: false,
    validation_result_state: "not_validated",
    validation_result_source: "not_run",
    candidate_action_choice: defaultCandidateAction,
  };
}

export function loadOperatorFlowDraftFromStorage(
  storage: OperatorFlowStorage,
  viewModel: OperatorFlowViewModel,
  nowIso: string,
): OperatorFlowPersistedDraft {
  return safeParseOperatorFlowDraft(
    storage.getItem(viewModel.storage_namespace),
    viewModel,
    nowIso,
  );
}

export function saveOperatorFlowDraftToStorage(
  storage: OperatorFlowStorage,
  viewModel: OperatorFlowViewModel,
  draft: OperatorFlowPersistedDraft,
) {
  storage.setItem(
    viewModel.storage_namespace,
    JSON.stringify(toPersistableOperatorFlowDraft(draft)),
  );
}

export function clearOperatorFlowDraftFromStorage(
  storage: OperatorFlowStorage,
  viewModel: OperatorFlowViewModel,
) {
  storage.removeItem(viewModel.storage_namespace);
}

export function safeParseOperatorFlowDraft(
  serialized: string | null,
  viewModel: OperatorFlowViewModel,
  nowIso: string,
): OperatorFlowPersistedDraft {
  const fallback = createInitialOperatorFlowDraft(viewModel, nowIso);
  if (!serialized) return fallback;

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) return fallback;

    const selectedFixtureKey = asNullableFixtureKey(
      parsed.selected_returned_envelope_fixture_key,
    );
    const scenario =
      selectedFixtureKey == null
        ? viewModel.scenarios[viewModel.default_fixture_key]
        : viewModel.scenarios[selectedFixtureKey];
    const sourceRef = asKnownRef(
      parsed.selected_source_input_ref,
      viewModel,
      "source",
    );
    const prepareRef = asKnownRef(
      parsed.selected_prepare_summary_ref,
      viewModel,
      "prepare",
    );
    const saveTextExplicitly =
      parsed.returned_envelope_draft_saved_explicitly === true;
    const parsedText =
      saveTextExplicitly && typeof parsed.returned_envelope_text === "string"
        ? parsed.returned_envelope_text.slice(0, 20000)
        : undefined;

    return {
      draft_id:
        typeof parsed.draft_id === "string" && parsed.draft_id.trim()
          ? parsed.draft_id
          : fallback.draft_id,
      generated_at:
        typeof parsed.generated_at === "string" && parsed.generated_at.trim()
          ? parsed.generated_at
          : fallback.generated_at,
      updated_at: nowIso,
      selected_source_input_ref:
        sourceRef ?? scenario.source_input_ref.path ?? fallback.selected_source_input_ref,
      selected_prepare_summary_ref:
        prepareRef ??
        scenario.prepare_summary_ref.path ??
        fallback.selected_prepare_summary_ref,
      active_step: asActiveStep(parsed.active_step) ?? fallback.active_step,
      selected_returned_envelope_fixture_key: selectedFixtureKey,
      returned_envelope_draft_saved_explicitly: saveTextExplicitly,
      ...(parsedText ? { returned_envelope_text: parsedText } : {}),
      validation_result_state:
        asValidationResultState(parsed.validation_result_state) ??
        fallback.validation_result_state,
      validation_result_source:
        asValidationSource(parsed.validation_result_source) ??
        fallback.validation_result_source,
      validation_summary_hash: stringOrUndefined(parsed.validation_summary_hash),
      source_input_hash: stringOrUndefined(parsed.source_input_hash),
      prepare_execution_summary_hash: stringOrUndefined(
        parsed.prepare_execution_summary_hash,
      ),
      returned_envelope_hash: stringOrUndefined(parsed.returned_envelope_hash),
      candidate_action_choice:
        asCandidateAction(parsed.candidate_action_choice) ??
        fallback.candidate_action_choice,
      supersede_previous_candidate_ref:
        typeof parsed.supersede_previous_candidate_ref === "string" &&
        parsed.supersede_previous_candidate_ref.trim()
          ? parsed.supersede_previous_candidate_ref.slice(0, 240)
          : undefined,
    };
  } catch {
    return fallback;
  }
}

export function toPersistableOperatorFlowDraft(
  draft: OperatorFlowPersistedDraft,
): OperatorFlowPersistedDraft {
  const persistable: OperatorFlowPersistedDraft = {
    draft_id: draft.draft_id,
    generated_at: draft.generated_at,
    updated_at: draft.updated_at,
    selected_source_input_ref: draft.selected_source_input_ref,
    selected_prepare_summary_ref: draft.selected_prepare_summary_ref,
    active_step: draft.active_step,
    selected_returned_envelope_fixture_key:
      draft.selected_returned_envelope_fixture_key,
    returned_envelope_draft_saved_explicitly:
      draft.returned_envelope_draft_saved_explicitly,
    validation_result_state: draft.validation_result_state,
    validation_result_source: draft.validation_result_source,
    candidate_action_choice: draft.candidate_action_choice,
  };
  if (draft.validation_summary_hash?.trim()) {
    persistable.validation_summary_hash = draft.validation_summary_hash;
  }
  if (draft.source_input_hash?.trim()) {
    persistable.source_input_hash = draft.source_input_hash;
  }
  if (draft.prepare_execution_summary_hash?.trim()) {
    persistable.prepare_execution_summary_hash =
      draft.prepare_execution_summary_hash;
  }
  if (draft.returned_envelope_hash?.trim()) {
    persistable.returned_envelope_hash = draft.returned_envelope_hash;
  }
  if (
    draft.returned_envelope_draft_saved_explicitly &&
    typeof draft.returned_envelope_text === "string" &&
    draft.returned_envelope_text.trim()
  ) {
    persistable.returned_envelope_text = draft.returned_envelope_text.slice(
      0,
      20000,
    );
  }
  if (draft.supersede_previous_candidate_ref?.trim()) {
    persistable.supersede_previous_candidate_ref =
      draft.supersede_previous_candidate_ref.slice(0, 240);
  }
  return persistable;
}

export function previewOperatorFlowValidationResult(
  returnedEnvelopeText: string,
  viewModel: OperatorFlowViewModel,
  selectedFixtureKey: OperatorFlowReturnedEnvelopeFixtureKey | null,
): {
  scenario_key: OperatorFlowReturnedEnvelopeFixtureKey;
  validation_result: OperatorFlowValidationPreview;
} {
  const explicitScenario = selectedFixtureKey
    ? viewModel.scenarios[selectedFixtureKey]
    : null;
  if (explicitScenario) {
    return {
      scenario_key: explicitScenario.key,
      validation_result: {
        ...explicitScenario.validation_result,
        validation_source: "fixture_preview",
      },
    };
  }

  const normalized = returnedEnvelopeText.toLowerCase();
  const matchedScenario = operatorFlowReturnedEnvelopeFixtureKeys
    .map((key) => viewModel.scenarios[key])
    .find((scenario) => {
      const fixture = scenario.returned_envelope_fixture.text.toLowerCase();
      return normalized.trim() === fixture.trim();
    });
  if (matchedScenario) {
    return {
      scenario_key: matchedScenario.key,
      validation_result: {
        ...matchedScenario.validation_result,
        validation_source: "fixture_preview",
      },
    };
  }

  if (normalized.includes("validate-execution-pass")) {
    return {
      scenario_key: "pass",
      validation_result: {
        ...viewModel.scenarios.pass.validation_result,
        validation_source: "fixture_preview",
      },
    };
  }
  if (normalized.includes("evidence_pointer_refs") && normalized.includes("null")) {
    return {
      scenario_key: "blocked",
      validation_result: {
        ...viewModel.scenarios.blocked.validation_result,
        validation_source: "fixture_preview",
      },
    };
  }
  if (normalized.includes("manual-codex-former-copy:v0.1:1d44vfz")) {
    return {
      scenario_key: "pass_with_follow_up",
      validation_result: {
        ...viewModel.scenarios.pass_with_follow_up.validation_result,
        validation_source: "fixture_preview",
      },
    };
  }

  const blocked = viewModel.scenarios.blocked.validation_result;
  return {
    scenario_key: "blocked",
    validation_result: {
      ...blocked,
      validation_source: "fixture_preview",
      execution_result: "blocked",
      failure_kind: "dry_run_blocked",
      candidate_count: 0,
      warnings: [
        "Preview validation could not match the pasted envelope to a committed local fixture.",
      ],
      blocked_reasons: [
        "Returned envelope draft is not one of the bounded PASS, PASS with follow-up, or BLOCKED fixtures.",
      ],
      next_safe_action:
        "Load a committed fixture or run the local CLI validation outside this route before relying on the returned envelope.",
      candidate_compatible_review_material: false,
      worker_facing_guidance_status: "not_run",
      candidate_basis_quality: null,
      candidate_authority: null,
    },
  };
}

export function validateCodexFormerLocalAdapterOperatorFlowViewModel(
  viewModel: Omit<OperatorFlowViewModel, "validation">,
) {
  const errors: string[] = [];

  if (
    viewModel.route !== CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_ROUTE
  ) {
    errors.push("operator flow route constant is incorrect");
  }
  if (
    viewModel.storage_namespace !==
    CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_STORAGE_NAMESPACE
  ) {
    errors.push("operator flow storage namespace is incorrect");
  }
  for (const key of operatorFlowReturnedEnvelopeFixtureKeys) {
    const scenario = viewModel.scenarios[key];
    if (!scenario) {
      errors.push(`missing returned envelope fixture scenario ${key}`);
      continue;
    }
    if (scenario.key !== key) {
      errors.push(`${key} scenario key mismatch`);
    }
    if (!hasText(scenario.returned_envelope_fixture.text)) {
      errors.push(`${key} returned envelope fixture text is required`);
    }
    if (!hasText(scenario.source_input_ref.hash)) {
      errors.push(`${key} source input hash is required`);
    }
    if (!hasText(scenario.prepare_summary_ref.manual_copy_packet_ref)) {
      errors.push(`${key} manual copy packet ref is required`);
    }
    if (!hasText(scenario.validation_result.next_safe_action)) {
      errors.push(`${key} next_safe_action is required`);
    }
  }
  for (const action of operatorFlowCandidateActions) {
    if (!viewModel.candidate_actions.includes(action)) {
      errors.push(`missing candidate action ${action}`);
    }
  }
  return { valid: errors.length === 0, errors: uniqueStrings(errors) };
}

function buildScenario(
  input: OperatorFlowScenarioInput,
): OperatorFlowScenarioViewModel {
  const validateSummary =
    input.validateSummary as CodexFormerLocalAdapterValidateExecutionSummaryForSnapshots & {
      source_manual_copy_packet_id?: string | null;
      source_prompt_hash?: string | null;
      execution_result?: string;
      failure_kind?: string | null;
    };
  return {
    key: input.key,
    label: input.label,
    source_input_ref: {
      ref: input.sourceInput.work_id,
      path: input.sourceInputPath,
      hash: validateSummary.source_input_hash,
      generated_at: input.sourceInput.generated_at,
      changed_files_count: input.sourceInput.changed_files.length,
      changed_files: input.sourceInput.changed_files,
      readiness_status: input.sourceInput.readiness.status,
      readiness_reasons: input.sourceInput.readiness.reasons,
      source_pr_refs: input.sourceInput.source_pr_refs,
      summary: input.sourceInput.changed_files_summary,
      tests_checks_run: input.sourceInput.tests_checks_run,
      skipped_checks_summary: summarizeUnknownList(input.sourceInput.skipped_checks),
      unresolved_gaps_summary: summarizeUnknownList(input.sourceInput.unresolved_gaps),
    },
    prepare_summary_ref: {
      ref: input.prepareSummary.helper_output_refs.manual_copy_packet_ref,
      path: input.prepareSummaryPath,
      hash: validateSummary.prepare_execution_summary_hash,
      generated_at: input.prepareSummary.generated_at,
      status: input.prepareSummary.execution_result,
      output_discovery_status: input.prepareSummary.output_discovery_status,
      former_input_packet_ref:
        input.prepareSummary.helper_output_refs.former_input_packet_ref,
      manual_copy_packet_ref:
        input.prepareSummary.helper_output_refs.manual_copy_packet_ref,
      source_prompt_hash: validateSummary.source_prompt_hash ?? null,
      source_manual_copy_packet_id:
        validateSummary.source_manual_copy_packet_id ?? null,
      next_safe_action: input.prepareSummary.next_safe_action,
    },
    returned_envelope_fixture: {
      key: input.key,
      label: input.label,
      path: input.returnedEnvelopePath,
      hash: validateSummary.returned_envelope_hash,
      text: input.returnedEnvelopeText,
    },
    validation_result: {
      result_state: validateSummary.result_state,
      validation_source: "fixture_preview",
      execution_result: stringOrDefault(
        validateSummary.execution_result,
        validateSummary.result_state === "BLOCKED" ? "blocked" : "success",
      ) as CodexFormerLocalAdapterValidateExecutionResult,
      failure_kind:
        stringOrNull(validateSummary.failure_kind) as
          | CodexFormerLocalAdapterValidateFailureKind
          | "blocked_before_execution",
      candidate_count: validateSummary.candidate_count,
      warnings: validateSummary.warnings,
      pointer_warnings: validateSummary.pointer_warnings,
      blocked_reasons: validateSummary.blocked_reasons,
      next_safe_action: validateSummary.next_safe_action,
      candidate_compatible_review_material:
        validateSummary.candidate_compatible_review_material,
      worker_facing_guidance_status:
        validateSummary.worker_facing_guidance_status,
      candidate_basis_quality: validateSummary.candidate_basis_quality,
      candidate_authority: validateSummary.candidate_authority,
      validation_summary_path: input.validateSummaryPath,
      validation_summary_hash: stableSummaryHash(validateSummary),
      source_input_hash: validateSummary.source_input_hash,
      prepare_execution_summary_hash:
        validateSummary.prepare_execution_summary_hash,
      returned_envelope_hash: validateSummary.returned_envelope_hash,
      authority_flags: validateSummary.authority_flags,
      authority_boundary:
        CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_AUTHORITY_BOUNDARY,
    },
    candidate_review_material: {
      available: validateSummary.candidate_compatible_review_material,
      review_summary: input.sourceInput.changed_files_summary,
      changed_files_count: input.sourceInput.changed_files.length,
      source_pr_refs: input.sourceInput.source_pr_refs,
      worker_facing_guidance_status:
        validateSummary.worker_facing_guidance_status,
      candidate_basis_quality: validateSummary.candidate_basis_quality,
      candidate_authority: validateSummary.candidate_authority,
    },
  };
}

function buildCopyPacketPreview(scenario: OperatorFlowScenarioViewModel) {
  return [
    "LOCAL_CODEX_ADAPTER_OPERATOR_PACKET_V0_1",
    `route: ${CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_ROUTE}`,
    "",
    "task_statement:",
    "Produce exactly one CodexPerspectiveCandidateDraft returned candidate envelope from this bounded Augnes local adapter context.",
    "",
    "source_context_summary:",
    `work_id: ${scenario.source_input_ref.ref}`,
    `changed_files_summary: ${scenario.source_input_ref.summary}`,
    "changed_files:",
    ...formatList(scenario.source_input_ref.changed_files),
    "source_pr_refs:",
    ...formatList(scenario.source_input_ref.source_pr_refs),
    `readiness.status: ${scenario.source_input_ref.readiness_status}`,
    "readiness.reasons:",
    ...formatList(scenario.source_input_ref.readiness_reasons),
    "tests_checks_run:",
    ...formatCheckSummaries(scenario.source_input_ref.tests_checks_run),
    `skipped_checks_summary: ${scenario.source_input_ref.skipped_checks_summary}`,
    `unresolved_gaps_summary: ${scenario.source_input_ref.unresolved_gaps_summary}`,
    "",
    "prepare_provenance:",
    `source_input_ref: ${scenario.source_input_ref.path}`,
    `source_input_path: ${scenario.source_input_ref.path}`,
    `source_input_hash: ${scenario.source_input_ref.hash}`,
    `prepare_summary_ref: ${scenario.prepare_summary_ref.path}`,
    `prepare_summary_path: ${scenario.prepare_summary_ref.path}`,
    `prepare_summary_hash: ${scenario.prepare_summary_ref.hash}`,
    `former_input_packet_ref: ${scenario.prepare_summary_ref.former_input_packet_ref}`,
    `manual_copy_packet_ref: ${scenario.prepare_summary_ref.manual_copy_packet_ref}`,
    `source_manual_copy_packet_id: ${scenario.prepare_summary_ref.source_manual_copy_packet_id ?? "not_available"}`,
    `source_prompt_hash: ${scenario.prepare_summary_ref.source_prompt_hash ?? "not_available"}`,
    "",
    "output_contract:",
    "draft_version: codex_perspective_candidate_draft.v0.1",
    "draft_kind: codex_perspective_candidate_draft",
    "required_fields:",
    "- source_former_input_packet",
    "- thesis",
    "- selected_material",
    "- evidence_pointer_refs",
    "- unresolved_tensions",
    "- basis_quality_suggestion",
    "- next_action_candidates",
    "- user_core_decision_questions",
    "- qualification_notes",
    "- privacy_flags",
    "- authority_flags",
    "- forbidden_actions",
    "",
    "authority_privacy_boundary:",
    "- output is review material only",
    "- no accepted state",
    "- no review decision",
    "- no persistence",
    "- no DB",
    "- no provider/model API",
    "- no Codex SDK",
    "- no GitHub mutation",
    "- no Core decision",
    "- no raw private/source/provider/token/browser material",
    "",
    "external_codex_work:",
    "1. Start a separate user-controlled Codex session.",
    "2. Use only the bounded context, summaries, refs, hashes, and output contract in this packet.",
    "3. Return exactly one candidate object suitable for the RETURNED_CODEX_RESPONSE section.",
    "4. Do not include hidden reasoning, provider logs, tokens, secrets, raw diffs, raw source packets, browser dumps, raw review payloads, or unrelated chat text.",
    "",
    "next_user_step:",
    "Paste the returned envelope into the Returned Envelope panel, then select Run local validation.",
    "",
    "local_boundary:",
    "This route only stages a local draft. It does not create accepted state, a review decision, product DB persistence, Core decision, provider/model call, Codex SDK call, GitHub mutation, runtime handoff, mergeability, product readiness, or automatic promotion.",
  ].join("\n");
}

function formatList(values: string[]) {
  if (values.length === 0) return ["- none"];
  return values.map((value) => `- ${value}`);
}

function formatCheckSummaries(values: OperatorFlowCheckSummary[]) {
  if (values.length === 0) return ["- none"];
  return values.map(
    (check) =>
      `- ${check.check_id}: ${check.status}; command: ${check.command}; summary: ${check.result_summary}`,
  );
}

function summarizeUnknownList(values: unknown[]) {
  if (values.length === 0) return "none";
  return `${values.length} bounded item(s) present; inspect source input fixture manually if needed`;
}

function stableSummaryHash(
  summary: CodexFormerLocalAdapterValidateExecutionSummaryForSnapshots,
) {
  return [
    summary.source_input_hash,
    summary.prepare_execution_summary_hash,
    summary.returned_envelope_hash,
    summary.result_state,
  ].join(":");
}

function asNullableFixtureKey(
  value: unknown,
): OperatorFlowReturnedEnvelopeFixtureKey | null {
  if (value == null) return null;
  return operatorFlowReturnedEnvelopeFixtureKeys.includes(
    value as OperatorFlowReturnedEnvelopeFixtureKey,
  )
    ? (value as OperatorFlowReturnedEnvelopeFixtureKey)
    : null;
}

function asActiveStep(value: unknown): OperatorFlowActiveStep | null {
  return operatorFlowActiveSteps.includes(value as OperatorFlowActiveStep)
    ? (value as OperatorFlowActiveStep)
    : null;
}

function asCandidateAction(value: unknown): OperatorFlowCandidateAction | null {
  return operatorFlowCandidateActions.includes(value as OperatorFlowCandidateAction)
    ? (value as OperatorFlowCandidateAction)
    : null;
}

function asValidationResultState(
  value: unknown,
): OperatorFlowValidationResultState | null {
  if (
    value === "not_validated" ||
    value === "PASS" ||
    value === "PASS with follow-up" ||
    value === "BLOCKED"
  ) {
    return value;
  }
  return null;
}

function asValidationSource(value: unknown): OperatorFlowValidationSource | null {
  if (
    value === "not_run" ||
    value === "fixture_preview" ||
    value === "real_local_validate_execution" ||
    value === "blocked_before_execution"
  ) {
    return value;
  }
  return null;
}

function asKnownRef(
  value: unknown,
  viewModel: OperatorFlowViewModel,
  refKind: "source" | "prepare",
) {
  if (typeof value !== "string") return null;
  const knownRefs = operatorFlowReturnedEnvelopeFixtureKeys.map((key) =>
    refKind === "source"
      ? viewModel.scenarios[key].source_input_ref.path
      : viewModel.scenarios[key].prepare_summary_ref.path,
  );
  return knownRefs.includes(value) ? value : null;
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function stringOrDefault(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function stringOrUndefined(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}
