"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAdminProduct } from "@/lib/admin";

export function DeleteProductButton({
  id,
  name,
  onDeleted,
}: {
  id: string;
  name: string;
  /** If provided (edit page), called instead of just refreshing in place. */
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    startTransition(async () => {
      await deleteAdminProduct(id);
      if (onDeleted) {
        onDeleted();
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="label-tracked text-muted-foreground hover:text-accent disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
