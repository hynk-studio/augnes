// Shared by the private Web editor and the stdio reviewer. Keep untouched
// source bytes, including a BOM and line endings, outside the replacement.
export function decodeExchangeText(bytes, name) {
  if (!/\.(?:md|markdown|txt)$/i.test(name) || bytes.length > 32768)
    throw new Error('Use the private Web download for this file. Text editing supports UTF-8 up to 32 KiB.');
  const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text))
    throw new Error('Use the private Web download for non-text material.');
  return text;
}

export function replaceExchangePassage(source, find, replacement) {
  const first = source.indexOf(find);
  if (!find || first < 0 || first !== source.lastIndexOf(find) || find === replacement ||
      !find.isWellFormed() || !replacement.isWellFormed())
    throw new Error('Choose one unique original passage and a different valid replacement.');
  const edited = new TextEncoder().encode(source.slice(0, first) + replacement + source.slice(first + find.length));
  if (edited.length > 32768) throw new Error('Edited file exceeds the 32 KiB text limit.');
  return edited;
}
