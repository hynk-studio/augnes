import { execFileSync } from "node:child_process";

if (!process.env.OPENAI_API_KEY?.trim()) {
  console.error(
    "OPENAI_API_KEY is required for validate:temporal-openai-path. Provide it via environment only; do not write it to files.",
  );
  process.exit(1);
}

execFileSync(
  "./apps/augnes_apps/node_modules/.bin/tsx",
  ["--tsconfig", "tsconfig.json", "scripts/validate-temporal-openai-path.ts"],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  },
);
