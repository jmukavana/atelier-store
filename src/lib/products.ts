export type Category = "outerwear" | "tailoring" | "knitwear" | "accessories";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  compareAtPrice: number | null;
  description: string;
  details: string[];
  sizes: string[];
  mark: string;
  isNew: boolean;
};

export const categories: { value: Category; label: string }[] = [
  { value: "outerwear", label: "Outerwear" },
  { value: "tailoring", label: "Tailoring" },
  { value: "knitwear", label: "Knitwear" },
  { value: "accessories", label: "Accessories" },
];

export function isCategory(value: string | undefined): value is Category {
  return categories.some((category) => category.value === value);
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
