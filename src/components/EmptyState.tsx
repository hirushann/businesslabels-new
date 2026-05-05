type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
};

export default function EmptyState({ title, description, className }: EmptyStateProps) {
  const classes = ["rounded-xl border border-slate-200 bg-slate-50 px-8 py-16 text-center", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <h2 className="text-neutral-800 text-2xl font-bold leading-8">{title}</h2>
      {description ? (
        <p className="mt-3 text-neutral-600 text-base leading-6">{description}</p>
      ) : null}
    </div>
  );
}
