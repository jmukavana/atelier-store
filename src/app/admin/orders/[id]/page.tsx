import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderTimeline } from "@/components/order-timeline";
import { getAdminOrder } from "@/lib/admin-server";
import { formatPrice } from "@/lib/products";

export const metadata: Metadata = {
  title: "Order Details — Admin",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <nav className="label-tracked mb-8 flex gap-2 text-muted-foreground">
        <Link href="/admin/orders" className="link-underline">
          Orders
        </Link>
        <span>/</span>
        <span>#{order.id.slice(0, 8)}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-tracked text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-2 font-heading text-3xl italic">
            Order #{order.id.slice(0, 8)}
          </h1>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <OrderTimeline status={order.status} />
      </div>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="label-tracked mb-5 text-muted-foreground">Customer</h2>
        <p className="text-sm">
          {order.firstName} {order.lastName}
        </p>
        <p className="text-sm text-muted-foreground">{order.email}</p>
      </section>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="label-tracked mb-5 text-muted-foreground">Items</h2>
        <ul className="divide-y divide-border">
          {order.items.map((item, index) => (
            <li key={index} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                {item.name}
                <span className="text-muted-foreground">
                  {" "}
                  &times;{item.quantity} &middot; {item.size}
                </span>
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {order.shipping === 0 ? "Complimentary" : formatPrice(order.shipping)}
            </span>
          </div>
          <div className="flex justify-between text-base">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="label-tracked mb-5 text-muted-foreground">
          Shipping Address
        </h2>
        <p className="text-sm text-muted-foreground">
          {order.address}
          <br />
          {order.city}, {order.postalCode}
          <br />
          {order.country}
        </p>
      </section>
    </div>
  );
}
