export const MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_VERSION = "v0.1" as const;
export const MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_KIND =
  "manual_note_promotion_boundary_audit" as const;

export const MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_GATE_IDS = [
  "lifecycle_gate",
  "storage_boundary_gate",
  "authority_boundary_gate",
  "parser_warning_gate",
  "source_reference_gate",
  "claim_candidate_gate",
  "evidence_candidate_gate",
  "tension_gap_gate",
  "follow_up_work_gate",
  "label_metadata_gate",
  "activity_metadata_gate",
  "canonical_link_guard_gate",
] as const;

export type ManualNotePromotionBoundaryAuditGateId =
  (typeof MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_GATE_IDS)[number];

export type ManualNotePromotionBoundaryAuditAuthorityStatement = {
  audit_only: true;
  readiness_is_not_promotion_authority: true;
  ready_for_promotion_discussion_is_not_write_authority: true;
  actual_promotion_allowed: false;
  dry_run_promotion_allowed_by_this_audit: false;
  proof_or_evidence_writes_allowed: false;
  perspective_or_canonical_writes_allowed: false;
  work_item_creation_allowed: false;
  provider_or_retrieval_allowed: false;
  source_fetching_allowed: false;
  external_handoff_allowed: false;
};

export type ManualNotePromotionBoundaryAuditGateRow = {
  gate_id: ManualNotePromotionBoundaryAuditGateId;
  current_gate_purpose: string;
  currently_proves: string[];
  explicitly_does_not_prove: string[];
  future_dry_run_requirement: string[];
  future_actual_write_requirement: string[];
  must_remain_preview_only: true;
  forbidden_shortcuts: string[];
};

export type ManualNotePromotionBoundaryAudit = {
  audit_kind: typeof MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_KIND;
  audit_version: typeof MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_VERSION;
  source_lane: "manual_note_preview_draft_promotion_readiness_preflight";
  source_preflight_statuses: [
    "blocked",
    "needs_operator_review",
    "ready_for_promotion_discussion",
  ];
  source_gate_ids: ManualNotePromotionBoundaryAuditGateId[];
  authority_statement: ManualNotePromotionBoundaryAuditAuthorityStatement;
  gate_audit_rows: ManualNotePromotionBoundaryAuditGateRow[];
  future_dry_run_minimum_boundary: ManualNotePromotionBoundaryRequirement[];
  future_actual_write_minimum_boundary: ManualNotePromotionBoundaryRequirement[];
  required_separate_lanes: ManualNotePromotionBoundaryRequirement[];
  prohibited_in_this_lane: string[];
  next_recommended_slice: "selected_preview_draft_dry_run_promotion_plan";
};

type ManualNotePromotionBoundaryRequirement = {
  requirement_id: string;
  requirement: string;
  reason: string;
};

type ManualNotePromotionBoundaryAuditGateCoverage = {
  passed: boolean;
  expected_gate_ids: ManualNotePromotionBoundaryAuditGateId[];
  observed_gate_ids: string[];
  missing_gate_ids: ManualNotePromotionBoundaryAuditGateId[];
  extra_gate_ids: string[];
  duplicate_gate_ids: string[];
};

const AUTHORITY_STATEMENT: ManualNotePromotionBoundaryAuditAuthorityStatement = {
  audit_only: true,
  readiness_is_not_promotion_authority: true,
  ready_for_promotion_discussion_is_not_write_authority: true,
  actual_promotion_allowed: false,
  dry_run_promotion_allowed_by_this_audit: false,
  proof_or_evidence_writes_allowed: false,
  perspective_or_canonical_writes_allowed: false,
  work_item_creation_allowed: false,
  provider_or_retrieval_allowed: false,
  source_fetching_allowed: false,
  external_handoff_allowed: false,
};

