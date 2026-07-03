import type { GuideBrief } from "@/types/guide-brief";
import type {
  WorkplaneContinuityRelay,
  WorkplaneContinuityRelayAnchor,
  WorkplaneContinuityRelayAuthorityBoundary,
  WorkplaneContinuityRelaySeverity,
  WorkplaneContinuityRelaySourceRefs,
} from "@/types/workplane-continuity-relay";
import { WORKPLANE_CONTINUITY_RELAY_VERSION } from "@/types/workplane-continuity-relay";
import type { WorkplaneContextRead } from "./read-workplane-context";

export type WorkplaneContinuityRelayContext =
  | WorkplaneContextRead
  | Omit<WorkplaneContextRead, "continuity_relay">;

export type WorkplaneContinuityRelayInput = {
  workplane_context?: WorkplaneContinuityRelayContext | null;
  guide_brief?: GuideBrief | null;
  as_of?: string;
};

const WORKBENCH_REF = "/workbench" as const;

const DEFAULT_NON_GOALS = [
  "Does not write durable memory or promote relay content.",
  "Does not apply Perspective state, create a promotion decision, or create a formation receipt.",
  "Does not call external providers, OpenAI, GitHub, Codex, crawlers, browser observers, graph stores, vector stores, or RAG pipelines.",
  "Does not treat generated summaries as evidence or source of truth.",
  "Does not send a handoff or execute the next focus automatically.",
] as const;

export function buildWorkplaneContinuityRelay({
  workplane_context: context,
  guide_brief: guideBrief,
  as_of: explicitAsOf,
}: WorkplaneContinuityRelayInput): WorkplaneContinuityRelay {
  const current = context?.current_perspective_read.data ?? null;
  const projection = context?.delta_projection_read.data ?? null;
  const asOf =
    explicitAsOf ??
    chooseLatestTimestamp(
      chooseLatestTimestamp(current?.as_of ?? "", projection?.as_of ?? "") ??
        "",
      guideBrief?.as_of ?? "",
    ) ??
    new Date(0).toISOString();
  const sourceRefs = buildRelaySourceRefs({ context, guideBrief });
  const fallbackReason = {
    current_perspective: context?.fallback_reason.current_perspective ?? null,
    delta_projection: context?.fallback_reason.delta_projection ?? null,
    guide_brief: guideBrief ? null : "GuideBrief input was not supplied.",
    runner_delta_batch: context?.fallback_reason.runner_delta_batch ?? null,
  };

  const preserveAnchors = buildPreserveAnchors(context);
  const warnAnchors = buildWarnAnchors({ context, guideBrief });
  const stopIfMissing = buildStopIfMissingAnchors({
    context,
    guideBrief,
    sourceRefs,
  });
  const nextFocus = buildNextFocusAnchors({ context, guideBrief });
  const staleOrGapWarnings = uniqueAnchors([
    ...warnAnchors.filter((anchor) =>
      ["gap", "staleness", "source_fallback", "missing_source"].includes(
        anchor.kind,
      ),
    ),
    ...stopIfMissing.filter((anchor) => anchor.kind !== "authority_boundary"),
  ]);

  return {
    runtime: "augnes",
    relay_version: WORKPLANE_CONTINUITY_RELAY_VERSION,
    scope: context?.overview.scope ?? guideBrief?.scope ?? "project:augnes",
    as_of: asOf,
    source_refs: sourceRefs,
    preserve_anchors: preserveAnchors,
    warn_anchors: warnAnchors,
    stop_if_missing: stopIfMissing,
    next_focus: nextFocus,
    stale_or_gap_warnings: staleOrGapWarnings,
    non_goals: [...DEFAULT_NON_GOALS],
    source_status: {
      current_perspective:
        context?.source_status.current_perspective ?? "missing",
      delta_projection: context?.source_status.delta_projection ?? "missing",
      guide_brief: guideBrief ? "supplied" : "missing",
      runner_delta_batch:
        context?.source_status.runner_delta_batch ?? "missing",
    },
    fallback_reason: fallbackReason,
    authority_boundary: buildAuthorityBoundary(),
    notes: [
      "Continuity Relay is a deterministic derived Workplane read model.",
      "Preserve, warning, stop-if-missing, and next-focus anchors are selected from existing CWP, GuideBrief, and Workplane context fields.",
      "Next focus is a suggested continuation target for human/operator review, not an autonomous command.",
    ],
  };
}

