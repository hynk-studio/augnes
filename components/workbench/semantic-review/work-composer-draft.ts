"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

// Owned by one mounted project/operator editor. Never serialized, persisted,
// shared between tabs, or rendered while its authorization is unavailable.
export type WorkComposerDraft = Map<string, unknown>;

export function useWorkDraftState<T>(draft: WorkComposerDraft | undefined, key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => draft?.has(key)
    ? draft.get(key) as T : typeof initial === "function" ? (initial as () => T)() : initial);
  if (draft && !draft.has(key)) draft.set(key, value);
  const update: Dispatch<SetStateAction<T>> = next => {
    const previous = draft?.has(key) ? draft.get(key) as T : value;
    const resolved = typeof next === "function" ? (next as (previous: T) => T)(previous) : next;
    draft?.set(key, resolved);
    setValue(resolved);
  };
  return [value, update];
}
