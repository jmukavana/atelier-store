import Link from "next/link";
import { ProductPlate } from "@/components/product-plate";
import { WishlistButton } from "@/components/wishlist-button";
import { formatPrice, type Product } from "@/lib/products";

export function ProductCard({
  product,
  wishlisted = false,
}: {
  product: Product;
  wishlisted?: boolean;
}) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative">
        <ProductPlate mark={product.mark} />
        {product.isNew && (
          <span className="label-tracked absolute left-3 top-3 bg-background px-2 py-1 text-foreground">
            New
          </span>
        )}
        {product.compareAtPrice && (
          <span className="label-tracked absolute left-3 top-3 bg-accent px-2 py-1 text-accent-foreground">
            Sale
          </span>
        )}
        <WishlistButton
          slug={product.slug}
          initiallyWishlisted={wishlisted}
          className="absolute right-2 top-2"
        />
      </div>
      <div className="mt-3 space-y-1">
        <p className="label-tracked text-muted-foreground">
          {product.category}
        </p>
        <h3 className="link-underline font-heading text-[15px] text-foreground">
          {product.name}
        </h3>
        <p className="flex items-baseline gap-2 text-sm">
          <span className={product.compareAtPrice ? "text-accent" : "text-foreground"}>
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
