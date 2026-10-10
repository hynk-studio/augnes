/** Keep a protected navigation target attached to its verified source project.
 * An existing explicit target remains explicit; this is navigation, not auth. */
export function projectClientHref(href: string, projectId: string | null | undefined): string {
  if (!projectId || !/^\/workbench\/(?:semantic-review|results|inspector)(?:[/?#]|$)/u.test(href)) return href;
  const url = new URL(href, "http://project-client.invalid");
  if (!url.searchParams.has("project_id")) url.searchParams.set("project_id", projectId);
  return `${url.pathname}${url.search}${url.hash}`;
}

/** The project selector travels in the authenticated request header, outside the
 * strict inspector target grammar. Preserve every target key for validation. */
export function projectClientTargetQuery(params: URLSearchParams): URLSearchParams {
  const target = new URLSearchParams(params);
  target.delete("project_id");
  return target;
}

/** Resolve a legacy scope-less entry once, preserving strict target query data. */
export function projectClientEntryHref(pathname: string, params: Record<string, string | string[] | undefined>, projectId: string): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const entry of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, entry);
  }
  query.set("project_id", projectId);
  return `${pathname}?${query}`;
}
