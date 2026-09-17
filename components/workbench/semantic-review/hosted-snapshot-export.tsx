"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectWorkInitializationV01 } from "@/types/vnext/project-work-initialization";
import styles from "./semantic-review.module.css";

const FILENAME = "augnes-hosted-research-projection.v0.2.json";

export function HostedSnapshotExport({ initialization, disabled }: {
  initialization: ProjectWorkInitializationV01;
  disabled: boolean;
}) {
  const pending = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null);
  const packet = initialization.current_packet;
  const available = !disabled && Boolean(initialization.current_work && packet &&
    initialization.active_project_id === initialization.project_id &&
    initialization.active_selection_revision !== null);
  const binding = JSON.stringify([initialization.workspace_id, initialization.project_id,
    initialization.active_selection_revision, packet?.packet_id, packet?.packet_fingerprint, available]);

  useEffect(() => {
    setFeedback(null);
    setBusy(false);
    return () => {
      pending.current?.abort();
      pending.current = null;
    };
  }, [binding]);

  async function download() {
    if (!available || !packet || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setFeedback(null);
    let failure = "Snapshot could not be downloaded. Refresh and try again.";
    try {
      const response = await fetch("/api/vnext/operator/project-continuity", {
        method: "POST", cache: "no-store", credentials: "same-origin",
        headers: { "content-type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({
          action: "export_hosted_snapshot",
          expected_active_project_id: initialization.project_id,
          expected_active_selection_revision: initialization.active_selection_revision,
          expected_current_packet_id: packet.packet_id,
          expected_current_packet_fingerprint: packet.packet_fingerprint,
        }),
      });
      if (!response.ok) {
        const body = await response.json();
        failure = body.error_code === "hosted_snapshot_unsafe_projection_metadata"
          ? "This work contains metadata that cannot be exported. Review its title and work definition."
          : "Snapshot unavailable. Refresh the current work and try again.";
        throw new Error("snapshot_refused");
      }
      if (response.headers.get("content-disposition") !== `attachment; filename="${FILENAME}"` ||
        !response.headers.get("content-type")?.startsWith("application/json")) {
        failure = "Snapshot response could not be confirmed. Refresh and try again.";
        throw new Error("snapshot_response_invalid");
      }
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      try {
        anchor.href = url;
        anchor.download = FILENAME;
        anchor.click();
      } finally {
        URL.revokeObjectURL(url);
        anchor.remove();
      }
      setFeedback({ error: false, text: "Snapshot download started. It is not live-synced after export." });
    } catch {
      if (!controller.signal.aborted) setFeedback({ error: true, text: failure });
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  }

  return <div data-hosted-snapshot-export>
    <p className={styles.muted}>
      Export current work and its selected source context as a non-authoritative snapshot
      for the private Augnes Research Workbench. It is not live-synced after export.
    </p>
    <button type="button" className={styles.secondaryButton} data-hosted-snapshot-action="export"
      disabled={!available || busy} onClick={() => void download()}>
      {busy ? "Preparing snapshot…" : "Export hosted snapshot (.json)"}
    </button>
    {feedback ? <p className={feedback.error ? styles.error : styles.muted}
      role={feedback.error ? "alert" : "status"}>{feedback.text}</p> : null}
  </div>;
}
