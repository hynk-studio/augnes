import { createHash } from "node:crypto";

import type {
  AgWorkResumePacketHandoffLikeInput,
  AgWorkResumePacketV02,
} from "@/lib/ag-work-resume-packet";
import type { WorkBrief } from "@/lib/work";
import {
  buildTaskContextPacketV01,
  type TaskContextPacketBuilderInputV01,
} from "@/lib/vnext/task-context-packet";
import type { CurrentWorkingPerspective } from "@/types/current-working-perspective";
import type { ExternalRefTrustClassV01, ExternalRefV01 } from "@/types/vnext/external-ref";
import { EXTERNAL_REF_VERSION_V01 } from "@/types/vnext/external-ref";
import type { HandoffCapsule } from "@/types/handoff-capsule";
import type {
  TaskContextPacketBoundedCapabilitySummaryV01,
  TaskContextPacketContextBudgetV01,
  TaskContextPacketCurrentnessV01,
  TaskContextPacketCurrentProjectionV01,
  TaskContextPacketDataClassificationV01,
  TaskContextPacketExcludedEntryV01,
  TaskContextPacketGapV01,
  TaskContextPacketIssueV01,
  TaskContextPacketProjectionItemV01,
  TaskContextPacketReturnContractV01,
  TaskContextPacketSelectedEntryV01,
  TaskContextPacketV01,
} from "@/types/vnext/task-context-packet";

const WORK_BRIEF_NAMESPACE = "augnes.work_brief";
const CWP_NAMESPACE = "augnes.current_working_perspective";
const HANDOFF_NAMESPACE = "augnes.handoff_capsule";
const RESUME_NAMESPACE = "augnes.ag_work_resume_packet";
const HANDOFF_LIKE_NAMESPACE = "augnes.legacy_handoff";
const MAX_SUMMARY_CHARACTERS = 1_200;

export interface LegacyTaskContextPacketOverridesV01 {
  task_goal?: string;
  success_criteria?: string[];
  non_goals?: string[];
  required_checks?: string[];
  forbidden_actions?: string[];
  data_classification?: TaskContextPacketDataClassificationV01;
  capability_grant?: TaskContextPacketBoundedCapabilitySummaryV01 | null;
  return_contract?: TaskContextPacketReturnContractV01;
}

export interface LegacyTaskContextPacketInputV01 {
  workspace_id: string;
  project_id: string;
  generated_at: string;
  expires_at?: string | null;
  work_brief: WorkBrief;
  current_working_perspective?: CurrentWorkingPerspective | null;
  handoff_capsule?: HandoffCapsule | null;
  resume_packet?: AgWorkResumePacketV02 | null;
  handoff?: AgWorkResumePacketHandoffLikeInput | null;
  external_refs?: ExternalRefV01[];
  overrides?: LegacyTaskContextPacketOverridesV01;
  context_budget?: Partial<TaskContextPacketContextBudgetV01> | null;
}

type CompatibilityUnmappedField =
  TaskContextPacketBuilderInputV01["compatibility"]["unmapped_fields"][number];

