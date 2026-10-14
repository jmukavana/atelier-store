import type { Metadata } from "next";
import { StatCard } from "@/components/admin/stat-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { CategoryRevenueChart } from "@/components/admin/category-revenue-chart";
import {
  getFinanceSummary,
  getRevenueByCategory,
  getRevenueSeries,
  getTransactions,
} from "@/lib/admin-server";
import { formatPrice } from "@/lib/products";

export const metadata: Metadata = {
  title: "Finance — Admin",
};

export default async function AdminFinancePage() {
  const [summary, revenueSeries, revenueByCategory, transactions] = await Promise.all([
    getFinanceSummary(),
    getRevenueSeries("daily", 30),
    getRevenueByCategory(),
    getTransactions({ limit: 20 }),
  ]);

  return (
    <div>
      <p className="label-tracked text-muted-foreground">Reporting</p>
      <h1 className="mt-2 font-heading text-3xl italic">Finance</h1>

      {summary && (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Revenue" value={formatPrice(summary.totalRevenue)} hint="Paid orders" />
          <StatCard
            label="Avg. Order Value"
            value={formatPrice(summary.averageOrderValue)}
            hint={`${summary.paidOrderCount} paid orders`}
          />
          <StatCard
            label="Pending Payment"
            value={formatPrice(summary.pendingPaymentValue)}
            hint={`${summary.pendingPaymentCount} order${summary.pendingPaymentCount === 1 ? "" : "s"}`}
          />
          <StatCard
            label="Paid Orders"
            value={String(summary.paidOrderCount)}
          />
        </div>
      )}

      <section className="mt-12">
        <h2 className="label-tracked mb-5 text-muted-foreground">
          Revenue — Last 30 Days
        </h2>
        <div className="border border-border p-5">
          <RevenueChart points={revenueSeries} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="label-tracked mb-5 text-muted-foreground">
          Revenue by Category
        </h2>
        <div className="border border-border p-5">
          <CategoryRevenueChart data={revenueByCategory} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="label-tracked mb-5 text-muted-foreground">
          Transactions ({transactions.total})
        </h2>
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="label-tracked border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-normal">Order</th>
                <th className="px-4 py-3 font-normal">Customer</th>
                <th className="px-4 py-3 font-normal">Date</th>
                <th className="px-4 py-3 font-normal">Method</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.items.map((transaction) => (
                <tr key={transaction.orderId}>
                  <td className="px-4 py-3">#{transaction.orderId.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {transaction.customerEmail}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleDateString("en-US")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">
                    {transaction.paymentMethod}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">
                    {transaction.status.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatPrice(transaction.total)}
                  </td>
                </tr>
              ))}
              {transactions.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
