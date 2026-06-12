import {
  hashCodexFormerLocalAdapterContent,
  stableStringifyCodexFormerLocalAdapterJson,
} from "@/lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input";

export const CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_SESSION_PANEL_SNAPSHOT_VERSION =
  "codex_former_local_adapter_validate_result_session_panel_snapshot.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_INBOX_ITEM_VERSION =
  "codex_former_local_adapter_validate_result_inbox_item.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_SNAPSHOT_SUMMARY_VERSION =
  "codex_former_local_adapter_validate_result_snapshot_summary.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_SUMMARY_VERSION =
  "codex_former_local_adapter_validate_summary.v0.1";

export type CodexFormerLocalAdapterValidateResultState =
  | "PASS"
  | "PASS with follow-up"
  | "BLOCKED";

export type CodexFormerLocalAdapterValidateResultScenarioId =
  | "validation-pass"
  | "validation-pass-with-follow-up"
  | "validation-blocked";

export type CodexFormerLocalAdapterValidateResultInboxItemId =
  | "local-adapter-validation-pass"
  | "local-adapter-validation-pass-with-follow-up"
  | "local-adapter-validation-blocked";

export type CodexFormerLocalAdapterValidateResultReviewability =
  | "reviewable"
  | "reviewable_with_follow_up"
  | "blocked";

export type CodexFormerLocalAdapterValidateResultAuthorityFlags = {
  accepted_state_created: false;
  review_decision_created: false;
  db_writes: false;
  network_calls: false;
  provider_model_api_calls: false;
  codex_calls: false;
  codex_sdk_calls: false;
  github_mutation: false;
  core_decision: false;
  proof_evidence_readiness_records_created: false;
  persistence: false;
  surface_export: false;
  clipboard_automation: false;
  runtime_fixture_mutation: false;
  automatic_promotion: false;
  validate_helper_executed: false;
};

export type CodexFormerLocalAdapterValidateExecutionSummaryForSnapshots = {
  summary_version: typeof CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_SUMMARY_VERSION;
  mode: "validate-orchestration";
  generated_at: string;
  source_input_path: string;
  source_input_hash: string;
  prepare_execution_summary_path: string;
  prepare_execution_summary_hash: string;
  returned_envelope_path: string;
  returned_envelope_hash: string;
  candidate_count: number;
  result_state: CodexFormerLocalAdapterValidateResultState;
  provenance_status: "complete" | "blocked";
  candidate_shape_status: string;
  contract_fit_status: string;
  direct_validation_status: string;
  candidate_compatible_review_material: boolean;
  candidate_authority: "non_committed" | null;
  candidate_basis_quality: "sufficient_for_review" | "needs_review" | "blocked" | null;
  alignment_safety_net_status: string;
  alignment_counted_as_direct_success: false;
  worker_facing_guidance_status: string;
  worker_facing_guidance_advisory_only: boolean;
  warnings: string[];
  pointer_warnings: string[];
  blocked_reasons: string[];
  next_safe_action: string;
  candidate_material_is_review_only: true;
  returned_candidate_treated_as_trusted_runtime_state: false;
  authority_flags: CodexFormerLocalAdapterValidateResultAuthorityFlags;
};

export type CodexFormerLocalAdapterValidateResultInputSummary = {
  summary: CodexFormerLocalAdapterValidateExecutionSummaryForSnapshots;
  path: string;
  hash: string;
};

export type CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0 = {
  snapshot_version: typeof CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_SESSION_PANEL_SNAPSHOT_VERSION;
  snapshot_kind: "validate_result_session_panel_snapshot";
  generated_at: string;
  scenario_id: CodexFormerLocalAdapterValidateResultScenarioId;
  result_state: CodexFormerLocalAdapterValidateResultState;
  primary_status: string;
  caveat: string;
  next_safe_action: string;
  candidate_count: number;
  candidate_shape_status: string;
  contract_fit_status: string;
  direct_validation_status: string;
  candidate_compatible_review_material: boolean;
  candidate_authority: "non_committed" | null;
  candidate_basis_quality: string | null;
  worker_facing_guidance_status: string;
  worker_facing_guidance_advisory_only: boolean;
  warning_count: number;
  pointer_warning_count: number;
  blocked_reason_count: number;
  validation_summary_path: string;
  validation_summary_hash: string;
  source_input_hash: string;
  prepare_execution_summary_hash: string;
  returned_envelope_hash: string;
  authority_flags: CodexFormerLocalAdapterValidateResultAuthorityFlags;
  review_only: true;
  accepted_state: false;
  review_decision_created: false;
  product_readiness_created: false;
  constellation_handoff_available: false;
  runtime_handoff_available: false;
};