export function buildTaskContextPacketFromLegacyWorkV01(
  input: LegacyTaskContextPacketInputV01,
): TaskContextPacketV01 {
  const workBrief = input.work_brief;
  const cwp = input.current_working_perspective ?? null;
  const handoffCapsule = input.handoff_capsule ?? null;
  const resumePacket = input.resume_packet ?? null;
  const handoff = input.handoff ?? null;
  const overrides = input.overrides ?? {};
  const workAsOf = cleanTimestamp(workBrief.as_of);
  const workBriefRef = externalRef({
    ref_type: "legacy_work_brief",
    external_id: workBrief.work_id,
    observed_at: workAsOf,
    trust_class: "host_attestation",
    source_ref: "WorkBrief",
    compatibility_namespace: WORK_BRIEF_NAMESPACE,
  });
  const workRef = externalRef({
    ref_type: "legacy_work_id",
    external_id: workBrief.work_id,
    observed_at: workAsOf,
    trust_class: "host_attestation",
    source_ref: "WorkBrief.work_id",
    compatibility_namespace: WORK_BRIEF_NAMESPACE,
  });
  const legacyScopeRef = externalRef({
    ref_type: "legacy_scope",
    external_id: workBrief.scope,
    observed_at: workAsOf,
    trust_class: "host_attestation",
    source_ref: "WorkBrief.scope",
    compatibility_namespace: WORK_BRIEF_NAMESPACE,
  });

  const selectedContext: TaskContextPacketSelectedEntryV01[] = [
    selectedEntry({
      entry_id: `work:${workBrief.work_id}`,
      entry_kind: "work_ref",
      ref: workRef,
      why_included: "The supplied Work Brief identifies the bounded legacy work context.",
      currentness: currentness(
        timestampOnlyCurrentnessStatus(workAsOf),
        workAsOf,
        workAsOf
          ? "Work Brief as_of supplies an explicit source time but no freshness evaluation."
          : "Work Brief supplied no usable as_of timestamp.",
        workBriefRef,
      ),
      summary: workBrief.work.summary || workBrief.work.title,
    }),
  ];
  const excludedContext: TaskContextPacketExcludedEntryV01[] = [];
  const gaps: TaskContextPacketGapV01[] = [];
  const tensions: TaskContextPacketIssueV01[] = [];
  const risks: TaskContextPacketIssueV01[] = [];
  const compatibilityRefs: ExternalRefV01[] = [
    workBriefRef,
    workRef,
    legacyScopeRef,
  ];
  const unmappedFields: CompatibilityUnmappedField[] = [];
  const compatibilityWarnings: string[] = [
    "Legacy scope is compatibility metadata and was not used to infer project_id.",
  ];
  if (!workAsOf) {
    compatibilityWarnings.push(
      "Work Brief supplied no usable as_of timestamp; source currentness remains unknown.",
    );
  }

  mapWorkBriefContext({
    workBrief,
    workBriefRef,
    selectedContext,
    excludedContext,
    compatibilityRefs,
    unmappedFields,
  });

  const currentProjection = cwp
    ? mapCurrentWorkingPerspective({
        cwp,
        selectedContext,
        risks,
        gaps,
        compatibilityRefs,
        unmappedFields,
      })
    : null;
  if (!currentProjection) {
    gaps.push(
      gap(
        "missing_current_projection",
        "No Current Working Perspective was supplied; the packet does not invent one.",
        "medium",
        ["current_projection"],
        [workBriefRef],
      ),
    );
    compatibilityWarnings.push(
      "Current Working Perspective was not supplied; no projection-specific freshness evaluation is available.",
    );
  }

  if (handoffCapsule) {
    mapHandoffCapsule({
      capsule: handoffCapsule,
      selectedContext,
      excludedContext,
      gaps,
      compatibilityRefs,
      unmappedFields,
    });
  }
  if (resumePacket) {
    mapResumePacket({
      packet: resumePacket,
      selectedContext,
      excludedContext,
      gaps,
      compatibilityRefs,
      unmappedFields,
      warnings: compatibilityWarnings,
      explicitExpiresAt: input.expires_at ?? null,
    });
  }
  if (handoff) {
    mapHandoffLike({
      handoff,
      selectedContext,
      gaps,
      compatibilityRefs,
      unmappedFields,
      generatedAt: input.generated_at,
    });
  }
  for (const ref of input.external_refs ?? []) {
    const observedAt = cleanTimestamp(ref.observed_at);
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `caller-ref:${safeId(ref.ref_type)}:${safeId(ref.external_id)}`,
        entry_kind: "source_ref",
        ref,
        why_included: "The caller explicitly supplied this host or worker compatibility reference.",
        currentness: currentness(
          timestampOnlyCurrentnessStatus(observedAt),
          observedAt,
          observedAt
            ? "ExternalRef observed_at supplies an observation time but no freshness evaluation."
            : "ExternalRef did not provide observed_at.",
          ref,
        ),
        summary: "Caller-supplied compatibility reference.",
      }),
    );
  }

  const taskGoal = cleanText(overrides.task_goal) || cleanText(
    workBrief.codex_handoff.task_brief,
  );
  if (!taskGoal) {
    gaps.push(
      gap(
        "missing_task_goal",
        "Neither an explicit caller goal nor WorkBrief.codex_handoff.task_brief was available.",
        "blocking",
        ["task.goal"],
        [workBriefRef],
      ),
    );
  }
  const successCriteria =
    overrides.success_criteria !== undefined
      ? overrides.success_criteria
      : handoffCapsule?.validation_expectations.success_criteria ?? [];
  if (successCriteria.length === 0) {
    gaps.push(
      gap(
        "missing_success_criteria",
        "Legacy inputs do not provide explicit success criteria; none were invented.",
        "medium",
        ["task.success_criteria"],
        [workBriefRef],
      ),
    );
  }
  const nonGoals =
    overrides.non_goals !== undefined
      ? overrides.non_goals
      : handoffCapsule?.constraints.non_goals ?? [];
  if (nonGoals.length === 0) {
    gaps.push(
      gap(
        "missing_non_goals",
        "Legacy inputs do not provide explicit non-goals; none were invented.",
        "low",
        ["task.non_goals"],
        [workBriefRef],
      ),
    );
  }

  const requiredChecks = uniqueStrings([
    ...workBrief.codex_handoff.suggested_verification,
    ...(handoffCapsule?.validation_expectations.required_checks ?? []),
    ...(resumePacket?.handoff.expected_checks ?? []),
    ...(handoff?.expected_checks ?? []),
    ...(overrides.required_checks ?? []),
  ]);
  const forbiddenActions = uniqueStrings([
    ...(handoffCapsule?.forbidden_actions ?? []),
    ...(resumePacket?.handoff.forbidden_surfaces ?? []).map(
      (surface) => `Do not use compatibility surface: ${surface}`,
    ),
    ...(handoff?.forbidden_surfaces ?? []).map(
      (surface) => `Do not use compatibility surface: ${surface}`,
    ),
    ...structuredResumeForbiddenActions(resumePacket),
    ...(overrides.forbidden_actions ?? []),
  ]);
  const returnContract =
    overrides.return_contract ??
    buildCompatibilityReturnContract(requiredChecks, input.generated_at);
  const sourceCurrentness = deriveSourceCurrentness({
    workBrief,
    cwp,
    handoffCapsule,
    resumePacket,
  });
  const sourceContracts = uniqueStrings([
    "augnes.work_brief.compatibility.v0.1",
    ...(cwp ? [cwp.perspective_version] : []),
    ...(handoffCapsule ? [handoffCapsule.capsule_version] : []),
    ...(resumePacket ? [resumePacket.schema] : []),
    ...(handoff ? ["augnes.legacy_handoff_like.v0.1"] : []),
  ]);
  const sourceCoverageStatus = deriveSourceCoverageStatus({
    sourceRefCount: compatibilityRefs.length,
    gaps,
    unmappedFields,
  });

  return buildTaskContextPacketV01({
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    work_ref: workRef,
    generated_at: input.generated_at,
    expires_at: input.expires_at ?? null,
    task: {
      goal: taskGoal,
      success_criteria: successCriteria,
      non_goals: nonGoals,
    },
    current_projection: currentProjection,
    selected_context: selectedContext,
    excluded_context: excludedContext,
    tensions,
    risks,
    gaps,
    constraints: {
      required_checks: requiredChecks,
      forbidden_actions: forbiddenActions,
      data_classification:
        overrides.data_classification ?? "local_only",
      context_budget: input.context_budget,
    },
    capability_grant: overrides.capability_grant ?? null,
    return_contract: returnContract,
    source_status: {
      status: sourceCoverageStatus,
      currentness: sourceCurrentness,
      source_refs: [],
      external_refs: compatibilityRefs,
      warnings: compatibilityWarnings,
    },
    compatibility: {
      source_contracts: sourceContracts,
      legacy_scope_ref: legacyScopeRef,
      source_refs: compatibilityRefs,
      unmapped_fields: unmappedFields,
      warnings: compatibilityWarnings,
    },
    authority_notes: [
      "Legacy Work Brief, handoff, and resume assets are compatibility inputs only.",
      "Legacy proof/action refs remain proof/action refs and are not Evidence.",
      "This adapter consumes supplied values and performs no runtime reads or writes.",
    ],
  });
}

