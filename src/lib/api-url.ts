/**
 * The backend is reachable at a different address depending on where the
 * code runs. In plain local dev both are the same (localhost:8000), so
 * this is invisible — but under Docker Compose the frontend container
 * must reach the backend over the compose network (e.g. `http://backend:8000`,
 * set via the server-only `API_URL`), while the *browser* on the host can
 * only reach it via the published port (`http://localhost:8000`, the
 * client-safe `NEXT_PUBLIC_API_URL`, inlined into the browser bundle at
 * build time). `typeof window` is what tells shared modules (imported by
 * both server and client components) which address to use.
 */
export function getApiUrl(): string {
  if (typeof window === "undefined") {
    return (
      process.env.API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:8000"
    );
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}
