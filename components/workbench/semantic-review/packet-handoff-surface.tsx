"use client";

import { useEffect, useMemo, useState } from "react";

import type { VNextOperatorPilotPacketHandoffV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";

import styles from "./semantic-review.module.css";

const PACKET_HANDOFF_ROUTE = "/api/vnext/operator/packet-handoff";

interface PacketHandoffMetadataResponseV01 {
  ok: true;
  status: "packet_handoff";
  handoff: VNextOperatorPilotPacketHandoffV01;
  bounded_text: string;
  packet_currentness: "fresh" | "expired";
  handoff_is_execution: false;
}

type PacketHandoffReadStateV01 =
  | { status: "loading" }
  | { status: "invalid_binding" }
  | { status: "disabled" }
  | { status: "locked"; error_code: string | null }
  | { status: "error"; error_code: string }
  | { status: "loaded"; value: PacketHandoffMetadataResponseV01 };

type LocalExportStateV01 = {
  status: "idle" | "success" | "error";
  message: string;
  fallback_text: string | null;
};

export function PacketHandoffSurface({
  packetId,
  packetFingerprint,
}: {
  packetId: string;
  packetFingerprint: string;
}) {
  const validBinding =
    packetId.length > 0 &&
    packetId.length <= 256 &&
    /^sha256:[a-f0-9]{64}$/.test(packetFingerprint);
  const metadataUrl = useMemo(
    () =>
      validBinding
        ? handoffUrl(packetId, packetFingerprint, "metadata")
        : null,
    [packetFingerprint, packetId, validBinding],
  );
  const [read, setRead] = useState<PacketHandoffReadStateV01>(
    validBinding ? { status: "loading" } : { status: "invalid_binding" },
  );
  const [copyState, setCopyState] = useState<LocalExportStateV01>({
    status: "idle",
    message: "No bounded handoff text copied.",
    fallback_text: null,
  });
  const [downloadState, setDownloadState] = useState<LocalExportStateV01>({
    status: "idle",
    message: "No bounded handoff JSON downloaded.",
    fallback_text: null,
  });

  useEffect(() => {
    if (!metadataUrl) {
      setRead({ status: "invalid_binding" });
      return;
    }
    const controller = new AbortController();
    async function load(): Promise<void> {
      setRead({ status: "loading" });
      try {
        const response = await fetch(metadataUrl!, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        const body = (await response.json()) as
          | PacketHandoffMetadataResponseV01
          | { error_code?: unknown };
        if (response.status === 404) {
          setRead({ status: "disabled" });
          return;
        }
        if (response.status === 401 || response.status === 403) {
          setRead({ status: "locked", error_code: publicErrorCode(body) });
          return;
        }
        if (!response.ok) {
          setRead({
            status: "error",
            error_code: publicErrorCode(body) ?? "packet_handoff_read_failed",
          });
          return;
        }
        if (
          !("status" in body) ||
          body.status !== "packet_handoff" ||
          body.handoff_is_execution !== false ||
          body.handoff.packet.packet_id !== packetId ||
          body.handoff.packet.packet_fingerprint !== packetFingerprint ||
          body.handoff.structured_result_instruction.packet_id !== packetId ||
          body.handoff.structured_result_instruction.packet_fingerprint !==
            packetFingerprint ||
          body.packet_currentness !== body.handoff.packet.currentness ||
          typeof body.bounded_text !== "string" ||
          body.bounded_text.length === 0 ||
          body.bounded_text.length > 32 * 1024 ||
          !authorityBoundaryIsAllFalse(body.handoff)
        ) {
          setRead({
            status: "error",
            error_code: "packet_handoff_response_invalid",
          });
          return;
        }
        setRead({ status: "loaded", value: body });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRead({ status: "error", error_code: "packet_handoff_read_failed" });
      }
    }
    void load();
    return () => controller.abort();
  }, [metadataUrl, packetFingerprint, packetId]);

  async function copyBoundedText(): Promise<void> {
    if (read.status !== "loaded") return;
    const text = read.value.bounded_text;
    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      setCopyState({
        status: "error",
        message:
          "Clipboard API is unavailable. Select the bounded fallback text manually.",
        fallback_text: text,
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopyState({
        status: "success",
        message: "Bounded packet handoff text copied locally.",
        fallback_text: null,
      });
    } catch {
      setCopyState({
        status: "error",
        message: "Clipboard write failed. Select the bounded fallback text manually.",
        fallback_text: text,
      });
    }
  }

  async function downloadBoundedJson(): Promise<void> {
    if (read.status !== "loaded") return;
    setDownloadState({
      status: "idle",
      message: "Preparing bounded JSON locally…",
      fallback_text: null,
    });
    try {
      const response = await fetch(
        handoffUrl(packetId, packetFingerprint, "json"),
        {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        },
      );
      if (!response.ok) {
        let code: string | null = null;
        try {
          code = publicErrorCode(await response.json());
        } catch {
          code = null;
        }
        setDownloadState({
          status: "error",
          message: code ?? "packet_handoff_download_failed",
          fallback_text: null,
        });
        return;
      }
      if (!response.headers.get("content-type")?.includes("application/json")) {
        setDownloadState({
          status: "error",
          message: "packet_handoff_download_content_type_invalid",
          fallback_text: null,
        });
        return;
      }
      const text = await response.text();
      if (text.length === 0 || text.length > 64 * 1024) {
        setDownloadState({
          status: "error",
          message: "packet_handoff_download_bound_invalid",
          fallback_text: null,
        });
        return;
      }
      const parsed = JSON.parse(text) as unknown;
      if (!downloadBindingMatches(parsed, read.value.handoff)) {
        setDownloadState({
          status: "error",
          message: "packet_handoff_download_binding_mismatch",
          fallback_text: null,
        });
        return;
      }
      const blob = new Blob([text], { type: "application/json" });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${safeFileStem(packetId)}.handoff.json`;
      anchor.rel = "noopener";
      try {
        anchor.click();
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      }
      setDownloadState({
        status: "success",
        message: "Bounded packet handoff JSON downloaded locally.",
        fallback_text: null,
      });
    } catch {
      setDownloadState({
        status: "error",
        message: "packet_handoff_download_failed",
        fallback_text: null,
      });
    }
  }

  const privateMaterialVisible = read.status === "loaded";
  return (
    <main
      className={styles.page}
      data-vnext-packet-handoff="v0.1"
      data-vnext-private-material-rendered={String(privateMaterialVisible)}
      data-vnext-packet-handoff-state={read.status}
    >
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Augnes / exact later-context handoff</p>
            <h1>TaskContextPacket handoff</h1>
            <p className={styles.headerCopy}>
              Inspect and export one bounded, project-scoped later packet. Copying or
              downloading does not launch Codex, call a provider, execute work, mutate
              state, or prove the packet was consumed.
            </p>
          </div>
          <nav className={styles.nav} aria-label="Packet handoff navigation">
            <a href="/">Project Home</a>
            <a href="/workbench/semantic-review">Semantic Workbench</a>
          </nav>
        </header>

        <div className={styles.boundaryBand} aria-label="Packet handoff boundaries">
          <span>read-only authenticated handoff</span>
          <span>copy is not consumption</span>
          <span>handoff is not execution</span>
          <span>no provider call</span>
        </div>

        {read.status !== "loaded" ? (
          <section className={styles.lockedPanel} aria-live="polite">
            <div className={styles.panelHeader}>
              <p className={styles.kicker}>Private local packet</p>
              <h2>Authenticated project session required</h2>
            </div>
            <p className={styles.notice}>
              {read.status === "loading"
                ? "Loading the authenticated packet handoff…"
                : read.status === "invalid_binding"
                  ? "The exact packet ID/fingerprint binding is malformed."
                  : read.status === "disabled"
                    ? "The opt-in local operator pilot is disabled. No private packet material is rendered."
                    : read.status === "locked"
                      ? "Open the Semantic Workbench and establish the configured local operator session. Local secret possession is not external identity proof."
                      : `Packet handoff unavailable: ${read.error_code}`}
            </p>
            <a className={styles.linkButton} href="/workbench/semantic-review">
              Open Semantic Workbench
            </a>
          </section>
        ) : (
          <PacketHandoffReadout
            response={read.value}
            copyState={copyState}
            downloadState={downloadState}
            onCopy={() => void copyBoundedText()}
            onDownload={() => void downloadBoundedJson()}
          />
        )}
      </div>
    </main>
  );
}

function PacketHandoffReadout({
  response,
  copyState,
  downloadState,
  onCopy,
  onDownload,
}: {
  response: PacketHandoffMetadataResponseV01;
  copyState: LocalExportStateV01;
  downloadState: LocalExportStateV01;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const { handoff } = response;
  return (
    <section
      className={styles.shell}
      data-vnext-packet-handoff-loaded="true"
      data-vnext-packet-handoff-execution="false"
      data-vnext-packet-handoff-consumption-proven="false"
    >
      <section className={styles.panel} aria-labelledby="handoff-packet-title">
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Exact packet identity</p>
          <h2 id="handoff-packet-title">Bounded later TaskContextPacket</h2>
        </div>
        <dl className={styles.statusGrid}>
          <DataPoint label="Workspace" value={handoff.workspace_id} />
          <DataPoint label="Project" value={handoff.project_id} />
          <DataPoint label="Currentness" value={handoff.packet.currentness} />
          <DataPoint
            label="Data classification"
            value={handoff.packet.data_classification}
          />
        </dl>
        <ExactValue label="Packet ID" value={handoff.packet.packet_id} />
        <ExactValue
          label="Packet fingerprint"
          value={handoff.packet.packet_fingerprint}
        />
        <dl className={styles.statusGrid}>
          <DataPoint label="Generated" value={handoff.packet.generated_at} />
          <DataPoint label="Expires" value={handoff.packet.expires_at ?? "none"} />
          <DataPoint
            label="Accepted states"
            value={String(handoff.accepted_state_refs.length)}
          />
          <DataPoint label="Execution" value="false" />
        </dl>
      </section>

      <section className={styles.panel} aria-labelledby="handoff-state-title">
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Selected accepted semantic state</p>
          <h2 id="handoff-state-title">Exact bounded state references</h2>
        </div>
        {handoff.accepted_state_refs.length === 0 ? (
          <p className={styles.empty}>No accepted-state reference is selected.</p>
        ) : (
          <ol className={styles.plainList}>
            {handoff.accepted_state_refs.map((entry) => (
              <li key={entry.entry_id}>
                <strong>{entry.entry_id}</strong>
                <span className={styles.identifier}>
                  {entry.state_ref.external_id}
                </span>
                <span className={styles.identifier}>{entry.state_fingerprint}</span>
                <span>
                  Trust {entry.state_ref.trust_class}; currentness {entry.currentness_status};
                  as of {entry.currentness_as_of ?? "unknown"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className={styles.twoColumnGrid}>
        <section className={styles.panel} aria-labelledby="handoff-constraints-title">
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Task constraints</p>
            <h2 id="handoff-constraints-title">Bounded execution fence</h2>
          </div>
          <TextList title="Required checks" items={handoff.constraints.required_checks} />
          <TextList
            title="Forbidden actions"
            items={handoff.constraints.forbidden_actions}
          />
          <p className={styles.copy}>
            Data classification: {handoff.constraints.data_classification}. Maximum
            selected entries: {handoff.constraints.context_budget.max_selected_entries ?? "unspecified"}.
          </p>
        </section>

        <section className={styles.panel} aria-labelledby="handoff-return-title">
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Required return contract</p>
            <h2 id="handoff-return-title">Structured result report</h2>
          </div>
          <p className={styles.copy}>
            {handoff.structured_result_instruction.instruction}
          </p>
          <ExactValue
            label="Required packet binding"
            value={`${handoff.structured_result_instruction.packet_id} / ${handoff.structured_result_instruction.packet_fingerprint}`}
          />
          <TextList
            title="Required fields"
            items={handoff.return_contract.required_fields}
          />
          <TextList
            title="Required checks"
            items={handoff.return_contract.required_checks}
          />
          <TextList
            title="Expected artifacts"
            items={handoff.return_contract.expected_artifacts}
          />
        </section>
      </div>

      <section className={styles.panel} aria-labelledby="handoff-export-title">
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Local bounded export</p>
          <h2 id="handoff-export-title">Copy text or download JSON</h2>
          <p className={styles.copy}>
            Both exports come from the authenticated bounded server representation. They
            contain no session token, authorization token, hidden prompt, credential,
            raw private database material, or provider invocation.
          </p>
        </div>
        <div className={styles.buttonRow}>
          <button
            className={styles.secondaryButton}
            type="button"
            data-vnext-packet-handoff-action="copy_text"
            onClick={onCopy}
          >
            Copy bounded handoff text
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            data-vnext-packet-handoff-action="download_json"
            onClick={onDownload}
          >
            Download bounded handoff JSON
          </button>
        </div>
        <p
          className={copyState.status === "error" ? styles.error : styles.muted}
          role="status"
        >
          {copyState.message}
        </p>
        <p
          className={downloadState.status === "error" ? styles.error : styles.muted}
          role="status"
        >
          {downloadState.message}
        </p>
        {copyState.fallback_text ? (
          <label className={styles.fieldLabel}>
            Manual-copy fallback
            <textarea
              className={styles.handoffFallback}
              readOnly
              value={copyState.fallback_text}
            />
          </label>
        ) : null}
        <details>
          <summary className={styles.fieldLabel}>Preview bounded handoff text</summary>
          <pre className={styles.handoffPreview}>{response.bounded_text}</pre>
        </details>
        <p className={styles.notice}>
          Export presence is not usage evidence. Only a later structured result and
          explicit ContextUseReview may assess whether this packet was actually used or
          helpful; this surface records neither.
        </p>
      </section>
    </section>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ExactValue({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.exactValue}>
      <strong>{label}</strong>
      <span className={styles.identifier}>{value}</span>
    </div>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className={styles.materialCard} aria-label={title}>
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className={styles.empty}>None supplied.</p>
      ) : (
        <ul className={styles.plainList}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function handoffUrl(
  packetId: string,
  packetFingerprint: string,
  format: "metadata" | "json" | "text",
): string {
  return `${PACKET_HANDOFF_ROUTE}?${new URLSearchParams({
    packet_id: packetId,
    packet_fingerprint: packetFingerprint,
    format,
  }).toString()}`;
}

function authorityBoundaryIsAllFalse(
  handoff: VNextOperatorPilotPacketHandoffV01,
): boolean {
  return Object.values(handoff.authority_summary).every((value) => value === false);
}

function downloadBindingMatches(
  value: unknown,
  expected: VNextOperatorPilotPacketHandoffV01,
): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const packet = record.packet;
  const authority = record.authority_summary;
  return (
    record.workspace_id === expected.workspace_id &&
    record.project_id === expected.project_id &&
    packet !== null &&
    typeof packet === "object" &&
    !Array.isArray(packet) &&
    (packet as Record<string, unknown>).packet_id === expected.packet.packet_id &&
    (packet as Record<string, unknown>).packet_fingerprint ===
      expected.packet.packet_fingerprint &&
    authority !== null &&
    typeof authority === "object" &&
    !Array.isArray(authority) &&
    Object.values(authority).every((item) => item === false)
  );
}

function safeFileStem(packetId: string): string {
  const safe = packetId.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 96);
  return safe.length > 0 ? safe : "task-context-packet";
}

function publicErrorCode(value: unknown): string | null {
  const candidate =
    value && typeof value === "object" && "error_code" in value
      ? value.error_code
      : null;
  return typeof candidate === "string" && /^[a-z0-9_:-]{1,96}$/.test(candidate)
    ? candidate
    : null;
}
