import type { ReactNode } from "react";

export type ProductSurface =
  | "projects"
  | "home"
  | "workbench"
  | "inspector"
  | "portability"
  | "recovery";

const NAVIGATION: Array<{
  href: string;
  label: string;
  surface: ProductSurface;
}> = [
  { href: "/projects", label: "Projects", surface: "projects" },
  { href: "/", label: "Home", surface: "home" },
  {
    href: "/workbench/semantic-review",
    label: "Workbench",
    surface: "workbench",
  },
  {
    href: "/workbench/inspector?target=project_coordination",
    label: "Inspector",
    surface: "inspector",
  },
  { href: "/portability", label: "Portability", surface: "portability" },
  { href: "/recovery", label: "Recovery", surface: "recovery" },
];

export function ProductShell({
  surface,
  projectContext,
  children,
}: {
  surface: ProductSurface;
  projectContext?: string | null;
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
            <span className="product-brand-mark" aria-hidden="true">A</span>
            <span>
              <strong>Augnes</strong>
              <small>Local project continuity</small>
            </span>
          </a>
          {projectContext ? (
            <p className="product-project-context" title={projectContext}>
              <span>Current project</span>
              <strong>{projectContext}</strong>
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
              {item.label}
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
