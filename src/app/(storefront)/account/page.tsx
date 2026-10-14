import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { getCurrentUser, getMyOrders } from "@/lib/auth-server";
import { formatPrice } from "@/lib/products";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = {
  title: "My Account — Atelier",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login?returnTo=/account");

  const orders = await getMyOrders();

  return (
    <div className="shell py-10 lg:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-tracked text-muted-foreground">Account</p>
          <h1 className="mt-2 font-heading text-3xl italic">
            {user.firstName} {user.lastName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <nav className="mt-8 flex gap-6 border-b border-border pb-5">
        <Link href="/account" className="label-tracked text-foreground">
          Orders
        </Link>
        <Link
          href="/account/wishlist"
          className="label-tracked text-muted-foreground"
        >
          Wishlist
        </Link>
      </nav>

      <section className="mt-10">
        <h2 className="label-tracked mb-6 text-muted-foreground">
          Order History
        </h2>

        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t placed an order yet.
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="flex flex-col gap-3 py-5 transition-opacity hover:opacity-70"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="label-tracked text-muted-foreground">
                      Order #{order.id.slice(0, 8)} &middot;{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <p className="text-sm">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.name} &times;{item.quantity} &middot; {item.size}
                      </li>
                    ))}
                  </ul>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
