export type PerspectiveFormationInputBundleVersionV0 =
  "perspective_formation_input_bundle.v0.1";

export type PerspectiveFormationInputBundleKindV0 =
  "formation_input_bundle";

export type PerspectiveFormationInputBundleReadinessStatusV0 =
  | "ready_for_candidate"
  | "needs_review"
  | "blocked";

export interface PerspectiveFormationCheckRunInputV0 {
  check_id: string;
  command: string;
  status: "passed" | "failed";
  result_summary: string;
}

export interface PerspectiveFormationSkippedCheckInputV0 {
  check_id: string;
  skipped_reason: string;
  result_summary?: string;
}

export interface PerspectiveFormationGapInputV0 {
  gap_id: string;
  summary: string;
}

export interface BuildPerspectiveFormationInputBundleInputV0 {
  scope?: string | null;
  work_id?: string | null;
  source_pr_refs?: readonly string[];
  changed_files?: readonly string[];
  changed_files_summary?: string | null;
  tests_checks_run?: readonly PerspectiveFormationCheckRunInputV0[];
  skipped_checks?: readonly PerspectiveFormationSkippedCheckInputV0[];
  evidence_row_refs?: readonly string[];
  proof_only_action_refs?: readonly string[];
  work_event_refs?: readonly string[];
  session_trace_refs?: readonly string[];
  existing_perspective_refs?: readonly string[];
  unresolved_gaps?: readonly PerspectiveFormationGapInputV0[];
  authority_boundaries?: readonly string[];
  source_privacy_redaction_notes?: readonly string[];
  generated_at?: string | null;
}

export interface PerspectiveFormationInputBundleV0 {
  bundle_version: PerspectiveFormationInputBundleVersionV0;
  bundle_kind: PerspectiveFormationInputBundleKindV0;
  generated_at: string | null;
  scope: string | null;
  work_id: string | null;
  source_pr_refs: string[];
  changed_files_summary: string | null;
  changed_files: string[];
  verification_basis: {
    checks_run: PerspectiveFormationCheckRunInputV0[];
    skipped_checks: PerspectiveFormationSkippedCheckInputV0[];
    evidence_row_refs: string[];
    proof_only_action_refs: string[];
  };
  trace_basis: {
    work_event_refs: string[];
    session_trace_refs: string[];
  };
  perspective_basis: {
    existing_perspective_refs: string[];
  };
  unresolved_gaps: PerspectiveFormationGapInputV0[];
  readiness: {
    status: PerspectiveFormationInputBundleReadinessStatusV0;
    reasons: string[];
  };
  privacy: {
    source_privacy_redaction_notes: string[];
    raw_payloads_included: false;
  };
  authority: {
    mode: "read_only_formation_input";
    committed_state: false;
    persistence: false;
    provider_model_api_calls: false;
    proof_evidence_readiness_writes: false;
    codex_execution: false;
    merge_publish_approval: false;
  };
  authority_boundaries: string[];
}

