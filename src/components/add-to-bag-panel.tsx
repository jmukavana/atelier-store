"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/wishlist-button";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/products";

export function AddToBagPanel({
  product,
  wishlisted = false,
}: {
  product: Product;
  wishlisted?: boolean;
}) {
  const { addItem } = useCart();
  const [size, setSize] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0] : null
  );
  const [error, setError] = useState(false);

  return (
    <div>
      <div>
        <p className="label-tracked mb-3 text-muted-foreground">
          Size{size ? ` — ${size}` : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setSize(option);
                setError(false);
              }}
              aria-pressed={size === option}
              className={cn(
                "flex h-11 min-w-11 items-center justify-center border px-3 text-sm transition-colors",
                size === option
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:border-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
        {error && (
          <p className="mt-2 text-xs text-accent">Please select a size.</p>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          size="lg"
          className="h-12 flex-1"
          onClick={() => {
            if (!size) {
              setError(true);
              return;
            }
            addItem(product, size);
          }}
        >
          Add to Bag
        </Button>
        <WishlistButton
          slug={product.slug}
          initiallyWishlisted={wishlisted}
          className="size-12 border border-border"
        />
      </div>
    </div>
  );
}