const GATE_AUDIT_ROWS: ManualNotePromotionBoundaryAuditGateRow[] = [
  {
    gate_id: "lifecycle_gate",
    current_gate_purpose: "Separate active preview drafts from discarded preview drafts.",
    currently_proves: [
      "The source preview draft lifecycle is active or discarded.",
      "Discarded preview drafts are blocked from promotion discussion.",
    ],
    explicitly_does_not_prove: [
      "Operator approval has not been granted.",
      "Canonical validity has not been established.",
      "A discarded draft has not been repaired, undiscarded, or promoted.",
    ],
    future_dry_run_requirement: [
      "A selected active preview draft must be named as dry-run input.",
      "The dry-run design must state that lifecycle eligibility is not approval.",
    ],
    future_actual_write_requirement: [
      "A separate authority lane must record an explicit operator promotion decision.",
      "Actual write promotion must reject discarded preview drafts unless a future review lane creates a new selected draft.",
    ],
    must_remain_preview_only: true,
    forbidden_shortcuts: [
      "Treating active lifecycle as approval.",
      "Treating ready_for_promotion_discussion as write authority.",
      "Undiscarding or promoting from this audit lane.",
    ],
  },
  {
    gate_id: "storage_boundary_gate",
    current_gate_purpose: "Confirm bounded parsed preview storage and raw-note non-storage.",
    currently_proves: [
      "The stored preview draft shape is bounded enough for preflight inspection.",
      "Raw note storage is not indicated by the preview draft metadata.",
    ],
    explicitly_does_not_prove: [
      "Source truth has not been verified.",
      "Evidence validity has not been established.",
      "Canonical fitness has not been established.",
    ],
    future_dry_run_requirement: [
      "A dry-run plan must use only bounded preview metadata as input.",
      "Any source/evidence claims must remain candidate-only unless a separate source authority lane verifies them.",
    ],
    future_actual_write_requirement: [
      "Actual write promotion requires a durable source/evidence authority model.",
      "Actual write promotion requires explicit handling for what becomes canonical and what remains candidate context.",
    ],
    must_remain_preview_only: true,
    forbidden_shortcuts: [
      "Promoting parsed JSON because raw note storage is absent.",
      "Creating proof or evidence records from preview metadata.",
      "Changing storage or schema from this audit lane.",
    ],
  },
  {
    gate_id: "authority_boundary_gate",
    current_gate_purpose: "Confirm the current lane remains non-canonical preview authority.",
    currently_proves: [
      "The preflight response reports preview-only authority boundaries.",
      "The current lane has no promotion, proof/evidence, work item, provider, retrieval, or canonical write authority.",
    ],
    explicitly_does_not_prove: [
      "No write authority is granted.",
      "No future promotion contract is approved.",
      "No Core-gated authority has been created.",
    ],
    future_dry_run_requirement: [
      "A dry-run design must have a separate authority contract and a no-write result shape.",
      "The dry-run design must be reviewed as a separate lane before implementation.",
    ],
    future_actual_write_requirement: [
      "Actual write promotion requires a separate promotion authority contract.",
      "Actual write promotion requires explicit operator approval and durable write-gate rules before any canonical write path exists.",
    ],
    must_remain_preview_only: true,
    forbidden_shortcuts: [
      "Treating authority boundary checks as authority grants.",
      "Adding a Promote button.",
      "Adding a promotion or dry-run route in this lane.",
    ],
  },
  {
    gate_id: "parser_warning_gate",
    current_gate_purpose: "Surface deterministic parser warnings before discussion.",
    currently_proves: [
      "The deterministic parser warning list was surfaced.",
      "Critical missing fields can block promotion discussion readiness.",
    ],
    explicitly_does_not_prove: [
      "Missing data has not been resolved.",
      "Provider synthesis is not allowed.",
      "Warnings are not semantic truth.",
    ],
    future_dry_run_requirement: [
      "A dry-run plan must carry parser warnings forward as unresolved candidate context.",
      "Any automated completion or synthesis must remain out of scope unless a future provider lane is explicitly authorized.",
    ],
    future_actual_write_requirement: [
      "Actual write promotion must require operator resolution or explicit carry-forward of parser warnings.",
      "Actual write promotion must not silently fill parser gaps.",
    ],
    must_remain_preview_only: true,
    forbidden_shortcuts: [
      "Resolving warnings by provider call.",
      "Treating warning-free parser output as canonical truth.",
      "Suppressing warnings to pass a promotion gate.",
    ],
  },
  {
    gate_id: "source_reference_gate",
    current_gate_purpose: "Confirm source reference preview metadata is present.",
    currently_proves: [
      "At least one source reference preview can be present for operator review.",
      "The preflight can count source reference metadata.",
    ],
    explicitly_does_not_prove: [
      "Sources have not been fetched.",
      "Sources have not been verified, indexed, or treated as true.",
      "Source URLs or identifiers are not evidence by themselves.",
    ],
    future_dry_run_requirement: [
      "A dry-run plan must distinguish source pointer metadata from verified source material.",
      "Source fetching, indexing, or validation must remain a separate explicitly scoped lane.",
    ],
    future_actual_write_requirement: [
      "Actual write promotion requires a source provenance and verification model.",
      "Actual write promotion must define which source references can support canonical records.",
    ],
    must_remain_preview_only: true,
    forbidden_shortcuts: [
      "Fetching or validating sources from this lane.",
      "Treating source reference presence as source truth.",
      "Creating canonical source records from preview pointers.",
    ],
  },
  {
    gate_id: "claim_candidate_gate",
    current_gate_purpose: "Confirm claim candidates exist for operator review.",
    currently_proves: [
      "Claim candidates were parsed into preview metadata.",
      "The draft has candidate assertions that can be discussed.",
    ],
    explicitly_does_not_prove: [
      "Claims are not proven correct.",
      "Claims are not canonical.",
      "Claims have not been accepted.",
    ],
    future_dry_run_requirement: [
      "A dry-run plan must keep claims in candidate status.",
      "The plan must show how selected claims would be reviewed without writing them.",
    ],
    future_actual_write_requirement: [
      "Actual write promotion requires explicit claim selection and acceptance authority.",
      "Actual write promotion requires canonical target semantics for accepted claims.",
    ],
    must_remain_preview_only: true,
    forbidden_shortcuts: [
      "Promoting all claim candidates by default.",
      "Treating claim existence as acceptance.",
      "Writing canonical claims from this audit.",
    ],
  },
  {
    gate_id: "evidence_candidate_gate",
    current_gate_purpose: "Confirm evidence candidates or source refs are available as preview metadata.",
    currently_proves: [
      "Evidence candidates can be present as candidate support.",
      "Evidence coverage gaps can be surfaced for operator review.",
    ],
    explicitly_does_not_prove: [
      "No proof record has been created.",
      "No evidence record has been created.",
      "Evidence candidates are not verified evidence.",
    ],
    future_dry_run_requirement: [
      "A dry-run plan must keep evidence candidates separate from proof/evidence records.",
      "The plan must list unresolved evidence gaps without writing records.",
    ],
    future_actual_write_requirement: [
      "Actual write promotion requires proof/evidence write authority in a separate lane.",
      "Actual write promotion requires source-backed evidence validation before durable evidence records are written.",
    ],
    must_remain_preview_only: true,
    forbidden_shortcuts: [
      "Creating proof/evidence rows from candidate metadata.",
      "Treating evidence candidates as accepted evidence.",
      "Using readiness as proof authority.",
    ],
  },
  {
    gate_id: "tension_gap_gate",
    current_gate_purpose: "Surface tensions and knowledge gaps for operator review.",
    currently_proves: [
      "Tension and knowledge-gap candidates were surfaced when present.",
      "Uncertainty can remain visible in the preview lane.",
    ],
    explicitly_does_not_prove: [
      "Tensions are not resolved.",
      "Knowledge gaps are not answered.",
      "No follow-up research has been performed.",
    ],
    future_dry_run_requirement: [
      "A dry-run plan must carry unresolved tensions and gaps into its output.",
      "The plan must not convert gaps into claims without a separate research lane.",
    ],
    future_actual_write_requirement: [
      "Actual write promotion requires explicit operator handling for unresolved tensions and gaps.",
      "Actual write promotion must define whether unresolved items block writes or remain non-canonical annotations.",
    ],
    must_remain_preview_only: true,
    forbidden_shortcuts: [
      "Treating warnings as resolved by discussion readiness.",
      "Creating work items to resolve gaps from this lane.",
      "Silently dropping tensions before promotion.",
    ],
  },
  {
    gate_id: "follow_up_work_gate",
    current_gate_purpose: "Surface follow-up work suggestions as candidate metadata.",
    currently_proves: [
      "Follow-up suggestions may exist in the preview draft.",
      "The preflight can warn that follow-up work needs separate review.",
    ],
    explicitly_does_not_prove: [
      "No work item is created.",
      "No assignment, queue entry, or work closure exists.",
      "Suggested work has not been prioritized.",
    ],
    future_dry_run_requirement: [
      "A dry-run plan must keep follow-up suggestions informational.",
      "Any future work-item creation must be proposed as a separate lane.",
    ],
    future_actual_write_requirement: [
      "Actual write promotion must not create work items unless a separate work-item authority lane is approved.",
      "Actual write promotion must separate canonical writes from work planning writes.",
    ],
    must_remain_preview_only: true,
    forbidden_shortcuts: [
      "Creating work items from follow-up suggestions.",
      "Treating follow-up suggestions as assigned work.",
      "Using promotion readiness to close or open work.",
    ],
  },
  {
    gate_id: "label_metadata_gate",
    current_gate_purpose: "Surface operator label presence or absence.",
    currently_proves: [
      "An operator-facing preview label is present or missing.",
      "The label can help humans scan preview drafts.",
    ],
    explicitly_does_not_prove: [
      "The label is not a canonical Perspective title.",
      "The label is not classification authority.",
      "The label is not approval.",
    ],
    future_dry_run_requirement: [
      "A dry-run plan may include the label as display metadata only.",
      "The plan must not map labels to canonical titles without separate authority.",
    ],
    future_actual_write_requirement: [
      "Actual write promotion requires explicit title/name mapping rules before any canonical title is written.",
      "Actual write promotion must distinguish operator labels from canonical identifiers.",
    ],
    must_remain_preview_only: true,
    forbidden_shortcuts: [
      "Using the label as canonical title automatically.",
      "Treating label presence as approval.",
      "Persisting additional label state from this audit.",
    ],
  },
  {
    gate_id: "activity_metadata_gate",
    current_gate_purpose: "Surface preview lifecycle activity metadata.",
    currently_proves: [
      "Preview draft lifecycle events may be available.",
      "Activity metadata can help humans inspect draft history.",
    ],
    explicitly_does_not_prove: [
      "Activity is not approval history.",
      "Activity is not review history.",
      "Activity does not prove correctness or authority.",
    ],
    future_dry_run_requirement: [
      "A dry-run plan may include activity as context only.",
      "The plan must not treat lifecycle events as approval events.",
    ],
    future_actual_write_requirement: [
      "Actual write promotion requires separate approval/review history authority if such history is needed.",
      "Actual write promotion must not infer approval from activity metadata.",
    ],
    must_remain_preview_only: true,
    forbidden_shortcuts: [
      "Treating create/open/label/discard events as approval.",
      "Writing approval history from preview activity.",
      "Adding review workflow creation in this lane.",
    ],
  },
  {
    gate_id: "canonical_link_guard_gate",
    current_gate_purpose: "Confirm preview draft canonical/proof/evidence/work links are absent.",
    currently_proves: [
      "The preview draft has no existing canonical, proof, evidence, work, or promotion links.",
      "The draft appears isolated from durable authority records.",
    ],
    explicitly_does_not_prove: [
      "Setting those links is not authorized.",
      "Canonical targets have not been selected.",
      "No proof/evidence/work records should be inferred.",
    ],
    future_dry_run_requirement: [
      "A dry-run plan must keep proposed link targets hypothetical and non-persistent.",
      "The plan must state that null links remain null during dry-run.",
    ],
    future_actual_write_requirement: [
      "Actual write promotion requires explicit authority to set canonical/proof/evidence/work links.",
      "Actual write promotion requires idempotency, rollback, and review rules for link writes.",
    ],
    must_remain_preview_only: true,
    forbidden_shortcuts: [
      "Setting canonical/proof/evidence/work links from this audit.",
      "Treating null link checks as permission to write links.",
      "Repairing or mutating link fields in this lane.",
    ],
  },
];