export type CodexFormerLocalAdapterValidateResultInboxItemV0 = {
  snapshot_version: typeof CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_INBOX_ITEM_VERSION;
  snapshot_kind: "validate_result_inbox_item";
  generated_at: string;
  item_id: CodexFormerLocalAdapterValidateResultInboxItemId;
  title: string;
  stage: "validate_result_snapshot";
  reviewability: CodexFormerLocalAdapterValidateResultReviewability;
  result_state: CodexFormerLocalAdapterValidateResultState;
  candidate_count: number;
  warning_count: number;
  pointer_warning_count: number;
  blocked_reason_count: number;
  badges: string[];
  summary_line: string;
  caveat: string;
  next_safe_action: string;
  safe_links: {
    validation_summary: {
      available: true;
      path: string;
      hash: string;
      href: null;
    };
    read_only_validate_result_ui: {
      available: false;
      href: null;
      detail: string;
    };
    runtime_handoff: {
      available: false;
      href: null;
      detail: string;
    };
  };
  authority_tags: string[];
  validation_summary_path: string;
  validation_summary_hash: string;
  review_candidate_available: boolean;
  worker_guidance_available: boolean;
  accepted_state: false;
  review_decision_created: false;
  review_only: true;
};

export type CodexFormerLocalAdapterValidateResultSnapshotSummaryV0 = {
  summary_version: typeof CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_SNAPSHOT_SUMMARY_VERSION;
  mode: "validate-result-snapshots";
  generated_at: string;
  input_summary_paths: {
    pass: string;
    pass_with_follow_up: string;
    blocked: string;
  };
  input_summary_hashes: {
    pass: string;
    pass_with_follow_up: string;
    blocked: string;
  };
  emitted_snapshot_paths: {
    session_panel: {
      pass: string;
      pass_with_follow_up: string;
      blocked: string;
    };
    inbox: {
      pass: string;
      pass_with_follow_up: string;
      blocked: string;
    };
    summary: string;
  };
  emitted_snapshot_hashes: {
    session_panel: {
      pass: string;
      pass_with_follow_up: string;
      blocked: string;
    };
    inbox: {
      pass: string;
      pass_with_follow_up: string;
      blocked: string;
    };
  };
  covered_result_states: CodexFormerLocalAdapterValidateResultState[];
  covered_surfaces: ["Session Panel", "Capture Review Inbox", "future read-only validate result UI"];
  candidate_count_by_state: Record<CodexFormerLocalAdapterValidateResultState, number>;
  warning_count_by_state: Record<CodexFormerLocalAdapterValidateResultState, number>;
  blocked_reason_count_by_state: Record<CodexFormerLocalAdapterValidateResultState, number>;
  authority_boundary: {
    review_only: true;
    accepted_state_created: false;
    review_decision_created: false;
    proof_evidence_readiness_records_created: false;
    persistence: false;
    runtime_product_state_created: false;
    surface_export: false;
    github_mutation: false;
    provider_model_api_calls: false;
    codex_calls: false;
    codex_sdk_calls: false;
    db_writes: false;
    network_calls: false;
    clipboard_automation: false;
    core_decision: false;
  };
  future_ui_path: string;
  browser_validation_requirement: string;
};

export type BuildCodexFormerLocalAdapterValidateResultSnapshotsInputV0 = {
  generatedAt: string;
  passSummary: CodexFormerLocalAdapterValidateResultInputSummary;
  passWithFollowUpSummary: CodexFormerLocalAdapterValidateResultInputSummary;
  blockedSummary: CodexFormerLocalAdapterValidateResultInputSummary;
  outputPaths: {
    sessionPass: string;
    sessionPassWithFollowUp: string;
    sessionBlocked: string;
    inboxPass: string;
    inboxPassWithFollowUp: string;
    inboxBlocked: string;
    snapshotSummary: string;
  };
};

