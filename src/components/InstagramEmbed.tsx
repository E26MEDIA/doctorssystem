"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

type Props = {
  url: string;
  title?: string;
};

export function InstagramEmbed({ url, title }: Props) {
  useEffect(() => {
    const existing = document.querySelector(
      'script[src="https://www.instagram.com/embed.js"]',
    ) as HTMLScriptElement | null;

    const process = () => window.instgrm?.Embeds?.process();

    if (existing) {
      process();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = process;
    document.body.appendChild(script);
  }, [url]);

  return (
    <div className="instagram-embed overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-white">
      {title ? (
        <p className="border-b border-[var(--line)] px-4 py-3 text-sm font-medium text-[var(--deep)]">
          {title}
        </p>
      ) : null}
      <blockquote
        className="instagram-media !m-0 !min-w-0 !max-w-full"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ width: "100%" }}
      >
        <a href={url} target="_blank" rel="noreferrer" className="block p-6 text-sm text-[var(--teal)]">
          View on Instagram
        </a>
      </blockquote>
    </div>
  );
}
