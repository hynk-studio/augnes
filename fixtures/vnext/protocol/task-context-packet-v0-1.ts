import type { AgWorkResumePacketV02 } from "@/lib/ag-work-resume-packet";
import type { WorkBrief } from "@/lib/work";
import type { TaskContextPacketBuilderInputV01 } from "@/lib/vnext/task-context-packet";
import {
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";
import {
  CURRENT_WORKING_PERSPECTIVE_VERSION,
  type CurrentWorkingPerspective,
} from "@/types/current-working-perspective";
import {
  HANDOFF_CAPSULE_VERSION,
  type HandoffCapsule,
} from "@/types/handoff-capsule";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT =
  "2026-07-10T00:00:00.000Z";
export const TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT =
  "2026-07-10T01:00:00.000Z";
export const TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT =
  "2026-07-11T00:00:00.000Z";

export const legacyScopeExternalRefFixture = {
  ref_version: EXTERNAL_REF_VERSION_V01,
  ref_type: "legacy_scope",
  external_id: "project:augnes",
  observed_at: TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
  trust_class: "direct_local_observation",
  source_ref: "WorkBrief.scope",
  compatibility_namespace: "augnes.work_brief",
} satisfies ExternalRefV01;

export const legacyWorkBriefFixture = {
  runtime: "augnes",
  scope: "project:augnes",
  work_id: "AG-VNEXT-001",
  as_of: "2026-07-09T23:45:00.000Z",
  framing: {
    work_id: "Trace anchor only; not canonical project state.",
    state_authority: "Durable state authority remains Augnes committed state.",
    execution_proof:
      "Action records remain proof and are not promoted to Evidence.",
    temporal_proof: "Temporal State Graph remains proof over time.",
  },
  work: {
    work_id: "AG-VNEXT-001",
    scope: "project:augnes",
    title: "Add provider-neutral task context compatibility",
    status: "in_progress",
    priority: "now",
    summary:
      "Normalize existing read-only work context into a provider-neutral packet.",
    next_action: "Build and validate the bounded compatibility packet.",
    user_attention_required: false,
    related_state_keys: [
      "coordination.vnext.task_context",
      "perspective.current_working_projection",
    ],
    links: {
      docs: ["docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md"],
    },
    created_at: "2026-07-09T23:00:00.000Z",
    updated_at: "2026-07-09T23:45:00.000Z",
  },
  next_action: "Build and validate the bounded compatibility packet.",
  user_attention_required: false,
  recent_events: [
    {
      id: "work-event:vnext-context-investigation",
      work_id: "AG-VNEXT-001",
      scope: "project:augnes",
      actor: "user",
      event_type: "note",
      summary: "Requested the first provider-neutral protocol slice.",
      result_status: null,
      result_kind: null,
      related_action_id: "action:vnext-context-proof-only",
      related_pr: null,
      related_state_keys: ["coordination.vnext.task_context"],
      created_at: "2026-07-09T23:30:00.000Z",
    },
  ],
  coordination_events: [],
  related_state_keys: [
    "coordination.vnext.task_context",
    "perspective.current_working_projection",
  ],
  related_proof: {
    action_ids: ["action:vnext-context-proof-only"],
    action_records: [
      {
        id: "action:vnext-context-proof-only",
        title: "Read-only compatibility investigation",
        status: "completed",
        state_key: null,
        proof_marker_type: "proof_only",
        linked_work_event_ids: ["work-event:vnext-context-investigation"],
        created_at: "2026-07-09T23:30:00.000Z",
      },
    ],
    prs: ["https://github.com/hynk-studio/augnes/pull/fixture"],
    docs: ["docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md"],
    links: {},
    note: "Proof-only action refs remain proof refs, not Evidence.",
  },
  codex_handoff: {
    task_brief:
      "Add a provider-neutral TaskContextPacket compatibility boundary without changing existing workflows.",
    constraints: [
      "Keep the packet read-only and non-authoritative.",
      "Do not infer canonical project identity from the legacy scope.",
    ],
    suggested_verification: [
      "npm run test:vnext-protocol",
      "npm run typecheck",
    ],
    work_event_template: {
      work_id: "AG-VNEXT-001",
      scope: "project:augnes",
      actor: "codex",
      event_type: "verification",
      summary: "Summarize protocol conformance results.",
      related_action_id: null,
      related_pr: null,
      related_state_keys: ["coordination.vnext.task_context"],
    },
  },
} satisfies WorkBrief;

const projectionSourceRefs = {
  state_delta_proposal_ids: [],
  work_event_ids: ["work-event:vnext-context-investigation"],
  coordination_event_ids: [],
  action_record_ids: ["action:vnext-context-proof-only"],
  evidence_record_ids: [],
  dogfooding_record_ids: [],
  handoff_refs: ["handoff:vnext-context"],
  codex_result_refs: [],
  snapshot_refs: [],
  diagnostic_refs: [],
};

const projectionSourceCounts = {
  state_delta_proposals: 0,
  work_events: 1,
  coordination_events: 0,
  action_records: 1,
  evidence_records: 0,
  dogfooding_records: 0,
  handoff_traces: 1,
  codex_result_traces: 0,
  snapshot_refs: 0,
  diagnostic_refs: 0,
  total_projected_deltas: 0,
  total_batches: 0,
  total_gaps: 1,
};

const cwpAuthorityBoundary = {
  source_of_truth:
    "Existing committed Augnes records remain authoritative; this is a projection.",
  can_commit_or_reject_state: false,
  can_record_proof: false,
  can_create_evidence: false,
  can_update_work: false,
  can_mutate_memory: false,
  can_apply_project_perspective: false,
  can_publish_external: false,
  can_merge: false,
  can_retry_replay_deploy: false,
  can_call_github: false,
  can_call_openai_or_provider: false,
  can_execute_codex: false,
  can_create_branch_or_pr: false,
  notes: ["Current Working Perspective remains a derived read-only projection."],
  derived_view_only: true,
  can_write_db: false,
  can_add_route: false,
  can_add_ui: false,
} satisfies CurrentWorkingPerspective["authority_boundary"];

export const legacyCurrentWorkingPerspectiveFixture = {
  runtime: "augnes",
  perspective_version: CURRENT_WORKING_PERSPECTIVE_VERSION,
  projection_version: "augnes_delta_projection.v0.1",
  snapshot_version: "perspective_snapshot.v0.1",
  scope: "project:augnes",
  as_of: "2026-07-09T23:40:00.000Z",
  current_frame: {
    summary: "The vNext protocol foundation is the active bounded work frame.",
    primary_state_keys: ["coordination.vnext.task_context"],
    active_work_ids: ["AG-VNEXT-001"],
    pressure_level: "medium",
    source_refs: ["state:coordination.vnext.task_context"],
    non_authority_notes: ["Frame is projected context, not accepted state."],
  },
  current_thesis: {
    summary: "A stable compatibility packet can precede execution adapters.",
    supporting_points: [
      "Existing read-only assets already carry bounded context.",
      "Canonical identity must be supplied explicitly.",
    ],
    source_refs: ["docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md"],
    confidence: "bounded_read_model",
    non_authority_notes: ["Thesis is a projection and may be revised."],
  },
  active_goals: [
    {
      goal_id: "goal:vnext-task-context",
      title: "Validate the provider-neutral packet contract",
      status: "active",
      priority: "now",
      summary: "Map existing read-only context without granting authority.",
      next_action: "Run protocol conformance.",
      source_refs: ["work:AG-VNEXT-001"],
      user_attention_required: false,
    },
  ],
  accepted_assumptions: [],
  rejected_assumptions: [],
  open_questions: [
    {
      question_id: "question:future-run-receipt",
      summary: "Which later adapter should consume the return contract?",
      severity: "low",
      source_refs: ["docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md"],
      suggested_review_path: "Defer to a later bounded protocol slice.",
    },
  ],
  active_risks: [
    {
      risk_id: "risk:legacy-identity-promotion",
      summary: "Legacy scope could be mistaken for canonical project identity.",
      severity: "high",
      source_refs: ["WorkBrief.scope"],
      blocked_authority_notes: [
        "Canonical workspace_id and project_id must be caller supplied.",
      ],
    },
  ],
  research_pressure: {
    pressure_level: "low",
    pending_proposal_count: 0,
    projection_gap_count: 1,
    diagnostic_refs: [],
    notes: ["No live research diagnostic is required for this fixture."],
    non_authority_notes: ["Research pressure is advisory only."],
  },
  next_candidates: [],
  last_major_delta_refs: [],
  review_queue_hints: {
    needs_review_delta_ids: [],
    blocked_delta_ids: [],
    manual_review_delta_ids: [],
    validation_required_delta_ids: [],
    project_perspective_review_delta_ids: [],
    durable_memory_review_delta_ids: [],
    user_decision_delta_ids: [],
    notes: ["No projected delta is promoted by this fixture."],
  },
  source_refs: {
    perspective_snapshot: {
      snapshot_version: "perspective_snapshot.v0.1",
      as_of: "2026-07-09T23:35:00.000Z",
      source_refs: {
        state_brief_as_of: "2026-07-09T23:35:00.000Z",
        state_entry_ids: ["state:coordination.vnext.task_context"],
        pending_proposal_ids: [],
        evidence_ids: [],
        work_ids: ["AG-VNEXT-001"],
        work_event_ids: ["work-event:vnext-context-investigation"],
        action_record_ids: ["action:vnext-context-proof-only"],
        tension_ids: [],
        execution_lane_ids: [],
      },
    },
    delta_projection: {
      projection_version: "augnes_delta_projection.v0.1",
      as_of: "2026-07-09T23:40:00.000Z",
      source_refs: projectionSourceRefs,
      source_counts: projectionSourceCounts,
      delta_ids: [],
      batch_ids: [],
      gap_codes: ["missing_success_criteria"],
    },
    snapshot_refs: [],
    diagnostic_refs: [],
    project_constellation_refs: [],
  },
  staleness: {
    status: "partial",
    snapshot_as_of: "2026-07-09T23:35:00.000Z",
    projection_as_of: "2026-07-09T23:40:00.000Z",
    freshness_notes: ["Projection is current to its explicit as_of time."],
    source_gap_codes: ["missing_success_criteria"],
  },
  gaps: [
    {
      code: "missing_success_criteria",
      severity: "medium",
      summary: "Work Brief does not define explicit success criteria.",
      source_refs: ["WorkBrief.codex_handoff"],
    },
  ],
  authority_boundary: cwpAuthorityBoundary,
  next_phase_notes: ["Do not promote this projection into accepted state."],
} satisfies CurrentWorkingPerspective;

const handoffAuthorityBoundary = {
  source_of_truth: false,
  can_commit_or_reject_state: false,
  can_record_proof: false,
  can_create_evidence: false,
  can_update_work: false,
  can_mutate_memory: false,
  can_apply_project_perspective: false,
  can_publish_external: false,
  can_merge: false,
  can_retry_replay_deploy: false,
  can_call_github: false,
  can_call_openai_or_provider: false,
  can_execute_codex: false,
  can_create_branch_or_pr: false,
  can_send_handoff: false,
  can_launch_codex: false,
  can_launch_autonomy: false,
  can_create_mcp_tool: false,
  can_create_ui_action: false,
  can_post_external_comment: false,
  notes: ["Capsule is bounded transfer context only."],
} satisfies HandoffCapsule["authority_boundary"];

const handoffSourceRefs = {
  guide_brief_ref: "guide-brief:vnext-context",
  current_working_perspective_ref: "cwp:vnext-context",
  delta_projection_ref: "delta-projection:vnext-context",
  workplane_ref: "workplane:vnext-context",
  perspective_snapshot_refs: ["snapshot:vnext-context"],
  delta_ids: [],
  batch_ids: [],
  evidence_refs: [],
  artifact_refs: ["artifact:vnext-protocol-doc"],
  handoff_refs: ["handoff:vnext-context"],
  diagnostic_refs: [],
  route_refs: [],
  docs_refs: ["docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md"],
  repo_refs: ["repo:hynk-studio/augnes"],
};

export const legacyHandoffCapsuleFixture = {
  runtime: "augnes",
  capsule_version: HANDOFF_CAPSULE_VERSION,
  scope: "project:augnes",
  capsule_id: "handoff:vnext-context",
  created_at: "2026-07-09T23:50:00.000Z",
  source_guide_brief_ref: "guide-brief:vnext-context",
  source_snapshot_refs: ["snapshot:vnext-context"],
  target_surface: "future_agent_handoff",
  target_actor: "future_agent",
  handoff_intent: "implementation_preparation",
  status: "preview_only",
  title: "Provider-neutral task context handoff",
  summary: "Transfer only the bounded context needed for protocol validation.",
  thesis: "The compatibility mapping must stay read-only and deterministic.",
  observed_context: [
    {
      context_id: "observation:explicit-project-identity",
      kind: "protocol_requirement",
      summary: "workspace_id and project_id are explicit caller inputs.",
      source_refs: ["docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md"],
      related_delta_ids: [],
      confidence: "observed",
      notes: [],
    },
  ],
  inferred_context: [],
  suggested_context: [],
  needs_user_judgment: [],
  source_refs: handoffSourceRefs,
  selected_delta_refs: [],
  evidence_refs: [],
  artifact_refs: ["artifact:vnext-protocol-doc"],
  diagnostic_refs: [],
  constraints: {
    allowed_change_scope: ["types/vnext", "lib/vnext", "fixtures/vnext", "scripts"],
    boundary_notes: ["Read-only protocol mapping only."],
    skipped_check_policy: ["Report every skipped check with a concrete reason."],
    public_safety: ["Do not include secrets, raw transcripts, or hidden reasoning."],
    non_goals: [
      "No provider calls.",
      "No database writes.",
      "No execution adapter.",
    ],
  },
  forbidden_actions: [
    "Call a provider.",
    "Mutate canonical project state.",
    "Write a database record.",
  ],
  expected_inputs: ["WorkBrief", "CurrentWorkingPerspective"],
  expected_outputs: ["Validated TaskContextPacket"],
  validation_expectations: {
    required_checks: ["npm run test:vnext-protocol", "npm run typecheck"],
    optional_checks: [],
    skipped_check_policy: ["Browser checks are unnecessary for a non-UI slice."],
    success_criteria: [
      "Generic host input validates without vendor-specific Core fields.",
      "Identical normalized input produces an identical fingerprint.",
      "Legacy scope remains compatibility metadata.",
    ],
  },
  staleness: {
    status: "fresh",
    as_of: "2026-07-09T23:50:00.000Z",
    warnings: [],
    refresh_suggestion: "Rebuild only from explicitly supplied source timestamps.",
  },
  authority_boundary: handoffAuthorityBoundary,
  target_rendering: {
    primary_sections: ["task", "context", "constraints", "return_contract"],
    preserve_separation: true,
    compact_summary: "Bounded provider-neutral compatibility context.",
    copy_behavior: "manual_copy_only",
    action_controls: false,
    notes: ["Rendering does not grant execution authority."],
  },
  gaps: [],
  next_phase_notes: ["A later slice may define a RunReceipt."],
  public_safety: {
    fixture_kind: "synthetic_sample",
    contains_private_conversations: false,
    contains_hidden_reasoning: false,
    contains_local_private_paths: false,
    contains_secrets: false,
    contains_tokens: false,
    contains_raw_provider_output: false,
    contains_raw_retrieval_output: false,
    contains_real_account_artifacts: false,
    notes: ["Synthetic public-safe conformance fixture."],
  },
} satisfies HandoffCapsule;

export const legacyAgWorkResumePacketFixture = {
  schema: "augnes.ag_work_resume_packet.v0_2",
  packet_kind: "ag_work_resume_packet",
  packet_id: "resume-packet:preview:project-augnes:AG-VNEXT-001",
  created_at: "2026-07-09T23:55:00.000Z",
  expires_at: null,
  issuer: {
    runtime: "augnes",
    runtime_instance_id: "runtime-instance:vnext-fixture",
    source_local_label: "vnext-fixture",
    created_by_surface: "protocol_conformance",
    export_event_id: null,
  },
  integrity: {
    canonicalization: "augnes-json-c14n-v0_1",
    payload_hash: "sha256:fixture-payload",
    redaction_report_hash: "sha256:fixture-redaction",
    signature: null,
  },
  source_work: {
    scope: "project:augnes",
    work_id: "AG-VNEXT-001",
    title: "Add provider-neutral task context compatibility",
    status: "in_progress",
    priority: "now",
    summary: "Bounded read-only protocol compatibility.",
    next_action: "Run protocol conformance.",
    related_state_keys: ["coordination.vnext.task_context"],
  },
  git: {
    remote: "https://github.com/hynk-studio/augnes.git",
    base_branch: "main",
    base_commit: "fixture-base",
    working_branch: "fixture-branch",
    head_commit: "fixture-head",
    related_pr: null,
    dirty_worktree: false,
  },
  handoff: {
    handoff_id: "handoff:vnext-context",
    status: "preview_only",
    expected_files: ["types/vnext/task-context-packet.ts"],
    expected_checks: ["npm run test:vnext-protocol"],
    expected_execution_surfaces: [],
    forbidden_surfaces: ["database writes", "provider calls"],
    stop_conditions: ["Canonical project identity is missing."],
    safety_boundaries: ["Resume material remains compatibility context."],
  },
  continuity: {
    recent_work_events: [
      {
        id: "work-event:vnext-context-investigation",
        actor: "user",
        event_type: "note",
        summary: "Requested provider-neutral compatibility.",
        result_status: null,
        result_kind: null,
        related_pr: null,
        related_state_keys: ["coordination.vnext.task_context"],
        created_at: "2026-07-09T23:30:00.000Z",
      },
    ],
    foreign_action_refs: [
      {
        id: "action:vnext-context-proof-only",
        title: "Read-only investigation",
        status: "completed",
        proof_marker_type: "proof_only",
        created_at: "2026-07-09T23:30:00.000Z",
        ref_kind: "foreign_action_ref",
      },
    ],
    foreign_evidence_refs: [],
    foreign_session_refs: [],
    foreign_evidence_pack_ref: null,
    proof_marker_note: "state_key:null action records are proof-only",
  },
  target_runtime_policy: {
    preview_only_by_default: true,
    may_map_to_existing_local_work_item: "requires explicit user/Core approval",
    may_create_local_work_item: false,
    may_record_evidence:
      "requires explicit user/Core approval and known local work_id",
    may_record_proof:
      "requires explicit user/Core approval and known local work_id",
    may_bind_session: false,
    may_commit_or_reject_state: false,
    may_execute_codex: false,
    may_merge: false,
    may_publish_or_replay: false,
  },
  redaction: {
    raw_db_paths_included: false,
    secrets_included: false,
    tunnel_urls_included: false,
    local_absolute_paths_included: false,
    screenshots_or_media_included: false,
    raw_openai_responses_included: false,
    notes: [],
  },
  bounds: {
    max_recent_work_events: 10,
    max_foreign_evidence_refs: 20,
    summaries_only: true,
    raw_logs_included: false,
  },
} satisfies AgWorkResumePacketV02;

export const openAiExternalRefsFixture = [
  {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: "chat_project",
    external_id: "chat-project:fixture-001",
    provider: "openai",
    host: "chatgpt",
    observed_at: TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
    trust_class: "host_attestation",
    compatibility_namespace: "reference_adapter.chat_project",
  },
  {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: "worker_session",
    external_id: "worker-session:fixture-001",
    provider: "openai",
    host: "codex",
    observed_at: TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
    trust_class: "host_attestation",
    compatibility_namespace: "reference_adapter.worker_session",
  },
] satisfies ExternalRefV01[];

export const genericCliHostExternalRefFixture = {
  ref_version: EXTERNAL_REF_VERSION_V01,
  ref_type: "host_process",
  external_id: "host-process:local-shell-001",
  host: "local-shell",
  observed_at: TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
  trust_class: "direct_local_observation",
  compatibility_namespace: "generic_cli.host",
} satisfies ExternalRefV01;

export const genericCliWorkerExternalRefFixture = {
  ref_version: EXTERNAL_REF_VERSION_V01,
  ref_type: "worker_process",
  external_id: "worker-process:portable-001",
  host: "local-shell",
  observed_at: TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
  trust_class: "direct_local_observation",
  compatibility_namespace: "generic_cli.worker",
} satisfies ExternalRefV01;

export const genericCliBuilderInputFixture = {
  workspace_id: "workspace-portable-fixture",
  project_id: "project-portable-fixture",
  work_ref: genericCliWorkerExternalRefFixture,
  generated_at: TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
  expires_at: TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT,
  task: {
    goal: "Validate a portable command-line task context.",
    success_criteria: ["The bounded output passes local verification."],
    non_goals: ["No external publication."],
  },
  current_projection: null,
  selected_context: [
    {
      entry_id: "context:portable-manifest",
      entry_kind: "artifact_ref",
      source_ref: "artifact:portable-manifest",
      external_ref: genericCliHostExternalRefFixture,
      why_included: "The local manifest defines the bounded task input.",
      currentness: {
        status: "fresh",
        as_of: TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
        basis: "Direct local observation at the explicit generation time.",
        source_ref: genericCliHostExternalRefFixture,
      },
      trust_class: "direct_local_observation",
      compatibility_source_ref: genericCliHostExternalRefFixture,
      bounded_summary: "Portable local task manifest.",
    },
  ],
  excluded_context: [],
  tensions: [],
  risks: [],
  gaps: [
    {
      code: "missing_current_projection",
      summary: "This portable task has no current perspective projection.",
      severity: "low",
      missing_fields: ["current_projection"],
      source_refs: ["artifact:portable-manifest"],
      external_refs: [],
    },
  ],
  constraints: {
    required_checks: ["verify-portable-output"],
    forbidden_actions: ["Publish externally without explicit authority."],
    data_classification: "local_only",
    context_budget: {
      max_selected_entries: 8,
      max_projection_items: 8,
      max_characters: 50_000,
      max_estimated_tokens: 12_500,
    },
  },
  capability_grant: null,
  return_contract: {
    return_kind: "bounded_result",
    required_fields: ["status", "summary"],
    expected_artifacts: [],
    required_checks: ["verify-portable-output"],
    return_ref: genericCliWorkerExternalRefFixture,
    compatibility_only: false,
  },
  source_status: {
    status: "complete",
    currentness: {
      status: "fresh",
      as_of: TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
      basis: "All declared local sources were observed explicitly.",
      source_ref: genericCliHostExternalRefFixture,
    },
    source_refs: ["artifact:portable-manifest"],
    external_refs: [
      genericCliHostExternalRefFixture,
      genericCliWorkerExternalRefFixture,
    ],
    warnings: [],
  },
  compatibility: {
    source_contracts: ["generic_cli.task_input.v0.1"],
    legacy_scope_ref: null,
    source_refs: [
      genericCliHostExternalRefFixture,
      genericCliWorkerExternalRefFixture,
    ],
    unmapped_fields: [],
    warnings: [],
  },
  authority_notes: ["Portable host and worker references are noncanonical."],
} satisfies TaskContextPacketBuilderInputV01;

export type InvalidTaskContextPacketFixtureCase = {
  name: string;
  expected_status: "invalid" | "blocked";
  expected_error_codes: string[];
  mutate: (packet: TaskContextPacketV01) => unknown;
};

function mutablePacketClone(packet: TaskContextPacketV01) {
  return JSON.parse(JSON.stringify(packet)) as TaskContextPacketV01 &
    Record<string, unknown>;
}

export function missingWorkspaceIdPacket(
  packet: TaskContextPacketV01,
): unknown {
  const invalid = mutablePacketClone(packet);
  delete (invalid as Record<string, unknown>).workspace_id;
  return invalid;
}

export function missingProjectIdPacket(packet: TaskContextPacketV01): unknown {
  const invalid = mutablePacketClone(packet);
  delete (invalid as Record<string, unknown>).project_id;
  return invalid;
}

export function expiredPacket(packet: TaskContextPacketV01): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.expires_at = "2026-07-10T00:30:00.000Z";
  return invalid;
}

