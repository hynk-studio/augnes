import type {
  PerspectiveFormationCheckRunInputV0,
  PerspectiveFormationInputBundleV0,
  PerspectiveFormationSkippedCheckInputV0,
} from "@/lib/perspective-ingest/perspective-formation-input-bundle";

export type PerspectiveCandidateVersionV0 = "perspective_candidate.v0.1";
export type PerspectiveCandidateKindV0 = "perspective_candidate";
export type PerspectiveCandidateStatusV0 = "perspective_candidate";
export type PerspectiveCandidateAuthorityV0 = "non_committed";
export type PerspectiveCandidateBasisQualityStatusV0 =
  | "sufficient_for_review"
  | "needs_review"
  | "blocked";

export type PerspectiveCandidateEvidencePointerKindV0 =
  | "evidence_row_ref"
  | "proof_only_action_ref"
  | "work_event_ref"
  | "session_trace_ref"
  | "perspective_ref";

export interface PerspectiveCandidateEvidencePointerV0 {
  pointer_kind: PerspectiveCandidateEvidencePointerKindV0;
  pointer_semantics: "pointer_only";
  ref: string;
}

export interface PerspectiveCandidateUnresolvedTensionV0 {
  tension_kind:
    | "unresolved_gap"
    | "readiness_reason"
    | "failed_check"
    | "skipped_check_missing_reason";
  summary: string;
  source_ref?: string;
}

export interface PerspectiveCandidateNextActionV0 {
  action_id: "review_candidate" | "fix_input_gaps" | "prepare_codex_handoff";
  summary: string;
}

export interface PerspectiveCandidateV0 {
  candidate_version: PerspectiveCandidateVersionV0;
  candidate_kind: PerspectiveCandidateKindV0;
  candidate_id: string;
  status: PerspectiveCandidateStatusV0;
  authority: PerspectiveCandidateAuthorityV0;
  source_bundle: {
    bundle_version: PerspectiveFormationInputBundleV0["bundle_version"];
    scope: string | null;
    work_id: string | null;
    source_pr_refs: string[];
  };
  thesis: string;
  selected_material: {
    changed_files: string[];
    changed_files_summary: string | null;
    work_id: string | null;
    source_pr_refs: string[];
  };
  evidence_pointers: PerspectiveCandidateEvidencePointerV0[];
  verification_summary: {
    checks_run_count: number;
    check_statuses: {
      passed: number;
      failed: number;
    };
    checks_run: PerspectiveFormationCheckRunInputV0[];
    skipped_checks: PerspectiveFormationSkippedCheckInputV0[];
  };
  unresolved_tensions: PerspectiveCandidateUnresolvedTensionV0[];
  basis_quality: {
    status: PerspectiveCandidateBasisQualityStatusV0;
    reasons: string[];
  };
  next_action_candidates: PerspectiveCandidateNextActionV0[];
  user_core_decision_questions: string[];
  forbidden_actions: string[];
  privacy: {
    raw_payloads_included: false;
  };
  authority_flags: {
    committed_state: false;
    persistence: false;
    provider_model_api_calls: false;
    proof_evidence_readiness_writes: false;
    codex_execution: false;
    merge_publish_approval: false;
  };
}

