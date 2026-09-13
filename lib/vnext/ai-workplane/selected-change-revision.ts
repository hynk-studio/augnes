import { createSharedInspectorHrefV01 } from "@/lib/vnext/shared-project-inspector-href";
import type { VNextOperatorPilotReviewDetailV01 } from "@/lib/vnext/runtime/operator-pilot-review-material";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

type CandidateRead = VNextOperatorPilotReviewDetailV01["candidates"][number];
type Candidate = CandidateRead["candidate"];

export interface SelectedChangeRevisionV01 {
  status: "available" | "partial" | "unavailable";
  prior: Candidate | null;
  source_href: string | null;
  rationale: string | null;
  author_basis: string | null;
  materials: Array<{
    material_id: string;
    lane: "observation" | "attestation" | "inference";
    summary: string;
    trust_class: string;
    role: "selected_basis" | "interpretation_origin";
    source_hrefs: string[];
  }>;
  result_reports: Array<{ summary: string; limitations: string[]; href: string }>;
  unresolved: Array<{ id: string; summary: string }>;
  gaps: string[];
}

/**
 * Rebuild only the immediate operation-aware contrast from a protected read.
 * Its existing reader validates the predecessor, author session and immutable
 * copies. This projection does not authenticate a standalone proposal, walk
 * history, interpret a semantic difference, or own review/application status.
 */
