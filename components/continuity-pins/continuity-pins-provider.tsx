"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  continuityPinTargetIdentityV01,
} from "@/lib/vnext/continuity-pins/continuity-pin-target";
import type {
  BlankStateContinuityItemV01,
} from "@/types/vnext/blank-state";
import type {
  ContinuityPinTargetRefV01,
  ProjectContinuityPinMutationResultV01,
  ProjectContinuityPinProjectionV01,
  ProjectContinuityPinV01,
} from "@/types/vnext/continuity-pins";

interface ContinuityPinsContextV01 {
  collection: ProjectContinuityPinProjectionV01 | null;
  busy_target: string | null;
  feedback: string | null;
  is_pinned: (target: ContinuityPinTargetRefV01) => boolean;
  pin: (item: BlankStateContinuityItemV01) => Promise<void>;
  unpin: (target: ContinuityPinTargetRefV01, label: string) => Promise<void>;
  move: (
    pin: ProjectContinuityPinV01,
    direction: "up" | "down",
  ) => Promise<void>;
  reload: () => Promise<void>;
}

const ContinuityPinsContext =
  createContext<ContinuityPinsContextV01 | null>(null);

export function ContinuityPinsProvider({
  initialCollection,
  children,
}: {
  initialCollection: ProjectContinuityPinProjectionV01 | null;
  children: ReactNode;
}) {
  const [collection, setCollection] =
    useState<ProjectContinuityPinProjectionV01 | null>(initialCollection);
  const [busyTarget, setBusyTarget] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!collection) return;
    const response = await fetch(
      `/api/vnext/continuity-pins?project_id=${encodeURIComponent(collection.project_id)}`,
      { cache: "no-store" },
    );
    const value = await response.json();
    if (!response.ok || !value.ok) {
      throw new Error(value.error_code ?? "continuity_pin_unavailable");
    }
    setCollection(value.collection as ProjectContinuityPinProjectionV01);
  }, [collection]);

  const mutate = useCallback(
    async (
      body: Record<string, unknown>,
      busyKey: string,
      success: (
        result: ProjectContinuityPinMutationResultV01,
      ) => string,
    ) => {
      if (!collection) return;
      setBusyTarget(busyKey);
      setFeedback(null);
      try {
        const response = await fetch("/api/vnext/continuity-pins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...body,
            project_id: collection.project_id,
            expected_revision: collection.revision,
          }),
        });
        const value = await response.json();
        if (!response.ok || !value.ok) {
          const code = String(value.error_code ?? "continuity_pin_unavailable");
          if (code === "continuity_pin_stale_write") {
            try {
              await reload();
            } catch {
              // The stale refusal remains the truthful primary result.
            }
            setFeedback(
              "Pinned changed in another view. The current project order was reloaded; try again.",
            );
            return;
          }
          if (code === "continuity_pin_target_unavailable") {
            setFeedback(
              "That continuity is unavailable now and was not pinned. Reload the current project before retrying.",
            );
            return;
          }
          if (code === "continuity_pin_project_mismatch") {
            setFeedback(
              "The current project changed. No pin was changed; reload before retrying.",
            );
            return;
          }
          throw new Error(code);
        }
        const result =
          value.result as ProjectContinuityPinMutationResultV01;
        setCollection(result.collection);
        setFeedback(success(result));
      } catch {
        setFeedback(
          "Pinned could not be updated. Nothing was silently reordered; you can retry.",
        );
      } finally {
        setBusyTarget(null);
      }
    },
    [collection, reload],
  );

  const pin = useCallback(
    async (item: BlankStateContinuityItemV01) => {
      if (item.pinning.status !== "eligible") return;
      const key = continuityPinTargetIdentityV01(item.pinning.target);
      await mutate(
        {
          action: "pin",
          source_item_id: item.item_id,
          target: item.pinning.target,
        },
        key,
        (result) =>
          result.status === "already_pinned"
            ? `${item.work_name} was already pinned to this project.`
            : `${item.work_name} is pinned to this project's sidebar.`,
      );
    },
    [mutate],
  );

  const unpin = useCallback(
    async (target: ContinuityPinTargetRefV01, label: string) => {
      const key = continuityPinTargetIdentityV01(target);
      await mutate(
        { action: "unpin", target },
        key,
        (result) =>
          result.status === "already_unpinned"
            ? `${label} was already unpinned.`
            : `${label} was removed from this project's pinned list.`,
      );
    },
    [mutate],
  );

  const move = useCallback(
    async (
      pin: ProjectContinuityPinV01,
      direction: "up" | "down",
    ) => {
      if (!collection) return;
      const index = collection.pins.findIndex(
        (candidate) => candidate.pin_handle === pin.pin_handle,
      );
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || nextIndex < 0 || nextIndex >= collection.pins.length) {
        return;
      }
      const next = [...collection.pins];
      [next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!];
      await mutate(
        {
          action: "reorder",
          target_order: next.map((candidate) => candidate.target),
        },
        continuityPinTargetIdentityV01(pin.target),
        () => `${pin.label} moved ${direction}.`,
      );
    },
    [collection, mutate],
  );

  const value = useMemo<ContinuityPinsContextV01>(
    () => ({
      collection,
      busy_target: busyTarget,
      feedback,
      is_pinned: (target) =>
        collection?.pins.some(
          (pin) =>
            continuityPinTargetIdentityV01(pin.target) ===
            continuityPinTargetIdentityV01(target),
        ) ?? false,
      pin,
      unpin,
      move,
      reload: async () => {
        setBusyTarget("reload");
        setFeedback(null);
        try {
          await reload();
          setFeedback("Pinned was reloaded from the current project.");
        } catch {
          setFeedback("Pinned could not be reloaded. The saved list was not changed.");
        } finally {
          setBusyTarget(null);
        }
      },
    }),
    [busyTarget, collection, feedback, move, pin, reload, unpin],
  );

  return (
    <ContinuityPinsContext.Provider value={value}>
      {children}
    </ContinuityPinsContext.Provider>
  );
}

export function useContinuityPinsV01(): ContinuityPinsContextV01 {
  const value = useContext(ContinuityPinsContext);
  if (!value) {
    throw new Error("continuity_pins_provider_missing");
  }
  return value;
}
