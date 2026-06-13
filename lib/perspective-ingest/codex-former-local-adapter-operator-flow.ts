import type {
  CodexFormerLocalAdapterValidateExecutionSummaryForSnapshots,
  CodexFormerLocalAdapterValidateResultState,
} from "@/lib/perspective-ingest/codex-former-local-adapter-validate-result-snapshots";

export const CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_ROUTE =
  "/cockpit/perspective/codex-former/local-adapter-operator-flow";

export const CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_STORAGE_NAMESPACE =
  "augnes.codexFormer.localAdapterOperatorFlow.v0.1";

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

export type OperatorFlowValidationPreview = {
  result_state: CodexFormerLocalAdapterValidateResultState;
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
};

export type OperatorFlowScenarioViewModel = {
  key: OperatorFlowReturnedEnvelopeFixtureKey;
  label: string;
  source_input_ref: OperatorFlowRef & {
    changed_files_count: number;
    readiness_status: string;
    source_pr_refs: string[];
    summary: string;
  };
  prepare_summary_ref: OperatorFlowRef & {
    status: string;
    output_discovery_status: string;
    former_input_packet_ref: string;
    manual_copy_packet_ref: string;
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
    candidate_action_choice: draft.candidate_action_choice,
  };
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
      validation_result: explicitScenario.validation_result,
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
      validation_result: matchedScenario.validation_result,
    };
  }

  if (normalized.includes("validate-execution-pass")) {
    return {
      scenario_key: "pass",
      validation_result: viewModel.scenarios.pass.validation_result,
    };
  }
  if (normalized.includes("evidence_pointer_refs") && normalized.includes("null")) {
    return {
      scenario_key: "blocked",
      validation_result: viewModel.scenarios.blocked.validation_result,
    };
  }
  if (normalized.includes("manual-codex-former-copy:v0.1:1d44vfz")) {
    return {
      scenario_key: "pass_with_follow_up",
      validation_result: viewModel.scenarios.pass_with_follow_up.validation_result,
    };
  }

  const blocked = viewModel.scenarios.blocked.validation_result;
  return {
    scenario_key: "blocked",
    validation_result: {
      ...blocked,
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
  const validateSummary = input.validateSummary;
  return {
    key: input.key,
    label: input.label,
    source_input_ref: {
      ref: input.sourceInput.work_id,
      path: input.sourceInputPath,
      hash: validateSummary.source_input_hash,
      generated_at: input.sourceInput.generated_at,
      changed_files_count: input.sourceInput.changed_files.length,
      readiness_status: input.sourceInput.readiness.status,
      source_pr_refs: input.sourceInput.source_pr_refs,
      summary: input.sourceInput.changed_files_summary,
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
    `source_input_ref: ${scenario.source_input_ref.path}`,
    `source_input_hash: ${scenario.source_input_ref.hash}`,
    `prepare_summary_ref: ${scenario.prepare_summary_ref.path}`,
    `prepare_summary_hash: ${scenario.prepare_summary_ref.hash}`,
    `former_input_packet_ref: ${scenario.prepare_summary_ref.former_input_packet_ref}`,
    `manual_copy_packet_ref: ${scenario.prepare_summary_ref.manual_copy_packet_ref}`,
    "",
    "external_codex_work:",
    "1. Start a separate user-controlled Codex session.",
    "2. Use the bounded source and prepare refs above as the work boundary.",
    "3. Return exactly one returned candidate envelope.",
    "4. Keep hidden reasoning, provider logs, tokens, secrets, raw diffs, raw source packets, browser dumps, and raw review payloads out of the returned material.",
    "",
    "local_boundary:",
    "This route only stages a local draft. It does not create accepted state, a review decision, product DB persistence, Core decision, provider/model call, Codex SDK call, GitHub mutation, runtime handoff, mergeability, product readiness, or automatic promotion.",
  ].join("\n");
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}