export function buildSelectedChangeRevisionV01(
  read: VNextOperatorPilotReviewDetailV01,
  selected: CandidateRead,
): SelectedChangeRevisionV01 | null {
  const proposal = read.proposal;
  const revision = proposal.operation_revision;
  if (!revision?.revised_candidate ||
      revision.revised_candidate.candidate_id !== selected.candidate.candidate_id) return null;
  const unavailable = (gap: string): SelectedChangeRevisionV01 => ({
    status: "unavailable", prior: null, source_href: null, rationale: null,
    author_basis: null, materials: [], result_reports: [], unresolved: [], gaps: [gap],
  });
  const exactCandidate = (id: string, fingerprint: string) => {
    const matches = read.candidates.filter((entry) => entry.candidate.candidate_id === id);
    const stored = proposal.proposed_deltas.filter((candidate) => candidate.candidate_id === id);
    return matches.length === 1 && stored.length === 1 &&
      matches[0]!.candidate_fingerprint === fingerprint &&
      JSON.stringify(matches[0]!.candidate) === JSON.stringify(stored[0]!)
      ? matches[0]!.candidate : null;
  };
  const exactSelected = exactCandidate(selected.candidate.candidate_id, selected.candidate_fingerprint);
  if (read.proposal_id !== proposal.proposal_id ||
      read.proposal_fingerprint !== proposal.integrity.fingerprint ||
      selected.candidate_fingerprint !== revision.revised_candidate.candidate_fingerprint ||
      !exactSelected || JSON.stringify(exactSelected) !== JSON.stringify(selected.candidate)) {
    return unavailable("The selected revision binding changed. An exact comparison is unavailable.");
  }
  const source = revision.source;
  const sourceRef = proposal.source_refs.find((ref) =>
    ref.ref_type === "episode_delta_proposal" && ref.external_id === source.proposal_id &&
    ref.source_ref === source.proposal_fingerprint &&
    ref.compatibility_namespace === "augnes.vnext.operation-aware-proposal-revision.v0.1");
  const prior = exactCandidate(source.candidate_id, source.candidate_fingerprint);
  const candidateRef = proposal.source_refs.find((ref) =>
    ref.ref_type === "episode_delta_candidate" && ref.external_id === source.candidate_id &&
    ref.source_ref === source.candidate_fingerprint &&
    ref.compatibility_namespace === "augnes.vnext.operation-aware-proposal-revision.v0.1");
  if (!sourceRef || !candidateRef || !prior) {
    return unavailable("The exact earlier proposal and candidate are unavailable. No other change is used as the baseline.");
  }
  const gaps: string[] = [];
  const basisIds = new Set(selected.candidate.basis_material_ids);
  // One explicit provenance step, not transitive evidential support. Only the
  // interpretation's recorded origins in this already validated payload enter.
  const originIds = new Set(read.source_lanes.inferences
    .filter((item) => basisIds.has(item.material_id))
    .flatMap((item) => item.basis_material_ids));
  const visibleIds = new Set([...basisIds, ...originIds]);
  const materials: SelectedChangeRevisionV01["materials"] = [];
  // IDs identify distinct recorded events. Equal wording and repeated source
  // pointers neither merge events nor constitute independent confirmation.
  for (const [lane, entries] of [
    ["observation", read.source_lanes.observations],
    ["attestation", read.source_lanes.attestations],
    ["inference", read.source_lanes.inferences],
  ] as const) {
    for (const item of entries) {
      if (!visibleIds.has(item.material_id)) continue;
      materials.push({
        material_id: item.material_id, lane, summary: item.bounded_summary,
        trust_class: item.trust_class,
        role: basisIds.has(item.material_id) ? "selected_basis" : "interpretation_origin",
        source_hrefs: receiptHrefs(item.source_run_receipt_refs),
      });
    }
  }
  if ([...visibleIds].some((id) => !materials.some((item) => item.material_id === id))) {
    gaps.push("Some recorded basis material is unavailable in this bounded read.");
  }
  if (read.source_lanes.inferences.some((item) => originIds.has(item.material_id) &&
      item.basis_material_ids.some((id) => !visibleIds.has(id)))) {
    gaps.push("Further interpretation origins are outside this immediate comparison.");
  }
  if (materials.length === 0) gaps.push("No recorded source summary is available for this revision.");
  if (proposal.source_status.coverage !== "complete" || proposal.source_status.currentness !== "fresh") {
    gaps.push(`Recorded source coverage is ${proposal.source_status.coverage}; currentness is ${proposal.source_status.currentness}.`);
  }
  const candidateIds = new Set([source.candidate_id, selected.candidate.candidate_id]);
  const related = (item: { related_delta_ids: string[]; related_material_ids: string[] }) =>
    item.related_delta_ids.some((id) => candidateIds.has(id)) ||
    item.related_material_ids.some((id) => visibleIds.has(id)) ||
    (item.related_delta_ids.length === 0 && item.related_material_ids.length === 0);
  const sourceReceiptRefs = selected.candidate.source_refs.filter((ref) => ref.ref_type === "run_receipt");
  const sourceReceipts = read.source_run_receipts.filter((receipt) =>
    receipt.workspace_id === proposal.workspace_id && receipt.project_id === proposal.project_id &&
    sourceReceiptRefs.some((ref) => ref.external_id === receipt.receipt_id &&
      ref.source_ref === receipt.integrity.fingerprint));
  if (sourceReceiptRefs.some((ref) => !sourceReceipts.some((receipt) =>
      ref.external_id === receipt.receipt_id && ref.source_ref === receipt.integrity.fingerprint))) {
    gaps.push("Some exact source result reports are unavailable in this bounded read.");
  }
  return {
    status: gaps.length ? "partial" : "available", prior,
    source_href: createSharedInspectorHrefV01({ target_kind: "episode_delta_proposal",
      record_id: source.proposal_id, expected_fingerprint: source.proposal_fingerprint }),
    rationale: revision.rationale_summary,
    author_basis: revision.authored_by_ref.trust_class,
    materials,
    result_reports: sourceReceipts.map((receipt) => ({ summary: receipt.result_summary.summary,
        limitations: receipt.result_summary.limitations,
        href: createSharedInspectorHrefV01({ target_kind: "run_receipt",
          record_id: receipt.receipt_id, expected_fingerprint: receipt.integrity.fingerprint }) })),
    unresolved: [
      ...proposal.missing_information.filter(related).map((item) => ({ id: item.missing_id, summary: item.bounded_summary })),
      ...proposal.uncertainties.filter(related).map((item) => ({ id: item.uncertainty_id, summary: item.bounded_summary })),
      ...proposal.conflicts.filter((item) => item.material_ids.some((id) => visibleIds.has(id)))
        .map((item) => ({ id: item.conflict_id, summary: item.bounded_summary })),
    ],
    gaps,
  };
}

function receiptHrefs(refs: ExternalRefV01[]): string[] {
  return [...new Set(refs.filter((ref) => ref.ref_type === "run_receipt" &&
    /^sha256:[a-f0-9]{64}$/u.test(ref.source_ref ?? ""))
    .map((ref) => createSharedInspectorHrefV01({ target_kind: "run_receipt",
      record_id: ref.external_id, expected_fingerprint: ref.source_ref! })))];
}
