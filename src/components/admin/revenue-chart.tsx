import { formatPrice } from "@/lib/products";
import type { RevenuePoint } from "@/lib/admin-server";

const SERIES_COLOR = "#2a78d6"; // validated categorical slot 1 (blue) — dataviz skill palette
const HEIGHT = 220;
const BAR_RADIUS = 4;

/** Top-rounded, square-at-baseline bar — the dataviz skill's bar spec. */
function topRoundedBarPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(BAR_RADIUS, width / 2, height);
  if (height <= 0) return "";
  return `M ${x} ${y + height} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + width - r} ${y} Q ${x + width} ${y} ${x + width} ${y + r} L ${x + width} ${y + height} Z`;
}

export function RevenueChart({ points }: { points: RevenuePoint[] }) {
  if (points.length === 0) {
    return (
      <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        No paid orders yet.
      </p>
    );
  }

  const max = Math.max(...points.map((p) => p.revenue), 1);
  const barSlot = 100 / points.length;
  const barWidth = Math.min(24, barSlot * 0.6);
  const labelHeight = 28;
  const valueLabelHeight = 18;
  const plotHeight = HEIGHT - labelHeight - valueLabelHeight;

  return (
    <div>
      <svg
        viewBox={`0 0 100 ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-[220px] w-full overflow-visible"
        role="img"
        aria-label="Revenue by period"
      >
        {/* baseline */}
        <line
          x1={0}
          x2={100}
          y1={valueLabelHeight + plotHeight}
          y2={valueLabelHeight + plotHeight}
          stroke="var(--border)"
          strokeWidth={0.3}
          vectorEffect="non-scaling-stroke"
        />
        {points.map((point, index) => {
          const barHeight = (point.revenue / max) * (plotHeight - 8);
          const cx = index * barSlot + barSlot / 2;
          const x = cx - barWidth / 2;
          const y = valueLabelHeight + plotHeight - barHeight;
          return (
            <g key={point.period}>
              <title>
                {point.period}: {formatPrice(point.revenue)} ({point.orderCount} order
                {point.orderCount === 1 ? "" : "s"})
              </title>
              <path d={topRoundedBarPath(x, y, barWidth, barHeight)} fill={SERIES_COLOR} />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex text-[9px] text-muted-foreground">
        {points.map((point, index) => (
          <div
            key={point.period}
            style={{ width: `${barSlot}%` }}
            className={index % Math.ceil(points.length / 8 || 1) === 0 ? "text-center" : "invisible text-center"}
          >
            {new Date(point.period).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