function buildPreserveAnchors(
  context: WorkplaneContinuityRelayContext | null | undefined,
): WorkplaneContinuityRelayAnchor[] {
  const current = context?.current_perspective_read.data;
  if (!current) {
    return [];
  }

  const anchors: WorkplaneContinuityRelayAnchor[] = [];

  if (hasText(current.current_thesis.summary)) {
    anchors.push(
      anchor({
        id: "preserve.current_thesis",
        kind: "thesis",
        label: "Current thesis",
        summary: current.current_thesis.summary,
        source: "current_working_perspective",
        sourceRefs: current.current_thesis.source_refs,
        severity: "info",
        notes: current.current_thesis.non_authority_notes,
      }),
    );
  }

  if (hasText(current.current_frame.summary)) {
    anchors.push(
      anchor({
        id: "preserve.current_frame",
        kind: "frame",
        label: "Current frame",
        summary: current.current_frame.summary,
        source: "current_working_perspective",
        sourceRefs: current.current_frame.source_refs,
        severity: severityFromPressure(current.current_frame.pressure_level),
        notes: current.current_frame.non_authority_notes,
      }),
    );
  }

  current.active_goals.slice(0, 3).forEach((goal) => {
    anchors.push(
      anchor({
        id: `preserve.goal.${goal.goal_id}`,
        kind: "active_goal",
        label: goal.title,
        summary: goal.next_action
          ? `${goal.summary} Next: ${goal.next_action}`
          : goal.summary,
        source: "current_working_perspective",
        sourceRefs: goal.source_refs,
        severity: goal.user_attention_required ? "medium" : "info",
        notes: [`status:${goal.status}`, `priority:${goal.priority}`],
      }),
    );
  });

  current.accepted_assumptions.slice(0, 2).forEach((assumption) => {
    anchors.push(
      anchor({
        id: `preserve.assumption.${assumption.assumption_id}`,
        kind: "assumption",
        label: "Accepted assumption",
        summary: assumption.summary,
        source: "current_working_perspective",
        sourceRefs: assumption.source_refs,
        severity: "low",
        notes: assumption.non_authority_notes,
      }),
    );
  });

  current.open_questions.slice(0, 2).forEach((question) => {
    anchors.push(
      anchor({
        id: `preserve.open_question.${question.question_id}`,
        kind: "open_question",
        label: "Open question",
        summary: question.summary,
        source: "current_working_perspective",
        sourceRefs: question.source_refs,
        severity: question.severity,
        notes: [`review_path:${question.suggested_review_path}`],
      }),
    );
  });

  return anchors;
}

