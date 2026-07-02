import type {
  WorkplaneIntentCandidateAction,
  WorkplaneIntentCandidateHandoff,
  WorkplaneIntentCandidatePerspectiveUpdate,
  WorkplaneIntentCandidateRunnerConfig,
  WorkplaneIntentProjection,
} from "@/types/workplane-intent-projection";
import type { CSSProperties, ReactNode } from "react";

type GuideIntentProjectionPanelProps = {
  projection: WorkplaneIntentProjection;
};

const panelStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  minWidth: 0,
  padding: "14px",
  border: "1px solid rgba(15, 23, 42, 0.14)",
  borderRadius: "8px",
  background: "rgba(255, 255, 255, 0.94)",
  boxShadow: "0 14px 30px rgba(15, 23, 42, 0.07)",
  overflow: "hidden",
};

const headerStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
};

const kickerStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "0.68rem",
  fontWeight: 840,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "1rem",
  lineHeight: 1.2,
};

const copyStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "0.8rem",
  lineHeight: 1.42,
  overflowWrap: "anywhere",
};

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "0.86rem",
  lineHeight: 1.25,
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const itemStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
  padding: "9px",
  border: "1px solid rgba(15, 23, 42, 0.1)",
  borderRadius: "8px",
  background: "#f8fafc",
  overflowWrap: "anywhere",
};

const itemTitleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "0.78rem",
  lineHeight: 1.3,
  fontWeight: 760,
};

const metaStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "0.68rem",
  lineHeight: 1.35,
  overflowWrap: "anywhere",
};

const pillListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const pillStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "8px",
  background: "#f0fdf4",
  color: "#166534",
  fontSize: "0.68rem",
  lineHeight: 1.25,
  overflowWrap: "anywhere",
};

