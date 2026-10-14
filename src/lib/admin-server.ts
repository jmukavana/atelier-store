import "server-only";
import { forwardedGet } from "@/lib/server-fetch";
import { fromUserDTO, type User, type UserDTO } from "@/lib/auth";
import {
  fromOrderDTO,
  fromProductDTO,
  type OrderDetail,
  type OrderDTO,
  type ProductDTO,
} from "@/lib/auth-server";
import type { Category, Product } from "@/lib/products";
import type { OrderStatus } from "@/lib/api";

export type AdminStats = {
  totalRevenue: number;
  orderCount: number;
  paidOrderCount: number;
  productCount: number;
  userCount: number;
  recentOrders: OrderDetail[];
};

type AdminStatsDTO = {
  total_revenue: number;
  order_count: number;
  paid_order_count: number;
  product_count: number;
  user_count: number;
  recent_orders: OrderDTO[];
};

export async function getAdminStats(): Promise<AdminStats | null> {
  const response = await forwardedGet("/api/v1/admin/stats");
  if (!response.ok) return null;
  const dto = (await response.json()) as AdminStatsDTO;
  return {
    totalRevenue: dto.total_revenue,
    orderCount: dto.order_count,
    paidOrderCount: dto.paid_order_count,
    productCount: dto.product_count,
    userCount: dto.user_count,
    recentOrders: dto.recent_orders.map(fromOrderDTO),
  };
}

export type Paginated<T> = { items: T[]; total: number; limit: number; offset: number };

export async function getAdminProducts(params: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Paginated<Product>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));

  const response = await forwardedGet(`/api/v1/admin/products?${query}`);
  if (!response.ok) return { items: [], total: 0, limit: params.limit ?? 50, offset: 0 };
  const dto = (await response.json()) as {
    items: ProductDTO[];
    total: number;
    limit: number;
    offset: number;
  };
  return { ...dto, items: dto.items.map(fromProductDTO) };
}

export async function getAdminProduct(productId: string): Promise<Product | null> {
  const response = await forwardedGet(
    `/api/v1/admin/products/${encodeURIComponent(productId)}`
  );
  if (!response.ok) return null;
  return fromProductDTO(await response.json());
}

export async function getAdminOrders(params: {
  limit?: number;
  offset?: number;
} = {}): Promise<Paginated<OrderDetail>> {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));

  const response = await forwardedGet(`/api/v1/admin/orders?${query}`);
  if (!response.ok) return { items: [], total: 0, limit: params.limit ?? 24, offset: 0 };
  const dto = (await response.json()) as {
    items: OrderDTO[];
    total: number;
    limit: number;
    offset: number;
  };
  return { ...dto, items: dto.items.map(fromOrderDTO) };
}

export async function getAdminOrder(orderId: string): Promise<OrderDetail | null> {
  const response = await forwardedGet(
    `/api/v1/admin/orders/${encodeURIComponent(orderId)}`
  );
  if (!response.ok) return null;
  return fromOrderDTO(await response.json());
}

export async function getAdminUsers(params: {
  limit?: number;
  offset?: number;
} = {}): Promise<Paginated<User>> {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));

  const response = await forwardedGet(`/api/v1/admin/users?${query}`);
  if (!response.ok) return { items: [], total: 0, limit: params.limit ?? 24, offset: 0 };
  const dto = (await response.json()) as {
    items: UserDTO[];
    total: number;
    limit: number;
    offset: number;
  };
  return { ...dto, items: dto.items.map(fromUserDTO) };
}

export type NewsletterSubscriber = { id: string; email: string; createdAt: string };

export async function getAdminNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const response = await forwardedGet("/api/v1/admin/newsletter");
  if (!response.ok) return [];
  const dto = (await response.json()) as { id: string; email: string; created_at: string }[];
  return dto.map((s) => ({ id: s.id, email: s.email, createdAt: s.created_at }));
}

// --- Finance ----------------------------------------------------------------

export type FinanceSummary = {
  totalRevenue: number;
  paidOrderCount: number;
  averageOrderValue: number;
  pendingPaymentCount: number;
  pendingPaymentValue: number;
};

export async function getFinanceSummary(): Promise<FinanceSummary | null> {
  const response = await forwardedGet("/api/v1/admin/finance/summary");
  if (!response.ok) return null;
  const dto = (await response.json()) as {
    total_revenue: number;
    paid_order_count: number;
    average_order_value: number;
    pending_payment_count: number;
    pending_payment_value: number;
  };
  return {
    totalRevenue: dto.total_revenue,
    paidOrderCount: dto.paid_order_count,
    averageOrderValue: dto.average_order_value,
    pendingPaymentCount: dto.pending_payment_count,
    pendingPaymentValue: dto.pending_payment_value,
  };
}

export type RevenuePoint = { period: string; revenue: number; orderCount: number };

export async function getRevenueSeries(
  period: "daily" | "weekly" | "monthly" = "daily",
  limit = 30
): Promise<RevenuePoint[]> {
  const response = await forwardedGet(
    `/api/v1/admin/finance/revenue?period=${period}&limit=${limit}`
  );
  if (!response.ok) return [];
  const dto = (await response.json()) as {
    period: string;
    revenue: number;
    order_count: number;
  }[];
  return dto.map((point) => ({
    period: point.period,
    revenue: point.revenue,
    orderCount: point.order_count,
  }));
}

export type CategoryRevenue = { category: Category; revenue: number; quantity: number };

export async function getRevenueByCategory(): Promise<CategoryRevenue[]> {
  const response = await forwardedGet("/api/v1/admin/finance/revenue-by-category");
  if (!response.ok) return [];
  return (await response.json()) as CategoryRevenue[];
}

export type Transaction = {
  orderId: string;
  createdAt: string;
  customerEmail: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: "stripe" | "demo";
};

export async function getTransactions(params: {
  limit?: number;
  offset?: number;
} = {}): Promise<Paginated<Transaction>> {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));

  const response = await forwardedGet(`/api/v1/admin/finance/transactions?${query}`);
  if (!response.ok) return { items: [], total: 0, limit: params.limit ?? 24, offset: 0 };
  const dto = (await response.json()) as {
    items: {
      order_id: string;
      created_at: string;
      customer_email: string;
      subtotal: number;
      shipping: number;
      total: number;
      status: OrderStatus;
      payment_method: "stripe" | "demo";
    }[];
    total: number;
    limit: number;
    offset: number;
  };
  return {
    ...dto,
    items: dto.items.map((t) => ({
      orderId: t.order_id,
      createdAt: t.created_at,
      customerEmail: t.customer_email,
      subtotal: t.subtotal,
      shipping: t.shipping,
      total: t.total,
      status: t.status,
      paymentMethod: t.payment_method,
    })),
  };
}
