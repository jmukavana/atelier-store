import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/products";

export function ProductGrid({
  products,
  wishlistedSlugs,
}: {
  products: Product[];
  wishlistedSlugs?: Set<string>;
}) {
  if (products.length === 0) {
    return (
      <p className="py-24 text-center text-sm text-muted-foreground">
        No pieces found in this category yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
      {products.map((product) => (
        <ProductCard
          key={product.slug}
          product={product}
          wishlisted={wishlistedSlugs?.has(product.slug)}
        />
      ))}
    </div>
  );
}
