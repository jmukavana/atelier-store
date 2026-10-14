"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthError, login } from "@/lib/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/account";

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await login(
          String(formData.get("email") ?? ""),
          String(formData.get("password") ?? ""),
          formData.get("rememberMe") === "on"
        );
        router.push(returnTo);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof AuthError
            ? err.message
            : "We couldn't sign you in. Please try again."
        );
      }
    });
  }

  return (
    <div className="shell max-w-md py-16 lg:py-24">
      <p className="label-tracked text-muted-foreground">Account</p>
      <h1 className="mt-2 font-heading text-3xl italic">Sign In</h1>

      <form action={handleSubmit} className="mt-8 space-y-5">
        <Input
          name="email"
          type="email"
          placeholder="Email address"
          required
          className="h-11 rounded-none border-border"
        />
        <Input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="h-11 rounded-none border-border"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="rememberMe"
            id="rememberMe"
            defaultChecked
            className="size-4"
          />
          <label
            htmlFor="rememberMe"
            className="text-sm text-muted-foreground"
          >
            Stay signed in
          </label>
        </div>

        {error && <p className="text-sm text-accent">{error}</p>}

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full"
          disabled={isPending}
        >
          {isPending ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">
        New to Atelier?{" "}
        <Link
          href={`/account/register?returnTo=${encodeURIComponent(returnTo)}`}
          className="link-underline text-foreground"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