export function unknownProtocolVersionPacket(
  packet: TaskContextPacketV01,
): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.packet_version = "task_context_packet.v9.9" as never;
  return invalid;
}

export function conflictingDuplicateExternalRefPacket(
  packet: TaskContextPacketV01,
): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.compatibility.source_refs.push(
    {
      ref_version: EXTERNAL_REF_VERSION_V01,
      ref_type: "legacy_handoff",
      external_id: "handoff:conflict-fixture",
      provider: "provider-a",
      trust_class: "verified_external_observation",
      compatibility_namespace: "legacy.handoff",
    },
    {
      ref_version: EXTERNAL_REF_VERSION_V01,
      ref_type: "legacy_handoff",
      external_id: "handoff:conflict-fixture",
      provider: "provider-b",
      trust_class: "imported_unverified",
      compatibility_namespace: "legacy.handoff",
    },
  );
  return invalid;
}

export function conflictingDuplicateExternalRefTrustPacket(
  packet: TaskContextPacketV01,
): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.compatibility.source_refs.push(
    {
      ref_version: EXTERNAL_REF_VERSION_V01,
      ref_type: "worker_session",
      external_id: "session:trust-conflict-fixture",
      provider: "generic-cli",
      host: "local-shell",
      trust_class: "host_attestation",
    },
    {
      ref_version: EXTERNAL_REF_VERSION_V01,
      ref_type: "worker_session",
      external_id: "session:trust-conflict-fixture",
      provider: "generic-cli",
      host: "local-shell",
      trust_class: "imported_unverified",
    },
  );
  return invalid;
}

