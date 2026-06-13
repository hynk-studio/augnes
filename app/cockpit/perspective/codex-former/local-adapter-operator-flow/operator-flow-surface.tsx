"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./operator-flow-surface.module.css";
import {
  CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_VALIDATE_ROUTE,
  clearOperatorFlowDraftFromStorage,
  createInitialOperatorFlowDraft,
  loadOperatorFlowDraftFromStorage,
  operatorFlowCandidateActions,
  operatorFlowReturnedEnvelopeFixtureKeys,
  previewOperatorFlowValidationResult,
  saveOperatorFlowDraftToStorage,
  type OperatorFlowCandidateAction,
  type OperatorFlowLocalValidationResponse,
  type OperatorFlowPersistedDraft,
  type OperatorFlowReturnedEnvelopeFixtureKey,
  type OperatorFlowValidationPreview,
  type OperatorFlowViewModel,
} from "@/lib/perspective-ingest/codex-former-local-adapter-operator-flow";

type ValidationPreviewState = {
  scenario_key: OperatorFlowReturnedEnvelopeFixtureKey;
  validation_result: OperatorFlowValidationPreview;
} | null;

type LocalValidationRunState = OperatorFlowLocalValidationResponse | null;

const initialIso = "1970-01-01T00:00:00.000Z";

