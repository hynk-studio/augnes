"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectWorkInitializationV01 } from "@/types/vnext/project-work-initialization";
import type { WorkExpectation, WorkExpectationComparison } from "@/types/vnext/work-expectation";
import type { readWorkExpectationPreparation } from "@/lib/vnext/runtime/work-expectation";
import styles from "./semantic-review.module.css";

const ROUTE = "/api/vnext/operator/work-expectations";
type Preparation = ReturnType<typeof readWorkExpectationPreparation>;
const EXPOSURE = "Visible to the operator. Augnes does not automatically deliver this expectation to the worker. Human attention, external knowledge and copying are unknown; this workflow is not blinded.";

export function WorkExpectationPreparation({ initialization }: { initialization: ProjectWorkInitializationV01 }) {
  const [opened, setOpened] = useState(false);
  const [material, setMaterial] = useState<Preparation | null>(null);
  const [criterion, setCriterion] = useState(initialization.current_work?.success_criteria[0] ?? "");
  const [prediction, setPrediction] = useState("satisfied");
  const [reason, setReason] = useState("");
  const [conditions, setConditions] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const saving = useRef(false);
  useEffect(() => {
    if (!opened) return;
    const controller = new AbortController();
    void fetch(ROUTE, { cache: "no-store", credentials: "same-origin", signal: controller.signal }).then(async response => {
      const body = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || body.eligibility.current_packet_id !== initialization.current_packet?.packet_id ||
        body.eligibility.current_packet_fingerprint !== initialization.current_packet?.packet_fingerprint ||
        body.eligibility.active_selection_revision !== initialization.active_selection_revision) {
        setMessage("Expectation material is unavailable for this selection. Reload the work before recording."); return;
      }
      setMaterial(body);
    }).catch(() => { if (!controller.signal.aborted) setMessage("Expectation material could not be loaded."); });
    return () => controller.abort();
  }, [opened, initialization.current_packet?.packet_id, initialization.current_packet?.packet_fingerprint, initialization.active_selection_revision]);
  const latest = material?.history.at(-1);
  return <details className={styles.panel} style={{ overflowWrap: "anywhere" }} onToggle={e => setOpened(e.currentTarget.open)} data-work-expectation="preparation">
    <summary>Expectation for this attempt (optional)</summary>
    <p className={styles.copy}>Keep what the task must achieve separate from what you predict. This record applies only to the first upcoming interactive attempt of this exact work version.</p>
    {latest ? <ExpectationHistory records={material!.history} /> : null}
    {material?.eligibility.eligible ? <form className={styles.form} onSubmit={async event => {
      event.preventDefault(); if (saving.current || !initialization.current_packet) return;
      saving.current = true; setBusy(true); setMessage("");
      try {
        const response = await fetch(ROUTE, { method: "POST", cache: "no-store", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({
          action: "record_work_expectation", expected_active_project_id: initialization.project_id,
          expected_active_selection_revision: initialization.active_selection_revision,
          expected_packet_id: initialization.current_packet.packet_id, expected_packet_fingerprint: initialization.current_packet.packet_fingerprint,
          expected_previous_id: latest?.record_id ?? null, criterion_id: material.criteria.find(c => c.criterion === criterion)?.criterion_id, predicted_outcome: prediction, reason, conditions,
        }) });
        const body = await response.json();
        if (!response.ok) { setMessage("The work, session or start boundary changed. Reload before recording a new version."); return; }
        setMaterial({ ...material, history: [...material.history, body.record] });
        setReason(""); setConditions(""); setMessage("Expectation saved before Start. Earlier versions are preserved.");
      } catch { setMessage("Save could not be confirmed. Reload to inspect the recorded history."); }
      finally { saving.current = false; setBusy(false); }
    }}>
      <label htmlFor="expectation-criterion">Task requirement</label>
      <select id="expectation-criterion" value={criterion} onChange={e => setCriterion(e.target.value)}>
        {initialization.current_work?.success_criteria.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <label htmlFor="expectation-prediction">I predict this requirement will be</label>
      <select id="expectation-prediction" value={prediction} onChange={e => setPrediction(e.target.value)}>
        <option value="satisfied">Satisfied</option><option value="unsatisfied">Unsatisfied</option>
      </select>
      <label htmlFor="expectation-reason">Short reason</label>
      <textarea id="expectation-reason" required maxLength={600} value={reason} onChange={e => setReason(e.target.value)} />
      <label htmlFor="expectation-conditions">Conditions under which this prediction applies</label>
      <textarea id="expectation-conditions" required maxLength={600} value={conditions} onChange={e => setConditions(e.target.value)} />
      <p className={styles.muted}>The comparison rule is fixed now: use supported exact criterion evidence, otherwise a source-linked operator report. A conclusive comparison also needs your observation that these conditions held. Missing or conflicting evidence remains unknown; a run that does not complete remains unobserved.</p>
      <button className={styles.secondaryButton} disabled={busy || !reason.trim() || !conditions.trim()} data-expectation-action="save">
        {busy ? "Saving…" : latest ? "Record a new expectation version" : "Record expectation"}
      </button>
    </form> : material ? <p>Prospective recording is unavailable after execution admission or for an unsupported work version.</p> : null}
    <p className={styles.muted}>{EXPOSURE}</p>
    {message ? <p role="status">{message}</p> : null}
  </details>;
}

