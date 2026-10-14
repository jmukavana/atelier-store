"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ProductSort } from "@/lib/api";

const LABELS: Record<ProductSort, string> = {
  newest: "Newest",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
};

export function SortSelect({ value }: { value: ProductSort }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }
    router.push(`/products?${params.toString()}`);
  }

  return (
    <label className="label-tracked flex items-center gap-2 text-muted-foreground">
      Sort
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="border border-border bg-background px-2 py-1.5 text-foreground"
      >
        {(Object.keys(LABELS) as ProductSort[]).map((sort) => (
          <option key={sort} value={sort}>
            {LABELS[sort]}
          </option>
        ))}
      </select>
    </label>
  );
}
