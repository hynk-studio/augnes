import {
  ACTIVE_CONTEXT_ADMISSION_CATEGORIES,
  type ActiveContextAdmission,
  type ActiveContextAdmissionCategory,
  type ActiveContextAdmissionDecision,
  type TemporalPreviewCounterexample,
  type TemporalPreviewEvidenceAnchor,
  type TemporalPreviewSummaryRef,
  type TemporalPreviewTension,
} from "@/lib/temporal-interpretation/types";

export type ActiveContextCandidate = {
  candidate_id: string;
  source_authority: string;
  reason: string;
  evidence_refs?: string[];
  counterexample_refs?: string[];
  residual_tension_refs?: string[];
  primary?: boolean;
  boundary?: boolean;
  tension?: boolean;
  duplicate_of?: string;
  summary_only?: boolean;
  out_of_scope?: boolean;
  pending_evidence?: boolean;
};

export function classifyActiveContextCandidate(
  candidate: ActiveContextCandidate,
): ActiveContextAdmissionDecision {
  const category = resolveAdmissionCategory(candidate);

  return {
    candidate_id: candidate.candidate_id,
    category,
    reason: candidate.reason,
    source_authority: candidate.source_authority,
    evidence_refs: uniqueStrings(candidate.evidence_refs ?? []),
    counterexample_refs: uniqueStrings(candidate.counterexample_refs ?? []),
    residual_tension_refs: uniqueStrings(candidate.residual_tension_refs ?? []),
  };
}

export function buildActiveContextAdmission({
  evidenceAnchors,
  summaryRefs,
  counterexamples,
  residualTensions,
  userPreferences,
}: {
  evidenceAnchors: TemporalPreviewEvidenceAnchor[];
  summaryRefs: TemporalPreviewSummaryRef[];
  counterexamples: TemporalPreviewCounterexample[];
  residualTensions: TemporalPreviewTension[];
  userPreferences: string[];
}): ActiveContextAdmission {
  const candidates: ActiveContextCandidate[] = [
    ...evidenceAnchors.slice(0, 3).map((anchor, index) => ({
      candidate_id: anchor.ref,
      source_authority: anchor.source_type,
      reason:
        index === 0
          ? "Committed or trace-backed context can anchor the current preview."
          : "Additional evidence-backed context remains active but bounded.",
      evidence_refs: [anchor.ref],
      primary: index === 0,
    })),
    ...summaryRefs.map((summary) => ({
      candidate_id: summary.ref,
      source_authority: "summary_only",
      reason:
        "Summary refs can orient reviewers but must not be admitted as primary evidence.",
      summary_only: true,
      counterexample_refs: counterexamples.map((item) => item.ref),
    })),
    ...residualTensions.slice(0, 2).map((tension) => ({
      candidate_id: tension.ref,
      source_authority: "residual_tension",
      reason:
        "Open tension must stay visible as an active constraint on interpretation.",
      residual_tension_refs: [tension.ref],
      tension: true,
    })),
    ...counterexamples.slice(0, 2).map((counterexample) => ({
      candidate_id: counterexample.ref,
      source_authority: "counterexample",
      reason:
        "Counterexamples are admitted as boundary context so drift is visible.",
      counterexample_refs: [counterexample.ref],
      boundary: true,
    })),
    ...userPreferences.slice(0, 1).map((preference, index) => ({
      candidate_id: `preference:${index + 1}`,
      source_authority: "user_preference",
      reason:
        "User preference is recallable context, not factual readiness or approval.",
      evidence_refs: [],
      counterexample_refs: counterexamples.map((item) => item.ref),
      pending_evidence: preference.toLowerCase().includes("ready"),
    })),
  ];

  return {
    decisions: candidates.map(classifyActiveContextCandidate),
    note:
      "Admission decisions are deterministic review hints only; they do not admit memory automatically, commit state, approve work, publish proof, or replace evidence refs.",
  };
}

export function isKnownAdmissionCategory(value: string) {
  return ACTIVE_CONTEXT_ADMISSION_CATEGORIES.includes(
    value as ActiveContextAdmissionCategory,
  );
}

function resolveAdmissionCategory(
  candidate: ActiveContextCandidate,
): ActiveContextAdmissionCategory {
  if (candidate.duplicate_of) return "exclude_duplicate";
  if (candidate.out_of_scope) return "exclude_out_of_scope";
  if (candidate.summary_only) return "exclude_summary_only";
  if (candidate.pending_evidence) return "suspend_pending_evidence";
  if (candidate.tension) return "admit_tension_active";
  if (candidate.boundary) return "admit_boundary_active";
  if (candidate.primary) return "admit_primary_active";

  return "retain_recallable";
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
