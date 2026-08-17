import { youtubeChannel } from "@/lib/clinic";

export type YoutubeVideo = {
  id: string;
  title: string;
  publishedAt?: string;
};

const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${youtubeChannel.channelId}`;

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseFeed(xml: string): YoutubeVideo[] {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
  const videos: YoutubeVideo[] = [];

  for (const match of entries) {
    const entry = match[1];
    const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!id || !title) continue;
    videos.push({
      id,
      title: decodeXml(title),
      publishedAt,
    });
  }

  return videos;
}

export async function getYoutubeVideos(limit = 8): Promise<{
  featured: YoutubeVideo[];
  latest: YoutubeVideo[];
}> {
  const featured: YoutubeVideo[] = youtubeChannel.featured.map((video) => ({
    id: video.id,
    title: video.title,
  }));
  const featuredIds = new Set(featured.map((video) => video.id));

  try {
    const response = await fetch(RSS_URL, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/atom+xml,application/xml,text/xml" },
    });
    if (!response.ok) {
      return { featured, latest: [] };
    }

    const latest = parseFeed(await response.text())
      .filter((video) => !featuredIds.has(video.id))
      .slice(0, Math.max(0, limit - featured.length));

    return { featured, latest };
  } catch {
    return { featured, latest: [] };
  }
}