function buildWarnAnchors({
  context,
  guideBrief,
}: {
  context?: WorkplaneContinuityRelayContext | null;
  guideBrief?: GuideBrief | null;
}): WorkplaneContinuityRelayAnchor[] {
  const anchors: WorkplaneContinuityRelayAnchor[] = [];
  const current = context?.current_perspective_read.data;

  if (current) {
    if (current.staleness.status !== "fresh") {
      anchors.push(
        anchor({
          id: `warn.staleness.${current.staleness.status}`,
          kind: "staleness",
          label: "Perspective freshness",
          summary: `Current Working Perspective staleness is ${current.staleness.status}.`,
          source: "current_working_perspective",
          sourceRefs: current.staleness.source_gap_codes,
          severity: current.staleness.status === "stale" ? "high" : "medium",
          notes: current.staleness.freshness_notes,
        }),
      );
    }

    current.active_risks.slice(0, 3).forEach((risk) => {
      anchors.push(
        anchor({
          id: `warn.risk.${risk.risk_id}`,
          kind: "risk",
          label: "Active risk",
          summary: risk.summary,
          source: "current_working_perspective",
          sourceRefs: risk.source_refs,
          severity: risk.severity,
          blocksHandoff: risk.severity === "high",
          notes: risk.blocked_authority_notes,
        }),
      );
    });

    current.gaps.slice(0, 4).forEach((gap) => {
      anchors.push(
        anchor({
          id: `warn.gap.${gap.code}`,
          kind: "gap",
          label: "Known gap",
          summary: gap.summary,
          source: "current_working_perspective",
          sourceRefs: gap.source_refs,
          severity: gap.severity,
          blocksHandoff: gap.severity === "high",
          notes: [`gap_code:${gap.code}`],
        }),
      );
    });
  }

  if (context?.fallback_reason.current_perspective) {
    anchors.push(
      sourceFallbackAnchor(
        "current_perspective",
        context.fallback_reason.current_perspective,
      ),
    );
  }

  if (context?.fallback_reason.delta_projection) {
    anchors.push(
      sourceFallbackAnchor(
        "delta_projection",
        context.fallback_reason.delta_projection,
      ),
    );
  }

  if (guideBrief) {
    guideBrief.staleness_warnings.slice(0, 3).forEach((warning) => {
      anchors.push(
        anchor({
          id: `warn.guide_staleness.${warning.warning_id}`,
          kind: "staleness",
          label: "Guide warning",
          summary: warning.summary,
          source: "guide_brief",
          sourceRefs: warning.source_refs,
          severity: warning.blocks_handoff ? "blocking" : warning.severity,
          blocksHandoff: warning.blocks_handoff,
          notes: [warning.refresh_suggestion],
        }),
      );
    });

    guideBrief.gaps
      .filter((gap) => gap.blocks_guide_confidence)
      .slice(0, 3)
      .forEach((gap) => {
        anchors.push(
          anchor({
            id: `warn.guide_gap.${gap.code}`,
            kind: "gap",
            label: "Guide confidence gap",
            summary: gap.summary,
            source: "guide_brief",
            sourceRefs: gap.source_refs,
            severity: gap.severity,
            blocksHandoff: gap.severity === "high",
            notes: [`gap_code:${gap.code}`],
          }),
        );
      });
  } else {
    anchors.push(
      anchor({
        id: "warn.missing_guide_brief",
        kind: "missing_source",
        label: "GuideBrief unavailable",
        summary:
          "Continuity Relay was built without a GuideBrief input, so guide suggestions and handoff blockers may be incomplete.",
        source: "workplane_context",
        sourceRefs: [WORKBENCH_REF],
        severity: "medium",
        notes: ["This is explicit missing input, not a crash."],
      }),
    );
  }

  return uniqueAnchors(anchors);
}