export function secretShapedValuePacket(packet: TaskContextPacketV01): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.compatibility.warnings.push("OPENAI_API_KEY=sk-proj-fixture-secret");
  return invalid;
}

export function secretShapedFieldPacket(packet: TaskContextPacketV01): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.secret_value = "redacted-fixture-placeholder";
  return invalid;
}

export function rawTranscriptFieldPacket(packet: TaskContextPacketV01): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.raw_transcript = "synthetic transcript-shaped material";
  return invalid;
}

export function hiddenReasoningFieldPacket(packet: TaskContextPacketV01): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.hidden_reasoning = "synthetic reasoning-shaped material";
  return invalid;
}

export function malformedFreshnessPacket(packet: TaskContextPacketV01): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.selected_context[0].currentness = {
    status: "fresh",
    as_of: "not-a-timestamp",
    basis: "Malformed fixture currentness.",
    source_ref: null,
  };
  return invalid;
}

export function malformedSourceStatusPacket(
  packet: TaskContextPacketV01,
): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.source_status.status = "authoritative" as never;
  return invalid;
}

export function invalidFingerprintPacket(packet: TaskContextPacketV01): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.integrity.fingerprint = `sha256:${"0".repeat(64)}`;
  return invalid;
}

export function providerSpecificCoreFieldPacket(
  packet: TaskContextPacketV01,
): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.openai = { project_id: "native-project-fixture" };
  return invalid;
}