export function CodexFormerLocalAdapterOperatorFlowSurface({
  viewModel,
}: {
  viewModel: OperatorFlowViewModel;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<OperatorFlowPersistedDraft>(() =>
    createInitialOperatorFlowDraft(viewModel, initialIso),
  );
  const [returnedEnvelopeText, setReturnedEnvelopeText] = useState("");
  const [validationPreview, setValidationPreview] =
    useState<ValidationPreviewState>(null);
  const [localValidationRun, setLocalValidationRun] =
    useState<LocalValidationRunState>(null);
  const [validationBusy, setValidationBusy] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState("local metadata not saved");
  const skipNextAutoSave = useRef(false);

  useEffect(() => {
    const loadedDraft = loadOperatorFlowDraftFromStorage(
      window.localStorage,
      viewModel,
      new Date().toISOString(),
    );
    setDraft(loadedDraft);
    setReturnedEnvelopeText(
      loadedDraft.returned_envelope_draft_saved_explicitly
        ? loadedDraft.returned_envelope_text ?? ""
        : "",
    );
    setHydrated(true);
    setDraftStatus(
      loadedDraft.returned_envelope_draft_saved_explicitly
        ? "saved local draft restored"
        : "bounded local metadata restored",
    );
  }, [viewModel]);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }
    saveOperatorFlowDraftToStorage(window.localStorage, viewModel, draft);
  }, [draft, hydrated, viewModel]);

  const displayScenarioKey =
    validationPreview?.scenario_key ??
    draft.selected_returned_envelope_fixture_key ??
    viewModel.default_fixture_key;
  const displayScenario = viewModel.scenarios[displayScenarioKey];
  const currentValidation =
    localValidationRun?.validation_result ??
    validationPreview?.validation_result ??
    displayScenario.validation_result;

  const activeFixtureLabel = draft.selected_returned_envelope_fixture_key
    ? viewModel.scenarios[draft.selected_returned_envelope_fixture_key].label
    : "none";

  const persistedFields = useMemo(
    () => [
      "draft_id",
      "generated_at / updated_at",
      "selected_source_input_ref",
      "selected_prepare_summary_ref",
      "active_step",
      "selected_returned_envelope_fixture_key",
      "returned_envelope_draft_saved_explicitly",
      "returned_envelope_text only after Save draft locally",
      "validation_result_state",
      "validation_result_source",
      "candidate_action_choice",
      "supersede_previous_candidate_ref",
    ],
    [],
  );

  function updateDraft(
    patch:
      | Partial<OperatorFlowPersistedDraft>
      | ((current: OperatorFlowPersistedDraft) => Partial<OperatorFlowPersistedDraft>),
  ) {
    setDraft((current) => {
      const resolvedPatch =
        typeof patch === "function" ? patch(current) : patch;
      return {
        ...current,
        ...resolvedPatch,
        updated_at: new Date().toISOString(),
      };
    });
  }

  function loadEnvelopeFixture(key: OperatorFlowReturnedEnvelopeFixtureKey) {
    const scenario = viewModel.scenarios[key];
    setReturnedEnvelopeText(scenario.returned_envelope_fixture.text);
    setValidationPreview(null);
    setLocalValidationRun(null);
    setValidationError(null);
    updateDraft({
      selected_source_input_ref: scenario.source_input_ref.path,
      selected_prepare_summary_ref: scenario.prepare_summary_ref.path,
      selected_returned_envelope_fixture_key: key,
      returned_envelope_draft_saved_explicitly: false,
      returned_envelope_text: undefined,
      active_step: "returned_envelope",
      validation_result_state: "not_validated",
      validation_result_source: "not_run",
    });
    setDraftStatus(`${scenario.label} fixture loaded; envelope text not saved`);
  }

  function clearReturnedEnvelopeDraft() {
    setReturnedEnvelopeText("");
    setValidationPreview(null);
    setLocalValidationRun(null);
    setValidationError(null);
    updateDraft({
      selected_returned_envelope_fixture_key: null,
      returned_envelope_draft_saved_explicitly: false,
      returned_envelope_text: undefined,
      active_step: "returned_envelope",
      validation_result_state: "not_validated",
      validation_result_source: "not_run",
    });
    setDraftStatus("returned envelope draft cleared");
  }

  function saveDraftLocally() {
    const nextDraft: OperatorFlowPersistedDraft = {
      ...draft,
      returned_envelope_text: returnedEnvelopeText,
      returned_envelope_draft_saved_explicitly: true,
      active_step: "returned_envelope",
      updated_at: new Date().toISOString(),
    };
    setDraft(nextDraft);
    saveOperatorFlowDraftToStorage(window.localStorage, viewModel, nextDraft);
    setDraftStatus("saved draft locally; local draft only");
  }

  function clearLocalDraft() {
    clearOperatorFlowDraftFromStorage(window.localStorage, viewModel);
    skipNextAutoSave.current = true;
    const nextDraft = createInitialOperatorFlowDraft(
      viewModel,
      new Date().toISOString(),
    );
    setDraft(nextDraft);
    setReturnedEnvelopeText("");
    setValidationPreview(null);
    setLocalValidationRun(null);
    setValidationError(null);
    setDraftStatus("local draft cleared");
  }

  function previewValidationResult() {
    const preview = previewOperatorFlowValidationResult(
      returnedEnvelopeText,
      viewModel,
      draft.selected_returned_envelope_fixture_key,
    );
    setValidationPreview(preview);
    const scenario = viewModel.scenarios[preview.scenario_key];
    updateDraft({
      selected_source_input_ref: scenario.source_input_ref.path,
      selected_prepare_summary_ref: scenario.prepare_summary_ref.path,
      active_step: "validate_result",
      validation_result_state: preview.validation_result.result_state,
      validation_result_source: preview.validation_result.validation_source,
    });
    setDraftStatus("validation preview updated; no product state created");
  }

  async function runLocalValidation() {
    setValidationBusy(true);
    setValidationError(null);
    setDraftStatus("running local validation execution");
    try {
      const response = await fetch(
        CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_VALIDATE_ROUTE,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            selected_returned_envelope_fixture_key:
              draft.selected_returned_envelope_fixture_key,
            source_input_ref: draft.selected_source_input_ref,
            prepare_summary_ref: draft.selected_prepare_summary_ref,
            returned_envelope_text: returnedEnvelopeText,
          }),
        },
      );
      const result = (await response.json()) as OperatorFlowLocalValidationResponse;
      setLocalValidationRun(result);
      setValidationPreview(null);
      updateDraft({
        active_step: "validate_result",
        validation_result_state: result.validation_result.result_state,
        validation_result_source: result.validation_source,
      });
      setDraftStatus(
        `${result.validation_source} completed; no product state created`,
      );
    } catch (error) {
      setValidationError(
        error instanceof Error
          ? error.message
          : "Local validation request failed",
      );
      setDraftStatus("local validation bridge request failed");
    } finally {
      setValidationBusy(false);
    }
  }

  function selectCandidateAction(action: OperatorFlowCandidateAction) {
    updateDraft({
      active_step: "candidate_action",
      candidate_action_choice: action,
    });
    setDraftStatus(`${action} selected as local draft only`);
  }

  function onReturnedEnvelopeChange(value: string) {
    setReturnedEnvelopeText(value);
    setValidationPreview(null);
    setLocalValidationRun(null);
    setValidationError(null);
    updateDraft({
      selected_returned_envelope_fixture_key: null,
      returned_envelope_draft_saved_explicitly: false,
      returned_envelope_text: undefined,
      active_step: "returned_envelope",
      validation_result_state: "not_validated",
      validation_result_source: "not_run",
    });
    setDraftStatus("edited draft is not saved");
  }

  return (
    <main
      className={styles.shell}
      data-augnes-surface="codex-former-local-adapter-operator-flow"
      data-augnes-operator-flow="local-draft-only"
    >
      <section className={styles.surface}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>Codex Former Local Adapter</p>
            <h1>Local Codex Adapter Operator Flow</h1>
            <p>
              Local-only manual operator shell for preparing a bounded Codex
              packet, pasting one returned envelope, previewing validation, and
              choosing a local draft action.
            </p>
          </div>
          <div className={styles.boundaryPills} aria-label="Operator boundary">
            <span>local draft only</span>
            <span>not accepted state</span>
            <span>not review decision</span>
            <span>not product DB persistence</span>
            <span>not Core decision</span>
            <span>not runtime handoff</span>
          </div>
        </header>

        {!viewModel.validation.valid ? (
          <section className={styles.alert} aria-label="Operator contract check">
            <h2>Operator Contract Check</h2>
            <ul>
              {viewModel.validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={styles.statusStrip} aria-label="Draft status">
          <div>
            <span>active_step</span>
            <strong>{draft.active_step}</strong>
          </div>
          <div>
            <span>fixture</span>
            <strong>{activeFixtureLabel}</strong>
          </div>
          <div>
            <span>validation_result_state</span>
            <strong>{draft.validation_result_state}</strong>
          </div>
          <div>
            <span>validation_result_source</span>
            <strong>{draft.validation_result_source}</strong>
          </div>
          <div>
            <span>draft status</span>
            <strong>{draftStatus}</strong>
          </div>
        </section>

        <div className={styles.grid}>
          <SourcePreparePanel scenario={displayScenario} />
          <CopyForCodexPanel copyPacketPreview={viewModel.copy_packet_preview} />
          <ExternalCodexWorkPanel />
          <ReturnedEnvelopePanel
            returnedEnvelopeText={returnedEnvelopeText}
            selectedFixtureKey={draft.selected_returned_envelope_fixture_key}
            onChange={onReturnedEnvelopeChange}
            onClearDraft={clearReturnedEnvelopeDraft}
            onClearLocalDraft={clearLocalDraft}
            onLoadFixture={loadEnvelopeFixture}
            onSaveDraftLocally={saveDraftLocally}
          />
          <ValidateResultPanel
            validation={currentValidation}
            validationState={draft.validation_result_state}
            validationSource={draft.validation_result_source}
            validationBusy={validationBusy}
            validationError={validationError}
            onRunLocalValidation={runLocalValidation}
            onPreviewValidation={previewValidationResult}
          />
          <CandidateReviewMaterialPanel
            scenario={displayScenario}
            validation={currentValidation}
          />
          <CandidateActionPanel
            actionChoice={draft.candidate_action_choice}
            supersedePreviousCandidateRef={
              draft.supersede_previous_candidate_ref ?? ""
            }
            onActionSelect={selectCandidateAction}
            onSupersedeRefChange={(value) =>
              updateDraft({
                supersede_previous_candidate_ref: value,
                active_step: "candidate_action",
              })
            }
            canSelectAction={
              currentValidation.validation_source ===
                "real_local_validate_execution" &&
              currentValidation.result_state !== "BLOCKED"
            }
            validationResultState={currentValidation.result_state}
            validationSource={currentValidation.validation_source}
          />
          <LocalStorageBoundaryPanel persistedFields={persistedFields} />
        </div>
      </section>
    </main>
  );
}

function SourcePreparePanel({
  scenario,
}: {
  scenario: OperatorFlowViewModel["scenarios"][OperatorFlowReturnedEnvelopeFixtureKey];
}) {
  return (
    <section className={styles.panel} aria-label="Source and prepare panel">
      <PanelHeader
        eyebrow="1. Current Context"
        title="Source / Prepare"
        detail="prepared_waiting_for_codex_return"
      />
      <dl className={styles.detailGrid}>
        <DetailRow label="source input ref" value={scenario.source_input_ref.path} />
        <DetailRow label="source input hash" value={scenario.source_input_ref.hash} />
        <DetailRow
          label="changed files"
          value={String(scenario.source_input_ref.changed_files_count)}
        />
        <DetailRow
          label="readiness"
          value={scenario.source_input_ref.readiness_status}
        />
        <DetailRow
          label="prepare summary ref"
          value={scenario.prepare_summary_ref.path}
        />
        <DetailRow
          label="prepare summary hash"
          value={scenario.prepare_summary_ref.hash}
        />
        <DetailRow
          label="manual copy packet"
          value={scenario.prepare_summary_ref.manual_copy_packet_ref}
        />
        <DetailRow
          label="former input packet"
          value={scenario.prepare_summary_ref.former_input_packet_ref}
        />
      </dl>
    </section>
  );
}

function CopyForCodexPanel({
  copyPacketPreview,
}: {
  copyPacketPreview: string;
}) {
  return (
    <section className={styles.panel} aria-label="Copy for Codex panel">
      <PanelHeader
        eyebrow="2. Manual Packet"
        title="Copy For Codex"
        detail="bounded prompt preview"
      />
      <textarea
        className={styles.copyArea}
        readOnly
        value={copyPacketPreview}
        aria-label="Bounded copy-for-Codex packet preview"
      />
      <p className={styles.boundaryText}>
        Manual copy only. This route does not use clipboard automation,
        provider/model calls, Codex SDK calls, GitHub mutation, DB writes, or
        runtime handoff.
      </p>
    </section>
  );
}

function ExternalCodexWorkPanel() {
  return (
    <section className={styles.panel} aria-label="External Codex work instructions">
      <PanelHeader
        eyebrow="3. Separate Session"
        title="External Codex Work"
        detail="user-started only"
      />
      <ol className={styles.cleanList}>
        <li>Use the bounded packet in a separate user-started Codex session.</li>
        <li>Return exactly one candidate envelope.</li>
        <li>Leave hidden reasoning, provider logs, tokens, secrets, raw diffs, raw source packets, browser dumps, and raw review payloads out.</li>
        <li>Bring the returned envelope back to this local route for preview validation.</li>
      </ol>
    </section>
  );
}

function ReturnedEnvelopePanel({
  returnedEnvelopeText,
  selectedFixtureKey,
  onChange,
  onClearDraft,
  onClearLocalDraft,
  onLoadFixture,
  onSaveDraftLocally,
}: {
  returnedEnvelopeText: string;
  selectedFixtureKey: OperatorFlowReturnedEnvelopeFixtureKey | null;
  onChange: (value: string) => void;
  onClearDraft: () => void;
  onClearLocalDraft: () => void;
  onLoadFixture: (key: OperatorFlowReturnedEnvelopeFixtureKey) => void;
  onSaveDraftLocally: () => void;
}) {
  return (
    <section className={styles.panel} aria-label="Returned envelope panel">
      <PanelHeader
        eyebrow="4. Return"
        title="Returned Envelope"
        detail="paste or load fixture"
      />
      <div className={styles.buttonRow} aria-label="Returned envelope fixtures">
        {operatorFlowReturnedEnvelopeFixtureKeys.map((key) => (
          <button
            key={key}
            type="button"
            className={classNames(
              styles.button,
              selectedFixtureKey === key ? styles.activeButton : "",
            )}
            data-augnes-load-envelope={key}
            aria-pressed={selectedFixtureKey === key}
            onClick={() => onLoadFixture(key)}
          >
            {fixtureButtonLabel(key)}
          </button>
        ))}
      </div>
      <textarea
        className={styles.envelopeArea}
        value={returnedEnvelopeText}
        aria-label="Returned envelope draft textarea"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.button}
          data-augnes-save-local-draft="true"
          onClick={onSaveDraftLocally}
        >
          Save draft locally
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-clear-returned-envelope="true"
          onClick={onClearDraft}
        >
          Clear returned envelope draft
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-clear-local-draft="true"
          onClick={onClearLocalDraft}
        >
          Clear local draft
        </button>
      </div>
      <p className={styles.boundaryText}>
        Returned envelope text is stored only after Save draft locally. Metadata
        remains bounded to this namespace.
      </p>
    </section>
  );
}

function ValidateResultPanel({
  validation,
  validationState,
  validationSource,
  validationBusy,
  validationError,
  onRunLocalValidation,
  onPreviewValidation,
}: {
  validation: OperatorFlowValidationPreview;
  validationState: string;
  validationSource: string;
  validationBusy: boolean;
  validationError: string | null;
  onRunLocalValidation: () => void;
  onPreviewValidation: () => void;
}) {
  const tone =
    validation.result_state === "PASS"
      ? styles.pass
      : validation.result_state === "PASS with follow-up"
        ? styles.followUp
        : styles.blocked;

  return (
    <section className={styles.panel} aria-label="Validate result panel">
      <PanelHeader
        eyebrow="5. Validate"
        title="Validate Result"
        detail={validation.validation_source}
      />
      <button
        type="button"
        className={styles.primaryButton}
        data-augnes-run-local-validation="true"
        disabled={validationBusy}
        onClick={onRunLocalValidation}
      >
        {validationBusy ? "Running local validation" : "Run local validation"}
      </button>
      <button
        type="button"
        className={styles.button}
        data-augnes-validate-preview="true"
        disabled={validationBusy}
        onClick={onPreviewValidation}
      >
        Preview fixture result
      </button>
      {validationError ? (
        <p className={styles.errorText} data-augnes-validation-error="true">
          {validationError}
        </p>
      ) : null}
      <div
        className={classNames(styles.resultBox, tone)}
        data-augnes-validation-result={validation.result_state}
        data-augnes-validation-source={validation.validation_source}
      >
        <strong>
          {validationState} / {validationSource}
        </strong>
        <dl className={styles.detailGrid}>
          <DetailRow
            label="validation_source"
            value={validation.validation_source}
          />
          <DetailRow label="result_state" value={validation.result_state} />
          <DetailRow
            label="execution_result"
            value={validation.execution_result}
          />
          <DetailRow
            label="failure_kind"
            value={validation.failure_kind ?? "none"}
          />
          <DetailRow
            label="candidate_count"
            value={String(validation.candidate_count)}
          />
          <DetailRow
            label="candidate_compatible_review_material"
            value={String(validation.candidate_compatible_review_material)}
          />
          <DetailRow
            label="worker_facing_guidance_status"
            value={validation.worker_facing_guidance_status}
          />
          <DetailRow
            label="candidate_basis_quality"
            value={validation.candidate_basis_quality ?? "none"}
          />
          <DetailRow
            label="candidate_authority"
            value={validation.candidate_authority ?? "none"}
          />
          <DetailRow
            label="validation_summary_hash"
            value={validation.validation_summary_hash}
          />
          <DetailRow
            label="source_input_hash"
            value={validation.source_input_hash}
          />
          <DetailRow
            label="prepare_execution_summary_hash"
            value={validation.prepare_execution_summary_hash}
          />
          <DetailRow
            label="returned_envelope_hash"
            value={validation.returned_envelope_hash}
          />
          <DetailRow
            label="authority_boundary"
            value={validation.authority_boundary}
          />
          <DetailRow
            label="next_safe_action"
            value={validation.next_safe_action}
          />
        </dl>
      </div>
      <ResultList title="warnings" values={validation.warnings} />
      <ResultList title="pointer_warnings" values={validation.pointer_warnings} />
      <ResultList title="blocked_reasons" values={validation.blocked_reasons} />
      <ResultList
        title="authority_flags"
        values={formatAuthorityFlags(validation.authority_flags)}
      />
    </section>
  );
}

function CandidateReviewMaterialPanel({
  scenario,
  validation,
}: {
  scenario: OperatorFlowViewModel["scenarios"][OperatorFlowReturnedEnvelopeFixtureKey];
  validation: OperatorFlowValidationPreview;
}) {
  return (
    <section
      className={styles.panel}
      aria-label="Candidate review material panel"
    >
      <PanelHeader
        eyebrow="6. Review"
        title="Candidate Review Material"
        detail={
          validation.candidate_compatible_review_material
            ? "candidate-compatible"
            : "not available"
        }
      />
      <dl className={styles.detailGrid}>
        <DetailRow
          label="review material available"
          value={String(validation.candidate_compatible_review_material)}
        />
        <DetailRow
          label="candidate_basis_quality"
          value={validation.candidate_basis_quality ?? "none"}
        />
        <DetailRow
          label="candidate_authority"
          value={validation.candidate_authority ?? "none"}
        />
        <DetailRow
          label="source PR refs"
          value={scenario.candidate_review_material.source_pr_refs.join(", ")}
        />
        <DetailRow
          label="bounded summary"
          value={scenario.candidate_review_material.review_summary}
        />
      </dl>
      <p className={styles.boundaryText}>
        This panel shows bounded review metadata only, not raw returned candidate
        content, raw prompt/source/private material, provider logs, tokens, or
        browser dumps.
      </p>
    </section>
  );
}

function CandidateActionPanel({
  actionChoice,
  supersedePreviousCandidateRef,
  onActionSelect,
  onSupersedeRefChange,
  canSelectAction,
  validationResultState,
  validationSource,
}: {
  actionChoice: OperatorFlowCandidateAction;
  supersedePreviousCandidateRef: string;
  onActionSelect: (action: OperatorFlowCandidateAction) => void;
  onSupersedeRefChange: (value: string) => void;
  canSelectAction: boolean;
  validationResultState: string;
  validationSource: string;
}) {
  return (
    <section className={styles.panel} aria-label="Next action panel">
      <PanelHeader
        eyebrow="7. Local Draft Action"
        title="Next Action"
        detail={canSelectAction ? actionChoice : "requires real validation"}
      />
      <p className={styles.boundaryText}>
        Action choices unlock after a non-blocked
        real_local_validate_execution result. Current validation is{" "}
        {validationResultState} from {validationSource}.
      </p>
      <div className={styles.actionGrid}>
        {operatorFlowCandidateActions.map((action) => (
          <button
            key={action}
            type="button"
            className={classNames(
              styles.actionButton,
              actionChoice === action ? styles.activeAction : "",
            )}
            data-augnes-candidate-action={action}
            aria-pressed={actionChoice === action}
            disabled={!canSelectAction}
            onClick={() => onActionSelect(action)}
          >
            <span>{actionButtonLabel(action)}</span>
            <code>{action}</code>
          </button>
        ))}
      </div>
      {actionChoice === "supersede_previous_candidate" ? (
        <label className={styles.fieldLabel}>
          supersede_previous_candidate_ref
          <input
            className={styles.textInput}
            value={supersedePreviousCandidateRef}
            onChange={(event) => onSupersedeRefChange(event.target.value)}
            placeholder="candidate ref"
            disabled={!canSelectAction}
          />
        </label>
      ) : null}
      <p className={styles.boundaryText}>
        Candidate actions are local draft choices only. They are not accepted
        state, review decisions, product DB persistence, Core decisions, product
        readiness, mergeability, runtime handoff, or automatic promotion.
      </p>
    </section>
  );
}

function LocalStorageBoundaryPanel({
  persistedFields,
}: {
  persistedFields: string[];
}) {
  return (
    <section className={styles.panel} aria-label="Local storage boundary panel">
      <PanelHeader
        eyebrow="8. Draft Metadata"
        title="Local Storage Boundary"
        detail="augnes.codexFormer.localAdapterOperatorFlow.v0.1"
      />
      <ul className={styles.tagList}>
        {persistedFields.map((field) => (
          <li key={field}>{field}</li>
        ))}
      </ul>
      <p className={styles.boundaryText}>
        The draft excludes hidden reasoning, provider logs, tokens, secrets, raw
        private material, raw source packets, browser dumps, raw diffs, raw
        review payloads, and raw candidate payloads by default.
      </p>
    </section>
  );
}

function PanelHeader({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <header className={styles.panelHeader}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <div>
        <h2>{title}</h2>
        <span>{detail}</span>
      </div>
    </header>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ResultList({ title, values }: { title: string; values: string[] }) {
  return (
    <div className={styles.resultList}>
      <strong>{title}</strong>
      {values.length > 0 ? (
        <ul>
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : (
        <p>none</p>
      )}
    </div>
  );
}

function fixtureButtonLabel(key: OperatorFlowReturnedEnvelopeFixtureKey) {
  if (key === "pass") return "Load PASS envelope fixture";
  if (key === "pass_with_follow_up") {
    return "Load PASS with follow-up envelope fixture";
  }
  return "Load BLOCKED envelope fixture";
}

function actionButtonLabel(action: OperatorFlowCandidateAction) {
  if (action === "keep_review_only") return "Keep review-only";
  if (action === "accept_as_perspective_candidate") {
    return "Mark as perspective candidate";
  }
  if (action === "reject_from_memory_candidate") {
    return "Reject as memory candidate";
  }
  return "Supersede previous candidate";
}

function formatAuthorityFlags(
  flags: OperatorFlowValidationPreview["authority_flags"],
) {
  return Object.entries(flags).map(([key, value]) => `${key}: ${String(value)}`);
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
