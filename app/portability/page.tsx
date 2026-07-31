"use client";

import { useEffect, useRef, useState } from "react";

import { ProductShell } from "@/components/product-shell";
import {
  SEMANTIC_SURFACE_ROLE,
  SEMANTIC_VISUAL_PRIORITY,
} from "@/lib/vnext/semantic-visual/semantic-visual-contract";
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

type PreviewStateV01 = "checking" | "available" | "unavailable";

export default function PortabilityPage() {
  const [preview, setPreview] = useState<PortableProjectPreviewV01 | null>(null);
  const [previewState, setPreviewState] =
    useState<PreviewStateV01>("checking");
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
      const value = (await response.json()) as PortableProjectPreviewV01 & {
        reason_code?: string;
      };
      if (!response.ok || value.contract !== "augnes.portable-project-preview.v1") {
        throw new Error(value.reason_code ?? "portable_project_preview_unavailable");
      }
      setPreview(value);
      setPreviewState("available");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setPreview(null);
      setPreviewState("unavailable");
      setNotice(
        error instanceof Error &&
          error.message === "portable_project_active_project_unavailable"
          ? "No current project is available to export. Import is still available."
          : "Project transfer details could not be read. Import is still available.",
      );
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
      const encodedFilename = /filename\*=UTF-8''([^;]+)/iu.exec(
        disposition,
      )?.[1];
      const filename = encodedFilename
        ? decodeURIComponent(encodedFilename)
        : /filename="([^"]+)"/u.exec(disposition)?.[1] ??
          "project.augnes-project.json";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice(
        "Local project package created. No provider or network archive was included.",
      );
    } catch (error) {
      setNotice(
        `Export was not created: ${humanize(
          error instanceof Error
            ? error.message
            : "portable_project_operation_failed",
        )}.`,
      );
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
        headers: {
          "Content-Type": "application/vnd.augnes.portable-project+json",
        },
        body: bytes,
      });
      const result = (await response.json()) as ImportResultV01;
      setImportResult(result);
      setNotice(
        response.ok
          ? result.status === "exact_replay"
            ? "This exact project package is already imported. No duplicate state was created."
            : "Import verified. The project package was admitted only after server validation."
          : `Import was not accepted: ${humanize(result.reason_code)}.`,
      );
    } catch {
      setNotice(
        "Import was not accepted. No authoritative imported state was admitted.",
      );
    } finally {
      if (fileInput.current) fileInput.current.value = "";
      setBusy(null);
    }
  }

  const imported =
    importResult?.outcome !== "refused" &&
    (importResult?.status === "imported" ||
      importResult?.status === "exact_replay");

  return (
    <ProductShell
      primaryZone={null}
      projectContext={
        preview?.project_display_name
          ? { label: "Current project", name: preview.project_display_name }
          : null
      }
    >
      <main
        className={styles.shell}
        data-portability-surface="v1"
        data-portability-preview-state={previewState}
        data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.portability}
      >
        <a className={styles.returnLink} href="/">
          Back to Continuities
        </a>
        <header
          className={styles.hero}
          data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
        >
          <p className={styles.eyebrow}>Project management</p>
          <h1>Move or import a project</h1>
          <p>
            Create a local project package for another Augnes installation, or
            import one that was already verified there.
          </p>
          <p className={styles.localNote}>Local files only</p>
        </header>

        {notice ? (
          <p
            className={styles.notice}
            role={importResult?.outcome === "refused" ? "alert" : "status"}
            data-augnes-visual-priority={
              importResult?.outcome === "refused"
                ? SEMANTIC_VISUAL_PRIORITY.risk
                : SEMANTIC_VISUAL_PRIORITY.supporting
            }
          >
            {notice}
          </p>
        ) : null}

        {imported ? (
          <section
            className={`${styles.panel} ${styles.resultPanel}`}
            data-portability-import-result={importResult.status}
            data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
            data-augnes-independent-surface="project-import-result"
          >
            <p className={styles.eyebrow}>Project package</p>
            <h2>
              {importResult.status === "exact_replay"
                ? "Project already imported"
                : "Import verified"}
            </h2>
            <p>
              {importResult.status === "exact_replay"
                ? "This exact package resolves to the existing local project."
                : "The project is ready to open after bounded validation and atomic admission."}
            </p>
            {importResult.record_count !== undefined ? (
              <small>{importResult.record_count} verified project records</small>
            ) : null}
            {importResult.project_home_href ? (
              <a
                className={styles.primaryLink}
                href={importResult.project_home_href}
                data-portability-primary-action="open-imported-project"
                data-augnes-primary-action="open-imported-project"
              >
                Open imported project
              </a>
            ) : null}
            <details className={styles.secondaryDisclosure}>
              <summary>Import a different package</summary>
              <ImportControl
                fileInput={fileInput}
                busy={busy}
                onImport={(file) => void importProject(file)}
              />
            </details>
          </section>
        ) : preview ? (
          <>
            <section
              className={`${styles.panel} ${styles.exportPanel}`}
              aria-labelledby="portable-preview-title"
              data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
              data-augnes-independent-surface="project-export"
            >
              <p className={styles.eyebrow}>Current project</p>
              <h2 id="portable-preview-title">
                {preview.project_display_name ?? "Unnamed project"}
              </h2>
              <p className={styles.intro}>
                Export this project for another local Augnes installation.
                Runtime state and private machine material stay local.
              </p>
              <p className={styles.scopeSummary}>
                {preview.record_count} verified project records are available
                for this package.
              </p>
              {preview.warnings.map((warning) => (
                <p className={styles.warning} key={warning}>
                  {warning}
                </p>
              ))}
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  data-portability-personal-consent="true"
                  checked={includePersonal}
                  disabled={
                    !preview.personal_perspective.consent_available ||
                    busy !== null
                  }
                  onChange={(event) => setIncludePersonal(event.target.checked)}
                />
                Include only Personal Perspective material already admitted
                under this exact project scope
              </label>
              <button
                className={styles.primaryButton}
                data-portability-export-action="true"
                data-portability-primary-action="export"
                data-augnes-primary-action="export"
                disabled={busy !== null || !preview.export_available}
                onClick={() => void exportProject()}
              >
                {busy === "export"
                  ? "Creating package…"
                  : "Export current project"}
              </button>
              <PackageContents preview={preview} />
            </section>

            <details
              className={styles.secondaryDisclosure}
              data-portability-import-disclosure="closed"
            >
              <summary>Import another project</summary>
              <ImportControl
                fileInput={fileInput}
                busy={busy}
                result={importResult}
                onImport={(file) => void importProject(file)}
              />
            </details>
          </>
        ) : (
          <section
            className={`${styles.panel} ${styles.importPanel}`}
            aria-labelledby="portable-import-title"
            data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
            data-augnes-independent-surface="project-import"
          >
            <p className={styles.eyebrow}>
              {previewState === "checking" ? "Checking current project" : "Local import"}
            </p>
            <h2 id="portable-import-title">Import a project package</h2>
            <p className={styles.intro}>
              {previewState === "checking"
                ? "Augnes is checking whether a current project can be exported. Import remains available."
                : "No current project is available to export. Choose a local package to import instead."}
            </p>
            <ImportControl
              fileInput={fileInput}
              busy={busy}
              result={importResult}
              primary
              onImport={(file) => void importProject(file)}
            />
            <a className={styles.secondaryLink} href="/#project-management">
              Back to Continuities to choose a folder
            </a>
          </section>
        )}
      </main>
    </ProductShell>
  );
}