function mapWorkBriefContext({
  workBrief,
  workBriefRef,
  selectedContext,
  excludedContext,
  compatibilityRefs,
  unmappedFields,
}: {
  workBrief: WorkBrief;
  workBriefRef: ExternalRefV01;
  selectedContext: TaskContextPacketSelectedEntryV01[];
  excludedContext: TaskContextPacketExcludedEntryV01[];
  compatibilityRefs: ExternalRefV01[];
  unmappedFields: CompatibilityUnmappedField[];
}) {
  const asOf = cleanTimestamp(workBrief.as_of);
  const stateKeys = uniqueStrings([
    ...workBrief.related_state_keys,
    ...workBrief.work.related_state_keys,
    ...workBrief.recent_events.flatMap((event) => event.related_state_keys),
  ]);
  for (const stateKey of stateKeys) {
    const ref = externalRef({
      ref_type: "legacy_state_key",
      external_id: stateKey,
      observed_at: asOf,
      trust_class: "host_attestation",
      source_ref: "WorkBrief.related_state_keys",
      compatibility_namespace: WORK_BRIEF_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `legacy-state-key:${safeId(stateKey)}`,
        entry_kind: "legacy_state_key_ref",
        ref,
        why_included: "The Work Brief explicitly related this legacy state key to the task.",
        currentness: currentness(
          asOf ? "partial" : "unknown",
          asOf,
          "Work Brief supplies packet-level currentness, not source-specific state-key freshness.",
          workBriefRef,
        ),
        summary: "Legacy state-key reference; not a canonical accepted-state ID.",
      }),
    );
  }

  for (const event of workBrief.recent_events) {
    const eventAsOf = cleanTimestamp(event.created_at);
    const eventRef = externalRef({
      ref_type: "legacy_work_event",
      external_id: event.id,
      observed_at: eventAsOf,
      trust_class: "host_attestation",
      source_ref: "WorkBrief.recent_events",
      compatibility_namespace: WORK_BRIEF_NAMESPACE,
    });
    compatibilityRefs.push(eventRef);
    selectedContext.push(
      selectedEntry({
        entry_id: `work-event:${safeId(event.id)}`,
        entry_kind: "source_ref",
        ref: eventRef,
        why_included: "The Work Brief explicitly included this recent work event.",
        currentness: currentness(
          timestampOnlyCurrentnessStatus(eventAsOf),
          eventAsOf,
          eventAsOf
            ? "Legacy work-event created_at supplies event time but no freshness evaluation."
            : "Legacy work event supplied no usable created_at timestamp.",
          eventRef,
        ),
        summary: event.summary,
      }),
    );
  }

  const actionRecordIds = new Set(
    workBrief.related_proof.action_records.map((record) => record.id),
  );
  for (const action of workBrief.related_proof.action_records) {
    const actionAsOf = cleanTimestamp(action.created_at);
    const actionRef = externalRef({
      ref_type:
        action.proof_marker_type === "proof_only"
          ? "legacy_proof_action"
          : "legacy_action_record",
      external_id: action.id,
      observed_at: actionAsOf,
      trust_class: "host_attestation",
      source_ref: `WorkBrief.related_proof.action_records:${action.proof_marker_type}`,
      compatibility_namespace: WORK_BRIEF_NAMESPACE,
    });
    compatibilityRefs.push(actionRef);
    selectedContext.push(
      selectedEntry({
        entry_id: `proof-action:${safeId(action.id)}`,
        entry_kind:
          action.proof_marker_type === "proof_only" ? "proof_ref" : "action_ref",
        ref: actionRef,
        why_included: "The Work Brief explicitly linked this proof/action record.",
        currentness: currentness(
          timestampOnlyCurrentnessStatus(actionAsOf),
          actionAsOf,
          actionAsOf
            ? "Legacy action-record created_at supplies record time but no freshness evaluation."
            : "Legacy action record supplied no usable created_at timestamp.",
          actionRef,
        ),
        summary: `${action.title} (${action.proof_marker_type}); not Evidence.`,
      }),
    );
  }
  for (const actionId of workBrief.related_proof.action_ids) {
    if (actionRecordIds.has(actionId)) continue;
    const actionRef = externalRef({
      ref_type: "legacy_action_ref",
      external_id: actionId,
      observed_at: asOf,
      trust_class: "host_attestation",
      source_ref: "WorkBrief.related_proof.action_ids",
      compatibility_namespace: WORK_BRIEF_NAMESPACE,
    });
    compatibilityRefs.push(actionRef);
    selectedContext.push(
      selectedEntry({
        entry_id: `action-ref:${safeId(actionId)}`,
        entry_kind: "action_ref",
        ref: actionRef,
        why_included: "The Work Brief explicitly linked this action reference.",
        currentness: currentness(
          asOf ? "partial" : "unknown",
          asOf,
          "Only Work Brief packet-level currentness is available.",
          workBriefRef,
        ),
        summary: "Legacy action reference; not Evidence.",
      }),
    );
  }

  for (const pr of workBrief.related_proof.prs) {
    const ref = externalRef({
      ref_type: "github_pull_request",
      external_id: pr,
      provider: "github",
      host: pr.includes("github.com") ? "github.com" : null,
      observed_at: asOf,
      trust_class: "host_attestation",
      source_ref: "WorkBrief.related_proof.prs",
      compatibility_namespace: WORK_BRIEF_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `pull-request:${safeId(pr)}`,
        entry_kind: "source_ref",
        ref,
        why_included: "The Work Brief explicitly linked this repository review reference.",
        currentness: currentness(
          asOf ? "partial" : "unknown",
          asOf,
          "The Work Brief has no PR-specific freshness observation.",
          workBriefRef,
        ),
        summary: "External code-review reference.",
      }),
    );
  }
  for (const documentRef of workBrief.related_proof.docs) {
    const ref = externalRef({
      ref_type: "legacy_document_ref",
      external_id: documentRef,
      observed_at: asOf,
      trust_class: "host_attestation",
      source_ref: "WorkBrief.related_proof.docs",
      compatibility_namespace: WORK_BRIEF_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `document:${safeId(documentRef)}`,
        entry_kind: "artifact_ref",
        ref,
        why_included: "The Work Brief explicitly linked this document.",
        currentness: currentness(
          timestampOnlyCurrentnessStatus(asOf),
          asOf,
          "Work Brief has no document-specific freshness information.",
          workBriefRef,
        ),
        summary: "Legacy document reference.",
      }),
    );
  }

  if (workBrief.coordination_events.length > 0) {
    const ref = externalRef({
      ref_type: "legacy_coordination_event_collection",
      external_id: `${workBrief.work_id}:${workBrief.coordination_events.length}`,
      observed_at: asOf,
      trust_class: "host_attestation",
      source_ref: "WorkBrief.coordination_events",
      compatibility_namespace: WORK_BRIEF_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    excludedContext.push({
      entry_id: `excluded-coordination-events:${safeId(workBrief.work_id)}`,
      source_ref: null,
      external_ref: ref,
      why_excluded:
        "The compatibility packet preserves the collection reference but does not copy full coordination-event payloads.",
      currentness: currentness(
        asOf ? "partial" : "unknown",
        asOf,
        "Only Work Brief packet-level currentness is available.",
        workBriefRef,
      ),
    });
  }
  if (Object.keys(workBrief.work.links).length > 0) {
    unmappedFields.push(
      unmapped(
        "WorkBrief.work.links",
        "Arbitrary legacy link objects are not copied; recognized docs and PR refs are mapped separately.",
        workBriefRef,
      ),
    );
  }
  if (Object.keys(workBrief.related_proof.links).length > 0) {
    unmappedFields.push(
      unmapped(
        "WorkBrief.related_proof.links",
        "Arbitrary legacy proof link objects are not copied into Core fields.",
        workBriefRef,
      ),
    );
  }
  if (workBrief.codex_handoff.constraints.length > 0) {
    unmappedFields.push(
      unmapped(
        "WorkBrief.codex_handoff.constraints",
        "Codex-oriented prose is not copied into provider-neutral required semantics.",
        workBriefRef,
      ),
    );
  }
}

function mapCurrentWorkingPerspective({
  cwp,
  selectedContext,
  risks,
  gaps,
  compatibilityRefs,
  unmappedFields,
}: {
  cwp: CurrentWorkingPerspective;
  selectedContext: TaskContextPacketSelectedEntryV01[];
  risks: TaskContextPacketIssueV01[];
  gaps: TaskContextPacketGapV01[];
  compatibilityRefs: ExternalRefV01[];
  unmappedFields: CompatibilityUnmappedField[];
}): TaskContextPacketCurrentProjectionV01 {
  const asOf = cleanTimestamp(cwp.as_of);
  const cwpRef = externalRef({
    ref_type: "current_working_perspective_projection",
    external_id: `${cwp.scope}:${cwp.as_of}`,
    observed_at: asOf,
    trust_class: "derived_interpretation",
    source_ref: "CurrentWorkingPerspective",
    compatibility_namespace: CWP_NAMESPACE,
  });
  compatibilityRefs.push(cwpRef);
  const projectionCurrentness = currentness(
    cwp.staleness.status,
    asOf,
    cwp.staleness.freshness_notes.join(" ") ||
      "Current Working Perspective staleness metadata is the currentness basis.",
    cwpRef,
  );
  const items: TaskContextPacketProjectionItemV01[] = [
    projectionItem("frame", cwp.current_frame.summary, cwp.current_frame.source_refs, projectionCurrentness),
    projectionItem("thesis", cwp.current_thesis.summary, cwp.current_thesis.source_refs, projectionCurrentness),
    ...cwp.active_goals.map((goal) =>
      projectionItem(
        "active_goal",
        [goal.title, goal.summary, goal.next_action].filter(Boolean).join(" — "),
        goal.source_refs,
        projectionCurrentness,
      ),
    ),
    ...cwp.active_risks.map((risk) =>
      projectionItem("risk", risk.summary, risk.source_refs, projectionCurrentness),
    ),
    ...cwp.open_questions.map((question) =>
      projectionItem(
        "open_question",
        question.summary,
        question.source_refs,
        projectionCurrentness,
      ),
    ),
    ...cwp.gaps.map((item) =>
      projectionItem("gap", item.summary, item.source_refs, projectionCurrentness),
    ),
  ];
  const projectionExternalRefs = uniqueStrings(
    items.flatMap((item) => item.source_refs),
  ).map((sourceRef) =>
    externalRef({
      ref_type: "legacy_projection_source_ref",
      external_id: sourceRef,
      observed_at: asOf,
      trust_class: "derived_interpretation",
      source_ref: "CurrentWorkingPerspective.source_refs",
      compatibility_namespace: CWP_NAMESPACE,
    }),
  );
  for (const ref of projectionExternalRefs) compatibilityRefs.push(ref);
  for (const item of items) {
    item.external_refs = item.source_refs.map((sourceRef) =>
      externalRef({
        ref_type: "legacy_projection_source_ref",
        external_id: sourceRef,
        observed_at: asOf,
        trust_class: "derived_interpretation",
        source_ref: "CurrentWorkingPerspective.item.source_refs",
        compatibility_namespace: CWP_NAMESPACE,
      }),
    );
    item.source_refs = [];
  }
  selectedContext.push(
    selectedEntry({
      entry_id: "current-working-perspective:frame",
      entry_kind: "source_ref",
      ref: cwpRef,
      why_included: "The supplied Current Working Perspective provides the bounded task-start frame.",
      currentness: projectionCurrentness,
      summary: cwp.current_frame.summary,
    }),
  );
  cwp.active_goals.forEach((goal, index) => {
    const ref = externalRef({
      ref_type: "legacy_projection_goal",
      external_id: goal.goal_id,
      observed_at: asOf,
      trust_class: "derived_interpretation",
      source_ref: "CurrentWorkingPerspective.active_goals",
      compatibility_namespace: CWP_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `projection-goal:${index + 1}:${safeId(goal.goal_id)}`,
        entry_kind: "source_ref",
        ref,
        why_included: "The Current Working Perspective explicitly projects this active goal.",
        currentness: projectionCurrentness,
        summary: [goal.title, goal.summary].filter(Boolean).join(" — "),
      }),
    );
  });
  for (const risk of cwp.active_risks) {
    risks.push({
      issue_kind: "risk",
      summary: bounded(risk.summary),
      severity: risk.severity,
      source_refs: [],
      external_refs: risk.source_refs.map((sourceRef) =>
        externalRef({
          ref_type: "legacy_projection_source_ref",
          external_id: sourceRef,
          observed_at: asOf,
          trust_class: "derived_interpretation",
          compatibility_namespace: CWP_NAMESPACE,
        }),
      ),
      currentness: projectionCurrentness,
    });
  }
  for (const cwpGap of cwp.gaps) {
    gaps.push({
      code: cleanText(cwpGap.code) || "legacy_projection_gap",
      summary: bounded(cwpGap.summary),
      severity: cwpGap.severity,
      missing_fields: [],
      source_refs: [],
      external_refs: cwpGap.source_refs.map((sourceRef) =>
        externalRef({
          ref_type: "legacy_projection_source_ref",
          external_id: sourceRef,
          observed_at: asOf,
          trust_class: "derived_interpretation",
          compatibility_namespace: CWP_NAMESPACE,
        }),
      ),
    });
  }
  if (cwp.accepted_assumptions.length > 0) {
    unmappedFields.push(
      unmapped(
        "CurrentWorkingPerspective.accepted_assumptions",
        "Projection assumptions are not promoted to canonical accepted state by compatibility mapping.",
        cwpRef,
      ),
    );
  }
  if (cwp.rejected_assumptions.length > 0) {
    unmappedFields.push(
      unmapped(
        "CurrentWorkingPerspective.rejected_assumptions",
        "Projection assumption lifecycle remains in the source projection.",
        cwpRef,
      ),
    );
  }
  unmappedFields.push(
    unmapped(
      "CurrentWorkingPerspective.research_pressure",
      "Diagnostic pressure remains projection-only and is not copied into Core authority semantics.",
      cwpRef,
    ),
  );
  return {
    projection_kind: "current_working_perspective",
    projection_only: true,
    canonical_state: false,
    perspective_ref: null,
    bounded_summary: bounded(cwp.current_frame.summary),
    as_of: asOf,
    items,
    source_refs: [],
    external_refs: [cwpRef, ...projectionExternalRefs],
    currentness: projectionCurrentness,
    warnings: uniqueStrings([
      ...cwp.current_frame.non_authority_notes,
      ...cwp.current_thesis.non_authority_notes,
      ...cwp.staleness.freshness_notes,
      "Current Working Perspective remains a projection, not source-of-truth state.",
    ]),
  };
}

