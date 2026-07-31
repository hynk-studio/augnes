import type { ReactNode } from "react";

import { ProjectSettingsLink } from "@/components/project-settings-link";

export type PrimaryProductZone = "blank-state" | "ai-workplane";

export type ProductUtilityContext =
  | "project-management"
  | "portability"
  | "recovery";

export interface ProductProjectContext {
  label: "Current project" | "Viewed project";
  name: string;
  managementHref?: string;
}

const PRIMARY_NAVIGATION: Array<{
  href: string;
  label: string;
  role: string;
  zone: PrimaryProductZone;
}> = [
  {
    href: "/",
    label: "Continuities",
    role: "Carry · Resume",
    zone: "blank-state",
  },
  {
    href: "/workbench/semantic-review",
    label: "AI Workplane",
    role: "Work · Review",
    zone: "ai-workplane",
  },
];

export function ProductShell({
  primaryZone,
  utilityContext = null,
  projectContext,
  secondaryNavigation = null,
  railSupport = null,
  children,
}: {
  primaryZone: PrimaryProductZone | null;
  utilityContext?: ProductUtilityContext | null;
  projectContext?: ProductProjectContext | null;
  secondaryNavigation?: ReactNode;
  railSupport?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="product-shell"
      data-primary-product-zone={primaryZone ?? "none"}
      data-product-utility-context={utilityContext ?? "none"}
    >
      <a className="product-skip-link" href="#augnes-main-content">
        Skip to content
      </a>
      <header className="product-shell-header">
        <div className="product-shell-bar">
          <a className="product-brand" href="/" aria-label="Augnes home">
            <span>
              <strong>Augnes</strong>
              <small>Local project continuity</small>
            </span>
          </a>
          {projectContext ? (
            projectContext.label === "Current project" &&
            projectContext.managementHref ? (
              <ProjectSettingsLink
                href={projectContext.managementHref}
                name={projectContext.name}
                label={projectContext.label}
              >
                <span>{projectContext.label}</span>
                <strong>{projectContext.name}</strong>
              </ProjectSettingsLink>
            ) : (
              <p
                className="product-project-context"
                title={projectContext.name}
                data-project-context-label={projectContext.label}
              >
                <span>{projectContext.label}</span>
                <strong>{projectContext.name}</strong>
              </p>
            )
          ) : (
            <p className="product-project-context product-project-context--neutral">
              <span>Workspace</span>
              <strong>Local</strong>
            </p>
          )}
        </div>
        <div className="product-navigation-rail">
          <nav className="product-navigation" aria-label="Primary navigation">
            {PRIMARY_NAVIGATION.map((item) => (
              <a
                href={item.href}
                key={item.zone}
                aria-current={item.zone === primaryZone ? "page" : undefined}
              >
                <span aria-hidden="true" className="product-navigation-node" />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.role}</small>
                </span>
              </a>
            ))}
          </nav>
          {secondaryNavigation}
          {railSupport}
        </div>
      </header>
      <div id="augnes-main-content" className="product-shell-content" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
