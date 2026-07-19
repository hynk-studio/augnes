import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { ProjectRunResultDetailV01 } from "@/types/vnext/project-run-result";
import { SemanticWorkbenchShell } from "@/components/workbench/semantic-workbench-shell";

import styles from "@/components/workbench/semantic-review/semantic-review.module.css";

export function RunResultReviewSurface({
  result,
  accessBoundary,
}: {
  result: ProjectRunResultDetailV01;
  accessBoundary?: React.ReactNode;
}) {
  const summary = result.summary;
  const entryPresentation = resultEntryPresentation(result);
  return (
    <main
      className={styles.page}
      data-run-result-review="v0.1"
      data-result-review-read-only="true"
      data-semantic-mutation="false"
    >
      <SemanticWorkbenchShell
        title="Verify run result"
        description="Compare one immutable, project-scoped RunReceipt with its selected context, verification residue, criterion assessment, and admitted candidate material. Opening this entry performs no semantic write."
        entryState={entryPresentation.state}
        entryLabel={entryPresentation.label}
        projectHref={`/projects/${encodeURIComponent(result.project_id)}`}
        inspectorHref="#run-result-inspector"
      >
        {accessBoundary}

        <section className={styles.panel} aria-labelledby="result-summary-title">
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Terminal result</p>
            <h2 id="result-summary-title">{humanize(summary.outcome ?? summary.execution_status)}</h2>
          </div>
          <p className={styles.copy}>{summary.summary}</p>
          <dl className={styles.statusGrid}>
            <Metric label="Execution" value={summary.execution_status} />
            <Metric label="Verification" value={summary.verification_status} />
            <Metric label="Trust" value={summary.trust_label} />
            <Metric label="Run mode" value={summary.mode} />
          </dl>
          <p className={styles.muted}>
            Finished {formatTimestamp(summary.finished_at ?? summary.recorded_at)} ·{" "}
            {summary.changed_file_count} changed files · {summary.check_counts.passed} checks passed ·{" "}
            {summary.check_counts.failed} failed · {summary.check_counts.skipped} skipped
          </p>
        </section>

        {result.automation ? (
          <section
            className={styles.panel}
            aria-labelledby="automation-boundary-title"
            data-policy-triggered-result="true"
          >
            <div className={styles.panelHeader}>
              <p className={styles.kicker}>Bounded automation</p>
              <h2 id="automation-boundary-title">
                {result.automation.stopped_at_review_needed
                  ? "Stopped for human review"
                  : "Bounded automation settlement"}
              </h2>
            </div>
            <p className={styles.copy}>
              This policy-triggered run used one bounded CapabilityGrant and the
              normal native-host and immutable receipt path. A review-needed
              stop is shown only after the assessment proposal is durably
              available. The policy and grant create no ReviewDecision or
              semantic authority.
            </p>
            <dl className={styles.statusGrid}>
              <Metric label="Attempt" value={String(result.automation.attempt)} />
              <Metric label="Stop reason" value={result.automation.stop_reason ?? "unknown"} />
              <Metric label="Augnes model calls" value={String(result.automation.budget.max_augnes_model_invocations)} />
              <Metric label="Native-host model scope" value={result.automation.budget.native_host_model_scope} />
              <Metric label="Network" value={result.automation.budget.network_access} />
            </dl>
          </section>
        ) : null}

        <TaskSuccessCriteria result={result} />
        <ReviewableProposal result={result} />

        <div className={styles.twoColumnGrid}>
          <ResultList
            title="Changes and artifacts"
            empty="No changed file or artifact residue was recorded."
            items={result.artifacts.map((artifact) => ({
              id: refLabel(artifact.artifact_ref),
              primary:
                artifact.summary ??
                (artifact.change_kind
                  ? `${humanize(artifact.change_kind)} repository artifact`
                  : "Artifact summary not recorded."),
              secondary: `${artifact.change_kind ?? "artifact"} · ${artifact.basis}`,
            }))}
          />
          <ResultList
            title="Commands and actions"
            empty="No bounded command or action summary was recorded."
            items={[
              ...result.commands.map((command) => ({
                id: command.command_id,
                primary: command.summary,
                secondary: `${command.status} · ${command.basis} · raw output excluded`,
              })),
              ...result.actions.map((action) => ({
                id: action.action_id,
                primary: action.summary,
                secondary: action.basis,
              })),
            ]}
          />
          <ResultList
            title="Checks and skipped checks"
            empty="No check residue was recorded."
            items={[
              ...result.checks.map((check) => ({
                id: check.check_id,
                primary: check.summary,
                secondary: `${check.required ? "required" : "optional"} · ${check.status} · ${check.basis}`,
              })),
              ...result.skipped_checks.map((check) => ({
                id: check.check_id,
                primary: check.reason,
                secondary: `${check.required ? "required" : "optional"} · skipped · ${check.basis}`,
              })),
            ]}
          />
          <ResultList
            title="Limitations and next steps"
            empty="No blockers, gaps, uncertainty, or proposed next steps were recorded."
            items={[
              ...result.blockers.map((issue) => ({
                id: issue.code,
                primary: issue.summary,
                secondary: "blocker",
              })),
              ...result.warnings
                .filter(
                  (issue) => !issue.code.startsWith("native_host_uncertainty_"),
                )
                .map((issue) => ({
                id: issue.code,
                primary: issue.summary,
                secondary: "warning",
                })),
              ...result.gaps.map((issue) => ({
                id: issue.code,
                primary: issue.summary,
                secondary: "gap",
              })),
              ...result.uncertainty.map((summary, index) => ({
                id: `uncertainty:${index}`,
                primary: summary,
                secondary: "uncertainty",
              })),
              ...result.proposed_next_steps.map((item) => ({
                id: item.action_id,
                primary: item.summary,
                secondary: "advisory proposal, not fact",
              })),
            ]}
          />
        </div>

        <details
          id="run-result-inspector"
          className={styles.panel}
          data-run-result-inspector="v0.1"
        >
          <summary><strong>Inspector · provenance and lineage</strong></summary>
          <div className={styles.provenanceGrid}>
            <InspectorCard title="Identity and lineage">
              <Exact label="Receipt" value={result.identity.receipt_ref} />
              <Exact label="Receipt fingerprint" value={result.identity.receipt_fingerprint} />
              <Exact label="Run" value={result.identity.run_ref} />
              <Exact label="Packet status" value={result.packet.status} />
              <Exact label="Packet fingerprint" value={result.packet.packet_fingerprint ?? "not recorded"} />
              <Exact label="Selected context entries" value={result.packet.selected_context_count === null ? "not recorded" : String(result.packet.selected_context_count)} />
              <Exact label="Packet source refs" value={result.packet.source_ref_count === null ? "not recorded" : String(result.packet.source_ref_count)} />
              <RefList refs={[
                result.identity.work_ref,
                result.identity.packet_ref,
                result.identity.source_transition_ref,
                result.identity.root_scope_ref,
                result.identity.repository_ref,
                result.identity.selected_worktree_ref,
                ...result.packet.selected_context_refs,
                ...result.identity.source_refs,
              ]} />
              {result.automation ? (
                <>
                  <Exact label="Automation cycle" value={result.automation.cycle_id} />
                  <RefList refs={[
                    result.automation.policy_ref,
                    result.automation.capability_grant_ref,
                  ]} />
                </>
              ) : null}
            </InspectorCard>

            <InspectorCard title="Native host and approvals">
              <RefList refs={[
                result.identity.adapter_ref,
                result.identity.capability_ref,
                ...result.host.host_refs,
              ]} />
              {result.host.approvals.length ? (
                <ul className={styles.plainList}>
                  {result.host.approvals.map((approval) => (
                    <li key={approval.approval_ref.external_id}>
                      <strong>{humanize(approval.operation_class)}</strong>
                      <span>{approval.resource_summary}</span>
                      <span>
                        {approval.decision
                          ? `${humanize(approval.decision)} · ${humanize(approval.decision_source ?? "unknown source")}`
                          : "Decision not recorded"}
                      </span>
                      <small>Semantic approval created: no</small>
                      <RefList refs={[
                        approval.approval_ref,
                        approval.host_thread_ref,
                        approval.host_turn_ref,
                        approval.host_item_ref,
                        approval.host_request_ref,
                        ...approval.resource_refs,
                      ]} />
                    </li>
                  ))}
                </ul>
              ) : <p className={styles.empty}>Approval residue was not recorded.</p>}
            </InspectorCard>

            <InspectorCard title="Changes and artifacts">
              <ul className={styles.plainList}>
                {result.artifacts.map((artifact) => (
                  <li key={refLabel(artifact.artifact_ref)}>
                    <code className={styles.identifier}>{refLabel(artifact.artifact_ref)}</code>
                    <span>{artifact.summary ?? "Summary not recorded."}</span>
                    <small>{artifact.change_kind ?? "opaque artifact"} · {artifact.basis} · no raw diff</small>
                    <RefList refs={artifact.source_refs} />
                  </li>
                ))}
              </ul>
            </InspectorCard>

            <InspectorCard title="Commands and actions">
              <ul className={styles.plainList}>
                {result.commands.map((command) => (
                  <li key={command.command_id}>
                    <strong>{command.summary}</strong>
                    <span>{command.status} · {command.basis}</span>
                    <small>Fingerprint {command.command_fingerprint ?? "not recorded"} · raw output included: no</small>
                    <RefList refs={command.source_refs} />
                  </li>
                ))}
                {result.actions.map((action) => (
                  <li key={action.action_id}>
                    <strong>{action.summary}</strong>
                    <span>{action.basis}</span>
                    <RefList refs={action.source_refs} />
                  </li>
                ))}
              </ul>
            </InspectorCard>

            <InspectorCard title="Verification">
              <Exact label="Overall" value={summary.verification_status} />
              <ul className={styles.plainList}>
                {result.checks.map((check) => (
                  <li key={`check:${check.check_id}`}>
                    <strong>{check.check_id}</strong>
                    <span>{check.status} · {check.basis} · {check.required ? "required" : "optional"}</span>
                    <small>{check.summary}</small>
                    <RefList refs={check.source_refs} />
                  </li>
                ))}
                {result.skipped_checks.map((check) => (
                  <li key={`skip:${check.check_id}`}>
                    <strong>{check.check_id}</strong>
                    <span>skipped · {check.basis} · {check.required ? "required" : "optional"}</span>
                    <small>{check.reason}</small>
                    <RefList refs={check.source_refs} />
                  </li>
                ))}
              </ul>
            </InspectorCard>

            <InspectorCard title="Model invocations">
              <ul className={styles.plainList} data-model-invocation-state="true">
                {result.model_invocations.map((model, index) => (
                  <li key={`${model.state}:${model.invocation_ref?.external_id ?? index}`}>
                    <strong>{humanize(model.state)}</strong>
                    <span>
                      {model.status ?? "No invocation status recorded"}
                      {model.outcome ? ` · ${humanize(model.outcome)}` : ""}
                    </span>
                    <small>
                      {[
                        model.purpose ? humanize(model.purpose) : null,
                        model.usage_summary,
                        model.latency_ms === null
                          ? null
                          : `${model.latency_ms} ms`,
                        model.egress_status
                          ? `egress ${humanize(model.egress_status)}`
                          : null,
                        model.cancellation_disposition
                          ? humanize(model.cancellation_disposition)
                          : null,
                        model.failure_code
                          ? humanize(model.failure_code)
                          : null,
                        model.coverage,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                    {model.cost_summary ? (
                      <small>{model.cost_summary}</small>
                    ) : null}
                    {model.budget_summary ? (
                      <small>{humanize(model.budget_summary)}</small>
                    ) : null}
                    <RefList
                      refs={[
                        model.invocation_ref,
                        model.provider_ref,
                        model.model_ref,
                        ...model.source_refs,
                      ]}
                    />
                  </li>
                ))}
              </ul>
            </InspectorCard>

            <InspectorCard title="Trust, coverage, and privacy">
              <Exact label="Direct observations" value={String(result.trust_summary.direct_observations)} />
              <Exact label="Host attestations" value={String(result.trust_summary.host_attestations)} />
              <Exact label="Derived interpretations" value={String(result.trust_summary.derived_interpretations)} />
              <Exact label="Egress" value={result.privacy_egress.egress_status} />
              <Exact label="Retention" value={result.privacy_egress.retention_class ?? "not recorded"} />
              <p className={styles.muted}>
                Raw prompt: not persisted · raw output: not persisted · transcript: not persisted · secret material: not persisted
              </p>
              <ul className={styles.plainList}>
                {result.capability_coverage.map((entry) => (
                  <li key={entry.capability}>
                    <strong>{entry.capability}</strong>
                    <span>{entry.coverage_level}</span>
                    <RefList refs={[entry.source_ref]} />
                  </li>
                ))}
              </ul>
            </InspectorCard>

            <InspectorCard title="Limitations and compatibility">
              <ResultListBody
                items={[
                  ...result.blockers.map((issue) => ({ id: issue.code, primary: issue.summary, secondary: "blocker" })),
                  ...result.warnings
                    .filter((issue) => !issue.code.startsWith("native_host_uncertainty_"))
                    .map((issue) => ({ id: issue.code, primary: issue.summary, secondary: "warning" })),
                  ...result.gaps.map((issue) => ({ id: issue.code, primary: issue.summary, secondary: "gap" })),
                  ...result.uncertainty.map((summary, index) => ({ id: `uncertainty:${index}`, primary: summary, secondary: "uncertainty" })),
                  ...result.proposed_next_steps.map((item) => ({ id: item.action_id, primary: item.summary, secondary: "advisory next step" })),
                ]}
                empty="No limitation residue was recorded."
              />
              <p className={styles.muted}>
                Source contracts: {result.compatibility.source_contracts.join(", ") || "not recorded"}
              </p>
            </InspectorCard>
          </div>
        </details>

        <section className={styles.notice} data-result-authority-boundary="true">
          No EpisodeDeltaProposal, ReviewDecision, semantic transition, Evidence acceptance,
          semantic state change, or work closure was created by opening this result.
        </section>
      </SemanticWorkbenchShell>
    </main>
  );
}

function resultEntryPresentation(
  result: ProjectRunResultDetailV01,
): {
  state: "result_only" | "assessment";
  label: string;
} {
  if (result.proposal.status === "available") {
    return {
      state: "assessment",
      label: "Assessment · source-bound proposal available",
    };
  }
  if (result.criterion_assessment.status === "available") {
    return { state: "assessment", label: "Assessment available" };
  }
  return { state: "result_only", label: "Result only" };
}

function TaskSuccessCriteria({
  result,
}: {
  result: ProjectRunResultDetailV01;
}) {
  const readback = result.criterion_assessment;
  if (readback.status === "unavailable") {
    return (
      <section
        className={styles.panel}
        aria-labelledby="task-success-criteria-title"
        data-task-success-criteria="unavailable"
      >
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Derived criterion assessment</p>
          <h2 id="task-success-criteria-title">Task success criteria</h2>
        </div>
        <p className={styles.copy} data-execution-task-success="unavailable">
          Execution {humanize(result.summary.execution_status)} / task success unavailable
        </p>
        <p className={styles.muted}>
          Criterion assessment is unavailable for this historical result: {humanize(readback.reason)}.
          The receipt remains execution residue and no success status was inferred.
        </p>
      </section>
    );
  }

  const assessment = readback.assessment;
  const taskSuccess = taskSuccessStatusV01(assessment.summary);
  return (
    <section
      className={styles.panel}
      aria-labelledby="task-success-criteria-title"
      data-task-success-criteria="available"
      data-task-success-status={taskSuccess}
      data-assessment-authoritative="false"
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Derived criterion assessment</p>
        <h2 id="task-success-criteria-title">Task success criteria</h2>
      </div>
      <p
        className={styles.copy}
        data-execution-task-success={`${result.summary.execution_status}:${taskSuccess}`}
      >
        Execution {humanize(result.summary.execution_status)} / task success {humanize(taskSuccess)}
      </p>
      <dl className={styles.statusGrid}>
        <Metric label="Satisfied" value={String(assessment.summary.satisfied)} />
        <Metric label="Unsatisfied" value={String(assessment.summary.unsatisfied)} />
        <Metric label="Unknown" value={String(assessment.summary.unknown)} />
        <Metric label="Not applicable" value={String(assessment.summary.not_applicable)} />
      </dl>
      {assessment.criteria.length ? (
        <ul className={styles.plainList} data-criterion-assessment-items="true">
          {assessment.criteria.map((item) => (
            <li
              key={item.criterion_id}
              data-criterion-status={item.status}
              data-criterion-basis={item.basis}
            >
              <strong>{item.criterion}</strong>
              <span>{humanize(item.status)} · {humanize(item.basis)} basis</span>
              <small>
                {item.supporting_refs.length} supporting refs · {item.opposing_refs.length} opposing refs · {item.missing_refs.length} criterion-specific missing refs
              </small>
              <details data-criterion-source-drilldown="true">
                <summary>Sources, trust, coverage, and uncertainty</summary>
                <h4>Supporting refs ({item.supporting_refs.length})</h4>
                <RefList refs={item.supporting_refs} />
                <h4>Opposing refs ({item.opposing_refs.length})</h4>
                <RefList refs={item.opposing_refs} />
                <h4>Criterion-specific missing refs ({item.missing_refs.length})</h4>
                <RefList refs={item.missing_refs} />
                <h4>Task-wide receipt residue trust classes</h4>
                <ul className={styles.plainList} data-criterion-trust="true">
                  {Object.entries(item.trust).map(([trustClass, count]) => (
                    <li key={trustClass}>
                      <strong>{humanize(trustClass)}</strong>
                      <span>{count}</span>
                    </li>
                  ))}
                </ul>
                <h4>Task-wide operation coverage</h4>
                {item.operation_coverage.length ? (
                  <ul className={styles.plainList} data-criterion-operation-coverage="true">
                    {item.operation_coverage.map((entry) => (
                      <li
                        key={entry.capability}
                        data-coverage-level={entry.coverage_level}
                      >
                        <strong>{humanize(entry.capability)}</strong>
                        <span>{coverageLabelV01(entry.coverage_level)}</span>
                        {entry.notes.map((note) => <small key={note}>{note}</small>)}
                        <RefList refs={[entry.source_ref]} />
                      </li>
                    ))}
                  </ul>
                ) : <p className={styles.empty}>Operation coverage was not recorded.</p>}
                <h4>Task-wide receipt uncertainty</h4>
                <ResultListBody
                  items={item.uncertainty.map((uncertainty) => ({
                    id: uncertainty,
                    primary: uncertainty,
                    secondary: "uncertainty",
                  }))}
                  empty="No criterion uncertainty was recorded."
                />
              </details>
            </li>
          ))}
        </ul>
      ) : <p className={styles.empty}>The packet recorded no success criteria.</p>}
      <p className={styles.muted} data-criterion-authority-boundary="true">
        This assessment is derived and non-authoritative. It creates no Evidence,
        validates no Claim, creates no proposal or decision, applies no Transition,
        and changes neither semantic state nor later context.
      </p>
    </section>
  );
}

function ReviewableProposal({
  result,
}: {
  result: ProjectRunResultDetailV01;
}) {
  const proposal = result.proposal;
  return (
    <section
      className={styles.panel}
      aria-labelledby="run-result-proposal-title"
      data-run-result-proposal={proposal.status}
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Post-receipt candidate material</p>
        <h2 id="run-result-proposal-title">Reviewable proposal</h2>
      </div>
      {proposal.status === "available" ? (
        <>
          <p className={styles.copy}>
            One exact pending-review EpisodeDeltaProposal was admitted from this
            persisted result and its criterion assessment. Opening this read-only
            result did not create or replay it.
          </p>
          <dl className={styles.statusGrid}>
            <Metric label="Proposal status" value={proposal.proposal_status} />
            <Metric label="ReviewDecision" value="none inferred" />
            <Metric label="Transition" value="not applied" />
            <Metric label="Semantic state" value="unchanged" />
          </dl>
          <span className={styles.identifier}>{proposal.proposal_id}</span>
          <span className={styles.identifier}>{proposal.proposal_fingerprint}</span>
          <div className={styles.buttonRow}>
            <a
              className={styles.linkButton}
              href={proposal.review_href}
              data-result-to-proposal-link="true"
            >
              Review exact proposal
            </a>
          </div>
        </>
      ) : proposal.status === "failed" ? (
        <>
          <p className={styles.copy}>
            The immutable receipt remains available and execution status is
            unchanged, but proposal admission needs a bounded retry.
          </p>
          <p className={styles.muted}>
            {proposal.error_code} · retryable {String(proposal.retryable)}
          </p>
        </>
      ) : (
        <p className={styles.muted}>
          No reviewable proposal is available: {humanize(proposal.reason)}. This
          read does not repair or create one. For a newly admitted receipt, the
          result loader performs bounded read-only refreshes while the separate
          proposal transaction settles.
        </p>
      )}
      <p className={styles.muted} data-proposal-authority-boundary="true">
        A pending proposal is candidate material, not accepted Evidence, a
        validated Claim, a ReviewDecision, a Transition, semantic state, or later
        context.
      </p>
    </section>
  );
}

function taskSuccessStatusV01(summary: {
  satisfied: number;
  unsatisfied: number;
  unknown: number;
  not_applicable: number;
}): "satisfied" | "unsatisfied" | "unknown" | "not_applicable" {
  if (summary.unsatisfied > 0) return "unsatisfied";
  if (summary.unknown > 0) return "unknown";
  if (summary.satisfied > 0) return "satisfied";
  return summary.not_applicable > 0 ? "not_applicable" : "unknown";
}

function coverageLabelV01(value: string): string {
  return value === "outside_coverage"
    ? "unsupported / unavailable"
    : humanize(value);
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{humanize(value)}</dd></div>;
}

function ResultList({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ id: string; primary: string; secondary: string }>;
  empty: string;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}><h2>{title}</h2></div>
      <ResultListBody items={items} empty={empty} />
    </section>
  );
}

