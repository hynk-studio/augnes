import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { EpisodeDeltaProposalSourceAssessmentV01 } from "@/types/vnext/episode-delta-proposal";

import { DurableLineagePanel } from "./durable-lineage-panel";
import { ContextUseReviewForm } from "./context-use-review-form";
import { OperationAwareRevisionForm } from "./operation-aware-revision-form";
import { ReviewDecisionForm } from "./review-decision-form";
import { SemanticTransitionActions } from "./semantic-transition-actions";
import type {
  SemanticReviewDecisionRequestV01,
  SemanticContextUseReviewRequestV01,
  SemanticReviewProposalDetailV01,
  SemanticReviewProjectV01,
  SemanticReviewRevisionRequestV01,
} from "./semantic-review-types";
import styles from "./semantic-review.module.css";

export function SemanticReviewProposalDetail({
  project,
  read,
  busyCandidateId,
  onDecision,
  onRevision,
  onContextUseReview,
  onSessionInvalid,
  onPrivateMaterialChanged,
  tryBeginOperatorMutation,
  endOperatorMutation,
}: {
  project: SemanticReviewProjectV01;
  read: SemanticReviewProposalDetailV01;
  busyCandidateId: string | null;
  onDecision: (request: SemanticReviewDecisionRequestV01) => Promise<void>;
  onRevision: (request: SemanticReviewRevisionRequestV01) => Promise<void>;
  onContextUseReview: (
    request: SemanticContextUseReviewRequestV01,
  ) => Promise<void>;
  onSessionInvalid: (errorCode: string) => void;
  onPrivateMaterialChanged: () => Promise<void>;
  tryBeginOperatorMutation: () => boolean;
  endOperatorMutation: () => void;
}) {
  const proposal = read.proposal;
  const candidateReads = read.candidates;
  const packetRef = proposal.task_context_packet_ref;
  const priorPacket =
    packetRef?.ref_type === "task_context_packet" &&
    typeof packetRef.source_ref === "string" &&
    /^sha256:[a-f0-9]{64}$/.test(packetRef.source_ref)
      ? {
          packet_id: packetRef.external_id,
          packet_fingerprint: packetRef.source_ref,
        }
      : null;

  return (
    <section
      className={styles.shell}
      data-vnext-semantic-review-detail="v0.1"
      data-vnext-proposal-id={proposal.proposal_id}
    >
      <section className={styles.panel} data-vnext-operator-step="proposal">
        <div className={styles.panelHeader}>
          <div className={styles.rowBetween}>
            <p className={styles.kicker}>EpisodeDeltaProposal</p>
            <span className={styles.badge}>{proposal.status}</span>
          </div>
          <h2>{proposal.bounded_summary}</h2>
          <span className={styles.identifier}>{proposal.proposal_id}</span>
          <span className={styles.identifier}>{proposal.integrity.fingerprint}</span>
        </div>
        <dl className={styles.statusGrid}>
          <div>
            <dt>Workspace</dt>
            <dd>{project.workspace_id}</dd>
          </div>
          <div>
            <dt>Project</dt>
            <dd>{project.project_id}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{proposal.created_at}</dd>
          </div>
          <div>
            <dt>Source currentness</dt>
            <dd>{proposal.source_status.currentness}</dd>
          </div>
        </dl>
        <p className={styles.notice}>
          This proposal is reviewable candidate material. It is not canonical state,
          accepted Evidence, a ReviewDecision, work closure, or a transition. Source
          validation, fingerprints, changed files, checks, and PR presence grant no
          semantic authority.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="source-lineage-title">
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Source lineage</p>
          <h2 id="source-lineage-title">Bounded packet and receipt references</h2>
        </div>
        <div className={styles.twoColumnGrid}>
          <RefCollection
            title="TaskContextPacket"
            refs={proposal.task_context_packet_ref ? [proposal.task_context_packet_ref] : []}
          />
          <RefCollection title="Source RunReceipts" refs={proposal.run_receipt_refs} />
        </div>
        <p className={styles.copy}>
          Coverage {proposal.source_status.coverage}; currentness {proposal.source_status.currentness};
          review required {String(proposal.source_status.review_required)}. {proposal.source_status.basis}
        </p>
        <div className={styles.buttonRow}>
          <a className={styles.linkButton} href="/workbench">
            Open deeper Workplane lineage context
          </a>
        </div>
        <p className={styles.muted}>
          This bounded decision surface does not replace the shared Inspector or
          detailed source-lineage exploration.
        </p>
      </section>

      {proposal.source_assessment ? (
        <RunAssessmentSnapshot source={proposal.source_assessment} />
      ) : null}

      {proposal.operation_revision ? (
        <section
          className={styles.panel}
          data-vnext-operation-revision="v0.1"
          aria-labelledby="operation-revision-title"
        >
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Immutable revision lineage</p>
            <h2 id="operation-revision-title">Operation-aware candidate revision</h2>
          </div>
          <dl className={styles.statusGrid}>
            <div><dt>Operation</dt><dd>{proposal.operation_revision.selected_operation}</dd></div>
            <div><dt>Delta lane</dt><dd>{proposal.operation_revision.selected_delta_type}</dd></div>
            <div><dt>Source proposal</dt><dd>{proposal.operation_revision.source.proposal_id}</dd></div>
            <div><dt>Source candidate</dt><dd>{proposal.operation_revision.source.candidate_id}</dd></div>
          </dl>
          <p className={styles.copy}>{proposal.operation_revision.rationale_summary}</p>
          <p className={styles.notice}>
            The source proposal and candidate remain immutable. This revision is still
            candidate material and grants no decision or Transition authority.
          </p>
        </section>
      ) : null}

      <section className={styles.panel} aria-labelledby="provenance-title">
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Provenance lanes</p>
          <h2 id="provenance-title">
            Observation, attestation, and inference stay separate
          </h2>
        </div>
        <div className={styles.provenanceGrid}>
          <ProvenanceLane
            lane="observation"
            title="Observation"
            emptyText="No observation material is present."
            items={proposal.observations.map((item) => ({
              id: item.material_id,
              kind: item.material_kind,
              summary: item.bounded_summary,
              trust: item.trust_class,
              at: item.observed_at,
              basis: `${item.source_run_receipt_refs.length} receipt ref(s)`,
            }))}
          />
          <ProvenanceLane
            lane="attestation"
            title="Attestation / imported report"
            emptyText="No attestation material is present."
            items={proposal.attestations.map((item) => ({
              id: item.material_id,
              kind: item.material_kind,
              summary: item.bounded_summary,
              trust: item.trust_class,
              at: item.reported_at,
              basis: `${item.source_run_receipt_refs.length} receipt ref(s)`,
            }))}
          />
          <ProvenanceLane
            lane="inference"
            title="Derived inference"
            emptyText="No derived inference material is present."
            items={proposal.inferences.map((item) => ({
              id: item.material_id,
              kind: item.material_kind,
              summary: item.bounded_summary,
              trust: item.trust_class,
              at: item.inferred_at,
              basis: `${item.basis_material_ids.length} basis material item(s)`,
            }))}
          />
        </div>
        <div className={styles.metricGrid}>
          <Metric label="Direct observations" value={proposal.trust_summary.direct_observations} />
          <Metric label="Host attestations" value={proposal.trust_summary.host_attestations} />
          <Metric label="Imported unverified" value={proposal.trust_summary.imported_unverified_items} />
          <Metric label="Derived interpretations" value={proposal.trust_summary.derived_interpretations} />
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="candidate-title">
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Review candidates</p>
          <h2 id="candidate-title">Select one candidate through its decision form</h2>
          <p className={styles.copy}>
            A proposal may contain several candidates. Each candidate is evaluated
            independently against the narrow pilot policy. Submitting one form selects
            only that candidate; it does not accept the proposal as a whole.
          </p>
        </div>
        <ol className={styles.candidateList}>
          {candidateReads.map((candidateRead) => {
            const candidate = candidateRead.candidate;
            const admission = candidateRead.pilot_admission;
            return (
              <li
                className={styles.candidate}
                data-vnext-candidate-id={candidate.candidate_id}
                data-vnext-candidate-accept-eligible={String(
                  admission.decision_allowed.accept,
                )}
                key={`${candidate.candidate_id}:${candidateRead.candidate_fingerprint}`}
              >
                <div className={styles.candidateHeader}>
                  <div>
                    <p className={styles.kicker}>{candidate.delta_type}</p>
                    <h3>{candidate.title}</h3>
                  </div>
                  <span className={styles.badge}>{candidate.operation}</span>
                </div>
                <span className={styles.identifier}>{candidate.candidate_id}</span>
                <span className={styles.identifier}>{candidateRead.candidate_fingerprint}</span>
                <p className={styles.copy}>{candidate.proposed_state_summary}</p>
                <dl className={styles.statusGrid}>
                  <div>
                    <dt>Current-state knowledge</dt>
                    <dd>{candidate.current_state.knowledge_status}</dd>
                  </div>
                  <div>
                    <dt>Store observation</dt>
                    <dd>{admission.current_state_status}</dd>
                  </div>
                  <div>
                    <dt>Targets</dt>
                    <dd>{admission.target_count}</dd>
                  </div>
                  <div>
                    <dt>Pilot accept operation</dt>
                    <dd>{admission.accept_operation ?? "blocked"}</dd>
                  </div>
                </dl>
                <RefCollection title="Exact target set" refs={candidate.target_refs} />
                <TextCollection title="Candidate uncertainties" items={candidate.uncertainties} />
                <TextCollection title="Candidate limitations" items={candidate.limitations} />
                <TextCollection
                  title="Pilot blocking reasons"
                  items={admission.blocking_reasons}
                />
                <ReviewDecisionForm
                  proposalId={proposal.proposal_id}
                  proposalFingerprint={proposal.integrity.fingerprint}
                  candidateRead={candidateRead}
                  busy={busyCandidateId !== null}
                  onSubmit={onDecision}
                />
                {!proposal.operation_revision &&
                (candidate.operation === "unknown" ||
                  candidate.operation === "no_change") ? (
                  <OperationAwareRevisionForm
                    proposalId={proposal.proposal_id}
                    proposalFingerprint={proposal.integrity.fingerprint}
                    sourceAssessment={proposal.source_assessment}
                    candidateRead={candidateRead}
                    busy={busyCandidateId !== null}
                    onSubmit={onRevision}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      <div className={styles.twoColumnGrid}>
        <IssuePanel
          title="Unresolved conflicts"
          emptyText="No conflicts are recorded."
          items={proposal.conflicts.map((item) => ({
            id: item.conflict_id,
            summary: item.bounded_summary,
            meta: `${item.conflict_kind}; ${item.resolution_status}; automatically resolved ${String(item.automatically_resolved)}`,
          }))}
        />
        <IssuePanel
          title="Missing information"
          emptyText="No missing-information records are present."
          items={proposal.missing_information.map((item) => ({
            id: item.missing_id,
            summary: item.bounded_summary,
            meta: `${item.knowledge_status}; ${item.code}; review required ${String(item.review_required)}`,
          }))}
        />
        <IssuePanel
          title="Proposal uncertainties"
          emptyText="No proposal-level uncertainties are recorded."
          items={proposal.uncertainties.map((item) => ({
            id: item.uncertainty_id,
            summary: item.bounded_summary,
            meta: `${item.related_delta_ids.length} related candidate(s)`,
          }))}
        />
        <section className={styles.panel} aria-label="Proposal limitations">
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Explicit boundary</p>
            <h2>Limitations</h2>
          </div>
          <TextCollection title="Recorded limitations" items={proposal.limitations} />
        </section>
      </div>

      <section
        className={styles.panel}
        data-vnext-operator-step="decision"
        data-vnext-decision-history="v0.1"
        aria-labelledby="decision-history-title"
      >
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>ReviewDecision history</p>
          <h2 id="decision-history-title">Explicit decisions for this proposal</h2>
        </div>
        {read.decision_history.length === 0 ? (
          <p className={styles.empty}>
            No ReviewDecision is persisted for this proposal. A displayed candidate is
            not a decision.
          </p>
        ) : (
          <ol className={styles.decisionList}>
            {read.decision_history.map((classification) => {
              const decision = classification.decision;
              return (
              <li key={`${decision.decision_id}:${decision.integrity.fingerprint}`}>
                <div className={styles.rowBetween}>
                  <strong>{decision.decision}</strong>
                  <span className={styles.badge}>
                    {classification.pilot_session_bound
                      ? classification.pilot_actionable
                        ? "session-bound · pilot actionable"
                        : "session-bound · history only"
                      : "generic history · not pilot actionable"}
                  </span>
                </div>
                <span className={styles.identifier}>{decision.decision_id}</span>
                <span className={styles.identifier}>{decision.integrity.fingerprint}</span>
                <span>Candidate {decision.candidate.candidate_id}</span>
                <span>{decision.rationale_summary}</span>
                <span>
                  Actor {decision.actor_ref.external_id}; trust {decision.actor_ref.trust_class}
                </span>
                <span>Decided {decision.decided_at}</span>
                <span>
                  Requested transition applied {String(
                    decision.requested_transition_intent?.applied ?? false,
                  )}
                </span>
                <span>
                  Pilot session bound {String(
                    classification.pilot_session_bound,
                  )}; pilot actionable {String(
                    classification.pilot_actionable,
                  )}
                </span>
              </li>
              );
            })}
          </ol>
        )}
      </section>

      <SemanticTransitionActions
        proposalId={proposal.proposal_id}
        proposalFingerprint={proposal.integrity.fingerprint}
        decisions={read.decision_history
          .filter((item) => item.pilot_actionable)
          .map((item) => item.decision)}
        persistedReceipts={read.transition_receipts}
        priorPacket={priorPacket}
        onSessionInvalid={onSessionInvalid}
        onPrivateMaterialChanged={onPrivateMaterialChanged}
        tryBeginOperatorMutation={tryBeginOperatorMutation}
        endOperatorMutation={endOperatorMutation}
      />

      <section
        className={styles.panel}
        data-vnext-operator-step="transition"
        data-vnext-transition-status={read.transition.status}
        aria-labelledby="transition-status-title"
      >
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Transition status</p>
          <h2 id="transition-status-title">Decision is not transition</h2>
        </div>
        <dl className={styles.statusGrid}>
          <div>
            <dt>Status</dt>
            <dd>{read.transition.status}</dd>
          </div>
          <div>
            <dt>Receipt ID</dt>
            <dd>{read.transition.transition_receipt_id ?? "none"}</dd>
          </div>
          <div>
            <dt>Receipt fingerprint</dt>
            <dd>{read.transition.transition_receipt_fingerprint ?? "none"}</dd>
          </div>
          <div>
            <dt>Actions here</dt>
            <dd>explicit controls above</dd>
          </div>
        </dl>
        <TextCollection
          title="Transition notes"
          items={read.transition.notes}
        />
        <p className={styles.notice}>
          This status panel reports persisted transition lineage. A ReviewDecision is
          still not a transition; the separate controls above require fresh preview,
          exact gate confirmation, and atomic Transition-plus-packet application.
        </p>
      </section>

      <DurableLineagePanel lineage={read.durable_lineage} />

      {read.project_continuity.latest_applied_transition?.proposal_id ===
        proposal.proposal_id && read.project_continuity.latest_context_use_receipt ? (
        <section
          className={styles.panel}
          data-vnext-context-use-feedback="available"
          aria-labelledby="context-use-feedback-title"
        >
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Later-run feedback</p>
            <h2 id="context-use-feedback-title">ContextUseReview</h2>
          </div>
          <p className={styles.copy}>
            A real later RunReceipt exists for the compiled packet. Packet presentation,
            user-declared actual use, and usefulness remain separate classifications.
            The counts below are task-wide later-receipt residue, not support for the
            actual-use classification.
          </p>
          <dl className={styles.statusGrid}>
            <div><dt>Task-wide direct observations</dt><dd>{read.project_continuity.latest_context_use_receipt.trust_summary.direct_observations}</dd></div>
            <div><dt>Task-wide verified external observations</dt><dd>{read.project_continuity.latest_context_use_receipt.trust_summary.verified_external_observations}</dd></div>
            <div><dt>Task-wide host attestations</dt><dd>{read.project_continuity.latest_context_use_receipt.trust_summary.host_attestations}</dd></div>
            <div><dt>Task-wide provider reports</dt><dd>{read.project_continuity.latest_context_use_receipt.trust_summary.provider_reports}</dd></div>
          </dl>
          {read.project_continuity.latest_context_use_review_status?.later_task_run_receipt_id ===
          read.project_continuity.latest_context_use_receipt.receipt_id ? (
            <dl className={styles.statusGrid}>
              <div><dt>Presented</dt><dd>{read.project_continuity.latest_context_use_review_status.presented}</dd></div>
              <div><dt>Presentation basis</dt><dd>{read.project_continuity.latest_context_use_review_status.presentation_basis ?? "not recorded (historical)"}</dd></div>
              <div><dt>Assessment</dt><dd>{read.project_continuity.latest_context_use_review_status.assessment}</dd></div>
              <div><dt>Usefulness basis</dt><dd>{read.project_continuity.latest_context_use_review_status.assessment_basis ?? "not recorded (historical)"}</dd></div>
              <div><dt>User-declared actually used</dt><dd>{read.project_continuity.latest_context_use_review_status.actually_used}</dd></div>
              <div><dt>Actual-use basis</dt><dd>{read.project_continuity.latest_context_use_review_status.actually_used_basis ?? "not recorded (historical)"}</dd></div>
              <div><dt>Reviewed</dt><dd>{read.project_continuity.latest_context_use_review_status.reviewed_at}</dd></div>
              <div><dt>Authority</dt><dd>non-authoritative feedback</dd></div>
            </dl>
          ) : (
            <ContextUseReviewForm
              receiptId={read.project_continuity.latest_context_use_receipt.receipt_id}
              receiptFingerprint={read.project_continuity.latest_context_use_receipt.receipt_fingerprint}
              busy={busyCandidateId !== null}
              onSubmit={onContextUseReview}
            />
          )}
        </section>
      ) : (
        <section className={styles.panel} data-vnext-context-use-feedback="not_yet_available">
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Later-run feedback</p>
            <h2>ContextUseReview not yet available</h2>
          </div>
          <p className={styles.empty}>
            Feedback requires an applied Transition, its compiled later packet, and a
            real later interactive RunReceipt. Transition application never launches
            that later run automatically.
          </p>
        </section>
      )}
    </section>
  );
}

function RunAssessmentSnapshot({
  source,
}: {
  source: EpisodeDeltaProposalSourceAssessmentV01;
}) {
  return (
    <section
      className={styles.panel}
      data-run-assessment-proposal="v0.1"
      data-task-success-status={source.comparison.task_success_status}
      data-assessment-authoritative="false"
      aria-labelledby="run-assessment-proposal-title"
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Persisted assessment snapshot</p>
        <h2 id="run-assessment-proposal-title">
          Expected task versus observed execution
        </h2>
      </div>
      <p className={styles.copy} data-execution-task-success="true">
        Execution {source.observed.execution.status} / task success {source.comparison.task_success_status}
      </p>
      <dl className={styles.statusGrid}>
        <div><dt>Assessment</dt><dd>{source.assessment.assessment_version}</dd></div>
        <div><dt>Verification</dt><dd>{source.observed.verification.status}</dd></div>
        <div><dt>Relation policy</dt><dd>explicit protocol relations only</dd></div>
        <div><dt>Criterion relations</dt><dd>unavailable</dd></div>
      </dl>
      <div className={styles.twoColumnGrid}>
        <section className={styles.materialCard}>
          <h3>Expected</h3>
          <strong>{source.expected.task_goal}</strong>
          <TextCollection title="Required checks" items={source.expected.required_checks} />
          <TextCollection title="Expected artifacts" items={source.expected.expected_artifacts} />
          <TextCollection title="Required return fields" items={source.expected.required_return_fields} />
          <TextCollection title="Forbidden actions" items={source.expected.forbidden_actions} />
        </section>
        <section className={styles.materialCard}>
          <h3>Observed</h3>
          <p className={styles.copy}>{source.observed.result_summary.summary}</p>
          <span>{source.observed.commands.length} command summaries</span>
          <span>{source.observed.changed_artifacts.length} changed artifacts</span>
          <span>{source.observed.gaps.length} receipt gaps</span>
          <span>Raw terminal output persisted: no</span>
        </section>
      </div>
      <h3>Task success criteria</h3>
      <ol className={styles.plainList} data-proposal-criterion-items="true">
        {source.assessment.criteria.map((criterion) => (
          <li
            key={criterion.criterion_id}
            data-criterion-status={criterion.status}
            data-criterion-basis={criterion.basis}
          >
            <strong>{criterion.criterion}</strong>
            <span>{criterion.status} · {criterion.basis}</span>
            <small>
              {criterion.supporting_refs.length} supporting refs · {criterion.opposing_refs.length} opposing refs · {criterion.missing_refs.length} criterion-specific missing refs
            </small>
            <TextCollection title="Uncertainty" items={criterion.uncertainty} />
          </li>
        ))}
      </ol>
      <div className={styles.twoColumnGrid}>
        <section className={styles.materialCard} data-proposal-checks="true">
          <h3>Checks</h3>
          <ul className={styles.plainList}>
            {source.observed.checks.map((check) => (
              <li key={`check:${check.check_id}`}>
                <strong>{check.check_id}</strong>
                <span>{check.status} · {check.required ? "required" : "optional"} · {check.basis}</span>
                <small>{check.summary}</small>
              </li>
            ))}
            {source.observed.skipped_checks.map((check) => (
              <li key={`skipped:${check.check_id}`} data-check-status="skipped">
                <strong>{check.check_id}</strong>
                <span>skipped · {check.required ? "required" : "optional"} · {check.basis}</span>
                <small>{check.reason}</small>
              </li>
            ))}
          </ul>
        </section>
        <section className={styles.materialCard} data-proposal-artifacts="true">
          <h3>Changed artifacts</h3>
          <ul className={styles.plainList}>
            {source.observed.changed_artifacts.map((artifact) => (
              <li key={externalRefKey(artifact.artifact_ref)}>
                <strong>{artifact.artifact_ref.external_id}</strong>
                <span>{artifact.change_kind} · {artifact.basis}</span>
                <small>Source linked; raw artifact content persisted: no</small>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className={styles.metricGrid} data-proposal-trust="true">
        <Metric label="Direct observations" value={source.observed.trust_summary.direct_observations} />
        <Metric label="Verified external" value={source.observed.trust_summary.verified_external_observations} />
        <Metric label="Host attestations" value={source.observed.trust_summary.host_attestations} />
        <Metric label="Provider reports" value={source.observed.trust_summary.provider_reports} />
        <Metric label="Derived interpretations" value={source.observed.trust_summary.derived_interpretations} />
      </div>
      <h3>Operation coverage</h3>
      <ul className={styles.plainList} data-proposal-coverage="true">
        {source.observed.capability_coverage.map((entry) => (
          <li key={entry.capability} data-coverage-level={entry.coverage_level}>
            <strong>{entry.capability}</strong>
            <span>{entry.coverage_level === "outside_coverage" ? "unsupported / unavailable" : entry.coverage_level}</span>
            <TextCollection title="Coverage notes" items={entry.notes} />
          </li>
        ))}
      </ul>
      <TextCollection title="Comparison gaps" items={source.comparison.gaps} />
      <div className={styles.provenanceGrid}>
        <RefCollection title="Exact packet" refs={[source.packet_ref]} />
        <RefCollection title="Exact receipt" refs={[source.receipt_ref]} />
        <RefCollection title="Exact run" refs={[source.run_ref]} />
      </div>
      <span className={styles.identifier}>{source.assessment.assessment_fingerprint}</span>
      <p className={styles.notice} data-run-assessment-authority="false">
        This durable snapshot preserves candidate material only. It creates no
        Evidence acceptance, Claim validation, ReviewDecision, Transition,
        semantic-state change, or later-context change.
      </p>
    </section>
  );
}

function ProvenanceLane({
  lane,
  title,
  emptyText,
  items,
}: {
  lane: "observation" | "attestation" | "inference";
  title: string;
  emptyText: string;
  items: Array<{
    id: string;
    kind: string;
    summary: string;
    trust: string;
    at: string;
    basis: string;
  }>;
}) {
  return (
    <section className={styles.materialCard} data-vnext-provenance-lane={lane}>
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <ol className={styles.materialList}>
          {items.map((item) => (
            <li className={styles.materialCard} key={item.id}>
              <span className={styles.badge}>{item.trust}</span>
              <strong>{item.kind}</strong>
              <span className={styles.identifier}>{item.id}</span>
              <p className={styles.copy}>{item.summary}</p>
              <span className={styles.muted}>{item.at}</span>
              <span className={styles.muted}>{item.basis}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function IssuePanel({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: Array<{ id: string; summary: string; meta: string }>;
}) {
  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Review material</p>
        <h2>{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <ol className={styles.plainList}>
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.summary}</strong>
              <span className={styles.identifier}>{item.id}</span>
              <span>{item.meta}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function RefCollection({ title, refs }: { title: string; refs: ExternalRefV01[] }) {
  return (
    <section className={styles.materialCard} aria-label={title}>
      <h3>{title}</h3>
      {refs.length === 0 ? (
        <p className={styles.empty}>None supplied.</p>
      ) : (
        <ul className={styles.plainList}>
          {refs.map((ref) => (
            <li key={externalRefKey(ref)}>
              <strong>{ref.ref_type}</strong>
              <span className={styles.identifier}>{ref.external_id}</span>
              <span>
                Trust {ref.trust_class}; source fingerprint {ref.source_ref ?? "none"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TextCollection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className={styles.materialCard} aria-label={title}>
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className={styles.empty}>None recorded.</p>
      ) : (
        <ul className={styles.plainList}>
          {items.map((item, index) => (
            <li key={`${index}:${item}`}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function externalRefKey(ref: ExternalRefV01): string {
  return [
    ref.compatibility_namespace ?? "",
    ref.ref_type,
    ref.external_id,
    ref.trust_class,
    ref.source_ref ?? "",
  ].join("|");
}
