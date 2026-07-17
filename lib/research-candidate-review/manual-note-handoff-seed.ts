import type {
  ResearchCandidateManualNoteHandoffCandidateSummary,
  ResearchCandidateManualNoteHandoffSeed,
  ResearchCandidateManualNoteHandoffSeedAuthorityBoundary,
  ResearchCandidateManualNoteHandoffSeedInput,
  ResearchCandidateManualNoteHandoffSeedValidation,
  ResearchCandidateManualNoteSelectedContextCard,
} from "@/types/research-candidate-manual-note-handoff-seed";
import type {
  ClaimCandidate,
  EvidenceCandidate,
  FollowUpWorkCandidate,
  KnowledgeGapCandidate,
  PerspectiveDeltaCandidate,
  ResearchCandidateReviewPreviewResponse,
  SourceReferencePreview,
  TensionCandidate,
} from "@/types/research-candidate-review";

type JsonRecord = Record<string, unknown>;

const seedKind = "research_candidate_manual_note_handoff_seed" as const;
const seedVersion = "research_candidate_manual_note_handoff_seed.v0.1" as const;
const nextRecommendedSlice =
  "manual_research_candidate_handoff_seed_operator_review_v0_1" as const;

export function buildResearchCandidateManualNoteHandoffSeed(
  input: ResearchCandidateManualNoteHandoffSeedInput,
): ResearchCandidateManualNoteHandoffSeed {
  const preview = input.preview;
  const session = preview.research_session_preview;
  const sourceRefs = collectSourceRefs(preview);
  const selectedClaimCandidateIds = preview.claim_candidates.map(
    (candidate) => candidate.claim_candidate_id,
  );
  const selectedEvidenceCandidateIds = preview.evidence_candidates.map(
    (candidate) => candidate.evidence_candidate_id,
  );
  const unresolvedTensionCandidateIds = preview.tension_candidates.map(
    (candidate) => candidate.tension_candidate_id,
  );
  const knowledgeGapCandidateIds = preview.knowledge_gap_candidates.map(
    (candidate) => candidate.knowledge_gap_candidate_id,
  );
  const perspectiveDeltaCandidateIds = preview.perspective_delta_candidates.map(
    (candidate) => candidate.perspective_delta_candidate_id,
  );
  const followUpWorkCandidateIds = preview.follow_up_work_candidates.map(
    (candidate) => candidate.follow_up_work_candidate_id,
  );
  const candidateSummary = buildCandidateSummary(preview, input.warnings ?? []);
  const selectedContextCards = buildSelectedContextCards(preview);
  const expectedReturnReportFields = expectedReturnFields();
  const stopConditions = requiredStopConditions();
  const forbiddenActions = requiredForbiddenActions();
  const sourcePreviewRefs = uniqueSorted([
    `research_session_preview:${session.session_id}`,
    ...(preview.preview_version ? [`preview_version:${preview.preview_version}`] : []),
    ...(input.source_metadata?.preview_draft_id
      ? [`preview_draft:${input.source_metadata.preview_draft_id}`]
      : []),
    ...(input.source_metadata?.input_fingerprint
      ? [`input_fingerprint:${input.source_metadata.input_fingerprint}`]
      : []),
  ]);

  const baseSeed: Omit<
    ResearchCandidateManualNoteHandoffSeed,
    "seed_fingerprint" | "validation" | "recommendation_status"
  > = {
    seed_kind: seedKind,
    seed_version: seedVersion,
    scope: preview.scope,
    fingerprint_algorithm: "fnv1a32_canonical_json_v0_1",
    source_preview_session_id: session.session_id,
    source_preview_draft_id: input.source_metadata?.preview_draft_id ?? null,
    source_input_fingerprint: input.source_metadata?.input_fingerprint ?? null,
    source_preview_refs: sourcePreviewRefs,
    source_refs: sourceRefs,
    selected_context_cards: selectedContextCards,
    candidate_summary: candidateSummary,
    selected_claim_candidate_ids: selectedClaimCandidateIds,
    selected_evidence_candidate_ids: selectedEvidenceCandidateIds,
    unresolved_tension_candidate_ids: unresolvedTensionCandidateIds,
    knowledge_gap_candidate_ids: knowledgeGapCandidateIds,
    perspective_delta_candidate_ids: perspectiveDeltaCandidateIds,
    follow_up_work_candidate_ids: followUpWorkCandidateIds,
    copyable_prompt: buildCopyablePrompt({
      input,
      sourceRefs,
      expectedReturnReportFields,
      stopConditions,
      forbiddenActions,
    }),
    expected_return_report_fields: expectedReturnReportFields,
    expected_observed_delta_seed: {
      expected_delta_summary:
        "Future Codex work should report whether the selected manual Research Candidate context materially improved the bounded implementation result.",
      observed_delta_required: true,
      candidate_context_refs: [
        ...selectedClaimCandidateIds,
        ...selectedEvidenceCandidateIds,
        ...unresolvedTensionCandidateIds,
        ...knowledgeGapCandidateIds,
        ...perspectiveDeltaCandidateIds,
        ...followUpWorkCandidateIds,
      ],
      return_field: "expected vs observed delta summary",
    },
    reuse_outcome_review_seed: {
      required: true,
      allowed_outcomes: ["helpful", "stale", "missing", "noisy", "misleading"],
      return_field:
        "whether selected candidate context was helpful/stale/missing/noisy/misleading",
    },
    stop_conditions: stopConditions,
    forbidden_actions: forbiddenActions,
    authority_boundary: getResearchCandidateManualNoteHandoffSeedAuthorityBoundary(),
    next_recommended_slice: nextRecommendedSlice,
  };

  const seedWithValidationInput: ResearchCandidateManualNoteHandoffSeed = {
    ...baseSeed,
    seed_fingerprint: "",
    validation: {
      passed: false,
      failure_codes: [],
      copyable_prompt_plain_text: false,
      copyable_prompt_not_markdown_fenced: false,
      source_refs_present: false,
      candidate_context_present: false,
      no_fabricated_geometry_or_substrate_lineage: true,
      authority_boundary_safe: false,
    },
    recommendation_status: "blocked_missing_manual_candidate_context",
  };
  const validation = validateResearchCandidateManualNoteHandoffSeed(
    seedWithValidationInput,
  );
  const seed: ResearchCandidateManualNoteHandoffSeed = {
    ...seedWithValidationInput,
    validation,
    recommendation_status: validation.passed
      ? "ready_for_human_operator_copy_review"
      : "blocked_missing_manual_candidate_context",
  };

  return {
    ...seed,
    seed_fingerprint: createResearchCandidateManualNoteHandoffSeedFingerprint(
      seed,
    ),
  };
}

