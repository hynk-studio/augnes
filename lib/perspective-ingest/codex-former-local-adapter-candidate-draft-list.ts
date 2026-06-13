import {
  CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE,
  collectAcceptedCandidateDraftUnsafeMarkers,
  isCodexFormerLocalAdapterAcceptedCandidateDraftStale,
  safeParseCodexFormerLocalAdapterAcceptedCandidateDraft,
  type CodexFormerLocalAdapterAcceptedCandidateDraftV0,
} from "@/lib/perspective-ingest/codex-former-local-adapter-accepted-candidate-draft";
import type {
  OperatorFlowStorage,
  OperatorFlowValidationPreview,
} from "@/lib/perspective-ingest/codex-former-local-adapter-operator-flow";

export const CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_VERSION =
  "codex_former_local_adapter_candidate_draft_list.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE =
  "augnes.codexFormer.localAdapterAcceptedCandidateDraftList.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_MAX_DRAFTS = 20;

export type CodexFormerLocalAdapterCandidateDraftListV0 = {
  list_version: typeof CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_VERSION;
  updated_at: string;
  drafts: CodexFormerLocalAdapterAcceptedCandidateDraftV0[];
};

export type CodexFormerLocalAdapterCandidateDraftListLoadResult = {
  list: CodexFormerLocalAdapterCandidateDraftListV0;
  migrated_single_draft: boolean;
  ignored_invalid_single_draft: boolean;
};

export type CodexFormerLocalAdapterCandidateDraftCurrentStatus =
  | "current_local_candidate_draft"
  | "stale_local_candidate_draft"
  | "no_current_validation";

export function createEmptyCodexFormerLocalAdapterCandidateDraftList(
  nowIso: string,
): CodexFormerLocalAdapterCandidateDraftListV0 {
  return {
    list_version: CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_VERSION,
    updated_at: nowIso,
    drafts: [],
  };
}

export function loadCodexFormerLocalAdapterCandidateDraftListFromStorage(
  storage: OperatorFlowStorage,
  nowIso: string,
): CodexFormerLocalAdapterCandidateDraftListLoadResult {
  const parsedList = safeParseCodexFormerLocalAdapterCandidateDraftList(
    storage.getItem(
      CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE,
    ),
    nowIso,
  );
  const legacySerialized = storage.getItem(
    CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE,
  );
  const legacyDraft =
    safeParseCodexFormerLocalAdapterAcceptedCandidateDraft(legacySerialized);
  const ignoredInvalidSingleDraft =
    legacySerialized != null && legacyDraft == null;
  const migratedSingleDraft =
    legacyDraft != null &&
    !parsedList.drafts.some((draft) => draft.draft_id === legacyDraft.draft_id);
  const list = normalizeCodexFormerLocalAdapterCandidateDraftList(
    {
      ...parsedList,
      drafts: legacyDraft ? [legacyDraft, ...parsedList.drafts] : parsedList.drafts,
    },
    migratedSingleDraft ? nowIso : parsedList.updated_at,
  );
  return {
    list,
    migrated_single_draft: migratedSingleDraft,
    ignored_invalid_single_draft: ignoredInvalidSingleDraft,
  };
}

export function saveCodexFormerLocalAdapterCandidateDraftListToStorage(
  storage: OperatorFlowStorage,
  list: CodexFormerLocalAdapterCandidateDraftListV0,
) {
  storage.setItem(
    CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE,
    JSON.stringify(list),
  );
}

export function clearCodexFormerLocalAdapterCandidateDraftListFromStorage(
  storage: OperatorFlowStorage,
) {
  storage.removeItem(
    CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE,
  );
  storage.removeItem(
    CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE,
  );
}

