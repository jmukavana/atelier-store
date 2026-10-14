import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = {
  title: "New Product — Admin",
};

export default function NewProductPage() {
  return (
    <div>
      <p className="label-tracked text-muted-foreground">Catalog</p>
      <h1 className="mt-2 font-heading text-3xl italic">New Product</h1>
      <div className="mt-10">
        <ProductForm />
      </div>
    </div>
  );
}
