import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProduct } from "@/lib/admin-server";

export const metadata: Metadata = {
  title: "Edit Product — Admin",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();

  return (
    <div>
      <p className="label-tracked text-muted-foreground">Catalog</p>
      <h1 className="mt-2 font-heading text-3xl italic">{product.name}</h1>
      <div className="mt-10">
        <ProductForm product={product} />
      </div>
    </div>
  );
}
