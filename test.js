import assert from "node:assert/strict";
import { parseFeed, newVideos } from "./lib/rss.js";
import { longMessage, xMessage, instagramCaption } from "./lib/messages.js";
import { xAuthHeader } from "./lib/platforms.js";

const xml = `<feed>
<entry><yt:videoId>AAA111</yt:videoId><title>La Radio CIBI &amp; l'antenne</title><published>2026-10-05T15:30:00+00:00</published></entry>
<entry><yt:videoId>BBB222</yt:videoId><title>Ancienne vidéo</title><published>2026-09-01T15:30:00+00:00</published></entry>
</feed>`;

const videos = parseFeed(xml);
assert.equal(videos.length, 2);
assert.equal(videos[0].title, "La Radio CIBI & l'antenne");
assert.equal(videos[0].url, "https://www.youtube.com/watch?v=AAA111");

const now = new Date("2026-10-05T15:40:00Z");
assert.deepEqual(newVideos(videos, [], now).map((v) => v.id), ["AAA111"]);
assert.equal(newVideos(videos, ["AAA111"], now).length, 0, "une vidéo déjà annoncée ne doit pas repartir");
assert.equal(newVideos(videos, [], now, 0.1).length, 0, "trop ancienne pour être annoncée");

const long = { title: "x".repeat(400), url: videos[0].url };
assert.ok(xMessage(long).length - videos[0].url.length + 23 <= 280, "tweet trop long");
assert.ok(longMessage(videos[0]).includes("https://www.youtube.com/watch?v=AAA111"));

assert.ok(instagramCaption(videos[0]).includes("@RetroMakersLab"));
assert.ok(instagramCaption(videos[0]).length < 2200, "légende Instagram trop longue");

const header = xAuthHeader("POST", "https://api.x.com/2/tweets",
  { apiKey: "k", apiSecret: "s", accessToken: "t", accessSecret: "ts" }, "nonce", "1700000000");
assert.match(header, /^OAuth /);
assert.match(header, /oauth_signature="/);

console.log("Tous les tests passent");
