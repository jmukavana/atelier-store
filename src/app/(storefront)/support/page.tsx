import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support — Atelier",
};

export default function SupportPage() {
  return (
    <div className="shell max-w-3xl py-16 lg:py-24">
      <p className="label-tracked text-muted-foreground">Support</p>
      <h1 className="mt-2 font-heading text-4xl italic">
        Shipping, Returns &amp; Policies
      </h1>

      <section id="shipping" className="mt-16 scroll-mt-24">
        <h2 className="font-heading text-2xl italic">Shipping &amp; Returns</h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Standard shipping is complimentary on every order and typically
            arrives within 5–7 business days. This is a demo storefront, so
            no order actually ships — see the note on the checkout page.
          </p>
          <p>
            In a live store, returns would be accepted within 30 days of
            delivery, unworn and with tags attached, for a full refund to
            the original payment method.
          </p>
        </div>
      </section>

      <section id="sizing" className="mt-16 scroll-mt-24">
        <h2 className="font-heading text-2xl italic">Size Guide</h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Tailoring and outerwear are sized to EU numbering (44–52);
            knitwear, shirting, and accessories use S–XL or one size. If
            you&apos;re between sizes, we generally recommend sizing up for
            outerwear and true-to-size for knitwear.
          </p>
          <p>
            Full body measurements for each size are listed on the product
            page under &ldquo;Details &amp; Care&rdquo; where relevant.
          </p>
        </div>
      </section>

      <section id="contact" className="mt-16 scroll-mt-24">
        <h2 className="font-heading text-2xl italic">Contact</h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            This is a portfolio/demo project without a real support desk.
            In a production store, this section would list a contact email,
            hours, and possibly live chat.
          </p>
        </div>
      </section>

      <section id="privacy" className="mt-16 scroll-mt-24">
        <h2 className="font-heading text-2xl italic">Privacy</h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            We collect only what&apos;s needed to run the store: your
            account details, order history, and — if you subscribe — your
            email address for the newsletter. We don&apos;t sell customer
            data to third parties.
          </p>
          <p>
            Passwords are stored hashed, never in plain text. See the
            checkout and account pages for what&apos;s actually stored in
            this demo&apos;s database.
          </p>
        </div>
      </section>

      <section id="terms" className="mt-16 scroll-mt-24">
        <h2 className="font-heading text-2xl italic">Terms</h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Atelier is a demonstration e-commerce project. Prices, stock,
            and order confirmations are for illustration only — no
            payment in test mode results in a real charge, and no goods
            are shipped.
          </p>
        </div>
      </section>
    </div>
  );
}
