import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { SignOutButton } from "@/components/sign-out-button";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/newsletter", label: "Newsletter" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login?returnTo=/admin");
  if (!user.isAdmin) redirect("/");

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-56 shrink-0 border-r border-border sm:flex sm:flex-col">
        <div className="border-b border-border px-6 py-5">
          <Link href="/admin" className="font-heading text-lg italic">
            Atelier Admin
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="label-tracked px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-3 border-t border-border p-4">
          <Link
            href="/"
            className="label-tracked block text-muted-foreground hover:text-foreground"
          >
            &larr; Back to store
          </Link>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:hidden">
          <Link href="/admin" className="font-heading text-lg italic">
            Atelier Admin
          </Link>
          <Link href="/" className="label-tracked text-muted-foreground">
            Store
          </Link>
        </header>
        <nav className="flex gap-4 overflow-x-auto border-b border-border px-4 py-3 sm:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="label-tracked whitespace-nowrap text-muted-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
