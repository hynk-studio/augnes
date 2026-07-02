import type {
  GuideWorkplaneDebugContext,
  GuideWorkplaneDebugInferredItem,
  GuideWorkplaneDebugNeedsUserJudgmentItem,
  GuideWorkplaneDebugObservedItem,
  GuideWorkplaneDebugStaleWarning,
  GuideWorkplaneDebugSuggestion,
  GuideWorkplaneDebugTraceStep,
} from "@/types/guide-debug-context";
import type { CSSProperties, ReactNode } from "react";

type GuideWorkplaneDebugPanelProps = {
  debugContext: GuideWorkplaneDebugContext;
};

const panelStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  minWidth: 0,
  boxSizing: "border-box",
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
  background: "#e0f2fe",
  color: "#075985",
  fontSize: "0.68rem",
  lineHeight: 1.25,
  overflowWrap: "anywhere",
};

export function GuideWorkplaneDebugPanel({
  debugContext,
}: GuideWorkplaneDebugPanelProps) {
  const selected = debugContext.selected_context;

  return (
    <aside
      aria-label="GuideBrief Workplane Debug Context"
      data-guide-workplane-debug-panel="v0.1"
      data-guide-workplane-debug-selected-panel-id={
        selected.selected_panel_id ?? selected.matched_panel_id ?? undefined
      }
      data-guide-workplane-debug-selected-node-id={
        selected.selected_node_id ?? selected.matched_node_id ?? undefined
      }
      data-guide-workplane-debug-selection-status={selected.selection_status}
      style={panelStyle}
    >
      <header style={headerStyle}>
        <p style={kickerStyle}>GuideBrief debug</p>
        <h2 style={titleStyle}>Workplane Debug Context</h2>
        <p style={copyStyle}>
          Read-only debug context for explaining selected Workplane panels,
          nodes, and refs. This is not intent projection and not execution.
        </p>
      </header>

      <DebugSection title="Selected context">
        <ul style={listStyle}>
          <li style={itemStyle}>
            <p style={itemTitleStyle}>{selected.title}</p>
            <p style={copyStyle}>{selected.summary}</p>
            <p style={metaStyle}>
              selection: {selected.selection_status}; panel:{" "}
              {selected.matched_panel_id ?? selected.selected_panel_id ?? "none"};
              node:{" "}
              {selected.matched_node_id ?? selected.selected_node_id ?? "none"}
            </p>
            <p style={metaStyle}>
              kind: {selected.matched_kind ?? "none"}; status:{" "}
              {selected.matched_status ?? "none"}
            </p>
          </li>
        </ul>
      </DebugSection>

      <DebugSection title="Observed">
        <ul style={listStyle}>
          {debugContext.observed.slice(0, 4).map((item) => (
            <ObservedItem key={item.observed_id} item={item} />
          ))}
        </ul>
      </DebugSection>

      <DebugSection title="Inferred">
        <ul style={listStyle}>
          {debugContext.inferred.slice(0, 4).map((item) => (
            <InferredItem key={item.inference_id} item={item} />
          ))}
        </ul>
      </DebugSection>

      <DebugSection title="Suggested">
        <ul style={listStyle}>
          {debugContext.suggested.slice(0, 4).map((item) => (
            <SuggestedItem key={item.suggestion_id} item={item} />
          ))}
        </ul>
      </DebugSection>

      <DebugSection title="Needs user judgment">
        <ul style={listStyle}>
          {debugContext.needs_user_judgment.length > 0 ? (
            debugContext.needs_user_judgment.slice(0, 4).map((item) => (
              <JudgmentItem key={item.judgment_id} item={item} />
            ))
          ) : (
            <li style={itemStyle}>
              <p style={copyStyle}>
                No unresolved user judgment item was produced for this selected
                context.
              </p>
            </li>
          )}
        </ul>
      </DebugSection>

      <DebugSection title="Source refs">
        <PillList values={debugContext.source_refs.slice(0, 12)} />
      </DebugSection>

      <DebugSection title="Debug trace">
        <ul style={listStyle}>
          {debugContext.debug_trace.map((item) => (
            <TraceItem key={item.trace_step_id} item={item} />
          ))}
        </ul>
      </DebugSection>

      <DebugSection title="Validation summary">
        <PillList values={debugContext.validation_summary.smoke_refs} />
        <p style={metaStyle}>{debugContext.validation_summary.notes[0]}</p>
      </DebugSection>

      <DebugSection title="Stale warnings">
        <ul style={listStyle}>
          {debugContext.stale_warnings.length > 0 ? (
            debugContext.stale_warnings.slice(0, 4).map((item) => (
              <WarningItem key={item.warning_id} item={item} />
            ))
          ) : (
            <li style={itemStyle}>
              <p style={copyStyle}>No stale warning was produced.</p>
            </li>
          )}
        </ul>
      </DebugSection>

      <DebugSection title="Authority boundary">
        <p style={copyStyle}>
          Read-only debug context. No UI action authority, no intent projection,
          no route, no write, no runner execution, no Codex launch, no GitHub
          actuation, no provider/OpenAI call, no durable memory apply, no
          Perspective apply, and no delta auto-apply.
        </p>
      </DebugSection>

      <DebugSection title="Codex debug handoff candidate">
        <ul style={listStyle}>
          <li style={itemStyle}>
            <p style={itemTitleStyle}>
              {debugContext.codex_debug_handoff_candidate.title}
            </p>
            <p style={copyStyle}>
              {debugContext.codex_debug_handoff_candidate.summary}
            </p>
            <p style={metaStyle}>
              status: {debugContext.codex_debug_handoff_candidate.status};
              preview_only:{" "}
              {String(debugContext.codex_debug_handoff_candidate.preview_only)}
            </p>
            <p style={metaStyle}>
              {debugContext.codex_debug_handoff_candidate.authority_boundary_summary}
            </p>
          </li>
        </ul>
      </DebugSection>
    </aside>
  );
}

