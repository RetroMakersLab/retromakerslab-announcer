import crypto from "node:crypto";
import { longMessage, xMessage, instagramCaption } from "./messages.js";

export async function postDiscord(video) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return { skipped: "DISCORD_WEBHOOK_URL manquante" };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: longMessage(video) }),
  });
  if (!res.ok) throw new Error(`Discord ${res.status}: ${await res.text()}`);
  return { ok: true };
}

export async function postFacebook(video) {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) return { skipped: "FB_PAGE_ID ou FB_PAGE_ACCESS_TOKEN manquant" };
  const body = new URLSearchParams({
    message: longMessage(video),
    link: video.url,
    access_token: token,
  });
  const res = await fetch(`https://graph.facebook.com/${pageId}/feed`, { method: "POST", body });
  if (!res.ok) throw new Error(`Facebook ${res.status}: ${await res.text()}`);
  return { ok: true };
}

async function thumbnailUrl(videoId) {
  const best = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const head = await fetch(best, { method: "HEAD" }).catch(() => null);
  return head?.ok ? best : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export async function postInstagram(video) {
  const igUserId = process.env.IG_USER_ID;
  const token = process.env.IG_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN;
  if (!igUserId || !token) return { skipped: "IG_USER_ID ou jeton d'accès manquant" };

  const create = await fetch(`https://graph.facebook.com/${igUserId}/media`, {
    method: "POST",
    body: new URLSearchParams({
      image_url: await thumbnailUrl(video.id),
      caption: instagramCaption(video),
      access_token: token,
    }),
  });
  if (!create.ok) throw new Error(`Instagram (création) ${create.status}: ${await create.text()}`);
  const { id: creationId } = await create.json();

  const publish = await fetch(`https://graph.facebook.com/${igUserId}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: creationId, access_token: token }),
  });
  if (!publish.ok) throw new Error(`Instagram (publication) ${publish.status}: ${await publish.text()}`);
  return { ok: true };
}

const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export function xAuthHeader(method, url, creds, nonce = crypto.randomBytes(16).toString("hex"), timestamp = String(Math.floor(Date.now() / 1000))) {
  const oauth = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };
  const paramString = Object.keys(oauth)
    .sort()
    .map((k) => `${enc(k)}=${enc(oauth[k])}`)
    .join("&");
  const base = [method.toUpperCase(), enc(url), enc(paramString)].join("&");
  const key = `${enc(creds.apiSecret)}&${enc(creds.accessSecret)}`;
  oauth.oauth_signature = crypto.createHmac("sha1", key).update(base).digest("base64");
  return "OAuth " + Object.keys(oauth).sort().map((k) => `${enc(k)}="${enc(oauth[k])}"`).join(", ");
}

export async function postX(video) {
  const creds = {
    apiKey: process.env.X_API_KEY,
    apiSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  };
  if (Object.values(creds).some((v) => !v)) return { skipped: "clés X manquantes" };
  const url = "https://api.x.com/2/tweets";
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: xAuthHeader("POST", url, creds), "Content-Type": "application/json" },
    body: JSON.stringify({ text: xMessage(video) }),
  });
  if (!res.ok) throw new Error(`X ${res.status}: ${await res.text()}`);
  return { ok: true };
}
