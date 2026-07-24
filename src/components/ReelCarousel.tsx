"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
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

/** Shortest signed distance on a circular list */
function circularOffset(index: number, active: number, length: number) {
  let offset = index - active;
  if (offset > length / 2) offset -= length;
  if (offset < -length / 2) offset += length;
  return offset;
}

export function ReelCarousel() {
  const items = useMemo(() => buildItems(), []);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  if (items.length === 0) return null;

  const current = items[active];
  const len = items.length;

  function go(delta: number) {
    setActive((prev) => (prev + delta + len) % len);
  }

  return (
    <div
      className="reel-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="relative mx-auto flex max-w-5xl items-center justify-center gap-3 md:gap-5">
        <button
          type="button"
          aria-label="Previous reel"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            go(-1);
          }}
          className="reel-nav relative z-50 shrink-0"
        >
          <span aria-hidden>‹</span>
        </button>

        <div className="relative z-10 flex h-[min(72vh,640px)] w-full max-w-[860px] items-center justify-center overflow-visible">
          {items.map((item, index) => {
            const offset = circularOffset(index, active, len);
            const abs = Math.abs(offset);
            if (abs > 2) return null;

            const isCenter = offset === 0;
            const scale = isCenter ? 1 : abs === 1 ? 0.78 : 0.62;
            const x =
              offset === 0
                ? 0
                : offset * (abs === 1 ? 195 : 320);
            const z = isCenter ? 20 : 10 - abs;
            const opacity = isCenter ? 1 : abs === 1 ? 0.78 : 0.42;

            const shellClass =
              "absolute top-1/2 left-1/2 origin-center overflow-hidden rounded-[1.6rem] border border-white/30 bg-[var(--deep)] shadow-[0_28px_60px_rgba(6,51,44,0.28)] transition-all duration-500 ease-out";
            const shellStyle: CSSProperties = {
              width: isCenter ? "min(320px, 72vw)" : "min(240px, 52vw)",
              height: isCenter ? "min(560px, 66vh)" : "min(440px, 54vh)",
              transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
              zIndex: z,
              opacity,
              pointerEvents: abs > 1 ? "none" : "auto",
            };

            if (isCenter) {
              return (
                <div key={item.id} className={shellClass} style={shellStyle}>
                  <iframe
                    title={item.title}
                    src={`https://www.instagram.com/reel/${item.id}/embed`}
                    className="pointer-events-auto h-full w-full border-0 bg-black"
                    loading="eager"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                  />
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
                    sizes="240px"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-xl text-white backdrop-blur-sm">
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            go(1);
          }}
          className="reel-nav relative z-50 shrink-0"
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
