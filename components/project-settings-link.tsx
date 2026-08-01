"use client";

import type { MouseEvent, ReactNode } from "react";

export const PROJECT_SETTINGS_ACTIVATION_EVENT =
  "augnes:project-settings-activation";

export function ProjectSettingsLink({
  href,
  name,
  label,
  children,
}: {
  href: string;
  name: string;
  label: "Current project";
  children: ReactNode;
}) {
  function activateExistingOwner(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    window.dispatchEvent(new Event(PROJECT_SETTINGS_ACTIVATION_EVENT));
  }

  return (
    <a
      className="product-project-context product-project-context--action"
      href={href}
      title={`Manage ${name}`}
      aria-label={`Manage current project: ${name}`}
      data-project-context-label={label}
      onClick={activateExistingOwner}
    >
      {children}
    </a>
  );
}
