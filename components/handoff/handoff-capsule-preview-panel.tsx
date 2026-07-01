import type { HandoffCapsulePreviewForWeb } from "@/lib/handoff/read-handoff-capsule-for-web";
import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";

type HandoffCapsulePreviewPanelProps = {
  preview: HandoffCapsulePreviewForWeb;
};

export function HandoffCapsulePreviewPanel({
  preview,
}: HandoffCapsulePreviewPanelProps) {
  const capsule = preview.capsule;

  return (
    <WorkplanePanelShell
      kicker="Phase 7C preview"
      title="Handoff Capsule preview"
      ariaLabel="Handoff Capsule read-only Web preview"
    >
      <p style={workplaneCopyStyle}>
        Preview only: no send, no launch, no execution, no mutation. This panel
        renders Handoff Capsule review context and source/fallback status only.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Target" value={capsule.target_surface} />
        <WorkplanePanelMetric label="Actor" value={capsule.target_actor} />
        <WorkplanePanelMetric label="Intent" value={capsule.handoff_intent} />
        <WorkplanePanelMetric label="Status" value={capsule.status} />
      </WorkplanePanelMetricGrid>

      <SummaryBlock
        title={capsule.title}
        summary={capsule.summary}
        thesis={capsule.thesis}
      />

      <SourceStatus preview={preview} />

      <ContextSection
        title="Observed"
        description="Source-backed observations only."
        items={capsule.observed_context.map((item) => ({
          id: item.context_id,
          title: item.kind,
          body: item.summary,
          meta: item.source_refs.join(", "),
        }))}
      />

      <ContextSection
        title="Inferred"
        description="Derived interpretation only; inferred context is not source fact."
        items={capsule.inferred_context.map((item) => ({
          id: item.context_id,
          title: item.confidence,
          body: item.summary,
          meta: item.caveats.join(" "),
        }))}
      />

      <ContextSection
        title="Suggested"
        description="Advisory only. Suggestions are not commands."
        items={capsule.suggested_context.map((item) => ({
          id: item.context_id,
          title: item.title,
          body: item.summary,
          meta: item.authority_boundary_summary,
        }))}
      />

      <ContextSection
        title="Needs user judgment"
        description="Unresolved decisions are surfaced, not decided by the packet."
        items={capsule.needs_user_judgment.map((item) => ({
          id: item.context_id,
          title: item.urgency,
          body: item.question,
          meta: item.why_it_matters,
        }))}
      />

      <ContextSection
        title="Selected delta refs"
        description="Pointer-only selected deltas; no apply, approve, reject, or mutation."
        items={capsule.selected_delta_refs.map((item) => ({
          id: item.delta_id,
          title: item.delta_id,
          body: item.reason,
          meta: item.source_refs.join(", "),
        }))}
        emptyText="No selected delta refs materialized for this Web preview."
      />

      <ContextSection
        title="Validation expectations"
        description="Checks and skipped-check policy for future separately scoped work."
        items={[
          ...capsule.validation_expectations.required_checks.map((check) => ({
            id: `required:${check}`,
            title: "required check",
            body: check,
            meta: "Run only when the active operator prompt scopes execution.",
          })),
          ...capsule.validation_expectations.skipped_check_policy.map(
            (policy) => ({
              id: `skipped:${policy}`,
              title: "skipped-check policy",
              body: policy,
              meta: "Skipped checks must be reported honestly.",
            }),
          ),
        ]}
      />

      <ContextSection
        title="Constraints and forbidden actions"
        description="Transfer constraints and non-goals remain visible."
        items={[
          ...capsule.constraints.boundary_notes.map((note) => ({
            id: `constraint:${note}`,
            title: "constraint",
            body: note,
            meta: "Review/preparation state only.",
          })),
          ...capsule.forbidden_actions.slice(0, 6).map((action) => ({
            id: `forbidden:${action}`,
            title: "forbidden action",
            body: action,
            meta: "Denied by Handoff Capsule authority boundary.",
          })),
        ]}
      />

      <ContextSection
        title="Source refs"
        description="Compact source refs. Long refs wrap instead of overflowing."
        items={[
          capsule.source_refs.guide_brief_ref,
          capsule.source_refs.current_working_perspective_ref,
          capsule.source_refs.delta_projection_ref,
          capsule.source_refs.workplane_ref,
          ...capsule.source_refs.route_refs,
          ...capsule.source_refs.docs_refs.slice(0, 4),
        ].map((ref) => ({
          id: ref,
          title: "source ref",
          body: ref,
          meta: "Pointer only; not proof, evidence, source of truth, or execution authority.",
        }))}
      />

      <ContextSection
        title="Warnings"
        description="Fallback, staleness, and preview-boundary warnings."
        items={preview.warnings.map((warning) => ({
          id: warning,
          title: "warning",
          body: warning,
          meta: capsule.staleness.refresh_suggestion,
        }))}
      />
    </WorkplanePanelShell>
  );
}

function SummaryBlock({
  title,
  summary,
  thesis,
}: {
  title: string;
  summary: string;
  thesis: string;
}) {
  return (
    <section aria-label="Handoff Capsule summary" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>summary</span>
      <strong>{title}</strong>
      <span style={workplaneCopyStyle}>{summary}</span>
      <span style={workplaneCopyStyle}>{thesis}</span>
    </section>
  );
}

function SourceStatus({ preview }: { preview: HandoffCapsulePreviewForWeb }) {
  return (
    <section aria-label="Handoff Capsule source and fallback status" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>source/fallback status</span>
      <strong>{preview.source_status.source}</strong>
      <span style={workplaneCopyStyle}>
        Capsule: {preview.source_status.capsule}
      </span>
      <span style={workplaneCopyStyle}>
        Launch Card: {preview.source_status.launch_card}
      </span>
      <span style={workplaneCopyStyle}>
        {preview.source_status.source_disclosure}
      </span>
      {preview.fallback_reasons.length > 0 ? (
        <ul style={workplaneListStyle}>
          {preview.fallback_reasons.map((reason) => (
            <li key={reason} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{reason}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ContextSection({
  title,
  description,
  items,
  emptyText = "No preview items materialized.",
}: {
  title: string;
  description: string;
  items: Array<{ id: string; title: string; body: string; meta: string }>;
  emptyText?: string;
}) {
  return (
    <section aria-label={`Handoff Capsule ${title}`} style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>{title}</span>
      <p style={workplaneCopyStyle}>{description}</p>
      <ul style={workplaneListStyle}>
        {items.slice(0, 6).map((item) => (
          <li key={item.id} style={workplaneItemStyle}>
            <strong>{item.title}</strong>
            <span style={workplaneCopyStyle}>{item.body}</span>
            <span style={workplaneCopyStyle}>{item.meta}</span>
          </li>
        ))}
        {items.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{emptyText}</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
