import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { getAdminOrders } from "@/lib/admin-server";
import { formatPrice } from "@/lib/products";

export const metadata: Metadata = {
  title: "Orders — Admin",
};

export default async function AdminOrdersPage() {
  const { items, total } = await getAdminOrders({ limit: 100 });

  return (
    <div>
      <p className="label-tracked text-muted-foreground">Sales</p>
      <h1 className="mt-2 font-heading text-3xl italic">Orders ({total})</h1>

      <div className="mt-8 overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="label-tracked border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-normal">Order</th>
              <th className="px-4 py-3 font-normal">Customer</th>
              <th className="px-4 py-3 font-normal">Date</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="link-underline"
                  >
                    #{order.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {order.firstName} {order.lastName}
                  <br />
                  <span className="text-xs">{order.email}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-US")}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-right">{formatPrice(order.total)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
