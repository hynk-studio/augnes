#!/usr/bin/env node
// One inert publication, not a request-driven file server or method registry.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const release = JSON.parse(readFileSync(path.join(repository, "scripts/executable-reuse/workflow-cost-release.v1.json"), "utf8"));
export const PUBLICATION_DIRECTORY = "publications/workflow-cost-v1";
export const PUBLICATION_NAMES = Object.freeze(["index.html", "README.md", "manifest.json", "workflow_cost.py", "exact_linear.py"]);
const SOURCES = Object.freeze(["scripts/executable-reuse/workflow_cost.py", "scripts/executable-reuse/exact_linear.py"]);
export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

// Checked-in release pins, not hashes recomputed to bless changed source. A new
// callable/dependency requires a reviewed new release; v1 must fail on drift.
function validateRelease() {
  assert.deepEqual(Object.keys(release).sort(), ["schema", "method", "version", "source_revision", "python", "entrypoint", "members"].sort());
  assert.equal(release.schema, "augnes.workflow-cost-release.v1");
  assert.equal(release.method, "workflow-cost");
  assert.equal(release.version, "1.0.0");
  assert.equal(release.entrypoint, "workflow_cost.py");
  assert.equal(release.python, ">=3.9, standard library only");
  assert.match(release.source_revision, /^[a-f0-9]{40}$/u);
  assert.deepEqual(release.members.map((member) => member.source), SOURCES);
  assert.deepEqual(release.members.map((member) => member.name), ["workflow_cost.py", "exact_linear.py"]);
  for (const member of release.members) {
    assert.deepEqual(Object.keys(member).sort(), ["name", "source", "bytes", "sha256"].sort());
    assert.ok(Number.isSafeInteger(member.bytes) && member.bytes > 0 && member.bytes < 16_000);
    assert.match(member.sha256, /^[a-f0-9]{64}$/u);
  }
}

// Used only by the build/check command and disposable tests. Request input never
// reaches this function. Every path component is fixed and must not be a symlink.
function sourceBytes(root, member) {
  let current = realpathSync(root);
  for (const part of member.source.split("/")) {
    current = path.join(current, part);
    assert.equal(lstatSync(current).isSymbolicLink(), false, "source_symlink_refused");
  }
  assert.ok(lstatSync(current).isFile(), "source_regular_file_required");
  const bytes = readFileSync(current);
  assert.equal(bytes.length, member.bytes, "release_source_size_drift");
  assert.equal(sha256(bytes), member.sha256, "release_source_hash_drift");
  return bytes;
}

