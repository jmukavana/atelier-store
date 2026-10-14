import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Atelier",
};

export default function AboutPage() {
  return (
    <div className="shell max-w-3xl py-16 lg:py-24">
      <section>
        <p className="label-tracked text-muted-foreground">About</p>
        <h1 className="mt-2 font-heading text-4xl italic">Our Story</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Atelier began as a single workroom producing a handful of coats
            each season. The scale has changed since, but the premise
            hasn&apos;t: fewer pieces, made properly, meant to outlast the
            trend cycle they were bought into.
          </p>
          <p>
            We work in small runs with a short list of mills and workshops
            across Portugal, Italy, and Scotland, most of whom we&apos;ve
            worked with for years. That continuity is deliberate — it&apos;s
            how quality stays consistent from one season to the next.
          </p>
        </div>
      </section>

      <section id="materials" className="mt-16 scroll-mt-24">
        <h2 className="font-heading text-2xl italic">Materials</h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Every fabric and leather is chosen first for how it wears, not
            just how it looks on the day it&apos;s bought. Virgin wools are
            milled in Biella, cotton twills woven in Portugal, and our
            knitwear comes from a single Scottish mill spinning merino,
            lambswool, and cashmere blends.
          </p>
          <p>
            We publish the composition and origin of every piece on its
            product page — see &ldquo;Details &amp; Care&rdquo; — rather
            than in a separate sustainability report no one reads.
          </p>
        </div>
      </section>

      <section id="sustainability" className="mt-16 scroll-mt-24">
        <h2 className="font-heading text-2xl italic">Sustainability</h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            The most sustainable garment is the one you don&apos;t replace.
            We design for repair rather than disposal, and design out
            trend-dependent details that age a piece faster than the fabric
            actually wears out.
          </p>
          <p>
            We keep runs small and considered rather than producing to a
            forecast, which means less overproduction and fewer pieces
            discounted into landfill at the end of a season.
          </p>
        </div>
      </section>
    </div>
  );
}
