export function longMessage(video) {
  return `Nouvelle vidéo sur RetroMakersLab : ${video.title}\n\n${video.url}\n\nAbonne-toi, c'est gratuit et ça aide la chaîne !`;
}

// Instagram n'active pas les liens dans les légendes
export function instagramCaption(video) {
  return `Nouvelle vidéo sur RetroMakersLab : ${video.title}\n\nLien dans la bio ou sur la chaîne : https://www.youtube.com/@RetroMakersLab\n\nAbonne-toi, c'est gratuit et ça aide la chaîne !\n\n#RetroMakersLab`;
}

// X compte chaque lien pour 23 caractères
export function xMessage(video) {
  const tail = `\n${video.url}\n#RetroMakersLab`;
  const head = "Nouvelle vidéo RetroMakersLab : ";
  const room = 280 - head.length - (1 + 23 + 1 + "#RetroMakersLab".length);
  const title = video.title.length > room ? `${video.title.slice(0, room - 1)}…` : video.title;
  return `${head}${title}${tail}`;
}
