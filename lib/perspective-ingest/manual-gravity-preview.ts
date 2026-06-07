export type ManualGravityPreviewMark = "pin" | "watch" | "defer" | "boost";

export type ManualGravityPreviewOverride = {
  targetKey: string;
  targetLabel: string;
  scopeLabel: string;
  markLabels: string[];
};

export type ManualGravityPreviewConflictNotice = {
  id: string;
  label: string;
  detail: string;
};

export type ManualGravityGlobalConflictSummary =
  ManualGravityPreviewOverride & {
    noticeLabels: string[];
  };

export type ManualGravityResolutionProposalCard =
  ManualGravityPreviewOverride & {
    conflictId: string;
    conflictLabel: string;
    options: string[];
  };

export type ManualGravityLocalDraft = {
  version: "manual_gravity_draft.v0.1";
  formation_id: string;
  constellation_id: string;
  source_query: string;
  generated_at: string;
  as_of: string;
  marks_by_target: Record<string, ManualGravityPreviewMark[]>;
  saved_at: string;
};

export type ManualGravityLocalDraftStatus =
  | "unavailable"
  | "unsaved"
  | "unsaved_changes"
  | "saved_for_this_formation"
  | "restored_for_this_formation"
  | "no_matching_local_draft"
  | "cleared";

export type ManualGravityLocalDraftReceipt = {
  source_query: string;
  saved_at: string;
  mark_count: number;
  target_count: number;
};

export type ManualGravityLocalDraftStorageSnapshot = {
  available: boolean;
  rawDraftPresent: boolean;
  draft: ManualGravityLocalDraft | null;
  malformed: boolean;
  unsafeMarksIgnored: boolean;
};

export type ManualGravityLocalDraftRestoreNotice = {
  title: string;
  detail: string;
  notes: string[];
};

export type ManualGravityDraftOverwriteConfirmation = {
  existingReceipt: ManualGravityLocalDraftReceipt;
  newDraft: ManualGravityLocalDraft;
  newReceipt: ManualGravityLocalDraftReceipt;
};

export const MANUAL_GRAVITY_LOCAL_DRAFT_STORAGE_KEY =
  "augnes:perspective-constellation:manual-gravity-draft:v0.1";
export const MANUAL_GRAVITY_LOCAL_DRAFT_VERSION = "manual_gravity_draft.v0.1";

export const MANUAL_GRAVITY_PREVIEW_MARKS: {
  id: ManualGravityPreviewMark;
  actionLabel: string;
  chipLabel: string;
}[] = [
  { id: "pin", actionLabel: "Pin Preview", chipLabel: "Pinned preview" },
  { id: "watch", actionLabel: "Watch Preview", chipLabel: "Watch preview" },
  { id: "defer", actionLabel: "Defer Preview", chipLabel: "Deferred preview" },
  { id: "boost", actionLabel: "Boost Preview", chipLabel: "Boosted preview" },
];

export const MANUAL_GRAVITY_PREVIEW_MARK_IDS =
  new Set<ManualGravityPreviewMark>(
    MANUAL_GRAVITY_PREVIEW_MARKS.map((mark) => mark.id),
  );

export function hasManualGravityPreviewMarks(
  marksByTarget: Record<string, ManualGravityPreviewMark[]>,
) {
  return countManualGravityPreviewMarks(marksByTarget) > 0;
}

export function countManualGravityPreviewMarks(
  marksByTarget: Record<string, ManualGravityPreviewMark[]>,
) {
  return Object.values(marksByTarget).reduce(
    (markCount, marks) => markCount + marks.length,
    0,
  );
}

export function countManualGravityPreviewTargets(
  marksByTarget: Record<string, ManualGravityPreviewMark[]>,
) {
  return Object.values(marksByTarget).filter((marks) => marks.length > 0).length;
}

export function sanitizeManualGravityPreviewMarks(
  marksByTarget: unknown,
): Record<string, ManualGravityPreviewMark[]> {
  return sanitizeManualGravityPreviewMarksWithReport(marksByTarget)
    .marksByTarget;
}