function buildStopIfMissingAnchors({
  context,
  guideBrief,
  sourceRefs,
}: {
  context?: WorkplaneContinuityRelayContext | null;
  guideBrief?: GuideBrief | null;
  sourceRefs: WorkplaneContinuityRelaySourceRefs;
}): WorkplaneContinuityRelayAnchor[] {
  const anchors: WorkplaneContinuityRelayAnchor[] = [];
  const current = context?.current_perspective_read.data;

  if (!current) {
    anchors.push(
      anchor({
        id: "stop.missing_current_working_perspective",
        kind: "missing_source",
        label: "Missing CWP",
        summary:
          "Do not treat the next handoff as confident without Current Working Perspective input.",
        source: "workplane_context",
        sourceRefs: [WORKBENCH_REF],
        severity: "blocking",
        blocksHandoff: true,
        notes: ["Relay can render this gap without throwing."],
      }),
    );
  } else {
    if (!hasText(current.current_thesis.summary)) {
      anchors.push(
        blockingMissingAnchor(
          "stop.missing_thesis",
          "Missing thesis",
          "Current Working Perspective has no thesis summary.",
          current.current_thesis.source_refs,
        ),
      );
    }

    if (current.active_goals.length === 0) {
      anchors.push(
        blockingMissingAnchor(
          "stop.missing_active_goals",
          "Missing active goals",
          "No active goals are materialized for the next session.",
          current.current_frame.source_refs,
        ),
      );
    }
  }

  if (sourceRefs.source_refs.length === 0) {
    anchors.push(
      blockingMissingAnchor(
        "stop.missing_source_refs",
        "Missing source refs",
        "Continuity Relay has no source refs; do not reuse as grounded context.",
        [WORKBENCH_REF],
      ),
    );
  }

  if (!guideBrief) {
    anchors.push(
      anchor({
        id: "stop.missing_guide_brief",
        kind: "missing_source",
        label: "Missing GuideBrief",
        summary:
          "GuideBrief was not supplied; treat guide-derived next-focus and handoff blockers as incomplete.",
        source: "workplane_context",
        sourceRefs: [WORKBENCH_REF],
        severity: "medium",
        blocksHandoff: false,
        notes: ["Workbench can still show CWP-derived continuity anchors."],
      }),
    );
  }

  guideBrief?.staleness_warnings
    .filter((warning) => warning.blocks_handoff)
    .forEach((warning) => {
      anchors.push(
        anchor({
          id: `stop.guide_warning.${warning.warning_id}`,
          kind: "staleness",
          label: "Blocks handoff",
          summary: warning.summary,
          source: "guide_brief",
          sourceRefs: warning.source_refs,
          severity: "blocking",
          blocksHandoff: true,
          notes: [warning.refresh_suggestion],
        }),
      );
    });

  return uniqueAnchors(anchors);
}

function buildNextFocusAnchors({
  context,
  guideBrief,
}: {
  context?: WorkplaneContinuityRelayContext | null;
  guideBrief?: GuideBrief | null;
}): WorkplaneContinuityRelayAnchor[] {
  const anchors: WorkplaneContinuityRelayAnchor[] = [];
  const current = context?.current_perspective_read.data;

  current?.next_candidates.slice(0, 2).forEach((candidate) => {
    anchors.push(
      anchor({
        id: `next.candidate.${candidate.candidate_id}`,
        kind: "next_candidate",
        label: candidate.title,
        summary: candidate.rationale,
        source: "current_working_perspective",
        sourceRefs: candidate.source_refs,
        severity: candidate.authority_required === "manual_review"
          ? "medium"
          : "info",
        notes: [
          `priority:${candidate.priority}`,
          `authority_required:${candidate.authority_required}`,
          ...candidate.allowed_next_steps.slice(0, 2).map(
            (step) => `allowed:${step}`,
          ),
        ],
      }),
    );
  });

  guideBrief?.suggested
    .filter((suggestion) =>
      suggestion.priority === "now" || suggestion.priority === "high",
    )
    .slice(0, 2)
    .forEach((suggestion) => {
      anchors.push(
        anchor({
          id: `next.guide_suggestion.${suggestion.suggestion_id}`,
          kind: "guide_suggestion",
          label: suggestion.title,
          summary: suggestion.summary,
          source: "guide_brief",
          sourceRefs: suggestion.source_refs,
          severity: suggestion.priority === "now" ? "high" : "medium",
          blocksHandoff: suggestion.blocked_by.length > 0,
          notes: [
            `actor:${suggestion.suggested_actor}`,
            `surface:${suggestion.suggested_surface}`,
            ...suggestion.required_checks.slice(0, 2),
          ],
        }),
      );
    });

  if (anchors.length === 0 && current?.active_goals[0]) {
    const goal = current.active_goals[0];
    anchors.push(
      anchor({
        id: `next.goal.${goal.goal_id}`,
        kind: "active_goal",
        label: goal.title,
        summary: goal.next_action || goal.summary,
        source: "current_working_perspective",
        sourceRefs: goal.source_refs,
        severity: "info",
        notes: ["Fallback next focus from the first active goal."],
      }),
    );
  }

  if (anchors.length === 0) {
    anchors.push(
      anchor({
        id: "next.no_focus_materialized",
        kind: "missing_source",
        label: "No next focus",
        summary:
          "No next candidate, high-priority guide suggestion, or active goal is materialized.",
        source: "workplane_context",
        sourceRefs: [WORKBENCH_REF],
        severity: "medium",
        notes: ["Operator should refresh or select context before handoff."],
      }),
    );
  }

  return uniqueAnchors(anchors);
}