const FUTURE_DRY_RUN_MINIMUM_BOUNDARY: ManualNotePromotionBoundaryRequirement[] = [
  {
    requirement_id: "selected_preview_draft_input",
    requirement:
      "Name one selected active preview draft and carry its readiness result as candidate input only.",
    reason:
      "A dry-run must be scoped to a concrete preview draft without turning readiness into write authority.",
  },
  {
    requirement_id: "no_write_result_contract",
    requirement:
      "Define a dry-run output contract that produces a plan, diff preview, or blocked reason without writing records.",
    reason:
      "Dry-run output must remain inspectable and non-authoritative before any actual promotion design exists.",
  },
  {
    requirement_id: "source_and_evidence_boundary",
    requirement:
      "State which source and evidence fields are unverified candidate metadata and which future lane would verify them.",
    reason:
      "Current readiness gates do not fetch, verify, index, or accept sources and evidence.",
  },
  {
    requirement_id: "explicit_forbidden_writes",
    requirement:
      "Carry forward explicit prohibitions on proof/evidence writes, Perspective/canonical writes, work item creation, provider calls, retrieval, source fetching, and external handoff sending.",
    reason:
      "The first dry-run plan must not create a concealed promotion path.",
  },
];

const FUTURE_ACTUAL_WRITE_MINIMUM_BOUNDARY: ManualNotePromotionBoundaryRequirement[] = [
  {
    requirement_id: "operator_promotion_decision",
    requirement:
      "Require explicit operator approval for the selected preview draft, selected candidates, and selected canonical targets.",
    reason:
      "Ready for promotion discussion is not approval and cannot choose write targets.",
  },
  {
    requirement_id: "durable_write_contract",
    requirement:
      "Define the exact durable writes, idempotency keys, rollback behavior, and review evidence before implementation.",
    reason:
      "Actual promotion writes must be reviewable, repeat-safe, and bounded before any write path exists.",
  },
  {
    requirement_id: "source_evidence_authority_model",
    requirement:
      "Define source provenance, evidence validity, proof/evidence write authority, and canonical acceptance rules.",
    reason:
      "Current preview metadata does not prove truth, evidence validity, or canonical fitness.",
  },
  {
    requirement_id: "core_gated_promotion_lane",
    requirement:
      "Implement any actual write promotion only in a separate Core-gated lane with explicit preserved authority boundaries.",
    reason:
      "This audit artifact is not a write lane and must not become one by accumulation.",
  },
];

