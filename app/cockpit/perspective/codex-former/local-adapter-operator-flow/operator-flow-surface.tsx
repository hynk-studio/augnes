"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./operator-flow-surface.module.css";
import {
  CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE,
  appendCodexFormerLocalAdapterCandidateDraftToList,
  clearCodexFormerLocalAdapterCandidateDraftListFromStorage,
  createEmptyCodexFormerLocalAdapterCandidateDraftList,
  getCodexFormerLocalAdapterCandidateDraftCurrentStatus,
  loadCodexFormerLocalAdapterCandidateDraftListFromStorage,
  removeCodexFormerLocalAdapterCandidateDraftFromList,
  replaceCodexFormerLocalAdapterCandidateDraftInList,
  saveCodexFormerLocalAdapterCandidateDraftListToStorage,
  type CodexFormerLocalAdapterCandidateDraftListV0,
} from "@/lib/perspective-ingest/codex-former-local-adapter-candidate-draft-list";
import {
  buildCodexFormerLocalAdapterAcceptedCandidateDraft,
  canBuildCodexFormerLocalAdapterAcceptedCandidateDraft,
  type CodexFormerLocalAdapterAcceptedCandidateDraftAction,
  type CodexFormerLocalAdapterAcceptedCandidateDraftV0,
} from "@/lib/perspective-ingest/codex-former-local-adapter-accepted-candidate-draft";
import {
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE,
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE,
  appendPerspectiveMemoryLocalReviewQueueItem,
  buildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft,
  canBuildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft,
  createEmptyPerspectiveMemoryLocalReviewQueue,
  findPerspectiveMemoryLocalReviewQueueItemBySourceDraft,
  loadPerspectiveMemoryLocalReviewQueueFromStorage,
  removePerspectiveMemoryLocalReviewQueueItem,
  savePerspectiveMemoryLocalReviewQueueToStorage,
  type PerspectiveMemoryLocalReviewQueueItemV0,
  type PerspectiveMemoryLocalReviewQueueV0,
} from "@/lib/perspective-ingest/perspective-memory-local-review-queue";
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
type CandidateDraftEligibility = ReturnType<
  typeof canBuildCodexFormerLocalAdapterAcceptedCandidateDraft
>;
type CandidateDraftQueueEligibility = ReturnType<
  typeof canBuildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft
>;

