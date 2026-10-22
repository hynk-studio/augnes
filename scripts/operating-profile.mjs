#!/usr/bin/env node
import { openSync, fstatSync, readSync, writeSync, closeSync, constants } from 'node:fs';
import { TextDecoder } from 'node:util';
import { OperatingProfileError, OPERATING_PROFILE_LIMITS,
  previewOperatingProfile, renderOperatingProfilePreview } from '../lib/vnext/operating-profile.mjs';

const help = `Usage: node scripts/operating-profile.mjs <profile.json> [--format text|json]

Validate one explicitly selected local JSON file and print a read-only preview.
The default format is text. No source lookup, application write or action occurs.
Profile strings and source locators are inert authored data. Do not supply secrets.
Only regular files are supported; input is limited to ${OPERATING_PROFILE_LIMITS.input_bytes} UTF-8 bytes.
This entry requires O_NOFOLLOW support (Linux/macOS); Windows support is not claimed.
`;

function readSelectedFile(file) {
  let descriptor;
  try {
    if (!constants.O_NOFOLLOW) throw new OperatingProfileError('profile_file_platform_unsupported');
    descriptor = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW | (constants.O_NONBLOCK ?? 0));
    const before = fstatSync(descriptor);
    if (!before.isFile()) throw new OperatingProfileError('profile_regular_file_required');
    if (before.size > OPERATING_PROFILE_LIMITS.input_bytes) throw new OperatingProfileError('profile_input_limit');
    const bytes = Buffer.alloc(OPERATING_PROFILE_LIMITS.input_bytes + 1);
    let size = 0;
    while (size < bytes.length) {
      const read = readSync(descriptor, bytes, size, bytes.length - size, null);
      if (read === 0) break;
      size += read;
    }
    const after = fstatSync(descriptor);
    if (size > OPERATING_PROFILE_LIMITS.input_bytes) throw new OperatingProfileError('profile_input_limit');
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || size !== before.size)
      throw new OperatingProfileError('profile_file_changed');
    try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes.subarray(0, size)); }
    catch { throw new OperatingProfileError('profile_invalid_utf8'); }
  } finally { if (descriptor !== undefined) closeSync(descriptor); }
}

function writeOutput(descriptor, text) {
  const bytes = Buffer.from(text, 'utf8');
  let offset = 0;
  try {
    while (offset < bytes.length) {
      const written = writeSync(descriptor, bytes, offset, bytes.length - offset);
      if (written <= 0) throw new Error('output unavailable');
      offset += written;
    }
  } catch { throw new OperatingProfileError('profile_output_unavailable'); }
}

try {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') writeOutput(1, help);
  else {
    if ((args.length !== 1 && args.length !== 3) || !args[0] || args[0].startsWith('--') ||
        (args.length === 3 && (args[1] !== '--format' || !['text', 'json'].includes(args[2]))))
      throw new OperatingProfileError('profile_cli_arguments');
    const preview = previewOperatingProfile(readSelectedFile(args[0]));
    writeOutput(1, renderOperatingProfilePreview(preview, args[2] ?? 'text'));
  }
} catch (error) {
  // Bounded refusal never echoes the selected path, authored input or a stack.
  const reason = error instanceof OperatingProfileError ? error.code : 'profile_file_unreadable';
  const at = error instanceof OperatingProfileError ? error.at : '$';
  try { writeOutput(2, `${JSON.stringify({ status: 'refused', reason, at })}\n`); } catch { /* stderr may itself be closed */ }
  process.exitCode = 2;
}
