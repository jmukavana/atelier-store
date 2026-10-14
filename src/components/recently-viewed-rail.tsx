"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductPlate } from "@/components/product-plate";
import { formatPrice } from "@/lib/products";
import {
  recordView,
  readAll,
  type RecentlyViewedItem,
} from "@/lib/recently-viewed";

/**
 * Records the current product as viewed, then renders whatever else is in
 * the visitor's recently-viewed list (excluding the current product).
 * Client-only/localStorage — there's no server-side notion of "this
 * visitor", so this can't be done in the product page's server component.
 */
export function RecentlyViewedRail({
  current,
}: {
  current: RecentlyViewedItem;
}) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    // Reads localStorage after mount (unavailable during SSR) — the same
    // justified exception as the cart's hydration effect.
    recordView(current);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readAll().filter((item) => item.slug !== current.slug));
    // Only ever needs to run once per product page visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.slug]);

  if (items.length === 0) return null;

  return (
    <section className="mt-20 border-t border-border pt-12 lg:mt-28">
      <h2 className="mb-8 font-heading text-2xl italic">Recently Viewed</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
        {items.slice(0, 4).map((item) => (
          <Link key={item.slug} href={`/products/${item.slug}`} className="group block">
            <ProductPlate mark={item.mark} />
            <div className="mt-3 space-y-1">
              <p className="label-tracked text-muted-foreground">
                {item.category}
              </p>
              <h3 className="link-underline font-heading text-[15px] text-foreground">
                {item.name}
              </h3>
              <p className="text-sm">{formatPrice(item.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
