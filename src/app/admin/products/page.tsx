import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { getAdminProducts } from "@/lib/admin-server";
import { formatPrice } from "@/lib/products";

export const metadata: Metadata = {
  title: "Products — Admin",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const { items, total } = await getAdminProducts({ search, limit: 100 });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-tracked text-muted-foreground">Catalog</p>
          <h1 className="mt-2 font-heading text-3xl italic">
            Products ({total})
          </h1>
        </div>
        <Button asChild className="h-11 px-6">
          <Link href="/admin/products/new">New Product</Link>
        </Button>
      </div>

      <form className="mt-8 max-w-sm">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Search products…"
          className="h-11 rounded-none border-border"
        />
      </form>

      <div className="mt-8 overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="label-tracked border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-normal">Name</th>
              <th className="px-4 py-3 font-normal">Category</th>
              <th className="px-4 py-3 font-normal">Price</th>
              <th className="px-4 py-3 font-normal">New</th>
              <th className="px-4 py-3 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">
                  <p>{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.slug}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {product.category}
                </td>
                <td className="px-4 py-3">
                  {formatPrice(product.price)}
                  {product.compareAtPrice && (
                    <span className="ml-2 text-xs text-muted-foreground line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {product.isNew ? "Yes" : ""}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-4">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="link-underline label-tracked"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton id={product.id} name={product.name} />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
