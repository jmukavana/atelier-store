"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, Search, ShoppingBag, User as UserIcon } from "lucide-react";
import { categories } from "@/lib/products";
import type { User } from "@/lib/auth";
import { useCart } from "@/lib/cart-context";
import { CartSheet } from "@/components/cart-sheet";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function SiteHeader({ user }: { user: User | null }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { openCart, itemCount } = useCart();

  function handleSearch(formData: FormData) {
    const query = String(formData.get("search") ?? "").trim();
    setSearchOpen(false);
    if (query) router.push(`/products?search=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="shell flex h-16 items-center justify-between lg:h-20">
        <button
          type="button"
          className="flex items-center gap-2 lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        <nav className="hidden items-center gap-7 lg:flex">
          {categories.map((category) => (
            <Link
              key={category.value}
              href={`/products?category=${category.value}`}
              className="link-underline label-tracked text-foreground"
            >
              {category.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="font-heading text-xl tracking-wide lg:absolute lg:left-1/2 lg:-translate-x-1/2"
        >
          ATELIER
        </Link>

        <div className="flex items-center gap-4">
          {user?.isAdmin && (
            <Link
              href="/admin"
              className="label-tracked hidden text-muted-foreground hover:text-foreground sm:block"
            >
              Admin
            </Link>
          )}
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-[18px]" />
          </button>
          <Link
            href={user ? "/account" : "/account/login"}
            aria-label={user ? `Account, signed in as ${user.firstName}` : "Sign in"}
            className="hidden items-center gap-1.5 sm:flex"
          >
            {user ? (
              <span className="flex size-[18px] items-center justify-center bg-foreground text-[10px] text-background">
                {user.firstName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <UserIcon className="size-[18px]" />
            )}
          </Link>
          <button
            type="button"
            aria-label={`Open bag, ${itemCount} items`}
            onClick={openCart}
            className="relative"
          >
            <ShoppingBag className="size-[18px]" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center bg-accent text-[10px] text-accent-foreground">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-full gap-0 p-0 sm:max-w-xs">
          <SheetHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
            <SheetTitle className="font-heading text-lg">ATELIER</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col">
            {categories.map((category) => (
              <Link
                key={category.value}
                href={`/products?category=${category.value}`}
                onClick={() => setMenuOpen(false)}
                className="label-tracked border-b border-border px-5 py-4 text-foreground"
              >
                {category.label}
              </Link>
            ))}
            <Link
              href="/products"
              onClick={() => setMenuOpen(false)}
              className="label-tracked px-5 py-4 text-muted-foreground"
            >
              View all
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="top" className="h-auto gap-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Search</SheetTitle>
          </SheetHeader>
          <form
            action={handleSearch}
            className="shell flex items-center gap-4 py-6"
          >
            <Search className="size-[18px] shrink-0 text-muted-foreground" />
            <Input
              name="search"
              autoFocus
              placeholder="Search products…"
              className="h-auto border-none bg-transparent p-0 font-heading text-xl italic shadow-none focus-visible:ring-0"
            />
          </form>
        </SheetContent>
      </Sheet>

      <CartSheet />
    </header>
  );
}
