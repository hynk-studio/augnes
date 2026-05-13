import { execFileSync } from "node:child_process";

execFileSync(
  "./apps/augnes_apps/node_modules/.bin/tsx",
  ["--tsconfig", "tsconfig.json", "scripts/smoke-temporal-hardening.ts"],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  },
);