function mapHandoffCapsule({
  capsule,
  selectedContext,
  excludedContext,
  gaps,
  compatibilityRefs,
  unmappedFields,
}: {
  capsule: HandoffCapsule;
  selectedContext: TaskContextPacketSelectedEntryV01[];
  excludedContext: TaskContextPacketExcludedEntryV01[];
  gaps: TaskContextPacketGapV01[];
  compatibilityRefs: ExternalRefV01[];
  unmappedFields: CompatibilityUnmappedField[];
}) {
  const capsuleRef = externalRef({
    ref_type: "legacy_handoff_capsule",
    external_id: capsule.capsule_id,
    observed_at: cleanTimestamp(capsule.created_at),
    trust_class: "host_attestation",
    source_ref: "HandoffCapsule",
    compatibility_namespace: HANDOFF_NAMESPACE,
  });
  compatibilityRefs.push(capsuleRef);
  const capsuleCurrentness = currentness(
    capsule.staleness.status,
    cleanTimestamp(capsule.staleness.as_of),
    capsule.staleness.warnings.join(" ") ||
      "Handoff Capsule staleness metadata is the currentness basis.",
    capsuleRef,
  );
  for (const observation of capsule.observed_context) {
    const ref = externalRef({
      ref_type: "legacy_handoff_observation",
      external_id: observation.context_id,
      observed_at: cleanTimestamp(capsule.staleness.as_of),
      trust_class: "host_attestation",
      source_ref: "HandoffCapsule.observed_context",
      compatibility_namespace: HANDOFF_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `handoff-observation:${safeId(observation.context_id)}`,
        entry_kind: "source_ref",
        ref,
        why_included: "The Handoff Capsule explicitly selected this observed context.",
        currentness: capsuleCurrentness,
        summary: observation.summary,
      }),
    );
  }
  for (const delta of capsule.selected_delta_refs) {
    const ref = externalRef({
      ref_type: "legacy_delta_ref",
      external_id: delta.delta_id,
      observed_at: cleanTimestamp(capsule.staleness.as_of),
      trust_class: "derived_interpretation",
      source_ref: "HandoffCapsule.selected_delta_refs",
      compatibility_namespace: HANDOFF_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `handoff-delta:${safeId(delta.delta_id)}`,
        entry_kind: "source_ref",
        ref,
        why_included: delta.reason,
        currentness: capsuleCurrentness,
        summary: "Legacy projected delta reference; not accepted state.",
      }),
    );
  }
  for (const artifact of capsule.artifact_refs) {
    const ref = externalRef({
      ref_type: "legacy_artifact_ref",
      external_id: artifact,
      observed_at: cleanTimestamp(capsule.staleness.as_of),
      trust_class: "host_attestation",
      source_ref: "HandoffCapsule.artifact_refs",
      compatibility_namespace: HANDOFF_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `handoff-artifact:${safeId(artifact)}`,
        entry_kind: "artifact_ref",
        ref,
        why_included: "The Handoff Capsule explicitly selected this artifact reference.",
        currentness: capsuleCurrentness,
        summary: "Legacy artifact reference.",
      }),
    );
  }
  for (const evidenceRef of capsule.evidence_refs) {
    const ref = externalRef({
      ref_type: "legacy_evidence_candidate_ref",
      external_id: evidenceRef,
      observed_at: cleanTimestamp(capsule.staleness.as_of),
      trust_class: "host_attestation",
      source_ref: "HandoffCapsule.evidence_refs",
      compatibility_namespace: HANDOFF_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `handoff-evidence-candidate:${safeId(evidenceRef)}`,
        entry_kind: "source_ref",
        ref,
        why_included: "The Handoff Capsule referenced this legacy evidence candidate.",
        currentness: capsuleCurrentness,
        summary: "Legacy evidence-named reference; no Core Evidence promotion occurred.",
      }),
    );
  }
  for (const capsuleGap of capsule.gaps) {
    gaps.push({
      code: cleanText(capsuleGap.code) || "legacy_handoff_gap",
      summary: bounded(capsuleGap.summary),
      severity: capsuleGap.severity,
      missing_fields: [],
      source_refs: [],
      external_refs: capsuleGap.source_refs.map((sourceRef) =>
        externalRef({
          ref_type: "legacy_handoff_source_ref",
          external_id: sourceRef,
          observed_at: cleanTimestamp(capsule.staleness.as_of),
          trust_class: "host_attestation",
          compatibility_namespace: HANDOFF_NAMESPACE,
        }),
      ),
    });
  }
  if (
    capsule.inferred_context.length > 0 ||
    capsule.suggested_context.length > 0 ||
    capsule.needs_user_judgment.length > 0
  ) {
    excludedContext.push({
      entry_id: `excluded-handoff-advisory:${safeId(capsule.capsule_id)}`,
      source_ref: null,
      external_ref: capsuleRef,
      why_excluded:
        "Inferred, suggested, and undecided handoff material remains in the source capsule rather than becoming required Core context.",
      currentness: capsuleCurrentness,
    });
    unmappedFields.push(
      unmapped(
        "HandoffCapsule.inferred_suggested_judgment_context",
        "Advisory and unresolved material is not promoted by this compatibility path.",
        capsuleRef,
      ),
    );
  }
}