export function buildPerspectiveCandidateFromFormationInputBundle(
  bundle: PerspectiveFormationInputBundleV0,
): PerspectiveCandidateV0 {
  const basisQuality = buildBasisQuality(bundle);
  const unresolvedTensions = buildUnresolvedTensions(bundle);

  return {
    candidate_version: "perspective_candidate.v0.1",
    candidate_kind: "perspective_candidate",
    candidate_id: buildCandidateId(bundle),
    status: "perspective_candidate",
    authority: "non_committed",
    source_bundle: {
      bundle_version: bundle.bundle_version,
      scope: bundle.scope,
      work_id: bundle.work_id,
      source_pr_refs: [...bundle.source_pr_refs],
    },
    thesis: buildThesis(bundle),
    selected_material: {
      changed_files: [...bundle.changed_files],
      changed_files_summary: bundle.changed_files_summary,
      work_id: bundle.work_id,
      source_pr_refs: [...bundle.source_pr_refs],
    },
    evidence_pointers: buildEvidencePointers(bundle),
    verification_summary: {
      checks_run_count: bundle.verification_basis.checks_run.length,
      check_statuses: countCheckStatuses(bundle.verification_basis.checks_run),
      checks_run: copyChecks(bundle.verification_basis.checks_run),
      skipped_checks: copySkippedChecks(bundle.verification_basis.skipped_checks),
    },
    unresolved_tensions: unresolvedTensions,
    basis_quality: basisQuality,
    next_action_candidates: buildNextActionCandidates({
      basisStatus: basisQuality.status,
      unresolvedTensions,
    }),
    user_core_decision_questions:
      buildUserCoreDecisionQuestions(basisQuality.status),
    forbidden_actions: [
      "no commit/reject state",
      "no proof/evidence/readiness writes",
      "no merge/publish/approval",
      "no Codex execution",
      "no provider/model/API calls",
      "no persistence",
    ],
    privacy: {
      raw_payloads_included: false,
    },
    authority_flags: {
      committed_state: false,
      persistence: false,
      provider_model_api_calls: false,
      proof_evidence_readiness_writes: false,
      codex_execution: false,
      merge_publish_approval: false,
    },
  };
}

function buildCandidateId(bundle: PerspectiveFormationInputBundleV0): string {
  const anchor = [
    bundle.scope ?? "missing_scope",
    bundle.work_id ?? "missing_work",
    ...bundle.source_pr_refs,
  ].join("|");
  return `perspective-candidate:v0.1:${slugify(anchor)}:${stableHash(anchor)}`;
}

function buildThesis(bundle: PerspectiveFormationInputBundleV0): string {
  if (hasText(bundle.changed_files_summary)) {
    return `This work appears to move ${formatWorkAnchor(bundle)} by ${
      bundle.changed_files_summary
    }.`;
  }

  return "This work has reviewable formation input, but its changed-files summary is missing.";
}

function formatWorkAnchor(bundle: PerspectiveFormationInputBundleV0): string {
  const workOrPr =
    bundle.work_id ??
    bundle.source_pr_refs[0] ??
    bundle.scope ??
    "the supplied formation input";
  const scope = bundle.scope ? `${bundle.scope}/` : "";
  return `${scope}${workOrPr}`;
}

function buildEvidencePointers(
  bundle: PerspectiveFormationInputBundleV0,
): PerspectiveCandidateEvidencePointerV0[] {
  return [
    ...bundle.verification_basis.evidence_row_refs.map((ref) =>
      buildPointer("evidence_row_ref", ref),
    ),
    ...bundle.verification_basis.proof_only_action_refs.map((ref) =>
      buildPointer("proof_only_action_ref", ref),
    ),
    ...bundle.trace_basis.work_event_refs.map((ref) =>
      buildPointer("work_event_ref", ref),
    ),
    ...bundle.trace_basis.session_trace_refs.map((ref) =>
      buildPointer("session_trace_ref", ref),
    ),
    ...bundle.perspective_basis.existing_perspective_refs.map((ref) =>
      buildPointer("perspective_ref", ref),
    ),
  ];
}

function buildPointer(
  pointerKind: PerspectiveCandidateEvidencePointerKindV0,
  ref: string,
): PerspectiveCandidateEvidencePointerV0 {
  return {
    pointer_kind: pointerKind,
    pointer_semantics: "pointer_only",
    ref,
  };
}

function buildUnresolvedTensions(
  bundle: PerspectiveFormationInputBundleV0,
): PerspectiveCandidateUnresolvedTensionV0[] {
  const tensions: PerspectiveCandidateUnresolvedTensionV0[] = [
    ...bundle.unresolved_gaps.map((gap) => ({
      tension_kind: "unresolved_gap" as const,
      summary: gap.summary,
      source_ref: gap.gap_id,
    })),
    ...bundle.verification_basis.checks_run
      .filter((check) => check.status === "failed")
      .map((check) => ({
        tension_kind: "failed_check" as const,
        summary: check.result_summary,
        source_ref: check.check_id,
      })),
    ...bundle.verification_basis.skipped_checks
      .filter((check) => !hasText(check.skipped_reason))
      .map((check) => ({
        tension_kind: "skipped_check_missing_reason" as const,
        summary: `Skipped check ${check.check_id} is missing a concrete reason.`,
        source_ref: check.check_id,
      })),
  ];

  if (bundle.readiness.status !== "ready_for_candidate") {
    tensions.push(
      ...bundle.readiness.reasons.map((reason) => ({
        tension_kind: "readiness_reason" as const,
        summary: reason,
      })),
    );
  }

  return tensions;
}

