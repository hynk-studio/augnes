import path from "node:path";

import {
  LOCAL_PROJECT_PATH_DECLARATION_VERSION_V01,
  type LocalProjectPathDeclarationV01,
  type ProjectOnboardingErrorCodeV01,
} from "@/types/vnext/project-onboarding";

export const LOCAL_PROJECT_DECLARED_PATH_MAX_BYTES_V01 = 8 * 1024;

export class LocalProjectPathDeclarationErrorV01 extends Error {
  constructor(
    readonly code: Extract<
      ProjectOnboardingErrorCodeV01,
      | "path_declaration_empty"
      | "path_declaration_too_large"
      | "path_declaration_control_character"
      | "path_declaration_relative"
      | "path_declaration_url"
      | "path_declaration_unsupported"
    >,
    readonly status = 400,
  ) {
    super(code);
    this.name = "LocalProjectPathDeclarationErrorV01";
  }
}

export function parseLocalProjectPathDeclarationV01(
  value: unknown,
  options: { platform?: NodeJS.Platform } = {},
): LocalProjectPathDeclarationV01 {
  if (typeof value !== "string" || value.length === 0) {
    throw new LocalProjectPathDeclarationErrorV01("path_declaration_empty");
  }
  if (Buffer.byteLength(value, "utf8") > LOCAL_PROJECT_DECLARED_PATH_MAX_BYTES_V01) {
    throw new LocalProjectPathDeclarationErrorV01("path_declaration_too_large", 413);
  }
  if (/\p{Cc}/u.test(value)) {
    throw new LocalProjectPathDeclarationErrorV01(
      "path_declaration_control_character",
    );
  }
  const platform = options.platform ?? process.platform;
  if (platform === "darwin") {
    if (/^[a-z][a-z0-9+.-]*:/iu.test(value)) {
      throw new LocalProjectPathDeclarationErrorV01("path_declaration_url");
    }
    if (!path.posix.isAbsolute(value)) {
      throw new LocalProjectPathDeclarationErrorV01("path_declaration_relative");
    }
    return {
      declaration_version: LOCAL_PROJECT_PATH_DECLARATION_VERSION_V01,
      absolute_path: value,
      path_flavor: "posix",
    };
  }
  if (platform === "win32") {
    if (/^[a-z][a-z0-9+.-]*:/iu.test(value) && !/^[a-z]:[\\/]/iu.test(value)) {
      throw new LocalProjectPathDeclarationErrorV01("path_declaration_url");
    }
    if (
      value.startsWith("\\\\") &&
      !/^\\\\\?\\[a-z]:\\/iu.test(value)
    ) {
      throw new LocalProjectPathDeclarationErrorV01(
        "path_declaration_unsupported",
      );
    }
    if (!path.win32.isAbsolute(value)) {
      throw new LocalProjectPathDeclarationErrorV01("path_declaration_relative");
    }
    return {
      declaration_version: LOCAL_PROJECT_PATH_DECLARATION_VERSION_V01,
      absolute_path: value,
      path_flavor: "windows",
    };
  }
  throw new LocalProjectPathDeclarationErrorV01(
    "path_declaration_unsupported",
    422,
  );
}
