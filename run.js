import fs from "node:fs";
import { fetchFeed, newVideos } from "./lib/rss.js";
import { postDiscord, postFacebook, postInstagram, postX } from "./lib/platforms.js";

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "UCuz30MY3yH6Geh_kLyLy8jg";
const STATE_FILE = "state.json";
const NETWORKS = [
  ["discord", postDiscord],
  ["facebook", postFacebook],
  ["instagram", postInstagram],
  ["x", postX],
];

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n");
}

const feed = await fetchFeed(CHANNEL_ID);

// Liste des dernières vidéos, lue par l'Atelier de partage (docs/index.html)
fs.writeFileSync(
  "videos.json",
  JSON.stringify(
    feed.map((v) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      published: v.published.toISOString(),
      description: v.description.slice(0, 400),
    })),
    null,
    2,
  ) + "\n",
);

let state = loadState();

if (!state) {
  saveState({ announced: feed.map((v) => v.id) });
  console.log("Premier lancement : les vidéos existantes sont enregistrées, aucune annonce envoyée.");
  process.exit(0);
}

const todo = newVideos(feed, state.announced);
console.log(`${todo.length} nouvelle(s) vidéo(s) à annoncer`);

for (const video of todo) {
  const results = await Promise.allSettled(NETWORKS.map(([, post]) => post(video)));
  results.forEach((r, i) => {
    const name = NETWORKS[i][0];
    if (r.status === "rejected") {
      console.error(`${video.id} ${name} : ERREUR ${r.reason?.message ?? r.reason}`);
      process.exitCode = 1;
    } else {
      console.log(`${video.id} ${name} : ${r.value.ok ? "envoyé" : `ignoré (${r.value.skipped})`}`);
    }
  });
  // On ne marque la vidéo comme annoncée que si au moins un réseau a reçu le message
  if (results.some((r) => r.status === "fulfilled" && r.value?.ok)) {
    state.announced.push(video.id);
  } else {
    console.log(`${video.id} : aucun envoi réussi, nouvel essai au prochain passage`);
  }
}

state.announced = [...new Set(state.announced)].slice(-200);
saveState(state);
