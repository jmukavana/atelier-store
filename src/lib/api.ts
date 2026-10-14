import type { Category, Product } from "@/lib/products";
import type { CartLine } from "@/lib/cart-context";
import { getApiUrl } from "@/lib/api-url";

const API_URL = getApiUrl();

/**
 * Wire shape returned by the FastAPI backend (snake_case, Python
 * convention). Kept private to this module — everything else in the app
 * works with the camelCase `Product` domain type.
 */
type ProductDTO = {
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

type ProductListDTO = {
  items: ProductDTO[];
  total: number;
  limit: number;
  offset: number;
};

export type OrderStatus = "pending_payment" | "paid";

type OrderDTO = {
  id: string;
  email: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
};

type OrderCheckoutResponseDTO = {
  order: OrderDTO;
  checkout_url: string | null;
};

function fromDTO(dto: ProductDTO): Product {
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

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    // The catalog and order state can change between requests, and this
    // is a small demo backend — always hit it fresh rather than relying
    // on Next.js's fetch cache.
    cache: "no-store",
    // Lets a signed-in visitor's session cookie ride along on client-side
    // calls (e.g. checkout, so the order gets linked to their account). A
    // no-op for server-side calls — there's no browser cookie jar there;
    // see auth-server.ts for how server components forward cookies.
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      body?.detail ?? `Request to ${path} failed with ${response.status}`,
      response.status
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type ProductSort = "newest" | "price_asc" | "price_desc";

export async function getProducts(params: {
  category?: Category;
  search?: string;
  sort?: ProductSort;
} = {}): Promise<Product[]> {
  const query = new URLSearchParams({ limit: "100" });
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.sort) query.set("sort", params.sort);

  const data = await apiFetch<ProductListDTO>(`/api/v1/products?${query}`);
  return data.items.map(fromDTO);
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const data = await apiFetch<ProductListDTO>(
    `/api/v1/products?is_new=true&limit=${limit}`
  );
  return data.items.map(fromDTO);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  try {
    const dto = await apiFetch<ProductDTO>(
      `/api/v1/products/${encodeURIComponent(slug)}`
    );
    return fromDTO(dto);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

export async function getRelatedProducts(
  product: Product,
  count = 4
): Promise<Product[]> {
  const data = await apiFetch<ProductDTO[]>(
    `/api/v1/products/${encodeURIComponent(product.slug)}/related?limit=${count}`
  );
  return data.map(fromDTO);
}

export type ShippingDetails = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

export async function placeOrder(
  shipping: ShippingDetails,
  lines: CartLine[]
): Promise<{ orderId: string; status: OrderStatus; checkoutUrl: string | null }> {
  const response = await apiFetch<OrderCheckoutResponseDTO>("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify({
      email: shipping.email,
      first_name: shipping.firstName,
      last_name: shipping.lastName,
      address: shipping.address,
      city: shipping.city,
      postal_code: shipping.postalCode,
      country: shipping.country,
      items: lines.map((line) => ({
        slug: line.slug,
        size: line.size,
        quantity: line.quantity,
      })),
    }),
  });
  return {
    orderId: response.order.id,
    status: response.order.status,
    checkoutUrl: response.checkout_url,
  };
}

export async function getOrderStatus(
  orderId: string
): Promise<{ status: OrderStatus }> {
  const order = await apiFetch<OrderDTO>(
    `/api/v1/orders/${encodeURIComponent(orderId)}`
  );
  return { status: order.status };
}

export async function subscribeToNewsletter(email: string): Promise<void> {
  await apiFetch<void>("/api/v1/newsletter", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function addToWishlist(slug: string): Promise<void> {
  await apiFetch<void>(`/api/v1/wishlist/${encodeURIComponent(slug)}`, {
    method: "POST",
  });
}

export async function removeFromWishlist(slug: string): Promise<void> {
  await apiFetch<void>(`/api/v1/wishlist/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}
