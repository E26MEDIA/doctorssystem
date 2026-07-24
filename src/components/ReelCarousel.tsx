"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { instagramProfile, instagramReels } from "@/lib/clinic";

type ReelItem = {
  id: string;
  url: string;
  title: string;
  caption: string;
  poster: string;
};

const FALLBACK_POSTERS = [
  "/images/gallery-2.jpg",
  "/images/gallery-3.jpg",
  "/images/gallery-1.jpg",
  "/images/gallery-4.jpg",
  "/images/gallery-6.jpg",
  "/images/gallery-5.jpg",
  "/images/gallery-7.jpg",
  "/images/gallery-8.jpg",
];

function buildItems(): ReelItem[] {
  return instagramReels.map((reel, i) => ({
    id: reel.id,
    url: reel.url,
    title: reel.title,
    caption: reel.caption,
    poster: reel.poster || FALLBACK_POSTERS[i % FALLBACK_POSTERS.length],
  }));
}

export function ReelCarousel() {
  const items = useMemo(() => buildItems(), []);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  if (items.length === 0) return null;

  const current = items[active];

  function go(delta: number) {
    setActive((prev) => (prev + delta + items.length) % items.length);
  }

  return (
    <div className="reel-carousel">
      <div className="relative mx-auto flex max-w-5xl items-center justify-center gap-2 md:gap-4">
        <button
          type="button"
          aria-label="Previous reel"
          onClick={() => go(-1)}
          className="reel-nav z-20 shrink-0"
        >
          <span aria-hidden>‹</span>
        </button>

        <div className="relative flex h-[min(72vh,640px)] w-full max-w-[920px] items-center justify-center overflow-visible">
          {items.map((item, index) => {
            const offset = index - active;
            const abs = Math.abs(offset);
            if (abs > 2) return null;

            const isCenter = offset === 0;
            const scale = isCenter ? 1 : abs === 1 ? 0.82 : 0.68;
            const x = offset * (abs === 1 ? 210 : abs === 2 ? 340 : 0);
            const z = isCenter ? 30 : 10 - abs * 5;
            const opacity = isCenter ? 1 : abs === 1 ? 0.72 : 0.4;
            const showEmbed = isCenter && !failed[item.id];

            const shellClass =
              "absolute top-1/2 left-1/2 origin-center overflow-hidden rounded-[1.6rem] border border-white/30 bg-[var(--deep)] shadow-[0_28px_60px_rgba(6,51,44,0.28)] transition-all duration-500 ease-out";
            const shellStyle = {
              width: isCenter ? "min(340px, 78vw)" : "min(260px, 58vw)",
              height: isCenter ? "min(600px, 70vh)" : "min(480px, 58vh)",
              transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
              zIndex: z,
              opacity,
              pointerEvents: (abs > 1 ? "none" : "auto") as "none" | "auto",
            };

            if (isCenter) {
              return (
                <div key={item.id} className={shellClass} style={shellStyle}>
                  {showEmbed ? (
                    <iframe
                      title={item.title}
                      src={`https://www.instagram.com/reel/${item.id}/embed`}
                      className="h-full w-full border-0 bg-black"
                      loading="eager"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                      onError={() =>
                        setFailed((prev) => ({ ...prev, [item.id]: true }))
                      }
                    />
                  ) : (
                    <div className="relative h-full w-full">
                      <Image
                        src={item.poster}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="340px"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5 text-left text-white">
                        <p className="text-sm font-medium leading-snug">
                          {item.title}
                        </p>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-medium text-white"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(index)}
                className={shellClass}
                style={shellStyle}
                aria-label={`Show ${item.title}`}
              >
                <div className="relative h-full w-full">
                  <Image
                    src={item.poster}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="260px"
                  />
                  <div className="absolute inset-0 bg-black/25" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-xl text-white backdrop-blur-sm">
                      ▶
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Next reel"
          onClick={() => go(1)}
          className="reel-nav z-20 shrink-0"
        >
          <span aria-hidden>›</span>
        </button>
      </div>

      <div className="mx-auto mt-8 max-w-xl text-center">
        <p className="display text-2xl text-[var(--deep)] md:text-3xl">
          {current.title}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          {current.caption}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Go to ${item.title}`}
              onClick={() => setActive(index)}
              className={`h-2 rounded-full transition-all ${
                index === active
                  ? "w-8 bg-[var(--teal)]"
                  : "w-2 bg-[var(--line)] hover:bg-[var(--teal)]/50"
              }`}
            />
          ))}
        </div>
        <a
          href={instagramProfile}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex text-sm font-medium text-[var(--teal)] underline-offset-4 hover:underline"
        >
          Open Instagram @dr.honnani →
        </a>
      </div>
    </div>
  );
}