const REQUIRED_SEPARATE_LANES: ManualNotePromotionBoundaryRequirement[] = [
  {
    requirement_id: "dry_run_promotion_plan",
    requirement: "Selected preview draft dry-run promotion plan.",
    reason:
      "A plan can map candidate inputs and blocked writes without creating a route or writing records.",
  },
  {
    requirement_id: "source_verification_lane",
    requirement: "Bounded source verification or source fetching lane.",
    reason:
      "Source reference presence does not prove source truth and fetching is forbidden here.",
  },
  {
    requirement_id: "proof_evidence_write_lane",
    requirement: "Proof/evidence write authority lane.",
    reason:
      "Evidence candidates are not proof/evidence records and must not be promoted implicitly.",
  },
  {
    requirement_id: "canonical_perspective_write_lane",
    requirement: "Canonical Perspective write and graph-linking lane.",
    reason:
      "Perspective/canonical writes require separate authority, idempotency, and rollback design.",
  },
  {
    requirement_id: "work_item_creation_lane",
    requirement: "Work item creation lane.",
    reason:
      "Follow-up work suggestions are candidate metadata only.",
  },
  {
    requirement_id: "provider_retrieval_lane",
    requirement: "Provider, extraction, retrieval, or indexing lane.",
    reason:
      "Parser gaps and source refs cannot be filled by provider or retrieval behavior from this audit.",
  },
];

