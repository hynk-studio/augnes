"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./local-memory-review-queue-surface.module.css";
import {
  createEmptyCodexFormerLocalAdapterCandidateDraftList,
  loadCodexFormerLocalAdapterCandidateDraftListFromStorage,
  type CodexFormerLocalAdapterCandidateDraftListV0,
} from "@/lib/perspective-ingest/codex-former-local-adapter-candidate-draft-list";
import {
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE,
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE,
  clearPerspectiveMemoryLocalReviewQueueFromStorage,
  createEmptyPerspectiveMemoryLocalReviewQueue,
  getPerspectiveMemoryLocalReviewQueueItemSourceState,
  loadPerspectiveMemoryLocalReviewQueueFromStorage,
  savePerspectiveMemoryLocalReviewQueueToStorage,
  updatePerspectiveMemoryLocalReviewQueueItemStatus,
  type PerspectiveMemoryLocalReviewQueueItemV0,
  type PerspectiveMemoryLocalReviewQueueSourceState,
  type PerspectiveMemoryLocalReviewQueueStatus,
  type PerspectiveMemoryLocalReviewQueueV0,
} from "@/lib/perspective-ingest/perspective-memory-local-review-queue";
import {
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE,
  appendPerspectiveMemoryLocalWriteProposalToList,
  buildPerspectiveMemoryLocalWriteProposalFromQueueItem,
  canBuildPerspectiveMemoryLocalWriteProposalFromQueueItem,
  clearPerspectiveMemoryLocalWriteProposalListFromStorage,
  createEmptyPerspectiveMemoryLocalWriteProposalList,
  findPerspectiveMemoryLocalWriteProposalByQueueItem,
  getPerspectiveMemoryLocalWriteProposalSourceState,
  loadPerspectiveMemoryLocalWriteProposalListFromStorage,
  removePerspectiveMemoryLocalWriteProposalFromList,
  savePerspectiveMemoryLocalWriteProposalListToStorage,
  updatePerspectiveMemoryLocalWriteProposalStatus,
  type PerspectiveMemoryLocalWriteProposalListV0,
  type PerspectiveMemoryLocalWriteProposalSourceState,
  type PerspectiveMemoryLocalWriteProposalStatus,
  type PerspectiveMemoryLocalWriteProposalV0,
} from "@/lib/perspective-ingest/perspective-memory-local-write-proposal";
import {
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
  appendPerspectiveMemoryLocalWriteProposalReviewChecklistToList,
  buildPerspectiveMemoryLocalWriteProposalReviewChecklist,
  clearPerspectiveMemoryLocalWriteProposalReviewChecklistListFromStorage,
  createEmptyPerspectiveMemoryLocalWriteProposalReviewChecklistList,
  findPerspectiveMemoryLocalWriteProposalReviewChecklistByProposal,
  getPerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState,
  loadPerspectiveMemoryLocalWriteProposalReviewChecklistListFromStorage,
  markPerspectiveMemoryLocalWriteProposalReviewChecklistInReview,
  markPerspectiveMemoryLocalWriteProposalReviewChecklistReady,
  recomputePerspectiveMemoryLocalWriteProposalReviewChecklist,
  removePerspectiveMemoryLocalWriteProposalReviewChecklistFromList,
  replacePerspectiveMemoryLocalWriteProposalReviewChecklistInList,
  savePerspectiveMemoryLocalWriteProposalReviewChecklistListToStorage,
  updatePerspectiveMemoryLocalWriteProposalReviewChecklistGate,
  updatePerspectiveMemoryLocalWriteProposalReviewChecklistNotes,
  type PerspectiveMemoryLocalWriteProposalReviewChecklistGateId,
  type PerspectiveMemoryLocalWriteProposalReviewChecklistListV0,
  type PerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState,
  type PerspectiveMemoryLocalWriteProposalReviewChecklistV0,
} from "@/lib/perspective-ingest/perspective-memory-local-write-proposal-review-checklist";
import {
  PERSPECTIVE_MEMORY_BOUNDARY_REVIEW_INBOX_ROUTE,
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE,
  canBuildPerspectiveMemoryProductPersistenceBoundaryRecord,
  createEmptyPerspectiveMemoryProductPersistenceBoundaryRecordList,
  type PerspectiveMemoryProductPersistenceBoundaryRecordListV0,
  type PerspectiveMemoryProductPersistenceBoundaryRecordV0,
  type PerspectiveMemoryProductPersistenceBoundaryStatus,
} from "@/lib/perspective-ingest/perspective-memory-product-persistence-boundary";

type QueueFilter =
  | "all"
  | "queued_for_memory_review"
  | "reviewing_locally"
  | "kept_for_later"
  | "removed_from_queue"
  | "stale_or_missing_source";
type ProposalEligibility = ReturnType<
  typeof canBuildPerspectiveMemoryLocalWriteProposalFromQueueItem
>;

const initialIso = "1970-01-01T00:00:00.000Z";
const queueFilters: QueueFilter[] = [
  "all",
  "queued_for_memory_review",
  "reviewing_locally",
  "kept_for_later",
  "removed_from_queue",
  "stale_or_missing_source",
];