function buildRelaySourceRefs({
  context,
  guideBrief,
}: {
  context?: WorkplaneContinuityRelayContext | null;
  guideBrief?: GuideBrief | null;
}): WorkplaneContinuityRelaySourceRefs {
  const current = context?.current_perspective_read.data;
  const projection = context?.delta_projection_read.data;
  const snapshotRefs = current?.source_refs.perspective_snapshot.source_refs;
  const guideRefs = guideBrief?.source_refs;
  const projectionRefs = projection?.source_refs;

  return {
    current_working_perspective_ref: current
      ? `current_working_perspective:${current.as_of}`
      : null,
    guide_brief_ref: guideBrief ? `guide_brief:${guideBrief.as_of}` : null,
    delta_projection_ref: projection
      ? `augnes_delta_projection:${projection.as_of}`
      : null,
    workplane_ref: WORKBENCH_REF,
    perspective_snapshot_refs: uniqueStrings([
      ...(guideRefs?.perspective_snapshot_refs ?? []),
      ...(current?.source_refs.snapshot_refs.map(
        (snapshot) => `snapshot:${snapshot.snapshot_id}`,
      ) ?? []),
    ]),
    delta_ids: uniqueStrings([
      ...(guideRefs?.delta_ids ?? []),
      ...(current?.source_refs.delta_projection.delta_ids ?? []),
      ...(projection?.deltas.map((delta) => delta.delta_id) ?? []),
    ]),
    batch_ids: uniqueStrings([
      ...(guideRefs?.batch_ids ?? []),
      ...(current?.source_refs.delta_projection.batch_ids ?? []),
      ...(projection?.batches.map((batch) => batch.batch_id) ?? []),
    ]),
    evidence_refs: uniqueStrings([
      ...(guideRefs?.evidence_refs ?? []),
      ...(snapshotRefs?.evidence_ids.map((ref) => `evidence:${ref}`) ?? []),
      ...(projection?.deltas.flatMap((delta) =>
        delta.evidence_refs.map((ref) => ref.evidence_ref),
      ) ?? []),
    ]),
    artifact_refs: uniqueStrings([
      ...(guideRefs?.artifact_refs ?? []),
      ...(projection?.deltas.flatMap((delta) =>
        delta.artifact_refs.map((ref) => ref.artifact_ref),
      ) ?? []),
    ]),
    handoff_refs: uniqueStrings([
      ...(guideRefs?.handoff_refs ?? []),
      ...(projectionRefs?.handoff_refs ?? []),
      ...(projection?.deltas.flatMap((delta) =>
        delta.handoff_refs.map((ref) => ref.handoff_ref),
      ) ?? []),
    ]),
    diagnostic_refs: uniqueStrings([
      ...(guideRefs?.diagnostic_refs ?? []),
      ...(current?.source_refs.diagnostic_refs.map(
        (diagnostic) => `diagnostic:${diagnostic.diagnostic_id}`,
      ) ?? []),
      ...(projectionRefs?.diagnostic_refs.map(
        (diagnostic) => `diagnostic:${diagnostic.diagnostic_id}`,
      ) ?? []),
    ]),
    route_refs: uniqueStrings([WORKBENCH_REF, ...(guideRefs?.route_refs ?? [])]),
    source_refs: uniqueStrings([
      current ? `current_working_perspective:${current.as_of}` : "",
      projection ? `augnes_delta_projection:${projection.as_of}` : "",
      guideBrief ? `guide_brief:${guideBrief.as_of}` : "",
      WORKBENCH_REF,
      ...(current?.current_thesis.source_refs ?? []),
      ...(current?.current_frame.source_refs ?? []),
      ...(current?.active_goals.flatMap((goal) => goal.source_refs) ?? []),
      ...(current?.open_questions.flatMap((question) => question.source_refs) ??
        []),
      ...(current?.active_risks.flatMap((risk) => risk.source_refs) ?? []),
      ...(current?.gaps.flatMap((gap) => gap.source_refs) ?? []),
      ...(guideBrief?.source_refs.docs_refs ?? []),
      ...(guideBrief?.staleness_warnings.flatMap(
        (warning) => warning.source_refs,
      ) ?? []),
    ]),
  };
}