function ResultListBody({
  items,
  empty,
}: {
  items: Array<{ id: string; primary: string; secondary: string }>;
  empty: string;
}) {
  if (!items.length) return <p className={styles.empty}>{empty}</p>;
  return (
    <ul className={styles.plainList}>
      {items.map((item) => (
        <li key={item.id}>
          <strong>{item.primary}</strong>
          <small>{humanize(item.secondary)}</small>
        </li>
      ))}
    </ul>
  );
}

function InspectorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className={styles.materialCard}><h3>{title}</h3>{children}</section>;
}

function Exact({ label, value }: { label: string; value: string }) {
  return <div className={styles.exactValue}><strong>{label}</strong><code className={styles.identifier}>{value}</code></div>;
}

function RefList({ refs }: { refs: Array<ExternalRefV01 | null> }) {
  const present = [
    ...new Map(
      refs
        .filter((ref): ref is ExternalRefV01 => Boolean(ref))
        .map((ref) => [refKey(ref), ref]),
    ).values(),
  ];
  if (!present.length) return <p className={styles.empty}>Reference not recorded.</p>;
  return (
    <ul className={styles.plainList}>
      {present.map((ref) => (
        <li key={refKey(ref)}>
          <code className={styles.identifier}>{refLabel(ref)}</code>
          <small>
            {humanize(ref.trust_class)}
            {ref.source_ref ? ` · source ${ref.source_ref}` : ""}
          </small>
        </li>
      ))}
    </ul>
  );
}

function refLabel(ref: ExternalRefV01): string {
  return `${ref.ref_type}:${ref.external_id}`;
}

function refKey(ref: ExternalRefV01): string {
  return [
    ref.compatibility_namespace ?? "",
    ref.provider ?? "",
    ref.host ?? "",
    ref.ref_type,
    ref.external_id,
  ].join(":");
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(parsed);
}
