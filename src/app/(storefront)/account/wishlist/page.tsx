import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductGrid } from "@/components/product-grid";
import { getCurrentUser, getMyWishlist } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Wishlist — Atelier",
};

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login?returnTo=/account/wishlist");

  const products = await getMyWishlist();
  const wishlistedSlugs = new Set(products.map((product) => product.slug));

  return (
    <div className="shell py-10 lg:py-14">
      <nav className="label-tracked mb-8 flex gap-2 text-muted-foreground">
        <Link href="/account" className="link-underline">
          Account
        </Link>
        <span>/</span>
        <span>Wishlist</span>
      </nav>

      <p className="label-tracked text-muted-foreground">Saved</p>
      <h1 className="mt-2 font-heading text-3xl italic">Wishlist</h1>

      <div className="mt-10">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing saved yet.{" "}
            <Link href="/products" className="link-underline text-foreground">
              Browse the collection
            </Link>
            .
          </p>
        ) : (
          <ProductGrid products={products} wishlistedSlugs={wishlistedSlugs} />
        )}
      </div>
    </div>
  );
}