export function validateResearchCandidateManualNoteHandoffSeed(
  seed: ResearchCandidateManualNoteHandoffSeed,
): ResearchCandidateManualNoteHandoffSeedValidation {
  const failureCodes: string[] = [];
  const prompt = seed.copyable_prompt;
  const promptPlainText = Boolean(prompt) && !/<[^>]+>/.test(prompt);
  const promptNotMarkdownFenced = !/```/.test(prompt);
  const sourceRefsPresent = seed.source_refs.length > 0;
  const candidateContextPresent =
    seed.selected_claim_candidate_ids.length +
      seed.selected_evidence_candidate_ids.length +
      seed.unresolved_tension_candidate_ids.length +
      seed.knowledge_gap_candidate_ids.length +
      seed.perspective_delta_candidate_ids.length +
      seed.follow_up_work_candidate_ids.length >
    0;
  const authorityBoundarySafe = authorityBoundaryIsSafe(seed.authority_boundary);

  if (seed.seed_kind !== seedKind) failureCodes.push("seed_kind_invalid");
  if (seed.seed_version !== seedVersion) failureCodes.push("seed_version_invalid");
  if (!promptPlainText) failureCodes.push("copyable_prompt_not_plain_text");
  if (!promptNotMarkdownFenced) failureCodes.push("copyable_prompt_markdown_fenced");
  if (!sourceRefsPresent) failureCodes.push("source_refs_missing");
  if (!candidateContextPresent) failureCodes.push("candidate_context_missing");
  if (!authorityBoundarySafe) {
    failureCodes.push("authority_boundary_forbidden_capability_enabled");
  }

  for (const [label, expectedText] of [
    ["mission", "Mission brief:"],
    ["source_refs", "Selected source refs:"],
    ["candidate_claims", "Candidate claims summary:"],
    ["tensions", "Unresolved tensions:"],
    ["knowledge_gaps", "Knowledge gaps:"],
    ["perspective_deltas", "Perspective delta candidates:"],
    ["follow_up_work", "Follow-up work candidates:"],
    ["non_goals", "Explicit non-goals:"],
    ["return_binding", "Return binding fields:"],
    ["final_report", "Final report requirements:"],
    ["do_not_execute_codex", "Do not execute Codex automatically from this preview."],
    [
      "do_not_branch_pr_without_human",
      "Do not create branch/PR unless a human explicitly uses the copied prompt as a Codex task.",
    ],
    ["do_not_github", "Do not call GitHub automation from Augnes runtime."],
    ["do_not_provider", "Do not call providers/OpenAI."],
    ["do_not_fetch", "Do not fetch sources."],
    [
      "do_not_retrieval",
      "Do not run retrieval/RAG/embeddings/vector/FTS/crawler behavior.",
    ],
    [
      "do_not_write_db",
      "Do not write DB, proof, evidence, work item, or canonical Perspective state.",
    ],
    ["do_not_promote", "Do not promote Perspective."],
    [
      "do_not_product_write",
      "Do not allocate product IDs or execute product writes.",
    ],
  ] as const) {
    if (!prompt.includes(expectedText)) {
      failureCodes.push(`copyable_prompt_${label}_missing`);
    }
  }

  return {
    passed: failureCodes.length === 0,
    failure_codes: uniqueSorted(failureCodes),
    copyable_prompt_plain_text: promptPlainText,
    copyable_prompt_not_markdown_fenced: promptNotMarkdownFenced,
    source_refs_present: sourceRefsPresent,
    candidate_context_present: candidateContextPresent,
    no_fabricated_geometry_or_substrate_lineage: true,
    authority_boundary_safe: authorityBoundarySafe,
  };
}

export function createResearchCandidateManualNoteHandoffSeedFingerprint(
  value: ResearchCandidateManualNoteHandoffSeed,
): string {
  return `fnv1a32:${fnv1a32(stableJson(stripGeneratedFields(value)))}`;
}

export function getResearchCandidateManualNoteHandoffSeedAuthorityBoundary(): ResearchCandidateManualNoteHandoffSeedAuthorityBoundary {
  return {
    candidate_only: true,
    preview_only: true,
    copyable_text_only: true,
    source_of_truth: false,
    can_execute_codex: false,
    can_create_branch: false,
    can_open_pr: false,
    can_call_github: false,
    can_send_external_handoff: false,
    can_call_providers_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
    can_write_db: false,
    can_write_proof_or_evidence: false,
    can_create_work_item: false,
    can_promote_perspective: false,
    can_mutate_committed_augnes_state: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
  };
}

function buildCopyablePrompt({
  input,
  sourceRefs,
  expectedReturnReportFields,
  stopConditions,
  forbiddenActions,
}: {
  input: ResearchCandidateManualNoteHandoffSeedInput;
  sourceRefs: string[];
  expectedReturnReportFields: string[];
  stopConditions: string[];
  forbiddenActions: string[];
}) {
  const preview = input.preview;
  const session = preview.research_session_preview;
  const expectedFiles = uniqueSorted(
    preview.follow_up_work_candidates.flatMap(
      (candidate) => candidate.suggested_expected_files,
    ),
  );
  const expectedChecks = uniqueSorted(
    preview.follow_up_work_candidates.flatMap(
      (candidate) => candidate.suggested_expected_checks,
    ),
  );

  return [
    "Research Candidate Manual Note Handoff Seed Preview",
    "Repo: hynk-studio/augnes",
    "Canonical checkout: /Users/hynk/code/augnes",
    `Target label: ${input.target_label ?? "manual Research Candidate Review follow-up"}`,
    `Source result: ${input.source_metadata?.result_source ?? "visible_manual_note_preview"}`,
    `Source preview session: ${session.session_id}`,
    `Source preview draft: ${input.source_metadata?.preview_draft_id ?? "not persisted or not selected"}`,
    `Source input fingerprint: ${input.source_metadata?.input_fingerprint ?? "not supplied"}`,
    `Operator note: ${input.operator_note ?? "none supplied"}`,
    "",
    "Mission brief:",
    `Use the visible manual Research Candidate Review preview as candidate-only context for a future bounded Codex task. The research question is: ${session.research_question}`,
    `Operator intent: ${session.operator_intent}`,
    "",
    "Selected source refs:",
    ...listOrNone(sourceRefs),
    "",
    "Candidate claims summary:",
    ...preview.claim_candidates.map(formatClaim),
    ...noneWhenEmpty(preview.claim_candidates),
    "",
    "Candidate evidence summary:",
    ...preview.evidence_candidates.map(formatEvidence),
    ...noneWhenEmpty(preview.evidence_candidates),
    "",
    "Unresolved tensions:",
    ...preview.tension_candidates.map(formatTension),
    ...noneWhenEmpty(preview.tension_candidates),
    "",
    "Knowledge gaps:",
    ...preview.knowledge_gap_candidates.map(formatGap),
    ...noneWhenEmpty(preview.knowledge_gap_candidates),
    "",
    "Perspective delta candidates:",
    ...preview.perspective_delta_candidates.map(formatPerspectiveDelta),
    ...noneWhenEmpty(preview.perspective_delta_candidates),
    "",
    "Follow-up work candidates:",
    ...preview.follow_up_work_candidates.map(formatFollowUpWork),
    ...noneWhenEmpty(preview.follow_up_work_candidates),
    "",
    expectedFiles.length > 0
      ? `Expected files from follow-up candidates: ${expectedFiles.join(", ")}`
      : "Expected files from follow-up candidates: not supplied.",
    expectedChecks.length > 0
      ? `Expected checks from follow-up candidates: ${expectedChecks.join(" | ")}`
      : "Expected checks from follow-up candidates: not supplied.",
    "",
    "Explicit non-goals:",
    ...forbiddenActions.map((action) => `- ${action}`),
    "",
    "Stop conditions:",
    ...stopConditions.map((condition) => `- ${condition}`),
    "",
    "Return binding fields:",
    ...expectedReturnReportFields.map((field) => `- ${field}`),
    "",
    "Final report requirements:",
    "- Native-host results return automatically through the canonical structured RunReceipt path.",
    "- Include Summary, Files changed, Authority boundary statement, Verification, Skipped checks with concrete reasons, Proof-only closeout status or skipped reason, and Result report fields.",
    "- State whether selected candidate context was helpful, stale, missing, noisy, or misleading.",
    "- Include expected vs observed delta summary.",
    "",
    "Hard boundaries:",
    "Do not execute Codex automatically from this preview.",
    "Do not create branch/PR unless a human explicitly uses the copied prompt as a Codex task.",
    "Do not call GitHub automation from Augnes runtime.",
    "Do not call providers/OpenAI.",
    "Do not fetch sources.",
    "Do not run retrieval/RAG/embeddings/vector/FTS/crawler behavior.",
    "Do not write DB, proof, evidence, work item, or canonical Perspective state.",
    "Do not promote Perspective.",
    "Do not allocate product IDs or execute product writes.",
  ].join("\n");
}

function buildCandidateSummary(
  preview: ResearchCandidateReviewPreviewResponse,
  warnings: ResearchCandidateManualNoteHandoffSeedInput["warnings"],
): ResearchCandidateManualNoteHandoffCandidateSummary {
  const session = preview.research_session_preview;
  return {
    research_question: session.research_question,
    operator_intent: session.operator_intent,
    total_candidate_count:
      session.claim_candidate_count +
      session.evidence_candidate_count +
      session.tension_candidate_count +
      session.knowledge_gap_candidate_count +
      session.perspective_delta_candidate_count +
      session.follow_up_work_candidate_count,
    claim_count: session.claim_candidate_count,
    evidence_count: session.evidence_candidate_count,
    tension_count: session.tension_candidate_count,
    knowledge_gap_count: session.knowledge_gap_candidate_count,
    perspective_delta_count: session.perspective_delta_candidate_count,
    follow_up_work_count: session.follow_up_work_candidate_count,
    parser_warning_count: warnings?.length ?? 0,
  };
}

function buildSelectedContextCards(
  preview: ResearchCandidateReviewPreviewResponse,
): ResearchCandidateManualNoteSelectedContextCard[] {
  const session = preview.research_session_preview;
  return [
    {
      card_id: session.session_id,
      card_kind: "research_session",
      title: session.research_question,
      summary: session.operator_intent,
      source_refs: session.source_refs,
      candidate_ids: [],
      preview_only: true,
      source_of_truth: false,
    },
    ...preview.source_reference_previews.map(sourceReferenceCard),
    ...preview.claim_candidates.map(claimCard),
    ...preview.evidence_candidates.map(evidenceCard),
    ...preview.tension_candidates.map(tensionCard),
    ...preview.knowledge_gap_candidates.map(gapCard),
    ...preview.perspective_delta_candidates.map(deltaCard),
    ...preview.follow_up_work_candidates.map(followUpCard),
  ];
}

function sourceReferenceCard(
  source: SourceReferencePreview,
): ResearchCandidateManualNoteSelectedContextCard {
  return {
    card_id: source.source_ref_id,
    card_kind: "source_reference",
    title: source.title,
    summary: `${source.authors_or_origin}; ${source.identifier_or_url}`,
    source_refs: [source.source_ref_id],
    candidate_ids: [],
    preview_only: true,
    source_of_truth: false,
  };
}

function claimCard(
  candidate: ClaimCandidate,
): ResearchCandidateManualNoteSelectedContextCard {
  return {
    card_id: candidate.claim_candidate_id,
    card_kind: "claim_candidate",
    title: candidate.claim_candidate_id,
    summary: candidate.claim_text,
    source_refs: candidateSourceRefs(candidate),
    candidate_ids: [candidate.claim_candidate_id],
    preview_only: true,
    source_of_truth: false,
  };
}

function evidenceCard(
  candidate: EvidenceCandidate,
): ResearchCandidateManualNoteSelectedContextCard {
  return {
    card_id: candidate.evidence_candidate_id,
    card_kind: "evidence_candidate",
    title: candidate.evidence_candidate_id,
    summary: candidate.evidence_summary,
    source_refs: candidateSourceRefs(candidate),
    candidate_ids: [candidate.evidence_candidate_id, candidate.claim_candidate_id],
    preview_only: true,
    source_of_truth: false,
  };
}

function tensionCard(
  candidate: TensionCandidate,
): ResearchCandidateManualNoteSelectedContextCard {
  return {
    card_id: candidate.tension_candidate_id,
    card_kind: "tension_candidate",
    title: candidate.tension_candidate_id,
    summary: candidate.summary,
    source_refs: candidateSourceRefs(candidate),
    candidate_ids: [
      candidate.tension_candidate_id,
      ...candidate.related_claim_candidate_ids,
      ...candidate.related_evidence_candidate_ids,
    ],
    preview_only: true,
    source_of_truth: false,
  };
}

function gapCard(
  candidate: KnowledgeGapCandidate,
): ResearchCandidateManualNoteSelectedContextCard {
  return {
    card_id: candidate.knowledge_gap_candidate_id,
    card_kind: "knowledge_gap_candidate",
    title: candidate.knowledge_gap_candidate_id,
    summary: candidate.summary,
    source_refs: candidateSourceRefs(candidate),
    candidate_ids: [
      candidate.knowledge_gap_candidate_id,
      ...candidate.related_claim_candidate_ids,
      ...candidate.related_tension_candidate_ids,
    ],
    preview_only: true,
    source_of_truth: false,
  };
}

function deltaCard(
  candidate: PerspectiveDeltaCandidate,
): ResearchCandidateManualNoteSelectedContextCard {
  return {
    card_id: candidate.perspective_delta_candidate_id,
    card_kind: "perspective_delta_candidate",
    title: candidate.target_perspective_key,
    summary: candidate.proposed_update_summary,
    source_refs: candidateSourceRefs(candidate),
    candidate_ids: [
      candidate.perspective_delta_candidate_id,
      ...candidate.basis_claim_candidate_ids,
      ...candidate.basis_evidence_candidate_ids,
      ...candidate.related_tension_candidate_ids,
      ...candidate.related_gap_candidate_ids,
    ],
    preview_only: true,
    source_of_truth: false,
  };
}

function followUpCard(
  candidate: FollowUpWorkCandidate,
): ResearchCandidateManualNoteSelectedContextCard {
  return {
    card_id: candidate.follow_up_work_candidate_id,
    card_kind: "follow_up_work_candidate",
    title: candidate.candidate_title,
    summary: candidate.candidate_summary,
    source_refs: [],
    candidate_ids: [candidate.follow_up_work_candidate_id],
    preview_only: true,
    source_of_truth: false,
  };
}

function collectSourceRefs(preview: ResearchCandidateReviewPreviewResponse) {
  return uniqueSorted([
    ...preview.research_session_preview.source_refs,
    ...preview.source_reference_previews.map((source) => source.source_ref_id),
    ...preview.claim_candidates.flatMap(candidateSourceRefs),
    ...preview.evidence_candidates.flatMap(candidateSourceRefs),
    ...preview.tension_candidates.flatMap(candidateSourceRefs),
    ...preview.knowledge_gap_candidates.flatMap(candidateSourceRefs),
    ...preview.perspective_delta_candidates.flatMap(candidateSourceRefs),
  ]);
}

function candidateSourceRefs(candidate: { source_ref_id?: string; source_refs?: string[] }) {
  return candidate.source_refs ?? (candidate.source_ref_id ? [candidate.source_ref_id] : []);
}

function formatClaim(candidate: ClaimCandidate) {
  return `- ${candidate.claim_candidate_id}: ${candidate.claim_text}`;
}

function formatEvidence(candidate: EvidenceCandidate) {
  return `- ${candidate.evidence_candidate_id} (${candidate.evidence_role}) for ${candidate.claim_candidate_id}: ${candidate.evidence_summary}`;
}

function formatTension(candidate: TensionCandidate) {
  return `- ${candidate.tension_candidate_id} (${candidate.tension_type}): ${candidate.summary}`;
}

function formatGap(candidate: KnowledgeGapCandidate) {
  return `- ${candidate.knowledge_gap_candidate_id}: ${candidate.summary}; next reading: ${formatList(candidate.suggested_next_reading)}`;
}

function formatPerspectiveDelta(candidate: PerspectiveDeltaCandidate) {
  return `- ${candidate.perspective_delta_candidate_id} (${candidate.delta_type}, ${candidate.promotion_readiness}): ${candidate.proposed_update_summary}`;
}

function formatFollowUpWork(candidate: FollowUpWorkCandidate) {
  return `- ${candidate.follow_up_work_candidate_id}: ${candidate.candidate_title}; files: ${formatList(candidate.suggested_expected_files)}; checks: ${formatList(candidate.suggested_expected_checks)}`;
}

function expectedReturnFields() {
  return [
    "changed files",
    "verification run",
    "skipped checks with concrete reasons",
    "observed outcome",
    "remaining friction",
    "whether selected candidate context was helpful/stale/missing/noisy/misleading",
    "expected vs observed delta summary",
  ];
}

function requiredStopConditions() {
  return [
    "manual preview has no selected source refs",
    "manual preview has no candidate context",
    "expected files/checks are treated as supplied when no follow-up candidate supplied them",
    "source fetching, provider calls, retrieval/RAG, embeddings, vector, FTS, or crawler behavior is requested",
    "DB, proof/evidence, work item, canonical Perspective, or product write is requested",
    "Codex execution, branch creation, PR creation, or GitHub automation is requested from Augnes runtime",
  ];
}

function requiredForbiddenActions() {
  return [
    "Do not execute Codex automatically from this preview.",
    "Do not create branch/PR unless a human explicitly uses the copied prompt as a Codex task.",
    "Do not call GitHub automation from Augnes runtime.",
    "Do not call providers/OpenAI.",
    "Do not fetch sources.",
    "Do not run retrieval/RAG/embeddings/vector/FTS/crawler behavior.",
    "Do not write DB, proof, evidence, work item, or canonical Perspective state.",
    "Do not promote Perspective.",
    "Do not allocate product IDs or execute product writes.",
  ];
}

function authorityBoundaryIsSafe(
  boundary: ResearchCandidateManualNoteHandoffSeedAuthorityBoundary,
) {
  if (
    boundary.candidate_only !== true ||
    boundary.preview_only !== true ||
    boundary.copyable_text_only !== true
  ) {
    return false;
  }

  return [
    boundary.source_of_truth,
    boundary.can_execute_codex,
    boundary.can_create_branch,
    boundary.can_open_pr,
    boundary.can_call_github,
    boundary.can_send_external_handoff,
    boundary.can_call_providers_or_openai,
    boundary.can_fetch_sources,
    boundary.can_run_retrieval_rag_embeddings_vector_fts_or_crawler,
    boundary.can_write_db,
    boundary.can_write_proof_or_evidence,
    boundary.can_create_work_item,
    boundary.can_promote_perspective,
    boundary.can_mutate_committed_augnes_state,
    boundary.can_allocate_product_ids,
    boundary.can_execute_product_write,
  ].every((value) => value === false);
}

function noneWhenEmpty(values: readonly unknown[]) {
  return values.length === 0 ? ["- none supplied"] : [];
}

function listOrNone(values: readonly string[]) {
  return values.length > 0 ? values.map((value) => `- ${value}`) : ["- none supplied"];
}

function formatList(values: readonly string[]) {
  return values.length > 0 ? values.join(", ") : "not supplied";
}

function uniqueSorted(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripGeneratedFields);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as JsonRecord)
      .filter(([key]) => key !== "seed_fingerprint")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]),
  );
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value as JsonRecord)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as JsonRecord)[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
