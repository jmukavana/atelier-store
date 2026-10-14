import { getApiUrl } from "@/lib/api-url";
import { ApiError } from "@/lib/api";
import type { Category } from "@/lib/products";

const API_URL = getApiUrl();

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.detail ?? "Request failed", response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type ProductFormInput = {
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

function toPayload(input: Partial<ProductFormInput>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (input.slug !== undefined) payload.slug = input.slug;
  if (input.name !== undefined) payload.name = input.name;
  if (input.category !== undefined) payload.category = input.category;
  if (input.price !== undefined) payload.price = input.price;
  if (input.compareAtPrice !== undefined) payload.compare_at_price = input.compareAtPrice;
  if (input.description !== undefined) payload.description = input.description;
  if (input.details !== undefined) payload.details = input.details;
  if (input.sizes !== undefined) payload.sizes = input.sizes;
  if (input.mark !== undefined) payload.mark = input.mark;
  if (input.isNew !== undefined) payload.is_new = input.isNew;
  return payload;
}

export async function createAdminProduct(
  input: ProductFormInput
): Promise<{ id: string }> {
  const dto = await adminFetch<{ id: string }>("/api/v1/admin/products", {
    method: "POST",
    body: JSON.stringify(toPayload(input)),
  });
  return { id: dto.id };
}

export async function updateAdminProduct(
  id: string,
  input: Partial<ProductFormInput>
): Promise<void> {
  await adminFetch(`/api/v1/admin/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(toPayload(input)),
  });
}

export async function deleteAdminProduct(id: string): Promise<void> {
  await adminFetch<void>(`/api/v1/admin/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
