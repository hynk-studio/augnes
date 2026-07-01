import type {
  GuideBrief,
  GuideBriefHandoffCandidate,
  GuideBriefInferredItem,
  GuideBriefObservedItem,
  GuideBriefStalenessWarning,
  GuideBriefSuggestion,
  GuideBriefUserJudgmentItem,
} from "@/types/guide-brief";
import type { CSSProperties } from "react";
import { GuideBriefBoundaryCard } from "./guide-brief-boundary-card";
import { GuideBriefSection } from "./guide-brief-section";
import { GuideBriefSummaryCard } from "./guide-brief-summary-card";

export type GuideBriefPanelProps = {
  guideBrief: GuideBrief;
  variant: "home" | "perspective" | "workbench";
  maxObserved?: number;
  maxInferred?: number;
  maxSuggested?: number;
  maxJudgment?: number;
  maxWarnings?: number;
};

const panelStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  minWidth: 0,
  padding: "14px",
  border: "1px solid rgba(15, 23, 42, 0.14)",
  borderRadius: "8px",
  background: "rgba(255, 255, 255, 0.94)",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.07)",
  overflowX: "hidden",
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

const listStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const itemStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
  padding: "9px",
  border: "1px solid rgba(15, 23, 42, 0.1)",
  borderRadius: "7px",
  background: "rgba(248, 250, 252, 0.86)",
  overflowWrap: "anywhere",
};

const itemTitleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "0.79rem",
  lineHeight: 1.3,
  fontWeight: 760,
};

const itemCopyStyle: CSSProperties = {
  margin: 0,
  color: "#334155",
  fontSize: "0.76rem",
  lineHeight: 1.38,
  overflowWrap: "anywhere",
};

const metaStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "0.68rem",
  lineHeight: 1.35,
  overflowWrap: "anywhere",
};

const sourceListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const sourcePillStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "#f1f5f9",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  color: "#334155",
  fontSize: "0.67rem",
  lineHeight: 1.25,
  overflowWrap: "anywhere",
};

export function GuideBriefPanel({
  guideBrief,
  variant,
  maxObserved = 3,
  maxInferred = 2,
  maxSuggested = 3,
  maxJudgment = 2,
  maxWarnings = 2,
}: GuideBriefPanelProps) {
  const observed = guideBrief.observed.slice(0, maxObserved);
  const inferred = guideBrief.inferred.slice(0, maxInferred);
  const suggested = guideBrief.suggested.slice(0, maxSuggested);
  const judgments = guideBrief.needs_user_judgment.slice(0, maxJudgment);
  const warnings = guideBrief.staleness_warnings.slice(0, maxWarnings);
  const sourceRefs = [
    guideBrief.source_refs.current_working_perspective_ref,
    guideBrief.source_refs.delta_projection_ref,
    guideBrief.source_refs.workplane_ref,
    ...guideBrief.source_refs.route_refs,
  ].filter(Boolean);

  return (
    <aside
      aria-labelledby={`guide-brief-title-${variant}`}
      data-guide-brief-panel={variant}
      style={panelStyle}
    >
      <header style={headerStyle}>
        <p style={kickerStyle}>Web Guide</p>
        <h2 id={`guide-brief-title-${variant}`} style={titleStyle}>
          GuideBrief
        </h2>
        <p style={copyStyle}>
          A read-only guide packet for observing, inferring, suggesting, and
          identifying needs_user_judgment without action authority.
        </p>
      </header>

      <GuideBriefSummaryCard guideBrief={guideBrief} variant={variant} />

      <GuideBriefSection
        title="Observed"
        description="Source-backed read-model observations only."
        empty={observed.length === 0}
      >
        <ul style={listStyle}>
          {observed.map((item) => (
            <ObservedItem key={item.observation_id} item={item} />
          ))}
        </ul>
      </GuideBriefSection>

      <GuideBriefSection
        title="Inferred"
        description="Derived interpretation only; inferred items are not source facts."
        empty={inferred.length === 0}
      >
        <ul style={listStyle}>
          {inferred.map((item) => (
            <InferredItem key={item.inference_id} item={item} />
          ))}
        </ul>
      </GuideBriefSection>

      <GuideBriefSection
        title="Suggested"
        description="Candidate next actions or navigation suggestions only."
        empty={suggested.length === 0}
      >
        <ul style={listStyle}>
          {suggested.map((item) => (
            <SuggestedItem key={item.suggestion_id} item={item} />
          ))}
        </ul>
      </GuideBriefSection>

      <GuideBriefSection
        title="Needs user judgment"
        description="Unresolved choices for a user, operator, or PM."
        empty={judgments.length === 0}
      >
        <ul style={listStyle}>
          {judgments.map((item) => (
            <JudgmentItem key={item.judgment_id} item={item} />
          ))}
        </ul>
      </GuideBriefSection>

      <GuideBriefSection
        title="Staleness warnings"
        description="Refresh and handoff-blocking guidance from read-model staleness and gaps."
        empty={warnings.length === 0}
      >
        <ul style={listStyle}>
          {warnings.map((item) => (
            <WarningItem key={item.warning_id} item={item} />
          ))}
        </ul>
      </GuideBriefSection>

      {variant === "workbench" ? (
        <GuideBriefSection
          title="Handoff candidates"
          description="Preview-only handoff candidates; no send or launch control is rendered."
          empty={guideBrief.handoff_candidates.length === 0}
        >
          <ul style={listStyle}>
            {guideBrief.handoff_candidates.slice(0, 2).map((item) => (
              <HandoffCandidateItem
                key={item.handoff_candidate_id}
                item={item}
              />
            ))}
          </ul>
        </GuideBriefSection>
      ) : null}

      <GuideBriefBoundaryCard
        authorityBoundary={guideBrief.authority_boundary}
      />

      <GuideBriefSection
        title="Source refs"
        description="Compact source summary; long refs wrap instead of overflowing."
        empty={sourceRefs.length === 0}
      >
        <ul style={sourceListStyle}>
          {sourceRefs.slice(0, 8).map((ref) => (
            <li key={ref} style={sourcePillStyle}>
              {ref}
            </li>
          ))}
        </ul>
      </GuideBriefSection>
    </aside>
  );
}

