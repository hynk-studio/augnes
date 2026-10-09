"use client";

import { projectClientHref } from "@/lib/vnext/project-client-href";

import { createContext, useCallback, useContext, type ReactNode } from "react";

const ProjectClientScope = createContext<string | null>(null);

// This public selector chooses an existing credential. It grants no authority;
// the server checks it against the credential's immutable project scope.
export function ProjectClientScopeProvider({ projectId, children }: { projectId: string | null; children: ReactNode }) {
  return <ProjectClientScope.Provider value={projectId}>{children}</ProjectClientScope.Provider>;
}

export function useProjectClientScope() { return useContext(ProjectClientScope); }

export function projectRequestHeaders(projectId: string | null, init?: HeadersInit): Headers {
  const headers = new Headers(init);
  if (projectId) headers.set("Augnes-Project-Id", projectId);
  return headers;
}

export function useProjectClientFetch(): typeof fetch {
  const projectId = useProjectClientScope();
  return useCallback((input, init) => fetch(input, {
    ...init, headers: projectRequestHeaders(projectId, init?.headers),
  }), [projectId]);
}

export function useProjectClientHref() {
  const projectId = useProjectClientScope();
  return useCallback((href: string) => projectClientHref(href, projectId), [projectId]);
}
