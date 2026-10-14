import { formatPrice } from "@/lib/products";
import type { CategoryRevenue } from "@/lib/admin-server";

// Fixed categorical order (validated in the dataviz skill's palette) —
// assigned by category identity, never re-cycled if a category is absent.
const CATEGORY_COLOR: Record<string, string> = {
  outerwear: "#2a78d6",
  tailoring: "#eb6834",
  knitwear: "#1baf7a",
  accessories: "#eda100",
};

export function CategoryRevenueChart({ data }: { data: CategoryRevenue[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No paid orders yet.
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div role="img" aria-label="Revenue by category" className="space-y-4">
      {data.map((row) => {
        const percent = Math.max((row.revenue / max) * 100, row.revenue > 0 ? 2 : 0);
        const color = CATEGORY_COLOR[row.category] ?? "#898781";
        return (
          <div key={row.category} className="grid grid-cols-[96px_1fr_auto] items-center gap-3">
            <span className="label-tracked text-xs text-muted-foreground">
              {row.category}
            </span>
            <div className="h-5 rounded-r-full bg-transparent" title={`${row.category}: ${formatPrice(row.revenue)} · ${row.quantity} sold`}>
              <div
                className="h-full rounded-r-full"
                style={{ width: `${percent}%`, backgroundColor: color }}
              />
            </div>
            <span className="whitespace-nowrap text-sm text-foreground">
              {formatPrice(row.revenue)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
