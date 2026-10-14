import "server-only";
import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/api-url";

const API_URL = getApiUrl();

/**
 * A Next.js server component makes its own, separate HTTP request to the
 * backend — it does not share the browser's cookie jar. To act "as" the
 * signed-in visitor, we have to read the cookies attached to the incoming
 * request and manually replay them on the outgoing fetch to the API.
 * Shared by auth-server.ts and admin-server.ts.
 */
async function forwardedCookieHeader(): Promise<string> {
  const store = await cookies();
  return store
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

export async function forwardedGet(path: string): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    headers: { Cookie: await forwardedCookieHeader() },
    cache: "no-store",
  });
}
