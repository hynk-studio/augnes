import {
  ProjectDestinationActions,
  ProjectHomeRefreshAction,
} from "@/components/project-destination-actions";
import { ProjectControls } from "@/components/project-controls";
import type {
  ProjectHomeLineageAnchorV01,
  ProjectHomeProjectionV01,
  ProjectHomeSectionStateV01,
} from "@/types/vnext/project-home";

export function ProjectHome({
  projection,
}: {
  projection: ProjectHomeProjectionV01;
}) {
  const summary = projection.project_summary;
  const projectName = summary.project.display_name ?? "Unnamed project";
  const active = summary.is_active;

  return (
    <main
      className="project-home-shell"
      data-project-home="v0.1"
      data-project-home-active={active ? "true" : "false"}
    >
      <header className="project-home-header">
        <div>
          <p className="project-selector-eyebrow">Augnes · Project Home</p>
          <h1>{projectName}</h1>
          <p className="project-home-root">{summary.root_binding.local_root.normalized_path}</p>
          <p className="project-home-repository">
            {summary.repository
              ? `Repository ${summary.repository.display}`
              : "No project-scoped repository remote is available."}
          </p>
          <div className="project-home-badges" aria-label="Project status">
            <StatusBadge tone={rootTone(summary.root_availability)}>
              Root {humanize(summary.root_availability)}
            </StatusBadge>
            <StatusBadge tone={active ? "good" : "neutral"}>
              {active ? "Active project" : "Not active"}
            </StatusBadge>
            <StatusBadge tone="neutral">
              {summary.repository ? "Repository-backed" : "Local project"}
            </StatusBadge>
          </div>
        </div>
        <div className="project-home-actions" aria-label="Project Home actions">
          <a href="/projects">Project selection</a>
          <ProjectHomeRefreshAction />
        </div>
      </header>

      {!active ? (
        <section className="project-home-callout project-home-callout--attention" aria-labelledby="inactive-project-title">
          <div>
            <p className="project-home-kicker">Read-only deep link</p>
            <h2 id="inactive-project-title">This is not the active project</h2>
            <p>Opening this page did not switch projects or update recent-project ordering.</p>
          </div>
          <ProjectDestinationActions
            projectId={summary.project.project_id}
            expectedProjectId={summary.active_selection?.project_id ?? null}
            expectedRevision={summary.active_selection?.selection_revision ?? null}
          />
        </section>
      ) : null}

      {summary.root_availability !== "available" ? (
        <section className="project-home-callout project-home-callout--danger" aria-labelledby="root-recovery-title">
          <div>
            <p className="project-home-kicker">Root recovery required</p>
            <h2 id="root-recovery-title">The saved folder is {humanize(summary.root_availability)}</h2>
            <p>Project identity and semantic data remain stored. Locate the folder explicitly to rebind this project.</p>
          </div>
          <a href="/projects#recent-projects">Locate folder</a>
        </section>
      ) : null}

      <section id="attention" className="project-home-primary" aria-labelledby="attention-title">
        <SectionHeading
          id="attention-title"
          eyebrow="Immediate attention"
          title="Decisions that need you"
          state={projection.attention.state}
        />
        {projection.attention.items.length ? (
          <ol className="project-home-list">
            {projection.attention.items.map((item) => (
              <li key={item.proposal_id}>
                <div>
                  <strong>{item.summary}</strong>
                  <p>{item.reason}</p>
                  <time dateTime={item.created_at}>{formatTimestamp(item.created_at)}</time>
                </div>
                <Lineage anchors={item.lineage} />
              </li>
            ))}
          </ol>
        ) : (
          <EmptySection state={projection.attention.state} />
        )}
      </section>

      <div className="project-home-current-grid">
        <section id="accepted-state" className="project-home-panel" aria-labelledby="accepted-state-title">
          <SectionHeading
            id="accepted-state-title"
            eyebrow="Approved project state"
            title="Current accepted state"
            state={projection.accepted_state.state}
          />
          {projection.accepted_state.items.length ? (
            <ol className="project-home-list project-home-list--compact">
              {projection.accepted_state.items.map((item) => (
                <li key={`${item.updated_at}:${item.lineage.at(-1)?.record_id}`}>
                  <div>
                    <strong>{item.summary}</strong>
                    <p>Revision {item.revision} · <time dateTime={item.updated_at}>{formatTimestamp(item.updated_at)}</time></p>
                  </div>
                  <Lineage anchors={item.lineage} />
                </li>
              ))}
            </ol>
          ) : (
            <EmptySection state={projection.accepted_state.state} />
          )}
        </section>

        <section className="project-home-panel" aria-labelledby="working-projection-title">
          <SectionHeading
            id="working-projection-title"
            eyebrow="Projection, not project truth"
            title="Selected working context"
            state={projection.working_projection.state}
          />
          {projection.working_projection.summary ? (
            <div className="project-home-summary-block">
              <p>{projection.working_projection.summary}</p>
              <p className="project-home-meta">
                {projection.working_projection.source_currentness
                  ? `Currentness ${humanize(projection.working_projection.source_currentness)}`
                  : "Currentness unavailable"}
                {projection.working_projection.generated_at
                  ? ` · ${formatTimestamp(projection.working_projection.generated_at)}`
                  : ""}
              </p>
              {projection.working_projection.source_perspective_ref ? (
                <p className="project-home-meta">
                  Source Perspective {projection.working_projection.source_perspective_ref}
                  {projection.working_projection.source_revision === null
                    ? " · revision unavailable"
                    : ` · revision ${projection.working_projection.source_revision}`}
                </p>
              ) : null}
              <Lineage anchors={projection.working_projection.lineage} />
            </div>
          ) : (
            <EmptySection state={projection.working_projection.state} />
          )}
        </section>
      </div>

      <section className="project-home-panel" aria-labelledby="activity-title">
        <SectionHeading
          id="activity-title"
          eyebrow="Durable history"
          title="Recent meaningful activity"
          state={projection.recent_activity.state}
        />
        {projection.recent_activity.items.length ? (
          <ol className="project-home-timeline">
            {projection.recent_activity.items.map((item) => (
              <li key={`${item.activity_kind}:${item.lineage[0]?.record_id}`}>
                <div className="project-home-timeline-marker" aria-hidden="true" />
                <div>
                  <p className="project-home-kicker">{activityLabel(item.activity_kind)}</p>
                  <strong>{item.summary}</strong>
                  <p>{item.outcome} · <time dateTime={item.occurred_at}>{formatTimestamp(item.occurred_at)}</time></p>
                  <Lineage anchors={item.lineage} />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptySection state={projection.recent_activity.state} />
        )}
      </section>

      <section id="project-controls" className="project-home-readiness" aria-labelledby="readiness-title">
        <div className="project-home-readiness-heading">
          <div>
            <p className="project-home-kicker">Operational readiness</p>
            <h2 id="readiness-title">Project controls and optional capabilities</h2>
          </div>
          <StatusBadge tone="neutral">Local-only status</StatusBadge>
        </div>
        <div className="project-home-readiness-grid">
          <article>
            <h3>Automation</h3>
            <StatusBadge tone={controlTone(projection.automation.status)}>
              {humanize(projection.automation.status)}
            </StatusBadge>
            <p>{projection.automation.state.message}</p>
            <p className="project-home-meta">
              Control layer {projection.automation.policy_control_eligible ? "eligible" : "blocked"}
              {` · Admission ${humanize(projection.automation.admission_status)}`}
            </p>
            <h4>{projection.automation.policy_summary.title}</h4>
            <ul className="project-home-policy-list">
              {projection.automation.policy_summary.boundaries.map((boundary) => (
                <li key={boundary}>{boundary}</li>
              ))}
            </ul>
            <small>
              Pause blocks new automated work. It does not stop or rewrite an existing external process.
              {projection.automation.updated_at
                ? ` Last updated ${formatTimestamp(projection.automation.updated_at)}.`
                : " No project-specific choice has been saved."}
            </small>
            <ProjectControls projection={projection} kind="automation" />
          </article>
          <article>
            <h3>Personal Perspective</h3>
            <StatusBadge tone={controlTone(projection.personal_perspective.status)}>
              {humanize(projection.personal_perspective.status)}
            </StatusBadge>
            <p>{projection.personal_perspective.explanation}</p>
            <p className="project-home-meta">
              Eligible selected material {projection.personal_perspective.eligible_selected_count}
            </p>
            <small>
              This setting grants project-scoped selection permission only. It never creates or displays personal content.
              {projection.personal_perspective.updated_at
                ? ` Last updated ${formatTimestamp(projection.personal_perspective.updated_at)}.`
                : " Nothing is included until you choose explicitly."}
            </small>
            <ProjectControls projection={projection} kind="personal_perspective" />
          </article>
          <article>
            <h3>Capabilities</h3>
            <ul className="project-home-capabilities">
              {projection.capabilities.items.map((item) => (
                <li key={item.capability}>
                  <span>{capabilityLabel(item.capability)}</span>
                  <StatusBadge tone={capabilityTone(item.status)}>{humanize(item.status)}</StatusBadge>
                  <small>{item.summary}</small>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="project-home-panel" aria-labelledby="next-moves-title">
        <SectionHeading
          id="next-moves-title"
          eyebrow="Next moves"
          title="Choose where to continue"
          state={{
            section_state_version: "project_home_section_state.v0.1",
            status: "available",
            message: "These suggestions are deterministic navigation, not automated work selection.",
          }}
        />
        <ol className="project-home-next-moves">
          {projection.next_moves.map((move) => (
            <li key={move.move_id}>
              <div>
                <strong>{move.label}</strong>
                <p>{move.reason}</p>
              </div>
              {move.href ? <a href={move.href}>Continue</a> : <span>Use the explicit action above</span>}
            </li>
          ))}
        </ol>
      </section>

      <footer className="project-home-footer">
        <span>Generated from local project-scoped records at {formatTimestamp(projection.generated_at)}</span>
        <a href="/overview">Previous Augnes overview</a>
      </footer>
    </main>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  state,
}: {
  id: string;
  eyebrow: string;
  title: string;
  state: ProjectHomeSectionStateV01;
}) {
  return (
    <div className="project-home-section-heading">
      <div>
        <p className="project-home-kicker">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
      <StatusBadge tone={sectionTone(state.status)}>{humanize(state.status)}</StatusBadge>
    </div>
  );
}

function EmptySection({ state }: { state: ProjectHomeSectionStateV01 }) {
  return <p className="project-home-empty">{state.message}</p>;
}

function Lineage({ anchors }: { anchors: ProjectHomeLineageAnchorV01[] }) {
  if (!anchors.length) return null;
  return (
    <details className="project-home-lineage">
      <summary>Why this appears</summary>
      <ol>
        {anchors.map((anchor) => (
          <li key={`${anchor.record_kind}:${anchor.record_id}:${anchor.role}`}>
            <span>{lineageRole(anchor.role)}</span>
            <code>{anchor.record_id}</code>
            <time dateTime={anchor.occurred_at}>{formatTimestamp(anchor.occurred_at)}</time>
          </li>
        ))}
      </ol>
    </details>
  );
}

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "good" | "attention" | "danger" | "neutral";
}) {
  return <span className={`project-home-status project-home-status--${tone}`}>{children}</span>;
}

function rootTone(value: ProjectHomeProjectionV01["project_summary"]["root_availability"]) {
  return value === "available" ? "good" as const : "danger" as const;
}

function sectionTone(value: ProjectHomeSectionStateV01["status"]) {
  if (value === "action_required") return "attention" as const;
  if (value === "error") return "danger" as const;
  if (value === "available") return "good" as const;
  return "neutral" as const;
}

function capabilityTone(value: ProjectHomeProjectionV01["capabilities"]["items"][number]["status"]) {
  if (value === "available") return "good" as const;
  if (value === "action_required" || value === "misconfigured") return "attention" as const;
  return "neutral" as const;
}

function controlTone(
  value:
    | ProjectHomeProjectionV01["automation"]["status"]
    | ProjectHomeProjectionV01["personal_perspective"]["status"],
) {
  if (value === "enabled" || value === "included") return "good" as const;
  if (value === "paused" || value === "excluded") return "attention" as const;
  return "neutral" as const;
}

function activityLabel(value: ProjectHomeProjectionV01["recent_activity"]["items"][number]["activity_kind"]) {
  return ({
    accepted_transition: "Accepted transition",
    review_decision: "Review decision",
    run_receipt: "Run result",
  } as const)[value];
}

function capabilityLabel(value: ProjectHomeProjectionV01["capabilities"]["items"][number]["capability"]) {
  return ({
    openai: "OpenAI",
    codex_native_host: "Codex / native host",
    github: "GitHub",
    mcp: "MCP",
    scheduler: "Scheduler",
  } as const)[value];
}

function lineageRole(value: ProjectHomeLineageAnchorV01["role"]) {
  return ({
    accepted_state: "Accepted state",
    source_proposal: "Source proposal",
    decision: "Review decision",
    durable_transition: "Durable transition",
    run_result: "Run result",
    selected_working_context: "Selected working context",
  } as const)[value];
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function formatTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(parsed);
}
