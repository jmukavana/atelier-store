"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";

export function CartSheet() {
  const { lines, isOpen, closeCart, setQuantity, removeLine, subtotal, itemCount } =
    useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? undefined : closeCart())}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="label-tracked font-sans">
            Bag ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
            <p className="text-sm text-muted-foreground">Your bag is empty.</p>
            <Button variant="outline" size="sm" onClick={closeCart} asChild>
              <Link href="/products">Continue shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5">
            <ul className="divide-y divide-border">
              {lines.map((line) => (
                <li key={`${line.slug}-${line.size}`} className="flex gap-4 py-5">
                  <div className="plate h-24 w-20 shrink-0">
                    <span className="plate-mark text-3xl">{line.mark}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-heading text-sm">{line.name}</p>
                        <p className="label-tracked mt-0.5 text-muted-foreground">
                          Size {line.size}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.slug, line.size)}
                        aria-label={`Remove ${line.name} from bag`}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button
                          type="button"
                          className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                          onClick={() =>
                            setQuantity(line.slug, line.size, line.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-xs">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setQuantity(line.slug, line.size, line.quantity + 1)
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <p className="text-sm">
                        {formatPrice(line.price * line.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {lines.length > 0 && (
          <SheetFooter className="gap-4 border-t border-border px-5 py-5">
            <Separator className="hidden" />
            <div className="flex items-center justify-between text-sm">
              <span className="label-tracked text-muted-foreground">
                Subtotal
              </span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Shipping and taxes calculated at checkout.
            </p>
            <Button size="lg" className="h-11 w-full" asChild onClick={closeCart}>
              <Link href="/checkout">Checkout</Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
