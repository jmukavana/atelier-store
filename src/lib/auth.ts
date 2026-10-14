import { getApiUrl } from "@/lib/api-url";

const API_URL = getApiUrl();

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  createdAt: string;
};

export type UserDTO = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  created_at: string;
};

export function fromUserDTO(dto: UserDTO): User {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.first_name,
    lastName: dto.last_name,
    isAdmin: dto.is_admin,
    createdAt: dto.created_at,
  };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/**
 * For client-side calls only — relies on the browser sending/storing the
 * httpOnly session cookie itself via `credentials: "include"`. Server
 * components can't use this (no browser cookie jar); see auth-server.ts.
 */
async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new AuthError(body?.detail ?? "Request failed", response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function login(
  email: string,
  password: string,
  rememberMe = true
): Promise<User> {
  const dto = await authFetch<UserDTO>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, remember_me: rememberMe }),
  });
  return fromUserDTO(dto);
}

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  rememberMe?: boolean;
}): Promise<User> {
  const dto = await authFetch<UserDTO>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      first_name: input.firstName,
      last_name: input.lastName,
      remember_me: input.rememberMe ?? true,
    }),
  });
  return fromUserDTO(dto);
}

export async function logout(): Promise<void> {
  await authFetch<void>("/api/v1/auth/logout", { method: "POST" });
}
