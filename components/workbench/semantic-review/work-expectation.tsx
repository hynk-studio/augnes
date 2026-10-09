"use client";

import { useProjectClientFetch } from "./project-client-scope";
import { useWorkDraftState, type WorkComposerDraft } from "./work-composer-draft";
import { workExpectationBindingKey } from "./work-expectation-draft";

import type { ProjectSelectionRevision } from "@/lib/vnext/project-selection";

import { useEffect, useRef, useState } from "react";
import type { ProjectWorkInitializationV01 } from "@/types/vnext/project-work-initialization";
import type { WorkExpectation, WorkExpectationComparison } from "@/types/vnext/work-expectation";
import type { readWorkExpectationPreparation } from "@/lib/vnext/runtime/work-expectation";
import styles from "./semantic-review.module.css";

const ROUTE = "/api/vnext/operator/work-expectations";
type Preparation = ReturnType<typeof readWorkExpectationPreparation>;
const EXPOSURE = "Visible to the operator. Augnes does not automatically deliver this expectation to the worker. Human attention, external knowledge and copying are unknown; this workflow is not blinded.";

export function WorkExpectationPreparation({ initialization, draft, onAccessRefused, onRefreshCurrentWork }: {
  initialization: ProjectWorkInitializationV01; draft?: WorkComposerDraft;
  onAccessRefused?: (errorCode: string) => void; onRefreshCurrentWork?: () => Promise<void>;
}) {
  const fetch = useProjectClientFetch();
  const [opened, setOpened] = useWorkDraftState(draft, "expectationOpened", false);
  const [started, setStarted] = useWorkDraftState(draft, "expectationStarted", () => Boolean(opened ||
    draft?.get("expectationReason") || draft?.get("expectationConditions")));
  const [boundWork, setBoundWork] = useWorkDraftState(draft, "expectationBoundWork", initialization);
  const [reviewRequired, setReviewRequired] = useWorkDraftState(draft, "expectationReviewRequired", false);
  const [material, setMaterial] = useState<Preparation | null>(null);
  const [criterion, setCriterion] = useWorkDraftState(draft, "expectationCriterion", initialization.current_work?.success_criteria[0] ?? "");
  const [prediction, setPrediction] = useWorkDraftState(draft, "expectationPrediction", "satisfied");
  const [reason, setReason] = useWorkDraftState(draft, "expectationReason", "");
  const [conditions, setConditions] = useWorkDraftState(draft, "expectationConditions", "");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const saving = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const needsReview = started && (reviewRequired || workExpectationBindingKey(boundWork) !== workExpectationBindingKey(initialization));
  const materialCurrent = material?.eligibility.current_packet_id === initialization.current_packet?.packet_id &&
    material?.eligibility.current_packet_fingerprint === initialization.current_packet?.packet_fingerprint &&
    material?.eligibility.project_work_binding === initialization.project_work_binding;
  const canRecord = Boolean(started && materialCurrent && material?.authoring_available && material.capacity_available && !needsReview &&
    material.criteria.some(c => c.criterion === criterion));
  useEffect(() => {
    if (!opened) return;
    setMaterial(null);
    const controller = new AbortController();
    void fetch(ROUTE, { cache: "no-store", credentials: "same-origin", signal: controller.signal }).then(async response => {
      const body = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || body.eligibility.current_packet_id !== initialization.current_packet?.packet_id ||
        body.eligibility.current_packet_fingerprint !== initialization.current_packet?.packet_fingerprint ||
        body.eligibility.project_work_binding !== initialization.project_work_binding) {
        setReviewRequired(true);
        setMessage("Your expectation draft is retained. Refresh and review current work before recording.");
        if (response.status === 401 || response.status === 403) onAccessRefused?.(body.error_code ?? "operator_session_required");
        return;
      }
      setMaterial(body);
    }).catch(() => { if (!controller.signal.aborted) setMessage("Expectation material could not be loaded."); });
    return () => controller.abort();
  }, [opened, initialization.current_packet?.packet_id, initialization.current_packet?.packet_fingerprint, initialization.project_work_binding, refreshVersion, fetch]);
  const latest = material?.history.at(-1);
  return <details className={styles.panel} style={{ overflowWrap: "anywhere" }} open={opened} onToggle={e => {
    const nextOpened = e.currentTarget.open;
    // Mounting a closed optional panel is not an edit. First opening chooses
    // today's work; every later opening retains the actual editor's binding.
    if (nextOpened && !started) {
      setBoundWork(initialization); setCriterion(initialization.current_work?.success_criteria[0] ?? "");
      setReviewRequired(false); setStarted(true);
    }
    setOpened(nextOpened);
  }} data-work-expectation="preparation">
    <summary>Expectation for this attempt (optional)</summary>
    <p className={styles.copy}>Keep what the task must achieve separate from what you predict. This record applies only to the first upcoming interactive attempt of this exact work version.</p>
    {latest ? <ExpectationHistory records={material!.history} /> : null}
    {needsReview || (message && !material) ? <div role="alert" data-expectation-draft-conflict>
      <p>Your expectation draft remains associated with its original work. Refresh and review the current task, requirements and saved expectation history before using this text for the current version.</p>
      <p>Original task: {boundWork.current_work?.goal}</p><p>Current task: {initialization.current_work?.goal}</p>
      <ul>{initialization.current_work?.success_criteria.map(c => <li key={c}>{c}</li>)}</ul>
      <button type="button" disabled={busy} data-expectation-action="refresh" onClick={async () => {
        setBusy(true); setMaterial(null);
        try { await onRefreshCurrentWork?.(); setRefreshVersion(v => v + 1); }
        catch { setMessage("Current work could not be refreshed. Your draft is retained."); }
        finally { setBusy(false); }
      }}>Refresh current work and expectation history</button>
      {materialCurrent && material?.authoring_available && material.capacity_available ? <button type="button" disabled={busy} data-expectation-action="review" onClick={() => {
        setBoundWork(initialization); setReviewRequired(false); setMessage("Current work reviewed. Check the retained requirement, prediction and conditions before recording.");
      }}>Use this draft for the reviewed work version</button> : null}
    </div> : null}
    {(material?.authoring_available && material.capacity_available) || reason || conditions || needsReview ? <form className={styles.form} onSubmit={async event => {
      event.preventDefault(); if (saving.current || !boundWork.current_packet || !canRecord || !material) return;
      saving.current = true; setBusy(true); setMessage("");
      try {
        const response = await fetch(ROUTE, { method: "POST", cache: "no-store", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({
          action: "record_work_expectation", expected_active_project_id: boundWork.project_id,
          expected_active_selection_revision: boundWork.active_selection_revision,
          expected_project_work_binding: boundWork.project_work_binding,
          expected_packet_id: boundWork.current_packet.packet_id, expected_packet_fingerprint: boundWork.current_packet.packet_fingerprint,
          expected_previous_id: latest?.record_id ?? null, criterion_id: material.criteria.find(c => c.criterion === criterion)?.criterion_id, predicted_outcome: prediction, reason, conditions,
        }) });
        const body = await response.json();
        if (!mounted.current) return;
        if (!response.ok) {
          setReviewRequired(true); setMaterial(null);
          setMessage("The work, session or start boundary changed. Your draft is retained. Refresh and review before recording.");
          if (response.status === 401 || response.status === 403) onAccessRefused?.(body.error_code ?? "operator_session_required");
          return;
        }
        setMaterial({ ...material, history: [...material.history, body.record] });
        setReason(""); setConditions(""); setMessage("Expectation saved before Start. Earlier versions are preserved.");
      } catch { if (mounted.current) { setReviewRequired(true); setMaterial(null); setMessage("Save could not be confirmed. Your draft is retained. Refresh to inspect recorded history before retrying."); } }
      finally { saving.current = false; if (mounted.current) setBusy(false); }
    }}>
      <label htmlFor="expectation-criterion">Task requirement</label>
      <select id="expectation-criterion" value={criterion} onChange={e => setCriterion(e.target.value)}>
        {!initialization.current_work?.success_criteria.includes(criterion) && criterion ? <option value={criterion}>Previous requirement: {criterion}</option> : null}
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
      <button className={styles.secondaryButton} disabled={busy || !canRecord || !reason.trim() || !conditions.trim()} data-expectation-action="save">
        {busy ? "Saving…" : latest ? "Record a new expectation version" : "Record expectation"}
      </button>
    </form> : material ? <p>{!material.capacity_available
      ? "Optional expectation history is full for this work or project. Eligible work can still start without a new expectation."
      : "Prospective recording is unavailable after execution admission or for an unsupported work version."}</p> : null}
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

