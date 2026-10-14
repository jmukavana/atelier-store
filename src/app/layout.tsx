import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  weight: "variable",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atelier — Considered essentials",
  description:
    "Atelier is a small-batch clothing and accessories house. Considered pieces, precise construction, made to last.",
};

/**
 * Deliberately minimal — this wraps BOTH the storefront and the admin
 * section, and the two have completely different chrome (cart/header/
 * footer vs. an admin sidebar). Storefront-specific providers/layout live
 * in `(storefront)/layout.tsx`; admin's own in `admin/layout.tsx`.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