const initialIso = "1970-01-01T00:00:00.000Z";
const defaultCandidateActionChoice: OperatorFlowCandidateAction =
  "keep_review_only";

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
  const [candidateDraftList, setCandidateDraftList] =
    useState<CodexFormerLocalAdapterCandidateDraftListV0>(() =>
      createEmptyCodexFormerLocalAdapterCandidateDraftList(initialIso),
    );
  const [selectedCandidateDraftId, setSelectedCandidateDraftId] =
    useState<string | null>(null);
  const [candidateDraftStatus, setCandidateDraftStatus] = useState(
    "local candidate draft list not loaded",
  );
  const [localReviewQueue, setLocalReviewQueue] =
    useState<PerspectiveMemoryLocalReviewQueueV0>(() =>
      createEmptyPerspectiveMemoryLocalReviewQueue(initialIso),
    );
  const [localReviewQueueStatus, setLocalReviewQueueStatus] = useState(
    "local memory review queue not loaded",
  );
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
    const loadedCandidateDraftList =
      loadCodexFormerLocalAdapterCandidateDraftListFromStorage(
        window.localStorage,
        new Date().toISOString(),
      );
    if (loadedCandidateDraftList.migrated_single_draft) {
      saveCodexFormerLocalAdapterCandidateDraftListToStorage(
        window.localStorage,
        loadedCandidateDraftList.list,
      );
    }
    setCandidateDraftList(loadedCandidateDraftList.list);
    setSelectedCandidateDraftId(
      loadedCandidateDraftList.list.drafts[0]?.draft_id ?? null,
    );
    setCandidateDraftStatus(
      loadedCandidateDraftList.ignored_invalid_single_draft
        ? "ignored invalid local candidate draft during migration"
        : loadedCandidateDraftList.migrated_single_draft
          ? "migrated single local candidate draft into list"
          : loadedCandidateDraftList.list.drafts.length > 0
            ? "local candidate draft list restored"
            : "no local candidate drafts",
    );
    const loadedLocalReviewQueue =
      loadPerspectiveMemoryLocalReviewQueueFromStorage(
        window.localStorage,
        new Date().toISOString(),
      );
    setLocalReviewQueue(loadedLocalReviewQueue);
    setLocalReviewQueueStatus(
      loadedLocalReviewQueue.items.length > 0
        ? "local memory review queue restored"
        : "no local memory review queue items",
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
  const currentValidationForCandidateDrafts =
    draft.validation_result_source === "real_local_validate_execution" &&
    draft.validation_summary_hash &&
    draft.source_input_hash &&
    draft.prepare_execution_summary_hash &&
    draft.returned_envelope_hash
      ? {
          ...currentValidation,
          validation_source: "real_local_validate_execution" as const,
          validation_summary_hash: draft.validation_summary_hash,
          source_input_hash: draft.source_input_hash,
          prepare_execution_summary_hash:
            draft.prepare_execution_summary_hash,
          returned_envelope_hash: draft.returned_envelope_hash,
        }
      : currentValidation;
  const selectedCandidateDraft =
    candidateDraftList.drafts.find(
      (item) => item.draft_id === selectedCandidateDraftId,
    ) ?? null;
  const selectedCandidateDraftCurrentStatus = selectedCandidateDraft
    ? getCodexFormerLocalAdapterCandidateDraftCurrentStatus(
        selectedCandidateDraft,
        currentValidationForCandidateDrafts,
      )
    : null;
  const selectedCandidateDraftQueuedItem = selectedCandidateDraft
    ? findPerspectiveMemoryLocalReviewQueueItemBySourceDraft(
        localReviewQueue,
        selectedCandidateDraft.draft_id,
      )
    : null;
  const selectedCandidateDraftQueueEligibility = selectedCandidateDraft
    ? canBuildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft({
        draft: selectedCandidateDraft,
        sourceDraftCurrentStatus:
          selectedCandidateDraftCurrentStatus ?? "no_current_validation",
      })
    : {
        eligible: false,
        blocked_reasons: ["select a local candidate draft before queueing"],
      };
  const acceptDraftEligibility =
    canBuildCodexFormerLocalAdapterAcceptedCandidateDraft({
      candidateAction: "accept_as_perspective_candidate",
      validation: currentValidation,
    });
  const rejectDraftEligibility =
    canBuildCodexFormerLocalAdapterAcceptedCandidateDraft({
      candidateAction: "reject_from_memory_candidate",
      validation: currentValidation,
    });
  const supersedeDraftEligibility =
    canBuildCodexFormerLocalAdapterAcceptedCandidateDraft({
      candidateAction: "supersede_previous_candidate",
      validation: currentValidation,
      supersedesDraftId: draft.supersede_previous_candidate_ref,
    });
  const candidateActionEligibility: Record<OperatorFlowCandidateAction, boolean> =
    {
      keep_review_only:
        currentValidation.validation_source === "real_local_validate_execution",
      accept_as_perspective_candidate: acceptDraftEligibility.eligible,
      reject_from_memory_candidate: rejectDraftEligibility.eligible,
      supersede_previous_candidate:
        currentValidation.validation_source ===
          "real_local_validate_execution" &&
        currentValidation.result_state !== "BLOCKED",
    };

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
      "validation_summary_hash after real local validation",
      "source_input_hash after real local validation",
      "prepare_execution_summary_hash after real local validation",
      "returned_envelope_hash after real local validation",
      "candidate_action_choice",
      "supersede_previous_candidate_ref",
      `${CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE} stores explicit local candidate draft lists`,
      `${PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE} stores explicit local memory review queue items`,
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

  function resetCandidateActionPatch(): Pick<
    OperatorFlowPersistedDraft,
    "candidate_action_choice"
  > & {
    supersede_previous_candidate_ref: undefined;
  } {
    return {
      candidate_action_choice: defaultCandidateActionChoice,
      supersede_previous_candidate_ref: undefined,
    };
  }

  function resetValidationHashPatch(): Pick<
    OperatorFlowPersistedDraft,
    | "validation_summary_hash"
    | "source_input_hash"
    | "prepare_execution_summary_hash"
    | "returned_envelope_hash"
  > {
    return {
      validation_summary_hash: undefined,
      source_input_hash: undefined,
      prepare_execution_summary_hash: undefined,
      returned_envelope_hash: undefined,
    };
  }

  function localValidationHashPatch(
    validation: OperatorFlowValidationPreview,
  ): Pick<
    OperatorFlowPersistedDraft,
    | "validation_summary_hash"
    | "source_input_hash"
    | "prepare_execution_summary_hash"
    | "returned_envelope_hash"
  > {
    return {
      validation_summary_hash: validation.validation_summary_hash,
      source_input_hash: validation.source_input_hash,
      prepare_execution_summary_hash:
        validation.prepare_execution_summary_hash,
      returned_envelope_hash: validation.returned_envelope_hash,
    };
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
      ...resetValidationHashPatch(),
      ...resetCandidateActionPatch(),
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
      ...resetValidationHashPatch(),
      ...resetCandidateActionPatch(),
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

  function createLocalCandidateDraft(
    action: CodexFormerLocalAdapterAcceptedCandidateDraftAction,
    mode: "append" | "replace" = "append",
  ) {
    if (draft.candidate_action_choice !== action) {
      setCandidateDraftStatus(
        `select ${action} before creating a local candidate draft`,
      );
      return;
    }
    const nowIso = new Date().toISOString();
    if (mode === "replace" && !selectedCandidateDraft) {
      setCandidateDraftStatus("select a local candidate draft before replacing");
      return;
    }
    const result = buildCodexFormerLocalAdapterAcceptedCandidateDraft({
      nowIso,
      draftId:
        mode === "replace" && selectedCandidateDraft
          ? selectedCandidateDraft.draft_id
          : `local-candidate-draft:${Date.now()}`,
      operatorFlowDraftId: draft.draft_id,
      candidateAction: action,
      validation: currentValidation,
      sourceInputRef: draft.selected_source_input_ref,
      prepareSummaryRef: draft.selected_prepare_summary_ref,
      reviewSummary: displayScenario.candidate_review_material.review_summary,
      changedFilesCount:
        displayScenario.candidate_review_material.changed_files_count,
      sourcePrRefs: displayScenario.candidate_review_material.source_pr_refs,
      supersedesDraftId: draft.supersede_previous_candidate_ref,
    });
    if (!result.ok) {
      setCandidateDraftStatus(
        `local candidate draft blocked: ${result.blocked_reasons.join("; ")}`,
      );
      return;
    }
    const nextDraft =
      mode === "replace" && selectedCandidateDraft
        ? {
            ...result.draft,
            created_at: selectedCandidateDraft.created_at,
            updated_at: nowIso,
          }
        : result.draft;
    const nextList =
      mode === "replace"
        ? replaceCodexFormerLocalAdapterCandidateDraftInList(
            candidateDraftList,
            nextDraft,
            nowIso,
          )
        : appendCodexFormerLocalAdapterCandidateDraftToList(
            candidateDraftList,
            nextDraft,
            nowIso,
          );
    setCandidateDraftList(nextList);
    setSelectedCandidateDraftId(nextDraft.draft_id);
    saveCodexFormerLocalAdapterCandidateDraftListToStorage(
      window.localStorage,
      nextList,
    );
    setCandidateDraftStatus(
      mode === "replace"
        ? `${nextDraft.local_status} replaced selected local candidate draft`
        : `${nextDraft.local_status} appended to local candidate draft list`,
    );
  }

  function replaceSelectedLocalCandidateDraft() {
    if (
      draft.candidate_action_choice === "accept_as_perspective_candidate" ||
      draft.candidate_action_choice === "reject_from_memory_candidate" ||
      draft.candidate_action_choice === "supersede_previous_candidate"
    ) {
      createLocalCandidateDraft(draft.candidate_action_choice, "replace");
      return;
    }
    setCandidateDraftStatus(
      "select a candidate action before replacing a local candidate draft",
    );
  }

  function clearSelectedLocalCandidateDraft() {
    if (!selectedCandidateDraft) {
      setCandidateDraftStatus("no selected local candidate draft to clear");
      return;
    }
    const nowIso = new Date().toISOString();
    const nextList = removeCodexFormerLocalAdapterCandidateDraftFromList(
      candidateDraftList,
      selectedCandidateDraft.draft_id,
      nowIso,
    );
    setCandidateDraftList(nextList);
    setSelectedCandidateDraftId(nextList.drafts[0]?.draft_id ?? null);
    saveCodexFormerLocalAdapterCandidateDraftListToStorage(
      window.localStorage,
      nextList,
    );
    setCandidateDraftStatus("selected local candidate draft cleared");
  }

  function clearAllLocalCandidateDrafts() {
    const nowIso = new Date().toISOString();
    const nextList =
      createEmptyCodexFormerLocalAdapterCandidateDraftList(nowIso);
    clearCodexFormerLocalAdapterCandidateDraftListFromStorage(
      window.localStorage,
    );
    setCandidateDraftList(nextList);
    setSelectedCandidateDraftId(null);
    setCandidateDraftStatus("all local candidate drafts cleared");
  }

  function queueSelectedCandidateDraftForMemoryReview() {
    if (!selectedCandidateDraft || !selectedCandidateDraftCurrentStatus) {
      setLocalReviewQueueStatus(
        "select a local candidate draft before queueing for perspective-memory review",
      );
      return;
    }
    if (selectedCandidateDraftQueuedItem) {
      setLocalReviewQueueStatus(
        `selected draft is already queued as ${selectedCandidateDraftQueuedItem.queue_item_id}`,
      );
      return;
    }
    const nowIso = new Date().toISOString();
    const result = buildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft({
      nowIso,
      queueItemId: `local-memory-review-queue-item:${Date.now()}`,
      draft: selectedCandidateDraft,
      sourceDraftCurrentStatus: selectedCandidateDraftCurrentStatus,
    });
    if (!result.ok) {
      setLocalReviewQueueStatus(
        `memory review queue blocked: ${result.blocked_reasons.join("; ")}`,
      );
      return;
    }
    const nextQueue = appendPerspectiveMemoryLocalReviewQueueItem(
      localReviewQueue,
      result.item,
      nowIso,
    );
    setLocalReviewQueue(nextQueue);
    savePerspectiveMemoryLocalReviewQueueToStorage(
      window.localStorage,
      nextQueue,
    );
    setLocalReviewQueueStatus(
      `queued for perspective-memory review: ${result.item.queue_item_id}`,
    );
  }

  function removeQueueItemForSelectedCandidateDraft() {
    if (!selectedCandidateDraftQueuedItem) {
      setLocalReviewQueueStatus("selected draft has no active queue item");
      return;
    }
    const nowIso = new Date().toISOString();
    const nextQueue = removePerspectiveMemoryLocalReviewQueueItem(
      localReviewQueue,
      selectedCandidateDraftQueuedItem.queue_item_id,
      nowIso,
    );
    setLocalReviewQueue(nextQueue);
    savePerspectiveMemoryLocalReviewQueueToStorage(
      window.localStorage,
      nextQueue,
    );
    setLocalReviewQueueStatus("removed queue item for selected draft");
  }

  function previewValidationResult() {
    const preview = previewOperatorFlowValidationResult(
      returnedEnvelopeText,
      viewModel,
      draft.selected_returned_envelope_fixture_key,
    );
    setValidationPreview(preview);
    setLocalValidationRun(null);
    setValidationError(null);
    const scenario = viewModel.scenarios[preview.scenario_key];
    updateDraft({
      selected_source_input_ref: scenario.source_input_ref.path,
      selected_prepare_summary_ref: scenario.prepare_summary_ref.path,
      active_step: "validate_result",
      validation_result_state: preview.validation_result.result_state,
      validation_result_source: preview.validation_result.validation_source,
      ...resetValidationHashPatch(),
      ...resetCandidateActionPatch(),
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
      const shouldResetCandidateAction =
        result.validation_source === "blocked_before_execution" ||
        result.validation_result.result_state === "BLOCKED";
      setLocalValidationRun(result);
      setValidationPreview(null);
      updateDraft({
        active_step: "validate_result",
        validation_result_state: result.validation_result.result_state,
        validation_result_source: result.validation_source,
        ...(result.validation_source === "real_local_validate_execution"
          ? localValidationHashPatch(result.validation_result)
          : resetValidationHashPatch()),
        ...(shouldResetCandidateAction ? resetCandidateActionPatch() : {}),
      });
      setDraftStatus(
        `${result.validation_source} completed; no product state created`,
      );
    } catch (error) {
      setLocalValidationRun(null);
      setValidationPreview(null);
      setValidationError(
        error instanceof Error
          ? error.message
          : "Local validation request failed",
      );
      updateDraft({
        active_step: "validate_result",
        validation_result_state: "not_validated",
        validation_result_source: "not_run",
        ...resetValidationHashPatch(),
        ...resetCandidateActionPatch(),
      });
      setDraftStatus("local validation bridge request failed");
    } finally {
      setValidationBusy(false);
    }
  }

  function selectCandidateAction(action: OperatorFlowCandidateAction) {
    updateDraft({
      active_step: "candidate_action",
      candidate_action_choice: action,
      supersede_previous_candidate_ref:
        action === "supersede_previous_candidate"
          ? draft.supersede_previous_candidate_ref
          : undefined,
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
      ...resetValidationHashPatch(),
      ...resetCandidateActionPatch(),
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
            actionEligibility={candidateActionEligibility}
            validationResultState={currentValidation.result_state}
            validationSource={currentValidation.validation_source}
          />
          <LocalCandidateDraftListPanel
            candidateDraftList={candidateDraftList}
            selectedCandidateDraftId={selectedCandidateDraftId}
            candidateDraftStatus={candidateDraftStatus}
            currentValidation={currentValidation}
            currentValidationForCandidateDrafts={
              currentValidationForCandidateDrafts
            }
            selectedAction={draft.candidate_action_choice}
            acceptEligibility={acceptDraftEligibility}
            rejectEligibility={rejectDraftEligibility}
            supersedeEligibility={supersedeDraftEligibility}
            queueEligibility={selectedCandidateDraftQueueEligibility}
            supersedePreviousCandidateRef={
              draft.supersede_previous_candidate_ref ?? ""
            }
            localReviewQueue={localReviewQueue}
            localReviewQueueStatus={localReviewQueueStatus}
            selectedQueueItem={selectedCandidateDraftQueuedItem}
            onSelectDraft={setSelectedCandidateDraftId}
            onCreateAccepted={() =>
              createLocalCandidateDraft("accept_as_perspective_candidate")
            }
            onCreateRejected={() =>
              createLocalCandidateDraft("reject_from_memory_candidate")
            }
            onCreateSupersede={() =>
              createLocalCandidateDraft("supersede_previous_candidate")
            }
            onReplaceSelected={replaceSelectedLocalCandidateDraft}
            onClearSelected={clearSelectedLocalCandidateDraft}
            onClearAll={clearAllLocalCandidateDrafts}
            onQueueSelected={queueSelectedCandidateDraftForMemoryReview}
            onRemoveSelectedQueueItem={removeQueueItemForSelectedCandidateDraft}
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
  actionEligibility,
  validationResultState,
  validationSource,
}: {
  actionChoice: OperatorFlowCandidateAction;
  supersedePreviousCandidateRef: string;
  onActionSelect: (action: OperatorFlowCandidateAction) => void;
  onSupersedeRefChange: (value: string) => void;
  actionEligibility: Record<OperatorFlowCandidateAction, boolean>;
  validationResultState: string;
  validationSource: string;
}) {
  const anyActionEligible = Object.values(actionEligibility).some(Boolean);
  return (
    <section className={styles.panel} aria-label="Next action panel">
      <PanelHeader
        eyebrow="7. Local Draft Action"
        title="Next Action"
        detail={anyActionEligible ? actionChoice : "requires real validation"}
      />
      <p className={styles.boundaryText}>
        Accepted and supersede actions unlock after a non-blocked
        real_local_validate_execution result. BLOCKED validation can only create
        a rejection draft after Reject as memory candidate is selected. Current
        validation is {validationResultState} from {validationSource}.
      </p>
      <div className={styles.actionGrid}>
        {operatorFlowCandidateActions.map((action) => {
          const actionCanBeSelected = actionEligibility[action];
          return (
            <button
              key={action}
              type="button"
              className={classNames(
                styles.actionButton,
                actionChoice === action ? styles.activeAction : "",
              )}
              data-augnes-candidate-action={action}
              aria-pressed={actionChoice === action}
              disabled={!actionCanBeSelected}
              onClick={() => onActionSelect(action)}
            >
              <span>{actionButtonLabel(action)}</span>
              <code>{action}</code>
            </button>
          );
        })}
      </div>
      {actionChoice === "supersede_previous_candidate" ? (
        <label className={styles.fieldLabel}>
          supersede_previous_candidate_ref
          <input
            className={styles.textInput}
            value={supersedePreviousCandidateRef}
            onChange={(event) => onSupersedeRefChange(event.target.value)}
            placeholder="candidate ref"
            disabled={!actionEligibility.supersede_previous_candidate}
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

function LocalCandidateDraftListPanel({
  candidateDraftList,
  selectedCandidateDraftId,
  candidateDraftStatus,
  currentValidation,
  currentValidationForCandidateDrafts,
  selectedAction,
  acceptEligibility,
  rejectEligibility,
  supersedeEligibility,
  queueEligibility,
  supersedePreviousCandidateRef,
  localReviewQueue,
  localReviewQueueStatus,
  selectedQueueItem,
  onSelectDraft,
  onCreateAccepted,
  onCreateRejected,
  onCreateSupersede,
  onReplaceSelected,
  onClearSelected,
  onClearAll,
  onQueueSelected,
  onRemoveSelectedQueueItem,
}: {
  candidateDraftList: CodexFormerLocalAdapterCandidateDraftListV0;
  selectedCandidateDraftId: string | null;
  candidateDraftStatus: string;
  currentValidation: OperatorFlowValidationPreview;
  currentValidationForCandidateDrafts: OperatorFlowValidationPreview;
  selectedAction: OperatorFlowCandidateAction;
  acceptEligibility: CandidateDraftEligibility;
  rejectEligibility: CandidateDraftEligibility;
  supersedeEligibility: CandidateDraftEligibility;
  queueEligibility: CandidateDraftQueueEligibility;
  supersedePreviousCandidateRef: string;
  localReviewQueue: PerspectiveMemoryLocalReviewQueueV0;
  localReviewQueueStatus: string;
  selectedQueueItem: PerspectiveMemoryLocalReviewQueueItemV0 | null;
  onSelectDraft: (draftId: string) => void;
  onCreateAccepted: () => void;
  onCreateRejected: () => void;
  onCreateSupersede: () => void;
  onReplaceSelected: () => void;
  onClearSelected: () => void;
  onClearAll: () => void;
  onQueueSelected: () => void;
  onRemoveSelectedQueueItem: () => void;
}) {
  const selectedCandidateDraft =
    candidateDraftList.drafts.find(
      (draft) => draft.draft_id === selectedCandidateDraftId,
    ) ?? null;
  const acceptDisabled =
    selectedAction !== "accept_as_perspective_candidate" ||
    !acceptEligibility.eligible;
  const rejectDisabled =
    selectedAction !== "reject_from_memory_candidate" ||
    !rejectEligibility.eligible;
  const supersedeDisabled =
    selectedAction !== "supersede_previous_candidate" ||
    !supersedeEligibility.eligible ||
    !supersedePreviousCandidateRef.trim();
  const replaceDisabled =
    !selectedCandidateDraft ||
    (selectedAction === "accept_as_perspective_candidate" && acceptDisabled) ||
    (selectedAction === "reject_from_memory_candidate" && rejectDisabled) ||
    (selectedAction === "supersede_previous_candidate" && supersedeDisabled) ||
    selectedAction === "keep_review_only";
  const listStatus =
    candidateDraftList.drafts.length > 0
      ? `${candidateDraftList.drafts.length} local candidate drafts`
      : "no_local_candidate_drafts";
  const queueSelectedDisabled =
    !selectedCandidateDraft ||
    !queueEligibility.eligible ||
    selectedQueueItem != null;
  const activeQueueItemCount = localReviewQueue.items.filter(
    (item) => item.queue_status !== "removed_from_queue",
  ).length;

  return (
    <section
      className={styles.panel}
      aria-label="Local candidate draft list panel"
      data-augnes-local-candidate-draft-list-status={listStatus}
    >
      <PanelHeader
        eyebrow="8. Local Candidate Drafts"
        title="Local Candidate Draft List"
        detail={listStatus}
      />
      <p className={styles.boundaryText}>
        Candidate drafts are local draft only. They are not accepted Augnes
        state, not review decision, not product DB persistence, not Core
        decision, not runtime handoff, and not automatic promotion.
      </p>
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.primaryButton}
          data-augnes-create-accepted-candidate-draft="true"
          disabled={acceptDisabled}
          onClick={onCreateAccepted}
        >
          Create local perspective candidate draft
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-create-rejection-candidate-draft="true"
          disabled={rejectDisabled}
          onClick={onCreateRejected}
        >
          Create local memory rejection draft
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-create-supersede-candidate-draft="true"
          disabled={supersedeDisabled}
          onClick={onCreateSupersede}
        >
          Create local supersede draft
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-replace-selected-candidate-draft="true"
          disabled={replaceDisabled}
          onClick={onReplaceSelected}
        >
          Replace selected draft with current candidate draft
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-clear-selected-candidate-draft="true"
          disabled={!selectedCandidateDraft}
          onClick={onClearSelected}
        >
          Clear selected local candidate draft
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-clear-all-candidate-drafts="true"
          disabled={candidateDraftList.drafts.length === 0}
          onClick={onClearAll}
        >
          Clear all local candidate drafts
        </button>
      </div>
      <dl className={styles.detailGrid}>
        <DetailRow label="candidate_draft_list_status" value={listStatus} />
        <DetailRow label="candidate_draft_list_note" value={candidateDraftStatus} />
        <DetailRow
          label="list_storage_namespace"
          value={CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE}
        />
        <DetailRow
          label="selected_draft_id"
          value={selectedCandidateDraft?.draft_id ?? "none"}
        />
        <DetailRow
          label="list_updated_at"
          value={candidateDraftList.updated_at}
        />
        <DetailRow
          label="current_validation_source"
          value={currentValidationForCandidateDrafts.validation_source}
        />
        <DetailRow
          label="current_result_state"
          value={currentValidation.result_state}
        />
        <DetailRow
          label="current_candidate_count"
          value={String(currentValidation.candidate_count)}
        />
      </dl>
      <div
        className={styles.queuePanel}
        data-augnes-memory-review-queue-panel="true"
      >
        <PanelHeader
          eyebrow="9. Memory Review Queue"
          title="Perspective-Memory Review Queue"
          detail="local queue only"
        />
        <p className={styles.boundaryText}>
          Queue items are local queue only. They are not accepted Augnes memory,
          not review decision, not product DB persistence, not Core decision,
          not runtime handoff, and not automatic promotion.
        </p>
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.primaryButton}
            data-augnes-queue-selected-candidate-draft="true"
            disabled={queueSelectedDisabled}
            onClick={onQueueSelected}
          >
            Queue for perspective-memory review
          </button>
          <button
            type="button"
            className={styles.button}
            data-augnes-remove-selected-queue-item="true"
            disabled={!selectedQueueItem}
            onClick={onRemoveSelectedQueueItem}
          >
            Remove queue item for selected draft
          </button>
          <a
            className={styles.linkButton}
            data-augnes-open-local-memory-review-queue="true"
            href={PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE}
          >
            Open local memory review queue
          </a>
        </div>
        <dl className={styles.detailGrid}>
          <DetailRow
            label="review_queue_storage_namespace"
            value={PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE}
          />
          <DetailRow
            label="review_queue_item_count"
            value={String(activeQueueItemCount)}
          />
          <DetailRow
            label="review_queue_status"
            value={localReviewQueueStatus}
          />
          <DetailRow
            label="selected_queue_item_id"
            value={selectedQueueItem?.queue_item_id ?? "none"}
          />
          <DetailRow
            label="selected_queue_status"
            value={selectedQueueItem?.queue_status ?? "not_queued"}
          />
          <DetailRow
            label="selected_draft_already_queued"
            value={String(selectedQueueItem != null)}
          />
          <DetailRow
            label="queue_route"
            value={PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE}
          />
        </dl>
        <ResultList
          title="memory_review_queue_blocked_reasons"
          values={
            queueEligibility.eligible ? [] : queueEligibility.blocked_reasons
          }
        />
      </div>
      {candidateDraftList.drafts.length > 0 ? (
        <div className={styles.draftList} data-augnes-candidate-draft-list="true">
          {candidateDraftList.drafts.map((candidateDraft) => {
            const itemStatus =
              getCodexFormerLocalAdapterCandidateDraftCurrentStatus(
                candidateDraft,
                currentValidationForCandidateDrafts,
              );
            return (
              <article
                key={candidateDraft.draft_id}
                className={classNames(
                  styles.draftListItem,
                  selectedCandidateDraftId === candidateDraft.draft_id
                    ? styles.selectedDraftListItem
                    : "",
                )}
                data-augnes-candidate-draft-id={candidateDraft.draft_id}
                data-augnes-candidate-draft-current-status={itemStatus}
              >
                <div className={styles.draftListItemHeader}>
                  <button
                    type="button"
                    className={styles.button}
                    data-augnes-select-candidate-draft={candidateDraft.draft_id}
                    aria-pressed={
                      selectedCandidateDraftId === candidateDraft.draft_id
                    }
                    onClick={() => onSelectDraft(candidateDraft.draft_id)}
                  >
                    Select draft
                  </button>
                  <strong>{candidateDraft.local_status}</strong>
                  <span>{itemStatus}</span>
                </div>
                <dl className={classNames(styles.detailGrid, styles.draftDetailGrid)}>
                  <DetailRow label="draft_id" value={candidateDraft.draft_id} />
                  <DetailRow
                    label="local_status"
                    value={candidateDraft.local_status}
                  />
                  <DetailRow
                    label="candidate_action"
                    value={candidateDraft.candidate_action}
                  />
                  <DetailRow
                    label="validation_result_state"
                    value={candidateDraft.validation_result_state}
                  />
                  <DetailRow
                    label="validation_source"
                    value={candidateDraft.validation_source}
                  />
                  <DetailRow
                    label="stale_state"
                    value={itemStatus}
                  />
                  <DetailRow
                    label="warning_count"
                    value={String(candidateDraft.warnings.length)}
                  />
                  <DetailRow
                    label="pointer_warning_count"
                    value={String(candidateDraft.pointer_warnings.length)}
                  />
                  <DetailRow
                    label="source_input_ref"
                    value={candidateDraft.source_input_ref}
                  />
                  <DetailRow
                    label="prepare_summary_ref"
                    value={candidateDraft.prepare_summary_ref}
                  />
                  <DetailRow
                    label="returned_envelope_hash"
                    value={candidateDraft.returned_envelope_hash}
                  />
                  <DetailRow
                    label="created_at"
                    value={candidateDraft.created_at}
                  />
                  <DetailRow
                    label="updated_at"
                    value={candidateDraft.updated_at}
                  />
                  {candidateDraft.supersedes_draft_id ? (
                    <DetailRow
                      label="supersedes_draft_id"
                      value={candidateDraft.supersedes_draft_id}
                    />
                  ) : null}
                  <DetailRow
                    label="authority_boundary"
                    value={formatCandidateDraftAuthorityBoundary(candidateDraft)}
                  />
                </dl>
              </article>
            );
          })}
        </div>
      ) : (
        <p className={styles.boundaryText}>
          No local candidate drafts have been created in{" "}
          {CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE}.
        </p>
      )}
      <ResultList
        title="accepted_draft_blocked_reasons"
        values={
          acceptEligibility.eligible ? [] : acceptEligibility.blocked_reasons
        }
      />
      <ResultList
        title="supersede_draft_blocked_reasons"
        values={
          supersedeEligibility.eligible
            ? []
            : supersedeEligibility.blocked_reasons
        }
      />
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

function formatCandidateDraftAuthorityBoundary(
  draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0,
) {
  return Object.entries(draft.authority_boundary)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
