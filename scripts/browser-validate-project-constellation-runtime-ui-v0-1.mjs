import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const validationName = "project-constellation-runtime-ui-browser-static-validation";
const validationVersion = "v0.1";
const fixturePath = "fixtures/project-constellation-runtime-ui.sample.v0.1.json";
const docPath = "docs/PROJECT_CONSTELLATION_RUNTIME_UI_V0_1.md";
const componentPaths = [
  "components/perspective/constellation-runtime-view.tsx",
  "components/perspective/constellation-node.tsx",
  "components/perspective/constellation-edge.tsx",
  "components/perspective/constellation-inspector.tsx",
  "components/perspective/candidate-overlay-toggle.tsx",
];

for (const filePath of [fixturePath, docPath, ...componentPaths]) {
  assert(existsSync(filePath), `${filePath} must exist`);
}

const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const docText = readFileSync(docPath, "utf8");
const componentText = componentPaths.map((filePath) => readFileSync(filePath, "utf8")).join("\n");
const layout = fixture.expected_props.layoutResult.layout;
const negativeCoordinateNodes = layout.node_positions.filter(
  (node) => node.position.x < 0 || node.position.y < 0,
);
const negativeCoordinateNodeRefs = new Set(negativeCoordinateNodes.map((node) => node.node_ref));

assert.equal(fixture.browser_validation_expectation.viewport_width_px, 390);
assert.equal(fixture.browser_validation_expectation.validation_mode, "static-only");
assert(
  fixture.browser_validation_expectation.skipped_reason.includes("No route"),
  "static browser validation reports concrete no-route skip reason",
);
assert(docText.includes("Missing edge endpoints render bounded warnings rather than crashing or inventing nodes."));
assert(docText.includes("Negative seeded layout coordinates are normalized for display only."));
assert(docText.includes("Coordinate normalization does not mutate layout data."));
assert(docText.includes("Coordinate normalization does not persist layout."));
assert(docText.includes("Coordinate normalization does not make coordinates truth."));
assert(docText.includes("Coordinate normalization keeps coordinates as display hints."));
assert(componentText.includes("Missing edge endpoints render bounded warnings rather than crashing or"));
assert(componentText.includes("Read-only constellation view"));
assert(componentText.includes("No state mutation"));
assert(componentText.includes("Product-write remains parked"));
assert(componentText.includes("createConstellationRenderFrameV01"));
assert(componentText.includes("normalizeConstellationNodePositionV01"));
assert(componentText.includes("normalizedNodePositionsByRef"));
assert(componentText.includes("renderPosition"));
assert(negativeCoordinateNodes.some((node) => node.position.x < 0), "fixture includes negative x");
assert(negativeCoordinateNodes.some((node) => node.position.y < 0), "fixture includes negative y");
assert(
  layout.edge_routes.some(
    (edge) =>
      negativeCoordinateNodeRefs.has(edge.from_node_ref) ||
      negativeCoordinateNodeRefs.has(edge.to_node_ref),
  ),
  "fixture includes edge connected to negative-coordinate node",
);

for (const forbidden of [
  "fetch(",
  "useEffect",
  "POST",
  "action=",
  "save button",
  "rollback button",
  "promote button",
  "apply state button",
  "create proof/evidence button",
  "product write button",
  "localStorage",
  "sessionStorage",
  "NextResponse",
  "Database",
  "OpenAI",
]) {
  assert(!componentText.includes(forbidden), `component text must not include ${forbidden}`);
}

console.log(
  JSON.stringify(
    {
      validation_name: validationName,
      validation_version: validationVersion,
      final_status: "pass",
      browser_automation: "skipped",
      skipped_reason:
        "No browser harness was used because this slice adds no route or mounted page; validation is static over props-only read-only components and fixture.",
      viewport_wording_checked_px: 390,
      false_affordance_controls_absent: true,
      missing_endpoint_warning_text_present: true,
      negative_coordinate_fixture_checked: true,
      coordinate_normalization_static_check: true,
      route_added: false,
      fetch_added: false,
      persistence_added: false,
      state_mutation_added: false,
      product_write_added: false,
    },
    null,
    2,
  ),
);