export function ExpectationHistory({ records }: { records: WorkExpectation[] }) {
  return <div data-expectation-history={records.length}>{records.map(record => <details key={record.record_id} open={record === records.at(-1)}>
    <summary>Recorded expectation · version {record.revision} · {record.recorded_at}</summary>
    <p>Requirement: {record.criterion}</p><p>Prediction: {record.predicted_outcome}</p>
    <p>Reason: {record.reason}</p><p>Applicability: {record.conditions}</p>
    <p className={styles.muted}>Operator authored by {record.author.operator_id}. Information cutoff: {record.information_cutoff}. Packet snapshot currentness only; external source currentness and the author’s external knowledge are unknown.</p>
    <details><summary>Exact recorded version and rule</summary><p>{record.packet_ref.external_id}</p><p>{record.packet_ref.source_ref}</p><p>{record.outcome_rule}</p></details>
  </details>)}</div>;
}

export function WorkExpectationResult({ comparison, receiptId, receiptFingerprint, selectionRevision, onSaved }: {
  comparison: WorkExpectationComparison; receiptId: string; receiptFingerprint: string;
  selectionRevision: number | null; onSaved?: () => Promise<void>;
}) {
  const [outcome, setOutcome] = useState("unknown");
  const [observation, setObservation] = useState("");
  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const saving = useRef(false);
  return <section className={styles.panel} style={{ overflowWrap: "anywhere" }} data-expectation-comparison={comparison.comparison} data-expectation-eligibility={comparison.eligibility}>
    <h2>Expectation and result</h2>
    <p>Task requirement: {comparison.expectation.criterion}</p>
    <p>Original prediction: {comparison.expectation.predicted_outcome}</p>
    <p>Actual criterion outcome: {comparison.actual_outcome} · basis: {comparison.basis}</p>
    <p>Run disposition: {comparison.run_disposition} · comparison: {comparison.comparison}</p>
    <ul>{comparison.uncertainty.map(item => <li key={item}>{item}</li>)}</ul>
    <a href={comparison.packet_href} data-expectation-source="packet">Open exact work and source snapshot</a>
    <ExpectationHistory records={comparison.history} />
    <p className={styles.muted}>{EXPOSURE}</p>
    {comparison.reports.length ? <details><summary>Operator outcome reports and corrections ({comparison.reports.length})</summary>
      {comparison.reports.map(report => <div key={report.record_id}><p>Version {report.revision} · {report.recorded_at} · {report.author.operator_id} · operator-attested {report.outcome}</p>
        <p>{report.observation}</p><p>Applicability: {report.applicability}</p></div>)}
    </details> : null}
    {comparison.report_allowed && selectionRevision !== null ? <details><summary>Report a criterion observation (optional)</summary>
      <form className={styles.form} onSubmit={async event => {
        event.preventDefault(); if (saving.current) return; saving.current = true; setBusy(true); setMessage("");
        try {
          const response = await fetch(ROUTE, { method: "POST", cache: "no-store", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({
            action: "report_work_expectation_outcome", expected_active_project_id: comparison.expectation.project_id,
            expected_active_selection_revision: selectionRevision, expected_previous_id: comparison.reports.at(-1)?.record_id ?? null,
            expectation_id: comparison.expectation.record_id, receipt_id: receiptId, receipt_fingerprint: receiptFingerprint,
            outcome: comparison.outcome_source === "criterion_assessment" ? comparison.actual_outcome : outcome, observation, applicability: applied ? "applied" : "not_established",
          }) });
          if (!response.ok) { setMessage("The exact result, selection or report version changed. Reload before reporting."); return; }
          await onSaved?.(); setObservation(""); setMessage("Source-linked operator report saved. Earlier reports are preserved.");
        } catch { setMessage("Report could not be confirmed. Reload to inspect the saved history."); }
        finally { saving.current = false; setBusy(false); }
      }}>
        {comparison.outcome_source === "criterion_assessment" ? <p>The supported criterion assessment owns the outcome. This report only confirms whether your recorded conditions applied.</p> : null}
        <p>This is your observation of the exact result linked above. It does not change the forecast, receipt, criterion assessment or task success.</p>
        <label htmlFor="expectation-outcome">Observed criterion outcome</label>
        <select id="expectation-outcome" disabled={comparison.outcome_source === "criterion_assessment"} value={comparison.outcome_source === "criterion_assessment" ? comparison.actual_outcome : outcome} onChange={e => setOutcome(e.target.value)}>
          <option value="unknown">Unknown</option><option value="satisfied">Satisfied</option><option value="unsatisfied">Unsatisfied</option><option value="not_applicable">Not applicable</option>
        </select>
        <label htmlFor="expectation-observation">What in this result supports your observation?</label>
        <textarea id="expectation-observation" required maxLength={600} value={observation} onChange={e => setObservation(e.target.value)} />
        <label><input type="checkbox" style={{ width: "auto" }} checked={applied} onChange={e => setApplied(e.target.checked)} id="expectation-applicability" />I observed that the recorded applicability conditions held for this attempt.</label>
        <button className={styles.secondaryButton} disabled={busy || !observation.trim()} data-expectation-action="report">{busy ? "Saving…" : comparison.reports.length ? "Record a corrected report" : "Record operator observation"}</button>
      </form>
    </details> : null}
    {message ? <p role="status">{message}</p> : null}
  </section>;
}
