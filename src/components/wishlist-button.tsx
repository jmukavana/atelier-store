"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { addToWishlist, ApiError, removeFromWishlist } from "@/lib/api";
import { cn } from "@/lib/utils";

export function WishlistButton({
  slug,
  initiallyWishlisted,
  className,
}: {
  slug: string;
  initiallyWishlisted: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [wishlisted, setWishlisted] = useState(initiallyWishlisted);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !wishlisted;
    setWishlisted(next); // optimistic — feels instant on a heart icon
    startTransition(async () => {
      try {
        await (next ? addToWishlist(slug) : removeFromWishlist(slug));
        router.refresh(); // re-syncs any server-rendered wishlist state
      } catch (err) {
        setWishlisted(!next); // roll back
        if (err instanceof ApiError && err.status === 401) {
          router.push(`/account/login?returnTo=${encodeURIComponent(pathname)}`);
        }
      }
    });
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault(); // in case this sits inside a product-card Link
        toggle();
      }}
      aria-pressed={wishlisted}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "flex size-8 items-center justify-center bg-background/90 text-foreground transition-colors hover:text-accent",
        className
      )}
    >
      <Heart
        className="size-4"
        fill={wishlisted ? "currentColor" : "none"}
        strokeWidth={1.5}
      />
    </button>
  );
}
