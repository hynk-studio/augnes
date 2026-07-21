import type { EpisodeDeltaProposalSourceAssessmentV01 } from "@/types/vnext/episode-delta-proposal";
import type { CriterionAssessmentTrustV01 } from "@/types/vnext/criterion-assessment";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  ProjectVerifyClaimFamilyProjectionV01,
  ProjectVerifyReconciliationV01,
  ProjectVerifyRelationFamilyProjectionV01,
} from "@/types/vnext/project-verify-reconciliation";
import type { ProjectVerifyLineageV01 } from "@/types/vnext/project-verify-lineage";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import { createSharedInspectorHrefV01 } from "@/lib/vnext/shared-project-inspector-href";

import {
  boundedProjectVerifyDisplayTextV01,
  findExactClaimRevisionV01,
  findExactRelationRevisionV01,
  projectVerificationWorkbenchPresentationV01,
  runReceiptComparisonPresentationV01,
} from "./project-verification-presentation";
import styles from "./semantic-review.module.css";

export function ProjectVerificationWorkbench({
  reconciliation,
  lineage,
  sourceAssessment,
  sourceReceipts,
  sourceCurrentness,
  packetRef,
}: {
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
  const criteriaDisclosure = criterionDisclosureSummaryV01(reconciliation);
  const relationDisclosure = relationDisclosureSummaryV01(reconciliation);
  const conflictDisclosure = conflictDisclosureSummaryV01(reconciliation, lineage);
  const laterContextDisclosure = laterContextDisclosureSummaryV01(reconciliation);

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
        <dl className={styles.statusGrid}>
          <DataPoint label="Workspace scope" value="validated" />
          <DataPoint label="Selected project" value="current route scope" />
          <DataPoint
            label="Canonical read"
            value={humanize(reconciliation.completeness.status)}
          />
          <DataPoint label="Observed" value={reconciliation.observed_at} />
        </dl>
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

      <details className={styles.sequenceDisclosure}>
        <summary>
          <span className={styles.sequenceNumber}>1–2</span>
          <span>
            <strong>Intent and selected context</strong>
            <small className={styles.sequenceDisclosureStatus} data-summary-tone={sourceAssessment ? "neutral" : "attention"}>
              {sourceAssessment
                ? `${boundedProjectVerifyDisplayTextV01(sourceAssessment.expected.task_goal)} · context ${humanize(sourceCurrentness ?? "unknown")}`
                : "Exact source assessment unavailable"}
            </small>
          </span>
        </summary>
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
                packetRef.ref_type === "task_context_packet" &&
                packetRef.source_ref?.startsWith("sha256:") ? (
                  <a
                    className={styles.linkButton}
                    href={createSharedInspectorHrefV01({
                      target_kind: "task_context_packet",
                      record_id: packetRef.external_id,
                      expected_fingerprint: packetRef.source_ref,
                    })}
                    data-context-to-shared-inspector="true"
                  >
                    Inspect exact selected context
                  </a>
                ) : (
                  <p className={styles.empty}>Exact packet binding is unavailable.</p>
                )
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
      </details>

      <details className={styles.sequenceDisclosure}>
        <summary>
          <span className={styles.sequenceNumber}>3–4</span>
          <span>
            <strong>Execution residue</strong>
            <small className={styles.sequenceDisclosureStatus} data-summary-tone={receipts.length === 0 ? "attention" : "neutral"}>
              {receipts.length === 0
                ? "Exact RunReceipt unavailable · outcome unknown"
                : `${receipts.length} exact ${receipts.length === 1 ? "RunReceipt" : "RunReceipts"} · ${receipts.map((receipt) => humanize(receipt.verification.status)).join(" · ")}`}
            </small>
          </span>
        </summary>
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
                  <a
                    className={styles.linkButton}
                    href={createSharedInspectorHrefV01({
                      target_kind: "run_receipt",
                      record_id: receipt.receipt_id,
                      expected_fingerprint: receipt.integrity.fingerprint,
                    })}
                    data-receipt-to-shared-inspector="true"
                  >
                    Inspect receipt, artifacts, and provenance
                  </a>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
      </details>
      <p className={styles.notice} data-host-completion-not-task-success="true">
        Host completion and unrelated passed checks are not task success; skipped
        checks remain incomplete. Criterion status comes only from the exact Core assessment.
      </p>

      <details className={styles.sequenceDisclosure}>
        <summary>
          <span className={styles.sequenceNumber}>5</span>
          <span>
            <strong>Success criteria and exact basis</strong>
            <small
              className={styles.sequenceDisclosureStatus}
              data-summary-tone={criteriaDisclosure.tone}
              data-workbench-criteria-summary="true"
            >
              {criteriaDisclosure.text}
            </small>
          </span>
        </summary>
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
                  <a
                    className={styles.linkButton}
                    href={createSharedInspectorHrefV01({
                      target_kind: "criterion",
                      criterion_id: criterion.criterion_id,
                      packet_id: entry.packet_ref.record_id,
                      packet_fingerprint: entry.packet_ref.record_fingerprint,
                      receipt_id: entry.receipt_ref.record_id,
                      receipt_fingerprint: entry.receipt_ref.record_fingerprint,
                      assessment_id: entry.assessment_ref.record_id,
                      assessment_fingerprint: entry.assessment_ref.record_fingerprint,
                    })}
                    data-criterion-to-shared-inspector="true"
                  >
                    Inspect exact criterion lineage
                  </a>
                </li>
              );
            })}
          </ol>
        )}
      </section>
      </details>

      <details className={styles.sequenceDisclosure}>
        <summary>
          <span className={styles.sequenceNumber}>6</span>
          <span>
            <strong>Evidence and Claim reconciliation</strong>
            <small
              className={styles.sequenceDisclosureStatus}
              data-summary-tone={relationDisclosure.tone}
              data-workbench-reconciliation-summary="true"
            >
              {relationDisclosure.text}
            </small>
          </span>
        </summary>
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
      </details>

      <details className={styles.sequenceDisclosure}>
        <summary>
          <span className={styles.sequenceNumber}>8</span>
          <span>
            <strong>Uncertain, opposed, or blocked material</strong>
            <small
              className={styles.sequenceDisclosureStatus}
              data-summary-tone={conflictDisclosure.tone}
              data-workbench-conflict-summary="true"
            >
              {conflictDisclosure.text}
            </small>
          </span>
        </summary>
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
                <span>
                  Exact conflict records and sources remain unresolved in the
                  canonical read. The shared Inspector exposes their bounded
                  source lineage without changing this status.
                </span>
              </li>
            ))}
          </ol>
        )}
        {lineage ? <LineageStop lineage={lineage} /> : null}
      </section>
      </details>

      <details className={styles.sequenceDisclosure}>
        <summary>
          <span className={styles.sequenceNumber}>12–13</span>
          <span>
            <strong>Project-level Transition and later context</strong>
            <small
              className={styles.sequenceDisclosureStatus}
              data-summary-tone={laterContextDisclosure.tone}
              data-workbench-later-context-summary="true"
            >
              {laterContextDisclosure.text}
            </small>
          </span>
        </summary>
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
                <a
                  className={styles.linkButton}
                  href={createSharedInspectorHrefV01({
                    target_kind: "state_transition_receipt",
                    record_id: entry.source_transition_receipt_ref.record_id,
                    expected_fingerprint:
                      entry.source_transition_receipt_ref.record_fingerprint,
                  })}
                  data-transition-to-shared-inspector="true"
                >
                  Inspect Transition, later packet, and feedback
                </a>
              </li>
            ))}
          </ol>
        )}
      </section>
      </details>
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
              <a
                className={styles.linkButton}
                href={createSharedInspectorHrefV01({
                  target_kind: "evidence_record",
                  record_id: entry.evidence_ref.record_id,
                  expected_fingerprint: entry.evidence_ref.record_fingerprint,
                })}
                data-evidence-to-shared-inspector="true"
              >
                Inspect exact Evidence and relations
              </a>
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
                <a
                  className={styles.linkButton}
                  href={createSharedInspectorHrefV01({
                    target_kind: "claim_family",
                    family_id: family.claim_family_id,
                    family_origin_fingerprint: family.family_origin_fingerprint,
                    applicability_scope_fingerprint:
                      family.applicability_scope_fingerprint,
                  })}
                  data-claim-family-to-shared-inspector="true"
                >
                  Inspect immutable Claim revisions
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </section>
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
                <a
                  className={styles.linkButton}
                  href={createSharedInspectorHrefV01({
                    target_kind: "relation_family",
                    family_id: family.relation_family_id,
                    family_origin_fingerprint: family.family_origin_fingerprint,
                    applicability_scope_fingerprint:
                      family.applicability_scope_fingerprint,
                  })}
                  data-relation-family-to-shared-inspector="true"
                >
                  Inspect relation revisions and endpoints
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </section>
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
      <p className={styles.muted}>
        Exact nodes, edges, source refs, and fingerprints are available through
        the shared Inspector. This Workbench keeps the user-readable stop and
        lifecycle status needed for a decision.
      </p>
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

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