export type CodexFormerLocalAdapterValidateResultSnapshots = {
  sessionPanelSnapshots: {
    pass: CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0;
    passWithFollowUp: CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0;
    blocked: CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0;
  };
  inboxItems: {
    pass: CodexFormerLocalAdapterValidateResultInboxItemV0;
    passWithFollowUp: CodexFormerLocalAdapterValidateResultInboxItemV0;
    blocked: CodexFormerLocalAdapterValidateResultInboxItemV0;
  };
  snapshotSummary: CodexFormerLocalAdapterValidateResultSnapshotSummaryV0;
  json: {
    sessionPass: string;
    sessionPassWithFollowUp: string;
    sessionBlocked: string;
    inboxPass: string;
    inboxPassWithFollowUp: string;
    inboxBlocked: string;
    snapshotSummary: string;
  };
};

type UnknownRecord = Record<string, unknown>;

const expectedSummaryBySlot = [
  ["passSummary", "PASS"],
  ["passWithFollowUpSummary", "PASS with follow-up"],
  ["blockedSummary", "BLOCKED"],
] as const;

const forbiddenAuthorityFields = [
  "accepted_state_created",
  "review_decision_created",
  "db_writes",
  "network_calls",
  "provider_model_api_calls",
  "codex_calls",
  "codex_sdk_calls",
  "github_mutation",
  "core_decision",
  "proof_evidence_readiness_records_created",
  "persistence",
  "surface_export",
  "clipboard_automation",
  "runtime_fixture_mutation",
  "automatic_promotion",
  "validate_helper_executed",
] as const;

const unsafePublicSnapshotMarkers = [
  "raw_private_payload",
  "private_payload",
  "provider_payload",
  "raw_source_payload",
  "raw_candidate_payload",
  "raw_page_dump",
  "browser_dump",
  "token_payload",
  "oauth_token",
  "access_token",
  "refresh_token",
  "api_key",
  "hidden_reasoning",
  "sk-proj-",
  "ghp_",
] as const;

