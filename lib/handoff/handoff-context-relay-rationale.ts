import type { HandoffCapsulePreviewForWeb } from "@/lib/handoff/read-handoff-capsule-for-web";
import type {
  HandoffContextRelayAuthorityBoundary,
  HandoffContextRelayDeferredRef,
  HandoffContextRelayExpectedReturnSignal,
  HandoffContextRelayRationale,
  HandoffContextRelayRationaleReasonCategory,
  HandoffContextRelayRationaleRefKind,
  HandoffContextRelayRationaleSeverity,
  HandoffContextRelayRationaleSourceRefs,
  HandoffContextRelaySelectedRef,
  HandoffContextRelayStopItem,
  HandoffContextRelayWarning,
  HandoffContextRelayWhyIncluded,
} from "@/types/handoff-context-relay-rationale";
import { HANDOFF_CONTEXT_RELAY_RATIONALE_VERSION } from "@/types/handoff-context-relay-rationale";
import type {
  WorkplaneContinuityRelay,
  WorkplaneContinuityRelayAnchor,
} from "@/types/workplane-continuity-relay";
import { WORKPLANE_CONTINUITY_RELAY_VERSION } from "@/types/workplane-continuity-relay";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const MAX_SELECTED_REFS = 18;
const MAX_WARNINGS = 12;
const MAX_STOP_ITEMS = 8;

const DEFAULT_NON_GOALS = [
  "No durable memory promotion.",
  "No Perspective apply.",
  "No provider or LLM call.",
  "No GitHub or Codex execution.",
  "No handoff send.",
  "No graph DB, vector DB, RAG stack, crawler, browser observer, ambient capture, or autonomous action.",
  "No hidden authority and no treating generated summaries as source truth.",
] as const;

type InternalSelectedRef = HandoffContextRelaySelectedRef & {
  rationale: string;
};

export type HandoffContextRelayRationaleInput = {
  continuity_relay?: WorkplaneContinuityRelay | null;
  handoff_preview?: HandoffCapsulePreviewForWeb | null;
  as_of?: string;
};

export function buildHandoffContextRelayRationale({
  continuity_relay: relay,
  handoff_preview: preview,
  as_of,
}: HandoffContextRelayRationaleInput): HandoffContextRelayRationale {
  const selectedRefsWithRationale = buildSelectedRefs({ relay, preview });
  const selectedRefs = selectedRefsWithRationale.map((ref) => ({
    ref_id: ref.ref_id,
    ref_kind: ref.ref_kind,
    label: ref.label,
    summary: ref.summary,
    source_refs: ref.source_refs,
    reason_category: ref.reason_category,
    origin: ref.origin,
    priority: ref.priority,
    blocks_handoff: ref.blocks_handoff,
  }));
  const whyIncluded = selectedRefsWithRationale.map(toWhyIncluded);

  return {
    runtime: "augnes",
    rationale_version: HANDOFF_CONTEXT_RELAY_RATIONALE_VERSION,
    scope:
      relay?.scope ??
      preview?.capsule.scope ??
      preview?.launch_card.scope ??
      "project:augnes",
    as_of: as_of ?? relay?.as_of ?? preview?.capsule.created_at ?? FALLBACK_AS_OF,
    source_refs: buildRationaleSourceRefs({ relay, preview, selectedRefs }),
    selected_refs: selectedRefs,
    why_included: whyIncluded,
    stale_or_gap_warnings: buildWarnings({ relay, preview }),
    excluded_or_deferred_refs: buildExcludedOrDeferredRefs({ relay, preview }),
    stop_if_missing: buildStopIfMissing(relay),
    non_goals: buildNonGoals(relay),
    expected_return_signal: buildExpectedReturnSignal(),
    authority_boundary: buildAuthorityBoundary(),
    source_status: {
      continuity_relay: relay ? "supplied" : "missing",
      current_perspective: relay?.source_status.current_perspective ?? "missing",
      delta_projection: relay?.source_status.delta_projection ?? "missing",
      guide_brief: relay?.source_status.guide_brief ?? "missing",
      handoff_preview_source: preview?.source_status.source ?? "missing",
      handoff_capsule: preview?.source_status.capsule ?? "missing",
      codex_launch_card: preview?.source_status.launch_card ?? "missing",
    },
    fallback_reason: {
      continuity_relay: relay
        ? null
        : "Continuity Relay was not supplied; rationale remains explicit but incomplete.",
      current_perspective: relay?.fallback_reason.current_perspective ?? null,
      delta_projection: relay?.fallback_reason.delta_projection ?? null,
      guide_brief: relay?.fallback_reason.guide_brief ?? null,
      handoff_preview: preview?.fallback_reasons ?? [
        "Handoff Capsule / Codex Launch Card preview was not supplied.",
      ],
    },
    notes: [
      "Derived from an already-built Workplane Continuity Relay and existing Handoff Capsule / Codex Launch Card preview.",
      "This is context selection rationale only; it does not send, execute, promote, apply, or write state.",
    ],
  };
}