export function authorityEscalationFieldPacket(
  packet: TaskContextPacketV01,
): unknown {
  const invalid = mutablePacketClone(packet);
  (invalid.authority_summary as unknown as Record<string, unknown>).merge_approval =
    true;
  return invalid;
}

export function malformedBudgetPacket(packet: TaskContextPacketV01): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.constraints.context_budget.estimated_tokens = "bogus" as never;
  invalid.constraints.context_budget.max_estimated_tokens = "bogus" as never;
  return invalid;
}

export function impossibleCalendarTimestampPacket(
  packet: TaskContextPacketV01,
): unknown {
  const invalid = mutablePacketClone(packet);
  invalid.generated_at = "2026-02-30T00:00:00Z";
  return invalid;
}

export const invalidTaskContextPacketFixtureCases = [
  {
    name: "missing_workspace_id",
    expected_status: "invalid",
    expected_error_codes: ["workspace_id_missing"],
    mutate: missingWorkspaceIdPacket,
  },
  {
    name: "missing_project_id",
    expected_status: "invalid",
    expected_error_codes: ["project_id_missing"],
    mutate: missingProjectIdPacket,
  },
  {
    name: "expired_packet",
    expected_status: "blocked",
    expected_error_codes: ["packet_expired"],
    mutate: expiredPacket,
  },
  {
    name: "unknown_protocol_version",
    expected_status: "blocked",
    expected_error_codes: ["unsupported_protocol_version"],
    mutate: unknownProtocolVersionPacket,
  },
  {
    name: "conflicting_duplicate_external_ref",
    expected_status: "blocked",
    expected_error_codes: ["duplicate_conflicting_external_ref"],
    mutate: conflictingDuplicateExternalRefPacket,
  },
  {
    name: "conflicting_duplicate_external_ref_trust",
    expected_status: "blocked",
    expected_error_codes: ["duplicate_conflicting_external_ref"],
    mutate: conflictingDuplicateExternalRefTrustPacket,
  },
  {
    name: "secret_shaped_value",
    expected_status: "blocked",
    expected_error_codes: ["secret_shaped_material"],
    mutate: secretShapedValuePacket,
  },
  {
    name: "secret_shaped_field",
    expected_status: "blocked",
    expected_error_codes: ["secret_shaped_field"],
    mutate: secretShapedFieldPacket,
  },
  {
    name: "raw_transcript_field",
    expected_status: "blocked",
    expected_error_codes: ["raw_transcript_shaped_field"],
    mutate: rawTranscriptFieldPacket,
  },
  {
    name: "hidden_reasoning_field",
    expected_status: "blocked",
    expected_error_codes: ["hidden_reasoning_shaped_field"],
    mutate: hiddenReasoningFieldPacket,
  },
  {
    name: "malformed_freshness",
    expected_status: "invalid",
    expected_error_codes: ["timestamp_invalid"],
    mutate: malformedFreshnessPacket,
  },
  {
    name: "malformed_source_status",
    expected_status: "invalid",
    expected_error_codes: ["source_status_invalid"],
    mutate: malformedSourceStatusPacket,
  },
  {
    name: "invalid_fingerprint",
    expected_status: "invalid",
    expected_error_codes: ["fingerprint_mismatch"],
    mutate: invalidFingerprintPacket,
  },
  {
    name: "provider_specific_core_field",
    expected_status: "blocked",
    expected_error_codes: ["provider_specific_core_field"],
    mutate: providerSpecificCoreFieldPacket,
  },
  {
    name: "authority_escalation_field",
    expected_status: "blocked",
    expected_error_codes: ["unknown_authority_field"],
    mutate: authorityEscalationFieldPacket,
  },
  {
    name: "malformed_budget",
    expected_status: "invalid",
    expected_error_codes: ["context_budget_limits_missing"],
    mutate: malformedBudgetPacket,
  },
  {
    name: "impossible_calendar_timestamp",
    expected_status: "invalid",
    expected_error_codes: ["timestamp_invalid"],
    mutate: impossibleCalendarTimestampPacket,
  },
] satisfies InvalidTaskContextPacketFixtureCase[];
