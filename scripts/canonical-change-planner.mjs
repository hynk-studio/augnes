#!/usr/bin/env node

import path from "node:path";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const SHA_PATTERN = /^[0-9a-f]{40}$/u;
const MAX_DIFF_BYTES = 8 * 1024 * 1024;
const MAX_CHANGED_PATHS = 5_000;
const MAX_PATH_BYTES = 4_096;
const MAX_SUMMARY_PATHS = 200;
const MAX_SUMMARY_BYTES = 64 * 1024;
const browserOwnerManifest = JSON.parse(
  readFileSync(new URL("./browser-verification-owners.v1.json", import.meta.url), "utf8"),
);
const changeOwnerManifest = JSON.parse(
  readFileSync(new URL("./local-canonical-change-owners.v1.json", import.meta.url), "utf8"),
);
export const PERMANENT_BROWSER_PHASE_IDS = Object.freeze([
  ...browserOwnerManifest.canonical_phase_order,
]);
export const OWNER_TARGETED_PLAN = "owner-targeted";
export const OWNER_TARGETED_DEPENDENCY_PHASE_IDS = Object.freeze([
  "dependencies-root",
  "dependencies-nested",
]);
export const TARGETED_PHASE_ORDER = Object.freeze([
  ...changeOwnerManifest.targeted_phase_order,
]);

validateChangeOwnerManifest(changeOwnerManifest);

const DOCUMENTATION_ASSET_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

export function planCanonicalChange({
  eventName,
  baseSha,
  headSha,
  cwd = repositoryRoot,
}) {
  if (eventName === "push") {
    return boundedSummary({
      schema_version: 2,
      event: "push",
      plan: "full-canonical",
      reason: "main_push_always_full",
      base_sha: normalizeOptionalSha(baseSha),
      head_sha: normalizeOptionalSha(headSha),
      change_count: null,
      changed_paths: [],
      full_reasons: ["main_push_always_full"],
      owner_ids: ["repository-main-push"],
      targeted_phase_ids: [],
      browser_phase_ids: [...PERMANENT_BROWSER_PHASE_IDS],
      changes: [],
    });
  }
  if (eventName !== "pull_request") {
    throw new Error(`unsupported canonical planner event: ${eventName || "<missing>"}`);
  }

  assertExactCommit(cwd, "base", baseSha);
  assertExactCommit(cwd, "head", headSha);
  if (baseSha === headSha) {
    throw new Error("canonical planner base and head must differ");
  }

  const changes = readGitChanges({ cwd, baseSha, headSha });
  if (changes.length === 0) {
    throw new Error("canonical planner found no pull-request changes");
  }
  if (changes.length > MAX_CHANGED_PATHS) {
    return boundedSummary({
      schema_version: 2,
      event: "pull_request",
      plan: "full-canonical",
      reason: "change_count_exceeds_documentation_bound",
      base_sha: baseSha,
      head_sha: headSha,
      change_count: changes.length,
      changed_paths: [],
      full_reasons: ["change_count_exceeds_documentation_bound"],
      owner_ids: ["unknown-change-set"],
      targeted_phase_ids: [],
      browser_phase_ids: [...PERMANENT_BROWSER_PHASE_IDS],
      changes,
    });
  }

  const documentContext = createDocumentationContext({ cwd, baseSha, headSha, changes });
  const classifications = changes.map((change) => classifyChangeResponsibility(change, documentContext));
  const fullReasons = classifications
    .filter((classification) => classification.kind === "full")
    .map((classification) => classification.reason);
  let uniqueReasons = [...new Set(fullReasons)].sort();
  let uniqueOwnerIds = [...new Set(classifications.map((item) => item.ownerId))].sort(compareCodeUnits);
  const documentationOnly = uniqueReasons.length === 0 &&
    classifications.every((item) => item.kind === "documentation");
  const operatingPolicyOnly = uniqueReasons.length === 0 &&
    !documentationOnly && classifications.every((item) =>
      ["documentation", "policy-documentation"].includes(item.kind));
  const targeted = !operatingPolicyOnly && !documentationOnly && uniqueReasons.length === 0 &&
    classifications.every((item) => ["documentation", "policy-documentation", "targeted"].includes(item.kind));
  let targetedPhaseIds = targeted
    ? orderedTargetedPhases(
        classifications.flatMap((classification) => classification.phaseIds),
      )
    : [];
  let targetedBrowserPhaseIds = targetedPhaseIds.filter((phaseId) =>
    PERMANENT_BROWSER_PHASE_IDS.includes(phaseId),
  );
  if (targetedBrowserPhaseIds.length > 1) {
    uniqueReasons = [
      "multi_browser_owner_product_composition",
    ];
    uniqueOwnerIds = [
      ...new Set([...uniqueOwnerIds, "multi-owner-product-composition"]),
    ].sort(compareCodeUnits);
    targetedPhaseIds = [];
    targetedBrowserPhaseIds = [];
  }
  const selectedPlan = operatingPolicyOnly
    ? "operating-policy-only"
    : documentationOnly
      ? "documentation-only"
      : targeted && uniqueReasons.length === 0
        ? OWNER_TARGETED_PLAN
        : "full-canonical";
  const browserPhaseIds =
    operatingPolicyOnly || documentationOnly
      ? []
      : selectedPlan === OWNER_TARGETED_PLAN
        ? targetedBrowserPhaseIds
        : selectCanonicalBrowserPhasesForChanges(changes);

  return boundedSummary({
    schema_version: 2,
    event: "pull_request",
    plan: selectedPlan,
    reason: operatingPolicyOnly
      ? "registered_documentation_responsibilities"
      : documentationOnly
        ? "ordinary_documentation_with_review_obligations"
        : selectedPlan === OWNER_TARGETED_PLAN
          ? "all_changes_have_owner_complete_targeted_coverage"
          : "one_or_more_changes_require_full_canonical",
    base_sha: baseSha,
    head_sha: headSha,
    change_count: changes.length,
    changed_paths: changes
      .map((change) => change.newPath ?? change.oldPath)
      .filter(Boolean)
      .slice(0, MAX_SUMMARY_PATHS),
    full_reasons: uniqueReasons,
    owner_ids: uniqueOwnerIds,
    targeted_phase_ids: targetedPhaseIds,
    browser_phase_ids: browserPhaseIds,
    documentation_responsibilities: classifications.flatMap((item) => item.documentation ?? []),
    documentation_checks: [...new Set(classifications.flatMap((item) => item.checks ?? []))].sort(),
    documentation_review_required: classifications.some((item) => item.documentation),
    changes,
  });
}