type DisclosureSummaryV01 = {
  text: string;
  tone: "neutral" | "attention" | "critical";
};

function criterionDisclosureSummaryV01(
  reconciliation: ProjectVerifyReconciliationV01,
): DisclosureSummaryV01 {
  if (reconciliation.criteria.length === 0) {
    return {
      text: reconciliation.source_assessments.length === 0
        ? "Exact assessment unavailable · criterion status unknown"
        : `Exact assessment present · 0 criteria returned · criterion status unavailable${reconciliation.completeness.status === "complete" ? "" : ` · ${humanize(reconciliation.completeness.status)} read`}`,
      tone: "attention",
    };
  }
  const counts = {
    satisfied: 0,
    unsatisfied: 0,
    unknown: 0,
    not_applicable: 0,
  };
  reconciliation.criteria.forEach(({ criterion }) => {
    counts[criterion.status] += 1;
  });
  return {
    text: `${counts.satisfied} satisfied · ${counts.unknown} unknown · ${counts.unsatisfied} unsatisfied · ${counts.not_applicable} not applicable${reconciliation.completeness.status === "complete" ? "" : ` · ${humanize(reconciliation.completeness.status)} read`}`,
    tone: counts.unsatisfied > 0
      ? "critical"
      : counts.unknown > 0
        ? "attention"
        : "neutral",
  };
}

