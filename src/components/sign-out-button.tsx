"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await logout();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      className="h-10 px-6"
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? "Signing out…" : "Sign Out"}
    </Button>
  );
}