export function selectCanonicalBrowserPhasesForChanges(changes) {
  const classification = classifyCanonicalBrowserOwnership(changes);
  return ["unknown", "shared"].includes(classification.status)
    ? [...PERMANENT_BROWSER_PHASE_IDS]
    : classification.phase_ids;
}

export function classifyCanonicalBrowserOwnership(changes) {
  if (!Array.isArray(changes) || changes.length === 0) {
    throw new Error("canonical browser ownership requires changed paths");
  }
  const rules = browserOwnerManifest.changed_file_selection;
  const selected = new Set();
  let matchedAny = false;
  let shared = false;
  let composition = false;
  const add = (phaseId) => selected.add(phaseId);
  for (const change of changes) {
    const changedPaths = [change.oldPath, change.newPath].filter(Boolean);
    let matchedPath = false;
    for (const changedPath of changedPaths) {
      const normalized = normalizeRepositoryPath(changedPath).toLowerCase();
      if (matchesOwnershipRule(normalized, rules.project_experience)) {
        add("e2e-project-experience");
        matchedPath = true;
      }
      if (matchesOwnershipRule(normalized, rules.operator_review_control)) {
        add("e2e-operator-review-control");
        matchedPath = true;
      }
      if (matchesOwnershipRule(normalized, rules.operator_native_host_execution)) {
        add("e2e-operator-native-host-execution");
        matchedPath = true;
      }
      if (matchesOwnershipRule(normalized, rules.operator_work_expectation)) {
        add("e2e-operator-work-expectation");
        matchedPath = true;
      }
      if (matchesOwnershipRule(normalized, rules.operator_multi_candidate)) {
        add("e2e-operator-multi-candidate");
        matchedPath = true;
      }
      if (matchesOwnershipRule(normalized, rules.continuity)) {
        add("e2e-continuity");
        matchedPath = true;
      }
      if (matchesOwnershipRule(normalized, rules.project_composition)) {
        add("e2e-project-experience");
        add("e2e-operator-native-host-execution");
        add("e2e-operator-work-expectation");
        composition = true;
        matchedPath = true;
      }
      if (matchesOwnershipRule(normalized, rules.shared_cross_boundary)) {
        shared = true;
        matchedPath = true;
      }
    }
    matchedAny ||= matchedPath;
    if (!matchedPath) {
      return {
        status: "unknown",
        phase_ids: [...PERMANENT_BROWSER_PHASE_IDS],
      };
    }
  }
  if (!matchedAny) {
    return {
      status: "unknown",
      phase_ids: [...PERMANENT_BROWSER_PHASE_IDS],
    };
  }
  if (shared) {
    return {
      status: "shared",
      phase_ids: [...PERMANENT_BROWSER_PHASE_IDS],
    };
  }
  if (composition || selected.size > 1) add("e2e-golden");
  return {
    status: composition
      ? "composition"
      : selected.size > 1
        ? "multi-owner"
        : "owned",
    phase_ids: PERMANENT_BROWSER_PHASE_IDS.filter((phaseId) =>
      selected.has(phaseId)
    ),
  };
}

