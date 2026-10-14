import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/api";

const LABELS: Record<OrderStatus, string> = {
  pending_payment: "Payment Pending",
  paid: "Paid",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "label-tracked px-2 py-1",
        status === "paid"
          ? "bg-secondary text-foreground"
          : "bg-accent text-accent-foreground"
      )}
    >
      {LABELS[status]}
    </span>
  );
}
