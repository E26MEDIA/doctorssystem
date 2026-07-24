import Image from "next/image";
import Link from "next/link";
import { InstagramEmbed } from "@/components/InstagramEmbed";
import { Reveal } from "@/components/Reveal";
import {
  galleryPhotos,
  instagramProfile,
  instagramReels,
} from "@/lib/clinic";

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
      <div
        className={`grid gap-3 ${
          compact
            ? "grid-cols-2 md:grid-cols-3"
            : "grid-cols-2 md:grid-cols-4"
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

      {showReels && (
        <div className="mt-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
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

          <div className="grid gap-8 lg:grid-cols-2">
            {instagramReels.map((reel) => (
              <Reveal key={reel.id}>
                <div>
                  <InstagramEmbed url={reel.url} title={reel.title} />
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
                    {reel.caption}
                  </p>
                </div>
              </Reveal>
            ))}

            <Reveal delay={80}>
              <a
                href={instagramProfile}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[420px] flex-col justify-between rounded-[1.25rem] border border-[var(--line)] bg-[var(--deep)] p-8 text-white transition hover:bg-[var(--deep-mid)]"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal-bright)]">
                    Follow
                  </p>
                  <h4 className="display mt-3 text-4xl">@dr.honnani</h4>
                  <p className="mt-4 max-w-sm text-white/75">
                    New reels on endoscopy, laparoscopy, hernia care, and
                    patient education — updated by the doctor.
                  </p>
                </div>
                <span className="text-sm font-medium text-[var(--teal-bright)]">
                  Watch more reels on Instagram →
                </span>
              </a>
            </Reveal>
          </div>
        </div>
      )}

      {compact && (
        <div className="mt-8 text-center">
          <Link href="/gallery" className="btn-ghost">
            Open full gallery
          </Link>
        </div>
      )}
    </div>
  );
}
