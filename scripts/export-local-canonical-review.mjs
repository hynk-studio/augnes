import { lstatSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readReceiptFile, canonicalSerialize } from "./local-canonical-receipt.mjs";
import { ensureBoundedLocalDirectory } from "./local-canonical-environment.mjs";
import { createPrivateReviewExport } from "./local-canonical-review-export.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [option, receiptPath] = process.argv.slice(2);
if (option !== "--receipt" || process.argv.length !== 4 ||
    !/^\.augnes-local-verification\/receipts\/[A-Za-z0-9_-]{1,160}\.json$/u.test(receiptPath ?? ""))
  throw new Error("usage: export-local-canonical-review.mjs --receipt <original-relative-receipt-path>");
ensureBoundedLocalDirectory(root, path.join(root, ".augnes-local-verification", "receipts"));
const file = path.join(root, receiptPath), stat = lstatSync(file);
if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error("review_export_unsafe_original");
const value = createPrivateReviewExport(readReceiptFile(file));
const outputRoot = ensureBoundedLocalDirectory(root, path.join(root, ".augnes-local-verification", "review"));
const output = path.join(outputRoot, path.basename(receiptPath));
writeFileSync(output, `${canonicalSerialize(value)}\n`, { flag: "wx", mode: 0o600 });
console.log(JSON.stringify({ relative_path: path.relative(root, output), export_fingerprint: value.export_fingerprint,
  original_receipt_fingerprint: value.original_receipt_fingerprint, deciding: false }));