function buildSelectedRefs({
  relay,
  preview,
}: {
  relay?: WorkplaneContinuityRelay | null;
  preview?: HandoffCapsulePreviewForWeb | null;
}): InternalSelectedRef[] {
  const refs: InternalSelectedRef[] = [];

  if (relay) {
    addAnchorRefs(refs, relay.preserve_anchors, {
      reasonCategory: "preserve_current_work",
      priority: 10,
      rationale:
        "Preserve this continuity anchor so the next handoff keeps the current thesis, goals, assumptions, risks, or open questions in view.",
    });
    addAnchorRefs(refs, relay.warn_anchors, {
      reasonCategory: "warn_about_reuse",
      priority: 20,
      rationale:
        "Carry this warning so stale, weak, risky, or review-required context is not reused silently.",
    });
    addAnchorRefs(refs, relay.stop_if_missing, {
      reasonCategory: "block_confident_handoff_if_missing",
      priority: 5,
      rationale:
        "Expose this blocker before a confident handoff packet is copied or used.",
    });
    addAnchorRefs(refs, relay.next_focus, {
      reasonCategory: "guide_next_focus",
      priority: 30,
      rationale:
        "Include this next-focus hint as a suggested continuation target, not as an autonomous command.",
    });

    for (const sourceRef of relay.source_refs.source_refs.slice(0, 8)) {
      refs.push(
        buildSelectedRef({
          refId: sourceRef,
          refKind: "continuity_source_ref",
          label: "continuity source ref",
          summary: sourceRef,
          sourceRefs: [sourceRef],
          reasonCategory: "carry_source_ref",
          origin: "continuity_relay",
          priority: 40,
          blocksHandoff: false,
          rationale:
            "Carry the source pointer used by the continuity relay without treating it as generated truth.",
        }),
      );
    }
  } else {
    refs.push(
      buildSelectedRef({
        refId: "missing:workplane_continuity_relay",
        refKind: "continuity_anchor",
        label: "Missing Continuity Relay",
        summary:
          "Continuity Relay was not supplied, so handoff rationale is incomplete.",
        sourceRefs: ["/workbench"],
        reasonCategory: "block_confident_handoff_if_missing",
        origin: "derived_boundary",
        priority: 1,
        blocksHandoff: true,
        rationale:
          "Block confidence because this slice must consume the existing Continuity Relay rather than recreate it.",
      }),
    );
  }

  if (preview) {
    refs.push(
      buildSelectedRef({
        refId: preview.capsule.capsule_id,
        refKind: "handoff_capsule",
        label: "Handoff Capsule",
        summary: preview.capsule.summary,
        sourceRefs: [preview.capsule.source_guide_brief_ref],
        reasonCategory: "carry_source_ref",
        origin: "handoff_preview",
        priority: 45,
        blocksHandoff: false,
        rationale:
          "Carry the existing Handoff Capsule because it is the current bounded transfer packet.",
      }),
    );
    refs.push(
      buildSelectedRef({
        refId: preview.launch_card.launch_card_id,
        refKind: "codex_launch_card",
        label: "Codex Launch Card",
        summary: preview.launch_card.task_summary,
        sourceRefs: [preview.launch_card.source_guide_brief_ref],
        reasonCategory: "carry_source_ref",
        origin: "handoff_preview",
        priority: 46,
        blocksHandoff: false,
        rationale:
          "Carry the existing Codex Launch Card as reviewable launch preparation only, not execution authority.",
      }),
    );

    for (const routeRef of preview.route_refs.slice(0, 4)) {
      refs.push(
        buildSelectedRef({
          refId: routeRef,
          refKind: "route_ref",
          label: "read route",
          summary: routeRef,
          sourceRefs: [routeRef],
          reasonCategory: "carry_source_ref",
          origin: "handoff_preview",
          priority: 60,
          blocksHandoff: false,
          rationale:
            "Carry the read-only route pointer that produced or explains the preview context.",
        }),
      );
    }
  }

  return uniqueByRefId(refs)
    .sort(
      (left, right) =>
        left.priority - right.priority || left.ref_id.localeCompare(right.ref_id),
    )
    .slice(0, MAX_SELECTED_REFS);
}

