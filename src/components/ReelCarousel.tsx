"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { instagramProfile, localReels } from "@/lib/clinic";

type ReelItem = {
  id: string;
  src: string;
  title: string;
  caption: string;
};

function circularOffset(index: number, active: number, length: number) {
  let offset = index - active;
  if (offset > length / 2) offset -= length;
  if (offset < -length / 2) offset += length;
  return offset;
}

export function ReelCarousel() {
  const items = useMemo(() => localReels as ReelItem[], []);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    // Play only the active center reel; pause others
    items.forEach((item, index) => {
      const el = videoRefs.current[item.id];
      if (!el) return;
      if (index === active) {
        el.muted = true;
        el.playsInline = true;
        const playPromise = el.play();
        if (playPromise) playPromise.catch(() => undefined);
      } else {
        el.pause();
        el.currentTime = 0;
      }
    });
  }, [active, items]);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, 8000);
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

        <div className="relative mx-auto h-[min(70vh,620px)] w-full bg-transparent">
          {items.map((item, index) => {
            const offset = circularOffset(index, active, len);
            const abs = Math.abs(offset);
            if (abs > 1) return null;

            const isCenter = offset === 0;
            const scale = isCenter ? 1 : 0.78;
            const x = offset * 210;
            const z = isCenter ? 20 : 8;
            const opacity = isCenter ? 1 : 0.7;

            return (
              <div
                key={item.id}
                className="absolute top-1/2 left-1/2 overflow-hidden rounded-[1.75rem] bg-black shadow-[0_30px_70px_rgba(6,51,44,0.22)] transition-all duration-500 ease-out"
                style={{
                  width: isCenter ? "min(300px, 70vw)" : "min(230px, 48vw)",
                  height: isCenter ? "min(540px, 64vh)" : "min(420px, 52vh)",
                  transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
                  zIndex: z,
                  opacity,
                }}
              >
                <video
                  ref={(el) => {
                    videoRefs.current[item.id] = el;
                  }}
                  src={item.src}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  loop
                  preload={isCenter ? "auto" : "metadata"}
                  onClick={() => {
                    if (!isCenter) setActive(index);
                  }}
                />

                {!isCenter && (
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center bg-black/25"
                    onClick={() => setActive(index)}
                    aria-label={`Play ${item.title}`}
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/40 text-2xl text-white backdrop-blur-sm">
                      ▶
                    </span>
                  </button>
                )}

                {isCenter && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-4 pb-4 pt-16 text-white">
                    <p className="text-sm font-medium leading-snug">
                      {item.title}
                    </p>
                    <a
                      href={instagramProfile}
                      target="_blank"
                      rel="noreferrer"
                      className="pointer-events-auto mt-3 flex w-full items-center justify-center rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white"
                    >
                      View
                    </a>
                  </div>
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
