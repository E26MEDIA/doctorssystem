"use client";

import { useEffect, useMemo, useState } from "react";
import { instagramProfile, instagramReels } from "@/lib/clinic";

type ReelItem = {
  id: string;
  url: string;
  title: string;
  caption: string;
};

function buildItems(): ReelItem[] {
  return instagramReels.map((reel) => ({
    id: reel.id,
    url: reel.url,
    title: reel.title,
    caption: reel.caption,
  }));
}

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
    }, 7000);
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
    >
      <div className="relative mx-auto max-w-4xl px-12 md:px-16">
        {/* Arrows outside the stage so the iframe never blocks them */}
        <button
          type="button"
          aria-label="Previous reel"
          onClick={() => go(-1)}
          className="reel-nav absolute top-1/2 left-0 z-[100] -translate-y-1/2"
        >
          <span aria-hidden>‹</span>
        </button>
        <button
          type="button"
          aria-label="Next reel"
          onClick={() => go(1)}
          className="reel-nav absolute top-1/2 right-0 z-[100] -translate-y-1/2"
        >
          <span aria-hidden>›</span>
        </button>

        <div className="relative mx-auto h-[min(70vh,620px)] w-full overflow-visible">
          {items.map((item, index) => {
            const offset = circularOffset(index, active, len);
            const abs = Math.abs(offset);
            if (abs > 1) return null; // only center + one each side (Kalki-like)

            const isCenter = offset === 0;
            const scale = isCenter ? 1 : 0.78;
            const x = offset * 210;
            const z = isCenter ? 20 : 8;
            const opacity = isCenter ? 1 : 0.55;

            return (
              <div
                key={item.id}
                className="absolute top-1/2 left-1/2 overflow-hidden rounded-[1.75rem] bg-[#0b1220] shadow-[0_30px_70px_rgba(6,51,44,0.22)] transition-all duration-500 ease-out"
                style={{
                  width: isCenter ? "min(300px, 70vw)" : "min(230px, 48vw)",
                  height: isCenter ? "min(540px, 64vh)" : "min(420px, 52vh)",
                  transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
                  zIndex: z,
                  opacity,
                }}
              >
                {isCenter ? (
                  <div className="reel-crop relative h-full w-full">
                    <iframe
                      key={item.id}
                      title={item.title}
                      src={`https://www.instagram.com/reel/${item.id}/embed`}
                      className="reel-crop-iframe"
                      loading="eager"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-4 pb-4 pt-16 text-white">
                      <p className="text-sm font-medium leading-snug line-clamp-2">
                        {item.title}
                      </p>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="pointer-events-auto mt-3 flex w-full items-center justify-center rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="relative flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(160deg,#06332c_0%,#0a4a40_55%,#10241f_100%)] text-white"
                    onClick={() => setActive(index)}
                    aria-label={`Show ${item.title}`}
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10 text-2xl backdrop-blur-sm">
                      ▶
                    </span>
                    <span className="mt-4 max-w-[80%] text-center text-xs uppercase tracking-[0.18em] text-white/70">
                      Reel {index + 1}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
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