export function buildCodexFormerLocalAdapterValidateResultSnapshots(
  input: BuildCodexFormerLocalAdapterValidateResultSnapshotsInputV0,
): CodexFormerLocalAdapterValidateResultSnapshots {
  const validation = validateCodexFormerLocalAdapterValidateResultSnapshotInputs(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }

  const sessionPass = buildSessionPanelSnapshot({
    generatedAt: input.generatedAt,
    scenarioId: "validation-pass",
    inputSummary: input.passSummary,
  });
  const sessionPassWithFollowUp = buildSessionPanelSnapshot({
    generatedAt: input.generatedAt,
    scenarioId: "validation-pass-with-follow-up",
    inputSummary: input.passWithFollowUpSummary,
  });
  const sessionBlocked = buildSessionPanelSnapshot({
    generatedAt: input.generatedAt,
    scenarioId: "validation-blocked",
    inputSummary: input.blockedSummary,
  });
  const inboxPass = buildInboxItem({
    generatedAt: input.generatedAt,
    itemId: "local-adapter-validation-pass",
    inputSummary: input.passSummary,
  });
  const inboxPassWithFollowUp = buildInboxItem({
    generatedAt: input.generatedAt,
    itemId: "local-adapter-validation-pass-with-follow-up",
    inputSummary: input.passWithFollowUpSummary,
  });
  const inboxBlocked = buildInboxItem({
    generatedAt: input.generatedAt,
    itemId: "local-adapter-validation-blocked",
    inputSummary: input.blockedSummary,
  });

  const sessionPassJson = stableStringifyCodexFormerLocalAdapterJson(sessionPass);
  const sessionPassWithFollowUpJson =
    stableStringifyCodexFormerLocalAdapterJson(sessionPassWithFollowUp);
  const sessionBlockedJson =
    stableStringifyCodexFormerLocalAdapterJson(sessionBlocked);
  const inboxPassJson = stableStringifyCodexFormerLocalAdapterJson(inboxPass);
  const inboxPassWithFollowUpJson =
    stableStringifyCodexFormerLocalAdapterJson(inboxPassWithFollowUp);
  const inboxBlockedJson = stableStringifyCodexFormerLocalAdapterJson(inboxBlocked);

  const snapshotSummary: CodexFormerLocalAdapterValidateResultSnapshotSummaryV0 = {
    summary_version:
      CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_SNAPSHOT_SUMMARY_VERSION,
    mode: "validate-result-snapshots",
    generated_at: input.generatedAt,
    input_summary_paths: {
      pass: input.passSummary.path,
      pass_with_follow_up: input.passWithFollowUpSummary.path,
      blocked: input.blockedSummary.path,
    },
    input_summary_hashes: {
      pass: input.passSummary.hash,
      pass_with_follow_up: input.passWithFollowUpSummary.hash,
      blocked: input.blockedSummary.hash,
    },
    emitted_snapshot_paths: {
      session_panel: {
        pass: input.outputPaths.sessionPass,
        pass_with_follow_up: input.outputPaths.sessionPassWithFollowUp,
        blocked: input.outputPaths.sessionBlocked,
      },
      inbox: {
        pass: input.outputPaths.inboxPass,
        pass_with_follow_up: input.outputPaths.inboxPassWithFollowUp,
        blocked: input.outputPaths.inboxBlocked,
      },
      summary: input.outputPaths.snapshotSummary,
    },
    emitted_snapshot_hashes: {
      session_panel: {
        pass: hashCodexFormerLocalAdapterContent(sessionPassJson),
        pass_with_follow_up:
          hashCodexFormerLocalAdapterContent(sessionPassWithFollowUpJson),
        blocked: hashCodexFormerLocalAdapterContent(sessionBlockedJson),
      },
      inbox: {
        pass: hashCodexFormerLocalAdapterContent(inboxPassJson),
        pass_with_follow_up:
          hashCodexFormerLocalAdapterContent(inboxPassWithFollowUpJson),
        blocked: hashCodexFormerLocalAdapterContent(inboxBlockedJson),
      },
    },
    covered_result_states: ["PASS", "PASS with follow-up", "BLOCKED"],
    covered_surfaces: [
      "Session Panel",
      "Capture Review Inbox",
      "future read-only validate result UI",
    ],
    candidate_count_by_state: {
      PASS: input.passSummary.summary.candidate_count,
      "PASS with follow-up": input.passWithFollowUpSummary.summary.candidate_count,
      BLOCKED: input.blockedSummary.summary.candidate_count,
    },
    warning_count_by_state: {
      PASS: input.passSummary.summary.warnings.length,
      "PASS with follow-up": input.passWithFollowUpSummary.summary.warnings.length,
      BLOCKED: input.blockedSummary.summary.warnings.length,
    },
    blocked_reason_count_by_state: {
      PASS: input.passSummary.summary.blocked_reasons.length,
      "PASS with follow-up":
        input.passWithFollowUpSummary.summary.blocked_reasons.length,
      BLOCKED: input.blockedSummary.summary.blocked_reasons.length,
    },
    authority_boundary: buildSummaryAuthorityBoundary(),
    future_ui_path:
      "A later read-only validate result UI may consume these fixtures without adding accepted-state, persistence, DB, provider/model, Codex, GitHub, clipboard, surface export, or Core authority.",
    browser_validation_requirement:
      "A later UI PR must add browser/computer-use validation because this snapshot PR adds no UI, route, browser-visible surface, clipboard automation, browser capture, runtime fixture mutation, or product navigation behavior.",
  };
  const snapshotSummaryJson =
    stableStringifyCodexFormerLocalAdapterJson(snapshotSummary);

  assertNoUnsafePublicSnapshotMarkers([
    sessionPassJson,
    sessionPassWithFollowUpJson,
    sessionBlockedJson,
    inboxPassJson,
    inboxPassWithFollowUpJson,
    inboxBlockedJson,
    snapshotSummaryJson,
  ]);

  return {
    sessionPanelSnapshots: {
      pass: sessionPass,
      passWithFollowUp: sessionPassWithFollowUp,
      blocked: sessionBlocked,
    },
    inboxItems: {
      pass: inboxPass,
      passWithFollowUp: inboxPassWithFollowUp,
      blocked: inboxBlocked,
    },
    snapshotSummary,
    json: {
      sessionPass: sessionPassJson,
      sessionPassWithFollowUp: sessionPassWithFollowUpJson,
      sessionBlocked: sessionBlockedJson,
      inboxPass: inboxPassJson,
      inboxPassWithFollowUp: inboxPassWithFollowUpJson,
      inboxBlocked: inboxBlockedJson,
      snapshotSummary: snapshotSummaryJson,
    },
  };
}

