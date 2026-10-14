import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/api";

const STEPS: { key: string; label: string; reached: (status: OrderStatus) => boolean }[] = [
  { key: "placed", label: "Order Placed", reached: () => true },
  {
    key: "paid",
    label: "Payment Confirmed",
    reached: (status) => status === "paid",
  },
];

const UNTRACKED_STEPS = ["Processing", "Shipped", "Delivered"];

/**
 * Deliberately only claims two real states — this is a demo storefront
 * with no fulfillment system behind it, so showing "Shipped"/"Delivered"
 * as if they were tracked would be dishonest. The remaining steps are
 * shown, greyed out and clearly labeled, to communicate the intended
 * design without fabricating progress that never happens.
 */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  return (
    <div>
      <ol className="flex flex-wrap gap-x-8 gap-y-4">
        {STEPS.map((step) => {
          const reached = step.reached(status);
          return (
            <li key={step.key} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-2 shrink-0 rounded-full",
                  reached ? "bg-foreground" : "bg-border"
                )}
              />
              <span
                className={cn(
                  "label-tracked",
                  reached ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
        {UNTRACKED_STEPS.map((label) => (
          <li key={label} className="flex items-center gap-2">
            <span className="flex size-2 shrink-0 rounded-full bg-border" />
            <span className="label-tracked text-muted-foreground/50">
              {label}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-muted-foreground">
        This demo store doesn&apos;t fulfill orders, so tracking stops at
        payment confirmation.
      </p>
    </div>
  );
}
