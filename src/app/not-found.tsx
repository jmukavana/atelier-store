import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="shell flex flex-col items-center gap-4 py-32 text-center">
      <p className="label-tracked text-muted-foreground">404</p>
      <h1 className="font-heading text-3xl italic">Page not found.</h1>
      <Button variant="outline" className="mt-2 h-11 px-7" asChild>
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  );
}
