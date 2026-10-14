"use client";

import { Button } from "@/components/ui/button";

export default function ProductsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell flex flex-col items-center gap-4 py-32 text-center">
      <p className="label-tracked text-muted-foreground">Something went wrong</p>
      <h1 className="font-heading text-3xl italic">
        We couldn&apos;t load this page.
      </h1>
      <Button variant="outline" className="mt-2 h-11 px-7" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
