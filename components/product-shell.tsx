import type { ReactNode } from "react";

export type ProductSurface =
  | "projects"
  | "home"
  | "workbench"
  | "inspector"
  | "portability"
  | "recovery";

export interface ProductProjectContext {
  label: "Current project" | "Viewed project";
  name: string;
}

const NAVIGATION: Array<{
  href: string;
  label: string;
  role: string;
  surface: ProductSurface;
}> = [
  { href: "/projects", label: "Projects", role: "Open work", surface: "projects" },
  { href: "/", label: "Home", role: "Resume", surface: "home" },
  {
    href: "/workbench/semantic-review",
    label: "Workbench",
    role: "Verify · Decide",
    surface: "workbench",
  },
  {
    href: "/workbench/inspector?target=project_coordination",
    label: "Inspector",
    role: "Exact lineage",
    surface: "inspector",
  },
  { href: "/portability", label: "Portability", role: "Transfer", surface: "portability" },
  { href: "/recovery", label: "Recovery", role: "Protect", surface: "recovery" },
];

export function ProductShell({
  surface,
  projectContext,
  children,
}: {
  surface: ProductSurface;
  projectContext?: ProductProjectContext | null;
  children: ReactNode;
}) {
  return (
    <div className="product-shell" data-product-surface={surface}>
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
        <nav className="product-navigation" aria-label="Augnes navigation">
          {NAVIGATION.map((item) => (
            <a
              href={item.href}
              key={item.surface}
              aria-current={item.surface === surface ? "page" : undefined}
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
