"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { WorkComposerDraft } from "./work-composer-draft";

// Opt in only the work-definition composers. Baselines have the same lifetime
// as their in-memory draft; nothing is stored or sent outside this document.
const baselines = new WeakMap<WorkComposerDraft, Map<string, unknown>>();
const authoredFields = new Set(["goal", "criteria", "nonGoals", "notes", "noteDraft", "noteTime", "omissions"]);

export function trackWorkPreparation(draft: WorkComposerDraft) {
  if (!baselines.has(draft)) baselines.set(draft, new Map());
}

export function observeWorkPreparationField(draft: WorkComposerDraft, key: string, value: unknown) {
  const baseline = baselines.get(draft);
  if (baseline && authoredFields.has(key) && !baseline.has(key)) baseline.set(key, value);
}

export function hasUnsavedWorkPreparation(draft: WorkComposerDraft | null | undefined): boolean {
  if (!draft || draft.get("resultSaved") === true) return false;
  const baseline = baselines.get(draft);
  if (!baseline) return false;
  // State updates replace values. Compare in memory so typing and then exactly
  // undoing an edit does not create a redundant departure warning.
  const valueOf = (key: string, value: unknown) => key === "omissions" && value && typeof value === "object"
    ? Object.entries(value).filter(([, reason]) => reason !== "").sort(([a], [b]) => a.localeCompare(b)) : value;
  return [...baseline].some(([key, value]) => draft.has(key) &&
    JSON.stringify(valueOf(key, draft.get(key))) !== JSON.stringify(valueOf(key, value)));
}

export function discardWorkPreparation(draft: WorkComposerDraft) {
  draft.clear();
  baselines.delete(draft);
}

export function useWorkPreparationLifetime() {
  const active = useRef(true);
  useLayoutEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  return useCallback(() => active.current, []);
}

export function useWorkPreparationDeparture(readDrafts: () => Iterable<WorkComposerDraft | null | undefined>) {
  const read = useRef(readDrafts);
  read.current = readDrafts;
  const hasDraft = useCallback(() => [...read.current()].some(hasUnsavedWorkPreparation), []);
  useEffect(() => {
    // Native navigation links use ordinary document navigation. The browser
    // owns stay/leave for those links, history departure, reload and tab close.
    // Same-document anchors and opening another tab do not unload this editor.
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasDraft()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasDraft]);
  // The two client-router proposal transitions bypass document unload. Their
  // owner asks before changing routes, without cancelling any pending write.
  return useCallback(() => !hasDraft() || window.confirm(
    "Leave this preparation and discard its unsaved changes? A pending save may still complete. Leaving does not cancel or undo it.",
  ), [hasDraft]);
}
