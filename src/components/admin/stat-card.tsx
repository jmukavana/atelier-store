export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border border-border p-5">
      <p className="label-tracked text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-3xl italic">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
