import type {
  HandoffContextRelayRationale,
  HandoffContextRelaySelectedRef,
  HandoffContextRelayStopItem,
  HandoffContextRelayWarning,
} from "@/types/handoff-context-relay-rationale";
import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CSSProperties } from "react";

type HandoffContextRelayRationalePanelProps = {
  rationale: HandoffContextRelayRationale;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function HandoffContextRelayRationalePanel({
  rationale,
}: HandoffContextRelayRationalePanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Handoff context"
      title="Relay rationale"
      ariaLabel="Handoff context relay rationale preview"
    >
      <p style={workplaneCopyStyle}>
        Bounded context selection derived from the existing Continuity Relay and
        Handoff Capsule / Codex Launch Card preview. It explains why refs are
        included before any manual copy; it does not send, execute, promote, or
        apply state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Selected"
          value={rationale.selected_refs.length}
        />
        <WorkplanePanelMetric
          label="Why"
          value={rationale.why_included.length}
        />
        <WorkplanePanelMetric
          label="Warnings"
          value={rationale.stale_or_gap_warnings.length}
        />
        <WorkplanePanelMetric
          label="Stop"
          value={rationale.stop_if_missing.length}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <SelectedRefsSection refs={rationale.selected_refs} />
        <WarningsSection warnings={rationale.stale_or_gap_warnings} />
        <StopSection items={rationale.stop_if_missing} />
        <ReturnSignalSection rationale={rationale} />
      </section>

      <section aria-label="Handoff context relay non-goals" style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>non-goals</span>
        <ul style={workplaneListStyle}>
          {rationale.non_goals.slice(0, 6).map((nonGoal) => (
            <li key={nonGoal} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{nonGoal}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Handoff context relay authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only context compilation</strong>
        <span style={workplaneCopyStyle}>
          source_of_truth {String(rationale.authority_boundary.source_of_truth)}
          ; can_send_handoff{" "}
          {String(rationale.authority_boundary.can_send_handoff)};
          can_execute_codex{" "}
          {String(rationale.authority_boundary.can_execute_codex)};
          can_mutate_memory{" "}
          {String(rationale.authority_boundary.can_mutate_memory)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function SelectedRefsSection({
  refs,
}: {
  refs: HandoffContextRelaySelectedRef[];
}) {
  return (
    <section aria-label="Handoff context selected refs" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>selected refs</span>
      <p style={workplaneCopyStyle}>
        Included context refs with explicit reason categories.
      </p>
      <ul style={workplaneListStyle}>
        {refs.slice(0, 5).map((ref) => (
          <li key={ref.ref_id} style={workplaneItemStyle}>
            <strong>{ref.label}</strong>
            <span style={workplaneCopyStyle}>{ref.summary}</span>
            <span style={workplaneCopyStyle}>{ref.reason_category}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WarningsSection({
  warnings,
}: {
  warnings: HandoffContextRelayWarning[];
}) {
  return (
    <section aria-label="Handoff context stale or gap warnings" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>stale/gaps</span>
      <p style={workplaneCopyStyle}>
        Warnings carried from relay and handoff preview status.
      </p>
      <ul style={workplaneListStyle}>
        {warnings.slice(0, 5).map((warning) => (
          <li key={warning.warning_id} style={workplaneItemStyle}>
            <strong>{warning.severity}</strong>
            <span style={workplaneCopyStyle}>{warning.summary}</span>
          </li>
        ))}
        {warnings.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>
              No stale or gap warnings materialized.
            </span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function StopSection({ items }: { items: HandoffContextRelayStopItem[] }) {
  return (
    <section aria-label="Handoff context stop if missing" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>stop if missing</span>
      <p style={workplaneCopyStyle}>
        Blockers that should stay visible before a confident handoff.
      </p>
      <ul style={workplaneListStyle}>
        {items.slice(0, 5).map((item) => (
          <li key={item.stop_id} style={workplaneItemStyle}>
            <strong>{String(item.blocks_handoff)}</strong>
            <span style={workplaneCopyStyle}>{item.summary}</span>
          </li>
        ))}
        {items.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>
              No stop-if-missing blockers materialized.
            </span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function ReturnSignalSection({
  rationale,
}: {
  rationale: HandoffContextRelayRationale;
}) {
  return (
    <section aria-label="Handoff context expected return signal" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>return signal</span>
      <p style={workplaneCopyStyle}>
        Lightweight fields a later result should return for expected/observed
        comparison.
      </p>
      <ul style={workplaneListStyle}>
        {[
          ...rationale.expected_return_signal.required_fields,
          ...rationale.expected_return_signal.context_feedback_fields,
        ]
          .slice(0, 7)
          .map((field) => (
            <li key={field} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{field}</span>
            </li>
          ))}
      </ul>
    </section>
  );
}