export function sanitizeManualGravityPreviewMarksWithReport(
  marksByTarget: unknown,
): {
  marksByTarget: Record<string, ManualGravityPreviewMark[]>;
  unsafeMarksIgnored: boolean;
} {
  if (!marksByTarget || typeof marksByTarget !== "object") {
    return { marksByTarget: {}, unsafeMarksIgnored: Boolean(marksByTarget) };
  }

  const sanitizedMarks: Record<string, ManualGravityPreviewMark[]> = {};
  let unsafeMarksIgnored = false;
  for (const [targetKey, marks] of Object.entries(marksByTarget)) {
    if (typeof targetKey !== "string" || !Array.isArray(marks)) {
      unsafeMarksIgnored = true;
      continue;
    }

    const safeMarks = marks.filter(
      (mark): mark is ManualGravityPreviewMark =>
        typeof mark === "string" &&
        MANUAL_GRAVITY_PREVIEW_MARK_IDS.has(mark as ManualGravityPreviewMark),
    );
    if (safeMarks.length !== marks.length) unsafeMarksIgnored = true;
    if (safeMarks.length > 0) {
      sanitizedMarks[targetKey] = Array.from(new Set(safeMarks));
    }
  }

  return { marksByTarget: sanitizedMarks, unsafeMarksIgnored };
}

export function parseManualGravityLocalDraft(rawDraft: string | null) {
  if (!rawDraft) {
    return {
      draft: null,
      malformed: false,
      unsafeMarksIgnored: false,
    };
  }

  try {
    const parsedDraft = JSON.parse(rawDraft) as Partial<ManualGravityLocalDraft>;
    if (
      parsedDraft.version !== MANUAL_GRAVITY_LOCAL_DRAFT_VERSION ||
      typeof parsedDraft.formation_id !== "string" ||
      typeof parsedDraft.constellation_id !== "string" ||
      typeof parsedDraft.source_query !== "string" ||
      typeof parsedDraft.generated_at !== "string" ||
      typeof parsedDraft.as_of !== "string" ||
      typeof parsedDraft.saved_at !== "string"
    ) {
      return {
        draft: null,
        malformed: true,
        unsafeMarksIgnored: false,
      };
    }

    const sanitizedMarks = sanitizeManualGravityPreviewMarksWithReport(
      parsedDraft.marks_by_target,
    );
    if (!hasManualGravityPreviewMarks(sanitizedMarks.marksByTarget)) {
      return {
        draft: null,
        malformed: true,
        unsafeMarksIgnored: sanitizedMarks.unsafeMarksIgnored,
      };
    }

    return {
      draft: {
        version: MANUAL_GRAVITY_LOCAL_DRAFT_VERSION,
        formation_id: parsedDraft.formation_id,
        constellation_id: parsedDraft.constellation_id,
        source_query: parsedDraft.source_query,
        generated_at: parsedDraft.generated_at,
        as_of: parsedDraft.as_of,
        marks_by_target: sanitizedMarks.marksByTarget,
        saved_at: parsedDraft.saved_at,
      } satisfies ManualGravityLocalDraft,
      malformed: false,
      unsafeMarksIgnored: sanitizedMarks.unsafeMarksIgnored,
    };
  } catch {
    return {
      draft: null,
      malformed: true,
      unsafeMarksIgnored: false,
    };
  }
}

export function readManualGravityLocalDraftFromStorage() {
  if (typeof window === "undefined") {
    return {
      available: false,
      rawDraftPresent: false,
      draft: null,
      malformed: false,
      unsafeMarksIgnored: false,
    } satisfies ManualGravityLocalDraftStorageSnapshot;
  }

  try {
    const rawDraft = window.localStorage.getItem(
      MANUAL_GRAVITY_LOCAL_DRAFT_STORAGE_KEY,
    );
    const parsedDraft = parseManualGravityLocalDraft(rawDraft);
    return {
      available: true,
      rawDraftPresent: Boolean(rawDraft),
      draft: parsedDraft.draft,
      malformed: parsedDraft.malformed,
      unsafeMarksIgnored: parsedDraft.unsafeMarksIgnored,
    } satisfies ManualGravityLocalDraftStorageSnapshot;
  } catch {
    return {
      available: false,
      rawDraftPresent: false,
      draft: null,
      malformed: false,
      unsafeMarksIgnored: false,
    } satisfies ManualGravityLocalDraftStorageSnapshot;
  }
}