function DebugSection({
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

function ObservedItem({ item }: { item: GuideWorkplaneDebugObservedItem }) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.kind}</p>
      <p style={copyStyle}>{item.summary}</p>
      <p style={metaStyle}>confidence: {item.confidence}</p>
    </li>
  );
}

function InferredItem({ item }: { item: GuideWorkplaneDebugInferredItem }) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.inference_id}</p>
      <p style={copyStyle}>{item.summary}</p>
      <p style={metaStyle}>confidence: {item.confidence}</p>
      {item.caveats.length > 0 ? (
        <p style={metaStyle}>caveat: {item.caveats[0]}</p>
      ) : null}
    </li>
  );
}

function SuggestedItem({ item }: { item: GuideWorkplaneDebugSuggestion }) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.title}</p>
      <p style={copyStyle}>{item.summary}</p>
      <p style={metaStyle}>check: {item.suggested_check}</p>
      <p style={metaStyle}>{item.authority_boundary_summary}</p>
    </li>
  );
}

function JudgmentItem({
  item,
}: {
  item: GuideWorkplaneDebugNeedsUserJudgmentItem;
}) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.question}</p>
      <p style={copyStyle}>{item.why_it_matters}</p>
      <p style={metaStyle}>
        urgency: {item.urgency}; options: {item.options.join(" / ")}
      </p>
    </li>
  );
}

function TraceItem({ item }: { item: GuideWorkplaneDebugTraceStep }) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.trace_step_id}</p>
      <p style={copyStyle}>{item.summary}</p>
      <p style={metaStyle}>status: {item.status}</p>
    </li>
  );
}

function WarningItem({ item }: { item: GuideWorkplaneDebugStaleWarning }) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.warning_id}</p>
      <p style={copyStyle}>{item.summary}</p>
      <p style={metaStyle}>
        severity: {item.severity}; blocks handoff:{" "}
        {String(item.blocks_debug_handoff)}
      </p>
    </li>
  );
}

function PillList({ values }: { values: string[] }) {
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