function addAnchorRefs(
  refs: HandoffContextRelaySelectedRef[],
  anchors: WorkplaneContinuityRelayAnchor[],
  options: {
    reasonCategory: HandoffContextRelayRationaleReasonCategory;
    priority: number;
    rationale: string;
  },
) {
  for (const anchor of anchors.slice(0, 6)) {
    refs.push(
      buildSelectedRef({
        refId: anchor.anchor_id,
        refKind: "continuity_anchor",
        label: anchor.label,
        summary: anchor.summary,
        sourceRefs: anchor.source_refs,
        reasonCategory: options.reasonCategory,
        origin: "continuity_relay",
        priority: options.priority + severityPriority(anchor.severity),
        blocksHandoff: anchor.blocks_handoff,
        rationale: options.rationale,
      }),
    );
  }
}

function buildSelectedRef({
  refId,
  refKind,
  label,
  summary,
  sourceRefs,
  reasonCategory,
  origin,
  priority,
  blocksHandoff,
  rationale,
}: {
  refId: string;
  refKind: HandoffContextRelayRationaleRefKind;
  label: string;
  summary: string;
  sourceRefs: string[];
  reasonCategory: HandoffContextRelayRationaleReasonCategory;
  origin: HandoffContextRelaySelectedRef["origin"];
  priority: number;
  blocksHandoff: boolean;
  rationale: string;
}): InternalSelectedRef {
  return {
    ref_id: refId,
    ref_kind: refKind,
    label,
    summary,
    source_refs: uniqueSorted(sourceRefs),
    reason_category: reasonCategory,
    origin,
    priority,
    blocks_handoff: blocksHandoff,
    rationale,
  };
}

function toWhyIncluded(
  ref: InternalSelectedRef,
): HandoffContextRelayWhyIncluded {
  return {
    ref_id: ref.ref_id,
    reason_category: ref.reason_category,
    rationale:
      ref.rationale ??
      `Included as ${ref.reason_category.replace(/_/g, " ")} context.`,
    source_refs: [...ref.source_refs],
  };
}

function buildWarnings({
  relay,
  preview,
}: {
  relay?: WorkplaneContinuityRelay | null;
  preview?: HandoffCapsulePreviewForWeb | null;
}): HandoffContextRelayWarning[] {
  const warnings: HandoffContextRelayWarning[] = [];

  for (const anchor of relay?.stale_or_gap_warnings ?? []) {
    warnings.push({
      warning_id: anchor.anchor_id,
      summary: anchor.summary,
      source_refs: [...anchor.source_refs],
      severity: anchor.severity,
      blocks_handoff: anchor.blocks_handoff,
    });
  }

  for (const warning of preview?.warnings ?? []) {
    warnings.push({
      warning_id: `handoff_preview.warning.${safeId(warning)}`,
      summary: warning,
      source_refs: preview?.route_refs ?? [],
      severity: "medium",
      blocks_handoff: false,
    });
  }

  for (const gap of preview?.gaps ?? []) {
    warnings.push({
      warning_id: `handoff_preview.gap.${safeId(gap)}`,
      summary: gap,
      source_refs: preview?.route_refs ?? [],
      severity: "high",
      blocks_handoff: true,
    });
  }

  if (!relay) {
    warnings.push({
      warning_id: "handoff_context_relay_rationale.missing_continuity_relay",
      summary:
        "Continuity Relay is missing, so selected handoff rationale may omit current preserve/warn/stop/next-focus anchors.",
      source_refs: ["/workbench"],
      severity: "blocking",
      blocks_handoff: true,
    });
  }

  return uniqueBy(
    warnings,
    (warning) => warning.warning_id,
  ).slice(0, MAX_WARNINGS);
}

