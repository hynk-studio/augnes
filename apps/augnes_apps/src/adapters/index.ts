import { config } from "../lib/config.js";
import type { AugnesCoreAdapter } from "../lib/types.js";
import { FileAugnesCoreAdapter } from "./file-core.js";
import { HttpAugnesCoreAdapter } from "./http-core.js";
import { MockAugnesCoreAdapter } from "./mock-core.js";

export function createAugnesCoreAdapter(): AugnesCoreAdapter {
  if (config.coreMode === "mock") {
    return new MockAugnesCoreAdapter();
  }

  if (config.coreMode === "file") {
    return new FileAugnesCoreAdapter({
      workingViewFile: config.workingViewFile,
      casefileFile: config.casefileFile,
      evidenceIndexFile: config.evidenceIndexFile,
      continuityReportFile: config.continuityReportFile,
      boundaryPacketFile: config.boundaryPacketFile,
      strategyRationaleFile: config.strategyRationaleFile,
      governanceAuditFile: config.governanceAuditFile,
      repoNavigationFile: config.repoNavigationFile,
    });
  }

  return new HttpAugnesCoreAdapter({ apiBaseUrl: config.apiBaseUrl });
}
