import type { Metadata } from "next";
import { GallerySection } from "@/components/GallerySection";
import { Reveal } from "@/components/Reveal";
import { instagramProfile } from "@/lib/clinic";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photos and Instagram reels from Dr. Sharath S. Honnani’s surgical practice.",
};

export default function GalleryPage() {
  return (
    <div className="pt-28">
      <section className="mx-auto max-w-6xl px-5 pb-10 md:px-8">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
            Gallery
          </p>
          <h1 className="display mt-3 max-w-3xl text-5xl md:text-6xl">
            Photos & Instagram reels
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--ink-soft)]">
            Practice moments and clinical reels from{" "}
            <a
              href={instagramProfile}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--teal)] underline-offset-4 hover:underline"
            >
              @dr.honnani
            </a>
            . More reels can be added anytime.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <GallerySection />
      </section>
    </div>
  );
}
