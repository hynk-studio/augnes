import type {
  AugnesMetricAuthorityBoundary,
  AugnesWorkflowMetric,
  AugnesWorkflowMetricGroup,
  AugnesWorkflowMetricsRead,
} from "@/types/augnes-workflow-metrics";
import type { CSSProperties, ReactNode } from "react";

type WorkplaneMetricsPanelProps = {
  metrics: AugnesWorkflowMetricsRead;
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

const metricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
  gap: "7px",
  minWidth: 0,
};

const metricStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
  padding: "9px",
  border: "1px solid rgba(15, 23, 42, 0.1)",
  borderRadius: "8px",
  background: "#f8fafc",
  overflowWrap: "anywhere",
};

const metricTitleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "0.76rem",
  lineHeight: 1.3,
  fontWeight: 780,
};

const metricValueStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "1rem",
  lineHeight: 1.1,
  fontWeight: 820,
};

const metaStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "0.68rem",
  lineHeight: 1.35,
  overflowWrap: "anywhere",
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const pillStyle: CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  maxWidth: "100%",
  padding: "3px 7px",
  borderRadius: "8px",
  background: "#eef2ff",
  color: "#3730a3",
  fontSize: "0.68rem",
  fontWeight: 820,
  textTransform: "uppercase",
  overflowWrap: "anywhere",
};

export function WorkplaneMetricsPanel({
  metrics,
}: WorkplaneMetricsPanelProps) {
  const runnerGroup = groupById(metrics.groups, "runner");
  const workplaneGroup = groupById(metrics.groups, "workplane");
  const guidebriefGroup = groupById(metrics.groups, "guidebrief");
  const staleGroup = groupById(metrics.groups, "stale_context");
  const cockpitGroup = groupById(metrics.groups, "cockpit_absorption");
  const dogfoodGroup = groupById(metrics.groups, "dogfood_readiness");

  return (
    <section
      aria-label="Runner Workplane Metrics"
      data-workplane-metrics-panel="v0.1"
      data-workplane-metrics-status={metrics.status}
      style={panelStyle}
    >
      <header style={headerStyle}>
        <p style={kickerStyle}>Runner / Workplane metrics</p>
        <h2 style={titleStyle}>Native Absorption Signals</h2>
        <p style={copyStyle}>
          Metrics are signals, not authority or auto-apply decisions. They do
          not execute runners, recover DeltaBatches, write state, shrink Legacy
          Cockpit, or approve work.
        </p>
      </header>

      <MetricsSection title="Summary">
        <p style={copyStyle}>{metrics.summary}</p>
        <span style={pillStyle}>{metrics.status}</span>
        {metrics.caveats.length > 0 ? (
          <p style={metaStyle}>Caveat: {metrics.caveats[0]}</p>
        ) : null}
      </MetricsSection>

      <MetricGroupSection title="Runner metrics" group={runnerGroup} />
      <MetricGroupSection title="Workplane metrics" group={workplaneGroup} />
      <MetricGroupSection
        title="GuideBrief / intent projection metrics"
        group={guidebriefGroup}
      />
      <MetricGroupSection
        title="Stale/fallback metrics"
        group={staleGroup}
      />
      <MetricGroupSection
        title="Cockpit absorption readiness"
        group={cockpitGroup}
      />
      <MetricGroupSection title="Dogfood readiness" group={dogfoodGroup} />

      <MetricsSection title="Authority boundary">
        <AuthorityBoundary authority={metrics.authority_boundary} />
      </MetricsSection>

      <MetricsSection title="Validation summary">
        <ul style={listStyle}>
          {metrics.validation_summary.smoke_refs.map((ref) => (
            <li key={ref} style={metricStyle}>
              <p style={metricTitleStyle}>{ref}</p>
            </li>
          ))}
        </ul>
      </MetricsSection>
    </section>
  );
}

function MetricGroupSection({
  title,
  group,
}: {
  title: string;
  group: AugnesWorkflowMetricGroup | null;
}) {
  if (!group) {
    return (
      <MetricsSection title={title}>
        <p style={copyStyle}>No metric group materialized.</p>
      </MetricsSection>
    );
  }

  return (
    <MetricsSection title={title}>
      <p style={copyStyle}>{group.summary}</p>
      <div style={metricGridStyle}>
        {group.metrics.slice(0, 6).map((metric) => (
          <MetricTile key={metric.metric_id} metric={metric} />
        ))}
      </div>
    </MetricsSection>
  );
}

function MetricTile({ metric }: { metric: AugnesWorkflowMetric }) {
  return (
    <article style={metricStyle}>
      <p style={metricTitleStyle}>{metric.label}</p>
      <p style={metricValueStyle}>{formatMetricValue(metric)}</p>
      <p style={metaStyle}>
        {metric.status}; trend: {metric.trend}
      </p>
      <p style={metaStyle}>{metric.summary}</p>
    </article>
  );
}

function MetricsSection({
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

function AuthorityBoundary({
  authority,
}: {
  authority: AugnesMetricAuthorityBoundary;
}) {
  const denied: Array<[string, boolean]> = [
    ["write DB", authority.can_write_db],
    ["write runner ledger", authority.can_write_runner_ledger],
    ["record proof", authority.can_record_proof],
    ["create evidence", authority.can_create_evidence],
    ["execute runner", authority.can_execute_runner],
    ["schedule runner", authority.can_schedule_runner],
    ["recover DeltaBatch", authority.can_recover_delta_batch],
    ["call provider/OpenAI", authority.can_call_provider_openai],
    ["call GitHub", authority.can_call_github],
    ["execute Codex", authority.can_execute_codex],
    ["apply Perspective", authority.can_apply_project_perspective],
    ["auto-apply delta", authority.can_auto_apply_delta],
    ["delete Legacy Cockpit", authority.can_delete_legacy_cockpit],
  ];

  return (
    <ul style={listStyle}>
      {denied.map(([label, value]) => (
        <li key={label} style={metricStyle}>
          <p style={metricTitleStyle}>{label}</p>
          <p style={metaStyle}>allowed: {String(value)}</p>
        </li>
      ))}
    </ul>
  );
}

function groupById(
  groups: AugnesWorkflowMetricGroup[],
  groupId: AugnesWorkflowMetricGroup["group_id"],
) {
  return groups.find((group) => group.group_id === groupId) ?? null;
}

function formatMetricValue(metric: AugnesWorkflowMetric) {
  if (metric.value === null) return "insufficient";
  if (metric.unit === "ratio") return `${Math.round(metric.value * 100)}%`;
  if (metric.unit === "milliseconds") return `${Math.round(metric.value)} ms`;
  return String(Math.round(metric.value * 100) / 100);
}