export function validateCodexFormerLocalAdapterValidateResultSnapshotInputs(
  input: BuildCodexFormerLocalAdapterValidateResultSnapshotsInputV0,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!hasText(input.generatedAt)) {
    errors.push("validate result snapshots generatedAt is required");
  }
  for (const path of Object.values(input.outputPaths)) {
    if (!hasText(path)) errors.push("validate result snapshot output path is required");
  }

  for (const [slot, expectedState] of expectedSummaryBySlot) {
    const payload = input[slot];
    errors.push(...validateInputSummary(payload, expectedState, slot));
  }

  return { valid: errors.length === 0, errors: uniqueStrings(errors) };
}

export function hashCodexFormerLocalAdapterValidateResultSnapshotContent(
  content: string,
) {
  return hashCodexFormerLocalAdapterContent(content);
}

function validateInputSummary(
  inputSummary: CodexFormerLocalAdapterValidateResultInputSummary,
  expectedState: CodexFormerLocalAdapterValidateResultState,
  label: string,
) {
  const errors: string[] = [];
  if (!inputSummary || !isRecord(inputSummary)) {
    return [`${label} is required`];
  }
  if (!hasText(inputSummary.path)) errors.push(`${label} path is required`);
  if (!isSha256(inputSummary.hash)) {
    errors.push(`${label} hash must be a sha256 hash`);
  }
  const summary = inputSummary.summary;
  if (!isRecord(summary)) {
    return [...errors, `${label} summary must be an object`];
  }
  if (summary.summary_version !== CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_SUMMARY_VERSION) {
    errors.push(`${label} unsupported validate summary version`);
  }
  if (summary.mode !== "validate-orchestration") {
    errors.push(`${label} unsupported validate summary mode`);
  }
  if (!["PASS", "PASS with follow-up", "BLOCKED"].includes(String(summary.result_state))) {
    errors.push(`${label} result_state is unsupported`);
  }
  if (summary.result_state !== expectedState) {
    errors.push(`${label} result_state must be ${expectedState}`);
  }
  if (typeof summary.candidate_count !== "number") {
    errors.push(`${label} candidate_count is required`);
  }
  if (expectedState !== "BLOCKED" && summary.candidate_count !== 1) {
    errors.push(`${label} candidate_count must be 1 for ${expectedState}`);
  }
  if (!Array.isArray(summary.warnings)) {
    errors.push(`${label} warnings must be an array`);
  }
  if (!Array.isArray(summary.pointer_warnings)) {
    errors.push(`${label} pointer_warnings must be an array`);
  }
  if (!Array.isArray(summary.blocked_reasons)) {
    errors.push(`${label} blocked_reasons must be an array`);
  }
  if (summary.candidate_material_is_review_only !== true) {
    errors.push(`${label} candidate_material_is_review_only must be true`);
  }
  if (summary.returned_candidate_treated_as_trusted_runtime_state !== false) {
    errors.push(
      `${label} returned_candidate_treated_as_trusted_runtime_state must be false`,
    );
  }
  if (summary.alignment_counted_as_direct_success !== false) {
    errors.push(`${label} alignment_counted_as_direct_success must be false`);
  }
  errors.push(...collectAuthorityDrift(summary, label));

  if (expectedState === "PASS") {
    if (Array.isArray(summary.warnings) && summary.warnings.length > 0) {
      errors.push("PASS summary warnings must be empty");
    }
    if (
      Array.isArray(summary.pointer_warnings) &&
      summary.pointer_warnings.length > 0
    ) {
      errors.push("PASS summary pointer_warnings must be empty");
    }
    if (Array.isArray(summary.blocked_reasons) && summary.blocked_reasons.length > 0) {
      errors.push("PASS summary blocked_reasons must be empty");
    }
    if (summary.contract_fit_status !== "fits_contract") {
      errors.push("PASS summary contract_fit_status must be fits_contract");
    }
    if (summary.direct_validation_status !== "ready_for_review") {
      errors.push(
        "PASS summary direct_validation_status must be ready_for_review",
      );
    }
    if (summary.candidate_compatible_review_material !== true) {
      errors.push("PASS summary candidate_compatible_review_material must be true");
    }
    if (summary.candidate_authority !== "non_committed") {
      errors.push("PASS summary candidate_authority must be non_committed");
    }
    if (summary.candidate_basis_quality !== "sufficient_for_review") {
      errors.push(
        "PASS summary candidate_basis_quality must be sufficient_for_review",
      );
    }
    if (summary.candidate_shape_status !== "existing_validator_compatible") {
      errors.push(
        "PASS summary candidate_shape_status must be existing_validator_compatible",
      );
    }
    if (summary.worker_facing_guidance_advisory_only !== true) {
      errors.push("PASS summary worker_facing_guidance_advisory_only must be true");
    }
    if (summary.worker_facing_guidance_status !== "actionable_advisory") {
      errors.push(
        "PASS summary worker_facing_guidance_status must be actionable_advisory",
      );
    }
  }
  if (expectedState === "PASS with follow-up") {
    if (Array.isArray(summary.blocked_reasons) && summary.blocked_reasons.length > 0) {
      errors.push("PASS with follow-up summary blocked_reasons must be empty");
    }
    if (summary.candidate_compatible_review_material !== true) {
      errors.push(
        "PASS with follow-up summary candidate_compatible_review_material must be true",
      );
    }
    if (summary.candidate_authority !== "non_committed") {
      errors.push(
        "PASS with follow-up summary candidate_authority must be non_committed",
      );
    }
    if (summary.worker_facing_guidance_advisory_only !== true) {
      errors.push(
        "PASS with follow-up summary worker_facing_guidance_advisory_only must be true",
      );
    }
    if (summary.direct_validation_status === "blocked") {
      errors.push(
        "PASS with follow-up summary direct_validation_status must not be blocked",
      );
    }
    if (summary.contract_fit_status === "violates_contract") {
      errors.push(
        "PASS with follow-up summary contract_fit_status must not be violates_contract",
      );
    }
    if (summary.candidate_shape_status !== "existing_validator_compatible") {
      errors.push(
        "PASS with follow-up summary candidate_shape_status must be existing_validator_compatible",
      );
    }
  }
  if (expectedState === "BLOCKED") {
    if (Array.isArray(summary.blocked_reasons) && summary.blocked_reasons.length === 0) {
      errors.push("BLOCKED summary blocked_reasons must not be empty");
    }
    if (summary.candidate_compatible_review_material === true) {
      errors.push("BLOCKED summary must not claim review candidate availability");
    }
  }

  return errors;
}