function relationDisclosureSummaryV01(
  reconciliation: ProjectVerifyReconciliationV01,
): DisclosureSummaryV01 {
  const opposing =
    reconciliation.pending_relation_material.opposes.length +
    reconciliation.applied_relation_material.opposes.length;
  const contradictory =
    reconciliation.pending_relation_material.contradicts.length +
    reconciliation.applied_relation_material.contradicts.length;
  const unresolved = opposing + contradictory;
  return {
    text: `${reconciliation.evidence.length} Evidence records · ${reconciliation.claim_families.length} Claim families · ${unresolved} opposing or contradictory relations${reconciliation.summary.insufficient_material_present ? " · Insufficient material present" : ""}${reconciliation.completeness.status === "complete" ? "" : ` · ${humanize(reconciliation.completeness.status)} read`}`,
    tone: contradictory > 0
      ? "critical"
      : unresolved > 0 || reconciliation.summary.insufficient_material_present
        ? "attention"
        : "neutral",
  };
}

function conflictDisclosureSummaryV01(
  reconciliation: ProjectVerifyReconciliationV01,
  lineage?: ProjectVerifyLineageV01,
): DisclosureSummaryV01 {
  const conflictCount = reconciliation.conflicts.length;
  if (conflictCount > 0) {
    return {
      text: `${conflictCount} project ${conflictCount === 1 ? "conflict" : "conflicts"} returned · exact review remains unresolved${reconciliation.completeness.status === "complete" ? "" : ` · ${humanize(reconciliation.completeness.status)} read`}`,
      tone: "critical",
    };
  }
  if (reconciliation.completeness.status !== "complete") {
    return {
      text: `0 project conflicts returned · ${humanize(reconciliation.completeness.status)} read`,
      tone: "attention",
    };
  }
  if (!lineage) {
    return {
      text: "0 project conflicts · selected lineage unavailable",
      tone: "attention",
    };
  }
  if (lineage.stop.reason !== "chain_complete") {
    return {
      text: `0 project conflicts · lineage stopped: ${humanize(lineage.stop.reason)}`,
      tone: "attention",
    };
  }
  return {
    text: "0 project conflicts · selected lineage chain complete",
    tone: "neutral",
  };
}