export function LocalMemoryReviewQueueSurface() {
  const [queue, setQueue] = useState<PerspectiveMemoryLocalReviewQueueV0>(() =>
    createEmptyPerspectiveMemoryLocalReviewQueue(initialIso),
  );
  const [candidateDraftList, setCandidateDraftList] =
    useState<CodexFormerLocalAdapterCandidateDraftListV0>(() =>
      createEmptyCodexFormerLocalAdapterCandidateDraftList(initialIso),
    );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<QueueFilter>("all");
  const [queueStatus, setQueueStatus] = useState(
    "local memory review queue not loaded",
  );
  const [proposalList, setProposalList] =
    useState<PerspectiveMemoryLocalWriteProposalListV0>(() =>
      createEmptyPerspectiveMemoryLocalWriteProposalList(initialIso),
    );
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
    null,
  );
  const [proposalStatus, setProposalStatus] = useState(
    "local write proposal list not loaded",
  );
  const [checklistList, setChecklistList] =
    useState<PerspectiveMemoryLocalWriteProposalReviewChecklistListV0>(() =>
      createEmptyPerspectiveMemoryLocalWriteProposalReviewChecklistList(
        initialIso,
      ),
    );
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(
    null,
  );
  const [checklistStatus, setChecklistStatus] = useState(
    "local write proposal review checklist list not loaded",
  );
  const [checklistNoteDraft, setChecklistNoteDraft] = useState("");
  const [boundaryRecordList, setBoundaryRecordList] =
    useState<PerspectiveMemoryProductPersistenceBoundaryRecordListV0>(() =>
      createEmptyPerspectiveMemoryProductPersistenceBoundaryRecordList(
        initialIso,
      ),
    );
  const [selectedBoundaryRecordId, setSelectedBoundaryRecordId] =
    useState<string | null>(null);
  const [boundaryStatus, setBoundaryStatus] = useState(
    "product persistence boundary records not loaded",
  );
  const [boundaryConfirmations, setBoundaryConfirmations] = useState({
    user_confirmed_not_accepted_memory: false,
    user_confirmed_not_core_decision: false,
    user_confirmed_no_automatic_promotion: false,
  });

  useEffect(() => {
    const nowIso = new Date().toISOString();
    const loadedQueue = loadPerspectiveMemoryLocalReviewQueueFromStorage(
      window.localStorage,
      nowIso,
    );
    const loadedDraftList =
      loadCodexFormerLocalAdapterCandidateDraftListFromStorage(
        window.localStorage,
        nowIso,
      );
    setQueue(loadedQueue);
    setCandidateDraftList(loadedDraftList.list);
    setSelectedItemId(loadedQueue.items[0]?.queue_item_id ?? null);
    setQueueStatus(
      loadedQueue.items.length > 0
        ? "local memory review queue restored"
        : "no local memory review queue items",
    );
    const loadedProposalList =
      loadPerspectiveMemoryLocalWriteProposalListFromStorage(
        window.localStorage,
        nowIso,
      );
    setProposalList(loadedProposalList);
    const restoredProposalId =
      loadedProposalList.proposals.find(
        (proposal) =>
          proposal.source_queue_item_id === loadedQueue.items[0]?.queue_item_id,
      )?.proposal_id ??
      loadedProposalList.proposals[0]?.proposal_id ??
      null;
    setSelectedProposalId(restoredProposalId);
    setProposalStatus(
      loadedProposalList.proposals.length > 0
        ? "local write proposal list restored"
        : "no local write proposals",
    );
    const loadedChecklistList =
      loadPerspectiveMemoryLocalWriteProposalReviewChecklistListFromStorage(
        window.localStorage,
        nowIso,
      );
    setChecklistList(loadedChecklistList);
    const restoredChecklist =
      (restoredProposalId
        ? findPerspectiveMemoryLocalWriteProposalReviewChecklistByProposal(
            loadedChecklistList,
            restoredProposalId,
          )
        : null) ?? loadedChecklistList.checklists[0] ?? null;
    setSelectedChecklistId(restoredChecklist?.checklist_id ?? null);
    setChecklistNoteDraft(restoredChecklist?.local_review_notes ?? "");
    setChecklistStatus(
      loadedChecklistList.checklists.length > 0
        ? "local write proposal review checklist list restored"
        : "no local write proposal review checklists",
    );
    void loadBoundaryRecords();
  }, []);

  const itemsWithSourceState = useMemo(
    () =>
      queue.items.map((item) => ({
        item,
        sourceState: getPerspectiveMemoryLocalReviewQueueItemSourceState(
          item,
          candidateDraftList,
        ),
      })),
    [candidateDraftList, queue.items],
  );
  const filteredItems = itemsWithSourceState.filter(({ item, sourceState }) =>
    queueFilterMatches(activeFilter, item, sourceState),
  );
  const selectedItem =
    queue.items.find((item) => item.queue_item_id === selectedItemId) ??
    queue.items[0] ??
    null;
  const selectedSourceState = selectedItem
    ? getPerspectiveMemoryLocalReviewQueueItemSourceState(
        selectedItem,
        candidateDraftList,
      )
    : null;
  const proposalForSelectedQueueItem = selectedItem
    ? findPerspectiveMemoryLocalWriteProposalByQueueItem(
        proposalList,
        selectedItem.queue_item_id,
      )
    : null;
  const selectedProposal =
    selectedProposalId
      ? proposalList.proposals.find(
          (proposal) => proposal.proposal_id === selectedProposalId,
        ) ?? proposalForSelectedQueueItem
      : proposalForSelectedQueueItem;
  const selectedProposalSourceState = selectedProposal
    ? getPerspectiveMemoryLocalWriteProposalSourceState(selectedProposal, queue)
    : null;
  const checklistForSelectedProposal = selectedProposal
    ? findPerspectiveMemoryLocalWriteProposalReviewChecklistByProposal(
        checklistList,
        selectedProposal.proposal_id,
      )
    : null;
  const selectedChecklist =
    selectedChecklistId
      ? checklistList.checklists.find(
          (checklist) => checklist.checklist_id === selectedChecklistId,
        ) ?? checklistForSelectedProposal
      : checklistForSelectedProposal;
  const displayChecklist = selectedChecklist
    ? recomputePerspectiveMemoryLocalWriteProposalReviewChecklist({
        checklist: selectedChecklist,
        proposalList,
        queue,
        nowIso: selectedChecklist.updated_at,
      })
    : null;
  const selectedChecklistSourceProposalState = displayChecklist
    ? getPerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState(
        displayChecklist,
        proposalList,
      )
    : null;
  const selectedChecklistSourceProposal = displayChecklist
    ? proposalList.proposals.find(
        (proposal) =>
          proposal.proposal_id === displayChecklist.source_proposal_id,
      ) ?? null
    : null;
  const selectedChecklistSourceQueueState = selectedChecklistSourceProposal
    ? getPerspectiveMemoryLocalWriteProposalSourceState(
        selectedChecklistSourceProposal,
        queue,
      )
    : displayChecklist
      ? "not_checked"
      : null;
  const selectedChecklistSourceQueueItem = displayChecklist
    ? queue.items.find(
        (item) => item.queue_item_id === displayChecklist.source_queue_item_id,
      ) ?? null
    : null;
  const selectedBoundaryRecord =
    (selectedBoundaryRecordId
      ? boundaryRecordList.records.find(
          (record) => record.record_id === selectedBoundaryRecordId,
        )
      : null) ??
    (displayChecklist
      ? boundaryRecordList.records.find(
          (record) =>
            record.source_checklist_id === displayChecklist.checklist_id,
        )
      : null) ??
    boundaryRecordList.records[0] ??
    null;
  const boundaryEligibility =
    displayChecklist &&
    selectedChecklistSourceProposal &&
    selectedChecklistSourceQueueItem
      ? canBuildPerspectiveMemoryProductPersistenceBoundaryRecord({
          checklist: displayChecklist,
          proposal: selectedChecklistSourceProposal,
          queueItem: selectedChecklistSourceQueueItem,
          userConfirmation: boundaryConfirmations,
        })
      : {
          eligible: false,
          blocked_reasons: [
            "select a ready checklist, source proposal, and source queue item first",
          ],
        };
  const proposalEligibility =
    selectedItem && selectedSourceState
      ? canBuildPerspectiveMemoryLocalWriteProposalFromQueueItem({
          queueItem: selectedItem,
          queueSourceState: selectedSourceState,
        })
      : {
          eligible: false,
          blocked_reasons: ["select a queue item before creating a proposal"],
        };

  function saveQueue(
    nextQueue: PerspectiveMemoryLocalReviewQueueV0,
    nextStatus: string,
  ) {
    setQueue(nextQueue);
    savePerspectiveMemoryLocalReviewQueueToStorage(
      window.localStorage,
      nextQueue,
    );
    setQueueStatus(nextStatus);
  }

  function updateSelectedQueueStatus(
    queueItemStatus: PerspectiveMemoryLocalReviewQueueStatus,
  ) {
    if (!selectedItem) {
      setQueueStatus("select a queue item before updating local review status");
      return;
    }
    const nowIso = new Date().toISOString();
    const nextQueue = updatePerspectiveMemoryLocalReviewQueueItemStatus(
      queue,
      selectedItem.queue_item_id,
      queueItemStatus,
      nowIso,
    );
    saveQueue(nextQueue, `queue item marked ${queueItemStatus}`);
  }

  function saveProposalList(
    nextList: PerspectiveMemoryLocalWriteProposalListV0,
    nextStatus: string,
  ) {
    setProposalList(nextList);
    savePerspectiveMemoryLocalWriteProposalListToStorage(
      window.localStorage,
      nextList,
    );
    setProposalStatus(nextStatus);
  }

  function selectQueueItem(queueItemId: string) {
    setSelectedItemId(queueItemId);
    const proposal = findPerspectiveMemoryLocalWriteProposalByQueueItem(
      proposalList,
      queueItemId,
    );
    setSelectedProposalId(proposal?.proposal_id ?? null);
    const checklist = proposal
      ? findPerspectiveMemoryLocalWriteProposalReviewChecklistByProposal(
          checklistList,
          proposal.proposal_id,
        )
      : null;
    setSelectedChecklistId(checklist?.checklist_id ?? null);
    setChecklistNoteDraft(checklist?.local_review_notes ?? "");
    setBoundaryConfirmations(emptyBoundaryConfirmations());
  }

  function selectProposal(proposalId: string) {
    setSelectedProposalId(proposalId);
    const checklist =
      findPerspectiveMemoryLocalWriteProposalReviewChecklistByProposal(
        checklistList,
        proposalId,
      );
    setSelectedChecklistId(checklist?.checklist_id ?? null);
    setChecklistNoteDraft(checklist?.local_review_notes ?? "");
    setBoundaryConfirmations(emptyBoundaryConfirmations());
  }

  async function loadBoundaryRecords() {
    try {
      const response = await fetch(
        `${PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE}?limit=50`,
        { method: "GET" },
      );
      const body = (await response.json()) as {
        ok?: boolean;
        result?: PerspectiveMemoryProductPersistenceBoundaryRecordListV0;
        blocked_reasons?: string[];
      };
      if (!response.ok || body.ok === false || !body.result) {
        setBoundaryStatus(
          `boundary records blocked: ${
            body.blocked_reasons?.join("; ") ?? response.statusText
          }`,
        );
        return;
      }
      setBoundaryRecordList(body.result);
      setSelectedBoundaryRecordId(body.result.records[0]?.record_id ?? null);
      setBoundaryStatus(
        body.result.records.length > 0
          ? "product persistence boundary records restored from sqlite"
          : "no product persistence boundary records",
      );
    } catch (error) {
      setBoundaryStatus(
        `boundary record load failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  function createLocalWriteProposal() {
    if (!selectedItem || !selectedSourceState) {
      setProposalStatus("select a queue item before creating a write proposal");
      return;
    }
    if (proposalForSelectedQueueItem) {
      setProposalStatus(
        `selected queue item already has proposal ${proposalForSelectedQueueItem.proposal_id}`,
      );
      setSelectedProposalId(proposalForSelectedQueueItem.proposal_id);
      return;
    }
    const nowIso = new Date().toISOString();
    const result = buildPerspectiveMemoryLocalWriteProposalFromQueueItem({
      nowIso,
      proposalId: `local-memory-write-proposal:${Date.now()}`,
      queueItem: selectedItem,
      queueSourceState: selectedSourceState,
    });
    if (!result.ok) {
      setProposalStatus(
        `write proposal blocked: ${result.blocked_reasons.join("; ")}`,
      );
      return;
    }
    const nextList = appendPerspectiveMemoryLocalWriteProposalToList(
      proposalList,
      result.proposal,
      nowIso,
    );
    setSelectedProposalId(result.proposal.proposal_id);
    setSelectedChecklistId(null);
    setChecklistNoteDraft("");
    saveProposalList(
      nextList,
      `local memory write proposal created: ${result.proposal.proposal_id}`,
    );
  }

  function updateSelectedProposalStatus(
    nextStatus: PerspectiveMemoryLocalWriteProposalStatus,
  ) {
    if (!selectedProposal) {
      setProposalStatus("select a local write proposal before updating status");
      return;
    }
    const nowIso = new Date().toISOString();
    const nextList = updatePerspectiveMemoryLocalWriteProposalStatus(
      proposalList,
      selectedProposal.proposal_id,
      nextStatus,
      nowIso,
    );
    saveProposalList(nextList, `write proposal marked ${nextStatus}`);
  }

  function saveChecklistList(
    nextList: PerspectiveMemoryLocalWriteProposalReviewChecklistListV0,
    nextStatus: string,
  ) {
    setChecklistList(nextList);
    savePerspectiveMemoryLocalWriteProposalReviewChecklistListToStorage(
      window.localStorage,
      nextList,
    );
    setChecklistStatus(nextStatus);
  }

  function createLocalReviewChecklist() {
    if (!selectedProposal || !selectedProposalSourceState) {
      setChecklistStatus("select a local write proposal before creating checklist");
      return;
    }
    if (checklistForSelectedProposal) {
      setChecklistStatus(
        `selected proposal already has checklist ${checklistForSelectedProposal.checklist_id}`,
      );
      setSelectedChecklistId(checklistForSelectedProposal.checklist_id);
      setChecklistNoteDraft(checklistForSelectedProposal.local_review_notes);
      return;
    }
    const nowIso = new Date().toISOString();
    const checklist = buildPerspectiveMemoryLocalWriteProposalReviewChecklist({
      nowIso,
      checklistId: `local-write-proposal-checklist:${Date.now()}`,
      proposal: selectedProposal,
      proposalSourceState: selectedProposalSourceState,
    });
    const nextList =
      appendPerspectiveMemoryLocalWriteProposalReviewChecklistToList(
        checklistList,
        checklist,
        nowIso,
      );
    setSelectedChecklistId(checklist.checklist_id);
    setChecklistNoteDraft(checklist.local_review_notes);
    saveChecklistList(
      nextList,
      `local review checklist created: ${checklist.checklist_id}`,
    );
  }

  function replaceSelectedChecklist(
    checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0,
    status: string,
    nowIso: string,
  ) {
    const nextList =
      replacePerspectiveMemoryLocalWriteProposalReviewChecklistInList(
        checklistList,
        checklist,
        nowIso,
      );
    setSelectedChecklistId(checklist.checklist_id);
    saveChecklistList(nextList, status);
  }

  function updateSelectedChecklistGate(
    gateId: PerspectiveMemoryLocalWriteProposalReviewChecklistGateId,
    checked: boolean,
  ) {
    if (!displayChecklist) {
      setChecklistStatus("select a local review checklist before changing gates");
      return;
    }
    const nowIso = new Date().toISOString();
    const checklist =
      updatePerspectiveMemoryLocalWriteProposalReviewChecklistGate({
        checklist: displayChecklist,
        proposalList,
        queue,
        nowIso,
        gateId,
        status: checked ? "checked" : "unchecked",
      });
    replaceSelectedChecklist(
      checklist,
      `checklist gate ${gateId} marked ${checked ? "checked" : "unchecked"}`,
      nowIso,
    );
  }

  function markChecklistInReview() {
    if (!displayChecklist) {
      setChecklistStatus("select a local review checklist before marking in review");
      return;
    }
    const nowIso = new Date().toISOString();
    const checklist =
      markPerspectiveMemoryLocalWriteProposalReviewChecklistInReview({
        checklist: displayChecklist,
        proposalList,
        queue,
        nowIso,
      });
    replaceSelectedChecklist(checklist, "checklist marked in_review", nowIso);
  }

  function recomputeSelectedChecklistReadiness() {
    if (!displayChecklist) {
      setChecklistStatus("select a local review checklist before recomputing");
      return;
    }
    const nowIso = new Date().toISOString();
    const checklist = recomputePerspectiveMemoryLocalWriteProposalReviewChecklist({
      checklist: displayChecklist,
      proposalList,
      queue,
      nowIso,
    });
    replaceSelectedChecklist(checklist, "checklist readiness recomputed", nowIso);
  }

  function markChecklistReady() {
    if (!displayChecklist) {
      setChecklistStatus("select a local review checklist before marking ready");
      return;
    }
    const nowIso = new Date().toISOString();
    const checklist =
      markPerspectiveMemoryLocalWriteProposalReviewChecklistReady({
        checklist: displayChecklist,
        proposalList,
        queue,
        nowIso,
      });
    replaceSelectedChecklist(
      checklist,
      checklist.readiness_summary.ready_for_product_persistence_review
        ? "checklist marked locally_ready_for_product_persistence_review"
        : "checklist is not locally ready; required gates remain incomplete",
      nowIso,
    );
  }

  function saveChecklistNote() {
    if (!displayChecklist) {
      setChecklistStatus("select a local review checklist before saving notes");
      return;
    }
    const nowIso = new Date().toISOString();
    const checklist =
      updatePerspectiveMemoryLocalWriteProposalReviewChecklistNotes({
        checklist: displayChecklist,
        proposalList,
        queue,
        nowIso,
        localReviewNotes: checklistNoteDraft,
      });
    replaceSelectedChecklist(checklist, "checklist note saved", nowIso);
  }

  function clearSelectedChecklist() {
    if (!displayChecklist) {
      setChecklistStatus("no selected local review checklist to clear");
      return;
    }
    const nowIso = new Date().toISOString();
    const nextList =
      removePerspectiveMemoryLocalWriteProposalReviewChecklistFromList(
        checklistList,
        displayChecklist.checklist_id,
        nowIso,
      );
    setSelectedChecklistId(nextList.checklists[0]?.checklist_id ?? null);
    setChecklistNoteDraft(nextList.checklists[0]?.local_review_notes ?? "");
    saveChecklistList(nextList, "selected local review checklist cleared");
  }

  function clearAllChecklists() {
    const nowIso = new Date().toISOString();
    const nextList =
      createEmptyPerspectiveMemoryLocalWriteProposalReviewChecklistList(nowIso);
    clearPerspectiveMemoryLocalWriteProposalReviewChecklistListFromStorage(
      window.localStorage,
    );
    setSelectedChecklistId(null);
    setChecklistList(nextList);
    setChecklistNoteDraft("");
    setChecklistStatus("all local review checklists cleared");
  }

  function clearSelectedProposal() {
    if (!selectedProposal) {
      setProposalStatus("no selected local write proposal to clear");
      return;
    }
    const nowIso = new Date().toISOString();
    const nextList = removePerspectiveMemoryLocalWriteProposalFromList(
      proposalList,
      selectedProposal.proposal_id,
      nowIso,
    );
    setSelectedProposalId(nextList.proposals[0]?.proposal_id ?? null);
    setSelectedChecklistId(
      nextList.proposals[0]
        ? findPerspectiveMemoryLocalWriteProposalReviewChecklistByProposal(
            checklistList,
            nextList.proposals[0].proposal_id,
          )?.checklist_id ?? null
        : null,
    );
    saveProposalList(nextList, "selected local write proposal cleared");
  }

  function clearAllProposals() {
    const nowIso = new Date().toISOString();
    const nextList = createEmptyPerspectiveMemoryLocalWriteProposalList(nowIso);
    clearPerspectiveMemoryLocalWriteProposalListFromStorage(window.localStorage);
    setSelectedProposalId(null);
    setProposalList(nextList);
    setSelectedChecklistId(null);
    setChecklistNoteDraft("");
    setProposalStatus("all local write proposals cleared");
  }

  function clearQueue() {
    const nowIso = new Date().toISOString();
    const nextQueue = createEmptyPerspectiveMemoryLocalReviewQueue(nowIso);
    clearPerspectiveMemoryLocalReviewQueueFromStorage(window.localStorage);
    setSelectedItemId(null);
    setQueue(nextQueue);
    setQueueStatus("local memory review queue cleared");
  }

  async function createProductPersistenceBoundaryRecord() {
    if (
      !displayChecklist ||
      !selectedChecklistSourceProposal ||
      !selectedChecklistSourceQueueItem
    ) {
      setBoundaryStatus(
        "select a ready checklist, source proposal, and source queue item before creating boundary record",
      );
      return;
    }
    setBoundaryStatus("creating product persistence boundary record");
    try {
      const response = await fetch(
        PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            checklist: displayChecklist,
            proposal: selectedChecklistSourceProposal,
            queue_item: selectedChecklistSourceQueueItem,
            user_confirmation: boundaryConfirmations,
          }),
        },
      );
      const body = (await response.json()) as {
        ok?: boolean;
        result?: { record?: PerspectiveMemoryProductPersistenceBoundaryRecordV0 };
        blocked_reasons?: string[];
      };
      if (!response.ok || body.ok === false || !body.result?.record) {
        setBoundaryStatus(
          `boundary record blocked: ${
            body.blocked_reasons?.join("; ") ?? response.statusText
          }`,
        );
        return;
      }
      await loadBoundaryRecords();
      setSelectedBoundaryRecordId(body.result.record.record_id);
      setBoundaryConfirmations(emptyBoundaryConfirmations());
      setBoundaryStatus(
        `product persistence boundary record created: ${body.result.record.record_id}`,
      );
    } catch (error) {
      setBoundaryStatus(
        `boundary record create failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async function updateSelectedBoundaryStatus(
    boundary_status: PerspectiveMemoryProductPersistenceBoundaryStatus,
  ) {
    if (!selectedBoundaryRecord) {
      setBoundaryStatus("select a product persistence boundary record first");
      return;
    }
    try {
      const response = await fetch(
        `${PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE}/${encodeURIComponent(
          selectedBoundaryRecord.record_id,
        )}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ boundary_status }),
        },
      );
      const body = (await response.json()) as {
        ok?: boolean;
        result?: { record?: PerspectiveMemoryProductPersistenceBoundaryRecordV0 };
        blocked_reasons?: string[];
      };
      if (!response.ok || body.ok === false || !body.result?.record) {
        setBoundaryStatus(
          `boundary status update blocked: ${
            body.blocked_reasons?.join("; ") ?? response.statusText
          }`,
        );
        return;
      }
      await loadBoundaryRecords();
      setSelectedBoundaryRecordId(body.result.record.record_id);
      setBoundaryStatus(`boundary record marked ${boundary_status}`);
    } catch (error) {
      setBoundaryStatus(
        `boundary status update failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return (
    <main
      className={styles.shell}
      data-augnes-surface="perspective-memory-local-review-queue"
      data-augnes-memory-review-queue="local-queue-only"
    >
      <section className={styles.surface}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>Perspective Memory</p>
            <h1>Local Memory Review Queue</h1>
            <p>
              Local queue for Codex candidate drafts that need user review
              before any perspective-memory persistence decision.
            </p>
          </div>
          <div className={styles.boundaryPills} aria-label="Queue boundary">
            <span>local review state until explicit boundary record</span>
            <span>boundary record is product persistence only</span>
            <span>not accepted Augnes memory</span>
            <span>not review decision</span>
            <span>not Core decision</span>
            <span>not runtime handoff</span>
            <span>not automatic promotion</span>
          </div>
        </header>

        <section className={styles.statusStrip} aria-label="Queue status">
          <div>
            <span>route</span>
            <strong>{PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE}</strong>
          </div>
          <div>
            <span>queue item count</span>
            <strong>{String(queue.items.length)}</strong>
          </div>
          <div>
            <span>selected item</span>
            <strong>{selectedItem?.queue_item_id ?? "none"}</strong>
          </div>
          <div>
            <span>status</span>
            <strong>{queueStatus}</strong>
          </div>
        </section>

        <div className={styles.grid}>
          <section className={styles.panel} aria-label="Local queue list">
            <PanelHeader
              eyebrow="Queue"
              title="Queued Items"
              detail={PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE}
            />
            <div className={styles.filterRow} aria-label="Queue filters">
              {queueFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={classNames(
                    styles.button,
                    activeFilter === filter ? styles.activeButton : "",
                  )}
                  data-augnes-memory-queue-filter={filter}
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.button}
                data-augnes-clear-local-memory-review-queue="true"
                disabled={queue.items.length === 0}
                onClick={clearQueue}
              >
                Clear queue
              </button>
              <a
                className={styles.linkButton}
                href="/perspective/codex-former/local-adapter-operator-flow"
              >
                Back to operator flow
              </a>
            </div>
            {filteredItems.length > 0 ? (
              <div
                className={styles.itemList}
                data-augnes-local-memory-review-queue-list="true"
              >
                {filteredItems.map(({ item, sourceState }) => (
                  <QueueItemListEntry
                    key={item.queue_item_id}
                    item={item}
                    sourceState={sourceState}
                    selected={selectedItem?.queue_item_id === item.queue_item_id}
                    onSelect={() => selectQueueItem(item.queue_item_id)}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.boundaryText}>
                No queue items match the current filter.
              </p>
            )}
          </section>

          <section className={styles.panel} aria-label="Queue item detail">
            <PanelHeader
              eyebrow="Detail"
              title="Queue Item Detail"
              detail={selectedItem?.queue_status ?? "none"}
            />
            {selectedItem && selectedSourceState ? (
              <>
                <div className={styles.buttonRow}>
                  <button
                    type="button"
                    className={styles.button}
                    data-augnes-mark-reviewing-locally="true"
                    disabled={!selectedItem.review_only_actions.can_mark_reviewing}
                    onClick={() => updateSelectedQueueStatus("reviewing_locally")}
                  >
                    Mark reviewing locally
                  </button>
                  <button
                    type="button"
                    className={styles.button}
                    data-augnes-keep-for-later="true"
                    disabled={!selectedItem.review_only_actions.can_keep_for_later}
                    onClick={() => updateSelectedQueueStatus("kept_for_later")}
                  >
                    Keep for later
                  </button>
                  <button
                    type="button"
                    className={styles.button}
                    data-augnes-remove-from-queue="true"
                    disabled={
                      !selectedItem.review_only_actions.can_remove_from_queue
                    }
                    onClick={() => updateSelectedQueueStatus("removed_from_queue")}
                  >
                    Remove from queue
                  </button>
                  <button
                    type="button"
                    className={styles.button}
                    data-augnes-return-to-candidate-drafts="true"
                    disabled={
                      !selectedItem.review_only_actions
                        .can_return_to_candidate_drafts
                    }
                    onClick={() =>
                      updateSelectedQueueStatus("returned_to_candidate_drafts")
                    }
                  >
                    Return to candidate drafts, local note only
                  </button>
                </div>
                <QueueItemDetail
                  item={selectedItem}
                  sourceState={selectedSourceState}
                />
              </>
            ) : (
              <p className={styles.boundaryText}>
                Select a queue item to inspect its bounded memory candidate
                preview and local review-only controls.
              </p>
            )}
            <LocalWriteProposalPanel
              selectedItem={selectedItem}
              selectedSourceState={selectedSourceState}
              proposalList={proposalList}
              selectedProposal={selectedProposal}
              selectedProposalSourceState={selectedProposalSourceState}
              proposalForSelectedQueueItem={proposalForSelectedQueueItem}
              proposalEligibility={proposalEligibility}
              proposalStatus={proposalStatus}
              checklistList={checklistList}
              selectedChecklist={displayChecklist}
              selectedChecklistSourceProposalState={
                selectedChecklistSourceProposalState
              }
              selectedChecklistSourceQueueState={selectedChecklistSourceQueueState}
              checklistForSelectedProposal={checklistForSelectedProposal}
              checklistStatus={checklistStatus}
              checklistNoteDraft={checklistNoteDraft}
              onCreateProposal={createLocalWriteProposal}
              onSelectProposal={selectProposal}
              onMarkReviewing={() =>
                updateSelectedProposalStatus("reviewing_write_proposal")
              }
              onKeepForLater={() =>
                updateSelectedProposalStatus("kept_for_later")
              }
              onRejectLocally={() =>
                updateSelectedProposalStatus("rejected_locally")
              }
              onMarkSuperseded={() =>
                updateSelectedProposalStatus("superseded_locally")
              }
              onClearSelected={clearSelectedProposal}
              onClearAll={clearAllProposals}
              onCreateChecklist={createLocalReviewChecklist}
              onChecklistGateChange={updateSelectedChecklistGate}
              onChecklistNoteDraftChange={setChecklistNoteDraft}
              onSaveChecklistNote={saveChecklistNote}
              onMarkChecklistInReview={markChecklistInReview}
              onRecomputeChecklist={recomputeSelectedChecklistReadiness}
              onMarkChecklistReady={markChecklistReady}
              onClearSelectedChecklist={clearSelectedChecklist}
              onClearAllChecklists={clearAllChecklists}
            />
            <ProductPersistenceBoundaryPanel
              boundaryRecordList={boundaryRecordList}
              selectedBoundaryRecord={selectedBoundaryRecord}
              selectedChecklist={displayChecklist}
              boundaryEligibility={boundaryEligibility}
              boundaryStatus={boundaryStatus}
              confirmations={boundaryConfirmations}
              onConfirmationChange={(key, value) =>
                setBoundaryConfirmations((current) => ({
                  ...current,
                  [key]: value,
                }))
              }
              onCreateBoundaryRecord={createProductPersistenceBoundaryRecord}
              onSelectRecord={setSelectedBoundaryRecordId}
              onUpdateBoundaryStatus={updateSelectedBoundaryStatus}
              onReloadBoundaryRecords={loadBoundaryRecords}
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function QueueItemListEntry({
  item,
  sourceState,
  selected,
  onSelect,
}: {
  item: PerspectiveMemoryLocalReviewQueueItemV0;
  sourceState: PerspectiveMemoryLocalReviewQueueSourceState;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={classNames(styles.itemListEntry, selected ? styles.selectedItem : "")}
      data-augnes-memory-review-queue-item={item.queue_item_id}
      data-augnes-memory-review-queue-status={item.queue_status}
      data-augnes-memory-review-queue-source-state={sourceState}
    >
      <div className={styles.itemHeader}>
        <button
          type="button"
          className={styles.button}
          data-augnes-select-memory-review-queue-item={item.queue_item_id}
          aria-pressed={selected}
          onClick={onSelect}
        >
          Select item
        </button>
        <strong>{item.queue_status}</strong>
        <span>{sourceState}</span>
      </div>
      <dl className={styles.detailGrid}>
        <DetailRow label="queue_item_id" value={item.queue_item_id} />
        <DetailRow
          label="source_candidate_draft_id"
          value={item.source_candidate_draft_id}
        />
        <DetailRow
          label="local_status"
          value={item.source_candidate_local_status}
        />
        <DetailRow
          label="validation_result_state"
          value={item.source_validation_result_state}
        />
        <DetailRow label="warning_count" value={String(item.warning_count)} />
        <DetailRow
          label="pointer_warning_count"
          value={String(item.pointer_warning_count)}
        />
      </dl>
    </article>
  );
}

function QueueItemDetail({
  item,
  sourceState,
}: {
  item: PerspectiveMemoryLocalReviewQueueItemV0;
  sourceState: PerspectiveMemoryLocalReviewQueueSourceState;
}) {
  return (
    <div data-augnes-memory-review-queue-detail="true">
      <dl className={styles.detailGrid}>
        <DetailRow label="queue_item_id" value={item.queue_item_id} />
        <DetailRow label="queue_status" value={item.queue_status} />
        <DetailRow label="stale_state" value={sourceState} />
        <DetailRow
          label="source_candidate_draft_id"
          value={item.source_candidate_draft_id}
        />
        <DetailRow
          label="source_candidate_local_status"
          value={item.source_candidate_local_status}
        />
        <DetailRow
          label="source_candidate_action"
          value={item.source_candidate_action}
        />
        <DetailRow
          label="source_validation_result_state"
          value={item.source_validation_result_state}
        />
        <DetailRow
          label="source_validation_summary_hash"
          value={item.source_validation_summary_hash}
        />
        <DetailRow label="source_input_ref" value={item.source_input_ref} />
        <DetailRow label="source_input_hash" value={item.source_input_hash} />
        <DetailRow
          label="prepare_summary_ref"
          value={item.prepare_summary_ref}
        />
        <DetailRow
          label="prepare_execution_summary_hash"
          value={item.prepare_execution_summary_hash}
        />
        <DetailRow
          label="returned_envelope_hash"
          value={item.returned_envelope_hash}
        />
        <DetailRow label="warning_count" value={String(item.warning_count)} />
        <DetailRow
          label="pointer_warning_count"
          value={String(item.pointer_warning_count)}
        />
        <DetailRow
          label="changed_files_count"
          value={String(item.changed_files_count)}
        />
        <DetailRow label="created_at" value={item.created_at} />
        <DetailRow label="updated_at" value={item.updated_at} />
        <DetailRow
          label="can_create_memory_write"
          value={String(item.review_only_actions.can_create_memory_write)}
        />
        <DetailRow
          label="authority_boundary"
          value={formatQueueAuthorityBoundary(item)}
        />
      </dl>

      <section
        className={styles.preview}
        aria-label="Bounded memory candidate preview"
        data-augnes-memory-candidate-preview="true"
      >
        <PanelHeader
          eyebrow="Preview"
          title="Bounded Memory Candidate Preview"
          detail={item.memory_candidate_preview.preview_version}
        />
        <h3>{item.memory_candidate_preview.title}</h3>
        <p>{item.memory_candidate_preview.summary}</p>
        <ResultList
          title="supporting_refs"
          values={item.memory_candidate_preview.supporting_refs}
        />
        <ResultList
          title="risk_notes"
          values={item.memory_candidate_preview.risk_notes}
        />
        <ResultList
          title="unresolved_tensions"
          values={item.memory_candidate_preview.unresolved_tensions}
        />
        <DetailRow
          label="next_review_action"
          value={item.memory_candidate_preview.next_review_action}
        />
      </section>

      <p className={styles.boundaryText}>
        This queue item is local-only review material: not accepted Augnes
        memory, not review decision, not Core decision, not product DB
        persistence, not runtime handoff, and can_create_memory_write is false.
      </p>
    </div>
  );
}

function LocalWriteProposalPanel({
  selectedItem,
  selectedSourceState,
  proposalList,
  selectedProposal,
  selectedProposalSourceState,
  proposalForSelectedQueueItem,
  proposalEligibility,
  proposalStatus,
  checklistList,
  selectedChecklist,
  selectedChecklistSourceProposalState,
  selectedChecklistSourceQueueState,
  checklistForSelectedProposal,
  checklistStatus,
  checklistNoteDraft,
  onCreateProposal,
  onSelectProposal,
  onMarkReviewing,
  onKeepForLater,
  onRejectLocally,
  onMarkSuperseded,
  onClearSelected,
  onClearAll,
  onCreateChecklist,
  onChecklistGateChange,
  onChecklistNoteDraftChange,
  onSaveChecklistNote,
  onMarkChecklistInReview,
  onRecomputeChecklist,
  onMarkChecklistReady,
  onClearSelectedChecklist,
  onClearAllChecklists,
}: {
  selectedItem: PerspectiveMemoryLocalReviewQueueItemV0 | null;
  selectedSourceState: PerspectiveMemoryLocalReviewQueueSourceState | null;
  proposalList: PerspectiveMemoryLocalWriteProposalListV0;
  selectedProposal: PerspectiveMemoryLocalWriteProposalV0 | null;
  selectedProposalSourceState: PerspectiveMemoryLocalWriteProposalSourceState | null;
  proposalForSelectedQueueItem: PerspectiveMemoryLocalWriteProposalV0 | null;
  proposalEligibility: ProposalEligibility;
  proposalStatus: string;
  checklistList: PerspectiveMemoryLocalWriteProposalReviewChecklistListV0;
  selectedChecklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0 | null;
  selectedChecklistSourceProposalState:
    | PerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState
    | null;
  selectedChecklistSourceQueueState:
    | PerspectiveMemoryLocalWriteProposalSourceState
    | null;
  checklistForSelectedProposal:
    | PerspectiveMemoryLocalWriteProposalReviewChecklistV0
    | null;
  checklistStatus: string;
  checklistNoteDraft: string;
  onCreateProposal: () => void;
  onSelectProposal: (proposalId: string) => void;
  onMarkReviewing: () => void;
  onKeepForLater: () => void;
  onRejectLocally: () => void;
  onMarkSuperseded: () => void;
  onClearSelected: () => void;
  onClearAll: () => void;
  onCreateChecklist: () => void;
  onChecklistGateChange: (
    gateId: PerspectiveMemoryLocalWriteProposalReviewChecklistGateId,
    checked: boolean,
  ) => void;
  onChecklistNoteDraftChange: (value: string) => void;
  onSaveChecklistNote: () => void;
  onMarkChecklistInReview: () => void;
  onRecomputeChecklist: () => void;
  onMarkChecklistReady: () => void;
  onClearSelectedChecklist: () => void;
  onClearAllChecklists: () => void;
}) {
  const createDisabled =
    selectedItem == null ||
    selectedSourceState == null ||
    !proposalEligibility.eligible ||
    proposalForSelectedQueueItem != null;
  return (
    <section
      className={styles.proposalPanel}
      aria-label="Local write proposal panel"
      data-augnes-local-write-proposal-panel="true"
    >
      <PanelHeader
        eyebrow="Proposal"
        title="Local Memory Write Proposal"
        detail="local proposal only"
      />
      <p className={styles.boundaryText}>
        This is not a memory write. Actual memory write requires a future
        product persistence decision. The proposal remains local-only and
        can_create_memory_write remains false on the source queue item.
      </p>
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.button}
          data-augnes-create-local-memory-write-proposal="true"
          disabled={createDisabled}
          onClick={onCreateProposal}
        >
          Create local memory write proposal
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-mark-proposal-reviewing="true"
          disabled={!selectedProposal}
          onClick={onMarkReviewing}
        >
          Mark proposal reviewing locally
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-keep-proposal-for-later="true"
          disabled={!selectedProposal}
          onClick={onKeepForLater}
        >
          Keep proposal for later
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-reject-proposal-locally="true"
          disabled={!selectedProposal}
          onClick={onRejectLocally}
        >
          Reject proposal locally
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-supersede-proposal-locally="true"
          disabled={!selectedProposal}
          onClick={onMarkSuperseded}
        >
          Mark proposal superseded locally
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-clear-selected-write-proposal="true"
          disabled={!selectedProposal}
          onClick={onClearSelected}
        >
          Clear selected proposal
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-clear-all-write-proposals="true"
          disabled={proposalList.proposals.length === 0}
          onClick={onClearAll}
        >
          Clear all local write proposals
        </button>
      </div>
      <dl className={styles.detailGrid}>
        <DetailRow
          label="proposal_storage_namespace"
          value={PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE}
        />
        <DetailRow
          label="proposal_list_count"
          value={String(proposalList.proposals.length)}
        />
        <DetailRow label="proposal_status_note" value={proposalStatus} />
        <DetailRow
          label="selected_queue_item_id"
          value={selectedItem?.queue_item_id ?? "none"}
        />
        <DetailRow
          label="selected_queue_source_state"
          value={selectedSourceState ?? "not_checked"}
        />
        <DetailRow
          label="selected_queue_item_has_proposal"
          value={String(proposalForSelectedQueueItem != null)}
        />
        <DetailRow
          label="selected_queue_item_proposal_id"
          value={proposalForSelectedQueueItem?.proposal_id ?? "none"}
        />
        <DetailRow
          label="selected_queue_item_proposal_status"
          value={proposalForSelectedQueueItem?.proposal_status ?? "none"}
        />
      </dl>
      <ResultList
        title="write_proposal_blocked_reasons"
        values={
          proposalEligibility.eligible
            ? []
            : proposalEligibility.blocked_reasons
        }
      />

      {proposalList.proposals.length > 0 ? (
        <div
          className={styles.proposalList}
          data-augnes-local-write-proposal-list="true"
        >
          {proposalList.proposals.map((proposal) => {
            const sourceState =
              selectedProposal?.proposal_id === proposal.proposal_id
                ? selectedProposalSourceState
                : null;
            return (
              <article
                key={proposal.proposal_id}
                className={classNames(
                  styles.itemListEntry,
                  selectedProposal?.proposal_id === proposal.proposal_id
                    ? styles.selectedItem
                    : "",
                )}
                data-augnes-local-write-proposal-id={proposal.proposal_id}
                data-augnes-local-write-proposal-status={
                  proposal.proposal_status
                }
              >
                <div className={styles.itemHeader}>
                  <button
                    type="button"
                    className={styles.button}
                    data-augnes-select-local-write-proposal={
                      proposal.proposal_id
                    }
                    aria-pressed={
                      selectedProposal?.proposal_id === proposal.proposal_id
                    }
                    onClick={() => onSelectProposal(proposal.proposal_id)}
                  >
                    Select proposal
                  </button>
                  <strong>{proposal.proposal_status}</strong>
                  <span>{sourceState ?? "source_state_not_selected"}</span>
                </div>
                <dl className={styles.detailGrid}>
                  <DetailRow
                    label="proposal_id"
                    value={proposal.proposal_id}
                  />
                  <DetailRow
                    label="source_queue_item_id"
                    value={proposal.source_queue_item_id}
                  />
                  <DetailRow
                    label="source_validation_result_state"
                    value={proposal.source_validation_result_state}
                  />
                  <DetailRow
                    label="checklist_status"
                    value={
                      findPerspectiveMemoryLocalWriteProposalReviewChecklistByProposal(
                        checklistList,
                        proposal.proposal_id,
                      )?.checklist_status ?? "none"
                    }
                  />
                  <DetailRow
                    label="should_write_to_memory_now"
                    value={String(
                      proposal.proposed_memory_payload
                        .should_write_to_memory_now,
                    )}
                  />
                </dl>
              </article>
            );
          })}
        </div>
      ) : (
        <p className={styles.boundaryText}>
          No local memory write proposals have been created in{" "}
          {PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE}.
        </p>
      )}

      {selectedProposal && selectedProposalSourceState ? (
        <>
          <LocalWriteProposalDetail
            proposal={selectedProposal}
            sourceState={selectedProposalSourceState}
            checklist={checklistForSelectedProposal}
          />
          <LocalWriteProposalReviewChecklistPanel
            selectedProposal={selectedProposal}
            selectedProposalSourceState={selectedProposalSourceState}
            checklistList={checklistList}
            selectedChecklist={selectedChecklist}
            selectedChecklistSourceProposalState={
              selectedChecklistSourceProposalState
            }
            selectedChecklistSourceQueueState={selectedChecklistSourceQueueState}
            checklistForSelectedProposal={checklistForSelectedProposal}
            checklistStatus={checklistStatus}
            checklistNoteDraft={checklistNoteDraft}
            onCreateChecklist={onCreateChecklist}
            onChecklistGateChange={onChecklistGateChange}
            onChecklistNoteDraftChange={onChecklistNoteDraftChange}
            onSaveChecklistNote={onSaveChecklistNote}
            onMarkChecklistInReview={onMarkChecklistInReview}
            onRecomputeChecklist={onRecomputeChecklist}
            onMarkChecklistReady={onMarkChecklistReady}
            onClearSelectedChecklist={onClearSelectedChecklist}
            onClearAllChecklists={onClearAllChecklists}
          />
        </>
      ) : null}
    </section>
  );
}

function LocalWriteProposalDetail({
  proposal,
  sourceState,
  checklist,
}: {
  proposal: PerspectiveMemoryLocalWriteProposalV0;
  sourceState: PerspectiveMemoryLocalWriteProposalSourceState;
  checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0 | null;
}) {
  return (
    <section
      className={styles.proposalDetail}
      aria-label="Local write proposal detail"
      data-augnes-local-write-proposal-detail="true"
    >
      <PanelHeader
        eyebrow="Payload"
        title="Proposed Memory Payload"
        detail={proposal.proposed_memory_payload.payload_version}
      />
      <dl className={styles.detailGrid}>
        <DetailRow label="proposal_id" value={proposal.proposal_id} />
        <DetailRow
          label="proposal_status"
          value={proposal.proposal_status}
        />
        <DetailRow
          label="review_checklist_status"
          value={checklist?.checklist_status ?? "none"}
        />
        <DetailRow label="proposal_source_state" value={sourceState} />
        <DetailRow
          label="source_queue_item_id"
          value={proposal.source_queue_item_id}
        />
        <DetailRow
          label="queue_item_status_at_creation"
          value={proposal.queue_item_status_at_creation}
        />
        <DetailRow
          label="queue_source_state_at_creation"
          value={proposal.queue_source_state_at_creation}
        />
        <DetailRow
          label="source_candidate_draft_id"
          value={proposal.source_candidate_draft_id}
        />
        <DetailRow
          label="source_validation_result_state"
          value={proposal.source_validation_result_state}
        />
        <DetailRow
          label="source_validation_summary_hash"
          value={proposal.source_validation_summary_hash}
        />
        <DetailRow label="source_input_ref" value={proposal.source_input_ref} />
        <DetailRow
          label="source_input_hash"
          value={proposal.source_input_hash}
        />
        <DetailRow
          label="prepare_summary_ref"
          value={proposal.prepare_summary_ref}
        />
        <DetailRow
          label="prepare_execution_summary_hash"
          value={proposal.prepare_execution_summary_hash}
        />
        <DetailRow
          label="returned_envelope_hash"
          value={proposal.returned_envelope_hash}
        />
        <DetailRow
          label="warning_count"
          value={String(proposal.warning_count)}
        />
        <DetailRow
          label="pointer_warning_count"
          value={String(proposal.pointer_warning_count)}
        />
        <DetailRow
          label="should_write_to_memory_now"
          value={String(
            proposal.proposed_memory_payload.should_write_to_memory_now,
          )}
        />
        <DetailRow
          label="authority_boundary"
          value={formatProposalAuthorityBoundary(proposal)}
        />
      </dl>
      <section
        className={styles.preview}
        aria-label="Proposed memory payload"
        data-augnes-proposed-memory-payload="true"
      >
        <h3>{proposal.proposed_memory_payload.title}</h3>
        <p>{proposal.proposed_memory_payload.summary}</p>
        <DetailRow
          label="memory_kind"
          value={proposal.proposed_memory_payload.memory_kind}
        />
        <DetailRow
          label="suggested_next_review_action"
          value={proposal.proposed_memory_payload.suggested_next_review_action}
        />
        <ResultList
          title="source_refs"
          values={proposal.proposed_memory_payload.source_refs}
        />
        <ResultList
          title="evidence_refs"
          values={proposal.proposed_memory_payload.evidence_refs}
        />
        <ResultList
          title="risk_notes"
          values={proposal.proposed_memory_payload.risk_notes}
        />
        <ResultList
          title="unresolved_tensions"
          values={proposal.proposed_memory_payload.unresolved_tensions}
        />
        <ResultList
          title="carry_forward_questions"
          values={proposal.proposed_memory_payload.carry_forward_questions}
        />
      </section>
      <section
        className={styles.preview}
        aria-label="Proposal diff summary"
        data-augnes-proposal-diff-summary="true"
      >
        <PanelHeader
          eyebrow="Diff"
          title="Proposal Diff Summary"
          detail="included / excluded"
        />
        <ResultList
          title="included_from_queue_item"
          values={proposal.proposal_diff_summary.included_from_queue_item}
        />
        <ResultList
          title="excluded_from_queue_item"
          values={proposal.proposal_diff_summary.excluded_from_queue_item}
        />
        <ResultList
          title="excluded_raw_material"
          values={proposal.proposal_diff_summary.excluded_raw_material}
        />
        <ResultList
          title="authority_boundary_notes"
          values={proposal.proposal_diff_summary.authority_boundary_notes}
        />
      </section>
    </section>
  );
}

function LocalWriteProposalReviewChecklistPanel({
  selectedProposal,
  selectedProposalSourceState,
  checklistList,
  selectedChecklist,
  selectedChecklistSourceProposalState,
  selectedChecklistSourceQueueState,
  checklistForSelectedProposal,
  checklistStatus,
  checklistNoteDraft,
  onCreateChecklist,
  onChecklistGateChange,
  onChecklistNoteDraftChange,
  onSaveChecklistNote,
  onMarkChecklistInReview,
  onRecomputeChecklist,
  onMarkChecklistReady,
  onClearSelectedChecklist,
  onClearAllChecklists,
}: {
  selectedProposal: PerspectiveMemoryLocalWriteProposalV0;
  selectedProposalSourceState: PerspectiveMemoryLocalWriteProposalSourceState;
  checklistList: PerspectiveMemoryLocalWriteProposalReviewChecklistListV0;
  selectedChecklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0 | null;
  selectedChecklistSourceProposalState:
    | PerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState
    | null;
  selectedChecklistSourceQueueState:
    | PerspectiveMemoryLocalWriteProposalSourceState
    | null;
  checklistForSelectedProposal:
    | PerspectiveMemoryLocalWriteProposalReviewChecklistV0
    | null;
  checklistStatus: string;
  checklistNoteDraft: string;
  onCreateChecklist: () => void;
  onChecklistGateChange: (
    gateId: PerspectiveMemoryLocalWriteProposalReviewChecklistGateId,
    checked: boolean,
  ) => void;
  onChecklistNoteDraftChange: (value: string) => void;
  onSaveChecklistNote: () => void;
  onMarkChecklistInReview: () => void;
  onRecomputeChecklist: () => void;
  onMarkChecklistReady: () => void;
  onClearSelectedChecklist: () => void;
  onClearAllChecklists: () => void;
}) {
  const canMarkReady =
    selectedChecklist?.readiness_summary.ready_for_product_persistence_review ===
    true;
  return (
    <section
      className={styles.checklistPanel}
      aria-label="Local write proposal review checklist"
      data-augnes-local-write-proposal-review-checklist-panel="true"
    >
      <PanelHeader
        eyebrow="Checklist"
        title="Local Write Proposal Review Checklist"
        detail="local checklist only"
      />
      <p className={styles.boundaryText}>
        This checklist can only mark a proposal locally ready for product
        persistence review. Actual memory write remains unavailable and requires
        future product persistence implementation.
      </p>
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.button}
          data-augnes-create-local-review-checklist="true"
          disabled={checklistForSelectedProposal != null}
          onClick={onCreateChecklist}
        >
          Create local review checklist
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-mark-checklist-in-review="true"
          disabled={!selectedChecklist}
          onClick={onMarkChecklistInReview}
        >
          Mark checklist in review
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-recompute-checklist-readiness="true"
          disabled={!selectedChecklist}
          onClick={onRecomputeChecklist}
        >
          Recompute readiness
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-mark-checklist-ready="true"
          disabled={!canMarkReady}
          onClick={onMarkChecklistReady}
        >
          Mark locally ready for product persistence review
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-clear-selected-review-checklist="true"
          disabled={!selectedChecklist}
          onClick={onClearSelectedChecklist}
        >
          Clear selected checklist
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-clear-all-review-checklists="true"
          disabled={checklistList.checklists.length === 0}
          onClick={onClearAllChecklists}
        >
          Clear all local checklists
        </button>
      </div>
      <dl className={styles.detailGrid}>
        <DetailRow
          label="checklist_storage_namespace"
          value={
            PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE
          }
        />
        <DetailRow
          label="checklist_list_count"
          value={String(checklistList.checklists.length)}
        />
        <DetailRow label="checklist_status_note" value={checklistStatus} />
        <DetailRow
          label="selected_proposal_id"
          value={selectedProposal.proposal_id}
        />
        <DetailRow
          label="selected_proposal_source_state"
          value={selectedProposalSourceState}
        />
        <DetailRow
          label="selected_proposal_has_checklist"
          value={String(checklistForSelectedProposal != null)}
        />
        <DetailRow
          label="selected_proposal_checklist_id"
          value={checklistForSelectedProposal?.checklist_id ?? "none"}
        />
        <DetailRow
          label="selected_proposal_checklist_status"
          value={checklistForSelectedProposal?.checklist_status ?? "none"}
        />
      </dl>

      {selectedChecklist ? (
        <>
          <section
            className={styles.preview}
            aria-label="Checklist readiness summary"
            data-augnes-checklist-readiness-summary="true"
          >
            <PanelHeader
              eyebrow="Readiness"
              title="Checklist Readiness"
              detail={selectedChecklist.readiness_summary.readiness_version}
            />
            <dl className={styles.detailGrid}>
              <DetailRow
                label="checklist_id"
                value={selectedChecklist.checklist_id}
              />
              <DetailRow
                label="checklist_status"
                value={selectedChecklist.checklist_status}
              />
              <DetailRow
                label="source_proposal_state"
                value={selectedChecklistSourceProposalState ?? "not_checked"}
              />
              <DetailRow
                label="source_queue_item_state"
                value={selectedChecklistSourceQueueState ?? "not_checked"}
              />
              <DetailRow
                label="ready_for_product_persistence_review"
                value={String(
                  selectedChecklist.readiness_summary
                    .ready_for_product_persistence_review,
                )}
              />
              <DetailRow
                label="ready_for_memory_write_now"
                value={String(
                  selectedChecklist.readiness_summary.ready_for_memory_write_now,
                )}
              />
              <DetailRow
                label="required_gate_count"
                value={String(selectedChecklist.required_gate_count)}
              />
              <DetailRow
                label="completed_required_gate_count"
                value={String(selectedChecklist.completed_required_gate_count)}
              />
              <DetailRow
                label="optional_gate_count"
                value={String(selectedChecklist.optional_gate_count)}
              />
              <DetailRow
                label="completed_optional_gate_count"
                value={String(selectedChecklist.completed_optional_gate_count)}
              />
              <DetailRow
                label="authority_boundary"
                value={formatChecklistAuthorityBoundary(selectedChecklist)}
              />
              <DetailRow
                label="next_action"
                value={selectedChecklist.readiness_summary.next_action}
              />
            </dl>
            <ResultList
              title="blocked_reasons"
              values={selectedChecklist.readiness_summary.blocked_reasons}
            />
            <ResultList
              title="warnings"
              values={selectedChecklist.readiness_summary.warnings}
            />
          </section>

          <section
            className={styles.gateList}
            aria-label="Checklist gates"
            data-augnes-checklist-gate-list="true"
          >
            {Object.values(selectedChecklist.gates).map((gate) => (
              <label
                key={gate.gate_id}
                className={styles.gateItem}
                data-augnes-checklist-gate-row={gate.gate_id}
              >
                <input
                  type="checkbox"
                  data-augnes-checklist-gate={gate.gate_id}
                  checked={gate.status === "checked"}
                  disabled={gate.status === "not_applicable"}
                  onChange={(event) =>
                    onChecklistGateChange(
                      gate.gate_id as PerspectiveMemoryLocalWriteProposalReviewChecklistGateId,
                      event.currentTarget.checked,
                    )
                  }
                />
                <span>
                  <strong>{gate.label}</strong>
                  <small>
                    {gate.gate_id} / {gate.required ? "required" : "optional"} /{" "}
                    {gate.status}
                  </small>
                </span>
              </label>
            ))}
          </section>

          <section className={styles.preview} aria-label="Checklist notes">
            <PanelHeader
              eyebrow="Notes"
              title="Bounded Local Review Notes"
              detail="local notes only"
            />
            <textarea
              className={styles.noteArea}
              aria-label="Checklist local review notes"
              data-augnes-checklist-local-review-notes="true"
              value={checklistNoteDraft}
              onChange={(event) =>
                onChecklistNoteDraftChange(event.currentTarget.value)
              }
            />
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.button}
                data-augnes-save-checklist-note="true"
                onClick={onSaveChecklistNote}
              >
                Save checklist note
              </button>
            </div>
          </section>
        </>
      ) : (
        <p className={styles.boundaryText}>
          No local review checklist is selected for this write proposal.
        </p>
      )}
    </section>
  );
}

function ProductPersistenceBoundaryPanel({
  boundaryRecordList,
  selectedBoundaryRecord,
  selectedChecklist,
  boundaryEligibility,
  boundaryStatus,
  confirmations,
  onConfirmationChange,
  onCreateBoundaryRecord,
  onSelectRecord,
  onUpdateBoundaryStatus,
  onReloadBoundaryRecords,
}: {
  boundaryRecordList: PerspectiveMemoryProductPersistenceBoundaryRecordListV0;
  selectedBoundaryRecord: PerspectiveMemoryProductPersistenceBoundaryRecordV0 | null;
  selectedChecklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0 | null;
  boundaryEligibility: { eligible: boolean; blocked_reasons: string[] };
  boundaryStatus: string;
  confirmations: {
    user_confirmed_not_accepted_memory: boolean;
    user_confirmed_not_core_decision: boolean;
    user_confirmed_no_automatic_promotion: boolean;
  };
  onConfirmationChange: (
    key:
      | "user_confirmed_not_accepted_memory"
      | "user_confirmed_not_core_decision"
      | "user_confirmed_no_automatic_promotion",
    value: boolean,
  ) => void;
  onCreateBoundaryRecord: () => void;
  onSelectRecord: (recordId: string) => void;
  onUpdateBoundaryStatus: (
    status: PerspectiveMemoryProductPersistenceBoundaryStatus,
  ) => void;
  onReloadBoundaryRecords: () => void;
}) {
  return (
    <section
      className={styles.boundaryPanel}
      aria-label="Product persistence boundary"
      data-augnes-product-persistence-boundary-panel="true"
    >
      <PanelHeader
        eyebrow="Product Boundary"
        title="Product Persistence Boundary"
        detail="sqlite product boundary record"
      />
      <p className={styles.boundaryText}>
        This creates a product persistence boundary record, not accepted memory.
        It does not write Augnes memory, create a Core decision, or promote
        anything automatically.
      </p>
      <dl className={styles.detailGrid}>
        <DetailRow
          label="boundary_api_route"
          value={PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE}
        />
        <DetailRow label="persistence_backend" value="sqlite:lib/db.ts" />
        <DetailRow
          label="selected_checklist_status"
          value={selectedChecklist?.checklist_status ?? "none"}
        />
        <DetailRow
          label="boundary_eligible"
          value={String(boundaryEligibility.eligible)}
        />
        <DetailRow label="boundary_status_note" value={boundaryStatus} />
        <DetailRow
          label="persisted_boundary_record_count"
          value={String(boundaryRecordList.records.length)}
        />
      </dl>
      {!boundaryEligibility.eligible ? (
        <ResultList
          title="boundary_blocked_reasons"
          values={boundaryEligibility.blocked_reasons}
        />
      ) : null}
      <section
        className={styles.confirmationBox}
        aria-label="Boundary confirmation"
        data-augnes-product-persistence-boundary-confirmation="true"
      >
        <label className={styles.gateItem}>
          <input
            type="checkbox"
            data-augnes-confirm-not-accepted-memory="true"
            checked={confirmations.user_confirmed_not_accepted_memory}
            onChange={(event) =>
              onConfirmationChange(
                "user_confirmed_not_accepted_memory",
                event.currentTarget.checked,
              )
            }
          />
          <span>I understand this is not accepted Augnes memory</span>
        </label>
        <label className={styles.gateItem}>
          <input
            type="checkbox"
            data-augnes-confirm-not-core-decision="true"
            checked={confirmations.user_confirmed_not_core_decision}
            onChange={(event) =>
              onConfirmationChange(
                "user_confirmed_not_core_decision",
                event.currentTarget.checked,
              )
            }
          />
          <span>I understand this is not a Core decision</span>
        </label>
        <label className={styles.gateItem}>
          <input
            type="checkbox"
            data-augnes-confirm-no-automatic-promotion="true"
            checked={confirmations.user_confirmed_no_automatic_promotion}
            onChange={(event) =>
              onConfirmationChange(
                "user_confirmed_no_automatic_promotion",
                event.currentTarget.checked,
              )
            }
          />
          <span>
            I understand this will not automatically promote or write memory
          </span>
        </label>
      </section>
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.button}
          data-augnes-create-product-persistence-boundary-record="true"
          disabled={!boundaryEligibility.eligible}
          onClick={onCreateBoundaryRecord}
        >
          Create product persistence boundary record
        </button>
        <button
          type="button"
          className={styles.button}
          data-augnes-reload-product-persistence-boundary-records="true"
          onClick={onReloadBoundaryRecords}
        >
          Reload persisted boundary records
        </button>
        <Link
          className={styles.linkButton}
          href={PERSPECTIVE_MEMORY_BOUNDARY_REVIEW_INBOX_ROUTE}
          data-augnes-open-boundary-review-inbox="true"
        >
          Open persisted boundary review inbox
        </Link>
      </div>

      <section
        className={styles.preview}
        aria-label="Persisted boundary record list"
        data-augnes-product-persistence-boundary-record-list="true"
      >
        <PanelHeader
          eyebrow="Records"
          title="Persisted Boundary Records"
          detail={boundaryRecordList.boundary_record_list_version}
        />
        {boundaryRecordList.records.length > 0 ? (
          <div className={styles.itemList}>
            {boundaryRecordList.records.map((record) => (
              <article
                key={record.record_id}
                className={classNames(
                  styles.itemListEntry,
                  selectedBoundaryRecord?.record_id === record.record_id
                    ? styles.selectedItem
                    : "",
                )}
                data-augnes-product-persistence-boundary-record={record.record_id}
                data-augnes-product-persistence-boundary-status={
                  record.boundary_status
                }
              >
                <div className={styles.itemHeader}>
                  <button
                    type="button"
                    className={styles.button}
                    data-augnes-select-product-persistence-boundary-record={
                      record.record_id
                    }
                    aria-pressed={
                      selectedBoundaryRecord?.record_id === record.record_id
                    }
                    onClick={() => onSelectRecord(record.record_id)}
                  >
                    Select record
                  </button>
                  <strong>{record.boundary_status}</strong>
                </div>
                <dl className={styles.detailGrid}>
                  <DetailRow label="record_id" value={record.record_id} />
                  <DetailRow
                    label="source_checklist_id"
                    value={record.source_checklist_id}
                  />
                  <DetailRow
                    label="source_proposal_id"
                    value={record.source_proposal_id}
                  />
                  <DetailRow
                    label="validation_result"
                    value={record.source_validation_result_state}
                  />
                  <DetailRow label="updated_at" value={record.updated_at} />
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.boundaryText}>
            No product persistence boundary records have been created yet.
          </p>
        )}
      </section>

      {selectedBoundaryRecord ? (
        <section
          className={styles.preview}
          aria-label="Persisted boundary record detail"
          data-augnes-product-persistence-boundary-record-detail="true"
        >
          <PanelHeader
            eyebrow="Record Detail"
            title="Product Boundary Record Detail"
            detail={selectedBoundaryRecord.record_version}
          />
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.button}
              data-augnes-boundary-status-reviewing="true"
              onClick={() =>
                onUpdateBoundaryStatus("locally_reviewing_boundary_record")
              }
            >
              Mark boundary reviewing locally
            </button>
            <button
              type="button"
              className={styles.button}
              data-augnes-boundary-status-kept-for-later="true"
              onClick={() => onUpdateBoundaryStatus("kept_for_later")}
            >
              Keep boundary for later
            </button>
            <button
              type="button"
              className={styles.button}
              data-augnes-boundary-status-retracted="true"
              onClick={() =>
                onUpdateBoundaryStatus("retracted_before_memory_write")
              }
            >
              Retract before memory write
            </button>
          </div>
          <dl className={styles.detailGrid}>
            <DetailRow label="record_id" value={selectedBoundaryRecord.record_id} />
            <DetailRow
              label="boundary_status"
              value={selectedBoundaryRecord.boundary_status}
            />
            <DetailRow
              label="source_checklist_id"
              value={selectedBoundaryRecord.source_checklist_id}
            />
            <DetailRow
              label="source_proposal_id"
              value={selectedBoundaryRecord.source_proposal_id}
            />
            <DetailRow
              label="source_queue_item_id"
              value={selectedBoundaryRecord.source_queue_item_id}
            />
            <DetailRow
              label="source_candidate_draft_id"
              value={selectedBoundaryRecord.source_candidate_draft_id}
            />
            <DetailRow
              label="source_validation_result_state"
              value={selectedBoundaryRecord.source_validation_result_state}
            />
            <DetailRow
              label="source_validation_summary_hash"
              value={selectedBoundaryRecord.source_validation_summary_hash}
            />
            <DetailRow
              label="source_input_ref"
              value={selectedBoundaryRecord.source_input_ref}
            />
            <DetailRow
              label="source_input_hash"
              value={selectedBoundaryRecord.source_input_hash}
            />
            <DetailRow
              label="prepare_summary_ref"
              value={selectedBoundaryRecord.prepare_summary_ref}
            />
            <DetailRow
              label="prepare_execution_summary_hash"
              value={selectedBoundaryRecord.prepare_execution_summary_hash}
            />
            <DetailRow
              label="returned_envelope_hash"
              value={selectedBoundaryRecord.returned_envelope_hash}
            />
            <DetailRow
              label="checklist_ready_for_product_persistence_review"
              value={String(
                selectedBoundaryRecord
                  .checklist_ready_for_product_persistence_review,
              )}
            />
            <DetailRow
              label="checklist_ready_for_memory_write_now"
              value={String(
                selectedBoundaryRecord.checklist_ready_for_memory_write_now,
              )}
            />
            <DetailRow
              label="can_create_accepted_memory"
              value={String(
                selectedBoundaryRecord.next_allowed_actions
                  .can_create_accepted_memory,
              )}
            />
            <DetailRow
              label="can_create_core_decision"
              value={String(
                selectedBoundaryRecord.next_allowed_actions
                  .can_create_core_decision,
              )}
            />
            <DetailRow
              label="can_auto_promote"
              value={String(
                selectedBoundaryRecord.next_allowed_actions.can_auto_promote,
              )}
            />
            <DetailRow
              label="user_confirmation"
              value={formatBoundaryUserConfirmation(selectedBoundaryRecord)}
            />
            <DetailRow
              label="authority_boundary"
              value={formatBoundaryAuthorityBoundary(selectedBoundaryRecord)}
            />
          </dl>
          <section
            className={styles.preview}
            aria-label="Boundary proposed memory payload"
            data-augnes-boundary-proposed-memory-payload="true"
          >
            <h3>{selectedBoundaryRecord.proposed_memory_payload.title}</h3>
            <p>{selectedBoundaryRecord.proposed_memory_payload.summary}</p>
            <DetailRow
              label="should_write_to_memory_now"
              value={String(
                selectedBoundaryRecord.proposed_memory_payload
                  .should_write_to_memory_now,
              )}
            />
            <ResultList
              title="source_refs"
              values={selectedBoundaryRecord.proposed_memory_payload.source_refs}
            />
            <ResultList
              title="evidence_refs"
              values={selectedBoundaryRecord.proposed_memory_payload.evidence_refs}
            />
            <ResultList
              title="risk_notes"
              values={selectedBoundaryRecord.proposed_memory_payload.risk_notes}
            />
            <ResultList
              title="unresolved_tensions"
              values={
                selectedBoundaryRecord.proposed_memory_payload.unresolved_tensions
              }
            />
            <ResultList
              title="carry_forward_questions"
              values={
                selectedBoundaryRecord.proposed_memory_payload
                  .carry_forward_questions
              }
            />
          </section>
          <section
            className={styles.preview}
            aria-label="Boundary checklist gate summary"
            data-augnes-boundary-checklist-gate-summary="true"
          >
            <PanelHeader
              eyebrow="Gate Summary"
              title="Checklist Gate Summary"
              detail="persisted boundary snapshot"
            />
            <dl className={styles.detailGrid}>
              <DetailRow
                label="required_gate_count"
                value={String(
                  selectedBoundaryRecord.checklist_gate_summary
                    .required_gate_count,
                )}
              />
              <DetailRow
                label="completed_required_gate_count"
                value={String(
                  selectedBoundaryRecord.checklist_gate_summary
                    .completed_required_gate_count,
                )}
              />
              <DetailRow
                label="optional_gate_count"
                value={String(
                  selectedBoundaryRecord.checklist_gate_summary
                    .optional_gate_count,
                )}
              />
              <DetailRow
                label="completed_optional_gate_count"
                value={String(
                  selectedBoundaryRecord.checklist_gate_summary
                    .completed_optional_gate_count,
                )}
              />
            </dl>
            <ResultList
              title="checked_required_gates"
              values={
                selectedBoundaryRecord.checklist_gate_summary
                  .checked_required_gates
              }
            />
            <ResultList
              title="not_applicable_gates"
              values={
                selectedBoundaryRecord.checklist_gate_summary
                  .not_applicable_gates
              }
            />
            <ResultList
              title="blocked_gates"
              values={selectedBoundaryRecord.checklist_gate_summary.blocked_gates}
            />
          </section>
          <section
            className={styles.preview}
            aria-label="Boundary proposal diff summary"
            data-augnes-boundary-proposal-diff-summary="true"
          >
            <PanelHeader
              eyebrow="Diff Summary"
              title="Proposal Diff Summary"
              detail="raw material remains excluded"
            />
            <ResultList
              title="included_from_queue_item"
              values={
                selectedBoundaryRecord.proposal_diff_summary
                  .included_from_queue_item
              }
            />
            <ResultList
              title="excluded_from_queue_item"
              values={
                selectedBoundaryRecord.proposal_diff_summary
                  .excluded_from_queue_item
              }
            />
            <ResultList
              title="excluded_raw_material"
              values={
                selectedBoundaryRecord.proposal_diff_summary.excluded_raw_material
              }
            />
            <ResultList
              title="authority_boundary_notes"
              values={
                selectedBoundaryRecord.proposal_diff_summary
                  .authority_boundary_notes
              }
            />
          </section>
        </section>
      ) : null}
    </section>
  );
}

function queueFilterMatches(
  filter: QueueFilter,
  item: PerspectiveMemoryLocalReviewQueueItemV0,
  sourceState: PerspectiveMemoryLocalReviewQueueSourceState,
) {
  if (filter === "all") return true;
  if (filter === "stale_or_missing_source") {
    return (
      sourceState === "source_candidate_draft_stale" ||
      sourceState === "source_candidate_draft_missing"
    );
  }
  return item.queue_status === filter;
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

function formatQueueAuthorityBoundary(
  item: PerspectiveMemoryLocalReviewQueueItemV0,
) {
  return Object.entries(item.authority_boundary)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

function formatProposalAuthorityBoundary(
  proposal: PerspectiveMemoryLocalWriteProposalV0,
) {
  return Object.entries(proposal.authority_boundary)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

function formatChecklistAuthorityBoundary(
  checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0,
) {
  return Object.entries(checklist.authority_boundary)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

function formatBoundaryAuthorityBoundary(
  record: PerspectiveMemoryProductPersistenceBoundaryRecordV0,
) {
  return Object.entries(record.authority_boundary)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

function formatBoundaryUserConfirmation(
  record: PerspectiveMemoryProductPersistenceBoundaryRecordV0,
) {
  return Object.entries(record.user_confirmation)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

function emptyBoundaryConfirmations() {
  return {
    user_confirmed_not_accepted_memory: false,
    user_confirmed_not_core_decision: false,
    user_confirmed_no_automatic_promotion: false,
  };
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
