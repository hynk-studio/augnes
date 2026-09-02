import { realpathSync } from "node:fs";

import { qualifyCodex01521ExactCompatibilityV01 } from "@/lib/vnext/native-host/codex-app-server-adapter";
import { CODEX_0_152_1_QUALIFICATION_SEMANTIC_PROFILE_V01 } from "@/lib/vnext/native-host/codex-isolated-auth-projection";
import {
  CODEX_0_152_1_UPSTREAM_SOURCE_COMMIT_V01,
  CODEX_0_152_1_UPSTREAM_TAG_V01,
} from "@/types/vnext/codex-isolated-auth-projection";

async function mainV01(): Promise<void> {
  const [command, releaseArchivePath, stateParent] = process.argv.slice(2);
  if (
    !command ||
    !releaseArchivePath ||
    !stateParent ||
    process.argv.length !== 5
  )
    throw new Error(
      "usage: qualify-codex-0-152-1 <exact-codex> <official-release-archive> <empty-private-state-parent>",
    );

  const result = await qualifyCodex01521ExactCompatibilityV01({
    command: realpathSync(command),
    release_archive_path: realpathSync(releaseArchivePath),
    upstream_tag: CODEX_0_152_1_UPSTREAM_TAG_V01,
    upstream_source_commit: CODEX_0_152_1_UPSTREAM_SOURCE_COMMIT_V01,
    semantic_profile_fingerprint:
      CODEX_0_152_1_QUALIFICATION_SEMANTIC_PROFILE_V01.integrity.fingerprint,
    executable_identity_class: "qualification_candidate_codex_0_152_1",
    state_parent: realpathSync(stateParent),
    repository_root: realpathSync(process.cwd()),
    base_environment: {
      PATH: process.env.PATH,
      LANG: "C",
      TZ: "UTC",
      NO_COLOR: "1",
    },
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.verdict !== "QUALIFIED_EXACT") process.exitCode = 2;
}

mainV01().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
