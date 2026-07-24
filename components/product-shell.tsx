import type { ReactNode } from "react";

export type PrimaryProductZone = "blank-state" | "ai-workplane";

export type ProductUtilityContext =
  | "project-management"
  | "portability"
  | "recovery";

export interface ProductProjectContext {
  label: "Current project" | "Viewed project";
  name: string;
}

const PRIMARY_NAVIGATION: Array<{
  href: string;
  label: string;
  role: string;
  zone: PrimaryProductZone;
}> = [
  {
    href: "/",
    label: "Blank State",
    role: "Start · Resume",
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
  children,
}: {
  primaryZone: PrimaryProductZone | null;
  utilityContext?: ProductUtilityContext | null;
  projectContext?: ProductProjectContext | null;
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
            <span className="product-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" focusable="false">
                <path d="M7 24V9l9-4 9 4v14" />
                <path d="m7 13 9 4 9-4M16 17v10" />
                <circle cx="7" cy="24" r="2.25" />
                <circle cx="16" cy="27" r="2.25" />
                <circle cx="25" cy="23" r="2.25" />
              </svg>
            </span>
            <span>
              <strong>Augnes</strong>
              <small>Local project continuity</small>
            </span>
          </a>
          {projectContext ? (
            <p
              className="product-project-context"
              title={projectContext.name}
              data-project-context-label={projectContext.label}
            >
              <span>{projectContext.label}</span>
              <strong>{projectContext.name}</strong>
            </p>
          ) : (
            <p className="product-project-context product-project-context--neutral">
              <span>Workspace</span>
              <strong>Local</strong>
            </p>
          )}
        </div>
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
      </header>
      <div id="augnes-main-content" className="product-shell-content" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
