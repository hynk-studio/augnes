import type { AutohuntWorkTargetModeSummary } from "@/types/autohunt-work-target-mode";

type BlankStateAutohuntTargetOptionsPanelProps = {
  summary: AutohuntWorkTargetModeSummary;
};

export function BlankStateAutohuntTargetOptionsPanel({
  summary,
}: BlankStateAutohuntTargetOptionsPanelProps) {
  const launcher = summary.latest_launcher_run_summary;
  const intake = summary.latest_result_intake_summary;

  return (
    <section
      className="human-surface-section"
      aria-labelledby="blank-state-autohunt-target-title"
      data-autohunt-work-target-mode-panel="v0.1"
    >
      <div className="human-surface-section-heading">
        <p>Daily Autohunt target</p>
        <h2 id="blank-state-autohunt-target-title">
          Daily Autohunt target
        </h2>
        <span>
          Selects how the validated Autohunt readback should be interpreted by
          future human review. This panel records no choice and creates no work. Preview only. No Perspective, CWP, work, or memory state is mutated here.
        </span>
      </div>

      <div
        className="human-surface-mode-grid"
        aria-label="Daily Autohunt target mode options"
      >
        {summary.options.map((option) => (
          <article
            className={`human-surface-mode-card${
              option.selected ? " is-selected" : ""
            }`}
            data-autohunt-target-mode={option.mode}
            data-autohunt-target-mode-recommended={String(option.recommended)}
            data-autohunt-target-mode-selected={String(option.selected)}
            key={option.mode}
          >
            <div>
              <strong>{option.title}</strong>
              <span>
                {option.selected ? "selected" : option.short_label}
                {option.recommended ? " / recommended" : ""}
              </span>
            </div>
            <p>{option.summary}</p>
            <dl>
              <div>
                <dt>Lifecycle</dt>
                <dd>{option.lifecycle_interpretation}</dd>
              </div>
              <div>
                <dt>Result</dt>
                <dd>{option.result_attachment_policy}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{option.branch_policy}</dd>
              </div>
            </dl>
            <small>{option.recommendation_reason}</small>
          </article>
        ))}
      </div>

      <div className="human-surface-review-entry-grid">
        <article className="human-surface-review-entry-card">
          <div>
            <strong>Latest launcher</strong>
            <span>{launcher?.launcher_run_status ?? "not recorded"}</span>
          </div>
          <p>
            {launcher
              ? `Handoff ${launcher.handoff_packet_id} uses ${launcher.work_target_mode_label}.`
              : "No Daily Autohunt launcher run is visible in readback yet."}
          </p>
          <dl>
            <div>
              <dt>Target mode</dt>
              <dd>{launcher?.work_target_mode ?? summary.selected_mode}</dd>
            </div>
            <div>
              <dt>Result intake</dt>
              <dd>{launcher?.linked_result_intake_id ?? "none"}</dd>
            </div>
          </dl>
          <small>
            Handoff metadata only. No durable work, Perspective, CWP, or memory
            mutation is performed here.
          </small>
        </article>

        <article className="human-surface-review-entry-card">
          <div>
            <strong>Latest result intake</strong>
            <span>{intake?.result_intake_status ?? "not recorded"}</span>
          </div>
          <p>
            {intake
              ? `Delta ${intake.expected_observed_delta_status}, reuse ${intake.reuse_outcome_helpfulness}, residual ${intake.residual_category}/${intake.residual_severity}.`
              : "No linked result intake is visible in readback yet."}
          </p>
          <dl>
            <div>
              <dt>Next cycle</dt>
              <dd>
                {intake?.ready_for_next_daily_autohunt_cycle
                  ? "ready"
                  : "not ready"}
              </dd>
            </div>
            <div>
              <dt>Branch note</dt>
              <dd>
                {summary.branch_suggestion
                  ? summary.branch_suggestion.priority
                  : "none"}
              </dd>
            </div>
          </dl>
          <small>
            Branch suggestions are preview-only and are not promoted
            automatically.
          </small>
        </article>
      </div>

      {summary.branch_suggestion ? (
        <article className="human-surface-action-card">
          <strong>Branch suggestion</strong>
          <span>{summary.branch_suggestion.priority}</span>
          <p>{summary.branch_suggestion.reason}</p>
          <p>{summary.branch_suggestion.branch_policy}</p>
        </article>
      ) : null}

      <nav className="human-surface-nav" aria-label="Daily Autohunt readback links">
        <a href="/workbench#autohunt-daily-launcher">Daily launcher readback</a>
        <a href="/workbench#autohunt-result-intake">Result intake readback</a>
        <a href="/perspective">Perspective</a>
      </nav>
    </section>
  );
}