export function parseNameStatus(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("canonical planner diff must be a Buffer");
  }
  if (buffer.length > MAX_DIFF_BYTES) {
    throw new Error("canonical planner diff exceeds the bounded input size");
  }
  const tokens = buffer.toString("utf8").split("\0");
  if (tokens.at(-1) !== "") {
    throw new Error("canonical planner diff is not NUL terminated");
  }
  tokens.pop();

  const records = [];
  for (let index = 0; index < tokens.length; ) {
    const statusToken = tokens[index++];
    if (!/^(?:[AMDTU]|[RC][0-9]{1,3})$/u.test(statusToken)) {
      throw new Error(`unsupported canonical diff status: ${statusToken || "<missing>"}`);
    }
    const status = statusToken[0];
    const pathCount = status === "R" || status === "C" ? 2 : 1;
    if (index + pathCount > tokens.length) {
      throw new Error(`malformed canonical diff record: ${statusToken}`);
    }
    const paths = tokens.slice(index, index + pathCount);
    index += pathCount;
    for (const changedPath of paths) validateChangedPath(changedPath);
    records.push({
      status,
      statusToken,
      oldPath: status === "A" ? null : paths[0],
      newPath:
        status === "D"
          ? null
          : status === "R" || status === "C"
            ? paths[1]
            : paths[0],
    });
  }
  return records;
}

export function isDocumentationPath(relativePath) {
  const normalized = normalizeRepositoryPath(relativePath);
  if (/(^|\/)AGENTS\.md$/u.test(normalized)) return false;

  if (normalized.endsWith(".md")) {
    return (
      !normalized.includes("/") ||
      normalized.startsWith("docs/") ||
      normalized.startsWith("research/") ||
      /^\.github\/[^/]+\.md$/u.test(normalized)
    );
  }
  const extension = path.posix.extname(normalized).toLowerCase();
  return (
    (normalized.startsWith("docs/") || normalized.startsWith("research/")) &&
    DOCUMENTATION_ASSET_EXTENSIONS.has(extension)
  );
}

function readGitChanges({ cwd, baseSha, headSha }) {
  const result = runGit(
    cwd,
    [
      "diff",
      "--name-status",
      "-z",
      "--find-renames=50%",
      baseSha,
      headSha,
    ],
    { encoding: "buffer", maxBuffer: MAX_DIFF_BYTES },
  );
  const records = parseNameStatus(result.stdout);
  return records.map((record) => ({
    ...record,
    oldMode: record.oldPath ? readGitMode(cwd, baseSha, record.oldPath) : null,
    newMode: record.newPath ? readGitMode(cwd, headSha, record.newPath) : null,
  }));
}

function classifyChangeResponsibility(change, documentContext) {
  if (change.status === "T" || change.status === "U") {
    return fullClassification(
      "unknown-change-status",
      `unsafe_status_${change.status}:${change.newPath ?? change.oldPath}`,
    );
  }
  if (change.status === "C") {
    return fullClassification(
      "unknown-copy-consumers",
      `copy_requires_full:${change.newPath}`,
    );
  }
  if (
    change.status === "D"
      ? !isSafeRegularMode(change.oldMode)
      : !isSafeRegularMode(change.newMode)
  ) {
    return fullClassification(
      "unsafe-file-mode",
      `unsafe_${change.status === "D" ? "old" : "new"}_mode_${
        change.status === "D" ? change.oldMode ?? "missing" : change.newMode ?? "missing"
      }:${change.newPath ?? change.oldPath}`,
    );
  }
  if (
    change.oldMode !== null &&
    change.status !== "D" &&
    (change.oldMode !== change.newMode || !isSafeRegularMode(change.oldMode))
  ) {
    return fullClassification(
      "unsafe-file-mode",
      `mode_change:${change.newPath ?? change.oldPath}`,
    );
  }
  const relativePath = change.newPath ?? change.oldPath;
  const documentClassification = classifyDocumentationChange(change, documentContext);
  if (documentClassification) return documentClassification;
  if (change.status === "R") {
    return fullClassification("unknown-rename-consumers",
      `rename_requires_full:${change.oldPath}->${change.newPath}`);
  }
  if (/(^|\/)AGENTS\.md$/u.test(relativePath)) {
    return fullClassification("repository-operating-policy", `agents_change_requires_full:${relativePath}`);
  }

  const highRiskOwner = changeOwnerManifest.high_risk_owners.find((owner) =>
    changedPaths(change).some((changedPath) =>
      matchesPathRules(changedPath, owner.path_rules)
    )
  );
  if (highRiskOwner) {
    return fullClassification(
      highRiskOwner.id,
      `${highRiskOwner.reason}:${relativePath}`,
    );
  }

  const targetedOwner = changeOwnerManifest.targeted_owners.find((owner) =>
    changedPaths(change).every((changedPath) =>
      matchesPathRules(changedPath, owner.path_rules)
    )
  );
  if (targetedOwner) {
    if (
      change.status === "D" &&
      targetedOwner.deletion_policy !== "targeted"
    ) {
      return fullClassification(
        targetedOwner.id,
        `owner_deletion_requires_full:${relativePath}`,
      );
    }
    return {
      kind: "targeted",
      ownerId: targetedOwner.id,
      phaseIds: targetedOwner.phase_ids,
      reason: `known_owner:${targetedOwner.id}:${relativePath}`,
    };
  }

  if (
    change.status !== "D" &&
    matchesAnyPrefix(
      relativePath,
      changeOwnerManifest.browser_targeted.eligible_path_prefixes,
    )
  ) {
    const browserOwnership = classifyCanonicalBrowserOwnership([change]);
    if (
      browserOwnership.status === "owned" &&
      browserOwnership.phase_ids.length === 1
    ) {
      const browserPhaseId = browserOwnership.phase_ids[0];
      const ownerId =
        changeOwnerManifest.browser_targeted.phase_owner_ids[browserPhaseId];
      if (ownerId) {
        return {
          kind: "targeted",
          ownerId,
          phaseIds: [
            ...changeOwnerManifest.browser_targeted.base_phase_ids,
            browserPhaseId,
          ],
          reason: `known_browser_owner:${ownerId}:${relativePath}`,
        };
      }
    }
    return fullClassification(
      browserOwnership.status === "unknown"
        ? "unknown-browser-owner"
        : "multi-owner-product-composition",
      `${browserOwnership.status}_browser_ownership_requires_full:${relativePath}`,
    );
  }

  return fullClassification(
    "unknown-owner",
    `unknown_or_unmatched_owner:${relativePath}`,
  );
}

