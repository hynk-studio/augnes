import type { EpisodeDeltaProposalSourceAssessmentV01 } from "@/types/vnext/episode-delta-proposal";
import type { CriterionAssessmentTrustV01 } from "@/types/vnext/criterion-assessment";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  ProjectVerifyClaimFamilyProjectionV01,
  ProjectVerifyClaimRevisionProjectionV01,
  ProjectVerifyExactProtocolRefV01,
  ProjectVerifyReconciliationV01,
  ProjectVerifyRelationFamilyProjectionV01,
  ProjectVerifyRelationRevisionProjectionV01,
} from "@/types/vnext/project-verify-reconciliation";
import type { ProjectVerifyLineageV01 } from "@/types/vnext/project-verify-lineage";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

import type { SemanticReviewProjectV01 } from "./semantic-review-types";
import {
  boundedProjectVerifyDisplayTextV01,
  findExactClaimRevisionV01,
  findExactRelationRevisionV01,
  projectVerificationWorkbenchPresentationV01,
  runReceiptComparisonPresentationV01,
} from "./project-verification-presentation";
import styles from "./semantic-review.module.css";

export function ProjectVerificationWorkbench({
  project,
  reconciliation,
  lineage,
  sourceAssessment,
  sourceReceipts,
  sourceCurrentness,
  packetRef,
}: {
  project: SemanticReviewProjectV01;
  reconciliation: ProjectVerifyReconciliationV01;
  lineage?: ProjectVerifyLineageV01;
  sourceAssessment?: EpisodeDeltaProposalSourceAssessmentV01;
  sourceReceipts?: RunReceiptV01[];
  sourceCurrentness?: string;
  packetRef?: ExternalRefV01 | null;
}) {
  const receipts = sourceReceipts ?? [];
  const presentation = projectVerificationWorkbenchPresentationV01(
    reconciliation,
    lineage,
  );
  const relationCounts = presentation.relation_counts;
  const receiptComparison = runReceiptComparisonPresentationV01(receipts);

  return (
    <div
      className={styles.workbenchSequence}
      data-vnext-decision-workbench="v0.1"
      data-project-verify-reconciliation-version={
        reconciliation.reconciliation_version
      }
      data-project-verify-completeness={reconciliation.completeness.status}
      data-project-verify-claim-truth={reconciliation.summary.claim_truth}
    >
      <section className={styles.panel} aria-labelledby="verify-scope-title">
        <SequenceHeading
          step="Resume"
          title="Current project and review scope"
          id="verify-scope-title"
        />
        <p className={styles.copy}>
          This Workbench is reading the selected project only. Return to Project
          Home to change projects or resume another task.
        </p>
        <dl className={styles.statusGrid}>
          <DataPoint label="Workspace scope" value="validated" />
          <DataPoint label="Selected project" value="current route scope" />
          <DataPoint
            label="Canonical read"
            value={humanize(reconciliation.completeness.status)}
          />
          <DataPoint label="Observed" value={reconciliation.observed_at} />
        </dl>
        <details className={styles.disclosure}>
          <summary>Exact workspace and project scope</summary>
          <span className={styles.identifier}>{project.workspace_id}</span>
          <span className={styles.identifier}>{project.project_id}</span>
        </details>
        {reconciliation.completeness.status !== "complete" ? (
          <p className={styles.notice} data-vnext-bounded-read-incomplete="true">
            This bounded Core read is {humanize(reconciliation.completeness.status)}.
            Omitted material is not treated as absent, resolved, or false
            {reconciliation.completeness.omitted_reason
              ? ` (${humanize(reconciliation.completeness.omitted_reason)})`
              : ""}
            .
          </p>
        ) : null}
      </section>

      <section className={styles.panel} aria-labelledby="verify-intent-title">
        <SequenceHeading
          step="1–2"
          title="What was intended and which context was selected"
          id="verify-intent-title"
        />
        {sourceAssessment ? (
          <div className={styles.twoColumnGrid}>
            <section className={styles.materialCard}>
              <h3>Task intent</h3>
              <strong>
                {boundedProjectVerifyDisplayTextV01(
                  sourceAssessment.expected.task_goal,
                )}
              </strong>
              <TextList
                title="Required checks"
                items={sourceAssessment.expected.required_checks}
              />
              <TextList
                title="Expected artifacts"
                items={sourceAssessment.expected.expected_artifacts}
              />
              <TextList
                title="Forbidden actions"
                items={sourceAssessment.expected.forbidden_actions}
              />
            </section>
            <section className={styles.materialCard}>
              <h3>Selected context boundary</h3>
              <span>
                Source currentness: {humanize(sourceCurrentness ?? "unknown")}
              </span>
              <span>
                Criterion relations: {sourceAssessment.comparison.criterion_specific_relations_available
                  ? "exact source-bound relations available"
                  : "unavailable"}
              </span>
              <span>
                Assessment authority: non-authoritative comparison
              </span>
              <span>
                Context authority: selected working context, not project truth
              </span>
              {packetRef ? (
                <details className={styles.disclosure}>
                  <summary>Exact source packet binding</summary>
                  <ExactExternalRefs
                    title="Exact source packet"
                    refs={[packetRef]}
                  />
                </details>
              ) : (
                <p className={styles.empty}>No exact source packet is bound.</p>
              )}
            </section>
          </div>
        ) : (
          <p className={styles.empty} data-vnext-source-assessment="unavailable">
            This historical proposal has no exact source-assessment snapshot.
            The Workbench does not reconstruct intent or criterion meaning from
            proposal prose.
          </p>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="verify-receipts-title">
        <SequenceHeading
          step="3–4"
          title="What happened, and what was observed versus reported"
          id="verify-receipts-title"
        />
        {receipts.length === 0 ? (
          <p className={styles.empty} data-vnext-receipt-comparison="unavailable">
            No exact RunReceipt payload is available in this review entry. No
            execution outcome is inferred.
          </p>
        ) : (
          <>
            <p
              className={styles.copy}
              data-vnext-receipt-comparison={
                receiptComparison.mode
              }
            >
              {receiptComparison.mode === "multiple"
                ? `${receipts.length} exact RunReceipts are shown in canonical source order. Differences remain separate; they are not voted or merged.`
                : "One exact RunReceipt is available. The Workbench does not imply a cross-run comparison."}
            </p>
            <ol className={styles.receiptGrid}>
              {receipts.map((receipt, index) => (
                <li
                  className={styles.materialCard}
                  key={`${receipt.receipt_id}:${receipt.integrity.fingerprint}`}
                  data-run-receipt-outcome={receipt.result_summary.outcome}
                >
                  <div className={styles.rowBetween}>
                    <h3>Receipt {index + 1}</h3>
                    <span className={styles.badge}>
                      {humanize(receipt.result_summary.outcome ?? "unknown")}
                    </span>
                  </div>
                  <p className={styles.copy}>
                    {boundedProjectVerifyDisplayTextV01(
                      receipt.result_summary.summary,
                    )}
                  </p>
                  <dl className={styles.statusGrid}>
                    <DataPoint
                      label="Execution"
                      value={humanize(receipt.execution.status)}
                    />
                    <DataPoint
                      label="Verification"
                      value={humanize(receipt.verification.status)}
                    />
                    <DataPoint
                      label="Checks"
                      value={String(receipt.checks.length)}
                    />
                    <DataPoint
                      label="Skipped"
                      value={String(receipt.skipped_checks.length)}
                    />
                  </dl>
                  <CheckList receipt={receipt} />
                  <TrustSummary receipt={receipt} />
                  <details className={styles.disclosure}>
                    <summary>Exact receipt and artifact lineage</summary>
                    <span className={styles.identifier}>{receipt.receipt_id}</span>
                    <span className={styles.identifier}>
                      {receipt.integrity.fingerprint}
                    </span>
                    <ExactExternalRefs
                      title="Artifacts"
                      refs={receipt.artifact_refs}
                    />
                  </details>
                </li>
              ))}
            </ol>
          </>
        )}
        <p className={styles.notice} data-host-completion-not-task-success="true">
          Host completion, changed files, unrelated passed checks, and provider
          confidence are not task success. Criterion status below comes only from
          the exact Core assessment.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="verify-criteria-title">
        <SequenceHeading
          step="5"
          title="Success criteria and their exact basis"
          id="verify-criteria-title"
        />
        {reconciliation.criteria.length === 0 ? (
          <p className={styles.empty} data-vnext-criterion-state="unavailable">
            No exact criterion assessment is available. Status remains unknown;
            checks, prose, or filenames are not used as substitutes.
          </p>
        ) : (
          <ol className={styles.criterionList}>
            {reconciliation.criteria.map((entry) => {
              const criterion = entry.criterion;
              return (
                <li
                  className={styles.criterionCard}
                  key={`${entry.assessment_ref.record_id}:${criterion.criterion_id}`}
                  data-criterion-status={criterion.status}
                  data-criterion-basis={criterion.basis}
                >
                  <div className={styles.rowBetween}>
                    <strong>
                      {boundedProjectVerifyDisplayTextV01(criterion.criterion)}
                    </strong>
                    <span className={styles.badge}>
                      {humanize(criterion.status)} · {humanize(criterion.basis)}
                    </span>
                  </div>
                  <div className={styles.relationCounts}>
                    <Count label="Supporting" value={criterion.supporting_refs.length} />
                    <Count label="Opposing" value={criterion.opposing_refs.length} />
                    <Count label="Missing" value={criterion.missing_refs.length} />
                    <Count
                      label="Uncertainty"
                      value={criterion.uncertainty.length}
                    />
                  </div>
                  <TrustValues values={criterion.trust} />
                  <TextList
                    title="Operation coverage"
                    items={criterion.operation_coverage.map(
                      (coverage) =>
                        `${humanize(coverage.capability)}: ${humanize(coverage.coverage_level)}${
                          coverage.notes.length > 0
                            ? ` — ${coverage.notes.join("; ")}`
                            : ""
                        }`,
                    )}
                  />
                  <TextList title="Uncertainty" items={criterion.uncertainty} />
                  <details className={styles.disclosure}>
                    <summary>Exact criterion source relations</summary>
                    <ExactExternalRefs
                      title="Supporting refs"
                      refs={criterion.supporting_refs}
                    />
                    <ExactExternalRefs
                      title="Opposing refs"
                      refs={criterion.opposing_refs}
                    />
                    <ExactExternalRefs
                      title="Missing refs"
                      refs={criterion.missing_refs}
                    />
                    <ExactProtocolRefs
                      title="Packet, receipt, and assessment"
                      refs={[
                        entry.packet_ref,
                        entry.receipt_ref,
                        entry.assessment_ref,
                      ]}
                    />
                  </details>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="verify-reconciliation-title">
        <SequenceHeading
          step="6"
          title="Evidence, Claims, contradiction, qualification, and uncertainty"
          id="verify-reconciliation-title"
        />
        <p className={styles.copy}>
          Evidence is support material. Claims are revisable propositions. A
          relation is not proof, and neither relation count nor confidence
          establishes Claim truth.
        </p>
        <div className={styles.relationMatrix} data-claim-truth="not_established">
          {relationCounts.map((entry) => (
            <div key={entry.kind} data-relation-kind={entry.kind}>
              <span>{humanize(entry.kind)}</span>
              <strong>{entry.applied} applied · {entry.pending} pending</strong>
            </div>
          ))}
        </div>
        <EvidenceList reconciliation={reconciliation} />
        <ClaimFamilyList families={reconciliation.claim_families} />
        <RelationFamilyList families={reconciliation.relation_families} />
      </section>

      <section className={styles.panel} aria-labelledby="verify-conflicts-title">
        <SequenceHeading
          step="8"
          title="What remains uncertain, opposed, or blocked"
          id="verify-conflicts-title"
        />
        {reconciliation.conflicts.length === 0 ? (
          <p className={styles.empty}>
            No project-level reconciliation conflict is recorded. Individual
            uncertainty and opposing material above still remain distinct.
          </p>
        ) : (
          <ol className={styles.plainList} data-project-verify-conflicts="true">
            {reconciliation.conflicts.map((conflict, index) => (
              <li key={`${conflict.conflict_kind}:${conflict.code}:${index}`}>
                <strong>{humanize(conflict.conflict_kind)}</strong>
                <span>{humanize(conflict.code)}</span>
                <details className={styles.disclosure}>
                  <summary>Exact conflict records and sources</summary>
                  <ExactProtocolRefs title="Exact records" refs={conflict.exact_refs} />
                  <ExactExternalRefs title="Exact sources" refs={conflict.source_refs} />
                </details>
              </li>
            ))}
          </ol>
        )}
        {lineage ? <LineageStop lineage={lineage} /> : null}
      </section>

      <section className={styles.panel} aria-labelledby="verify-later-context-title">
        <SequenceHeading
          step="12–13"
          title="Actual Transition and later-context consequence"
          id="verify-later-context-title"
        />
        {reconciliation.later_context.length === 0 ? (
          <p className={styles.empty} data-vnext-later-context="not_available">
            No successfully applied Verify-material Transition has a later-context
            chain in this project read. Candidate, decision-only, gate-only,
            rejected, deferred, and unknown material did not change context.
          </p>
        ) : (
          <ol className={styles.plainList} data-vnext-later-context="available">
            {reconciliation.later_context.map((entry) => (
              <li
                key={`${entry.source_transition_receipt_ref.record_id}:${
                  entry.later_packet_ref?.record_id ?? "pending"
                }:${entry.context_use_review_ref?.record_id ?? "pending"}`}
              >
                <strong>{humanize(entry.status)}</strong>
                <span>
                  Transition applied: yes · later packet: {entry.later_packet_ref ? "recorded" : "pending"}
                  {` · feedback: ${entry.context_use_review_ref ? "recorded" : "pending"}`}
                </span>
                <details className={styles.disclosure}>
                  <summary>Exact applied and later-context lineage</summary>
                  <ExactProtocolRefs
                    title="Exact applied lineage"
                    refs={[
                      entry.source_transition_receipt_ref,
                      ...(entry.later_packet_ref ? [entry.later_packet_ref] : []),
                      ...(entry.context_use_review_ref
                        ? [entry.context_use_review_ref]
                        : []),
                    ]}
                  />
                </details>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function EvidenceList({
  reconciliation,
}: {
  reconciliation: ProjectVerifyReconciliationV01;
}) {
  return (
    <section className={styles.reconciliationGroup} aria-labelledby="evidence-title">
      <div className={styles.rowBetween}>
        <h3 id="evidence-title">Evidence support material</h3>
        <span className={styles.badge}>{reconciliation.evidence.length} records</span>
      </div>
      {reconciliation.evidence.length === 0 ? (
        <p className={styles.empty}>No canonical EvidenceRecord material exists.</p>
      ) : (
        <ol className={styles.reconciliationCards}>
          {reconciliation.evidence.map((entry) => (
            <li
              className={styles.materialCard}
              key={`${entry.evidence_ref.record_id}:${entry.evidence_ref.record_fingerprint}`}
              data-evidence-authentication={entry.source_authentication.status}
            >
              <div className={styles.rowBetween}>
                <strong>
                  {boundedProjectVerifyDisplayTextV01(
                    entry.evidence.bounded_summary,
                  )}
                </strong>
                <span className={styles.badge}>{humanize(entry.trust_class)}</span>
              </div>
              <span>
                Coverage {humanize(entry.coverage)} · source authentication {humanize(entry.source_authentication.status)}
              </span>
              <span>Acceptance: not accepted by record existence</span>
              <TextList title="Limitations" items={entry.limitations} />
              <TextList title="Uncertainty" items={entry.uncertainty} />
              <details className={styles.disclosure}>
                <summary>Exact Evidence record and sources</summary>
                <ExactProtocolRefs title="Exact Evidence record" refs={[toExactRef(entry.evidence_ref)]} />
                <ExactExternalRefs title="Exact sources" refs={entry.source_refs} />
              </details>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ClaimFamilyList({
  families,
}: {
  families: ProjectVerifyClaimFamilyProjectionV01[];
}) {
  return (
    <section className={styles.reconciliationGroup} aria-labelledby="claims-title">
      <div className={styles.rowBetween}>
        <h3 id="claims-title">Claim families</h3>
        <span className={styles.badge}>{families.length} families</span>
      </div>
      {families.length === 0 ? (
        <p className={styles.empty}>No canonical Claim material exists.</p>
      ) : (
        <ol className={styles.reconciliationCards}>
          {families.map((family) => {
            const latest = findExactClaimRevisionV01(
              family,
              family.latest_recorded_candidate_ref,
            );
            const current = findExactClaimRevisionV01(
              family,
              family.applied_current_head_ref,
            );
            return (
              <li
                className={styles.materialCard}
                key={family.claim_family_id}
                data-claim-current={current ? "applied" : "none"}
                data-claim-latest-recorded={latest ? "present" : "none"}
              >
                <div className={styles.rowBetween}>
                  <strong>
                    {boundedProjectVerifyDisplayTextV01(
                      latest?.claim.proposition ?? "Claim family",
                    )}
                  </strong>
                  <span className={styles.badge}>truth not established</span>
                </div>
                <dl className={styles.statusGrid}>
                  <DataPoint
                    label="Applied current"
                    value={
                      current
                        ? boundedProjectVerifyDisplayTextV01(
                            current.claim.proposition,
                          )
                        : "none"
                    }
                  />
                  <DataPoint
                    label="Latest recorded"
                    value={
                      latest
                        ? boundedProjectVerifyDisplayTextV01(
                            latest.claim.proposition,
                          )
                        : "none"
                    }
                  />
                  <DataPoint
                    label="Pending revisions"
                    value={String(family.pending_revision_refs.length)}
                  />
                  <DataPoint
                    label="Historical applied"
                    value={String(family.previously_applied_refs.length)}
                  />
                </dl>
                {latest && current?.claim_ref.record_id !== latest.claim_ref.record_id ? (
                  <p className={styles.notice} data-latest-recorded-not-current="true">
                    The latest recorded candidate is not the applied current head.
                    Recording order did not change project state.
                  </p>
                ) : null}
                {family.completeness.status !== "complete" ? (
                  <p className={styles.notice}>
                    This family read is {humanize(family.completeness.status)};
                    omitted revisions are not treated as absent.
                  </p>
                ) : null}
                <details className={styles.disclosure}>
                  <summary>Revision history and exact family lineage</summary>
                  <ol className={styles.plainList}>
                    {family.revisions.map((revision) => (
                      <ClaimRevision key={revision.claim_ref.record_id} revision={revision} />
                    ))}
                  </ol>
                  <span className={styles.identifier}>{family.claim_family_id}</span>
                </details>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function ClaimRevision({
  revision,
}: {
  revision: ProjectVerifyClaimRevisionProjectionV01;
}) {
  return (
    <li data-claim-application={revision.lifecycle.application.status}>
      <strong>
        Revision {revision.claim.revision} · {humanize(revision.claim.operation_intent)}
      </strong>
      <span>
        {boundedProjectVerifyDisplayTextV01(revision.claim.proposition)}
      </span>
      <span>
        Review {humanize(revision.lifecycle.review.status)} · decision {humanize(revision.lifecycle.decision.status)} · gate {humanize(revision.lifecycle.gate.status)} · Transition {humanize(revision.lifecycle.transition.status)} · application {humanize(revision.lifecycle.application.status)}
      </span>
      <span>Claim truth: not established</span>
      <ExactProtocolRefs title="Exact Claim revision" refs={[toExactRef(revision.claim_ref)]} />
    </li>
  );
}

function RelationFamilyList({
  families,
}: {
  families: ProjectVerifyRelationFamilyProjectionV01[];
}) {
  return (
    <section className={styles.reconciliationGroup} aria-labelledby="relations-title">
      <div className={styles.rowBetween}>
        <h3 id="relations-title">Claim–Evidence relation families</h3>
        <span className={styles.badge}>{families.length} families</span>
      </div>
      {families.length === 0 ? (
        <p className={styles.empty}>No canonical relation material exists.</p>
      ) : (
        <ol className={styles.reconciliationCards}>
          {families.map((family) => {
            const latest = findExactRelationRevisionV01(
              family,
              family.latest_recorded_candidate_ref,
            );
            const current = findExactRelationRevisionV01(
              family,
              family.applied_current_head_ref,
            );
            return (
              <li className={styles.materialCard} key={family.relation_family_id}>
                <div className={styles.rowBetween}>
                  <strong>
                    {humanize(latest?.relation.relation_kind ?? "relation")}
                  </strong>
                  <span className={styles.badge}>relation is not proof</span>
                </div>
                <dl className={styles.statusGrid}>
                  <DataPoint
                    label="Applied current"
                    value={current ? humanize(current.relation.relation_kind) : "none"}
                  />
                  <DataPoint
                    label="Latest recorded"
                    value={latest ? humanize(latest.relation.relation_kind) : "none"}
                  />
                  <DataPoint
                    label="Basis"
                    value={latest ? humanize(latest.relation.basis) : "unknown"}
                  />
                  <DataPoint
                    label="Trust"
                    value={latest ? humanize(latest.relation.trust_class) : "unknown"}
                  />
                </dl>
                {latest && current?.relation_ref.record_id !== latest.relation_ref.record_id ? (
                  <p className={styles.notice} data-latest-relation-not-current="true">
                    The latest recorded relation is not the applied current relation.
                  </p>
                ) : null}
                <details className={styles.disclosure}>
                  <summary>Relation revisions and exact endpoints</summary>
                  <ol className={styles.plainList}>
                    {family.revisions.map((revision) => (
                      <RelationRevision
                        key={revision.relation_ref.record_id}
                        revision={revision}
                      />
                    ))}
                  </ol>
                  <ExactProtocolRefs
                    title="Exact endpoints"
                    refs={[
                      toExactRef(family.claim_ref),
                      toExactRef(family.evidence_ref),
                    ]}
                  />
                </details>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function RelationRevision({
  revision,
}: {
  revision: ProjectVerifyRelationRevisionProjectionV01;
}) {
  return (
    <li data-relation-application={revision.lifecycle.application.status}>
      <strong>
        Revision {revision.relation.revision} · {humanize(revision.relation.relation_kind)}
      </strong>
      <span>
        {humanize(revision.relation.basis)} basis · {humanize(revision.relation.trust_class)} trust
      </span>
      <span>
        Review {humanize(revision.lifecycle.review.status)} · decision {humanize(revision.lifecycle.decision.status)} · gate {humanize(revision.lifecycle.gate.status)} · Transition {humanize(revision.lifecycle.transition.status)} · application {humanize(revision.lifecycle.application.status)}
      </span>
      <span>Relation proves Claim: no</span>
      <ExactProtocolRefs
        title="Exact relation revision"
        refs={[toExactRef(revision.relation_ref)]}
      />
    </li>
  );
}

function LineageStop({ lineage }: { lineage: ProjectVerifyLineageV01 }) {
  return (
    <section
      className={styles.materialCard}
      data-project-verify-lineage-stop={lineage.stop.reason}
      data-project-verify-lineage-completeness={lineage.completeness.status}
    >
      <div className={styles.rowBetween}>
        <h3>Selected proposal lineage</h3>
        <span className={styles.badge}>{humanize(lineage.stop.reason)}</span>
      </div>
      <p className={styles.copy}>
        The exact chain stops at {humanize(lineage.stop.stopped_at)}. Missing
        stages are not fabricated, and a gate-only chain remains unapplied.
      </p>
      <div className={styles.relationCounts}>
        {lineage.nodes.map((node) => (
          <Count
            key={node.node_id}
            label={humanize(node.node_kind)}
            value={humanize(node.status)}
          />
        ))}
      </div>
      <details className={styles.disclosure}>
        <summary>Exact lineage nodes and edges</summary>
        <ol className={styles.plainList}>
          {lineage.nodes.map((node) => (
            <li key={node.node_id}>
              <strong>{humanize(node.node_kind)} · {humanize(node.status)}</strong>
              <span>{humanize(node.authority_boundary)}</span>
              {node.exact_ref ? (
                <ExactProtocolRefs title="Exact record" refs={[node.exact_ref]} />
              ) : null}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function CheckList({ receipt }: { receipt: RunReceiptV01 }) {
  return (
    <ul className={styles.plainList} aria-label="Receipt checks and skips">
      {receipt.checks.map((check) => (
        <li key={`check:${check.check_id}`} data-check-status={check.status}>
          <strong>{boundedProjectVerifyDisplayTextV01(check.summary)}</strong>
          <span>
            {humanize(check.status)} · {check.required ? "required" : "optional"} · {humanize(check.basis)}
          </span>
        </li>
      ))}
      {receipt.skipped_checks.map((check) => (
        <li key={`skip:${check.check_id}`} data-check-status="skipped">
          <strong>{boundedProjectVerifyDisplayTextV01(check.reason)}</strong>
          <span>
            skipped · {check.required ? "required" : "optional"} · not success
          </span>
        </li>
      ))}
    </ul>
  );
}

function TrustSummary({ receipt }: { receipt: RunReceiptV01 }) {
  return (
    <div className={styles.relationCounts} aria-label="Receipt provenance and trust">
      {Object.entries(receipt.trust_summary).map(([label, value]) => (
        <Count key={label} label={humanize(label)} value={value} />
      ))}
    </div>
  );
}

function TrustValues({ values }: { values: CriterionAssessmentTrustV01 }) {
  return (
    <div className={styles.relationCounts} aria-label="Criterion trust">
      {Object.entries(values).map(([label, value]) => (
        <Count key={label} label={humanize(label)} value={value} />
      ))}
    </div>
  );
}

function SequenceHeading({
  step,
  title,
  id,
}: {
  step: string;
  title: string;
  id: string;
}) {
  return (
    <div className={styles.panelHeader}>
      <p className={styles.kicker}>Reasoning step {step}</p>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <strong>{title}</strong>
      <ul className={styles.plainList}>
        {items.map((item, index) => (
          <li key={`${title}:${index}:${item}`}>
            {boundedProjectVerifyDisplayTextV01(item)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExactExternalRefs({ title, refs }: { title: string; refs: ExternalRefV01[] }) {
  if (refs.length === 0) return <p className={styles.muted}>{title}: none</p>;
  return (
    <section className={styles.exactRefs} aria-label={title}>
      <strong>{title}</strong>
      {refs.map((ref, index) => (
        <span className={styles.identifier} key={`${externalRefKey(ref)}:${index}`}>
          {ref.ref_type} · {ref.external_id} · {ref.trust_class} · {ref.source_ref ?? "no source fingerprint"}
        </span>
      ))}
    </section>
  );
}

function ExactProtocolRefs({
  title,
  refs,
}: {
  title: string;
  refs: ProjectVerifyExactProtocolRefV01[];
}) {
  if (refs.length === 0) return <p className={styles.muted}>{title}: none</p>;
  return (
    <section className={styles.exactRefs} aria-label={title}>
      <strong>{title}</strong>
      {refs.map((ref) => (
        <span className={styles.identifier} key={`${ref.record_kind}:${ref.record_id}:${ref.record_fingerprint}`}>
          {ref.record_kind} · {ref.record_id} · {ref.record_fingerprint}
        </span>
      ))}
    </section>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Count({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function toExactRef(
  ref: {
    record_kind: "evidence_record" | "claim_record" | "claim_evidence_relation";
    record_id: string;
    record_fingerprint: string;
  },
): ProjectVerifyExactProtocolRefV01 {
  return ref;
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

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}