function laterContextDisclosureSummaryV01(
  reconciliation: ProjectVerifyReconciliationV01,
): DisclosureSummaryV01 {
  const transitionRefs = new Set<string>();
  const conflictRefs = new Set<string>();
  const revisions = [
    ...reconciliation.claim_families.flatMap((family) => family.revisions),
    ...reconciliation.relation_families.flatMap((family) => family.revisions),
  ];
  revisions.forEach(({ lifecycle }) => {
    const ref = lifecycle.transition.transition_receipt_ref;
    if (!ref) return;
    const key = `${ref.record_id}:${ref.record_fingerprint}`;
    if (lifecycle.transition.status === "applied") transitionRefs.add(key);
    if (lifecycle.transition.status === "source_conflict") conflictRefs.add(key);
  });
  reconciliation.later_context.forEach((entry) => {
    const ref = entry.source_transition_receipt_ref;
    const key = `${ref.record_id}:${ref.record_fingerprint}`;
    if (entry.status === "conflict") conflictRefs.add(key);
    else transitionRefs.add(key);
  });

  const transitionCount = transitionRefs.size;
  if (transitionCount === 0) {
    if (conflictRefs.size > 0) {
      return {
        text: `Project reconciliation · applied Transition not confirmed · ${conflictRefs.size} transition ${conflictRefs.size === 1 ? "conflict" : "conflicts"} · later context unavailable`,
        tone: "critical",
      };
    }
    return {
      text: `Project reconciliation · ${reconciliation.completeness.status === "complete" ? "no applied Transition returned" : "no applied Transition in returned read"} · later packet unavailable · feedback unavailable`,
      tone: "attention",
    };
  }

  const packetCount = reconciliation.later_context.filter(
    (entry) => entry.status !== "conflict" && entry.later_packet_ref !== null,
  ).length;
  const feedbackCount = reconciliation.later_context.filter(
    (entry) => entry.status !== "conflict" && entry.context_use_review_ref !== null,
  ).length;
  const pendingPacketCount = Math.max(transitionCount - packetCount, 0);
  const pendingFeedbackCount = Math.max(transitionCount - feedbackCount, 0);
  transitionRefs.forEach((key) => { conflictRefs.delete(key); });
  const conflictCount = conflictRefs.size;

  return {
    text: `Project reconciliation · ${transitionCount} applied ${transitionCount === 1 ? "Transition" : "Transitions"} · ${packetCount} later ${packetCount === 1 ? "packet" : "packets"} recorded · ${pendingPacketCount} pending · ${feedbackCount} feedback recorded · ${pendingFeedbackCount} pending${conflictCount > 0 ? ` · ${conflictCount} conflict${conflictCount === 1 ? "" : "s"}` : ""}${reconciliation.completeness.status === "complete" ? "" : ` · ${humanize(reconciliation.completeness.status)} read`}`,
    tone: conflictCount > 0
      ? "critical"
      : pendingPacketCount > 0 || pendingFeedbackCount > 0
        ? "attention"
        : "neutral",
  };
}