function buildSessionPanelSnapshot({
  generatedAt,
  scenarioId,
  inputSummary,
}: {
  generatedAt: string;
  scenarioId: CodexFormerLocalAdapterValidateResultScenarioId;
  inputSummary: CodexFormerLocalAdapterValidateResultInputSummary;
}): CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0 {
  const summary = inputSummary.summary;
  return {
    snapshot_version:
      CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_SESSION_PANEL_SNAPSHOT_VERSION,
    snapshot_kind: "validate_result_session_panel_snapshot",
    generated_at: generatedAt,
    scenario_id: scenarioId,
    result_state: summary.result_state,
    primary_status: primaryStatus(summary.result_state),
    caveat: caveatForState(summary.result_state),
    next_safe_action: summary.next_safe_action,
    candidate_count: summary.candidate_count,
    candidate_shape_status: summary.candidate_shape_status,
    contract_fit_status: summary.contract_fit_status,
    direct_validation_status: summary.direct_validation_status,
    candidate_compatible_review_material:
      summary.candidate_compatible_review_material,
    candidate_authority: summary.candidate_authority,
    candidate_basis_quality: summary.candidate_basis_quality,
    worker_facing_guidance_status: summary.worker_facing_guidance_status,
    worker_facing_guidance_advisory_only:
      summary.worker_facing_guidance_advisory_only,
    warning_count: summary.warnings.length,
    pointer_warning_count: summary.pointer_warnings.length,
    blocked_reason_count: summary.blocked_reasons.length,
    validation_summary_path: inputSummary.path,
    validation_summary_hash: inputSummary.hash,
    source_input_hash: summary.source_input_hash,
    prepare_execution_summary_hash: summary.prepare_execution_summary_hash,
    returned_envelope_hash: summary.returned_envelope_hash,
    authority_flags: buildFalseAuthorityFlags(),
    review_only: true,
    accepted_state: false,
    review_decision_created: false,
    product_readiness_created: false,
    constellation_handoff_available: false,
    runtime_handoff_available: false,
  };
}