export function WorkExpectationResult({ comparison, receiptId, receiptFingerprint, selectionRevision, projectWorkBinding, onSaved, draft, onAccessRefused }: {
  comparison: WorkExpectationComparison; receiptId: string; receiptFingerprint: string;
  draft?: WorkComposerDraft; onAccessRefused?: (errorCode: string) => void;
  projectWorkBinding?: string | null;
  selectionRevision: ProjectSelectionRevision | null; onSaved?: () => Promise<void | boolean>;
}) {
  const fetch = useProjectClientFetch();
  const [outcome, setOutcome] = useWorkDraftState(draft, "reportOutcome", "unknown");
  const [observation, setObservation] = useWorkDraftState(draft, "reportObservation", "");
  const [applied, setApplied] = useWorkDraftState(draft, "reportApplied", false);
  const [opened, setOpened] = useWorkDraftState(draft, "reportOpened", false);
  const [needsRefresh, setNeedsRefresh] = useWorkDraftState(draft, "reportNeedsRefresh", false);
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const saving = useRef(false);
  if (!visible) return <p role="status">Authenticate the original project and operator to recover this result report draft.</p>;
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
    {needsRefresh ? <div role="alert" data-expectation-report-conflict>
      <p>Your observation is retained for this result. Refresh and review the latest report history before recording a correction. Refresh does not save anything.</p>
      <button type="button" disabled={busy} data-expectation-action="refresh-report" onClick={async () => {
        if (saving.current) return; saving.current = true; setBusy(true);
        try {
          if (await onSaved?.() !== true) { setMessage("The result could not be refreshed. Your draft is retained and reporting remains disabled."); return; }
          setNeedsRefresh(false); setMessage("Current result and report history loaded. Review them and your retained observation before recording.");
        } catch { setMessage("The result could not be refreshed. Your draft is retained and reporting remains disabled."); }
        finally { saving.current = false; setBusy(false); }
      }}>Refresh result and report history</button>
    </div> : null}
    {comparison.report_allowed && (projectWorkBinding || selectionRevision !== null) ? <details data-expectation-report-editor open={opened} onToggle={e => setOpened(e.currentTarget.open)}><summary>Report a criterion observation (optional)</summary>
      <form className={styles.form} onSubmit={async event => {
        event.preventDefault(); if (saving.current || needsRefresh) return; saving.current = true; setBusy(true); setMessage("");
        try {
          const response = await fetch(ROUTE, { method: "POST", cache: "no-store", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({
            action: "report_work_expectation_outcome", expected_active_project_id: comparison.expectation.project_id,
            expected_active_selection_revision: selectionRevision, expected_project_work_binding: projectWorkBinding, expected_previous_id: comparison.reports.at(-1)?.record_id ?? null,
            expectation_id: comparison.expectation.record_id, receipt_id: receiptId, receipt_fingerprint: receiptFingerprint,
            outcome: comparison.outcome_source === "criterion_assessment" ? comparison.actual_outcome : outcome, observation, applicability: applied ? "applied" : "not_established",
          }) });
          if (response.status === 401 || response.status === 403) {
            // Hide on known refusal even when a proxy returns a non-JSON body.
            // The mounted loader retains this receipt/principal's draft only.
            setVisible(false); onAccessRefused?.("operator_session_required"); return;
          }
          if (!response.ok) { setNeedsRefresh(true); setMessage("The exact result, project binding or report version changed. Your observation is retained; refresh this result before reporting."); return; }
          if (await onSaved?.() === false) { setNeedsRefresh(true); setMessage("The report was saved, but its current history could not be read. Your draft is retained; refresh before another report."); return; }
          setObservation(""); setMessage("Source-linked operator report saved. Earlier reports are preserved.");
        } catch { setNeedsRefresh(true); setMessage("Report could not be confirmed. Your observation is retained; refresh to inspect saved history before retrying."); }
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
        <button className={styles.secondaryButton} disabled={busy || needsRefresh || !observation.trim()} data-expectation-action="report">{busy ? "Saving…" : comparison.reports.length ? "Record a corrected report" : "Record operator observation"}</button>
      </form>
    </details> : null}
    {message ? <p role="status">{message}</p> : null}
  </section>;
}
