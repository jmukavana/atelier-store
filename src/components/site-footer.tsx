import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { categories } from "@/lib/products";

const columns = [
  {
    heading: "Shop",
    links: categories.map((category) => ({
      label: category.label,
      href: `/products?category=${category.value}`,
    })),
  },
  {
    heading: "About",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Materials", href: "/about#materials" },
      { label: "Sustainability", href: "/about#sustainability" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Shipping & Returns", href: "/support#shipping" },
      { label: "Size Guide", href: "/support#sizing" },
      { label: "Contact", href: "/support#contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="shell grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="font-heading text-xl">ATELIER</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Small-batch essentials, cut for permanence rather than a season.
            Join the list for early access to new releases.
          </p>
          <NewsletterForm />
        </div>

        {columns.map((column) => (
          <div key={column.heading}>
            <p className="label-tracked text-muted-foreground">
              {column.heading}
            </p>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="link-underline text-sm text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="shell flex flex-col gap-2 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Atelier. All rights reserved.</p>
        <div className="flex gap-5">
          <Link href="/support#privacy" className="link-underline">
            Privacy
          </Link>
          <Link href="/support#terms" className="link-underline">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