function buildBasisQuality(
  bundle: PerspectiveFormationInputBundleV0,
): PerspectiveCandidateV0["basis_quality"] {
  const failedChecks = bundle.verification_basis.checks_run.filter(
    (check) => check.status === "failed",
  );
  const reasons = [...bundle.readiness.reasons];
  const status =
    failedChecks.length > 0 &&
    bundle.readiness.status === "ready_for_candidate"
      ? "needs_review"
      : mapReadinessStatus(bundle.readiness.status);

  if (failedChecks.length > 0) {
    reasons.push("failed checks present");
  }

  return {
    status,
    reasons,
  };
}

function mapReadinessStatus(
  status: PerspectiveFormationInputBundleV0["readiness"]["status"],
): PerspectiveCandidateBasisQualityStatusV0 {
  if (status === "blocked") return "blocked";
  if (status === "needs_review") return "needs_review";
  return "sufficient_for_review";
}

function buildNextActionCandidates({
  basisStatus,
  unresolvedTensions,
}: {
  basisStatus: PerspectiveCandidateBasisQualityStatusV0;
  unresolvedTensions: PerspectiveCandidateUnresolvedTensionV0[];
}): PerspectiveCandidateNextActionV0[] {
  const actions: PerspectiveCandidateNextActionV0[] = [
    {
      action_id: "review_candidate",
      summary: "Review the non-committed Perspective Candidate.",
    },
  ];

  if (
    basisStatus !== "sufficient_for_review" ||
    unresolvedTensions.some((tension) =>
      ["unresolved_gap", "skipped_check_missing_reason"].includes(
        tension.tension_kind,
      ),
    )
  ) {
    actions.push({
      action_id: "fix_input_gaps",
      summary: "Resolve missing input, failed check, skipped-check, or gap qualifications.",
    });
  }

  if (basisStatus === "sufficient_for_review") {
    actions.push({
      action_id: "prepare_codex_handoff",
      summary: "Prepare the next Codex handoff only after user review.",
    });
  }

  return actions;
}

function buildUserCoreDecisionQuestions(
  basisStatus: PerspectiveCandidateBasisQualityStatusV0,
): string[] {
  if (basisStatus === "sufficient_for_review") {
    return [];
  }

  return [
    "Should this non-committed candidate be revised before any future handoff?",
    "Which unresolved gaps or readiness reasons must be answered by the user or Augnes Core?",
  ];
}

function countCheckStatuses(
  checks: readonly PerspectiveFormationCheckRunInputV0[],
): PerspectiveCandidateV0["verification_summary"]["check_statuses"] {
  return checks.reduce(
    (counts, check) => ({
      passed: counts.passed + (check.status === "passed" ? 1 : 0),
      failed: counts.failed + (check.status === "failed" ? 1 : 0),
    }),
    { passed: 0, failed: 0 },
  );
}

function copyChecks(
  checks: readonly PerspectiveFormationCheckRunInputV0[],
): PerspectiveFormationCheckRunInputV0[] {
  return checks.map((check) => ({
    check_id: check.check_id,
    command: check.command,
    status: check.status,
    result_summary: check.result_summary,
  }));
}

function copySkippedChecks(
  skippedChecks: readonly PerspectiveFormationSkippedCheckInputV0[],
): PerspectiveFormationSkippedCheckInputV0[] {
  return skippedChecks.map((check) => ({
    check_id: check.check_id,
    skipped_reason: check.skipped_reason,
    ...(check.result_summary !== undefined
      ? { result_summary: check.result_summary }
      : {}),
  }));
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "missing-anchor"
  );
}

function stableHash(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}