export function buildPerspectiveFormationInputBundle(
  input: BuildPerspectiveFormationInputBundleInputV0,
): PerspectiveFormationInputBundleV0 {
  const sourcePrRefs = copyStringList(input.source_pr_refs);
  const checksRun = copyCheckRuns(input.tests_checks_run);
  const skippedChecks = copySkippedChecks(input.skipped_checks);
  const evidenceRowRefs = copyStringList(input.evidence_row_refs);
  const proofOnlyActionRefs = copyStringList(input.proof_only_action_refs);
  const unresolvedGaps = copyGaps(input.unresolved_gaps);

  return {
    bundle_version: "perspective_formation_input_bundle.v0.1",
    bundle_kind: "formation_input_bundle",
    generated_at: input.generated_at ?? null,
    scope: input.scope ?? null,
    work_id: input.work_id ?? null,
    source_pr_refs: sourcePrRefs,
    changed_files_summary: input.changed_files_summary ?? null,
    changed_files: copyStringList(input.changed_files),
    verification_basis: {
      checks_run: checksRun,
      skipped_checks: skippedChecks,
      evidence_row_refs: evidenceRowRefs,
      proof_only_action_refs: proofOnlyActionRefs,
    },
    trace_basis: {
      work_event_refs: copyStringList(input.work_event_refs),
      session_trace_refs: copyStringList(input.session_trace_refs),
    },
    perspective_basis: {
      existing_perspective_refs: copyStringList(input.existing_perspective_refs),
    },
    unresolved_gaps: unresolvedGaps,
    readiness: buildReadiness({
      scope: input.scope ?? null,
      work_id: input.work_id ?? null,
      source_pr_refs: sourcePrRefs,
      checks_run: checksRun,
      skipped_checks: skippedChecks,
      evidence_row_refs: evidenceRowRefs,
      proof_only_action_refs: proofOnlyActionRefs,
      unresolved_gaps: unresolvedGaps,
    }),
    privacy: {
      source_privacy_redaction_notes: copyStringList(
        input.source_privacy_redaction_notes,
      ),
      raw_payloads_included: false,
    },
    authority: {
      mode: "read_only_formation_input",
      committed_state: false,
      persistence: false,
      provider_model_api_calls: false,
      proof_evidence_readiness_writes: false,
      codex_execution: false,
      merge_publish_approval: false,
    },
    authority_boundaries: copyStringList(input.authority_boundaries),
  };
}

interface BuildReadinessInput {
  scope: string | null;
  work_id: string | null;
  source_pr_refs: readonly string[];
  checks_run: readonly PerspectiveFormationCheckRunInputV0[];
  skipped_checks: readonly PerspectiveFormationSkippedCheckInputV0[];
  evidence_row_refs: readonly string[];
  proof_only_action_refs: readonly string[];
  unresolved_gaps: readonly PerspectiveFormationGapInputV0[];
}

function buildReadiness({
  scope,
  work_id,
  source_pr_refs,
  checks_run,
  skipped_checks,
  evidence_row_refs,
  proof_only_action_refs,
  unresolved_gaps,
}: BuildReadinessInput): PerspectiveFormationInputBundleV0["readiness"] {
  if (!hasText(scope)) {
    return {
      status: "blocked",
      reasons: ["missing scope"],
    };
  }

  const reasons: string[] = [];
  const hasWorkAnchor = hasText(work_id) || source_pr_refs.some(hasText);
  const hasVerificationMaterial =
    checks_run.length > 0 ||
    skipped_checks.length > 0 ||
    evidence_row_refs.some(hasText) ||
    proof_only_action_refs.some(hasText);

  if (!hasWorkAnchor) {
    reasons.push("missing work_id and source_pr_refs");
  }

  if (!hasVerificationMaterial) {
    reasons.push("missing verification, proof, evidence, or skipped-check material");
  }

  if (unresolved_gaps.length > 0) {
    reasons.push("unresolved gaps present");
  }

  return {
    status: reasons.length > 0 ? "needs_review" : "ready_for_candidate",
    reasons,
  };
}

function copyStringList(values: readonly string[] | undefined): string[] {
  return values ? [...values] : [];
}

function copyCheckRuns(
  checks: readonly PerspectiveFormationCheckRunInputV0[] | undefined,
): PerspectiveFormationCheckRunInputV0[] {
  return checks
    ? checks.map((check) => ({
        check_id: check.check_id,
        command: check.command,
        status: check.status,
        result_summary: check.result_summary,
      }))
    : [];
}

function copySkippedChecks(
  skippedChecks: readonly PerspectiveFormationSkippedCheckInputV0[] | undefined,
): PerspectiveFormationSkippedCheckInputV0[] {
  return skippedChecks
    ? skippedChecks.map((check) => ({
        check_id: check.check_id,
        skipped_reason: check.skipped_reason,
        ...(check.result_summary !== undefined
          ? { result_summary: check.result_summary }
          : {}),
      }))
    : [];
}

function copyGaps(
  gaps: readonly PerspectiveFormationGapInputV0[] | undefined,
): PerspectiveFormationGapInputV0[] {
  return gaps
    ? gaps.map((gap) => ({
        gap_id: gap.gap_id,
        summary: gap.summary,
      }))
    : [];
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}
