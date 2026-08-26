"use client";

import { useEffect, useRef, useState } from "react";

import {
  continuityPinTargetIdentityV01,
} from "@/lib/vnext/continuity-pins/continuity-pin-target";
import type {
  BlankStateContinuityItemV01,
} from "@/types/vnext/blank-state";
import { useContinuityPinsV01 } from "./continuity-pins-provider";

export function PinnedContinuitiesNavigation() {
  const pins = useContinuityPinsV01();
  if (!pins.collection?.pins.length) return null;
  return (
    <section
      className="continuity-pins-navigation"
      aria-labelledby="continuity-pins-navigation-title"
      data-continuity-pins-navigation="desktop"
      data-continuity-pins-revision={pins.collection.revision}
    >
      <p id="continuity-pins-navigation-title">Pinned</p>
      <PinnedList variant="desktop" />
    </section>
  );
}

export function MobilePinnedContinuities() {
  const pins = useContinuityPinsV01();
  if (!pins.collection?.pins.length) return null;
  return (
    <details
      className="continuity-pins-mobile"
      data-continuity-pins-navigation="mobile"
      data-continuity-pins-revision={pins.collection.revision}
    >
      <summary>
        <span>Pinned</span>
        <strong>{pins.collection.pins.length}</strong>
      </summary>
      <PinnedList variant="mobile" />
    </details>
  );
}

export function ContinuityPinFeedback() {
  const { feedback } = useContinuityPinsV01();
  return feedback ? (
    <p className="continuity-pin-feedback" role="status">
      {feedback}
    </p>
  ) : null;
}

export function ContinuityPinAction({
  item,
}: {
  item: BlankStateContinuityItemV01;
}) {
  const pins = useContinuityPinsV01();
  if (item.pinning.status !== "eligible") {
    return (
      <p
        className="continuity-pin-unavailable-reason"
        data-continuity-pin-eligibility="unsupported"
      >
        Pinning unavailable: {item.pinning.reason}
      </p>
    );
  }
  const target = item.pinning.target;
  const pinned = pins.is_pinned(target);
  const key = continuityPinTargetIdentityV01(target);
  const busy = pins.busy_target === key;
  return (
    <button
      type="button"
      className="continuity-pin-item-action"
      data-continuity-pin-action={pinned ? "unpin" : "pin"}
      aria-label={
        pinned
          ? `Unpin ${item.work_name} from sidebar`
          : `Pin ${item.work_name} to sidebar`
      }
      disabled={busy}
      onClick={() =>
        void (pinned
          ? pins.unpin(target, item.work_name)
          : pins.pin(item))
      }
    >
      {busy
        ? "Updating…"
        : pinned
          ? "Unpin from sidebar"
          : "Pin to sidebar"}
    </button>
  );
}

function PinnedList({ variant }: { variant: "desktop" | "mobile" }) {
  const pins = useContinuityPinsV01();
  const collection = pins.collection!;
  const listRef = useRef<HTMLOListElement>(null);
  const [reorderFocus, setReorderFocus] = useState<{
    pin_handle: string;
    direction: "up" | "down";
    after_revision: number;
  } | null>(null);
  useEffect(() => {
    if (!reorderFocus || pins.busy_target !== null) return;
    if (collection.revision < reorderFocus.after_revision) {
      setReorderFocus(null);
      return;
    }
    const controls = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(
        "[data-continuity-pin-move]",
      ) ?? [],
    ).filter(
      (candidate) =>
        candidate.closest("[data-continuity-pin-handle]")?.getAttribute(
          "data-continuity-pin-handle",
        ) === reorderFocus.pin_handle,
    );
    const requestedControl = controls.find(
      (candidate) =>
        candidate.dataset.continuityPinMove === reorderFocus.direction,
    );
    const control =
      requestedControl && !requestedControl.disabled
        ? requestedControl
        : controls.find((candidate) => !candidate.disabled);
    control?.focus();
    setReorderFocus(null);
  }, [collection.revision, pins.busy_target, reorderFocus]);
  return (
    <ol
      ref={listRef}
      className={`continuity-pins-list continuity-pins-list--${variant}`}
    >
      {collection.pins.map((pin, index) => {
        const key = continuityPinTargetIdentityV01(pin.target);
        const busy = pins.busy_target === key;
        return (
          <li
            key={pin.pin_handle}
            data-continuity-pin-handle={pin.pin_handle}
            data-continuity-pin-resolution={pin.resolution_status}
          >
            <div className="continuity-pin-destination">
              <span
                className="continuity-pin-indicator"
                aria-hidden="true"
              />
              <div>
                {pin.destination ? (
                  <a href={pin.destination}>{pin.label}</a>
                ) : (
                  <strong aria-disabled="true">{pin.label}</strong>
                )}
                <small>{pin.state_label}</small>
              </div>
            </div>
            <div
              className="continuity-pin-controls"
              role="group"
              aria-label={`Reorder or remove ${pin.label}`}
            >
              <button
                type="button"
                aria-label={`Move ${pin.label} up`}
                title="Move up"
                data-continuity-pin-move="up"
                disabled={busy || index === 0}
                onClick={async () => {
                  setReorderFocus({
                    pin_handle: pin.pin_handle,
                    direction: "up",
                    after_revision: collection.revision + 1,
                  });
                  await pins.move(pin, "up");
                }}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${pin.label} down`}
                title="Move down"
                data-continuity-pin-move="down"
                disabled={busy || index === collection.pins.length - 1}
                onClick={async () => {
                  setReorderFocus({
                    pin_handle: pin.pin_handle,
                    direction: "down",
                    after_revision: collection.revision + 1,
                  });
                  await pins.move(pin, "down");
                }}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={`Unpin ${pin.label}`}
                title="Unpin"
                data-continuity-pin-action="unpin"
                disabled={busy}
                onClick={() => void pins.unpin(pin.target, pin.label)}
              >
                ×
              </button>
            </div>
            {pin.resolution_status !== "resolved" ? (
              <div className="continuity-pin-recovery">
                {pin.exact_detail_destination ? (
                  <a href={pin.exact_detail_destination}>View exact details</a>
                ) : null}
                <button
                  type="button"
                  disabled={pins.busy_target !== null}
                  onClick={() => void pins.reload()}
                >
                  Retry resolution
                </button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
