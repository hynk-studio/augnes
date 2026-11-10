import { mkdirSync, writeFileSync, readFileSync, chmodSync, symlinkSync } from "node:fs";
import path from "node:path";
import { digest } from "../local-canonical-inputs.mjs";
import { createBrowserBundleObserver } from "../local-canonical-browser-bundle.mjs";
import { BROWSER_INPUT_CONTRACT, readBrowserInputBinding } from "../local-canonical-browser-input.mjs";

export const fixtureWrite = (file, value) => writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value), { mode: 0o600 });
export function fixtureBrowser(checkout) {
  const relative = ".augnes-local-verification/browser/Google Chrome for Testing.app", root = path.join(checkout, relative);
  mkdirSync(path.join(root, "Contents/MacOS"), { recursive: true }); mkdirSync(path.join(root, "Contents/Frameworks/Versions/A/Resources"), { recursive: true });
  const executable = path.join(root, "Contents/MacOS/Google Chrome for Testing");
  fixtureWrite(executable, "#!/bin/sh\necho 'Google Chrome for Testing 156.0.8078.47'\n"); chmodSync(executable, 0o700);
  fixtureWrite(path.join(root, "Contents/Frameworks/Versions/A/Resources/data"), "fixture-data");
  symlinkSync("A", path.join(root, "Contents/Frameworks/Versions/Current"));
  return refreshFixtureBinding(checkout, relative);
}
export function refreshFixtureBinding(checkout, relative = ".augnes-local-verification/browser/Google Chrome for Testing.app") {
  const snapshot = createBrowserBundleObserver(path.join(checkout, relative))({ force: true });
  const reference = ".augnes-local-verification/browser/reference.json", binding = ".augnes-local-verification/browser/binding.json";
  fixtureWrite(path.join(checkout, reference), { observation: snapshot.observation, inventory: snapshot.inventory, files: snapshot.files });
  fixtureWrite(path.join(checkout, binding), { contract: BROWSER_INPUT_CONTRACT, version: "156.0.8078.47", platform: "mac-arm64", bundle_relative_path: relative,
    executable: "Contents/MacOS/Google Chrome for Testing", reference: { relative_path: reference, sha256: digest(readFileSync(path.join(checkout, reference))) },
    artifact: { origin: "https://storage.googleapis.com/chrome-for-testing-public/156.0.8078.47/mac-arm64/chrome-mac-arm64.zip", zip_sha256: "a".repeat(64), metadata_sha256: "b".repeat(64), codesign_exit: 1, spctl_exit: 1 } });
  return readBrowserInputBinding(binding, checkout);
}