function buildAuthorityBoundary(): WorkplaneContinuityRelayAuthorityBoundary {
  return {
    source_of_truth: false,
    derived_read_model: true,
    read_only_operator_view: true,
    candidate_material_only: true,
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
    can_crawl_or_observe_browser: false,
    can_merge_publish_retry_replay_deploy: false,
    notes: [
      "Continuity Relay is advisory and read-only.",
      "Relay anchors may be copied into later handoff work only after operator review.",
      "Relay output is selected working material, not canonical truth, evidence, proof, or durable state.",
    ],
  };
}

function sourceFallbackAnchor(
  sourceName: string,
  reason: string,
): WorkplaneContinuityRelayAnchor {
  return anchor({
    id: `warn.source_fallback.${sourceName}`,
    kind: "source_fallback",
    label: `${sourceName} fallback`,
    summary: reason,
    source: "workplane_context",
    sourceRefs: [WORKBENCH_REF],
    severity: "medium",
    notes: ["Fallback is visible and must not be presented as live state."],
  });
}

function blockingMissingAnchor(
  id: string,
  label: string,
  summary: string,
  sourceRefs: string[],
): WorkplaneContinuityRelayAnchor {
  return anchor({
    id,
    kind: "missing_source",
    label,
    summary,
    source: "workplane_context",
    sourceRefs,
    severity: "blocking",
    blocksHandoff: true,
    notes: ["Stop or explicitly warn before confident next-session handoff."],
  });
}

function anchor({
  id,
  kind,
  label,
  summary,
  source,
  sourceRefs,
  severity,
  blocksHandoff = false,
  notes = [],
}: {
  id: string;
  kind: WorkplaneContinuityRelayAnchor["kind"];
  label: string;
  summary: string;
  source: WorkplaneContinuityRelayAnchor["source"];
  sourceRefs: string[];
  severity: WorkplaneContinuityRelaySeverity;
  blocksHandoff?: boolean;
  notes?: string[];
}): WorkplaneContinuityRelayAnchor {
  return {
    anchor_id: stableId(id),
    kind,
    label,
    summary: hasText(summary) ? summary.trim() : "No summary materialized.",
    source,
    source_refs: uniqueStrings(sourceRefs),
    severity,
    blocks_handoff: blocksHandoff,
    notes: uniqueStrings(notes),
  };
}

function severityFromPressure(
  pressure: "none" | "low" | "medium" | "high",
): WorkplaneContinuityRelaySeverity {
  if (pressure === "none") return "info";
  return pressure;
}

function chooseLatestTimestamp(left: string, right: string): string | null {
  if (!left && !right) return null;
  const leftParsed = Date.parse(left);
  const rightParsed = Date.parse(right);

  if (Number.isFinite(leftParsed) && Number.isFinite(rightParsed)) {
    return rightParsed > leftParsed ? right : left;
  }

  return left || right;
}

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function uniqueAnchors(
  anchors: WorkplaneContinuityRelayAnchor[],
): WorkplaneContinuityRelayAnchor[] {
  const seen = new Set<string>();
  return anchors.filter((relayAnchor) => {
    if (seen.has(relayAnchor.anchor_id)) return false;
    seen.add(relayAnchor.anchor_id);
    return true;
  });
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function stableId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