const PROHIBITED_IN_THIS_LANE = [
  "actual promotion",
  "promotion dry-run route",
  "UI promotion action",
  "proof/evidence write",
  "Perspective promotion",
  "canonical graph write",
  "work item creation",
  "provider/OpenAI call",
  "retrieval/RAG/source fetching",
  "external handoff/email/slack/webhook/share",
  "browser persistence",
  "packet/checklist persistence",
  "schema or migration code change",
  "new top-level state machine",
];

export function buildManualNotePromotionBoundaryAudit(): ManualNotePromotionBoundaryAudit {
  return {
    audit_kind: MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_KIND,
    audit_version: MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_VERSION,
    source_lane: "manual_note_preview_draft_promotion_readiness_preflight",
    source_preflight_statuses: [
      "blocked",
      "needs_operator_review",
      "ready_for_promotion_discussion",
    ],
    source_gate_ids: [...MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_GATE_IDS],
    authority_statement: { ...AUTHORITY_STATEMENT },
    gate_audit_rows: GATE_AUDIT_ROWS.map(copyGateAuditRow),
    future_dry_run_minimum_boundary: FUTURE_DRY_RUN_MINIMUM_BOUNDARY.map(
      copyRequirement,
    ),
    future_actual_write_minimum_boundary:
      FUTURE_ACTUAL_WRITE_MINIMUM_BOUNDARY.map(copyRequirement),
    required_separate_lanes: REQUIRED_SEPARATE_LANES.map(copyRequirement),
    prohibited_in_this_lane: [...PROHIBITED_IN_THIS_LANE],
    next_recommended_slice: "selected_preview_draft_dry_run_promotion_plan",
  };
}

