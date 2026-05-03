type DashboardPanelProps = {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
};

export function DashboardPanel({
  title,
  eyebrow,
  children,
}: DashboardPanelProps) {
  return (
    <article className="dashboard-panel">
      <p className="panel-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{children}</p>
    </article>
  );
}
