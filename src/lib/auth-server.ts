import "server-only";
import { fromUserDTO, type User } from "@/lib/auth";
import { forwardedGet } from "@/lib/server-fetch";
import type { Category, Product } from "@/lib/products";
import type { OrderStatus } from "@/lib/api";

export async function getCurrentUser(): Promise<User | null> {
  const response = await forwardedGet("/api/v1/auth/me");
  if (!response.ok) return null;
  return fromUserDTO(await response.json());
}

export type OrderSummaryItem = {
  name: string;
  size: string;
  quantity: number;
  price: number;
};

export type OrderSummary = {
  id: string;
  createdAt: string;
  total: number;
  status: OrderStatus;
  items: OrderSummaryItem[];
};

export type OrderDetail = OrderSummary & {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  subtotal: number;
  shipping: number;
};

export type OrderDTO = {
  id: string;
  created_at: string;
  total: number;
  status: OrderStatus;
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  subtotal: number;
  shipping: number;
  items: { name: string; size: string; quantity: number; price: number }[];
};

export function fromOrderDTO(dto: OrderDTO): OrderDetail {
  return {
    id: dto.id,
    createdAt: dto.created_at,
    total: dto.total,
    status: dto.status,
    email: dto.email,
    firstName: dto.first_name,
    lastName: dto.last_name,
    address: dto.address,
    city: dto.city,
    postalCode: dto.postal_code,
    country: dto.country,
    subtotal: dto.subtotal,
    shipping: dto.shipping,
    items: dto.items.map((item) => ({
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    })),
  };
}

export async function getMyOrders(): Promise<OrderSummary[]> {
  const response = await forwardedGet("/api/v1/orders/me");
  if (!response.ok) return [];
  const orders = (await response.json()) as OrderDTO[];
  return orders.map(fromOrderDTO);
}

/** Returns null if the order doesn't exist, or the caller can't view it
 * (not the owner). */
export async function getOrder(orderId: string): Promise<OrderDetail | null> {
  const response = await forwardedGet(
    `/api/v1/orders/${encodeURIComponent(orderId)}`
  );
  if (!response.ok) return null;
  return fromOrderDTO(await response.json());
}

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  compare_at_price: number | null;
  description: string;
  details: string[];
  sizes: string[];
  mark: string;
  is_new: boolean;
};

export function fromProductDTO(dto: ProductDTO): Product {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    category: dto.category,
    price: dto.price,
    compareAtPrice: dto.compare_at_price,
    description: dto.description,
    details: dto.details,
    sizes: dto.sizes,
    mark: dto.mark,
    isNew: dto.is_new,
  };
}

/** Empty (not null) when signed out — callers that gate on auth should
 * check `getCurrentUser()` first if they need to distinguish. */
export async function getMyWishlist(): Promise<Product[]> {
  const response = await forwardedGet("/api/v1/wishlist");
  if (!response.ok) return [];
  const products = (await response.json()) as ProductDTO[];
  return products.map(fromProductDTO);
}

export async function getMyWishlistSlugs(): Promise<Set<string>> {
  const response = await forwardedGet("/api/v1/wishlist/slugs");
  if (!response.ok) return new Set();
  return new Set((await response.json()) as string[]);
}