function buildInboxItem({
  generatedAt,
  itemId,
  inputSummary,
}: {
  generatedAt: string;
  itemId: CodexFormerLocalAdapterValidateResultInboxItemId;
  inputSummary: CodexFormerLocalAdapterValidateResultInputSummary;
}): CodexFormerLocalAdapterValidateResultInboxItemV0 {
  const summary = inputSummary.summary;
  return {
    snapshot_version: CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_INBOX_ITEM_VERSION,
    snapshot_kind: "validate_result_inbox_item",
    generated_at: generatedAt,
    item_id: itemId,
    title: inboxTitle(summary.result_state),
    stage: "validate_result_snapshot",
    reviewability: reviewabilityForState(summary.result_state),
    result_state: summary.result_state,
    candidate_count: summary.candidate_count,
    warning_count: summary.warnings.length,
    pointer_warning_count: summary.pointer_warnings.length,
    blocked_reason_count: summary.blocked_reasons.length,
    badges: badgesForState(summary),
    summary_line: summaryLine(summary),
    caveat: caveatForState(summary.result_state),
    next_safe_action: summary.next_safe_action,
    safe_links: {
      validation_summary: {
        available: true,
        path: inputSummary.path,
        hash: inputSummary.hash,
        href: null,
      },
      read_only_validate_result_ui: {
        available: false,
        href: null,
        detail: "Future read-only validate result UI is not implemented in this snapshot PR.",
      },
      runtime_handoff: {
        available: false,
        href: null,
        detail: "Runtime handoff is unavailable because snapshots are review-only local fixtures.",
      },
    },
    authority_tags: authorityTagsForState(summary.result_state),
    validation_summary_path: inputSummary.path,
    validation_summary_hash: inputSummary.hash,
    review_candidate_available: summary.candidate_compatible_review_material,
    worker_guidance_available: summary.worker_facing_guidance_advisory_only,
    accepted_state: false,
    review_decision_created: false,
    review_only: true,
  };
}

function primaryStatus(state: CodexFormerLocalAdapterValidateResultState) {
  if (state === "PASS") return "PASS, review-only";
  if (state === "PASS with follow-up") {
    return "PASS with follow-up, review-only";
  }
  return "BLOCKED, review-only finding";
}

function caveatForState(state: CodexFormerLocalAdapterValidateResultState) {
  if (state === "PASS") {
    return "PASS is review-only and not approval, acceptance, mergeability, product readiness, persistence, or Core decision.";
  }
  if (state === "PASS with follow-up") {
    return "PASS with follow-up is review-only and not acceptance, approval, persistence, product readiness, or Core decision.";
  }
  return "BLOCKED is a validation result, not automated rejection, retry, promotion, persistence, or product decision.";
}

function inboxTitle(state: CodexFormerLocalAdapterValidateResultState) {
  if (state === "PASS") return "Validate result: PASS";
  if (state === "PASS with follow-up") {
    return "Validate result: PASS with follow-up";
  }
  return "Validate result: BLOCKED";
}

function reviewabilityForState(
  state: CodexFormerLocalAdapterValidateResultState,
): CodexFormerLocalAdapterValidateResultReviewability {
  if (state === "PASS") return "reviewable";
  if (state === "PASS with follow-up") return "reviewable_with_follow_up";
  return "blocked";
}