function PackageContents({
  preview,
}: {
  preview: PortableProjectPreviewV01;
}) {
  return (
    <details className={styles.scopeDetails}>
      <summary>Review package contents</summary>
      <p>
        Compatibility version {preview.compatibility_version} · Personal
        Perspective source scope {humanize(preview.personal_perspective.source_scope)}
        {" · "}
        {preview.personal_perspective.bound_record_count} bound personal records
      </p>
      <h3>Included project records</h3>
      <ul className={styles.list}>
        {preview.record_kinds.map((kind) => (
          <li key={kind}>
            {humanize(kind)} · {preview.record_counts[kind] ?? 0}
          </li>
        ))}
      </ul>
      <h3>Always kept out of the package</h3>
      <ul className={styles.list}>
        {preview.excluded_categories.map((item) => (
          <li key={item}>{humanize(item)}</li>
        ))}
      </ul>
    </details>
  );
}

function ImportControl({
  fileInput,
  busy,
  result,
  primary = false,
  onImport,
}: {
  fileInput: React.RefObject<HTMLInputElement | null>;
  busy: "export" | "import" | null;
  result?: ImportResultV01 | null;
  primary?: boolean;
  onImport: (file: File) => void;
}) {
  return (
    <div className={styles.importControl}>
      <p>
        Augnes validates integrity, project scope, and every required reader
        before any project write.
      </p>
      <label
        className={`${styles.fileControl} ${
          primary ? styles.primaryFileControl : ""
        }`}
        data-portability-primary-action={primary ? "import" : undefined}
        data-augnes-primary-action={primary ? "import" : undefined}
      >
        <span>Choose a project package to import</span>
        <input
          ref={fileInput}
          type="file"
          accept=".json,.augnes-project.json,application/vnd.augnes.portable-project+json"
          disabled={busy !== null}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImport(file);
          }}
        />
      </label>
      {busy === "import" ? (
        <p className={styles.importState} role="status">
          Validating the selected package…
        </p>
      ) : null}
      {result?.outcome === "refused" ? (
        <div className={`${styles.result} ${styles.resultRefused}`} role="alert">
          <strong>Import was not accepted</strong>
          <p>
            No authoritative project state was admitted. Choose a different
            package if you want to try another explicit import.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function humanize(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/gu, (character) => character.toUpperCase());
}
