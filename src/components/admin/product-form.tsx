"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { categories, type Product } from "@/lib/products";
import { createAdminProduct, updateAdminProduct } from "@/lib/admin";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);

    const details = String(formData.get("details") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const sizes = String(formData.get("sizes") ?? "")
      .split(",")
      .map((size) => size.trim())
      .filter(Boolean);
    const compareAtPriceRaw = String(formData.get("compareAtPrice") ?? "").trim();

    const input = {
      slug: String(formData.get("slug") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      category: String(formData.get("category")) as Product["category"],
      price: Number(formData.get("price")),
      compareAtPrice: compareAtPriceRaw ? Number(compareAtPriceRaw) : null,
      description: String(formData.get("description") ?? "").trim(),
      details,
      sizes,
      mark: String(formData.get("mark") ?? "").trim(),
      isNew: formData.get("isNew") === "on",
    };

    startTransition(async () => {
      try {
        if (product) {
          await updateAdminProduct(product.id, input);
        } else {
          await createAdminProduct(input);
        }
        router.push("/admin/products");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong saving this product."
        );
      }
    });
  }

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input
            name="name"
            defaultValue={product?.name}
            required
            className="h-11 rounded-none border-border"
          />
        </Field>
        <Field label="Slug" hint="lowercase, hyphenated — used in the product URL">
          <Input
            name="slug"
            defaultValue={product?.slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className="h-11 rounded-none border-border"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Category">
          <select
            name="category"
            defaultValue={product?.category ?? categories[0].value}
            className="h-11 w-full border border-border bg-background px-3 text-sm"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price (USD)">
          <Input
            name="price"
            type="number"
            min={1}
            defaultValue={product?.price}
            required
            className="h-11 rounded-none border-border"
          />
        </Field>
        <Field label="Compare-at price" hint="optional — shows as a sale">
          <Input
            name="compareAtPrice"
            type="number"
            min={1}
            defaultValue={product?.compareAtPrice ?? undefined}
            className="h-11 rounded-none border-border"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mark" hint="single letter shown on the placeholder plate">
          <Input
            name="mark"
            maxLength={4}
            defaultValue={product?.mark}
            required
            className="h-11 rounded-none border-border"
          />
        </Field>
        <Field label="Sizes" hint="comma-separated, e.g. S, M, L, XL">
          <Input
            name="sizes"
            defaultValue={product?.sizes.join(", ")}
            required
            className="h-11 rounded-none border-border"
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          name="description"
          defaultValue={product?.description}
          required
          rows={3}
          className="w-full border border-border bg-background p-3 text-sm"
        />
      </Field>

      <Field label="Details" hint="one per line">
        <textarea
          name="details"
          defaultValue={product?.details.join("\n")}
          rows={4}
          className="w-full border border-border bg-background p-3 text-sm"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isNew"
          defaultChecked={product?.isNew}
          className="size-4"
        />
        Mark as new arrival
      </label>

      {error && <p className="text-sm text-accent">{error}</p>}

      <Button type="submit" size="lg" className="h-12 px-8" disabled={isPending}>
        {isPending ? "Saving…" : product ? "Save Changes" : "Create Product"}
      </Button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label-tracked mb-2 block text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