function mapResumePacket({
  packet,
  selectedContext,
  excludedContext,
  gaps,
  compatibilityRefs,
  unmappedFields,
  warnings,
  explicitExpiresAt,
}: {
  packet: AgWorkResumePacketV02;
  selectedContext: TaskContextPacketSelectedEntryV01[];
  excludedContext: TaskContextPacketExcludedEntryV01[];
  gaps: TaskContextPacketGapV01[];
  compatibilityRefs: ExternalRefV01[];
  unmappedFields: CompatibilityUnmappedField[];
  warnings: string[];
  explicitExpiresAt: string | null;
}) {
  const resumeAsOf = cleanTimestamp(packet.created_at);
  const resumeRef = externalRef({
    ref_type: "legacy_resume_packet",
    external_id: packet.packet_id,
    observed_at: resumeAsOf,
    trust_class: "host_attestation",
    source_ref: "AgWorkResumePacketV02",
    compatibility_namespace: RESUME_NAMESPACE,
  });
  compatibilityRefs.push(resumeRef);
  excludedContext.push({
    entry_id: `excluded-resume-payload:${safeId(packet.packet_id)}`,
    source_ref: null,
    external_ref: resumeRef,
    why_excluded:
      "Only bounded resume/handoff references and structured constraints are mapped; the full resume packet is not reproduced.",
    currentness: currentness(
      timestampOnlyCurrentnessStatus(resumeAsOf),
      resumeAsOf,
      resumeAsOf
        ? "Legacy resume packet created_at supplies packet time but no freshness evaluation."
        : "Legacy resume packet supplied no usable created_at timestamp.",
      resumeRef,
    ),
  });
  const resumeRefs = [
    externalRef({
      ref_type: "legacy_handoff_id",
      external_id: packet.handoff.handoff_id,
      observed_at: resumeAsOf,
      trust_class: "host_attestation",
      source_ref: "AgWorkResumePacketV02.handoff.handoff_id",
      compatibility_namespace: RESUME_NAMESPACE,
    }),
    externalRef({
      ref_type: "git_repository",
      external_id: packet.git.remote,
      provider: "git",
      observed_at: resumeAsOf,
      trust_class: "host_attestation",
      source_ref: "AgWorkResumePacketV02.git.remote",
      compatibility_namespace: RESUME_NAMESPACE,
    }),
    externalRef({
      ref_type: "git_commit",
      external_id: packet.git.head_commit,
      provider: "git",
      observed_at: resumeAsOf,
      trust_class: "host_attestation",
      source_ref: "AgWorkResumePacketV02.git.head_commit",
      compatibility_namespace: RESUME_NAMESPACE,
    }),
  ];
  if (packet.git.related_pr) {
    resumeRefs.push(
      externalRef({
        ref_type: "github_pull_request",
        external_id: packet.git.related_pr,
        provider: "github",
        observed_at: resumeAsOf,
        trust_class: "host_attestation",
        source_ref: "AgWorkResumePacketV02.git.related_pr",
        compatibility_namespace: RESUME_NAMESPACE,
      }),
    );
  }
  compatibilityRefs.push(...resumeRefs);
  for (const expectedFile of packet.handoff.expected_files) {
    const ref = externalRef({
      ref_type: "legacy_expected_artifact_ref",
      external_id: expectedFile,
      observed_at: resumeAsOf,
      trust_class: "host_attestation",
      source_ref: "AgWorkResumePacketV02.handoff.expected_files",
      compatibility_namespace: RESUME_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `resume-expected-artifact:${safeId(expectedFile)}`,
        entry_kind: "artifact_ref",
        ref,
        why_included: "The resume packet explicitly listed this expected artifact reference.",
        currentness: currentness(
          timestampOnlyCurrentnessStatus(resumeAsOf),
          resumeAsOf,
          "The resume packet supplies no artifact-specific freshness.",
          resumeRef,
        ),
        summary: "Legacy resume expected artifact reference.",
      }),
    );
  }
  for (const stateKey of packet.source_work.related_state_keys) {
    const ref = externalRef({
      ref_type: "legacy_state_key",
      external_id: stateKey,
      observed_at: resumeAsOf,
      trust_class: "imported_unverified",
      source_ref: "AgWorkResumePacketV02.source_work.related_state_keys",
      compatibility_namespace: RESUME_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `resume-state-key:${safeId(stateKey)}`,
        entry_kind: "legacy_state_key_ref",
        ref,
        why_included: "The resume packet explicitly related this legacy state key to the work context.",
        currentness: currentness(
          timestampOnlyCurrentnessStatus(resumeAsOf),
          resumeAsOf,
          "The resume packet supplies no source-specific state-key freshness.",
          resumeRef,
        ),
        summary: "Legacy resume state-key reference; not a canonical accepted-state ID.",
      }),
    );
  }
  for (const action of packet.continuity.foreign_action_refs) {
    const actionAsOf = cleanTimestamp(action.created_at);
    const ref = externalRef({
      ref_type:
        action.proof_marker_type === "proof_only"
          ? "foreign_proof_action_ref"
          : "foreign_action_ref",
      external_id: action.id,
      observed_at: actionAsOf,
      trust_class: "imported_unverified",
      source_ref: "AgWorkResumePacketV02.continuity.foreign_action_refs",
      compatibility_namespace: RESUME_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `resume-action:${safeId(action.id)}`,
        entry_kind:
          action.proof_marker_type === "proof_only" ? "proof_ref" : "action_ref",
        ref,
        why_included: "The resume packet explicitly preserved this foreign proof/action reference.",
        currentness: currentness(
          timestampOnlyCurrentnessStatus(actionAsOf),
          actionAsOf,
          actionAsOf
            ? "Foreign action created_at supplies record time but no freshness evaluation."
            : "Foreign action supplied no usable created_at timestamp.",
          ref,
        ),
        summary: `${action.title ?? "Foreign action reference"}; not Evidence.`,
      }),
    );
  }
  for (const evidenceRef of packet.continuity.foreign_evidence_refs) {
    const ref = externalRef({
      ref_type: "foreign_evidence_candidate_ref",
      external_id: evidenceRef,
      observed_at: resumeAsOf,
      trust_class: "imported_unverified",
      source_ref: "AgWorkResumePacketV02.continuity.foreign_evidence_refs",
      compatibility_namespace: RESUME_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `resume-evidence-candidate:${safeId(evidenceRef)}`,
        entry_kind: "source_ref",
        ref,
        why_included: "The resume packet explicitly preserved this foreign evidence-named reference.",
        currentness: currentness(
          timestampOnlyCurrentnessStatus(resumeAsOf),
          resumeAsOf,
          "The resume packet supplied no source-specific evidence freshness.",
          resumeRef,
        ),
        summary: "Foreign evidence-named reference; no Core Evidence promotion occurred.",
      }),
    );
  }
  for (const sessionRef of packet.continuity.foreign_session_refs) {
    compatibilityRefs.push(
      externalRef({
        ref_type: "foreign_session_ref",
        external_id: sessionRef,
        observed_at: resumeAsOf,
        trust_class: "imported_unverified",
        source_ref: "AgWorkResumePacketV02.continuity.foreign_session_refs",
        compatibility_namespace: RESUME_NAMESPACE,
      }),
    );
  }
  for (const stopCondition of packet.handoff.stop_conditions) {
    gaps.push(
      gap(
        "legacy_resume_stop_condition",
        bounded(stopCondition),
        "medium",
        [],
        [resumeRef],
      ),
    );
  }
  if (
    packet.expires_at !== null &&
    cleanText(packet.expires_at) !== cleanText(explicitExpiresAt)
  ) {
    warnings.push(
      "Legacy resume expiry was not promoted; caller-provided TaskContextPacket expiry remains authoritative.",
    );
  }
  unmappedFields.push(
    unmapped(
      "AgWorkResumePacketV02.integrity",
      "Legacy source hashes remain source metadata and are not reused as the TaskContextPacket fingerprint.",
      resumeRef,
    ),
  );
  if (packet.handoff.safety_boundaries.length > 0) {
    unmappedFields.push(
      unmapped(
        "AgWorkResumePacketV02.handoff.safety_boundaries",
        "Provider/worker-oriented safety prose is not copied into required provider-neutral Core semantics.",
        resumeRef,
      ),
    );
  }
}

