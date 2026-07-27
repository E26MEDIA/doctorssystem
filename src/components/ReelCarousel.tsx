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
  const [soundOn, setSoundOn] = useState(false);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    items.forEach((item, index) => {
      const el = videoRefs.current[item.id];
      if (!el) return;

      if (index === active) {
        el.muted = !soundOn;
        el.playsInline = true;
        const playPromise = el.play();
        if (playPromise) playPromise.catch(() => undefined);
      } else {
        el.pause();
        el.muted = true;
        el.currentTime = 0;
      }
    });
  }, [active, items, soundOn]);

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

  function toggleSound() {
    setSoundOn((on) => {
      const next = !on;
      const el = videoRefs.current[current.id];
      if (el) {
        el.muted = !next;
        if (next) {
          el.play().catch(() => undefined);
        }
      }
      return next;
    });
  }

  return (
    <div
      className="reel-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="reel-stage relative mx-auto max-w-4xl px-14 md:px-20">
        <div className="relative mx-auto h-[min(70vh,620px)] w-full">
          <button
            type="button"
            aria-label="Previous reel"
            onClick={() => go(-1)}
            className="reel-nav reel-nav--prev"
          >
            <span aria-hidden>‹</span>
          </button>
          <button
            type="button"
            aria-label="Next reel"
            onClick={() => go(1)}
            className="reel-nav reel-nav--next"
          >
            <span aria-hidden>›</span>
          </button>

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
                  muted={!isCenter || !soundOn}
                  playsInline
                  loop
                  preload={isCenter ? "auto" : "metadata"}
                  onClick={() => {
                    if (!isCenter) {
                      setActive(index);
                      return;
                    }
                    toggleSound();
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
                  <>
                    <button
                      type="button"
                      onClick={toggleSound}
                      aria-label={soundOn ? "Mute reel" : "Unmute reel"}
                      className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
                    >
                      {soundOn ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                          <path d="M18 5a9 9 0 0 1 0 14" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                          <path d="m22 9-6 6M16 9l6 6" />
                        </svg>
                      )}
                    </button>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-4 pb-4 pt-16 text-white">
                      <p className="text-sm font-medium leading-snug">
                        {item.title}
                      </p>
                      {!soundOn && (
                        <p className="mt-1 text-xs text-white/75">
                          Tap video or speaker to turn sound on
                        </p>
                      )}
                      <a
                        href={instagramProfile}
                        target="_blank"
                        rel="noreferrer"
                        className="pointer-events-auto mt-3 flex w-full items-center justify-center rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white"
                      >
                        View
                      </a>
                    </div>
                  </>
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
