import { YoutubeEmbed } from "@/components/YoutubeEmbed";
import { youtubeChannel } from "@/lib/clinic";
import { getYoutubeVideos, type YoutubeVideo } from "@/lib/youtube";

function VideoCard({ video }: { video: YoutubeVideo }) {
  return (
    <article>
      <YoutubeEmbed id={video.id} title={video.title} />
      <h3 className="mt-3 text-base font-medium leading-snug text-[var(--deep)]">
        {video.title}
      </h3>
    </article>
  );
}

export async function YoutubeSection() {
  const { featured, latest } = await getYoutubeVideos(8);

  return (
    <section className="section-pad border-t border-[var(--line)] bg-white/55">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
              YouTube
            </p>
            <h2 className="display mt-3 text-4xl md:text-5xl">
              Videos from {youtubeChannel.handle}
            </h2>
            <p className="mt-3 max-w-xl text-[var(--ink-soft)]">
              Patient education from Dr. S S Honnani. New uploads from the
              channel appear here automatically.
            </p>
          </div>
          <a
            href={youtubeChannel.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-[var(--teal)] underline-offset-4 hover:underline"
          >
            Open YouTube channel →
          </a>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {featured.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {latest.length > 0 ? (
          <div className="mt-14">
            <h3 className="display text-2xl text-[var(--deep)]">Latest from the channel</h3>
            <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
