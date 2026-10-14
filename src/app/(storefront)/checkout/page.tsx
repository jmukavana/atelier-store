"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-context";
import { ApiError, placeOrder } from "@/lib/api";
import { formatPrice } from "@/lib/products";

const SHIPPING = 0;

export default function CheckoutPage() {
  const { lines } = useCart();
  const [orderId, setOrderId] = useState<string | null>(null);

  if (orderId) return <Confirmation orderId={orderId} />;
  if (lines.length === 0) return <EmptyState />;
  return (
    <Suspense fallback={null}>
      <CheckoutForm onPlaced={setOrderId} />
    </Suspense>
  );
}

function EmptyState() {
  return (
    <div className="shell flex flex-col items-center gap-4 py-32 text-center">
      <p className="label-tracked text-muted-foreground">Checkout</p>
      <h1 className="font-heading text-3xl italic">Your bag is empty.</h1>
      <Button variant="outline" className="mt-2 h-11 px-7" asChild>
        <Link href="/products">Continue shopping</Link>
      </Button>
    </div>
  );
}

function CheckoutForm({ onPlaced }: { onPlaced: (orderId: string) => void }) {
  const { lines, subtotal, clearCart } = useCart();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const cancelled = useSearchParams().get("cancelled") === "1";

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await placeOrder(
          {
            email: String(formData.get("email") ?? ""),
            firstName: String(formData.get("firstName") ?? ""),
            lastName: String(formData.get("lastName") ?? ""),
            address: String(formData.get("address") ?? ""),
            city: String(formData.get("city") ?? ""),
            postalCode: String(formData.get("postalCode") ?? ""),
            country: String(formData.get("country") ?? ""),
          },
          lines
        );
        if (result.checkoutUrl) {
          // Cart stays intact until payment is actually confirmed — if the
          // visitor cancels on Stripe's page, they land back here able to
          // retry with the same bag.
          window.location.href = result.checkoutUrl;
          return;
        }
        clearCart();
        onPlaced(result.orderId);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "We couldn't place your order. Please try again."
        );
      }
    });
  }

  return (
    <div className="shell py-10 lg:py-14">
      <h1 className="mb-10 font-heading text-3xl italic">Checkout</h1>

      {cancelled && (
        <p className="mb-8 border border-dashed border-border p-4 text-sm text-muted-foreground">
          Payment was cancelled. Your bag is untouched — pick up whenever
          you&apos;re ready.
        </p>
      )}

      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <form action={handleSubmit} className="space-y-10">
          <fieldset className="space-y-4">
            <legend className="label-tracked mb-1 text-muted-foreground">
              Contact
            </legend>
            <Input
              name="email"
              type="email"
              placeholder="Email address"
              required
              className="h-11 rounded-none border-border"
            />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="label-tracked mb-1 text-muted-foreground">
              Shipping Address
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="firstName"
                placeholder="First name"
                required
                className="h-11 rounded-none border-border"
              />
              <Input
                name="lastName"
                placeholder="Last name"
                required
                className="h-11 rounded-none border-border"
              />
            </div>
            <Input
              name="address"
              placeholder="Address"
              required
              className="h-11 rounded-none border-border"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                name="city"
                placeholder="City"
                required
                className="h-11 rounded-none border-border"
              />
              <Input
                name="postalCode"
                placeholder="Postal code"
                required
                className="h-11 rounded-none border-border"
              />
              <Input
                name="country"
                placeholder="Country"
                required
                className="h-11 rounded-none border-border"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="label-tracked mb-1 text-muted-foreground">
              Payment
            </legend>
            <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">
              If Stripe test mode is configured on the backend, you&apos;ll
              be redirected to Stripe&apos;s hosted checkout — use test card
              4242 4242 4242 4242, any future expiry, any CVC. If it
              isn&apos;t configured, the order completes immediately as a
              demo instead. Either way, no real card is ever charged.
            </p>
          </fieldset>

          {error && <p className="text-sm text-accent">{error}</p>}

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full"
            disabled={isPending}
          >
            {isPending ? "Placing Order…" : "Continue to Payment"}
          </Button>
        </form>

        <div className="border border-border p-6 lg:sticky lg:top-24 lg:self-start">
          <p className="label-tracked mb-5 text-muted-foreground">
            Order Summary
          </p>
          <ul className="space-y-4">
            {lines.map((line) => (
              <li
                key={`${line.slug}-${line.size}`}
                className="flex justify-between gap-4 text-sm"
              >
                <span>
                  {line.name}
                  <span className="text-muted-foreground">
                    {" "}
                    &times;{line.quantity} &middot; {line.size}
                  </span>
                </span>
                <span>{formatPrice(line.price * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-5" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {SHIPPING === 0 ? "Complimentary" : formatPrice(SHIPPING)}
              </span>
            </div>
          </div>
          <Separator className="my-5" />
          <div className="flex justify-between text-base">
            <span>Total</span>
            <span>{formatPrice(subtotal + SHIPPING)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Confirmation({ orderId }: { orderId: string }) {
  return (
    <div className="shell flex flex-col items-center gap-4 py-32 text-center">
      <p className="label-tracked text-accent">Order Placed (Demo)</p>
      <h1 className="font-heading text-3xl italic">Thank you.</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your order was recorded in the database — Stripe isn&apos;t
        configured on this backend, so it completed instantly rather than
        redirecting to a payment page. Nothing was charged and nothing will
        ship.
      </p>
      <p className="label-tracked text-muted-foreground">
        Order #{orderId.slice(0, 8)}
      </p>
      <Button variant="outline" className="mt-2 h-11 px-7" asChild>
        <Link href="/products">Continue shopping</Link>
      </Button>
    </div>
  );
}
