import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product-grid";
import { ProductPlate } from "@/components/product-plate";
import { getFeaturedProducts, getProduct, getProducts } from "@/lib/api";
import { getMyWishlistSlugs } from "@/lib/auth-server";

export default async function Home() {
  const [featured, editorial, knitwear, wishlistedSlugs] = await Promise.all([
    getFeaturedProducts(4),
    getProduct("wool-overcoat"),
    getProducts({ category: "knitwear" }),
    getMyWishlistSlugs(),
  ]);

  if (!editorial) return null;

  return (
    <>
      <section className="relative">
        <ProductPlate
          mark="A"
          ratio={16 / 10}
          align="corner"
          className="h-[70vh] min-h-[480px] w-full"
        />
        <div className="absolute inset-0 flex flex-col items-start justify-end">
          <div className="shell w-full pb-14">
            <p className="label-tracked text-muted-foreground">
              Autumn / Winter
            </p>
            <h1 className="mt-3 max-w-xl font-heading text-4xl italic leading-[1.05] sm:text-6xl">
              Considered pieces, built to outlast the season.
            </h1>
            <Button size="lg" className="mt-8 h-12 px-8" asChild>
              <Link href="/products">Shop the Collection</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="shell py-16 lg:py-24">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-heading text-2xl italic sm:text-3xl">
            New Arrivals
          </h2>
          <Link
            href="/products"
            className="link-underline label-tracked hidden sm:block"
          >
            View all
          </Link>
        </div>
        <ProductGrid products={featured} wishlistedSlugs={wishlistedSlugs} />
      </section>

      <section className="border-t border-border">
        <div className="grid lg:grid-cols-2">
          <ProductPlate mark={editorial.mark} ratio={1} className="h-full" />
          <div className="shell flex flex-col justify-center gap-5 py-16 lg:py-0">
            <p className="label-tracked text-muted-foreground">
              The Overcoat
            </p>
            <h2 className="max-w-md font-heading text-3xl italic leading-tight">
              One coat, worn every winter, for winters to come.
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {editorial.description}
            </p>
            <div>
              <Button variant="outline" size="lg" className="mt-2 h-11 px-7" asChild>
                <Link href={`/products/${editorial.slug}`}>Discover</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-16 lg:py-24">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-heading text-2xl italic sm:text-3xl">
            Knitwear
          </h2>
          <Link
            href="/products?category=knitwear"
            className="link-underline label-tracked hidden sm:block"
          >
            View all
          </Link>
        </div>
        <ProductGrid products={knitwear} wishlistedSlugs={wishlistedSlugs} />
      </section>
    </>
  );
}
