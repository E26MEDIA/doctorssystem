import Image from "next/image";
import Link from "next/link";
import { ReelCarousel } from "@/components/ReelCarousel";
import { Reveal } from "@/components/Reveal";
import { galleryPhotos, instagramProfile, localReels } from "@/lib/clinic";

type Props = {
  limitPhotos?: number;
  showReels?: boolean;
  compact?: boolean;
};

export function GallerySection({
  limitPhotos,
  showReels = true,
  compact = false,
}: Props) {
  const photos = limitPhotos
    ? galleryPhotos.slice(0, limitPhotos)
    : galleryPhotos;

  return (
    <div>
      {/* Photos first */}
      <div>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
            Photos
          </p>
          <h3 className="display mt-2 text-3xl md:text-4xl">Practice gallery</h3>
        </div>
        <div
          className={`grid gap-3 ${
            compact ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4"
          }`}
        >
          {photos.map((photo, i) => (
            <Reveal key={photo.src} delay={i * 40}>
              <figure
                className={`group relative overflow-hidden rounded-[1.1rem] ${
                  i % 5 === 0 ? "md:row-span-2 aspect-[3/4]" : "aspect-square"
                }`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 pb-3 pt-10 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  {photo.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        {compact && (
          <div className="mt-8 text-center">
            <Link href="/gallery" className="btn-ghost">
              Open full gallery
            </Link>
          </div>
        )}
      </div>

      {/* Reels after photos */}
      {showReels && (
        <div className="mt-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
                Instagram reels
              </p>
              <h3 className="display mt-2 text-3xl md:text-4xl">
                Clinical moments from @dr.honnani
              </h3>
            </div>
            <a
              href={instagramProfile}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-[var(--teal)] underline-offset-4 hover:underline"
            >
              Open Instagram →
            </a>
          </div>

          {localReels.length > 0 ? (
            <ReelCarousel />
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white/70 px-6 py-14 text-center">
              <p className="display text-2xl text-[var(--deep)]">
                Reel videos coming next
              </p>
              <p className="mx-auto mt-3 max-w-md text-[var(--ink-soft)]">
                Upload reel videos to show them in the coverflow slider.
              </p>
              <a
                href={instagramProfile}
                target="_blank"
                rel="noreferrer"
                className="btn-primary mt-6"
              >
                Visit @dr.honnani
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
