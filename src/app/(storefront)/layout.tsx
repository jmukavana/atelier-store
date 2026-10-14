import type { ReactNode } from "react";
import { CartProvider } from "@/lib/cart-context";
import { getCurrentUser } from "@/lib/auth-server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <CartProvider>
      <SiteHeader user={user} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </CartProvider>
  );
}
