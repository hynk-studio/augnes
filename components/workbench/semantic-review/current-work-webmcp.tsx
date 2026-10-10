"use client";

import { useProjectClientFetch } from "./project-client-scope";
import { useEffect } from "react";
import {
  currentWorkWebMcpBindingKey, registerCurrentWorkWebMcp,
  type CurrentWorkModelContext,
} from "@/lib/vnext/adapters/webmcp-current-work";
import type { ProjectWorkInitializationV01 } from "@/types/vnext/project-work-initialization";

export function CurrentWorkWebMcp({ initialization, sessionKey }: {
  initialization: ProjectWorkInitializationV01 | null;
  sessionKey: string | null;
}) {
  const fetch = useProjectClientFetch();
  const binding = currentWorkWebMcpBindingKey(initialization);
  useEffect(() => {
    const native = (document as Document & { modelContext?: CurrentWorkModelContext }).modelContext;
    return registerCurrentWorkWebMcp(native, sessionKey ? binding : null, fetch);
  }, [binding, sessionKey, fetch]);
  return null;
}