function mapHandoffLike({
  handoff,
  selectedContext,
  gaps,
  compatibilityRefs,
  unmappedFields,
  generatedAt,
}: {
  handoff: AgWorkResumePacketHandoffLikeInput;
  selectedContext: TaskContextPacketSelectedEntryV01[];
  gaps: TaskContextPacketGapV01[];
  compatibilityRefs: ExternalRefV01[];
  unmappedFields: CompatibilityUnmappedField[];
  generatedAt: string;
}) {
  const handoffObservedAt = cleanTimestamp(generatedAt);
  const handoffId = cleanText(handoff.handoff_id);
  const handoffRef = handoffId
    ? externalRef({
        ref_type: "legacy_handoff_id",
        external_id: handoffId,
        observed_at: handoffObservedAt,
        trust_class: "imported_unverified",
        source_ref: "AgWorkResumePacketHandoffLikeInput",
        compatibility_namespace: HANDOFF_LIKE_NAMESPACE,
      })
    : null;
  if (handoffRef) {
    compatibilityRefs.push(handoffRef);
  } else {
    gaps.push(
      gap(
        "missing_legacy_handoff_id",
        "The supplied handoff-like input has no handoff_id; no compatibility identifier was invented.",
        "medium",
        ["handoff.handoff_id"],
        [],
      ),
    );
  }
  for (const expectedFile of handoff.expected_files ?? []) {
    const ref = externalRef({
      ref_type: "legacy_expected_artifact_ref",
      external_id: expectedFile,
      observed_at: handoffObservedAt,
      trust_class: "imported_unverified",
      source_ref: "LegacyHandoff.expected_files",
      compatibility_namespace: HANDOFF_LIKE_NAMESPACE,
    });
    compatibilityRefs.push(ref);
    selectedContext.push(
      selectedEntry({
        entry_id: `handoff-expected-artifact:${safeId(expectedFile)}`,
        entry_kind: "artifact_ref",
        ref,
        why_included: "The bounded legacy handoff explicitly listed this expected artifact.",
        currentness: currentness(
          timestampOnlyCurrentnessStatus(handoffObservedAt),
          handoffObservedAt,
          "The caller-supplied generation time is an observation basis, not a freshness evaluation.",
          handoffRef,
        ),
        summary: "Legacy expected artifact reference.",
      }),
    );
  }
  for (const stopCondition of handoff.stop_conditions ?? []) {
    gaps.push(
      gap(
        "legacy_handoff_stop_condition",
        bounded(stopCondition),
        "medium",
        [],
        handoffRef ? [handoffRef] : [],
      ),
    );
  }
  if ((handoff.safety_boundaries ?? []).length > 0) {
    unmappedFields.push(
      unmapped(
        "LegacyHandoff.safety_boundaries",
        "Compatibility safety prose is not copied into Core required fields.",
        handoffRef,
      ),
    );
  }
}