function ObservedItem({ item }: { item: GuideBriefObservedItem }) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.kind}</p>
      <p style={itemCopyStyle}>{item.summary}</p>
      <p style={metaStyle}>confidence: {item.confidence}</p>
    </li>
  );
}

function InferredItem({ item }: { item: GuideBriefInferredItem }) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>Inference {item.inference_id}</p>
      <p style={itemCopyStyle}>{item.summary}</p>
      <p style={metaStyle}>confidence: {item.confidence}</p>
      {item.caveats.length > 0 ? (
        <p style={metaStyle}>caveat: {item.caveats[0]}</p>
      ) : null}
    </li>
  );
}

function SuggestedItem({ item }: { item: GuideBriefSuggestion }) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.title}</p>
      <p style={itemCopyStyle}>{item.summary}</p>
      <p style={metaStyle}>
        surface: {item.suggested_surface}; actor: {item.suggested_actor};
        priority: {item.priority}
      </p>
      <p style={metaStyle}>{item.authority_boundary_summary}</p>
    </li>
  );
}

function JudgmentItem({ item }: { item: GuideBriefUserJudgmentItem }) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.question}</p>
      <p style={itemCopyStyle}>{item.why_it_matters}</p>
      <p style={metaStyle}>
        urgency: {item.urgency}; options: {item.options.join(" / ")}
      </p>
    </li>
  );
}

function WarningItem({ item }: { item: GuideBriefStalenessWarning }) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.summary}</p>
      <p style={itemCopyStyle}>{item.refresh_suggestion}</p>
      <p style={metaStyle}>
        severity: {item.severity}; blocks handoff: {String(item.blocks_handoff)}
      </p>
    </li>
  );
}

function HandoffCandidateItem({
  item,
}: {
  item: GuideBriefHandoffCandidate;
}) {
  return (
    <li style={itemStyle}>
      <p style={itemTitleStyle}>{item.title}</p>
      <p style={itemCopyStyle}>{item.summary}</p>
      <p style={metaStyle}>
        target: {item.target_surface}; status: {item.status}
      </p>
      <p style={metaStyle}>{item.authority_boundary}</p>
    </li>
  );
}
