// Local operator command; no Companion lifecycle or provider operation.
import { readSync, openSync, closeSync, fstatSync, constants } from 'node:fs';
import { handleExternalOperation } from '../lib/vnext/external-response';
import { keys } from '../lib/vnext/external-response-rules.mjs';
import { FILE_EXPORT_REQUEST_BYTES } from '../apps/web_planning/src/files';

function readJson(file: string, limit: number) {
  const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size > limit) throw new Error('local_input_file_bound');
    const bytes = Buffer.alloc(limit + 1);
    // Bounded reads also refuse a file growing after fstat.
    let read = 0;
    while (read < bytes.length) {
      const n = readSync(fd, bytes, read, bytes.length - read, read);
      if (!n) break;
      read += n;
    }
    if (read > limit) throw new Error('local_input_file_bound');
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, read))); }
    catch { throw new Error('local_input_json_or_utf8_invalid'); }
  } finally { closeSync(fd); }
}
async function main() {
  if (process.argv.length !== 4) throw new Error('Usage: node --import tsx scripts/import-web-planning-export.ts <planning-work.json> <admission.json>');
  const request = readJson(process.argv[3], 24_000);
  keys(request, ['repository_root', 'expected_material_ref', 'key', 'project_key', 'expected', 'selected_files', 'applicability', 'attribution']);
  const { repository_root, expected_material_ref, ...data } = request;
  const result = await handleExternalOperation({ repository_root, expected_material_ref, action: 'import_web_export',
    data: { ...data, export: readJson(process.argv[2], FILE_EXPORT_REQUEST_BYTES) } });
  console.log(JSON.stringify(result, null, 2));
}
void main().catch(error => { console.error(error.code ?? error.message); process.exitCode = 1; });
