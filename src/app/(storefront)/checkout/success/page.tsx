"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { getOrderStatus } from "@/lib/api";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}

type State = "confirming" | "paid" | "pending" | "error";

function SuccessContent() {
  const orderId = useSearchParams().get("order_id");
  const { clearCart } = useCart();
  const [state, setState] = useState<State>(() => (orderId ? "confirming" : "error"));

  useEffect(() => {
    if (!orderId) return;
    getOrderStatus(orderId)
      .then(({ status }) => {
        if (status === "paid") {
          clearCart();
          setState("paid");
        } else {
          setState("pending");
        }
      })
      .catch(() => setState("error"));
    // Only ever needs to run once, for the order in the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (state === "confirming") {
    return (
      <div className="shell flex flex-col items-center gap-4 py-32 text-center">
        <p className="label-tracked text-muted-foreground">
          Confirming payment…
        </p>
      </div>
    );
  }

  if (state === "paid") {
    return (
      <div className="shell flex flex-col items-center gap-4 py-32 text-center">
        <p className="label-tracked text-accent">Payment Confirmed</p>
        <h1 className="font-heading text-3xl italic">Thank you.</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Stripe confirmed your (test-mode) payment and it was recorded in
          the database. This is a demo storefront — nothing will ship.
        </p>
        {orderId && (
          <p className="label-tracked text-muted-foreground">
            Order #{orderId.slice(0, 8)}
          </p>
        )}
        <Button variant="outline" className="mt-2 h-11 px-7" asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  if (state === "pending") {
    return (
      <div className="shell flex flex-col items-center gap-4 py-32 text-center">
        <p className="label-tracked text-muted-foreground">
          Payment Not Yet Confirmed
        </p>
        <h1 className="font-heading text-3xl italic">Still processing.</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Stripe hasn&apos;t confirmed this payment yet. If you completed
          checkout, this should resolve shortly — refresh in a moment.
        </p>
        <Button variant="outline" className="mt-2 h-11 px-7" asChild>
          <Link href="/checkout">Back to checkout</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="shell flex flex-col items-center gap-4 py-32 text-center">
      <p className="label-tracked text-muted-foreground">Something went wrong</p>
      <h1 className="font-heading text-3xl italic">
        We couldn&apos;t confirm this order.
      </h1>
      <Button variant="outline" className="mt-2 h-11 px-7" asChild>
        <Link href="/products">Continue shopping</Link>
      </Button>
    </div>
  );
}