function buildStopIfMissing(
  relay?: WorkplaneContinuityRelay | null,
): HandoffContextRelayStopItem[] {
  const stopItems = (relay?.stop_if_missing ?? []).map((anchor) => ({
    stop_id: anchor.anchor_id,
    summary: anchor.summary,
    source_refs: [...anchor.source_refs],
    blocks_handoff: anchor.blocks_handoff,
  }));

  if (!relay) {
    stopItems.unshift({
      stop_id: "stop.missing_continuity_relay",
      summary:
        "Do not treat this handoff rationale as complete without an existing Workplane Continuity Relay.",
      source_refs: ["/workbench"],
      blocks_handoff: true,
    });
  }

  return uniqueBy(stopItems, (item) => item.stop_id).slice(0, MAX_STOP_ITEMS);
}

function buildExcludedOrDeferredRefs({
  relay,
  preview,
}: {
  relay?: WorkplaneContinuityRelay | null;
  preview?: HandoffCapsulePreviewForWeb | null;
}): HandoffContextRelayDeferredRef[] {
  return [
    {
      ref_id: "full_raw_context_dump",
      reason:
        "Deferred because context diet is part of product quality; this packet carries selected refs and rationale instead.",
      source_refs: ["/workbench"],
    },
    {
      ref_id: "durable_memory_promotion",
      reason:
        "Out of scope; relay rationale is read-only context compilation and never promotes durable memory.",
      source_refs: relay?.source_refs.source_refs.slice(0, 3) ?? [],
    },
    {
      ref_id: "handoff_send_or_codex_execution",
      reason:
        "Out of scope; existing Handoff Capsule / Codex Launch Card material remains preview/copy context only.",
      source_refs: preview?.route_refs ?? [],
    },
  ];
}

function buildRationaleSourceRefs({
  relay,
  preview,
  selectedRefs,
}: {
  relay?: WorkplaneContinuityRelay | null;
  preview?: HandoffCapsulePreviewForWeb | null;
  selectedRefs: HandoffContextRelaySelectedRef[];
}): HandoffContextRelayRationaleSourceRefs {
  const handoffSourceRefs = preview?.capsule.source_refs;
  const continuitySourceRefs = relay?.source_refs;

  return {
    continuity_relay_ref: relay ? WORKPLANE_CONTINUITY_RELAY_VERSION : null,
    handoff_capsule_ref: preview?.capsule.capsule_id ?? null,
    codex_launch_card_ref: preview?.launch_card.launch_card_id ?? null,
    current_working_perspective_ref:
      continuitySourceRefs?.current_working_perspective_ref ??
      handoffSourceRefs?.current_working_perspective_ref ??
      null,
    guide_brief_ref:
      continuitySourceRefs?.guide_brief_ref ??
      handoffSourceRefs?.guide_brief_ref ??
      null,
    delta_projection_ref:
      continuitySourceRefs?.delta_projection_ref ??
      handoffSourceRefs?.delta_projection_ref ??
      null,
    workplane_ref: "/workbench",
    source_refs: uniqueSorted([
      ...(continuitySourceRefs?.source_refs ?? []),
      ...(handoffSourceRefs ? flattenHandoffSourceRefs(handoffSourceRefs) : []),
    ]),
    selected_source_refs: uniqueSorted(
      selectedRefs.flatMap((selectedRef) => selectedRef.source_refs),
    ),
    evidence_refs: uniqueSorted([
      ...(continuitySourceRefs?.evidence_refs ?? []),
      ...(handoffSourceRefs?.evidence_refs ?? []),
    ]),
    artifact_refs: uniqueSorted([
      ...(continuitySourceRefs?.artifact_refs ?? []),
      ...(handoffSourceRefs?.artifact_refs ?? []),
    ]),
    handoff_refs: uniqueSorted([
      ...(continuitySourceRefs?.handoff_refs ?? []),
      ...(handoffSourceRefs?.handoff_refs ?? []),
    ]),
    diagnostic_refs: uniqueSorted([
      ...(continuitySourceRefs?.diagnostic_refs ?? []),
      ...(handoffSourceRefs?.diagnostic_refs ?? []),
    ]),
    route_refs: uniqueSorted([
      ...(continuitySourceRefs?.route_refs ?? []),
      ...(handoffSourceRefs?.route_refs ?? []),
      ...(preview?.route_refs ?? []),
    ]),
    docs_refs: uniqueSorted([
      ...(handoffSourceRefs?.docs_refs ?? []),
      ...(preview?.docs_refs ?? []),
    ]),
  };
}

