"use client";

import { useEffect, useRef, useState } from "react";

import { ProductShell } from "@/components/product-shell";
import type { PortableProjectPreviewV01 } from "@/types/vnext/portable-project";
import styles from "./portability.module.css";

interface ImportResultV01 {
  status?: "imported" | "exact_replay";
  outcome?: "refused";
  reason_code: string;
  project_home_href?: string;
  record_count?: number;
  next_action: string;
}

export default function PortabilityPage() {
  const [preview, setPreview] = useState<PortableProjectPreviewV01 | null>(null);
  const [includePersonal, setIncludePersonal] = useState(false);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResultV01 | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    void loadPreview(controller.signal);
    return () => controller.abort();
  }, []);

  async function loadPreview(signal?: AbortSignal) {
    try {
      const response = await fetch("/api/vnext/portability", {
        cache: "no-store",
        signal,
      });
      const value = (await response.json()) as PortableProjectPreviewV01 & { reason_code?: string };
      if (!response.ok || value.contract !== "augnes.portable-project-preview.v1") {
        throw new Error(value.reason_code ?? "portable_project_preview_unavailable");
      }
      setPreview(value);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNotice("Portable scope is unavailable. Open an active project and try again.");
    }
  }

  async function exportProject() {
    setBusy("export");
    setNotice(null);
    try {
      const response = await fetch("/api/vnext/portability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export",
          include_personal_perspective: includePersonal,
        }),
      });
      if (!response.ok) {
        const refusal = (await response.json()) as ImportResultV01;
        throw new Error(refusal.reason_code);
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename = /filename="([^"]+)"/u.exec(disposition)?.[1] ?? "project.augnes-project.json";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice("Portable project package created locally. No provider or network archive was included.");
    } catch (error) {
      setNotice(`Export refused: ${humanize(error instanceof Error ? error.message : "portable_project_operation_failed")}.`);
    } finally {
      setBusy(null);
    }
  }

  async function importProject(file: File) {
    setBusy("import");
    setNotice(null);
    setImportResult(null);
    try {
      const bytes = await file.arrayBuffer();
      const response = await fetch("/api/vnext/portability", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.augnes.portable-project+json" },
        body: bytes,
      });
      const result = (await response.json()) as ImportResultV01;
      setImportResult(result);
      setNotice(
        response.ok
          ? `${humanize(result.reason_code)}. Canonical state and all three readers were verified before commit.`
          : `Import refused: ${humanize(result.reason_code)}.`,
      );
    } catch {
      setNotice("Import could not be completed. No authoritative imported state was admitted.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
      setBusy(null);
    }
  }

  return (
    <ProductShell
      surface="portability"
      projectContext={preview?.project_display_name
        ? { label: "Current project", name: preview.project_display_name }
        : null}
    >
      <main className={styles.shell} data-portability-surface="v1">
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Project continuity</p>
            <h1>Transfer project continuity</h1>
            <p>Move verified local project state between Augnes installations.</p>
          </div>
          <span className={styles.localBadge}>Local files only</span>
        </header>

        {notice ? <p className={styles.notice} role="status">{notice}</p> : null}

        <div className={styles.workspace}>
          <section className={`${styles.panel} ${styles.exportPanel}`} aria-labelledby="portable-preview-title">
        <p className={styles.eyebrow}>Export preview</p>
        <h2 id="portable-preview-title">Export current project</h2>
        <p className={styles.intro}>Canonical state travels; runtime and private material stay local.</p>
        {preview ? (
          <>
            <dl className={styles.grid}>
              <div><dt>Project</dt><dd>{preview.project_display_name ?? "Unnamed project"}</dd></div>
              <div><dt>Canonical scope</dt><dd>{preview.record_count} records</dd></div>
              <div><dt>Source lineage</dt><dd>{preview.source_lineage_record_count} records</dd></div>
              <div><dt>Personal Perspective</dt><dd>Excluded by default</dd></div>
            </dl>
            <details className={styles.scopeDetails}>
              <summary>Inspect included records and exclusions</summary>
              <p>Portable project v{preview.compatibility_version} · Personal Perspective source scope {humanize(preview.personal_perspective.source_scope)} · {preview.personal_perspective.bound_record_count} bound personal records</p>
              <h3>Included record kinds</h3>
              <ul className={styles.list}>
                {preview.record_kinds.map((kind) => (
                  <li key={kind}>{humanize(kind)} · {preview.record_counts[kind] ?? 0}</li>
                ))}
              </ul>
              <h3>Always excluded</h3>
              <ul className={styles.list}>
                {preview.excluded_categories.map((item) => <li key={item}>{humanize(item)}</li>)}
              </ul>
            </details>
            {preview.warnings.map((warning) => <p className={styles.warning} key={warning}>{warning}</p>)}
            <label className={styles.consent}>
              <input
                type="checkbox"
                data-portability-personal-consent="true"
                checked={includePersonal}
                disabled={!preview.personal_perspective.consent_available || busy !== null}
                onChange={(event) => setIncludePersonal(event.target.checked)}
              />
              Include only Personal Perspective material already admitted under this exact project scope
            </label>
            <button
              data-portability-export-action="true"
              disabled={busy !== null || !preview.export_available}
              onClick={() => void exportProject()}
            >
              {busy === "export" ? "Creating package…" : "Export project"}
            </button>
          </>
        ) : <p>Loading active project scope…</p>}
          </section>

          <section className={`${styles.panel} ${styles.importPanel}`} aria-labelledby="portable-import-title">
        <p className={styles.eyebrow}>Local import</p>
        <h2 id="portable-import-title">Import project</h2>
        <p className={styles.intro}>Validation completes before any project write.</p>
        <div className={styles.validationList} aria-label="Import safety checks">
          <span>Integrity checked</span><span>Private material refused</span><span>Atomic admission</span>
        </div>
        <label className={styles.fileControl}>
          <span>Choose a portable project file</span>
          <input
            ref={fileInput}
            type="file"
            accept=".json,.augnes-project.json,application/vnd.augnes.portable-project+json"
            disabled={busy !== null}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importProject(file);
            }}
          />
        </label>
        {busy === "import" ? <p className={styles.importState} role="status">Validating the selected package…</p> : null}
        {importResult ? (
          <div className={`${styles.result} ${importResult.outcome === "refused" ? styles.resultRefused : styles.resultSuccess}`}>
            <strong>{importResult.outcome === "refused" ? "Import refused" : importResult.status === "exact_replay" ? "Exact package already imported" : "Import verified"}</strong>
            <p>{importResult.next_action}</p>
            {importResult.record_count !== undefined ? <small>{importResult.record_count} verified canonical records</small> : null}
            {importResult.project_home_href ? <a href={importResult.project_home_href}>Open imported Project Home</a> : null}
          </div>
        ) : null}
          </section>
        </div>
      </main>
    </ProductShell>
  );
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/gu, (character) => character.toUpperCase());
}
