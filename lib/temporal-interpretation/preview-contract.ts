import {
  ACTIVE_CONTEXT_ADMISSION_CATEGORIES,
  ACTIVE_CONTEXT_ADMISSION_ROLES,
  AXIS_PRESSURE_LABELS,
  SUPPRESSED_ALTERNATIVE_STATUSES,
  TEMPORAL_INTERPRETATION_AXES,
  TRANSITION_RELATIONS,
  type TemporalInterpretationPreview,
} from "@/lib/temporal-interpretation/types";

const MAX_PREVIEW_TEXT_BYTES = 8_192;
const MAX_PREVIEW_LIST_ITEMS = 32;

export function validateTemporalInterpretationPreview(
  value: unknown,
): TemporalInterpretationPreview {
  const record = requireRecord(value);
  const admission = requireRecord(record.active_context_admission);

  return {
    current_interpretation: text(record.current_interpretation),
    active_prior_context: text(record.active_prior_context),
    evidence_anchors: list(record.evidence_anchors, (item) => {
      const row = requireRecord(item);
      return {
        ref: text(row.ref),
        claim: text(row.claim),
        source_type: enumeration(row.source_type, [
          "committed_state",
          "action_record",
          "work_trace",
          "doc",
        ] as const),
      };
    }),
    summary_refs: list(record.summary_refs, (item) => {
      const row = requireRecord(item);
      return { ref: text(row.ref), summary: text(row.summary) };
    }),
    source_authority_profile: (() => {
      const row = requireRecord(record.source_authority_profile);
      return {
        committed_state_authority: stringList(row.committed_state_authority),
        summary_only_refs: stringList(row.summary_only_refs),
        allowed_now: stringList(row.allowed_now),
        blocked_now: stringList(row.blocked_now),
      };
    })(),
    counterexamples: refDescriptions(record.counterexamples),
    residual_tensions: refDescriptions(record.residual_tensions),
    transition_relation: enumeration(record.transition_relation, TRANSITION_RELATIONS),
    revision_explanation: text(record.revision_explanation),
    user_context_vs_factuality: text(record.user_context_vs_factuality),
    active_context_admission_rationale: list(
      record.active_context_admission_rationale,
      (item) => {
        const row = requireRecord(item);
        return {
          context_ref: text(row.context_ref),
          admission_role: enumeration(
            row.admission_role,
            ACTIVE_CONTEXT_ADMISSION_ROLES,
          ),
          why_admitted: text(row.why_admitted),
          why_not_merely_summary: text(row.why_not_merely_summary),
        };
      },
    ),
    active_context_admission: {
      decisions: list(admission.decisions, (item) => {
        const row = requireRecord(item);
        return {
          candidate_id: text(row.candidate_id),
          category: enumeration(
            row.category,
            ACTIVE_CONTEXT_ADMISSION_CATEGORIES,
          ),
          reason: text(row.reason),
          source_authority: text(row.source_authority),
          evidence_refs: stringList(row.evidence_refs),
          counterexample_refs: stringList(row.counterexample_refs),
          residual_tension_refs: stringList(row.residual_tension_refs),
        };
      }),
      note: text(admission.note),
    },
    suppressed_alternatives: list(record.suppressed_alternatives, (item) => {
      const row = requireRecord(item);
      return {
        alternative: text(row.alternative),
        why_deferred: text(row.why_deferred),
        what_would_change_status: text(row.what_would_change_status),
        status: enumeration(row.status, SUPPRESSED_ALTERNATIVE_STATUSES),
      };
    }),
    temporal_hierarchy_view: (() => {
      const row = requireRecord(record.temporal_hierarchy_view);
      return {
        raw_observation_level: text(row.raw_observation_level),
        work_or_session_level: text(row.work_or_session_level),
        project_status_level: text(row.project_status_level),
        current_interpretive_stance: text(row.current_interpretive_stance),
        hierarchy_caution: text(row.hierarchy_caution),
      };
    })(),
    memory_lifecycle_view: (() => {
      const row = requireRecord(record.memory_lifecycle_view);
      return {
        active_context: stringList(row.active_context),
        retrieved_context: stringList(row.retrieved_context),
        summary_or_view: stringList(row.summary_or_view),
        stale_or_deferred_context: stringList(row.stale_or_deferred_context),
        lifecycle_caution: text(row.lifecycle_caution),
      };
    })(),
    interpretive_drivers: list(record.interpretive_drivers, (item) => {
      const row = requireRecord(item);
      return {
        axis: enumeration(row.axis, TEMPORAL_INTERPRETATION_AXES),
        driver: text(row.driver),
        effect: text(row.effect),
      };
    }),
    axis_pressures: list(record.axis_pressures, (item) => {
      const row = requireRecord(item);
      return {
        axis: enumeration(row.axis, TEMPORAL_INTERPRETATION_AXES),
        pressure: enumeration(row.pressure, AXIS_PRESSURE_LABELS),
        reason: text(row.reason),
      };
    }),
    safe_next_step: text(record.safe_next_step),
    non_authority_boundary: text(record.non_authority_boundary),
    warnings: stringList(record.warnings),
  };
}

function refDescriptions(value: unknown) {
  return list(value, (item) => {
    const row = requireRecord(item);
    return { ref: text(row.ref), description: text(row.description) };
  });
}

function stringList(value: unknown) {
  return list(value, text);
}

function list<T>(value: unknown, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value) || value.length > MAX_PREVIEW_LIST_ITEMS) invalid();
  return value.map(parse);
}

function text(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) invalid();
  const normalized = value.trim();
  if (Buffer.byteLength(normalized, "utf8") > MAX_PREVIEW_TEXT_BYTES) invalid();
  return normalized;
}

function enumeration<T extends readonly string[]>(value: unknown, allowed: T) {
  if (typeof value !== "string" || !allowed.includes(value)) invalid();
  return value as T[number];
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    invalid();
  }
  return value as Record<string, unknown>;
}

function invalid(): never {
  throw new Error("temporal_preview_invalid");
}