// Registration covers inspected responsibilities, not arbitrary Markdown consumers.
// The search is an additional refusal screen; absence of a match is never consumer proof.
const DOCUMENTATION_INFRASTRUCTURE = new Set([
  "scripts/canonical-change-planner.mjs", "scripts/validate-canonical-docs-change.mjs",
  "scripts/local-canonical-change-owners.v1.json", "scripts/test-canonical-change-planner.mjs",
  "scripts/test-local-canonical-executor.mjs", "scripts/test-local-canonical-receipt.mjs",
]);

function createDocumentationContext({ cwd, baseSha, headSha, changes }) {
  if (!changes.some((change) => changedPaths(change).some((p) => isDocumentationPath(p) || p === "AGENTS.md"))) {
    return null;
  }
  const delegated = new Set();
  const treeModes = new Map();
  for (const revision of [baseSha, headSha]) {
    const files = new Map(runGit(cwd, ["ls-tree", "-r", "-z", revision], { encoding: "utf8", maxBuffer: MAX_DIFF_BYTES }).stdout.split("\0").filter(Boolean).map((entry) => [entry.slice(entry.indexOf("\t") + 1), entry.slice(0, 6)]));
    treeModes.set(revision, files);
    for (const owner of changeOwnerManifest.documentation_owners.filter((item) => item.disposition === "full")) {
      for (const file of owner.paths) {
        if (!files.has(file)) continue;
        const source = runGit(cwd, ["show", `${revision}:${file}`], { encoding: "utf8", maxBuffer: MAX_DIFF_BYTES }).stdout;
        for (const destination of extractMarkdownDestinations(source)) {
          const target = destination.split("#", 1)[0];
          if (!target || /^(?:[a-z]+:|\/)/iu.test(target)) continue;
          const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), target));
          if (resolved.endsWith(".md")) delegated.add(resolved);
        }
      }
    }
  }
  return { cwd, baseSha, headSha, delegated, treeModes, consumers: new Map() };
}

function documentationConsumers(relativePath, context) {
  if (context.consumers.has(relativePath)) return context.consumers.get(relativePath);
  const consumers = new Set();
  for (const revision of [context.baseSha, context.headSha]) {
    const result = spawnSync("git", ["grep", "-I", "-l", "-z", "-F", "-e", relativePath, "-e", path.posix.basename(relativePath),
      revision, "--"], {
      cwd: context.cwd, encoding: "utf8", maxBuffer: MAX_DIFF_BYTES, timeout: 30_000,
    });
    if (result.error) throw result.error;
    if (![0, 1].includes(result.status)) throw new Error("documentation consumer observation failed");
    for (const entry of result.stdout.split("\0").filter(Boolean)) {
      const file = entry.slice(revision.length + 1);
      const explanatoryMarkdown = context.treeModes.get(revision).get(file) === "100644" && file.endsWith(".md") && (isDocumentationPath(file) || file === "AGENTS.md");
      if (!explanatoryMarkdown && !DOCUMENTATION_INFRASTRUCTURE.has(file)) consumers.add(file);
    }
  }
  const result = [...consumers].sort();
  context.consumers.set(relativePath, result);
  return result;
}