function badgesForState(
  summary: CodexFormerLocalAdapterValidateExecutionSummaryForSnapshots,
) {
  const badges = ["review-only", summary.result_state];
  if (summary.warnings.length > 0) badges.push(`${summary.warnings.length} warning(s)`);
  if (summary.pointer_warnings.length > 0) {
    badges.push(`${summary.pointer_warnings.length} pointer warning(s)`);
  }
  if (summary.blocked_reasons.length > 0) {
    badges.push(`${summary.blocked_reasons.length} blocked reason(s)`);
  }
  return badges;
}

function summaryLine(
  summary: CodexFormerLocalAdapterValidateExecutionSummaryForSnapshots,
) {
  return `${primaryStatus(summary.result_state)}; candidate_count=${summary.candidate_count}; warnings=${summary.warnings.length}; blocked_reasons=${summary.blocked_reasons.length}.`;
}

function authorityTagsForState(
  state: CodexFormerLocalAdapterValidateResultState,
) {
  const tags = [
    "review_only",
    "no_accepted_state",
    "no_review_decision",
    "no_proof_evidence_readiness",
    "no_persistence",
    "no_surface_export",
    "no_runtime_product_state",
    "no_provider_model_api",
    "no_codex",
    "no_github_mutation",
    "no_core_decision",
  ];
  if (state === "BLOCKED") tags.push("not_automated_rejection");
  return tags;
}

function buildSummaryAuthorityBoundary():
  CodexFormerLocalAdapterValidateResultSnapshotSummaryV0["authority_boundary"] {
  return {
    review_only: true,
    accepted_state_created: false,
    review_decision_created: false,
    proof_evidence_readiness_records_created: false,
    persistence: false,
    runtime_product_state_created: false,
    surface_export: false,
    github_mutation: false,
    provider_model_api_calls: false,
    codex_calls: false,
    codex_sdk_calls: false,
    db_writes: false,
    network_calls: false,
    clipboard_automation: false,
    core_decision: false,
  };
}

function buildFalseAuthorityFlags():
  CodexFormerLocalAdapterValidateResultAuthorityFlags {
  return {
    accepted_state_created: false,
    review_decision_created: false,
    db_writes: false,
    network_calls: false,
    provider_model_api_calls: false,
    codex_calls: false,
    codex_sdk_calls: false,
    github_mutation: false,
    core_decision: false,
    proof_evidence_readiness_records_created: false,
    persistence: false,
    surface_export: false,
    clipboard_automation: false,
    runtime_fixture_mutation: false,
    automatic_promotion: false,
    validate_helper_executed: false,
  };
}

function collectAuthorityDrift(summary: UnknownRecord, label: string) {
  const errors: string[] = [];
  const authorityFlags = recordField(summary, "authority_flags");
  if (!authorityFlags) {
    errors.push(`${label} authority_flags must be an object`);
  }
  for (const field of forbiddenAuthorityFields) {
    if (authorityFlags?.[field] !== false) {
      errors.push(`${label} authority flag drift: ${field} must be false`);
    }
    if (summary[field] === true) {
      errors.push(`${label} authority drift: ${field} must not be true`);
    }
  }
  return errors;
}

function assertNoUnsafePublicSnapshotMarkers(jsonTexts: readonly string[]) {
  const combined = jsonTexts.join("\n").toLowerCase();
  for (const marker of unsafePublicSnapshotMarkers) {
    if (combined.includes(marker)) {
      throw new Error(`public validate result snapshot contains unsafe marker: ${marker}`);
    }
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function recordField(record: UnknownRecord, fieldName: string) {
  const value = record[fieldName];
  return isRecord(value) ? value : null;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSha256(value: unknown) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

export default {
  CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_INBOX_ITEM_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_SESSION_PANEL_SNAPSHOT_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_SNAPSHOT_SUMMARY_VERSION,
  buildCodexFormerLocalAdapterValidateResultSnapshots,
  hashCodexFormerLocalAdapterValidateResultSnapshotContent,
  validateCodexFormerLocalAdapterValidateResultSnapshotInputs,
};