export function writeManualGravityLocalDraftToStorage(
  draft: ManualGravityLocalDraft,
) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(
      MANUAL_GRAVITY_LOCAL_DRAFT_STORAGE_KEY,
      JSON.stringify(draft),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearManualGravityLocalDraftStorage() {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.removeItem(MANUAL_GRAVITY_LOCAL_DRAFT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function getManualGravityLocalDraftReceipt(
  draft: ManualGravityLocalDraft,
): ManualGravityLocalDraftReceipt {
  return {
    source_query: draft.source_query,
    saved_at: draft.saved_at,
    mark_count: countManualGravityPreviewMarks(draft.marks_by_target),
    target_count: countManualGravityPreviewTargets(draft.marks_by_target),
  };
}

export function getManualGravityLocalDraftOverwriteReceipt(
  snapshot: ManualGravityLocalDraftStorageSnapshot,
): ManualGravityLocalDraftReceipt {
  if (snapshot.draft) {
    return getManualGravityLocalDraftReceipt(snapshot.draft);
  }

  return {
    source_query: snapshot.malformed
      ? "malformed draft ignored"
      : "browser-local draft metadata",
    saved_at: "unavailable",
    mark_count: 0,
    target_count: 0,
  };
}

export function mergeManualGravityPreviewMarks(
  currentMarks: ManualGravityPreviewMark[] | undefined,
  nextMarks: ManualGravityPreviewMark[],
) {
  return Array.from(new Set([...(currentMarks ?? []), ...nextMarks]));
}

export function getManualGravityPreviewMarkClassName(
  mark: ManualGravityPreviewMark,
) {
  if (mark === "pin") return "is-gravity-preview-pinned";
  if (mark === "watch") return "is-gravity-preview-watched";
  if (mark === "defer") return "is-gravity-preview-deferred";
  return "is-gravity-preview-boosted";
}

export function getManualGravityPreviewConflictNotices(
  marks: ManualGravityPreviewMark[],
) {
  const markSet = new Set(marks);
  const notices: ManualGravityPreviewConflictNotice[] = [];

  if (markSet.has("pin") && markSet.has("defer")) {
    notices.push({
      id: "pin_defer",
      label: "Pin + Defer",
      detail: "pinned and deferred marks both active; review context only.",
    });
  }

  if (markSet.has("boost") && markSet.has("defer")) {
    notices.push({
      id: "boost_defer",
      label: "Boost + Defer",
      detail: "boosted and deferred marks both active; no automatic resolution.",
    });
  }

  if (markSet.has("pin") && markSet.has("boost")) {
    notices.push({
      id: "pin_boost",
      label: "Pin + Boost",
      detail: "priority emphasis only; no source graph update.",
    });
  }

  if (markSet.has("watch") && markSet.has("defer")) {
    notices.push({
      id: "watch_defer",
      label: "Watch + Defer",
      detail: "watch/defer combination is allowed as local review context.",
    });
  }

  return notices;
}

export function getManualGravityResolutionProposalOptions(
  conflictId: string,
) {
  if (conflictId === "boost_defer") {
    return [
      "Option A: treat as Watch next, defer execution.",
      "Option B: keep Boost as priority signal and Defer as timing constraint.",
      "Option C: split into separate future candidates later.",
    ];
  }

  if (conflictId === "pin_defer") {
    return [
      "Option A: keep pinned as important reference, defer action.",
      "Option B: convert to Watch later in a future flow.",
    ];
  }

  if (conflictId === "pin_boost") {
    return ["Option A: keep as high-priority pinned material."];
  }

  return ["Option A: keep watched but defer near-term action."];
}

export function manualGravityLocalDraftMatchesContext(
  draft: ManualGravityLocalDraft,
  context: Omit<
    ManualGravityLocalDraft,
    "marks_by_target" | "saved_at" | "version"
  >,
) {
  return (
    draft.formation_id === context.formation_id &&
    draft.constellation_id === context.constellation_id &&
    draft.source_query === context.source_query &&
    draft.generated_at === context.generated_at &&
    draft.as_of === context.as_of
  );
}

export function getManualGravityLocalDraftContextMismatches(
  draft: ManualGravityLocalDraft,
  context: Omit<
    ManualGravityLocalDraft,
    "marks_by_target" | "saved_at" | "version"
  >,
) {
  const mismatches: string[] = [];

  if (draft.source_query !== context.source_query) {
    mismatches.push("source_query mismatch");
  }
  if (draft.formation_id !== context.formation_id) {
    mismatches.push("formation_id mismatch");
  }
  if (draft.constellation_id !== context.constellation_id) {
    mismatches.push("constellation_id mismatch");
  }
  if (
    draft.generated_at !== context.generated_at ||
    draft.as_of !== context.as_of
  ) {
    mismatches.push("as_of/generated_at mismatch");
  }

  return mismatches;
}

export function getManualGravityPreviewMissingTargetKeys(
  marksByTarget: Record<string, ManualGravityPreviewMark[]>,
  resolvableTargetKeys: Set<string>,
) {
  return Object.entries(marksByTarget)
    .filter(([, marks]) => marks.length > 0)
    .map(([targetKey]) => targetKey)
    .filter((targetKey) => !resolvableTargetKeys.has(targetKey));
}

export function filterManualGravityPreviewMarksByTargetKeys(
  marksByTarget: Record<string, ManualGravityPreviewMark[]>,
  resolvableTargetKeys: Set<string>,
) {
  return Object.entries(marksByTarget).reduce<
    Record<string, ManualGravityPreviewMark[]>
  >((filteredMarks, [targetKey, marks]) => {
    if (marks.length > 0 && resolvableTargetKeys.has(targetKey)) {
      filteredMarks[targetKey] = marks;
    }

    return filteredMarks;
  }, {});
}

export function buildManualGravityLocalDraftRestoreNotice({
  context,
  contextMismatches,
  missingTargetCount,
  status,
  storageSnapshot,
}: {
  context: Omit<
    ManualGravityLocalDraft,
    "marks_by_target" | "saved_at" | "version"
  > | null;
  contextMismatches: string[];
  missingTargetCount: number;
  status: ManualGravityLocalDraftStatus;
  storageSnapshot: ManualGravityLocalDraftStorageSnapshot | null;
}): ManualGravityLocalDraftRestoreNotice | null {
  if (!context || status === "cleared") return null;

  const boundaryNotes = [
    "Browser-local draft metadata only.",
    "No automatic migration, overwrite, or conflict resolution is applied.",
  ];

  if (!storageSnapshot?.available) {
    return {
      title: "Local draft unavailable",
      detail: "Browser-local draft metadata could not be read for this context.",
      notes: boundaryNotes,
    };
  }

  if (storageSnapshot.rawDraftPresent && storageSnapshot.malformed) {
    return {
      title: "Malformed draft ignored",
      detail:
        "The browser-local draft was ignored because it did not match the safe metadata shape.",
      notes: [
        ...(storageSnapshot.unsafeMarksIgnored
          ? ["unsafe or unknown mark ids were ignored"]
          : []),
        ...boundaryNotes,
      ],
    };
  }

  if (
    storageSnapshot.rawDraftPresent &&
    storageSnapshot.draft &&
    contextMismatches.length > 0
  ) {
    return {
      title: "No matching local draft for this formation",
      detail: "Draft exists for another source or formation.",
      notes: [...contextMismatches, ...boundaryNotes],
    };
  }

  if (!storageSnapshot.rawDraftPresent && status === "unsaved") {
    return {
      title: "No matching local draft for this formation",
      detail: "No browser-local draft metadata exists for this formation yet.",
      notes: boundaryNotes,
    };
  }

  if (
    (status === "restored_for_this_formation" ||
      status === "saved_for_this_formation") &&
    missingTargetCount > 0
  ) {
    return {
      title: "Some saved targets are not present in the current graph",
      detail:
        "Only saved target keys that resolve to the current graph are restored as visible marks.",
      notes: [`missing target count ${missingTargetCount}`, ...boundaryNotes],
    };
  }

  if (status === "restored_for_this_formation") {
    return {
      title: "Restored from browser metadata",
      detail: "Matching browser-local draft marks were restored for this formation.",
      notes: [
        ...(storageSnapshot.unsafeMarksIgnored
          ? ["unsafe or unknown mark ids were ignored"]
          : []),
        ...boundaryNotes,
      ],
    };
  }

  if (status === "saved_for_this_formation") {
    return {
      title: "Saved for this formation",
      detail: "Current Manual Gravity marks are saved as browser-local metadata.",
      notes: boundaryNotes,
    };
  }

  return null;
}
