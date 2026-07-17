#!/usr/bin/env node

import { buildVNextOperatorBrowserFixtureV01 } from "./vnext-operator-browser-fixture-builder-v0-1";

const outputDirectory = process.argv[2]?.trim();
const referenceTime = process.argv[3]?.trim();
if (!outputDirectory || !referenceTime) {
  process.stderr.write(
    `operator_browser_fixture_builder_failed:${outputDirectory ? "reference_time_required" : "output_directory_required"}\n`,
  );
  process.exitCode = 1;
} else {
  void buildVNextOperatorBrowserFixtureV01({
    output_directory: outputDirectory,
    reference_time: referenceTime,
  })
    .then((summary) => {
      process.stdout.write(`${JSON.stringify(summary)}\n`);
    })
    .catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "fixture_builder_failed";
      process.stderr.write(`operator_browser_fixture_builder_failed:${message}\n`);
      process.exitCode = 1;
    });
}
