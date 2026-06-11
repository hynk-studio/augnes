"use client";

import type {
  CodexFormerSessionPanelScenario,
  CodexFormerSessionPanelScenarioId,
} from "@/lib/perspective-ingest/codex-former-session-perspective-panel-fixture-surface";
import { useEffect, useMemo, useState } from "react";

export function CodexFormerSessionPerspectivePanelFixtureSurface({
  scenarios,
}: {
  scenarios: CodexFormerSessionPanelScenario[];
}) {
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<CodexFormerSessionPanelScenarioId>("not-prepared");
  const [warningsOpen, setWarningsOpen] = useState(true);
  const [authorityOpen, setAuthorityOpen] = useState(false);

  const selectedScenario = useMemo(
    () =>
      scenarios.find((scenario) => scenario.id === selectedScenarioId) ??
      scenarios[0] ??
      null,
    [scenarios, selectedScenarioId],
  );

  useEffect(() => {
    if (selectedScenario) {
      setWarningsOpen(selectedScenario.warnings.defaultOpen);
      setAuthorityOpen(false);
    }
  }, [selectedScenario]);

  function selectScenario(scenarioId: CodexFormerSessionPanelScenarioId) {
    setSelectedScenarioId(scenarioId);
  }

  return (
    <main
      className="cockpit-shell codex-former-session-panel-shell"
      data-augnes-surface="codex-former-session-perspective-panel-fixture"
    >
      <section className="cockpit-surface-card codex-former-session-panel-surface">
        <header
          className="codex-former-session-panel-header"
          data-augnes-region="session-header"
        >
          <div>
            <p className="panel-eyebrow">Codex Session Perspective Panel</p>
            <h1>Codex Former Session Panel Fixture</h1>
            <p>
              Read-only fixture-backed side panel for Codex Former perspective
              formation status.
            </p>
          </div>
          <div
            className="codex-former-session-panel-selector"
            role="tablist"
            aria-label="Codex Former session panel fixture scenarios"
          >
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                role="tab"
                aria-selected={scenario.id === selectedScenario?.id}
                className={
                  scenario.id === selectedScenario?.id
                    ? "codex-former-session-panel-tab is-active"
                    : "codex-former-session-panel-tab"
                }
                data-augnes-session-panel-scenario={scenario.id}
                onClick={() => selectScenario(scenario.id)}
              >
                {scenario.label}
              </button>
            ))}
          </div>
        </header>

        {!selectedScenario ? (
          <SurfaceState
            title="No scenario selected"
            detail="Session panel fixture scenarios are not available."
          />
        ) : (
          <>
            <SessionHeader scenario={selectedScenario} />
            <div className="codex-former-session-panel-grid">
              <FormationTimeline scenario={selectedScenario} />
              <div className="codex-former-session-panel-stack">
                <StatusCard scenario={selectedScenario} />
                <EvidenceStrip scenario={selectedScenario} />
              </div>
              <WarningBlockingSummary
                open={warningsOpen}
                onOpenChange={setWarningsOpen}
                scenario={selectedScenario}
              />
              <AuthorityBoundaryBox
                open={authorityOpen}
                onOpenChange={setAuthorityOpen}
                scenario={selectedScenario}
              />
              <ActionGuidance scenario={selectedScenario} />
              <ConstellationHandoffPreview scenario={selectedScenario} />
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function SessionHeader({
  scenario,
}: {
  scenario: CodexFormerSessionPanelScenario;
}) {
  return (
    <section
      className={`codex-former-session-panel-session-header tone-${scenario.tone}`}
      aria-label={`Session Header. ${scenario.primaryStatusLabel}. ${scenario.caveatLabel}. Review-only ${scenario.reviewOnly}. Next safe action: ${scenario.nextSafeActionLabel}`}
    >
      <article>
        <span>Work / session</span>
        <strong>{scenario.workSessionLabel}</strong>
      </article>
      <article>
        <span>Fixture scenario</span>
        <strong>{scenario.scenarioLabel}</strong>
      </article>
      <article>
        <span>Boundary</span>
        <strong>read-only / review-only</strong>
      </article>
      <article>
        <span>Current status</span>
        <strong>{scenario.primaryStatusLabel}</strong>
      </article>
      <article>
        <span>Accepted Augnes state</span>
        <strong>{String(scenario.acceptedState)}</strong>
      </article>
    </section>
  );
}

function FormationTimeline({
  scenario,
}: {
  scenario: CodexFormerSessionPanelScenario;
}) {
  return (
    <section
      className="codex-former-session-panel-timeline"
      aria-label="Formation Timeline"
      data-augnes-region="formation-timeline"
    >
      <header>
        <h2>Formation Timeline</h2>
        <p>Completed steps mean workflow progress only, never accepted state.</p>
      </header>
      <ol>
        {scenario.timeline.map((step, index) => (
          <li
            key={step.id}
            className={`status-${step.status}`}
            data-augnes-timeline-status={step.status}
          >
            <span className="codex-former-session-panel-step-index">
              {index + 1}
            </span>
            <span className="codex-former-session-panel-step-main">
              <strong>{step.label}</strong>
              <small>{step.status}</small>
              <span>{step.description}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StatusCard({
  scenario,
}: {
  scenario: CodexFormerSessionPanelScenario;
}) {
  return (
    <section
      className={`codex-former-session-panel-status tone-${scenario.tone}`}
      aria-label="Status Card"
      data-augnes-region="status-card"
    >
      <h2>Status Card</h2>
      <strong>{scenario.primaryStatusLabel}</strong>
      <p>{scenario.caveatLabel}</p>
      <dl>
        <div>
          <dt>Next safe action</dt>
          <dd>{scenario.nextSafeActionLabel}</dd>
        </div>
        <div>
          <dt>Review-only</dt>
          <dd>{String(scenario.reviewOnly)}</dd>
        </div>
        <div>
          <dt>Accepted-state</dt>
          <dd>{String(scenario.acceptedState)}</dd>
        </div>
      </dl>
    </section>
  );
}

function EvidenceStrip({
  scenario,
}: {
  scenario: CodexFormerSessionPanelScenario;
}) {
  return (
    <section
      className="codex-former-session-panel-evidence"
      aria-label="Evidence / Provenance Strip"
      data-augnes-region="evidence-provenance-strip"
    >
      <h2>Evidence / Provenance Strip</h2>
      <dl>
        <EvidenceRow label="source_input_hash" value={scenario.evidence.sourceInputHash} />
        <EvidenceRow label="source_prompt_hash" value={scenario.evidence.sourcePromptHash} />
        <EvidenceRow label="metadata_match" value={scenario.evidence.metadataMatch} />
        <EvidenceRow label="candidate_count" value={scenario.evidence.candidateCount} />
        <EvidenceRow label="fixture_path" value={scenario.evidence.fixturePath} />
        <EvidenceRow label="pr_refs" value={scenario.evidence.prRefs.join(", ")} />
      </dl>
    </section>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function WarningBlockingSummary({
  onOpenChange,
  open,
  scenario,
}: {
  scenario: CodexFormerSessionPanelScenario;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pressureLabel = scenario.warnings.hasBlockingWarnings
    ? "Blocking reasons"
    : scenario.warnings.pointerWarningCount > 0
      ? "Pointer warning pressure"
      : scenario.warnings.generalWarningCount > 0 || scenario.warnings.groups.length > 0
        ? "General warning pressure"
        : scenario.warnings.missingPrerequisites.length > 0
          ? "Pending prerequisites"
          : "No warning pressure";

  return (
    <details
      className={`codex-former-session-panel-warning tone-${scenario.tone}`}
      data-augnes-region="warning-blocking-summary"
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
    >
      <summary>
        <span>Warning / Blocking Summary</span>
        <small>
          {pressureLabel}: {scenario.warnings.pointerWarningCount} pointer /{" "}
          {scenario.warnings.blockedReasonCount} blocked
        </small>
      </summary>
      <div className="codex-former-session-panel-warning-stats">
        <span>Pointer warnings: {scenario.warnings.pointerWarningCount}</span>
        <span>General warnings: {scenario.warnings.generalWarningCount}</span>
        <span>Blocked reasons: {scenario.warnings.blockedReasonCount}</span>
        <span>Blocking: {scenario.warnings.hasBlockingWarnings ? "yes" : "no"}</span>
      </div>
      {scenario.warnings.missingPrerequisites.length > 0 ? (
        <section>
          <h3>Pending prerequisites</h3>
          <ul>
            {scenario.warnings.missingPrerequisites.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <WarningGroups title="Blocked reasons" groups={scenario.warnings.blockedReasons} />
      <WarningGroups title="Warning groups" groups={scenario.warnings.groups} />
    </details>
  );
}

function WarningGroups({
  groups,
  title,
}: {
  title: string;
  groups: CodexFormerSessionPanelScenario["warnings"]["groups"];
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section>
      <h3>{title}</h3>
      {groups.map((group) => (
        <article key={group.id} className={`tone-${group.tone}`}>
          <strong>{group.label}</strong>
          <span>{group.count} bounded examples</span>
          <ul>
            {group.examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

function AuthorityBoundaryBox({
  onOpenChange,
  open,
  scenario,
}: {
  scenario: CodexFormerSessionPanelScenario;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <details
      className="codex-former-session-panel-authority"
      data-augnes-region="authority-boundary-box"
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
    >
      <summary>
        <span>Authority Boundary Box</span>
        <small>review-only, advisory-only, no accepted-state authority</small>
      </summary>
      <p>{scenario.authority.summary}</p>
      <div className="codex-former-session-panel-tag-grid" aria-label="Authority tags">
        {scenario.authority.tags.slice(0, 12).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <dl>
        {scenario.authority.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function ActionGuidance({
  scenario,
}: {
  scenario: CodexFormerSessionPanelScenario;
}) {
  return (
    <section
      className="codex-former-session-panel-action"
      aria-label="Action Guidance"
      data-augnes-region="action-guidance"
    >
      <h2>Action Guidance</h2>
      <p>{scenario.actionGuidance}</p>
      <span>Guidance only. No executable prepare, validate, Codex, GitHub, DB, approval, merge, deploy, or Core decision control is present.</span>
    </section>
  );
}

function ConstellationHandoffPreview({
  scenario,
}: {
  scenario: CodexFormerSessionPanelScenario;
}) {
  return (
    <section
      className={`codex-former-session-panel-handoff tone-${scenario.tone}`}
      aria-label="Constellation Handoff Preview"
      data-augnes-region="constellation-handoff-preview"
    >
      <h2>Constellation Handoff Preview</h2>
      <strong>{scenario.handoff.label}</strong>
      <p>{scenario.handoff.detail}</p>
      {scenario.handoff.available && scenario.handoff.href ? (
        <a href={scenario.handoff.href}>Open read-only Constellation Preview</a>
      ) : (
        <span data-augnes-handoff-state="not-ready">Navigation not ready</span>
      )}
    </section>
  );
}

function SurfaceState({ title, detail }: { title: string; detail: string }) {
  return (
    <section
      className="codex-former-session-panel-state"
      data-augnes-region="surface-state"
    >
      <strong>{title}</strong>
      <p>{detail}</p>
    </section>
  );
}
