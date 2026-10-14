import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ProductGrid } from "@/components/product-grid";
import { SortSelect } from "@/components/sort-select";
import { categories, isCategory } from "@/lib/products";
import { getProducts, type ProductSort } from "@/lib/api";
import { getMyWishlistSlugs } from "@/lib/auth-server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All Products — Atelier",
};

const SORTS: ProductSort[] = ["newest", "price_asc", "price_desc"];

function isSort(value: string | undefined): value is ProductSort {
  return !!value && (SORTS as string[]).includes(value);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>;
}) {
  const { category, search, sort } = await searchParams;
  const activeCategory = isCategory(category) ? category : undefined;
  const activeSort = isSort(sort) ? sort : "newest";
  const activeSearch = search?.trim() || undefined;

  const [filtered, wishlistedSlugs] = await Promise.all([
    getProducts({ category: activeCategory, search: activeSearch, sort: activeSort }),
    getMyWishlistSlugs(),
  ]);
  const activeLabel = categories.find((c) => c.value === activeCategory)?.label;

  return (
    <div className="shell py-12 lg:py-16">
      <div className="mb-10 max-w-xl">
        <p className="label-tracked text-muted-foreground">Shop</p>
        <h1 className="mt-2 font-heading text-3xl italic sm:text-4xl">
          {activeSearch ? `Results for “${activeSearch}”` : activeLabel ?? "All Products"}
        </h1>
      </div>

      <div className="mb-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-border pb-5">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href="/products"
            className={cn(
              "label-tracked text-muted-foreground",
              !activeCategory && !activeSearch && "text-foreground"
            )}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.value}
              href={`/products?category=${c.value}`}
              className={cn(
                "label-tracked text-muted-foreground",
                activeCategory === c.value && "text-foreground"
              )}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <Suspense fallback={null}>
          <SortSelect value={activeSort} />
        </Suspense>
      </div>

      <ProductGrid products={filtered} wishlistedSlugs={wishlistedSlugs} />
    </div>
  );
}
