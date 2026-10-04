const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'" };

function decode(text) {
  return text.replace(/&(amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m] ?? m);
}

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? decode(m[1].trim()) : "";
}

export function parseFeed(xml) {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  return entries.map((block) => {
    const id = pick(block, "yt:videoId");
    return {
      id,
      title: pick(block, "title"),
      published: new Date(pick(block, "published")),
      url: `https://www.youtube.com/watch?v=${id}`,
    };
  });
}

// Vidéos pas encore annoncées et publiées depuis moins de maxAgeHours (sécurité contre les vieilles vidéos)
export function newVideos(videos, announced, now = new Date(), maxAgeHours = 72) {
  const limit = now.getTime() - maxAgeHours * 3600 * 1000;
  const done = new Set(announced);
  return videos
    .filter((v) => v.id && !done.has(v.id) && !Number.isNaN(v.published.getTime()))
    .filter((v) => v.published.getTime() > limit && v.published.getTime() <= now.getTime())
    .sort((a, b) => a.published - b.published);
}

export async function fetchFeed(channelId) {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  if (!res.ok) throw new Error(`Flux YouTube indisponible (${res.status})`);
  return parseFeed(await res.text());
}