export function assertManualNotePromotionBoundaryAuditGateCoverage(
  readinessGateIds: readonly string[],
): ManualNotePromotionBoundaryAuditGateCoverage {
  const expectedGateIds = [...MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_GATE_IDS];
  const observedGateIds = [...readinessGateIds];
  const observedGateIdSet = new Set(observedGateIds);
  const missingGateIds = expectedGateIds.filter(
    (gateId) => !observedGateIdSet.has(gateId),
  );
  const expectedGateIdSet = new Set<string>(expectedGateIds);
  const extraGateIds = observedGateIds.filter(
    (gateId) => !expectedGateIdSet.has(gateId),
  );
  const duplicateGateIds = observedGateIds.filter(
    (gateId, index) => observedGateIds.indexOf(gateId) !== index,
  );
  const result = {
    passed:
      missingGateIds.length === 0 &&
      extraGateIds.length === 0 &&
      duplicateGateIds.length === 0,
    expected_gate_ids: expectedGateIds,
    observed_gate_ids: observedGateIds,
    missing_gate_ids: missingGateIds,
    extra_gate_ids: extraGateIds,
    duplicate_gate_ids: duplicateGateIds,
  };

  if (!result.passed) {
    throw new Error(
      [
        "Manual note promotion boundary audit gate coverage mismatch.",
        `Missing: ${missingGateIds.join(", ") || "none"}.`,
        `Extra: ${extraGateIds.join(", ") || "none"}.`,
        `Duplicate: ${duplicateGateIds.join(", ") || "none"}.`,
      ].join(" "),
    );
  }

  return result;
}

function copyGateAuditRow(
  row: ManualNotePromotionBoundaryAuditGateRow,
): ManualNotePromotionBoundaryAuditGateRow {
  return {
    ...row,
    currently_proves: [...row.currently_proves],
    explicitly_does_not_prove: [...row.explicitly_does_not_prove],
    future_dry_run_requirement: [...row.future_dry_run_requirement],
    future_actual_write_requirement: [...row.future_actual_write_requirement],
    forbidden_shortcuts: [...row.forbidden_shortcuts],
  };
}

function copyRequirement(
  requirement: ManualNotePromotionBoundaryRequirement,
): ManualNotePromotionBoundaryRequirement {
  return { ...requirement };
}
