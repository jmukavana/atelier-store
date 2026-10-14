import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AddToBagPanel } from "@/components/add-to-bag-panel";
import { ProductGrid } from "@/components/product-grid";
import { ProductPlate } from "@/components/product-plate";
import { RecentlyViewedRail } from "@/components/recently-viewed-rail";
import { formatPrice } from "@/lib/products";
import { getProduct, getRelatedProducts } from "@/lib/api";
import { getMyWishlistSlugs } from "@/lib/auth-server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product ? `${product.name} — Atelier` : "Atelier" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [related, wishlistedSlugs] = await Promise.all([
    getRelatedProducts(product),
    getMyWishlistSlugs(),
  ]);

  return (
    <div className="shell py-10 lg:py-14">
      <nav className="label-tracked mb-8 flex gap-2 text-muted-foreground">
        <Link href="/products" className="link-underline">
          Shop
        </Link>
        <span>/</span>
        <Link
          href={`/products?category=${product.category}`}
          className="link-underline"
        >
          {product.category}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="grid grid-cols-2 gap-3 self-start">
          <ProductPlate mark={product.mark} className="col-span-2" />
          <ProductPlate mark={product.mark} markClassName="text-[10vw] sm:text-[3vw]" />
          <ProductPlate mark={product.mark} markClassName="text-[10vw] sm:text-[3vw]" />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          {product.isNew && (
            <p className="label-tracked mb-2 text-accent">New Arrival</p>
          )}
          <h1 className="font-heading text-3xl italic sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 flex items-baseline gap-3 text-lg">
            <span className={product.compareAtPrice ? "text-accent" : ""}>
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </p>
          <p className="mt-5 max-w-md text-sm text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-8">
            <AddToBagPanel
              product={product}
              wishlisted={wishlistedSlugs.has(product.slug)}
            />
          </div>

          <Accordion type="single" collapsible className="mt-10 max-w-md">
            <AccordionItem value="details">
              <AccordionTrigger className="label-tracked py-4">
                Details &amp; Care
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1.5 text-muted-foreground">
                  {product.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger className="label-tracked py-4">
                Shipping &amp; Returns
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Complimentary standard shipping on all orders. Returns are
                accepted within 30 days of delivery, unworn and with tags
                attached.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-border pt-12 lg:mt-28">
          <h2 className="mb-8 font-heading text-2xl italic">
            You may also like
          </h2>
          <ProductGrid products={related} wishlistedSlugs={wishlistedSlugs} />
        </section>
      )}

      <RecentlyViewedRail
        current={{
          slug: product.slug,
          name: product.name,
          price: product.price,
          mark: product.mark,
          category: product.category,
        }}
      />
    </div>
  );
}