function flattenHandoffSourceRefs(
  sourceRefs: HandoffCapsulePreviewForWeb["capsule"]["source_refs"],
): string[] {
  return uniqueSorted([
    sourceRefs.guide_brief_ref,
    sourceRefs.current_working_perspective_ref,
    sourceRefs.delta_projection_ref,
    sourceRefs.workplane_ref,
    ...sourceRefs.perspective_snapshot_refs,
    ...sourceRefs.delta_ids,
    ...sourceRefs.batch_ids,
    ...sourceRefs.evidence_refs,
    ...sourceRefs.artifact_refs,
    ...sourceRefs.handoff_refs,
    ...sourceRefs.diagnostic_refs,
    ...sourceRefs.route_refs,
    ...sourceRefs.docs_refs,
    ...sourceRefs.repo_refs,
  ]);
}

function buildNonGoals(
  relay?: WorkplaneContinuityRelay | null,
): string[] {
  return uniqueSorted([...(relay?.non_goals ?? []), ...DEFAULT_NON_GOALS]);
}

function buildExpectedReturnSignal(): HandoffContextRelayExpectedReturnSignal {
  return {
    signal_version: "expected_return_signal.v0.1",
    required_fields: [
      "changed_files",
      "checks_run",
      "skipped_checks",
      "requirement_progress",
    ],
    context_feedback_fields: [
      "context_helpful_or_stale_refs",
      "unresolved_gaps",
      "next_relay_update_suggestions",
    ],
    instructions: [
      "Return what changed, what was checked, what was skipped, and which requirements moved.",
      "Call out context refs that were helpful, stale, missing, or misleading.",
      "Do not report proof/evidence writes, durable state decisions, or execution authority unless a separate scoped path actually did that work.",
    ],
  };
}

function buildAuthorityBoundary(): HandoffContextRelayAuthorityBoundary {
  return {
    source_of_truth: false,
    derived_read_model: true,
    read_only_context_compilation: true,
    advisory_only: true,
    can_write_db: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_apply_project_perspective: false,
    can_create_promotion_decision: false,
    can_create_formation_receipt: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_execute_runner: false,
    can_create_branch_or_pr: false,
    can_send_handoff: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_launch_autonomous_action: false,
    can_merge_publish_retry_replay_deploy: false,
    notes: [
      "Context selection rationale is not durable state.",
      "Expected return signal prepares Slice D comparison only.",
    ],
  };
}

function severityPriority(
  severity: WorkplaneContinuityRelayAnchor["severity"],
): number {
  if (severity === "blocking") return 0;
  if (severity === "high") return 1;
  if (severity === "medium") return 2;
  if (severity === "low") return 3;
  return 4;
}

function safeId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function uniqueByRefId(refs: InternalSelectedRef[]): InternalSelectedRef[] {
  return uniqueBy(refs, (ref) => ref.ref_id);
}

function uniqueBy<T>(values: T[], getKey: (value: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const value of values) {
    const key = getKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}