function projectionItem(
  itemKind: TaskContextPacketProjectionItemV01["item_kind"],
  summary: string,
  sourceRefs: string[],
  projectionCurrentness: TaskContextPacketCurrentnessV01,
): TaskContextPacketProjectionItemV01 {
  return {
    item_kind: itemKind,
    summary: bounded(summary),
    source_refs: [...sourceRefs],
    external_refs: [],
    currentness: projectionCurrentness,
  };
}

function selectedEntry({
  entry_id,
  entry_kind,
  ref,
  why_included,
  currentness: entryCurrentness,
  summary,
}: {
  entry_id: string;
  entry_kind: TaskContextPacketSelectedEntryV01["entry_kind"];
  ref: ExternalRefV01;
  why_included: string;
  currentness: TaskContextPacketCurrentnessV01;
  summary: string;
}): TaskContextPacketSelectedEntryV01 {
  return {
    entry_id,
    entry_kind,
    source_ref: null,
    external_ref: ref,
    why_included: bounded(why_included),
    currentness: entryCurrentness,
    trust_class: ref.trust_class,
    compatibility_source_ref: ref,
    bounded_summary: bounded(summary),
  };
}

function gap(
  code: string,
  summary: string,
  severity: TaskContextPacketGapV01["severity"],
  missingFields: string[],
  refs: ExternalRefV01[],
): TaskContextPacketGapV01 {
  return {
    code,
    summary: bounded(summary),
    severity,
    missing_fields: missingFields,
    source_refs: [],
    external_refs: refs,
  };
}

function unmapped(
  sourceField: string,
  reason: string,
  sourceRef: ExternalRefV01 | null,
): CompatibilityUnmappedField {
  return {
    source_field: sourceField,
    reason: bounded(reason),
    source_ref: sourceRef,
    redacted: true,
  };
}

function currentness(
  status: TaskContextPacketCurrentnessV01["status"],
  asOf: string | null,
  basis: string,
  sourceRef: ExternalRefV01 | null,
): TaskContextPacketCurrentnessV01 {
  return {
    status,
    as_of: asOf,
    basis: bounded(basis),
    source_ref: sourceRef,
  };
}