export function safeParseCodexFormerLocalAdapterCandidateDraftList(
  serialized: string | null,
  nowIso: string,
): CodexFormerLocalAdapterCandidateDraftListV0 {
  if (!serialized) {
    return createEmptyCodexFormerLocalAdapterCandidateDraftList(nowIso);
  }
  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return createEmptyCodexFormerLocalAdapterCandidateDraftList(nowIso);
    }
    if (
      parsed.list_version !==
        CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_VERSION ||
      typeof parsed.updated_at !== "string" ||
      !Array.isArray(parsed.drafts)
    ) {
      return createEmptyCodexFormerLocalAdapterCandidateDraftList(nowIso);
    }
    const drafts = parsed.drafts
      .map((draft) =>
        safeParseCodexFormerLocalAdapterAcceptedCandidateDraft(
          JSON.stringify(draft),
        ),
      )
      .filter(
        (
          draft,
        ): draft is CodexFormerLocalAdapterAcceptedCandidateDraftV0 =>
          draft != null,
      );
    return normalizeCodexFormerLocalAdapterCandidateDraftList(
      {
        list_version: CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_VERSION,
        updated_at: parsed.updated_at,
        drafts,
      },
      parsed.updated_at,
    );
  } catch {
    return createEmptyCodexFormerLocalAdapterCandidateDraftList(nowIso);
  }
}

export function appendCodexFormerLocalAdapterCandidateDraftToList(
  list: CodexFormerLocalAdapterCandidateDraftListV0,
  draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0,
  nowIso: string,
) {
  return normalizeCodexFormerLocalAdapterCandidateDraftList(
    {
      ...list,
      updated_at: nowIso,
      drafts: [draft, ...list.drafts],
    },
    nowIso,
  );
}

export function replaceCodexFormerLocalAdapterCandidateDraftInList(
  list: CodexFormerLocalAdapterCandidateDraftListV0,
  draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0,
  nowIso: string,
) {
  return normalizeCodexFormerLocalAdapterCandidateDraftList(
    {
      ...list,
      updated_at: nowIso,
      drafts: [
        draft,
        ...list.drafts.filter((item) => item.draft_id !== draft.draft_id),
      ],
    },
    nowIso,
  );
}

export function removeCodexFormerLocalAdapterCandidateDraftFromList(
  list: CodexFormerLocalAdapterCandidateDraftListV0,
  draftId: string,
  nowIso: string,
) {
  return normalizeCodexFormerLocalAdapterCandidateDraftList(
    {
      ...list,
      updated_at: nowIso,
      drafts: list.drafts.filter((draft) => draft.draft_id !== draftId),
    },
    nowIso,
  );
}

export function getCodexFormerLocalAdapterCandidateDraftCurrentStatus(
  draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0,
  currentValidation: OperatorFlowValidationPreview,
): CodexFormerLocalAdapterCandidateDraftCurrentStatus {
  if (currentValidation.validation_source !== "real_local_validate_execution") {
    return "no_current_validation";
  }
  return isCodexFormerLocalAdapterAcceptedCandidateDraftStale(
    draft,
    currentValidation,
  )
    ? "stale_local_candidate_draft"
    : "current_local_candidate_draft";
}

export function collectCodexFormerLocalAdapterCandidateDraftListUnsafeMarkers(
  list: CodexFormerLocalAdapterCandidateDraftListV0,
) {
  const markers = list.drafts.flatMap((draft) =>
    collectAcceptedCandidateDraftUnsafeMarkers(draft),
  );
  return uniqueStrings(markers);
}

function normalizeCodexFormerLocalAdapterCandidateDraftList(
  list: CodexFormerLocalAdapterCandidateDraftListV0,
  updatedAt: string,
): CodexFormerLocalAdapterCandidateDraftListV0 {
  const dedupedDrafts = new Map<
    string,
    CodexFormerLocalAdapterAcceptedCandidateDraftV0
  >();
  for (const draft of list.drafts) {
    if (collectAcceptedCandidateDraftUnsafeMarkers(draft).length > 0) {
      continue;
    }
    if (!dedupedDrafts.has(draft.draft_id)) {
      dedupedDrafts.set(draft.draft_id, draft);
    }
  }
  return {
    list_version: CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_VERSION,
    updated_at: updatedAt,
    drafts: Array.from(dedupedDrafts.values())
      .sort((left, right) =>
        draftSortValue(right).localeCompare(draftSortValue(left)),
      )
      .slice(0, CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_MAX_DRAFTS),
  };
}

function draftSortValue(
  draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0,
) {
  return draft.updated_at || draft.created_at || "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}