// This catches literal-prefix/directory consumers in addition to exact names.
// Opaque computed paths and retained external use still require source review.
function dynamicDocumentationConsumers(relativePath, context) {
  if (!context.dynamicConsumers) {
    context.dynamicConsumers = [];
    for (const revision of [context.baseSha, context.headSha]) {
      const result = spawnSync("git", ["grep", "-I", "-l", "-z", "-E", "[\"'`]((docs|research)(/|[\"'`]))", revision, "--", ":!*.md"], {
        cwd: context.cwd, encoding: "utf8", maxBuffer: MAX_DIFF_BYTES, timeout: 30_000,
      });
      if (result.error) throw result.error;
      if (![0, 1].includes(result.status)) throw new Error("dynamic documentation consumer observation failed");
      for (const entry of result.stdout.split("\0").filter(Boolean)) {
        const file = entry.slice(revision.length + 1);
        if (DOCUMENTATION_INFRASTRUCTURE.has(file)) continue;
        const source = runGit(context.cwd, ["show", `${revision}:${file}`], { encoding: "utf8", maxBuffer: MAX_DIFF_BYTES }).stdout;
        if (path.posix.basename(file) === "package.json") {
          let config;
          try { config = JSON.parse(source); } catch { throw new Error("unreadable documentation package consumer"); }
          for (const candidate of config.files ?? []) {
            if (typeof candidate !== "string") throw new Error("unknown documentation package consumer");
            const literal = candidate.replace(/^\.\//u, "");
            if (/^(?:docs|research)(?:\/|$)/u.test(literal)) {
              context.dynamicConsumers.push({ file, prefix: literal.split(/[*?]/u, 1)[0].replace(/\/$/u, "") });
            }
          }
        }
        for (const match of source.matchAll(/(?:readFile(?:Sync)?|readdir(?:Sync)?|glob(?:Sync)?|copyFile(?:Sync)?)\([\s\S]{0,240}?["'`]((?:docs|research)(?:\/[^"'`]*)?)["'`]/gu)) {
          const literal = match[1];
          if (!path.posix.extname(literal) || literal.includes("${") || /[*?]/u.test(literal)) {
            const prefix = literal.split(/[$*?]/u, 1)[0].replace(/\/$/u, "");
            context.dynamicConsumers.push({ file, prefix });
          }
        }
      }
    }
  }
  return context.dynamicConsumers.filter(({ prefix }) => relativePath === prefix || relativePath.startsWith(`${prefix}/`)).map(({ file }) => file);
}

function classifyDocumentationChange(change, context) {
  const paths = changedPaths(change);
  if (!context || !paths.every((p) => isDocumentationPath(p) || p === "AGENTS.md")) return null;
  if (paths.includes("AGENTS.md") && change.status !== "M") {
    return fullClassification("repository-operating-policy", "agents_change_requires_safe_modification:AGENTS.md");
  }
  const owners = paths.map((p) => changeOwnerManifest.documentation_owners.find((owner) => owner.paths.includes(p)));
  const pathDisposition = ["D", "R"].includes(change.status);
  let removedAnchor = false;
  if (change.status === "M" && change.newPath.endsWith(".md")) {
    const previous = collectMarkdownAnchors(runGit(context.cwd, ["show", `${context.baseSha}:${change.oldPath}`], { encoding: "utf8", maxBuffer: MAX_DIFF_BYTES }).stdout);
    const proposed = collectMarkdownAnchors(runGit(context.cwd, ["show", `${context.headSha}:${change.newPath}`], { encoding: "utf8", maxBuffer: MAX_DIFF_BYTES }).stdout);
    removedAnchor = [...previous].some((anchor) => !proposed.has(anchor));
  }
  const isDisposition = pathDisposition || removedAnchor;
  const authority = owners.some((owner) => owner?.disposition === "full");
  if (pathDisposition && (authority || !owners[0] || owners[0].disposition !== "references")) {
    return fullClassification("unproven-documentation-disposition", `unproven_documentation_consumers:${paths[0]}`);
  }
  for (const [index, file] of paths.entries()) {
    const owner = owners[index];
    if ((!owner && context.delegated.has(file)) || /(^|\/)AGENTS\.md$/u.test(file) && file !== "AGENTS.md") {
      return fullClassification("unregistered-documentation-contract", `unregistered_documentation_contract:${file}`);
    }
    const unknown = [...documentationConsumers(file, context), ...dynamicDocumentationConsumers(file, context)].filter((consumer) => !owner?.consumer_paths.includes(consumer));
    if (unknown.length) {
      return fullClassification("unproven-documentation-consumers", `unproven_documentation_consumer:${file}:${unknown[0]}`);
    }
  }
  const responsibility = authority ? "authority-contract" : isDisposition ? "disposition" : "ordinary";
  return {
    kind: authority ? "policy-documentation" : "documentation",
    ownerId: authority ? owners.find((owner) => owner?.disposition === "full").id : "documentation",
    phaseIds: [],
    reason: `documentation_${responsibility}`,
    checks: [...new Set([...(isDisposition || authority ? ["references"] : []), ...owners.flatMap((owner) => owner?.checks ?? [])])],
    documentation: [{ paths: [...new Set(paths)], responsibility, disposition: pathDisposition || removedAnchor,
      consumer_review: "required; static references do not prove absence of dynamic or external obligations" }],
  };
}

export function extractMarkdownDestinations(markdown) {
  const destinations = [];
  for (const match of markdown.matchAll(/!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+[^)]*)?\)/gmu)) {
    destinations.push(match[1] ?? match[2]);
  }
  for (const match of markdown.matchAll(/^\s*\[[^\]]+\]:\s*(?:<([^>]+)>|(\S+))/gmu)) {
    destinations.push(match[1] ?? match[2]);
  }
  return destinations.filter(Boolean);
}

export function collectMarkdownAnchors(markdown) {
  const anchors = new Set();
  const counts = new Map();
  let fence = null;
  let previous = "";
  for (const line of markdown.split(/\r?\n/u)) {
    const fenced = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/u);
    if (fence) {
      if (fenced && fenced[1][0] === fence.marker &&
          fenced[1].length >= fence.length && /^[ \t]*$/u.test(fenced[2])) {
        fence = null;
      }
      continue;
    }
    if (fenced && (fenced[1][0] === "~" || !fenced[2].includes("`"))) {
      fence = { marker: fenced[1][0], length: fenced[1].length };
      previous = "";
      continue;
    }
    const explicitMatches = line.matchAll(/\bid=["']([^"']+)["']/giu);
    for (const match of explicitMatches) anchors.add(match[1].toLowerCase());

    const underline = /^ {0,3}(?:=+|-+)[ \t]*$/u.test(line);
    const heading = line.match(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/u) ??
      (underline && previous ? [line, previous] : null);
    // A setext underline consumes paragraph text, never a preceding heading,
    // code block, thematic break, list/quote marker or reference definition.
    const blockBoundary = /^(?: {4}|\t)|^ {0,3}(?:#{1,6}(?:[ \t]|$)|>|(?:[-+*]|[0-9]{1,9}[.)])(?:[ \t]|$)|\[[^\]]+\]:)/u.test(line) ||
      /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/u.test(line);
    previous = heading || underline || blockBoundary || !line.trim() ? "" : line;
    if (!heading) continue;
    const base = heading[1]
      .replace(/<[^>]*>/gu, "")
      .replace(/[`*_~]/gu, "")
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s/gu, "-");
    if (!base) continue;
    const duplicate = counts.get(base) ?? 0;
    counts.set(base, duplicate + 1);
    anchors.add(duplicate === 0 ? base : `${base}-${duplicate}`);
  }
  return anchors;
}

function fullClassification(ownerId, reason) {
  return {
    kind: "full",
    ownerId,
    phaseIds: [],
    reason,
  };
}

function changedPaths(change) {
  return [change.oldPath, change.newPath].filter(Boolean);
}

function orderedTargetedPhases(phaseIds) {
  const selected = new Set([
    "targeted-change-validator",
    ...OWNER_TARGETED_DEPENDENCY_PHASE_IDS,
    ...phaseIds,
  ]);
  const ordered = TARGETED_PHASE_ORDER.filter((phaseId) =>
    selected.has(phaseId)
  );
  if (ordered.length !== selected.size || ordered.length < 2) {
    throw new Error("targeted owner phase inventory is unsupported or incomplete");
  }
  return ordered;
}

function matchesAnyPrefix(relativePath, prefixes) {
  const normalized = normalizeRepositoryPath(relativePath).toLowerCase();
  return prefixes.some((prefix) => normalized.startsWith(prefix.toLowerCase()));
}

function matchesPathRules(relativePath, rules) {
  const normalized = normalizeRepositoryPath(relativePath).toLowerCase();
  const basename = path.posix.basename(normalized);
  return (
    // An audited executable admission must not include case variants or path
    // normalization aliases that can name distinct, unregistered consumers.
    rules.literal_exact_paths?.includes(relativePath) ||
    rules.exact_paths?.some(
      (candidate) => candidate.toLowerCase() === normalized,
    ) ||
    rules.path_prefixes?.some((prefix) =>
      normalized.startsWith(prefix.toLowerCase())
    ) ||
    rules.path_fragments?.some((fragment) =>
      normalized.includes(fragment.toLowerCase())
    ) ||
    rules.basenames?.some(
      (candidate) => candidate.toLowerCase() === basename,
    ) ||
    false
  );
}

export function validateChangeOwnerManifest(manifest) {
  if (
    manifest?.schema !== "augnes.local-canonical-change-owners.v1" ||
    manifest?.version !== 1
  ) {
    throw new Error("canonical change owner manifest identity is invalid");
  }
  const documented = new Set();
  if (!Array.isArray(manifest.documentation_owners)) throw new Error("documentation owners missing");
  for (const owner of manifest.documentation_owners) {
    if (!Array.isArray(owner.paths) || !owner.paths.length ||
        !Array.isArray(owner.checks) || owner.checks.some((check) => check !== "verification-policy") ||
        !Array.isArray(owner.consumer_paths) || !["full", "references"].includes(owner.disposition) ||
        (owner.disposition === "references" && !owner.consumer_scope)) {
      throw new Error("invalid documentation owner contract");
    }
    for (const file of owner.paths) {
      if (file !== normalizeRepositoryPath(file) || documented.has(file)) throw new Error("invalid or duplicate documentation path");
      documented.add(file);
    }
  }
  const phaseOrder = manifest.targeted_phase_order;
  const fixedPhaseOrder = [
    "targeted-change-validator",
    ...OWNER_TARGETED_DEPENDENCY_PHASE_IDS,
    "typecheck",
    "unit",
    "authority",
    "integration",
    "operability",
    ...PERMANENT_BROWSER_PHASE_IDS,
  ];
  if (
    !Array.isArray(phaseOrder) ||
    JSON.stringify(phaseOrder) !== JSON.stringify(fixedPhaseOrder)
  ) {
    throw new Error("canonical targeted phase order is invalid");
  }
  const allowedPhases = new Set(
    phaseOrder.slice(1 + OWNER_TARGETED_DEPENDENCY_PHASE_IDS.length),
  );
  const ownerIds = new Set();
  const exactTargetedPaths = new Set();
  for (const owner of manifest.targeted_owners ?? []) {
    assertOwnerIdentity(owner, ownerIds);
    if (
      !Array.isArray(owner.phase_ids) ||
      owner.phase_ids.length === 0 ||
      new Set(owner.phase_ids).size !== owner.phase_ids.length ||
      owner.phase_ids.some((phaseId) => !allowedPhases.has(phaseId)) ||
      !["full", "targeted"].includes(owner.deletion_policy)
    ) {
      throw new Error(`canonical targeted owner is invalid: ${owner.id}`);
    }
    validatePathRules(owner.path_rules, owner.id);
    for (const exactPath of [
      ...(owner.path_rules.literal_exact_paths ?? []),
      ...(owner.path_rules.exact_paths ?? []),
    ]) {
      const normalized = normalizeRepositoryPath(exactPath).toLowerCase();
      if (exactTargetedPaths.has(normalized)) {
        throw new Error(`duplicate canonical targeted exact path: ${exactPath}`);
      }
      exactTargetedPaths.add(normalized);
    }
  }
  const browserTargeted = manifest.browser_targeted;
  if (
    !browserTargeted ||
    !Array.isArray(browserTargeted.eligible_path_prefixes) ||
    browserTargeted.eligible_path_prefixes.length === 0 ||
    !Array.isArray(browserTargeted.base_phase_ids) ||
    browserTargeted.base_phase_ids.some((phaseId) => !allowedPhases.has(phaseId)) ||
    browserTargeted.deletion_policy !== "full"
  ) {
    throw new Error("canonical browser targeted owner contract is invalid");
  }
  for (const [phaseId, ownerId] of Object.entries(
    browserTargeted.phase_owner_ids ?? {},
  )) {
    if (
      !PERMANENT_BROWSER_PHASE_IDS.includes(phaseId) ||
      phaseId === "e2e-golden" ||
      !/^[a-z0-9][a-z0-9-]{0,79}$/u.test(ownerId)
    ) {
      throw new Error("canonical browser targeted phase owner is invalid");
    }
  }
  for (const owner of manifest.high_risk_owners ?? []) {
    assertOwnerIdentity(owner, ownerIds);
    if (!/^[a-z0-9][a-z0-9_]{0,79}$/u.test(owner.reason ?? "")) {
      throw new Error(`canonical high-risk owner reason is invalid: ${owner.id}`);
    }
    validatePathRules(owner.path_rules, owner.id);
  }
  if ((manifest.high_risk_owners ?? []).length === 0) {
    throw new Error("canonical high-risk owner inventory is empty");
  }
  return true;
}

function assertOwnerIdentity(owner, ownerIds) {
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/u.test(owner?.id ?? "")) {
    throw new Error("canonical owner id is invalid");
  }
  if (ownerIds.has(owner.id)) {
    throw new Error(`duplicate canonical owner id: ${owner.id}`);
  }
  ownerIds.add(owner.id);
}

function validatePathRules(rules, ownerId) {
  if (rules?.literal_exact_paths !== undefined &&
      (!Array.isArray(rules.literal_exact_paths) ||
       rules.literal_exact_paths.length === 0)) {
    throw new Error(`canonical literal exact paths are invalid: ${ownerId}`);
  }
  const entries = [
    ...(rules?.literal_exact_paths ?? []),
    ...(rules?.exact_paths ?? []),
    ...(rules?.path_prefixes ?? []),
    ...(rules?.path_fragments ?? []),
    ...(rules?.basenames ?? []),
  ];
  if (
    entries.length === 0 ||
    entries.some((entry) => typeof entry !== "string" || entry.length === 0)
  ) {
    throw new Error(`canonical owner path rules are invalid: ${ownerId}`);
  }
  for (const exactPath of rules?.exact_paths ?? []) {
    normalizeRepositoryPath(exactPath);
  }
  for (const exactPath of rules?.literal_exact_paths ?? []) {
    if (exactPath !== normalizeRepositoryPath(exactPath)) {
      throw new Error(`canonical literal exact path is not normalized: ${ownerId}`);
    }
  }
  for (const prefix of rules?.path_prefixes ?? []) {
    normalizeRepositoryPath(prefix);
  }
}

function readGitMode(cwd, revision, relativePath) {
  const result = runGit(cwd, ["ls-tree", "-z", revision, "--", relativePath], {
    encoding: "buffer",
    maxBuffer: 64 * 1024,
  });
  if (result.stdout.length === 0) return null;
  const entry = result.stdout.toString("utf8");
  const match = entry.match(/^(\d{6})\s+(?:blob|tree)\s+[0-9a-f]+\t/u);
  if (!match) {
    throw new Error(`malformed git tree entry for ${relativePath}`);
  }
  return match[1];
}

function assertExactCommit(cwd, label, sha) {
  if (!SHA_PATTERN.test(sha ?? "")) {
    throw new Error(`canonical planner ${label} SHA must be exactly 40 lowercase hex characters`);
  }
  runGit(cwd, ["cat-file", "-e", `${sha}^{commit}`], {
    encoding: "buffer",
    maxBuffer: 64 * 1024,
  });
}

function runGit(cwd, args, options) {
  const result = spawnSync("git", args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const stderr = Buffer.isBuffer(result.stderr)
      ? result.stderr.toString("utf8")
      : String(result.stderr ?? "");
    throw new Error(`git ${args[0]} failed: ${stderr.trim() || `exit ${result.status}`}`);
  }
  return result;
}

function validateChangedPath(relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    Buffer.byteLength(relativePath, "utf8") > MAX_PATH_BYTES ||
    relativePath.includes("\0")
  ) {
    throw new Error("canonical planner encountered a malformed or oversized path");
  }
  normalizeRepositoryPath(relativePath);
}

function normalizeRepositoryPath(relativePath) {
  const normalized = path.posix.normalize(relativePath.replaceAll("\\", "/"));
  if (
    path.posix.isAbsolute(normalized) ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized === "."
  ) {
    throw new Error(`canonical planner path escapes the repository: ${relativePath}`);
  }
  return normalized;
}

function isSafeRegularMode(mode) {
  return mode === "100644";
}

function normalizeOptionalSha(sha) {
  return SHA_PATTERN.test(sha ?? "") ? sha : null;
}

function matchesOwnershipRule(relativePath, rule) {
  return (
    rule.exact_paths?.some((candidate) => candidate.toLowerCase() === relativePath) ||
    rule.path_fragments?.some((fragment) => relativePath.includes(fragment.toLowerCase())) ||
    false
  );
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function boundedSummary(summary) {
  const publicSummary = { ...summary };
  delete publicSummary.changes;
  const serialized = JSON.stringify(publicSummary);
  if (Buffer.byteLength(serialized, "utf8") > MAX_SUMMARY_BYTES) {
    throw new Error("canonical planner summary exceeds the bounded output size");
  }
  return summary;
}

function parseCliArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("canonical planner arguments must be --key value pairs");
    }
    values.set(key.slice(2), value);
  }
  return values;
}

function cliSummary(plan) {
  const summary = { ...plan };
  delete summary.changes;
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseCliArguments(process.argv.slice(2));
    const plan = planCanonicalChange({
      eventName: args.get("event"),
      baseSha: args.get("base"),
      headSha: args.get("head"),
    });
    const summary = cliSummary(plan);
    console.log(JSON.stringify(summary));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