function externalRef({
  ref_type,
  external_id,
  provider,
  host,
  observed_at,
  trust_class,
  source_ref,
  compatibility_namespace,
}: {
  ref_type: string;
  external_id: string;
  provider?: string | null;
  host?: string | null;
  observed_at?: string | null;
  trust_class: ExternalRefTrustClassV01;
  source_ref?: string | null;
  compatibility_namespace?: string | null;
}): ExternalRefV01 {
  const ref: ExternalRefV01 = {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: cleanText(ref_type),
    external_id: cleanText(external_id),
    trust_class,
  };
  if (cleanText(provider)) ref.provider = cleanText(provider);
  if (cleanText(host)) ref.host = cleanText(host);
  if (cleanTimestamp(observed_at)) ref.observed_at = cleanTimestamp(observed_at);
  if (cleanText(source_ref)) ref.source_ref = cleanText(source_ref);
  if (cleanText(compatibility_namespace)) {
    ref.compatibility_namespace = cleanText(compatibility_namespace);
  }
  return ref;
}

function structuredResumeForbiddenActions(
  packet: AgWorkResumePacketV02 | null,
) {
  if (!packet) return [];
  const policy = packet.target_runtime_policy;
  return uniqueStrings([
    ...(!policy.may_create_local_work_item
      ? ["Do not create a durable work item from this context packet."]
      : []),
    ...(!policy.may_bind_session
      ? ["Do not bind a host or worker session from this context packet."]
      : []),
    ...(!policy.may_commit_or_reject_state
      ? ["Do not commit or reject durable project state."]
      : []),
    ...(!policy.may_execute_codex
      ? ["Do not execute a worker from this context packet."]
      : []),
    ...(!policy.may_merge ? ["Do not merge code changes."] : []),
    ...(!policy.may_publish_or_replay
      ? ["Do not publish or replay an external action."]
      : []),
    ...(
      policy.may_record_evidence !==
        "requires explicit user/Core approval and known local work_id" ||
      policy.may_record_proof !==
        "requires explicit user/Core approval and known local work_id"
        ? []
        : ["Do not automatically record proof or Evidence."]
    ),
  ]);
}

function buildCompatibilityReturnContract(
  requiredChecks: string[],
  generatedAt: string,
): TaskContextPacketReturnContractV01 {
  return {
    return_kind: "compatibility_result_report",
    required_fields: [
      "changed_files",
      "checks",
      "remaining_gaps",
      "status",
      "summary",
    ],
    expected_artifacts: [],
    required_checks: requiredChecks,
    return_ref: externalRef({
      ref_type: "legacy_manual_result_return_path",
      external_id: "codex_result_report_manual_paste_back",
      observed_at: cleanTimestamp(generatedAt),
      trust_class: "host_attestation",
      source_ref: "README.Result Return Path",
      compatibility_namespace: "augnes.manual_result_return",
    }),
    compatibility_only: true,
  };
}

function deriveSourceCurrentness({
  workBrief,
  cwp,
  handoffCapsule,
  resumePacket,
}: {
  workBrief: WorkBrief;
  cwp: CurrentWorkingPerspective | null;
  handoffCapsule: HandoffCapsule | null;
  resumePacket: AgWorkResumePacketV02 | null;
}): TaskContextPacketCurrentnessV01 {
  const sources: Array<{
    status: TaskContextPacketCurrentnessV01["status"];
    as_of: string | null;
  }> = [
    {
      status: timestampOnlyCurrentnessStatus(cleanTimestamp(workBrief.as_of)),
      as_of: cleanTimestamp(workBrief.as_of),
    },
    ...(cwp
      ? [{ status: cwp.staleness.status, as_of: cleanTimestamp(cwp.as_of) }]
      : []),
    ...(handoffCapsule
      ? [
          {
            status: handoffCapsule.staleness.status,
            as_of: cleanTimestamp(handoffCapsule.staleness.as_of),
          },
        ]
      : []),
    ...(resumePacket
      ? [
          {
            status: timestampOnlyCurrentnessStatus(
              cleanTimestamp(resumePacket.created_at),
            ),
            as_of: cleanTimestamp(resumePacket.created_at),
          },
        ]
      : []),
  ];
  const sourceTimes = sources
    .map((source) => source.as_of)
    .filter((value): value is string => Boolean(value))
    .sort(compareTimestampsByInstant);
  const asOf = sourceTimes[0] ?? null;
  const statuses = new Set(sources.map((source) => source.status));
  const status: TaskContextPacketCurrentnessV01["status"] = !asOf
    ? "unknown"
    : statuses.has("stale")
      ? "stale"
      : statuses.has("unknown") || statuses.has("partial")
        ? "partial"
        : "fresh";
  return currentness(
    status,
    asOf,
    "Aggregate currentness uses explicit source evaluations when available; timestamp-only sources contribute partial currentness, and the earliest supplied source time is retained.",
    null,
  );
}

function deriveSourceCoverageStatus({
  sourceRefCount,
  gaps,
  unmappedFields,
}: {
  sourceRefCount: number;
  gaps: TaskContextPacketGapV01[];
  unmappedFields: CompatibilityUnmappedField[];
}): TaskContextPacketV01["source_status"]["status"] {
  if (sourceRefCount === 0) return "unknown";
  return gaps.length > 0 || unmappedFields.length > 0 ? "partial" : "complete";
}

function timestampOnlyCurrentnessStatus(
  timestamp: string | null,
): TaskContextPacketCurrentnessV01["status"] {
  return timestamp ? "partial" : "unknown";
}

function cleanTimestamp(value: unknown): string | null {
  return cleanText(value) || null;
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map(cleanText).filter(Boolean))].sort(compareCodeUnits);
}

function compareCodeUnits(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareTimestampsByInstant(a: string, b: string) {
  const aInstant = Date.parse(a);
  const bInstant = Date.parse(b);
  const aValid = Number.isFinite(aInstant);
  const bValid = Number.isFinite(bInstant);
  if (aValid && bValid && aInstant !== bInstant) return aInstant - bInstant;
  if (aValid !== bValid) return aValid ? -1 : 1;
  return compareCodeUnits(a, b);
}

function bounded(value: string) {
  const text = cleanText(value);
  if (text.length <= MAX_SUMMARY_CHARACTERS) return text;
  return `${text.slice(0, MAX_SUMMARY_CHARACTERS - 3).trimEnd()}...`;
}

function safeId(value: string) {
  const text = cleanText(value);
  const readable = text
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "ref";
  const digest = createHash("sha256").update(text).digest("hex").slice(0, 16);
  return `${readable}-${digest}`;
}
