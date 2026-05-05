const blockedSingleSegments = new Set([
  "auth",
  "authorization",
  "debug",
  "password",
  "provider",
  "secret",
  "session",
  "token",
]);

const blockedSegmentPairs = new Set([
  "api:key",
  "internal:prompt",
  "raw:prompt",
  "run:id",
  "session:id",
  "thread:id",
  "trace:id",
  "workspace:id",
]);

function splitKeySegments(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .flatMap((segment) => segment.split(/\s+/))
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);
}

function shouldStripKey(key: string): boolean {
  const segments = splitKeySegments(key);
  if (!segments.length) return false;

  if (segments.some((segment) => blockedSingleSegments.has(segment))) {
    return true;
  }

  for (let index = 0; index < segments.length - 1; index += 1) {
    if (blockedSegmentPairs.has(`${segments[index]}:${segments[index + 1]}`)) {
      return true;
    }
  }

  return false;
}

export function sanitizeValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item)) as T;
  }

  if (value && typeof value === "object") {
    const sanitizedEntries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !shouldStripKey(key))
      .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)]);

    return Object.fromEntries(sanitizedEntries) as T;
  }

  return value;
}
