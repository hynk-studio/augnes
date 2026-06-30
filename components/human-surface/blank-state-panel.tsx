import { ModePresetSelector } from "@/components/human-surface/mode-preset-selector";

const startActions = [
  {
    title: "Continue previous work",
    summary: "Review current goals, deltas, and source gaps before entering a deeper surface.",
  },
  {
    title: "Recommend next from current perspective",
    summary: "Show candidate work from the read-only Current Working Perspective packet.",
  },
  {
    title: "Add context / material",
    summary: "Future intake starts here, but Phase 4A does not ingest or persist material.",
  },
  {
    title: "Prepare Codex handoff",
    summary: "Future handoff preview only; no Codex launch or execution is available here.",
  },
  {
    title: "Configure autonomy",
    summary: "Future contract area only; no runner, scheduler, or auto-apply behavior exists.",
  },
] as const;

export function BlankStatePanel() {
  return (
    <section className="human-surface-blank-state" aria-labelledby="blank-state-title">
      <div className="human-surface-section-heading">
        <p>Guided Blank State</p>
        <h2 id="blank-state-title">The Blank State</h2>
        <span>
          Start with intent, then inspect the current read-only perspective before
          choosing a surface. This page displays context only.
        </span>
      </div>

      <ModePresetSelector />

      <section
        className="human-surface-section"
        aria-labelledby="human-surface-start-actions"
      >
        <div className="human-surface-section-heading">
          <p>Start actions</p>
          <h2 id="human-surface-start-actions">Read-only intents</h2>
          <span>
            These cards describe likely next directions. They do not execute in
            Phase 4A.
          </span>
        </div>
        <div className="human-surface-action-grid">
          {startActions.map((action) => (
            <article className="human-surface-action-card" key={action.title}>
              <strong>{action.title}</strong>
              <p>{action.summary}</p>
              <span>coming soon</span>
            </article>
          ))}
        </div>
      </section>

      <p className="human-surface-boundary-note">
        Read-only boundary: Phase 4A may display Current Working Perspective
        data and local UI state only. It does not create work, run agents,
        persist state, launch Codex, call providers, mutate memory, or add
        authority.
      </p>
    </section>
  );
}