export function GuideIntentProjectionPanel({
  projection,
}: GuideIntentProjectionPanelProps) {
  return (
    <aside
      aria-label="GuideBrief Intent Projection"
      data-guide-intent-projection-panel="v0.1"
      data-guide-intent-class={projection.intent_class}
      data-guide-intent-projection-level={projection.projection_level}
      data-guide-intent-projection-status={projection.projection_status}
      style={panelStyle}
    >
      <header style={headerStyle}>
        <p style={kickerStyle}>GuideBrief intent projection</p>
        <h2 style={titleStyle}>Draft Projection Packet</h2>
        <p style={copyStyle}>
          This is not execution and not GuideBrief authority. It only explains
          reversible view focus and draft candidate packets.
        </p>
      </header>

      <IntentSection title="Original intent">
        <ul style={listStyle}>
          <li style={itemStyle}>
            <p style={itemTitleStyle}>{projection.original_user_intent}</p>
            <p style={copyStyle}>{projection.interpreted_intent.summary}</p>
            <p style={metaStyle}>
              class: {projection.intent_class}; level:{" "}
              {projection.projection_level}; status:{" "}
              {projection.projection_status}
            </p>
          </li>
        </ul>
      </IntentSection>

      <IntentSection title="Observed debug/context basis">
        <PillList values={projection.debug_context_refs} />
        <p style={metaStyle}>
          Source refs are pointer-only and remain separate from proof/evidence
          writes.
        </p>
      </IntentSection>

      <IntentSection title="Draft candidate actions">
        <ul style={listStyle}>
          {projection.candidate_actions.map((item) => (
            <CandidateActionItem key={item.action_id} item={item} />
          ))}
        </ul>
      </IntentSection>

      <IntentSection title="Candidate handoffs">
        <ul style={listStyle}>
          {projection.candidate_handoffs.length > 0 ? (
            projection.candidate_handoffs.map((item) => (
              <HandoffItem key={item.handoff_candidate_id} item={item} />
            ))
          ) : (
            <li style={itemStyle}>
              <p style={copyStyle}>No draft handoff candidate for this intent.</p>
            </li>
          )}
        </ul>
      </IntentSection>

      <IntentSection title="Candidate runner configs">
        <ul style={listStyle}>
          {projection.candidate_runner_configs.length > 0 ? (
            projection.candidate_runner_configs.map((item) => (
              <RunnerConfigItem
                key={item.runner_config_candidate_id}
                item={item}
              />
            ))
          ) : (
            <li style={itemStyle}>
              <p style={copyStyle}>
                No draft runner config candidate for this intent.
              </p>
            </li>
          )}
        </ul>
      </IntentSection>

      <IntentSection title="Candidate Perspective updates">
        <ul style={listStyle}>
          {projection.candidate_perspective_updates.length > 0 ? (
            projection.candidate_perspective_updates.map((item) => (
              <PerspectiveItem
                key={item.perspective_update_candidate_id}
                item={item}
              />
            ))
          ) : (
            <li style={itemStyle}>
              <p style={copyStyle}>
                No draft Perspective update candidate for this intent.
              </p>
            </li>
          )}
        </ul>
      </IntentSection>

      <IntentSection title="Validation summary">
        <PillList values={projection.validation_summary.smoke_refs} />
        <p style={metaStyle}>{projection.validation_summary.notes[0]}</p>
      </IntentSection>

      <IntentSection title="Stale warnings">
        <PillList values={projection.stale_warnings.slice(0, 8)} />
      </IntentSection>

      <IntentSection title="Needs user judgment">
        <ul style={listStyle}>
          {projection.needs_user_judgment.length > 0 ? (
            projection.needs_user_judgment.slice(0, 4).map((item) => (
              <li key={item.judgment_id} style={itemStyle}>
                <p style={itemTitleStyle}>{item.question}</p>
                <p style={copyStyle}>{item.why_it_matters}</p>
                <p style={metaStyle}>urgency: {item.urgency}</p>
              </li>
            ))
          ) : (
            <li style={itemStyle}>
              <p style={copyStyle}>
                No unresolved user judgment item was produced for this intent
                projection.
              </p>
            </li>
          )}
        </ul>
      </IntentSection>

      <IntentSection title="Authority boundary">
        <p style={copyStyle}>
          Draft projection authority only. Candidate handoff, runner config, and
          Perspective update packets are drafts. No send, execution, runner
          tick, recovery write, scheduled behavior, Codex launch, GitHub
          actuation, provider/OpenAI call, DB write, proof/evidence write,
          durable memory apply, Perspective apply, or delta auto-apply.
        </p>
      </IntentSection>
    </aside>
  );
}

function IntentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={sectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      {children}
    </section>
  );
}

function CandidateActionItem({ item }: { item: WorkplaneIntentCandidateAction }) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.title}</p>
      <p style={copyStyle}>{item.summary}</p>
      <p style={metaStyle}>
        status: {item.status}; reason: {item.non_executable_reason}
      </p>
    </li>
  );
}

function HandoffItem({ item }: { item: WorkplaneIntentCandidateHandoff }) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.title}</p>
      <p style={copyStyle}>{item.summary}</p>
      <p style={metaStyle}>
        status: {item.status}; target: {item.target_surface}
      </p>
    </li>
  );
}

function RunnerConfigItem({
  item,
}: {
  item: WorkplaneIntentCandidateRunnerConfig;
}) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.title}</p>
      <p style={copyStyle}>{item.summary}</p>
      <p style={metaStyle}>
        status: {item.status}; batches: {item.related_batch_ids.join(", ") || "none"}
      </p>
    </li>
  );
}

function PerspectiveItem({
  item,
}: {
  item: WorkplaneIntentCandidatePerspectiveUpdate;
}) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.title}</p>
      <p style={copyStyle}>{item.summary}</p>
      <p style={metaStyle}>
        status: {item.status}; lens: {item.proposed_lens}
      </p>
    </li>
  );
}

function PillList({ values }: { values: readonly string[] }) {
  return (
    <ul style={pillListStyle}>
      {values.length > 0 ? (
        values.map((value) => (
          <li key={value} style={pillStyle}>
            {value}
          </li>
        ))
      ) : (
        <li style={pillStyle}>none</li>
      )}
    </ul>
  );
}
