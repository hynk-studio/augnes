"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "attention",
  busy = false,
  error = null,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "attention" | "danger";
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const busyRef = useRef(busy);
  const onCancelRef = useRef(onCancel);
  busyRef.current = busy;
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    const backgroundRegions = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".product-shell-header, .product-shell-content > :not(.product-dialog-backdrop)",
      ),
    ).filter((region) => !region.contains(dialogRef.current));
    const priorInertState = backgroundRegions.map((region) => ({
      region,
      inert: region.inert,
    }));
    backgroundRegions.forEach((region) => { region.inert = true; });
    let pageIsLeaving = false;
    function handlePageHide() {
      pageIsLeaving = true;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busyRef.current) {
        event.preventDefault();
        onCancelRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    function handleFocusIn(event: FocusEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        dialogRef.current &&
        !dialogRef.current.contains(target)
      ) {
        cancelRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("focusin", handleFocusIn);
      priorInertState.forEach(({ region, inert }) => { region.inert = inert; });
      const previousFocus = previousFocusRef.current;
      if (
        !pageIsLeaving &&
        previousFocus?.isConnected &&
        !previousFocus.matches(":disabled, [aria-disabled=\"true\"]")
      ) {
        previousFocus.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (busy) {
      dialogRef.current?.focus();
      return;
    }
    if (
      error &&
      (document.activeElement === dialogRef.current ||
        !dialogRef.current?.contains(document.activeElement))
    ) {
      cancelRef.current?.focus();
    }
  }, [busy, error, open]);

  if (!open) return null;

  return (
    <div
      className="product-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !busy) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        className="product-dialog"
        data-dialog-tone={tone}
        role="dialog"
        aria-modal="true"
        aria-busy={busy}
        aria-labelledby={titleId}
        aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
      >
        <div className="product-dialog-heading">
          <span className="product-dialog-symbol" aria-hidden="true">
            {tone === "danger" ? "!" : "i"}
          </span>
          <div>
            <p>{tone === "danger" ? "Consequential action" : "Confirm change"}</p>
            <h2 id={titleId}>{title}</h2>
          </div>
        </div>
        <p id={descriptionId}>{description}</p>
        {children ? <div className="product-dialog-detail">{children}</div> : null}
        {error ? (
          <p id={errorId} className="product-dialog-error" role="alert" aria-live="assertive">
            <strong>Action not completed.</strong> {error}
          </p>
        ) : null}
        <div className="product-dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            className="product-button product-button--secondary"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              tone === "danger"
                ? "product-button product-button--danger"
                : "product-button"
            }
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
