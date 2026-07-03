import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type {
  WorkplaneStateProposalReviewGroup,
  WorkplaneStateProposalReviewItem,
  WorkplaneStateProposalReviewRead,
} from "@/types/workplane-state-proposal-review";
import type { CSSProperties } from "react";

const panelStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "14px",
  border: "1px solid rgba(30, 41, 59, 0.12)",
  borderRadius: "8px",
  background: "rgba(255, 255, 255, 0.94)",
  boxShadow: "0 18px 36px rgba(15, 23, 42, 0.06)",
  overflow: "hidden",
};

const headingStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const kickerStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "0.72rem",
  fontWeight: 820,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "1.02rem",
  lineHeight: 1.2,
  overflowWrap: "anywhere",
};

const groupGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

const groupStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
  padding: "10px",
  border: "1px solid rgba(30, 41, 59, 0.1)",
  borderRadius: "8px",
  background: "#f8fafc",
};

const itemStyle: CSSProperties = {
  ...workplaneItemStyle,
  background: "#ffffff",
};

const itemMetaStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

export function StateProposalReviewPanel({
  read,
}: {
  read: WorkplaneStateProposalReviewRead;
}) {
  return (
    <section
      aria-label="Workplane State Proposal Review panel"
      data-workplane-state-proposal-review-panel="v0.1"
      data-workplane-panel-id="state_proposal_review"
      data-workplane-node-id="state_proposal_review"
      data-workplane-node-kind="proposal_review_context"
      data-workplane-node-status={read.status}
      data-state-proposal-review-authority-boundary="read_only_no_apply"
      data-state-proposal-review-source-status={read.source_status}
      data-cockpit-manual-controls-migration="v0.1"
      style={panelStyle}
    >
      <div style={headingStyle}>
        <p style={kickerStyle}>Workplane State Proposal Review</p>
        <h2 style={titleStyle}>Proposed state-change review</h2>
      </div>

      <p style={workplaneCopyStyle}>
        State Proposal Review is for reviewing proposed state changes before
        they become durable state. Field-level diffs, before/after previews,
        source refs, impact, stale/fallback warnings, and authority boundaries
        are visible here. This panel does not approve, reject, commit, apply
        memory, apply Perspective, or auto-apply deltas.
      </p>

      <p style={workplaneCopyStyle}>
        Safe manual preview/copy controls are now reviewable in Workplane State
        Proposal Review. Local-write/apply/commit/reject controls remain
        blocked until a separate authority contract. Obsolete external
        execution and duplicate Cockpit shell controls are delete candidates,
        not migration targets.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Groups" value={read.summary.group_count} />
        <WorkplanePanelMetric label="Review rows" value={read.summary.item_count} />
        <WorkplanePanelMetric
          label="Source refs"
          value={read.summary.source_ref_count}
        />
        <WorkplanePanelMetric
          label="User judgment"
          value={read.summary.needs_user_judgment_count}
        />
        <WorkplanePanelMetric
          label="Manual migrated"
          value={read.summary.manual_control_migration_count}
        />
        <WorkplanePanelMetric
          label="Manual blocked"
          value={read.summary.blocked_manual_control_count}
        />
        <WorkplanePanelMetric
          label="Obsolete controls"
          value={read.summary.obsolete_manual_control_count}
        />
      </WorkplanePanelMetricGrid>

      <section
        aria-label="Cockpit manual controls migration summary"
        data-cockpit-manual-controls-migration="v0.1"
        style={groupStyle}
      >
        <h3 style={{ margin: 0, fontSize: "0.82rem", color: "#0f172a" }}>
          Cockpit manual controls migration
        </h3>
        <p style={workplaneCopyStyle}>
          Migrated review rows:{" "}
          {read.manual_control_migration_summary.migrated_native_review_count}.
          Blocked controls:{" "}
          {read.manual_control_migration_summary.retained_blocked_count +
            read.manual_control_migration_summary
              .needs_authority_contract_count}
          . Obsolete delete candidates:{" "}
          {read.manual_control_migration_summary.obsolete_delete_count}.
        </p>
      </section>

      <div style={groupGridStyle}>
        {read.proposal_groups.map((group) => (
          <ReviewGroup
            group={group}
            key={group.group_id}
            sourceStatus={read.source_status}
          />
        ))}
      </div>

      <section
        aria-label="State Proposal Review authority boundary"
        data-state-proposal-review-authority-boundary="read_only_no_apply"
        style={groupStyle}
      >
        <h3 style={{ margin: 0, fontSize: "0.82rem", color: "#0f172a" }}>
          Authority boundary
        </h3>
        <ul style={workplaneListStyle}>
          {read.authority_boundary.notes.map((note) => (
            <li key={note} style={itemStyle}>
              <span style={workplaneCopyStyle}>{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <p style={workplaneCopyStyle}>
        Status: {read.status}. Source status: {read.source_status}. Fallback
        reason: {read.fallback_reason ?? "none"}. Next review targets:{" "}
        {read.next_review_targets.join(", ") || "none"}.
      </p>
    </section>
  );
}

function ReviewGroup({
  group,
  sourceStatus,
}: {
  group: WorkplaneStateProposalReviewGroup;
  sourceStatus: WorkplaneStateProposalReviewRead["source_status"];
}) {
  return (
    <section
      aria-label={group.title}
      data-state-proposal-review-group-id={group.group_id}
      data-state-proposal-review-source-status={sourceStatus}
      style={groupStyle}
    >
      <div style={itemMetaStyle}>
        <span style={workplaneBadgeStyle}>{group.status}</span>
        <h3 style={{ margin: 0, fontSize: "0.82rem", color: "#0f172a" }}>
          {group.title}
        </h3>
        <p style={workplaneCopyStyle}>{group.summary}</p>
        <p style={workplaneCopyStyle}>
          Source refs: {group.source_refs.slice(0, 3).join("; ") || "none"}.
          Gaps: {group.gaps.join(" ") || "none"}.
        </p>
      </div>

      <ul style={workplaneListStyle}>
        {group.review_items.map((item) => (
          <ReviewItem item={item} key={item.item_id} />
        ))}
      </ul>

      <p style={workplaneCopyStyle}>{group.authority_note}</p>
    </section>
  );
}

function ReviewItem({ item }: { item: WorkplaneStateProposalReviewItem }) {
  const manualControlRecord = item.manual_control_migration_record;

  return (
    <li
      data-state-proposal-review-item-kind={item.item_kind}
      data-cockpit-manual-control-id={manualControlRecord?.control_id}
      data-cockpit-manual-control-migration-status={
        manualControlRecord?.migration_status
      }
      data-cockpit-manual-control-destination={manualControlRecord?.destination}
      data-cockpit-manual-control-authority-class={
        manualControlRecord?.authority_class
      }
      style={itemStyle}
    >
      <span style={workplaneBadgeStyle}>{item.item_kind}</span>
      <strong>{item.title}</strong>
      <span style={workplaneCopyStyle}>Status: {item.status}</span>
      {item.field_path ? (
        <span style={workplaneCopyStyle}>Field: {item.field_path}</span>
      ) : null}
      {item.before_label || item.after_label ? (
        <span style={workplaneCopyStyle}>
          {item.before_label ?? "Before"}:{" "}
          {item.before_value_preview ?? "not materialized"};{" "}
          {item.after_label ?? "After"}:{" "}
          {item.after_value_preview ?? "not materialized"}.
        </span>
      ) : null}
      <span style={workplaneCopyStyle}>
        Impact: {item.impact_summary ?? "none materialized"}.
      </span>
      <span style={workplaneCopyStyle}>
        Risk: {item.risk_level}. Needs user judgment:{" "}
        {item.needs_user_judgment ? "yes" : "no"}.
      </span>
      <span style={workplaneCopyStyle}>
        Source refs: {item.source_refs.slice(0, 4).join("; ") || "none"}.
      </span>
      {manualControlRecord ? (
        <span style={workplaneCopyStyle}>
          Manual control: {manualControlRecord.control_id}. Destination:{" "}
          {manualControlRecord.destination}. Migration status:{" "}
          {manualControlRecord.migration_status}. Authority class:{" "}
          {manualControlRecord.authority_class}. Blocked until:{" "}
          {manualControlRecord.blocked_until}. Delete when:{" "}
          {manualControlRecord.delete_when}.
        </span>
      ) : null}
      <small style={workplaneCopyStyle}>{item.authority_note}</small>
    </li>
  );
}
