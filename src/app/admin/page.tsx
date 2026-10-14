import type { Metadata } from "next";
import Link from "next/link";
import { StatCard } from "@/components/admin/stat-card";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { getAdminStats } from "@/lib/admin-server";
import { formatPrice } from "@/lib/products";

export const metadata: Metadata = {
  title: "Admin Dashboard — Atelier",
};

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div>
      <p className="label-tracked text-muted-foreground">Overview</p>
      <h1 className="mt-2 font-heading text-3xl italic">Dashboard</h1>

      {!stats ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Couldn&apos;t load dashboard data.
        </p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Revenue" value={formatPrice(stats.totalRevenue)} hint="Paid orders" />
            <StatCard
              label="Orders"
              value={String(stats.orderCount)}
              hint={`${stats.paidOrderCount} paid`}
            />
            <StatCard label="Products" value={String(stats.productCount)} />
            <StatCard label="Customers" value={String(stats.userCount)} />
          </div>

          <section className="mt-12">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="label-tracked text-muted-foreground">Recent Orders</h2>
              <Link href="/admin/orders" className="link-underline label-tracked">
                View all
              </Link>
            </div>

            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto border border-border">
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
                    {stats.recentOrders.map((order) => (
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
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("en-US")}
                        </td>
                        <td className="px-4 py-3">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatPrice(order.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
