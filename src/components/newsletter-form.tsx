"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subscribeToNewsletter } from "@/lib/api";

export function NewsletterForm() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");

  function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    setStatus("idle");
    startTransition(async () => {
      try {
        await subscribeToNewsletter(email);
        setStatus("done");
      } catch {
        setStatus("error");
      }
    });
  }

  if (status === "done") {
    return (
      <p className="mt-5 max-w-xs text-sm text-foreground">
        You&apos;re on the list.
      </p>
    );
  }

  return (
    <div className="mt-5 max-w-xs">
      <form action={handleSubmit} className="flex gap-2">
        <Input
          name="email"
          type="email"
          placeholder="Email address"
          aria-label="Email address"
          required
          className="h-10 rounded-none border-border"
        />
        <Button
          type="submit"
          variant="outline"
          className="h-10 shrink-0"
          disabled={isPending}
        >
          {isPending ? "…" : "Join"}
        </Button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-xs text-accent">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