export function buildWorkflowCostPublication({ sourceRoot = repository } = {}) {
  validateRelease();
  const code = release.members.map((member) => [member.name, sourceBytes(sourceRoot, member)]);
  const contentId = `sha256:${sha256(json(release))}`;
  const invocation = "python3 -E -s -B workflow_cost.py --attempt 10 --verification 2 --repair 4 --direct-success 2/5 --inspection 1 --inspected-success 4/5";
  // This closed authored representation drives both readable forms. No private
  // DTO, session, environment, clock, project, model or network input is accepted.
  const sections = [
    { title: "Decide whether optional inspection is worth its cost", paragraphs: [
      "Compare total expected work for retrying a task with and without optional inspection. You supply stationary costs and success probabilities. Mandatory verification remains part of every attempt; this calculation never authorizes skipping a required check.",
      "Read, download and leave with a result. You need Python 3.9 or later, its standard library, and permission to execute code in your own harness. No Augnes installation, repository clone, account, project, Companion, package installation or private-work upload is required.",
    ] },
    { title: "Inputs and units", paragraphs: [
      "Supply all six CLI inputs as integers or rational fractions such as 2/5, not decimal floats. Reduced numerators and denominators must fit in 64 bits; CLI numeric components have at most 20 digits. Costs are nonnegative and use one consistent additive unit, for example seconds of serial work or cost units. Results use that same unit; they are expectations, not latency percentiles or deadlines.",
      "--attempt: cost of each attempt. --verification: cost of mandatory verification after every attempt. --repair: cost after each failed verification, before retry. --inspection: optional cost before EVERY inspected attempt, including retries. --direct-success and --inspected-success: respective completion probabilities in [0, 1]. Inspection does not otherwise change the supplied attempt, verification or repair costs.",
      "Probabilities and costs are stipulated assumptions, not learned rates, observed improvements or causal effects of inspection. Defaults are constructed examples, not estimates for your work. Do not choose probabilities to obtain a preferred answer.",
    ] },
    { title: "Applicability and when to decline", paragraphs: [
      "The CLI models attempt, mandatory verification, then completion or repair and retry. Optional inspection precedes each attempt. The same costs and probabilities apply on every visit; completed work has zero remaining cost. Use it only when that stationary retry model fits your question.",
      "History-dependent or changing probabilities, one-time-only inspection, parallel scheduling, negative rewards, infinite-state models and larger numerical problems are outside this method. History dependence is a caller-side applicability judgment: the CLI receives no history-dependence flag and cannot programmatically detect it.",
      "The lower-level expected_work callable accepts a finite stationary substochastic transition matrix with nonnegative per-visit costs and 1–8 states. Every supplied state must have a positive-probability path to completion, even if unreachable from a preferred start. The exact solver refuses invalid shapes/numbers and singular systems. This is a bounded calculator, not a numerical toolkit or an execution sandbox.",
    ] },
    { title: "Download and check before execution", paragraphs: [
      `Method workflow-cost ${release.version}; content identity ${contentId}. Download manifest.json and all four files it lists into a new directory. Keep workflow_cost.py and exact_linear.py together under those exact names. README.md is the equivalent readable entry; index.html requires no JavaScript.`,
      "Start at this entry URL, follow its manifest link, check the method/version/content identity, then verify every listed byte count and SHA-256 digest before running anything. Missing, tampered or mixed-version files mean stop and obtain a consistent release. Never fill a gap with a local checkout copy or an unrelated installed module. Preserve the manifest and input values with your result.",
      "The manifest binds both code files and both readable forms. Its publication digest covers the manifest without that digest field; the content identity hashes the exact JSON release descriptor (two-space indentation and one trailing newline). No manifest includes its own bytes as a member. Hashes establish consistency, not publisher authentication or permission to execute. Obtain the entry from a source you trust.",
    ] },
    { title: "Run in your own harness", paragraphs: [
      "After integrity checks, run this command from the download directory. Only Python standard-library modules and the downloaded exact_linear.py are needed. -E ignores Python environment overrides, -s excludes user site packages, and -B prevents bytecode files; these flags do not sandbox the process.",
    ], code: invocation },
    { title: "Interpret the result and choose the next action", paragraphs: [
      "JSON stdout retains the inputs, exact rational expected_work values, inspection_minus_direct, and comparison. This constructed example returns direct 36, inspected 69/4, difference -75/4, and inspection_reduces_work. Under these assumptions, inspection is the lower-work option. With --inspection 20 instead, inspected work is 41, the difference is 5, and inspection_adds_work: decline optional inspection under those inputs. Keep mandatory verification in either case.",
      "A valid zero success probability reports non_completing, a null expected_work and not_comparable (exit 0). Decline a finite completion-cost comparison; even a zero-cost closed loop is non-completing. Invalid inputs, such as --repair -1 or --direct-success 2, exit 2 with an error instead of a result. Non-completion is not successful completion of the workflow.",
      "An independent renewal calculation for p > 0 is (attempt + verification + inspection + (1-p)*repair)/p, with inspection = 0 for the direct workflow. It is a strong simple alternative for this CLI domain. The package is not evidence of superiority over direct reasoning, independent demand, autonomous learning or actual savings.",
    ] },
    { title: "Callable and source history", paragraphs: [
      "An independently authorized Python harness can import compare_workflows or expected_work from workflow_cost after the same checks, using integers or fractions.Fraction rather than floats. workflow_cost imports exact_linear.solve_exact; neither file needs Augnes runtime code or the original private research script.",
      `The two exact source files are pinned in hynk-studio/augnes at repository revision ${release.source_revision}, with source paths and hashes in the manifest. The bounded callable and independent renewal/property tests were introduced in PR #1376 for Issue #1375; exact_linear retains the qualified elimination segment from #1366. This publication reuses that implementation unchanged. It does not republish private research files or reinterpret the separate fictional public case as evidence.`,
      "Qualification covers developer-authored, exposed correctness cases. Local HTTP download and execution prove functional delivery only, not live public deployment, another operating system, independent customer use or general capability growth.",
    ] },
    { title: "Optional: retain your observation in existing work", paragraphs: [
      "In an already-authorized Augnes task, use the loaded augnes_resume_repository and augnes_read_repository_work_sources tools, then augnes_preview_repository_work_revision and augnes_save_repository_work_revision with the same request and returned preview binding. Fresh Resume/source readback uses the new binding. Retain method/version/content identity, inputs and observed output as imported_unverified; label applicability or non-use judgments derived_interpretation. Preserve unmentioned notes and complete attribution within the existing limits (2,000 Unicode code points per note, eight notes, 32,000 native packaged bytes). Read back an uncertain save before another decision. This optional path grants no managed execution or semantic acceptance. Public reading never creates or selects work.",
    ] },
  ];
  const links = [["manifest.json", "Download manifest"], ["README.md", "Readable Markdown"], ["workflow_cost.py", "Python CLI"], ["exact_linear.py", "Required Python dependency"]];
  const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="workflow-cost-content-id" content="${contentId}"><title>Is optional inspection worth the work?</title><style>body{margin:0;background:#f7f6f1;color:#202923;font:18px/1.65 system-ui,sans-serif}main{max-width:820px;margin:auto;padding:40px 24px}h1{line-height:1.2}h2{margin-top:2rem}a{color:#175c48}p,li,code{overflow-wrap:anywhere}pre{white-space:pre-wrap;padding:16px;background:#e8eee8}</style></head><body><main><h1>Is optional inspection worth the work?</h1>${sections.map((section) => `<section><h2>${escape(section.title)}</h2>${section.paragraphs.map((p) => `<p>${escape(p)}</p>`).join("")}${section.code ? `<pre><code>${escape(section.code)}</code></pre>` : ""}</section>`).join("\n")}<nav aria-label="Downloads"><h2>Release files</h2><ul>${links.map(([name, label]) => `<li><a href="${name}"${name === "manifest.json" ? ' rel="describedby" type="application/json"' : ""}>${label}</a></li>`).join("")}</ul></nav></main></body></html>\n`;
  const markdown = ["# Is optional inspection worth the work?", ...sections.flatMap((section) => [
    `## ${section.title}`, ...section.paragraphs, ...(section.code ? [`\`\`\`sh\n${section.code}\n\`\`\``] : []),
  ]), "## Release files", ...links.map(([name, label]) => `- [${label}](${name})`)].join("\n\n") + "\n";
  const files = new Map([["index.html", Buffer.from(html)], ["README.md", Buffer.from(markdown)], ...code]);
  const manifest = {
    schema: "augnes.workflow-cost-download.v1", release, content_id: contentId,
    files: [...files].map(([name, bytes]) => ({ name, bytes: bytes.length, sha256: sha256(bytes) })),
  };
  files.set("manifest.json", Buffer.from(json({ ...manifest, publication_sha256: sha256(json(manifest)) })));
  return { files, sections, manifest: JSON.parse(files.get("manifest.json").toString()) };
}

export function checkWorkflowCostPublication(directory = path.join(repository, PUBLICATION_DIRECTORY)) {
  assert.equal(realpathSync(directory), path.resolve(directory), "publication_symlink_refused");
  const publication = buildWorkflowCostPublication();
  assert.deepEqual(readdirSync(directory).sort(), [...PUBLICATION_NAMES].sort(), "publication_inventory_drift");
  for (const [name, expected] of publication.files) {
    const file = path.join(directory, name);
    assert.ok(lstatSync(file).isFile() && !lstatSync(file).isSymbolicLink(), "publication_regular_file_required");
    assert.deepEqual(readFileSync(file), expected, `publication_drift:${name}`);
  }
  return { content_id: publication.manifest.content_id, publication_sha256: publication.manifest.publication_sha256, files: publication.files.size };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  assert.ok(process.argv.length === 3 && ["--write", "--check"].includes(process.argv[2]), "use --write or --check");
  if (process.argv[2] === "--write") {
    const publication = buildWorkflowCostPublication();
    const directory = path.join(repository, PUBLICATION_DIRECTORY);
    let parent = repository;
    for (const part of PUBLICATION_DIRECTORY.split("/")) {
      parent = path.join(parent, part);
      const stat = lstatSync(parent, { throwIfNoEntry: false });
      if (!stat) mkdirSync(parent);
      else assert.ok(stat.isDirectory() && !stat.isSymbolicLink(), "publication_symlink_refused");
    }
    assert.ok(readdirSync(directory).every((name) => PUBLICATION_NAMES.includes(name)), "unexpected_publication_file");
    for (const name of PUBLICATION_NAMES) {
      const stat = lstatSync(path.join(directory, name), { throwIfNoEntry: false });
      if (stat) assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1, "publication_regular_file_required");
    }
    if (existsSync(path.join(directory, "manifest.json"))) {
      assert.equal(JSON.parse(readFileSync(path.join(directory, "manifest.json"), "utf8")).content_id,
        publication.manifest.content_id, "new_code_requires_new_release_directory");
    }
    for (const [name, bytes] of publication.files) {
      const file = path.join(directory, name);
      writeFileSync(file, bytes, { mode: 0o644 });
    }
  }
  console.log(JSON.stringify({ workflow_cost_publication: "pass", ...checkWorkflowCostPublication() }));
}
